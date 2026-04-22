"use client";

import { FormEvent, useMemo, useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"moderation" | "general">("moderation");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "viewer" as UserRole,
    status: "active" as ManagedUser["status"],
  });

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized),
    );
  }, [query, users]);

  const resetForm = () => {
    setForm({
      fullName: "",
      email: "",
      role: "viewer",
      status: "active",
    });
    setEditingUserId(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    if (!fullName || !email) return;

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUserId ? { ...user, ...form, fullName, email } : user,
        ),
      );
      resetForm();
      return;
    }

    const newUser: ManagedUser = {
      id: crypto.randomUUID(),
      fullName,
      email,
      role: form.role,
      status: form.status,
    };
    setUsers((prev) => [newUser, ...prev]);
    resetForm();
  };

  const handleEdit = (user: ManagedUser) => {
    setEditingUserId(user.id);
    setForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  };

  const handleDelete = (userId: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    if (editingUserId === userId) resetForm();
  };

  const openDeleteModal = (user: ManagedUser) => {
    setDeletingUser(user);
  };

  const closeDeleteModal = () => {
    setDeletingUser(null);
  };

  const confirmDelete = () => {
    if (!deletingUser) return;
    handleDelete(deletingUser.id);
    closeDeleteModal();
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
  };

  return (
    <div className={styles.page}>
      <div className={styles.tabBar}>
        <button
          type="button"
          onClick={() => setActiveTab("moderation")}
          className={`${styles.tabButton} ${activeTab === "moderation" ? styles.tabButtonActive : ""}`}
        >
          Moderasiya
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`${styles.tabButton} ${activeTab === "general" ? styles.tabButtonActive : ""}`}
        >
          Ümumi ayarlar
        </button>
      </div>

      {activeTab === "general" ? (
        <section className={styles.placeholderCard}>
          <h3>Ümumi ayarlar</h3>
          <p>Bu hissədə ümumi sistem parametrlərini sonradan genişləndirə bilərsiniz.</p>
        </section>
      ) : null}

      {activeTab === "moderation" ? (
        <>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>User əlavə et / redaktə et</h3>
            </div>
            <form className={styles.formGrid} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span>Ad soyad</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ad Soyad"
                />
              </label>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="example@company.com"
                />
              </label>
              <label className={styles.field}>
                <span>Yetki</span>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))
                  }
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
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Deaktiv</option>
                </select>
              </label>
              <div className={styles.formActions}>
                <button className={styles.saveButton} type="submit">
                  {editingUserId ? "Yenilə" : "Yadda saxla"}
                </button>
                <button className={styles.cancelButton} type="button" onClick={resetForm}>
                  Təmizlə
                </button>
              </div>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>User moderasiyası</h3>
              <input
                className={styles.searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="User axtar..."
              />
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ad soyad</th>
                    <th>Email</th>
                    <th>Yetki</th>
                    <th>Status</th>
                    <th>Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          className={styles.roleSelect}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            user.status === "active" ? styles.statusActive : styles.statusInactive
                          }`}
                        >
                          {user.status === "active" ? "Aktiv" : "Deaktiv"}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        <button type="button" onClick={() => handleEdit(user)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => openDeleteModal(user)}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {deletingUser ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalTop}>
              <div className={styles.modalIcon} aria-hidden>
                !
              </div>
              <h4>User silinsin?</h4>
            </div>
            <p>
              <strong>{deletingUser.fullName}</strong> istifadəçisini silmək istədiyinizə
              əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün olmayacaq.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelButton}
                onClick={closeDeleteModal}
              >
                Ləğv et
              </button>
              <button
                type="button"
                className={styles.modalDeleteButton}
                onClick={confirmDelete}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

