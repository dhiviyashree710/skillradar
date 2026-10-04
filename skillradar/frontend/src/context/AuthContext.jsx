import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("skillradar_user");
    return saved ? JSON.parse(saved) : null;
  });

  const persist = (token, userData) => {
    localStorage.setItem("skillradar_token", token);
    localStorage.setItem("skillradar_user", JSON.stringify(userData));
    setUser(userData);
  };

  const signup = useCallback(async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    persist(data.token, data.user);
    return data.user;
  }, []);

  const login = useCallback(async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("skillradar_token");
    localStorage.removeItem("skillradar_user");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    localStorage.setItem("skillradar_user", JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
