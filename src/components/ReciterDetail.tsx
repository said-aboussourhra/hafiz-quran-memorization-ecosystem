"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getReciter,
  getRecordings,
  getAvailableSurahs,
  recordingUrl,
  type Reciter,
} from "@/lib/reciterRegistry";
import { getSurah } from "@/lib/surahs";
import {
  isFavoriteReciter,
  toggleFavoriteReciter,
  getDefaultReciterId,
  setDefaultReciter,
  pushRecentReciter,
} from "@/lib/reciterPrefs";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

/** Normalize a YouTube handle/URL into a safe https link. */
function youtubeChannelUrl(handleOrUrl: string): string {
  const v = handleOrUrl.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.startsWith("@") ? v : `@${v}`;
  return `https://www.youtube.com/${handle}`;
}

const STYLE_LABEL: Record<string, string> = {
  murattal: "مرتل",
  mujawwad: "مجوّد",
  muallim: "معلّم",
  shubah: "شعبة",
  qalon: "قالون",
  warsh: "ورش",
  other: "أخرى",
};

const SYNC_META: Record<string, { label: string; color: string; desc: string }> = {
  word: { label: "كلمة بكلمة", color: "#10b981", desc: "تظليل الكلمات أثناء التلاوة" },
  ayah: { label: "آية بآية", color: "#f59e0b", desc: "ملف صوتي لكل آية" },
  surah: { label: "صوت فقط", color: "#94a3b8", desc: "تلاوة كاملة للسورة" },
  none: { label: "غير متاح", color: "#cbd5e1", desc: "لا تتوفر تسجيلات حالياً" },
};

function ReciterHero({ reciter, isFav, isDefault, availableCount, onFav, onDefault }: {
  reciter: Reciter;
  isFav: boolean;
  isDefault: boolean;
  availableCount: number;
  onFav: () => void;
  onDefault: () => void;
}) {
  const initial = reciter.nameArabic.charAt(0);
  return (
    <div className="relative overflow-hidden rounded-3xl card p-6 sm:p-10">
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-ocean-500/10 blur-2xl" />
      <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-right">
        <span className="reciter-photo-ring block h-24 w-24 shrink-0 rounded-3xl sm:h-28 sm:w-28" aria-hidden="true">
          {reciter.image ? (
            <Image src={reciter.image} alt="" width={128} height={128} className="reciter-photo rounded-[1.4rem]" />
          ) : (
            <span className="grid h-full w-full place-items-center rounded-[1.4rem] text-4xl font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#2563eb)", fontFamily: "var(--font-quran)" }}>
              {initial}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-4xl" style={{ fontFamily: "var(--font-quran)" }}>
              {reciter.nameArabic}
            </h1>
            {reciter.verified && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                ✓ مصادر موثّقة
              </span>
            )}
          </div>
          {reciter.nameEnglish && <p className="mt-1 text-sm text-ink-500">{reciter.nameEnglish}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
            <span className="rounded-full bg-cream-100 px-3 py-1 font-semibold text-ink-700">
              {STYLE_LABEL[reciter.style] ?? reciter.style}
            </span>
            {reciter.riwaya && (
              <span className="rounded-full bg-white px-3 py-1 text-ink-600 ring-1 ring-sand-300">{reciter.riwaya}</span>
            )}
          </div>
          {reciter.bio ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-600">{reciter.bio}</p>
          ) : (
            <p className="mt-4 max-w-2xl text-xs text-ink-400">
              لا تتوفر نبذة تعريفية موثّقة لهذا القارئ حالياً.
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap justify-center gap-2.5 sm:justify-start">
        <button
          type="button"
          onClick={onDefault}
          disabled={availableCount === 0}
          className={`rounded-2xl px-6 py-3 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isDefault ? "bg-emerald-600 text-white" : "btn-primary"
          }`}
          title={availableCount === 0 ? "لا تتوفر تسجيلات حالياً" : "اجعله قارئك الافتراضي"}
        >
          {isDefault ? "قارئي الافتراضي ✓" : "اختر قارئي"}
        </button>
        <button
          type="button"
          onClick={onFav}
          aria-pressed={isFav}
          className="rounded-2xl border border-sand-300 bg-white px-5 py-3 text-sm font-bold text-ink-700 transition hover:bg-cream-100"
        >
          {isFav ? "★ في المفضّلة" : "☆ أضف للمفضّلة"}
        </button>
        {availableCount > 0 && (
          <Link
            href={`/memorize`}
            className="rounded-2xl btn-ghost px-6 py-3 text-sm font-bold"
          >
            ابدأ الحفظ
          </Link>
        )}
      </div>

      {availableCount === 0 && (
        <div className="relative mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          لا تتوفّر تسجيلات موثّقة لهذا القارئ حتى الآن. أضفناه إلى السجل، وستُضاف تسجيلاته فور التحقق من مصدرها.
        </div>
      )}
    </div>
  );
}

function AudioPlayer({ reciterId, surahId, onEnded }: { reciterId: string; surahId: number; onEnded?: () => void }) {
  const rec = getRecordings(reciterId).find((r) => r.surahId === surahId && r.availability === "available");
  const url = rec ? recordingUrl(rec) : null;
  if (!url) {
    return <p className="text-xs text-ink-400">التسجيل غير متاح لهذه السورة.</p>;
  }
  return (
    <audio
      controls
      src={url}
      preload="none"
      onEnded={onEnded}
      className="w-full"
      style={{ borderRadius: 12 }}
      aria-label={`تلاوة سورة ${getSurah(surahId)?.nameAr ?? ""}`}
    />
  );
}

export function ReciterDetail({ id }: { id: string }) {
  const reciter = useMemo(() => getReciter(id), [id]);
  const available = useMemo(() => (reciter ? getAvailableSurahs(reciter.id) : []), [reciter]);
  const recordings = useMemo(() => (reciter ? getRecordings(reciter.id) : []), [reciter]);

  const [activeSurah, setActiveSurah] = useState<number | null>(available[0] ?? null);
  const [query, setQuery] = useState("");
  const [isFav, setIsFav] = useState(() => (reciter ? isFavoriteReciter(reciter.id) : false));
  const [isDefault, setIsDefault] = useState(() => (reciter ? getDefaultReciterId() === reciter.id : false));

  useEffect(() => {
    if (reciter) pushRecentReciter(reciter.id);
  }, [reciter]);

  if (!reciter) {
    return (
      <div className="rounded-3xl card p-10 text-center">
        <p className="font-display text-xl font-bold text-ink-900">القارئ غير موجود</p>
        <p className="mt-2 text-ink-500">لم نعثر على هذا القارئ في السجل.</p>
        <Link href="/reciters" className="mt-5 inline-block rounded-2xl btn-primary px-6 py-3 font-semibold">
          العودة لمكتبة القرّاء
        </Link>
      </div>
    );
  }

  const syncLevel = recordings.some((r) => r.sourceType === "everyayah")
    ? "ayah"
    : available.length > 0
      ? "surah"
      : "none";
  const sync = SYNC_META[syncLevel];
  const sourceTypeLabel =
    reciter.verifiedSources.length > 0
      ? reciter.verifiedSources.join(" · ")
      : reciter.defaultSource === "youtube"
        ? "YouTube"
        : "غير محدد";

  const filteredSurahs = available.filter((n) => {
    const meta = getSurah(n);
    if (!meta) return false;
    const q = query.trim();
    if (!q) return true;
    return meta.nameAr.includes(q) || meta.nameLatin.toLowerCase().includes(q.toLowerCase()) || String(n) === q;
  });

  return (
    <div className="space-y-7">
      <Link href="/reciters" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        ← مكتبة القرّاء
      </Link>

      <ReciterHero
        reciter={reciter}
        isFav={isFav}
        isDefault={isDefault}
        availableCount={available.length}
        onFav={() => {
          toggleFavoriteReciter(reciter.id);
          setIsFav((v) => !v);
        }}
        onDefault={() => {
          setDefaultReciter(reciter.id);
          setIsDefault(true);
        }}
      />

      {/* Official YouTube channel + verified sample (outbound only; no rehosting) */}
      {reciter.youtubeChannel && (
        <section className="rounded-3xl card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">القناة الرسمية</h2>
              <p className="mt-1 text-xs text-ink-500">
                تابع أحدث تلاوات {reciter.nameArabic} على يوتيوب.
              </p>
            </div>
            <a
              href={youtubeChannelUrl(reciter.youtubeChannel)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M23 12s0-3.5-.45-5.18a2.78 2.78 0 0 0-1.96-1.97C18.91 4.4 12 4.4 12 4.4s-6.91 0-8.59.45A2.78 2.78 0 0 0 1.45 6.82C1 8.5 1 12 1 12s0 3.5.45 5.18a2.78 2.78 0 0 0 1.96 1.97C5.09 19.6 12 19.6 12 19.6s6.91 0 8.59-.45a2.78 2.78 0 0 0 1.96-1.97C23 15.5 23 12 23 12ZM9.75 15.5v-7l6 3.5-6 3.5Z" />
              </svg>
              زيارة القناة
            </a>
          </div>
          {reciter.youtubeSample && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-ink-500">نموذج تلاوة موثّق</p>
              <YouTubeEmbed
                videoId={reciter.youtubeSample.videoId}
                title={reciter.youtubeSample.title}
              />
              <p className="mt-2 text-center text-[11px] text-ink-400">
                {reciter.youtubeSample.title}
              </p>
            </div>
          )}
          {available.length === 0 && (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-800">
              لا تتوفّر مكتبة تسجيلات كاملة داخل التطبيق بعد؛ استخدم القناة الرسمية للاستماع إلى التلاوات.
            </p>
          )}
        </section>
      )}

      {/* Quality / sync panel */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl card p-5">
          <p className="text-xs text-ink-500">مستوى المزامنة</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: sync.color }} />
            <span className="font-display text-lg font-bold text-ink-900">{sync.label}</span>
          </div>
          <p className="mt-1 text-xs text-ink-500">{sync.desc}</p>
        </div>
        <div className="rounded-3xl card p-5">
          <p className="text-xs text-ink-500">جودة الصوت</p>
          <p className="mt-2 font-display text-lg font-bold text-ink-900">
            {reciter.defaultSource === "everyayah" ? "١٢٨ ك.ب/ث" : "بث مباشر"}
          </p>
          <p className="mt-1 text-xs text-ink-500">MP3 · {sourceTypeLabel}</p>
        </div>
        <div className="rounded-3xl card p-5">
          <p className="text-xs text-ink-500">السور المتاحة</p>
          <p className="mt-2 font-display text-lg font-bold text-ink-900">{available.length.toLocaleString("ar-EG")} / ١١٤</p>
          <p className="mt-1 text-xs text-ink-500">{reciter.verified ? "مصدر موثّق" : "بيانات غير مكتملة"}</p>
        </div>
      </div>

      {/* Player — only when recordings exist */}
      {activeSurah && available.length > 0 && (
        <div id="reciter-player" className="rounded-3xl card-warm p-5 sm:p-6 scroll-mt-24">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-ink-500">تستمع الآن</p>
              <h2 className="font-display text-xl font-bold text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>
                سورة {getSurah(activeSurah)?.nameAr}
              </h2>
            </div>
            <Link
              href={`/mushaf/${activeSurah}`}
              className="rounded-xl btn-ghost px-4 py-2 text-xs font-semibold"
            >
              اقرأ في المصحف
            </Link>
          </div>
          <AudioPlayer reciterId={reciter.id} surahId={activeSurah} />
        </div>
      )}

      {/* Surah list — only for available reciters */}
      {available.length > 0 && (
      <section className="rounded-3xl card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink-900">السور المتاحة</h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث عن سورة…"
            dir="rtl"
            className="w-full max-w-xs rounded-xl border border-sand-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500 sm:w-auto"
          />
        </div>

        {filteredSurahs.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">لا توجد سور مطابقة.</p>
        ) : (
          <div className="grid max-h-[28rem] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSurahs.map((n) => {
              const meta = getSurah(n)!;
              const isActive = activeSurah === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setActiveSurah(n);
                    pushRecentReciter(reciter.id);
                    const el = document.getElementById("reciter-player");
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-right transition ${
                    isActive ? "bg-emerald-50 ring-1 ring-emerald-300" : "hover:bg-cream-100"
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#2563eb)" }}>
                    {n.toLocaleString("ar-EG")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{meta.nameAr}</span>
                    <span className="block truncate text-[10px] text-ink-500">{meta.meaning} · {meta.ayahCount} آية</span>
                  </span>
                  {isActive && <span className="text-emerald-600">▶</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
