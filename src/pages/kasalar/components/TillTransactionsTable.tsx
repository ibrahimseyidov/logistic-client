import { useMemo } from "react";
import { type TillTransaction } from "../../../common/actions/tills.actions";

interface TillTransactionsTableProps {
  transactions: TillTransaction[];
}

const getTypeBadge = (transaction: TillTransaction) => {
  if (
    transaction.counterpartyType === "till" &&
    transaction.type === "medaxil"
  ) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        Transfer Giriş
      </span>
    );
  }

  if (
    transaction.counterpartyType === "till" &&
    transaction.type === "mexaric"
  ) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">
        Transfer Çıkış
      </span>
    );
  }

  if (transaction.type === "medaxil") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        Medaxil
      </span>
    );
  }

  if (transaction.type === "mexaric") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        Mexaric
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      Gider
    </span>
  );
};

const AMOUNT_COLOR: Record<string, string> = {
  medaxil: "text-green-700 font-bold",
  mexaric: "text-red-700 font-bold",
  gider: "text-orange-700 font-bold",
};

export default function TillTransactionsTable({
  transactions,
}: TillTransactionsTableProps) {
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === "medaxil") acc.medaxil += t.amount;
        if (t.type === "mexaric") acc.mexaric += t.amount;
        if (t.type === "gider") acc.gider += t.amount;
        return acc;
      },
      { medaxil: 0, mexaric: 0, gider: 0 },
    );
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex min-h-52 items-center justify-center p-8 text-center text-sm text-gray-500">
        Henüz işlem kaydı bulunmuyor.
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="grid grid-cols-3 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="text-center">
          <div className="mb-1 text-xs font-medium text-gray-500">Medaxil</div>
          <div className="text-base font-bold text-green-700">
            +{totals.medaxil.toFixed(2)} ₼
          </div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-xs font-medium text-gray-500">Mexaric</div>
          <div className="text-base font-bold text-red-700">
            -{totals.mexaric.toFixed(2)} ₼
          </div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-xs font-medium text-gray-500">Gider</div>
          <div className="text-base font-bold text-orange-700">
            -{totals.gider.toFixed(2)} ₼
          </div>
        </div>
      </div>

      <table className="min-w-max w-full border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="w-16 px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap border-b border-gray-200">
              #
            </th>
            <th className="w-32 px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap border-b border-gray-200">
              Tür
            </th>
            <th className="w-56 px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap border-b border-gray-200">
              Taraf
            </th>
            <th className="w-32 px-3 py-2 text-center text-xs font-semibold text-blue-700 whitespace-nowrap border-b border-gray-200 bg-blue-50">
              Tutar
            </th>
            <th className="w-80 px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b border-gray-200">
              Açıklama
            </th>
            <th className="w-44 px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap border-b border-gray-200">
              Tarih
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {transactions.map((t, idx) => (
            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
              <td className="w-16 px-3 py-2 text-center text-sm text-gray-500 whitespace-nowrap">
                {idx + 1}
              </td>
              <td className="w-32 px-3 py-2 text-center whitespace-nowrap">
                {getTypeBadge(t)}
              </td>
              <td className="w-56 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[224px]">
                {t.counterpartyName ? (
                  <span>
                    {t.counterpartyType === "till"
                      ? `Kassa: ${t.counterpartyName}`
                      : t.counterpartyName}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td
                className={`w-32 px-3 py-2 text-center text-sm whitespace-nowrap bg-blue-50/30 ${AMOUNT_COLOR[t.type]}`}
              >
                {t.type === "medaxil" ? "+" : "-"}
                {t.amount.toFixed(2)} ₼
              </td>
              <td className="w-80 px-3 py-2 text-sm text-gray-600 text-center">
                {t.description || <span className="text-gray-400">-</span>}
              </td>
              <td className="w-44 px-3 py-2 text-center text-xs text-gray-500 whitespace-nowrap">
                {new Date(t.createdAt).toLocaleString("tr-TR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
