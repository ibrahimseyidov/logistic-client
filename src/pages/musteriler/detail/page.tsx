"use client";

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MOCK_ROWS } from "../data";
import styles from "./musteriDetail.module.css";

const TAB_ITEMS = [
  "Əsas məlumat",
  "İnfoqrafika",
  "Sənədlər",
  "Uğursuzluqlar",
  "Tapşırıqlar",
  "Satışlar",
  "Tarixçə",
];

export default function MusteriDetailPage() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<"main" | "contact" | "finance">("main");
  const [managerInput, setManagerInput] = useState("");
  const [managerTags, setManagerTags] = useState<string[]>([]);
  const [bankTags, setBankTags] = useState<string[]>([]);
  const [correspondentBankTags, setCorrespondentBankTags] = useState<string[]>([]);
  const [bankModalTarget, setBankModalTarget] = useState<"bank" | "correspondent" | null>(null);
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [bankAccounts, setBankAccounts] = useState([
    {
      currency: "",
      bankAccount: "",
      bank: "",
      transitAccount: "",
      correspondentBank: "",
      correspondentAccount: "",
    },
  ]);
  const [bankModalForm, setBankModalForm] = useState({
    alias: "",
    name: "",
    branch: "",
    bik: "",
    swift: "",
    country: "",
    city: "",
    address: "",
    postalCode: "",
  });
  const [editForm, setEditForm] = useState({
    createdAt: "",
    company: "",
    customerType: "",
    manager: "",
    contactPerson: "",
    contactInfo: "",
    address: "",
    notificationsLang: "",
    notes: "",
    currency: "",
    bankAccount: "",
    bank: "",
    transitAccount: "",
    correspondentBank: "",
    correspondentAccount: "",
    deferPayment: "",
    deferTerms: "B/k 30 təqvim günü.",
    creditLimit: "",
    docsEmail: "",
  });
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedCorrespondentBank, setSelectedCorrespondentBank] = useState("");

  const customer = useMemo(
    () => MOCK_ROWS.find((row) => row.id === customerId) ?? null,
    [customerId],
  );

  if (!customer) {
    return (
      <div className={styles.notFound}>
        <p>Müştəri tapılmadı.</p>
        <button type="button" onClick={() => navigate("/musteriler")}>
          Geri qayıt
        </button>
      </div>
    );
  }

  const openEditModal = () => {
    setActiveEditTab("main");
    setEditForm({
      createdAt: "16.01.2026",
      company: customer.company,
      customerType: customer.customerType,
      manager: customer.manager,
      contactPerson: customer.contactPerson,
      contactInfo: customer.contactInfo,
      address: customer.address,
      notificationsLang: "",
      notes: "",
      currency: "",
      bankAccount: "",
      bank: "",
      transitAccount: "",
      correspondentBank: "",
      correspondentAccount: "",
      deferPayment: "",
      deferTerms: "B/k 30 təqvim günü.",
      creditLimit: customer.creditLimit ?? "",
      docsEmail: "",
    });
    setManagerTags(customer.manager ? [customer.manager] : []);
    setManagerInput("");
    setBankTags([]);
    setCorrespondentBankTags([]);
    setSelectedBank("");
    setSelectedCorrespondentBank("");
    setBankAccounts([
      {
        currency: "",
        bankAccount: "",
        bank: "",
        transitAccount: "",
        correspondentBank: "",
        correspondentAccount: "",
      },
    ]);
    setActiveAccountIndex(0);
    setIsEditOpen(true);
  };

  const addManagerTag = () => {
    const normalized = managerInput.trim();
    if (!normalized) return;
    if (managerTags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      setManagerInput("");
      return;
    }
    setManagerTags((prev) => [...prev, normalized]);
    setManagerInput("");
  };

  const removeManagerTag = (tagToRemove: string) => {
    setManagerTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const openBankModal = (target: "bank" | "correspondent") => {
    setBankModalTarget(target);
    setBankModalForm({
      alias: "",
      name: "",
      branch: "",
      bik: "",
      swift: "",
      country: "",
      city: "",
      address: "",
      postalCode: "",
    });
  };

  const closeBankModal = () => {
    setBankModalTarget(null);
  };

  const saveBankFromModal = () => {
    const normalized = bankModalForm.name.trim();
    if (!normalized || !bankModalTarget) return;
    if (bankModalTarget === "bank") {
      if (!bankTags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
        setBankTags((prev) => [...prev, normalized]);
      }
      setSelectedBank(normalized);
      setBankAccounts((prev) =>
        prev.map((account, idx) =>
          idx === activeAccountIndex ? { ...account, bank: normalized } : account,
        ),
      );
    } else {
      if (!correspondentBankTags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
        setCorrespondentBankTags((prev) => [...prev, normalized]);
      }
      setSelectedCorrespondentBank(normalized);
      setBankAccounts((prev) =>
        prev.map((account, idx) =>
          idx === activeAccountIndex
            ? { ...account, correspondentBank: normalized }
            : account,
        ),
      );
    }
    closeBankModal();
  };

  const addBankAccountRow = () => {
    setBankAccounts((prev) => [
      ...prev,
      {
        currency: "",
        bankAccount: "",
        bank: "",
        transitAccount: "",
        correspondentBank: "",
        correspondentAccount: "",
      },
    ]);
  };

  const removeBankAccountRow = (indexToRemove: number) => {
    setBankAccounts((prev) => {
      if (prev.length <= 1) {
        return [
          {
            currency: "",
            bankAccount: "",
            bank: "",
            transitAccount: "",
            correspondentBank: "",
            correspondentAccount: "",
          },
        ];
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
    setActiveAccountIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.companyName}>{customer.company}</div>
        <div className={styles.tabs}>
          {TAB_ITEMS.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tabButton} ${idx === 0 ? styles.activeTab : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.quickActions}>
        <button type="button">Yenilə</button>
        <button type="button" onClick={openEditModal}>
          + Redaktə et
        </button>
      </div>

      <div className={styles.content}>
        <aside className={styles.sidePanel}>
          <div className={styles.sideSection}>
            <p>
              <span>Seçilən qrafik sütunu:</span> {customer.salesGroup}
            </p>
            <p>
              <span>Müştəri tipi:</span> {customer.customerType}
            </p>
            <p>
              <span>Ödəniş şərtləri:</span> 5k 30 təqvim günü
            </p>
            <p>
              <span>Yaradılma tarixi:</span> 16.01.2026
            </p>
            <p>
              <span>Menecer:</span> {customer.manager}
            </p>
          </div>
          <div className={styles.sideNav}>
            <button type="button" className={styles.sideNavActive}>
              Sifarişlər
            </button>
            <button type="button">Aktiv sorğular</button>
            <button type="button">Arxiv sorğuları</button>
          </div>
        </aside>

        <section className={styles.mainPanel}>
          <div className={styles.infoCard}>
            <h3>Əlaqədar şəxs</h3>
            <div className={styles.infoGrid}>
              <p>
                <span>Ad, Soyad:</span> {customer.contactPerson}
              </p>
              <p>
                <span>Telefon nömrəsi:</span> {customer.contactInfo}
              </p>
              <p>
                <span>E-poçtu:</span> info@{customer.company.toLowerCase().replace(/\s+/g, "")}.com
              </p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3>Əsas məlumatlar</h3>
            <div className={styles.infoGrid}>
              <p>
                <span>Hüquqi ünvan:</span> {customer.address}
              </p>
              <p>
                <span>Əsas müəssisə:</span> {customer.company}
              </p>
              <p>
                <span>Ölkə:</span> {customer.country}
              </p>
              <p>
                <span>Kredit limiti:</span> {customer.creditLimit}
              </p>
              <p>
                <span>Son əlaqədən gün:</span> {customer.daysSinceLastContact}
              </p>
            </div>
          </div>
        </section>
      </div>

      {isEditOpen ? (
        <div className={styles.editModalOverlay} role="dialog" aria-modal="true">
          <div className={styles.editModalCard}>
            <div className={styles.editModalHeader}>
              <h3>Müştərini redaktə et</h3>
              <button type="button" onClick={() => setIsEditOpen(false)}>
                x
              </button>
            </div>
            <div className={styles.editTabs}>
              <button
                type="button"
                className={activeEditTab === "main" ? styles.editTabActive : ""}
                onClick={() => setActiveEditTab("main")}
              >
                Əsas məlumatlar
              </button>
              <button
                type="button"
                className={activeEditTab === "contact" ? styles.editTabActive : ""}
                onClick={() => setActiveEditTab("contact")}
              >
                Əlaqə məlumatları
              </button>
              <button
                type="button"
                className={activeEditTab === "finance" ? styles.editTabActive : ""}
                onClick={() => setActiveEditTab("finance")}
              >
                Maliyyələr
              </button>
            </div>

            {activeEditTab === "main" ? (
              <div className={styles.editModalGrid}>
                <section className={styles.editColumn}>
                  <h4>Şirkətin rekvizitləri</h4>
                  <label>
                    <span>Name (full)</span>
                    <input
                      value={editForm.company}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Müştəri tipi</span>
                    <select
                      value={editForm.customerType}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, customerType: e.target.value }))
                      }
                    >
                      <option value="">Dəyəri seçin</option>
                      <option value="Yeni müştəri">Yeni müştəri</option>
                      <option value="Daimi müştəri">Daimi müştəri</option>
                      <option value="Korporativ">Korporativ</option>
                    </select>
                  </label>
                  <label>
                    <span>Fəaliyyət növü</span>
                    <select defaultValue="">
                      <option value="">Dəyəri seçin</option>
                      <option value="logistics">Logistika</option>
                      <option value="freight">Freight forwarding</option>
                      <option value="brokerage">Brokerage</option>
                    </select>
                  </label>
                  <label>
                    <span>VÖEN</span>
                    <input placeholder="Daxil edin" />
                  </label>
                </section>

                <section className={styles.editColumn}>
                  <h4>Client settings</h4>
                  <label>
                    <span>Yaradılması tarixi</span>
                    <input
                      value={editForm.createdAt}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, createdAt: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span>Language of notifications</span>
                    <select
                      value={editForm.notificationsLang}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, notificationsLang: e.target.value }))
                      }
                    >
                      <option value="">Dəyəri seçin</option>
                      <option value="az">Azərbaycan dili</option>
                      <option value="en">English</option>
                      <option value="ru">Русский</option>
                    </select>
                  </label>
                  <label>
                    <span>Menecerlər</span>
                    <div className={styles.tagInputWrap}>
                      <div className={styles.tagList}>
                        {managerTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className={styles.tagChip}
                            onClick={() => removeManagerTag(tag)}
                            title="Sil"
                          >
                            {tag} ×
                          </button>
                        ))}
                      </div>
                      <div className={styles.tagInputRow}>
                        <input
                          value={managerInput}
                          onChange={(e) => setManagerInput(e.target.value)}
                          placeholder="Menecer adı yazın"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addManagerTag();
                            }
                          }}
                        />
                        <button type="button" className={styles.addTagBtn} onClick={addManagerTag}>
                          Əlavə et
                        </button>
                      </div>
                    </div>
                  </label>
                </section>
              </div>
            ) : null}

            {activeEditTab === "contact" ? (
              <div className={styles.singleTabContent}>
                <section className={styles.editColumn}>
                  <h4>Əlaqə məlumatları</h4>
                  <div className={styles.contactGrid}>
                    <label>
                      <span>Ölkə</span>
                      <input value={customer.country} readOnly />
                    </label>
                    <label>
                      <span>Şəhər</span>
                      <input placeholder="Daxil edin" />
                    </label>
                    <label>
                      <span>Ünvan</span>
                      <input
                        value={editForm.address}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, address: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      <span>Poçt kodu</span>
                      <input placeholder="Daxil edin" />
                    </label>
                    <label>
                      <span>Telefon</span>
                      <input
                        value={editForm.contactInfo}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, contactInfo: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      <span>El.poçt</span>
                      <input placeholder="example@company.com" />
                    </label>
                  </div>
                </section>
              </div>
            ) : null}

            {activeEditTab === "finance" ? (
              <div className={styles.singleTabContent}>
                <section className={styles.editColumn}>
                  <div className={styles.bankAccountsHeader}>
                    <h4>Bank accounts</h4>
                    <button
                      type="button"
                      className={styles.addAccountButton}
                      onClick={addBankAccountRow}
                    >
                      + Hesab əlavə et
                    </button>
                  </div>
                  {bankAccounts.map((account, idx) => (
                    <div key={`account-${idx}`} className={styles.accountBlock}>
                      <div className={styles.accountBlockHeader}>
                        <p className={styles.accountTitle}>Hesab #{idx + 1}</p>
                        <button
                          type="button"
                          className={styles.removeAccountButton}
                          onClick={() => removeBankAccountRow(idx)}
                        >
                          Sil
                        </button>
                      </div>
                      <div className={styles.financeGrid}>
                        <label>
                          <span>Valyuta</span>
                          <select
                            value={account.currency}
                            onChange={(e) =>
                              setBankAccounts((prev) =>
                                prev.map((item, itemIdx) =>
                                  itemIdx === idx ? { ...item, currency: e.target.value } : item,
                                ),
                              )
                            }
                          >
                            <option value="">Dəyəri seçin</option>
                            <option value="AZN">AZN</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </label>
                        <label>
                          <span>Hesablaşma hesabı</span>
                          <input
                            value={account.bankAccount}
                            onChange={(e) =>
                              setBankAccounts((prev) =>
                                prev.map((item, itemIdx) =>
                                  itemIdx === idx
                                    ? { ...item, bankAccount: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className={styles.withPlus}>
                          <span>Bank</span>
                          <div className={styles.plusSelectRow}>
                            <select
                              value={account.bank || selectedBank}
                              onChange={(e) =>
                                setBankAccounts((prev) =>
                                  prev.map((item, itemIdx) =>
                                    itemIdx === idx ? { ...item, bank: e.target.value } : item,
                                  ),
                                )
                              }
                            >
                              <option value="">Dəyəri seçin</option>
                              {bankTags.map((tag) => (
                                <option key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className={styles.plusBtn}
                              onClick={() => {
                                setActiveAccountIndex(idx);
                                openBankModal("bank");
                              }}
                            >
                              +
                            </button>
                          </div>
                        </label>
                        <label>
                          <span>Tranzit hesab</span>
                          <input
                            value={account.transitAccount}
                            onChange={(e) =>
                              setBankAccounts((prev) =>
                                prev.map((item, itemIdx) =>
                                  itemIdx === idx
                                    ? { ...item, transitAccount: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className={styles.withPlus}>
                          <span>Müxbir bank</span>
                          <div className={styles.plusSelectRow}>
                            <select
                              value={account.correspondentBank || selectedCorrespondentBank}
                              onChange={(e) =>
                                setBankAccounts((prev) =>
                                  prev.map((item, itemIdx) =>
                                    itemIdx === idx
                                      ? { ...item, correspondentBank: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                            >
                              <option value="">Dəyəri seçin</option>
                              {correspondentBankTags.map((tag) => (
                                <option key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className={styles.plusBtn}
                              onClick={() => {
                                setActiveAccountIndex(idx);
                                openBankModal("correspondent");
                              }}
                            >
                              +
                            </button>
                          </div>
                        </label>
                        <label>
                          <span>Müxbir hesab</span>
                          <input
                            value={account.correspondentAccount}
                            onChange={(e) =>
                              setBankAccounts((prev) =>
                                prev.map((item, itemIdx) =>
                                  itemIdx === idx
                                    ? { ...item, correspondentAccount: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </section>

                <section className={styles.editColumn}>
                  <h4>Financial terms</h4>
                  <div className={styles.financeGrid}>
                    <label>
                      <span>Ödənişin təxirə salınması</span>
                      <input
                        value={editForm.deferPayment}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, deferPayment: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      <span>Şərtlər</span>
                      <select
                        value={editForm.deferTerms}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, deferTerms: e.target.value }))
                        }
                      >
                        <option value="">Dəyəri seçin</option>
                        <option value="B/k 30 təqvim günü.">B/k 30 təqvim günü.</option>
                        <option value="B/k 15 təqvim günü.">B/k 15 təqvim günü.</option>
                        <option value="Öncədən ödəniş">Öncədən ödəniş</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    <span>Document terms text</span>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </label>
                  <div className={styles.financeGrid}>
                    <label>
                      <span>Kredit limiti</span>
                      <input
                        value={editForm.creditLimit}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, creditLimit: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      <span>Sənədlər üçün e-mail</span>
                      <input
                        value={editForm.docsEmail}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, docsEmail: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                </section>
              </div>
            ) : null}

            <div className={styles.editModalFooter}>
              <button type="button" className={styles.modalCancel} onClick={() => setIsEditOpen(false)}>
                Ləğv et
              </button>
              <button type="button" className={styles.modalSave} onClick={() => setIsEditOpen(false)}>
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bankModalTarget ? (
        <div className={styles.bankModalOverlay} role="dialog" aria-modal="true">
          <div className={styles.bankModalCard}>
            <div className={styles.bankModalHeader}>
              <h4>Bankı əlavə et</h4>
              <button type="button" onClick={closeBankModal}>
                ×
              </button>
            </div>
            <div className={styles.bankModalGrid}>
              <label className={styles.bankModalWide}>
                <span>Qeyri-rəsmi adı</span>
                <input
                  value={bankModalForm.alias}
                  onChange={(e) =>
                    setBankModalForm((prev) => ({ ...prev, alias: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Adı *</span>
                <input
                  value={bankModalForm.name}
                  onChange={(e) =>
                    setBankModalForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Filial</span>
                <input
                  value={bankModalForm.branch}
                  onChange={(e) =>
                    setBankModalForm((prev) => ({ ...prev, branch: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>MMT (BİK, BLZ)</span>
                <input
                  value={bankModalForm.bik}
                  onChange={(e) =>
                    setBankModalForm((prev) => ({ ...prev, bik: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>SWIFT</span>
                <input
                  value={bankModalForm.swift}
                  onChange={(e) =>
                    setBankModalForm((prev) => ({ ...prev, swift: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Ölkə</span>
                <select
                  value={bankModalForm.country}
                  onChange={(e) =>
                    setBankModalForm((prev) => ({ ...prev, country: e.target.value }))
                  }
                >
                  <option value="">Dəyəri seçin</option>
                  <option value="Azerbaijan">Azərbaycan</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Turkey">Turkey</option>
                </select>
              </label>
              <label>
                <span>Şəhər</span>
                <input
                  value={bankModalForm.city}
                  onChange={(e) =>
                    setBankModalForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Ünvan</span>
                <input
                  value={bankModalForm.address}
                  onChange={(e) =>
                    setBankModalForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Poçt kodu</span>
                <input
                  value={bankModalForm.postalCode}
                  onChange={(e) =>
                    setBankModalForm((prev) => ({ ...prev, postalCode: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className={styles.bankModalFooter}>
              <button type="button" className={styles.modalSave} onClick={saveBankFromModal}>
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

