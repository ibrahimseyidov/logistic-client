import { useEffect, useRef, useState } from "react";
import type { Supplier } from "../types/supplier.types";
import type { Till } from "../../../common/actions/tills.actions";
import { fetchTills } from "../../../common/actions/tills.actions";

interface SuppliersAmountModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  branchId?: number;
  companyId?: number;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (amount: number, tillId: number) => void;
}

export default function SuppliersAmountModal({
  isOpen,
  supplier,
  branchId,
  companyId,
  isLoading,
  error,
  onClose,
  onSubmit,
}: SuppliersAmountModalProps) {
  const [amount, setAmount] = useState("");
  const [selectedTill, setSelectedTill] = useState<number | null>(null);
  const [tills, setTills] = useState<Till[]>([]);
  const [loadingTills, setLoadingTills] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && branchId && companyId) {
      setLoadingTills(true);
      fetchTills(branchId, companyId)
        .then((data) => {
          setTills(data);
          if (data.length > 0) {
            setSelectedTill(data[0].id);
          }
        })
        .catch(() => setTills([]))
        .finally(() => setLoadingTills(false));
      setAmount("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, branchId, companyId]);

  if (!isOpen || !supplier) return null;

  const title = "Ödeme Ekle";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTill) return;
    const num = parseFloat(amount.replace(",", "."));
    if (!num || num <= 0) return;
    onSubmit(num, selectedTill);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !isLoading && onClose()}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-700">{supplier.name}</span>{" "}
          için ödeme tutarı ve kassa seçiniz
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Kassa
            </label>
            <select
              value={selectedTill || ""}
              onChange={(e) => setSelectedTill(Number(e.target.value))}
              disabled={isLoading || loadingTills || tills.length === 0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="">Kassa Seçiniz</option>
              {tills.map((till) => (
                <option key={till.id} value={till.id}>
                  {till.name} ({till.balance.toFixed(2)} ₺)
                </option>
              ))}
            </select>
            {tills.length === 0 && !loadingTills && (
              <p className="text-xs text-gray-500 mt-1">
                Şubede kasa bulunmamaktadır.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tutar (₺)
            </label>
            <input
              ref={inputRef}
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isLoading || loadingTills}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || loadingTills}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                loadingTills ||
                !amount ||
                !selectedTill ||
                parseFloat(amount) <= 0
              }
              className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
