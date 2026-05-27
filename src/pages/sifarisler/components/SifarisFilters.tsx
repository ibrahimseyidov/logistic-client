import { useState } from "react";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import FilterPanelShell from "./FilterPanelShell";
import formStyles from "./FilterForms.module.css";
import {
  FILTER_SECTIONS,
} from "../constants/sifaris.constants";
import type {
  SifarisFilterFormState,
  SifarisFilterSectionId,
} from "../types/sifaris.types";

interface Props {
  activeSections: Set<SifarisFilterSectionId>;
  toggleSection: (id: SifarisFilterSectionId) => void;
  filter: SifarisFilterFormState;
  onFilterChange: (field: keyof SifarisFilterFormState, value: string) => void;
  companyOptions: SelectOption[];
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
  onSaveTemplate: (name: string) => void;
  templates: Array<{ name: string; filter: SifarisFilterFormState; activeSections: SifarisFilterSectionId[] }>;
  onLoadTemplate: (name: string) => void;
}

export default function SifarisFilters({
  activeSections,
  toggleSection,
  filter,
  onFilterChange,
  companyOptions,
  onClose,
  onClear,
  onApplyFilter,
  onSaveTemplate,
  templates,
  onLoadTemplate,
}: Props) {
  const [newTemplateName, setNewTemplateName] = useState("");

  const handleSaveClick = () => {
    if (!newTemplateName.trim()) return;
    onSaveTemplate(newTemplateName.trim());
    setNewTemplateName("");
  };

  return (
    <FilterPanelShell
      title="Filtrlər"
      description="Sifarişləri daha sürətli tapmaq üçün status, tarix və müştəri meyarlarına görə görünüşü fərdiləşdirin."
      sections={FILTER_SECTIONS}
      activeSections={activeSections}
      onToggleSection={toggleSection}
      onClose={onClose}
      onClear={onClear}
      onApplyFilter={onApplyFilter}
      onSaveTemplate={() => {
        const timeStr = new Date().toLocaleString("az-AZ").replace(",", "");
        onSaveTemplate(`Şablon (${timeStr})`);
      }}
    >
      <div className={formStyles.stack}>
        {/* ID Section */}
        {activeSections.has("id") && (
          <div className={`${formStyles.section} ${formStyles.grid2}`}>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Sifarişin nömrəsi</span>
              <input
                className={formStyles.input}
                value={filter.orderNumber}
                onChange={(e) => onFilterChange("orderNumber", e.target.value)}
                placeholder="Sifariş nömrəsi"
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Şirkət</span>
              <Select
                value={filter.company}
                options={companyOptions}
                onChange={(v) => onFilterChange("company", v)}
                placeholder="Hamısı"
              />
            </label>
          </div>
        )}

        {/* Dates Section */}
        {activeSections.has("dates") && (
          <div className={`${formStyles.section} ${formStyles.sectionStack}`}>
            <fieldset className={formStyles.dateFieldset}>
              <div className={formStyles.fieldsetInner}>
                <legend className={formStyles.legend}>
                  Sifarişin tarixi
                </legend>
                <div className={formStyles.pairGrid}>
                  <label className={formStyles.label}>
                    <span className={formStyles.mutedText}>Tarixindən</span>
                    <input
                      type="date"
                      className={formStyles.input}
                      value={filter.orderDateFrom}
                      onChange={(e) =>
                        onFilterChange("orderDateFrom", e.target.value)
                      }
                    />
                  </label>
                  <label className={formStyles.label}>
                    <span className={formStyles.mutedText}>
                      Tarixinə qədər
                    </span>
                    <input
                      type="date"
                      className={formStyles.input}
                      value={filter.orderDateTo}
                      onChange={(e) =>
                        onFilterChange("orderDateTo", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            </fieldset>
          </div>
        )}

        {/* Customers Section */}
        {activeSections.has("customers") && (
          <div className={`${formStyles.section} ${formStyles.grid2}`}>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Müştəri tipi</span>
              <Select
                value={filter.customerType}
                options={[
                  { value: "", label: "Dəyəri seçin" },
                  { value: "physical", label: "Fiziki şəxs" },
                  { value: "legal", label: "Hüquqi şəxs" },
                ]}
                onChange={(v) => onFilterChange("customerType", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Müştəri</span>
              <input
                className={formStyles.input}
                value={filter.customerName}
                onChange={(e) => onFilterChange("customerName", e.target.value)}
                placeholder="Müştəri"
              />
            </label>
          </div>
        )}

        {/* Loads Section */}
        {activeSections.has("loads") && (
          <div className={`${formStyles.section} ${formStyles.grid2}`}>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Yükləmə yeri ölkəsi</span>
              <input
                className={formStyles.input}
                placeholder="Ölkə"
                value={filter.loadCountry}
                onChange={(e) => onFilterChange("loadCountry", e.target.value)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Boşaltma yeri ölkəsi</span>
              <input
                className={formStyles.input}
                placeholder="Ölkə"
                value={filter.unloadCountry}
                onChange={(e) => onFilterChange("unloadCountry", e.target.value)}
              />
            </label>
          </div>
        )}

        {/* Users Section */}
        {activeSections.has("users") && (
          <div className={`${formStyles.section} ${formStyles.grid2}`}>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Menecer</span>
              <Select
                value={filter.manager}
                options={[
                  { value: "", label: "Menecer" },
                  { value: "m1", label: "Manager 1" },
                  { value: "m2", label: "Manager 2" },
                ]}
                onChange={(v) => onFilterChange("manager", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Şöbə</span>
              <Select
                value={filter.department}
                options={[
                  { value: "", label: "Şöbə" },
                  { value: "dep1", label: "Logistika" },
                  { value: "dep2", label: "Maliyyə" },
                ]}
                onChange={(v) => onFilterChange("department", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Reysin ekspeditoru</span>
              <Select
                value={filter.voyageExpeditor}
                options={[
                  { value: "", label: "Reysin ekspeditoru" },
                  { value: "e1", label: "Expeditor 1" },
                ]}
                onChange={(v) => onFilterChange("voyageExpeditor", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Order Forwarder</span>
              <Select
                value={filter.orderForwarder}
                options={[
                  { value: "", label: "Order Forwarder" },
                  { value: "of1", label: "Forwarder 1" },
                ]}
                onChange={(v) => onFilterChange("orderForwarder", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Əlavə menecerlər</span>
              <Select
                value={filter.extraManagers}
                options={[
                  { value: "", label: "Əlavə menecerlər" },
                  { value: "em1", label: "Extra Manager 1" },
                ]}
                onChange={(v) => onFilterChange("extraManagers", v)}
              />
            </label>
          </div>
        )}

        {/* Documents Section */}
        {activeSections.has("documents") && (
          <div className={`${formStyles.section} ${formStyles.grid2}`}>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Alınmış hesablar</span>
              <Select
                value={filter.receivedInvoices}
                options={[
                  { value: "", label: "Hamısı" },
                  { value: "received", label: "Alınmışlar" },
                  { value: "not_received", label: "Alınmayanlar" },
                ]}
                onChange={(v) => onFilterChange("receivedInvoices", v)}
              />
            </label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                justifyContent: "center",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: "#4b5563",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!filter.noDoubleInvoices}
                  onChange={(e) =>
                    onFilterChange(
                      "noDoubleInvoices",
                      e.target.checked ? "true" : "",
                    )
                  }
                />
                İkili sürülmüş hesablar yoxdur
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: "#4b5563",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!filter.noPreliminaryInvoices}
                  onChange={(e) =>
                    onFilterChange(
                      "noPreliminaryInvoices",
                      e.target.checked ? "true" : "",
                    )
                  }
                />
                Ne preliminary invoices
              </label>
            </div>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>
                Göndərilən hesabla ödənilib
              </span>
              <Select
                value={filter.paidWithSentInvoice}
                options={[
                  { value: "", label: "Göndərilən..." },
                  { value: "yes", label: "Bəli" },
                  { value: "no", label: "Xeyr" },
                ]}
                onChange={(v) => onFilterChange("paidWithSentInvoice", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Alınmış hesabla ödənilib</span>
              <Select
                value={filter.paidWithReceivedInvoice}
                options={[
                  { value: "", label: "Alınmış..." },
                  { value: "yes", label: "Bəli" },
                  { value: "no", label: "Xeyr" },
                ]}
                onChange={(v) => onFilterChange("paidWithReceivedInvoice", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Hesabın nömrəsi</span>
              <input
                className={formStyles.input}
                value={filter.invoiceNumber}
                onChange={(e) => onFilterChange("invoiceNumber", e.target.value)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>
                Bizə-müraciətinin nömrəsi
              </span>
              <input
                className={formStyles.input}
                value={filter.ourReferenceNumber}
                onChange={(e) =>
                  onFilterChange("ourReferenceNumber", e.target.value)
                }
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Akt var</span>
              <Select
                value={filter.hasAct}
                options={[
                  { value: "", label: "Akt var" },
                  { value: "yes", label: "Bəli" },
                  { value: "no", label: "Xeyr" },
                ]}
                onChange={(v) => onFilterChange("hasAct", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>CMR əsas</span>
              <Select
                value={filter.cmrBase}
                options={[
                  { value: "", label: "Hamısı" },
                  { value: "yes", label: "Bəli" },
                  { value: "no", label: "Xeyr" },
                ]}
                onChange={(v) => onFilterChange("cmrBase", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>CMR №</span>
              <input
                className={formStyles.input}
                value={filter.cmrNumber}
                onChange={(e) => onFilterChange("cmrNumber", e.target.value)}
              />
            </label>
          </div>
        )}

        {/* Transport Section */}
        {activeSections.has("transport") && (
          <div className={`${formStyles.section} ${formStyles.grid2}`}>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Daşıyıcı</span>
              <input
                className={formStyles.input}
                placeholder="Daşıyıcı"
                value={filter.carrier}
                onChange={(e) => onFilterChange("carrier", e.target.value)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>
                Daşıyıcının sistemində nömrə
              </span>
              <input
                className={formStyles.input}
                value={filter.carrierSystemNumber}
                onChange={(e) =>
                  onFilterChange("carrierSystemNumber", e.target.value)
                }
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Nəqliyyat tipi</span>
              <Select
                value={filter.transportType}
                options={[
                  { value: "", label: "Nəqliyyat tipi" },
                  { value: "truck", label: "TIR" },
                  { value: "rail", label: "Qatar" },
                  { value: "vessel", label: "Gəmi" },
                ]}
                onChange={(v) => onFilterChange("transportType", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>
                Nəqliyyat vasitəsinin nömrələri
              </span>
              <input
                className={formStyles.input}
                value={filter.transportPlate}
                onChange={(e) => onFilterChange("transportPlate", e.target.value)}
              />
            </label>
          </div>
        )}

        {/* Sorting Section */}
        {activeSections.has("sort") && (
          <div className={`${formStyles.section} ${formStyles.grid2}`}>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Üzrə</span>
              <Select
                value={filter.sortBy}
                options={[
                  { value: "nr", label: "Nr" },
                  { value: "date", label: "Tarix" },
                  { value: "customer", label: "Müştəri" },
                ]}
                onChange={(v) => onFilterChange("sortBy", v)}
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Qaydada</span>
              <Select
                value={filter.sortOrder}
                options={[
                  { value: "desc", label: "Azalma ilə" },
                  { value: "asc", label: "Artma ilə" },
                ]}
                onChange={(v) => onFilterChange("sortOrder", v)}
              />
            </label>
          </div>
        )}

        {/* Templates Section */}
        {activeSections.has("templates") && (
          <div className={`${formStyles.section} ${formStyles.sectionStack}`}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "#1f2937",
                borderBottom: "1px solid #f3f4f6",
                paddingBottom: "0.5rem",
              }}
            >
              Şablonlar
            </div>
            
            <div className={formStyles.grid2} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "1.25rem" }}>
              <label className={formStyles.label}>
                <span className={formStyles.labelText} style={{ fontWeight: 600 }}>Şablon seçin (Mövcud Şablonlar)</span>
                <p className={formStyles.helperText} style={{ fontStyle: "normal", color: "#6b7280", margin: "0.125rem 0 0.375rem" }}>
                  Sürətli doldurmaq üçün mövcud şablonlardan birini seçin:
                </p>
                <Select
                  value=""
                  options={[
                    { value: "", label: "Şablon seçin..." },
                    ...templates.map((t) => ({ value: t.name, label: t.name })),
                  ]}
                  onChange={(v) => {
                    if (v) onLoadTemplate(v);
                  }}
                />
              </label>
            </div>

            <div className={formStyles.grid2} style={{ paddingTop: "0.25rem" }}>
              <label className={formStyles.label}>
                <span className={formStyles.labelText} style={{ fontWeight: 600 }}>Yeni şablon yarat</span>
                <p className={formStyles.helperText} style={{ fontStyle: "normal", color: "#6b7280", margin: "0.125rem 0 0.375rem" }}>
                  Cari seçdiyiniz filtrlərə (məs. davam edən, planlaşdırılan statuslu və s.) uyğun şablon yaradın:
                </p>
                <input
                  type="text"
                  className={formStyles.input}
                  placeholder="Məs. Davam edən və ya planlaşdırılan ödəmələr"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  style={{ height: "38px" }}
                />
              </label>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={!newTemplateName.trim()}
                  className={`${formStyles.input}`}
                  style={{
                    background: newTemplateName.trim() ? "#ecfdf5" : "#f3f4f6",
                    color: newTemplateName.trim() ? "#065f46" : "#9ca3af",
                    border: newTemplateName.trim() ? "1px solid #a7f3d0" : "1px solid #e5e7eb",
                    fontWeight: 600,
                    cursor: newTemplateName.trim() ? "pointer" : "not-allowed",
                    textAlign: "center",
                    height: "38px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  Cari filtri şablon kimi saxla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FilterPanelShell>
  );
}
