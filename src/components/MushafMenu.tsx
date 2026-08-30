"use client";

import type { ReactNode } from "react";

/**
 * Responsive menu for the Mushaf reader.
 * - On phones (≤640px): slides up as a bottom sheet.
 * - On larger screens: appears as a centered, elegant modal card.
 *
 * Used only by the reader; its visibility is fully controlled by the parent.
 */
export function MushafMenu({
  open,
  onClose,
  children,
  width = 360,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: "right" | "left";
  width?: number;
  labelledBy?: string;
}) {
  if (!open) return null;

  return (
    <>
      {/* Dim + blur backdrop (all screens) */}
      <div
        className="sheet-backdrop fixed inset-0 z-[190] bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="sheet-panel fixed inset-x-0 bottom-0 z-[200] max-h-[84vh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-slate-100 bg-white p-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] shadow-[0_-24px_70px_rgba(15,23,42,0.3)]
          sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[86vh] sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:border sm:p-5 sm:shadow-[0_40px_90px_-30px_rgba(15,23,42,0.55)]"
        style={{ width: "100%", ["--mushaf-menu-w" as string]: `${width}px`, maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
        {children}
      </div>
    </>
  );
}
