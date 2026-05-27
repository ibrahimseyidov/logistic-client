import { useState } from "react";
import { FaFileAlt } from "react-icons/fa";
import { FiEye, FiCopy, FiTrash2, FiInfo, FiClock, FiCheck, FiFileText, FiFile, FiTruck, FiCheckSquare } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import StatusBadge from "../../../common/components/StatusBadge";
import type { OrderStatusKind, SifarisOrderRow } from "../types/sifaris.types";
import styles from "./SifarisTable.module.css";


function rowTone(kind: OrderStatusKind): string {
  switch (kind) {
    case "planned":
      return styles.rowPlanned;
    case "progress":
      return styles.rowProgress;
    case "completed":
      return styles.rowCompleted;
    default:
      return styles.rowDefault;
  }
}

interface Props {
  rows: SifarisOrderRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAllPage: (ids: string[], checked: boolean) => void;
  onDeleteClick: (id: string) => void;
  onDuplicateClick: (id: string) => void;
  onStatusChange: (id: string, nextStatus: OrderStatusKind) => void;
}

function DocBadge({ present, tooltip, icon }: { present: boolean; tooltip: string; icon: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div 
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div 
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.6rem",
          height: "1.6rem",
          borderRadius: "50%",
          backgroundColor: present ? "#e6fcf5" : "#f1f5f9",
          border: present ? "1.5px solid #099268" : "1.5px solid #cbd5e1",
          color: present ? "#099268" : "#94a3b8",
          fontSize: "0.875rem",
          cursor: "pointer",
          transition: "all 0.2s ease",
          transform: hovered ? "scale(1.2)" : "scale(1)",
          boxShadow: hovered 
            ? (present ? "0 0 8px rgba(9, 146, 104, 0.4)" : "0 0 8px rgba(148, 163, 184, 0.3)") 
            : "none",
        }}
      >
        {icon}
      </div>
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "130%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1e293b",
            color: "#ffffff",
            padding: "0.35rem 0.65rem",
            borderRadius: "0.25rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            zIndex: 99999,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            pointerEvents: "none",
          }}
        >
          {tooltip}
          <div 
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #1e293b",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function SifarisTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAllPage,
  onDeleteClick,
  onDuplicateClick,
  onStatusChange,
}: Props) {
  const navigate = useNavigate();
  const [historyOrder, setHistoryOrder] = useState<SifarisOrderRow | null>(null);
  const pageIds = rows.map((r) => r.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));



  const STATUS_OPTIONS: Array<{ value: OrderStatusKind; label: string; bg: string; text: string; dot: string; border: string }> = [
    { value: "planned", label: "Planlaşdırılıb", bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6", border: "#bfdbfe" },
    { value: "progress", label: "Davam edir", bg: "#fef3c7", text: "#b45309", dot: "#f59e0b", border: "#fde68a" },
    { value: "completed", label: "Tamamlandı", bg: "#ecfdf5", text: "#047857", dot: "#10b981", border: "#a7f3d0" },
    { value: "finance_closed", label: "Maliyyə cəhətdən bağlandı", bg: "#e0e7ff", text: "#4338ca", dot: "#6366f1", border: "#c7d2fe" },
    { value: "cancelled", label: "Sifariş ləğv edildi", bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444", border: "#fecaca" },
  ];

  return (
    <>
    <table className={styles.table}>
      <thead className={styles.head}>
        <tr>
          <th className={`${styles.headerCell} ${styles.checkboxHeader}`}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={allSelected}
              onChange={(e) => onToggleAllPage(pageIds, e.target.checked)}
              aria-label="Səhifədəki bütün sətirlər"
            />
          </th>
          <th className={styles.headerCell}>Sifarişin nömrəsi</th>
          <th className={styles.headerCell}>Sorğunun nömrəsi</th>
          <th className={styles.headerCell}>Reysin nömrəsi</th>
          <th className={styles.headerCell}>Sorğunun tarixi</th>
          <th className={styles.headerCell}>Sifarişin tarixi</th>
          <th className={styles.headerCell}>Sifarişin statusu</th>
          <th className={`${styles.headerCell} ${styles.min160}`}>Müştəri</th>
          <th className={`${styles.headerCell} ${styles.min140}`}>
            Daşıyıcılar
          </th>

          <th className={`${styles.headerCell} ${styles.min140}`}>
            Marşrutlar
          </th>
          <th className={`${styles.headerCell} ${styles.min180}`}>
            Yükün parametrləri
          </th>
          <th className={styles.headerCell}>Fraxt</th>
          <th className={styles.headerCell}>Əlavə xərclər</th>
          <th className={styles.headerCell}>Mənfəət</th>
          <th className={styles.headerCell}>Sənədlər</th>
          <th className={styles.headerCell} style={{ width: "6rem" }}>
            Hərəkətlər
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className={rowTone(row.statusKind)}>
            <td className={`${styles.cell} ${styles.center}`}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedIds.has(row.id)}
                onChange={() => onToggleRow(row.id)}
                aria-label={`Seç: ${row.orderNumber}`}
              />
            </td>
            <td
              className={`${styles.cell} ${styles.nowrap} ${styles.primaryText}`}
            >
              <Link
                to={`/sifarisler/${row.id}`}
                style={{
                  color: "#16a34a",
                  textDecoration: "none",
                  fontWeight: 600,
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#15803d")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#16a34a")}
              >
                {row.orderNumber}
              </Link>
            </td>
            <td
              className={`${styles.cell} ${styles.nowrap} ${styles.primaryText}`}
            >
              {row.queryNumber}
            </td>
            <td
              className={`${styles.cell} ${styles.nowrap} ${styles.primaryText}`}
            >
              {row.voyageNumber}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.nowrap}`}
            >
              {row.queryDate}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.nowrap}`}
            >
              {row.orderDate}
            </td>
             <td className={`${styles.cell} ${styles.nowrap}`} style={{ verticalAlign: "middle" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                {(() => {
                  const currentOpt = STATUS_OPTIONS.find((o) => o.value === row.statusKind) || STATUS_OPTIONS[0];
                  return (
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button
                          type="button"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            border: `1px solid ${currentOpt.border}`,
                            borderRadius: "999px",
                            padding: "0.3rem 0.85rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            outline: "none",
                            backgroundColor: currentOpt.bg,
                            color: currentOpt.text,
                            transition: "all 0.2s ease",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: currentOpt.dot }} />
                          {currentOpt.label}
                          <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: "0.125rem" }}>
                            <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          style={{
                            zIndex: 9999,
                            minWidth: "220px",
                            borderRadius: "0.85rem",
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#ffffff",
                            padding: "0.5rem",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            outline: "none",
                          }}
                          sideOffset={4}
                          align="start"
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {STATUS_OPTIONS.map((opt) => {
                              const isSelected = row.statusKind === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => onStatusChange(row.id, opt.value)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    border: 0,
                                    background: isSelected ? "#f1f5f9" : "transparent",
                                    color: isSelected ? opt.text : "#334155",
                                    borderRadius: "0.5rem",
                                    padding: "0.5rem 0.75rem",
                                    fontSize: "0.8rem",
                                    fontWeight: isSelected ? 700 : 600,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.15s ease",
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = isSelected ? "#f1f5f9" : "#f8fafc";
                                    if (!isSelected) e.currentTarget.style.color = opt.text;
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = isSelected ? "#f1f5f9" : "transparent";
                                    if (!isSelected) e.currentTarget.style.color = "#334155";
                                  }}
                                >
                                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: opt.dot }} />
                                    {opt.label}
                                  </span>
                                  {isSelected && <FiCheck style={{ color: opt.text, fontSize: "0.85rem" }} />}
                                </button>
                              );
                            })}
                          </div>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setHistoryOrder(row)}
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "0.25rem",
                    borderRadius: "999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                    e.currentTarget.style.color = "#0f172a";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#64748b";
                  }}
                  title="Status Tarixçəsi"
                >
                  <FiClock style={{ fontSize: "0.95rem" }} />
                </button>
              </div>
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.smallText}`}
            >
              <div>{row.customer}</div>
              <div className={`${styles.softText} ${styles.customerMeta}`}>
                {row.customerRefs}
              </div>
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.smallText} ${styles.preLine}`}
            >
              {row.carriers}
            </td>

            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.nowrap}`}
            >
              {row.route}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.preLine} ${styles.smallText} ${styles.max240}`}
            >
              {row.cargoParams ? row.cargoParams.replace(/\n?Say:\s*\d+/gi, "") : ""}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.nowrap}`}
            >
              {row.freight}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.nowrap}`}
            >
              {row.extraCosts}
            </td>
            <td
              className={`${styles.cell} ${styles.profitText} ${styles.nowrap}`}
            >
              {row.profit}
            </td>
            <td className={styles.cell}>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", justifyContent: "center" }}>
                <DocBadge present={!!row.hasSentInvoice} tooltip="Göndərilən hesab-faktura" icon={<FiFileText />} />
                <DocBadge present={!!row.hasReceivedInvoice} tooltip="Bizə gələn hesab-faktura" icon={<FiFile />} />
                <DocBadge present={!!row.hasTransportDoc} tooltip="Daşınma sənədi / CMR" icon={<FiTruck />} />
                <DocBadge present={!!row.hasHandoverAct} tooltip="Təhvil-təslim aktı" icon={<FiCheckSquare />} />
              </div>
            </td>
            <td
              className={styles.cell}
              style={{ 
                textAlign: "center", 
                verticalAlign: "middle",
                whiteSpace: "nowrap"
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", alignItems: "center" }}>
                <button
                  type="button"
                  title="Detallara baxmaq"
                  onClick={() => {
                    navigate(`/sifarisler/${row.id}`);
                  }}
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    color: "#3b82f6",
                    padding: "0.375rem",
                    borderRadius: "0.375rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#eff6ff";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiEye style={{ fontSize: "1.1rem" }} />
                </button>

                <button
                  type="button"
                  title="Kopyalamaq"
                  onClick={() => onDuplicateClick(row.id)}
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    color: "#10b981",
                    padding: "0.375rem",
                    borderRadius: "0.375rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#ecfdf5";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiCopy style={{ fontSize: "1.1rem" }} />
                </button>

                <button
                  type="button"
                  title="Silmək"
                  onClick={() => onDeleteClick(row.id)}
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    color: "#ef4444",
                    padding: "0.375rem",
                    borderRadius: "0.375rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#fef2f2";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiTrash2 style={{ fontSize: "1.1rem" }} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

      {/* Center History Modal Overlay */}
      {historyOrder && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div 
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setHistoryOrder(null)}
          />
          <div 
            style={{
              position: "relative",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "1.25rem",
              width: "min(100%, 28rem)",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
              overflow: "hidden",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {/* Header */}
            <div 
              style={{
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                Sifarişin Status Tarixçəsi
              </h3>
              <button
                type="button"
                onClick={() => setHistoryOrder(null)}
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
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(historyOrder.statusHistory && historyOrder.statusHistory.length > 0) ? (
                  historyOrder.statusHistory.map((item, idx) => {
                    let color = "#1d4ed8";
                    if (item.status === "Davam edir") color = "#b45309";
                    else if (item.status === "Tamamlandı") color = "#047857";
                    else if (item.status === "Maliyyə cəhətdən bağlandı") color = "#4338ca";
                    else if (item.status === "Sifariş ləğv edildi") color = "#b91c1c";

                    return (
                      <div key={idx} style={{ position: "relative", paddingLeft: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                        {idx !== historyOrder.statusHistory!.length - 1 && (
                          <div style={{ position: "absolute", left: "5px", top: "16px", bottom: "-12px", width: "1px", backgroundColor: "#cbd5e1" }} />
                        )}
                        <div style={{ position: "absolute", left: 0, top: "6px", width: "10px", height: "10px", borderRadius: "50%", border: "2px solid #ffffff", backgroundColor: color, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
                          <span 
                            style={{ 
                              fontSize: "0.85rem", 
                              fontWeight: 700, 
                              color: color,
                            }}
                          >
                            {item.status}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                            {item.date.includes("tərəfindən") ? item.date : `${item.date} (tərəfindən: Ulvi Adilzade)`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ margin: 0, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "1rem 0" }}>Tarixçə tapılmadı.</p>
                )}
              </div>
            </div>
            {/* Footer */}
            <div 
              style={{
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                padding: "1rem 1.5rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setHistoryOrder(null)}
                style={{
                  border: "1px solid #dbe4f0",
                  background: "#ffffff",
                  color: "#475569",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 1.25rem",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
