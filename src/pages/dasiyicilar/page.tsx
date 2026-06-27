"use client";

import { useEffect, useMemo, useState, useRef, type ChangeEvent, type Dispatch, type SetStateAction, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import styles from "./dasiyicilar.module.css";
import modalStyles from "../musteriler/musteriler.module.css";
import sorguLayoutStyles from "../sorgular/sorgular.module.css";
import sorguActionBarStyles from "../sorgular/components/SorgularActionBar.module.css";
import sorguTableStyles from "../sorgular/components/SorgularTable.module.css";
import Select from "../../common/components/select/Select";
import type { SelectOption } from "../../common/components/select/Select";
import { buildApiUrl } from "../../common/utils/fetch.utils";
import { FiFilePlus, FiFilter, FiX } from "react-icons/fi";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
  fetchCarriersAction,
  createCarrierAction,
  updateCarrierAction,
  deleteCarrierAction,
  uploadCarrierDocumentFileAction,
} from "../../common/actions/carrier.actions";
import { fetchContactPersonsAction, ContactPersonRow, createContactPersonAction, deleteContactPersonAction, updateContactPersonAction } from "../../common/actions/contact.actions";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { ConfirmModal } from "../../common/components/ConfirmModal";
import { fetchQueriesAction } from "../../common/actions/query.actions";
import { fetchOrdersAction } from "../../common/actions/order.actions";
import {
  daysSinceActivityDate,
  formatActivityDate,
  getLastCarrierActivityDate,
  matchesCarrierEntity,
  queryMatchesCarrier,
} from "../../common/utils/entityActivity.utils";
import { fetchLookupAction, LookupRow } from "../../common/actions/lookup.actions";
import { LookupManagerModal } from "../../common/components/modal/LookupManagerModal";
import { ContactPersonManagerModal } from "../../common/components/modal/ContactPersonManagerModal";
import type { ContactPersonFormData } from "../../common/components/modal/ContactPersonFormModal";
import {
  parseCarrierDocuments,
  displayFieldValue,
  mergeCarrierFormContacts,
  isPersistedContactPerson,
  scopeEntityContacts,
  normalizeCarrierContacts,
  contactPersonIdsFromList,
  serializeCarrierDocuments,
  uploadPendingCarrierDocuments,
  type CarrierDocumentItem,
} from "../../common/utils/carrierDisplay.utils";
import { COUNTRY_OPTIONS } from "../sorgular/constants/options.constants";

const PLACEHOLDER: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

type LookupModalType = "carrier-types" | "activity-types" | "countries";

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
  carrierType: "",
  activityType: "",
  voen: "",
  contactPersons: [] as ContactPersonRow[],
  contactPerson: "",
  contactInfo: "",
  address: "",
  country: "AZ",
  documents: [] as CarrierDocumentItem[],
};

export default function DasiyicilarPage() {
  const dispatch = useAppDispatch();
  const PAGE_SIZE = 12;
  const [rows, setRows] = useState<CarrierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<"filter" | "new" | "edit" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [carrierIdToDelete, setCarrierIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_FORM });
  const [newCarrierTab, setNewCarrierTab] = useState<"main" | "contact">("main");
  const [filterDraft, setFilterDraft] = useState({
    author: "",
    counterparty: "",
    status: "",
    carrierType: "",
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
    carrierType: "",
    documentNo: "",
    registerNo: "",
    dateFrom: "",
    dateTo: "",
    daysSinceLastContact: "",
  });
  const [editingCarrierId, setEditingCarrierId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [documentDraft, setDocumentDraft] = useState({ number: "", documentType: "", date: "" });
  const [isDocumentUploading, setIsDocumentUploading] = useState(false);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const documentFormSetterRef = useRef<Dispatch<SetStateAction<typeof EMPTY_FORM>> | null>(null);
  const pendingDocumentFilesRef = useRef<Map<string, File>>(new Map());
  
  const [availableContacts, setAvailableContacts] = useState<ContactPersonRow[]>([]);
  const [carrierTypesData, setCarrierTypesData] = useState<LookupRow[]>([]);
  const [activityTypesData, setActivityTypesData] = useState<LookupRow[]>([]);
  const [countriesData, setCountriesData] = useState<LookupRow[]>([]);
  const [activeLookupModal, setActiveLookupModal] = useState<LookupModalType | null>(null);
  const lookupOpenFromPlusRef = useRef(false);

  const carrierTypeOptions = useMemo(
    () => toLookupOptions(carrierTypesData),
    [carrierTypesData],
  );

  const activityTypeOptions = useMemo(
    () => toLookupOptions(activityTypesData),
    [activityTypesData],
  );

  const countryOptions = useMemo(
    () => toLookupOptions(countriesData),
    [countriesData],
  );

  const loadCarrierTypes = async () => {
    try {
      const data = await fetchLookupAction("carrier-types");
      setCarrierTypesData(data);
    } catch {
      setCarrierTypesData([]);
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
    fetchContactPersonsAction({ entityType: "carrier" }).then(setAvailableContacts).catch(() => {});
    loadCarrierTypes();
    loadActivityTypes();
    loadCountries();
  }, []);

  const handleLookupDataChanged = (data: LookupRow[]) => {
    if (activeLookupModal === "carrier-types") {
      setCarrierTypesData(data);
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

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleCreateContactPerson = async (data: ContactPersonFormData) => {
    try {
      const currentForm = activePanel === "new" ? newForm : editForm;
      const entityId = activePanel === "edit" ? editingCarrierId : undefined;
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
        entityType: "carrier",
        entityId: entityId || undefined,
      });

      const nextContactPersons = mergeCarrierFormContacts(
        normalizeCarrierContacts(currentForm.contactPersons, [newContact]),
        normalizeCarrierContacts(availableContacts, [newContact]),
        contactOptions,
      );

      if (activePanel === "edit" && editingCarrierId) {
        await updateCarrierAction(editingCarrierId, {
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
          message: "Yeni daşıyıcı əlaqədar şəxs əlavə edildi",
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
      entityId: activePanel === "edit" ? editingCarrierId : null,
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

      if (activePanel === "edit" && editingCarrierId) {
        await updateCarrierAction(editingCarrierId, {
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
        entityId: activePanel === "edit" ? editingCarrierId : null,
      },
    );
    const nextContactPersons = mergedContacts.filter(
      (c) => String(c.id) !== String(contact.id),
    );
    const scopedAvailable = scopeEntityContacts(availableContacts, {
      mode: activePanel === "new" ? "new" : "edit",
      entityId: activePanel === "edit" ? editingCarrierId : null,
    });

    try {
      if (isPersistedContactPerson(contact, scopedAvailable)) {
        await deleteContactPersonAction(String(contact.id));
      }

      if (activePanel === "edit" && editingCarrierId) {
        await updateCarrierAction(editingCarrierId, {
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
        appliedFilter.carrierType &&
        row.carrierType !== getLookupLabel(appliedFilter.carrierType, carrierTypeOptions)
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
  }, [appliedFilter, rows, carrierTypeOptions]);

  const activeFilterCount = useMemo(
    () =>
      Object.values(appliedFilter).filter((value) => value.trim() !== "").length,
    [appliedFilter],
  );

  const activeCarriersCount = useMemo(
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
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    setLoading(true);
    try {
      const [data, queries, orders] = await Promise.all([
        fetchCarriersAction(),
        fetchQueriesAction(),
        fetchOrdersAction(),
      ]);
      const mapped: CarrierRow[] = data.map((c: any) => {
        const entity = {
          id: String(c.id),
          company: c.name || c.company || "",
          name: c.name,
        };
        const carrierQueries = queries.filter((q: any) =>
          queryMatchesCarrier(q, entity),
        );
        const carrierOrders = orders.filter((o: any) =>
          matchesCarrierEntity(o, entity),
        );
        const lastActivity = getLastCarrierActivityDate(entity, queries, orders);

        return {
          id: String(c.id),
          company: c.name || c.company || "-",
          carrierType: c.carrierType || "Yeni daşıyıcı",
          activityType: c.activityType || "",
          contactPerson: c.contactPerson || "-",
          contactPersons: c.contactPersons || [],
          contactInfo: c.phone || "-",
          address: c.address || "-",
          country: c.country || "AZ",
          lastActivityDate: lastActivity ? lastActivity.toISOString() : null,
          daysSinceLastContact: daysSinceActivityDate(lastActivity),
          orderCount: carrierOrders.length,
          queriesCount: carrierQueries.length,
          salesGroup: c.company || "-",
          documents: parseCarrierDocuments(c.documentsJson),
        };
      });
      setRows(mapped);
    } catch (error) {
      dispatch(
        showNotification({
          message: "Daşıyıcılər yüklənərkən xata baş verdi",
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
    if (!activePanel) {
      setActiveLookupModal(null);
      setIsContactModalOpen(false);
      lookupOpenFromPlusRef.current = false;
    }
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
      carrierType: "",
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
        uploadCarrierDocumentFileAction,
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

  const handleCreateCarrier = async () => {
    if (!newForm.company.trim()) return;
    try {
      const documents = await resolveDocumentsForSave(newForm.documents);
      const payload = {
        name: newForm.company.trim(),
        carrierType: getLookupLabel(newForm.carrierType, carrierTypeOptions) || "Yeni daşıyıcı",
        contactPersons: newForm.contactPersons,
        contactPerson: contactPersonIdsFromList(newForm.contactPersons),
        phone: newForm.contactInfo.trim(),
        address: newForm.address.trim(),
        company: newForm.company.trim(),
        shortName: newForm.shortName.trim(),
        activityType: getLookupLabel(newForm.activityType, activityTypeOptions),
        voen: newForm.voen.trim(),
        country: newForm.country.trim(),
        documents: serializeCarrierDocuments(documents),
      };
      await createCarrierAction(payload);
      pendingDocumentFilesRef.current.clear();
      dispatch(
        showNotification({
          message: "Daşıyıcı uğurla yaradıldı",
          type: "success",
        }),
      );
      loadCarriers();
      setActivePanel(null);
      setNewCarrierTab("main");
      setNewForm({ ...EMPTY_FORM });
      setDocumentDraft({ number: "", documentType: "", date: "" });
    } catch (error) {
      dispatch(
        showNotification({
          message: "Daşıyıcı yaradılarkən xata baş verdi",
          type: "error",
        }),
      );
    }
  };

  const openEditModal = (carrier: CarrierRow) => {
    pendingDocumentFilesRef.current.clear();
    setEditingCarrierId(carrier.id);
    setDocumentDraft({ number: "", documentType: "", date: "" });
    setEditForm({
      company: carrier.company,
      shortName: carrier.company,
      carrierType: resolveLookupValue(carrier.carrierType, carrierTypesData),
      activityType: resolveLookupValue((carrier as any).activityType || "", activityTypesData),
      voen: "",
      contactPersons: normalizeCarrierContacts((carrier as any).contactPersons || [], []),
      contactPerson: carrier.contactPerson || "",
      contactInfo: carrier.contactInfo,
      address: carrier.address,
      country: resolveLookupValue(carrier.country || "AZ", countriesData),
      documents: parseCarrierDocuments(carrier.documents),
    });
    setActivePanel("edit");

    void (async () => {
      try {
        const entityContacts = await fetchContactPersonsAction({
          entityType: "carrier",
          entityId: carrier.id,
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
    setEditingCarrierId(null);
    setActivePanel(null);
    setActiveLookupModal(null);
    lookupOpenFromPlusRef.current = false;
  };

  const saveEditedCarrier = async () => {
    if (!editingCarrierId) return;
    try {
      const documents = await resolveDocumentsForSave(editForm.documents);
      const payload = {
        name: editForm.company.trim(),
        carrierType: getLookupLabel(editForm.carrierType, carrierTypeOptions) || "Yeni daşıyıcı",
        contactPersons: editForm.contactPersons,
        contactPerson: contactPersonIdsFromList(editForm.contactPersons),
        phone: editForm.contactInfo.trim(),
        address: editForm.address.trim(),
        company: editForm.company.trim(),
        shortName: editForm.shortName.trim(),
        activityType: getLookupLabel(editForm.activityType, activityTypeOptions),
        voen: editForm.voen.trim(),
        country: editForm.country.trim(),
        documents: serializeCarrierDocuments(documents),
      };
      await updateCarrierAction(editingCarrierId, payload);
      pendingDocumentFilesRef.current.clear();
      dispatch(
        showNotification({
          message: "Daşıyıcı məlumatları yeniləndi",
          type: "success",
        }),
      );
      loadCarriers();
      closeEditModal();
    } catch (error) {
      dispatch(
        showNotification({
          message: "Daşıyıcı yenilənərkən xata baş verdi",
          type: "error",
        }),
      );
    }
  };

  const handleDeleteCarrierClick = (carrierId: string) => {
    setCarrierIdToDelete(carrierId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!carrierIdToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCarrierAction(carrierIdToDelete);
      dispatch(
        showNotification({
          message: "Daşıyıcı silindi",
          type: "success",
        }),
      );
      loadCarriers();
      setDeleteConfirmOpen(false);
      setCarrierIdToDelete(null);
    } catch (error) {
      dispatch(
        showNotification({
          message: "Daşıyıcı silinərkən xata baş verdi",
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
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonPrimary}`}
              onClick={() => {
                pendingDocumentFilesRef.current.clear();
                setDocumentDraft({ number: "", documentType: "", date: "" });
                setActivePanel("new");
              }}
            >
              <FiFilePlus />
              Yeni daşıyıcı
            </button>
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
            <span className={sorguActionBarStyles.statPill}>Aktiv: {activeCarriersCount}</span>
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
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Daşıyıcı tipi</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min170}`}>Əlaqə məlumatları</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min180}`}>Ünvan</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Ölkə</th>
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
                      to={`/dasiyicilar/${row.id}`}
                      className={sorguTableStyles.link}
                    >
                      {row.company}
                    </Link>
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {displayFieldValue(row.carrierType)}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.contactInfo}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.address}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.country}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {formatActivityDate(
                      row.lastActivityDate ? new Date(row.lastActivityDate) : null,
                    )}
                  </td>
                   <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.orderCount}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.queriesCount}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    <div className={sorguTableStyles.actionRow}>
                      <button
                        type="button"
                        className={`${sorguTableStyles.iconButton} ${sorguTableStyles.detailsButton}`}
                        onClick={() => openEditModal(row)}
                        aria-label="Redaktə et"
                        title="Redaktə et"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className={`${sorguTableStyles.iconButton} ${sorguTableStyles.deleteButton}`}
                        onClick={() => handleDeleteCarrierClick(row.id)}
                        aria-label="Sil"
                        title="Sil"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={13} className={sorguTableStyles.center} style={{ padding: "40px" }}>
                    Yüklənir...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={13} className={sorguTableStyles.center} style={{ padding: "40px" }}>
                    Daşıyıcı tapılmadı
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

      <div
        className={`${sorguLayoutStyles.overlay} ${activePanel ? sorguLayoutStyles.overlayOpen : ""}`}
        aria-hidden={!activePanel}
      />

      <aside
        className={`${sorguLayoutStyles.drawer} ${activePanel ? sorguLayoutStyles.drawerOpen : ""}`}
        aria-hidden={!activePanel}
      >
        {activePanel === "filter" ? (
          <div className={styles.filterPanel}>
            <div className={styles.filterHeader}>
              <h3>Filtrlər</h3>
              <button type="button" onClick={() => setActivePanel(null)}>
                <FiX />
              </button>
            </div>
            <div className={styles.filtersGrid}>
              <label className={styles.field}>
                <span>Müəllif</span>
                <Select
                  value={filterDraft.author}
                  options={PLACEHOLDER}
                  onChange={(value) => handleFilterChange("author", value)}
                />
              </label>
              <label className={styles.field}>
                <span>Kontragentlər</span>
                <input
                  value={filterDraft.counterparty}
                  onChange={(event) =>
                    handleFilterChange("counterparty", event.target.value)
                  }
                  className={styles.input}
                  placeholder="Şirkət adı"
                />
              </label>
              <label className={styles.field}>
                <span>Status</span>
                <Select
                  value={filterDraft.status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => handleFilterChange("status", value)}
                />
              </label>
              <label className={styles.field}>
                <span>Daşıyıcı tipi</span>
                <Select
                  value={filterDraft.carrierType}
                  options={carrierTypeOptions}
                  onChange={(value) => handleFilterChange("carrierType", value)}
                />
              </label>
              <label className={styles.field}>
                <span>Sənəd nömrəsi</span>
                <input
                  value={filterDraft.documentNo}
                  onChange={(event) =>
                    handleFilterChange("documentNo", event.target.value)
                  }
                  className={styles.input}
                  placeholder="Axtar..."
                />
              </label>
              <label className={styles.field}>
                <span>Hesab nömrəsi</span>
                <input
                  value={filterDraft.registerNo}
                  onChange={(event) =>
                    handleFilterChange("registerNo", event.target.value)
                  }
                  className={styles.input}
                  placeholder="Axtar..."
                />
              </label>
              <label className={styles.field}>
                <span>Tarixdən</span>
                <input
                  type="date"
                  value={filterDraft.dateFrom}
                  onChange={(event) => handleFilterChange("dateFrom", event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                <span>Tarixədək</span>
                <input
                  type="date"
                  value={filterDraft.dateTo}
                  onChange={(event) => handleFilterChange("dateTo", event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                <span>Sonuncu əlaqə (ən az gün)</span>
                <input
                  type="number"
                  min="0"
                  value={filterDraft.daysSinceLastContact}
                  onChange={(event) => handleFilterChange("daysSinceLastContact", event.target.value)}
                  className={styles.input}
                  placeholder="Gün sayı..."
                />
              </label>
            </div>
            <div className={styles.filterFooter}>
              <button type="button" className={styles.clearButton} onClick={handleClearFilter}>
                Filtrləri təmizlə
              </button>
              <button type="button" className={styles.applyButton} onClick={handleApplyFilter}>
                Filterdən keçir
              </button>
            </div>
          </div>
        ) : null}

        {(() => {
          const isNew = activePanel === "new";
          const isEdit = activePanel === "edit" && editingCarrierId;
          if (!isNew && !isEdit) return null;
          
          const form = isNew ? newForm : editForm;
          const setForm = isNew ? setNewForm : setEditForm;
          const handleSave = isNew ? handleCreateCarrier : saveEditedCarrier;
          const title = isNew ? "Yeni daşıyıcı" : "Daşıyıcıni redaktə et";
          const description = isNew
            ? "Daşıyıcı məlumatlarını doldurub yaddaşa əlavə edin."
            : "Mövcud daşıyıcı məlumatlarını yeniləyin.";

          return (
            <div className={modalStyles.newPanel}>
              <div className={modalStyles.newPanelHeader}>
                <div>
                  <h2 className={modalStyles.newPanelTitle}>{title}</h2>
                  <p className={modalStyles.newPanelDescription}>{description}</p>
                </div>
                <button
                  type="button"
                  className={modalStyles.newPanelClose}
                  onClick={() => {
                    if (isEdit) closeEditModal();
                    else setActivePanel(null);
                  }}
                  aria-label="Bağla"
                >
                  ×
                </button>
              </div>
              <div className={modalStyles.newPanelBody}>
                {/* 1. Əsas məlumatlar */}
                <div className={modalStyles.newPanelCard}>
                  <h3 className={modalStyles.newPanelCardTitle}>Əsas məlumatlar</h3>
                  <div className={modalStyles.newPanelGrid}>
                    <label className={modalStyles.field}>
                      <span>Şirkətin adı (Tam) *</span>
                      <input
                        value={form.company}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, company: e.target.value }))
                        }
                        className={modalStyles.input}
                        placeholder="Şirkətin tam adını daxil edin"
                      />
                    </label>
                    <label className={modalStyles.field}>
                      <span>Şirkətin adı (Qısa)</span>
                      <input
                        value={form.shortName}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, shortName: e.target.value }))
                        }
                        className={modalStyles.input}
                        placeholder="Qısa ad"
                      />
                    </label>
                    <div className={modalStyles.field}>
                      <span>Daşıyıcı tipi</span>
                      <div className={modalStyles.inlineControlRow}>
                        <div
                          className={modalStyles.grow}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleLookupSelectOpen();
                          }}
                        >
                          <Select
                            value={form.carrierType}
                            options={carrierTypeOptions}
                            placeholder="-"
                            onChange={(value) =>
                              setForm((prev: any) => ({ ...prev, carrierType: value }))
                            }
                            onOpenChange={(open) => {
                              if (open) handleLookupSelectOpen();
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          title="Daşıyıcı tipi əlavə et"
                          className={styles.plusButton}
                          onMouseDown={armLookupOpenFromPlus}
                          onClick={(e) => openLookupModal(e, "carrier-types")}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className={modalStyles.field}>
                      <span>Fəaliyyət növü</span>
                      <div className={modalStyles.inlineControlRow}>
                        <div
                          className={modalStyles.grow}
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
                    <label className={modalStyles.field}>
                      <span>VÖEN</span>
                      <input
                        value={form.voen}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, voen: e.target.value }))
                        }
                        className={modalStyles.input}
                        placeholder="VÖEN daxil edin"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Əlaqə məlumatları */}
                <div className={modalStyles.newPanelCard}>
                  <h3 className={modalStyles.newPanelCardTitle}>Əlaqə məlumatları</h3>
                  <div className={modalStyles.newPanelGrid}>
                    <div className={modalStyles.field} style={{ gridColumn: '1 / -1' }}>
                      <div className={modalStyles.sectionBox}>
                        <p className={modalStyles.sectionBoxTitle}>Daşıyıcı əlaqədar şəxsləri</p>
                        <p className={modalStyles.sectionBoxHint}>
                          Əlaqədar şəxsləri «İdarə et» düyməsi ilə əlavə edin.
                        </p>
                        <div className={modalStyles.inlineControlRow}>
                          <div className={modalStyles.contactPersonList} aria-hidden="true" />
                          <button
                            type="button"
                            className={modalStyles.manageButton}
                            onClick={() => setIsContactModalOpen(true)}
                            title="Əlaqədar şəxsləri idarə et"
                          >
                            İdarə et
                          </button>
                        </div>
                      </div>
                    </div>
                    <label className={modalStyles.field}>
                      <span>Telefon nömrəsi</span>
                      <input
                        value={form.contactInfo}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, contactInfo: e.target.value }))
                        }
                        className={modalStyles.input}
                        placeholder="+994 XX XXX XX XX"
                      />
                    </label>
                    <div className={modalStyles.field}>
                      <span>Ölkə</span>
                      <div className={modalStyles.inlineControlRow}>
                        <div
                          className={modalStyles.grow}
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
                    <label className={modalStyles.field} style={{ gridColumn: '1 / -1' }}>
                      <span>Ünvan</span>
                      <input
                        value={form.address}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, address: e.target.value }))
                        }
                        className={modalStyles.input}
                        placeholder="Tam ünvanı daxil edin"
                      />
                    </label>
                  </div>
                </div>

                {/* 3. Sənədlər */}
                <div className={modalStyles.newPanelCard}>
                  <h3 className={modalStyles.newPanelCardTitle}>Sənədlər</h3>
                  <div className={modalStyles.documentFormGrid}>
                    <label className={modalStyles.field}>
                      <span>Sənədin nömrəsi</span>
                      <input
                        value={documentDraft.number}
                        onChange={(e) =>
                          setDocumentDraft((prev) => ({ ...prev, number: e.target.value }))
                        }
                        className={modalStyles.input}
                        placeholder="Sənəd nömrəsini daxil edin"
                      />
                    </label>
                    <label className={modalStyles.field}>
                      <span>Sənədin növü</span>
                      <input
                        value={documentDraft.documentType}
                        onChange={(e) =>
                          setDocumentDraft((prev) => ({ ...prev, documentType: e.target.value }))
                        }
                        className={modalStyles.input}
                        placeholder="Məs: Müqavilə"
                      />
                    </label>
                    <label className={modalStyles.field}>
                      <span>Tarix</span>
                      <div className={modalStyles.inlineControlRow}>
                        <div className={modalStyles.grow}>
                          <input
                            type="date"
                            value={documentDraft.date}
                            onChange={(e) =>
                              setDocumentDraft((prev) => ({ ...prev, date: e.target.value }))
                            }
                            className={modalStyles.input}
                          />
                        </div>
                        <button
                          type="button"
                          title="Fayl seç və əlavə et"
                          className={modalStyles.plusButton}
                          disabled={isDocumentUploading}
                          onClick={() => openDocumentFilePicker(setForm)}
                        >
                          {isDocumentUploading ? "..." : "+"}
                        </button>
                      </div>
                    </label>
                  </div>
                  {form.documents.length > 0 ? (
                    <ul className={modalStyles.documentList}>
                      {form.documents.map((doc) => (
                        <li key={doc.id} className={modalStyles.documentItem}>
                          <div className={modalStyles.documentMeta}>
                            <span className={modalStyles.documentNumber} title={doc.number}>
                              {doc.number}
                            </span>
                            {doc.documentType ? (
                              <span className={modalStyles.documentType} title={doc.documentType}>
                                {doc.documentType}
                              </span>
                            ) : null}
                            <span className={modalStyles.documentDate}>{doc.date}</span>
                            {doc.fileName ? (
                              <span className={modalStyles.documentFileName} title={doc.fileName}>
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
                            className={modalStyles.documentRemove}
                            onClick={() => removeDocumentFromForm(setForm, doc.id)}
                            aria-label="Sənədi sil"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={modalStyles.documentEmpty}>Hələ sənəd əlavə edilməyib.</p>
                  )}
                </div>
              </div>

              <div className={modalStyles.newPanelFooter}>
                <button
                  type="button"
                  className={modalStyles.clearButton}
                  onClick={() => {
                    if (isEdit) closeEditModal();
                    else setActivePanel(null);
                  }}
                >
                  {isEdit ? "Ləğv et" : "Bağla"}
                </button>
                <button
                  type="button"
                  className={modalStyles.applyButton}
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
        title="Daşıyıcıni sil"
        message="Bu daşıyıcıni silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setCarrierIdToDelete(null);
        }}
        isLoading={isDeleting}
      />
      <ContactPersonManagerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        contacts={mergeCarrierFormContacts(
          (activePanel === "new" ? newForm : editForm).contactPersons,
          availableContacts,
          {
            mode: activePanel === "new" ? "new" : "edit",
            entityId: editingCarrierId,
          },
        )}
        onAdd={handleCreateContactPerson}
        onEdit={handleEditContactPerson}
        onRemove={handleRemoveContactPerson}
        entityName={(activePanel === "new" ? newForm : editForm).company}
        entityTypeLabel="daşıyıcı"
        emptyMessage="Bu daşıyıcıya aid heç bir əlaqədar şəxs tapılmadı."
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
                : "Daşıyıcı tipləri"
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

