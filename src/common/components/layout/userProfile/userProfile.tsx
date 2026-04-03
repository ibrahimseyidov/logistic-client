"use client";

import { useState } from "react";
import { FaUser, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import styles from "./userProfile.module.css";
import { useAuth } from "../../../contexts/AuthContext";

export default function UserProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className={styles.userProfile}>
      <button
        className={styles.profileButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaUser className={styles.userIcon} />
        <span className={styles.userName} suppressHydrationWarning>
          {user ? user.name : "Kullanıcı"}
        </span>
        <FaChevronDown
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <FaUser className={styles.dropdownUserIcon} />
            <div className={styles.userDetails}>
              <div className={styles.fullName} suppressHydrationWarning>
                {user ? user.name : "Kullanıcı"}
              </div>
            </div>
          </div>
          <hr className={styles.divider} />
          <button className={styles.logoutButton} onClick={handleLogout}>
            <FaSignOutAlt className={styles.logoutIcon} />
            Çıxış
          </button>
        </div>
      )}
    </div>
  );
}
