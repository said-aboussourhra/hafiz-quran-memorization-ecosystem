"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AdminLogin } from "./AdminLogin";

/**
 * زر لفتح نموذج دخول المسئول
 * يمكن استخدامه في أي مكان في التطبيق
 */
export function AdminLoginButton({ children }: { children: React.ReactNode }) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <button onClick={() => setShowLogin(true)} className="w-full h-full bg-transparent border-none p-0 m-0 cursor-pointer">
        {children}
      </button>
      {showLogin && (
        <>
          {typeof window !== "undefined" && (
            <>
              {createPortal(
                <AdminLogin />,
                document.body
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
