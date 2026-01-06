import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.BUCKET_NAME || "scanbook-files-idan-yuval";
const TABLE_NAME = process.env.TABLE_NAME || "ScanBookInvoices";

export const handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

  try {
    const body = event.body ? JSON.parse(event.body) : event;
    const { userId, fileName, fileContent } = body;

    if (!userId || !fileName || !fileContent) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: "Error: Missing userId, fileName or fileContent" })
      };
    }

    const invoiceId = uuidv4();
    const s3Key = `${userId}/${invoiceId}_${fileName}`;
    const buffer = Buffer.from(fileContent, 'base64');

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: "application/pdf"
    }));

    // Save metadata to DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId,
        invoiceId,
        uploadTime: new Date().toISOString(),
        originalName: fileName,
        s3Key,
        status: "UPLOADED"
      }
    }));

    console.log(`Success! Invoice ${invoiceId} saved.`);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        message: "Invoice uploaded successfully!", 
        invoiceId 
      }),
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
    };
  }
};