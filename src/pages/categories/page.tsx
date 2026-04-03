"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

import { useAuth } from "../../common/contexts/AuthContext";
import { DeleteModal, NotificationModal } from "./components";
import { useAppDispatch, useAppSelector } from "../../common/store/hooks";
import { showDeleteModal } from "../../common/store/modalSlice";
import EditModal from "./components/EditModal";
import Loading from "../../common/components/loading";
import {
  createCategory,
  deleteCategory,
  fetchAllCategories,
  updateCategory,
  fetchChildrenForParent,
} from "../../common/actions/categories.actions";
import type { CategoryRecord } from "../../common/actions/categories.actions";

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  companyCategoryId?: string | number;
}

const MAX_LEVEL = 4;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  // Kök kategoriler (parentId === null)
  const rootCategories = useMemo(
    () => categories.filter((c) => c.parentId === null),
    [categories],
  );
  const { user } = useAuth();
  const companyId = user?.companyId;
  const [childrenByParent, setChildrenByParent] = useState<
    Record<number, Category[]>
  >({});
  const [selectedPath, setSelectedPath] = useState<(number | null)[]>(
    Array(MAX_LEVEL).fill(null),
  );
  const [inputByLevel, setInputByLevel] = useState<string[]>(
    Array(MAX_LEVEL).fill(""),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    level: number | null;
    categoryId: number | null;
    name: string;
  }>({ open: false, level: null, categoryId: null, name: "" });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  // Redux-driven delete modal, no local state
  const deleteModalOpen = useRef(false);
  // (await ile başlayan kod bloğu fonksiyon dışında yanlışlıkla kalmış, kaldırıldı)
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.id, c));
    Object.values(childrenByParent)
      .flat()
      .forEach((c) => map.set(c.id, c));
    return map;
  }, [categories, childrenByParent]);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetchAllCategories(companyId)
      .then((data: CategoryRecord[]) => {
        setCategories(
          data.map((c) => ({
            ...c,
            parentId: c.parentId ?? null,
            companyCategoryId:
              c.companyCategoryId === null || c.companyCategoryId === undefined
                ? undefined
                : c.companyCategoryId,
          })),
        );
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Kategoriler yüklenemedi",
        ),
      )
      .finally(() => setLoading(false));
  }, [companyId, shouldRefetch]);

  // Listen for delete modal close after delete, then refetch
  const modalDeleteOpen = useAppSelector((state) => state.modal.delete.open);
  useEffect(() => {
    if (deleteModalOpen.current && !modalDeleteOpen) {
      // Modal just closed, trigger refetch
      setShouldRefetch((v) => !v);
    }
    deleteModalOpen.current = modalDeleteOpen;
  }, [modalDeleteOpen]);

  useEffect(() => {
    if (actionError) setShowNotification(true);
  }, [actionError]);

  const removeCategoryFromState = (categoryId: number) => {
    setCategories((prev) => prev.filter((item) => item.id !== categoryId));
    setChildrenByParent((prev) => {
      const next: Record<number, Category[]> = {};
      Object.entries(prev).forEach(([parentKey, children]) => {
        const parentId = Number(parentKey);
        if (parentId === categoryId) return;
        next[parentId] = children.filter((child) => child.id !== categoryId);
      });
      return next;
    });
  };

  const getCategoriesByLevel = (level: number): Category[] => {
    if (level === 0) return rootCategories;
    const parentId = selectedPath[level - 1];
    if (!parentId) return [];
    return childrenByParent[parentId] || [];
  };

  const handleSelectCategory = async (level: number, category: Category) => {
    if (!companyId) return;
    setActionError(null);
    setSelectedPath((prev) => {
      const next = [...prev];
      next[level] = category.id;
      for (let i = level + 1; i < MAX_LEVEL; i += 1) next[i] = null;
      return next;
    });
    // inputByLevel güncellenmiyor, sadece seçim yapılıyor
    // Alt kategoriler daha önce yüklenmediyse getir
    if (level < MAX_LEVEL - 1 && !childrenByParent[category.id]) {
      try {
        const children = await fetchChildrenForParent(category.id, companyId);
        setChildrenByParent((prev) => ({
          ...prev,
          [category.id]: children.map((c: any) => ({
            ...c,
            parentId: c.parentId ?? null,
            companyCategoryId:
              c.companyCategoryId === null || c.companyCategoryId === undefined
                ? undefined
                : c.companyCategoryId,
          })),
        }));
      } catch (err) {
        setActionError("Alt kategoriler yüklenemedi");
      }
    }
  };

  const handleInputByLevelChange = (level: number, value: string) => {
    setInputByLevel((prev) => {
      const next = [...prev];
      next[level] = value;
      return next;
    });
  };

  const handleCreateAtLevel = async (level: number) => {
    if (!companyId) return;
    const trimmedName = inputByLevel[level].trim();
    const parentId = level === 0 ? null : selectedPath[level - 1];
    if (!trimmedName) return;
    if (level > 0 && !parentId) return;

    try {
      setActionLoading("create");
      setActionError(null);
      const createdRecord = await createCategory({
        name: trimmedName,
        companyId,
        parentId,
      });
      const created: Category = {
        ...createdRecord,
        parentId: createdRecord.parentId ?? null,
        companyCategoryId:
          createdRecord.companyCategoryId === null ||
          createdRecord.companyCategoryId === undefined
            ? undefined
            : createdRecord.companyCategoryId,
      };
      if (parentId) {
        setChildrenByParent((prev) => ({
          ...prev,
          [parentId]: [...(prev[parentId] || []), created],
        }));
      } else {
        setCategories((prev) => [...prev, created]);
      }
      setSelectedPath((prev) => {
        const next = [...prev];
        next[level] = created.id;
        for (let i = level + 1; i < MAX_LEVEL; i += 1) next[i] = null;
        return next;
      });
      setInputByLevel((prev) => {
        const next = [...prev];
        next[level] = created.name;
        for (let i = level + 1; i < MAX_LEVEL; i += 1) next[i] = "";
        return next;
      });
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Kategori oluşturulamadı",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditAtLevel = (level: number) => {
    const selectedId = selectedPath[level];
    if (!selectedId) return;
    const selectedCategory = categoryMap.get(selectedId);
    if (!selectedCategory) return;
    setEditModal({
      open: true,
      level,
      categoryId: selectedId,
      name: selectedCategory.name,
    });
  };

  const handleEditModalSubmit = async () => {
    if (
      !companyId ||
      !Number.isFinite(editModal.level) ||
      !editModal.categoryId
    )
      return;
    const trimmedName = editModal.name.trim();
    const selectedCategory = categoryMap.get(editModal.categoryId);
    if (!selectedCategory) return;
    if (!trimmedName || trimmedName === selectedCategory.name) return;
    try {
      setActionLoading("edit");
      setActionError(null);
      const updatedRecord = await updateCategory(editModal.categoryId, {
        name: trimmedName,
        companyId,
        parentId: selectedCategory.parentId,
      });
      const updated: Category = {
        ...updatedRecord,
        parentId: updatedRecord.parentId ?? null,
        companyCategoryId:
          updatedRecord.companyCategoryId === null ||
          updatedRecord.companyCategoryId === undefined
            ? undefined
            : updatedRecord.companyCategoryId,
      };
      const updateInList = (list: Category[]) =>
        list.map((c) => (c.id === updated.id ? updated : c));
      setCategories((prev) => updateInList(prev));
      setChildrenByParent((prev) => {
        const next: Record<number, Category[]> = {};
        Object.entries(prev).forEach(([key, children]) => {
          next[Number(key)] = updateInList(children);
        });
        return next;
      });
      // inputByLevel güncellenmesin, input otomatik dolmasın
      setEditModal({ open: false, level: null, categoryId: null, name: "" });
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Kategori güncellenemedi",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const dispatch = useAppDispatch();
  const handleDeleteAtLevel = (level: number) => {
    const selectedId = selectedPath[level];
    if (!selectedId) return;
    const selectedCategory = categoryMap.get(selectedId);
    if (!selectedCategory) return;
    dispatch(
      showDeleteModal({
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        level,
      }),
    );
  };

  return (
    <div className="h-full overflow-hidden bg-white flex flex-col overflow-hidden p-4">
      {(error || !companyId) && (
        <div className="shrink-0">
          {error && (
            <p className="text-red-600 text-center font-semibold">{error}</p>
          )}
          {!companyId && (
            <p className="text-center text-gray-500">
              Önce giriş yapmalısınız.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <Loading />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
          {Array.from({ length: MAX_LEVEL }).map((_, level) => {
            const levelItems = getCategoriesByLevel(level);
            return (
              <section
                key={level}
                className="bg-gray-50 border border-gray-200 rounded-lg shadow p-3 flex flex-col h-full"
              >
                <header className="font-bold text-lg text-blue-700 mb-2 flex items-center gap-2 shrink-0">
                  {level + 1}. Kademe
                </header>
                <div className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {levelItems.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      Kategori yok
                    </p>
                  ) : (
                    levelItems.map((category) => {
                      const isSelected = selectedPath[level] === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleSelectCategory(level, category)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded border transition text-left ${
                            isSelected
                              ? "bg-blue-100 border-blue-400 text-blue-700"
                              : "bg-gray-50 border-gray-200 hover:bg-blue-50"
                          }`}
                        >
                          <span className="truncate font-medium">
                            {category.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-400">
                            {category.companyCategoryId ?? category.id}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                {/* Sabit alt alan: input + butonlar */}
                <div className="shrink-0 pt-2 border-t flex flex-row flex-wrap gap-2 items-center w-full">
                  <input
                    type="text"
                    value={inputByLevel[level]}
                    onChange={(event) =>
                      handleInputByLevelChange(level, event.target.value)
                    }
                    className="min-w-0 flex-1 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder={
                      level === 0 ? "Ana kategori adı" : "Alt kategori adı"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateAtLevel(level)}
                    className="bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 flex items-center gap-1 disabled:opacity-50"
                    title="Ekle"
                    aria-label="Ekle"
                    disabled={
                      actionLoading !== null ||
                      !companyId ||
                      !inputByLevel[level].trim() ||
                      (level > 0 && !selectedPath[level - 1])
                    }
                  >
                    <FaPlus />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditAtLevel(level)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white rounded px-3 py-1 flex items-center gap-1 disabled:opacity-50"
                    title="Düzenle"
                    aria-label="Düzenle"
                    disabled={actionLoading !== null || !selectedPath[level]}
                  >
                    <FaEdit />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAtLevel(level)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1 flex items-center gap-1 disabled:opacity-50"
                    title="Sil"
                    aria-label="Sil"
                    disabled={actionLoading !== null || !selectedPath[level]}
                  >
                    <FaTrash />
                  </button>
                </div>
              </section>
            );
          })}

          <EditModal
            isOpen={editModal.open}
            value={editModal.name}
            onChange={(val) => setEditModal((prev) => ({ ...prev, name: val }))}
            onClose={() =>
              setEditModal({
                open: false,
                level: null,
                categoryId: null,
                name: "",
              })
            }
            onSubmit={handleEditModalSubmit}
            isLoading={actionLoading === "edit"}
            error={actionError}
          />
        </div>
      )}

      <NotificationModal />

      {companyId && <DeleteModal companyId={companyId} />}
    </div>
  );
}
