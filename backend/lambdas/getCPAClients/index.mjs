import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    // לוג לבדיקת הפרמטרים שמגיעים מה-React
    console.log("Full Event:", JSON.stringify(event));
    const cpaId = event.queryStringParameters?.cpaId;
    console.log("Searching for CPA ID:", cpaId);

    const params = {
        TableName: "scanbook-users",
        FilterExpression: "assignedCPA = :cpaId", 
        ExpressionAttributeValues: { ":cpaId": cpaId }
    };

    try {
        const data = await docClient.send(new ScanCommand(params));
        console.log("Items found in DynamoDB:", data.Items?.length || 0);
        console.log("First item found (if any):", JSON.stringify(data.Items?.[0]));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify(data) // מחזירים את כל האובייקט כולל Items
        };
    } catch (err) {
        console.error("DynamoDB Error:", err);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: err.message })
        };
    }
};