import { useCallback, useState } from "react";
import { FaChartBar, FaCut, FaEdit, FaEye, FaMinus } from "react-icons/fa";
import { getStatusSelectClasses } from "../../../common/components/StatusBadge";
import { YUK_CARGO_STATUS_OPTIONS } from "../constants/yuk.constants";
import type { YukLoadRow } from "../types/yuk.types";

const th =
  "px-2 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200 bg-gray-100";

interface Props {
  rows: YukLoadRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAllPage: (ids: string[], checked: boolean) => void;
}

export default function YukTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAllPage,
}: Props) {
  const pageIds = rows.map((r) => r.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const statusFor = useCallback(
    (row: YukLoadRow) => statusMap[row.id] ?? row.cargoStatus,
    [statusMap],
  );

  const setStatus = (id: string, v: string) => {
    setStatusMap((prev) => ({ ...prev, [id]: v }));
  };

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
          <th className={th}>Sifariş</th>
          <th className={th}>Şirkət</th>
          <th className={`${th} min-w-[120px]`}>Müştəri</th>
          <th className={th}>Yükləmə tarixi</th>
          <th className={th}>Boşaltma tarixi</th>
          <th className={th}>Göndərən</th>
          <th className={`${th} min-w-[200px]`}>Yükləmə yeri</th>
          <th className={th}>Alıcı</th>
          <th className={`${th} min-w-[180px]`}>Boşaltma yeri</th>
          <th className={`${th} min-w-[140px]`}>Yükün statusları</th>
          <th className={th}>Yeri</th>
          <th className={th}>Tarix</th>
          <th className={th}>Vaxt</th>
          <th className={`${th} min-w-[100px]`}>Şərhlər</th>
          <th className={th}>Yükün nömrəsi</th>
          <th className={`${th} min-w-[120px]`}>Yükün adı</th>
          <th className={`${th} min-w-[220px]`}>Yükün parametrləri</th>
          <th className={th}>Atributlar</th>
          <th className={`${th} min-w-[120px]`}>Daşıyıcı</th>
          <th className={`${th} min-w-[160px]`}>Reys</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            className={index % 2 === 0 ? "bg-white" : "bg-gray-50/90"}
          >
            <td className="px-2 py-2 text-center align-top border-l border-gray-100">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedIds.has(row.id)}
                onChange={() => onToggleRow(row.id)}
                aria-label={`Seç: ${row.cargoNumber}`}
              />
            </td>
            <td className="px-2 py-2 whitespace-nowrap align-top font-medium text-indigo-600">
              {row.orderRef}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top whitespace-nowrap">
              {row.company}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top text-xs">
              {row.customer}
            </td>
            <td className="px-2 py-2 text-gray-600 align-top whitespace-nowrap">
              {row.loadDate || "—"}
            </td>
            <td className="px-2 py-2 text-gray-600 align-top whitespace-nowrap">
              {row.unloadDate || "—"}
            </td>
            <td className="px-2 py-2 text-gray-600 align-top text-xs">
              {row.sender || "—"}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top text-xs max-w-[280px]">
              {row.loadPlace}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-nowrap">
              {row.recipient}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top text-xs max-w-[260px]">
              {row.unloadPlace}
            </td>
            <td className="px-2 py-2 align-top">
              <select
                className={`w-full max-w-[150px] rounded-full border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] focus:outline-none focus:ring-2 ${getStatusSelectClasses(statusFor(row))}`}
                value={statusFor(row)}
                onChange={(e) => setStatus(row.id, e.target.value)}
              >
                {YUK_CARGO_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-2 py-2 text-gray-600 align-top">
              {row.place || "—"}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-nowrap">
              {row.entryDate}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-nowrap">
              {row.entryTime}
            </td>
            <td className="px-2 py-2 text-gray-500 align-top text-xs">
              {row.comments || "—"}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top whitespace-nowrap font-medium">
              {row.cargoNumber}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top whitespace-nowrap">
              {row.cargoName}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-pre-line text-xs max-w-[280px]">
              {row.cargoParams}
            </td>
            <td className="px-2 py-2 text-gray-500 align-top text-xs">
              {row.attributes || "—"}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top text-xs whitespace-nowrap">
              {row.carrier}
            </td>
            <td
              className="px-2 py-2 align-top"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-800 whitespace-nowrap">
                  {row.tripId}
                </span>
                <div className="flex flex-wrap items-center gap-0.5">
                  <button
                    type="button"
                    title="Bax"
                    className="p-1 rounded bg-sky-100 text-sky-700 hover:bg-sky-200"
                    aria-label="Bax"
                  >
                    <FaEye className="text-xs" />
                  </button>
                  <button
                    type="button"
                    title="Qrafik"
                    className="p-1 rounded bg-violet-100 text-violet-700 hover:bg-violet-200"
                    aria-label="Qrafik"
                  >
                    <FaChartBar className="text-xs" />
                  </button>
                  <button
                    type="button"
                    title="Redaktə"
                    className="p-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200"
                    aria-label="Redaktə"
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  <button
                    type="button"
                    title="Sil"
                    className="p-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    aria-label="Sil"
                  >
                    <FaMinus className="text-xs" />
                  </button>
                  <button
                    type="button"
                    title="Böl"
                    className="p-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    aria-label="Böl"
                  >
                    <FaCut className="text-xs" />
                  </button>
                </div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
