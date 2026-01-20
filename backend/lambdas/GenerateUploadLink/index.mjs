import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const s3Client = new S3Client({ region: AWS_REGION });
const dbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
  // הגדרת Headers פתוחים (כמו בלמדה הראשונה)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type" // מאפשרים רק Content-Type ללא Authorization
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { userId, fileName, contentType, category, type } = body;

    if (!userId || !fileName || !contentType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing required fields" })
      };
    }

    const invoiceId = randomUUID();
    const s3Key = `${userId}/${invoiceId}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ uploadUrl, invoiceId, s3Key })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};