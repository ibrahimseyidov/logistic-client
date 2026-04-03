import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import type { Product } from "../types/product.types";

interface ProductsTableProps {
  products: Product[];
  onRowClick: (product: Product) => void;
  getProductCategoryLevels: (product: Product) => string[];
  formatPrice: (value?: number | null) => string;
  formatStock: (value?: number | null) => string;
  formatStockUnit: (value?: string | null) => string;
}

export default function ProductsTable({
  products,
  onRowClick,
  getProductCategoryLevels,
  formatPrice,
  formatStock,
  formatStockUnit,
}: ProductsTableProps) {
  return (
    <table className="min-w-max w-full border-collapse">
      <thead className="bg-gray-50 sticky top-0 z-10">
        <tr>
          <th className="w-16 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            ID
          </th>
          <th className="w-24 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Ürün Resmi
          </th>
          <th className="w-52 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Ürün Adı
          </th>
          <th className="w-32 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Alış
          </th>
          <th className="w-32 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Satış
          </th>
          <th className="w-36 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Barkod
          </th>
          <th className="w-32 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Filial Stoku
          </th>
          <th className="w-32 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Şirket Stoku
          </th>
          <th className="w-28 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Stok Türü
          </th>
          <th className="w-40 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Ana Kategori
          </th>
          <th className="w-40 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Alt Kategori 1
          </th>
          <th className="w-40 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Alt Kategori 2
          </th>
          <th className="w-40 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Alt Kategori 3
          </th>
          <th className="w-20 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
            Durum
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {products.map((product) => {
          const levels = getProductCategoryLevels(product);
          return (
            <tr
              key={product.id}
              onClick={() => onRowClick(product)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="w-16 px-3 py-2 text-center text-sm text-gray-700 whitespace-nowrap">
                {product.id}
              </td>
              <td className="w-24 px-3 py-2 text-center whitespace-nowrap">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded inline-block"
                  />
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="w-52 px-3 py-2 text-sm text-gray-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[208px]">
                {product.name}
              </td>
              <td className="w-32 px-3 py-2 text-sm text-green-700 font-semibold text-center whitespace-nowrap">
                {formatPrice(product.purchasePrice)}
              </td>
              <td className="w-32 px-3 py-2 text-sm text-blue-700 font-semibold text-center whitespace-nowrap">
                {formatPrice(product.salePrice)}
              </td>
              <td className="w-36 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
                {product.barcode}
              </td>
              <td className="w-32 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
                {formatStock(
                  product.branchStockQuantity ?? product.stockQuantity,
                )}
              </td>
              <td className="w-32 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
                {formatStock(
                  product.companyStockQuantity ?? product.stockQuantity,
                )}
              </td>
              <td className="w-28 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
                {formatStockUnit(product.stockUnit)}
              </td>
              <td className="w-40 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                {levels[0]}
              </td>
              <td className="w-40 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                {levels[1]}
              </td>
              <td className="w-40 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                {levels[2]}
              </td>
              <td className="w-40 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                {levels[3]}
              </td>
              <td className="w-20 px-3 py-2 text-center whitespace-nowrap">
                {product.isActive ? (
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
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
