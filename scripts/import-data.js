/**
 * import-data.js
 * Run this AFTER setting DATABASE_URL to your Supabase connection string.
 * Usage: node scripts/import-data.js
 * Reads: prisma/local-data.json
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, "../prisma/local-data.json");

  if (!fs.existsSync(dataPath)) {
    console.error("❌ prisma/local-data.json not found. Run 'npm run data:export' first.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log("🚀 Importing data into Supabase...");

  // Insert in dependency order
  for (const src of data.sources) {
    await prisma.incomeSource.upsert({ where: { id: src.id }, update: src, create: src });
  }
  console.log(`   ✓ ${data.sources.length} income sources`);

  for (const cat of data.categories) {
    await prisma.expenseCategory.upsert({ where: { id: cat.id }, update: cat, create: cat });
  }
  console.log(`   ✓ ${data.categories.length} categories`);

  for (const inc of data.income) {
    await prisma.income.upsert({ where: { id: inc.id }, update: inc, create: inc });
  }
  console.log(`   ✓ ${data.income.length} income entries`);

  for (const exp of data.expenses) {
    await prisma.expense.upsert({
      where: { id: exp.id },
      update: { amount: exp.amount, date: exp.date, notes: exp.notes, categoryId: exp.categoryId, isHubbyBorrow: exp.isHubbyBorrow, updatedAt: exp.updatedAt },
      create: { id: exp.id, amount: exp.amount, date: exp.date, notes: exp.notes, categoryId: exp.categoryId, isHubbyBorrow: exp.isHubbyBorrow, createdAt: exp.createdAt, updatedAt: exp.updatedAt },
    });
  }
  console.log(`   ✓ ${data.expenses.length} expenses`);

  for (const li of data.lineItems) {
    await prisma.expenseLineItem.upsert({ where: { id: li.id }, update: li, create: li });
  }
  console.log(`   ✓ ${data.lineItems.length} line items`);

  for (const hb of data.hubbyBorrows) {
    await prisma.hubbyBorrow.upsert({
      where: { id: hb.id },
      update: { description: hb.description, totalAmount: hb.totalAmount, paidAmount: hb.paidAmount, status: hb.status, updatedAt: hb.updatedAt },
      create: { id: hb.id, expenseId: hb.expenseId, description: hb.description, totalAmount: hb.totalAmount, paidAmount: hb.paidAmount, status: hb.status, createdAt: hb.createdAt, updatedAt: hb.updatedAt },
    });
  }
  console.log(`   ✓ ${data.hubbyBorrows.length} hubby borrows`);

  for (const rep of data.repayments) {
    await prisma.repayment.upsert({
      where: { id: rep.id },
      update: { amount: rep.amount, date: rep.date, notes: rep.notes },
      create: { id: rep.id, hubbyBorrowId: rep.hubbyBorrowId, amount: rep.amount, date: rep.date, notes: rep.notes, createdAt: rep.createdAt },
    });
  }
  console.log(`   ✓ ${data.repayments.length} repayments`);

  for (const s of data.settings) {
    await prisma.appSettings.upsert({ where: { id: s.id }, update: s, create: s });
  }

  console.log("\n✅ All data imported to Supabase successfully!");
}

main()
  .catch((e) => { console.error("❌ Import failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
