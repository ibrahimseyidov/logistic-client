"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChartBar,
  FaClipboardList,
  FaCog,
  FaShoppingCart,
  FaTasks,
  FaTruck,
  FaUsers,
  FaWallet,
} from "react-icons/fa";
import { useSidebarLayout } from "../SidebarLayoutContext";
import { useAuth } from "../../../contexts/AuthContext";
import { isAdminUser } from "../../../utils/auth.utils";
import {
  AYARLAR_TABS,
  AYARLAR_TITLE,
  type AyarlarTab,
} from "../../../../pages/ayarlar/constants/ayarlar.constants";
import styles from "./sidebar.module.css";

type NavChild = {
  to: string;
  label: string;
  matchTab?: string;
};

type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  to: string;
  children?: NavChild[];
  adminOnly?: boolean;
  /** Pathname for active check when `to` includes ?query */
  matchPath?: string;
  matchTab?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Ümumi",
    items: [
      {
        id: "sorgular",
        label: "Sorğular",
        icon: <FaClipboardList />,
        to: "/sorgular",
        children: [
          {
            to: "/sorgular?tab=active",
            label: "Aktiv sorğular",
            matchTab: "active",
          },
          {
            to: "/sorgular?tab=archive",
            label: "Arxiv sorğular",
            matchTab: "archive",
          },
          {
            to: "/sorgular?tab=offers",
            label: "Qiymət təklifləri",
            matchTab: "offers",
          },
        ],
      },
      {
        id: "sifarisler",
        label: "Sifarişlər",
        icon: <FaShoppingCart />,
        to: "/sifarisler",
      },
    ],
  },
  {
    title: "İdarəetmə",
    items: [
      {
        id: "tapshiriqlar",
        label: "Tapşırıqlar",
        icon: <FaTasks />,
        to: "/tapshiriqlar",
      },
    ],
  },
  {
    title: "Kontragentlər",
    items: [
      {
        id: "musteriler",
        label: "Müştərilər",
        icon: <FaUsers />,
        to: "/musteriler",
      },
      {
        id: "dasiyicilar",
        label: "Daşıyıcılar",
        icon: <FaTruck />,
        to: "/dasiyicilar",
      },
    ],
  },
  {
    title: "Maliyyə",
    items: [
      {
        id: "maliyye",
        label: "Maliyyə",
        icon: <FaWallet />,
        to: "/maliyye",
      },
      {
        id: "maliyye-hesabat",
        label: "Maliyyə hesabatı",
        icon: <FaChartBar />,
        to: "/maliyye/hesabat",
      },
    ],
  },
  {
    title: AYARLAR_TITLE,
    items: [
      {
        id: "ayarlar",
        label: AYARLAR_TITLE,
        icon: <FaCog />,
        to: "/ayarlar",
        matchPath: "/ayarlar",
        adminOnly: true,
        children: AYARLAR_TABS.map((tab) => ({
          to: `/ayarlar?tab=${tab.id}`,
          label: tab.label,
          matchTab: tab.id,
        })),
      },
    ],
  },
];

function getTabFromPath(
  pathname: string,
  search: string,
  basePath: string,
  fallback: string,
) {
  if (!pathname.startsWith(basePath)) return null;
  return new URLSearchParams(search).get("tab") ?? fallback;
}

export default function Sidebar() {
  const { collapsed, toggleSidebar } = useSidebarLayout();
  const { user } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const sorgularTab = getTabFromPath(
    location.pathname,
    location.search,
    "/sorgular",
    "active",
  );
  const sifarislerTab = getTabFromPath(
    location.pathname,
    location.search,
    "/sifarisler",
    "orders",
  );
  const ayarlarTab = getTabFromPath(
    location.pathname,
    location.search,
    "/ayarlar",
    "users",
  ) as AyarlarTab | null;

  const activeTabByItem = useMemo(
    () => ({
      sorgular: sorgularTab,
      sifarisler: sifarislerTab,
      ayarlar: ayarlarTab,
    }),
    [sorgularTab, sifarislerTab, ayarlarTab],
  );

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (!item.children?.length) continue;
        const basePath = item.matchPath || item.to.split("?")[0];
        if (location.pathname.startsWith(basePath)) {
          next[item.id] = true;
        }
      }
    }
    setExpanded((prev) => ({ ...prev, ...next }));
  }, [location.pathname]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isItemActive = (item: NavItem) => {
    const basePath = item.matchPath || item.to.split("?")[0];
    if (!location.pathname.startsWith(basePath)) return false;
    if (item.matchTab) {
      if (basePath === "/ayarlar") return ayarlarTab === item.matchTab;
      if (basePath === "/sorgular") return sorgularTab === item.matchTab;
      return false;
    }
    if (basePath === "/maliyye") {
      return (
        location.pathname === "/maliyye" || location.pathname === "/maliyye/"
      );
    }
    return (
      location.pathname === basePath ||
      location.pathname.startsWith(`${basePath}/`)
    );
  };

  const isChildActive = (item: NavItem, child: NavChild) => {
    if (child.matchTab) {
      const basePath = item.matchPath || item.to.split("?")[0];
      if (!location.pathname.startsWith(basePath)) return false;
      const currentTab =
        activeTabByItem[item.id as keyof typeof activeTabByItem];
      return child.matchTab === currentTab;
    }
    // Nested routes: /maliyye vs /maliyye/hesabat
    if (child.to === item.to) {
      return (
        location.pathname === item.to || location.pathname === `${item.to}/`
      );
    }
    return (
      location.pathname === child.to ||
      location.pathname.startsWith(`${child.to}/`)
    );
  };

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.adminOnly || isAdminUser(user)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      aria-hidden={collapsed}
    >
      <div className={styles.sidebarContent}>
        <div className={styles.header}>
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className={styles.logoTextGroup}>
              <span className={styles.logoText}>Ziyalog</span>
              <span className={styles.logoSubtext}>İdarəetmə paneli</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={toggleSidebar}
            aria-label="Menyunu bağla"
            title="Menyunu bağla"
          >
            <FaChevronLeft aria-hidden />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Əsas menyu">
          {visibleSections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <div className={styles.sectionLabel}>{section.title}</div>

              <div className={styles.sectionItems}>
                {section.items.map((item) => {
                  const hasChildren = Boolean(item.children?.length);
                  const isOpen = Boolean(expanded[item.id]);

                  if (!hasChildren) {
                    const active = isItemActive(item);
                    return (
                      <div key={item.id} className={styles.navItem}>
                        <NavLink
                          to={item.to}
                          end={item.to === "/maliyye"}
                          className={() =>
                            `${styles.navLink} ${active ? styles.navLinkActive : ""}`
                          }
                        >
                          <span className={styles.navIcon}>{item.icon}</span>
                          <span className={styles.navLabel}>{item.label}</span>
                        </NavLink>
                      </div>
                    );
                  }

                  const isSectionActive = isItemActive(item);
                  return (
                    <div key={item.id} className={styles.navItem}>
                      <div
                        className={`${styles.navRow} ${
                          isSectionActive ? styles.navRowActive : ""
                        }`}
                      >
                        <NavLink
                          to={item.children![0].to}
                          className={() =>
                            `${styles.navLink} ${isSectionActive ? styles.navLinkActive : ""}`
                          }
                        >
                          <span className={styles.navIcon}>{item.icon}</span>
                          <span className={styles.navLabel}>{item.label}</span>
                        </NavLink>
                        <button
                          type="button"
                          className={`${styles.navToggle} ${isOpen ? styles.navToggleOpen : ""}`}
                          onClick={() => toggleExpanded(item.id)}
                          aria-expanded={isOpen}
                          aria-label={`${item.label} alt menyusu`}
                        >
                          <FaChevronDown
                            className={styles.navChevron}
                            aria-hidden
                          />
                        </button>
                      </div>

                      <div
                        className={`${styles.subMenu} ${isOpen ? styles.subMenuOpen : ""}`}
                      >
                        <div className={styles.subMenuInner}>
                          {item.children!.map((child) => (
                            <Link
                              key={child.to}
                              to={child.to}
                              className={`${styles.subItem} ${
                                isChildActive(item, child)
                                  ? styles.subItemActive
                                  : ""
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/sorgular" className={styles.footerLink}>
            <FaClipboardList aria-hidden />
            <span>Əsas səhifə</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
