/**
 * Database Seed Script
 * ---------------------
 * Run with: npm run db:seed
 *
 * This script:
 *  1. Creates the 3 default funding sources
 *  2. Adds sample expense data so you can see the app in action right away
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Step 1: Create default funding sources ──────────────────────────────
  // upsert = create if not exists, update if exists (safe to run multiple times)
  const personal = await prisma.fundingSource.upsert({
    where: { name: "Personal" },
    update: {},
    create: { name: "Personal", isDefault: true },
  });

  const house = await prisma.fundingSource.upsert({
    where: { name: "House" },
    update: {},
    create: { name: "House", isDefault: true },
  });

  const loanFromHubby = await prisma.fundingSource.upsert({
    where: { name: "Loan from Hubby" },
    update: {},
    create: { name: "Loan from Hubby", isDefault: true },
  });

  console.log("✅ Funding sources created:", { personal, house, loanFromHubby });

  // ── Step 2: Add sample expenses ─────────────────────────────────────────
  // This gives you real data to explore the app with

  const sampleExpenses = [
    // Normal personal expense
    {
      date: new Date("2024-01-05"),
      title: "Grocery Run",
      category: "Food & Groceries",
      amount: 87.5,
      fundingSourceId: personal.id,
      fundsType: "MINE",
      expenseFor: "ME",
      notes: "Weekly groceries from Walmart",
    },
    // Household expense
    {
      date: new Date("2024-01-08"),
      title: "Electricity Bill",
      category: "Utilities",
      amount: 120.0,
      fundingSourceId: house.id,
      fundsType: "MINE",
      expenseFor: "HOUSEHOLD",
      notes: "January electricity",
    },
    // Borrowed money — outstanding
    {
      date: new Date("2024-01-12"),
      title: "Car Repair",
      category: "Transport",
      amount: 350.0,
      fundingSourceId: loanFromHubby.id,
      fundsType: "BORROWED",
      expenseFor: "ME",
      borrowedStatus: "OUTSTANDING",
      notes: "Borrowed from hubby to fix car brakes",
    },
    // Borrowed money — already repaid
    {
      date: new Date("2024-01-03"),
      title: "Doctor Visit",
      category: "Healthcare",
      amount: 65.0,
      fundingSourceId: loanFromHubby.id,
      fundsType: "BORROWED",
      expenseFor: "ME",
      borrowedStatus: "REPAID",
      repaidDate: new Date("2024-01-20"),
      notes: "GP consultation, repaid hubby from next paycheck",
    },
    // Hubby owes me — outstanding
    {
      date: new Date("2024-01-15"),
      title: "Hubby's Gym Membership",
      category: "Health & Fitness",
      amount: 45.0,
      fundingSourceId: personal.id,
      fundsType: "MINE",
      expenseFor: "HUBBY",
      reimbursementStatus: "OWES_ME",
      notes: "Paid his gym renewal — he needs to pay me back",
    },
    // Hubby owes me — already paid back
    {
      date: new Date("2024-01-10"),
      title: "Hubby's Lunch",
      category: "Dining Out",
      amount: 28.0,
      fundingSourceId: personal.id,
      fundsType: "MINE",
      expenseFor: "HUBBY",
      reimbursementStatus: "PAID_BACK",
      reimbursementDate: new Date("2024-01-18"),
      notes: "Paid for his work lunch, he paid me back",
    },
    // Expense that is BOTH borrowed and for hubby
    {
      date: new Date("2024-01-20"),
      title: "Hubby's Prescription",
      category: "Healthcare",
      amount: 35.0,
      fundingSourceId: loanFromHubby.id,
      fundsType: "BORROWED",
      expenseFor: "HUBBY",
      borrowedStatus: "OUTSTANDING",
      reimbursementStatus: "OWES_ME",
      notes: "Used borrowed money to pay for his meds — he owes me AND I need to repay loan",
    },
    // Regular shopping
    {
      date: new Date("2024-02-02"),
      title: "New Running Shoes",
      category: "Shopping",
      amount: 95.0,
      fundingSourceId: personal.id,
      fundsType: "MINE",
      expenseFor: "ME",
      notes: "On sale at Nike",
    },
    // Household maintenance
    {
      date: new Date("2024-02-05"),
      title: "Plumber Call-out",
      category: "Home & Maintenance",
      amount: 180.0,
      fundingSourceId: house.id,
      fundsType: "MINE",
      expenseFor: "HOUSEHOLD",
      notes: "Fixed leaking pipe under kitchen sink",
    },
    // Another outstanding borrowed
    {
      date: new Date("2024-02-10"),
      title: "Emergency Vet Visit",
      category: "Pets",
      amount: 220.0,
      fundingSourceId: loanFromHubby.id,
      fundsType: "BORROWED",
      expenseFor: "ME",
      borrowedStatus: "OUTSTANDING",
      notes: "Cat needed urgent care — borrowed from hubby",
    },
  ];

  // Delete existing sample expenses before re-seeding
  // (comment this out if you want to keep your real data)
  await prisma.expense.deleteMany({});

  for (const expense of sampleExpenses) {
    await prisma.expense.create({ data: expense });
  }

  console.log(`✅ Created ${sampleExpenses.length} sample expenses`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
