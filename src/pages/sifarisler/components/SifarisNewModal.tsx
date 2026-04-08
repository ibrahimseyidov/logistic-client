import {
  SorgularNewModal,
  type NewSorguFormPayload,
} from "../../sorgular/components";

export type NewSifarisFormPayload = NewSorguFormPayload;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewSifarisFormPayload) => void;
}

export default function SifarisNewModal({ isOpen, onClose, onSubmit }: Props) {
  return (
    <SorgularNewModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Yeni sifariş"
      description="Sifariş məlumatlarını doldurub yaddaşa əlavə edin."
      submitLabel="Yaddaşda saxlamaq"
    />
  );
}
