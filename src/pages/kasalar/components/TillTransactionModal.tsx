import { FormEvent, useEffect, useState } from "react";
import { type Till } from "../../../common/actions/tills.actions";
import { type Supplier } from "../../suppliers/types/supplier.types";
import { fetchSuppliers } from "../../../common/actions/suppliers.actions";
import { useAuth } from "../../../common/contexts/AuthContext";

type TransactionType = "medaxil" | "mexaric" | "gider" | "transfer";
type CounterpartyType = "supplier" | "customer";
type TransferTillOption = Till & { branchName?: string };

interface TillTransactionModalProps {
  isOpen: boolean;
  tillBalance: number;
  sourceTillId: number;
  availableTills: TransferTillOption[];
  onClose: () => void;
  onSubmit: (payload: {
    type: TransactionType;
    amount: number;
    description?: string;
    counterpartyType?: CounterpartyType;
    counterpartyId?: number;
    counterpartyName?: string;
    targetTillId?: number;
  }) => Promise<void>;
}

const TYPE_INFO = {
  medaxil: {
    title: "Medaxil",
    accent: "text-green-700",
    btn: "bg-green-600 hover:bg-green-700",
  },
  mexaric: {
    title: "Mexaric",
    accent: "text-red-700",
    btn: "bg-red-600 hover:bg-red-700",
  },
  gider: {
    title: "Gider Kaydı",
    accent: "text-amber-700",
    btn: "bg-orange-600 hover:bg-orange-700",
  },
  transfer: {
    title: "Kassa Transferi",
    accent: "text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
};

export default function TillTransactionModal({
  isOpen,
  tillBalance,
  sourceTillId,
  availableTills,
  onClose,
  onSubmit,
}: TillTransactionModalProps) {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionType, setTransactionType] =
    useState<TransactionType>("medaxil");
  const [counterpartyType, setCounterpartyType] = useState<
    CounterpartyType | ""
  >("");
  const [counterpartyId, setCounterpartyId] = useState<number | "">("");
  const [customerName, setCustomerName] = useState("");
  const [targetTillId, setTargetTillId] = useState<number | "">("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const info = TYPE_INFO[transactionType];
  const isGider = transactionType === "gider";
  const isTransfer = transactionType === "transfer";
  const transferTargets = availableTills.filter(
    (till) => till.id !== sourceTillId,
  );

  useEffect(() => {
    if (!isOpen) {
      setTransactionType("medaxil");
      setAmount("");
      setDescription("");
      setCounterpartyType("");
      setCounterpartyId("");
      setCustomerName("");
      setTargetTillId("");
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isGider || isTransfer || !companyId) return;
    setLoadingSuppliers(true);
    fetchSuppliers(companyId)
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setLoadingSuppliers(false));
  }, [isOpen, isGider, isTransfer, companyId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Lütfen geçerli bir tutar giriniz.");
      return;
    }

    if (isTransfer && !targetTillId) {
      setError("Lütfen hedef kassa seçiniz.");
      return;
    }

    if (!isTransfer && transactionType !== "gider" && !counterpartyType) {
      setError("Lütfen müşteri veya tedarikçi seçiniz.");
      return;
    }

    if (counterpartyType === "supplier" && !counterpartyId) {
      setError("Lütfen bir tedarikçi seçiniz.");
      return;
    }

    if (counterpartyType === "customer" && !customerName.trim()) {
      setError("Lütfen müşteri adını giriniz.");
      return;
    }

    if (
      (transactionType === "mexaric" || isTransfer) &&
      parsedAmount > tillBalance
    ) {
      setError(`Kassa bakiyesi yetersiz. Mevcut: ${tillBalance.toFixed(2)} ₼`);
      return;
    }

    const selectedSupplier =
      counterpartyType === "supplier"
        ? suppliers.find((s) => s.id === Number(counterpartyId))
        : null;

    setSubmitting(true);
    try {
      await onSubmit({
        type: transactionType,
        amount: parsedAmount,
        description: description.trim() || undefined,
        targetTillId: isTransfer ? Number(targetTillId) : undefined,
        counterpartyType: isGider
          ? undefined
          : (counterpartyType as CounterpartyType),
        counterpartyId:
          counterpartyType === "supplier" ? Number(counterpartyId) : undefined,
        counterpartyName: isTransfer
          ? undefined
          : counterpartyType === "supplier"
            ? selectedSupplier?.name
            : counterpartyType === "customer"
              ? customerName.trim()
              : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{info.title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {isTransfer
                ? "Seçili kassadan başka bir kassaya bakiye aktarın."
                : "Seçili kassa için yeni işlem oluşturun."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-xs text-gray-500 mb-1">Mevcut Bakiye</div>
          <div className={`text-2xl font-bold ${info.accent}`}>
            {tillBalance.toFixed(2)} ₼
          </div>
        </div>

        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İşlem Türü
            </label>
            <select
              value={transactionType}
              onChange={(e) =>
                setTransactionType(e.target.value as TransactionType)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="medaxil">Medaxil</option>
              <option value="mexaric">Mexaric</option>
              <option value="gider">Gider</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          {/* Karşı taraf seçimi (gider değilse) */}
          {!isGider && !isTransfer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İşlem Tarafı
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCounterpartyType("supplier");
                    setCounterpartyId("");
                    setCustomerName("");
                  }}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    counterpartyType === "supplier"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  Tedarikçi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCounterpartyType("customer");
                    setCounterpartyId("");
                  }}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    counterpartyType === "customer"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  Müşteri
                </button>
              </div>
            </div>
          )}

          {isTransfer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hedef Kassa
              </label>
              <select
                value={targetTillId}
                onChange={(e) =>
                  setTargetTillId(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Hedef kassa seçiniz --</option>
                {transferTargets.map((till) => (
                  <option key={till.id} value={till.id}>
                    {till.branchName ? `${till.branchName} / ` : ""}
                    {till.name} ({till.balance.toFixed(2)} ₼)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tedarikçi seçimi */}
          {counterpartyType === "supplier" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tedarikçi Seç
              </label>
              <select
                value={counterpartyId}
                onChange={(e) =>
                  setCounterpartyId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                disabled={loadingSuppliers}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Tedarikçi Seçiniz --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Müşteri adı */}
          {counterpartyType === "customer" && !isTransfer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Müşteri Adı
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Müşteri adını giriniz"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Tutar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tutar (₼)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama{" "}
              {!isGider && (
                <span className="text-gray-400">(İsteğe bağlı)</span>
              )}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isTransfer
                  ? "Transfer açıklaması giriniz"
                  : isGider
                    ? "Gider açıklaması"
                    : "Açıklama giriniz"
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${info.btn}`}
            >
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
