import type { SifarisSubTab } from "../types/sifaris.types";
import styles from "./SifarisSubTabs.module.css";

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
    <div className={styles.container}>
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
