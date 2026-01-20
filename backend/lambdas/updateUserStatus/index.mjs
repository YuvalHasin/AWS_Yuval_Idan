import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const { userId, status } = JSON.parse(event.body);

    const params = {
        TableName: "scanbook-users",
        Key: { userId: userId },
        UpdateExpression: "set #s = :val",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":val": status }
    };

        await docClient.send(new UpdateCommand(params));
        console.log(`Update successful for user: ${userId}`);
        
        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*", // פותר בעיות CORS
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "User updated successfully", updatedFields: { status, role } })
        };
    } catch (err) {
        console.error("DynamoDB Update Error:", err);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Internal Server Error", details: err.message })
        };
    }
};