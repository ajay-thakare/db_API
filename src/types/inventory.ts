export interface InventoryResult {
  id: number;
  name: string;
  city: string;
  inventory: {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    item_value: number;
  }[];
  total_value: number;
}
