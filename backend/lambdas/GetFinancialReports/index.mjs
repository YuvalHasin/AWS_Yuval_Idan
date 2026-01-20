import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb"; // ✅ שינוי: שימוש ב-QueryCommand

// ✅ UPDATED: Load environment variables (NO FALLBACKS)
const AWS_REGION = process.env.AWS_REGION;
const TABLE_NAME = process.env.TABLE_NAME;

// ✅ ADDED: Validate required environment variables
const requiredEnvVars = ['AWS_REGION', 'TABLE_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `❌ Missing required environment variables: ${missingVars.join(', ')}. ` +
    `Please configure them in AWS Lambda Console → Configuration → Environment variables.`
  );
}

// ✅ UPDATED: Use AWS_REGION from environment
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

console.log(`🔧 GetFinancialReports Lambda initialized:`);
console.log(`  - Region: ${AWS_REGION}`);
console.log(`  - Table: ${TABLE_NAME}`);

/**
 * Lambda Handler: Generate Financial Reports
 * * Supports:
 * - Monthly breakdowns
 * - Category analysis  
 * - Income vs Expense comparison
 * - Current month focus
 * * Query Parameters:
 * - userId: REQUIRED (for security and performance)
 * - period: "current" | "all" | "YYYY-MM"
 * - type: "summary" | "detailed"
 * * Returns JSON report with monthly, category, and summary data
 */
export const handler = async (event) => {
  console.log("📊 GetFinancialReports event:", JSON.stringify(event, null, 2));

  // ✅ CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-api-key",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Content-Type": "application/json"
  };

  // ✅ Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "CORS preflight successful" })
    };
  }

  try {
    // ✅ Extract query parameters
    const queryParams = event.queryStringParameters || {};
    
    // ✅ חובה: שליפת ה-userId מהפרמטרים (במקום לסרוק את כל הטבלה)
    const userId = queryParams.userId; 
    const period = queryParams.period || "current";
    const reportType = queryParams.type || "summary";

    // ✅ ולידציה: אם אין userId, מחזירים שגיאה
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Missing required parameter: userId" })
      };
    }

    console.log(`📈 Generating ${reportType} report for User: ${userId}, Period: ${period}`);

    // ✅ Fetch ONLY this user's invoices using Query (Safe & Fast)
    const userInvoices = await fetchUserInvoices(userId);
    
    console.log(`📋 Total invoices fetched for user: ${userInvoices.length}`);
    console.log(`📊 Invoice statuses: ${getStatusCounts(userInvoices)}`);

    // ✅ Filter only completed invoices for financial calculations
    const completedInvoices = userInvoices.filter(inv => inv.status === 'COMPLETED');
    
    console.log(`✅ Completed invoices for analysis: ${completedInvoices.length}`);

    if (completedInvoices.length === 0) {
      console.warn("⚠️ No completed invoices found");
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "No completed invoices available for analysis",
          period: period,
          totalInvoices: 0,
          monthly: {},
          byCategory: {},
          summary: { totalIncome: 0, totalExpense: 0, netProfit: 0 }
        })
      };
    }

    // ✅ Generate comprehensive financial report
    const report = await generateFinancialReport(completedInvoices, period);

    console.log("✅ Financial report generated successfully");
    console.log(`📊 Report summary: ${report.totalInvoices} invoices, ${Object.keys(report.monthly).length} months`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(report)
    };

  } catch (error) {
    console.error("❌ Error generating financial report:", error);
    console.error("❌ Error stack:", error.stack);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Failed to generate financial report",
        error: error.message,
        hint: "Check Lambda CloudWatch logs for detailed error information"
      })
    };
  }
};

/**
 * ✅ Fetch ONLY the specific user's invoices
 * Uses Query operation (High Performance) instead of Scan
 * * @param {string} userId - The user ID to fetch data for
 * @returns {Array} List of invoices for this user
 */
async function fetchUserInvoices(userId) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "userId = :uid", // ✅ שליפה ממוקדת לפי מפתח ראשי
    ExpressionAttributeValues: {
      ":uid": userId
    }
  });

  const response = await docClient.send(command);
  return response.Items || [];
}

/**
 * ✅ NEW: Get count of invoices by status (for debugging)
 * * @param {Array} invoices - All invoices
 * @returns {string} Status summary
 */
function getStatusCounts(invoices) {
  const counts = invoices.reduce((acc, inv) => {
    acc[inv.status || 'UNKNOWN'] = (acc[inv.status || 'UNKNOWN'] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(counts).map(([status, count]) => `${status}: ${count}`).join(', ');
}

/**
 * Generate comprehensive financial report
 * * @param {Array} invoices - Completed invoices only
 * @param {string} period - Report period
 * @returns {Object} Financial report
 */
async function generateFinancialReport(invoices, period) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // ✅ Initialize report structure
  const report = {
    period: {
      month: currentMonth,
      year: currentYear,
      type: period
    },
    totalInvoices: invoices.length,
    monthly: {},
    byCategory: {},
    byType: { INCOME: 0, EXPENSE: 0 },
    summary: { totalIncome: 0, totalExpense: 0, netProfit: 0 },
    // ✅ NEW: Processing status info
    processing: {
      pendingUpload: 0,
      processing: 0,
      failed: 0
    }
  };

  // ✅ Process each completed invoice
  for (const invoice of invoices) {
    try {
      // ✅ Parse invoice date (DD/MM/YYYY format from ProcessInvoice)
      const invoiceDate = parseInvoiceDate(invoice.date, invoice.uploadDate);
      const invMonth = invoiceDate.getMonth() + 1;
      const invYear = invoiceDate.getFullYear();
      const monthKey = `${invMonth}/${invYear}`;

      // ✅ Skip if filtering by specific period
      if (period !== "current" && period !== "all") {
        const [filterYear, filterMonth] = period.split('-');
        if (invYear !== parseInt(filterYear) || invMonth !== parseInt(filterMonth)) {
          continue;
        }
      }

      // ✅ Initialize monthly data if needed
      if (!report.monthly[monthKey]) {
        report.monthly[monthKey] = {
          month: invMonth,
          year: invYear,
          income: 0,
          expense: 0,
          count: 0,
          invoices: []
        };
      }

      // ✅ Process invoice amounts
      const amount = parseFloat(invoice.amount) || 0;
      const type = invoice.type || 'EXPENSE';
      const category = invoice.category || 'General';

      // ✅ Update monthly totals
      if (type === 'INCOME') {
        report.monthly[monthKey].income += amount;
        report.byType.INCOME += amount;
        report.summary.totalIncome += amount;
      } else {
        report.monthly[monthKey].expense += amount;
        report.byType.EXPENSE += amount;
        report.summary.totalExpense += amount;
        
        // ✅ Track expenses by category
        report.byCategory[category] = (report.byCategory[category] || 0) + amount;
      }

      report.monthly[monthKey].count++;
      
      // ✅ Add invoice details for debugging
      report.monthly[monthKey].invoices.push({
        invoiceId: invoice.invoiceId,
        amount,
        type,
        category,
        date: invoice.date,
        // ✅ NEW: Include vendor name if available
        vendorName: invoice.vendorName || 'Unknown'
      });

    } catch (error) {
      console.error(`❌ Error processing invoice ${invoice.invoiceId}:`, error);
    }
  }

  // ✅ Calculate net profit
  report.summary.netProfit = report.summary.totalIncome - report.summary.totalExpense;

  // ✅ Sort monthly data by date (newest first)
  const sortedMonthly = Object.keys(report.monthly)
    .sort((a, b) => {
      const [monthA, yearA] = a.split('/').map(Number);
      const [monthB, yearB] = b.split('/').map(Number);
      return (yearB * 12 + monthB) - (yearA * 12 + monthA);
    })
    .reduce((acc, key) => {
      acc[key] = report.monthly[key];
      return acc;
    }, {});

  report.monthly = sortedMonthly;

  console.log(`📊 Report generated: ${Object.keys(report.monthly).length} months processed`);
  console.log(`💰 Totals: Income ₪${report.summary.totalIncome}, Expense ₪${report.summary.totalExpense}, Net ₪${report.summary.netProfit}`);

  return report;
}

/**
 * Parse invoice date with fallback logic
 * * Priority:
 * 1. Use invoice.date (DD/MM/YYYY from Textract)
 * 2. Fall back to invoice.uploadDate (ISO string)
 * * @param {string} dateString - Primary date (DD/MM/YYYY)
 * @param {string} fallbackDate - Upload date (ISO string)
 * @returns {Date} Parsed date object
 */
function parseInvoiceDate(dateString, fallbackDate) {
  // ✅ Try primary date first (DD/MM/YYYY format)
  if (dateString && dateString !== 'Not found') {
    try {
      const parts = dateString.split(/[\/.-]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
        const year = parseInt(parts[2], 10);
        
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not parse primary date: ${dateString}`);
    }
  }

  // ✅ Fall back to upload date
  if (fallbackDate) {
    try {
      const parsed = new Date(fallbackDate);
      if (!isNaN(parsed.getTime())) {
        console.log(`📅 Using fallback date: ${fallbackDate} for invoice`);
        return parsed;
      }
    } catch (error) {
      console.warn(`⚠️ Could not parse fallback date: ${fallbackDate}`);
    }
  }

  // ✅ Ultimate fallback: current date
  console.warn("⚠️ Using current date as ultimate fallback");
  return new Date();
}