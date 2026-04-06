import { FormEvent, useMemo, useEffect, useState } from "react";
import { useAuth } from "../../../common/contexts/AuthContext";
import Loading from "../../../common/components/loading/Loading";
import {
  createTill,
  fetchTills,
  type Till,
} from "../../../common/actions/tills.actions";

const BRANCH_STORAGE_KEY = "selectedBranchName";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("tr-TR");
};

export default function KassaEklePage() {
  const { user, branches } = useAuth();
  const companyId = user?.companyId;

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [tillName, setTillName] = useState("");
  const [tills, setTills] = useState<Till[]>([]);

  const [loadingTills, setLoadingTills] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedBranchName =
    branches.find((branch) => branch.id === selectedBranchId)?.name ?? "-";

  const canSubmit = useMemo(() => {
    return !!companyId && !!selectedBranchId && tillName.trim().length > 0;
  }, [companyId, selectedBranchId, tillName]);

  const loadTills = async (branchId: number, cid: number) => {
    setLoadingTills(true);
    setError(null);
    try {
      const list = await fetchTills(branchId, cid);
      setTills(list);
    } catch (e) {
      setError((e as Error).message);
      setTills([]);
    } finally {
      setLoadingTills(false);
    }
  };

  useEffect(() => {
    if (!branches.length) {
      setSelectedBranchId(null);
      setTills([]);
      return;
    }

    const savedBranchName = localStorage.getItem(BRANCH_STORAGE_KEY);
    const savedBranch = branches.find(
      (branch) => branch.name === savedBranchName,
    );
    setSelectedBranchId(savedBranch?.id ?? branches[0]?.id ?? null);
  }, [branches]);

  useEffect(() => {
    if (!branches.length) return;

    const syncByName = (branchName?: string | null) => {
      if (!branchName) return;
      const matched = branches.find((branch) => branch.name === branchName);
      if (matched) {
        setSelectedBranchId(matched.id);
      }
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
      setTills([]);
      return;
    }
    void loadTills(selectedBranchId, companyId);
  }, [selectedBranchId, companyId]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !companyId || !selectedBranchId) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const createdTill = await createTill(
        tillName.trim(),
        selectedBranchId,
        companyId,
      );
      setTillName("");
      setSuccess("Kassa basariyla eklendi.");
      setTills((prev) => [createdTill, ...prev]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <div className="shrink-0">
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 bg-white p-3 rounded-lg mt-3 mb-3"
        >
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedBranchId ?? ""}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                disabled={!branches.length}
                className="rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition min-w-[220px] bg-gray-50 border border-gray-300"
              >
                {!branches.length && <option value="">Şube bulunamadı</option>}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <input
                value={tillName}
                onChange={(e) => setTillName(e.target.value)}
                placeholder="Kassa adı giriniz"
                className="rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition w-64 bg-gray-50 border border-gray-300"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded transition text-sm font-medium disabled:opacity-50 disabled:hover:bg-green-500"
              >
                {submitting ? "Ekleniyor..." : "Oluştur"}
              </button>
            </div>
          </div>
        </form>

        {error && <p className="text-red-600 px-4 mb-3">{error}</p>}
        {success && <p className="text-green-600 px-4 mb-3">{success}</p>}
        {!companyId && (
          <p className="text-gray-500 px-4 mb-3">Önce Giriş Yapmalısınız.</p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-lg border border-gray-200 bg-white">
        {loadingTills ? (
          <div className="flex h-full min-h-52 items-center justify-center">
            <Loading />
          </div>
        ) : tills.length === 0 ? (
          <div className="flex h-full min-h-52 items-center justify-center text-sm text-gray-500">
            Henüz kassa eklenmemiş.
          </div>
        ) : (
          <table className="min-w-max w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-16 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
                  ID
                </th>
                <th className="w-64 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
                  Kassa Adı
                </th>
                <th className="w-48 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
                  Şube
                </th>
                <th className="w-32 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
                  Durum
                </th>
                <th className="w-40 px-3 py-2 text-xs font-semibold text-blue-700 text-center whitespace-nowrap border-b border-gray-200 bg-blue-50">
                  Bakiye
                </th>
                <th className="w-32 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
                  Oluşturma
                </th>
                <th className="w-32 px-3 py-2 text-xs font-semibold text-gray-700 text-center whitespace-nowrap border-b border-gray-200">
                  Güncelleme
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {tills.map((till) => (
                <tr
                  key={till.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="w-16 px-3 py-2 text-center text-sm text-gray-700 whitespace-nowrap">
                    {till.id}
                  </td>
                  <td className="w-64 px-3 py-2 text-sm text-gray-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[256px]">
                    {till.name}
                  </td>
                  <td className="w-48 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[192px]">
                    {selectedBranchName}
                  </td>
                  <td className="w-32 px-3 py-2 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        till.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {till.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="w-40 px-3 py-2 text-sm font-semibold text-blue-700 text-center whitespace-nowrap bg-blue-50/30">
                    {formatCurrency(till.balance)} ₼
                  </td>
                  <td className="w-32 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
                    {formatDate(till.createdAt)}
                  </td>
                  <td className="w-32 px-3 py-2 text-sm text-gray-700 text-center whitespace-nowrap">
                    {formatDate(till.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
