import type { ReactNode } from "react";
import styles from "../ayarlar.module.css";

export function AyarlarToolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbarCard}>{children}</div>;
}
