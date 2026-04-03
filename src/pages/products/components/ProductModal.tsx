"use client";

import { useMemo, useEffect, useState } from "react";
import Select from "../../../common/components/select";
import { VALID_STOCK_UNITS } from "../constants/product.constants";
import { generateUniqueBarcode } from "../../../common/actions/products.actions";
import type { Category } from "../types/category.types";
import type { ProductFormState } from "../types/form.types";

interface ProductModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  form: ProductFormState;
  level1Categories: Category[];
  level2Categories: Category[];
  level3Categories: Category[];
  level4Categories: Category[];
  onChange: (field: keyof ProductFormState, value: string | boolean) => void;
  onLevel1Change: (value: string) => void;
  onLevel2Change: (value: string) => void;
  onLevel3Change: (value: string) => void;
  onLevel4Change: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  isLoading: boolean;
  deleteLoading?: boolean;
  error: string | null;
}

function ProductModal({
  isOpen,
  title,
  submitLabel,
  form,
  level1Categories,
  level2Categories,
  level3Categories,
  level4Categories,
  onChange,
  onLevel1Change,
  onLevel2Change,
  onLevel3Change,
  onLevel4Change,
  onClose,
  onSubmit,
  onDelete,
  isLoading,
  deleteLoading = false,
  error,
}: ProductModalProps) {
  // mounted: DOM'da var mı?
  const [mounted, setMounted] = useState(false);
  // visible: animasyon aktif mi?
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Double RAF: mount ve visible'ı ayrı frame'lere yayarak
      // tarayıcının başlangıç state'ini (translateX 100%) yakalamasını sağlar.
      // Tek RAF'ta tarayıcı ikisini birleştirip animasyonu atlıyor.
      let raf2: number;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    } else {
      setVisible(false);
      // Transition bittikten sonra DOM'dan kaldır (duration ile eşleşmeli)
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isLoading || deleteLoading) return;
    onChange("_invalidName", false);
    onChange("_invalidBarcode", false);
    onChange("_invalidCategory", false);
    onClose();
  };

  const level1Options = useMemo(
    () => level1Categories.map((c) => ({ value: String(c.id), label: c.name })),
    [level1Categories],
  );
  const level2Options = useMemo(
    () => level2Categories.map((c) => ({ value: String(c.id), label: c.name })),
    [level2Categories],
  );
  const level3Options = useMemo(
    () => level3Categories.map((c) => ({ value: String(c.id), label: c.name })),
    [level3Categories],
  );
  const level4Options = useMemo(
    () => level4Categories.map((c) => ({ value: String(c.id), label: c.name })),
    [level4Categories],
  );
  const stockUnitOptions = useMemo(
    () => VALID_STOCK_UNITS.map((unit) => ({ value: unit, label: unit })),
    [],
  );

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      {/* Arka plan overlay — fade in/out */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: visible ? 0.45 : 0 }}
        onClick={handleClose}
      />

      {/* Panel — sağdan kayarak açılır/kapanır */}
      <div
        className="relative h-full w-full max-w-2xl sm:max-w-3xl bg-white shadow-2xl flex flex-col
                   transition-all duration-300 ease-in-out"
        style={{
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          transform: visible ? "translateX(0)" : "translateX(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors"
            onClick={handleClose}
            aria-label="Kapat"
            disabled={isLoading || deleteLoading}
          >
            ×
          </button>
        </div>

        {/* İçerik */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Ürün Adı</span>
              <input
                className={`border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 ${form._invalidName ? "border-red-500" : ""}`}
                value={form.name}
                onChange={(e) => {
                  onChange("name", e.target.value);
                  if (form._invalidName && e.target.value.trim())
                    onChange("_invalidName", false);
                }}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Barkod</span>
              <div className="relative flex">
                <input
                  className={`border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 w-full pr-10 ${form._invalidBarcode ? "border-red-500" : ""}`}
                  value={form.barcode}
                  onChange={(e) => {
                    onChange("barcode", e.target.value);
                    if (form._invalidBarcode && e.target.value.trim())
                      onChange("_invalidBarcode", false);
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                  title="Benzersiz Barkod Üret"
                  onClick={async () => {
                    console.log("companyId:", form.companyId);
                    if (!form.companyId) {
                      alert("companyId eksik!");
                      return;
                    }
                    onChange("barcode", "..."); // loading göster
                    try {
                      const barcode = await generateUniqueBarcode(
                        Number(form.companyId),
                      );
                      console.log("Barkod:", barcode);
                      onChange("barcode", barcode);
                      if (form._invalidBarcode && barcode)
                        onChange("_invalidBarcode", false);
                    } catch (e) {
                      onChange("barcode", "");
                      alert("Barkod üretilemedi");
                      console.error(e);
                    }
                  }}
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <rect
                      x="3"
                      y="4"
                      width="2"
                      height="16"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="7"
                      y="4"
                      width="1"
                      height="16"
                      rx="0.5"
                      fill="currentColor"
                    />
                    <rect
                      x="10"
                      y="4"
                      width="2"
                      height="16"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="14"
                      y="4"
                      width="1"
                      height="16"
                      rx="0.5"
                      fill="currentColor"
                    />
                    <rect
                      x="17"
                      y="4"
                      width="2"
                      height="16"
                      rx="1"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Satış Fiyatı</span>
              <input
                className="border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.salePrice}
                onChange={(e) => onChange("salePrice", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Alış Fiyatı</span>
              <input
                className="border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.purchasePrice}
                onChange={(e) => onChange("purchasePrice", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Stok Türü</span>
              <Select
                value={form.stockUnit}
                options={stockUnitOptions}
                onChange={(value) => onChange("stockUnit", value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-base"
              />
            </label>

            {/* Kategoriler — sağ kolonda 4'ü alt alta */}
            <div className="row-span-4 flex flex-col gap-2">
              <span className="text-sm font-medium">Kategoriler</span>
              <Select
                value={form.parentCategoryId}
                options={level1Options}
                onChange={(value) => {
                  onLevel1Change(value);
                  if (form._invalidCategory && value)
                    onChange("_invalidCategory", false);
                }}
                placeholder="Ana kategori"
                className={`w-full border rounded px-3 py-2 text-base ${form._invalidCategory ? "border-red-500" : "border-gray-300"}`}
              />
              <Select
                value={form.categoryLevel2Id}
                options={level2Options}
                onChange={onLevel2Change}
                placeholder="Alt kategori 1"
                disabled={!form.parentCategoryId}
                className="w-full border border-gray-300 rounded px-3 py-2 text-base"
              />
              <Select
                value={form.categoryLevel3Id}
                options={level3Options}
                onChange={onLevel3Change}
                placeholder="Alt kategori 2"
                disabled={!form.categoryLevel2Id}
                className="w-full border border-gray-300 rounded px-3 py-2 text-base"
              />
              <Select
                value={form.categoryLevel4Id}
                options={level4Options}
                onChange={onLevel4Change}
                placeholder="Alt kategori 3"
                disabled={!form.categoryLevel3Id}
                className="w-full border border-gray-300 rounded px-3 py-2 text-base"
              />
            </div>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Görsel URL</span>
              <input
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.imageUrl}
                onChange={(e) => onChange("imageUrl", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Açıklama</span>
              <textarea
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                rows={4}
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
              />
            </label>

            {error && (
              <p className="text-red-600 md:col-span-2 text-sm">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gray-50 shrink-0">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => onChange("isActive", e.target.checked)}
            />
            <span className="text-sm">Aktif</span>
          </label>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            {onDelete && (
              <button
                type="button"
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 transition-colors"
                onClick={onDelete}
                disabled={isLoading || deleteLoading}
              >
                {deleteLoading ? "Siliniyor..." : "Sil"}
              </button>
            )}
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-60 transition-colors"
              onClick={handleClose}
              disabled={isLoading || deleteLoading}
            >
              İptal
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors"
              onClick={onSubmit}
              disabled={isLoading || deleteLoading}
            >
              {isLoading ? "Kaydediliyor..." : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
