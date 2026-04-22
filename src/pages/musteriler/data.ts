export interface CustomerRow {
  id: string;
  company: string;
  customerType: string;
  contactPerson: string;
  contactInfo: string;
  address: string;
  country: string;
  manager: string;
  creditLimit: string;
  daysSinceLastContact: number;
  orderCount: number;
  salesGroup: string;
}

export const MOCK_ROWS: CustomerRow[] = [
  {
    id: "1",
    company: "ICP",
    customerType: "Yeni müştəri",
    contactPerson: "Nicat Namazov",
    contactInfo: "+994 50 285 75 58",
    address: "Bakı",
    country: "AZ",
    manager: "Ulvi Azizov",
    creditLimit: "102",
    daysSinceLastContact: 0,
    orderCount: 0,
    salesGroup: "Bilikis",
  },
  {
    id: "2",
    company: "AB TRADELOGIES SHIPPING LLC",
    customerType: "Yeni müştəri",
    contactPerson: "SINDU",
    contactInfo: "+971 52 392 20 04",
    address: "United Arab Emirates",
    country: "BƏƏ",
    manager: "Töhmino Askin",
    creditLimit: "13",
    daysSinceLastContact: 18,
    orderCount: 0,
    salesGroup: "Status yoxdur",
  },
  {
    id: "3",
    company: "Aduratte",
    customerType: "Daimi müştəri",
    contactPerson: "Fazil İsmayılzadə",
    contactInfo: "+994 55 409 87 61",
    address: "H.Əliyev küç 82 F, Bakı",
    country: "Azərbaycan",
    manager: "Ulvi Azizov",
    creditLimit: "140",
    daysSinceLastContact: 14,
    orderCount: 4,
    salesGroup: "Status yoxdur",
  },
];

