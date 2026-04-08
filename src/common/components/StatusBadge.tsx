type StatusTone =
  | "amber"
  | "cyan"
  | "emerald"
  | "rose"
  | "slate"
  | "sky"
  | "violet";

const toneClasses: Record<
  StatusTone,
  {
    badge: string;
    select: string;
  }
> = {
  amber: {
    badge:
      "border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    select:
      "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 focus:ring-amber-200",
  },
  cyan: {
    badge:
      "border-cyan-200/80 bg-gradient-to-r from-cyan-50 to-sky-50 text-cyan-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    select:
      "border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50 text-cyan-800 focus:ring-cyan-200",
  },
  emerald: {
    badge:
      "border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-lime-50 text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    select:
      "border-emerald-200 bg-gradient-to-r from-emerald-50 to-lime-50 text-emerald-800 focus:ring-emerald-200",
  },
  rose: {
    badge:
      "border-rose-200/80 bg-gradient-to-r from-rose-50 to-red-50 text-rose-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    select:
      "border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 text-rose-800 focus:ring-rose-200",
  },
  slate: {
    badge:
      "border-slate-200/80 bg-gradient-to-r from-slate-50 to-gray-100 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    select:
      "border-slate-200 bg-gradient-to-r from-slate-50 to-gray-100 text-slate-700 focus:ring-slate-200",
  },
  sky: {
    badge:
      "border-sky-200/80 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    select:
      "border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-800 focus:ring-sky-200",
  },
  violet: {
    badge:
      "border-violet-200/80 bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
    select:
      "border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-800 focus:ring-violet-200",
  },
};

function normalizeStatus(value: string) {
  return value
    .toLocaleLowerCase("az")
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getStatusTone(value: string, kind?: string): StatusTone {
  const normalizedKind = kind ? normalizeStatus(kind) : "";
  const normalizedValue = normalizeStatus(value);

  if (
    normalizedKind.includes("completed") ||
    normalizedValue.includes("tamam")
  ) {
    return "emerald";
  }

  if (
    normalizedKind.includes("progress") ||
    normalizedValue.includes("davam") ||
    normalizedValue.includes("yuklenmede") ||
    normalizedValue.includes("yolda") ||
    normalizedValue.includes("gomruk") ||
    normalizedValue.includes("bosaltma")
  ) {
    return "sky";
  }

  if (
    normalizedKind.includes("planned") ||
    normalizedValue.includes("plan") ||
    normalizedValue.includes("gozlemede") ||
    normalizedValue.includes("hazirlan")
  ) {
    return "amber";
  }

  if (normalizedValue.includes("teklif")) {
    return "violet";
  }

  if (
    normalizedValue.includes("legv") ||
    normalizedValue.includes("xeyr") ||
    normalizedValue.includes("cancel")
  ) {
    return "rose";
  }

  if (
    normalizedValue.includes("beli") ||
    normalizedValue.includes("odenilib")
  ) {
    return "emerald";
  }

  if (normalizedValue.includes("arxiv")) {
    return "slate";
  }

  if (normalizedValue.includes("gonderilib")) {
    return "cyan";
  }

  return "slate";
}

export function getStatusSelectClasses(value: string, kind?: string) {
  const tone = getStatusTone(value, kind);
  return toneClasses[tone].select;
}

interface StatusBadgeProps {
  label: string;
  kind?: string;
  className?: string;
}

export default function StatusBadge({
  label,
  kind,
  className = "",
}: StatusBadgeProps) {
  const tone = getStatusTone(label, kind);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${toneClasses[tone].badge} ${className}`.trim()}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
