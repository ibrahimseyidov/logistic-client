"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import {
  fetchNotificationsAction,
  fetchUnreadNotificationCountAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type AppNotification,
} from "../../../actions/notification.actions";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./NotificationBell.module.css";

const POLL_MS = 15000;

function formatRelative(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "indi";
  if (mins < 60) return `${mins} dəq əvvəl`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat əvvəl`;
  const days = Math.floor(hours / 24);
  return `${days} gün əvvəl`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [list, count] = await Promise.all([
      fetchNotificationsAction(),
      fetchUnreadNotificationCountAction(),
    ]);
    setItems(list);
    setUnread(count);
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [user, refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (!user) return null;

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) void refresh();
  };

  const handleClickItem = async (item: AppNotification) => {
    if (!item.read) {
      try {
        await markNotificationReadAction(item.id);
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
        );
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (item.link) {
      navigate(item.link);
    } else {
      navigate("/tapshiriqlar");
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsReadAction();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={handleOpen}
        aria-label="Bildirimlər"
        aria-expanded={open}
      >
        <FaBell />
        {unread > 0 ? (
          <span className={styles.badge}>{unread > 99 ? "99+" : unread}</span>
        ) : null}
      </button>

      {open ? (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <strong>Bildirimlər</strong>
            {unread > 0 ? (
              <button type="button" className={styles.markAll} onClick={handleMarkAll}>
                Hamısını oxu
              </button>
            ) : null}
          </div>
          <div className={styles.list}>
            {items.length === 0 ? (
              <p className={styles.empty}>Bildirim yoxdur</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.item} ${item.read ? "" : styles.itemUnread}`}
                  onClick={() => {
                    void handleClickItem(item);
                  }}
                >
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemMessage}>{item.message}</span>
                  <span className={styles.itemTime}>{formatRelative(item.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
