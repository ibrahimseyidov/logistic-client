import React, { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "../../common/contexts/AuthContext";
import { usePermissions } from "../../common/hooks/usePermissions";
import { INCOTERMS_OPTIONS, CARGO_TRANSPORT_OPTIONS } from "../sorgular/constants/options.constants";
import {
  getAyarlarTabLabel,
  parseAyarlarTab,
  type AyarlarTab,
} from "./constants/ayarlar.constants";
import { ayarlarTabToPermChild } from "./lib/permissions.utils";
import { LookupOptionsSection } from "./components/LookupOptionsSection";
import { UsersSection } from "./components/UsersSection";
import { DocumentsSection } from "./components/DocumentsSection";
import { LogsSection } from "./components/LogsSection";
import { CashSettingsSection } from "./components/CashSettingsSection";
import ayarlarStyles from "./ayarlar.module.css";

const CARGO_SPECS_SEED = [
  { value: "stackable", label: "Stackable" },
  { value: "non-dangerous", label: "Non dangerous" },
];

const AyarlarPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = parseAyarlarTab(requestedTab);
  const [activeTab, setActiveTab] = useState<AyarlarTab>(initialTab);

  const { user, authReady } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = usePermissions();

  useEffect(() => {
    const nextTab = parseAyarlarTab(requestedTab);
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [requestedTab]);

  if (!authReady || !user) {
    return null;
  }

  const tabChild = ayarlarTabToPermChild(activeTab);
  if (!canView("ayarlar", tabChild)) {
    return <Navigate to="/no-access" replace />;
  }

  const usersCrud = {
    canCreate: canCreate("ayarlar", "users"),
    canEdit: canEdit("ayarlar", "users"),
    canDelete: canDelete("ayarlar", "users"),
  };
  const lookupsCrud = {
    canCreate: canCreate("ayarlar", "lookups"),
    canEdit: canEdit("ayarlar", "lookups"),
    canDelete: canDelete("ayarlar", "lookups"),
  };
  const documentsCrud = {
    canCreate: canCreate("ayarlar", "documents"),
    canEdit: canEdit("ayarlar", "documents"),
    canDelete: canDelete("ayarlar", "documents"),
  };

  return (
    <div className={ayarlarStyles.page}>
      {activeTab === "users" && <UsersSection {...usersCrud} />}

      {activeTab === "cash" && (
        <CashSettingsSection canEdit={canEdit("ayarlar", "cash")} />
      )}

      {activeTab === "cargo-specs" && (
        <LookupOptionsSection
          storageKey="cargo-specs"
          title={getAyarlarTabLabel("cargo-specs")}
          seed={CARGO_SPECS_SEED}
          {...lookupsCrud}
        />
      )}

      {activeTab === "incoterms" && (
        <LookupOptionsSection
          storageKey="incoterms"
          title={getAyarlarTabLabel("incoterms")}
          seed={INCOTERMS_OPTIONS}
          {...lookupsCrud}
        />
      )}

      {activeTab === "transport-types" && (
        <LookupOptionsSection
          storageKey="transport-types"
          title="Nəqliyyat tipləri"
          seed={CARGO_TRANSPORT_OPTIONS}
          {...lookupsCrud}
        />
      )}

      {activeTab === "documents" && <DocumentsSection {...documentsCrud} />}

      {activeTab === "logs" && <LogsSection />}
    </div>
  );
};

export default AyarlarPage;
