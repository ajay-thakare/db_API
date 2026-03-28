import prisma from "@/lib/db";
import { supplierSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = supplierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }

    const supplier = await prisma.supplier.create({
      data: parsed.data,
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
