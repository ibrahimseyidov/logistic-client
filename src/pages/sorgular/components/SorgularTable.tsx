import { Link } from "react-router-dom";
import { FaCheck, FaClipboard, FaMinus } from "react-icons/fa";
import StatusBadge from "../../../common/components/StatusBadge";
import type { LogisticQueryRow } from "../types/sorgu.types";

const th =
  "px-2 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200 bg-gray-100";

interface Props {
  rows: LogisticQueryRow[];
}

function formatCreated(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SorgularTable({ rows }: Props) {
  return (
    <table className="min-w-max w-full border-collapse text-sm">
      <thead className="sticky top-0 z-10">
        <tr>
          <th className={th}>Sorğunun nömrəsi</th>
          <th className={th}>Sorğunun statusu</th>
          <th className={th}>Sorğunun məqsədi</th>
          <th className={th}>Yaradıldı</th>
          <th className={th}>Nəqliyyatın tipi</th>
          <th className={`${th} min-w-[180px]`}>Yük haqqında məlumat</th>
          <th className={th}>Göndərən</th>
          <th className={th}>Yükləmə yeri</th>
          <th className={th}>Alıcı</th>
          <th className={th}>Boşaltma yeri</th>
          <th className={th}>Yükləmə tarixi</th>
          <th className={th}>Boşaltma tarixi</th>
          <th className={th}>Müştəri</th>
          <th className={th}>Şirkət</th>
          <th className={th}>Satıcı</th>
          <th className={`${th} min-w-[140px]`}>Qiymət təklifləri</th>
          <th className={th}>Əməliyyatlar</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            className={index % 2 === 0 ? "bg-white" : "bg-gray-50/80"}
          >
            <td className="px-2 py-2 whitespace-nowrap align-top">
              <Link
                to={`/sorgular/${encodeURIComponent(row.number)}`}
                className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {row.number}
              </Link>
            </td>
            <td className="px-2 py-2 whitespace-nowrap align-top">
              <StatusBadge label={row.status} />
            </td>
            <td className="px-2 py-2 text-gray-700 whitespace-nowrap align-top">
              {row.purpose}
            </td>
            <td className="px-2 py-2 text-gray-600 whitespace-nowrap align-top">
              {formatCreated(row.createdAt)}
            </td>
            <td className="px-2 py-2 text-center whitespace-nowrap align-top">
              {row.transportType}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-pre-line text-xs max-w-[220px]">
              {row.cargoInfo}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top max-w-[120px]">
              {row.sender}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-nowrap">
              {row.loadPlace}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top max-w-[120px]">
              {row.recipient}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-nowrap">
              {row.unloadPlace}
            </td>
            <td className="px-2 py-2 text-gray-600 whitespace-nowrap align-top">
              {row.loadDate}
            </td>
            <td className="px-2 py-2 text-gray-600 whitespace-nowrap align-top">
              {row.unloadDate}
            </td>
            <td className="px-2 py-2 text-gray-700 align-top max-w-[140px]">
              {row.customer}
            </td>
            <td className="px-2 py-2 text-gray-700 whitespace-nowrap align-top">
              {row.company}
            </td>
            <td className="px-2 py-2 text-gray-600 align-top">{row.seller}</td>
            <td className="px-2 py-2 text-gray-700 align-top whitespace-pre-line text-xs">
              {row.priceOffers}
            </td>
            <td
              className="px-2 py-2 align-top"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  title="Təsdiq / uğur"
                  className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  aria-label="Təsdiq"
                >
                  <FaCheck className="text-sm" />
                </button>
                <button
                  type="button"
                  title="Detallar"
                  className="p-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  aria-label="Detallar"
                >
                  <FaClipboard className="text-sm" />
                </button>
                <button
                  type="button"
                  title="Sil / ləğv"
                  className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  aria-label="Sil"
                >
                  <FaMinus className="text-sm" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
