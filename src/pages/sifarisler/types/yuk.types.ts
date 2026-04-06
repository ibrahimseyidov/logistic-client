export type YukFilterSectionId =
  | "id"
  | "counterparties"
  | "loading"
  | "reload"
  | "unloading"
  | "cargo_statuses"
  | "loads"
  | "orders"
  | "sort"
  | "templates";

export interface YukLoadRow {
  id: string;
  orderRef: string;
  company: string;
  customer: string;
  loadDate: string;
  unloadDate: string;
  sender: string;
  loadPlace: string;
  recipient: string;
  unloadPlace: string;
  cargoStatus: string;
  place: string;
  entryDate: string;
  entryTime: string;
  comments: string;
  cargoNumber: string;
  cargoName: string;
  cargoParams: string;
  attributes: string;
  carrier: string;
  tripId: string;
  ldm: number;
  weightKg: number;
  volumeM3: number;
  userLabel: string;
}

export interface YukFilterFormState {
  userId: string;
  company: string;
}

export const emptyYukFilter = (): YukFilterFormState => ({
  userId: "",
  company: "",
});
