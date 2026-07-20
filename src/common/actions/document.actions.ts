import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

function getHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type DocumentDesign = {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  fontFamily: string;
  actFontFamily: string;
  fontSize: string;
  pageMargin: string;
  logoUrl: string;
  stampUrl: string;
  showLogo: boolean;
  showStamp: boolean;
  showFieldNumbers: boolean;
  companyName: string;
  companyLegalName: string;
  tagline: string;
  address: string;
  shortAddress: string;
  phone: string;
  website: string;
  email: string;
  director: string;
  directorTitle: string;
  bankName: string;
  bankCode: string;
  bankTin: string;
  bankSwift: string;
  bankIbanAzn: string;
  bankIbanUsd: string;
  bankIbanEur: string;
  bankIbanGbp: string;
};

export type DocumentTemplate = {
  id: number;
  code: string;
  name: string;
  scope: string;
  description?: string | null;
  bodyText?: string | null;
  htmlTemplate?: string | null;
  cssStyles?: string | null;
  designJson?: string | null;
  isSystem: boolean;
};

export type PlaceholderField = {
  key: string;
  label: string;
  scopes: string[];
};

export type GeneratedDocumentMeta = {
  fileName: string;
  url: string;
  size: number;
  templateCode: string;
  templateName: string;
  document?: any;
};

export type OrderDocumentRow = {
  id: number;
  name: string;
  url: string;
  type: string;
  size: number;
  templateCode?: string | null;
  createdAt: string;
};

export async function fetchDocumentTemplatesAction(
  scope?: "query" | "order" | "both",
): Promise<DocumentTemplate[]> {
  const res = await axios.get(buildApiUrl("/api/documents/templates"), {
    headers: getHeaders(),
    params: scope ? { scope } : undefined,
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchDocumentTemplateAction(
  id: number | string,
): Promise<DocumentTemplate> {
  const res = await axios.get(buildApiUrl(`/api/documents/templates/${id}`), {
    headers: getHeaders(),
  });
  return res.data;
}

export async function fetchDocumentPlaceholdersAction(): Promise<PlaceholderField[]> {
  const res = await axios.get(buildApiUrl("/api/documents/placeholders"), {
    headers: getHeaders(),
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchDocumentBrandAction(): Promise<{
  id: number;
  design: DocumentDesign;
  designJson: string;
}> {
  const res = await axios.get(buildApiUrl("/api/documents/brand"), {
    headers: getHeaders(),
  });
  return res.data;
}

export async function updateDocumentBrandAction(
  design: Partial<DocumentDesign> | DocumentDesign,
): Promise<{ id: number; design: DocumentDesign }> {
  const res = await axios.put(
    buildApiUrl("/api/documents/brand"),
    { design },
    { headers: getHeaders() },
  );
  return res.data;
}

export async function uploadDocumentBrandAssetAction(
  file: File,
  kind: "logo" | "stamp",
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const res = await axios.post(buildApiUrl("/api/documents/brand/upload"), form, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function createDocumentTemplateAction(payload: {
  name: string;
  scope: string;
  description?: string;
  bodyText?: string;
  htmlTemplate?: string;
  cssStyles?: string;
  designJson?: string | object;
  code?: string;
}): Promise<DocumentTemplate> {
  const res = await axios.post(buildApiUrl("/api/documents/templates"), payload, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function updateDocumentTemplateAction(
  id: number,
  payload: Partial<{
    name: string;
    scope: string;
    description: string;
    bodyText: string;
    htmlTemplate: string;
    cssStyles: string;
    designJson: string | object;
  }>,
): Promise<DocumentTemplate> {
  const res = await axios.put(buildApiUrl(`/api/documents/templates/${id}`), payload, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function resetDocumentTemplateAction(id: number): Promise<DocumentTemplate> {
  const res = await axios.post(
    buildApiUrl(`/api/documents/templates/${id}/reset`),
    {},
    { headers: getHeaders() },
  );
  return res.data;
}

export async function deleteDocumentTemplateAction(id: number): Promise<void> {
  await axios.delete(buildApiUrl(`/api/documents/templates/${id}`), {
    headers: getHeaders(),
  });
}

export async function previewDocumentHtmlAction(payload: {
  templateId?: number;
  templateCode?: string;
  queryId?: number | null;
  orderId?: number | null;
  htmlTemplate?: string;
  cssStyles?: string;
  designJson?: string | object;
}): Promise<{ html: string }> {
  const res = await axios.post(buildApiUrl("/api/documents/preview"), payload, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function generateDocumentAction(payload: {
  templateCode: string;
  queryId?: number | null;
  orderId?: number | null;
  overrides?: Record<string, string>;
  save?: boolean;
}): Promise<GeneratedDocumentMeta> {
  const res = await axios.post(buildApiUrl("/api/documents/generate"), payload, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function fetchOrderDocumentsAction(
  orderId: number,
): Promise<OrderDocumentRow[]> {
  const res = await axios.get(buildApiUrl(`/api/documents/orders/${orderId}`), {
    headers: getHeaders(),
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function deleteOrderDocumentAction(id: number): Promise<void> {
  await axios.delete(buildApiUrl(`/api/documents/order-docs/${id}`), {
    headers: getHeaders(),
  });
}

export function resolveUploadUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${apiBase}${url.startsWith("/") ? url : `/${url}`}`;
}
