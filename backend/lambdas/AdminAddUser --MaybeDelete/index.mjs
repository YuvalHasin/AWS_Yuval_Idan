import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const headers = { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS, POST",
        "Content-Type": "application/json"
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const body = JSON.parse(event.body || "{}");
        const { userId, name, email, role, status } = body;

        const params = {
            TableName: "scanbook-users",
            Item: {
                userId,
                name,
                email,
                role: role || "CLIENT",
                status: status || "ACTIVE",
                createdAt: new Date().toISOString()
            }
        };

        await docClient.send(new PutCommand(params));
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "User added successfully" })
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};