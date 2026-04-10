import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({ where: { id: "1" } });
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: "1", appName: "Vela", currency: "USD", currencySymbol: "$" },
      });
    }
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[settings GET]", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { appName, currency, currencySymbol } = body;
    const settings = await prisma.appSettings.upsert({
      where: { id: "1" },
      update: { appName, currency, currencySymbol },
      create: { id: "1", appName, currency, currencySymbol },
    });
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[settings PUT]", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
