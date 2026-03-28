# Zeerostock Inventory Database

A backend API for managing supplier inventory — built with Next.js, TypeScript, PostgreSQL, and Prisma.

## Setup

```bash
npm install
```

Add your database URL to `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zeerostock"
```

```bash
npx prisma migrate dev --name init
npm run dev
```

## Database Schema

Two tables with a one-to-many relationship:

**Supplier**
| Column | Type | Notes |
|---|---|---|
| id | Int | Primary key, auto-increment |
| name | String | Supplier name |
| city | String | City of operation |
| createdAt | DateTime | Auto-set on create |

**Inventory**
| Column | Type | Notes |
|---|---|---|
| id | Int | Primary key, auto-increment |
| supplier_id | Int | Foreign key → Supplier.id |
| product_name | String | Name of the product |
| quantity | Int | Must be ≥ 0 |
| price | Decimal(10,2) | Must be > 0 |
| createdAt | DateTime | Auto-set on create |

One supplier can have many inventory items. Deleting a supplier without removing their inventory is blocked at the database level via the foreign key constraint.

`price` is stored as `Decimal` not `Float` to avoid floating point rounding errors in financial data.

## API Reference

### `POST /api/supplier`

Create a new supplier.

**Request body:**

```json
{ "name": "Sharma Textiles", "city": "Surat" }
```

**Response `201`:**

```json
{ "id": 1, "name": "Sharma Textiles", "city": "Surat" }
```

---

### `POST /api/inventory`

Add an inventory item. Supplier must exist.

**Request body:**

```json
{
  "supplier_id": 1,
  "product_name": "Cotton Fabric Rolls",
  "quantity": 200,
  "price": 850
}
```

**Response `201`:**

```json
{
  "id": 1,
  "supplier_id": 1,
  "product_name": "Cotton Fabric Rolls",
  "quantity": 200,
  "price": 850
}
```

**Errors:**

- `400` — validation failed (quantity < 0, price ≤ 0, missing fields)
- `404` — supplier not found

---

### `GET /api/inventory`

Returns all inventory grouped by supplier, sorted by total inventory value (quantity × price) descending.

**Response `200`:**

```json
[
  {
    "id": 1,
    "name": "Sharma Textiles",
    "city": "Surat",
    "total_value": 230000,
    "inventory": [
      {
        "id": 1,
        "product_name": "Cotton Fabric Rolls",
        "quantity": 200,
        "price": 850,
        "item_value": 170000
      }
    ]
  }
]
```

## Testing

All APIs tested via Postman.

**Suppliers created:**

```json
{ "name": "Sharma Textiles",     "city": "Surat"  }
{ "name": "PackRight Industries", "city": "Pune"   }
{ "name": "BoltMaster Hardware",  "city": "Nashik" }
```

**Inventory added:**

```json
{ "supplier_id": 1, "product_name": "Cotton Fabric Rolls",     "quantity": 200,  "price": 850 }
{ "supplier_id": 1, "product_name": "Polyester Thread Spools", "quantity": 500,  "price": 120 }
{ "supplier_id": 2, "product_name": "Corrugated Boxes 12x10x8","quantity": 5000, "price": 45  }
{ "supplier_id": 2, "product_name": "Bubble Wrap Rolls",        "quantity": 300,  "price": 200 }
{ "supplier_id": 3, "product_name": "Hex Bolts M10",            "quantity": 10000,"price": 12  }
{ "supplier_id": 3, "product_name": "Steel Washers",            "quantity": 8000, "price": 5   }
```

**Edge cases verified:**
| Test | Expected | Result |
|---|---|---|
| `supplier_id: 999` (non-existent) | `404 Supplier not found` | ✅ |
| `quantity: -5` | `400` validation error | ✅ |
| `price: 0` | `400` validation error | ✅ |

## Why SQL over NoSQL

We chose SQL because our data is relational. Inventory items belong to suppliers, and PostgreSQL ensures this relationship with foreign key constraints. This means you can’t add an inventory item for a supplier that doesn’t exist.

With NoSQL like MongoDB, you would have to check this manually in code. For structured and consistent data like ours, SQL is the better choice.

## Indexing Optimization

An index is added on `inventory.supplier_id`:

```prisma
@@index([supplier_id])
```

The `GET /inventory` query joins the `suppliers` and `inventory` tables using a specific column (e.g., `supplier_id`).

- **Without the index**: PostgreSQL must scan every row in the `inventory` table to find matches. This is slow for large tables.
- **With the index**: PostgreSQL can directly jump to the relevant rows, making the query much faster, especially when there are thousands of inventory items.
