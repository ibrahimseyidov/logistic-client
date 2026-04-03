"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";

axios.defaults.baseURL = "/api";

interface User {
  id: string;
  name: string;
  email: string;
  companyId: number;
  roleId: number;
}

interface AuthContextType {
  user: User | null;
  companyName: string | null;
  branches: string[];
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const hydratedTokens = new Set<string>();
const inFlightTokens = new Set<string>();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const mountedRef = useRef(true);

  const login = useCallback(async (token: string) => {
    if (!token || inFlightTokens.has(token)) return;

    console.log("AuthContext login fonksiyonu çağrıldı, token:", token);
    inFlightTokens.add(token);
    try {
      document.cookie = `token=${token}; path=/; max-age=3600`;

      const userRes = await axios.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("/auth/me yanıtı:", userRes.data);

      if (!mountedRef.current) return;
      setUser(userRes.data.user);

      const companyDataRes = await axios.get(
        `/companies/${userRes.data.user.companyId}/branches`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log(
        "/companies/{companyId}/branches yanıtı:",
        companyDataRes.data,
      );

      if (!mountedRef.current) return;
      setCompanyName(companyDataRes.data.companyName || "");
      setBranches(
        Array.isArray(companyDataRes.data.branches)
          ? companyDataRes.data.branches
          : [],
      );
      hydratedTokens.add(token);
    } finally {
      inFlightTokens.delete(token);
    }
  }, []);

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
      login(token);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [login]);

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
