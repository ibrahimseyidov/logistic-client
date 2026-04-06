import { SuppliersModal } from ".";
import type { SupplierFormState } from "../types/supplier.types";

interface SuppliersCreateModalProps {
  isOpen: boolean;
  form: SupplierFormState;
  onChange: (field: keyof SupplierFormState, value: string | boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function SuppliersCreateModal(props: SuppliersCreateModalProps) {
  return (
    <SuppliersModal
      isOpen={props.isOpen}
      title="Tedarikçi Oluştur"
      submitLabel="Kaydet"
      form={props.form}
      onChange={props.onChange}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
      isLoading={props.isLoading}
      error={props.error}
    />
  );
}
