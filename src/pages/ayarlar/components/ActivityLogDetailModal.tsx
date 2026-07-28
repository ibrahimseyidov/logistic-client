import React, { useMemo } from "react";
import type { ActivityLogRow } from "../../../common/actions/activity-log.actions";
import StatusBadge from "../../../common/components/StatusBadge";
import {
  actionLabelAz,
  actionTone,
  cleanNote,
  cleanSummary,
  entityDisplay,
  fieldLabelAz,
  filterLogObject,
  formatLogValue,
  humanizePreview,
  shouldShowField,
} from "../lib/activityLogDisplay";
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

function ActionBadge({ action }: { action: string }) {
  const tone = actionTone(action);
  const toneClass =
    tone === "create"
      ? styles.badgeCreate
      : tone === "delete"
        ? styles.badgeDelete
        : tone === "update"
          ? styles.badgeUpdate
          : styles.badgeDefault;
  return (
    <span className={`${styles.actionBadge} ${toneClass}`}>
      {actionLabelAz(action)}
    </span>
  );
}

function ValueCell({ value, field }: { value: unknown; field?: string }) {
  const text = formatLogValue(value, field);
  if (field && /status/i.test(field) && text && text !== "—") {
    return <StatusBadge label={String(value ?? text)} />;
  }
  return <span className={styles.valueText}>{text}</span>;
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
        <div className={styles.valueBlock}>
          <ValueCell value={data} />
        </div>
      </section>
    );
  }

  const filtered = filterLogObject(data);
  if (!filtered) return null;
  const entries = Object.entries(filtered);
  if (!entries.length) return null;

  return (
    <section className={styles.section}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      <div className={styles.kvTable}>
        {entries.map(([k, v]) => (
          <div key={k} className={styles.kvRow}>
            <div className={styles.kvKey}>{fieldLabelAz(k)}</div>
            <div className={styles.kvVal}>
              <ValueCell value={v} field={k} />
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

  const changes = (parsed.changes || []).filter((c) =>
    shouldShowField(c.field),
  );
  const hasChanges = changes.length > 0;
  const note = cleanNote(parsed.note);
  const summary = cleanSummary(
    row.summary,
    row.entityType,
    row.entityId,
    row.action,
  );

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
              {actionLabelAz(row.action)}
              {" · "}
              {entityDisplay(row.entityType, row.entityId)}
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
              <div style={{ marginTop: 4 }}>
                <ActionBadge action={row.action} />
              </div>
            </div>
            <div>
              <span className={styles.metaLabel}>Obyekt</span>
              <strong>{entityDisplay(row.entityType, row.entityId)}</strong>
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Qısa təsvir</h4>
            <p className={styles.summary}>{summary}</p>
            {note ? <p className={styles.note}>{note}</p> : null}
          </section>

          {hasChanges ? (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>
                Dəyişən sahələr ({changes.length})
              </h4>
              <div className={styles.changeTable}>
                <div className={`${styles.changeRow} ${styles.changeHead}`}>
                  <span>Sahə</span>
                  <span>Əvvəl</span>
                  <span>Sonra</span>
                </div>
                {changes.map((c) => (
                  <div key={c.field} className={styles.changeRow}>
                    <span className={styles.changeField}>
                      {fieldLabelAz(c.field)}
                    </span>
                    <div className={`${styles.changeVal} ${styles.from}`}>
                      <ValueCell value={c.from} field={c.field} />
                    </div>
                    <div className={`${styles.changeVal} ${styles.to}`}>
                      <ValueCell value={c.to} field={c.field} />
                    </div>
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
              <h4 className={styles.sectionTitle}>Əlavə məlumat</h4>
              <div className={styles.valueBlock}>
                <ValueCell value={cleanSummary(parsed.rawText)} />
              </div>
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
  return humanizePreview(parsed.preview, parsed.changes, parsed.payload);
}
