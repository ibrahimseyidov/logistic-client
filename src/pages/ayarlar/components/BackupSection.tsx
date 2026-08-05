import React, { useMemo, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { downloadBackupZipAction } from "../../../common/actions/backup.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import { AyarlarToolbar } from "./AyarlarToolbar";
import ayarlarStyles from "../ayarlar.module.css";
import styles from "./BackupSection.module.css";

function todayStampBaku() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

type Props = {
  canView?: boolean;
};

export const BackupSection: React.FC<Props> = ({ canView = true }) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const today = useMemo(() => todayStampBaku(), []);
  const fileName = `ziyalog-backup-${today}.zip`;

  const handleDownload = async () => {
    if (!canView || loading) return;
    setLoading(true);
    try {
      await downloadBackupZipAction(fileName);
      dispatch(
        showNotification({
          message: `Backup endirildi: ${fileName}`,
          type: "success",
          autoCloseDuration: 3500,
        }),
      );
    } catch {
      dispatch(
        showNotification({
          message: "Backup endirilmədi.",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AyarlarToolbar>
        <div className={styles.toolbarRow}>
          <div>
            <h2 className={styles.title}>Backup</h2>
            <p className={styles.subtitle}>
              Verilənlər bazasının JSON ehtiyat nüsxəsini bu günün tarixi ilə
              ZIP formatında endirin.
            </p>
          </div>
          {canView ? (
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonPrimary}`}
              onClick={() => void handleDownload()}
              disabled={loading}
            >
              <FiDownload />
              {loading ? "Hazırlanır..." : "Backup endir"}
            </button>
          ) : null}
        </div>
      </AyarlarToolbar>

      <div className={ayarlarStyles.body}>
        <div className={styles.card}>
          <p className={styles.fileLabel}>Fayl adı</p>
          <p className={styles.fileName}>{fileName}</p>
          <p className={styles.hint}>
            Sorğular, sifarişlər, müştərilər, daşıyıcılar, maliyyə və digər
            əsas cədvəllər daxil edilir. Şifrələr backup-da gizlədilir.
          </p>
        </div>
      </div>
    </>
  );
};

export default BackupSection;
