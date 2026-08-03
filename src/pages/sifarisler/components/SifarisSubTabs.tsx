import { useEffect, useMemo } from "react";
import { usePermissions } from "../../../common/hooks/usePermissions";
import type { SifarisSubTab } from "../types/sifaris.types";
import styles from "./SifarisSubTabs.module.css";

const TABS: { id: SifarisSubTab; label: string; permChild: string }[] = [
  { id: "orders", label: "Sifarişlər", permChild: "orders" },
  { id: "loads", label: "Yüklər", permChild: "loads" },
  { id: "voyages", label: "Reyslər", permChild: "voyages" },
  { id: "payroll", label: "Əmək haqqının hesablanması", permChild: "payroll" },
];

interface Props {
  value: SifarisSubTab;
  onChange: (tab: SifarisSubTab) => void;
}

export default function SifarisSubTabs({ value, onChange }: Props) {
  const { canView } = usePermissions();

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => canView("sifarisler", tab.permChild)),
    [canView],
  );

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.some((t) => t.id === value)) {
      onChange(visibleTabs[0].id);
    }
  }, [visibleTabs, value, onChange]);

  return (
    <div className={styles.container}>
      {visibleTabs.map((tab) => (
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
