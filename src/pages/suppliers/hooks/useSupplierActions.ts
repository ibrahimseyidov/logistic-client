import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
} from "../../../common/actions/suppliers.actions";
import { EMPTY_SUPPLIER_FORM } from "../constants/suppliers.constants";
import type { Supplier } from "../types/supplier.types";
import type { SupplierFormState } from "../types/form.types";

interface UseSupplierActionsParams {
  companyId?: number;
  form: SupplierFormState;
  activeSupplier: Supplier | null;
  suppliers: Supplier[];
  setSuppliers: Dispatch<SetStateAction<Supplier[]>>;
  setAllSuppliers: Dispatch<SetStateAction<Supplier[]>>;
  setModalError: Dispatch<SetStateAction<string | null>>;
  setForm: Dispatch<SetStateAction<SupplierFormState>>;
  setIsCreateOpen: Dispatch<SetStateAction<boolean>>;
  setIsEditOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSupplier: Dispatch<SetStateAction<Supplier | null>>;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  itemsPerPage: number;
}

export const useSupplierActions = ({
  companyId,
  form,
  activeSupplier,
  suppliers,
  setSuppliers,
  setAllSuppliers,
  setModalError,
  setForm,
  setIsCreateOpen,
  setIsEditOpen,
  setActiveSupplier,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}: UseSupplierActionsParams) => {
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreateSubmit = async () => {
    if (!companyId) {
      setModalError("Şirket bilgisi bulunamadı");
      return;
    }

    const name = form.name.trim();
    const contactPerson = form.contactPerson.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const address = form.address.trim();
    const taxNumber = form.taxNumber.trim();
    const status = form.status;

    if (!name) {
      setModalError("Tedarikçi adı zorunludur");
      return;
    }

    try {
      setCreateLoading(true);
      setModalError(null);

      const created = await createSupplier({
        name,
        contactPerson,
        phone,
        email,
        address,
        taxNumber,
        status,
        companyId,
      });

      setSuppliers((prev) => [created as Supplier, ...prev]);
      setAllSuppliers((prev) => [created as Supplier, ...prev]);
      setIsCreateOpen(false);
      setForm(EMPTY_SUPPLIER_FORM);
      setCurrentPage(1);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Tedarikçi oluşturulamadı";
      setModalError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!activeSupplier) return;

    if (!companyId) {
      setModalError("Şirket bilgisi bulunamadı");
      return;
    }

    const name = form.name.trim();
    const contactPerson = form.contactPerson.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const address = form.address.trim();
    const taxNumber = form.taxNumber.trim();
    const status = form.status;

    if (!name) {
      setModalError("Tedarikçi adı zorunludur");
      return;
    }

    try {
      setEditLoading(true);
      setModalError(null);

      const updated = await updateSupplier(activeSupplier.id, {
        name,
        contactPerson,
        phone,
        email,
        address,
        taxNumber,
        status,
        companyId,
      });

      setSuppliers((prev) =>
        prev.map((item) =>
          item.id === activeSupplier.id ? (updated as Supplier) : item,
        ),
      );
      setAllSuppliers((prev) =>
        prev.map((item) =>
          item.id === activeSupplier.id ? (updated as Supplier) : item,
        ),
      );
      setIsEditOpen(false);
      setActiveSupplier(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Tedarikçi güncellenemedi";
      setModalError(message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeSupplier) return;

    if (!companyId) {
      setModalError("Şirket bilgisi bulunamadı");
      return;
    }

    const confirmed = window.confirm(
      `"${activeSupplier.name}" tedarikçi silinsin mi?`,
    );
    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      setModalError(null);

      await deleteSupplier(activeSupplier.id, companyId);

      const nextSuppliers = suppliers.filter((s) => s.id !== activeSupplier.id);
      setSuppliers(nextSuppliers);
      setAllSuppliers((prev) =>
        prev.filter((supplier) => supplier.id !== activeSupplier.id),
      );
      const nextFilteredLength = nextSuppliers.length;
      const nextTotalPages = Math.max(
        1,
        Math.ceil(nextFilteredLength / itemsPerPage),
      );
      if (currentPage > nextTotalPages) {
        setCurrentPage(nextTotalPages);
      }
      setIsEditOpen(false);
      setActiveSupplier(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Tedarikçi silinemedi";
      setModalError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    createLoading,
    editLoading,
    deleteLoading,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  };
};
