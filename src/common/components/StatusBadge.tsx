import { FiInfo } from "react-icons/fi";
import * as Popover from "@radix-ui/react-popover";

// İngilizce status -> Azerice label çevirisi
function statusLabelAz(value: string): string {
  const v = value.toLowerCase();
  if (v === "pending") return "Gözləmədə";
  if (v === "completed") return "Tamamlandı";
  if (v === "cancelled" || v === "canceled" || v.includes("cancel"))
    return "Ləğv edildi";
  return value;
}
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
  history?: { status: string; date: string }[];
}

export default function StatusBadge({
  label,
  kind,
  className = "",
  history,
}: StatusBadgeProps) {
  const tone = getStatusTone(label, kind);
  const displayLabel = statusLabelAz(label);

  const badgeContent = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${toneClasses[tone].badge} ${className}`.trim()}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {displayLabel}
      {history && history.length > 0 && (
        <FiInfo className="ml-1 opacity-60 hover:opacity-100 cursor-pointer" />
      )}
    </span>
  );

  if (!history || history.length === 0) {
    return badgeContent;
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{badgeContent}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in duration-200 outline-none"
          sideOffset={8}
          align="start"
        >
          <div className="mb-3 border-b border-slate-100 pb-2">
            <h4 className="text-sm font-bold text-slate-800">Status Tarixçəsi</h4>
          </div>
          <div className="space-y-4">
            {history.map((item, idx) => (
              <div key={idx} className="relative pl-4">
                {/* Timeline line */}
                {idx !== history.length - 1 && (
                  <div className="absolute left-[5px] top-[14px] h-[calc(100%+8px)] w-[1px] bg-slate-200" />
                )}
                {/* Timeline dot */}
                <div className="absolute left-0 top-[6px] h-[10px] w-[10px] rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-slate-700">
                    {item.status}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {item.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
