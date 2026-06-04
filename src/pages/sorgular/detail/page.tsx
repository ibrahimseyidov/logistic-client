"use client";

import React, { useMemo, useState } from "react";
import Loading from "../../../common/components/loading/Loading";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaHistory, FaPlus, FaRedo } from "react-icons/fa";
import {
  buildSorguDetailView,
  type SorguDetailTabId,
} from "../lib/sorguDetailViewModel";
import {
  fetchQueryDetailAction,
  fetchCommentsAction,
  addCommentAction,
  fetchDocumentsAction,
  uploadDocumentAction,
  deleteDocumentAction,
  updateQueryAction
} from "../../../common/actions/query.actions";
import type { LogisticQueryRow } from "../types/sorgu.types";
import styles from "./page.module.css";
import { QueryOffersList } from "./components/QueryOffersList";
import { QueryCommentsList } from "./components/QueryCommentsList";
import { QueryDocumentsList } from "./components/QueryDocumentsList";
import { showNotification } from "../../../common/store/modalSlice";
import { useAppDispatch } from "../../../common/store/hooks";
import { ConfirmModal } from "../../../common/components/ConfirmModal";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>{title}</div>
      <div style={{ padding: "0.5rem 0", fontSize: 14 }}>{children}</div>
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
      style={{ display: "flex", alignItems: "start", gap: 12, padding: "4px 0" }}
    >
      <dt
        style={{
          minWidth: 120,
          color: "#64748b",
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        {label}:
      </dt>
      <dd style={{ color: "#1e293b", fontSize: 13, fontWeight: 500, flex: 1 }}>
        {value === undefined || value === null || value === "" || value === "—" ? (
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
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<SorguDetailTabId>("main");
  const [row, setRow] = useState<LogisticQueryRow | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [comments, setComments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detay verisini backend'den çek
  const loadDetail = async () => {
    if (!sorguKey) return;
    setLoading(true);
    try {
      const data = await fetchQueryDetailAction(sorguKey);
      setRow(data);
      if (data.comments) setComments(data.comments);
      if (data.documents) setDocuments(data.documents);
    } catch (error) {
      setRow(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDetail();
  }, [sorguKey]);

  // Tab değişiminde veri çekme (gerekirse)
  React.useEffect(() => {
    if (tab === "comments" && row) {
      fetchCommentsAction(row.id).then(setComments);
    } else if (tab === "documents" && row) {
      fetchDocumentsAction(row.id).then(setDocuments);
    }
  }, [tab, row?.id]);

  const detail = useMemo(() => (row ? buildSorguDetailView(row) : null), [row]);

  const handleAddComment = async (text: string) => {
    if (!row) return;
    try {
      const comment = await addCommentAction(row.id, text);
      setComments([comment, ...comments]);
      dispatch(showNotification({ message: "Şərh əlavə edildi", type: "success" }));
    } catch (error) {
      dispatch(showNotification({ message: "Xəta baş verdi", type: "error" }));
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!row) return;
    try {
      const doc = await uploadDocumentAction(row.id, file);
      setDocuments([doc, ...documents]);
      dispatch(showNotification({ message: "Sənəd yükləndi", type: "success" }));
    } catch (error) {
      dispatch(showNotification({ message: "Yüklənərkən xəta", type: "error" }));
    }
  };

  const handleDeleteDocument = (docId: number) => {
    setDocToDelete(docId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteDoc = async () => {
    if (!row || docToDelete === null) return;
    setIsDeleting(true);
    try {
      await deleteDocumentAction(row.id, docToDelete);
      setDocuments(documents.filter((d) => d.id !== docToDelete));
      dispatch(showNotification({ message: "Sənəd silindi", type: "success" }));
      setDeleteConfirmOpen(false);
      setDocToDelete(null);
    } catch (error) {
      dispatch(showNotification({ message: "Silinərkən xəta", type: "error" }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddOffer = async (offer: any) => {
    if (!row) return;
    try {
      let currentOffers = [];
      if (row.priceOffers) {
        try {
          currentOffers = JSON.parse(row.priceOffers);
        } catch(e) {}
      } else if (row.priceOfferItems) {
        currentOffers = row.priceOfferItems;
      }
      
      const newOffers = [...currentOffers, offer];
      const priceOffersStr = JSON.stringify(newOffers);
      
      await updateQueryAction(row.id, { priceOffersJson: priceOffersStr });
      
      // Update local state by re-fetching detail
      await loadDetail();
      dispatch(showNotification({ message: "Qiymət təklifi əlavə edildi", type: "success" }));
    } catch (error) {
      dispatch(showNotification({ message: "Xəta baş verdi", type: "error" }));
    }
  };

  if (loading)
    return (
      <div style={{ position: "relative", minHeight: 320 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            background: "rgba(255,255,255,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loading />
        </div>
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
      label: `Sənədlər (${documents.length})`,
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
          <FaArrowLeft />
          Geri
        </button>
        <h1 className={styles.title}>Sorğu detalı: {r.number}</h1>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <button type="button" className={styles.editBtn}>
              <FaPlus /> Redaktə et
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <span className={styles.status}>{r.status}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={loadDetail}
                  title="Yenilə"
                >
                  <FaRedo />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Tarixçə"
                >
                  <FaHistory />
                </button>
              </div>
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
              <DlRow label="Cargo Specs" value={detail.cargoSpecs} />
              <DlRow label="Mənbə" value={detail.source} />
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
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: 24,
                  }}
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
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 16,
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "0.5rem" }}>
                      <p style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Miqdarı</p>
                      <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 18 }}>{detail.quantityTotal}</p>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "0.5rem" }}>
                      <p style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>LDM</p>
                      <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 18 }}>{detail.ldmTotal}</p>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "0.5rem" }}>
                      <p style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Çəkisi (kq)</p>
                      <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 18 }}>{detail.weightTotal}</p>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "0.5rem" }}>
                      <p style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Həcmi (m³)</p>
                      <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 18 }}>{detail.volumeLabel}</p>
                    </div>
                  </div>
                  <DlRow label="Nəqliyyatın tipi" value={r.transportType} />
                </SectionCard>

                <SectionCard title="Yük haqqında əlavə məlumat">
                  {detail.cargoBoxLines.length > 0 ? (
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {detail.cargoBoxLines.map((line, i) => (
                        <li key={i} style={{ 
                          padding: "8px 12px", 
                          background: "#f8fafc", 
                          borderRadius: "4px",
                          fontSize: 13,
                          color: "#334155",
                          borderLeft: "3px solid #cbd5e1"
                        }}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "#cbd5e1", fontSize: 13, fontStyle: "italic" }}>Məlumat yoxdur.</p>
                  )}
                </SectionCard>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 24,
                  }}
                >
                  <SectionCard title="Şərtlər">
                    <div className={styles.dlList}>
                      <DlRow label="Incoterms" value={detail.incoterms} />
                      <DlRow label="Cargo Specs" value={detail.cargoSpecs} />
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {tab === "comments" && (
              <QueryCommentsList 
                comments={comments.map(c => ({
                  id: c.id,
                  text: c.text,
                  userName: c.user?.name || "Bilinməyən",
                  createdAt: c.createdAt
                }))} 
                onAddComment={handleAddComment} 
              />
            )}
            {tab === "offers" && (
              <QueryOffersList offers={detail.priceOfferItems} onAddOffer={handleAddOffer} />
            )}
            {tab === "documents" && (
              <QueryDocumentsList 
                documents={documents.map(d => ({
                  id: d.id,
                  name: d.name,
                  type: d.type,
                  size: d.size,
                  createdAt: d.createdAt,
                  url: d.url.startsWith("http") ? d.url : `http://localhost:5000${d.url}`
                }))} 
                onUpload={handleUploadDocument}
                onDelete={handleDeleteDocument}
              />
            )}
            {tab === "tasks" && (
              <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", padding: "2rem" }}>
                Tapşırıqlar tezliklə.
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>Logistra Copyright © 2013-2026</footer>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Sənədi sil"
        message="Bu sənədi silmək istədiyinizə əminsiniz?"
        onConfirm={handleConfirmDeleteDoc}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDocToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}
