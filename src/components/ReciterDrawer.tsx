"use client";

import React, { useState } from "react";
import {
  RECITERS_CATALOG,
  filterReciters,
  type ReciterProfile,
  type SyncLevel,
} from "@/lib/reciterRegistry";

interface ReciterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReciter: ReciterProfile;
  onSelectReciter: (reciter: ReciterProfile) => void;
  onStartMemorizeWithReciter?: (reciter: ReciterProfile) => void;
}

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "haramain", label: "أئمة الحرمين" },
  { id: "egyptian", label: "المدرسة المصرية" },
  { id: "murattal", label: "المرتل" },
  { id: "mujawwad", label: "المجوّد" },
  { id: "modern", label: "أصوات معاصرة" },
];

export function ReciterDrawer({
  isOpen,
  onClose,
  selectedReciter,
  onSelectReciter,
  onStartMemorizeWithReciter,
}: ReciterDrawerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [syncFilter, setSyncFilter] = useState<SyncLevel | undefined>(undefined);
  const [previewReciter, setPreviewReciter] = useState<ReciterProfile | null>(null);

  if (!isOpen) return null;

  const filtered = filterReciters(query, category, syncFilter);

  const getSyncBadge = (level: SyncLevel) => {
    switch (level) {
      case "WORD_VERIFIED":
        return {
          icon: "🟢",
          text: "كلمة بكلمة (دقيق)",
          cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "WORD_AUTO":
        return {
          icon: "🟡",
          text: "كلمة بكلمة (تلقائي)",
          cls: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "AYAH_SYNC":
        return {
          icon: "🟡",
          text: "آية بآية",
          cls: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "AUDIO_ONLY":
      default:
        return {
          icon: "⚪",
          text: "صوت فقط",
          cls: "bg-gray-50 text-gray-600 border-gray-200",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-gold-500/20 overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-500/10 bg-cream-50/70">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-ocean-600 text-xl text-white shadow-md">
              🎙️
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-ink-900">
                مكتبة القراء المعتمدة
              </h3>
              <p className="text-xs text-ink-500">
                اختر قارئك المفضل بمزامنة صوتية دقيقة لكل تسجيل
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-500 hover:bg-gray-100 transition"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-100 space-y-3 bg-white">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم القارئ أو الرواية أو الأسلوب..."
              className="w-full rounded-2xl border border-emerald-500/20 bg-cream-50/50 px-4 py-2.5 pl-10 text-sm text-ink-900 placeholder:text-ink-500 focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
            <span className="absolute left-3.5 top-3 text-ink-500">🔍</span>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-full px-3 py-1 font-semibold transition ${
                  category === cat.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-cream-100 text-ink-700 hover:bg-cream-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sync Level Filter */}
          <div className="flex items-center gap-2 text-xs text-ink-500 pt-1">
            <span className="font-semibold">المزامنة:</span>
            <button
              onClick={() => setSyncFilter(undefined)}
              className={`px-2 py-0.5 rounded-md ${
                syncFilter === undefined
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSyncFilter("WORD_VERIFIED")}
              className={`px-2 py-0.5 rounded-md ${
                syncFilter === "WORD_VERIFIED"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              🟢 كلمة بكلمة
            </button>
            <button
              onClick={() => setSyncFilter("AYAH_SYNC")}
              className={`px-2 py-0.5 rounded-md ${
                syncFilter === "AYAH_SYNC"
                  ? "bg-blue-700 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              🟡 آية بآية
            </button>
          </div>
        </div>

        {/* Reciters List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-ink-500">
              <span className="text-4xl block mb-2">🎧</span>
              لا يوجد قراء يطابقون خيارات البحث.
            </div>
          ) : (
            filtered.map((reciter) => {
              const isSelected = selectedReciter.id === reciter.id;
              const badge = getSyncBadge(reciter.defaultSyncLevel);

              return (
                <div
                  key={reciter.id}
                  className={`pt-2.5 first:pt-0 rounded-2xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-emerald-50/80 border border-emerald-500/30 shadow-sm"
                      : "hover:bg-cream-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-ocean-700 text-lg font-bold text-white shadow-sm">
                      {reciter.nameArabic.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display text-base font-bold text-ink-900">
                          {reciter.nameArabic}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}
                        >
                          {badge.icon} {badge.text}
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">{reciter.style}</p>
                      <div className="flex items-center gap-3 text-[11px] text-ink-500 mt-1">
                        <span>الرواية: {reciter.riwayah}</span>
                        <span>·</span>
                        <span>{reciter.availableSurahs.length} سورة متاحة</span>
                        <span>·</span>
                        <span>{reciter.audioQuality}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setPreviewReciter(reciter)}
                      className="rounded-xl px-3 py-1.5 text-xs text-ink-700 bg-white border border-gray-200 hover:bg-gray-50 transition"
                    >
                      الملف التعريفي
                    </button>
                    <button
                      onClick={() => {
                        onSelectReciter(reciter);
                        onClose();
                      }}
                      className={`rounded-xl px-4 py-1.5 text-xs font-bold transition shadow-sm ${
                        isSelected
                          ? "bg-emerald-700 text-white"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {isSelected ? "القارئ الحالي ✓" : "اختيار كقارئي"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reciter Profile Modal Overlay */}
        {previewReciter && (
          <div className="absolute inset-0 z-20 bg-white/98 p-6 flex flex-col justify-between overflow-y-auto animate-in fade-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h4 className="font-display text-lg font-bold text-ink-900">
                  الملف التعريفي للقارئ
                </h4>
                <button
                  onClick={() => setPreviewReciter(null)}
                  className="rounded-full p-1.5 text-ink-500 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-600 to-ocean-700 text-3xl font-bold text-white shadow-lg">
                  {previewReciter.nameArabic.charAt(0)}
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold text-ink-900">
                  {previewReciter.nameArabic}
                </h3>
                <p className="text-sm text-gold-600 font-semibold mt-1">
                  {previewReciter.style}
                </p>
                <p className="mt-4 text-sm text-ink-700 leading-relaxed max-w-md mx-auto">
                  {previewReciter.bioArabic}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-2xl bg-cream-50 p-3 border border-emerald-500/10">
                  <div className="text-xs text-ink-500">الرواية</div>
                  <div className="mt-1 text-sm font-bold text-ink-900">
                    {previewReciter.riwayah}
                  </div>
                </div>
                <div className="rounded-2xl bg-cream-50 p-3 border border-emerald-500/10">
                  <div className="text-xs text-ink-500">السور المتاحة</div>
                  <div className="mt-1 text-sm font-bold text-ink-900">
                    {previewReciter.availableSurahs.length} سورة
                  </div>
                </div>
                <div className="rounded-2xl bg-cream-50 p-3 border border-emerald-500/10">
                  <div className="text-xs text-ink-500">جودة الصوت</div>
                  <div className="mt-1 text-sm font-bold text-ink-900">
                    {previewReciter.audioQuality}
                  </div>
                </div>
                <div className="rounded-2xl bg-cream-50 p-3 border border-emerald-500/10">
                  <div className="text-xs text-ink-500">مستوى المزامنة</div>
                  <div className="mt-1 text-sm font-bold text-emerald-700">
                    {previewReciter.defaultSyncLevel === "WORD_VERIFIED"
                      ? "🟢 كلمة بكلمة"
                      : "🟡 آية بآية"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  onSelectReciter(previewReciter);
                  setPreviewReciter(null);
                  onClose();
                }}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
              >
                اختيار كقارئي المفضل
              </button>
              {onStartMemorizeWithReciter && (
                <button
                  onClick={() => {
                    onSelectReciter(previewReciter);
                    onStartMemorizeWithReciter(previewReciter);
                    setPreviewReciter(null);
                    onClose();
                  }}
                  className="rounded-2xl border border-emerald-600 text-emerald-700 px-6 py-3 text-sm font-bold hover:bg-emerald-50 transition"
                >
                  ابدأ الحفظ بهذا القارئ
                </button>
              )}
              <button
                onClick={() => setPreviewReciter(null)}
                className="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-semibold text-ink-700 hover:bg-gray-200 transition"
              >
                رجوع للقائمة
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
