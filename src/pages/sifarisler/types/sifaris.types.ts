export type SifarisSubTab = "orders" | "loads" | "voyages" | "payroll";

export type OrderStatusKind = "planned" | "progress" | "completed" | "finance_closed" | "cancelled";

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

export interface StatusHistoryItem {
  status: string;
  date: string;
}

export interface SifarisOrderRow {
  id: string;
  orderNumber: string;
  queryNumber: string;
  queryDate: string;
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
  statusHistory?: StatusHistoryItem[];
  hasSentInvoice?: boolean;
  hasReceivedInvoice?: boolean;
  hasTransportDoc?: boolean;
  hasHandoverAct?: boolean;

  // Edit Modal extra fields
  tags?: string;
  contractNumber?: string;
  contactPerson?: string;
  manager?: string;
  expeditor?: string;
  extraManagers?: string;
  extraInfo?: string;
  serviceName?: string;
  vatRate?: string;
  freightWithVat?: string;
  currency?: string;
  exchangeRateDate?: string;
  paymentTerms?: string;
  paymentDelayDays?: string;
  incoterms?: string;
}

export interface SifarisFilterFormState {
  // ID
  orderNumber: string;
  status: string;
  company: string;
  customerOrderRef: string;
  tags: string;

  // Tarixlər
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
  week: string;
  year: string;
  statusAssignedFrom: string;
  statusAssignedTo: string;

  // Müştərilər
  customerType: string;
  customerName: string;
  showDuplicates: string;
  activityType: string;

  // Yüklər
  loadPlace: string;
  loadCountry: string;
  loadPostalCode: string;
  loadRegion: string;
  loadCity: string;
  loadAddress: string;
  loadDateFrom: string;
  loadDateTo: string;
  loadSender: string;
  unloadPlace: string;
  unloadCountry: string;
  unloadPostalCode: string;
  unloadRegion: string;
  unloadCity: string;
  unloadAddress: string;
  unloadDateFrom: string;
  unloadDateTo: string;
  unloadReceiver: string;
  cargoType: string;
  cargoName: string;
  containerNumber: string;
  cargoNumber: string;
  loadVoyage: string;
  loadSender2: string;
  loadReceiver2: string;

  // Reyslər
  voyageLoadPlace: string;
  voyageLoadCountry: string;
  voyageLoadPostalCode: string;
  voyageLoadRegion: string;
  voyageLoadCity: string;
  voyageLoadAddress: string;
  voyageLoadDateFrom: string;
  voyageLoadDateTo: string;
  voyageUnloadPlace: string;
  voyageUnloadCountry: string;
  voyageUnloadPostalCode: string;
  voyageUnloadRegion: string;
  voyageUnloadCity: string;
  voyageUnloadAddress: string;
  voyageUnloadDateFrom: string;
  voyageUnloadDateTo: string;

  // İstifadəçilər
  manager: string;
  department: string;
  voyageExpeditor: string;
  orderForwarder: string;
  extraManagers: string;

  // Sənədlər
  receivedInvoices: string;
  noDoubleInvoices: boolean;
  noPreliminaryInvoices: boolean;
  paidWithSentInvoice: string;
  paidWithReceivedInvoice: string;
  invoiceNumber: string;
  ourReferenceNumber: string;
  hasAct: string;
  cmrBase: string;
  cmrNumber: string;

  // Nəqliyyat
  carrier: string;
  carrierSystemNumber: string;
  transportType: string;
  transportPlate: string;
  driver: string;

  // Digəri
  currency: string;
  terms: string;
  billOfLading: string;
  incoterms: string;
  orderExpenses: string;

  // Çeşidləmə
  sortBy: string;
  sortOrder: string;

  // Şablonlar
  templateName: string;
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
  week: "",
  year: "",
  statusAssignedFrom: "",
  statusAssignedTo: "",
  customerType: "",
  showDuplicates: "",
  activityType: "",
  loadPlace: "",
  loadCountry: "",
  loadPostalCode: "",
  loadRegion: "",
  loadCity: "",
  loadAddress: "",
  loadDateFrom: "",
  loadDateTo: "",
  loadSender: "",
  unloadPlace: "",
  unloadCountry: "",
  unloadPostalCode: "",
  unloadRegion: "",
  unloadCity: "",
  unloadAddress: "",
  unloadDateFrom: "",
  unloadDateTo: "",
  unloadReceiver: "",
  cargoType: "",
  cargoName: "",
  containerNumber: "",
  cargoNumber: "",
  loadVoyage: "",
  loadSender2: "",
  loadReceiver2: "",
  voyageLoadPlace: "",
  voyageLoadCountry: "",
  voyageLoadPostalCode: "",
  voyageLoadRegion: "",
  voyageLoadCity: "",
  voyageLoadAddress: "",
  voyageLoadDateFrom: "",
  voyageLoadDateTo: "",
  voyageUnloadPlace: "",
  voyageUnloadCountry: "",
  voyageUnloadPostalCode: "",
  voyageUnloadRegion: "",
  voyageUnloadCity: "",
  voyageUnloadAddress: "",
  voyageUnloadDateFrom: "",
  voyageUnloadDateTo: "",
  manager: "",
  department: "",
  voyageExpeditor: "",
  orderForwarder: "",
  extraManagers: "",
  receivedInvoices: "",
  noDoubleInvoices: false,
  noPreliminaryInvoices: false,
  paidWithSentInvoice: "",
  paidWithReceivedInvoice: "",
  invoiceNumber: "",
  ourReferenceNumber: "",
  hasAct: "",
  cmrBase: "",
  cmrNumber: "",
  carrier: "",
  carrierSystemNumber: "",
  transportType: "",
  transportPlate: "",
  driver: "",
  currency: "",
  terms: "",
  billOfLading: "",
  incoterms: "",
  orderExpenses: "",
  sortBy: "",
  sortOrder: "",
  templateName: "",
});
