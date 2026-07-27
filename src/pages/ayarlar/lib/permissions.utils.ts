export type CrudAction = "view" | "create" | "edit" | "delete";

export type CrudPerm = Record<CrudAction, boolean>;

export type ModulePerm = CrudPerm & {
  children?: Record<string, CrudPerm>;
};

export type UserPermissions = Record<string, ModulePerm>;

export const CRUD_ACTIONS: { key: CrudAction; label: string }[] = [
  { key: "view", label: "Görüntülə" },
  { key: "create", label: "Əlavə et" },
  { key: "edit", label: "Redaktə" },
  { key: "delete", label: "Sil" },
];

export type PermissionModuleDef = {
  id: string;
  label: string;
  description?: string;
  children?: { id: string; label: string }[];
};

/** Sidebar və səhifələrlə uyğun modul ağacı */
export const PERMISSION_MODULES: PermissionModuleDef[] = [
  {
    id: "sorgular",
    label: "Sorğular",
    description: "Aktiv / arxiv / qiymət təklifləri",
    children: [
      { id: "active", label: "Aktiv sorğular" },
      { id: "archive", label: "Arxiv sorğular" },
      { id: "offers", label: "Qiymət təklifləri" },
    ],
  },
  {
    id: "sifarisler",
    label: "Sifarişlər",
    description: "Sifariş, yük, reys, əməkhaqqı",
    children: [
      { id: "orders", label: "Sifarişlər" },
      { id: "loads", label: "Yüklər" },
      { id: "voyages", label: "Reyslər" },
      { id: "payroll", label: "Əməkhaqqı" },
    ],
  },
  {
    id: "tapshiriqlar",
    label: "Tapşırıqlar",
    description: "Tapşırıq yaratma, redaktə, silmə",
  },
  {
    id: "musteriler",
    label: "Müştərilər",
  },
  {
    id: "dasiyicilar",
    label: "Daşıyıcılar",
  },
  {
    id: "maliyye",
    label: "Maliyyə",
    description: "Kasa, bank və hesabat",
    children: [
      { id: "kasa", label: "Kassam" },
      { id: "bank", label: "Bank hesabı" },
      { id: "hesabat", label: "Maliyyə hesabatı" },
    ],
  },
  {
    id: "ayarlar",
    label: "Parametrlər",
    description: "İstifadəçilər, sənədlər, loglar və s.",
    children: [
      { id: "users", label: "İstifadəçilər" },
      { id: "cash", label: "Kassa / Bank" },
      { id: "lookups", label: "Lookup parametrləri" },
      { id: "documents", label: "Sənədlər" },
      { id: "logs", label: "Loglar" },
    ],
  },
];

export function emptyCrud(all = false): CrudPerm {
  return {
    view: all,
    create: all,
    edit: all,
    delete: all,
  };
}

export function buildDefaultPermissions(fullAccess = false): UserPermissions {
  const perms: UserPermissions = {};
  for (const mod of PERMISSION_MODULES) {
    const children: Record<string, CrudPerm> | undefined = mod.children
      ? Object.fromEntries(
          mod.children.map((c) => [c.id, emptyCrud(fullAccess)]),
        )
      : undefined;
    perms[mod.id] = {
      ...emptyCrud(fullAccess),
      ...(children ? { children } : {}),
    };
  }
  return perms;
}

export function parseUserPermissions(raw: unknown): UserPermissions {
  const base = buildDefaultPermissions(false);
  if (!raw) return base;

  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return base;
    }
  }
  if (!parsed || typeof parsed !== "object") return base;

  for (const mod of PERMISSION_MODULES) {
    const src = parsed[mod.id];
    if (!src || typeof src !== "object") continue;
    const next: ModulePerm = {
      view: Boolean(src.view),
      create: Boolean(src.create),
      edit: Boolean(src.edit),
      delete: Boolean(src.delete),
    };
    if (mod.children?.length) {
      next.children = {};
      for (const child of mod.children) {
        const csrc = src.children?.[child.id] || src[child.id] || {};
        next.children[child.id] = {
          view: Boolean(csrc.view ?? src.view),
          create: Boolean(csrc.create ?? false),
          edit: Boolean(csrc.edit ?? false),
          delete: Boolean(csrc.delete ?? false),
        };
      }
    }
    base[mod.id] = next;
  }
  return base;
}

export function stringifyUserPermissions(perms: UserPermissions): string {
  return JSON.stringify(perms);
}

/** Parent view sönəndə alt qruplar da sönür (UI üçün) */
export function setModuleAction(
  perms: UserPermissions,
  moduleId: string,
  action: CrudAction,
  value: boolean,
  childId?: string,
): UserPermissions {
  const next = structuredClone(perms) as UserPermissions;
  const mod = next[moduleId];
  if (!mod) return perms;

  if (childId) {
    if (!mod.children) mod.children = {};
    if (!mod.children[childId]) mod.children[childId] = emptyCrud(false);
    mod.children[childId][action] = value;
    // Alt-da view açılanda parent view də açılsın
    if (action === "view" && value) mod.view = true;
    // Parent view bağlıdırsa alt create/edit/delete mənasızdır — view açıq olmalıdır
    if (action !== "view" && value) {
      mod.children[childId].view = true;
      mod.view = true;
    }
    return next;
  }

  mod[action] = value;
  if (action === "view" && !value && mod.children) {
    for (const key of Object.keys(mod.children)) {
      mod.children[key] = emptyCrud(false);
    }
  }
  if (action === "view" && value && mod.children) {
    for (const key of Object.keys(mod.children)) {
      mod.children[key].view = true;
    }
  }
  if (action !== "view" && value) {
    mod.view = true;
  }
  // Parent create/edit/delete → children-ə yay (əlaqəli sistem)
  if (action !== "view" && mod.children) {
    for (const key of Object.keys(mod.children)) {
      mod.children[key][action] = value;
      if (value) mod.children[key].view = true;
    }
  }
  return next;
}

export function setModuleAll(
  perms: UserPermissions,
  moduleId: string,
  value: boolean,
): UserPermissions {
  let next = perms;
  for (const a of CRUD_ACTIONS) {
    next = setModuleAction(next, moduleId, a.key, value);
  }
  return next;
}
