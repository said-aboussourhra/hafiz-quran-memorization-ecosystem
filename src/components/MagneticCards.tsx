"use client";

import { useEffect } from "react";

// Adds a subtle cursor-following light to every .card via CSS variables.
// Respects reduced-motion and skips touch devices for performance.
export function MagneticCards() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const target = (e.target as HTMLElement)?.closest?.(".card") as HTMLElement | null;
        if (!target) return;
        const r = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        target.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
