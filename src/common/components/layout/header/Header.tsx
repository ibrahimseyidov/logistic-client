"use client";

import React from "react";
import { FaBars } from "react-icons/fa";
import { useSidebarLayout } from "../SidebarLayoutContext";
import styles from "./header.module.css";
import UserProfile from "../userProfile/userProfile";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "Sorğular", subtitle }) => {
  const { collapsed, toggleSidebar } = useSidebarLayout();

  return (
    <header
      className={`${styles.header} ${collapsed ? styles.headerSidebarCollapsed : ""}`}
    >
      <div className={styles.headerLeft}>
        {collapsed ? (
          <button
            type="button"
            className={styles.menuToggle}
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            aria-label="Menyunu aç"
          >
            <FaBars />
          </button>
        ) : null}
        <div className={styles.headerText}>
          {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>
      <div className={styles.headerRight}>
        <NotificationBell />
        <UserProfile />
      </div>
    </header>
  );
};

export default Header;
