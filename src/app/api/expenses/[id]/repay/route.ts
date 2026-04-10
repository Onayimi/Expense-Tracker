export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ error: "Deprecated — use /api/repayments instead" }, { status: 410 }); }
