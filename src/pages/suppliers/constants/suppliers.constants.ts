import type { SupplierFormState } from "../types/form.types";

export const EMPTY_SUPPLIER_FORM: SupplierFormState = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  taxNumber: "",
  status: "active",
};

export const ITEMS_PER_PAGE = 50;

export const VALID_STOCK_UNITS = ["adet", "kg", "litre"] as const;
