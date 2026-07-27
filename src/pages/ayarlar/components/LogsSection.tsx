import React, { useCallback, useEffect, useState } from "react";
import {
  fetchActivityLogsAction,
  type ActivityLogRow,
} from "../../../common/actions/activity-log.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import SorgularPagination from "../../sorgular/components/SorgularPagination";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import tableStyles from "../../sorgular/components/SorgularTable.module.css";
import ayarlarStyles from "../ayarlar.module.css";
import {
  ActivityLogDetailModal,
  detailsPreview,
} from "./ActivityLogDetailModal";
import { AyarlarToolbar } from "./AyarlarToolbar";

const PAGE_SIZE = 50;

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("az-AZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Yaratma",
  UPDATE: "Yeniləmə",
  DELETE: "Silmə",
  POST: "Yaratma",
  PUT: "Yeniləmə",
  PATCH: "Yeniləmə",
};

export const LogsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<ActivityLogRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchActivityLogsAction({
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
        q: search || undefined,
      });
      setRows(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
    } catch {
      dispatch(
        showNotification({
          message: "Loglar yüklənərkən xəta!",
          type: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, search, currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, -1, totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        -1,
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  };

  const applySearch = () => {
    setCurrentPage(1);
    setSearch(q.trim());
  };

  return (
    <>
      <AyarlarToolbar>
        <div className={actionStyles.wrapper}>
          <div className={actionStyles.group}>
            <span className={actionStyles.statPill}>Cəmi: {total}</span>
            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
              Kim nə etdi — bütün sistem əməliyyatları
            </span>
          </div>
          <div className={actionStyles.group}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Axtar (şəxs, əməliyyat...)"
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                padding: "0.45rem 0.75rem",
                fontSize: "0.85rem",
                minWidth: "220px",
              }}
            />
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
              onClick={applySearch}
            >
              Axtar
            </button>
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
              onClick={() => load()}
            >
              Yenilə
            </button>
          </div>
        </div>
      </AyarlarToolbar>

      <div className={ayarlarStyles.body}>
        <div className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.headerCell}>Tarix / saat</th>
                <th className={tableStyles.headerCell}>İstifadəçi</th>
                <th className={tableStyles.headerCell}>Əməliyyat</th>
                <th className={tableStyles.headerCell}>Təsvir</th>
                <th className={tableStyles.headerCell}>Qısa detal</th>
                <th className={tableStyles.headerCell}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td className={tableStyles.cell} colSpan={6}>
                    Yüklənir...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className={tableStyles.cell} colSpan={6}>
                    Hələ log yoxdur
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td
                      className={tableStyles.cell}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className={tableStyles.cell} style={{ fontWeight: 600 }}>
                      {row.userName || "—"}
                    </td>
                    <td className={tableStyles.cell}>
                      {ACTION_LABEL[row.action] || row.action}
                      {row.entityType ? (
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          {row.entityType}
                          {row.entityId ? ` #${row.entityId}` : ""}
                        </div>
                      ) : null}
                    </td>
                    <td className={tableStyles.cell}>{row.summary}</td>
                    <td
                      className={tableStyles.cell}
                      style={{
                        color: "#64748b",
                        fontSize: "0.8rem",
                        maxWidth: 280,
                      }}
                      title={detailsPreview(row.details)}
                    >
                      {detailsPreview(row.details)}
                    </td>
                    <td className={tableStyles.cell}>
                      <button
                        type="button"
                        className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
                        style={{
                          padding: "0.35rem 0.7rem",
                          fontSize: "0.78rem",
                        }}
                        onClick={() => setSelected(row)}
                      >
                        Tam detal
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <SorgularPagination
          totalRows={total}
          currentPage={currentPage}
          totalPages={totalPages}
          getVisiblePages={getVisiblePages}
          onPageChange={setCurrentPage}
        />
      </div>

      {selected ? (
        <ActivityLogDetailModal
          row={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
};
