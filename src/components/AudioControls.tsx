"use client";

import { useEffect, useState } from "react";
import type { AudioEngine } from "@/lib/audio/useAudioEngine";
import { SYNC_META } from "@/lib/audio/types";

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m.toLocaleString("ar-EG")}:${s.toString().padStart(2, "0")}`;
}

export function AudioControls({ engine }: { engine: AudioEngine }) {
  const { state, speeds } = engine;
  const [showSleep, setShowSleep] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);

  // Keyboard shortcuts (Desktop): Space=play/pause, ←/→ prev/next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        engine.toggle();
      } else if (e.key === "ArrowLeft") {
        engine.nextAyah();
      } else if (e.key === "ArrowRight") {
        engine.prevAyah();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine]);

  const pct = state.duration > 0 ? Math.min(100, (state.currentTime / state.duration) * 100) : 0;
  const sync = SYNC_META[state.syncStatus];
  const syncOk = state.syncStatus !== "NOT_AVAILABLE";

  return (
    <div className="sticky bottom-0 z-[90] -mx-2 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
      <div
        className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-emerald-100 bg-white/95 shadow-[0_-8px_40px_-12px_rgba(15,23,42,0.25)] backdrop-blur-xl"
        role="region"
        aria-label="مشغّل التلاوة"
      >
        {/* Seek bar */}
        <div className="flex items-center gap-2 px-3 pt-2.5" dir="ltr">
          <span className="w-10 text-center text-[10px] tabular-nums text-ink-500">{fmt(state.currentTime)}</span>
          <input
            type="range"
            min={0}
            max={state.duration || 0}
            step={0.1}
            value={state.currentTime}
            onChange={(e) => engine.seek(Number(e.target.value))}
            disabled={!syncOk || state.duration === 0}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sand-300 accent-emerald-600 disabled:opacity-40"
            aria-label="تقديم/تأخير"
          />
          <span className="w-10 text-center text-[10px] tabular-nums text-ink-500">{fmt(state.duration)}</span>
        </div>
        <div className="h-0.5 w-full bg-sand-300/50" dir="ltr">
          <div className="h-full bg-gradient-to-l from-emerald-500 to-ocean-500 transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-1 px-2 py-2 sm:gap-2 sm:px-3">
          <button
            type="button"
            onClick={engine.prevAyah}
            disabled={!syncOk}
            className="grid h-11 w-11 place-items-center rounded-xl text-ink-700 transition hover:bg-cream-100 disabled:opacity-40"
            aria-label="الآية السابقة"
            title="الآية السابقة (→)"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zM9.5 12l8.5 6V6z" /></svg>
          </button>

          <button
            type="button"
            onClick={engine.toggle}
            disabled={!syncOk}
            className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-l from-emerald-500 to-ocean-500 text-white shadow-md transition active:scale-95 disabled:opacity-40"
            aria-label={state.status === "playing" ? "إيقاف مؤقت" : "تشغيل"}
            title="تشغيل/إيقاف (مسافة)"
          >
            {state.status === "loading" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : state.status === "playing" ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <button
            type="button"
            onClick={engine.nextAyah}
            disabled={!syncOk}
            className="grid h-11 w-11 place-items-center rounded-xl text-ink-700 transition hover:bg-cream-100 disabled:opacity-40"
            aria-label="الآية التالية"
            title="الآية التالية (←)"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" /></svg>
          </button>

          {/* Repeat */}
          <button
            type="button"
            onClick={engine.toggleRepeatAyah}
            aria-pressed={state.repeatAyah}
            className={`grid h-11 w-11 place-items-center rounded-xl transition ${state.repeatAyah ? "bg-emerald-100 text-emerald-700" : "text-ink-700 hover:bg-cream-100"}`}
            aria-label="تكرار الآية"
            title="تكرار الآية"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 014-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 01-4 4H3" />
            </svg>
          </button>

          {/* Speed */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowSpeed((v) => !v); setShowSleep(false); }}
              className="grid h-11 min-w-[48px] place-items-center rounded-xl px-2 text-xs font-bold text-ink-700 transition hover:bg-cream-100"
              aria-label="سرعة التشغيل"
            >
              {state.playbackRate}×
            </button>
            {showSpeed && (
              <div className="absolute bottom-full end-0 mb-2 w-28 overflow-hidden rounded-xl border border-sand-300 bg-white p-1 shadow-xl">
                {speeds.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => { engine.setRate(sp); setShowSpeed(false); }}
                    className={`block w-full rounded-lg px-3 py-2 text-start text-sm transition ${state.playbackRate === sp ? "bg-emerald-50 font-bold text-emerald-700" : "hover:bg-cream-100"}`}
                  >
                    {sp}× {sp === 1 ? "(عادي)" : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sleep timer */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowSleep((v) => !v); setShowSpeed(false); }}
              className={`grid h-11 w-11 place-items-center rounded-xl transition ${state.sleepEndsAt ? "bg-ocean-100 text-ocean-700" : "text-ink-700 hover:bg-cream-100"}`}
              aria-label="مؤقت النوم"
              title="مؤقت النوم"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
              </svg>
            </button>
            {showSleep && (
              <div className="absolute bottom-full end-0 mb-2 w-36 overflow-hidden rounded-xl border border-sand-300 bg-white p-1 shadow-xl">
                {[5, 10, 15, 30, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { engine.setSleepTimer(m); setShowSleep(false); }}
                    className="block w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-cream-100"
                  >
                    {m} دقيقة
                  </button>
                ))}
                <button type="button" onClick={() => { engine.setSleepTimer(null); setShowSleep(false); }} className="block w-full rounded-lg px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50">
                  إيقاف المؤقت
                </button>
              </div>
            )}
          </div>

          {/* Auto-scroll toggle */}
          <button
            type="button"
            onClick={engine.toggleAutoScroll}
            aria-pressed={state.autoScroll}
            className={`hidden h-11 w-11 place-items-center rounded-xl transition sm:grid ${state.autoScroll ? "bg-emerald-100 text-emerald-700" : "text-ink-700 hover:bg-cream-100"}`}
            aria-label="تمرير تلقائي"
            title="تمرير تلقائي"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" /><path d="M19 12l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Sync status — honest reporting */}
        <div className="flex items-center justify-center gap-1.5 border-t border-sand-300/50 px-3 py-1.5 text-[10px] text-ink-500">
          <span className="h-2 w-2 rounded-full" style={{ background: sync.color }} />
          {sync.canHighlightWord ? (
            <span>{sync.label} · تظليل الكلمات متاح لهذا التسجيل</span>
          ) : state.syncStatus === "VERSE_ONLY" ? (
            <span>تزامن على مستوى الآية — التظليل المتزامن للكلمات غير متاح لهذا التسجيل.</span>
          ) : state.syncStatus === "AUDIO_ONLY" ? (
            <span>صوت فقط — التظليل المتزامن غير متاح لهذا التسجيل.</span>
          ) : (
            <span>التسجيل غير متاح.</span>
          )}
        </div>
      </div>
    </div>
  );
}
