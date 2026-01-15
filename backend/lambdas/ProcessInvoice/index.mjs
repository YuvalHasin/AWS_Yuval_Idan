import { TextractClient, AnalyzeExpenseCommand } from "@aws-sdk/client-textract";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// Initialize AWS clients
const textractClient = new TextractClient({ region: "us-east-1" });
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = "ScanBookInvoices";

/**
 * Lambda Handler: Process Invoice with Textract
 * 
 * Triggered by S3 upload event
 * 1. Receives S3 bucket/key from event
 * 2. Calls Textract to analyze the PDF
 * 3. Extracts date and amount
 * 4. Updates DynamoDB with extracted data
 */
export const handler = async (event) => {
  console.log("📥 S3 Event received:", JSON.stringify(event, null, 2));

  try {
    // Extract S3 details from event
    const s3Record = event.Records[0].s3;
    const bucketName = s3Record.bucket.name;
    const objectKey = decodeURIComponent(s3Record.object.key.replace(/\+/g, ' '));
    
    console.log(`📄 Processing file: s3://${bucketName}/${objectKey}`);
    
    // Extract invoiceId and userId from S3 key (format: userId/invoiceId_filename.pdf)
    const pathParts = objectKey.split('/');
    const userId = pathParts[0];
    const filenamePart = pathParts[1]; // "invoiceId_filename.pdf"
    const invoiceId = filenamePart.split('_')[0];
    
    console.log(`🔍 Extracted: userId=${userId}, invoiceId=${invoiceId}`);
    
    // Call AWS Textract to analyze the invoice
    console.log("🔬 Calling AWS Textract...");
    const textractResult = await analyzeInvoice(bucketName, objectKey);
    
    console.log("✅ Textract analysis complete:", textractResult);
    
    // Update DynamoDB with extracted data
    await updateInvoiceInDynamoDB(userId, invoiceId, textractResult);
    
    console.log(`✅ Successfully processed invoice ${invoiceId}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Invoice processed successfully",
        invoiceId,
        extractedData: textractResult
      })
    };
    
  } catch (error) {
    console.error("❌ Error processing invoice:", error);
    
    // TODO: Update DynamoDB with error status
    // await updateInvoiceStatus(invoiceId, "FAILED", error.message);
    
    throw error;
  }
};

/**
 * Analyze invoice using AWS Textract
 * @param {string} bucketName - S3 bucket name
 * @param {string} objectKey - S3 object key
 * @returns {Object} Extracted invoice data (amount, date, currency)
 */
async function analyzeInvoice(bucketName, objectKey) {
  const command = new AnalyzeExpenseCommand({
    Document: {
      S3Object: {
        Bucket: bucketName,
        Name: objectKey
      }
    }
  });
  
  const response = await textractClient.send(command);
  
  console.log("📊 Textract raw response:", JSON.stringify(response, null, 2));
  
  // Extract data from Textract response
  const extractedData = {
    amount: 0,
    date: "Not found",
    currency: "ILS"
  };
  
  // Textract returns expense documents with summary fields
  if (response.ExpenseDocuments && response.ExpenseDocuments.length > 0) {
    const expenseDoc = response.ExpenseDocuments[0];
    
    // Extract summary fields (TOTAL, INVOICE_RECEIPT_DATE, etc.)
    if (expenseDoc.SummaryFields) {
      for (const field of expenseDoc.SummaryFields) {
        const fieldType = field.Type?.Text;
        const fieldValue = field.ValueDetection?.Text;
        
        console.log(`📝 Field: ${fieldType} = ${fieldValue}`);
        
        // Extract total amount
        if (fieldType === "TOTAL" || fieldType === "AMOUNT_PAID") {
          const cleanValue = fieldValue?.replace(/[^\d.]/g, ''); // Remove currency symbols
          extractedData.amount = parseFloat(cleanValue) || 0;
        }
        
        //  Extract and format invoice date correctly
        if (fieldType === "INVOICE_RECEIPT_DATE") {
          extractedData.date = formatDateForDynamoDB(fieldValue);
        }
        
        // Extract currency 
        if (fieldType === "TOTAL" && fieldValue) {
          if (fieldValue.includes('$')) extractedData.currency = "USD";
          else if (fieldValue.includes('€')) extractedData.currency = "EUR";
          else if (fieldValue.includes('₪')) extractedData.currency = "ILS";
        }
      }
    }
  }
  
  console.log("✅ Extracted data:", extractedData);
  
  return extractedData;
}

/**
 * Update invoice in DynamoDB with extracted data
 * @param {string} userId - User ID
 * @param {string} invoiceId - Invoice ID
 * @param {Object} extractedData - Data from Textract
 */
async function updateInvoiceInDynamoDB(userId, invoiceId, extractedData) {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      invoiceId: invoiceId
    },
    UpdateExpression: "SET #status = :status, amount = :amount, #date = :date, currency = :currency, processedTime = :processedTime",
    ExpressionAttributeNames: {
      "#status": "status",
      "#date": "date"
    },
    ExpressionAttributeValues: {
      ":status": "COMPLETED",
      ":amount": extractedData.amount,
      ":date": extractedData.date,
      ":currency": extractedData.currency,
      ":processedTime": new Date().toISOString()
    },
    ReturnValues: "ALL_NEW"
  });
  
  const result = await docClient.send(command);
  console.log("💾 DynamoDB update result:", result.Attributes);
  
  return result.Attributes;
}

// ✅ NEW: Add this helper function at the end of the file (before the last closing brace)
/**
 * Format date from Textract to DD/MM/YYYY format expected by GetFinancialReports
 * Handles formats like: "Dec 18, 2025", "18-12-2025", "2025-12-18"
 */
function formatDateForDynamoDB(dateString) {
  if (!dateString || dateString === "Not found") {
    return "Not found";
  }
  
  try {
    // Try to parse the date
    const parsedDate = new Date(dateString);
    
    // Check if valid date
    if (isNaN(parsedDate.getTime())) {
      console.warn(`⚠️ Could not parse date: ${dateString}`);
      return "Not found";
    }
    
    // Format as DD/MM/YYYY (expected by GetFinancialReports)
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = parsedDate.getFullYear();
    
    const formatted = `${day}/${month}/${year}`;
    console.log(`📅 Date formatted: "${dateString}" → "${formatted}"`);
    
    return formatted;
    
  } catch (error) {
    console.error(`❌ Error formatting date "${dateString}":`, error);
    return "Not found";
  }
}