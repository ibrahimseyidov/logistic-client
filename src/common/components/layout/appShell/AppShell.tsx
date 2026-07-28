import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarLayoutProvider } from "../SidebarLayoutContext";
import Sidebar from "../sidebar/sidebar";
import Header from "../header/Header";
import { NotificationModal } from "../../NotificationModal";
import { useAppDispatch } from "../../../store/hooks";
import { hideNotification } from "../../../store/modalSlice";
import {
  getAyarlarTabLabel,
  parseAyarlarTab,
} from "../../../../pages/ayarlar/constants/ayarlar.constants";
import styles from "./appShell.module.css";

const headerTitles: Record<string, string> = {
  "/sorgular": "Sorğular",
  "/sifarisler": "Sifarişlər",
  "/tapshiriqlar": "Tapşırıqlar",
  "/musteriler": "Müştərilər",
  "/dasiyicilar": "Daşıyıcılar",
  "/maliyye": "Maliyyə",
  "/maliyye/hesabat": "Hesabatlar",
};

function resolveHeaderTitle(pathname: string, search: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path.startsWith("/sorgular/")) return "Sorğu detalı";
  if (path.startsWith("/sifarisler/")) return "Sifariş detalı";
  if (path.startsWith("/musteriler/")) return "Müştəri detalı";
  if (path.startsWith("/dasiyicilar/")) return "Daşıyıcı detalı";
  if (path === "/maliyye/hesabat") return "Hesabatlar";

  if (path.startsWith("/ayarlar")) {
    const tab = parseAyarlarTab(new URLSearchParams(search).get("tab"));
    return getAyarlarTabLabel(tab);
  }

  if (headerTitles[path]) return headerTitles[path];

  // Prefiks uyğunluğu (məs. /maliyye/... → Maliyyə)
  const sorted = Object.keys(headerTitles).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (path === key || path.startsWith(`${key}/`)) {
      return headerTitles[key];
    }
  }

  return "Ziyalog";
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
      <NotificationModal />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const pathname = location.pathname;
  const pageTitle =
    pathname === "/login"
      ? "Giriş"
      : resolveHeaderTitle(pathname, location.search);

  useEffect(() => {
    dispatch(hideNotification());
  }, [location.pathname, dispatch]);

  useEffect(() => {
    document.title =
      pageTitle && pageTitle !== "Ziyalog"
        ? `${pageTitle} | Ziyalog`
        : "Ziyalog";
  }, [pageTitle]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <SidebarLayoutProvider>
      <AppShellInner title={pageTitle}>{children}</AppShellInner>
    </SidebarLayoutProvider>
  );
}
