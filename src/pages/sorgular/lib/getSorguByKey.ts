import { MOCK_SORGULAR } from "../data/mockSorgular";
import type { LogisticQueryRow } from "../types/sorgu.types";

export function getSorguByKey(key: string): LogisticQueryRow | undefined {
  const k = decodeURIComponent(key.trim());
  return MOCK_SORGULAR.find((r) => r.number === k || r.id === k);
}
