import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Vela database...");

  // ── App Settings ──────────────────────────────────────────────────────────
  await prisma.appSettings.upsert({
    where: { id: "1" },
    update: {},
    create: { id: "1", appName: "Vela", currency: "USD", currencySymbol: "$" },
  });

  // ── Income Sources ────────────────────────────────────────────────────────
  const sourceNames = [
    "Salary", "Rent Received", "Child Care Benefit",
    "Hubby", "Refund", "Gift", "Other",
  ];
  const sources: Record<string, string> = {};
  for (const name of sourceNames) {
    const s = await prisma.incomeSource.upsert({
      where: { name },
      update: {},
      create: { name, isDefault: true },
    });
    sources[name] = s.id;
  }

  // ── Expense Categories ────────────────────────────────────────────────────
  const categoryNames = [
    "Groceries", "Transport", "Rent", "Utilities", "Kids",
    "Child Care", "Shopping", "Health", "Eating Out", "Personal Care",
    "Gifts", "Household", "Entertainment", "Savings", "Miscellaneous",
  ];
  const cats: Record<string, string> = {};
  for (const name of categoryNames) {
    const c = await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name, isDefault: true },
    });
    cats[name] = c.id;
  }

  // ── Sample Income ──────────────────────────────────────────────────────────
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  await prisma.income.deleteMany({});
  await prisma.income.createMany({
    data: [
      {
        amount: 3200,
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1),
        notes: "April salary",
        sourceId: sources["Salary"],
      },
      {
        amount: 850,
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 5),
        notes: "Monthly rent from tenant",
        sourceId: sources["Rent Received"],
      },
      {
        amount: 600,
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 7),
        notes: "Government child care benefit",
        sourceId: sources["Child Care Benefit"],
      },
      {
        amount: 3200,
        date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
        notes: "March salary",
        sourceId: sources["Salary"],
      },
      {
        amount: 850,
        date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
        notes: "Rent from tenant",
        sourceId: sources["Rent Received"],
      },
    ],
  });

  // ── Sample Expenses ────────────────────────────────────────────────────────
  await prisma.expense.deleteMany({});

  const exp1 = await prisma.expense.create({
    data: {
      amount: 124.50,
      date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 3),
      notes: "Weekly shop",
      categoryId: cats["Groceries"],
      isHubbyBorrow: false,
      lineItems: {
        create: [
          { description: "Oranges", amount: 5 },
          { description: "Bread (x3)", amount: 8 },
          { description: "Milk", amount: 6 },
          { description: "Chicken", amount: 18 },
          { description: "Vegetables", amount: 22 },
          { description: "Snacks & treats", amount: 14.50 },
          { description: "Cleaning supplies", amount: 31 },
          { description: "Toiletries", amount: 20 },
        ],
      },
    },
  });

  const exp2 = await prisma.expense.create({
    data: {
      amount: 85,
      date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 6),
      notes: "Monthly bus passes",
      categoryId: cats["Transport"],
      isHubbyBorrow: false,
    },
  });

  const exp3 = await prisma.expense.create({
    data: {
      amount: 1200,
      date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1),
      notes: "April rent",
      categoryId: cats["Rent"],
      isHubbyBorrow: false,
    },
  });

  const exp4 = await prisma.expense.create({
    data: {
      amount: 45,
      date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 8),
      notes: "Dinner at Bella Vista",
      categoryId: cats["Eating Out"],
      isHubbyBorrow: false,
    },
  });

  // Hubby borrow — partially repaid
  const exp5 = await prisma.expense.create({
    data: {
      amount: 320,
      date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 4),
      notes: "New work shoes for hubby",
      categoryId: cats["Shopping"],
      isHubbyBorrow: true,
    },
  });
  const hubby1 = await prisma.hubbyBorrow.create({
    data: {
      expenseId: exp5.id,
      description: "Work shoes — hubby to repay",
      totalAmount: 320,
      paidAmount: 120,
      status: "PARTIAL",
    },
  });
  await prisma.repayment.create({
    data: {
      hubbyBorrowId: hubby1.id,
      amount: 120,
      date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 10),
      notes: "First installment",
    },
  });

  // Hubby borrow — fully repaid
  const exp6 = await prisma.expense.create({
    data: {
      amount: 75,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15),
      notes: "Hubby doctor visit",
      categoryId: cats["Health"],
      isHubbyBorrow: true,
    },
  });
  const hubby2 = await prisma.hubbyBorrow.create({
    data: {
      expenseId: exp6.id,
      description: "GP visit for hubby",
      totalAmount: 75,
      paidAmount: 75,
      status: "PAID",
    },
  });
  await prisma.repayment.create({
    data: {
      hubbyBorrowId: hubby2.id,
      amount: 75,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 20),
      notes: "Paid in full",
    },
  });

  // Hubby borrow — outstanding
  const exp7 = await prisma.expense.create({
    data: {
      amount: 180,
      date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 9),
      notes: "Annual subscription renewal",
      categoryId: cats["Entertainment"],
      isHubbyBorrow: true,
    },
  });
  await prisma.hubbyBorrow.create({
    data: {
      expenseId: exp7.id,
      description: "Streaming + software renewals",
      totalAmount: 180,
      paidAmount: 0,
      status: "OUTSTANDING",
    },
  });

  // Last month expenses
  await prisma.expense.createMany({
    data: [
      {
        amount: 98.20,
        date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 8),
        notes: "Supermarket run",
        categoryId: cats["Groceries"],
        isHubbyBorrow: false,
      },
      {
        amount: 1200,
        date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
        notes: "March rent",
        categoryId: cats["Rent"],
        isHubbyBorrow: false,
      },
      {
        amount: 112,
        date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
        notes: "Electricity & water",
        categoryId: cats["Utilities"],
        isHubbyBorrow: false,
      },
    ],
  });

  console.log("✅ Seeding complete — Vela is ready!");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
