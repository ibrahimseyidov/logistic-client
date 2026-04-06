export type ReysTransportMode = "auto" | "rail" | "sea" | "air" | "own" | "all";

export type ReysFilterSectionId =
  | "id"
  | "dates"
  | "orders"
  | "carriers"
  | "route"
  | "other"
  | "sort"
  | "statuses"
  | "templates";

export type ReysTripStatusKind = "planned" | "progress" | "completed";

export interface ReysRow {
  id: string;
  orderRef: string;
  orderDate: string;
  /** YYYY-MM-DD — filtr üçün */
  orderDateIso: string;
  tripDateIso: string;
  tripRef: string;
  tripStatus: string;
  tripStatusKind: ReysTripStatusKind;
  customer: string;
  tripPrice: string;
  carrier: string;
  vehicleInfo: string;
  cargoInfo: string;
  loadDate: string;
  sender: string;
  loading: string;
  unloadDate: string;
  receiver: string;
  unloading: string;
  tags: string;
  company: string;
  transportMode: ReysTransportMode;
  valueAzn: number;
}

export interface ReysFilterFormState {
  tripNumber: string;
  company: string;
  orderDateFrom: string;
  orderDateTo: string;
  tripDateFrom: string;
  tripDateTo: string;
}

export const emptyReysFilter = (): ReysFilterFormState => ({
  tripNumber: "",
  company: "",
  orderDateFrom: "",
  orderDateTo: "",
  tripDateFrom: "",
  tripDateTo: "",
});
