import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    // ✅ CRITICAL FIX: Handle CORS preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ Handling OPTIONS preflight request');
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

    try {
        const { userId, status } = JSON.parse(event.body);

        const params = {
            TableName: "scanbook-users",
            Key: { userId: userId },
            UpdateExpression: "set #s = :val",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: { ":val": status }
        };

        await docClient.send(new UpdateCommand(params));
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Status updated successfully" })
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify(err) };
    }
};