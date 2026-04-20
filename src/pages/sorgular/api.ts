// Tek bir sorgunun detayını getirir (tüm alanlar ve cargoItemsJson dahil)
export async function fetchQueryDetail(id: string | number): Promise<any> {
  const res = await axios.get(`/api/query/${id}`);
  return res.data;
}
import axios from "axios";
import type { LogisticQueryRow } from "./types/sorgu.types";

export async function fetchQueries(): Promise<LogisticQueryRow[]> {
  const res = await axios.get("/api/query");
  return res.data;
}

export async function createQuery(
  fields: Record<string, string | boolean>,
): Promise<LogisticQueryRow> {
  // Sorgu numarası backend tarafından atanacak
  const res = await axios.post("/api/query", fields);
  return res.data;
}

export async function updateQuery(
  id: string | number,
  fields: Partial<Record<string, string | boolean>>,
): Promise<LogisticQueryRow> {
  const res = await axios.put(`/api/query/${id}`, fields);
  return res.data;
}

export async function deleteQuery(id: string | number): Promise<void> {
  await axios.delete(`/api/query/${id}`);
}
