export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  status: "active" | "inactive";
  totalPurchase: number;
  totalReturn: number;
  totalPayment: number;
  totalMedaxil: number;
  totalMexaric: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormState {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  status: "active" | "inactive";
}
