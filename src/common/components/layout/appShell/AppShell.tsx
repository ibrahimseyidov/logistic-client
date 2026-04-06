"use client";

import { useLocation } from "react-router-dom";
import { SidebarLayoutProvider } from "../SidebarLayoutContext";
import Sidebar from "../sidebar/sidebar";
import Header from "../header/Header";
import styles from "./appShell.module.css";

const headerTitles: Record<string, string> = {
  "/sorgular": "Sorğular",
  "/dashboard": "Dashboard",
  "/products": "Ürünler",
  "/categories": "Kategoriler",
  "/purchase": "Urun Alis",
  "/suppliers": "Tedarikçiler",
  "/companies": "Şirketler",
  "/settings/kassa-ekle": "Kassa Ekle",
  "/kasalar": "Kassalar",
};

function resolveHeaderTitle(pathname: string): string {
  const rest = pathname.slice("/sorgular/".length);
  if (pathname.startsWith("/sorgular/") && rest.length > 0) {
    return "Sorğu detalı";
  }
  return headerTitles[pathname] ?? "ERP";
}

function AppShellInner({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.contentArea}>
        <Header title={title} />
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <SidebarLayoutProvider>
      <AppShellInner title={resolveHeaderTitle(pathname)}>
        {children}
      </AppShellInner>
    </SidebarLayoutProvider>
  );
}
