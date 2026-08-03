import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFinanceTransactionAction,
  fetchFinanceTransactionsAction,
} from "../../../common/actions/finance.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import { useAuth } from "../../../common/contexts/AuthContext";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import {
  type CashWallet,
  SYSTEM_PARTNER_MARKER,
  isIncomeTx,
  resolveTxCashAzn,
  txMatchesWallet,
} from "../../maliyye/lib/financeWallet.utils";
import ayarlarStyles from "../ayarlar.module.css";
import { AyarlarToolbar } from "./AyarlarToolbar";
import styles from "./CashSettingsSection.module.css";

function calcWalletBalance(txs: any[], wallet: CashWallet) {
  let totalIn = 0;
  let totalOut = 0;
  txs.filter((tx) => txMatchesWallet(tx, wallet)).forEach((tx) => {
    const azn = resolveTxCashAzn(tx);
    if (!(azn > 0)) return;
    if (isIncomeTx(tx)) totalIn += azn;
    else totalOut += azn;
  });
  return {
    totalIn,
    totalOut,
    balance: totalIn - totalOut,
  };
}

function fmtAzn(n: number) {
  return n.toLocaleString("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type WalletCardProps = {
  wallet: CashWallet;
  label: string;
  txs: any[];
  onAdjusted: () => void;
  canEdit?: boolean;
};

const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  label,
  txs,
  onAdjusted,
  canEdit = true,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const stats = useMemo(() => calcWalletBalance(txs, wallet), [txs, wallet]);
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTarget(stats.balance.toFixed(2));
  }, [stats.balance]);

  const targetNum = Number.parseFloat(String(target).replace(",", "."));
  const delta =
    Number.isFinite(targetNum) ? targetNum - stats.balance : NaN;
  const absDelta = Number.isFinite(delta) ? Math.abs(delta) : 0;

  const handleApply = async () => {
    if (!Number.isFinite(targetNum)) {
      dispatch(
        showNotification({
          message: "Düzgün məbləğ daxil edin",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
      return;
    }
    if (!(absDelta > 0.009)) {
      dispatch(
        showNotification({
          message: "Balans artıq bu məbləğdədir — dəyişiklik yoxdur",
          type: "info",
          autoCloseDuration: 3000,
        }),
      );
      return;
    }

    const isIn = delta > 0;
    const amount = Number(absDelta.toFixed(2));
    const place = wallet === "Kasa" ? "Kassaya" : "Bank hesabına";
    const placeOut = wallet === "Kasa" ? "Kassadan" : "Bank hesabından";

    const name = isIn
      ? `${place} ${fmtAzn(amount)} AZN daxil edildi (balans düzəlişi)`
      : `${placeOut} ${fmtAzn(amount)} AZN çıxış edildi (balans düzəlişi)`;

    const category = isIn ? "Kassa düzəlişi — mədaxil" : "Kassa düzəlişi — məxaric";

    setSaving(true);
    try {
      await createFinanceTransactionAction({
        type: isIn ? "INCOME" : "EXPENSE",
        paymentMethod: wallet,
        amount,
        currency: "AZN",
        name,
        category,
        partner: SYSTEM_PARTNER_MARKER,
        user: user?.name || "Admin",
        costDate: new Date().toLocaleDateString("az-AZ"),
        invoiceWritten: false,
        invoiceReceived: false,
      });
      dispatch(
        showNotification({
          message: isIn
            ? `${place} ${fmtAzn(amount)} AZN daxil edildi`
            : `${placeOut} ${fmtAzn(amount)} AZN çıxış edildi`,
          type: "success",
          autoCloseDuration: 3500,
        }),
      );
      onAdjusted();
    } catch {
      dispatch(
        showNotification({
          message: "Balans yenilənərkən xəta baş verdi",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>{label}</h3>
        <span
          className={styles.balancePill}
          style={{
            color: stats.balance < 0 ? "#b91c1c" : "#15803d",
            background: stats.balance < 0 ? "#fef2f2" : "#ecfdf5",
            borderColor: stats.balance < 0 ? "#fecaca" : "#bbf7d0",
          }}
        >
          Cari: {fmtAzn(stats.balance)} AZN
        </span>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Girən</span>
          <strong className={styles.statIn}>{fmtAzn(stats.totalIn)} AZN</strong>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Çıxan</span>
          <strong className={styles.statOut}>{fmtAzn(stats.totalOut)} AZN</strong>
        </div>
      </div>

      {canEdit ? (
        <>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Yeni balans (AZN)</span>
            <input
              type="number"
              step="0.01"
              className={styles.input}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="məs. 100"
            />
          </label>

          {Number.isFinite(delta) && absDelta > 0.009 ? (
            <p className={styles.hint}>
              {delta > 0
                ? `Tətbiq ediləndə: ${wallet === "Kasa" ? "Kassaya" : "Bank hesabına"} ${fmtAzn(absDelta)} AZN daxil ediləcək.`
                : `Tətbiq ediləndə: ${wallet === "Kasa" ? "Kassadan" : "Bank hesabından"} ${fmtAzn(absDelta)} AZN çıxış yazılacaq.`}
            </p>
          ) : (
            <p className={styles.hintMuted}>
              İstədiyiniz balansı yazın — sistem fərqi avtomatik gəlir/xərc kimi qeyd edəcək.
            </p>
          )}

          <button
            type="button"
            className={styles.applyBtn}
            onClick={() => void handleApply()}
            disabled={saving || !Number.isFinite(targetNum)}
          >
            {saving ? "Saxlanılır..." : "Balansı tətbiq et"}
          </button>
        </>
      ) : (
        <p className={styles.hintMuted}>Yalnız baxış — balans dəyişdirmə icazəsi yoxdur.</p>
      )}
    </div>
  );
};

export const CashSettingsSection: React.FC<{ canEdit?: boolean }> = ({
  canEdit = true,
}) => {
  const dispatch = useAppDispatch();
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFinanceTransactionsAction();
      setTxs(Array.isArray(data) ? data : []);
    } catch {
      dispatch(
        showNotification({
          message: "Maliyyə məlumatları yüklənə bilmədi",
          type: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <AyarlarToolbar>
        <div className={actionStyles.wrapper}>
          <div className={actionStyles.group}>
            <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
              Kassa / Bank balansı
            </span>
          </div>
          <div className={actionStyles.group}>
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
              onClick={() => void load()}
            >
              Yenilə
            </button>
          </div>
        </div>
      </AyarlarToolbar>

      <div className={ayarlarStyles.body}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
            Yüklənir...
          </div>
        ) : (
          <div className={styles.grid}>
            <WalletCard
              wallet="Kasa"
              label="Kassa"
              txs={txs}
              onAdjusted={load}
              canEdit={canEdit}
            />
            <WalletCard
              wallet="Bank"
              label="Bank"
              txs={txs}
              onAdjusted={load}
              canEdit={canEdit}
            />
          </div>
        )}
      </div>
    </>
  );
};
