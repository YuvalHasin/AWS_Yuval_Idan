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

    try {
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