"use client";

import React from "react";
import { FaBars, FaChevronLeft } from "react-icons/fa";
import { useSidebarLayout } from "../SidebarLayoutContext";
import styles from "./header.module.css";
import UserProfile from "../userProfile/userProfile";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "Sorğular" }) => {
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
        <h1 className={styles.title}>{title}</h1>
      </div>
      <UserProfile />
    </header>
  );
};

export default Header;
