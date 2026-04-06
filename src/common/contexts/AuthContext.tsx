"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AuthBootstrapData,
  AuthBranch,
  AuthUser,
  fetchAuthBootstrap,
} from "../actions/auth.actions";

interface AuthContextType {
  user: AuthUser | null;
  companyName: string | null;
  branches: AuthBranch[];
  login: (data: AuthBootstrapData, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const hydratedTokens = new Set<string>();
const inFlightTokens = new Set<string>();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [branches, setBranches] = useState<AuthBranch[]>([]);
  const mountedRef = useRef(true);

  const login = useCallback((data: AuthBootstrapData, token?: string) => {
    if (!mountedRef.current) return;

    setUser(data.user);
    setCompanyName(data.companyName);
    setBranches(Array.isArray(data.branches) ? data.branches : []);

    if (token) {
      hydratedTokens.add(token);
    }
  }, []);

  const hydrateFromToken = useCallback(
    async (token: string) => {
      if (!token || inFlightTokens.has(token)) return;

      inFlightTokens.add(token);
      try {
        const bootstrap = await fetchAuthBootstrap();
        if (!mountedRef.current) return;
        login(bootstrap);
        hydratedTokens.add(token);
      } finally {
        inFlightTokens.delete(token);
      }
    },
    [login],
  );

  const logout = () => {
    setUser(null);
    setCompanyName(null);
    setBranches([]);
    document.cookie = "token=; path=/; max-age=0";
  };

  useEffect(() => {
    mountedRef.current = true;
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    console.log("AuthContext useEffect token:", token);
    if (token && !hydratedTokens.has(token)) {
      void hydrateFromToken(token);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [hydrateFromToken]);

  return (
    <AuthContext.Provider
      value={{ user, companyName, branches, login, logout }}
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
