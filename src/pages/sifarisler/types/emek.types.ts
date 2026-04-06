export type EmekFilterSectionId =
  | "id"
  | "dates"
  | "customers"
  | "users"
  | "other"
  | "templates";

export interface EmekRow {
  id: string;
  kind: "order" | "voyage";
  orderNumber: string;
  orderDate: string;
  orderDateIso: string;
  orderStatus: string;
  customer: string;
  employee: string;
  employeeRequired: boolean;
  freight: string;
  expensesAzn: number;
  profitAzn: number;
  revenuePct: number;
  totalBonusAzn: number;
  bonusPct: number;
  rewardAmount: number;
  paidLabel: string;
  paymentDate: string;
  route: string;
  carrier: string;
  incompleteLoad: string;
  tripNumber: string;
  voyagePrice: string;
  accounts: string;
  amountAzn: number;
  paidAmountAzn: number;
  amountRed: boolean;
  paidAmountRed: boolean;
  company: string;
}

export interface EmekFilterFormState {
  company: string;
  orderNumber: string;
  tip: string;
  status: string;
  tripNumber: string;
  orderDateFrom: string;
  orderDateTo: string;
  actCreatedFrom: string;
  actCreatedTo: string;
  actDateFrom: string;
  actDateTo: string;
  loadDateFrom: string;
  loadDateTo: string;
  unloadDateFrom: string;
  unloadDateTo: string;
  invoicePaymentFrom: string;
  invoicePaymentTo: string;
  customer: string;
  carrier: string;
  customerType: string;
}

export const emptyEmekFilter = (): EmekFilterFormState => ({
  company: "",
  orderNumber: "",
  tip: "",
  status: "",
  tripNumber: "",
  orderDateFrom: "",
  orderDateTo: "",
  actCreatedFrom: "",
  actCreatedTo: "",
  actDateFrom: "",
  actDateTo: "",
  loadDateFrom: "",
  loadDateTo: "",
  unloadDateFrom: "",
  unloadDateTo: "",
  invoicePaymentFrom: "",
  invoicePaymentTo: "",
  customer: "",
  carrier: "",
  customerType: "",
});
