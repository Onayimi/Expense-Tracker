/**
 * export-data.js
 * Run this BEFORE switching to Supabase to save your local data.
 * Usage: node scripts/export-data.js
 * Output: prisma/local-data.json
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("📦 Exporting local data...");

  const [sources, categories, income, expenses, lineItems, hubbyBorrows, repayments, settings] =
    await Promise.all([
      prisma.incomeSource.findMany(),
      prisma.expenseCategory.findMany(),
      prisma.income.findMany(),
      prisma.expense.findMany(),
      prisma.expenseLineItem.findMany(),
      prisma.hubbyBorrow.findMany(),
      prisma.repayment.findMany(),
      prisma.appSettings.findMany(),
    ]);

  const data = { sources, categories, income, expenses, lineItems, hubbyBorrows, repayments, settings };
  const out = path.join(__dirname, "../prisma/local-data.json");
  fs.writeFileSync(out, JSON.stringify(data, null, 2));

  console.log("✅ Exported to prisma/local-data.json");
  console.log(`   Income sources:    ${sources.length}`);
  console.log(`   Categories:        ${categories.length}`);
  console.log(`   Income entries:    ${income.length}`);
  console.log(`   Expenses:          ${expenses.length}`);
  console.log(`   Line items:        ${lineItems.length}`);
  console.log(`   Hubby borrows:     ${hubbyBorrows.length}`);
  console.log(`   Repayments:        ${repayments.length}`);
}

main()
  .catch((e) => { console.error("❌ Export failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
