"use client";

import { useLocation } from "react-router-dom";
import { SidebarLayoutProvider } from "../SidebarLayoutContext";
import Sidebar from "../sidebar/sidebar";
import Header from "../header/Header";
import styles from "./appShell.module.css";

const headerTitles: Record<string, string> = {
  "/sorgular": "Sorğular",
  "/sifarisler": "Sifarişlər",
  "/tapshiriqlar": "Tapşırıqlar",
  "/musteriler": "Müştərilər",
  "/ayarlar": "Ayarlar",
};

function resolveHeaderTitle(pathname: string): string {
  const sorguRest = pathname.slice("/sorgular/".length);
  if (pathname.startsWith("/sorgular/") && sorguRest.length > 0) {
    return "Sorğu detalı";
  }
  const musteriRest = pathname.slice("/musteriler/".length);
  if (pathname.startsWith("/musteriler/") && musteriRest.length > 0) {
    return "Müştəri detalı";
  }
  return headerTitles[pathname] ?? "Sorğular";
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
