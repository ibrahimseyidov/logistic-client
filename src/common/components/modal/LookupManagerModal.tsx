import React, { useState, useEffect } from "react";
import { FiX, FiEdit2, FiTrash2, FiPlus, FiCheck } from "react-icons/fi";
import {
  LookupRow,
  fetchLookupAction,
  createLookupAction,
  updateLookupAction,
  deleteLookupAction,
} from "../../actions/lookup.actions";
import styles from "./LookupManagerModal.module.css";
import { showNotification } from "../../store/modalSlice";
import { useAppDispatch } from "../../store/hooks";
import { ConfirmModal } from "../ConfirmModal";

interface LookupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lookupType: string;
  title: string;
  onDataChanged: (newData: LookupRow[]) => void;
}

function parsePercentageInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercentage(value?: number | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as any)?.response?.data;
  const msg =
    (typeof data?.message === "string" && data.message) ||
    (typeof data?.error === "string" && data.error) ||
    "";
  return msg.trim() || fallback;
}

export const LookupManagerModal: React.FC<LookupManagerModalProps> = ({
  isOpen,
  onClose,
  lookupType,
  title,
  onDataChanged,
}) => {
  const dispatch = useAppDispatch();
  const supportsPercentage = lookupType === "carrier-types";
  const [data, setData] = useState<LookupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newPercentage, setNewPercentage] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingPercentage, setEditingPercentage] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, lookupType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchLookupAction(lookupType);
      setData(res);
      onDataChanged(res);
    } catch (e) {
      console.error(e);
      dispatch(
        showNotification({
          message: "Məlumatlar yüklənərkən xəta baş verdi",
          type: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    try {
      await createLookupAction(lookupType, {
        value: newValue.trim(),
        label: newValue.trim(),
        percentage: supportsPercentage
          ? parsePercentageInput(newPercentage)
          : undefined,
      });
      setNewValue("");
      setNewPercentage("");
      loadData();
    } catch (e) {
      console.error(e);
      dispatch(
        showNotification({
          message: apiErrorMessage(e, "Əlavə edilərkən xəta baş verdi"),
          type: "error",
        }),
      );
    }
  };

  const handleEdit = (row: LookupRow) => {
    setEditingId(row.id);
    setEditingValue(row.label || row.value);
    setEditingPercentage(formatPercentage(row.percentage));
  };

  const handleSaveEdit = async (id: string | number) => {
    if (!editingValue.trim()) return;
    try {
      await updateLookupAction(lookupType, id, {
        value: editingValue.trim(),
        label: editingValue.trim(),
        percentage: supportsPercentage
          ? parsePercentageInput(editingPercentage)
          : undefined,
      });
      setEditingId(null);
      setEditingValue("");
      setEditingPercentage("");
      loadData();
    } catch (e) {
      console.error(e);
      dispatch(
        showNotification({
          message: apiErrorMessage(e, "Yenilənərkən xəta baş verdi"),
          type: "error",
        }),
      );
    }
  };

  const requestDelete = (id: string | number) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLookupAction(lookupType, itemToDelete);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (e) {
      console.error(e);
      dispatch(
        showNotification({
          message: apiErrorMessage(e, "Silinərkən xəta baş verdi"),
          type: "error",
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay}>
        <div
          className={`${styles.modal} ${
            supportsPercentage ? styles.modalWide : ""
          }`}
        >
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button className={styles.closeBtn} onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className={styles.body}>
            <div
              className={
                supportsPercentage ? styles.addSectionWithPercent : styles.addSection
              }
            >
              <input
                type="text"
                placeholder="Yeni dəyər..."
                className={styles.input}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              {supportsPercentage ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="%"
                  className={styles.percentageInput}
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              ) : null}
              <button className={styles.addBtn} onClick={handleAdd}>
                <FiPlus /> Əlavə et
              </button>
            </div>

            <div className={styles.list}>
              {loading ? (
                <div className={styles.loading}>Yüklənir...</div>
              ) : data.length === 0 ? (
                <div className={styles.empty}>Heç nə tapılmadı</div>
              ) : (
                data.map((row) => (
                  <div key={row.id} className={styles.row}>
                    {editingId === row.id ? (
                      <div
                        className={
                          supportsPercentage
                            ? styles.editModeWithPercent
                            : styles.editMode
                        }
                      >
                        <input
                          className={styles.input}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveEdit(row.id)
                          }
                          autoFocus
                        />
                        {supportsPercentage ? (
                          <input
                            className={styles.percentageInput}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="%"
                            value={editingPercentage}
                            onChange={(e) => setEditingPercentage(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSaveEdit(row.id)
                            }
                          />
                        ) : null}
                        <button
                          className={styles.iconBtnSuccess}
                          onClick={() => handleSaveEdit(row.id)}
                        >
                          <FiCheck />
                        </button>
                        <button
                          className={styles.iconBtnDanger}
                          onClick={() => setEditingId(null)}
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.value}>
                          {row.label || row.value}
                          {supportsPercentage && row.percentage != null ? (
                            <span className={styles.percentageBadge}>
                              {row.percentage}%
                            </span>
                          ) : null}
                        </span>
                        <div className={styles.actions}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => handleEdit(row)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className={styles.iconBtnDanger}
                            onClick={() => requestDelete(row.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Dəyəri silmək"
        message="Bu dəyəri silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz."
        confirmLabel="Bəli, sil"
        cancelLabel="Ləğv et"
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        isLoading={isDeleting}
      />
    </>
  );
};
