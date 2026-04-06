import { useMemo, useState } from "react";

import { EMPTY_SUPPLIER_FORM } from "../constants/suppliers.constants";
import type { Supplier } from "../types/supplier.types";
import type { SupplierFormState } from "../types/form.types";

interface UseSupplierFormParams {
  supplier?: Supplier | null;
}

export const useSupplierForm = () => {
  const [form, setForm] = useState<SupplierFormState>(EMPTY_SUPPLIER_FORM);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);

  const openCreateModal = () => {
    setForm(EMPTY_SUPPLIER_FORM);
    setActiveSupplier(null);
    setModalError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setActiveSupplier(supplier);
    setModalError(null);
    setIsEditOpen(true);
    setForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      taxNumber: supplier.taxNumber,
      status: supplier.status,
    });
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setModalError(null);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setModalError(null);
    setActiveSupplier(null);
  };

  const handleChange = (
    field: keyof SupplierFormState,
    value: string | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return {
    form,
    setForm,
    modalError,
    setModalError,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    activeSupplier,
    setActiveSupplier,
    openCreateModal,
    openEditModal,
    closeCreateModal,
    closeEditModal,
    handleChange,
  };
};
