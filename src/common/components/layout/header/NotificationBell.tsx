"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import {
  fetchNotificationsAction,
  fetchUnreadNotificationCountAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  clearAllNotificationsAction,
  type AppNotification,
} from "../../../actions/notification.actions";
import { useAuth } from "../../../contexts/AuthContext";
import {
  DIGEST_STATUS_ROWS,
  formatDigestBrowserBody,
  parseDailyQueryDigest,
  type DigestCounts,
} from "../../../utils/dailyQueryDigest.utils";
import styles from "./NotificationBell.module.css";

const POLL_MS = 8000;

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

function ensureBrowserPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

function notificationBody(item: AppNotification): string {
  if (item.type === "daily_query_digest") {
    const digest = parseDailyQueryDigest(item.message);
    if (digest) return formatDigestBrowserBody(digest);
  }
  return item.message;
}

function showBrowserToast(item: AppNotification) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  try {
    const n = new Notification(item.title || "Yeni bildiriş", {
      body: notificationBody(item),
      tag: `Ziyalog-n-${item.id}`,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}

const toneClass: Record<string, string> = {
  rose: styles.digestToneRose,
  amber: styles.digestToneAmber,
  emerald: styles.digestToneEmerald,
  sky: styles.digestToneSky,
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const primedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [list, count] = await Promise.all([
      fetchNotificationsAction(),
      fetchUnreadNotificationCountAction(),
    ]);

    if (!primedRef.current) {
      knownIdsRef.current = new Set(list.map((n) => n.id));
      primedRef.current = true;
    } else {
      for (const item of list) {
        if (!item.read && !knownIdsRef.current.has(item.id)) {
          showBrowserToast(item);
        }
      }
      knownIdsRef.current = new Set(list.map((n) => n.id));
    }

    setItems(list);
    setUnread(count);
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    ensureBrowserPermission();
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
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

  const markReadLocal = async (item: AppNotification) => {
    if (item.read) return;
    try {
      await markNotificationReadAction(item.id);
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) void refresh();
  };

  const handleClickItem = async (item: AppNotification) => {
    await markReadLocal(item);
    setOpen(false);
    if (item.link) {
      navigate(item.link);
    } else {
      navigate("/tapshiriqlar");
    }
  };

  const handleDigestNavigate = async (
    item: AppNotification,
    status: keyof DigestCounts | null,
  ) => {
    await markReadLocal(item);
    setOpen(false);
    const params = new URLSearchParams({ tab: "active" });
    if (status) params.set("status", status);
    navigate(`/sorgular?${params.toString()}`);
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

  const handleClearAll = async () => {
    try {
      await clearAllNotificationsAction();
      setItems([]);
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
            <div className={styles.headerActions}>
              {unread > 0 ? (
                <button
                  type="button"
                  className={styles.markAll}
                  onClick={handleMarkAll}
                >
                  Hamısını oxu
                </button>
              ) : null}
              {items.length > 0 ? (
                <button
                  type="button"
                  className={styles.clearAll}
                  onClick={() => {
                    void handleClearAll();
                  }}
                >
                  Təmizlə
                </button>
              ) : null}
            </div>
          </div>
          <div className={styles.list}>
            {items.length === 0 ? (
              <p className={styles.empty}>Bildirim yoxdur</p>
            ) : (
              items.map((item) => {
                const digest =
                  item.type === "daily_query_digest"
                    ? parseDailyQueryDigest(item.message)
                    : null;

                if (digest) {
                  return (
                    <div
                      key={item.id}
                      className={`${styles.item} ${styles.digestItem} ${
                        item.read ? "" : styles.itemUnread
                      }`}
                    >
                      <span className={styles.itemTitle}>{item.title}</span>
                      <div className={styles.digestList}>
                        <button
                          type="button"
                          className={`${styles.digestRow} ${styles.digestToneAll}`}
                          onClick={() => {
                            void handleDigestNavigate(item, null);
                          }}
                        >
                          <span>Hamısı</span>
                          <strong>{digest.total}</strong>
                        </button>
                        {DIGEST_STATUS_ROWS.map((row) => (
                          <button
                            key={row.key}
                            type="button"
                            className={`${styles.digestRow} ${
                              toneClass[row.tone] || ""
                            }`}
                            onClick={() => {
                              void handleDigestNavigate(item, row.key);
                            }}
                          >
                            <span>{row.label}</span>
                            <strong>{digest.counts[row.key] ?? 0}</strong>
                          </button>
                        ))}
                      </div>
                      <span className={styles.itemTime}>
                        {formatRelative(item.createdAt)}
                      </span>
                    </div>
                  );
                }

                return (
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
                    <span className={styles.itemTime}>
                      {formatRelative(item.createdAt)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
