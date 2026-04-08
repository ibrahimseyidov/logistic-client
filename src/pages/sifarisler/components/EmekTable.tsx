import { useCallback, useState } from "react";
import StatusBadge from "../../../common/components/StatusBadge";
import type { EmekRow } from "../types/emek.types";

const th =
  "px-1.5 py-2 text-[11px] font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200 bg-gray-100";

const inputCls =
  "w-full min-w-[3rem] rounded border border-gray-300 px-1 py-0.5 text-[11px] text-center bg-white";

interface Props {
  rows: EmekRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAllPage: (ids: string[], checked: boolean) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function EmekTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAllPage,
}: Props) {
  const pageIds = rows.map((r) => r.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const [revenuePct, setRevenuePct] = useState<Record<string, string>>({});
  const [bonusPct, setBonusPct] = useState<Record<string, string>>({});

  const getRevenue = useCallback(
    (row: EmekRow) => revenuePct[row.id] ?? String(row.revenuePct),
    [revenuePct],
  );
  const getBonusPct = useCallback(
    (row: EmekRow) => bonusPct[row.id] ?? String(row.bonusPct),
    [bonusPct],
  );

  const tipLabel = (k: EmekRow["kind"]) =>
    k === "order" ? "Sifarişə görə" : "Reysə görə";

  return (
    <table className="min-w-max w-full border-collapse text-[11px]">
      <thead className="sticky top-0 z-10">
        <tr>
          <th className={`${th} w-8`}>
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={allSelected}
              onChange={(e) => onToggleAllPage(pageIds, e.target.checked)}
              aria-label="Səhifədəki bütün sətirlər"
            />
          </th>
          <th className={`${th} min-w-[100px]`}>Tip</th>
          <th className={th}>Sifarişin nömrəsi</th>
          <th className={th}>Sifarişin tarixi</th>
          <th className={`${th} min-w-[90px]`}>Sifarişin statusu</th>
          <th className={`${th} min-w-[100px]`}>Müştəri</th>
          <th className={`${th} min-w-[140px]`}>İşçi</th>
          <th className={th}>Fraxt</th>
          <th className={th}>Xərclər</th>
          <th className={th}>Mənfəət</th>
          <th className={`${th} min-w-[72px]`}>% gəlirlər %</th>
          <th className={th}>Cəmi bonus</th>
          <th className={`${th} min-w-[72px]`}>bonus üçün %</th>
          <th className={th}>Mükafatın həcmi</th>
          <th className={th}>Ödenilib</th>
          <th className={th}>Ödənişin tarixi</th>
          <th className={th}>Marşrut</th>
          <th className={th}>Daşıyıcı</th>
          <th className={th}>Natamam yük</th>
          <th className={th}>Reysin nömrəsi</th>
          <th className={`${th} min-w-[120px]`}>Reys / Terminal qiyməti</th>
          <th className={th}>Hesablar</th>
          <th className={th}>Məbləğ</th>
          <th className={`${th} min-w-[90px]`}>Ödənilmiş məbləğ</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            className={index % 2 === 0 ? "bg-white" : "bg-gray-50/90"}
          >
            <td className="px-1 py-1.5 text-center align-top">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedIds.has(row.id)}
                onChange={() => onToggleRow(row.id)}
              />
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top whitespace-nowrap">
              {tipLabel(row.kind)}
            </td>
            <td className="px-1 py-1.5 font-medium text-indigo-600 align-top whitespace-nowrap">
              {row.orderNumber}
            </td>
            <td className="px-1 py-1.5 text-gray-700 align-top whitespace-nowrap">
              {row.orderDate}
            </td>
            <td className="px-1 py-1.5 align-top">
              <StatusBadge label={row.orderStatus} className="text-[10px]" />
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top max-w-[120px]">
              {row.customer}
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top">
              {row.employee}
              {row.employeeRequired && (
                <span className="text-red-600 ml-0.5">*</span>
              )}
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top whitespace-nowrap">
              {row.freight}
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top tabular-nums">
              {fmt(row.expensesAzn)}
            </td>
            <td className="px-1 py-1.5 text-emerald-800 font-medium align-top tabular-nums">
              {fmt(row.profitAzn)}
            </td>
            <td className="px-1 py-1 align-top">
              <input
                className={inputCls}
                value={getRevenue(row)}
                onChange={(e) =>
                  setRevenuePct((prev) => ({
                    ...prev,
                    [row.id]: e.target.value,
                  }))
                }
                inputMode="decimal"
              />
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top tabular-nums">
              {fmt(row.totalBonusAzn)}
            </td>
            <td className="px-1 py-1 align-top">
              <input
                className={inputCls}
                value={getBonusPct(row)}
                onChange={(e) =>
                  setBonusPct((prev) => ({ ...prev, [row.id]: e.target.value }))
                }
                inputMode="decimal"
              />
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top tabular-nums">
              {fmt(row.rewardAmount)}
            </td>
            <td className="px-1 py-1.5 align-top">
              <StatusBadge label={row.paidLabel} className="text-[10px]" />
            </td>
            <td className="px-1 py-1.5 text-gray-600 align-top whitespace-nowrap">
              {row.paymentDate || "—"}
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top whitespace-nowrap max-w-[200px]">
              {row.route}
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top">
              {row.carrier}
            </td>
            <td className="px-1 py-1.5 text-gray-700 align-top">
              {row.incompleteLoad}
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top whitespace-nowrap">
              {row.tripNumber}
            </td>
            <td className="px-1 py-1.5 text-gray-800 align-top whitespace-nowrap">
              {row.voyagePrice}
            </td>
            <td className="px-1 py-1.5 text-gray-700 align-top">
              {row.accounts}
            </td>
            <td
              className={`px-1 py-1.5 align-top tabular-nums font-medium ${
                row.amountRed ? "text-red-600" : "text-gray-900"
              }`}
            >
              {fmt(row.amountAzn)}
            </td>
            <td
              className={`px-1 py-1.5 align-top tabular-nums font-medium ${
                row.paidAmountRed ? "text-red-600" : "text-gray-900"
              }`}
            >
              {fmt(row.paidAmountAzn)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
