import { FaClipboard, FaEdit, FaEye, FaFileAlt, FaMinus } from "react-icons/fa";
import StatusBadge from "../../../common/components/StatusBadge";
import type { ReysRow, ReysTripStatusKind } from "../types/reys.types";

const th =
  "px-2 py-2 text-xs font-semibold text-sky-900 text-center whitespace-nowrap border-b border-sky-200 bg-sky-100";

interface Props {
  rows: ReysRow[];
}

export default function ReysTable({ rows }: Props) {
  return (
    <table className="min-w-max w-full border-collapse text-sm">
      <thead className="sticky top-0 z-10">
        <tr>
          <th className={`${th} min-w-[120px]`}>Sifariş</th>
          <th className={th}>Reys</th>
          <th className={`${th} min-w-[130px]`}>Reysin statusu</th>
          <th className={`${th} min-w-[120px]`}>Müştəri</th>
          <th className={`${th} min-w-[140px]`}>Reysin qiyməti, paylaşdırma</th>
          <th className={th}>Daşıyıcı</th>
          <th className={`${th} min-w-[160px]`}>N/v-nin №, qoşqu, sürücü</th>
          <th className={`${th} min-w-[180px]`}>Yükün adı, konteynerin №</th>
          <th className={th}>Yükləmə tarixi</th>
          <th className={th}>Göndərən</th>
          <th className={th}>Yükləmə</th>
          <th className={th}>Boşaltma tarixi</th>
          <th className={th}>Alıcı</th>
          <th className={th}>Boşaltma</th>
          <th className={`${th} min-w-[140px]`}>Teqlər</th>
          <th className={`${th} min-w-[120px]`}>Sənədlər</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            className={index % 2 === 0 ? "bg-white" : "bg-gray-50/90"}
          >
            <td className="px-2 py-2 align-top text-xs">
              <div className="font-semibold text-indigo-600 whitespace-nowrap">
                {row.orderRef}
              </div>
              <div className="text-gray-500 mt-0.5">{row.orderDate}</div>
            </td>
            <td className="px-2 py-2 align-top font-medium text-gray-900 whitespace-nowrap">
              {row.tripRef}
            </td>
            <td className="px-2 py-2 align-top text-center">
              <StatusBadge label={row.tripStatus} kind={row.tripStatusKind} />
            </td>
            <td className="px-2 py-2 text-gray-800 align-top text-xs">
              {row.customer}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top text-xs whitespace-nowrap">
              {row.tripPrice}
            </td>
            <td className="px-2 py-2 text-gray-800 align-top text-xs whitespace-nowrap">
              {row.carrier}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top text-xs">
              {row.vehicleInfo}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top text-xs max-w-[220px]">
              {row.cargoInfo}
            </td>
            <td className="px-2 py-2 text-gray-500 align-top text-xs">
              {row.loadDate || "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 align-top text-xs">
              {row.sender || "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 align-top text-xs">
              {row.loading || "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 align-top text-xs">
              {row.unloadDate || "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 align-top text-xs">
              {row.receiver || "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 align-top text-xs">
              {row.unloading || "—"}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top text-xs whitespace-pre-line max-w-[180px]">
              {row.tags || "—"}
            </td>
            <td
              className="px-2 py-2 align-top"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center gap-0.5 justify-center">
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
                  title="Bax"
                  className="p-1 rounded bg-sky-100 text-sky-800 hover:bg-sky-200"
                  aria-label="Bax"
                >
                  <FaEye className="text-xs" />
                </button>
                <button
                  type="button"
                  title="Sənəd"
                  className="p-1 rounded bg-violet-100 text-violet-800 hover:bg-violet-200"
                  aria-label="Sənəd"
                >
                  <FaFileAlt className="text-xs" />
                </button>
                <button
                  type="button"
                  title="Kopyala"
                  className="p-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                  aria-label="Kopyala"
                >
                  <FaClipboard className="text-xs" />
                </button>
                <button
                  type="button"
                  title="Sil"
                  className="p-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                  aria-label="Sil"
                >
                  <FaMinus className="text-xs" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
