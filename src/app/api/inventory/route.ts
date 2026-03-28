import prisma from "@/lib/db";
import { inventorySchema } from "@/lib/validations";
import { InventoryResult } from "@/types/inventory";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inventorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: parsed.data.supplier_id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 },
      );
    }

    const item = await prisma.inventory.create({
      data: parsed.data,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const results = await prisma.$queryRaw<InventoryResult[]>`
        SELECT
            s.id,
            s.name,
            s.city,
            json_agg(
                json_build_object(
                    'id',           i.id,
                    'product_name', i.product_name,
                    'quantity',     i.quantity,
                    'price',        i.price,
                    'item_value',   i.quantity * i.price
                )
                ORDER BY i.product_name
            )   AS inventory,
            SUM(i.quantity * i.price) AS total_value
        FROM "Supplier" s
        JOIN "Inventory" i ON i.supplier_id = s.id
        GROUP BY s.id, s.name, s.city
        ORDER BY total_value DESC
        `;

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
