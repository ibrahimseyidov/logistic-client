import React, { useEffect, useMemo, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import type { UserRow } from "../types/user.types";
import {
  CRUD_ACTIONS,
  PERMISSION_MODULES,
  buildDefaultPermissions,
  parseUserPermissions,
  setChildAll,
  setModuleAction,
  setModuleAll,
  stringifyUserPermissions,
  type CrudAction,
  type UserPermissions,
} from "../lib/permissions.utils";
import styles from "./UserPermissionsModal.module.css";

interface Props {
  isOpen: boolean;
  user: UserRow | null;
  onClose: () => void;
  onSave: (permissionsJson: string) => Promise<void> | void;
}

export const UserPermissionsModal: React.FC<Props> = ({
  isOpen,
  user,
  onClose,
  onSave,
}) => {
  const [perms, setPerms] = useState<UserPermissions>(buildDefaultPermissions());
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen || !user) return;
    const parsed = parseUserPermissions((user as any).permissions);
    setPerms(parsed);
    const open: Record<string, boolean> = {};
    for (const m of PERMISSION_MODULES) {
      if (m.children?.length) open[m.id] = true;
    }
    setExpanded(open);
  }, [isOpen, user]);

  const stats = useMemo(() => {
    let on = 0;
    let total = 0;
    for (const mod of PERMISSION_MODULES) {
      const p = perms[mod.id];
      if (!p) continue;
      for (const a of CRUD_ACTIONS) {
        total += 1;
        if (p[a.key]) on += 1;
      }
      if (p.children) {
        for (const child of Object.values(p.children)) {
          for (const a of CRUD_ACTIONS) {
            total += 1;
            if (child[a.key]) on += 1;
          }
        }
      }
    }
    return { on, total };
  }, [perms]);

  if (!isOpen || !user) return null;

  const toggle = (moduleId: string, action: CrudAction, childId?: string) => {
    const current = childId
      ? Boolean(perms[moduleId]?.children?.[childId]?.[action])
      : Boolean(perms[moduleId]?.[action]);
    setPerms((prev) => setModuleAction(prev, moduleId, action, !current, childId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(stringifyUserPermissions(perms));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.panel} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>İcazələr</h2>
            <p className={styles.hint}>
              <strong>{user.name}</strong> — hər səhifə və detal bölməsi üçün
              ayrı-ayrı əlavə / redaktə / sil icazələri
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.toolbar}>
          <span className={styles.statPill}>
            Aktiv: {stats.on} / {stats.total}
          </span>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => setPerms(buildDefaultPermissions(true))}
            >
              Hamısını aç
            </button>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => setPerms(buildDefaultPermissions(false))}
            >
              Hamısını bağla
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.colHead}>
            <span className={styles.colModule}>Modul / bölmə</span>
            {CRUD_ACTIONS.map((a) => (
              <span key={a.key} className={styles.colAction}>
                {a.label}
              </span>
            ))}
          </div>

          {PERMISSION_MODULES.map((mod) => {
            const p = perms[mod.id] || buildDefaultPermissions()[mod.id];
            const hasChildren = Boolean(mod.children?.length);
            const isOpenMod = Boolean(expanded[mod.id]);
            let lastGroup = "";

            return (
              <div key={mod.id} className={styles.moduleBlock}>
                <div className={styles.moduleRow}>
                  <div className={styles.moduleInfo}>
                    {hasChildren ? (
                      <button
                        type="button"
                        className={styles.expandBtn}
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [mod.id]: !prev[mod.id],
                          }))
                        }
                      >
                        {isOpenMod ? "▾" : "▸"}
                      </button>
                    ) : (
                      <span className={styles.expandSpacer} />
                    )}
                    <div>
                      <div className={styles.moduleLabel}>{mod.label}</div>
                      {mod.description ? (
                        <div className={styles.moduleDesc}>{mod.description}</div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={styles.miniAll}
                      title="Modul üçün hamısı"
                      onClick={() =>
                        setPerms((prev) =>
                          setModuleAll(
                            prev,
                            mod.id,
                            !CRUD_ACTIONS.every((a) => p[a.key]),
                          ),
                        )
                      }
                    >
                      <FiCheck size={12} />
                    </button>
                  </div>
                  {CRUD_ACTIONS.map((a) => (
                    <label key={a.key} className={styles.checkCell}>
                      <input
                        type="checkbox"
                        checked={Boolean(p[a.key])}
                        onChange={() => toggle(mod.id, a.key)}
                      />
                    </label>
                  ))}
                </div>

                {hasChildren && isOpenMod
                  ? mod.children!.map((child) => {
                      const showGroup =
                        Boolean(child.group) && child.group !== lastGroup;
                      if (child.group) lastGroup = child.group;
                      const cp = p.children?.[child.id] || {
                        view: false,
                        create: false,
                        edit: false,
                        delete: false,
                      };
                      const parentOff = !p.view;
                      const childAllOn = CRUD_ACTIONS.every((a) => cp[a.key]);
                      return (
                        <React.Fragment key={child.id}>
                          {showGroup ? (
                            <div className={styles.groupHeader}>
                              {child.group}
                            </div>
                          ) : null}
                          <div className={styles.childRow}>
                            <div className={styles.moduleInfo}>
                              <span className={styles.expandSpacer} />
                              <div>
                                <div className={styles.childLabel}>
                                  {child.label}
                                </div>
                                {child.hint ? (
                                  <div className={styles.childHint}>
                                    {child.hint}
                                  </div>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                className={styles.miniAll}
                                title="Bu bölmə üçün hamısı"
                                disabled={parentOff}
                                onClick={() =>
                                  setPerms((prev) =>
                                    setChildAll(
                                      prev,
                                      mod.id,
                                      child.id,
                                      !childAllOn,
                                    ),
                                  )
                                }
                              >
                                <FiCheck size={12} />
                              </button>
                            </div>
                            {CRUD_ACTIONS.map((a) => (
                              <label key={a.key} className={styles.checkCell}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(cp[a.key])}
                                  disabled={parentOff}
                                  onChange={() =>
                                    toggle(mod.id, a.key, child.id)
                                  }
                                />
                              </label>
                            ))}
                          </div>
                        </React.Fragment>
                      );
                    })
                  : null}
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Ləğv et
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saxlanılır..." : "İcazələri yadda saxla"}
          </button>
        </div>
      </aside>
    </div>
  );
};
