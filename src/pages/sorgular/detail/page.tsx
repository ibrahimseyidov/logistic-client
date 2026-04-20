"use client";

import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaHistory, FaPlus, FaRedo } from "react-icons/fa";
import {
  buildSorguDetailView,
  type SorguDetailTabId,
} from "../lib/sorguDetailViewModel";
import axios from "axios";
import type { LogisticQueryRow } from "../types/sorgu.types";
import styles from "./page.module.css";

const tabBase =
  "px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap";
const tabActive = "border-indigo-600 text-indigo-700";
const tabIdle = "border-transparent text-gray-500 hover:text-gray-700";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.card}>
      <div
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: "#334155",
          borderBottom: "1px solid #e5e7eb",
          background: "#f1f5f9",
          padding: "0.5rem 1rem",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "1rem 0.5rem", fontSize: 14 }}>{children}</div>
    </section>
  );
}

// Label-value satırı için yardımcı fonksiyon
function DlRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div
      style={{ display: "flex", alignItems: "start", gap: 8, padding: "2px 0" }}
    >
      <dt
        style={{
          minWidth: 110,
          color: "#64748b",
          fontWeight: 500,
          fontSize: 12,
        }}
      >
        {label}:
      </dt>
      <dd style={{ color: "#0f172a", fontSize: 13, wordBreak: "break-all" }}>
        {value === undefined || value === null || value === "" ? (
          <span style={{ color: "#cbd5e1" }}>—</span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export default function SorguDetailPage() {
  const { sorguKey } = useParams<{ sorguKey: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<SorguDetailTabId>("main");
  const [row, setRow] = useState<LogisticQueryRow | null>(null);
  const [loading, setLoading] = useState(false);

  // Detay verisini backend'den çek
  React.useEffect(() => {
    if (!sorguKey) return;
    setLoading(true);
    axios
      .get(`/api/query/${sorguKey}`)
      .then((res) => setRow(res.data))
      .catch(() => setRow(null))
      .finally(() => setLoading(false));
  }, [sorguKey]);

  const detail = useMemo(() => (row ? buildSorguDetailView(row) : null), [row]);

  if (loading)
    return (
      <div
        className={styles.content}
        style={{
          textAlign: "center",
          fontSize: 18,
          fontWeight: 600,
          color: "#64748b",
        }}
      >
        Yüklənir...
      </div>
    );
  if (!detail) return null;

  const { row: r } = detail;

  const tabs: { id: SorguDetailTabId; label: string }[] = [
    { id: "main", label: "Əsas məlumat" },
    { id: "comments", label: "Şərhlər" },
    {
      id: "offers",
      label: `Qiymət təklifləri (${detail.offersCount})`,
    },
    {
      id: "documents",
      label: `Sənədlər (${detail.documentsCount})`,
    },
    { id: "tasks", label: "Tapşırıqlar" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={styles.backBtn}
        >
          <FaArrowLeft style={{ fontSize: 18 }} aria-hidden />
          Geri
        </button>
        <h1 className={styles.title}>Sorğu detallı</h1>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <button type="button" className={styles.editBtn}>
              <FaPlus style={{ fontSize: 14 }} aria-hidden />
              Redaktə et
            </button>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <span className={styles.status}>{r.status}</span>
              <button
                type="button"
                className={styles.iconBtn}
                title="Yenilə"
                aria-label="Yenilə"
              >
                <FaRedo style={{ fontSize: 16 }} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                title="Tarixçə"
                aria-label="Tarixçə"
              >
                <FaHistory style={{ fontSize: 16 }} />
              </button>
            </div>
            <div className={styles.dlList}>
              <DlRow label="Satıcı" value={detail.seller} />
              <DlRow label="Sorğunun tarixi" value={detail.inquiryDateLabel} />
              <DlRow label="İstiqamət" value={detail.direction} />
              <DlRow label="Şirkət" value={r.company} />
              <DlRow label="Müştəri" value={r.customer} />
              <DlRow label="Ünvan" value={detail.summaryAddress} />
              <DlRow label="Əlaqədar şəxslər" value={detail.contacts} />
              <DlRow label="Sorğunun məqsədi" value={r.purpose} />
              <DlRow label="Ümumi miqdar" value={detail.quantityTotal} />
              <DlRow label="Ümumi LDM" value={detail.ldmTotal} />
              <DlRow label="Ümumi çəki" value={detail.weightTotal} />
              <DlRow label="Ümumi həcm" value={detail.volumeLabel} />
              <DlRow label="Incoterms" value={detail.incoterms} />
              <DlRow label="Cargo Specifications" value={detail.cargoSpecs} />
              <DlRow label="Sorğunun alınması mənbəyi" value={detail.source} />
            </div>
          </div>
        </aside>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minHeight: 0,
          }}
        >
          <div className={styles.tabs}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={
                  tab === t.id
                    ? `${styles.tabBtn} ${styles.tabBtnActive}`
                    : styles.tabBtn
                }
                tabIndex={0}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.content}>
            {tab === "main" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 24,
                  }}
                  className="lg:grid-cols-2"
                >
                  <SectionCard title="Haradan">
                    <div className={styles.dlList}>
                      <DlRow label="Ölkə" value={detail.fromCountry} />
                      <DlRow label="Şəhər" value={detail.fromCity} />
                      <DlRow label="Ünvan" value={detail.fromAddress} />
                    </div>
                  </SectionCard>
                  <SectionCard title="Haraya">
                    <div className={styles.dlList}>
                      <DlRow label="Ölkə" value={detail.toCountry} />
                      <DlRow label="Şəhər" value={detail.toCity} />
                      <DlRow label="Ünvan" value={detail.toAddress} />
                    </div>
                  </SectionCard>
                </div>

                <SectionCard title={`Yük: ${detail.cargoTitle}`}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 16,
                      marginBottom: 16,
                    }}
                    className="sm:grid-cols-4"
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        Miqdarı
                      </p>
                      <p
                        style={{
                          color: "#0f172a",
                          fontWeight: 600,
                          fontSize: 18,
                        }}
                      >
                        {detail.quantityTotal}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        LDM
                      </p>
                      <p
                        style={{
                          color: "#0f172a",
                          fontWeight: 600,
                          fontSize: 18,
                        }}
                      >
                        {detail.ldmTotal}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        Çəkisi
                      </p>
                      <p
                        style={{
                          color: "#0f172a",
                          fontWeight: 600,
                          fontSize: 18,
                        }}
                      >
                        {detail.weightTotal}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        Həcmi
                      </p>
                      <p
                        style={{
                          color: "#0f172a",
                          fontWeight: 600,
                          fontSize: 18,
                        }}
                      >
                        {detail.volumeLabel}
                      </p>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    Nəqliyyatın tipi
                  </p>
                  <p style={{ color: "#0f172a", fontWeight: 600 }}>
                    {r.transportType}
                  </p>
                </SectionCard>

                <SectionCard title="Yük haqqında əlavə məlumat">
                  {detail.cargoBoxLines.length > 0 ? (
                    <ul
                      style={{
                        listStyle: "disc",
                        paddingLeft: 20,
                        color: "#334155",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {detail.cargoBoxLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "#64748b" }}>Məlumat yoxdur.</p>
                  )}
                </SectionCard>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 24,
                  }}
                  className="sm:grid-cols-2"
                >
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      Incoterms
                    </p>
                    <p style={{ color: "#0f172a", fontWeight: 600 }}>
                      {detail.incoterms}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      Cargo Specifications
                    </p>
                    <p style={{ color: "#0f172a", fontWeight: 600 }}>
                      {detail.cargoSpecs}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tab === "comments" && (
              <p style={{ fontSize: 16, color: "#64748b" }}>
                Şərhlər tezliklə əlavə olunacaq.
              </p>
            )}
            {tab === "offers" && (
              <p style={{ fontSize: 16, color: "#64748b" }}>
                Qiymət təklifləri siyahısı tezliklə.
              </p>
            )}
            {tab === "documents" && (
              <p style={{ fontSize: 16, color: "#64748b" }}>
                Sənədlər tezliklə.
              </p>
            )}
            {tab === "tasks" && (
              <p style={{ fontSize: 16, color: "#64748b" }}>
                Tapşırıqlar tezliklə.
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>Logistra Copyright © 2013-2026</footer>
    </div>
  );
}
