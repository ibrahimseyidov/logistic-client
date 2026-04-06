import type { SifarisSubTab } from "../types/sifaris.types";

const TABS: { id: SifarisSubTab; label: string }[] = [
  { id: "orders", label: "Sifarişlər" },
  { id: "loads", label: "Yüklər" },
  { id: "voyages", label: "Reyslər" },
  { id: "payroll", label: "Əmək haqqının hesablanması" },
];

interface Props {
  value: SifarisSubTab;
  onChange: (tab: SifarisSubTab) => void;
}

export default function SifarisSubTabs({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-white px-3 pt-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-t-md border border-b-0 transition-colors ${
            value === tab.id
              ? "bg-green-600 text-white border-green-600"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
