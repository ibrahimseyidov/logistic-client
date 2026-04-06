"use client";
import { useEffect, useState } from "react";
import { addSupplierPayment } from "../../common/actions/suppliers.actions";
import Loading from "../../common/components/loading/Loading";
import {
  SuppliersAmountModal,
  SuppliersCreateModal,
  SuppliersDeleteModal,
  SuppliersEditModal,
  SuppliersPagination,
  SuppliersTable,
  SuppliersToolbar,
} from "./components";
import { ITEMS_PER_PAGE } from "./constants/suppliers.constants";
import { useSupplierActions } from "./hooks/useSupplierActions";
import { useSupplierForm } from "./hooks/useSupplierForm";
import { useSuppliersData } from "./hooks/useSuppliersData";
import { useSuppliersFilters } from "./hooks/useSuppliersFilters";
import { useSuppliersPagination } from "./hooks/useSuppliersPagination";
import type { Supplier } from "./types/supplier.types";
import { useAppDispatch } from "../../common/store/hooks";
import { showDeleteModal } from "../../common/store/modalSlice";
import { useAuth } from "../../common/contexts/AuthContext";

const BRANCH_STORAGE_KEY = "selectedBranchName";
export default function SuppliersPage() {
  const dispatch = useAppDispatch();
  const { user, branches } = useAuth();
  const companyId = user?.companyId;

  // Branch selection for till operations
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  // Payment modal state
  const [isAmountOpen, setIsAmountOpen] = useState(false);
  const [amountSupplier, setAmountSupplier] = useState<Supplier | null>(null);
  const [amountLoading, setAmountLoading] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (!branches.length) {
      setSelectedBranchId(null);
      return;
    }

    const savedBranchName = localStorage.getItem(BRANCH_STORAGE_KEY);
    const savedBranch = branches.find(
      (branch) => branch.name === savedBranchName,
    );
    setSelectedBranchId(savedBranch?.id ?? branches[0]?.id ?? null);
  }, [branches]);

  useEffect(() => {
    if (!branches.length) return;

    const syncByName = (branchName?: string | null) => {
      if (!branchName) return;
      const matched = branches.find((branch) => branch.name === branchName);
      if (matched) {
        setSelectedBranchId(matched.id);
      }
    };

    syncByName(localStorage.getItem(BRANCH_STORAGE_KEY));

    const onBranchChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ branchName?: string }>;
      syncByName(
        customEvent.detail?.branchName ??
          localStorage.getItem(BRANCH_STORAGE_KEY),
      );
    };

    window.addEventListener("branch-change", onBranchChange);
    window.addEventListener("storage", onBranchChange);

    return () => {
      window.removeEventListener("branch-change", onBranchChange);
      window.removeEventListener("storage", onBranchChange);
    };
  }, [branches]);

  const openPaymentModal = (supplier: Supplier) => {
    if (!selectedBranchId) {
      setAmountError("Lütfen önce bir filiyal seçiniz.");
      return;
    }
    setAmountSupplier(supplier);
    setAmountError(null);
    setIsAmountOpen(true);
  };

  const handleAmountSubmit = async (amount: number, tillId: number) => {
    if (!amountSupplier || !companyId || !selectedBranchId) return;
    setAmountLoading(true);
    setAmountError(null);
    try {
      await addSupplierPayment(
        amountSupplier.id,
        amount,
        companyId,
        selectedBranchId,
        tillId,
      );
      await fetchSuppliers();
      setIsAmountOpen(false);
    } catch (e) {
      setAmountError((e as Error).message);
    } finally {
      setAmountLoading(false);
    }
  };

  const {
    suppliers,
    allSuppliers,
    setSuppliers,
    setAllSuppliers,
    loading,
    setLoading,
    error,
    setError,
    fetchSuppliers,
  } = useSuppliersData(companyId);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedSuppliers,
    getVisiblePages,
  } = useSuppliersPagination(suppliers);

  const {
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
  } = useSupplierForm();

  const { searchTerm, setSearchTerm, handleFilter } = useSuppliersFilters({
    allSuppliers,
    setSuppliers,
    setCurrentPage,
  });

  const {
    createLoading,
    editLoading,
    deleteLoading,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  } = useSupplierActions({
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
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const handleOpenDeleteModal = () => {
    if (activeSupplier) {
      dispatch(
        showDeleteModal({
          categoryId: activeSupplier.id,
          categoryName: activeSupplier.name,
          level: 0,
        }),
      );
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <div className="shrink-0">
        <SuppliersToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onFilter={handleFilter}
          onCreate={openCreateModal}
          onResetPage={() => setCurrentPage(1)}
          totalRows={suppliers.length}
          totalPages={totalPages}
          getVisiblePages={getVisiblePages}
        />
        {error && <p className="text-red-600 px-4">{error}</p>}
        {!companyId && (
          <p className="text-gray-500 px-4">Önce Giriş Yapmalısınız.</p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loading />
          </div>
        ) : (
          <SuppliersTable
            suppliers={paginatedSuppliers}
            onRowClick={openEditModal}
            onAddPayment={openPaymentModal}
          />
        )}
      </div>

      <div className="shrink-0 border-t bg-white">
        <SuppliersPagination
          totalRows={suppliers.length}
          totalPages={totalPages}
          getVisiblePages={getVisiblePages}
        />
      </div>

      <SuppliersCreateModal
        isOpen={isCreateOpen}
        form={form}
        onChange={handleChange}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isLoading={createLoading}
        error={modalError}
      />

      <SuppliersEditModal
        isOpen={isEditOpen}
        form={form}
        onChange={handleChange}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        onDelete={handleOpenDeleteModal}
        isLoading={editLoading || deleteLoading}
        deleteLoading={deleteLoading}
        error={modalError}
      />

      <SuppliersDeleteModal onDeleted={fetchSuppliers} />

      <SuppliersAmountModal
        isOpen={isAmountOpen}
        supplier={amountSupplier}
        branchId={selectedBranchId || undefined}
        companyId={companyId}
        isLoading={amountLoading}
        error={amountError}
        onClose={() => setIsAmountOpen(false)}
        onSubmit={handleAmountSubmit}
      />
    </div>
  );
}
