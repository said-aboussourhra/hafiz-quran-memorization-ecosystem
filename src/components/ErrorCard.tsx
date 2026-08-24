"use client";

import React from "react";

interface ErrorCardProps {
  expectedWord: string;
  spokenWord?: string;
  surahName?: string;
  ayahNumber?: number;
  explanation?: string;
  onListen: () => void;
  onRetry: () => void;
  onPractice: () => void;
  onDismiss?: () => void;
}

export function ErrorCard({
  expectedWord,
  spokenWord,
  surahName,
  ayahNumber,
  explanation,
  onListen,
  onRetry,
  onPractice,
  onDismiss,
}: ErrorCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500/30 bg-white/95 p-5 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
      {/* Accent strip */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
            🔴
          </span>
          <span className="font-display text-sm font-bold text-rose-800">
            تحتاج إلى تثبيت
          </span>
        </div>
        {surahName && (
          <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs text-ink-500">
            {surahName} {ayahNumber ? `· آية ${ayahNumber}` : ""}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        {/* Expected */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/60 p-3">
          <div className="text-[11px] font-semibold text-emerald-700">الصحيح</div>
          <div
            className="mt-1 text-2xl font-bold text-emerald-800"
            style={{ fontFamily: "var(--font-quran)" }}
          >
            {expectedWord}
          </div>
        </div>

        {/* Spoken */}
        <div className="rounded-xl border border-rose-500/20 bg-rose-50/60 p-3">
          <div className="text-[11px] font-semibold text-rose-700">نطقت</div>
          <div
            className="mt-1 text-2xl font-bold text-rose-800 line-through decoration-rose-400"
            style={{ fontFamily: "var(--font-quran)" }}
          >
            {spokenWord || "—"}
          </div>
        </div>
      </div>

      {explanation && (
        <p className="mt-3 text-center text-xs text-ink-500">{explanation}</p>
      )}

      {/* Quick Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onListen}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <span>🔊</span>
          <span>استمع</span>
        </button>

        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-xl bg-ocean-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-ocean-700 active:scale-95"
        >
          <span>🎙️</span>
          <span>أعد التسميع</span>
        </button>

        <button
          onClick={onPractice}
          className="flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 active:scale-95"
        >
          <span>🔁</span>
          <span>تدرب</span>
        </button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded-xl px-2.5 py-2 text-xs text-ink-500 transition hover:bg-gray-100"
            aria-label="تخطي"
          >
            تخطي
          </button>
        )}
      </div>
    </div>
  );
}
