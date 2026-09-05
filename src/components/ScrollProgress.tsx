"use client";

import { useEffect, useState } from "react";

/**
 * شريط تقدّم القراءة العائم أعلى الصفحة — خط ذهبي-زمردي متوهج
 * يمتد مع التمرير. في RTL يبدأ امتداده من اليمين.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [origin, setOrigin] = useState("right");

  useEffect(() => {
    if (typeof document === "undefined") return;
    setOrigin(document.documentElement.dir === "rtl" ? "right" : "left");

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]"
      style={{
        transform: `scaleX(${progress})`,
        transformOrigin: origin,
        background: "linear-gradient(90deg, #2563eb, #10b981 45%, #c9a44a)",
        boxShadow: "0 0 12px rgba(201,164,74,0.55), 0 0 4px rgba(16,185,129,0.5)",
        opacity: progress > 0.005 ? 1 : 0,
        transition: "opacity .3s ease",
      }}
    />
  );
}
