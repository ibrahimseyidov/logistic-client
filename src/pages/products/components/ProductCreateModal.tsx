import { ProductModal } from ".";
import type { Category } from "../types/category.types";
import type { ProductFormState } from "../types/form.types";

interface ProductCreateModalProps {
  isOpen: boolean;
  form: ProductFormState;
  level1Categories: Category[];
  level2Categories: Category[];
  level3Categories: Category[];
  level4Categories: Category[];
  onChange: (field: keyof ProductFormState, value: string | boolean) => void;
  onLevel1Change: (value: string) => void;
  onLevel2Change: (value: string) => void;
  onLevel3Change: (value: string) => void;
  onLevel4Change: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function ProductCreateModal(props: ProductCreateModalProps) {
  return (
    <ProductModal
      isOpen={props.isOpen}
      title="Ürün Oluştur"
      submitLabel="Kaydet"
      form={props.form}
      level1Categories={props.level1Categories}
      level2Categories={props.level2Categories}
      level3Categories={props.level3Categories}
      level4Categories={props.level4Categories}
      onChange={props.onChange}
      onLevel1Change={props.onLevel1Change}
      onLevel2Change={props.onLevel2Change}
      onLevel3Change={props.onLevel3Change}
      onLevel4Change={props.onLevel4Change}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
      isLoading={props.isLoading}
      error={props.error}
    />
  );
}
