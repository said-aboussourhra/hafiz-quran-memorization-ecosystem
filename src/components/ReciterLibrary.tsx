"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getAllReciters,
  getAvailableSurahs,
  getRecording,
  recordingUrl,
  FILTERS,
  type Reciter,
  type ReciterFilter,
} from "@/lib/reciterRegistry";
import {
  getFavoriteReciters,
  getRecentReciters,
  toggleFavoriteReciter,
  getDefaultReciterId,
  setDefaultReciter,
} from "@/lib/reciterPrefs";

const STYLE_LABEL: Record<string, string> = {
  murattal: "مرتل",
  mujawwad: "مجوّد",
  muallim: "معلّم",
  shubah: "شعبة",
  qalon: "قالون",
  warsh: "ورش",
  other: "أخرى",
};

/** آية الكرسي — البقرة ٢٥٥: الآية المفضّة للاستماع السريع لأي قارئ. */
const QUICK_LISTEN = { surah: 2, ayah: 255 };

/** رابط استماع سريع لآية قرآنية بهذا القارئ (آية الكرسي)، أو بداية سورة إن لم تتوفر آيات مفردة. */
function quickListenUrl(reciter: Reciter): string | null {
  const rec = getRecording(reciter.id, QUICK_LISTEN.surah) ?? getRecording(reciter.id, 1);
  if (!rec) return null;
  if (rec.sourceType === "everyayah") return recordingUrl(rec, rec.surahId === QUICK_LISTEN.surah ? QUICK_LISTEN.ayah : 1);
  return recordingUrl(rec);
}

function syncTier(r: Reciter): { dot: string; label: string } {
  const recs = getAvailableSurahs(r.id).length;
  if (r.defaultSource === "everyayah") return { dot: "#10b981", label: "كلمة بكلمة" };
  if (recs > 0) return { dot: "#94a3b8", label: "صوت فقط" };
  if (r.defaultSource === "youtube" || r.youtubeChannel) {
    return { dot: "#ef4444", label: "قناة يوتيوب" };
  }
  return { dot: "#cbd5e1", label: "غير متاح" };
}

function ReciterAvatar({ name, image, size = "md" }: { name: string; image: string | null; size?: "sm" | "md" }) {
  const initial = name.trim().charAt(0) || "ق";
  return (
    <span className={`reciter-photo-ring block shrink-0 ${size === "sm" ? "h-11 w-11 rounded-xl" : "h-[4.4rem] w-[4.4rem] rounded-2xl sm:h-[5.4rem] sm:w-[5.4rem]"}`} aria-hidden="true">
      {image ? (
        <Image src={image} alt="" width={96} height={96} className="reciter-photo" />
      ) : (
        <span className={`grid h-full w-full place-items-center ${size === "sm" ? "text-sm rounded-xl" : "text-2xl rounded-[0.9rem]"} font-bold text-white`} style={{ background: "linear-gradient(135deg,#10b981,#2563eb)", fontFamily: "var(--font-quran)" }}>
          {initial}
        </span>
      )}
    </span>
  );
}

function ReciterCard({
  reciter,
  isFav,
  isDefault,
  recCount,
  canQuickListen,
  quickPlaying,
  onFav,
  onDefault,
  onQuickListen,
}: {
  reciter: Reciter;
  isFav: boolean;
  isDefault: boolean;
  recCount: number;
  canQuickListen: boolean;
  quickPlaying: boolean;
  onFav: () => void;
  onDefault: () => void;
  onQuickListen: () => void;
}) {
  const tier = syncTier(reciter);
  // A reciter is playable in-app only when it has full-surah/ayah recordings.
  // A verified YouTube channel still has a useful detail page (sample + link).
  const hasYoutube = !!(reciter.youtubeChannel || reciter.youtubeSample);
  const unavailable = recCount === 0 && !hasYoutube;
  return (
    <div className={`group ornate-card relative overflow-hidden rounded-3xl card p-5 transition ${unavailable ? "opacity-70" : "hover:-translate-y-0.5 hover:shadow-lg"}`}>
      <span className="corner tl" aria-hidden />
      <span className="corner tr" aria-hidden />
      <div className="flex items-start gap-4">
        <span className="relative">
          <ReciterAvatar name={reciter.nameArabic} image={reciter.image} />
          {canQuickListen && (
            <button
              type="button"
              onClick={onQuickListen}
              aria-label={quickPlaying ? `إيقاف تلاوة ${reciter.nameArabic}` : `استمع لآية قرآنية بصوت ${reciter.nameArabic}`}
              aria-pressed={quickPlaying}
              title="استماع لآية الكرسي"
              className="absolute -bottom-1.5 -left-1.5 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-l from-emerald-500 to-ocean-600 text-xs text-white shadow-lg ring-2 ring-white transition hover:scale-110 active:scale-95"
            >
              {quickPlaying ? (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden><path d="M6 5h4v14H6zM13 5h4v14h-4z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>
              {reciter.nameArabic}
            </h3>
            {reciter.verified && (
              <span title="مصادر موثّقة" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">
                ✓
              </span>
            )}
          </div>
          {reciter.nameEnglish && (
            <p className="truncate text-xs text-ink-500">{reciter.nameEnglish}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full bg-cream-100 px-2.5 py-1 font-semibold text-ink-700">
              {STYLE_LABEL[reciter.style] ?? reciter.style}
            </span>
            {reciter.riwaya && (
              <span className="rounded-full bg-white px-2.5 py-1 text-ink-500 ring-1 ring-sand-300">{reciter.riwaya}</span>
            )}
            <span className="flex items-center gap-1.5 text-ink-500">
              <span className="h-2 w-2 rounded-full" style={{ background: tier.dot }} />
              {tier.label}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-ink-500">
            {recCount > 0
              ? `${recCount.toLocaleString("ar-EG")} تسجيلاً متاحاً`
              : hasYoutube
                ? "قناة رسمية ونموذج تلاوة على يوتيوب"
                : "لا توجد تسجيلات متاحة حالياً"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/reciters/${reciter.id}`}
          className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${recCount > 0 ? "btn-primary" : "btn-ghost"}`}
        >
          {recCount > 0 ? "استمع" : "التفاصيل"}
        </Link>
        <button
          type="button"
          onClick={recCount === 0 ? undefined : onDefault}
          disabled={recCount === 0}
          aria-pressed={isDefault}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isDefault ? "bg-emerald-600 text-white" : "btn-ghost"
          }`}
          title={unavailable ? "لا تتوفر تسجيلات حالياً" : "اجعله قارئي الافتراضي"}
        >
          {isDefault ? "قارئي ✓" : "اختر قارئي"}
        </button>
        <button
          type="button"
          onClick={onFav}
          aria-label={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          aria-pressed={isFav}
          className="grid h-11 w-11 place-items-center rounded-xl border border-sand-300 bg-white text-lg transition hover:bg-cream-100"
        >
          {isFav ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}

export function ReciterLibrary() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReciterFilter>("all");
  const [favs, setFavs] = useState<string[]>(() => getFavoriteReciters());
  const [recent, setRecent] = useState<string[]>(() => getRecentReciters());
  const [defaultId, setDefaultId] = useState<string>(() => getDefaultReciterId());

  // مشغّل الاستماع السريع — عنصر صوتي واحد مشترك بين كل البطاقات.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [quickId, setQuickId] = useState<string | null>(null);

  const toggleQuickListen = (r: Reciter) => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.preload = "none";
      audioRef.current = audio;
    }
    if (quickId === r.id) {
      audio.pause();
      setQuickId(null);
      return;
    }
    const url = quickListenUrl(r);
    if (!url) return;
    audio.pause();
    audio.src = url;
    setQuickId(r.id);
    audio.onended = () => setQuickId(null);
    audio.onerror = () => setQuickId(null);
    audio.play().catch(() => setQuickId(null));
  };

  const all = useMemo(() => getAllReciters(), []);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of all) m.set(r.id, getAvailableSurahs(r.id).length);
    return m;
  }, [all]);
  const quickOk = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const r of all) m.set(r.id, quickListenUrl(r) != null);
    return m;
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((r) => {
      if (filter !== "all") {
        const f = FILTERS.find((x) => x.id === filter);
        if (f && !f.match(r)) return false;
      }
      if (!q) return true;
      return (
        r.nameArabic.toLowerCase().includes(q) ||
        (r.nameEnglish?.toLowerCase().includes(q) ?? false) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [all, query, filter]);

  const recentReciters = recent.map((id) => all.find((r) => r.id === id)).filter(Boolean) as Reciter[];

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="text-xs tracking-[0.3em] text-gold-600">مكتبة القرّاء</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">قارئك المفضّل</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-500">
          مجموعة من القرّاء بمصادر صوتية موثّقة. اختر قارئك، واستمع، أو ابدأ الحفظ بصوته.
        </p>
      </header>

      {/* Search + filters */}
      <div className="mx-auto max-w-3xl space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن قارئ بالاسم…"
          dir="rtl"
          className="w-full rounded-2xl border border-sand-300 bg-white px-5 py-3.5 text-lg text-ink-900 shadow-sm outline-none transition focus:border-emerald-500"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                filter === f.id ? "btn-primary text-white" : "btn-ghost"
              }`}
            >
              {f.dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.dot }} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent */}
      {recentReciters.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-sm font-bold text-ink-700">استمعت مؤخراً</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentReciters.map((r) => (
              <Link
                key={r.id}
                href={`/reciters/${r.id}`}
                className="flex w-44 shrink-0 items-center gap-2 rounded-2xl card p-3 transition hover:-translate-y-0.5"
              >
                <ReciterAvatar name={r.nameArabic} image={r.image} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink-900">{r.nameArabic}</span>
                  <span className="mt-0.5 block text-[10px] text-ink-500">{STYLE_LABEL[r.style] ?? r.style}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      <section>
        {favs.length > 0 && (
          <h2 className="mb-3 font-display text-sm font-bold text-ink-700">⭐ المفضّلة</h2>
        )}
        {filtered.length === 0 ? (
          <div className="rounded-3xl card p-10 text-center text-ink-500">لا يوجد قارئ مطابق لبحثك.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <ReciterCard
                key={r.id}
                reciter={r}
                isFav={favs.includes(r.id)}
                isDefault={defaultId === r.id}
                recCount={counts.get(r.id) ?? 0}
                canQuickListen={quickOk.get(r.id) ?? false}
                quickPlaying={quickId === r.id}
                onFav={() => setFavs(toggleFavoriteReciter(r.id))}
                onDefault={() => {
                  setDefaultReciter(r.id);
                  setDefaultId(r.id);
                }}
                onQuickListen={() => toggleQuickListen(r)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
