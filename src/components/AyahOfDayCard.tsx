"use client";

import { useState } from "react";
import { ArabesqueBg, OrnamentCorners, OrnamentDivider } from "@/components/Ornament";
import type { DailyAyah } from "@/lib/ayahOfDay";

export function AyahOfDayCard({ ayah }: { ayah: DailyAyah }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `﴿ ${ayah.text} ﴾\n— سورة ${ayah.surah} (${ayah.ref})\n\nمن منصة حافظ لحفظ القرآن`;

  const buildImage = async (): Promise<Blob | null> => {
    const w = 1080, h = 1080;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f2fbf7"/><stop offset="55%" stop-color="#eaf4fb"/><stop offset="100%" stop-color="#e6eefb"/>
        </linearGradient>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#10b981"/><stop offset="50%" stop-color="#059669"/><stop offset="100%" stop-color="#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg)"/>
      <rect x="48" y="48" width="${w - 96}" height="${h - 96}" fill="none" stroke="url(#g)" stroke-width="5" rx="34"/>
      <rect x="70" y="70" width="${w - 140}" height="${h - 140}" fill="none" stroke="#b8902f" stroke-width="1.5" rx="24"/>
      ${wrapText("﴿ " + ayah.text + " ﴾", w / 2, 430, 40, w - 240, "Amiri, serif", "#122a2c", 68)}
      <text x="${w / 2}" y="740" text-anchor="middle" font-family="serif" font-size="34" font-weight="bold" fill="#059669">سورة ${esc(ayah.surah)} · ${esc(ayah.ref)}</text>
      ${wrapText(ayah.tafsir, w / 2, 820, 30, w - 260, "serif", "#4a6664", 44)}
      <text x="${w / 2}" y="${h - 90}" text-anchor="middle" font-family="serif" font-size="30" font-weight="bold" fill="#047857">آية اليوم · منصة حافظ</text>
    </svg>`;
    try {
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      return await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
    } catch {
      return null;
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const blob = await buildImage();
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `اية-اليوم-${ayah.surah}.png`;
      a.click();
    } finally { setBusy(false); }
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await buildImage();
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (blob && nav.share && nav.canShare) {
        const file = new File([blob], "ayah.png", { type: "image/png" });
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], text: shareText, title: "آية اليوم" });
          return;
        }
      }
      if (nav.share) { await nav.share({ text: shareText, title: "آية اليوم" }); return; }
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Visual card */}
      <div className="ornate-card relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-12" style={{ background: "linear-gradient(145deg,#f2fbf7,#e6eefb)", outline: "3px solid rgba(16,185,129,0.4)", outlineOffset: "-3px" }}>
        <ArabesqueBg />
        <OrnamentCorners />
        <span className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-gold-500/40" />
        <p className="relative text-xs tracking-[0.3em] text-gold-600">آية اليوم</p>
        <OrnamentDivider />
        <p className="relative mt-2 text-3xl leading-[2] text-ink-900 sm:text-4xl" style={{ fontFamily: "var(--font-quran)" }}>
          ﴿ {ayah.text} ﴾
        </p>
        <p className="relative mt-5 font-display text-lg font-bold text-emerald-700">سورة {ayah.surah} · {ayah.ref}</p>
        <div className="mx-auto my-5 h-px max-w-xs" style={{ background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.5),rgba(37,99,235,0.5),transparent)" }} />
        <p className="relative mx-auto max-w-lg text-sm leading-relaxed text-ink-500">{ayah.tafsir}</p>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button onClick={share} disabled={busy} className="rounded-2xl btn-primary px-6 py-3 font-semibold disabled:opacity-60">
          {copied ? "✓ نُسخت" : busy ? "…" : "↗ مشاركة"}
        </button>
        <button onClick={download} disabled={busy} className="rounded-2xl btn-ghost px-6 py-3 font-semibold disabled:opacity-60">⬇ تنزيل صورة</button>
      </div>
    </div>
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// naive Arabic-aware word wrap into <text> tspans
function wrapText(text: string, cx: number, y: number, lineH: number, maxWidth: number, font: string, color: string, size: number): string {
  const words = text.split(" ");
  const perLine = Math.max(3, Math.floor(maxWidth / (size * 0.62)));
  const lines: string[] = [];
  let line: string[] = [];
  for (const w of words) {
    line.push(w);
    if (line.join(" ").length >= perLine) { lines.push(line.join(" ")); line = []; }
  }
  if (line.length) lines.push(line.join(" "));
  const tspans = lines.map((l, i) => `<tspan x="${cx}" dy="${i === 0 ? 0 : lineH}">${esc(l)}</tspan>`).join("");
  return `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${font}" font-size="${size}" fill="${color}">${tspans}</text>`;
}
