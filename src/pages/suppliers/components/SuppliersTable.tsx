import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import type { Supplier } from "../types/supplier.types";

interface SuppliersTableProps {
  suppliers: Supplier[];
  onRowClick: (supplier: Supplier) => void;
  onAddPayment: (supplier: Supplier) => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("tr-TR");
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);

const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
  onRowClick,
  onAddPayment,
}) => (
  <table className="min-w-max w-full border-collapse">
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        <th className="w-16 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          ID
        </th>
        <th className="w-52 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          Tedarikçi Adı
        </th>
        <th className="w-44 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          Yetkili Kişi
        </th>
        <th className="w-36 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          Telefon
        </th>
        <th className="w-56 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          E-posta
        </th>
        <th className="w-64 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          Adres
        </th>
        <th className="w-40 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          Vergi No
        </th>
        <th className="w-20 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          Durum
        </th>
        <th className="w-28 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          Oluşturma
        </th>
        <th className="w-28 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          Güncelleme
        </th>
        <th className="w-32 px-3 py-2 text-xs font-semibold text-blue-700 text-center whitespace-nowrap border-b border-gray-200 bg-blue-50">
          Alış (₺)
        </th>
        <th className="w-32 px-3 py-2 text-xs font-semibold text-amber-700 text-center whitespace-nowrap border-b border-gray-200 bg-amber-50">
          İade (₺)
        </th>
        <th className="w-32 px-3 py-2 text-xs font-semibold text-emerald-700 text-center whitespace-nowrap border-b border-gray-200 bg-emerald-50">
          Medaxil (₺)
        </th>
        <th className="w-32 px-3 py-2 text-xs font-semibold text-violet-700 text-center whitespace-nowrap border-b border-gray-200 bg-violet-50">
          Mexaric (₺)
        </th>
        <th className="w-32 px-3 py-2 text-xs font-semibold text-red-600 text-center whitespace-nowrap border-b border-gray-200 bg-red-50">
          Borç (₺)
        </th>
        <th className="w-32 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
          İşlemler
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100 bg-white">
      {suppliers.map((supplier) => (
        <tr
          key={supplier.id}
          onClick={() => onRowClick(supplier)}
          className="hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <td className="w-16 px-3 py-2 text-center text-sm text-gray-700 whitespace-nowrap">
            {supplier.id}
          </td>
          <td className="w-52 px-3 py-2 text-sm text-gray-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[208px]">
            {supplier.name}
          </td>
          <td className="w-44 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[176px]">
            {supplier.contactPerson || "-"}
          </td>
          <td className="w-36 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
            {supplier.phone || "-"}
          </td>
          <td className="w-56 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[224px]">
            {supplier.email || "-"}
          </td>
          <td className="w-64 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[256px]">
            {supplier.address || "-"}
          </td>
          <td className="w-40 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
            {supplier.taxNumber || "-"}
          </td>
          <td className="w-20 px-3 py-2 text-center whitespace-nowrap">
            {supplier.status === "active" ? (
              <FaCheckCircle
                className="text-green-500 text-lg inline-block align-middle"
                title="Aktif"
                aria-label="Aktif"
              />
            ) : (
              <FaTimesCircle
                className="text-red-400 text-lg inline-block align-middle"
                title="Pasif"
                aria-label="Pasif"
              />
            )}
          </td>
          <td className="w-28 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
            {formatDate(supplier.createdAt)}
          </td>
          <td className="w-28 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
            {formatDate(supplier.updatedAt)}
          </td>
          <td className="w-32 px-3 py-2 text-sm font-medium text-blue-700 text-center whitespace-nowrap bg-blue-50/30">
            {formatCurrency(supplier.totalPurchase ?? 0)}
          </td>
          <td className="w-32 px-3 py-2 text-sm font-medium text-amber-700 text-center whitespace-nowrap bg-amber-50/30">
            {formatCurrency(supplier.totalReturn ?? 0)}
          </td>
          <td className="w-32 px-3 py-2 text-sm font-medium text-emerald-700 text-center whitespace-nowrap bg-emerald-50/30">
            {formatCurrency(supplier.totalMedaxil ?? 0)}
          </td>
          <td className="w-32 px-3 py-2 text-sm font-medium text-violet-700 text-center whitespace-nowrap bg-violet-50/30">
            {formatCurrency(supplier.totalMexaric ?? 0)}
          </td>
          <td className="w-32 px-3 py-2 text-sm font-semibold text-center whitespace-nowrap bg-red-50/30">
            <span
              className={
                (supplier.totalPurchase ?? 0) -
                  (supplier.totalReturn ?? 0) -
                  (supplier.totalPayment ?? 0) -
                  (supplier.totalMexaric ?? 0) +
                  (supplier.totalMedaxil ?? 0) >
                0
                  ? "text-red-600"
                  : "text-gray-500"
              }
            >
              {formatCurrency(
                (supplier.totalPurchase ?? 0) -
                  (supplier.totalReturn ?? 0) -
                  (supplier.totalPayment ?? 0) -
                  (supplier.totalMexaric ?? 0) +
                  (supplier.totalMedaxil ?? 0),
              )}
            </span>
          </td>
          <td
            className="w-32 px-3 py-2 text-center whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => onAddPayment(supplier)}
                title="Ödeme Ekle"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors"
              >
                Ödeme +
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default SuppliersTable;
