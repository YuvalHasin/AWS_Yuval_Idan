import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    // הגדרת Headers פתוחים (בדיוק כמו בלמדה הראשונה שלך)
    const headers = { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS, POST",
        "Content-Type": "application/json"
    };

    // טיפול ידני בבקשת OPTIONS (Preflight) - קריטי כשעוברים מ-Mock ל-Proxy
    if (event.httpMethod === 'OPTIONS') {
        return { 
            statusCode: 200, 
            headers, 
            body: '' 
        };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const { userId, status, role } = body;

        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "userId is required" })
            };
        }

        // עדכון ב-DynamoDB
        const params = {
            TableName: "scanbook-users",
            Key: { userId: userId },
            UpdateExpression: "set #s = :statusVal" + (role ? ", #r = :roleVal" : ""),
            ExpressionAttributeNames: { 
                "#s": "status",
                ...(role && { "#r": "role" })
            },
            ExpressionAttributeValues: { 
                ":statusVal": status,
                ...(role && { ":roleVal": role })
            }
        };

        await docClient.send(new UpdateCommand(params));
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                message: "User updated successfully", 
                updatedFields: { status, role } 
            })
        };

    } catch (err) {
        console.error("DynamoDB Update Error:", err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Internal Server Error", details: err.message })
        };
    }
};