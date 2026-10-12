import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import drawerStyles from "../sorgular/sorgular.module.css";
import modalStyles from "./FinanceModal.module.css";
import type { CashWallet } from "./lib/financeWallet.utils";
import {
  SYSTEM_PARTNER_MARKER,
  normalizeWallet,
} from "./lib/financeWallet.utils";

function todayInputDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toInputDate(raw?: string | Date | null): string {
  if (!raw) return todayInputDate();
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dmY = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dmY) {
    return `${dmY[3]}-${dmY[2].padStart(2, "0")}-${dmY[1].padStart(2, "0")}`;
  }
  const d = raw instanceof Date ? raw : new Date(s);
  if (Number.isNaN(d.getTime())) return todayInputDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  defaultWallet?: CashWallet;
  initialData?: any | null;
};

export default function SystemAdjustmentModal({
  isOpen,
  onClose,
  onSave,
  defaultWallet = "Kasa",
  initialData = null,
}: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AZN");
  const [paymentMethod, setPaymentMethod] = useState<string>(defaultWallet);
  const [date, setDate] = useState(todayInputDate());
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      const wallet =
        normalizeWallet(initialData.paymentMethod) || defaultWallet;
      setName(String(initialData.name || ""));
      setType(initialData.type === "EXPENSE" ? "EXPENSE" : "INCOME");
      setAmount(
        initialData.amount != null && initialData.amount !== ""
          ? String(Math.abs(Number(initialData.amount)))
          : "",
      );
      setCurrency(String(initialData.currency || "AZN").toUpperCase());
      setPaymentMethod(wallet);
      setDate(toInputDate(initialData.date || initialData.costDate));
      setNote(String(initialData.description || initialData.note || ""));
      return;
    }
    setName("");
    setType("INCOME");
    setAmount("");
    setCurrency("AZN");
    setPaymentMethod(defaultWallet);
    setDate(todayInputDate());
    setNote("");
  }, [isOpen, defaultWallet, initialData]);

  const handleSave = () => {
    const value = Number.parseFloat(String(amount).replace(",", "."));
    if (!Number.isFinite(value) || !(value > 0)) {
      alert("Məbləğ daxil edin");
      return;
    }
    if (!name.trim()) {
      alert("Əməliyyatın adını daxil edin");
      return;
    }

    const category =
      type === "INCOME"
        ? "Kassa düzəlişi — mədaxil"
        : "Kassa düzəlişi — məxaric";

    onSave({
      ...(initialData || {}),
      type,
      name: name.trim(),
      category,
      amount: value,
      currency: currency || "AZN",
      paymentMethod: paymentMethod || defaultWallet,
      partner: SYSTEM_PARTNER_MARKER,
      source: initialData?.source || "SETTINGS_BALANCE",
      description: note.trim() || name.trim(),
      costDate: date || todayInputDate(),
      date: date ? new Date(`${date}T12:00:00`) : new Date(),
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`${drawerStyles.overlay} ${isOpen ? drawerStyles.overlayOpen : ""}`}
        onClick={onClose}
      />
      <div
        className={`${drawerStyles.drawer} ${isOpen ? drawerStyles.drawerOpen : ""}`}
      >
        <div className={modalStyles.drawerHeader}>
          <div>
            <h2 className={modalStyles.drawerTitle}>
              Sistem əməliyyatını redaktə et
            </h2>
            <p className={modalStyles.drawerHint}>
              Kassa/Bank balans düzəlişi və sistem maliyyə əməliyyatının detalları
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={modalStyles.ordersCloseBtn}
            aria-label="Bağla"
          >
            <FiX />
          </button>
        </div>

        <div className={modalStyles.drawerBody}>
          <label className={modalStyles.fieldStack}>
            <span className={modalStyles.label}>Əməliyyatın adı *</span>
            <input
              className={modalStyles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Məs: Kassa ilkin balans düzəlişi"
            />
          </label>

          <div className={modalStyles.row2}>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Əməliyyat növü *</span>
              <select
                className={modalStyles.select}
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "INCOME" | "EXPENSE")
                }
              >
                <option value="INCOME">Gəlir / Mədaxil (+)</option>
                <option value="EXPENSE">Xərc / Məxaric (-)</option>
              </select>
            </label>

            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Hesab (Kasa / Bank) *</span>
              <select
                className={modalStyles.select}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Kasa">Kassam (Nağd)</option>
                <option value="Bank">Bank hesabı</option>
              </select>
            </label>
          </div>

          <div className={modalStyles.row2}>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Məbləğ *</span>
              <input
                className={modalStyles.input}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </label>

            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Valyuta</span>
              <select
                className={modalStyles.select}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="AZN">AZN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>

          <div className={modalStyles.row2}>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Tarix</span>
              <input
                className={modalStyles.input}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Tərəfdaş</span>
              <input
                className={modalStyles.input}
                value="Sistem"
                disabled
              />
            </label>
          </div>

          <label className={modalStyles.fieldStack}>
            <span className={modalStyles.label}>Qeyd / Təsvir</span>
            <textarea
              className={modalStyles.input}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Əlavə qeydlər..."
              style={{ resize: "vertical" }}
            />
          </label>
        </div>

        <div className={modalStyles.drawerFooter}>
          <button
            type="button"
            className={modalStyles.cancelBtn}
            onClick={onClose}
          >
            Ləğv et
          </button>
          <button
            type="button"
            className={modalStyles.saveBtn}
            onClick={handleSave}
          >
            Yadda saxla
          </button>
        </div>
      </div>
    </>
  );
}
