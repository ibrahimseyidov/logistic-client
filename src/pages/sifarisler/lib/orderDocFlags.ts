/** Derive Sənədlər column badge flags from order invoices / orderDocuments. */

const SENT_INVOICE_TYPES = new Set([
  "ireli",
  "outgoing",
  "sent",
  "forward",
]);
const RECEIVED_INVOICE_TYPES = new Set([
  "ilkin",
  "alinmis",
  "incoming",
  "received",
]);

function isTransportName(n: string) {
  return (
    n.includes("cmr") ||
    n.includes("shipping") ||
    n.includes("dasinma") ||
    n.includes("daşınma") ||
    n.includes("shipping_info") ||
    n.includes("transport")
  );
}

export type OrderDocFlagSource = {
  hasSentInvoice?: boolean | null;
  hasReceivedInvoice?: boolean | null;
  hasTransportDoc?: boolean | null;
  hasHandoverAct?: boolean | null;
  invoices?: Array<{ type?: string | null }> | null;
  orderDocuments?: Array<{
    templateCode?: string | null;
    name?: string | null;
  }> | null;
  query?: {
    documents?: Array<{ name?: string | null }> | null;
  } | null;
};

export function resolveOrderDocFlags(order: OrderDocFlagSource) {
  const invoices = order.invoices || [];
  const docs = order.orderDocuments || [];
  const queryDocs = order.query?.documents || [];

  const invTypes = invoices.map((i) =>
    String(i.type || "")
      .toLowerCase()
      .trim(),
  );
  const codes = docs.map((d) =>
    String(d.templateCode || "")
      .toLowerCase()
      .trim(),
  );
  const names = [
    ...docs.map((d) => String(d.name || "").toLowerCase()),
    ...queryDocs.map((d) => String(d.name || "").toLowerCase()),
  ];

  return {
    hasSentInvoice:
      !!order.hasSentInvoice ||
      invTypes.some((t) => SENT_INVOICE_TYPES.has(t)) ||
      codes.some((c) => c === "invoice" || c.includes("invoice")),
    hasReceivedInvoice:
      !!order.hasReceivedInvoice ||
      invTypes.some((t) => RECEIVED_INVOICE_TYPES.has(t)),
    hasTransportDoc:
      !!order.hasTransportDoc ||
      codes.some(
        (c) =>
          c === "shipping_info" ||
          c.includes("shipping") ||
          c.includes("cmr") ||
          c.includes("transport"),
      ) ||
      names.some(isTransportName),
    hasHandoverAct:
      !!order.hasHandoverAct ||
      codes.some(
        (c) => c === "client_act" || c === "agent_act" || c.endsWith("_act"),
      ) ||
      names.some(
        (n) =>
          n.includes("client_act") ||
          n.includes("agent_act") ||
          n.includes("tehvil") ||
          n.includes("təhvil") ||
          n.includes("handover"),
      ),
  };
}
