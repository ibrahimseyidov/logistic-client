import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../common/contexts/AuthContext";
import Loading from "../../common/components/loading/Loading";
import {
  fetchTillOverview,
  fetchTills,
  createTillTransaction,
  transferBetweenTills,
  type Till,
  type TillTransaction,
} from "../../common/actions/tills.actions";
import TillTransactionModal from "./components/TillTransactionModal";
import TillTransactionsTable from "./components/TillTransactionsTable";

type TransactionType = "medaxil" | "mexaric" | "gider" | "transfer";
type TransferTillOption = Till & { branchName: string };
const BRANCH_STORAGE_KEY = "selectedBranchName";

const getTodayDateValue = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function KassalarPage() {
  const { user, branches } = useAuth();
  const companyId = user?.companyId;

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchTills, setBranchTills] = useState<TransferTillOption[]>([]);
  const [transferTills, setTransferTills] = useState<TransferTillOption[]>([]);
  const [selectedTillId, setSelectedTillId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TillTransaction[]>([]);
  const [startDate, setStartDate] = useState(getTodayDateValue);
  const [endDate, setEndDate] = useState(getTodayDateValue);

  const [loadingTills, setLoadingTills] = useState(false);
  const [loadingTransferTills, setLoadingTransferTills] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);

  const selectedTill = useMemo(
    () => branchTills.find((till) => till.id === selectedTillId) ?? null,
    [branchTills, selectedTillId],
  );

  const mapBranchTills = (items: Till[], branchId: number) => {
    const branchName =
      branches.find((branch) => branch.id === branchId)?.name ?? "";

    return items.map((till) => ({
      ...till,
      branchName,
    }));
  };

  const loadOverview = async (options?: { tillId?: number | null }) => {
    if (!companyId || !selectedBranchId) {
      setBranchTills([]);
      setTransactions([]);
      setSelectedTillId(null);
      return null;
    }

    setLoadingTills(true);
    setLoadingTransactions(true);
    try {
      const overview = await fetchTillOverview({
        branchId: selectedBranchId,
        companyId,
        tillId: options?.tillId ?? selectedTillId ?? undefined,
        startDate,
        endDate,
      });
      const mapped = mapBranchTills(overview.tills, selectedBranchId);
      setBranchTills(mapped);
      setTransactions(overview.transactions);
      setSelectedTillId(overview.selectedTillId);
      return {
        ...overview,
        tills: mapped,
      };
    } catch (e) {
      setError((e as Error).message);
      setBranchTills([]);
      setTransactions([]);
      setSelectedTillId(null);
      return null;
    } finally {
      setLoadingTills(false);
      setLoadingTransactions(false);
    }
  };

  const loadBranchTills = async (branchId: number, cid: number) => {
    setLoadingTills(true);
    try {
      const list = await fetchTills(branchId, cid);
      const mapped = mapBranchTills(list, branchId);
      setBranchTills(mapped);
      setSelectedTillId((currentSelectedTillId) => {
        if (
          currentSelectedTillId &&
          mapped.some((till) => till.id === currentSelectedTillId)
        ) {
          return currentSelectedTillId;
        }

        return mapped[0]?.id ?? null;
      });
      return mapped;
    } catch (e) {
      setError((e as Error).message);
      setBranchTills([]);
      setSelectedTillId(null);
      return [];
    } finally {
      setLoadingTills(false);
    }
  };

  const loadTransferTills = async () => {
    if (!companyId || branches.length === 0) {
      setTransferTills([]);
      return [];
    }

    setLoadingTransferTills(true);
    try {
      const tillsByBranch = await Promise.all(
        branches.map(async (branch) => {
          const list = await fetchTills(branch.id, companyId);
          return mapBranchTills(list, branch.id);
        }),
      );
      const mapped = tillsByBranch.flat();
      setTransferTills(mapped);
      return mapped;
    } catch (e) {
      setError((e as Error).message);
      setTransferTills([]);
      return [];
    } finally {
      setLoadingTransferTills(false);
    }
  };

  useEffect(() => {
    if (!branches.length) {
      setSelectedBranchId(null);
      return;
    }

    const syncByName = (branchName?: string | null) => {
      if (!branchName) return;
      const matched = branches.find((branch) => branch.name === branchName);
      if (matched) {
        setSelectedBranchId(matched.id);
        return;
      }

      setSelectedBranchId(branches[0]?.id ?? null);
    };

    syncByName(localStorage.getItem(BRANCH_STORAGE_KEY));

    const onBranchChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ branchName?: string }>;
      syncByName(
        customEvent.detail?.branchName ??
          localStorage.getItem(BRANCH_STORAGE_KEY),
      );
    };

    window.addEventListener("branch-change", onBranchChange);
    window.addEventListener("storage", onBranchChange);

    return () => {
      window.removeEventListener("branch-change", onBranchChange);
      window.removeEventListener("storage", onBranchChange);
    };
  }, [branches]);

  useEffect(() => {
    if (!companyId || !selectedBranchId) {
      setBranchTills([]);
      setTransactions([]);
      setSelectedTillId(null);
      return;
    }

    void loadOverview();
  }, [companyId, selectedBranchId, startDate, endDate]);

  const openModal = async () => {
    if (!selectedTill) {
      setError("Lütfen önce bir kassa seçiniz.");
      return;
    }

    setError(null);
    await loadTransferTills();
    setModalOpen(true);
  };

  const handleTransactionSubmit = async (payload: {
    type: TransactionType;
    amount: number;
    description?: string;
    counterpartyType?: "supplier" | "customer" | "till";
    counterpartyId?: number;
    counterpartyName?: string;
    targetTillId?: number;
  }) => {
    if (!selectedTill || !companyId || !selectedBranchId) return;

    if (payload.type === "transfer") {
      if (!payload.targetTillId) return;

      await transferBetweenTills(selectedTill.id, {
        companyId,
        targetTillId: payload.targetTillId,
        amount: payload.amount,
        description: payload.description,
      });

      await loadOverview({ tillId: selectedTill.id });
      setTransferTills([]);
      setModalOpen(false);
      return;
    }

    const newTx = await createTillTransaction(selectedTill.id, {
      companyId,
      ...payload,
    });

    // Recalculate balance locally
    const delta = payload.type === "medaxil" ? payload.amount : -payload.amount;
    setBranchTills((prev) =>
      prev.map((till) =>
        till.id === selectedTill.id
          ? { ...till, balance: till.balance + delta }
          : till,
      ),
    );
    setTransferTills((prev) =>
      prev.map((till) =>
        till.id === selectedTill.id
          ? { ...till, balance: till.balance + delta }
          : till,
      ),
    );
    await loadOverview({ tillId: selectedTill.id });
    setModalOpen(false);
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <div className="shrink-0">
        <div className="flex flex-col gap-2 bg-white p-3 rounded-lg mt-3 mb-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedTillId ?? ""}
                onChange={(e) => {
                  const tillId = Number(e.target.value);
                  void loadOverview({ tillId: tillId || null });
                }}
                disabled={loadingTills || branchTills.length === 0}
                className="rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition min-w-[280px] bg-gray-50 border border-gray-300"
              >
                {branchTills.length === 0 && (
                  <option value="">Kassa bulunamadı</option>
                )}
                {branchTills.map((till) => (
                  <option key={till.id} value={till.id}>
                    {till.branchName} / {till.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition bg-gray-50 border border-gray-300"
              />

              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition bg-gray-50 border border-gray-300"
              />

              {selectedTill && (
                <div className="inline-flex items-center gap-2 rounded border border-blue-100 bg-blue-50 px-3 py-1 text-sm text-blue-700">
                  <span className="font-medium">Seçili Kassa:</span>
                  <span>{selectedTill.branchName} /</span>
                  <span>{selectedTill.name}</span>
                  <span className="text-blue-500">
                    {formatCurrency(selectedTill.balance)} ₼
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={openModal}
                disabled={!selectedTill}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded transition text-sm font-medium disabled:opacity-50 disabled:hover:bg-blue-500"
              >
                İşlem Ekle
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 px-4 mb-3">{error}</p>}
        {!companyId && (
          <p className="text-gray-500 px-4 mb-3">Önce Giriş Yapmalısınız.</p>
        )}
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-3 pb-3">
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">
              {selectedTill
                ? `İşlem Geçmişi - ${selectedTill.name}`
                : "İşlem Geçmişi"}
            </h2>
            {loadingTransactions && selectedTill && (
              <span className="text-xs text-gray-400">Yükleniyor...</span>
            )}
          </div>

          {!selectedTill ? (
            <div className="flex h-full min-h-52 items-center justify-center text-sm text-gray-500">
              İşlem geçmişini görmek için yukarıdan bir kassa seçiniz.
            </div>
          ) : loadingTransactions ? (
            <div className="flex h-full min-h-52 items-center justify-center">
              <Loading />
            </div>
          ) : (
            <div className="h-full overflow-x-auto overflow-y-auto">
              <TillTransactionsTable transactions={transactions} />
            </div>
          )}
        </div>
      </div>

      {selectedTill && (
        <TillTransactionModal
          isOpen={modalOpen}
          tillBalance={selectedTill.balance}
          sourceTillId={selectedTill.id}
          availableTills={transferTills}
          onClose={() => setModalOpen(false)}
          onSubmit={handleTransactionSubmit}
        />
      )}
    </div>
  );
}
