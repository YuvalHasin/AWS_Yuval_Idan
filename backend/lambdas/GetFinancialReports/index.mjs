import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ScanBookInvoices";

/**
 * Lambda Handler: Get Financial Reports
 * 
 * This function retrieves all invoices from DynamoDB and generates financial reports:
 * - Monthly summary (income vs expenses per month)
 * - Yearly summary (income vs expenses per year)
 * - Category breakdown (expenses grouped by category)
 */
export const handler = async (event) => {
    try {
        // Fetch all invoices from DynamoDB table
        const data = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        const items = data.Items;

        // Initialize report structure
        const report = {
            monthly: {},     // Summary by month
            yearly: {},      // Summary by year
            byCategory: {}   // Expense breakdown by category
        };

        // Process each invoice
        items.forEach(item => {
            const amount = parseFloat(item.amount || 0);
            const type = item.type || "EXPENSE";
            const cat = item.category || "General"; // Changed from Hebrew default
            
            // Only process items with valid dates
            if (item.date && item.date !== "Not found") {
                const parts = item.date.split(/[\/.-]/);
                if (parts.length >= 3) {
                    const month = parts[1];
                    const year = parts[2];
                    const monthYear = `${month}/${year}`;

                    // Monthly summary
                    if (!report.monthly[monthYear]) {
                        report.monthly[monthYear] = { income: 0, expense: 0 };
                    }
                    if (type === "INCOME") {
                        report.monthly[monthYear].income += amount;
                    } else {
                        report.monthly[monthYear].expense += amount;
                    }

                    // Yearly summary
                    if (!report.yearly[year]) {
                        report.yearly[year] = { income: 0, expense: 0 };
                    }
                    if (type === "INCOME") {
                        report.yearly[year].income += amount;
                    } else {
                        report.yearly[year].expense += amount;
                    }

                    // Category breakdown (expenses only)
                    if (type === "EXPENSE") {
                        if (!report.byCategory[cat]) {
                            report.byCategory[cat] = 0;
                        }
                        report.byCategory[cat] += amount;
                    }
                }
            }
        });

        // Return successful response
        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(report)
        };
    } catch (error) {
        // Return error response
        console.error("Error generating financial report:", error);
        return { 
            statusCode: 500, 
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            }, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};