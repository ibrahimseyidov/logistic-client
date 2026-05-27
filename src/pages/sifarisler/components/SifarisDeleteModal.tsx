import { FiAlertTriangle, FiX } from "react-icons/fi";
import styles from "../../sorgular/components/SorgularNewModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderNumber: string;
}

export default function SifarisDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.nestedRoot}>
      <div className={styles.nestedBackdrop} onClick={onClose} />
      <div
        className={styles.nestedCard}
        style={{
          width: "min(100%, 28rem)",
          borderRadius: "1.25rem",
          overflow: "hidden",
          border: "1px solid #fee2e2",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          className={styles.nestedHeader}
          style={{
            background: "#fef2f2",
            borderBottom: "1px solid #fee2e2",
            padding: "1.25rem 1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                display: "flex",
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "999px",
                background: "#fee2e2",
                color: "#dc2626",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiAlertTriangle style={{ fontSize: "1.2rem" }} />
            </div>
            <h3 className={styles.nestedTitle} style={{ color: "#991b1b" }}>
              Sifarişi sil
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: "1.25rem",
              color: "#991b1b",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Bağla"
          >
            <FiX />
          </button>
        </div>

        <div className={styles.nestedBody} style={{ padding: "1.5rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.925rem",
              color: "#4b5563",
              lineHeight: "1.5rem",
            }}
          >
            <strong>{orderNumber}</strong> nömrəli sifarişi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz və bütün əlaqəli məlumatlar itəcəkdir.
          </p>
        </div>

        <div
          className={styles.nestedFooter}
          style={{
            background: "#f9fafb",
            borderTop: "1px solid #e5e7eb",
            padding: "1rem 1.5rem",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className={styles.secondaryButton}
            style={{
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              border: "1px solid #dc2626",
              background: "#dc2626",
              color: "#ffffff",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}
