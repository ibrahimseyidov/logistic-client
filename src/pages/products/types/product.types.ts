import type { Category } from "./category.types";

export interface Product {
  id: number;
  name: string;
  barcode: string;
  stockQuantity: number;
  branchStockQuantity?: number | null;
  companyStockQuantity?: number | null;
  stockUnit: string;
  description?: string | null;
  salePrice: number;
  purchasePrice?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  parentCategoryId: number;
  subCategoryId?: number | null;
  parentCategory?: Category | null;
  subCategory?: Category | null;
}
