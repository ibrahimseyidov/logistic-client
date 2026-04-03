import { useMemo, useState } from "react";
import { EMPTY_PRODUCT_FORM } from "../constants/product.constants";
import type { Category } from "../types/category.types";
import type { ProductFormState } from "../types/form.types";
import type { Product } from "../types/product.types";

interface UseProductFormParams {
  companyId?: number;
  childrenByParent: Map<number, Category[]>;
  getPath: (leafCategoryId: number) => number[];
  ensureCategoriesLoaded: () => Promise<void>;
}

export const useProductForm = ({
  companyId,
  childrenByParent,
  getPath,
  ensureCategoriesLoaded,
}: UseProductFormParams) => {
  const [form, setForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const level2Categories = useMemo(() => {
    if (!form.parentCategoryId) return [];
    return childrenByParent.get(Number(form.parentCategoryId)) || [];
  }, [childrenByParent, form.parentCategoryId]);

  const level3Categories = useMemo(() => {
    if (!form.categoryLevel2Id) return [];
    return childrenByParent.get(Number(form.categoryLevel2Id)) || [];
  }, [childrenByParent, form.categoryLevel2Id]);

  const level4Categories = useMemo(() => {
    if (!form.categoryLevel3Id) return [];
    return childrenByParent.get(Number(form.categoryLevel3Id)) || [];
  }, [childrenByParent, form.categoryLevel3Id]);

  const openCreateModal = () => {
    if (!companyId) return;
    void ensureCategoriesLoaded();
    setForm({ ...EMPTY_PRODUCT_FORM, companyId: String(companyId) });
    setActiveProduct(null);
    setModalError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = async (product: Product) => {
    if (!companyId) return;
    await ensureCategoriesLoaded();
    setActiveProduct(product);
    setModalError(null);
    setIsEditOpen(true);

    const parentId = String(product.parentCategoryId);
    let categoryLevel2Id = "";
    let categoryLevel3Id = "";
    let categoryLevel4Id = "";

    if (product.subCategoryId) {
      const path = getPath(product.subCategoryId);
      const parentIndex = path.indexOf(product.parentCategoryId);
      const descendants = parentIndex >= 0 ? path.slice(parentIndex + 1) : [];

      categoryLevel2Id = descendants[0] ? String(descendants[0]) : "";
      categoryLevel3Id = descendants[1] ? String(descendants[1]) : "";
      categoryLevel4Id = descendants[2] ? String(descendants[2]) : "";
    }

    setForm({
      name: product.name,
      parentCategoryId: parentId,
      categoryLevel2Id,
      categoryLevel3Id,
      categoryLevel4Id,
      barcode: product.barcode || "",
      stockQuantity: String(product.stockQuantity ?? 0),
      stockUnit: product.stockUnit || "adet",
      salePrice: String(product.salePrice ?? ""),
      purchasePrice:
        product.purchasePrice === null || product.purchasePrice === undefined
          ? ""
          : String(product.purchasePrice),
      imageUrl: product.imageUrl || "",
      isActive: product.isActive ?? true,
      description: product.description || "",
      companyId: String(product.companyId),
    });
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setModalError(null);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setModalError(null);
    setActiveProduct(null);
  };

  const handleChange = (
    field: keyof ProductFormState,
    value: string | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleParentChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      parentCategoryId: value,
      categoryLevel2Id: "",
      categoryLevel3Id: "",
      categoryLevel4Id: "",
    }));
  };

  const handleLevel2Change = (value: string) => {
    setForm((prev) => ({
      ...prev,
      categoryLevel2Id: value,
      categoryLevel3Id: "",
      categoryLevel4Id: "",
    }));
  };

  const handleLevel3Change = (value: string) => {
    setForm((prev) => ({
      ...prev,
      categoryLevel3Id: value,
      categoryLevel4Id: "",
    }));
  };

  const handleLevel4Change = (value: string) => {
    setForm((prev) => ({
      ...prev,
      categoryLevel4Id: value,
    }));
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
  };
};
