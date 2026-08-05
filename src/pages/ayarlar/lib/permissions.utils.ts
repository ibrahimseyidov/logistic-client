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

export type PermissionChildDef = {
  id: string;
  label: string;
  /** UI-də qrup başlığı (eyni group ardıcıl sətirlərdə bir də göstərilir) */
  group?: string;
  hint?: string;
};

export type PermissionModuleDef = {
  id: string;
  label: string;
  description?: string;
  children?: PermissionChildDef[];
};

/**
 * Hər səhifə / detallı bölmə üçün ayrı CRUD.
 * Sifariş nümunəsi: siyahı + detal tabları (yük, reys, maliyyə, hesab, sənəd, şərh…).
 */
export const PERMISSION_MODULES: PermissionModuleDef[] = [
  {
    id: "sorgular",
    label: "Sorğular",
    description: "Siyahı, detallar və modal əməliyyatları",
    children: [
      { id: "active", label: "Aktiv sorğular", group: "Siyahı / tablar" },
      { id: "archive", label: "Arxiv sorğular", group: "Siyahı / tablar" },
      { id: "offers", label: "Qiymət təklifləri", group: "Siyahı / tablar" },
      {
        id: "detail",
        label: "Sorğu detalları (əsas)",
        group: "Detallar",
        hint: "Detal səhifəsinə giriş və əsas məlumat",
      },
      {
        id: "detail_comments",
        label: "Şərhlər",
        group: "Detallar",
        hint: "Şərh əlavə / sil",
      },
      {
        id: "detail_offers",
        label: "Qiymət təklifləri (detal)",
        group: "Detallar",
      },
      {
        id: "detail_documents",
        label: "Sənədlər",
        group: "Detallar",
        hint: "Yükləmə, hazırlama, silmə",
      },
      {
        id: "detail_tasks",
        label: "Tapşırıqlar (sorğuda)",
        group: "Detallar",
      },
    ],
  },
  {
    id: "sifarisler",
    label: "Sifarişlər",
    description: "Siyahı və sifariş detallarındakı bütün bölmələr",
    children: [
      {
        id: "orders",
        label: "Sifarişlər siyahısı",
        group: "Siyahı",
        hint: "Siyahıya baxış, yeni sifariş, silmə",
      },
      {
        id: "payroll",
        label: "Əməkhaqqı",
        group: "Siyahı",
      },
      {
        id: "detail",
        label: "Sifariş detalları (ümumi)",
        group: "Detallar",
        hint: "Detal səhifəsinə giriş, status dəyişmə",
      },
      {
        id: "loads",
        label: "Yüklər",
        group: "Detallar",
        hint: "Yük əlavə / redaktə / sil",
      },
      {
        id: "voyages",
        label: "Reyslər",
        group: "Detallar",
        hint: "Reys əlavə / redaktə / sil",
      },
      {
        id: "finance",
        label: "Maliyyə",
        group: "Detallar",
        hint: "Sifariş maliyyə əməliyyatları",
      },
      {
        id: "documents",
        label: "Sənədlər",
        group: "Detallar",
        hint: "PDF hazırlama, yükləmə, silmə",
      },
      {
        id: "invoices",
        label: "Hesablar",
        group: "Detallar",
        hint: "İrəli / ilkin / alınmış hesablar",
      },
      {
        id: "comments",
        label: "Şərhlər",
        group: "Detallar",
        hint: "Şərh əlavə / sil",
      },
      {
        id: "order_tasks",
        label: "Tapşırıqlar (sifarişdə)",
        group: "Detallar",
        hint: "Sifariş üzrə tapşırıq yaratma / redaktə / sil",
      },
    ],
  },
  {
    id: "tapshiriqlar",
    label: "Tapşırıqlar",
    description: "Ümumi tapşırıq lövhəsi",
    children: [
      {
        id: "board",
        label: "Tapşırıq lövhəsi",
        group: "Səhifə",
        hint: "Kanban, yaratma, status, silmə",
      },
    ],
  },
  {
    id: "musteriler",
    label: "Müştərilər",
    description: "Siyahı və müştəri detalları",
    children: [
      { id: "list", label: "Müştərilər siyahısı", group: "Siyahı" },
      {
        id: "detail",
        label: "Müştəri detalları",
        group: "Detallar",
      },
      {
        id: "contacts",
        label: "Əlaqədar şəxslər",
        group: "Detallar",
        hint: "Kontakt əlavə / redaktə / sil",
      },
      {
        id: "finance",
        label: "Maliyyə / borclar",
        group: "Detallar",
      },
      {
        id: "documents",
        label: "Sənədlər",
        group: "Detallar",
      },
    ],
  },
  {
    id: "dasiyicilar",
    label: "Daşıyıcılar",
    description: "Siyahı və daşıyıcı detalları",
    children: [
      { id: "list", label: "Daşıyıcılar siyahısı", group: "Siyahı" },
      {
        id: "detail",
        label: "Daşıyıcı detalları",
        group: "Detallar",
      },
      {
        id: "contacts",
        label: "Əlaqədar şəxslər",
        group: "Detallar",
      },
      {
        id: "finance",
        label: "Maliyyə / borclar",
        group: "Detallar",
      },
      {
        id: "documents",
        label: "Sənədlər",
        group: "Detallar",
      },
    ],
  },
  {
    id: "maliyye",
    label: "Maliyyə",
    description: "Kasa, bank, əməliyyatlar və hesabat",
    children: [
      { id: "kasa", label: "Kassam", group: "Cüzdanlar" },
      { id: "bank", label: "Bank hesabı", group: "Cüzdanlar" },
      { id: "umumi", label: "Ümumi", group: "Cüzdanlar" },
      {
        id: "transactions",
        label: "Əməliyyatlar",
        group: "Əməliyyatlar",
        hint: "Yeni əməliyyat (müştəri/daşıyıcı ödənişi)",
      },
      {
        id: "expenses",
        label: "Birbaşa xərclər",
        group: "Əməliyyatlar",
        hint: "Xərc yaratma / redaktə / sil",
      },
      {
        id: "hesabat",
        label: "Hesabatlar",
        group: "Hesabat",
      },
    ],
  },
  {
    id: "ayarlar",
    label: "Parametrlər",
    description: "İstifadəçilər, sənədlər, loglar və s.",
    children: [
      { id: "users", label: "İstifadəçilər", group: "Parametrlər" },
      { id: "cash", label: "Kassa / Bank", group: "Parametrlər" },
      { id: "lookups", label: "Lookup parametrləri", group: "Parametrlər" },
      { id: "documents", label: "Sənəd şablonları", group: "Parametrlər" },
      {
        id: "notifications",
        label: "Bildiriş ayarları",
        group: "Parametrlər",
        hint: "Gündəlik sorğu xülasəsi (şəxsi)",
      },
      { id: "logs", label: "Loglar", group: "Parametrlər" },
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
        const hasExplicit =
          csrc &&
          typeof csrc === "object" &&
          ("view" in csrc ||
            "create" in csrc ||
            "edit" in csrc ||
            "delete" in csrc);
        next.children[child.id] = {
          // Köhnə qeydlərdə child yoxdursa parent CRUD-dan miras
          view: Boolean(hasExplicit ? csrc.view : (csrc.view ?? src.view)),
          create: Boolean(
            hasExplicit ? csrc.create : (csrc.create ?? src.create),
          ),
          edit: Boolean(hasExplicit ? csrc.edit : (csrc.edit ?? src.edit)),
          delete: Boolean(
            hasExplicit ? csrc.delete : (csrc.delete ?? src.delete),
          ),
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
    if (action === "view" && value) mod.view = true;
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

export function setChildAll(
  perms: UserPermissions,
  moduleId: string,
  childId: string,
  value: boolean,
): UserPermissions {
  let next = perms;
  for (const a of CRUD_ACTIONS) {
    next = setModuleAction(next, moduleId, a.key, value, childId);
  }
  return next;
}

/** Səhifə / bölmə icazəsi yoxlama — bağlı (false) = görünməz / istifadə olunmaz */
export function can(
  perms: UserPermissions | null | undefined,
  moduleId: string,
  action: CrudAction,
  childId?: string,
): boolean {
  if (!perms) return false;
  const mod = perms[moduleId];
  if (!mod) return false;
  // Parent view bağlıdırsa heç bir alt əməliyyat açıq deyil
  if (!mod.view) return false;
  if (childId) {
    const child = mod.children?.[childId];
    if (!child) return false;
    if (!child.view) return false;
    return Boolean(child[action]);
  }
  return Boolean(mod[action]);
}

/** Ayarlar tab → icazə child id */
export function ayarlarTabToPermChild(tab: string): string {
  if (
    tab === "users" ||
    tab === "cash" ||
    tab === "documents" ||
    tab === "logs" ||
    tab === "notifications"
  ) {
    return tab;
  }
  // cargo-specs / incoterms / transport-types → lookups
  return "lookups";
}

/** Nav / route → modul (+ optional child) */
export function routeToPermission(
  pathname: string,
  search = "",
): { moduleId: string; childId?: string } | null {
  const tab = new URLSearchParams(search).get("tab") || undefined;

  if (pathname.startsWith("/sorgular/")) {
    return { moduleId: "sorgular", childId: "detail" };
  }
  if (pathname.startsWith("/sorgular")) {
    const child =
      tab === "archive" || tab === "offers" || tab === "active" ? tab : "active";
    return { moduleId: "sorgular", childId: child };
  }
  if (pathname.startsWith("/sifarisler/")) {
    return { moduleId: "sifarisler", childId: "detail" };
  }
  if (pathname.startsWith("/sifarisler")) {
    return { moduleId: "sifarisler", childId: "orders" };
  }
  if (pathname.startsWith("/tapshiriqlar")) {
    return { moduleId: "tapshiriqlar", childId: "board" };
  }
  if (pathname.startsWith("/musteriler/")) {
    return { moduleId: "musteriler", childId: "detail" };
  }
  if (pathname.startsWith("/musteriler")) {
    return { moduleId: "musteriler", childId: "list" };
  }
  if (pathname.startsWith("/dasiyicilar/")) {
    return { moduleId: "dasiyicilar", childId: "detail" };
  }
  if (pathname.startsWith("/dasiyicilar")) {
    return { moduleId: "dasiyicilar", childId: "list" };
  }
  if (pathname.startsWith("/maliyye/hesabat")) {
    return { moduleId: "maliyye", childId: "hesabat" };
  }
  if (pathname.startsWith("/maliyye")) {
    // Kasa / Bank / Ümumi tabları səhifə daxilində süzülür — parent view kifayətdir
    return { moduleId: "maliyye" };
  }
  if (pathname.startsWith("/ayarlar")) {
    return {
      moduleId: "ayarlar",
      childId: ayarlarTabToPermChild(tab || "users"),
    };
  }
  return null;
}
