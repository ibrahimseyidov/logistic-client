export enum SorguStatus {
  Pending = "pending",
  Cancelled = "cancelled",
  Completed = "completed",
  Approved = "approved",
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
  priceOffersJson?: string;
  priceOfferItems?: any[];
  confirmed: boolean;
  archived: boolean;
  contactPerson: string;
  customerFirstName?: string;
  customerFirstname?: string;
  firstName?: string;
  customerLastName?: string;
  customerLastname?: string;
  lastName?: string;
  loadCity?: string;
  loadAddress?: string;
  loadCountry?: string;
  unloadCity?: string;
  unloadAddress?: string;
  unloadCountry?: string;
  cargoItems?: any[]; // API'den gelen yükler
  comments?: any[];
  documents?: any[];
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
