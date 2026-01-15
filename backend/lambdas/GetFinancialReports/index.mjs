import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ScanBookInvoices";

/**
 * Lambda Handler: Get Financial Reports
 * 
 * Query Parameters:
 * - period: "current" | "all" (default: "current")
 * - month: "01" to "12" (optional)
 * - year: "2024" (optional)
 */
export const handler = async (event) => {
    try {
        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        const period = queryParams.period || "current"; // "current" or "all"
        
        // Get current date info
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentYear = String(now.getFullYear());
        
        // Determine filter criteria
        const filterMonth = queryParams.month || currentMonth;
        const filterYear = queryParams.year || currentYear;
        
        console.log(`📊 Generating report for period: ${period}, month: ${filterMonth}, year: ${filterYear}`);
        
        // Fetch all invoices from DynamoDB
        const data = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        const items = data.Items;
        
        // Filter items based on period
        const filteredItems = period === "current" 
            ? items.filter(item => {
                if (!item.date || item.date === "Not found") return false;
                const parts = item.date.split(/[\/.-]/);
                if (parts.length < 3) return false;
                const itemMonth = parts[1].padStart(2, '0');
                const itemYear = parts[2];
                return itemMonth === filterMonth && itemYear === filterYear;
              })
            : items;
        
        console.log(`📋 Total invoices: ${items.length}, Filtered: ${filteredItems.length}`);
        
        // Initialize report structure
        const report = {
            monthly: {},
            yearly: {},
            byCategory: {},
            totalInvoices: filteredItems.length,
            period: {
                type: period,
                month: filterMonth,
                year: filterYear
            }
        };
        
        // Process filtered invoices
        filteredItems.forEach(item => {
            const amount = parseFloat(item.amount || 0);
            const type = item.type || "EXPENSE";
            const cat = item.category || "General";
            
            if (item.date && item.date !== "Not found") {
                const parts = item.date.split(/[\/.-]/);
                if (parts.length >= 3) {
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    const monthYear = `${month}/${year}`;
                    
                    // Monthly summary
                    if (!report.monthly[monthYear]) {
                        report.monthly[monthYear] = { income: 0, expense: 0, count: 0 };
                    }
                    if (type === "INCOME") {
                        report.monthly[monthYear].income += amount;
                    } else {
                        report.monthly[monthYear].expense += amount;
                    }
                    report.monthly[monthYear].count += 1;
                    
                    // Yearly summary
                    if (!report.yearly[year]) {
                        report.yearly[year] = { income: 0, expense: 0, count: 0 };
                    }
                    if (type === "INCOME") {
                        report.yearly[year].income += amount;
                    } else {
                        report.yearly[year].expense += amount;
                    }
                    report.yearly[year].count += 1;
                    
                    // Category breakdown
                    if (type === "EXPENSE") {
                        if (!report.byCategory[cat]) {
                            report.byCategory[cat] = 0;
                        }
                        report.byCategory[cat] += amount;
                    }
                }
            }
        });
        
        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(report)
        };
    } catch (error) {
        console.error("❌ Error generating financial report:", error);
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