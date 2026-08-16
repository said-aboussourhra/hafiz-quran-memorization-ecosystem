"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initSpeech, speakArabic, stopSpeaking, speechSupported } from "@/lib/speak";

const DUAS = [
  "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
  "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
  "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
  "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ",
  "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
  "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ",
];

const IDLE_MS = 45000; // 45s of no interaction

export function IdleDhikr({ name }: { name: string | null }) {
  const [open, setOpen] = useState(false);
  const [dua, setDua] = useState(DUAS[0]);
  const timer = useRef<number | null>(null);

  const displayName = name || "عبد الله";

  const schedule = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setDua(DUAS[Math.floor(Math.random() * DUAS.length)]);
      setOpen(true);
    }, IDLE_MS);
  }, []);

  useEffect(() => {
    initSpeech();
    const onActivity = () => {
      if (!open) schedule();
    };
    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    schedule();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [open, schedule]);

  const close = () => {
    stopSpeaking();
    setOpen(false);
    schedule();
  };

  const repeat = () => {
    if (!speechSupported()) return;
    speakArabic(`يا ${displayName}، كرّر معي هذا الدعاء`, { rate: 0.9 });
    window.setTimeout(() => speakArabic(dua, { rate: 0.8 }), 2400);
  };

  if (!open) return null;

  return (
    <div className="sheet-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-ink-900/40 p-5 backdrop-blur-sm" onClick={close}>
      <div className="sheet-panel relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-8 text-center shadow-2xl backdrop-blur" onClick={(e) => e.stopPropagation()}>
        <div className="aurora breathe" style={{ top: "-50px", right: "10%", width: "200px", height: "200px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: "linear-gradient(90deg,#10b981,#3b82f6)" }} />

        <div className="relative">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-3xl text-white shadow-lg breathe" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>📿</div>
          <h3 className="mt-5 font-display text-xl font-bold text-ink-900">يا {displayName}، كرّر معي هذا الدعاء</h3>
          <p className="mt-6 text-2xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{dua}</p>
          <p className="mt-5 text-sm font-semibold text-emerald-700">جزاك الله خير الجزاء 🤍</p>

          <div className="mt-6 flex justify-center gap-2">
            {speechSupported() && <button onClick={repeat} className="rounded-2xl btn-primary px-6 py-3 text-sm font-semibold">🔊 كرّر معي</button>}
            <button onClick={close} className="rounded-2xl btn-ghost px-6 py-3 text-sm font-semibold">تابعت</button>
          </div>
        </div>
      </div>
    </div>
  );
}
