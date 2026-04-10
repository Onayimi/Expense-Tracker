import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const repayment = await prisma.repayment.findUnique({ where: { id: params.id } });
    if (!repayment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const borrow = await prisma.hubbyBorrow.findUnique({ where: { id: repayment.hubbyBorrowId } });
    if (!borrow) return NextResponse.json({ error: "Borrow not found" }, { status: 404 });

    const newPaid = Math.max(0, borrow.paidAmount - repayment.amount);
    const newStatus = newPaid <= 0 ? "OUTSTANDING" : newPaid < borrow.totalAmount ? "PARTIAL" : "PAID";

    await prisma.$transaction([
      prisma.repayment.delete({ where: { id: params.id } }),
      prisma.hubbyBorrow.update({
        where: { id: repayment.hubbyBorrowId },
        data: { paidAmount: newPaid, status: newStatus },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[repayments DELETE]", err);
    return NextResponse.json({ error: "Failed to delete repayment" }, { status: 500 });
  }
}
