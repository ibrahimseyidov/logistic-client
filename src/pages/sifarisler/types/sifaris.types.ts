export type SifarisSubTab = "orders" | "loads" | "voyages" | "payroll";

export type OrderStatusKind = "planned" | "progress" | "completed";

export type SifarisFilterSectionId =
  | "id"
  | "dates"
  | "customers"
  | "loads"
  | "voyages"
  | "users"
  | "documents"
  | "transport"
  | "other"
  | "sort"
  | "templates";

export interface SifarisOrderRow {
  id: string;
  orderNumber: string;
  orderDate: string;
  actCreatedAt: string;
  actDate: string;
  cmrUnloadDate: string;
  invoicedDate: string;
  statusKind: OrderStatusKind;
  statusLabel: string;
  customer: string;
  customerRefs: string;
  customerOrderRef: string;
  carriers: string;
  voyageNumber: string;
  route: string;
  cargoParams: string;
  freight: string;
  extraCosts: string;
  profit: string;
  documents: string;
  company: string;
  weightKg: number;
  volumeM3: number;
  ldm: number;
  freightAzn: number;
  profitAzn: number;
}

export interface SifarisFilterFormState {
  orderNumber: string;
  status: string;
  company: string;
  customerOrderRef: string;
  tags: string;
  customerName: string;
  orderDateFrom: string;
  orderDateTo: string;
  actCreatedFrom: string;
  actCreatedTo: string;
  actDateFrom: string;
  actDateTo: string;
  cmrUnloadFrom: string;
  cmrUnloadTo: string;
  invoicedFrom: string;
  invoicedTo: string;
}

export const emptySifarisFilter = (): SifarisFilterFormState => ({
  orderNumber: "",
  status: "",
  company: "",
  customerOrderRef: "",
  tags: "",
  customerName: "",
  orderDateFrom: "",
  orderDateTo: "",
  actCreatedFrom: "",
  actCreatedTo: "",
  actDateFrom: "",
  actDateTo: "",
  cmrUnloadFrom: "",
  cmrUnloadTo: "",
  invoicedFrom: "",
  invoicedTo: "",
});
