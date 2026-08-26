"use client";

import { useState } from "react";
import { ArabesqueBg, OrnamentDivider, RoyalFrame } from "@/components/Ornament";
import type { DailyAyah } from "@/lib/ayahOfDay";

export function AyahOfDayCard({ ayah }: { ayah: DailyAyah }) {
  const [busy, setBusy] = useState<null | "share" | "download">(null);
  const [copied, setCopied] = useState(false);

  const shareText = `﴿ ${ayah.text} ﴾\n— سورة ${ayah.surah} (${ayah.ref})\n\nمن منصة حافظ لحفظ القرآن`;

  /* ---------------------------------------------------------------
     High-fidelity 1080×1080 luxury card rendered directly on canvas
     (Arabic text, gold/emerald royal framing, multi-line wrapping).
  --------------------------------------------------------------- */
  const buildImage = async (): Promise<Blob | null> => {
    const w = 1080;
    const h = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Best-effort: let the browser fetch the real Quran face before painting.
    const quranFont = "'Amiri Quran','Amiri','Scheherazade New',serif";
    const uiFont = "'Reem Kufi','Tajawal','Segoe UI',sans-serif";
    try {
      await Promise.race([
        Promise.all([
          document.fonts?.load("700 64px Amiri"),
          document.fonts?.load("700 40px Reem Kufi"),
        ]).catch(() => undefined),
        new Promise((r) => setTimeout(r, 1200)),
      ]);
    } catch { /* fallback fonts are fine */ }

    /* ---- background: deep royal emerald → sapphire radial ---- */
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#052e22");
    bg.addColorStop(0.45, "#064e3b");
    bg.addColorStop(1, "#0b3b66");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // soft light blooms
    const bloom1 = ctx.createRadialGradient(w * 0.2, h * 0.1, 40, w * 0.2, h * 0.1, 520);
    bloom1.addColorStop(0, "rgba(16,185,129,0.30)");
    bloom1.addColorStop(1, "rgba(16,185,129,0)");
    ctx.fillStyle = bloom1;
    ctx.fillRect(0, 0, w, h);
    const bloom2 = ctx.createRadialGradient(w * 0.85, h * 0.9, 40, w * 0.85, h * 0.9, 520);
    bloom2.addColorStop(0, "rgba(37,99,235,0.28)");
    bloom2.addColorStop(1, "rgba(37,99,235,0)");
    ctx.fillStyle = bloom2;
    ctx.fillRect(0, 0, w, h);

    /* ---- geometric star pattern veil ---- */
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#e9c76b";
    ctx.lineWidth = 1.5;
    for (let x = -80; x < w + 80; x += 90) {
      for (let y = -80; y < h + 80; y += 90) {
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.moveTo(x - 26, y); ctx.lineTo(x + 26, y);
        ctx.moveTo(x, y - 26); ctx.lineTo(x, y + 26);
        ctx.stroke();
      }
    }
    ctx.restore();

    /* ---- central manuscript panel (ivory) ---- */
    const px = 70, py = 120, pw = w - 140, ph = h - 240;
    const panelGrad = ctx.createLinearGradient(px, py, px, py + ph);
    panelGrad.addColorStop(0, "#fffdf5");
    panelGrad.addColorStop(1, "#f6eed8");
    roundRect(ctx, px, py, pw, ph, 34);
    ctx.fillStyle = panelGrad;
    ctx.fill();

    /* ---- frames: outer solid ink ---- */
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#0f172a";
    roundRect(ctx, 26, 26, w - 52, h - 52, 40);
    ctx.stroke();

    /* gold ornamental frame */
    const gold = ctx.createLinearGradient(0, 0, w, h);
    gold.addColorStop(0, "#f3dd9b");
    gold.addColorStop(0.5, "#c9a44a");
    gold.addColorStop(1, "#8a6a24");
    ctx.strokeStyle = gold;
    ctx.lineWidth = 4;
    roundRect(ctx, 52, 52, w - 104, h - 104, 30);
    ctx.stroke();

    /* emerald inner frame */
    ctx.strokeStyle = "rgba(5,150,105,0.85)";
    ctx.lineWidth = 2.5;
    roundRect(ctx, 66, 66, w - 132, h - 132, 22);
    ctx.stroke();
    ctx.strokeStyle = "rgba(201,164,74,0.7)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 80, 80, w - 160, h - 160, 16);
    ctx.stroke();

    /* ---- arc corners ╭ ╮ ╰ ╯ ---- */
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 88px " + uiFont;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("╭", 30, 116);
    ctx.textAlign = "right";
    ctx.fillText("╮", w - 30, 116);
    ctx.textAlign = "left";
    ctx.fillText("╰", 30, h - 28);
    ctx.textAlign = "right";
    ctx.fillText("╯", w - 30, h - 28);

    /* ---- header medallion ---- */
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    const medGrad = ctx.createLinearGradient(w / 2 - 130, 150, w / 2 + 130, 150);
    medGrad.addColorStop(0, "#059669");
    medGrad.addColorStop(1, "#2563eb");
    roundRect(ctx, w / 2 - 150, 140, 300, 66, 33);
    ctx.fillStyle = medGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(201,164,74,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fffbe8";
    ctx.font = "700 34px " + uiFont;
    ctx.fillText("آية اليوم", w / 2, 184);

    /* ---- ayah text (wrapped, Uthmani) ---- */
    ctx.fillStyle = "#122a2c";
    ctx.font = "700 58px " + quranFont;
    const wrapped = wrapArabicLines(ctx, "﴿ " + ayah.text + " ﴾", pw - 170);
    const lineH = 92;
    let y = 360 - (Math.max(0, wrapped.length - 3) * 26);
    for (const line of wrapped) {
      ctx.fillText(line, w / 2, y);
      y += lineH;
    }

    /* ---- divider with medallion ---- */
    y += 18;
    const divGrad = ctx.createLinearGradient(w / 2 - 220, y, w / 2 + 220, y);
    divGrad.addColorStop(0, "rgba(5,150,105,0)");
    divGrad.addColorStop(0.5, "rgba(201,164,74,0.95)");
    divGrad.addColorStop(1, "rgba(37,99,235,0)");
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 220, y);
    ctx.lineTo(w / 2 + 220, y);
    ctx.stroke();
    ctx.fillStyle = "#c9a44a";
    ctx.beginPath();
    ctx.arc(w / 2, y, 7, 0, Math.PI * 2);
    ctx.fill();

    /* ---- reference ---- */
    y += 66;
    ctx.fillStyle = "#047857";
    ctx.font = "700 40px " + quranFont;
    ctx.fillText(`سورة ${ayah.surah} · آية ${ayah.ref}`, w / 2, y);

    /* ---- tafsir ---- */
    y += 40;
    ctx.fillStyle = "#4a6664";
    ctx.font = "400 30px " + quranFont;
    const tafsirLines = wrapArabicLines(ctx, ayah.tafsir, pw - 200);
    for (const line of tafsirLines.slice(0, 4)) {
      y += 50;
      ctx.fillText(line, w / 2, y);
    }

    /* ---- footer branding ---- */
    ctx.fillStyle = "rgba(255,251,232,0.95)";
    ctx.font = "700 30px " + uiFont;
    ctx.fillText("منصة حافظ · رحلتك مع القرآن الكريم", w / 2, h - 96);

    return await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/png")
    );
  };

  const download = async () => {
    setBusy("download");
    try {
      const blob = await buildImage();
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `اية-اليوم-${ayah.surah}-1080.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } finally { setBusy(null); }
  };

  const share = async () => {
    setBusy("share");
    try {
      const blob = await buildImage();
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (blob && nav.share && nav.canShare) {
        const file = new File([blob], `ayah-${ayah.surah}.png`, { type: "image/png" });
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], text: shareText, title: "آية اليوم" });
          return;
        }
      }
      if (nav.share) {
        try { await nav.share({ text: shareText, title: "آية اليوم" }); return; }
        catch { /* user cancelled or unsupported → copy */ }
      }
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
    finally { setBusy(null); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Royal shareable visual card */}
      <div
        className="royal-frame relative overflow-hidden rounded-[26px] p-8 text-center sm:p-12"
        style={{
          background:
            "linear-gradient(150deg,#052e22 0%,#064e3b 46%,#0b3b66 100%)",
          color: "#fffbe8",
        }}
      >
        <RoyalFrame>
          <ArabesqueBg />
          {/* glowing medallion label */}
          <span
            className="relative mx-auto inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-bold tracking-[0.3em]"
            style={{
              background: "linear-gradient(135deg,#10b981,#2563eb)",
              boxShadow: "0 8px 24px -8px rgba(16,185,129,.7), inset 0 1px 0 rgba(255,255,255,.35)",
            }}
          >
            ✦ آية اليوم ✦
          </span>
          <OrnamentDivider />
          <p
            className="relative mt-2 text-3xl leading-[2] sm:text-4xl"
            style={{ fontFamily: "var(--font-quran)", color: "#fffdf5", textShadow: "0 2px 24px rgba(16,185,129,.45)" }}
          >
            ﴿ {ayah.text} ﴾
          </p>
          <p className="relative mt-5 font-display text-lg font-bold" style={{ color: "#f3dd9b" }}>
            سورة {ayah.surah} · {ayah.ref}
          </p>
          <div
            className="mx-auto my-5 h-px max-w-xs"
            style={{ background: "linear-gradient(90deg,transparent,rgba(201,164,74,.9),rgba(37,99,235,.9),transparent)" }}
          />
          <p className="relative mx-auto max-w-lg text-sm leading-relaxed" style={{ color: "rgba(240,253,244,.85)" }}>
            {ayah.tafsir}
          </p>
        </RoyalFrame>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={share} disabled={busy !== null} className="rounded-2xl btn-primary px-7 py-3.5 font-bold disabled:opacity-60">
          {copied ? "✓ نُسخ النص" : busy === "share" ? "جارٍ التجهيز…" : "↗ مشاركة الصورة"}
        </button>
        <button onClick={download} disabled={busy !== null} className="rounded-2xl btn-ghost px-7 py-3.5 font-bold disabled:opacity-60">
          {busy === "download" ? "جارٍ التجهيز…" : "⬇ تنزيل ١٠٨٠×١٠٨٠"}
        </button>
      </div>
    </div>
  );
}

/* ---------- canvas helpers ---------- */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Arabic-aware greedy wrapping using the canvas measure API. */
function wrapArabicLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // Direction RTL so measurement of Arabic runs is honest.
  const prev = ctx.direction;
  ctx.direction = "rtl";
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  ctx.direction = prev;
  return lines;
}
