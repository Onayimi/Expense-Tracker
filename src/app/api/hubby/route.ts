import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const borrows = await prisma.hubbyBorrow.findMany({
      include: {
        expense: { include: { category: true, lineItems: true } },
        repayments: { orderBy: { date: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(borrows);
  } catch (err) {
    console.error("[hubby GET]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
