"use client";

import React from "react";
import styles from "./header.module.css";
import UserProfile from "../userProfile/userProfile";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "Ürünler" }) => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <UserProfile />
    </header>
  );
};

export default Header;
