import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      allIncomeAgg,
      allExpensesAgg,
      allHubbyBorrows,
      thisMonthIncomeAgg,
      thisMonthExpensesAgg,
      recentIncome,
      recentExpenses,
      pendingHubbyBorrows,
      categoryBreakdown,
    ] = await Promise.all([
      prisma.income.aggregate({ _sum: { amount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.hubbyBorrow.findMany({ select: { totalAmount: true, paidAmount: true } }),
      prisma.income.aggregate({
        _sum: { amount: true },
        where: { date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.income.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { source: true },
      }),
      prisma.expense.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { category: true, lineItems: true, hubbyBorrow: { include: { repayments: true } } },
      }),
      prisma.hubbyBorrow.findMany({
        where: { status: { in: ["OUTSTANDING", "PARTIAL"] } },
        include: {
          expense: { include: { category: true, lineItems: true } },
          repayments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        _sum: { amount: true },
        _count: { id: true },
        where: { date: { gte: monthStart, lte: monthEnd } },
        orderBy: { _sum: { amount: "desc" } },
      }),
    ]);

    const categoryIds = categoryBreakdown.map((c) => c.categoryId);
    const categories = categoryIds.length
      ? await prisma.expenseCategory.findMany({ where: { id: { in: categoryIds } } })
      : [];
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    const totalIncome = allIncomeAgg._sum.amount ?? 0;
    const totalExpenses = allExpensesAgg._sum.amount ?? 0;
    const totalHubbyBorrowed = allHubbyBorrows.reduce((s, h) => s + h.totalAmount, 0);
    const totalRepaid = allHubbyBorrows.reduce((s, h) => s + h.paidAmount, 0);
    const outstandingHubbyBalance = totalHubbyBorrowed - totalRepaid;
    // Balance = Income - All expenses (including hubby borrows which left your hands)
    //         + Repayments received back from hubby
    const availableBalance = totalIncome - totalExpenses + totalRepaid;

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      totalHubbyBorrowed,
      totalRepaid,
      availableBalance,
      outstandingHubbyBalance,
      thisMonthIncome: thisMonthIncomeAgg._sum.amount ?? 0,
      thisMonthExpenses: thisMonthExpensesAgg._sum.amount ?? 0,
      recentIncome,
      recentExpenses,
      pendingHubbyBorrows,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: catMap[c.categoryId] ?? "Unknown",
        total: c._sum.amount ?? 0,
        count: c._count.id,
      })),
    });
  } catch (err) {
    console.error("[dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
