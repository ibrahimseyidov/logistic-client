export enum SorguStatus {
  Pending = "pending",
  Cancelled = "cancelled",
  Completed = "completed",
}
export type SorguSubTab = "active" | "archive" | "offers";

export type FilterSectionId =
  | "id"
  | "dates"
  | "customers"
  | "directions"
  | "transport"
  | "loads"
  | "users"
  | "other"
  | "sort"
  | "templates";

export interface LogisticQueryRow {
  id: string;
  number: string;
  customerOrderRef: string;
  status: SorguStatus;
  statusAssignedAt: string;
  purpose: string;
  createdAt: string;
  transportType: string;
  cargoInfo: string;
  sender: string;
  loadPlace: string;
  recipient: string;
  unloadPlace: string;
  loadDate: string;
  unloadDate: string;
  customer: string;
  company: string;
  seller: string;
  priceOffers: string;
  confirmed: boolean;
  archived: boolean;
  contactPerson: string;
  cargoItems?: any[]; // API'den gelen yükler
}

export interface FilterFormState {
  queryNumber: string;
  customerOrderRef: string;
  company: string;
  queryDateFrom: string;
  queryDateTo: string;
  loadDateFrom: string;
  loadDateTo: string;
  unloadDateFrom: string;
  unloadDateTo: string;
  statusDateFrom: string;
  statusDateTo: string;
  customerName: string;
  loadPlace: string;
  unloadPlace: string;
}

export const emptyFilterForm = (): FilterFormState => ({
  queryNumber: "",
  customerOrderRef: "",
  company: "",
  queryDateFrom: "",
  queryDateTo: "",
  loadDateFrom: "",
  loadDateTo: "",
  unloadDateFrom: "",
  unloadDateTo: "",
  statusDateFrom: "",
  statusDateTo: "",
  customerName: "",
  loadPlace: "",
  unloadPlace: "",
});
