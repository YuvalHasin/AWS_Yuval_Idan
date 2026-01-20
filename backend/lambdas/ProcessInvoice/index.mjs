import { TextractClient, AnalyzeExpenseCommand } from "@aws-sdk/client-textract";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// ✅ UPDATED: Load environment variables (NO FALLBACKS)
const AWS_REGION = process.env.AWS_REGION;
const TABLE_NAME = process.env.TABLE_NAME;

// ✅ ADDED: Validate required environment variables
const requiredEnvVars = ['AWS_REGION', 'TABLE_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `❌ Missing required environment variables: ${missingVars.join(', ')}. ` +
    `Please configure them in AWS Lambda Console → Configuration → Environment variables.`
  );
}

// ✅ UPDATED: Use AWS_REGION from environment
const textractClient = new TextractClient({ region: AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

console.log(`🔧 ProcessInvoice Lambda initialized:`);
console.log(`  - Region: ${AWS_REGION}`);
console.log(`  - Table: ${TABLE_NAME}`);

/**
 * Lambda Handler: Process Invoice with Textract
 * 
 * Triggered automatically by S3 upload event (configured in S3 bucket)
 * 
 * Flow:
 * 1. Receives S3 bucket/key from event
 * 2. Extracts userId and invoiceId from S3 key path
 * 3. Calls AWS Textract AnalyzeExpense API
 * 4. Extracts: amount, date, vendor name, currency
 * 5. Formats date to DD/MM/YYYY (for ClientDashboard filtering)
 * 6. Updates DynamoDB record with status "COMPLETED"
 */
export const handler = async (event) => {
  console.log("📥 S3 Event received:", JSON.stringify(event, null, 2));

  try {
    // ✅ Extract S3 details from event
    const s3Record = event.Records[0].s3;
    const bucketName = s3Record.bucket.name;
    const objectKey = decodeURIComponent(s3Record.object.key.replace(/\+/g, ' '));
    
    console.log(`📄 Processing file: s3://${bucketName}/${objectKey}`);
    
    // ✅ Extract invoiceId and userId from S3 key
    // Format: userId/invoiceId_filename.pdf
    const pathParts = objectKey.split('/');
    
    if (pathParts.length < 2) {
      throw new Error(`Invalid S3 key format: ${objectKey}. Expected: userId/invoiceId_filename.pdf`);
    }
    
    const userId = pathParts[0];
    const filenamePart = pathParts[1]; // "invoiceId_filename.pdf"
    const invoiceId = filenamePart.split('_')[0];
    
    console.log(`🔍 Extracted metadata:`);
    console.log(`  - User ID: ${userId}`);
    console.log(`  - Invoice ID: ${invoiceId}`);
    console.log(`  - Original filename: ${filenamePart}`);
    
    // ✅ Call AWS Textract to analyze the invoice
    console.log("🔬 Calling AWS Textract AnalyzeExpense...");
    const textractResult = await analyzeInvoice(bucketName, objectKey);
    
    console.log("✅ Textract analysis complete:", JSON.stringify(textractResult, null, 2));
    
    // ✅ Update DynamoDB with extracted data
    await updateInvoiceInDynamoDB(userId, invoiceId, textractResult);
    
    console.log(`✅ Successfully processed invoice ${invoiceId}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Invoice processed successfully",
        invoiceId,
        userId,
        extractedData: textractResult
      })
    };
    
  } catch (error) {
    console.error("❌ Error processing invoice:", error);
    console.error("❌ Error stack:", error.stack);
    
    // ✅ IMPROVED: Try to update DynamoDB with error status
    try {
      const pathParts = event.Records[0].s3.object.key.split('/');
      const userId = pathParts[0];
      const invoiceId = pathParts[1]?.split('_')[0];
      
      if (userId && invoiceId) {
        await updateInvoiceStatus(userId, invoiceId, "FAILED", error.message);
        console.log(`⚠️ Updated invoice ${invoiceId} status to FAILED`);
      }
    } catch (updateError) {
      console.error("❌ Failed to update error status in DynamoDB:", updateError);
    }
    
    throw error; // Re-throw to trigger Lambda failure
  }
};

/**
 * Analyze invoice using AWS Textract AnalyzeExpense API
 * 
 * @param {string} bucketName - S3 bucket name
 * @param {string} objectKey - S3 object key
 * @returns {Object} Extracted invoice data
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
  
  console.log("📊 Textract raw response fields count:", 
    response.ExpenseDocuments?.[0]?.SummaryFields?.length || 0
  );
  
  // ✅ Initialize extracted data with defaults
  const extractedData = {
    amount: 0,
    date: "Not found",
    vendorName: "Not found", // ✅ ADDED
    currency: "ILS"
  };
  
  // ✅ Extract data from Textract response
  if (response.ExpenseDocuments && response.ExpenseDocuments.length > 0) {
    const expenseDoc = response.ExpenseDocuments[0];
    
    // ✅ Extract summary fields (TOTAL, INVOICE_RECEIPT_DATE, VENDOR_NAME, etc.)
    if (expenseDoc.SummaryFields) {
      for (const field of expenseDoc.SummaryFields) {
        const fieldType = field.Type?.Text;
        const fieldValue = field.ValueDetection?.Text;
        
        console.log(`📝 Field detected: ${fieldType} = ${fieldValue}`);
        
        // ✅ Extract total amount
        if (fieldType === "TOTAL" || fieldType === "AMOUNT_PAID") {
          const cleanValue = fieldValue?.replace(/[^\d.]/g, ''); // Remove currency symbols
          extractedData.amount = parseFloat(cleanValue) || 0;
        }
        
        // ✅ Extract and format invoice date
        if (fieldType === "INVOICE_RECEIPT_DATE") {
          extractedData.date = formatDateForDynamoDB(fieldValue);
        }
        
        // ✅ ADDED: Extract vendor name
        if (fieldType === "VENDOR_NAME") {
          extractedData.vendorName = fieldValue || "Not found";
        }
        
        // ✅ Extract currency from amount field
        if (fieldType === "TOTAL" && fieldValue) {
          if (fieldValue.includes('$')) extractedData.currency = "USD";
          else if (fieldValue.includes('€')) extractedData.currency = "EUR";
          else if (fieldValue.includes('₪')) extractedData.currency = "ILS";
        }
      }
    }
  }
  
  console.log("✅ Final extracted data:", extractedData);
  
  return extractedData;
}

/**
 * Update invoice in DynamoDB with extracted data
 * 
 * @param {string} userId - User ID (partition key)
 * @param {string} invoiceId - Invoice ID (sort key)
 * @param {Object} extractedData - Data from Textract
 */
async function updateInvoiceInDynamoDB(userId, invoiceId, extractedData) {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      invoiceId: invoiceId
    },
    UpdateExpression: "SET #status = :status, amount = :amount, #date = :date, vendorName = :vendorName, currency = :currency, processedTime = :processedTime",
    ExpressionAttributeNames: {
      "#status": "status",
      "#date": "date"
    },
    ExpressionAttributeValues: {
      ":status": "COMPLETED",
      ":amount": extractedData.amount,
      ":date": extractedData.date,
      ":vendorName": extractedData.vendorName, // ✅ ADDED
      ":currency": extractedData.currency,
      ":processedTime": new Date().toISOString()
    },
    ReturnValues: "ALL_NEW"
  });
  
  const result = await docClient.send(command);
  console.log("💾 DynamoDB update successful. Updated fields:", 
    Object.keys(result.Attributes || {}).join(', ')
  );
  
  return result.Attributes;
}

/**
 * ✅ ADDED: Update invoice status to FAILED (for error handling)
 * 
 * @param {string} userId - User ID
 * @param {string} invoiceId - Invoice ID
 * @param {string} status - Status to set
 * @param {string} errorMessage - Error message
 */
async function updateInvoiceStatus(userId, invoiceId, status, errorMessage) {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      invoiceId: invoiceId
    },
    UpdateExpression: "SET #status = :status, errorMessage = :errorMessage, processedTime = :processedTime",
    ExpressionAttributeNames: {
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":status": status,
      ":errorMessage": errorMessage,
      ":processedTime": new Date().toISOString()
    }
  });
  
  await docClient.send(command);
}

/**
 * Format date from Textract to DD/MM/YYYY format
 * 
 * This format is required by:
 * - ClientDashboard.jsx parseInvoiceDate() function
 * - GetFinancialReports Lambda for monthly grouping
 * 
 * Handles various Textract date formats:
 * - "Dec 18, 2025" → "18/12/2025"
 * - "2025-12-18" → "18/12/2025"
 * - "18-12-2025" → "18/12/2025"
 * 
 * @param {string} dateString - Date from Textract
 * @returns {string} Formatted date DD/MM/YYYY
 */
function formatDateForDynamoDB(dateString) {
  if (!dateString || dateString === "Not found") {
    return "Not found";
  }
  
  try {
    // ✅ Try to parse the date (handles most formats automatically)
    const parsedDate = new Date(dateString);
    
    // ✅ Check if valid date
    if (isNaN(parsedDate.getTime())) {
      console.warn(`⚠️ Could not parse date: ${dateString}`);
      return "Not found";
    }
    
    // ✅ Format as DD/MM/YYYY (expected by ClientDashboard.jsx)
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