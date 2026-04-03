"use client";

import { useLocation } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import Header from "../header/Header";
import styles from "./appShell.module.css";

const headerTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Ürünler",
  "/categories": "Kategoriler",
  "/inventory": "Tedarik Et",
  "/suppliers": "Tedarikçiler",
  "/companies": "Şirketler",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.contentArea}>
        <Header title={headerTitles[pathname] ?? "ERP"} />
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
}
