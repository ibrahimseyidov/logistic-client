"use client";

import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronLeft, FaShoppingCart, FaTasks } from "react-icons/fa";
import { useSidebarLayout } from "../SidebarLayoutContext";
import styles from "./sidebar.module.css";

export default function Sidebar() {
  const { collapsed, toggleSidebar } = useSidebarLayout();

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      aria-hidden={collapsed}
    >
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
          <Link to="/sorgular" className={styles.navLink}>
            <span className={styles.navIcon}>
              <FaClipboardList />
            </span>
            Sorğular
          </Link>
        </div>
        <div className={styles.navItem}>
          <Link to="/sifarisler" className={styles.navLink}>
            <span className={styles.navIcon}>
              <FaShoppingCart />
            </span>
            Sifarişlər
          </Link>
        </div>
        <div className={styles.navItem}>
          <Link to="/tapshiriqlar" className={styles.navLink}>
            <span className={styles.navIcon}>
              <FaTasks />
            </span>
            Tapşırıqlar
          </Link>
        </div>
      </nav>
    </aside>
  );
}
