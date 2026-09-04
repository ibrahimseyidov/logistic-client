import { useState, useEffect, useMemo, useRef } from "react";
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
  findCarrierForName,
  findCustomerForName,
  fold,
  namesMatch,
  orderMatchesCarrier,
  orderMatchesCustomer,
} from "./lib/financePartner.utils";

type PartnerKind = "customer" | "carrier";

type OrderDebtInfo = {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  owedAzn: number;
  paidAzn: number;
  remainingAzn: number;
};

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

function formatOrderDate(raw?: string | Date | null): string {
  if (!raw) return "—";
  const s = String(raw).trim();
  if (!s) return "—";
  // artıq dd.mm.yyyy və ya oxşar formatdadırsa olduğu kimi göstər
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(s)) {
    return s.split(/[T\s]/)[0];
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("az-AZ");
}

function asList(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const anyData = data as any;
    if (Array.isArray(anyData.items)) return anyData.items;
    if (Array.isArray(anyData.data)) return anyData.data;
  }
  return [];
}

function isCustomerDebtFinanceName(name: unknown): boolean {
  const n = fold(name);
  return (
    n === "baslangic tarif" ||
    n === "satis qiymeti" ||
    n.startsWith("ireli hesab")
  );
}

function isPlaceholderCarrierName(raw: unknown): boolean {
  const s = String(raw || "").trim();
  return !s || s === "—" || fold(s) === "dasiyici";
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
        if (
          pname &&
          tx.customerId == null &&
          tx.partner &&
          !namesMatch(tx.partner, pname) &&
          !isCustomerDebtFinanceName(tx.name)
        ) {
          return;
        }
        owedAzn += resolveFinanceRevenueAzn(tx);
        return;
      }

      const txName = String(tx.name || "").trim();
      if (isCustomerDebtFinanceName(txName) && !(resolveFinanceExpenseAzn(tx) > 0)) {
        return;
      }

      const exp = resolveFinanceExpenseAzn(tx);
      if (!(exp > 0)) return;

      const txCarrierId =
        tx.carrierId != null
          ? String(tx.carrierId)
          : tx.carrier?.id != null
            ? String(tx.carrier.id)
            : null;

      if (pid && txCarrierId && txCarrierId !== pid) return;

      if (pid && txCarrierId === pid) {
        owedAzn += exp;
        return;
      }

      const partnerOk =
        Boolean(pname) &&
        (namesMatch(tx.partner, pname) ||
          namesMatch(tx.carrier?.name, pname) ||
          namesMatch(entityLabel(tx.carrier), pname));

      if (partnerOk) {
        owedAzn += exp;
        return;
      }

      if (!txCarrierId && !isCustomerDebtFinanceName(txName)) {
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

  if (kind === "carrier" && !(owedAzn > 0) && Array.isArray(order?.voyages)) {
    const orderTokens = String(order?.carriers || "")
      .split(/[,;|/]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    const orderIsThisCarrier =
      Boolean(pname) &&
      orderTokens.some((t) => namesMatch(t, pname));

    for (const v of order.voyages) {
      const vc = String(v?.carrier || "").trim();
      if (isPlaceholderCarrierName(vc)) {
        if (orderIsThisCarrier || !orderTokens.length) {
          owedAzn += resolveVoyageExpenseAzn(v);
        }
        continue;
      }
      if (pname && !namesMatch(vc, pname)) continue;
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
              Bu tərəfdaşın sifarişləri, ödəniş və qalıq borc
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
                  <th>Tarix</th>
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
                      <span className={modalStyles.dateCell}>
                        {r.orderDate || "—"}
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
  const [formError, setFormError] = useState("");
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
    date: todayInputDate(),
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [financeTxs, setFinanceTxs] = useState<any[]>([]);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  /** Tərəfdaş üçün sifariş avtomatik seçilibsə — təkrar yazmamaq üçün */
  const autoPickPartnerKeyRef = useRef("");

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
    if (!isOpen) {
      autoPickPartnerKeyRef.current = "";
      return;
    }
    setAmountTouched(false);
    setFormError("");
    if (initialData) {
      const method = initialData.paymentMethod || defaultWallet;
      const kind: PartnerKind =
        initialData.partnerKind === "carrier" ||
        initialData.partnerKind === "customer"
          ? initialData.partnerKind
          : initialData.carrierId
            ? "carrier"
            : initialData.type === "EXPENSE"
              ? "carrier"
              : "customer";
      setPartnerKind(kind);
      setFormData({
        type:
          initialData.type ||
          (kind === "customer" ? "INCOME" : "EXPENSE"),
        category:
          initialData.category ||
          (kind === "customer" ? "Müştəri ödənişi" : "Daşıyıcı ödənişi"),
        name: initialData.name || "",
        amount:
          initialData.amount != null && initialData.amount !== ""
            ? String(initialData.amount)
            : "",
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
        date: toInputDate(initialData.date || initialData.costDate),
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
        date: todayInputDate(),
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
  const selectedOrder = useMemo(
    () => orders.find((o) => String(o.id) === String(formData.orderId)) || null,
    [orders, formData.orderId],
  );

  const carriersForSelectedOrder = useMemo(() => {
    if (partnerKind !== "carrier") return carriers;
    if (selectedOrder) {
      const onOrder = carriers.filter((c) =>
        orderMatchesCarrier(selectedOrder, c, financeTxs),
      );
      if (onOrder.length > 0) return onOrder;
    }
    return carriers;
  }, [partnerKind, selectedOrder, carriers, financeTxs]);

  const partnerOrders = useMemo(() => {
    if (partnerKind === "customer") {
      if (!selectedCustomer) return [];
      return orders.filter((o) =>
        orderMatchesCustomer(o, selectedCustomer, financeTxs),
      );
    }
    if (selectedCarrier) {
      return orders.filter((o) =>
        orderMatchesCarrier(o, selectedCarrier, financeTxs),
      );
    }
    return [];
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
          orderDate: formatOrderDate(
            o.orderDate || o.orderDateIso || o.createdAt,
          ),
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
          orderDate: formatOrderDate(
            ord?.orderDate || ord?.orderDateIso || ord?.createdAt,
          ),
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

  const orderSelectRows = useMemo(() => {
    if (!formData.orderId) return orderDebtRows;
    if (
      orderDebtRows.some(
        (r) => String(r.orderId) === String(formData.orderId),
      )
    ) {
      return orderDebtRows;
    }
    if (selectedOrderDebt) return [selectedOrderDebt, ...orderDebtRows];
    return orderDebtRows;
  }, [formData.orderId, orderDebtRows, selectedOrderDebt]);

  // Sifarişin daşıyıcısı təkdirsə avtomatik seç
  useEffect(() => {
    if (!isOpen || partnerKind !== "carrier") return;
    if (!formData.orderId || formData.carrierId) return;
    const ids = carriersForSelectedOrder.map((c) => String(c.id));
    if (ids.length === 1) {
      setAmountTouched(false);
      setFormData((prev) => ({ ...prev, carrierId: ids[0] }));
    }
  }, [
    isOpen,
    partnerKind,
    formData.orderId,
    formData.carrierId,
    carriersForSelectedOrder,
  ]);

  // Hesabatdan / tərəfdaş seçimindən gələndə sifarişi avtomatik seç
  useEffect(() => {
    if (!isOpen) return;
    const partnerId =
      partnerKind === "customer" ? formData.customerId : formData.carrierId;
    if (!partnerId) return;

    const partner =
      partnerKind === "customer" ? selectedCustomer : selectedCarrier;
    // Tərəfdaş siyahısı / sifarişlər hələ gəlməyibsə gözlə
    if (!partner) return;
    if (orders.length === 0) return;

    const partnerKey = `${partnerKind}:${partnerId}`;

    if (formData.orderId) {
      autoPickPartnerKeyRef.current = partnerKey;
      return;
    }
    if (autoPickPartnerKeyRef.current === partnerKey) return;

    if (orderDebtRows.length === 0) {
      autoPickPartnerKeyRef.current = partnerKey;
      return;
    }

    const pick =
      [...orderDebtRows]
        .sort((a, b) => b.remainingAzn - a.remainingAzn)
        .find((r) => r.remainingAzn > 0) ||
      [...orderDebtRows]
        .sort((a, b) => b.owedAzn - a.owedAzn)
        .find((r) => r.owedAzn > 0) ||
      orderDebtRows[0];

    autoPickPartnerKeyRef.current = partnerKey;
    if (!pick) return;

    setAmountTouched(false);
    setFormData((prev) => ({
      ...prev,
      orderId: String(pick.orderId),
    }));
  }, [
    isOpen,
    partnerKind,
    formData.customerId,
    formData.carrierId,
    formData.orderId,
    orderDebtRows,
    orders.length,
    selectedCustomer,
    selectedCarrier,
  ]);

  // Sifariş seçiləndə məbləği qalıq borcla doldur
  useEffect(() => {
    if (!isOpen || amountTouched || !selectedOrderDebt) return;
    if (partnerKind === "carrier" && !selectedCarrier) return;
    if (!(selectedOrderDebt.remainingAzn > 0)) return;
    const partnerName =
      partnerKind === "customer"
        ? entityLabel(selectedCustomer) || "Müştəri"
        : entityLabel(selectedCarrier) || "Daşıyıcı";
    setFormData((prev) => ({
      ...prev,
      amount: selectedOrderDebt.remainingAzn.toFixed(2),
      currency: "AZN",
      name: `${selectedOrderDebt.orderNumber} — ${partnerName}`,
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

  const resolveCustomerIdForOrder = (order: any): string => {
    if (!order) return "";
    const direct = order.customerId != null ? String(order.customerId) : "";
    if (direct && customers.some((c) => String(c.id) === direct)) return direct;
    const found = findCustomerForName(
      customers,
      order.customerName || order.customer || order._customerName,
    );
    return found?.id != null ? String(found.id) : "";
  };

  const resolveCarrierIdForOrder = (order: any): string => {
    if (!order) return "";
    const matched = carriers.filter((c) =>
      orderMatchesCarrier(order, c, financeTxs),
    );
    if (matched.length >= 1) return String(matched[0].id);
    const firstName = String(order.carriers || "")
      .split(/[,;|/]+/)
      .map((s: string) => s.trim())
      .find((s: string) => s && s !== "—" && s.toLowerCase() !== "daşıyıcı");
    const found = findCarrierForName(carriers, firstName);
    return found?.id != null ? String(found.id) : "";
  };

  const setPartnerKindAndReset = (kind: PartnerKind) => {
    setPartnerKind(kind);
    setAmountTouched(false);
    setFormError("");
    setFormData((prev) => {
      const keepOrder = String(prev.orderId || "").trim();
      const order = orders.find((o) => String(o.id) === keepOrder);
      return {
        ...prev,
        type: kind === "customer" ? "INCOME" : "EXPENSE",
        category:
          kind === "customer" ? "Müştəri ödənişi" : "Daşıyıcı ödənişi",
        customerId:
          kind === "customer" ? resolveCustomerIdForOrder(order) : "",
        carrierId: kind === "carrier" ? resolveCarrierIdForOrder(order) : "",
        orderId: keepOrder,
        amount: "",
        name: "",
      };
    });
  };

  const canSave = useMemo(() => {
    const partnerOk =
      partnerKind === "customer"
        ? Boolean(formData.customerId)
        : Boolean(formData.carrierId);
    const amountOk = Number(formData.amount) > 0;
    return partnerOk && Boolean(formData.orderId) && amountOk;
  }, [partnerKind, formData.customerId, formData.carrierId, formData.orderId, formData.amount]);

  const handleSave = () => {
    if (partnerKind === "customer" && !formData.customerId) {
      setFormError("Müştəri seçin");
      return;
    }
    if (partnerKind === "carrier" && !formData.carrierId) {
      setFormError("Daşıyıcı seçin");
      return;
    }
    if (!formData.orderId) {
      setFormError("Ödəniş üçün sifariş seçilməlidir");
      return;
    }
    if (!formData.amount || !(Number(formData.amount) > 0)) {
      setFormError("Məbləğ daxil edin");
      return;
    }

    setFormError("");
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
        `${selectedOrderDebt?.orderNumber || "SF"} — ${partnerName}`,
      category:
        formData.category ||
        (partnerKind === "customer" ? "Müştəri ödənişi" : "Daşıyıcı ödənişi"),
      costDate: formData.date || todayInputDate(),
      date: formData.date
        ? new Date(`${formData.date}T12:00:00`)
        : new Date(),
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
              {initialData?.id
                ? "Tranzaksiyanı redaktə et"
                : initialData?.customerId || initialData?.carrierId
                  ? "Ödəniş"
                  : "Yeni Tranzaksiya"}
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
                    orderId: formData.orderId,
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
          ) : null}

          {partnerKind === "carrier" ? (
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
                    orderId: formData.orderId,
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
          ) : null}

          <div className={modalStyles.fieldStack}>
            <div className={modalStyles.sectionTitle}>
              <span className={modalStyles.label}>Sifariş *</span>
              <button
                type="button"
                className={modalStyles.ghostBtn}
                disabled={
                  partnerKind === "customer"
                    ? !formData.customerId && !formData.orderId
                    : !formData.carrierId && !formData.orderId
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
                  ? !formData.customerId && !formData.orderId
                  : !formData.carrierId && !formData.orderId
              }
              onChange={(e) => {
                const nextOrderId = e.target.value;
                setAmountTouched(false);
                setFormError("");
                setFormData({
                  ...formData,
                  orderId: nextOrderId,
                  ...(nextOrderId ? { amount: "", name: "" } : { amount: "", name: "" }),
                });
              }}
            >
              <option value="">Sifariş seçin</option>
              {orderSelectRows.map((r) => (
                <option key={r.orderId} value={String(r.orderId)}>
                  {r.orderNumber}
                  {orderDebtStatusLabel(r)}
                </option>
              ))}
            </select>
            {!formData.orderId ? (
              <span className={modalStyles.fieldHintWarn}>
                {partnerKind === "carrier" &&
                !formData.carrierId &&
                !formData.orderId
                  ? "Əvvəl daşıyıcı seçin — yalnız onun sifarişləri görünəcək"
                  : "Ödəniş üçün sifariş seçilməlidir — məbləğ sifariş qalığına görə dolacaq"}
              </span>
            ) : null}
            {((partnerKind === "customer" && formData.customerId) ||
              (partnerKind === "carrier" && formData.carrierId)) &&
            orderDebtRows.length === 0 ? (
              <span className={modalStyles.fieldHint}>
                Bu tərəfdaşa bağlı sifariş tapılmadı
              </span>
            ) : null}
          </div>

          {selectedOrderDebt &&
          (partnerKind !== "carrier" || formData.carrierId) ? (
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
          ) : null}

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
              <span className={modalStyles.label}>Tarix</span>
              <input
                className={modalStyles.input}
                type="date"
                value={formData.date || todayInputDate()}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </label>
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
            flexDirection: "column",
            gap: "0.65rem",
            background: "#ffffff",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          {formError ? (
            <div className={modalStyles.formError}>{formError}</div>
          ) : null}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
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
              disabled={!canSave}
              title={
                !canSave
                  ? "Sifariş, tərəfdaş və məbləğ doldurulmalıdır"
                  : undefined
              }
            >
              Yadda saxla
            </button>
          </div>
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
          setFormError("");
          setFormData((prev) => ({ ...prev, orderId }));
        }}
      />
    </>
  );
}
