"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

// استيراد AdminLogin ديناميكياً لتجنب SSR problems
const AdminLoginDynamic = dynamic(
  () => import("./AdminLogin").then((mod) => mod.AdminLogin),
  { ssr: false }
);

type AdminLoginContextType = {
  openAdminLogin: () => void;
  closeAdminLogin: () => void;
};

const AdminLoginContext = createContext<AdminLoginContextType | null>(null);

export function AdminLoginProvider({ children }: { children: React.ReactNode }) {
  const [showLogin, setShowLogin] = useState(false);

  const openAdminLogin = useCallback(() => setShowLogin(true), []);
  const closeAdminLogin = useCallback(() => setShowLogin(false), []);

  return (
    <AdminLoginContext.Provider value={{ openAdminLogin, closeAdminLogin }}>
      {children}
      {showLogin && typeof window !== "undefined" && (
        <>{createPortal(<AdminLoginDynamic />, document.body)}</>
      )}
    </AdminLoginContext.Provider>
  );
}

export function useAdminLogin() {
  const context = useContext(AdminLoginContext);
  if (!context) {
    throw new Error("useAdminLogin must be used within AdminLoginProvider");
  }
  return context;
}
