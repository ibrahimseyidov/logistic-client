import type { SorguSubTab } from "../types/sorgu.types";

const TABS: { id: SorguSubTab; label: string }[] = [
  { id: "active", label: "Aktiv sorğular" },
  { id: "archive", label: "Arxiv sorğular" },
  { id: "offers", label: "Qiymət təklifləri" },
];

interface Props {
  value: SorguSubTab;
  onChange: (tab: SorguSubTab) => void;
}

export default function SorgularSubTabs({ value, onChange }: Props) {
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
