import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ScanBookInvoices";

export const handler = async (event) => {
    try {
        console.log("📥 Event received:", JSON.stringify(event, null, 2));
        
        // Get query parameters
        const period = event.queryStringParameters?.period || "current";
        
        // Scan all items from DynamoDB
        const data = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        const items = data.Items;
        
        console.log(`📊 Total invoices in DB: ${items.length}`);
        
        // Calculate current month/year for filtering
        const now = new Date();
        const filterMonth = String(now.getMonth() + 1).padStart(2, '0'); // "01" to "12"
        const filterYear = String(now.getFullYear()); // "2026"
        
        console.log(`🔍 Filter period: ${filterMonth}/${filterYear}`);
        
        // ✅ FIXED: Better date filtering with error handling
        const filteredItems = period === "current" 
            ? items.filter(item => {
                // Skip items without valid dates
                if (!item.date || item.date === "Not found") {
                  console.log(`⚠️ Invoice ${item.invoiceId} has no valid date`);
                  return false;
                }
                
                try {
                  // Parse DD/MM/YYYY format (e.g., "18/12/2025")
                  const parts = item.date.split(/[\/.-]/);
                  
                  if (parts.length < 3) {
                    console.warn(`⚠️ Invalid date format: ${item.date} (invoice: ${item.invoiceId})`);
                    return false;
                  }
                  
                  const itemDay = parts[0].padStart(2, '0');
                  const itemMonth = parts[1].padStart(2, '0');
                  const itemYear = parts[2];
                  
                  const matches = itemMonth === filterMonth && itemYear === filterYear;
                  
                  if (matches) {
                    console.log(`✅ Matched invoice: ${item.invoiceId} - Date: ${item.date} (${itemMonth}/${itemYear})`);
                  }
                  
                  return matches;
                  
                } catch (error) {
                  console.error(`❌ Error parsing date "${item.date}" for invoice ${item.invoiceId}:`, error);
                  return false;
                }
              })
            : items;
        
        console.log(`✅ Filtered ${filteredItems.length} invoices for ${filterMonth}/${filterYear}`);
        
        // ✅ FIXED: Initialize report structure
        const report = {
            period: {
                month: filterMonth,
                year: filterYear,
                type: period
            },
            monthly: {},
            yearly: {},
            byCategory: {},
            totalInvoices: filteredItems.length
        };
        
        // ✅ FIXED: Process each invoice with better error handling
        filteredItems.forEach(item => {
            // Extract invoice data
            const amount = Number(item.amount) || 0;
            const type = item.type || 'EXPENSE';
            const cat = item.category || 'General';
            
            // Skip if amount is 0 (not yet processed by Textract)
            if (amount === 0) {
                console.log(`⚠️ Skipping invoice ${item.invoiceId} with amount 0`);
                return;
            }
            
            // Parse date for grouping
            if (item.date && item.date !== "Not found") {
                try {
                    const parts = item.date.split(/[\/.-]/);
                    
                    if (parts.length >= 3) {
                        const day = parts[0];
                        const month = parts[1];
                        const year = parts[2];
                        
                        const monthYear = `${month}/${year}`;
                        
                        // ✅ Initialize monthly bucket
                        if (!report.monthly[monthYear]) {
                            report.monthly[monthYear] = { income: 0, expense: 0, count: 0 };
                        }
                        
                        // ✅ Add to monthly totals
                        if (type === "INCOME") {
                            report.monthly[monthYear].income += amount;
                        } else {
                            report.monthly[monthYear].expense += amount;
                        }
                        report.monthly[monthYear].count += 1;
                        
                        // ✅ Initialize yearly bucket
                        if (!report.yearly[year]) {
                            report.yearly[year] = { income: 0, expense: 0, count: 0 };
                        }
                        
                        // ✅ Add to yearly totals
                        if (type === "INCOME") {
                            report.yearly[year].income += amount;
                        } else {
                            report.yearly[year].expense += amount;
                        }
                        report.yearly[year].count += 1;
                        
                        // ✅ Category breakdown (expenses only)
                        if (type === "EXPENSE") {
                            if (!report.byCategory[cat]) {
                                report.byCategory[cat] = 0;
                            }
                            report.byCategory[cat] += amount;
                        }
                        
                        console.log(`📊 Processed: ${item.invoiceId} - ${type} ₪${amount} (${cat}) - ${item.date}`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing invoice ${item.invoiceId}:`, error);
                }
            }
        });
        
        console.log("✅ Final Report:", JSON.stringify(report, null, 2));
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(report)
        };
        
    } catch (error) {
        console.error("❌ Lambda Error:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                message: "Internal Server Error", 
                error: error.message,
                stack: error.stack 
            })
        };
    }
};