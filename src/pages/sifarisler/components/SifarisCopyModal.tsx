import { useState } from "react";
import { FiX } from "react-icons/fi";
import Select from "../../../common/components/select/Select";
import type { SifarisOrderRow } from "../types/sifaris.types";
import styles from "../../sorgular/components/SorgularNewModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newNumber: string, options: Record<string, boolean>) => void;
  order: SifarisOrderRow;
}

export default function SifarisCopyModal({
  isOpen,
  onClose,
  onConfirm,
  order,
}: Props) {
  if (!isOpen) return null;

  // Local state for checkboxes matching the screenshot
  const [checkedOptions, setCheckedOptions] = useState<Record<string, boolean>>({
    customerOrderRef: true,
    status: false,
    paymentTerms: false,
    contractNumber: false,
    manager: true,
    expeditor: true,
    extraManagers: true,
    tags: true,
    loads: true,
    voyages: true,
    documents_applications: false,
    documents_double_invoices: false,
    documents_received_invoices: false,
    documents_slips: false,
    documents_acts: false,
    documents_others: false,
    documents_photos: false,
    expenses: true,
    voyages_expenses: false,
    unforeseen_expenses: false,
    comments: false,
    tasks: false,
    freeze_order: false,
  });

  const [newOrderNumber, setNewOrderNumber] = useState(`${order.orderNumber} - surət`);
  const [templateName, setTemplateName] = useState("Surətini çıxarma");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const toggleOption = (key: string) => {
    setCheckedOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleClearAll = () => {
    setCheckedOptions((prev) => {
      const cleared: Record<string, boolean> = {};
      Object.keys(prev).forEach((k) => {
        cleared[k] = false;
      });
      return cleared;
    });
  };

  const handleApply = () => {
    onConfirm(newOrderNumber, checkedOptions);
  };

  return (
    <div className={styles.nestedRoot}>
      <div className={styles.nestedBackdrop} onClick={onClose} />
      <div
        className={styles.nestedCard}
        style={{
          width: "min(100%, 960px)",
          borderRadius: "1.25rem",
          overflow: "hidden",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
        }}
      >
        {/* Header */}
        <div
          className={styles.nestedHeader}
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            padding: "1.25rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 className={styles.nestedTitle} style={{ fontSize: "1.25rem", color: "#1e293b", fontWeight: 600 }}>
            Surətini çıxarma
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: "1.25rem",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              padding: "0.25rem",
              borderRadius: "0.375rem",
            }}
            aria-label="Bağla"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className={styles.nestedBody} style={{ padding: "2rem", overflowY: "auto", maxHeight: "70vh" }}>
          {/* Top Form Rows */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
              marginBottom: "1.5rem",
              background: "#ffffff",
              padding: "1.25rem",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
            }}
          >
            <label className={styles.label} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>Şablon</span>
              <Select
                value={templateName}
                options={[
                  { value: "Surətini çıxarma", label: "Surətini çıxarma" },
                  { value: "Standart Şablon", label: "Standart Şablon" },
                ]}
                onChange={setTemplateName}
              />
            </label>
            <label className={styles.label} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>Şablonun adı</span>
              <input
                type="text"
                className={styles.input}
                value={newOrderNumber}
                onChange={(e) => setNewOrderNumber(e.target.value)}
                style={{ height: "3rem", borderRadius: "0.85rem", border: "1px solid #dbe4f0", padding: "0 0.95rem" }}
              />
            </label>
            <div style={{ display: "flex", alignItems: "center", paddingTop: "1.25rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer" }}
                />
                Şablon kimi yaddaşda saxla
              </label>
            </div>
          </div>

          {/* Three Column Checkbox Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "2rem",
              paddingTop: "0.5rem",
            }}
          >
            {/* Column 1: Əsas Məlumat */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.825rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Əsas məlumat</h4>
              {[
                { key: "customerOrderRef", label: "Müştəridə olan sifarişin nömrəsi" },
                { key: "status", label: "Sifarişin statusu" },
                { key: "paymentTerms", label: "Qiymət və ödənişin şərtləri" },
                { key: "contractNumber", label: "Müştəri ilə müqavilənin nömrəsi" },
                { key: "manager", label: "Menecer" },
                { key: "expeditor", label: "Ekspeditor" },
                { key: "extraManagers", label: "Əlavə menecerlər" },
                { key: "tags", label: "Teqlər" },
              ].map((opt) => (
                <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", fontSize: "0.875rem", color: "#1e293b" }}>
                  <input
                    type="checkbox"
                    checked={checkedOptions[opt.key]}
                    onChange={() => toggleOption(opt.key)}
                    style={{
                      width: "1.15rem",
                      height: "1.15rem",
                      accentColor: "#16a34a",
                      cursor: "pointer",
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {/* Column 2: Göndərilmələr & Sənədlər */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Göndərilmələr */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.825rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Göndərilmələr</h4>
                {[
                  { key: "loads", label: "Yüklər" },
                  { key: "voyages", label: "Reyslər" },
                ].map((opt) => (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", fontSize: "0.875rem", color: "#1e293b" }}>
                    <input
                      type="checkbox"
                      checked={checkedOptions[opt.key]}
                      onChange={() => toggleOption(opt.key)}
                      style={{
                        width: "1.15rem",
                        height: "1.15rem",
                        accentColor: "#16a34a",
                        cursor: "pointer",
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Sənədlər */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.825rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Sənədlər</h4>
                {[
                  { key: "documents_applications", label: "Ərizə-müraciətləri" },
                  { key: "documents_double_invoices", label: "İrəli sürülmüş hesablar" },
                  { key: "documents_received_invoices", label: "Alınmış hesablar" },
                  { key: "documents_slips", label: "Qaimələr" },
                  { key: "documents_acts", label: "Aktlar" },
                  { key: "documents_others", label: "Digər sənədlər" },
                  { key: "documents_photos", label: "Fotoşəkillər" },
                ].map((opt) => (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", fontSize: "0.875rem", color: "#1e293b" }}>
                    <input
                      type="checkbox"
                      checked={checkedOptions[opt.key]}
                      onChange={() => toggleOption(opt.key)}
                      style={{
                        width: "1.15rem",
                        height: "1.15rem",
                        accentColor: "#16a34a",
                        cursor: "pointer",
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Column 3: Xərclər & Digərlər */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Xərclər */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.825rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Xərclər</h4>
                {[
                  { key: "expenses", label: "Əlavə xərclər" },
                  { key: "voyages_expenses", label: "Reyslərin xərcləri" },
                  { key: "unforeseen_expenses", label: "Nəzərə alınmamış xərclər" },
                ].map((opt) => (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", fontSize: "0.875rem", color: "#1e293b" }}>
                    <input
                      type="checkbox"
                      checked={checkedOptions[opt.key]}
                      onChange={() => toggleOption(opt.key)}
                      style={{
                        width: "1.15rem",
                        height: "1.15rem",
                        accentColor: "#16a34a",
                        cursor: "pointer",
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Digərlər */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.825rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Digərlər</h4>
                {[
                  { key: "comments", label: "Şərhlər" },
                  { key: "tasks", label: "Tapşırıqlar" },
                  { key: "freeze_order", label: "Sifarişin dondurulması" },
                ].map((opt) => (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", fontSize: "0.875rem", color: "#1e293b" }}>
                    <input
                      type="checkbox"
                      checked={checkedOptions[opt.key]}
                      onChange={() => toggleOption(opt.key)}
                      style={{
                        width: "1.15rem",
                        height: "1.15rem",
                        accentColor: "#16a34a",
                        cursor: "pointer",
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={styles.nestedFooter}
          style={{
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "1rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              background: "transparent",
              border: 0,
              color: "#ef4444",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              padding: "0.5rem 0",
              transition: "color 0.2s ease",
            }}
          >
            Hamısını təmizlə
          </button>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              className={styles.secondaryButton}
              style={{
                border: "1px solid #dbe4f0",
                background: "#ffffff",
                color: "#475569",
                borderRadius: "0.5rem",
                padding: "0.5rem 1.25rem",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Ləğv et
            </button>
            <button
              type="button"
              onClick={handleApply}
              style={{
                border: "1px solid #3b82f6",
                background: "#3b82f6",
                color: "#ffffff",
                borderRadius: "0.5rem",
                padding: "0.5rem 1.5rem",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                transition: "background-color 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
            >
              Tətbiq et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
