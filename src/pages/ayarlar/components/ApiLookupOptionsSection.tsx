import React, { useCallback, useEffect, useState } from "react";
import { FiFilePlus } from "react-icons/fi";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import ayarlarStyles from "../ayarlar.module.css";
import { ConfirmModal } from "../../../common/components/ConfirmModal";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import {
  createLookupAction,
  deleteLookupAction,
  fetchLookupAction,
  updateLookupAction,
} from "../../../common/actions/lookup.actions";
import { mapLookupRowsToOptionRows } from "../../../common/utils/contactPosition.utils";
import type { LookupOptionRow } from "../types/lookup.types";
import { LookupOptionModal } from "./LookupOptionModal";
import { LookupOptionsTable } from "./LookupOptionsTable";
import { AyarlarToolbar } from "./AyarlarToolbar";

interface Props {
  lookupType: string;
  title: string;
  singleField?: boolean;
}

export const ApiLookupOptionsSection: React.FC<Props> = ({
  lookupType,
  title,
  singleField = false,
}) => {
  const dispatch = useAppDispatch();
  const [rows, setRows] = useState<LookupOptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LookupOptionRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLookupAction(lookupType);
      setRows(mapLookupRowsToOptionRows(data));
    } catch {
      dispatch(showNotification({ message: "Məlumatlar yüklənərkən xəta baş verdi", type: "error" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, lookupType]);

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

  const handleConfirmDelete = async () => {
    if (rowToDelete === null) return;
    setIsDeleting(true);
    try {
      await deleteLookupAction(lookupType, rowToDelete);
      setRows((prev) => prev.filter((row) => row.id !== rowToDelete));
      dispatch(showNotification({ message: "Qeyd silindi", type: "success" }));
      setDeleteConfirmOpen(false);
      setRowToDelete(null);
    } catch {
      dispatch(showNotification({ message: "Silinərkən xəta baş verdi", type: "error" }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: { value: string; label: string }) => {
    const value = (singleField ? data.label : data.value).trim();
    const label = data.label.trim();
    if (!label || (!singleField && !value)) return;

    try {
      if (selectedRow) {
        const updated = await updateLookupAction(lookupType, selectedRow.id, {
          value: singleField ? label : value,
          label,
        });
        const mapped = mapLookupRowsToOptionRows([updated])[0];
        setRows((prev) => prev.map((row) => (row.id === selectedRow.id ? mapped : row)));
        dispatch(showNotification({ message: "Qeyd yeniləndi", type: "success" }));
      } else {
        const created = await createLookupAction(lookupType, {
          value: singleField ? label : value,
          label,
        });
        const mapped = mapLookupRowsToOptionRows([created])[0];
        setRows((prev) => [mapped, ...prev]);
        dispatch(showNotification({ message: "Yeni qeyd əlavə edildi", type: "success" }));
      }
      setIsModalOpen(false);
    } catch {
      dispatch(showNotification({ message: "Xəta baş verdi!", type: "error" }));
    }
  };

  return (
    <>
      <AyarlarToolbar>
        <div className={actionStyles.wrapper}>
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
      </AyarlarToolbar>

      <div className={ayarlarStyles.body}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>Yüklənir...</div>
        ) : (
          <LookupOptionsTable
            rows={rows}
            onEdit={handleEdit}
            onDelete={handleDelete}
            singleColumn={singleField}
          />
        )}
      </div>

      <LookupOptionModal
        isOpen={isModalOpen}
        title={selectedRow ? `${title} — redaktə` : `${title} — yeni`}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={selectedRow}
        singleField={singleField}
        singleFieldLabel={title}
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
        isLoading={isDeleting}
      />
    </>
  );
};
