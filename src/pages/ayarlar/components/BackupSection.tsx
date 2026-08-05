import React, { useCallback, useEffect, useState } from "react";
import { FiDownload, FiPlus } from "react-icons/fi";
import {
  createAndDownloadBackupAction,
  downloadBackupFileAction,
  fetchBackupListAction,
  type BackupItem,
} from "../../../common/actions/backup.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import { AyarlarToolbar } from "./AyarlarToolbar";
import ayarlarStyles from "../ayarlar.module.css";
import styles from "./BackupSection.module.css";

function formatBytes(bytes: number) {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("az-AZ", { timeZone: "Asia/Baku" });
}

type Props = {
  canView?: boolean;
};

export const BackupSection: React.FC<Props> = ({ canView = true }) => {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<BackupItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await fetchBackupListAction();
      setItems(list);
    } catch {
      dispatch(
        showNotification({
          message: "Backup siyahısı yüklənmədi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    } finally {
      setLoadingList(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!canView) return;
    void loadList();
  }, [canView, loadList]);

  const handleCreate = async () => {
    if (!canView || creating) return;
    setCreating(true);
    try {
      const list = await createAndDownloadBackupAction();
      setItems(list);
      dispatch(
        showNotification({
          message: "Backup yaradıldı və endirildi.",
          type: "success",
          autoCloseDuration: 3500,
        }),
      );
    } catch (e: any) {
      dispatch(
        showNotification({
          message: e?.message || "Backup endirilmədi.",
          type: "error",
          autoCloseDuration: 4000,
        }),
      );
      void loadList();
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    if (!canView || downloading) return;
    setDownloading(fileName);
    try {
      await downloadBackupFileAction(fileName);
      dispatch(
        showNotification({
          message: `Endirildi: ${fileName}`,
          type: "success",
          autoCloseDuration: 3000,
        }),
      );
    } catch (e: any) {
      dispatch(
        showNotification({
          message: e?.message || "Backup endirilmədi.",
          type: "error",
          autoCloseDuration: 4000,
        }),
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <AyarlarToolbar>
        <div className={styles.toolbarRow}>
          <div>
            <h2 className={styles.title}>Backup</h2>
            <p className={styles.subtitle}>
              Son 7 backup saxlanılır. Yeni backup yaradanda ZIP endirilir və
              siyahıya əlavə olunur.
            </p>
          </div>
          {canView ? (
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonPrimary}`}
              onClick={() => void handleCreate()}
              disabled={creating || loadingList}
            >
              <FiPlus />
              {creating ? "Hazırlanır..." : "Yeni backup"}
            </button>
          ) : null}
        </div>
      </AyarlarToolbar>

      <div className={ayarlarStyles.body}>
        <div className={styles.listCard}>
          <div className={styles.listHead}>
            <span>Son backup-lar</span>
            <span className={styles.badge}>{items.length}/7</span>
          </div>

          {loadingList ? (
            <p className={styles.empty}>Yüklənir...</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>
              Hələ backup yoxdur. &quot;Yeni backup&quot; düyməsinə basın.
            </p>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.fileName} className={styles.row}>
                  <div className={styles.meta}>
                    <strong className={styles.fileName}>{item.fileName}</strong>
                    <span className={styles.sub}>
                      {formatWhen(item.createdAt)} · {formatBytes(item.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
                    onClick={() => void handleDownload(item.fileName)}
                    disabled={Boolean(downloading) || creating}
                  >
                    <FiDownload />
                    {downloading === item.fileName ? "..." : "Endir"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default BackupSection;
