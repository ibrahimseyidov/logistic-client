"use client";

import { useEffect, useMemo, useState } from "react";
import { FiFilePlus, FiFilter, FiX } from "react-icons/fi";
import { FaEdit, FaTrash, FaUserShield } from "react-icons/fa";
import sorguLayoutStyles from "../sorgular/sorgular.module.css";
import sorguActionBarStyles from "../sorgular/components/SorgularActionBar.module.css";
import sorguTableStyles from "../sorgular/components/SorgularTable.module.css";
import styles from "./ayarlar.module.css";

type UserRole = "admin" | "manager" | "operator" | "viewer";

interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Menecer",
  operator: "Operator",
  viewer: "Müşahidəçi",
};

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "u1",
    fullName: "Ulvi Azizov",
    email: "ulvi@logistra.az",
    role: "admin",
    status: "active",
  },
  {
    id: "u2",
    fullName: "Sindu Ahmed",
    email: "sindu@logistra.az",
    role: "manager",
    status: "active",
  },
  {
    id: "u3",
    fullName: "Fazil Ismayilzade",
    email: "fazil@logistra.az",
    role: "operator",
    status: "inactive",
  },
];

export default function AyarlarPage() {
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [activePanel, setActivePanel] = useState<"new" | "edit" | "filter" | null>(
    null,
  );
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterDraft, setFilterDraft] = useState({
    role: "",
    status: "",
    keyword: "",
  });
  const [appliedFilter, setAppliedFilter] = useState({
    role: "",
    status: "",
    keyword: "",
  });
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "viewer" as UserRole,
    status: "active" as ManagedUser["status"],
  });

  const filteredUsers = useMemo(() => {
    const text = (appliedFilter.keyword || query).trim().toLowerCase();
    return users.filter((user) => {
      if (appliedFilter.role && user.role !== appliedFilter.role) return false;
      if (appliedFilter.status && user.status !== appliedFilter.status) return false;
      if (!text) return true;
      return (
        user.fullName.toLowerCase().includes(text) ||
        user.email.toLowerCase().includes(text)
      );
    });
  }, [users, appliedFilter, query]);

  const activeFilterCount = useMemo(
    () => Object.values(appliedFilter).filter((value) => value.trim() !== "").length,
    [appliedFilter],
  );

  const activeUserCount = useMemo(
    () => filteredUsers.filter((user) => user.status === "active").length,
    [filteredUsers],
  );

  useEffect(() => {
    if (!activePanel) return undefined;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePanel(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [activePanel]);

  useEffect(() => {
    if (!activePanel) return undefined;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [activePanel]);

  const resetForm = () => {
    setForm({ fullName: "", email: "", role: "viewer", status: "active" });
    setEditingUserId(null);
  };

  const openNew = () => {
    resetForm();
    setActivePanel("new");
  };

  const openEdit = (user: ManagedUser) => {
    setEditingUserId(user.id);
    setForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setActivePanel("edit");
  };

  const saveUser = () => {
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    if (!fullName || !email) return;

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUserId ? { ...user, ...form, fullName, email } : user,
        ),
      );
      setActivePanel(null);
      resetForm();
      return;
    }

    setUsers((prev) => [
      {
        id: crypto.randomUUID(),
        fullName,
        email,
        role: form.role,
        status: form.status,
      },
      ...prev,
    ]);
    setActivePanel(null);
    resetForm();
  };

  const deleteUser = (userId: string) => {
    if (!window.confirm("Bu istifadəçini silmək istədiyinizə əminsiniz?")) return;
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const applyFilter = () => {
    setAppliedFilter({ ...filterDraft });
    setQuery(filterDraft.keyword);
    setActivePanel(null);
  };

  const clearFilter = () => {
    const empty = { role: "", status: "", keyword: "" };
    setFilterDraft(empty);
    setAppliedFilter(empty);
    setQuery("");
  };

  return (
    <div className={sorguLayoutStyles.container}>
      <div className={sorguLayoutStyles.header}>
        <section className={sorguActionBarStyles.wrapper}>
          <div className={sorguActionBarStyles.group}>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonPrimary}`}
              onClick={openNew}
            >
              <FiFilePlus />
              Yeni user
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
            <span className={sorguActionBarStyles.statPill}>Cəmi: {filteredUsers.length}</span>
            <span className={sorguActionBarStyles.statPill}>Aktiv: {activeUserCount}</span>
          </div>
          <div className={sorguActionBarStyles.group}>
            <input
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="User axtar..."
            />
          </div>
        </section>
      </div>

      <div className={sorguLayoutStyles.body}>
        <section className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={sorguTableStyles.table}>
              <thead className={sorguTableStyles.head}>
                <tr>
                  <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min180}`}>
                    Ad soyad
                  </th>
                  <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min180}`}>
                    Email
                  </th>
                  <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min140}`}>
                    Yetki
                  </th>
                  <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>
                    Status
                  </th>
                  <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>
                    Əməliyyatlar
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={index % 2 === 0 ? sorguTableStyles.rowEven : sorguTableStyles.rowOdd}
                  >
                    <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                      {user.fullName}
                    </td>
                    <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                      {user.email}
                    </td>
                    <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                      {ROLE_LABELS[user.role]}
                    </td>
                    <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                      <span
                        className={`${styles.statusBadge} ${
                          user.status === "active" ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        {user.status === "active" ? "Aktiv" : "Deaktiv"}
                      </span>
                    </td>
                    <td className={`${sorguTableStyles.actionCell} ${sorguTableStyles.center}`}>
                      <div className={sorguTableStyles.actionRow} style={{ justifyContent: "center" }}>
                        <button
                          type="button"
                          className={`${sorguTableStyles.iconButton} ${styles.guardButton}`}
                          title="Yetkiləri idarə et"
                          aria-label="Yetkiləri idarə et"
                          onClick={() => openEdit(user)}
                        >
                          <FaUserShield />
                        </button>
                        <button
                          type="button"
                          className={`${sorguTableStyles.iconButton} ${sorguTableStyles.editButton}`}
                          title="Düzəliş et"
                          aria-label="Düzəliş et"
                          onClick={() => openEdit(user)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className={`${sorguTableStyles.iconButton} ${sorguTableStyles.deleteButton}`}
                          title="Sil"
                          aria-label="Sil"
                          onClick={() => deleteUser(user.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div
        className={`${sorguLayoutStyles.overlay} ${activePanel ? sorguLayoutStyles.overlayOpen : ""}`}
        onClick={() => setActivePanel(null)}
        aria-hidden={!activePanel}
      />

      <aside
        className={`${sorguLayoutStyles.drawer} ${activePanel ? sorguLayoutStyles.drawerOpen : ""}`}
        aria-hidden={!activePanel}
      >
        {activePanel === "filter" ? (
          <div className={styles.drawerPanel}>
            <div className={styles.drawerHeader}>
              <h3>Filtrlər</h3>
              <button type="button" onClick={() => setActivePanel(null)}>
                <FiX />
              </button>
            </div>
            <div className={styles.drawerBody}>
              <label className={styles.field}>
                <span>Yetki</span>
                <select
                  value={filterDraft.role}
                  onChange={(e) => setFilterDraft((p) => ({ ...p, role: e.target.value }))}
                  className={styles.input}
                >
                  <option value="">Hamısı</option>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Status</span>
                <select
                  value={filterDraft.status}
                  onChange={(e) => setFilterDraft((p) => ({ ...p, status: e.target.value }))}
                  className={styles.input}
                >
                  <option value="">Hamısı</option>
                  <option value="active">Aktiv</option>
                  <option value="inactive">Deaktiv</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Axtarış</span>
                <input
                  value={filterDraft.keyword}
                  onChange={(e) => setFilterDraft((p) => ({ ...p, keyword: e.target.value }))}
                  className={styles.input}
                  placeholder="Ad və ya email"
                />
              </label>
            </div>
            <div className={styles.drawerFooter}>
              <button type="button" className={styles.secondary} onClick={clearFilter}>
                Təmizlə
              </button>
              <button type="button" className={styles.primary} onClick={applyFilter}>
                Filterdən keçir
              </button>
            </div>
          </div>
        ) : null}

        {activePanel === "new" || activePanel === "edit" ? (
          <div className={styles.drawerPanel}>
            <div className={styles.drawerHeader}>
              <h3>{activePanel === "new" ? "Yeni user" : "User redaktəsi"}</h3>
              <button
                type="button"
                onClick={() => {
                  setActivePanel(null);
                  resetForm();
                }}
              >
                <FiX />
              </button>
            </div>
            <div className={styles.drawerBody}>
              <label className={styles.field}>
                <span>Ad soyad</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                <span>Yetki</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                  className={styles.input}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as ManagedUser["status"],
                    }))
                  }
                  className={styles.input}
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Deaktiv</option>
                </select>
              </label>
            </div>
            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  setActivePanel(null);
                  resetForm();
                }}
              >
                Bağla
              </button>
              <button type="button" className={styles.primary} onClick={saveUser}>
                {activePanel === "new" ? "Yadda saxla" : "Yenilə"}
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
