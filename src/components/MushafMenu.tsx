"use client";

import type { ReactNode } from "react";

/**
 * Responsive menu wrapper for the Mushaf toolbar.
 * - On phones (≤640px): slides up as a bottom sheet with a dimmed, tap-to-close backdrop.
 * - On larger screens: renders as an absolute dropdown (desktop behaviour).
 *
 * Usage:
 *   <MushafMenu open={showNav} onClose={() => setShowNav(false)} side="right">
 *     ...content...
 *   </MushafMenu>
 */
export function MushafMenu({
  open,
  onClose,
  children,
  side = "right",
  width = 310,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Which side the desktop dropdown hugs. "right" (default, for RTL) or "left". */
  side?: "right" | "left";
  width?: number;
  labelledBy?: string;
}) {
  if (!open) return null;

  return (
    <>
      {/* Dim backdrop — mobile only (click also closes menus via the reader root) */}
      <div
        className="fixed inset-0 z-[190] bg-slate-900/30 backdrop-blur-[1px] sm:hidden"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`mushaf-menu-panel fixed inset-x-0 bottom-0 z-[200] max-h-[82vh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-slate-100 bg-white p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(15,23,42,0.25)] animate-[sheetUp_.26s_cubic-bezier(.22,1,.36,1)] sm:inset-auto sm:bottom-auto sm:mt-2 sm:max-h-none sm:overflow-hidden sm:rounded-3xl sm:border sm:p-0 sm:shadow-[0_20px_60px_rgba(15,23,42,0.18)] ${side === "right" ? "sm:right-0 sm:top-full" : "sm:left-0 sm:top-full"}`}
        style={{ ["--mushaf-menu-w" as string]: `${width}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
        {children}
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      </div>
    </>
  );
}
