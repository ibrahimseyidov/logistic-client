"use client";

import { useState } from "react";
import { FaUser, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import styles from "./userProfile.module.css";
import { useAuth } from "../../../contexts/AuthContext";

export default function UserProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const displayName = String(user?.name || "").trim() || "İstifadəçi";

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className={styles.userProfile}>
      <button
        className={styles.profileButton}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label={displayName}
      >
        <FaUser className={styles.userIcon} />
        <span className={styles.userName} suppressHydrationWarning>
          {displayName}
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
                {displayName}
              </div>
              {user?.email ? (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginTop: 2,
                  }}
                >
                  {user.email}
                </div>
              ) : null}
            </div>
          </div>
          <hr className={styles.divider} />
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <FaSignOutAlt className={styles.logoutIcon} />
            Çıxış
          </button>
        </div>
      )}
    </div>
  );
}
