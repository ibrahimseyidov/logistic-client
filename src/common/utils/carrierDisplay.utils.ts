import type { ContactPersonRow } from "../actions/contact.actions";

export interface CarrierDocumentItem {
  id?: string;
  number: string;
  documentType?: string;
  date: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
}

export function serializeCarrierDocuments(documents: CarrierDocumentItem[]) {
  return documents.map(
    ({ id, number, documentType, date, fileName, fileUrl, fileType, fileSize }) => ({
      id,
      number,
      documentType,
      date,
      fileName,
      fileUrl,
      fileType,
      fileSize,
    }),
  );
}

export async function uploadPendingCarrierDocuments(
  documents: CarrierDocumentItem[],
  pendingFiles: Map<string, File>,
  uploadFile: (file: File) => Promise<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>,
): Promise<CarrierDocumentItem[]> {
  const uploaded: CarrierDocumentItem[] = [];

  for (const doc of documents) {
    const pendingFile = doc.id ? pendingFiles.get(doc.id) : undefined;
    if (pendingFile && !doc.fileUrl) {
      const meta = await uploadFile(pendingFile);
      uploaded.push({ ...doc, ...meta });
    } else {
      uploaded.push(doc);
    }
  }

  return uploaded;
}

export function displayFieldValue(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed === "Dəyəri seçin") return "-";
  return trimmed;
}

export function parseCarrierDocuments(raw: unknown): CarrierDocumentItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item: any, index) => ({
      id: String(item?.id ?? index),
      number: String(item?.number ?? ""),
      documentType: item?.documentType ? String(item.documentType) : undefined,
      date: String(item?.date ?? ""),
      fileName: item?.fileName ? String(item.fileName) : undefined,
      fileUrl: item?.fileUrl ? String(item.fileUrl) : undefined,
      fileType: item?.fileType ? String(item.fileType) : undefined,
      fileSize:
        typeof item?.fileSize === "number" ? item.fileSize : undefined,
    }));
  }
  if (typeof raw === "string") {
    try {
      return parseCarrierDocuments(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}

export function mapCarrierFromApi(c: any) {
  const contactPersons = Array.isArray(c.contactPersons)
    ? c.contactPersons
    : [];
  const documents = parseCarrierDocuments(c.documents ?? c.documentsJson);

  return {
    ...c,
    id: String(c.id),
    company: c.name || c.company || "-",
    voen: c.voen || c.taxNumber || "",
    phone: c.phone || "",
    contactPersons,
    documents,
    activityType: c.activityType || "",
    carrierType: c.carrierType || "",
    country: c.country || "AZ",
    address: c.address || "",
    manager: c.manager || "",
    creditLimit: c.creditLimit || "0",
    contactPerson: c.contactPerson || "",
  };
}

export function mapCustomerFromApi(c: any) {
  const contactPersons = Array.isArray(c.contactPersons) ? c.contactPersons : [];
  const documents = parseCarrierDocuments(c.documents ?? c.documentsJson);

  return {
    ...c,
    id: String(c.id),
    company: c.name || c.company || "-",
    voen: c.voen || c.taxNumber || "",
    phone: c.phone || "",
    contactPersons,
    documents,
    activityType: c.activityType || "",
    customerType: c.customerType || "",
    country: c.country || "AZ",
    address: c.address || "",
    manager: c.manager || "",
    creditLimit: c.creditLimit || "0",
    contactPerson: c.contactPerson || "",
  };
}

export function resolveManagerDisplayName(
  manager: string | number | null | undefined,
  users: Array<{ id: number | string; name: string }>,
): string {
  const raw = String(manager ?? "").trim();
  if (!raw) return "-";
  const byId = users.find((user) => String(user.id) === raw);
  if (byId?.name) return byId.name;
  return raw;
}

export function normalizeCarrierContacts(
  embedded: unknown,
  apiContacts: ContactPersonRow[] = [],
): ContactPersonRow[] {
  const merged = new Map<string, ContactPersonRow>();

  const addContact = (item: any) => {
    if (!item) return;
    if (typeof item === "string" || typeof item === "number") {
      const found = apiContacts.find((c) => String(c.id) === String(item));
      if (found) merged.set(String(found.id), found);
      return;
    }
    if (item.fullName) {
      merged.set(String(item.id), {
        id: String(item.id),
        fullName: item.fullName,
        phone: item.phone || "",
        email: item.email || "",
        position: item.position || "",
        company: item.company || "",
        entityType: item.entityType,
        entityId: item.entityId,
      });
    }
  };

  if (Array.isArray(embedded)) {
    embedded.forEach(addContact);
  }

  apiContacts.forEach((contact) => {
    merged.set(String(contact.id), contact);
  });

  return Array.from(merged.values());
}

export function mergeCarrierFormContacts(
  formContacts: ContactPersonRow[],
  available: ContactPersonRow[],
  options?: { mode?: "new" | "edit"; entityId?: string | number | null },
): ContactPersonRow[] {
  const mode = options?.mode ?? "new";
  const entityId = options?.entityId;

  const scoped =
    mode === "edit" && entityId
      ? available.filter((c) => String(c.entityId) === String(entityId))
      : available.filter((c) => !c.entityId);

  return normalizeCarrierContacts(formContacts, scoped);
}

export function isPersistedContactPerson(
  contact: ContactPersonRow,
  available: ContactPersonRow[],
): boolean {
  return available.some((item) => String(item.id) === String(contact.id));
}

export function scopeEntityContacts(
  available: ContactPersonRow[],
  options?: { mode?: "new" | "edit"; entityId?: string | number | null },
): ContactPersonRow[] {
  const mode = options?.mode ?? "new";
  const entityId = options?.entityId;

  if (mode === "edit" && entityId) {
    return available.filter((c) => String(c.entityId) === String(entityId));
  }

  return available.filter((c) => !c.entityId);
}

export function contactPersonToSelectOptions(
  contacts: ContactPersonRow[],
): { value: string; label: string }[] {
  return normalizeCarrierContacts(contacts, []).map((c) => ({
    value: String(c.id),
    label: c.fullName || "Adsız",
  }));
}

export function contactPersonIdsFromList(contacts: ContactPersonRow[]): string {
  return normalizeCarrierContacts(contacts, [])
    .map((c) => String(c.id))
    .filter(Boolean)
    .join(",");
}

export function formatEntityContactNames(contacts: ContactPersonRow[]): string {
  const names = normalizeCarrierContacts(contacts, [])
    .map((c) => c.fullName?.trim())
    .filter(Boolean);
  return names.length > 0 ? names.join(", ") : "-";
}

export function getSelectedContactNames(
  _entity: any,
  contacts: ContactPersonRow[],
): string {
  return formatEntityContactNames(contacts);
}
