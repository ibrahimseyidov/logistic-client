import { useEffect, useState } from "react";
import type { SupplierFormState } from "../types/supplier.types";

interface SuppliersModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  form: SupplierFormState;
  onChange: (field: keyof SupplierFormState, value: string | boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  isLoading: boolean;
  deleteLoading?: boolean;
  error: string | null;
}

function SuppliersModal({
  isOpen,
  title,
  submitLabel,
  form,
  onChange,
  onClose,
  onSubmit,
  onDelete,
  isLoading,
  deleteLoading = false,
  error,
}: SuppliersModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
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
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isLoading || deleteLoading) return;
    onClose();
  };

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
        className="relative h-full w-full max-w-lg bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out"
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
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Tedarikçi Adı</span>
              <input
                className="border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Yetkili Kişi</span>
              <input
                className="border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.contactPerson}
                onChange={(e) => onChange("contactPerson", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">E-posta</span>
              <input
                type="email"
                className="border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Telefon</span>
              <input
                className="border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Adres</span>
              <input
                className="border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.address}
                onChange={(e) => onChange("address", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Vergi Numarası</span>
              <input
                className="border rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.taxNumber}
                onChange={(e) => onChange("taxNumber", e.target.value)}
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
              checked={form.status === "active"}
              onChange={(e) =>
                onChange("status", e.target.checked ? "active" : "inactive")
              }
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

export default SuppliersModal;
