import { SuppliersModal } from ".";
import type { SupplierFormState } from "../types/supplier.types";

interface SuppliersEditModalProps {
  isOpen: boolean;
  form: SupplierFormState;
  onChange: (field: keyof SupplierFormState, value: string | boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  isLoading: boolean;
  deleteLoading: boolean;
  error: string | null;
}

export default function SuppliersEditModal(props: SuppliersEditModalProps) {
  return (
    <SuppliersModal
      isOpen={props.isOpen}
      title="Tedarikçi Düzenle"
      submitLabel="Güncelle"
      form={props.form}
      onChange={props.onChange}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
      onDelete={props.onDelete}
      isLoading={props.isLoading}
      deleteLoading={props.deleteLoading}
      error={props.error}
    />
  );
}
