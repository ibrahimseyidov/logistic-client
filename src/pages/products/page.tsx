"use client";

import { useAppDispatch } from "../../common/store/hooks";
import { showDeleteModal } from "../../common/store/productModalSlice";
import { useAuth } from "../../common/contexts/AuthContext";
import Loading from "../../common/components/loading";
import {
  ProductCreateModal,
  ProductEditModal,
  ProductDeleteModal,
  ProductsPagination,
  ProductsTable,
  ProductsToolbar,
} from "./components";
import { ITEMS_PER_PAGE } from "./constants/product.constants";
import {
  formatPrice,
  formatStock,
  formatStockUnit,
} from "./lib/product.formatters";
import { useProductActions } from "./hooks/useProductActions";
import { useProductCategories } from "./hooks/useProductCategories";
import { useProductForm } from "./hooks/useProductForm";
import { useProductsData } from "./hooks/useProductsData";
import { useProductsFilters } from "./hooks/useProductsFilters";
import { useProductsPagination } from "./hooks/useProductsPagination";

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const companyId = user?.companyId;

  const {
    products,
    setProducts,
    loading,
    setLoading,
    error,
    setError,
    fetchProducts,
  } = useProductsData(companyId);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedProducts,
    getVisiblePages,
  } = useProductsPagination(products);

  const {
    parentCategories,
    childrenByParent,
    getPath,
    getLevels,
    ensureCategoriesLoaded,
  } = useProductCategories(companyId);

  const {
    form,
    setForm,
    modalError,
    setModalError,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    activeProduct,
    setActiveProduct,
    level2Categories,
    level3Categories,
    level4Categories,
    openCreateModal,
    openEditModal,
    closeCreateModal,
    closeEditModal,
    handleChange,
    handleParentChange,
    handleLevel2Change,
    handleLevel3Change,
    handleLevel4Change,
  } = useProductForm({
    companyId,
    childrenByParent,
    getPath,
    ensureCategoriesLoaded,
  });

  const {
    codeSearchTerm,
    nameSearchTerm,
    barcodeSearchTerm,
    setCodeSearchTerm,
    setNameSearchTerm,
    setBarcodeSearchTerm,
    handleFilter,
  } = useProductsFilters({
    companyId,
    setProducts,
    setLoading,
    setError,
    fetchProducts,
    setCurrentPage,
  });

  const {
    createLoading,
    editLoading,
    deleteLoading,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  } = useProductActions({
    companyId,
    form,
    activeProduct,
    products,
    setProducts,
    setModalError,
    setForm,
    setIsCreateOpen,
    setIsEditOpen,
    setActiveProduct,
    currentPage,
    setCurrentPage,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const handleOpenDeleteModal = () => {
    if (activeProduct) {
      dispatch(
        showDeleteModal({
          productId: activeProduct.id,
          productName: activeProduct.name,
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
        <ProductsToolbar
          codeSearchTerm={codeSearchTerm}
          nameSearchTerm={nameSearchTerm}
          barcodeSearchTerm={barcodeSearchTerm}
          setCodeSearchTerm={setCodeSearchTerm}
          setNameSearchTerm={setNameSearchTerm}
          setBarcodeSearchTerm={setBarcodeSearchTerm}
          onFilter={handleFilter}
          onCreate={openCreateModal}
          onResetPage={() => setCurrentPage(1)}
          totalRows={products.length}
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
          <ProductsTable
            products={paginatedProducts}
            onRowClick={openEditModal}
            getProductCategoryLevels={getLevels}
            formatPrice={formatPrice}
            formatStock={formatStock}
            formatStockUnit={formatStockUnit}
          />
        )}
      </div>

      <div className="shrink-0 border-t bg-white">
        <ProductsPagination
          totalRows={products.length}
          totalPages={totalPages}
          getVisiblePages={getVisiblePages}
        />
      </div>

      <ProductCreateModal
        isOpen={isCreateOpen}
        form={form}
        level1Categories={parentCategories}
        level2Categories={level2Categories}
        level3Categories={level3Categories}
        level4Categories={level4Categories}
        onChange={handleChange}
        onLevel1Change={handleParentChange}
        onLevel2Change={handleLevel2Change}
        onLevel3Change={handleLevel3Change}
        onLevel4Change={handleLevel4Change}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isLoading={createLoading}
        error={modalError}
      />

      <ProductEditModal
        isOpen={isEditOpen}
        form={form}
        level1Categories={parentCategories}
        level2Categories={level2Categories}
        level3Categories={level3Categories}
        level4Categories={level4Categories}
        onChange={handleChange}
        onLevel1Change={handleParentChange}
        onLevel2Change={handleLevel2Change}
        onLevel3Change={handleLevel3Change}
        onLevel4Change={handleLevel4Change}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        onDelete={handleOpenDeleteModal}
        isLoading={editLoading || deleteLoading}
        deleteLoading={deleteLoading}
        error={modalError}
      />

      <ProductDeleteModal companyId={companyId} onDeleted={fetchProducts} />
    </div>
  );
}
