import React from "react";
import { useAppDispatch, useAppSelector } from "../../../common/store/hooks";
import {
  hideDeleteModal,
  setDeleteModalLoading,
  setDeleteModalError,
  showNotification,
} from "../../../common/store/productModalSlice";
import { deleteProduct } from "../../../common/actions/products.actions";

interface ProductDeleteModalProps {
  companyId?: number;
  onDeleted?: () => void;
}

const ProductDeleteModal: React.FC<ProductDeleteModalProps> = ({
  companyId,
  onDeleted,
}) => {
  const dispatch = useAppDispatch();
  const { open, productId, productName, isLoading, error } = useAppSelector(
    (state) => state.productModal.delete,
  );

  const handleClose = () => {
    if (isLoading) return;
    dispatch(hideDeleteModal());
    dispatch(setDeleteModalError(null));
  };

  const handleConfirm = async () => {
    if (!companyId || !productId) return;
    dispatch(setDeleteModalLoading(true));
    dispatch(setDeleteModalError(null));
    try {
      await deleteProduct(productId, companyId);
      dispatch(hideDeleteModal());
      dispatch(
        showNotification({
          message: `"${productName}" başarıyla silindi!`,
          type: "success",
        }),
      );
      if (onDeleted) onDeleted();
    } catch (err: any) {
      dispatch(setDeleteModalError(err?.message || "Ürün silinemedi"));
    } finally {
      dispatch(setDeleteModalLoading(false));
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md animate-fadeIn">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Ürünü Sil</h2>
          <p className="mb-4">{`"${productName}" ürününü silmek istediğinize emin misiniz?`}</p>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <div className="flex justify-end gap-2 mt-6">
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
              onClick={handleClose}
              disabled={isLoading}
            >
              İptal
            </button>
            <button
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Siliniyor..." : "Sil"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDeleteModal;
