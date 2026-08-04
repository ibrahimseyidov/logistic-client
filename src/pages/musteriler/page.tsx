"use client";

import { useEffect, useMemo, useState, useRef, type ChangeEvent, type Dispatch, type SetStateAction, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import styles from "./musteriler.module.css";
import sorguLayoutStyles from "../sorgular/sorgular.module.css";
import sorguActionBarStyles from "../sorgular/components/SorgularActionBar.module.css";
import sorguTableStyles from "../sorgular/components/SorgularTable.module.css";
import Select from "../../common/components/select/Select";
import type { SelectOption } from "../../common/components/select/Select";
import { buildApiUrl } from "../../common/utils/fetch.utils";
import { type CustomerRow } from "./data";
import { FiFilePlus, FiFilter, FiSearch, FiX } from "react-icons/fi";
import { FaEdit, FaTrash } from "react-icons/fa";
import { usePermissions } from "../../common/hooks/usePermissions";
import {
  FilterDateField,
  FilterDrawer,
  FilterGrid,
  FilterSection,
  FilterSelectField,
  FilterTextField,
} from "../../common/components/filters";
import {
  fetchCustomersAction,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  uploadCustomerDocumentFileAction,
} from "../../common/actions/customer.actions";
import { fetchContactPersonsAction, ContactPersonRow, createContactPersonAction, deleteContactPersonAction, updateContactPersonAction } from "../../common/actions/contact.actions";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { ConfirmModal } from "../../common/components/ConfirmModal";
import { fetchQueriesAction } from "../../common/actions/query.actions";
import { fetchOrdersAction } from "../../common/actions/order.actions";
import { fetchUsersAction, UserRow } from "../../common/actions/user.actions";
import {
  daysSinceActivityDate,
  formatActivityDate,
  getLastCustomerActivityDate,
  matchesCustomerEntity,
} from "../../common/utils/entityActivity.utils";
import { fetchLookupAction, LookupRow } from "../../common/actions/lookup.actions";
import { LookupManagerModal } from "../../common/components/modal/LookupManagerModal";
import { ContactPersonManagerModal } from "../../common/components/modal/ContactPersonManagerModal";
import type { ContactPersonFormData } from "../../common/components/modal/ContactPersonFormModal";
import {
  displayFieldValue,
  mergeCarrierFormContacts,
  isPersistedContactPerson,
  scopeEntityContacts,
  normalizeCarrierContacts,
  contactPersonIdsFromList,
  parseCarrierDocuments,
  serializeCarrierDocuments,
  uploadPendingCarrierDocuments,
  type CarrierDocumentItem,
} from "../../common/utils/carrierDisplay.utils";
import { COUNTRY_OPTIONS } from "../sorgular/constants/options.constants";

const PLACEHOLDER: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

type LookupModalType = "customer-types" | "activity-types" | "countries";

const STATUS_OPTIONS: SelectOption[] = [
  ...PLACEHOLDER,
  { value: "pending", label: "Gözləmədə" },
  { value: "paid", label: "Ödənilib" },
  { value: "error", label: "Xəta" },
];

function toLookupOptions(data: LookupRow[]): SelectOption[] {
  return [
    ...PLACEHOLDER,
    ...data.map((row) => ({
      value: row.value,
      label: row.label || row.value,
    })),
  ];
}

function getLookupLabel(value: string, options: SelectOption[]): string {
  if (!value) return "";
  const option = options.find((x) => x.value === value);
  if (!option || !option.value) return "";
  return option.label || value;
}

function resolveLookupValue(stored: string, data: LookupRow[]): string {
  const trimmed = String(stored ?? "").trim();
  if (!trimmed || trimmed === "Dəyəri seçin") return "";
  const byLabel = data.find((x) => x.label === trimmed || x.value === trimmed);
  return byLabel?.value || trimmed;
}

const EMPTY_FORM = {
  company: "",
  shortName: "",
  customerType: "",
  activityType: "",
  voen: "",
  manager: "",
  contactPersons: [] as ContactPersonRow[],
  contactPerson: "",
  contactInfo: "",
  address: "",
  country: "AZ",
  documents: [] as CarrierDocumentItem[],
};

export default function MusterilerPage() {
  const dispatch = useAppDispatch();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const allowCreate = canCreate("musteriler", "list");
  const allowEdit = canEdit("musteriler", "list");
  const allowDelete = canDelete("musteriler", "list");
  const PAGE_SIZE = 12;
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<"filter" | "new" | "edit" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [inlineDeleteConfirm, setInlineDeleteConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [isInlineDeleting, setIsInlineDeleting] = useState(false);
  const [customerIdToDelete, setCustomerIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_FORM });
  const [newCustomerTab, setNewCustomerTab] = useState<"main" | "contact">("main");
  const [filterDraft, setFilterDraft] = useState({
    author: "",
    counterparty: "",
    status: "",
    customerType: "",
    documentNo: "",
    registerNo: "",
    dateFrom: "",
    dateTo: "",
    daysSinceLastContact: "",
  });
  const [appliedFilter, setAppliedFilter] = useState({
    author: "",
    counterparty: "",
    status: "",
    customerType: "",
    documentNo: "",
    registerNo: "",
    dateFrom: "",
    dateTo: "",
    daysSinceLastContact: "",
  });
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [documentDraft, setDocumentDraft] = useState({ number: "", documentType: "", date: "" });
  const [isDocumentUploading, setIsDocumentUploading] = useState(false);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const documentFormSetterRef = useRef<Dispatch<SetStateAction<typeof EMPTY_FORM>> | null>(null);
  const pendingDocumentFilesRef = useRef<Map<string, File>>(new Map());
  
  const [availableContacts, setAvailableContacts] = useState<ContactPersonRow[]>([]);
  const [usersData, setUsersData] = useState<UserRow[]>([]);
  const [customerTypesData, setCustomerTypesData] = useState<LookupRow[]>([]);
  const [activityTypesData, setActivityTypesData] = useState<LookupRow[]>([]);
  const [countriesData, setCountriesData] = useState<LookupRow[]>([]);
  const [activeLookupModal, setActiveLookupModal] = useState<LookupModalType | null>(null);
  const lookupOpenFromPlusRef = useRef(false);

  const customerTypeOptions = useMemo(
    () => toLookupOptions(customerTypesData),
    [customerTypesData],
  );

  const activityTypeOptions = useMemo(
    () => toLookupOptions(activityTypesData),
    [activityTypesData],
  );

  const countryOptions = useMemo(
    () => toLookupOptions(countriesData),
    [countriesData],
  );

  const loadCustomerTypes = async () => {
    try {
      const data = await fetchLookupAction("customer-types");
      setCustomerTypesData(data);
    } catch {
      setCustomerTypesData([]);
    }
  };

  const loadActivityTypes = async () => {
    try {
      const data = await fetchLookupAction("activity-types");
      setActivityTypesData(data);
    } catch {
      setActivityTypesData([]);
    }
  };

  const loadCountries = async () => {
    try {
      const data = await fetchLookupAction("countries");
      setCountriesData(data);
    } catch {
      setCountriesData(COUNTRY_OPTIONS.map((option) => ({
        id: option.value,
        value: option.value,
        label: option.label,
      })));
    }
  };
  
  useEffect(() => {
    fetchContactPersonsAction({ entityType: "customer" }).then(setAvailableContacts).catch(() => {});
    fetchUsersAction().then(setUsersData).catch(() => {});
    loadCustomerTypes();
    loadActivityTypes();
    loadCountries();
  }, []);

  const handleLookupDataChanged = (data: LookupRow[]) => {
    if (activeLookupModal === "customer-types") {
      setCustomerTypesData(data);
    } else if (activeLookupModal === "activity-types") {
      setActivityTypesData(data);
    } else if (activeLookupModal === "countries") {
      setCountriesData(data);
    }
  };

  const openLookupModal = (
    event: MouseEvent<HTMLButtonElement>,
    type: LookupModalType,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!lookupOpenFromPlusRef.current) return;
    lookupOpenFromPlusRef.current = false;
    setActiveLookupModal(type);
  };

  const handleLookupSelectOpen = () => {
    lookupOpenFromPlusRef.current = false;
    setActiveLookupModal(null);
  };

  const armLookupOpenFromPlus = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    lookupOpenFromPlusRef.current = true;
  };

  const userOpts = [
    { value: "", label: "Menecer seçin" },
    ...usersData.map((u) => ({ value: String(u.id), label: u.name })),
  ];

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleCreateContactPerson = async (data: ContactPersonFormData) => {
    try {
      const currentForm = activePanel === "new" ? newForm : editForm;
      const entityId = activePanel === "edit" ? editingCustomerId : undefined;
      const contactOptions = {
        mode: activePanel === "new" ? ("new" as const) : ("edit" as const),
        entityId: entityId || null,
      };

      const newContact = await createContactPersonAction({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        position: data.position,
        company: data.company || currentForm.company || "",
        entityType: "customer",
        entityId: entityId || undefined,
      });

      const nextContactPersons = mergeCarrierFormContacts(
        normalizeCarrierContacts(currentForm.contactPersons, [newContact]),
        normalizeCarrierContacts(availableContacts, [newContact]),
        contactOptions,
      );

      if (activePanel === "edit" && editingCustomerId) {
        await updateCustomerAction(editingCustomerId, {
          contactPersons: nextContactPersons,
          contactPerson: contactPersonIdsFromList(nextContactPersons),
        });
      }

      const setForm = activePanel === "new" ? setNewForm : setEditForm;
      setForm((prev) => ({
        ...prev,
        contactPersons: nextContactPersons,
        contactPerson: contactPersonIdsFromList(nextContactPersons),
      }));

      setAvailableContacts((prev) => normalizeCarrierContacts(prev, [newContact]));

      dispatch(
        showNotification({
          message: "Yeni müştəri əlaqədar şəxs əlavə edildi",
          type: "added",
        }),
      );
    } catch (error) {
      dispatch(
        showNotification({
          message: "Əlaqədar şəxs yaradılarkən xəta baş verdi",
          type: "error",
        }),
      );
      throw error;
    }
  };

  const handleEditContactPerson = async (
    contact: ContactPersonRow,
    data: ContactPersonFormData,
  ) => {
    const setForm = activePanel === "new" ? setNewForm : setEditForm;
    const currentForm = activePanel === "new" ? newForm : editForm;
    const contactOptions = {
      mode: activePanel === "new" ? ("new" as const) : ("edit" as const),
      entityId: activePanel === "edit" ? editingCustomerId : null,
    };
    const scopedAvailable = scopeEntityContacts(availableContacts, contactOptions);
    const mergedContacts = mergeCarrierFormContacts(
      currentForm.contactPersons,
      availableContacts,
      contactOptions,
    );

    try {
      const company = data.company || contact.company || currentForm.company || "";
      let updatedContact: ContactPersonRow = {
        ...contact,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        position: data.position,
        company,
      };

      if (isPersistedContactPerson(contact, scopedAvailable)) {
        updatedContact = await updateContactPersonAction(String(contact.id), {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          position: data.position,
          company,
        });
      }

      const nextContactPersons = mergedContacts.map((item) =>
        String(item.id) === String(contact.id) ? updatedContact : item,
      );

      if (activePanel === "edit" && editingCustomerId) {
        await updateCustomerAction(editingCustomerId, {
          contactPersons: nextContactPersons,
          contactPerson: contactPersonIdsFromList(nextContactPersons),
        });
      }

      setForm((prev) => ({
        ...prev,
        contactPersons: nextContactPersons,
        contactPerson: contactPersonIdsFromList(nextContactPersons),
      }));

      if (isPersistedContactPerson(contact, scopedAvailable)) {
        setAvailableContacts((prev) =>
          prev.map((item) => (String(item.id) === String(contact.id) ? updatedContact : item)),
        );
      }

      dispatch(
        showNotification({
          message: "Əlaqədar şəxs yeniləndi",
          type: "updated",
        }),
      );
    } catch (error) {
      dispatch(
        showNotification({
          message: "Əlaqədar şəxs yenilənərkən xəta baş verdi",
          type: "error",
        }),
      );
      throw error;
    }
  };

  const handleRemoveContactPerson = async (contact: ContactPersonRow, _index: number) => {
    const setForm = activePanel === "new" ? setNewForm : setEditForm;
    const currentForm = activePanel === "new" ? newForm : editForm;
    const mergedContacts = mergeCarrierFormContacts(
      currentForm.contactPersons,
      availableContacts,
      {
        mode: activePanel === "new" ? "new" : "edit",
        entityId: activePanel === "edit" ? editingCustomerId : null,
      },
    );
    const nextContactPersons = mergedContacts.filter(
      (c) => String(c.id) !== String(contact.id),
    );
    const scopedAvailable = scopeEntityContacts(availableContacts, {
      mode: activePanel === "new" ? "new" : "edit",
      entityId: activePanel === "edit" ? editingCustomerId : null,
    });

    try {
      if (isPersistedContactPerson(contact, scopedAvailable)) {
        await deleteContactPersonAction(String(contact.id));
      }

      if (activePanel === "edit" && editingCustomerId) {
        await updateCustomerAction(editingCustomerId, {
          contactPersons: nextContactPersons,
          contactPerson: contactPersonIdsFromList(nextContactPersons),
        });
      }

      setForm((prev) => ({
        ...prev,
        contactPersons: nextContactPersons,
        contactPerson: contactPersonIdsFromList(nextContactPersons),
      }));
      setAvailableContacts((prev) => prev.filter((c) => String(c.id) !== String(contact.id)));

      dispatch(
        showNotification({
          message: "Əlaqədar şəxs silindi",
          type: "deleted",
        }),
      );
    } catch (error) {
      dispatch(
        showNotification({
          message: "Əlaqədar şəxs silinərkən xəta baş verdi",
          type: "error",
        }),
      );
    }
  };
  
  // We don't need a global contactOptions here anymore because it depends on the specific form (newForm/editForm)

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (
        appliedFilter.status &&
        row.salesGroup !==
          STATUS_OPTIONS.find((x) => x.value === appliedFilter.status)?.label
      ) {
        return false;
      }
      if (
        appliedFilter.customerType &&
        row.customerType !== getLookupLabel(appliedFilter.customerType, customerTypeOptions)
      ) {
        return false;
      }
      if (
        appliedFilter.counterparty &&
        !row.company.toLowerCase().includes(appliedFilter.counterparty.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.documentNo &&
        !row.contactPerson.toLowerCase().includes(appliedFilter.documentNo.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.registerNo &&
        !row.contactInfo.toLowerCase().includes(appliedFilter.registerNo.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.daysSinceLastContact &&
        (Number.isNaN(row.daysSinceLastContact) ||
          row.daysSinceLastContact < parseInt(appliedFilter.daysSinceLastContact, 10))
      ) {
        return false;
      }
      return true;
    });
  }, [appliedFilter, rows, customerTypeOptions]);

  const activeFilterCount = useMemo(
    () =>
      Object.values(appliedFilter).filter((value) => value.trim() !== "").length,
    [appliedFilter],
  );

  const activeCustomersCount = useMemo(
    () => filteredRows.filter((row) => row.salesGroup !== "Xəta").length,
    [filteredRows],
  );
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () =>
      filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredRows, currentPage],
  );

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const [data, queries, orders] = await Promise.all([
        fetchCustomersAction(),
        fetchQueriesAction(),
        fetchOrdersAction(),
      ]);
      const mapped: CustomerRow[] = data.map((c: any) => {
        const entity = {
          id: String(c.id),
          company: c.name || c.company || "",
          name: c.name,
        };
        const customerQueries = queries.filter((q: any) =>
          matchesCustomerEntity(q, entity),
        );
        const customerOrders = orders.filter((o: any) =>
          matchesCustomerEntity(o, entity),
        );
        const lastActivity = getLastCustomerActivityDate(entity, queries, orders);

        return {
          id: String(c.id),
          company: c.name || c.company || "-",
          customerType: c.customerType || "Yeni müştəri",
          contactPerson: c.contactPerson || "-",
          contactPersons: c.contactPersons || [],
          contactInfo: c.phone || "-",
          address: c.address || "-",
          country: c.country || "AZ",
          manager: c.manager || "-",
          lastActivityDate: lastActivity ? lastActivity.toISOString() : null,
          daysSinceLastContact: daysSinceActivityDate(lastActivity),
          orderCount: customerOrders.length,
          queriesCount: customerQueries.length,
          salesGroup: c.company || "-",
          taxNumber: c.taxNumber || "",
          activityType: c.activityType || "",
          documents: c.documents ?? [],
        } as CustomerRow & { contactPersons?: ContactPersonRow[]; taxNumber?: string; activityType?: string; documents?: CarrierDocumentItem[] };
      });
      setRows(mapped);
    } catch (error) {
      dispatch(
        showNotification({
          message: "Müştərilər yüklənərkən xata baş verdi",
          type: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activePanel) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePanel(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePanel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilter]);

  useEffect(() => {
    if (!activePanel) return undefined;
    const main = document.querySelector("main");
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    const prevMainOverflow =
      main instanceof HTMLElement ? main.style.overflow : "";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (main instanceof HTMLElement) {
      main.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      if (main instanceof HTMLElement) {
        main.style.overflow = prevMainOverflow;
      }
    };
  }, [activePanel]);

  const handleFilterChange = (field: keyof typeof filterDraft, value: string) => {
    setFilterDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterDraft });
    setActivePanel(null);
  };

  const handleClearFilter = () => {
    const empty = {
      author: "",
      counterparty: "",
      status: "",
      customerType: "",
      documentNo: "",
      registerNo: "",
      dateFrom: "",
      dateTo: "",
      daysSinceLastContact: "",
    };
    setFilterDraft(empty);
    setAppliedFilter(empty);
  };

  const openDocumentFilePicker = (
    setForm: Dispatch<SetStateAction<typeof EMPTY_FORM>>,
  ) => {
    if (!documentDraft.number.trim() || !documentDraft.documentType.trim() || !documentDraft.date) {
      dispatch(
        showNotification({
          message: "Sənəd nömrəsi, növü və tarix mütləqdir",
          type: "error",
        }),
      );
      return;
    }
    documentFormSetterRef.current = setForm;
    documentInputRef.current?.click();
  };

  const handleDocumentFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const setForm = documentFormSetterRef.current;
    event.target.value = "";
    if (!file || !setForm) return;

    const docId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    pendingDocumentFilesRef.current.set(docId, file);

    const newDocument: CarrierDocumentItem = {
      id: docId,
      number: documentDraft.number.trim(),
      documentType: documentDraft.documentType.trim(),
      date: documentDraft.date,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };

    setForm((prev) => ({
      ...prev,
      documents: [...prev.documents, newDocument],
    }));
    setDocumentDraft({ number: "", documentType: "", date: "" });
    documentFormSetterRef.current = null;
    dispatch(
      showNotification({
        message: "Sənəd əlavə edildi",
        type: "added",
      }),
    );
  };

  const resolveDocumentsForSave = async (documents: CarrierDocumentItem[]) => {
    if (pendingDocumentFilesRef.current.size === 0) {
      return documents;
    }

    setIsDocumentUploading(true);
    try {
      return await uploadPendingCarrierDocuments(
        documents,
        pendingDocumentFilesRef.current,
        uploadCustomerDocumentFileAction,
      );
    } finally {
      setIsDocumentUploading(false);
    }
  };

  const removeDocumentFromForm = (
    setForm: Dispatch<SetStateAction<typeof EMPTY_FORM>>,
    documentId: string,
  ) => {
    pendingDocumentFilesRef.current.delete(documentId);
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== documentId),
    }));
    dispatch(
      showNotification({
        message: "Sənəd silindi",
        type: "deleted",
      }),
    );
  };

  const requestRemoveDocument = (
    setForm: Dispatch<SetStateAction<typeof EMPTY_FORM>>,
    documentId: string,
  ) => {
    setInlineDeleteConfirm({
      title: "Sənədi sil",
      message: "Bu sənədi silmək istədiyinizə əminsiniz?",
      onConfirm: () => removeDocumentFromForm(setForm, documentId),
    });
  };

  const requestRemoveContactPerson = (contact: ContactPersonRow, index: number) => {
    setInlineDeleteConfirm({
      title: "Əlaqədar şəxsi sil",
      message: `"${contact.fullName}" əlaqədar şəxsini silmək istədiyinizə əminsiniz?`,
      onConfirm: () => handleRemoveContactPerson(contact, index),
    });
  };

  const handleCreateCustomer = async () => {
    if (!newForm.company.trim()) return;
    try {
      const documents = await resolveDocumentsForSave(newForm.documents);
      const payload = {
        name: newForm.company.trim(),
        customerType: getLookupLabel(newForm.customerType, customerTypeOptions) || "Yeni müştəri",
        manager: newForm.manager.trim(),
        contactPersons: newForm.contactPersons,
        contactPerson: contactPersonIdsFromList(newForm.contactPersons),
        phone: newForm.contactInfo.trim(),
        address: newForm.address.trim(),
        company: newForm.company.trim(),
        shortName: newForm.shortName.trim(),
        activityType: getLookupLabel(newForm.activityType, activityTypeOptions),
        taxNumber: newForm.voen.trim(),
        country: newForm.country.trim(),
        documents: serializeCarrierDocuments(documents),
      };
      await createCustomerAction(payload);
      pendingDocumentFilesRef.current.clear();
      dispatch(
        showNotification({
          message: "Müştəri uğurla yaradıldı",
          type: "success",
        }),
      );
      loadCustomers();
      setActivePanel(null);
      setNewCustomerTab("main");
      setNewForm({ ...EMPTY_FORM });
      setDocumentDraft({ number: "", documentType: "", date: "" });
    } catch (error) {
      dispatch(
        showNotification({
          message: "Müştəri yaradılarkən xata baş verdi",
          type: "error",
        }),
      );
    }
  };

  const openEditModal = (customer: CustomerRow) => {
    pendingDocumentFilesRef.current.clear();
    setDocumentDraft({ number: "", documentType: "", date: "" });
    setEditingCustomerId(customer.id);
    setEditForm({
      company: customer.company,
      shortName: (customer as any).shortName || customer.company,
      customerType: resolveLookupValue(customer.customerType, customerTypesData),
      activityType: resolveLookupValue((customer as any).activityType || "", activityTypesData),
      voen: (customer as any).taxNumber || "",
      manager: customer.manager,
      contactPersons: normalizeCarrierContacts((customer as any).contactPersons || [], []),
      contactPerson: customer.contactPerson || "",
      contactInfo: customer.contactInfo,
      address: customer.address,
      country: resolveLookupValue(customer.country || "AZ", countriesData),
      documents: parseCarrierDocuments((customer as any).documents),
    });
    setActivePanel("edit");

    void (async () => {
      try {
        const entityContacts = await fetchContactPersonsAction({
          entityType: "customer",
          entityId: customer.id,
        });
        setAvailableContacts((prev) => normalizeCarrierContacts(prev, entityContacts));
        setEditForm((prev) => {
          const contactPersons = normalizeCarrierContacts(prev.contactPersons, entityContacts);
          return {
            ...prev,
            contactPersons,
            contactPerson: contactPersonIdsFromList(contactPersons),
          };
        });
      } catch {
        // keep embedded contacts only
      }
    })();
  };

  const closeEditModal = () => {
    setEditingCustomerId(null);
    setActivePanel(null);
    setActiveLookupModal(null);
    lookupOpenFromPlusRef.current = false;
    pendingDocumentFilesRef.current.clear();
    setDocumentDraft({ number: "", documentType: "", date: "" });
  };

  const saveEditedCustomer = async () => {
    if (!editingCustomerId) return;
    try {
      const documents = await resolveDocumentsForSave(editForm.documents);
      const payload = {
        name: editForm.company.trim(),
        customerType: getLookupLabel(editForm.customerType, customerTypeOptions) || "Yeni müştəri",
        manager: editForm.manager.trim(),
        contactPersons: editForm.contactPersons,
        contactPerson: contactPersonIdsFromList(editForm.contactPersons),
        phone: editForm.contactInfo.trim(),
        address: editForm.address.trim(),
        company: editForm.company.trim(),
        shortName: editForm.shortName.trim(),
        activityType: getLookupLabel(editForm.activityType, activityTypeOptions),
        taxNumber: editForm.voen.trim(),
        country: editForm.country.trim(),
        documents: serializeCarrierDocuments(documents),
      };
      await updateCustomerAction(editingCustomerId, payload);
      pendingDocumentFilesRef.current.clear();
      dispatch(
        showNotification({
          message: "Müştəri məlumatları yeniləndi",
          type: "success",
        }),
      );
      loadCustomers();
      closeEditModal();
    } catch (error) {
      dispatch(
        showNotification({
          message: "Müştəri yenilənərkən xata baş verdi",
          type: "error",
        }),
      );
    }
  };

  const handleDeleteCustomerClick = (customerId: string) => {
    setCustomerIdToDelete(customerId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerIdToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCustomerAction(customerIdToDelete);
      dispatch(
        showNotification({
          message: "Müştəri silindi",
          type: "success",
        }),
      );
      loadCustomers();
      setDeleteConfirmOpen(false);
      setCustomerIdToDelete(null);
    } catch (error) {
      dispatch(
        showNotification({
          message: "Müştəri silinərkən xata baş verdi",
          type: "error",
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={sorguLayoutStyles.container}>
      <div className={sorguLayoutStyles.header}>
        <section className={sorguActionBarStyles.wrapper}>
          <div className={sorguActionBarStyles.group}>
            {allowCreate ? (
              <button
                type="button"
                className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonPrimary}`}
                onClick={() => setActivePanel("new")}
              >
                <FiFilePlus />
                Yeni müştəri
              </button>
            ) : null}
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
              onClick={() => setActivePanel("filter")}
            >
              <FiFilter />
              Filtrlər
              {activeFilterCount > 0 ? (
                <span className={sorguActionBarStyles.badge}>{activeFilterCount}</span>
              ) : null}
            </button>
          </div>

          <div className={sorguActionBarStyles.statsGroup}>
            <span className={sorguActionBarStyles.statPill}>Cəmi: {filteredRows.length}</span>
            <span className={sorguActionBarStyles.statPill}>Aktiv: {activeCustomersCount}</span>
          </div>
          <div className={sorguActionBarStyles.group}>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
            >
              Excel-dən idxal et
            </button>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
            >
              Excel-ə ixrac et
            </button>
          </div>
        </section>
      </div>

      <div className={sorguLayoutStyles.body}>
        <table className={sorguTableStyles.table}>
            <thead className={sorguTableStyles.head}>
              <tr>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min180}`}>Şirkətin adı</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Müştəri tipi</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min170}`}>Əlaqə məlumatları</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min180}`}>Ünvan</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Ölkə</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Menecer</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min160}`}>Son sorğu/sifariş tarixi</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min140}`}>Sifarişlərin sayı</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min140}`}>Sorğuların sayı</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? sorguTableStyles.rowEven : sorguTableStyles.rowOdd}
                >
                  <td
                    className={`${sorguTableStyles.cell} ${sorguTableStyles.nowrap} ${sorguTableStyles.center}`}
                  >
                    <Link
                      to={`/musteriler/${row.id}`}
                      className={sorguTableStyles.link}
                    >
                      {row.company}
                    </Link>
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {displayFieldValue(row.customerType)}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.contactInfo}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.address}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.country}</td>
                  <td className={sorguTableStyles.cell}>
                    {usersData.find(u => String(u.id) === String(row.manager))?.name || row.manager}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {formatActivityDate(
                      row.lastActivityDate ? new Date(row.lastActivityDate) : null,
                    )}
                  </td>
                   <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.orderCount}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.queriesCount}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {allowEdit || allowDelete ? (
                      <div className={sorguTableStyles.actionRow}>
                        {allowEdit ? (
                          <button
                            type="button"
                            className={`${sorguTableStyles.iconButton} ${sorguTableStyles.detailsButton}`}
                            onClick={() => openEditModal(row)}
                            aria-label="Redaktə et"
                            title="Redaktə et"
                          >
                            <FaEdit />
                          </button>
                        ) : null}
                        {allowDelete ? (
                          <button
                            type="button"
                            className={`${sorguTableStyles.iconButton} ${sorguTableStyles.deleteButton}`}
                            onClick={() => handleDeleteCustomerClick(row.id)}
                            aria-label="Sil"
                            title="Sil"
                          >
                            <FaTrash />
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={11} className={sorguTableStyles.center} style={{ padding: "40px" }}>
                    Yüklənir...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={11} className={sorguTableStyles.center} style={{ padding: "40px" }}>
                    Müştəri tapılmadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>

      <div className={sorguLayoutStyles.footer}>
        <div className={styles.paginationBar}>
          <span>Cəmi sətir: {filteredRows.length}</span>
          <div className={styles.paginationActions}>
            <button
              type="button"
              className={styles.paginationButton}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Əvvəlki
            </button>
            <span className={styles.paginationCurrent}>{currentPage}</span>
            <button
              type="button"
              className={styles.paginationButton}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Sonrakı
            </button>
          </div>
        </div>
      </div>

      <FilterDrawer
        open={activePanel === "filter"}
        onClose={() => setActivePanel(null)}
        onClear={handleClearFilter}
        onApply={handleApplyFilter}
        title="Filtrlər"
        description="Müəllif, status, tarix və sənəd nömrəsinə görə müştəriləri daraldın."
      >
        <FilterSection title="Əsas məlumatlar">
          <FilterGrid>
            <FilterSelectField
              label="Müəllif"
              value={filterDraft.author}
              options={PLACEHOLDER}
              onChange={(value) => handleFilterChange("author", value)}
            />
            <FilterTextField
              label="Kontragentlər"
              value={filterDraft.counterparty}
              onChange={(value) => handleFilterChange("counterparty", value)}
              placeholder="Şirkət adı"
              icon={<FiSearch />}
            />
            <FilterSelectField
              label="Status"
              value={filterDraft.status}
              options={STATUS_OPTIONS}
              onChange={(value) => handleFilterChange("status", value)}
            />
            <FilterSelectField
              label="Müştəri tipi"
              value={filterDraft.customerType}
              options={customerTypeOptions}
              onChange={(value) => handleFilterChange("customerType", value)}
            />
            <FilterTextField
              label="Sənəd nömrəsi"
              value={filterDraft.documentNo}
              onChange={(value) => handleFilterChange("documentNo", value)}
              placeholder="Axtar..."
              icon={<FiSearch />}
            />
            <FilterTextField
              label="Hesab nömrəsi"
              value={filterDraft.registerNo}
              onChange={(value) => handleFilterChange("registerNo", value)}
              placeholder="Axtar..."
              icon={<FiSearch />}
            />
          </FilterGrid>
        </FilterSection>
        <FilterSection title="Tarixlər">
          <FilterGrid>
            <FilterDateField
              label="Tarixdən"
              value={filterDraft.dateFrom}
              onChange={(value) => handleFilterChange("dateFrom", value)}
            />
            <FilterDateField
              label="Tarixədək"
              value={filterDraft.dateTo}
              onChange={(value) => handleFilterChange("dateTo", value)}
            />
          </FilterGrid>
        </FilterSection>
        <FilterSection title="Digər">
          <FilterGrid cols={1}>
            <FilterTextField
              label="Sonuncu əlaqə (ən az gün)"
              value={filterDraft.daysSinceLastContact}
              onChange={(value) =>
                handleFilterChange("daysSinceLastContact", value)
              }
              placeholder="Gün sayı..."
            />
          </FilterGrid>
        </FilterSection>
      </FilterDrawer>

      <div
        className={`${sorguLayoutStyles.overlay} ${
          activePanel === "new" || activePanel === "edit"
            ? sorguLayoutStyles.overlayOpen
            : ""
        }`}
        aria-hidden={!(activePanel === "new" || activePanel === "edit")}
      />

      <aside
        className={`${sorguLayoutStyles.drawer} ${
          activePanel === "new" || activePanel === "edit"
            ? sorguLayoutStyles.drawerOpen
            : ""
        }`}
        aria-hidden={!(activePanel === "new" || activePanel === "edit")}
      >
        {(() => {
          const isNew = activePanel === "new";
          const isEdit = activePanel === "edit" && editingCustomerId;
          if (!isNew && !isEdit) return null;
          
          const form = isNew ? newForm : editForm;
          const setForm = isNew ? setNewForm : setEditForm;
          const handleSave = isNew ? handleCreateCustomer : saveEditedCustomer;
          const title = isNew ? "Yeni müştəri" : "Müştərini redaktə et";
          const description = isNew
            ? "Müştəri məlumatlarını doldurub yaddaşa əlavə edin."
            : "Mövcud müştəri məlumatlarını yeniləyin.";

          return (
            <div className={styles.newPanel}>
              <div className={styles.newPanelHeader}>
                <div>
                  <h2 className={styles.newPanelTitle}>{title}</h2>
                  <p className={styles.newPanelDescription}>{description}</p>
                </div>
                <button
                  type="button"
                  className={styles.newPanelClose}
                  onClick={() => {
                    if (isEdit) closeEditModal();
                    else setActivePanel(null);
                  }}
                  aria-label="Bağla"
                >
                  ×
                </button>
              </div>
              <div className={styles.newPanelBody}>
                {/* 1. Əsas məlumatlar */}
                <div className={styles.newPanelCard}>
                  <h3 className={styles.newPanelCardTitle}>Əsas məlumatlar</h3>
                  <div className={styles.newPanelGrid}>
                    <label className={styles.field}>
                      <span>Şirkətin adı (Tam) *</span>
                      <input
                        value={form.company}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, company: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Şirkətin tam adını daxil edin"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Şirkətin adı (Qısa)</span>
                      <input
                        value={form.shortName}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, shortName: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Qısa ad"
                      />
                    </label>
                    <div className={styles.field}>
                      <span>Müştəri tipi</span>
                      <div className={styles.inlineControlRow}>
                        <div
                          className={styles.grow}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleLookupSelectOpen();
                          }}
                        >
                          <Select
                            value={form.customerType}
                            options={customerTypeOptions}
                            placeholder="-"
                            onChange={(value) =>
                              setForm((prev: any) => ({ ...prev, customerType: value }))
                            }
                            onOpenChange={(open) => {
                              if (open) handleLookupSelectOpen();
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          title="Müştəri tipi əlavə et"
                          className={styles.plusButton}
                          onMouseDown={armLookupOpenFromPlus}
                          onClick={(e) => openLookupModal(e, "customer-types")}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className={styles.field}>
                      <span>Fəaliyyət növü</span>
                      <div className={styles.inlineControlRow}>
                        <div
                          className={styles.grow}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleLookupSelectOpen();
                          }}
                        >
                          <Select
                            value={form.activityType}
                            options={activityTypeOptions}
                            placeholder="-"
                            onChange={(value) =>
                              setForm((prev: any) => ({ ...prev, activityType: value }))
                            }
                            onOpenChange={(open) => {
                              if (open) handleLookupSelectOpen();
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          title="Fəaliyyət növü əlavə et"
                          className={styles.plusButton}
                          onMouseDown={armLookupOpenFromPlus}
                          onClick={(e) => openLookupModal(e, "activity-types")}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <label className={styles.field}>
                      <span>VÖEN</span>
                      <input
                        value={form.voen}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, voen: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="VÖEN daxil edin"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Menecer</span>
                      <Select
                        value={form.manager}
                        options={userOpts}
                        onChange={(value) =>
                          setForm((prev: any) => ({ ...prev, manager: value }))
                        }
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Əlaqə məlumatları */}
                <div className={styles.newPanelCard}>
                  <h3 className={styles.newPanelCardTitle}>Əlaqə məlumatları</h3>
                  <div className={styles.newPanelGrid}>
                    {isEdit ? (
                      <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                        <div className={styles.sectionBox}>
                          <p className={styles.sectionBoxTitle}>Müştəri əlaqədar şəxsləri</p>
                          <p className={styles.sectionBoxHint}>
                            Əlaqədar şəxsləri «İdarə et» düyməsi ilə əlavə edin.
                          </p>
                          <div className={styles.inlineControlRow}>
                            <div className={styles.contactPersonList} aria-hidden="true" />
                            <button
                              type="button"
                              className={styles.manageButton}
                              onClick={() => setIsContactModalOpen(true)}
                              title="Əlaqədar şəxsləri idarə et"
                            >
                              İdarə et
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <label className={styles.field}>
                      <span>Telefon nömrəsi</span>
                      <input
                        value={form.contactInfo}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, contactInfo: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="+994 XX XXX XX XX"
                      />
                    </label>
                    <div className={styles.field}>
                      <span>Ölkə</span>
                      <div className={styles.inlineControlRow}>
                        <div
                          className={styles.grow}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleLookupSelectOpen();
                          }}
                        >
                          <Select
                            value={form.country}
                            options={countryOptions}
                            placeholder="-"
                            onChange={(value) =>
                              setForm((prev: any) => ({ ...prev, country: value }))
                            }
                            onOpenChange={(open) => {
                              if (open) handleLookupSelectOpen();
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          title="Ölkə əlavə et"
                          className={styles.plusButton}
                          onMouseDown={armLookupOpenFromPlus}
                          onClick={(e) => openLookupModal(e, "countries")}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <label className={styles.field} style={{ gridColumn: '1 / -1' }}>
                      <span>Ünvan</span>
                      <input
                        value={form.address}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, address: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Tam ünvanı daxil edin"
                      />
                    </label>
                  </div>
                </div>

                {/* 3. Sənədlər */}
                <div className={styles.newPanelCard}>
                  <h3 className={styles.newPanelCardTitle}>Sənədlər</h3>
                  <div className={styles.documentFormGrid}>
                    <label className={styles.field}>
                      <span>Sənədin nömrəsi</span>
                      <input
                        value={documentDraft.number}
                        onChange={(e) =>
                          setDocumentDraft((prev) => ({ ...prev, number: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Sənəd nömrəsini daxil edin"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Sənədin növü</span>
                      <input
                        value={documentDraft.documentType}
                        onChange={(e) =>
                          setDocumentDraft((prev) => ({ ...prev, documentType: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Məs: Müqavilə"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Tarix</span>
                      <div className={styles.inlineControlRow}>
                        <div className={styles.grow}>
                          <input
                            type="date"
                            value={documentDraft.date}
                            onChange={(e) =>
                              setDocumentDraft((prev) => ({ ...prev, date: e.target.value }))
                            }
                            className={styles.input}
                          />
                        </div>
                        <button
                          type="button"
                          title="Fayl seç və əlavə et"
                          className={styles.plusButton}
                          disabled={isDocumentUploading}
                          onClick={() => openDocumentFilePicker(setForm)}
                        >
                          {isDocumentUploading ? "..." : "+"}
                        </button>
                      </div>
                    </label>
                  </div>
                  {form.documents.length > 0 ? (
                    <ul className={styles.documentList}>
                      {form.documents.map((doc) => (
                        <li key={doc.id} className={styles.documentItem}>
                          <div className={styles.documentMeta}>
                            <span className={styles.documentNumber} title={doc.number}>
                              {doc.number}
                            </span>
                            {doc.documentType ? (
                              <span className={styles.documentType} title={doc.documentType}>
                                {doc.documentType}
                              </span>
                            ) : null}
                            <span className={styles.documentDate}>{doc.date}</span>
                            {doc.fileName ? (
                              <span className={styles.documentFileName} title={doc.fileName}>
                                {doc.fileUrl ? (
                                  <a
                                    href={buildApiUrl(doc.fileUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {doc.fileName}
                                  </a>
                                ) : (
                                  doc.fileName
                                )}
                              </span>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className={styles.documentRemove}
                            onClick={() => requestRemoveDocument(setForm, doc.id!)}
                            aria-label="Sənədi sil"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.documentEmpty}>Hələ sənəd əlavə edilməyib.</p>
                  )}
                </div>
              </div>

              <div className={styles.newPanelFooter}>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    if (isEdit) closeEditModal();
                    else setActivePanel(null);
                  }}
                >
                  {isEdit ? "Ləğv et" : "Bağla"}
                </button>
                <button
                  type="button"
                  className={styles.applyButton}
                  onClick={handleSave}
                >
                  Yaddaşda saxlamaq
                </button>
              </div>
            </div>
          );
        })()}
      </aside>
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Müştərini sil"
        message="Bu müştərini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setCustomerIdToDelete(null);
        }}
        isLoading={isDeleting}
      />
      <ConfirmModal
        isOpen={inlineDeleteConfirm !== null}
        title={inlineDeleteConfirm?.title ?? ""}
        message={inlineDeleteConfirm?.message ?? ""}
        onConfirm={async () => {
          if (!inlineDeleteConfirm) return;
          setIsInlineDeleting(true);
          try {
            await inlineDeleteConfirm.onConfirm();
            setInlineDeleteConfirm(null);
          } finally {
            setIsInlineDeleting(false);
          }
        }}
        onCancel={() => setInlineDeleteConfirm(null)}
        isLoading={isInlineDeleting}
      />
      <ContactPersonManagerModal
        isOpen={isContactModalOpen && activePanel === "edit"}
        onClose={() => setIsContactModalOpen(false)}
        contacts={mergeCarrierFormContacts(
          editForm.contactPersons,
          availableContacts,
          {
            mode: "edit",
            entityId: editingCustomerId,
          },
        )}
        onAdd={handleCreateContactPerson}
        onEdit={handleEditContactPerson}
        onRemove={requestRemoveContactPerson}
        entityName={editForm.company}
        entityTypeLabel="müştəri"
        emptyMessage="Bu müştəriyə aid heç bir əlaqədar şəxs tapılmadı."
      />

      {activeLookupModal ? (
        <LookupManagerModal
          isOpen
          onClose={() => setActiveLookupModal(null)}
          lookupType={activeLookupModal}
          title={
            activeLookupModal === "activity-types"
              ? "Fəaliyyət növləri"
              : activeLookupModal === "countries"
                ? "Ölkələr"
                : "Müştəri tipləri"
          }
          onDataChanged={handleLookupDataChanged}
        />
      ) : null}

      <input
        ref={documentInputRef}
        type="file"
        className={styles.hiddenFileInput}
        onChange={handleDocumentFileSelected}
      />
    </div>
  );
}

