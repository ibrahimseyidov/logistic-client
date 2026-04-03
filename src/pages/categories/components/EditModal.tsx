import React from "react";

interface EditModalProps {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
          aria-label="Kapat"
          disabled={isLoading}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">Kategori Düzenle</h2>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Kategori adı"
          disabled={isLoading}
        />
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-4 py-2"
            onClick={onClose}
            disabled={isLoading}
          >
            İptal
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
            onClick={onSubmit}
            disabled={isLoading || !value.trim()}
          >
            {isLoading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
