import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "../../../common/actions/products.actions";
import { EMPTY_PRODUCT_FORM } from "../constants/product.constants";
import {
  isValidStockUnit,
  parseOptionalNumber,
} from "../lib/product.validators";
import type { ProductFormState } from "../types/form.types";
import type { Product } from "../types/product.types";

interface UseProductActionsParams {
  companyId?: number;
  form: ProductFormState;
  activeProduct: Product | null;
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  setModalError: Dispatch<SetStateAction<string | null>>;
  setForm: Dispatch<SetStateAction<ProductFormState>>;
  setIsCreateOpen: Dispatch<SetStateAction<boolean>>;
  setIsEditOpen: Dispatch<SetStateAction<boolean>>;
  setActiveProduct: Dispatch<SetStateAction<Product | null>>;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  itemsPerPage: number;
}

export const useProductActions = ({
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
  itemsPerPage,
}: UseProductActionsParams) => {
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getFinalSubCategoryId = () => {
    return form.categoryLevel4Id
      ? Number(form.categoryLevel4Id)
      : form.categoryLevel3Id
        ? Number(form.categoryLevel3Id)
        : form.categoryLevel2Id
          ? Number(form.categoryLevel2Id)
          : null;
  };

  const handleCreateSubmit = async () => {
    if (!companyId) return;

    const name = form.name.trim();
    const barcode = form.barcode.trim();
    const parentCategoryId = Number(form.parentCategoryId);
    const finalSubCategoryId = getFinalSubCategoryId();
    const stockQuantity = 0;
    const branchStockQuantity = 0;
    const companyStockQuantity = 0;
    const stockUnit = form.stockUnit.trim().toLowerCase();
    const salePrice = form.salePrice.trim() === "" ? 0 : Number(form.salePrice);
    const purchasePrice =
      form.purchasePrice.trim() === ""
        ? 0
        : parseOptionalNumber(form.purchasePrice);
    const imageUrl = form.imageUrl.trim() || null;

    if (!name || !barcode || !parentCategoryId) {
      setForm((prev) => ({
        ...prev,
        name: prev.name,
        barcode: prev.barcode,
        _invalidName: !name,
        _invalidBarcode: !barcode,
        _invalidCategory: !parentCategoryId,
      }));
      setModalError(null);
      return;
    }

    if (Number.isNaN(parentCategoryId)) {
      setModalError("Ana Kategori Zorunludur");
      return;
    }

    if (Number.isNaN(salePrice)) {
      setModalError("Satış Fiyatı Zorunludur");
      return;
    }

    if (purchasePrice !== null && Number.isNaN(purchasePrice)) {
      setModalError("Alış Fiyatı Sayısal Olmalı");
      return;
    }

    if (!isValidStockUnit(stockUnit)) {
      setModalError("Stok Türü Geçersiz");
      return;
    }

    try {
      setCreateLoading(true);
      setModalError(null);

      const created = await createProduct({
        name,
        companyId,
        parentCategoryId,
        subCategoryId: finalSubCategoryId,
        barcode,
        stockQuantity,
        branchStockQuantity,
        companyStockQuantity,
        stockUnit,
        salePrice,
        purchasePrice,
        imageUrl,
        isActive: form.isActive,
        description: form.description.trim() || null,
      });

      setProducts((prev) => [created as Product, ...prev]);
      setIsCreateOpen(false);
      setForm(EMPTY_PRODUCT_FORM);
      setCurrentPage(1);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ürün Oluşturulamadı";
      setModalError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!companyId || !activeProduct) return;

    const name = form.name.trim();
    const barcode = form.barcode.trim();
    const parentCategoryId = Number(form.parentCategoryId);
    const finalSubCategoryId = getFinalSubCategoryId();
    const stockQuantity = activeProduct.stockQuantity ?? 0;
    const branchStockQuantity =
      activeProduct.branchStockQuantity ?? activeProduct.stockQuantity ?? 0;
    const companyStockQuantity =
      activeProduct.companyStockQuantity ?? activeProduct.stockQuantity ?? 0;
    const stockUnit = form.stockUnit.trim().toLowerCase();
    const salePrice = Number(form.salePrice);
    const purchasePrice = parseOptionalNumber(form.purchasePrice);
    const imageUrl = form.imageUrl.trim() || null;

    if (!name || !barcode) {
      setModalError("Ürün Adı ve Barkod Zorunludur");
      return;
    }

    if (Number.isNaN(parentCategoryId)) {
      setModalError("Ana Kategori Zorunludur");
      return;
    }

    if (Number.isNaN(salePrice)) {
      setModalError("Satış Fiyatı Zorunludur");
      return;
    }

    if (purchasePrice !== null && Number.isNaN(purchasePrice)) {
      setModalError("Alış Fiyatı Sayısal Olmalı");
      return;
    }

    if (!isValidStockUnit(stockUnit)) {
      setModalError("Stok Türü Geçersiz");
      return;
    }

    try {
      setEditLoading(true);
      setModalError(null);

      const updated = await updateProduct(activeProduct.id, {
        name,
        companyId,
        parentCategoryId,
        subCategoryId: finalSubCategoryId,
        barcode,
        stockQuantity,
        branchStockQuantity,
        companyStockQuantity,
        stockUnit,
        salePrice,
        purchasePrice,
        imageUrl,
        isActive: form.isActive,
        description: form.description.trim() || null,
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === activeProduct.id ? (updated as Product) : item,
        ),
      );
      setIsEditOpen(false);
      setActiveProduct(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ürün Güncellenemedi";
      setModalError(message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!companyId || !activeProduct) return;

    const confirmed = window.confirm(
      `"${activeProduct.name}" Ürünü Silinsin mi?`,
    );
    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      setModalError(null);

      await deleteProduct(activeProduct.id, companyId);

      const nextProducts = products.filter((p) => p.id !== activeProduct.id);
      setProducts(nextProducts);
      const nextFilteredLength = nextProducts.length;
      const nextTotalPages = Math.max(
        1,
        Math.ceil(nextFilteredLength / itemsPerPage),
      );
      if (currentPage > nextTotalPages) {
        setCurrentPage(nextTotalPages);
      }
      setIsEditOpen(false);
      setActiveProduct(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ürün Silinemedi";
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
