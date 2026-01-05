const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

// אתחול הלקוחות
const s3Client = new S3Client({ region: "us-east-1" });
const dbClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);

// --- הגדרות (נא לשנות לשם הבאקט שלך) ---
const BUCKET_NAME = "scanbook-files-idan-yuval"; 
const TABLE_NAME = "ScanBookInvoices";

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

  try {
    // 1. חילוץ המידע מהבקשה
    // (בבדיקה רגילה זה אובייקט, דרך API Gateway זה מגיע כ-String בתוך body)
    const body = event.body ? JSON.parse(event.body) : event;
    const { userId, fileName, fileContent } = body;

    if (!userId || !fileName || !fileContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Error: Missing userId, fileName or fileContent" })
      };
    }

    // 2. יצירת מזהה ייחודי לחשבונית
    const invoiceId = uuidv4();
    const s3Key = `${userId}/${invoiceId}_${fileName}`; // נשמור בתיקייה לפי משתמש

    // 3. המרת הקובץ (מגיע כ-Base64) חזרה לקובץ בינארי
    const buffer = Buffer.from(fileContent, 'base64');

    // 4. שמירה ב-S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: "application/pdf" // או image/jpeg, כרגע נניח PDF או תמונה
    };
    await s3Client.send(new PutObjectCommand(uploadParams));

    // 5. שמירת רשומה ב-DynamoDB
    const item = {
      userId: userId,           // Partition Key
      invoiceId: invoiceId,     // Sort Key
      uploadTime: new Date().toISOString(),
      originalName: fileName,
      s3Key: s3Key,
      status: "UPLOADED"        // סטטוס התחלתי
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    // 6. סיום בהצלחה
    console.log(`Success! Invoice ${invoiceId} saved.`);
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Invoice uploaded successfully!", 
        invoiceId: invoiceId 
      }),
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
    };
  }
};