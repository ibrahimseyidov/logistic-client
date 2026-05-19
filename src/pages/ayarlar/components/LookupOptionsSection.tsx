import React, { useCallback, useEffect, useState } from "react";
import { FiFilePlus } from "react-icons/fi";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import layoutStyles from "../../sorgular/sorgular.module.css";
import { ConfirmModal } from "../../../common/components/ConfirmModal";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import {
  createLookupOption,
  deleteLookupOption,
  fetchLookupOptions,
  updateLookupOption,
  type LookupStorageKey,
} from "../lib/lookupStorage";
import type { LookupOptionRow } from "../types/lookup.types";
import { LookupOptionModal } from "./LookupOptionModal";
import { LookupOptionsTable } from "./LookupOptionsTable";

interface Props {
  storageKey: LookupStorageKey;
  title: string;
  seed: Omit<LookupOptionRow, "id">[];
}

export const LookupOptionsSection: React.FC<Props> = ({
  storageKey,
  title,
  seed,
}) => {
  const dispatch = useAppDispatch();
  const [rows, setRows] = useState<LookupOptionRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LookupOptionRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);

  const loadRows = useCallback(() => {
    setRows(fetchLookupOptions(storageKey, seed));
  }, [seed, storageKey]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const handleCreate = () => {
    setSelectedRow(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row: LookupOptionRow) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setRowToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (rowToDelete === null) return;
    deleteLookupOption(storageKey, rowToDelete);
    setRows((prev) => prev.filter((row) => row.id !== rowToDelete));
    dispatch(
      showNotification({ message: "Qeyd silindi", type: "success" }),
    );
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const handleSubmit = (data: { value: string; label: string }) => {
    try {
      if (selectedRow) {
        const updated = updateLookupOption(storageKey, selectedRow.id, data);
        setRows((prev) =>
          prev.map((row) => (row.id === selectedRow.id ? updated : row)),
        );
        dispatch(
          showNotification({ message: "Qeyd yeniləndi", type: "success" }),
        );
      } else {
        const created = createLookupOption(storageKey, data);
        setRows((prev) => [created, ...prev]);
        dispatch(
          showNotification({ message: "Yeni qeyd əlavə edildi", type: "success" }),
        );
      }
      setIsModalOpen(false);
    } catch {
      dispatch(showNotification({ message: "Xəta baş verdi!", type: "error" }));
    }
  };

  return (
    <>
      <div className={actionStyles.wrapper} style={{ padding: "0.5rem 1rem" }}>
        <div className={actionStyles.group}>
          <button
            type="button"
            className={`${actionStyles.buttonBase} ${actionStyles.buttonPrimary}`}
            onClick={handleCreate}
          >
            <FiFilePlus /> Yeni əlavə et
          </button>
        </div>
        <div className={actionStyles.statsGroup}>
          <span className={actionStyles.statPill}>Cəmi: {rows.length}</span>
        </div>
      </div>

      <div className={layoutStyles.body}>
        <LookupOptionsTable
          rows={rows}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <LookupOptionModal
        isOpen={isModalOpen}
        title={selectedRow ? `${title} — redaktə` : `${title} — yeni`}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={selectedRow}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Qeydi sil"
        message="Bu qeydi silmək istədiyinizə əminsiniz?"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setRowToDelete(null);
        }}
      />
    </>
  );
};
