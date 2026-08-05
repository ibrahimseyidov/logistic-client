import { SorguStatus } from "../../pages/sorgular/types/sorgu.types";

export type DigestCounts = {
  new_query: number;
  waiting_offer: number;
  evaluated: number;
  offered: number;
};

export type DailyQueryDigestPayload = {
  total: number;
  counts: DigestCounts;
};

export const DIGEST_STATUS_ROWS: Array<{
  key: keyof DigestCounts;
  label: string;
  tone: "rose" | "amber" | "emerald" | "sky";
}> = [
  { key: "new_query", label: "Yeni sorğu", tone: "rose" },
  { key: "waiting_offer", label: "Təklif Gözlənilir", tone: "amber" },
  { key: "evaluated", label: "Qiymətləndirildi", tone: "emerald" },
  { key: "offered", label: "Təklif edildi", tone: "sky" },
];

const emptyCounts = (): DigestCounts => ({
  new_query: 0,
  waiting_offer: 0,
  evaluated: 0,
  offered: 0,
});

/** Backend JSON və ya köhnə "Label: N · ..." formatını oxuyur */
export function parseDailyQueryDigest(
  message: string | null | undefined,
): DailyQueryDigestPayload | null {
  const raw = String(message || "").trim();
  if (!raw) return null;

  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      const counts = {
        ...emptyCounts(),
        ...(parsed?.counts && typeof parsed.counts === "object"
          ? parsed.counts
          : {}),
      } as DigestCounts;
      const total =
        typeof parsed?.total === "number"
          ? parsed.total
          : Object.values(counts).reduce((a, b) => a + Number(b || 0), 0);
      return { total, counts };
    } catch {
      /* fall through */
    }
  }

  const counts = emptyCounts();
  const labelToKey: Record<string, keyof DigestCounts> = {
    "yeni sorğu": "new_query",
    "yeni sorgu": "new_query",
    "təklif gözlənilir": "waiting_offer",
    "teklif gozlenilir": "waiting_offer",
    qiymətləndirildi: "evaluated",
    qiymetlendirildi: "evaluated",
    "təklif edildi": "offered",
    "teklif edildi": "offered",
  };

  const parts = raw.split(/[·•|]/).map((p) => p.trim());
  let found = false;
  for (const part of parts) {
    const m = part.match(/^(.+?):\s*(\d+)\s*$/i);
    if (!m) continue;
    const label = m[1].trim().toLowerCase();
    const key = labelToKey[label];
    if (!key) continue;
    counts[key] = Number(m[2]) || 0;
    found = true;
  }
  if (!found) return null;

  const totalMatch = raw.match(/(\d+)\s+aktiv\s+sorğu/i);
  const total = totalMatch
    ? Number(totalMatch[1])
    : Object.values(counts).reduce((a, b) => a + b, 0);

  return { total, counts };
}

export function formatDigestBrowserBody(payload: DailyQueryDigestPayload): string {
  if (payload.total === 0) return "Hazırda sizə bağlı aktiv sorğu yoxdur.";
  const lines = DIGEST_STATUS_ROWS.map(
    (row) => `${row.label}: ${payload.counts[row.key] ?? 0}`,
  );
  return `Hamısı: ${payload.total}\n${lines.join("\n")}`;
}

export function digestStatusToQueryParam(
  key: keyof DigestCounts | "all",
): string | null {
  if (key === "all") return null;
  return key;
}

export function isValidDigestStatusParam(
  value: string | null,
): value is SorguStatus {
  return (
    value === SorguStatus.NewQuery ||
    value === SorguStatus.WaitingOffer ||
    value === SorguStatus.Evaluated ||
    value === SorguStatus.Offered ||
    value === SorguStatus.Approved ||
    value === SorguStatus.Cancelled
  );
}
