"use client";

import { Link } from "react-router-dom";
import { FaChartLine, FaBox, FaAngleDown, FaAngleUp } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./sidebar.module.css";

export default function Sidebar() {
  const { branches } = useAuth();
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchQuery, setBranchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [productsOpen, setProductsOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);

  const filteredBranches = useMemo(() => {
    const term = branchQuery.trim().toLowerCase();
    if (!term) return branches;
    return branches.filter((branch) => branch.toLowerCase().includes(term));
  }, [branches, branchQuery]);

  useEffect(() => {
    if (!branches.length) return;
    if (!selectedBranch || !branches.includes(selectedBranch)) {
      setSelectedBranch(branches[0]);
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
    setBranchOpen(false);
    setBranchQuery("");
  };

  return (
    <div className={styles.sidebar}>
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
                      key={branch}
                      type="button"
                      className={styles.branchOption}
                      onClick={() => handleBranchSelect(branch)}
                    >
                      {branch}
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
        {/* Dashboard */}
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
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
