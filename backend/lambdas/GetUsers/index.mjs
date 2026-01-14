import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
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