"use client";

import { Link, NavLink, useLocation } from "react-router-dom";
import {
  FaClipboardList,
  FaChevronLeft,
  FaShoppingCart,
  FaTasks,
  FaUsers,
  FaCog,
} from "react-icons/fa";
import { useSidebarLayout } from "../SidebarLayoutContext";
import styles from "./sidebar.module.css";

export default function Sidebar() {
  const { collapsed, toggleSidebar } = useSidebarLayout();
  const location = useLocation();
  const isSorgularSection = location.pathname.startsWith("/sorgular");
  const sorgularTab =
    new URLSearchParams(location.search).get("tab") ?? "active";
  const isSifarislerSection = location.pathname.startsWith("/sifarisler");
  const sifarislerTab =
    new URLSearchParams(location.search).get("tab") ?? "orders";

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
            <span className={styles.logoText}>Logistra</span>
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

        <nav className={styles.nav}>
          <div className={styles.navItem}>
            <NavLink
              to="/sorgular"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              <span className={styles.navIcon}>
                <FaClipboardList />
              </span>
              Sorğular
            </NavLink>

            <div
              className={`${styles.subMenu} ${
                isSorgularSection ? styles.subMenuOpen : ""
              }`}
            >
              <div className={styles.subMenuInner}>
                <Link
                  to="/sorgular?tab=active"
                  className={`${styles.subItem} ${
                    isSorgularSection && sorgularTab === "active"
                      ? styles.subItemActive
                      : ""
                  }`}
                >
                  Aktiv sorğular
                </Link>
                <Link
                  to="/sorgular?tab=archive"
                  className={`${styles.subItem} ${
                    isSorgularSection && sorgularTab === "archive"
                      ? styles.subItemActive
                      : ""
                  }`}
                >
                  Arxiv sorğular
                </Link>
                <Link
                  to="/sorgular?tab=offers"
                  className={`${styles.subItem} ${
                    isSorgularSection && sorgularTab === "offers"
                      ? styles.subItemActive
                      : ""
                  }`}
                >
                  Qiymət təklifləri
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.navItem}>
            <NavLink
              to="/sifarisler"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              <span className={styles.navIcon}>
                <FaShoppingCart />
              </span>
              Sifarişlər
            </NavLink>

            <div
              className={`${styles.subMenu} ${
                isSifarislerSection ? styles.subMenuOpen : ""
              }`}
            >
              <div className={styles.subMenuInner}>
                <Link
                  to="/sifarisler?tab=orders"
                  className={`${styles.subItem} ${
                    isSifarislerSection && sifarislerTab === "orders"
                      ? styles.subItemActive
                      : ""
                  }`}
                >
                  Sifarişlər
                </Link>
                <Link
                  to="/sifarisler?tab=loads"
                  className={`${styles.subItem} ${
                    isSifarislerSection && sifarislerTab === "loads"
                      ? styles.subItemActive
                      : ""
                  }`}
                >
                  Yüklər
                </Link>
                <Link
                  to="/sifarisler?tab=voyages"
                  className={`${styles.subItem} ${
                    isSifarislerSection && sifarislerTab === "voyages"
                      ? styles.subItemActive
                      : ""
                  }`}
                >
                  Reyslər
                </Link>
                <Link
                  to="/sifarisler?tab=payroll"
                  className={`${styles.subItem} ${
                    isSifarislerSection && sifarislerTab === "payroll"
                      ? styles.subItemActive
                      : ""
                  }`}
                >
                  Əmək haqqının hesablanması
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.navItem}>
            <NavLink
              to="/tapshiriqlar"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              <span className={styles.navIcon}>
                <FaTasks />
              </span>
              Tapşırıqlar
            </NavLink>
          </div>
          <div className={styles.navItem}>
            <NavLink
              to="/musteriler"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              <span className={styles.navIcon}>
                <FaUsers />
              </span>
              Müştərilər
            </NavLink>
          </div>
          <div className={styles.navItem}>
            <NavLink
              to="/ayarlar"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              <span className={styles.navIcon}>
                <FaCog />
              </span>
              Ayarlar
            </NavLink>
          </div>
        </nav>
      </div>
    </aside>
  );
}
