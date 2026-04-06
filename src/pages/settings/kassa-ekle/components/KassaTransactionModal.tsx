import { FormEvent, useRef, useState } from "react";

interface KassaTransactionModalProps {
  isOpen: boolean;
  type: "giriş" | "çıkış" | "gider";
  tillBalance: number;
  onClose: () => void;
  onSubmit: (amount: number, description: string) => void;
}

export default function KassaTransactionModal({
  isOpen,
  type,
  tillBalance,
  onClose,
  onSubmit,
}: KassaTransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getTypeInfo = () => {
    switch (type) {
      case "giriş":
        return {
          title: "Para Giriş",
          color: "green",
          icon: "➕",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          buttonColor: "bg-green-600 hover:bg-green-700",
        };
      case "çıkış":
        return {
          title: "Para Çıkış",
          color: "red",
          icon: "➖",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          buttonColor: "bg-red-600 hover:bg-red-700",
        };
      case "gider":
        return {
          title: "Gider Kaydı",
          color: "orange",
          icon: "📋",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          buttonColor: "bg-orange-600 hover:bg-orange-700",
        };
    }
  };

  const info = getTypeInfo();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount.replace(",", "."));

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Lütfen geçerli bir tutar giriniz.");
      return;
    }

    if (!description.trim()) {
      setError("Lütfen bir açıklama giriniz.");
      return;
    }

    if (type === "çıkış" && parsedAmount > tillBalance) {
      setError(
        `Kasa bakiyesi yetersiz. Mevcut bakiye: ${tillBalance.toFixed(2)} ₺`,
      );
      return;
    }

    setSubmitting(true);
    try {
      onSubmit(parsedAmount, description.trim());
      setAmount("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 ${info.bgColor} border ${info.borderColor} animate-slide-up`}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{info.icon}</span>
          <h2 className="text-2xl font-bold text-gray-800">{info.title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Mevcut Bakiye</div>
            <div className="text-2xl font-bold text-blue-600 mb-4">
              {tillBalance.toFixed(2)} ₺
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tutar (₺)
            </label>
            <input
              ref={amountInputRef}
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === "girer"
                  ? "Örn: Satış geliri"
                  : type === "çıkış"
                    ? "Örn: Mal siparişi"
                    : "Örn: Kira ödemesi"
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white ${info.buttonColor} transition-colors disabled:opacity-50`}
            >
              {submitting ? "İşleniyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
