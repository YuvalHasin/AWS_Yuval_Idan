import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    // הדפסת האירוע ללוגים לצורך ניטור (CloudWatch)
    console.log("Received event:", JSON.stringify(event));

    // 1. בדיקה אם ה-body קיים
    if (!event.body) {
        return {
            statusCode: 400,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Missing request body" })
        };
    }

    // 2. חילוץ הנתונים מה-body (טיפול במקרה של String או Object)
    let body;
    try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
        console.error("Parsing error:", e);
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Invalid JSON format" })
        };
    }

    const { userId, status, role } = body;

    // בדיקה שקיבלנו userId - בלעדיו אי אפשר לעדכן
    if (!userId) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "userId is required" })
        };
    }

    // 3. בנייה דינמית של פקודת העדכון ל-DynamoDB
    let updateExpression = "set";
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};

    if (status) {
        updateExpression += " #s = :s,";
        expressionAttributeNames["#s"] = "status";
        expressionAttributeValues[":s"] = status;
    }
    if (role) {
        updateExpression += " #r = :r,";
        expressionAttributeNames["#r"] = "role";
        expressionAttributeValues[":r"] = role;
    }

    // הסרת הפסיק המיותר בסוף המחרוזת
    updateExpression = updateExpression.slice(0, -1);

    // בדיקה אם יש בכלל מה לעדכן
    if (updateExpression === "se") { // אם לא נכנסנו לאף if
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Nothing to update" })
        };
    }

    const params = {
        TableName: "scanbook-users", // ודאי שזה השם המדויק
        Key: { userId: userId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
    };

    try {
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