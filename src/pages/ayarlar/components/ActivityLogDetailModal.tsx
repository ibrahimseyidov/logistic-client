import React, { useMemo } from "react";
import type { ActivityLogRow } from "../../../common/actions/activity-log.actions";
import styles from "./ActivityLogDetailModal.module.css";

type ParsedDetails = {
  version?: number;
  preview?: string;
  method?: string;
  path?: string;
  note?: string;
  created?: unknown;
  deleted?: unknown;
  before?: unknown;
  after?: unknown;
  changes?: Array<{ field: string; from: unknown; to: unknown }>;
  payload?: unknown;
  rawText?: string;
};

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Yaratma",
  UPDATE: "Yeniləmə",
  DELETE: "Silmə",
  POST: "Yaratma",
  PUT: "Yeniləmə",
  PATCH: "Yeniləmə",
};

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

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function parseDetails(raw?: string | null): ParsedDetails {
  if (!raw || !String(raw).trim()) return { rawText: "" };
  const text = String(raw).trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return parsed as ParsedDetails;
    }
  } catch {
    // legacy plain string
  }
  return { rawText: text, preview: text };
}

function KeyValueBlock({
  title,
  data,
}: {
  title: string;
  data: unknown;
}) {
  if (data == null) return null;
  if (typeof data !== "object" || Array.isArray(data)) {
    return (
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>{title}</h4>
        <pre className={styles.pre}>{formatValue(data)}</pre>
      </section>
    );
  }
  const entries = Object.entries(data as Record<string, unknown>);
  if (!entries.length) return null;
  return (
    <section className={styles.section}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      <div className={styles.kvTable}>
        {entries.map(([k, v]) => (
          <div key={k} className={styles.kvRow}>
            <div className={styles.kvKey}>{k}</div>
            <div className={styles.kvVal}>
              <pre className={styles.inlinePre}>{formatValue(v)}</pre>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type Props = {
  row: ActivityLogRow | null;
  onClose: () => void;
};

export const ActivityLogDetailModal: React.FC<Props> = ({ row, onClose }) => {
  const parsed = useMemo(
    () => parseDetails(row?.details),
    [row?.details],
  );

  if (!row) return null;

  const hasChanges = Array.isArray(parsed.changes) && parsed.changes.length > 0;
  const hasStructured =
    hasChanges ||
    parsed.created != null ||
    parsed.deleted != null ||
    parsed.before != null ||
    parsed.after != null ||
    parsed.payload != null;

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Bağla"
        onClick={onClose}
      />
      <aside className={styles.panel} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>Log detalları</h2>
            <p className={styles.hint}>
              {ACTION_LABEL[row.action] || row.action}
              {row.entityType ? ` · ${row.entityType}` : ""}
              {row.entityId ? ` #${row.entityId}` : ""}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.metaGrid}>
            <div>
              <span className={styles.metaLabel}>Tarix</span>
              <strong>{formatDateTime(row.createdAt)}</strong>
            </div>
            <div>
              <span className={styles.metaLabel}>İstifadəçi</span>
              <strong>{row.userName || "—"}</strong>
            </div>
            <div>
              <span className={styles.metaLabel}>Əməliyyat</span>
              <strong>{ACTION_LABEL[row.action] || row.action}</strong>
            </div>
            <div>
              <span className={styles.metaLabel}>Obyekt</span>
              <strong>
                {row.entityType || "—"}
                {row.entityId ? ` #${row.entityId}` : ""}
              </strong>
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Qısa təsvir</h4>
            <p className={styles.summary}>{row.summary}</p>
            {parsed.note ? (
              <p className={styles.note}>{parsed.note}</p>
            ) : null}
            {parsed.method || parsed.path ? (
              <p className={styles.pathLine}>
                <code>
                  {parsed.method || ""} {parsed.path || ""}
                </code>
              </p>
            ) : null}
          </section>

          {hasChanges ? (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>
                Dəyişən sahələr ({parsed.changes!.length})
              </h4>
              <div className={styles.changeTable}>
                <div className={`${styles.changeRow} ${styles.changeHead}`}>
                  <span>Sahə</span>
                  <span>Əvvəl</span>
                  <span>Sonra</span>
                </div>
                {parsed.changes!.map((c) => (
                  <div key={c.field} className={styles.changeRow}>
                    <span className={styles.changeField}>{c.field}</span>
                    <pre className={`${styles.changeVal} ${styles.from}`}>
                      {formatValue(c.from)}
                    </pre>
                    <pre className={`${styles.changeVal} ${styles.to}`}>
                      {formatValue(c.to)}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <KeyValueBlock title="Yaradılan məlumat" data={parsed.created} />
          <KeyValueBlock title="Silinən məlumat" data={parsed.deleted} />
          <KeyValueBlock title="Əvvəlki vəziyyət" data={parsed.before} />
          <KeyValueBlock title="Sonrakı vəziyyət" data={parsed.after} />
          <KeyValueBlock title="Göndərilən məlumat" data={parsed.payload} />

          {!hasStructured && parsed.rawText ? (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Tam mətn</h4>
              <pre className={styles.pre}>{parsed.rawText}</pre>
            </section>
          ) : null}

          {!hasStructured && !parsed.rawText ? (
            <section className={styles.section}>
              <p className={styles.empty}>Bu loq üçün əlavə detal yoxdur.</p>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
};

export function detailsPreview(raw?: string | null): string {
  const parsed = parseDetails(raw);
  if (parsed.preview) return parsed.preview;
  if (parsed.rawText) {
    return parsed.rawText.length > 80
      ? `${parsed.rawText.slice(0, 80)}…`
      : parsed.rawText;
  }
  if (parsed.changes?.length) {
    return `${parsed.changes.length} sahə dəyişdi`;
  }
  return "—";
}
