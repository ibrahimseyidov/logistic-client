import React, { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";
import {
  fetchNotificationSettingsAction,
  updateNotificationSettingsAction,
  type NotificationDigestSettings,
} from "../../../common/actions/notification.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import { AyarlarToolbar } from "./AyarlarToolbar";
import ayarlarStyles from "../ayarlar.module.css";
import styles from "./NotificationSettingsSection.module.css";

type Props = {
  canEdit?: boolean;
};

export const NotificationSettingsSection: React.FC<Props> = ({
  canEdit = true,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("09:00");
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchNotificationSettingsAction();
        if (cancelled || !data) return;
        setEnabled(Boolean(data.enabled));
        setTime(data.time || "09:00");
        setLastSentAt(data.lastSentAt || null);
      } catch {
        if (!cancelled) {
          dispatch(
            showNotification({
              message: "Bildiriş ayarları yüklənmədi.",
              type: "error",
              autoCloseDuration: 3000,
            }),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const saved: NotificationDigestSettings =
        await updateNotificationSettingsAction({ enabled, time });
      setEnabled(Boolean(saved.enabled));
      setTime(saved.time || "09:00");
      setLastSentAt(saved.lastSentAt || null);
      dispatch(
        showNotification({
          message: "Bildiriş ayarları saxlanıldı.",
          type: "success",
          autoCloseDuration: 3000,
        }),
      );
    } catch {
      dispatch(
        showNotification({
          message: "Bildiriş ayarları saxlanılmadı.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const lastSentLabel = lastSentAt
    ? new Date(lastSentAt).toLocaleString("az-AZ", {
        timeZone: "Asia/Baku",
      })
    : "Hələ göndərilməyib";

  return (
    <>
      <AyarlarToolbar>
        <div className={styles.toolbarRow}>
          <div>
            <h2 className={styles.title}>Bildiriş ayarları</h2>
            <p className={styles.subtitle}>
              Hər gün Azərbaycan vaxtı ilə bütün aktiv istifadəçilərə öz
              sorğularının status xülasəsi bildiriş kimi göndərilir.
            </p>
          </div>
          {canEdit ? (
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonPrimary}`}
              onClick={() => void handleSave()}
              disabled={saving || loading}
            >
              <FiSave />
              {saving ? "Saxlanılır..." : "Saxla"}
            </button>
          ) : null}
        </div>
      </AyarlarToolbar>

      <div className={ayarlarStyles.body}>
        {loading ? (
          <p className={styles.muted}>Yüklənir...</p>
        ) : (
          <div className={styles.card}>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={enabled}
                disabled={!canEdit}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>
                <strong>Gündəlik sorğu bildirişi</strong>
                <span className={styles.hint}>
                  Aktiv olduqda seçdiyiniz saatda bütün istifadəçilərin zəng
                  ikonuna öz statistikaları düşür.
                </span>
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                Göndərmə saatı (Asia/Baku)
              </span>
              <input
                type="time"
                className={styles.input}
                value={time}
                disabled={!canEdit || !enabled}
                onChange={(e) => setTime(e.target.value || "09:00")}
              />
            </label>

            <div className={styles.infoBox}>
              <p>
                Hər istifadəçi yalnız özünə menecer/logist kimi təyin olunmuş
                sorğuların sayını görür: Yeni sorğu, Təklif Gözlənilir,
                Qiymətləndirildi, Təklif edildi.
              </p>
              <p className={styles.muted}>Son göndərilmə: {lastSentLabel}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationSettingsSection;
