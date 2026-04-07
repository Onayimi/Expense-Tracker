/**
 * API Route: /api/funding-sources
 * ---------------------------------
 * GET  — Returns all funding sources (used to populate the dropdown in the form)
 * POST — Creates a new custom funding source
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/funding-sources
export async function GET() {
  try {
    const sources = await prisma.fundingSource.findMany({
      orderBy: [
        { isDefault: "desc" }, // Show default sources first
        { name: "asc" },
      ],
    });
    return NextResponse.json(sources);
  } catch (error) {
    console.error("Failed to fetch funding sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch funding sources" },
      { status: 500 }
    );
  }
}

// POST /api/funding-sources
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || String(name).trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const source = await prisma.fundingSource.create({
      data: {
        name: String(name).trim(),
        isDefault: false, // Custom sources are never marked as default
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error: unknown) {
    // Handle unique constraint violation (duplicate name)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A funding source with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Failed to create funding source:", error);
    return NextResponse.json(
      { error: "Failed to create funding source" },
      { status: 500 }
    );
  }
}
