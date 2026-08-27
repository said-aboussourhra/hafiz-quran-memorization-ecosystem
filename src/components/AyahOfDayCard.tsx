"use client";

import { useState } from "react";
import { OrnamentStar } from "@/components/Ornament";
import type { DailyAyah } from "@/lib/ayahOfDay";

export function AyahOfDayCard({ ayah }: { ayah: DailyAyah }) {
  const [busy, setBusy] = useState<null | "share" | "download">(null);
  const [copied, setCopied] = useState(false);

  const shareText = `﴿ ${ayah.text} ﴾\n— سورة ${ayah.surah} (${ayah.ref})\n\nمن منصة حافظ لحفظ القرآن`;

  /* ---------------------------------------------------------------
     Bright luxury 1080×1080 card rendered directly on canvas:
     ivory manuscript, gold + emerald royal frames, arc corners,
     rotating-star medallion, emerald→sapphire accents.
  --------------------------------------------------------------- */
  const buildImage = async (): Promise<Blob | null> => {
    const w = 1080;
    const h = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const quranFont = "'Amiri Quran','Amiri','Scheherazade New',serif";
    const uiFont = "'Reem Kufi','Tajawal','Segoe UI',sans-serif";
    try {
      await Promise.race([
        Promise.all([
          document.fonts?.load("700 64px Amiri"),
          document.fonts?.load("700 40px Reem Kufi"),
        ]).catch(() => undefined),
        new Promise((r) => setTimeout(r, 1400)),
      ]);
    } catch { /* fallback fonts are fine */ }

    ctx.direction = "rtl";

    const goldGrad = ctx.createLinearGradient(0, 0, w, h);
    goldGrad.addColorStop(0, "#f6e3a1");
    goldGrad.addColorStop(0.5, "#c9a44a");
    goldGrad.addColorStop(1, "#8a6a24");

    /* ---- bright ivory background ---- */
    const bg = ctx.createRadialGradient(w / 2, -80, 120, w / 2, h / 2, 920);
    bg.addColorStop(0, "#fffdf5");
    bg.addColorStop(0.55, "#fdf4de");
    bg.addColorStop(1, "#f2e6c6");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // soft gem glows (very light)
    const bloom = (x: number, y: number, r: number, c: string) => {
      const g = ctx.createRadialGradient(x, y, 20, x, y, r);
      g.addColorStop(0, c);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };
    bloom(w * 0.12, h * 0.18, 440, "rgba(16,185,129,0.16)");
    bloom(w * 0.9, h * 0.88, 460, "rgba(37,99,235,0.14)");
    bloom(w * 0.5, h * 0.05, 320, "rgba(201,164,74,0.16)");

    /* faint geometric veil */
    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let x = 0; x <= w; x += 96) {
      for (let y = 0; y <= h; y += 96) {
        drawStar8(ctx, x, y, 20, 9, "#b8860b", 0.6);
      }
    }
    ctx.restore();

    /* ---- frames ---- */
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#0f172a";
    roundRect(ctx, 24, 24, w - 48, h - 48, 44);
    ctx.stroke();

    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 5;
    roundRect(ctx, 44, 44, w - 88, h - 88, 34);
    ctx.stroke();

    ctx.strokeStyle = "rgba(5,150,105,0.75)";
    ctx.lineWidth = 2.5;
    roundRect(ctx, 62, 62, w - 124, h - 124, 26);
    ctx.stroke();

    ctx.strokeStyle = "rgba(201,164,74,0.65)";
    ctx.lineWidth = 1.6;
    roundRect(ctx, 78, 78, w - 156, h - 156, 20);
    ctx.stroke();

    /* glowing arc corners — emerald/gold */
    ctx.font = "400 92px " + uiFont;
    ctx.fillStyle = "#0d9488";
    ctx.textAlign = "left";
    ctx.fillText("╭", 30, 122);
    ctx.textAlign = "right";
    ctx.fillText("╮", w - 30, 122);
    ctx.textAlign = "left";
    ctx.fillText("╰", 30, h - 26);
    ctx.textAlign = "right";
    ctx.fillText("╯", w - 30, h - 26);

    /* rotating-star medallion */
    ctx.save();
    ctx.shadowColor = "rgba(201,164,74,0.7)";
    ctx.shadowBlur = 26;
    drawStar8(ctx, w / 2, 150, 46, 20, goldGrad as unknown as string, 1);
    ctx.restore();
    ctx.fillStyle = "#fffdf5";
    ctx.beginPath();
    ctx.arc(w / 2, 150, 13, 0, Math.PI * 2);
    ctx.fill();

    /* header */
    ctx.textAlign = "center";
    const hdrGrad = ctx.createLinearGradient(w / 2 - 220, 0, w / 2 + 220, 0);
    hdrGrad.addColorStop(0, "#047857");
    hdrGrad.addColorStop(0.55, "#0d9488");
    hdrGrad.addColorStop(1, "#b8860b");
    ctx.fillStyle = hdrGrad;
    ctx.font = "700 46px " + uiFont;
    ctx.fillText("آيــــة اليــــوم", w / 2, 236);

    ornamentLine(ctx, w / 2, 274, 240, goldGrad);

    /* ---- ivory manuscript panel (slightly deeper) ---- */
    const px = 110, py = 316, pw = w - 220, ph = 514;
    const panelGrad = ctx.createLinearGradient(px, py, px, py + ph);
    panelGrad.addColorStop(0, "#ffffff");
    panelGrad.addColorStop(1, "#fbf3dd");
    roundRect(ctx, px, py, pw, ph, 30);
    ctx.fillStyle = panelGrad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = goldGrad;
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(5,150,105,0.5)";
    roundRect(ctx, px + 12, py + 12, pw - 24, ph - 24, 22);
    ctx.stroke();
    for (const [dx, dy] of [[px + 22, py + 22], [px + pw - 22, py + 22], [px + 22, py + ph - 22], [px + pw - 22, py + ph - 22]] as const) {
      drawDiamond(ctx, dx, dy, 7, "#c9a44a");
    }

    /* ayah text */
    ctx.fillStyle = "#0a3a2e";
    ctx.font = "700 56px " + quranFont;
    const wrapped = wrapArabicLines(ctx, "﴿ " + ayah.text + " ﴾", pw - 150);
    const lineH = 92;
    let y = py + 148 - Math.max(0, wrapped.length - 3) * 24;
    for (const line of wrapped) {
      ctx.fillText(line, w / 2, y);
      y += lineH;
    }

    y += 20;
    ornamentLine(ctx, w / 2, y, 200, goldGrad);

    y += 62;
    const refGrad = ctx.createLinearGradient(w / 2 - 180, y, w / 2 + 180, y);
    refGrad.addColorStop(0, "#047857");
    refGrad.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = refGrad;
    ctx.font = "700 40px " + quranFont;
    ctx.fillText(`سورة ${ayah.surah} · آية ${ayah.ref}`, w / 2, y);

    ctx.font = "400 29px " + quranFont;
    ctx.fillStyle = "#476260";
    const tafsirLines = wrapArabicLines(ctx, ayah.tafsir, pw - 190);
    y += 26;
    for (const line of tafsirLines.slice(0, 3)) {
      y += 48;
      ctx.fillText(line, w / 2, y);
    }

    /* footer */
    ornamentLine(ctx, w / 2, h - 148, 260, goldGrad);
    ctx.fillStyle = "#0a5d4b";
    ctx.font = "700 32px " + uiFont;
    ctx.fillText("✦  منصة حافظ · رحلتك مع القرآن الكريم  ✦", w / 2, h - 94);

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
      {/* ===== Bright luxury royal card ===== */}
      <div className="royal-frame aod-card aod-light relative overflow-hidden rounded-[30px] p-7 text-center sm:p-12">
        {/* inner gold + emerald double frames */}
        <span className="rf-line rf-inner" aria-hidden />
        <span className="rf-line rf-inner-2" aria-hidden />

        {/* corner arcs */}
        <span className="royal-corner rc-tl aod-corner" aria-hidden>╭</span>
        <span className="royal-corner rc-tr aod-corner" aria-hidden>╮</span>
        <span className="royal-corner rc-bl aod-corner" aria-hidden>╰</span>
        <span className="royal-corner rc-br aod-corner" aria-hidden>╯</span>

        {/* soft light blooms */}
        <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full breathe" style={{ background: "radial-gradient(circle,rgba(201,164,74,.25),transparent 70%)" }} aria-hidden />
        <span className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full breathe" style={{ background: "radial-gradient(circle,rgba(16,185,129,.2),transparent 70%)", animationDelay: "2.5s" }} aria-hidden />

        {/* floating sparkles */}
        <span className="pointer-events-none absolute right-10 top-24 text-lg text-amber-500/60 animate-floaty" aria-hidden>✦</span>
        <span className="pointer-events-none absolute left-12 top-40 text-sm text-emerald-600/50 animate-floaty" style={{ animationDelay: "1.4s" }} aria-hidden>✧</span>
        <span className="pointer-events-none absolute bottom-32 right-16 text-sm text-blue-600/40 animate-floaty" style={{ animationDelay: "2.2s" }} aria-hidden>✦</span>
        <span className="pointer-events-none absolute bottom-24 left-20 text-base text-amber-500/50 animate-floaty" style={{ animationDelay: ".7s" }} aria-hidden>✧</span>

        <div className="relative">
          {/* rotating star medallion */}
          <div className="relative mx-auto grid h-20 w-20 place-items-center">
            <span className="absolute inset-0 rounded-full breathe" style={{ background: "radial-gradient(circle,rgba(201,164,74,.35),transparent 70%)" }} aria-hidden />
            <span className="aod-medallion grid h-16 w-16 animate-spin-slow place-items-center rounded-full">
              <OrnamentStar className="h-9 w-9 text-[#8a6a24]" />
            </span>
          </div>

          <p className="aod-title mt-4 text-lg font-black tracking-[0.4em] sm:text-xl" style={{ fontFamily: "var(--font-display)" }}>
            آية اليوم
          </p>

          {/* gold ornament divider */}
          <div className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-3" aria-hidden>
            <span className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,rgba(201,164,74,.9))" }} />
            <span className="h-2 w-2 rotate-45" style={{ background: "linear-gradient(135deg,#f6e3a1,#c9a44a)", boxShadow: "0 0 10px rgba(201,164,74,.7)" }} />
            <span className="h-px flex-1" style={{ background: "linear-gradient(90deg,rgba(201,164,74,.9),transparent)" }} />
          </div>

          {/* the ayah */}
          <p className="aod-ayah mx-auto mt-6 max-w-xl text-[1.65rem] leading-[2.15] sm:text-[2.15rem]" style={{ fontFamily: "var(--font-quran)" }}>
            <span className="bracket">﴿</span> {ayah.text} <span className="bracket">﴾</span>
          </p>

          {/* reference */}
          <p className="aod-ref mt-6 text-xl font-black sm:text-2xl" style={{ fontFamily: "var(--font-quran)" }}>
            سورة {ayah.surah} · {ayah.ref}
          </p>

          {/* tafsir — bright jade glass */}
          <div className="aod-tafsir mx-auto mt-6 max-w-lg rounded-2xl border p-4 text-right text-sm leading-[2] sm:text-[15px]">
            <span className="ml-2 inline-block rounded-full px-3 py-0.5 text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#2563eb)" }}>
              التفسير الميسّر
            </span>
            {ayah.tafsir}
          </div>

          {/* branding */}
          <div className="mt-6 flex items-center justify-center gap-3" aria-hidden>
            <span className="h-px w-16" style={{ background: "linear-gradient(90deg,transparent,rgba(201,164,74,.7))" }} />
            <OrnamentStar className="h-4 w-4 text-[#c9a44a]" />
            <span className="text-[11px] font-black tracking-[0.3em] text-emerald-800/80">منصة حافظ</span>
            <OrnamentStar className="h-4 w-4 text-[#c9a44a]" />
            <span className="h-px w-16" style={{ background: "linear-gradient(90deg,rgba(201,164,74,.7),transparent)" }} />
          </div>
        </div>
      </div>

      {/* action buttons */}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          onClick={share}
          disabled={busy !== null}
          className="flex items-center gap-2.5 rounded-full px-8 py-4 text-sm font-black text-white disabled:opacity-60"
          style={{
            background: "linear-gradient(120deg,#10b981 0%,#0d9488 45%,#2563eb 100%)",
            boxShadow: "0 14px 34px -12px rgba(5,150,105,.65), inset 0 1px 0 rgba(255,255,255,.35)",
            transition: "transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s",
          }}
        >
          <span className="text-base">↗</span>
          {copied ? "✓ نُسخ النص" : busy === "share" ? "جارٍ تجهيز الصورة…" : "مشاركة الصورة"}
        </button>
        <button
          onClick={download}
          disabled={busy !== null}
          className="aod-btn-gold flex items-center gap-2.5 rounded-full border-2 px-8 py-4 text-sm font-black disabled:opacity-60"
        >
          <span className="text-base">⬇</span>
          {busy === "download" ? "جارٍ تجهيز الصورة…" : "تنزيل ١٠٨٠×١٠٨٠"}
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

function drawStar8(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rOuter: number, rInner: number,
  fill: string, alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function ornamentLine(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number, _grad: CanvasGradient) {
  const g = ctx.createLinearGradient(cx - half, y, cx + half, y);
  g.addColorStop(0, "rgba(201,164,74,0)");
  g.addColorStop(0.5, "#c9a44a");
  g.addColorStop(1, "rgba(201,164,74,0)");
  ctx.strokeStyle = g;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - half, y);
  ctx.lineTo(cx + half, y);
  ctx.stroke();
  drawDiamond(ctx, cx, y, 7, "#c9a44a");
  drawDiamond(ctx, cx - half * 0.55, y, 4, "#c9a44a");
  drawDiamond(ctx, cx + half * 0.55, y, 4, "#c9a44a");
}

function wrapArabicLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
