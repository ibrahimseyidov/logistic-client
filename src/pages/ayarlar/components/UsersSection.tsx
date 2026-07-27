import React, { useEffect, useState } from "react";
import { FiFilter, FiPlus, FiUpload, FiDownload } from "react-icons/fi";
import {
  createUserAction,
  deleteUserAction,
  fetchUsersAction,
  updateUserAction,
} from "../../../common/actions/user.actions";
import { ConfirmModal } from "../../../common/components/ConfirmModal";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import ayarlarStyles from "../ayarlar.module.css";
import type { UserRow } from "../types/user.types";
import { AyarlarToolbar } from "./AyarlarToolbar";
import { UserModal } from "./UserModal";
import { UserPermissionsModal } from "./UserPermissionsModal";
import { UsersTable } from "./UsersTable";

export const UsersSection: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<UserRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dispatch = useAppDispatch();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsersAction();
      setUsers(data);
    } catch {
      dispatch(
        showNotification({
          message: "İstifadəçilər yüklənərkən xəta!",
          type: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: UserRow) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handlePermissions = (user: UserRow) => {
    setPermissionsUser(user);
  };

  const handleDelete = (id: number) => {
    setUserToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete === null) return;
    setIsDeleting(true);
    try {
      await deleteUserAction(userToDelete);
      setUsers(users.filter((u) => u.id !== userToDelete));
      dispatch(
        showNotification({ message: "İstifadəçi silindi", type: "success" }),
      );
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch {
      dispatch(showNotification({ message: "Silinərkən xəta!", type: "error" }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    status: string;
  }) => {
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        status: data.status,
        role: data.role || "operator",
      };
      if (data.password?.trim()) payload.password = data.password;

      if (selectedUser) {
        const updated = await updateUserAction(selectedUser.id, payload);
        setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, ...updated } : u)));
        dispatch(
          showNotification({ message: "İstifadəçi yeniləndi", type: "success" }),
        );
      } else {
        const created = await createUserAction(payload);
        setUsers([created, ...users]);
        dispatch(
          showNotification({
            message: "Yeni istifadəçi yaradıldı",
            type: "success",
          }),
        );
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "error" in error.response.data &&
        typeof error.response.data.error === "string"
          ? error.response.data.error
          : "Xəta baş verdi!";
      dispatch(showNotification({ message, type: "error" }));
    }
  };

  const handleSavePermissions = async (permissionsJson: string) => {
    if (!permissionsUser) return;
    try {
      const updated = await updateUserAction(permissionsUser.id, {
        permissions: permissionsJson,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === permissionsUser.id
            ? { ...u, ...updated, permissions: permissionsJson }
            : u,
        ),
      );
      dispatch(
        showNotification({
          message: "İcazələr yadda saxlanıldı",
          type: "success",
        }),
      );
      setPermissionsUser(null);
    } catch {
      dispatch(
        showNotification({
          message: "İcazələr saxlanılarkən xəta!",
          type: "error",
        }),
      );
    }
  };

  return (
    <>
      <AyarlarToolbar>
        <div className={actionStyles.wrapper}>
          <div className={actionStyles.group}>
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonPrimary}`}
              onClick={handleCreate}
            >
              <FiPlus /> Yeni istifadəçi
            </button>
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
            >
              <FiFilter /> Filtrlər
            </button>
          </div>

          <div className={actionStyles.statsGroup}>
            <span className={actionStyles.statPill}>Cəmi: {users.length}</span>
            <span className={actionStyles.statPill}>
              Aktiv: {users.filter((u) => u.status === "active").length}
            </span>
          </div>

          <div className={actionStyles.group}>
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
            >
              <FiUpload /> Excel-dən idxal
            </button>
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
            >
              <FiDownload /> Excel-ə ixrac
            </button>
          </div>
        </div>
      </AyarlarToolbar>

      <div className={ayarlarStyles.body}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>Yüklənir...</div>
        ) : (
          <UsersTable
            rows={users}
            onEdit={handleEdit}
            onPermissions={handlePermissions}
            onDelete={handleDelete}
          />
        )}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={selectedUser}
      />

      <UserPermissionsModal
        isOpen={Boolean(permissionsUser)}
        user={permissionsUser}
        onClose={() => setPermissionsUser(null)}
        onSave={handleSavePermissions}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="İstifadəçini sil"
        message="Bu istifadəçini silmək istədiyinizə əminsiniz?"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setUserToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </>
  );
};
