import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { INCOTERMS_OPTIONS } from "../sorgular/constants/options.constants";
import {
  parseAyarlarTab,
  type AyarlarTab,
} from "./constants/ayarlar.constants";
import { LookupOptionsSection } from "./components/LookupOptionsSection";
import { UsersSection } from "./components/UsersSection";
import styles from "../sorgular/sorgular.module.css";

const CARGO_SPECS_SEED = [
  { value: "stackable", label: "Stackable" },
  { value: "non-dangerous", label: "Non dangerous" },
];

const AyarlarPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = parseAyarlarTab(requestedTab);
  const [activeTab, setActiveTab] = useState<AyarlarTab>(initialTab);

  useEffect(() => {
    const nextTab = parseAyarlarTab(requestedTab);
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [requestedTab]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title} style={{ display: "none" }}>
          Ayarlar
        </h1>
      </div>

      {activeTab === "users" && <UsersSection />}

      {activeTab === "cargo-specs" && (
        <LookupOptionsSection
          storageKey="cargo-specs"
          title="Cargo specifications"
          seed={CARGO_SPECS_SEED}
        />
      )}

      {activeTab === "incoterms" && (
        <LookupOptionsSection
          storageKey="incoterms"
          title="Incoterms"
          seed={INCOTERMS_OPTIONS}
        />
      )}
    </div>
  );
};

export default AyarlarPage;
