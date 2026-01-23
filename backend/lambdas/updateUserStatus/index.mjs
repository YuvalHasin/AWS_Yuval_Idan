import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
    const headers = { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    };

    try {
        const { userId, status, role } = JSON.parse(event.body || "{}");

        if (!userId || !status) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "userId and status are required" })
            };
        }

        const params = {
            TableName: "scanbook-users",
            Key: { userId },
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
            body: JSON.stringify({ success: true })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Failed to update user", details: err.message })
        };
    }
};