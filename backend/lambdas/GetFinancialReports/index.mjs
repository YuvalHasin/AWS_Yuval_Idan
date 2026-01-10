const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ScanBookInvoices";

exports.handler = async (event) => {
    try {
        const data = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        const items = data.Items;

        const report = {
            monthly: {}, // סיכום לפי חודשים
            yearly: {},  // סיכום לפי שנים
            byCategory: {} // סיכום הוצאות לפי קטגוריה
        };

        items.forEach(item => {
            const amount = parseFloat(item.amount || 0);
            const type = item.type || "EXPENSE";
            const cat = item.category || "כללי";
            
            if (item.date && item.date !== "Not found") {
                const parts = item.date.split(/[\/.-]/);
                if (parts.length >= 3) {
                    const month = parts[1];
                    const year = parts[2];
                    const monthYear = `${month}/${year}`;

                    // סיכום חודשי
                    if (!report.monthly[monthYear]) report.monthly[monthYear] = { income: 0, expense: 0 };
                    if (type === "INCOME") report.monthly[monthYear].income += amount;
                    else report.monthly[monthYear].expense += amount;

                    // סיכום שנתי
                    if (!report.yearly[year]) report.yearly[year] = { income: 0, expense: 0 };
                    if (type === "INCOME") report.yearly[year].income += amount;
                    else report.yearly[year].expense += amount;

                    // סיכום לפי קטגוריה (רק להוצאות)
                    if (type === "EXPENSE") {
                        if (!report.byCategory[cat]) report.byCategory[cat] = 0;
                        report.byCategory[cat] += amount;
                    }
                }
            }
        });

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(report)
        };
    } catch (error) {
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: error.message }) };
    }
};