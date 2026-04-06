import { useEffect, useMemo, useRef, useState } from "react";
import Select from "../../common/components/select";
import { useAuth } from "../../common/contexts/AuthContext";
import {
  createPurchaseVoucher,
  deletePurchaseVoucher,
  fetchPurchaseModalData,
  fetchPurchaseVouchers,
  PurchaseModalProduct,
  PurchaseModalSupplier,
  PurchaseModalWarehouse,
  PurchaseVoucherRecord,
  updatePurchaseVoucher,
} from "../../common/actions/purchases.actions";

type VoucherType = "alis" | "iade";

interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  stock: number;
}

interface Supplier {
  id: number;
  name: string;
  category: string;
}

interface VoucherLine {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
}

interface Voucher {
  id: number;
  serialNo: string;
  type: VoucherType;
  branch: string;
  warehouse: string;
  supplierId: number;
  supplierName: string;
  createdAt: string;
  note: string;
  status: string;
  lines: VoucherLine[];
}

const MODAL_ITEMS_PER_PAGE = 12;

const buildVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, -1, totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      -1,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
};

const toInputDateTime = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 19);
};

const nowInputDateTime = () => toInputDateTime(new Date());

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);

const nextVoucherNo = () => "Otomatik olusturulacak";

export default function PurchasePage() {
  const numberInputClass =
    "rounded border border-gray-300 px-2 py-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const ITEMS_PER_PAGE = 20;
  const { user, branches } = useAuth();
  const companyId = user?.companyId;

  const [supplierOptions, setSupplierOptions] = useState<Supplier[]>([]);
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [supplierLookup, setSupplierLookup] = useState<
    Record<number, Supplier>
  >({});
  const [productLookup, setProductLookup] = useState<Record<number, Product>>(
    {},
  );
  const [warehouseByBranch, setWarehouseByBranch] = useState<
    Record<string, string[]>
  >({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [productCategorySummary, setProductCategorySummary] = useState<
    Array<{ name: string; count: number }>
  >([{ name: "Hamisi", count: 0 }]);
  const [supplierCategorySummary, setSupplierCategorySummary] = useState<
    Array<{ name: string; count: number }>
  >([{ name: "Hamisi", count: 0 }]);
  const [productTotalRows, setProductTotalRows] = useState(0);
  const [productServerTotalPages, setProductServerTotalPages] = useState(1);
  const [supplierTotalRows, setSupplierTotalRows] = useState(0);
  const [supplierServerTotalPages, setSupplierServerTotalPages] = useState(1);
  const [modalDataLoading, setModalDataLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const suppliers = supplierOptions;
  const products = productOptions;
  const branchOptions = branches;

  const supplierName = (id: number) =>
    supplierLookup[id]?.name ?? suppliers.find((s) => s.id === id)?.name ?? "-";

  const toVoucher = (record: PurchaseVoucherRecord): Voucher => ({
    id: record.id,
    serialNo: record.serialNo,
    type: record.type,
    branch: record.branchName,
    warehouse: record.warehouseName,
    supplierId: record.supplierId,
    supplierName: record.supplier?.name ?? "-",
    createdAt: toInputDateTime(new Date(record.voucherDate)),
    note: record.note || "",
    status: record.status,
    lines: record.lines.map((line) => ({
      id: line.id,
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
  });

  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedProductCategory, setSelectedProductCategory] =
    useState("Hamisi");
  const [selectedSupplierCategory, setSelectedSupplierCategory] =
    useState("Hamisi");
  const [currentPage, setCurrentPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [supplierPage, setSupplierPage] = useState(1);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [voucherMounted, setVoucherMounted] = useState(false);
  const [voucherVisible, setVoucherVisible] = useState(false);
  const [productMounted, setProductMounted] = useState(false);
  const [productVisible, setProductVisible] = useState(false);
  const [supplierMounted, setSupplierMounted] = useState(false);
  const [supplierVisible, setSupplierVisible] = useState(false);
  const skipNextModalDataEffectRef = useRef(false);

  const [form, setForm] = useState<Omit<Voucher, "id" | "status">>({
    serialNo: nextVoucherNo(),
    type: "alis",
    branch: "",
    warehouse: "",
    supplierId: 0,
    createdAt: nowInputDateTime(),
    note: "",
    lines: [],
  });

  const totalPages = serverTotalPages;
  const paginatedVouchers = vouchers;

  const productMap = useMemo(
    () =>
      new Map(
        Object.values(productLookup).map((product) => [product.id, product]),
      ),
    [productLookup],
  );

  const productCategories = useMemo(
    () => productCategorySummary.map((item) => item.name),
    [productCategorySummary],
  );

  const supplierCategories = useMemo(
    () => supplierCategorySummary.map((item) => item.name),
    [supplierCategorySummary],
  );

  const productCategoryCounts = useMemo(() => {
    return new Map(
      productCategorySummary.map((item) => [item.name, item.count]),
    );
  }, [productCategorySummary]);

  const supplierCategoryCounts = useMemo(() => {
    return new Map(
      supplierCategorySummary.map((item) => [item.name, item.count]),
    );
  }, [supplierCategorySummary]);

  const formTotal = form.lines.reduce(
    (acc, line) => acc + line.quantity * line.unitPrice,
    0,
  );

  const productTotalPages = productServerTotalPages;
  const paginatedProductResults = products;
  const supplierTotalPages = supplierServerTotalPages;
  const paginatedSupplierResults = suppliers;

  const branchSelectOptions = useMemo(() => {
    const options = branchOptions.map((branch) => ({
      value: branch.name,
      label: branch.name,
    }));

    if (
      form.branch &&
      !options.some((option) => option.value === form.branch)
    ) {
      options.unshift({ value: form.branch, label: form.branch });
    }

    return options;
  }, [branchOptions, form.branch]);

  const warehouseSelectOptions = useMemo(() => {
    const options = (warehouseByBranch[form.branch] ?? []).map((warehouse) => ({
      value: warehouse,
      label: warehouse,
    }));

    if (
      form.warehouse &&
      !options.some((option) => option.value === form.warehouse)
    ) {
      options.unshift({ value: form.warehouse, label: form.warehouse });
    }

    return options;
  }, [form.branch, form.warehouse, warehouseByBranch]);

  const branchIdByName = useMemo(
    () =>
      new Map(branchOptions.map((branch) => [branch.name, branch.id] as const)),
    [branchOptions],
  );

  useEffect(() => {
    if (isVoucherOpen) {
      setVoucherMounted(true);
      let raf2: number;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVoucherVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setVoucherVisible(false);
    const timer = setTimeout(() => setVoucherMounted(false), 300);
    return () => clearTimeout(timer);
  }, [isVoucherOpen]);

  useEffect(() => {
    if (isProductOpen) {
      setProductMounted(true);
      setSelectedProductCategory("Hamisi");
      setProductPage(1);
      let raf2: number;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setProductVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setProductVisible(false);
    const timer = setTimeout(() => setProductMounted(false), 320);
    return () => clearTimeout(timer);
  }, [isProductOpen]);

  useEffect(() => {
    if (isSupplierOpen) {
      setSupplierMounted(true);
      setSelectedSupplierCategory("Hamisi");
      setSupplierPage(1);
      let raf2: number;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setSupplierVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setSupplierVisible(false);
    const timer = setTimeout(() => setSupplierMounted(false), 320);
    return () => clearTimeout(timer);
  }, [isSupplierOpen]);

  useEffect(() => {
    if (!companyId) return;

    const loadData = async () => {
      try {
        setPageError(null);

        const vouchersData = await fetchPurchaseVouchers(
          companyId,
          currentPage,
          ITEMS_PER_PAGE,
          searchTerm,
        );
        setVouchers(vouchersData.data.map(toVoucher));
        setTotalRows(vouchersData.total);
        setServerTotalPages(vouchersData.totalPages);
      } catch (error) {
        setPageError((error as Error).message);
      }
    };

    loadData();
  }, [companyId, currentPage, searchTerm]);

  const ensureModalDataLoaded = async () => {
    if (!companyId) {
      return {
        suppliers: [] as Supplier[],
        products: [] as Product[],
        warehouseMap: {} as Record<string, string[]>,
      };
    }

    setModalDataLoading(true);
    const modalData = await fetchPurchaseModalData(companyId, {
      productPage,
      productLimit: MODAL_ITEMS_PER_PAGE,
      productSearch,
      productCategory: selectedProductCategory,
      supplierPage,
      supplierLimit: MODAL_ITEMS_PER_PAGE,
      supplierSearch,
      supplierCategory: selectedSupplierCategory,
    });

    const mappedSuppliers: Supplier[] = modalData.suppliers.data.map(
      (supplier) => ({
        id: supplier.id,
        name: supplier.name,
        category:
          supplier.status === "inactive"
            ? "Pasif"
            : supplier.totalPurchase > 100000
              ? "Stratejik"
              : "Genel",
      }),
    );

    const mappedProducts: Product[] = modalData.products.data.map(
      (product) => ({
        id: product.id,
        code: product.barcode,
        name: product.name,
        category: product.parentCategory?.name || "Diger",
        unit: product.stockUnit || "adet",
        purchasePrice: product.purchasePrice ?? 0,
        stock: product.companyStockQuantity ?? product.stockQuantity ?? 0,
      }),
    );

    const nextWarehouseByBranch: Record<string, string[]> = {};
    (modalData.warehouses as PurchaseModalWarehouse[]).forEach((warehouse) => {
      const branchName = warehouse.branch.name;
      if (!nextWarehouseByBranch[branchName]) {
        nextWarehouseByBranch[branchName] = [];
      }
      nextWarehouseByBranch[branchName].push(warehouse.name);
    });

    setSupplierOptions(mappedSuppliers);
    setProductOptions(mappedProducts);
    setWarehouseByBranch(nextWarehouseByBranch);
    setProductCategorySummary(modalData.productCategories);
    setSupplierCategorySummary(modalData.supplierCategories);
    setProductTotalRows(modalData.products.total);
    setProductServerTotalPages(modalData.products.totalPages);
    setSupplierTotalRows(modalData.suppliers.total);
    setSupplierServerTotalPages(modalData.suppliers.totalPages);
    setSupplierLookup((prev) => {
      const next = { ...prev };
      mappedSuppliers.forEach((supplier) => {
        next[supplier.id] = supplier;
      });
      return next;
    });
    setProductLookup((prev) => {
      const next = { ...prev };
      mappedProducts.forEach((product) => {
        next[product.id] = product;
      });
      return next;
    });
    setModalDataLoading(false);

    return {
      suppliers: mappedSuppliers,
      products: mappedProducts,
      warehouseMap: nextWarehouseByBranch,
    };
  };

  useEffect(() => {
    if (!isVoucherOpen || !companyId) return;

    if (skipNextModalDataEffectRef.current) {
      skipNextModalDataEffectRef.current = false;
      return;
    }

    void ensureModalDataLoaded().catch((error) => {
      setPageError((error as Error).message);
      setModalDataLoading(false);
    });
  }, [
    isVoucherOpen,
    companyId,
    productPage,
    supplierPage,
    productSearch,
    supplierSearch,
    selectedProductCategory,
    selectedSupplierCategory,
  ]);

  useEffect(() => {
    if (branchOptions.length === 0) return;

    setForm((prev) => {
      const hasBranch = branchOptions.some(
        (branch) => branch.name === prev.branch,
      );
      const nextBranch = hasBranch ? prev.branch : branchOptions[0].name;
      const warehouseList = warehouseByBranch[nextBranch] ?? [];

      const hasWarehouse = warehouseList.includes(prev.warehouse);
      const nextWarehouse = hasWarehouse
        ? prev.warehouse
        : (warehouseList[0] ?? "");

      if (prev.branch === nextBranch && prev.warehouse === nextWarehouse) {
        return prev;
      }

      return {
        ...prev,
        branch: nextBranch,
        warehouse: nextWarehouse,
      };
    });
  }, [branchOptions, warehouseByBranch]);

  useEffect(() => {
    if (suppliers.length === 0) return;

    setForm((prev) => {
      const exists = suppliers.some(
        (supplier) => supplier.id === prev.supplierId,
      );
      if (exists) return prev;
      return { ...prev, supplierId: suppliers[0].id };
    });
  }, [suppliers]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (productPage > productTotalPages) {
      setProductPage(productTotalPages);
    }
  }, [productPage, productTotalPages]);

  useEffect(() => {
    if (supplierPage > supplierTotalPages) {
      setSupplierPage(supplierTotalPages);
    }
  }, [supplierPage, supplierTotalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetForm = (type: VoucherType = "alis") => {
    const branch = branchOptions[0]?.name ?? "";
    const warehouses = warehouseByBranch[branch] ?? [];
    setForm({
      serialNo: nextVoucherNo(),
      type,
      branch,
      warehouse: warehouses[0] ?? "",
      supplierId: suppliers[0]?.id ?? 0,
      createdAt: nowInputDateTime(),
      note: "",
      lines: [],
    });
    setEditingId(null);
    setModalError(null);
  };

  const openNewVoucher = (type: VoucherType) => {
    void (async () => {
      try {
        const referenceData = await ensureModalDataLoaded();
        const nextBranch = branchOptions[0]?.name ?? "";
        const warehouses = referenceData.warehouseMap[nextBranch] ?? [];
        skipNextModalDataEffectRef.current = true;
        setForm({
          serialNo: nextVoucherNo(),
          type,
          branch: nextBranch,
          warehouse: warehouses[0] ?? "",
          supplierId: referenceData.suppliers[0]?.id ?? 0,
          createdAt: nowInputDateTime(),
          note: "",
          lines: [],
        });
        setEditingId(null);
        setModalError(null);
        setIsVoucherOpen(true);
      } catch (error) {
        setPageError((error as Error).message);
      }
    })();
  };

  const openEditVoucher = (voucher: Voucher) => {
    void (async () => {
      try {
        await ensureModalDataLoaded();
        skipNextModalDataEffectRef.current = true;
        setEditingId(voucher.id);
        setForm({
          serialNo: voucher.serialNo,
          type: voucher.type,
          branch: voucher.branch,
          warehouse: voucher.warehouse,
          supplierId: voucher.supplierId,
          createdAt: voucher.createdAt,
          note: voucher.note,
          lines: voucher.lines,
        });
        setModalError(null);
        setIsVoucherOpen(true);
      } catch (error) {
        setPageError((error as Error).message);
      }
    })();
  };

  const handleBranchChange = (branch: string) => {
    const options = warehouseByBranch[branch] ?? [];
    setForm((prev) => ({
      ...prev,
      branch,
      warehouse: options[0] ?? "",
    }));
  };

  const addProductToVoucher = (product: Product) => {
    setForm((prev) => {
      const existing = prev.lines.find((line) => line.productId === product.id);
      if (existing) {
        return {
          ...prev,
          lines: prev.lines.map((line) =>
            line.productId === product.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          ),
        };
      }

      const nextId = prev.lines.length
        ? Math.max(...prev.lines.map((line) => line.id)) + 1
        : 1;
      return {
        ...prev,
        lines: [
          ...prev.lines,
          {
            id: nextId,
            productId: product.id,
            quantity: 1,
            unitPrice: product.purchasePrice,
          },
        ],
      };
    });
    setIsProductOpen(false);
    setProductSearch("");
  };

  const selectSupplier = (supplierId: number) => {
    setForm((prev) => ({ ...prev, supplierId }));
    setIsSupplierOpen(false);
    setSupplierSearch("");
  };

  const updateLine = (
    lineId: number,
    field: "quantity" | "unitPrice",
    value: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === lineId ? { ...line, [field]: value } : line,
      ),
    }));
  };

  const removeLine = (lineId: number) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((line) => line.id !== lineId),
    }));
  };

  const saveVoucher = async () => {
    if (
      !form.branch ||
      !form.warehouse ||
      !form.supplierId ||
      !form.createdAt
    ) {
      setModalError("Filial, anbar, tedarikci ve tarih secimi zorunludur.");
      return;
    }

    if (form.lines.length === 0) {
      setModalError("Sened icine en az bir urun eklemelisin.");
      return;
    }

    if (!companyId) {
      setModalError("companyId bulunamadi. Lutfen yeniden giris yapin.");
      return;
    }

    try {
      setSaveLoading(true);
      setModalError(null);

      const payload = {
        serialNo: form.serialNo,
        type: form.type,
        branchName: form.branch,
        warehouseName: form.warehouse,
        supplierId: form.supplierId,
        companyId,
        voucherDate: new Date(form.createdAt).toISOString(),
        note: form.note,
        status: "Tamamlandı",
        lines: form.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      };

      if (editingId) {
        await updatePurchaseVoucher(editingId, payload);
      } else {
        await createPurchaseVoucher(payload);
      }

      const refreshed = await fetchPurchaseVouchers(
        companyId,
        currentPage,
        ITEMS_PER_PAGE,
        searchTerm,
      );
      setVouchers(refreshed.data.map(toVoucher));
      setTotalRows(refreshed.total);
      setServerTotalPages(refreshed.totalPages);

      setIsVoucherOpen(false);
      resetForm();
    } catch (error) {
      setModalError((error as Error).message);
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteVoucher = async () => {
    if (!editingId || !companyId) return;
    try {
      setDeleteLoading(true);
      setModalError(null);
      await deletePurchaseVoucher(editingId, companyId);
      const refreshed = await fetchPurchaseVouchers(
        companyId,
        currentPage,
        ITEMS_PER_PAGE,
        searchTerm,
      );
      setVouchers(refreshed.data.map(toVoucher));
      setTotalRows(refreshed.total);
      setServerTotalPages(refreshed.totalPages);
      setIsVoucherOpen(false);
      resetForm();
      setDeleteConfirm(false);
    } catch (error) {
      setModalError((error as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              placeholder="Sened no / tedarikci / filial ara..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-80"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openNewVoucher("alis")}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Alis Senedi
            </button>
            <button
              type="button"
              onClick={() => openNewVoucher("iade")}
              className="rounded bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              + Iade Senedi
            </button>
          </div>
        </div>
        {pageError && <p className="mt-2 text-sm text-red-600">{pageError}</p>}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full min-w-[1180px] table-fixed border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="w-28 border-b border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                Sened No
              </th>
              <th className="w-20 border-b border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                Tip
              </th>
              <th className="w-40 border-b border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                Tedarikci
              </th>
              <th className="w-36 border-b border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                Filial
              </th>
              <th className="w-36 border-b border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                Anbar
              </th>
              <th className="w-48 border-b border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                Tarih Saat
              </th>
              <th className="w-20 border-b border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                Kalem
              </th>
              <th className="w-28 border-b border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                Toplam
              </th>
              <th className="w-24 border-b border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                Durum
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedVouchers.map((voucher) => {
              const total = voucher.lines.reduce(
                (acc, line) => acc + line.quantity * line.unitPrice,
                0,
              );
              return (
                <tr
                  key={voucher.id}
                  onClick={() => openEditVoucher(voucher)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="w-28 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-center text-sm font-medium text-gray-900">
                    {voucher.serialNo}
                  </td>
                  <td className="w-20 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-center text-sm text-gray-700">
                    {voucher.type === "alis" ? "Alis" : "Iade"}
                  </td>
                  <td className="w-40 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-center text-sm text-gray-700">
                    {voucher.supplierName}
                  </td>
                  <td className="w-36 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-center text-sm text-gray-700">
                    {voucher.branch}
                  </td>
                  <td className="w-36 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-center text-sm text-gray-700">
                    {voucher.warehouse}
                  </td>
                  <td className="w-48 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-center text-sm text-gray-700">
                    {formatDateTime(voucher.createdAt)}
                  </td>
                  <td className="w-20 px-3 py-2 text-center text-sm text-gray-700">
                    {voucher.lines.length}
                  </td>
                  <td className="w-28 px-3 py-2 text-center text-sm font-semibold text-blue-700">
                    {formatCurrency(total)}
                  </td>
                  <td className="w-24 px-3 py-2 text-center text-sm text-gray-700">
                    {voucher.status}
                  </td>
                </tr>
              );
            })}
            {paginatedVouchers.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  Kayit bulunamadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Toplam Satır: {totalRows}
          </span>

          <div className="flex items-center gap-1">
            <button
              className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Önceki
            </button>

            {buildVisiblePages(currentPage, totalPages).map((page, index) =>
              page === -1 ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-1 text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  className={`px-3 py-1 rounded border ${
                    currentPage === page
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>

      {voucherMounted && (
        <div
          className="fixed inset-0 z-[1100] flex justify-end"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black transition-opacity duration-300"
            style={{ opacity: voucherVisible ? 0.45 : 0 }}
            onClick={() => setIsVoucherOpen(false)}
          />

          <div
            className="relative flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl transition-all duration-300 ease-in-out"
            style={{
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
              transform: voucherVisible ? "translateX(0)" : "translateX(100%)",
              opacity: voucherVisible ? 1 : 0,
            }}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {editingId ? "Sened Duzenle" : "Yeni Sened"} -{" "}
                {form.type === "alis" ? "Alis" : "Iade"}
              </h2>
              <button
                type="button"
                onClick={() => setIsVoucherOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Sened No</span>
                  <input
                    value={form.serialNo}
                    readOnly
                    className="rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Filial</span>
                  <Select
                    value={form.branch}
                    options={branchSelectOptions}
                    onChange={handleBranchChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Anbar</span>
                  <Select
                    value={form.warehouse}
                    options={warehouseSelectOptions}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        warehouse: value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Tedarikci</span>
                  <div className="flex items-center gap-2">
                    <input
                      value={supplierName(form.supplierId)}
                      readOnly
                      className="flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSupplierOpen(true)}
                      className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Sec
                    </button>
                  </div>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Tarih Saat</span>
                  <input
                    type="datetime-local"
                    step={1}
                    value={form.createdAt}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        createdAt: e.target.value,
                      }))
                    }
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1 md:col-span-3">
                  <span className="text-sm font-medium">Aciklama</span>
                  <input
                    value={form.note}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Opsiyonel not"
                  />
                </label>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold">Sened Urunleri</h3>
                  <button
                    type="button"
                    onClick={() => setIsProductOpen(true)}
                    className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    + Urun Sec
                  </button>
                </div>

                <div className="overflow-x-hidden rounded border border-gray-200">
                  <table className="w-full table-fixed border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-24 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Kod
                        </th>
                        <th className="w-64 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Urun
                        </th>
                        <th className="w-24 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Birim
                        </th>
                        <th className="w-32 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Miktar
                        </th>
                        <th className="w-32 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Birim Fiyat
                        </th>
                        <th className="w-32 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Tutar
                        </th>
                        <th className="w-24 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          Islem
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {form.lines.map((line) => {
                        const product = productMap.get(line.productId);
                        if (!product) return null;
                        const rowTotal = line.quantity * line.unitPrice;
                        return (
                          <tr key={line.id}>
                            <td className="w-24 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-700">
                              {product.code}
                            </td>
                            <td className="w-64 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-700">
                              {product.name}
                            </td>
                            <td className="w-24 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-700">
                              {product.unit}
                            </td>
                            <td className="w-32 px-3 py-2 text-sm">
                              <input
                                type="number"
                                min={1}
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(
                                    line.id,
                                    "quantity",
                                    Math.max(1, Number(e.target.value) || 1),
                                  )
                                }
                                className={`w-24 ${numberInputClass}`}
                              />
                            </td>
                            <td className="w-32 px-3 py-2 text-sm">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={line.unitPrice}
                                onChange={(e) =>
                                  updateLine(
                                    line.id,
                                    "unitPrice",
                                    Math.max(0, Number(e.target.value) || 0),
                                  )
                                }
                                className={`w-28 ${numberInputClass}`}
                              />
                            </td>
                            <td className="w-32 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm font-semibold text-blue-700">
                              {formatCurrency(rowTotal)}
                            </td>
                            <td className="w-24 px-3 py-2 text-sm">
                              <button
                                type="button"
                                onClick={() => removeLine(line.id)}
                                className="rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200"
                              >
                                Sil
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {form.lines.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-6 text-center text-sm text-gray-500"
                          >
                            Henuz urun secilmedi. Urun Sec butonundan secim yap.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex justify-end">
                  <div className="rounded bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                    Toplam: {formatCurrency(formTotal)}
                  </div>
                </div>

                {modalError && (
                  <p className="mt-3 text-sm text-red-600">{modalError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
              <div>
                {editingId &&
                  (deleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600 font-medium">
                        Emin misiniz?
                      </span>
                      <button
                        type="button"
                        onClick={deleteVoucher}
                        disabled={deleteLoading}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {deleteLoading ? "Siliniyor..." : "Evet, Sil"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(false)}
                        className="rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300"
                      >
                        Vazgeç
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      className="rounded bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                    >
                      Senedi Sil
                    </button>
                  ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsVoucherOpen(false);
                    setDeleteConfirm(false);
                  }}
                  className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
                >
                  Iptal
                </button>
                <button
                  type="button"
                  onClick={saveVoucher}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={saveLoading}
                >
                  {saveLoading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {productMounted && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsProductOpen(false)}
        >
          <div
            className="absolute inset-0 bg-slate-950/70 transition-all duration-300"
            style={{
              opacity: productVisible ? 1 : 0,
              backdropFilter: productVisible ? "blur(5px)" : "blur(0px)",
            }}
          />

          <div
            className="relative z-10 rounded-xl bg-white shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: productVisible
                ? "perspective(1200px) translateY(0) scale(1) rotateX(0deg)"
                : "perspective(1200px) translateY(18px) scale(0.96) rotateX(4deg)",
              opacity: productVisible ? 1 : 0,
              width: "980px",
              height: "620px",
              transformOrigin: "top center",
              boxShadow: productVisible
                ? "0 32px 80px rgba(15, 23, 42, 0.28)"
                : "0 18px 48px rgba(15, 23, 42, 0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Urun Sec
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Senede eklenecek urunleri kategori ve arama ile sec.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <div className="flex h-[calc(100%-81px)] min-h-0 flex-col px-5 py-4">
              <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)] gap-4">
                <aside className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-gray-50/80 p-3">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Kategoriler
                  </h4>
                  <div className="space-y-1 overflow-auto pr-1">
                    {productCategories.map((category) => {
                      const isActive = selectedProductCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedProductCategory(category);
                            setProductPage(1);
                          }}
                          className={`flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm transition ${
                            isActive
                              ? "bg-blue-100 font-semibold text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span>{category}</span>
                          <span className="text-xs text-gray-500">
                            {productCategoryCounts.get(category) ?? 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="flex min-h-0 min-w-0 flex-col rounded-xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <input
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setProductPage(1);
                        }}
                        placeholder="Urun adi veya kod ara..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 lg:max-w-sm"
                      />
                      <div className="text-sm text-gray-500">
                        Toplam Urun:{" "}
                        <span className="font-semibold text-gray-800">
                          {productTotalRows}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[1040px] table-fixed border-collapse">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          <th className="w-24 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Kod
                          </th>
                          <th className="w-72 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Urun
                          </th>
                          <th className="w-48 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Kategori
                          </th>
                          <th className="w-24 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Birim
                          </th>
                          <th className="w-32 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Alis Fiyati
                          </th>
                          <th className="w-24 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Stok
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {modalDataLoading &&
                          paginatedProductResults.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-3 py-10 text-center text-sm text-gray-500"
                              >
                                Urunler yukleniyor...
                              </td>
                            </tr>
                          )}
                        {paginatedProductResults.map((product) => (
                          <tr
                            key={product.id}
                            className="cursor-pointer transition-colors hover:bg-blue-50"
                            onClick={() => addProductToVoucher(product)}
                          >
                            <td className="w-24 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-700">
                              {product.code}
                            </td>
                            <td className="w-72 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-700">
                              {product.name}
                            </td>
                            <td className="w-48 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-600">
                              {product.category}
                            </td>
                            <td className="w-24 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-700">
                              {product.unit}
                            </td>
                            <td className="w-32 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm font-medium text-blue-700">
                              {formatCurrency(product.purchasePrice)}
                            </td>
                            <td className="w-24 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-700">
                              {product.stock}
                            </td>
                          </tr>
                        ))}
                        {!modalDataLoading &&
                          paginatedProductResults.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-3 py-8 text-center text-sm text-gray-500"
                              >
                                Aramaya uygun urun bulunamadi.
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
                    <span className="text-sm text-gray-600">
                      Sayfa {productPage} / {productTotalPages}
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        className="rounded border bg-white px-3 py-1 text-sm text-gray-700 disabled:opacity-50"
                        onClick={() =>
                          setProductPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={productPage === 1}
                      >
                        Önceki
                      </button>
                      {buildVisiblePages(productPage, productTotalPages).map(
                        (page, index) =>
                          page === -1 ? (
                            <span
                              key={`product-ellipsis-${index}`}
                              className="px-2 text-gray-400"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={`product-page-${page}`}
                              type="button"
                              className={`rounded border px-3 py-1 text-sm ${
                                productPage === page
                                  ? "bg-blue-500 text-white"
                                  : "bg-white text-gray-700"
                              }`}
                              onClick={() => setProductPage(page)}
                            >
                              {page}
                            </button>
                          ),
                      )}
                      <button
                        type="button"
                        className="rounded border bg-white px-3 py-1 text-sm text-gray-700 disabled:opacity-50"
                        onClick={() =>
                          setProductPage((prev) =>
                            Math.min(prev + 1, productTotalPages),
                          )
                        }
                        disabled={productPage === productTotalPages}
                      >
                        Sonraki
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {supplierMounted && (
        <div
          className="fixed inset-0 z-[1210] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsSupplierOpen(false)}
        >
          <div
            className="absolute inset-0 bg-slate-950/70 transition-all duration-300"
            style={{
              opacity: supplierVisible ? 1 : 0,
              backdropFilter: supplierVisible ? "blur(5px)" : "blur(0px)",
            }}
          />

          <div
            className="relative z-10 rounded-xl bg-white shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: supplierVisible
                ? "perspective(1200px) translateY(0) scale(1) rotateX(0deg)"
                : "perspective(1200px) translateY(18px) scale(0.96) rotateX(4deg)",
              opacity: supplierVisible ? 1 : 0,
              width: "980px",
              height: "620px",
              transformOrigin: "top center",
              boxShadow: supplierVisible
                ? "0 32px 80px rgba(15, 23, 42, 0.28)"
                : "0 18px 48px rgba(15, 23, 42, 0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-base font-semibold">Tedarikci Sec</h3>
              <button
                type="button"
                onClick={() => setIsSupplierOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <div className="h-[calc(620px-58px)] px-5 py-4">
              <div className="grid h-full grid-cols-[240px_minmax(0,1fr)] gap-4">
                <aside className="h-full overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Kategoriler
                  </h4>
                  <div className="space-y-1 overflow-auto pr-1">
                    {supplierCategories.map((category) => {
                      const isActive = selectedSupplierCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedSupplierCategory(category);
                            setSupplierPage(1);
                          }}
                          className={`flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm transition ${
                            isActive
                              ? "bg-emerald-100 font-semibold text-emerald-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span>{category}</span>
                          <span className="text-xs text-gray-500">
                            {supplierCategoryCounts.get(category) ?? 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="flex min-h-0 min-w-0 flex-col rounded-xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <input
                        value={supplierSearch}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value);
                          setSupplierPage(1);
                        }}
                        placeholder="Tedarikci ara..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 lg:max-w-sm"
                      />
                      <div className="text-sm text-gray-500">
                        Toplam Tedarikci:{" "}
                        <span className="font-semibold text-gray-800">
                          {supplierTotalRows}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[760px] table-fixed border-collapse">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          <th className="w-20 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            ID
                          </th>
                          <th className="w-96 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Tedarikci Adi
                          </th>
                          <th className="w-64 border-b px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Kategori
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {modalDataLoading &&
                          paginatedSupplierResults.length === 0 && (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-3 py-10 text-center text-sm text-gray-500"
                              >
                                Tedarikciler yukleniyor...
                              </td>
                            </tr>
                          )}
                        {paginatedSupplierResults.map((supplier) => (
                          <tr
                            key={supplier.id}
                            className="cursor-pointer transition-colors hover:bg-emerald-50"
                            onClick={() => selectSupplier(supplier.id)}
                          >
                            <td className="w-20 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-700">
                              {supplier.id}
                            </td>
                            <td className="w-96 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm font-medium text-gray-800">
                              {supplier.name}
                            </td>
                            <td className="w-64 whitespace-nowrap overflow-hidden text-ellipsis px-3 py-2 text-sm text-gray-600">
                              {supplier.category}
                            </td>
                          </tr>
                        ))}
                        {!modalDataLoading &&
                          paginatedSupplierResults.length === 0 && (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-3 py-8 text-center text-sm text-gray-500"
                              >
                                Aramaya uygun tedarikci bulunamadi.
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
                    <span className="text-sm text-gray-600">
                      Sayfa {supplierPage} / {supplierTotalPages}
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        className="rounded border bg-white px-3 py-1 text-sm text-gray-700 disabled:opacity-50"
                        onClick={() =>
                          setSupplierPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={supplierPage === 1}
                      >
                        Önceki
                      </button>
                      {buildVisiblePages(supplierPage, supplierTotalPages).map(
                        (page, index) =>
                          page === -1 ? (
                            <span
                              key={`supplier-ellipsis-${index}`}
                              className="px-2 text-gray-400"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={`supplier-page-${page}`}
                              type="button"
                              className={`rounded border px-3 py-1 text-sm ${
                                supplierPage === page
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white text-gray-700"
                              }`}
                              onClick={() => setSupplierPage(page)}
                            >
                              {page}
                            </button>
                          ),
                      )}
                      <button
                        type="button"
                        className="rounded border bg-white px-3 py-1 text-sm text-gray-700 disabled:opacity-50"
                        onClick={() =>
                          setSupplierPage((prev) =>
                            Math.min(prev + 1, supplierTotalPages),
                          )
                        }
                        disabled={supplierPage === supplierTotalPages}
                      >
                        Sonraki
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
