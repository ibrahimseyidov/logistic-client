"use client";

import { Link, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaBox,
  FaAngleDown,
  FaAngleUp,
  FaCog,
  FaCashRegister,
  FaClipboardList,
  FaChevronLeft,
} from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useSidebarLayout } from "../SidebarLayoutContext";
import styles from "./sidebar.module.css";

const BRANCH_STORAGE_KEY = "selectedBranchName";

export default function Sidebar() {
  const location = useLocation();
  const { branches } = useAuth();
  const { collapsed, toggleSidebar } = useSidebarLayout();
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchQuery, setBranchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [productsOpen, setProductsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith("/settings"),
  );
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.pathname.startsWith("/settings")) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  const filteredBranches = useMemo(() => {
    const term = branchQuery.trim().toLowerCase();
    if (!term) return branches;
    return branches.filter((branch) =>
      branch.name.toLowerCase().includes(term),
    );
  }, [branches, branchQuery]);

  useEffect(() => {
    if (!branches.length) return;

    const savedBranch =
      typeof window !== "undefined"
        ? localStorage.getItem(BRANCH_STORAGE_KEY)
        : null;
    const nextBranch =
      (savedBranch &&
        branches.some((branch) => branch.name === savedBranch) &&
        savedBranch) ||
      branches[0].name;

    if (
      !selectedBranch ||
      !branches.some((branch) => branch.name === selectedBranch)
    ) {
      setSelectedBranch(nextBranch);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(BRANCH_STORAGE_KEY, nextBranch);
      window.dispatchEvent(
        new CustomEvent("branch-change", {
          detail: { branchName: nextBranch },
        }),
      );
    }
  }, [branches, selectedBranch]);

  useEffect(() => {
    if (!branchOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!branchRef.current?.contains(event.target as Node)) {
        setBranchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [branchOpen]);

  const handleBranchSelect = (value: string) => {
    setSelectedBranch(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(BRANCH_STORAGE_KEY, value);
      window.dispatchEvent(
        new CustomEvent("branch-change", { detail: { branchName: value } }),
      );
    }
    setBranchOpen(false);
    setBranchQuery("");
  };

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      aria-hidden={collapsed}
    >
      {/* Header */}
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

      {/* Branch Selector */}
      <div className={styles.branchSelector}>
        <div className={styles.branchLabel}>Filial</div>
        <div className={styles.branchSelectWrap} ref={branchRef}>
          <button
            type="button"
            className={styles.branchSelect}
            onClick={() => setBranchOpen((prev) => !prev)}
          >
            <span className={styles.branchValue}>
              {selectedBranch || "Seciniz"}
            </span>
            <span className={styles.branchChevron}>▾</span>
          </button>
          {branchOpen && (
            <div className={styles.branchMenu}>
              <input
                className={styles.branchSearch}
                value={branchQuery}
                onChange={(event) => setBranchQuery(event.target.value)}
                placeholder="Ara..."
                type="text"
                autoFocus
              />
              <div className={styles.branchList}>
                {filteredBranches.length === 0 ? (
                  <div className={styles.branchEmpty}>Sonuc yok</div>
                ) : (
                  filteredBranches.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      className={styles.branchOption}
                      onClick={() => handleBranchSelect(branch.name)}
                    >
                      {branch.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
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
          <Link to="/dashboard" className={styles.navLink}>
            <span className={styles.navIcon}>
              <FaChartLine />
            </span>
            Dashboard
          </Link>
        </div>

        {/* Ürünler — açılır kapanır */}
        <div className={styles.navItem}>
          <button
            type="button"
            className={styles.navLink}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            onClick={() => setProductsOpen((prev) => !prev)}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaBox />
              Ürünler
            </span>
            {productsOpen ? <FaAngleUp /> : <FaAngleDown />}
          </button>

          {productsOpen && (
            <div
              style={{
                marginLeft: 32,
                marginTop: 4,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <Link to="/products" className={styles.navLink}>
                Ürün Listesi
              </Link>
              <Link to="/categories" className={styles.navLink}>
                Kategoriler
              </Link>
              <Link to="/purchase" className={styles.navLink}>
                Urun Alis
              </Link>
            </div>
          )}
        </div>

        {/* Tedarikçiler */}
        <div className={styles.navItem}>
          <Link to="/suppliers" className={styles.navLink}>
            <span className={styles.navIcon}>
              <FaBox />
            </span>
            Tedarikçiler
          </Link>
        </div>

        {/* Ayarlar */}
        <div className={styles.navItem}>
          <button
            type="button"
            className={styles.navLink}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            onClick={() => setSettingsOpen((prev) => !prev)}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaCog />
              Ayarlar
            </span>
            {settingsOpen ? <FaAngleUp /> : <FaAngleDown />}
          </button>

          {settingsOpen && (
            <div
              style={{
                marginLeft: 32,
                marginTop: 4,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <Link to="/settings/kassa-ekle" className={styles.navLink}>
                <FaCashRegister />
                Kassa Ekle
              </Link>
              <Link to="/kasalar" className={styles.navLink}>
                <FaCashRegister />
                Kassalar
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
