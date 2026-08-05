import React, { useCallback, useEffect, useState } from "react";
import {
  fetchActivityLogsAction,
  type ActivityLogRow,
} from "../../../common/actions/activity-log.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import SorgularPagination from "../../sorgular/components/SorgularPagination";
import {
  getVisiblePages as buildVisiblePages,
} from "../../../common/components/pagination";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import tableStyles from "../../sorgular/components/SorgularTable.module.css";
import ayarlarStyles from "../ayarlar.module.css";
import {
  actionLabelAz,
  actionTone,
  cleanSummary,
  entityDisplay,
} from "../lib/activityLogDisplay";
import {
  ActivityLogDetailModal,
  detailsPreview,
} from "./ActivityLogDetailModal";
import { AyarlarToolbar } from "./AyarlarToolbar";

const DEFAULT_LOG_PAGE_SIZE = 50;

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

function ActionBadge({ action }: { action: string }) {
  const tone = actionTone(action);
  const colors =
    tone === "create"
      ? { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" }
      : tone === "delete"
        ? { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" }
        : tone === "update"
          ? { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" }
          : { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.2rem 0.55rem",
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 700,
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {actionLabelAz(action)}
    </span>
  );
}

export const LogsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LOG_PAGE_SIZE);
  const [selected, setSelected] = useState<ActivityLogRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchActivityLogsAction({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
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
  }, [dispatch, search, currentPage, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const getVisiblePages = () => buildVisiblePages(currentPage, totalPages);

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
                <th className={tableStyles.headerCell}>Obyekt</th>
                <th className={tableStyles.headerCell}>Təsvir</th>
                <th className={tableStyles.headerCell}>Qısa detal</th>
                <th className={tableStyles.headerCell}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td className={tableStyles.cell} colSpan={7}>
                    Yüklənir...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className={tableStyles.cell} colSpan={7}>
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
                      <ActionBadge action={row.action} />
                    </td>
                    <td className={tableStyles.cell} style={{ fontWeight: 600 }}>
                      {entityDisplay(row.entityType, row.entityId)}
                    </td>
                    <td className={tableStyles.cell}>
                      {cleanSummary(
                        row.summary,
                        row.entityType,
                        row.entityId,
                        row.action,
                      )}
                    </td>
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
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
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
