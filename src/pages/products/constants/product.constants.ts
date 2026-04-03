import type { ProductFormState } from "../types/form.types";

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: "",
  parentCategoryId: "",
  categoryLevel2Id: "",
  categoryLevel3Id: "",
  categoryLevel4Id: "",
  barcode: "",
  stockQuantity: "0",
  stockUnit: "adet",
  salePrice: "",
  purchasePrice: "",
  imageUrl: "",
  isActive: true,
  description: "",
  companyId: "",
};

export const ITEMS_PER_PAGE = 50;

export const VALID_STOCK_UNITS = ["adet", "kg", "litre"] as const;
