import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    //  Handle CORS preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        console.log(' Handling OPTIONS preflight request');
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Max-Age": "86400"
            },
            body: JSON.stringify({ message: "CORS preflight successful" })
        };
    }

    console.log("מתחיל סריקת משתמשים מטבלת scanbook-users...");
    
    const params = {
        TableName: "scanbook-users", // השם המדויק מה-DynamoDB שלך
    };

    try {
        const command = new ScanCommand(params);
        const data = await docClient.send(command);
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data.Items),
        };
    } catch (err) {
        console.error("שגיאה בסריקה:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};