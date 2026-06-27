import type { CarrierDocumentItem } from "../../common/utils/carrierDisplay.utils";

export interface CarrierRow {
  id: string;
  company: string;
  carrierType: string;
  contactPerson: string;
  contactInfo: string;
  address: string;
  country: string;
  lastActivityDate: string | null;
  daysSinceLastContact: number;
  orderCount: number;
  queriesCount: number;
  salesGroup: string;
  documents?: CarrierDocumentItem[];
}

export const MOCK_ROWS: CarrierRow[] = [
  {
    id: "1",
    company: "ICP",
    carrierType: "Yeni daşıyıcı",
    contactPerson: "Nicat Namazov",
    contactInfo: "+994 50 285 75 58",
    address: "Bakı",
    country: "AZ",
    lastActivityDate: null,
    daysSinceLastContact: 0,
    orderCount: 0,
    queriesCount: 0,
    salesGroup: "Bilikis",
  },
  {
    id: "2",
    company: "AB TRADELOGIES SHIPPING LLC",
    carrierType: "Yeni daşıyıcı",
    contactPerson: "SINDU",
    contactInfo: "+971 52 392 20 04",
    address: "United Arab Emirates",
    country: "BƏƏ",
    lastActivityDate: null,
    daysSinceLastContact: 18,
    orderCount: 0,
    queriesCount: 0,
    salesGroup: "Status yoxdur",
  },
  {
    id: "3",
    company: "Aduratte",
    carrierType: "Daimi daşıyıcı",
    contactPerson: "Fazil İsmayılzadə",
    contactInfo: "+994 55 409 87 61",
    address: "H.Əliyev küç 82 F, Bakı",
    country: "Azərbaycan",
    lastActivityDate: null,
    daysSinceLastContact: 14,
    orderCount: 4,
    queriesCount: 0,
    salesGroup: "Status yoxdur",
  },
];

