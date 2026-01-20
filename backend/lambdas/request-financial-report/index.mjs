import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const snsClient = new SNSClient({});
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
    const { clientId, clientName, cpaId, cpaEmail } = JSON.parse(event.body);
    const notificationId = Date.now().toString();

    // 1. שמירה ל-DynamoDB (בשביל ההתראה במערכת)
    await docClient.send(new PutCommand({
        TableName: "scanbook-notifications",
        Item: {
            notificationId,
            cpaId,
            message: `הלקוח ${clientName} ביקש הפקת דוח`,
            createdAt: new Date().toISOString(),
            status: "UNREAD"
        }
      }));

    // 2. שליחה ל-SNS (בשביל המייל)
    await snsClient.send(new PublishCommand({
        Subject: "בקשה חדשה להפקת דוח",
        Message: `שלום, הלקוח ${clientName} ממתין לדוח.`,
        TopicArn: "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:ReportRequests"
    }));

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
};