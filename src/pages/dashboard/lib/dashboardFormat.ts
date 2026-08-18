export function dash(value: unknown): string {
  const t = String(value ?? "").trim();
  return !t || t === "—" ? "—" : t;
}

export function joinList(values: unknown[]): string {
  const parts = values
    .map((v) => String(v ?? "").trim())
    .filter((v) => v && v !== "—");
  return parts.length ? Array.from(new Set(parts)).join(", ") : "—";
}

export function yesNo(value: unknown): string {
  if (value === true || value === 1 || value === "1" || value === "true") {
    return "Bəli";
  }
  if (value === false || value === 0 || value === "0" || value === "false") {
    return "Xeyr";
  }
  return dash(value);
}

export function moneyPair(amount: unknown, currency?: unknown): string {
  const a = dash(amount);
  if (a === "—") return "—";
  const c = String(currency ?? "").trim();
  return c ? `${a} ${c}` : a;
}

export function financeTypeLabel(type: unknown): string {
  const t = String(type || "").trim().toUpperCase();
  if (t === "INCOME") return "Gəlir";
  if (t === "EXPENSE") return "Xərc";
  return dash(type);
}

export function taskStatusLabel(status: unknown): string {
  const t = String(status || "").trim().toLowerCase();
  if (t === "backlog") return "Gözləmə";
  if (t === "todo") return "Ediləcək";
  if (t === "in-progress" || t === "in_progress") return "İcrada";
  if (t === "review") return "Yoxlama";
  if (t === "done" || t === "completed" || t === "tamamlandı") return "Tamamlandı";
  return dash(status);
}

export function asArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.customers)) return o.customers;
    if (Array.isArray(o.carriers)) return o.carriers;
    if (Array.isArray(o.transactions)) return o.transactions;
    if (Array.isArray(o.invoices)) return o.invoices;
    if (Array.isArray(o.tasks)) return o.tasks;
  }
  return [];
}

export function parseMoney(value: unknown): number {
  const text = String(value ?? "").replace(/\s/g, "");
  const m = text.match(/-?[\d]+(?:[.,][\d]+)?/);
  if (!m) return 0;
  return Number.parseFloat(m[0].replace(",", ".")) || 0;
}

export function fmtAzn(n: number): string {
  return `${n.toLocaleString("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} AZN`;
}

export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} mln`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)} min`;
  return `${sign}${abs.toLocaleString("az-AZ", { maximumFractionDigits: 0 })}`;
}

export function fmtInt(n: number): string {
  return n.toLocaleString("az-AZ");
}

export function invoiceTypeLabel(type: unknown): string {
  const t = String(type || "").trim().toLowerCase();
  if (t === "ireli") return "İrəli";
  if (t === "ilkin") return "İlkin";
  if (t === "alinmis") return "Alınmış";
  return dash(type);
}

export function includesSearch(row: unknown, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return JSON.stringify(row || {})
    .toLowerCase()
    .includes(needle);
}
