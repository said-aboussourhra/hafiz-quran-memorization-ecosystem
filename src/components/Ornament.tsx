import type { ReactNode } from "react";

/**
 * HAFIZ — Global ornamental kit (زخارف إسلامية)
 * Reusable SVG ornaments shared by the intro, home hero and premium cards
 * so the whole platform keeps one harmonious visual language.
 */

/** Eight-point Islamic star (خاتم) — the signature glyph. */
export function OrnamentStar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" aria-hidden>
      <path d="M50 2 L61 25 L84 16 L75 39 L98 50 L75 61 L84 84 L61 75 L50 98 L39 75 L16 84 L25 61 L2 50 L25 39 L16 16 L39 25 Z" />
      <circle cx="50" cy="50" r="14" />
    </svg>
  );
}

/** Horizontal divider: gradient lines + slowly rotating golden star. */
export function OrnamentDivider({ label }: { label?: ReactNode }) {
  return (
    <div className="ornament-divider my-6" aria-hidden>
      <OrnamentStar className="ornament-star h-4 w-4" />
      {label ? <span className="text-xs font-bold tracking-[0.2em]">{label}</span> : null}
      <OrnamentStar className="ornament-star h-4 w-4" />
    </div>
  );
}

/**
 * Royal Islamic arc corners — أقواس الزوايا الملكية ╭ ╮ ╰ ╯
 * 36px elegant corner brackets with smooth hover motion.
 * Drop inside any relatively-positioned card (.lift / .card-premium /
 * .royal-frame all animate these on hover).
 */
export function RoyalCorners({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "royal-corner rc-" : "royal-corner rc-";
  return (
    <>
      <span className={`${cls}tl`} aria-hidden>╭</span>
      <span className={`${cls}tr`} aria-hidden>╮</span>
      <span className={`${cls}bl`} aria-hidden>╰</span>
      <span className={`${cls}br`} aria-hidden>╯</span>
    </>
  );
}

/** Legacy alias kept for any un-migrated markup — now renders royal arcs. */
export function OrnamentCorners() {
  return <RoyalCorners />;
}

/**
 * Full standalone royal frame: solid 2px outer frame + double inner
 * inset frame (emerald + gold) + four arc corners. Wrap a non-card
 * surface (the element itself should carry the `.royal-frame` class).
 */
export function RoyalFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="rf-line rf-inner" aria-hidden />
      <span className="rf-line rf-inner-2" aria-hidden />
      <RoyalCorners />
      {children}
    </>
  );
}

/** Subtle arabesque geometric watermark — fills its (relative) parent. */
export function ArabesqueBg() {
  return <span className="arabesque-bg" aria-hidden />;
}

/** Basmala ornamental frame with corners — used on hero/intro headings. */
export function BasmalaFrame({ children }: { children: ReactNode }) {
  return (
    <div className="royal-frame relative inline-block px-6 py-4 sm:px-10 sm:py-6">
      <RoyalFrame>{children}</RoyalFrame>
    </div>
  );
}
