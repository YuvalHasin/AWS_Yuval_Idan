import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

// Initialize AWS Clients (outside the handler for performance reuse)
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const s3Client = new S3Client({ region: AWS_REGION });
const dbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);

// Load environment variables
const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;

// ✅ ADD THIS - Validates env vars are set
if (!BUCKET_NAME || !TABLE_NAME) {
  throw new Error(`Missing env vars. Set BUCKET_NAME and TABLE_NAME in Lambda console.`);
}

export const handler = async (event) => {
  console.log("🚀 Event Received:", JSON.stringify(event));

  // 1. CORS Headers - Mandatory for React/Browser access
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-api-key",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
  };

  // 2. Handle HTTP OPTIONS preflight request (if API Gateway doesn't handle it)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 3. Parse incoming JSON body from React
    const body = JSON.parse(event.body || "{}");
    const { userId, fileName, contentType, category, type } = body;

    // Validate required fields
    if (!userId || !fileName || !contentType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing required fields: userId, fileName, contentType" })
      };
    }

    // 4. Generate unique IDs and file path
    const invoiceId = randomUUID();
    // Path structure: userId/invoiceId_filename.pdf
    const s3Key = `${userId}/${invoiceId}_${fileName}`;

    console.log(`📝 Generating Presigned URL for: ${s3Key}`);

    // 5. Create the S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType // Must match the file type sent by the browser
    });

    // Generate the signed URL (valid for 300 seconds / 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // 6. Save metadata to DynamoDB with 'PENDING_UPLOAD' status
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId,
        invoiceId,
        s3Key,
        originalName: fileName,
        status: "PENDING_UPLOAD",
        uploadDate: new Date().toISOString(),
        category: category || "General",
        type: type || "EXPENSE"
      }
    }));

    // 7. Return the URL to the client
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Upload URL generated successfully",
        uploadUrl, // The frontend will use this URL to PUT the file
        invoiceId,
        s3Key
      })
    };

  } catch (error) {
    console.error("❌ Error:", error);
    console.error("❌ Stack:", error.stack); 
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: "Internal Server Error", 
        error: error.message 
      })
    };
  }
};