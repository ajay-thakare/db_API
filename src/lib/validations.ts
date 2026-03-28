import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(2, "Name is required"),
  city: z.string().min(2, "City is required"),
});

export const inventorySchema = z.object({
  supplier_id: z
    .number()
    .int()
    .positive("supplier_id must be a positive integer"),
  product_name: z.string().min(2, "Product name is required"),
  quantity: z.number().int().min(0, "Quantity must be ≥ 0"),
  price: z.number().positive("Price must be > 0"),
});
