import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarLayoutProvider } from "../SidebarLayoutContext";
import Sidebar from "../sidebar/sidebar";
import Header from "../header/Header";
import { NotificationModal } from "../../NotificationModal";
import { useAppDispatch } from "../../../store/hooks";
import { hideNotification } from "../../../store/modalSlice";
import {
  AYARLAR_TITLE,
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
  "/ayarlar": "Parametrlər",
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
  const dasiyiciRest = pathname.slice("/dasiyicilar/".length);
  if (pathname.startsWith("/dasiyicilar/") && dasiyiciRest.length > 0) {
    return "Daşıyıcı detalı";
  }
  return headerTitles[pathname] ?? "Sorğular";
}

function resolveHeaderSubtitle(pathname: string, search: string): string | undefined {
  if (pathname.startsWith("/ayarlar")) {
    const tab = parseAyarlarTab(new URLSearchParams(search).get("tab"));
    const label = getAyarlarTabLabel(tab);
    return label === AYARLAR_TITLE ? undefined : label;
  }
  return undefined;
}

function AppShellInner({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={styles.shell}>
      <NotificationModal />
      <Sidebar />
      <div className={styles.contentArea}>
        <Header title={title} subtitle={subtitle} />
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const pathname = location.pathname;

  useEffect(() => {
    dispatch(hideNotification());
  }, [location.pathname, dispatch]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <SidebarLayoutProvider>
      <AppShellInner
        title={resolveHeaderTitle(pathname)}
        subtitle={resolveHeaderSubtitle(pathname, location.search)}
      >
        {children}
      </AppShellInner>
    </SidebarLayoutProvider>
  );
}
