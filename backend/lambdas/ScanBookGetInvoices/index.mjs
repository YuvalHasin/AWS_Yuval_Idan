import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb"; // ✅ שינוי: שימוש ב-QueryCommand

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
const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

console.log(`🔧 ScanBookGetInvoices Lambda initialized:`);
console.log(`  - Region: ${AWS_REGION}`);
console.log(`  - Table: ${TABLE_NAME}`);

/**
 * Lambda Handler: Get All Invoices
 * * API Gateway triggered (GET /invoices?userId=...)
 * Returns all invoices for the specific user using QUERY
 */
export const handler = async (event) => {
    console.log("📥 Event received:", JSON.stringify(event, null, 2));
    
    // ✅ CORS Headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,x-api-key",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Content-Type": "application/json"
    };

    // ✅ Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ Handling OPTIONS preflight request');
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: "CORS preflight successful" })
        };
    }

    try {
        // ✅ תוקן: קבלת userId מה-URL Parameters (כמו ב-GetFinancialReports)
        const queryParams = event.queryStringParameters || {};
        const userId = queryParams.userId;

        // ולידציה שקיבלנו משתמש
        if (!userId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Missing required parameter: userId" })
            };
        }
        
        console.log(`📋 Fetching invoices for user: ${userId}`);
        
        // ✅ תוקן: שימוש ב-Query במקום Scan
        // שולף אך ורק את הרשומות של המשתמש הספציפי
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: {
                ":uid": userId
            }
        });
        
        const result = await docClient.send(command);
        const invoices = result.Items || [];
        
        console.log(`✅ Found ${invoices.length} invoices`);
        
        // ✅ מיון: מהחדש לישן (לפי תאריך החשבונית או תאריך העלאה)
        const sortedInvoices = invoices.sort((a, b) => {
            const dateA = new Date(a.date || a.uploadDate || 0);
            const dateB = new Date(b.date || b.uploadDate || 0);
            return dateB - dateA; // יורד (הכי חדש למעלה)
        });
        
        console.log(`✅ Returning ${sortedInvoices.length} sorted invoices`);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(sortedInvoices)
        };
        
    } catch (error) {
        console.error("❌ Error fetching invoices:", error);
        console.error("❌ Error stack:", error.stack);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: "Failed to fetch invoices",
                error: error.message,
                errorType: error.name
            })
        };
    }
};