"use client";

import { useRef, useState } from "react";

export function Certificate({
  name,
  surahName,
  ayahCount,
  accuracy,
}: {
  name: string;
  surahName: string;
  ayahCount: number;
  accuracy: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const today = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

  const download = async () => {
    setBusy(true);
    try {
      const node = ref.current;
      if (!node) return;
      // Render the certificate DOM to an SVG->canvas image (no external libs).
      const w = 1000, h = 700;
      const data = certificateSVG({ name, surahName, ayahCount, accuracy, today, w, h });
      const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `شهادة-حفظ-${surahName}.png`;
        a.click();
      }, "image/png");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div ref={ref} className="cert-frame relative mx-auto max-w-2xl overflow-hidden rounded-3xl p-8 text-center sm:p-10">
        <div className="cert-corner right-4 top-4" />
        <div className="cert-corner left-4 top-4" />
        <div className="cert-corner right-4 bottom-4" />
        <div className="cert-corner left-4 bottom-4" />
        <p className="text-2xl text-emerald-700" style={{ fontFamily: "var(--font-quran)" }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
        <div className="basmala-ornament mx-auto mt-4 max-w-[200px]" />
        <p className="mt-6 text-xs tracking-[0.3em] text-gold-600">شهادة تقدير · إتمام حفظ</p>
        <h2 className="mt-3 font-display text-3xl font-black" style={{ background: "linear-gradient(120deg,#047857,#059669,#2563eb)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          تهانينا
        </h2>
        <p className="mt-5 text-lg text-ink-700">نشهد أن الأخ/الأخت</p>
        <p className="mt-2 text-3xl font-black text-ink-900">{name}</p>
        <p className="mt-4 text-lg leading-loose text-ink-700">
          قد أتمّ بفضل الله حفظ <span className="font-bold text-emerald-700" style={{ fontFamily: "var(--font-quran)" }}>سورة {surahName}</span>
          <br />
          ({ayahCount.toLocaleString("ar-EG")} آية) بنسبة إتقان <span className="font-bold text-emerald-700">{Math.round(accuracy)}٪</span>
        </p>
        <p className="mx-auto mt-5 max-w-md text-sm leading-loose text-ink-500" style={{ fontFamily: "var(--font-quran)" }}>
          «خيركم من تعلّم القرآن وعلّمه»
        </p>
        <div className="mt-6 flex items-center justify-between px-4 text-xs text-ink-500">
          <span>{today}</span>
          <span className="flex items-center gap-1.5">
            <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-black text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>ح</span>
            منصة حافظ
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={download} disabled={busy} className="rounded-2xl btn-primary px-7 py-3 font-semibold disabled:opacity-60">
          {busy ? "جارٍ التحضير…" : "⬇ تنزيل الشهادة"}
        </button>
      </div>
    </div>
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function certificateSVG(o: { name: string; surahName: string; ayahCount: number; accuracy: number; today: string; w: number; h: number }): string {
  const { name, surahName, ayahCount, accuracy, today, w, h } = o;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdfaf1"/><stop offset="100%" stop-color="#f3ecd9"/>
    </linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#047857"/><stop offset="50%" stop-color="#059669"/><stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="url(#g)" stroke-width="4" rx="20"/>
  <rect x="40" y="40" width="${w - 80}" height="${h - 80}" fill="none" stroke="#b8902f" stroke-width="1.5" rx="14"/>
  <text x="${w / 2}" y="120" text-anchor="middle" font-family="Amiri, serif" font-size="40" fill="#047857">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</text>
  <text x="${w / 2}" y="185" text-anchor="middle" font-family="serif" font-size="20" letter-spacing="6" fill="#b8902f">شهادة تقدير · إتمام حفظ</text>
  <text x="${w / 2}" y="255" text-anchor="middle" font-family="serif" font-size="54" font-weight="bold" fill="#059669">تهانينا</text>
  <text x="${w / 2}" y="315" text-anchor="middle" font-family="serif" font-size="26" fill="#1e3d40">نشهد أن الأخ/الأخت</text>
  <text x="${w / 2}" y="375" text-anchor="middle" font-family="serif" font-size="46" font-weight="bold" fill="#071a1c">${esc(name)}</text>
  <text x="${w / 2}" y="435" text-anchor="middle" font-family="serif" font-size="26" fill="#1e3d40">قد أتمّ بفضل الله حفظ سورة ${esc(surahName)}</text>
  <text x="${w / 2}" y="478" text-anchor="middle" font-family="serif" font-size="24" fill="#1e3d40">(${ayahCount} آية) بنسبة إتقان ${Math.round(accuracy)}٪</text>
  <text x="${w / 2}" y="545" text-anchor="middle" font-family="Amiri, serif" font-size="28" fill="#059669">«خيركم من تعلّم القرآن وعلّمه»</text>
  <text x="80" y="${h - 70}" font-family="serif" font-size="20" fill="#4a6664">${esc(today)}</text>
  <text x="${w - 80}" y="${h - 70}" text-anchor="end" font-family="serif" font-size="22" font-weight="bold" fill="#047857">منصة حافظ</text>
</svg>`;
}
