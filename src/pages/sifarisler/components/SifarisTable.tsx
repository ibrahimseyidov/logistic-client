import { FaFileAlt } from "react-icons/fa";
import type { OrderStatusKind, SifarisOrderRow } from "../types/sifaris.types";

const th =
  "px-2 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200 bg-gray-100";

function rowTone(kind: OrderStatusKind): string {
  switch (kind) {
    case "planned":
      return "bg-orange-50/90 border-l-4 border-l-orange-500";
    case "progress":
      return "bg-amber-50/90 border-l-4 border-l-amber-400";
    case "completed":
      return "bg-sky-50/90 border-l-4 border-l-sky-500";
    default:
      return "bg-white border-l-4 border-l-gray-300";
  }
}

interface Props {
  rows: SifarisOrderRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAllPage: (ids: string[], checked: boolean) => void;
}

export default function SifarisTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAllPage,
}: Props) {
  const pageIds = rows.map((r) => r.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  return (
    <table className="min-w-max w-full border-collapse text-sm">
      <thead className="sticky top-0 z-10">
        <tr>
          <th className={`${th} w-10`}>
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={allSelected}
              onChange={(e) => onToggleAllPage(pageIds, e.target.checked)}
              aria-label="Səhifədəki bütün sətirlər"
            />
          </th>
          <th className={th}>Sifarişin nömrəsi</th>
          <th className={th}>Sifarişin tarixi</th>
          <th className={th}>Sifarişin statusu</th>
          <th className={`${th} min-w-[160px]`}>Müştəri</th>
          <th className={`${th} min-w-[140px]`}>Daşıyıcılar</th>
          <th className={th}>Reysin nömrəsi</th>
          <th className={`${th} min-w-[140px]`}>Marşrutlar</th>
          <th className={`${th} min-w-[180px]`}>Yükün parametrləri</th>
          <th className={th}>Fraxt</th>
          <th className={th}>Əlavə xərclər</th>
          <th className={th}>Mənfəət</th>
          <th className={th}>Sənədlər</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className={rowTone(row.statusKind)}>
            <td className="px-2 py-2 text-center align-top">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedIds.has(row.id)}
                onChange={() => onToggleRow(row.id)}
                aria-label={`Seç: ${row.orderNumber}`}
              />
            </td>
            <td className="px-2 py-2 whitespace-nowrap align-top font-medium text-indigo-600">
              {row.orderNumber}
            </td>
            <td className="px-2 py-2 text-gray-700 whitespace-nowrap align-top">{row.orderDate}</td>
            <td className="px-2 py-2 text-gray-800 whitespace-nowrap align-top font-medium">
              {row.statusLabel}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top text-xs">
              <div>{row.customer}</div>
              <div className="text-gray-500 mt-0.5">{row.customerRefs}</div>
            </td>
            <td className="px-2 py-2 text-gray-700 align-top text-xs whitespace-pre-line">
              {row.carriers}
            </td>
            <td className="px-2 py-2 text-gray-700 whitespace-nowrap align-top">
              {row.voyageNumber}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top whitespace-nowrap">{row.route}</td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-pre-line text-xs max-w-[240px]">
              {row.cargoParams}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top whitespace-nowrap">{row.freight}</td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-nowrap">{row.extraCosts}</td>
            <td className="px-2 py-2 text-emerald-700 font-medium align-top whitespace-nowrap">
              {row.profit}
            </td>
            <td className="px-2 py-2 align-top">
              <div className="flex items-center gap-1 text-gray-600" title={row.documents}>
                <FaFileAlt className="shrink-0" />
                <span className="text-xs line-clamp-2 max-w-[120px]">{row.documents}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
