"use client";

import React, { useState } from "react";
import type { MutashabihGroup } from "@/lib/mutashabihat";

interface MutashabihatCardProps {
  group: MutashabihGroup;
  onPlayVerse?: (surahNumber: number, ayahNumber: number) => void;
  onTestRecite?: (verseText: string) => void;
}

export function MutashabihatCard({
  group,
  onPlayVerse,
  onTestRecite,
}: MutashabihatCardProps) {
  const [activeTab, setActiveTab] = useState<"compare" | "hint" | "test">("compare");
  const [testedVerseIndex, setTestedVerseIndex] = useState<number | null>(null);

  return (
    <div className="rounded-3xl border border-gold-500/20 bg-white p-6 shadow-md transition-all hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-lg">
            🧩
          </span>
          <div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
              متشابهات الألفاظ
            </span>
            <h3 className="font-display text-lg font-bold text-ink-900 mt-0.5">
              {group.titleAr}
            </h3>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl bg-cream-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("compare")}
            className={`rounded-lg px-3 py-1 transition ${
              activeTab === "compare"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            المقارنة
          </button>
          <button
            onClick={() => setActiveTab("hint")}
            className={`rounded-lg px-3 py-1 transition ${
              activeTab === "hint"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            ضابط الحفظ
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-ink-500">{group.theme}</p>

      {/* Compare Mode */}
      {activeTab === "compare" && (
        <div className="mt-5 space-y-4">
          {group.verses.map((v, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-emerald-500/15 bg-cream-50/70 p-4 transition hover:bg-cream-50"
            >
              <div className="flex items-center justify-between text-xs text-ink-500 pb-2 border-b border-emerald-500/10">
                <span className="font-bold text-emerald-800">
                  سورة {v.surahNameAr} · آية {v.ayahNumber}
                </span>
                {onPlayVerse && (
                  <button
                    onClick={() => onPlayVerse(v.surahNumber, v.ayahNumber)}
                    className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900"
                  >
                    <span>🔊 استمع للآية</span>
                  </button>
                )}
              </div>

              {/* Quran text with highlighted difference */}
              <div
                className="mt-3 text-xl leading-loose text-ink-900 text-right"
                style={{ fontFamily: "var(--font-quran)" }}
              >
                {v.fullText}
              </div>

              {/* Key Diff Badge */}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1 border border-amber-200/70 text-xs">
                <span className="font-bold text-amber-900">موضع التمييز:</span>
                <span className="font-bold text-amber-700" style={{ fontFamily: "var(--font-quran)" }}>
                  {v.keyWordDiff}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mnemonic / Hint Mode */}
      {activeTab === "hint" && (
        <div className="mt-5 rounded-2xl bg-amber-50/80 p-5 border border-amber-300/40 text-right space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <span>💡</span>
            <span>قاعدة الضبط والتمييز:</span>
          </div>
          <p className="text-sm leading-relaxed text-ink-800 font-medium">
            {group.mnemonicHint}
          </p>
          <p className="text-xs text-ink-500">
            تثبيت المتشابهات بالضوابط الذهنية يعصم الحافظ من الخلط أثناء التلاوة في الصلاة والمراجعة.
          </p>
        </div>
      )}
    </div>
  );
}
