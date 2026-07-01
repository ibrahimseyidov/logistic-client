import React, { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "../../common/contexts/AuthContext";
import { isAdminUser } from "../../common/utils/auth.utils";
import { INCOTERMS_OPTIONS, CARGO_TRANSPORT_OPTIONS } from "../sorgular/constants/options.constants";
import {
  getAyarlarTabLabel,
  parseAyarlarTab,
  type AyarlarTab,
} from "./constants/ayarlar.constants";
import { LookupOptionsSection } from "./components/LookupOptionsSection";
import { ApiLookupOptionsSection } from "./components/ApiLookupOptionsSection";
import { UsersSection } from "./components/UsersSection";
import { ContactPersonsSection } from "./components/ContactPersonsSection";
import ayarlarStyles from "./ayarlar.module.css";
import { CONTACT_POSITIONS_LOOKUP_TYPE } from "../../common/utils/contactPosition.utils";

const CARGO_SPECS_SEED = [
  { value: "stackable", label: "Stackable" },
  { value: "non-dangerous", label: "Non dangerous" },
];

const AyarlarPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = parseAyarlarTab(requestedTab);
  const [activeTab, setActiveTab] = useState<AyarlarTab>(initialTab);

  const { user } = useAuth();

  useEffect(() => {
    const nextTab = parseAyarlarTab(requestedTab);
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [requestedTab]);

  if (user && !isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  // If user is null (still loading bootstrap data), we could show a loader, but AppShell handles the main layout.
  // We can just return null or let it render (it will redirect once user is loaded).
  if (!user) {
    return null;
  }

  return (
    <div className={ayarlarStyles.page}>
      {activeTab === "users" && <UsersSection />}

      {activeTab === "cargo-specs" && (
        <LookupOptionsSection
          storageKey="cargo-specs"
          title={getAyarlarTabLabel("cargo-specs")}
          seed={CARGO_SPECS_SEED}
        />
      )}

      {activeTab === "incoterms" && (
        <LookupOptionsSection
          storageKey="incoterms"
          title={getAyarlarTabLabel("incoterms")}
          seed={INCOTERMS_OPTIONS}
        />
      )}

      {activeTab === "contact-persons" && <ContactPersonsSection />}

      {activeTab === "contact-positions" && (
        <ApiLookupOptionsSection
          lookupType={CONTACT_POSITIONS_LOOKUP_TYPE}
          title="Vəzifə"
          singleField
        />
      )}

      {activeTab === "transport-types" && (
        <LookupOptionsSection
          storageKey="transport-types"
          title="Nəqliyyat tipləri"
          seed={CARGO_TRANSPORT_OPTIONS}
        />
      )}
    </div>
  );
};

export default AyarlarPage;
