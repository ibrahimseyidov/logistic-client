import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import {
  createLookupAction,
  fetchLookupAction,
} from "../../common/actions/lookup.actions";
import drawerStyles from "../sorgular/sorgular.module.css";
import modalStyles from "./FinanceModal.module.css";
import type { CashWallet } from "./lib/financeWallet.utils";
import { normalizeWallet } from "./lib/financeWallet.utils";

const EXPENSE_CATEGORY_LOOKUP = "expense-categories";
const DEFAULT_CATEGORY = "Ümumi xərc";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  defaultWallet?: CashWallet;
  initialData?: any | null;
  /** Əməliyyatlardan gələn əlavə kateqoriyalar */
  knownCategories?: string[];
};

export default function SimpleExpenseModal({
  isOpen,
  onClose,
  onSave,
  defaultWallet = "Kasa",
  initialData = null,
  knownCategories = [],
}: Props) {
  const isEdit = Boolean(initialData?.id);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AZN");
  const [paymentMethod, setPaymentMethod] = useState<string>(defaultWallet);
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<string[]>([DEFAULT_CATEGORY]);
  const [addOpen, setAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);

  const loadCategories = async () => {
    try {
      const rows = await fetchLookupAction(EXPENSE_CATEGORY_LOOKUP);
      const fromApi = rows
        .map((r) => String(r.label || r.value || "").trim())
        .filter(Boolean);
      const merged = [
        ...new Set([...fromApi, ...knownCategories.map((c) => c.trim()).filter(Boolean)]),
      ].sort((a, b) => a.localeCompare(b, "az"));
      setCategories(merged.length > 0 ? merged : [DEFAULT_CATEGORY]);
    } catch {
      const merged = [
        ...new Set([DEFAULT_CATEGORY, ...knownCategories.map((c) => c.trim()).filter(Boolean)]),
      ];
      setCategories(merged);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void loadCategories();
  }, [isOpen, knownCategories]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      const wallet =
        normalizeWallet(initialData.paymentMethod) || defaultWallet;
      setName(String(initialData.name || ""));
      const cat = String(initialData.category || DEFAULT_CATEGORY).trim();
      setCategory(cat || DEFAULT_CATEGORY);
      setAmount(
        initialData.amount != null && initialData.amount !== ""
          ? String(Math.abs(Number(initialData.amount) || 0))
          : "",
      );
      setCurrency(String(initialData.currency || "AZN").toUpperCase());
      setPaymentMethod(wallet);
      const partner = String(initialData.partner || "").trim();
      setNote(
        partner && partner !== DEFAULT_CATEGORY && partner !== "__SYSTEM__"
          ? partner
          : "",
      );
      return;
    }
    setName("");
    setCategory(DEFAULT_CATEGORY);
    setAmount("");
    setCurrency("AZN");
    setPaymentMethod(defaultWallet);
    setNote("");
    setAddOpen(false);
    setNewCategory("");
  }, [isOpen, defaultWallet, initialData]);

  const categoryOptions = useMemo(() => {
    const list = [...categories];
    if (category && !list.includes(category)) list.unshift(category);
    return list;
  }, [categories, category]);

  const handleAddCategory = async () => {
    const label = newCategory.trim();
    if (!label) {
      alert("Kateqoriya adı daxil edin");
      return;
    }
    if (categories.some((c) => c.toLowerCase() === label.toLowerCase())) {
      setCategory(label);
      setAddOpen(false);
      setNewCategory("");
      return;
    }
    setAdding(true);
    try {
      await createLookupAction(EXPENSE_CATEGORY_LOOKUP, {
        value: label,
        label,
      });
      setCategories((prev) =>
        [...prev, label].sort((a, b) => a.localeCompare(b, "az")),
      );
      setCategory(label);
      setAddOpen(false);
      setNewCategory("");
    } catch {
      alert("Kateqoriya əlavə edilərkən xəta baş verdi");
    } finally {
      setAdding(false);
    }
  };

  const handleSave = () => {
    const value = Number.parseFloat(String(amount).replace(",", "."));
    if (!Number.isFinite(value) || !(value > 0)) {
      alert("Məbləğ daxil edin");
      return;
    }
    if (!name.trim()) {
      alert("Xərcin adını daxil edin");
      return;
    }
    if (!category.trim()) {
      alert("Kateqoriya seçin");
      return;
    }

    onSave({
      type: "EXPENSE",
      name: name.trim(),
      category: category.trim() || DEFAULT_CATEGORY,
      amount: value,
      currency: currency || "AZN",
      paymentMethod: paymentMethod || defaultWallet,
      partner: note.trim() || DEFAULT_CATEGORY,
      customerId: null,
      carrierId: null,
      orderId: null,
    });
  };

  return (
    <>
      <div
        className={`${drawerStyles.overlay} ${isOpen ? drawerStyles.overlayOpen : ""}`}
      />
      <div
        className={`${drawerStyles.drawer} ${isOpen ? drawerStyles.drawerOpen : ""}`}
      >
        <div className={modalStyles.drawerHeader}>
          <div>
            <h2 className={modalStyles.drawerTitle}>
              {isEdit ? "Xərci redaktə et" : "Birbaşa xərc"}
            </h2>
            <p className={modalStyles.drawerHint}>
              Müştəri və ya daşıyıcı seçmədən kasa/bank xərcini yazın
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={modalStyles.ordersCloseBtn}
          >
            <FiX />
          </button>
        </div>

        <div className={modalStyles.drawerBody}>
          <label className={modalStyles.fieldStack}>
            <span className={modalStyles.label}>Xərcin adı *</span>
            <input
              className={modalStyles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Məs: Ofis kirayəsi, yanacaq, vergi..."
            />
          </label>

          <div className={modalStyles.row2}>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Kateqoriya *</span>
              <div style={{ display: "flex", gap: "0.45rem", alignItems: "stretch" }}>
                <select
                  className={modalStyles.select}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  title="Yeni kateqoriya"
                  onClick={() => {
                    setNewCategory("");
                    setAddOpen(true);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#0f172a",
                    borderRadius: "0.5rem",
                    padding: "0 0.75rem",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <FiPlus size={14} />
                  Yeni
                </button>
              </div>
            </label>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Kasa / Bank</span>
              <select
                className={modalStyles.select}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Kasa">Öz kasa</option>
                <option value="Bank">Bank hesabı</option>
              </select>
            </label>
          </div>

          <div className={modalStyles.row2}>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Məbləğ *</span>
              <input
                className={modalStyles.input}
                type="number"
                min="0"
                step="0.01"
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
                <option value="TRY">TRY</option>
              </select>
            </label>
          </div>

          <label className={modalStyles.fieldStack}>
            <span className={modalStyles.label}>Qeyd (ixtiyari)</span>
            <input
              className={modalStyles.input}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Kimə / nə üçün — tərəfdaş kimi görünəcək"
            />
          </label>
        </div>

        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            background: "#ffffff",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <button
            type="button"
            className={modalStyles.footerBtnSecondary}
            onClick={onClose}
          >
            Ləğv et
          </button>
          <button
            type="button"
            className={modalStyles.footerBtnPrimary}
            onClick={handleSave}
            style={{ background: "#b91c1c" }}
          >
            {isEdit ? "Yadda saxla" : "Xərci saxla"}
          </button>
        </div>
      </div>

      {addOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.35)",
            }}
            onClick={() => !adding && setAddOpen(false)}
          />
          <div
            style={{
              position: "relative",
              width: "90%",
              maxWidth: 400,
              background: "#fff",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
              padding: "1.15rem 1.25rem",
              zIndex: 1,
            }}
          >
            <h3
              style={{
                margin: "0 0 0.35rem",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Yeni kateqoriya
            </h3>
            <p
              style={{
                margin: "0 0 0.9rem",
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              Əlavə olunan kateqoriya siyahıda seçilə bilər
            </p>
            <input
              className={modalStyles.input}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Məs: Kirayə, reklam..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAddCategory();
                }
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.55rem",
                marginTop: "1rem",
              }}
            >
              <button
                type="button"
                className={modalStyles.footerBtnSecondary}
                disabled={adding}
                onClick={() => setAddOpen(false)}
              >
                Ləğv et
              </button>
              <button
                type="button"
                className={modalStyles.footerBtnPrimary}
                disabled={adding}
                onClick={() => void handleAddCategory()}
              >
                {adding ? "Əlavə olunur..." : "Əlavə et"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
