"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AuthBootstrapData,
  AuthBranch,
  AuthUser,
  fetchAuthBootstrap,
} from "../actions/auth.actions";
import { getStoredAuthToken } from "../utils/auth.utils";

interface AuthContextType {
  user: AuthUser | null;
  companyName: string | null;
  branches: AuthBranch[];
  /** true until first bootstrap attempt finishes (cache may already show name) */
  authReady: boolean;
  login: (data: AuthBootstrapData, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_BOOTSTRAP_KEY = "auth_bootstrap_v1";

/** Deduplicate concurrent /me fetches only (not across remounts with empty user). */
const inFlightTokens = new Set<string>();

function loadCachedBootstrap(): AuthBootstrapData | null {
  try {
    const raw = localStorage.getItem(AUTH_BOOTSTRAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthBootstrapData;
    if (parsed?.user?.id && parsed?.user?.name) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function saveCachedBootstrap(data: AuthBootstrapData) {
  try {
    localStorage.setItem(AUTH_BOOTSTRAP_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function clearCachedBootstrap() {
  try {
    localStorage.removeItem(AUTH_BOOTSTRAP_KEY);
  } catch {
    /* ignore */
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialCache =
    typeof window !== "undefined" ? loadCachedBootstrap() : null;

  const [user, setUser] = useState<AuthUser | null>(
    () => initialCache?.user ?? null,
  );
  const [companyName, setCompanyName] = useState<string | null>(
    () => initialCache?.companyName ?? null,
  );
  const [branches, setBranches] = useState<AuthBranch[]>(
    () =>
      (Array.isArray(initialCache?.branches)
        ? initialCache!.branches
        : []) as AuthBranch[],
  );
  const [authReady, setAuthReady] = useState(() => !!initialCache?.user);

  const login = useCallback((data: AuthBootstrapData, _token?: string) => {
    setUser(data.user);
    setCompanyName(data.companyName);
    setBranches(Array.isArray(data.branches) ? data.branches : []);
    setAuthReady(true);
    saveCachedBootstrap(data);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCompanyName(null);
    setBranches([]);
    setAuthReady(true);
    clearCachedBootstrap();
    document.cookie = "token=; path=/; max-age=0";
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      setAuthReady(true);
      return;
    }

    if (inFlightTokens.has(token)) return;

    inFlightTokens.add(token);
    void fetchAuthBootstrap()
      .then((bootstrap) => {
        login(bootstrap, token);
      })
      .catch((err) => {
        console.error("Auth bootstrap failed:", err);
        // Keep cached user if present; only clear when there is no cache
        const cached = loadCachedBootstrap();
        if (cached?.user) {
          setUser(cached.user);
          setCompanyName(cached.companyName);
          setBranches(
            Array.isArray(cached.branches) ? cached.branches : [],
          );
        }
        setAuthReady(true);
      })
      .finally(() => {
        inFlightTokens.delete(token);
      });
  }, [login]);

  // If token appears later (e.g. another tab) or user was wiped, re-hydrate
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === AUTH_BOOTSTRAP_KEY) {
        const token = getStoredAuthToken();
        if (!token) {
          setUser(null);
          setCompanyName(null);
          setBranches([]);
          return;
        }
        const cached = loadCachedBootstrap();
        if (cached?.user) {
          setUser(cached.user);
          setCompanyName(cached.companyName);
          setBranches(
            Array.isArray(cached.branches) ? cached.branches : [],
          );
        }
        if (!inFlightTokens.has(token)) {
          inFlightTokens.add(token);
          void fetchAuthBootstrap()
            .then((bootstrap) => login(bootstrap, token))
            .catch(() => {})
            .finally(() => inFlightTokens.delete(token));
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [login]);

  return (
    <AuthContext.Provider
      value={{ user, companyName, branches, authReady, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
