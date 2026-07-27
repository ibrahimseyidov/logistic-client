import { useState, useEffect, useMemo } from "react";
import { FiList, FiX } from "react-icons/fi";
import drawerStyles from "../sorgular/sorgular.module.css";
import modalStyles from "./FinanceModal.module.css";
import { fetchCustomersAction } from "../../common/actions/customer.actions";
import { fetchCarriersAction } from "../../common/actions/carrier.actions";
import { fetchOrdersAction } from "../../common/actions/order.actions";
import { fetchFinanceTransactionsAction } from "../../common/actions/finance.actions";
import {
  resolveFinanceExpenseAzn,
  resolveFinanceRevenueAzn,
  resolveVoyageExpenseAzn,
} from "../../common/utils/currency.utils";
import type { CashWallet } from "./lib/financeWallet.utils";
import {
  isCashMovementTx,
  isIncomeTx,
  isOrderBookkeepingTx,
  resolveTxCashAzn,
} from "./lib/financeWallet.utils";
import {
  entityLabel,
  fold,
  namesMatch,
  orderMatchesCarrier,
  orderMatchesCustomer,
} from "./lib/financePartner.utils";

type PartnerKind = "customer" | "carrier";

type OrderDebtInfo = {
  orderId: number;
  orderNumber: string;
  owedAzn: number;
  paidAzn: number;
  remainingAzn: number;
};

function asList(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const anyData = data as any;
    if (Array.isArray(anyData.items)) return anyData.items;
    if (Array.isArray(anyData.data)) return anyData.data;
  }
  return [];
}

function calcOrderDebt(
  order: any,
  kind: PartnerKind,
  financeTxs: any[],
  partnerId?: string | number | null,
  partnerName?: string | null,
): { owedAzn: number; paidAzn: number; remainingAzn: number } {
  const oid = String(order?.id ?? "");
  const pid = partnerId != null && partnerId !== "" ? String(partnerId) : null;
  const pname = String(partnerName || "").trim();
  let owedAzn = 0;
  let paidAzn = 0;

  financeTxs.forEach((tx) => {
    if (String(tx.orderId) !== oid) return;

    if (isOrderBookkeepingTx(tx)) {
      if (kind === "customer") {
        if (pid && tx.customerId != null && String(tx.customerId) !== pid) {
          return;
        }
        owedAzn += resolveFinanceRevenueAzn(tx);
        return;
      }

      // --- Daşıyıcı borcu (məsarif) ---
      const exp = resolveFinanceExpenseAzn(tx);
      if (!(exp > 0)) return;

      const txName = String(tx.name || "").trim();
      const isReys = /^Reys R-/i.test(txName);
      const isBaslangic = fold(txName) === fold("Başlanğıc tarif");
      const txCarrierId =
        tx.carrierId != null
          ? String(tx.carrierId)
          : tx.carrier?.id != null
            ? String(tx.carrier.id)
            : null;

      // Başqa daşıyıcıya bağlı sətir
      if (pid && txCarrierId && txCarrierId !== pid) return;

      // Birbaşa bu daşıyıcıya bağlı
      if (pid && txCarrierId === pid) {
        owedAzn += exp;
        return;
      }

      const partnerOk =
        Boolean(pname) &&
        (namesMatch(tx.partner, pname) ||
          namesMatch(tx.carrier?.name, pname) ||
          namesMatch(entityLabel(tx.carrier), pname));

      // Reys / partner adı bu daşıyıcıya uyğun
      if (partnerOk) {
        owedAzn += exp;
        return;
      }

      // carrierId yoxdur: sifariş artıq bu daşıyıcıya filter olunub —
      // Başlanğıc tarif alış və ya adsız reys məsarifi = daşıyıcı borcu
      if (!txCarrierId && (isBaslangic || isReys)) {
        owedAzn += exp;
      }
      return;
    }

    if (!isCashMovementTx(tx)) return;
    const azn = resolveTxCashAzn(tx);
    if (!(azn > 0)) return;

    if (kind === "customer" && isIncomeTx(tx)) {
      if (pid) {
        if (tx.customerId == null || String(tx.customerId) !== pid) return;
      } else if (pname && !namesMatch(tx.partner, pname)) {
        return;
      }
      paidAzn += azn;
    }

    if (kind === "carrier" && !isIncomeTx(tx)) {
      if (pid) {
        // carrierId varsa uyğun olmalı; yoxdursa partner adı ilə
        if (tx.carrierId != null) {
          if (String(tx.carrierId) !== pid) return;
        } else if (pname) {
          if (!namesMatch(tx.partner, pname)) return;
        } else {
          return;
        }
      } else if (pname) {
        if (!namesMatch(tx.partner, pname)) return;
      } else {
        return;
      }
      paidAzn += azn;
    }
  });

  // Maliyyədə məsarif yoxdursa — reys qiymətindən borc (valueAzn / tripPrice)
  if (kind === "carrier" && !(owedAzn > 0) && Array.isArray(order?.voyages)) {
    for (const v of order.voyages) {
      if (pname) {
        const vc = String(v?.carrier || "").trim();
        if (vc && vc !== "—" && !namesMatch(vc, pname)) continue;
      }
      owedAzn += resolveVoyageExpenseAzn(v);
    }
  }

  return {
    owedAzn,
    paidAzn,
    remainingAzn: Math.max(0, owedAzn - paidAzn),
  };
}

/** Sifariş status etiketi — borc yoxdursa «ödənilib» demə */
function orderDebtStatusLabel(r: {
  owedAzn: number;
  paidAzn: number;
  remainingAzn: number;
}): string {
  if (!(r.owedAzn > 0)) {
    if (r.paidAzn > 0) return ` — ödəniş ${r.paidAzn.toFixed(2)} AZN`;
    return " — borc yoxdur";
  }
  if (r.remainingAzn > 0) {
    return ` — qalıq ${r.remainingAzn.toFixed(2)} AZN`;
  }
  return " — ödənilib";
}

function PartnerOrdersModal({
  open,
  onClose,
  title,
  rows,
  onPickOrder,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: OrderDebtInfo[];
  onPickOrder: (orderId: string) => void;
}) {
  if (!open) return null;

  const totals = rows.reduce(
    (acc, r) => ({
      owed: acc.owed + r.owedAzn,
      paid: acc.paid + r.paidAzn,
      remain: acc.remain + r.remainingAzn,
    }),
    { owed: 0, paid: 0, remain: 0 },
  );

  const fmt = (n: number) =>
    n.toLocaleString("az-AZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className={modalStyles.ordersOverlay}>
      <div className={modalStyles.ordersBackdrop} onClick={onClose} />
      <div className={modalStyles.ordersPanel}>
        <div className={modalStyles.ordersHeader}>
          <div>
            <h3 className={modalStyles.ordersHeaderTitle}>{title}</h3>
            <p className={modalStyles.ordersHeaderHint}>
              Bütün sifarişlər, ödəniş və qalıq borc
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

        <div className={modalStyles.ordersSummary}>
          <span
            className={`${modalStyles.ordersSummaryPill} ${modalStyles.ordersSummaryCount}`}
          >
            {rows.length} sifariş
          </span>
          <span
            className={`${modalStyles.ordersSummaryPill} ${modalStyles.ordersSummaryOwed}`}
          >
            Borc: {fmt(totals.owed)} AZN
          </span>
          <span
            className={`${modalStyles.ordersSummaryPill} ${modalStyles.ordersSummaryPaid}`}
          >
            Ödənilib: {fmt(totals.paid)} AZN
          </span>
          <span
            className={`${modalStyles.ordersSummaryPill} ${modalStyles.ordersSummaryRemain}`}
          >
            Qalıq: {fmt(totals.remain)} AZN
          </span>
        </div>

        <div className={modalStyles.ordersBody}>
          {rows.length === 0 ? (
            <div className={modalStyles.ordersEmpty}>Sifariş tapılmadı</div>
          ) : (
            <table className={modalStyles.modalTable}>
              <thead>
                <tr>
                  <th>Sifariş</th>
                  <th>Borc</th>
                  <th>Ödənilib</th>
                  <th>Qalıq</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.orderId}>
                    <td>
                      <span className={modalStyles.orderIdBadge}>
                        {r.orderNumber}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${modalStyles.amountChip} ${modalStyles.amountChipNeutral}`}
                      >
                        {fmt(r.owedAzn)} AZN
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${modalStyles.amountChip} ${modalStyles.amountChipPaid}`}
                      >
                        {fmt(r.paidAzn)} AZN
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${modalStyles.amountChip} ${
                          r.remainingAzn > 0
                            ? modalStyles.amountChipRemain
                            : modalStyles.amountChipClear
                        }`}
                      >
                        {fmt(r.remainingAzn)} AZN
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={modalStyles.pickBtn}
                        onClick={() => {
                          onPickOrder(String(r.orderId));
                          onClose();
                        }}
                      >
                        Seç
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FinanceModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  defaultWallet = "Kasa",
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  defaultWallet?: CashWallet;
}) {
  const [partnerKind, setPartnerKind] = useState<PartnerKind>("customer");
  const [formData, setFormData] = useState({
    type: "INCOME",
    category: "",
    name: "",
    amount: "",
    currency: "AZN",
    paymentMethod: defaultWallet as string,
    customerId: "",
    carrierId: "",
    orderId: "",
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [financeTxs, setFinanceTxs] = useState<any[]>([]);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetchCustomersAction(),
      fetchCarriersAction(),
      fetchOrdersAction(),
      fetchFinanceTransactionsAction(),
    ]).then(([c, r, o, f]) => {
      const cust = asList(c)
        .filter((x) => x?.id != null && entityLabel(x))
        .sort((a, b) => entityLabel(a).localeCompare(entityLabel(b), "az"));
      const carr = asList(r)
        .filter((x) => x?.id != null && entityLabel(x))
        .sort((a, b) => entityLabel(a).localeCompare(entityLabel(b), "az"));
      setCustomers(cust);
      setCarriers(carr);
      setOrders(asList(o));
      setFinanceTxs(asList(f));
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setAmountTouched(false);
    if (initialData) {
      const method = initialData.paymentMethod || defaultWallet;
      const hasCarrier = Boolean(initialData.carrierId);
      const kind: PartnerKind = hasCarrier ? "carrier" : "customer";
      setPartnerKind(kind);
      setFormData({
        type: initialData.type || (kind === "customer" ? "INCOME" : "EXPENSE"),
        category: initialData.category || "",
        name: initialData.name || "",
        amount: initialData.amount ? String(initialData.amount) : "",
        currency: initialData.currency || "AZN",
        paymentMethod:
          method === "Nağd" || method === "Nagd"
            ? "Kasa"
            : method === "Kart"
              ? "Bank"
              : method,
        customerId: initialData.customerId ? String(initialData.customerId) : "",
        carrierId: initialData.carrierId ? String(initialData.carrierId) : "",
        orderId: initialData.orderId ? String(initialData.orderId) : "",
      });
    } else {
      setPartnerKind("customer");
      setFormData({
        type: "INCOME",
        category: "Müştəri ödənişi",
        name: "",
        amount: "",
        currency: "AZN",
        paymentMethod: defaultWallet,
        customerId: "",
        carrierId: "",
        orderId: "",
      });
    }
  }, [initialData, isOpen, defaultWallet]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === formData.customerId) || null,
    [customers, formData.customerId],
  );
  const selectedCarrier = useMemo(
    () => carriers.find((c) => String(c.id) === formData.carrierId) || null,
    [carriers, formData.carrierId],
  );

  const partnerOrders = useMemo(() => {
    if (partnerKind === "customer") {
      if (!selectedCustomer) return [];
      return orders.filter((o) =>
        orderMatchesCustomer(o, selectedCustomer, financeTxs),
      );
    }
    if (!selectedCarrier) return [];
    return orders.filter((o) =>
      orderMatchesCarrier(o, selectedCarrier, financeTxs),
    );
  }, [
    partnerKind,
    selectedCustomer,
    selectedCarrier,
    orders,
    financeTxs,
  ]);

  const orderDebtRows: OrderDebtInfo[] = useMemo(() => {
    const partnerId =
      partnerKind === "customer"
        ? selectedCustomer?.id
        : selectedCarrier?.id;
    const partnerName =
      partnerKind === "customer"
        ? entityLabel(selectedCustomer)
        : entityLabel(selectedCarrier);
    return partnerOrders
      .map((o) => {
        const debt = calcOrderDebt(
          o,
          partnerKind,
          financeTxs,
          partnerId,
          partnerName,
        );
        return {
          orderId: Number(o.id),
          orderNumber: o.orderNumber || `SF-${o.id}`,
          ...debt,
        };
      })
      .sort((a, b) => b.remainingAzn - a.remainingAzn);
  }, [
    partnerOrders,
    partnerKind,
    financeTxs,
    selectedCustomer,
    selectedCarrier,
  ]);

  const selectedOrderDebt = useMemo(() => {
    if (!formData.orderId) return null;
    const partnerId =
      partnerKind === "customer"
        ? selectedCustomer?.id
        : selectedCarrier?.id;
    const partnerName =
      partnerKind === "customer"
        ? entityLabel(selectedCustomer)
        : entityLabel(selectedCarrier);
    return (
      orderDebtRows.find((r) => String(r.orderId) === formData.orderId) ||
      (() => {
        const ord = orders.find((o) => String(o.id) === formData.orderId);
        const debt = calcOrderDebt(
          ord || { id: formData.orderId },
          partnerKind,
          financeTxs,
          partnerId,
          partnerName,
        );
        return {
          orderId: Number(formData.orderId),
          orderNumber: ord?.orderNumber || `SF-${formData.orderId}`,
          ...debt,
        };
      })()
    );
  }, [
    formData.orderId,
    orderDebtRows,
    partnerKind,
    financeTxs,
    orders,
    selectedCustomer,
    selectedCarrier,
  ]);

  // Sifariş seçiləndə məbləği qalıq borcla doldur
  useEffect(() => {
    if (!isOpen || amountTouched || !selectedOrderDebt) return;
    if (!(selectedOrderDebt.remainingAzn > 0)) return;
    const partnerName =
      partnerKind === "customer"
        ? entityLabel(selectedCustomer) || "Müştəri"
        : entityLabel(selectedCarrier) || "Daşıyıcı";
    setFormData((prev) => ({
      ...prev,
      amount: selectedOrderDebt.remainingAzn.toFixed(2),
      currency: "AZN",
      name:
        prev.name?.trim() ||
        `${selectedOrderDebt.orderNumber} — ${partnerName}`,
      category:
        prev.category ||
        (partnerKind === "customer" ? "Müştəri ödənişi" : "Daşıyıcı ödənişi"),
    }));
  }, [
    selectedOrderDebt,
    isOpen,
    amountTouched,
    partnerKind,
    selectedCustomer,
    selectedCarrier,
  ]);

  const setPartnerKindAndReset = (kind: PartnerKind) => {
    setPartnerKind(kind);
    setAmountTouched(false);
    setFormData((prev) => ({
      ...prev,
      type: kind === "customer" ? "INCOME" : "EXPENSE",
      category: kind === "customer" ? "Müştəri ödənişi" : "Daşıyıcı ödənişi",
      customerId: "",
      carrierId: "",
      orderId: "",
      amount: "",
      name: "",
    }));
  };

  const handleSave = () => {
    if (!formData.amount || !(Number(formData.amount) > 0)) {
      alert("Məbləğ daxil edin");
      return;
    }
    if (partnerKind === "customer" && !formData.customerId) {
      alert("Müştəri seçin");
      return;
    }
    if (partnerKind === "carrier" && !formData.carrierId) {
      alert("Daşıyıcı seçin");
      return;
    }

    const partnerName =
      partnerKind === "customer"
        ? entityLabel(selectedCustomer)
        : entityLabel(selectedCarrier);

    onSave({
      ...formData,
      type: partnerKind === "customer" ? "INCOME" : "EXPENSE",
      customerId:
        partnerKind === "customer" && formData.customerId
          ? Number(formData.customerId)
          : null,
      carrierId:
        partnerKind === "carrier" && formData.carrierId
          ? Number(formData.carrierId)
          : null,
      orderId: formData.orderId ? Number(formData.orderId) : null,
      partner: partnerName,
      name:
        formData.name?.trim() ||
        (formData.orderId
          ? `${selectedOrderDebt?.orderNumber || "SF"} — ${partnerName}`
          : partnerName),
      category:
        formData.category ||
        (partnerKind === "customer" ? "Müştəri ödənişi" : "Daşıyıcı ödənişi"),
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
              {initialData ? "Tranzaksiyanı redaktə et" : "Yeni Tranzaksiya"}
            </h2>
            <p className={modalStyles.drawerHint}>
              Real müştəri/daşıyıcı ödənişi — borc və alacaq avtomatik yenilənir
            </p>
          </div>
          <button type="button" onClick={onClose} className={modalStyles.ordersCloseBtn}>
            <FiX />
          </button>
        </div>

        <div className={modalStyles.drawerBody}>
          <div className={modalStyles.row2}>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Tərəfdaş tipi</span>
              <select
                className={modalStyles.select}
                value={partnerKind}
                onChange={(e) =>
                  setPartnerKindAndReset(e.target.value as PartnerKind)
                }
              >
                <option value="customer">Müştəri</option>
                <option value="carrier">Daşıyıcı</option>
              </select>
            </label>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Kasa / Bank</span>
              <select
                className={modalStyles.select}
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              >
                <option value="Kasa">Öz kasa</option>
                <option value="Bank">Bank hesabı</option>
              </select>
            </label>
          </div>

          {partnerKind === "customer" ? (
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Müştəri</span>
              <select
                className={modalStyles.select}
                value={formData.customerId}
                onChange={(e) => {
                  setAmountTouched(false);
                  setFormData({
                    ...formData,
                    customerId: e.target.value,
                    carrierId: "",
                    orderId: "",
                    amount: "",
                    name: "",
                    type: "INCOME",
                  });
                }}
              >
                <option value="">Müştəri seçin</option>
                {customers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {entityLabel(c)}
                  </option>
                ))}
              </select>
              {customers.length === 0 ? (
                <span className={modalStyles.fieldHint}>
                  Müştəri siyahısı boşdur — Kontragentlər → Müştərilər
                </span>
              ) : null}
            </label>
          ) : (
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Daşıyıcı</span>
              <select
                className={modalStyles.select}
                value={formData.carrierId}
                onChange={(e) => {
                  setAmountTouched(false);
                  setFormData({
                    ...formData,
                    carrierId: e.target.value,
                    customerId: "",
                    orderId: "",
                    amount: "",
                    name: "",
                    type: "EXPENSE",
                  });
                }}
              >
                <option value="">Daşıyıcı seçin</option>
                {carriers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {entityLabel(c)}
                  </option>
                ))}
              </select>
              {carriers.length === 0 ? (
                <span className={modalStyles.fieldHint}>
                  Daşıyıcı siyahısı boşdur — Kontragentlər → Daşıyıcılar
                </span>
              ) : null}
            </label>
          )}

          <div className={modalStyles.fieldStack}>
            <div className={modalStyles.sectionTitle}>
              <span className={modalStyles.label}>Sifariş</span>
              <button
                type="button"
                className={modalStyles.ghostBtn}
                disabled={
                  partnerKind === "customer"
                    ? !formData.customerId
                    : !formData.carrierId
                }
                onClick={() => setOrdersModalOpen(true)}
              >
                <FiList size={14} />
                Sifarişlər / borclar
              </button>
            </div>
            <select
              className={modalStyles.select}
              value={formData.orderId}
              disabled={
                partnerKind === "customer"
                  ? !formData.customerId
                  : !formData.carrierId
              }
              onChange={(e) => {
                setAmountTouched(false);
                setFormData({ ...formData, orderId: e.target.value });
              }}
            >
              <option value="">Sifariş seçin</option>
              {orderDebtRows.map((r) => (
                <option key={r.orderId} value={String(r.orderId)}>
                  {r.orderNumber}
                  {orderDebtStatusLabel(r)}
                </option>
              ))}
            </select>
            {(partnerKind === "customer"
              ? formData.customerId
              : formData.carrierId) && orderDebtRows.length === 0 ? (
              <span className={modalStyles.fieldHint}>
                Bu tərəfdaşa bağlı sifariş tapılmadı
              </span>
            ) : null}
          </div>

          {selectedOrderDebt && (
            <div className={modalStyles.debtCard}>
              <div>
                <div className={modalStyles.debtLabel}>Borc</div>
                <div className={modalStyles.debtValue}>
                  {selectedOrderDebt.owedAzn.toFixed(2)} AZN
                </div>
              </div>
              <div>
                <div className={modalStyles.debtLabel}>Ödənilib</div>
                <div className={`${modalStyles.debtValue} ${modalStyles.debtPaid}`}>
                  {selectedOrderDebt.paidAzn.toFixed(2)} AZN
                </div>
              </div>
              <div>
                <div className={modalStyles.debtLabel}>Qalıq</div>
                <div
                  className={`${modalStyles.debtValue} ${
                    selectedOrderDebt.remainingAzn > 0
                      ? modalStyles.debtRemain
                      : modalStyles.debtClear
                  }`}
                >
                  {selectedOrderDebt.remainingAzn.toFixed(2)} AZN
                </div>
              </div>
            </div>
          )}

          <label className={modalStyles.fieldStack}>
            <span className={modalStyles.label}>Ad / Açıqlama</span>
            <input
              className={modalStyles.input}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </label>

          <div className={modalStyles.row2}>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>
                Məbləğ {partnerKind === "customer" ? "(alınan)" : "(ödənilən)"}
              </span>
              <input
                className={modalStyles.input}
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => {
                  setAmountTouched(true);
                  setFormData({ ...formData, amount: e.target.value });
                }}
              />
            </label>
            <label className={modalStyles.fieldStack}>
              <span className={modalStyles.label}>Valyuta</span>
              <select
                className={modalStyles.select}
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
              >
                <option value="AZN">AZN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
              </select>
            </label>
          </div>

          <label className={modalStyles.fieldStack}>
            <span className={modalStyles.label}>Kateqoriya</span>
            <input
              className={modalStyles.input}
              type="text"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
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
            onClick={onClose}
            className={modalStyles.footerBtnSecondary}
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={modalStyles.footerBtnPrimary}
          >
            Yadda saxla
          </button>
        </div>
      </div>

      <PartnerOrdersModal
        open={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
        title={
          partnerKind === "customer"
            ? `Müştəri sifarişləri — ${entityLabel(selectedCustomer)}`
            : `Daşıyıcı sifarişləri — ${entityLabel(selectedCarrier)}`
        }
        rows={orderDebtRows}
        onPickOrder={(orderId) => {
          setAmountTouched(false);
          setFormData((prev) => ({ ...prev, orderId }));
        }}
      />
    </>
  );
}
