"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type RevealVariant = "up" | "down" | "zoom" | "left" | "right" | "fade";

/**
 * <Reveal /> — انتقال انسيابي فخم عند ظهور العنصر في مجال الرؤية.
 *
 * - variant: اتجاه الدخول (up / down / zoom / left / right / fade)
 * - delay:  تأخير بالمللي ثانية — يُستخدم للـ stagger على الشبكات
 * - once:   يعيد الإخفاء عند الخروج من الشاشة إن كان false
 *
 * يحترم prefers-reduced-motion (CSS) ويعرض المحتوى مباشرةً إذا كان
 * IntersectionObserver غير مدعوم.
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  as: Tag = "div",
  className = "",
  threshold = 0.12,
  rootMargin = "0px 0px -6% 0px",
  once = true,
  id,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  as?: ElementType;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<"hidden" | "visible">("hidden");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setState("visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("visible");
            if (once) io.disconnect();
          } else if (!once) {
            setState("hidden");
          }
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold, rootMargin]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag
      ref={ref as any}
      id={id}
      data-state={state}
      data-variant={variant}
      className={`reveal ${className}`.trim()}
      style={{ "--rv-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
