import { Link } from "react-router-dom";
import { FaCheck, FaClipboard, FaMinus, FaEdit, FaTrash } from "react-icons/fa";
import StatusBadge from "../../../common/components/StatusBadge";
import type { LogisticQueryRow } from "../types/sorgu.types";
import styles from "./SorgularTable.module.css";

import React, { useState, useEffect } from "react";
import { SorgularEditModal } from "./index";
import { updateQuery, deleteQuery, fetchQueryDetail } from "../api";

interface Props {
  rows: LogisticQueryRow[];
}

const COLUMN_COUNT = 17;

function formatCreated(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SorgularTable({ rows }: Props) {
  // Modalı kapatmak için fonksiyon
  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditRow(null);
  };
  // DEBUG: Gelen veriyi kontrol et
  if (rows && rows.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[SorgularTable] İlk row:", rows[0]);
  }
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<LogisticQueryRow | null>(null);
  const [localRows, setLocalRows] = useState<LogisticQueryRow[]>([]);
  // Sync localRows with props.rows
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const handleEditClick = async (row: LogisticQueryRow) => {
    // Detay verisini backend'den çek
    try {
      const detail = await fetchQueryDetail(row.id);
      setEditRow(detail);
      setEditModalOpen(true);
    } catch (e) {
      setEditRow(row);
      setEditModalOpen(true);
    }
  };
  const handleEditSubmit = async (payload: any) => {
    if (!editRow) return;
    try {
      const updated = await updateQuery(editRow.id, payload.fields);
      setLocalRows((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
    } catch (e) {
      // Hata yönetimi eklenebilir
    }
    setEditModalOpen(false);
    setEditRow(null);
  };

  const handleDelete = async (row: LogisticQueryRow) => {
    if (!window.confirm("Bu sorgunu silmək istədiyinizə əminsiniz?")) return;
    try {
      await deleteQuery(row.id);
      setLocalRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      // Hata yönetimi eklenebilir
    }
  };

  return (
    <>
      <table className={styles.table}>
        <thead className={styles.head}>
          <tr>
            <th className={`${styles.headerCell} ${styles.min150}`}>
              Sorğunun nömrəsi
            </th>
            <th className={`${styles.headerCell} ${styles.min140}`}>
              Sorğunun statusu
            </th>
            <th className={`${styles.headerCell} ${styles.min170}`}>
              Sorğunun məqsədi
            </th>
            <th className={`${styles.headerCell} ${styles.min160}`}>
              Yaradıldı
            </th>
            <th className={`${styles.headerCell} ${styles.min140}`}>
              Nəqliyyatın tipi
            </th>
            <th className={`${styles.headerCell} ${styles.min240}`}>
              Yük haqqında məlumat
            </th>
            <th className={`${styles.headerCell} ${styles.min150}`}>
              Göndərən
            </th>
            <th className={`${styles.headerCell} ${styles.min170}`}>
              Yükləmə yeri
            </th>
            <th className={`${styles.headerCell} ${styles.min150}`}>Alıcı</th>
            <th className={`${styles.headerCell} ${styles.min170}`}>
              Boşaltma yeri
            </th>
            <th className={`${styles.headerCell} ${styles.min140}`}>
              Yükləmə tarixi
            </th>
            <th className={`${styles.headerCell} ${styles.min140}`}>
              Boşaltma tarixi
            </th>
            <th className={`${styles.headerCell} ${styles.min160}`}>Müştəri</th>
            <th className={`${styles.headerCell} ${styles.min140}`}>Şirkət</th>
            <th className={`${styles.headerCell} ${styles.min140}`}>Satıcı</th>
            <th className={`${styles.headerCell} ${styles.min180}`}>
              Qiymət təklifləri
            </th>
            <th className={`${styles.headerCell} ${styles.min170}`}>
              Əlaqədar şəxs
            </th>
            <th className={`${styles.headerCell} ${styles.min120}`}>
              Əməliyyatlar
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className={styles.rowEven}>
              {/* 0'dan 16'ya kadar 17 sütun için hücreler */}
              {[...Array(COLUMN_COUNT)].map((_, idx) => (
                <td key={idx} className={`${styles.cell} ${styles.center}`}>
                  <FaMinus className={styles.mutedText} />
                </td>
              ))}
            </tr>
          ) : (
            localRows.map((row, index) => (
              <tr
                key={row.id}
                className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
              >
                <td
                  className={`${styles.cell} ${styles.nowrap} ${styles.min150} ${styles.center}`}
                >
                  {row.id ? (
                    <Link
                      to={`/sorgular/${encodeURIComponent(row.id)}`}
                      className={styles.link}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.number}
                    </Link>
                  ) : (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.nowrap} ${styles.min140} ${styles.center}`}
                >
                  {row.status ? (
                    <StatusBadge label={row.status} />
                  ) : (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.nowrap} ${styles.min170} ${styles.center}`}
                >
                  {row.purpose || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.mutedText} ${styles.nowrap} ${styles.min160} ${styles.center}`}
                >
                  {row.createdAt ? (
                    formatCreated(row.createdAt)
                  ) : (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.center} ${styles.nowrap} ${styles.min140}`}
                >
                  {row.transportType || (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.preLine} ${styles.smallText} ${styles.min240} ${styles.center}`}
                >
                  {/* cargoItemsJson içindeki yükleri alt alta və nəqliyyat tipiyle göster */}
                  {(() => {
                    {
                      /* cargoItems array içindeki yükleri alt alta və nəqliyyat tipiyle göster */
                    }
                    {
                      Array.isArray(row.cargoItems) &&
                      row.cargoItems.length > 0 ? (
                        <div style={{ textAlign: "left" }}>
                          {row.cargoItems.map((item: any, idx: number) => (
                            <div key={item.id || idx}>
                              <b>{item.name}</b>
                              {item.transportType ? (
                                <span style={{ color: "#888" }}>
                                  {" "}
                                  — {item.transportType}
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <FaMinus className={styles.mutedText} />
                      );
                    }
                  })()}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.min150} ${styles.center}`}
                >
                  {row.sender || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.nowrap} ${styles.min170} ${styles.center}`}
                >
                  {row.loadPlace || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.min150} ${styles.center}`}
                >
                  {row.recipient || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.nowrap} ${styles.min170} ${styles.center}`}
                >
                  {row.unloadPlace || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.mutedText} ${styles.nowrap} ${styles.min140} ${styles.center}`}
                >
                  {row.loadDate || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.mutedText} ${styles.nowrap} ${styles.min140} ${styles.center}`}
                >
                  {row.unloadDate || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.min160} ${styles.center}`}
                >
                  {row.customer || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.nowrap} ${styles.min140} ${styles.center}`}
                >
                  {row.company || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.mutedText} ${styles.min140} ${styles.center}`}
                >
                  {row.seller || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.min180} ${styles.center}`}
                >
                  {row.priceOffers || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.min170} ${styles.center}`}
                >
                  {row.contactPerson || (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.actionCell} ${styles.min120} ${styles.center}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={styles.actionRow}
                    style={{ justifyContent: "center" }}
                  >
                    <button
                      type="button"
                      title="Düzəliş et"
                      className={`${styles.iconButton} ${styles.editButton}`}
                      aria-label="Düzəliş et"
                      onClick={() => handleEditClick(row)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      title="Sil"
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      aria-label="Sil"
                      onClick={() => handleDelete(row)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {editModalOpen && editRow && (
        <SorgularEditModal
          isOpen={editModalOpen}
          onClose={handleEditClose}
          onSubmit={handleEditSubmit}
          initialValues={editRow}
        />
      )}
    </>
  );
}
