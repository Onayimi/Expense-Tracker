/**
 * setup-prod.js
 * Run this ONCE from your laptop to initialise the Supabase database.
 * It creates all tables then imports your local data in one step.
 *
 * Requirements: DATABASE_URL and DIRECT_URL must be set in your .env file.
 *
 * Usage:
 *   node scripts/setup-prod.js
 */

const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function main() {
  // ── Step 1: Apply migrations ──────────────────────────────────────────────
  console.log("📦 Step 1/2 — Applying database migrations to Supabase...");
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  } catch (err) {
    console.error("\n❌ Migration failed. Check that DATABASE_URL and DIRECT_URL are set correctly in your .env file.");
    process.exit(1);
  }
  console.log("   ✓ All tables created\n");

  // ── Step 2: Import local data ─────────────────────────────────────────────
  const dataPath = path.join(__dirname, "../prisma/local-data.json");
  if (!fs.existsSync(dataPath)) {
    console.log("⚠️  No local-data.json found — skipping data import.");
    console.log("   Your database tables are ready. Add data via the live app.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log("📥 Step 2/2 — Importing your local data into Supabase...");

  const prisma = new PrismaClient();

  try {
    for (const src of data.sources) {
      await prisma.incomeSource.upsert({
        where: { id: src.id },
        update: { name: src.name, isDefault: src.isDefault },
        create: src,
      });
    }
    console.log(`   ✓ ${data.sources.length} income sources`);

    for (const cat of data.categories) {
      await prisma.expenseCategory.upsert({
        where: { id: cat.id },
        update: { name: cat.name, isDefault: cat.isDefault },
        create: cat,
      });
    }
    console.log(`   ✓ ${data.categories.length} categories`);

    for (const inc of data.income) {
      await prisma.income.upsert({
        where: { id: inc.id },
        update: { amount: inc.amount, date: inc.date, notes: inc.notes, sourceId: inc.sourceId },
        create: inc,
      });
    }
    console.log(`   ✓ ${data.income.length} income entries`);

    for (const exp of data.expenses) {
      await prisma.expense.upsert({
        where: { id: exp.id },
        update: { amount: exp.amount, date: exp.date, notes: exp.notes, categoryId: exp.categoryId, isHubbyBorrow: exp.isHubbyBorrow },
        create: { id: exp.id, amount: exp.amount, date: exp.date, notes: exp.notes, categoryId: exp.categoryId, isHubbyBorrow: exp.isHubbyBorrow, createdAt: exp.createdAt, updatedAt: exp.updatedAt },
      });
    }
    console.log(`   ✓ ${data.expenses.length} expenses`);

    for (const li of data.lineItems) {
      await prisma.expenseLineItem.upsert({
        where: { id: li.id },
        update: { description: li.description, amount: li.amount },
        create: li,
      });
    }
    console.log(`   ✓ ${data.lineItems.length} line items`);

    for (const hb of data.hubbyBorrows) {
      await prisma.hubbyBorrow.upsert({
        where: { id: hb.id },
        update: { description: hb.description, totalAmount: hb.totalAmount, paidAmount: hb.paidAmount, status: hb.status },
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
      await prisma.appSettings.upsert({
        where: { id: s.id },
        update: { appName: s.appName, currency: s.currency, currencySymbol: s.currencySymbol },
        create: s,
      });
    }
    console.log(`   ✓ App settings`);

    console.log("\n✅ Production database is ready. Your live app should work now.");
  } catch (err) {
    console.error("\n❌ Data import failed:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
