import React, { useState, useEffect } from "react";
import { UsersTable } from "./components/UsersTable";
import { UserModal } from "./components/UserModal";
import { UserRow } from "./types/user.types";
import { 
  fetchUsersAction, 
  createUserAction, 
  updateUserAction, 
  deleteUserAction 
} from "../../common/actions/user.actions";
import styles from "../sorgular/sorgular.module.css";
import actionStyles from "../sorgular/components/SorgularActionBar.module.css";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { FiFilePlus, FiFilter, FiUpload, FiDownload } from "react-icons/fi";
import { ConfirmModal } from "../../common/components/ConfirmModal";

const AyarlarPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dispatch = useAppDispatch();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsersAction();
      setUsers(data);
    } catch (error) {
      dispatch(showNotification({ message: "İstifadəçilər yüklənərkən xəta!", type: "error" }));
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
    } catch (error) {
      dispatch(showNotification({ message: "Silinərkən xəta!", type: "error" }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedUser) {
        const updated = await updateUserAction(selectedUser.id, data);
        setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
        dispatch(showNotification({ message: "İstifadəçi yeniləndi", type: "success" }));
      } else {
        const created = await createUserAction(data);
        setUsers([created, ...users]);
        dispatch(showNotification({ message: "Yeni istifadəçi yaradıldı", type: "success" }));
      }
      setIsModalOpen(false);
    } catch (error: any) {
       dispatch(showNotification({ message: error.response?.data?.error || "Xəta baş verdi!", type: "error" }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title} style={{ display: "none" }}>İstifadəçi İdarəetməsi</h1>
      </div>

      <div className={actionStyles.wrapper} style={{ padding: "0.5rem 1rem" }}>
        <div className={actionStyles.group}>
          <button className={`${actionStyles.buttonBase} ${actionStyles.buttonPrimary}`} onClick={handleCreate}>
            <FiFilePlus /> Yeni user
          </button>
          <button className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}>
            <FiFilter /> Filtrlər
          </button>
        </div>
        
        <div className={actionStyles.statsGroup}>
          <span className={actionStyles.statPill}>Cəmi: {users.length}</span>
          <span className={actionStyles.statPill}>Aktiv: {users.filter(u => u.status === "active").length}</span>
        </div>

        <div className={actionStyles.group}>
          <button className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}>
            <FiUpload /> Excel-dən idxal et
          </button>
          <button className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}>
            <FiDownload /> Excel-ə ixrac et
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>Yüklənir...</div>
        ) : (
          <UsersTable rows={users} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialValues={selectedUser}
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
    </div>
  );
};

export default AyarlarPage;
