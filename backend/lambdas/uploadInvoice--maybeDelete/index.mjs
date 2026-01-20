import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import Busboy from 'busboy';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.BUCKET_NAME || "scanbook-files-idan-yuval";
const TABLE_NAME = process.env.TABLE_NAME || "ScanBookInvoices";

/**
 * Lambda Handler: Upload Invoice
 * Handles multipart/form-data file uploads with CORS support
 */
export const handler = async (event) => {
  console.log("📥 Event received:", JSON.stringify({
    httpMethod: event.httpMethod,
    headers: event.headers,
    isBase64Encoded: event.isBase64Encoded,
    bodyLength: event.body?.length || 0
  }, null, 2));

  // ✅ CRITICAL: Handle CORS preflight OPTIONS request FIRST
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // ✅ Validate HTTP method
  if (event.httpMethod !== 'POST') {
    console.error(`❌ Invalid HTTP method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Method Not Allowed. Use POST to upload files.' 
      })
    };
  }

  try {
    console.log('🔄 Parsing multipart form data...');
    
    // Parse multipart form data using Busboy
    const result = await parseMultipartFormData(event);
    
    const { file, userId, type, category } = result;
    
    // ✅ Validate required fields
    if (!file) {
      console.error("❌ No file in request");
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: "No file uploaded" })
      };
    }

    if (!userId) {
      console.error("❌ Missing userId");
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: "Missing userId field" })
      };
    }

    // Generate unique invoice ID
    const invoiceId = uuidv4();
    const s3Key = `${userId}/${invoiceId}_${file.filename}`;

    console.log(`📤 Uploading to S3: ${s3Key}`);
    console.log(`📊 File size: ${file.content.length} bytes`);

    // ✅ Upload file to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: file.content,
      ContentType: file.contentType || 'application/pdf',
      Metadata: {
        userId,
        invoiceId,
        uploadTime: new Date().toISOString()
      }
    }));

    console.log('✅ S3 upload successful');

    // ✅ Save invoice metadata to DynamoDB
    const invoiceItem = {
      userId,
      invoiceId,
      uploadTime: new Date().toISOString(),
      originalName: file.filename,
      s3Key,
      status: "PROCESSING",
      type: type || 'EXPENSE',
      category: category || 'General',
      amount: 0, // Will be updated by ProcessInvoice Lambda
      date: 'Not found' // Will be updated by ProcessInvoice Lambda
    };

    console.log(`💾 Saving to DynamoDB:`, JSON.stringify(invoiceItem, null, 2));

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: invoiceItem
    }));

    console.log(`✅ Success! Invoice ${invoiceId} saved to DynamoDB`);

    // ✅ Return success response with CORS headers
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "Invoice uploaded successfully!",
        invoiceId,
        s3Key,
        fileName: file.filename,
        category,
        type
      })
    };

  } catch (error) {
    console.error("❌ Error processing upload:", error);
    console.error("❌ Error stack:", error.stack);

    // ✅ Return error response with CORS headers
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "Failed to upload invoice",
        error: error.message,
        errorType: error.name
      })
    };
  }
};

/**
 * Parse multipart/form-data using Busboy
 * Handles file uploads and form fields
 */
function parseMultipartFormData(event) {
  return new Promise((resolve, reject) => {
    try {
      const result = { fields: {} };

      // ✅ Handle different body encodings
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

      // ✅ Extract Content-Type header (case-insensitive)
      const contentType = 
        event.headers['content-type'] ||
        event.headers['Content-Type'] ||
        event.headers['CONTENT_TYPE'];

      if (!contentType) {
        console.error("❌ No Content-Type header found");
        console.error("Available headers:", JSON.stringify(event.headers, null, 2));
        return reject(new Error("Missing Content-Type header"));
      }

      console.log("📝 Content-Type:", contentType);

      // ✅ Validate multipart/form-data
      if (!contentType.includes('multipart/form-data')) {
        console.error(`❌ Invalid Content-Type: ${contentType}`);
        return reject(new Error(`Expected multipart/form-data, got ${contentType}`));
      }

      // ✅ Initialize Busboy parser
      const busboy = Busboy({
        headers: {
          'content-type': contentType
        }
      });

      // ✅ Handle form fields (userId, type, category)
      busboy.on('field', (fieldname, value) => {
        console.log(`📝 Field received: ${fieldname} = ${value}`);
        result.fields[fieldname] = value;
      });

      // ✅ Handle file upload
      busboy.on('file', (fieldname, file, info) => {
        console.log(`📎 File detected: ${info.filename} (${info.mimeType})`);

        const chunks = [];

        file.on('data', (chunk) => {
          console.log(`📦 Received chunk: ${chunk.length} bytes`);
          chunks.push(chunk);
        });

        file.on('end', () => {
          const fileBuffer = Buffer.concat(chunks);
          console.log(`✅ File complete: ${fileBuffer.length} bytes total`);

          result.file = {
            filename: info.filename,
            content: fileBuffer,
            contentType: info.mimeType
          };
        });

        file.on('error', (err) => {
          console.error('❌ File stream error:', err);
          reject(err);
        });
      });

      // ✅ Parsing complete
      busboy.on('finish', () => {
        console.log('✅ Busboy parsing complete');

        if (!result.file) {
          console.error('❌ No file received in multipart data');
          return reject(new Error("No file uploaded"));
        }

        console.log('📊 Parsed data summary:');
        console.log(`  - File: ${result.file.filename}`);
        console.log(`  - Size: ${result.file.content.length} bytes`);
        console.log(`  - Fields: ${JSON.stringify(result.fields)}`);

        resolve({
          file: result.file,
          userId: result.fields.userId || 'unknown-user',
          type: result.fields.type || 'EXPENSE',
          category: result.fields.category || 'General'
        });
      });

      // ✅ Handle Busboy errors
      busboy.on('error', (err) => {
        console.error("❌ Busboy parsing error:", err);
        reject(err);
      });

      // ✅ Write body to Busboy
      console.log(`📤 Writing ${body.length} bytes to Busboy parser`);
      busboy.write(body);
      busboy.end();

    } catch (error) {
      console.error("❌ Fatal parse error:", error);
      reject(error);
    }
  });
}