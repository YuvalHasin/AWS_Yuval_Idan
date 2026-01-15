import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import Busboy from 'busboy';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.BUCKET_NAME || "scanbook-files-idan-yuval";
const TABLE_NAME = process.env.TABLE_NAME || "ScanBookInvoices";

export const handler = async (event) => {
  console.log("📥 Event received:", JSON.stringify({
    headers: event.headers,
    isBase64Encoded: event.isBase64Encoded,
    bodyLength: event.body?.length || 0
  }));

  try {
    // Parse multipart form data using Busboy
    const result = await parseMultipartFormData(event);
    
    const { file, userId, type, category } = result;
    
    if (!file || !userId) {
      console.error("❌ Missing required fields");
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: "Missing required fields (file or userId)" })
      };
    }

    const invoiceId = uuidv4();
    const s3Key = `${userId}/${invoiceId}_${file.filename}`;

    // Upload to S3
    console.log(`📤 Uploading to S3: ${s3Key}`);
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: file.content,
      ContentType: file.contentType
    }));
    console.log('✅ S3 upload successful');

    // Save to DynamoDB
    const invoiceItem = {
      userId,
      invoiceId,
      uploadTime: new Date().toISOString(),
      originalName: file.filename,
      s3Key,
      status: "UPLOADED",
      type: type || 'EXPENSE',
      category: category || 'General',
      amount: 0,
    };

    console.log(`💾 Saving to DynamoDB:`, invoiceItem);
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: invoiceItem
    }));

    console.log(`✅ Success! Invoice ${invoiceId} saved.`);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        message: "Invoice uploaded successfully!", 
        invoiceId,
        category,
        type
      }),
    };

  } catch (error) {
    console.error("❌ Error:", error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        message: "Internal Server Error", 
        error: error.message,
        stack: error.stack 
      }),
    };
  }
};

// ✅ IMPROVED: Busboy-based multipart parser with better error handling
function parseMultipartFormData(event) {
  return new Promise((resolve, reject) => {
    try {
      const result = { fields: {} };
      
      // ✅ FIX: Handle both base64 and raw body
      let body;
      if (event.isBase64Encoded) {
        console.log("📦 Decoding base64 body");
        body = Buffer.from(event.body, 'base64');
      } else if (typeof event.body === 'string') {
        console.log("📦 Converting string body to buffer");
        body = Buffer.from(event.body, 'binary');
      } else {
        console.log("📦 Using body as-is");
        body = event.body;
      }
      
      // ✅ FIX: Extract content-type (case-insensitive)
      const contentType = event.headers['content-type'] 
        || event.headers['Content-Type'] 
        || event.headers['CONTENT_TYPE'];
      
      if (!contentType) {
        console.error("❌ No Content-Type header found");
        return reject(new Error("Missing Content-Type header"));
      }
      
      console.log("📝 Content-Type:", contentType);
      
      const busboy = Busboy({ 
        headers: {
          'content-type': contentType
        }
      });

      // Handle form fields (userId, type, category)
      busboy.on('field', (fieldname, value) => {
        console.log(`📝 Field: ${fieldname} = ${value}`);
        result.fields[fieldname] = value;
      });

      // Handle file upload
      busboy.on('file', (fieldname, file, info) => {
        console.log(`📎 File detected: ${info.filename} (${info.mimeType})`);
        
        const chunks = [];
        
        file.on('data', (chunk) => {
          console.log(`📦 Received chunk: ${chunk.length} bytes`);
          chunks.push(chunk);
        });
        
        file.on('end', () => {
          const fileBuffer = Buffer.concat(chunks);
          console.log(`✅ File complete: ${fileBuffer.length} bytes`);
          
          result.file = {
            filename: info.filename,
            content: fileBuffer,
            contentType: info.mimeType
          };
        });
      });

      // Finish parsing
      busboy.on('finish', () => {
        console.log('✅ Busboy parsing complete');
        
        if (!result.file) {
          return reject(new Error("No file received"));
        }
        
        resolve({
          file: result.file,
          userId: result.fields.userId || 'test-user',
          type: result.fields.type || 'EXPENSE',
          category: result.fields.category || 'General'
        });
      });

      busboy.on('error', (err) => {
        console.error("❌ Busboy error:", err);
        reject(err);
      });
      
      // Write body to busboy
      console.log(`📤 Writing ${body.length} bytes to Busboy`);
      busboy.write(body);
      busboy.end();
      
    } catch (error) {
      console.error("❌ Parse error:", error);
      reject(error);
    }
  });
}