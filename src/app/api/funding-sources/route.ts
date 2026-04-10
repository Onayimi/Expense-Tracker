import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Backward-compat alias for /api/income-sources
export async function GET() {
  const sources = await prisma.incomeSource.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(sources);
}
