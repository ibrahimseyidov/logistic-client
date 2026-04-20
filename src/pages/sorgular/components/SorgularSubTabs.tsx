import type { SorguSubTab } from "../types/sorgu.types";
import styles from "./SorgularSubTabs.module.css";

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
    <div className={styles.root}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`${styles.tab} ${value === tab.id ? styles.tabActive : ""}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
