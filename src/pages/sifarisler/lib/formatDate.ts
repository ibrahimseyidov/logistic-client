export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";

  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const datePart = value.split("T")[0]?.trim();
  if (!datePart) return "—";

  const fallback = new Date(datePart);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toLocaleDateString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return datePart;
}

export function toDateIso(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  const datePart = value.split("T")[0]?.trim();
  return datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : "";
}
