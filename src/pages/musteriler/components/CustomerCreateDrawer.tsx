import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import layoutStyles from "../../sorgular/sorgular.module.css";
import panelStyles from "../musteriler.module.css";
import drawerStyles from "./CustomerCreateDrawer.module.css";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import { buildApiUrl } from "../../../common/utils/fetch.utils";
import {
  createCustomerAction,
  uploadCustomerDocumentFileAction,
} from "../../../common/actions/customer.actions";
import {
  createContactPersonAction,
  deleteContactPersonAction,
  fetchContactPersonsAction,
  updateContactPersonAction,
  type ContactPersonRow,
} from "../../../common/actions/contact.actions";
import { fetchLookupAction, type LookupRow } from "../../../common/actions/lookup.actions";
import { fetchUsersAction, type UserRow } from "../../../common/actions/user.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import { LookupManagerModal } from "../../../common/components/modal/LookupManagerModal";
import { ContactPersonManagerModal } from "../../../common/components/modal/ContactPersonManagerModal";
import { ConfirmModal } from "../../../common/components/ConfirmModal";
import type { ContactPersonFormData } from "../../../common/components/modal/ContactPersonFormModal";
import {
  contactPersonIdsFromList,
  mergeCarrierFormContacts,
  isPersistedContactPerson,
  scopeEntityContacts,
  normalizeCarrierContacts,
  serializeCarrierDocuments,
  uploadPendingCarrierDocuments,
  type CarrierDocumentItem,
} from "../../../common/utils/carrierDisplay.utils";
import { COUNTRY_OPTIONS } from "../../sorgular/constants/options.constants";

const PLACEHOLDER: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

type LookupModalType = "customer-types" | "activity-types" | "countries";

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

export interface CreatedCustomerSummary {
  id: string;
  name: string;
  company?: string;
}

interface CustomerCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (customer: CreatedCustomerSummary) => void;
}

export function CustomerCreateDrawer({
  isOpen,
  onClose,
  onCreated,
}: CustomerCreateDrawerProps) {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
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
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const lookupOpenFromPlusRef = useRef(false);

  const customerTypeOptions = useMemo(
    () => toLookupOptions(customerTypesData),
    [customerTypesData],
  );
  const activityTypeOptions = useMemo(
    () => toLookupOptions(activityTypesData),
    [activityTypesData],
  );
  const countryOptions = useMemo(() => toLookupOptions(countriesData), [countriesData]);

  const userOpts = [
    { value: "", label: "Menecer seçin" },
    ...usersData.map((u) => ({ value: String(u.id), label: u.name })),
  ];

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setDocumentDraft({ number: "", documentType: "", date: "" });
    pendingDocumentFilesRef.current.clear();
    setActiveLookupModal(null);
    lookupOpenFromPlusRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    void Promise.all([
      fetchContactPersonsAction({ entityType: "customer" }).then(setAvailableContacts).catch(() => {}),
      fetchUsersAction().then(setUsersData).catch(() => {}),
      fetchLookupAction("customer-types").then(setCustomerTypesData).catch(() => setCustomerTypesData([])),
      fetchLookupAction("activity-types").then(setActivityTypesData).catch(() => setActivityTypesData([])),
      fetchLookupAction("countries")
        .then(setCountriesData)
        .catch(() =>
          setCountriesData(
            COUNTRY_OPTIONS.map((option) => ({
              id: option.value,
              value: option.value,
              label: option.label,
            })),
          ),
        ),
    ]);
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isOpen]);

  const handleLookupDataChanged = (data: LookupRow[]) => {
    if (activeLookupModal === "customer-types") setCustomerTypesData(data);
    else if (activeLookupModal === "activity-types") setActivityTypesData(data);
    else if (activeLookupModal === "countries") setCountriesData(data);
  };

  const openLookupModal = (event: MouseEvent<HTMLButtonElement>, type: LookupModalType) => {
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

  const openDocumentFilePicker = () => {
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
    const setFormState = documentFormSetterRef.current;
    event.target.value = "";
    if (!file || !setFormState) return;

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

    setFormState((prev) => ({
      ...prev,
      documents: [...prev.documents, newDocument],
    }));
    setDocumentDraft({ number: "", documentType: "", date: "" });
    documentFormSetterRef.current = null;
    dispatch(showNotification({ message: "Sənəd əlavə edildi", type: "added" }));
  };

  const resolveDocumentsForSave = async (documents: CarrierDocumentItem[]) => {
    if (pendingDocumentFilesRef.current.size === 0) return documents;
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

  const removeDocumentFromForm = (documentId: string) => {
    pendingDocumentFilesRef.current.delete(documentId);
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== documentId),
    }));
    dispatch(showNotification({ message: "Sənəd silindi", type: "deleted" }));
  };

  const requestRemoveDocument = (documentId: string) => {
    setDeleteConfirm({
      title: "Sənədi sil",
      message: "Bu sənədi silmək istədiyinizə əminsiniz?",
      onConfirm: () => removeDocumentFromForm(documentId),
    });
  };

  const requestRemoveContactPerson = (contact: ContactPersonRow) => {
    setDeleteConfirm({
      title: "Əlaqədar şəxsi sil",
      message: `"${contact.fullName}" əlaqədar şəxsini silmək istədiyinizə əminsiniz?`,
      onConfirm: () => handleRemoveContactPerson(contact),
    });
  };

  const handleCreateContactPerson = async (data: ContactPersonFormData) => {
    try {
      const newContact = await createContactPersonAction({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        position: data.position,
        company: data.company || form.company || "",
        entityType: "customer",
      });

      const nextContactPersons = mergeCarrierFormContacts(
        normalizeCarrierContacts(form.contactPersons, [newContact]),
        normalizeCarrierContacts(availableContacts, [newContact]),
        { mode: "new", entityId: null },
      );

      setForm((prev) => ({
        ...prev,
        contactPersons: nextContactPersons,
        contactPerson: contactPersonIdsFromList(nextContactPersons),
      }));
      setAvailableContacts((prev) => normalizeCarrierContacts(prev, [newContact]));
      dispatch(showNotification({ message: "Yeni müştəri əlaqədar şəxs əlavə edildi", type: "added" }));
    } catch {
      dispatch(showNotification({ message: "Əlaqədar şəxs yaradılarkən xəta baş verdi", type: "error" }));
      throw new Error("contact create failed");
    }
  };

  const handleEditContactPerson = async (contact: ContactPersonRow, data: ContactPersonFormData) => {
    const contactOptions = { mode: "new" as const, entityId: null };
    const scopedAvailable = scopeEntityContacts(availableContacts, contactOptions);
    const mergedContacts = mergeCarrierFormContacts(form.contactPersons, availableContacts, contactOptions);

    try {
      const company = data.company || contact.company || form.company || "";
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

      dispatch(showNotification({ message: "Əlaqədar şəxs yeniləndi", type: "updated" }));
    } catch {
      dispatch(showNotification({ message: "Əlaqədar şəxs yenilənərkən xəta baş verdi", type: "error" }));
      throw new Error("contact update failed");
    }
  };

  const handleRemoveContactPerson = async (contact: ContactPersonRow) => {
    const mergedContacts = mergeCarrierFormContacts(form.contactPersons, availableContacts, {
      mode: "new",
      entityId: null,
    });
    const nextContactPersons = mergedContacts.filter((c) => String(c.id) !== String(contact.id));
    const scopedAvailable = scopeEntityContacts(availableContacts, { mode: "new", entityId: null });

    try {
      if (isPersistedContactPerson(contact, scopedAvailable)) {
        await deleteContactPersonAction(String(contact.id));
      }

      setForm((prev) => ({
        ...prev,
        contactPersons: nextContactPersons,
        contactPerson: contactPersonIdsFromList(nextContactPersons),
      }));
      setAvailableContacts((prev) =>
        prev.filter((item) => String(item.id) !== String(contact.id)),
      );
      dispatch(showNotification({ message: "Əlaqədar şəxs silindi", type: "deleted" }));
    } catch {
      dispatch(showNotification({ message: "Əlaqədar şəxs silinərkən xəta baş verdi", type: "error" }));
    }
  };

  const handleCreateCustomer = async () => {
    if (!form.company.trim()) {
      dispatch(
        showNotification({
          message: "Şirkətin adı mütləqdir",
          type: "warning",
        }),
      );
      return;
    }

    try {
      const documents = await resolveDocumentsForSave(form.documents);
      const payload = {
        name: form.company.trim(),
        customerType: getLookupLabel(form.customerType, customerTypeOptions) || "Yeni müştəri",
        manager: form.manager.trim(),
        contactPersons: form.contactPersons,
        contactPerson: contactPersonIdsFromList(form.contactPersons),
        phone: form.contactInfo.trim(),
        address: form.address.trim(),
        company: form.company.trim(),
        shortName: form.shortName.trim(),
        activityType: getLookupLabel(form.activityType, activityTypeOptions),
        taxNumber: form.voen.trim(),
        country: form.country.trim(),
        documents: serializeCarrierDocuments(documents),
      };
      const created = await createCustomerAction(payload);
      pendingDocumentFilesRef.current.clear();
      dispatch(showNotification({ message: "Müştəri uğurla yaradıldı", type: "success" }));
      onCreated?.({
        id: String(created?.id ?? ""),
        name: created?.name || form.company.trim(),
        company: created?.company || form.company.trim(),
      });
      handleClose();
    } catch {
      dispatch(showNotification({ message: "Müştəri yaradılarkən xəta baş verdi", type: "error" }));
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className={`${drawerStyles.portal} ${drawerStyles.portalOpen}`}>
      <div
        className={`${layoutStyles.overlay} ${layoutStyles.overlayOpen}`}
        aria-hidden="false"
      />
      <aside className={`${layoutStyles.drawer} ${layoutStyles.drawerOpen}`}>
        <div className={panelStyles.newPanel}>
          <div className={panelStyles.newPanelHeader}>
            <div>
              <h2 className={panelStyles.newPanelTitle}>Yeni müştəri</h2>
              <p className={panelStyles.newPanelDescription}>
                Müştəri məlumatlarını doldurub yaddaşa əlavə edin.
              </p>
            </div>
            <button
              type="button"
              className={panelStyles.newPanelClose}
              onClick={handleClose}
              aria-label="Bağla"
            >
              ×
            </button>
          </div>

          <div className={panelStyles.newPanelBody}>
            <div className={panelStyles.newPanelCard}>
              <h3 className={panelStyles.newPanelCardTitle}>Əsas məlumatlar</h3>
              <div className={panelStyles.newPanelGrid}>
                <label className={panelStyles.field}>
                  <span>Şirkətin adı (Tam) *</span>
                  <input
                    value={form.company}
                    onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                    className={panelStyles.input}
                    placeholder="Şirkətin tam adını daxil edin"
                  />
                </label>
                <label className={panelStyles.field}>
                  <span>Şirkətin adı (Qısa)</span>
                  <input
                    value={form.shortName}
                    onChange={(e) => setForm((prev) => ({ ...prev, shortName: e.target.value }))}
                    className={panelStyles.input}
                    placeholder="Qısa ad"
                  />
                </label>
                <div className={panelStyles.field}>
                  <span>Müştəri tipi</span>
                  <div className={panelStyles.inlineControlRow}>
                    <div
                      className={panelStyles.grow}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleLookupSelectOpen();
                      }}
                    >
                      <Select
                        value={form.customerType}
                        options={customerTypeOptions}
                        placeholder="-"
                        onChange={(value) => setForm((prev) => ({ ...prev, customerType: value }))}
                        onOpenChange={(open) => {
                          if (open) handleLookupSelectOpen();
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      title="Müştəri tipi əlavə et"
                      className={panelStyles.plusButton}
                      onMouseDown={armLookupOpenFromPlus}
                      onClick={(e) => openLookupModal(e, "customer-types")}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className={panelStyles.field}>
                  <span>Fəaliyyət növü</span>
                  <div className={panelStyles.inlineControlRow}>
                    <div
                      className={panelStyles.grow}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleLookupSelectOpen();
                      }}
                    >
                      <Select
                        value={form.activityType}
                        options={activityTypeOptions}
                        placeholder="-"
                        onChange={(value) => setForm((prev) => ({ ...prev, activityType: value }))}
                        onOpenChange={(open) => {
                          if (open) handleLookupSelectOpen();
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      title="Fəaliyyət növü əlavə et"
                      className={panelStyles.plusButton}
                      onMouseDown={armLookupOpenFromPlus}
                      onClick={(e) => openLookupModal(e, "activity-types")}
                    >
                      +
                    </button>
                  </div>
                </div>
                <label className={panelStyles.field}>
                  <span>VÖEN</span>
                  <input
                    value={form.voen}
                    onChange={(e) => setForm((prev) => ({ ...prev, voen: e.target.value }))}
                    className={panelStyles.input}
                    placeholder="VÖEN daxil edin"
                  />
                </label>
                <label className={panelStyles.field}>
                  <span>Menecer</span>
                  <Select
                    value={form.manager}
                    options={userOpts}
                    onChange={(value) => setForm((prev) => ({ ...prev, manager: value }))}
                  />
                </label>
              </div>
            </div>

            <div className={panelStyles.newPanelCard}>
              <h3 className={panelStyles.newPanelCardTitle}>Əlaqə məlumatları</h3>
              <div className={panelStyles.newPanelGrid}>
                <div className={panelStyles.field} style={{ gridColumn: "1 / -1" }}>
                  <div className={panelStyles.sectionBox}>
                    <p className={panelStyles.sectionBoxTitle}>Müştəri əlaqədar şəxsləri</p>
                    <p className={panelStyles.sectionBoxHint}>
                      Əlaqədar şəxsləri «İdarə et» düyməsi ilə əlavə edin.
                    </p>
                    <div className={panelStyles.inlineControlRow}>
                      <div className={panelStyles.contactPersonList} aria-hidden="true" />
                      <button
                        type="button"
                        className={panelStyles.manageButton}
                        onClick={() => setIsContactModalOpen(true)}
                        title="Əlaqədar şəxsləri idarə et"
                      >
                        İdarə et
                      </button>
                    </div>
                  </div>
                </div>
                <label className={panelStyles.field}>
                  <span>Telefon nömrəsi</span>
                  <input
                    value={form.contactInfo}
                    onChange={(e) => setForm((prev) => ({ ...prev, contactInfo: e.target.value }))}
                    className={panelStyles.input}
                    placeholder="+994 XX XXX XX XX"
                  />
                </label>
                <div className={panelStyles.field}>
                  <span>Ölkə</span>
                  <div className={panelStyles.inlineControlRow}>
                    <div
                      className={panelStyles.grow}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleLookupSelectOpen();
                      }}
                    >
                      <Select
                        value={form.country}
                        options={countryOptions}
                        placeholder="-"
                        onChange={(value) => setForm((prev) => ({ ...prev, country: value }))}
                        onOpenChange={(open) => {
                          if (open) handleLookupSelectOpen();
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      title="Ölkə əlavə et"
                      className={panelStyles.plusButton}
                      onMouseDown={armLookupOpenFromPlus}
                      onClick={(e) => openLookupModal(e, "countries")}
                    >
                      +
                    </button>
                  </div>
                </div>
                <label className={panelStyles.field} style={{ gridColumn: "1 / -1" }}>
                  <span>Ünvan</span>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    className={panelStyles.input}
                    placeholder="Tam ünvanı daxil edin"
                  />
                </label>
              </div>
            </div>

            <div className={panelStyles.newPanelCard}>
              <h3 className={panelStyles.newPanelCardTitle}>Sənədlər</h3>
              <div className={panelStyles.documentFormGrid}>
                <label className={panelStyles.field}>
                  <span>Sənədin nömrəsi</span>
                  <input
                    value={documentDraft.number}
                    onChange={(e) => setDocumentDraft((prev) => ({ ...prev, number: e.target.value }))}
                    className={panelStyles.input}
                    placeholder="Sənəd nömrəsini daxil edin"
                  />
                </label>
                <label className={panelStyles.field}>
                  <span>Sənədin növü</span>
                  <input
                    value={documentDraft.documentType}
                    onChange={(e) =>
                      setDocumentDraft((prev) => ({ ...prev, documentType: e.target.value }))
                    }
                    className={panelStyles.input}
                    placeholder="Məs: Müqavilə"
                  />
                </label>
                <label className={panelStyles.field}>
                  <span>Tarix</span>
                  <div className={panelStyles.inlineControlRow}>
                    <div className={panelStyles.grow}>
                      <input
                        type="date"
                        value={documentDraft.date}
                        onChange={(e) => setDocumentDraft((prev) => ({ ...prev, date: e.target.value }))}
                        className={panelStyles.input}
                      />
                    </div>
                    <button
                      type="button"
                      title="Fayl seç və əlavə et"
                      className={panelStyles.plusButton}
                      disabled={isDocumentUploading}
                      onClick={openDocumentFilePicker}
                    >
                      {isDocumentUploading ? "..." : "+"}
                    </button>
                  </div>
                </label>
              </div>
              {form.documents.length > 0 ? (
                <ul className={panelStyles.documentList}>
                  {form.documents.map((doc) => (
                    <li key={doc.id} className={panelStyles.documentItem}>
                      <div className={panelStyles.documentMeta}>
                        <span className={panelStyles.documentNumber} title={doc.number}>
                          {doc.number}
                        </span>
                        {doc.documentType ? (
                          <span className={panelStyles.documentType} title={doc.documentType}>
                            {doc.documentType}
                          </span>
                        ) : null}
                        <span className={panelStyles.documentDate}>{doc.date}</span>
                        {doc.fileName ? (
                          <span className={panelStyles.documentFileName} title={doc.fileName}>
                            {doc.fileUrl ? (
                              <a href={buildApiUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer">
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
                        className={panelStyles.documentRemove}
                        onClick={() => requestRemoveDocument(doc.id!)}
                        aria-label="Sənədi sil"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={panelStyles.documentEmpty}>Hələ sənəd əlavə edilməyib.</p>
              )}
            </div>
          </div>

          <div className={panelStyles.newPanelFooter}>
            <button type="button" className={panelStyles.clearButton} onClick={handleClose}>
              Bağla
            </button>
            <button type="button" className={panelStyles.applyButton} onClick={handleCreateCustomer}>
              Yaddaşda saxlamaq
            </button>
          </div>
        </div>
      </aside>

      <ContactPersonManagerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        contacts={mergeCarrierFormContacts(form.contactPersons, availableContacts, {
          mode: "new",
          entityId: null,
        })}
        onAdd={handleCreateContactPerson}
        onEdit={handleEditContactPerson}
        onRemove={(contact) => requestRemoveContactPerson(contact)}
        entityName={form.company}
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

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title={deleteConfirm?.title ?? ""}
        message={deleteConfirm?.message ?? ""}
        onConfirm={async () => {
          if (!deleteConfirm) return;
          setIsDeleting(true);
          try {
            await deleteConfirm.onConfirm();
            setDeleteConfirm(null);
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
        isLoading={isDeleting}
      />

      <input
        ref={documentInputRef}
        type="file"
        className={panelStyles.hiddenFileInput}
        onChange={handleDocumentFileSelected}
      />
    </div>,
    document.body,
  );
}
