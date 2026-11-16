/**
 * ============================================================================
 * HAFIZ — Share an ayah as a beautiful image (بطاقة مشاركة الآية)
 * ----------------------------------------------------------------------------
 * Renders the ayah on an ornamental 1080×1350 canvas card (deep emerald +
 * gold frame, Amiri type) and downloads it as PNG — or opens the native
 * share sheet when the device supports sharing files.
 * ============================================================================
 */

export type ShareAyahInput = {
  text: string;
  surahNameAr: string;
  ayahNumber: number;
  fontFamily?: string;
};

const W = 1080;
const H = 1350;

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  stroke: string,
): void {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const pts = 8;
  for (let i = 0; i < pts * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.62;
    const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + rad * Math.cos(a);
    const y = cy + rad * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export async function shareAyahImage(input: ShareAyahInput): Promise<"shared" | "downloaded"> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // Make sure the Quran font is ready so the card uses real Amiri glyphs.
  try {
    await document.fonts.ready;
  } catch {
    /* best effort */
  }

  // ---- background: deep emerald gradient + soft radial glows ----
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b3d33");
  bg.addColorStop(0.55, "#082a22");
  bg.addColorStop(1, "#051d17");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H * 0.18, 40, W / 2, H * 0.18, 620);
  glow.addColorStop(0, "rgba(52,211,153,0.28)");
  glow.addColorStop(1, "rgba(52,211,153,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W / 2, H * 0.95, 40, W / 2, H * 0.95, 560);
  glow2.addColorStop(0, "rgba(201,164,74,0.20)");
  glow2.addColorStop(1, "rgba(201,164,74,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // ---- faint geometric dot lattice ----
  ctx.fillStyle = "rgba(246,227,161,0.05)";
  for (let y = 60; y < H; y += 56) {
    for (let x = 60; x < W; x += 56) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- gold double frame ----
  ctx.strokeStyle = "rgba(214,178,96,0.85)";
  ctx.lineWidth = 4;
  roundRect(ctx, 44, 44, W - 88, H - 88, 36);
  ctx.stroke();
  ctx.strokeStyle = "rgba(214,178,96,0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, 62, 62, W - 124, H - 124, 28);
  ctx.stroke();

  ctx.direction = "rtl";
  ctx.textAlign = "center";

  // ---- header medallion ----
  drawStar(ctx, W / 2, 168, 46, "rgba(246,227,161,0.9)");
  ctx.fillStyle = "#f6e3a1";
  ctx.font = "700 40px 'Reem Kufi', 'Amiri', serif";
  ctx.fillText(`سورة ${input.surahNameAr}`, W / 2, 268);

  // ---- divider ----
  const divY = 312;
  const grad = ctx.createLinearGradient(180, 0, W - 180, 0);
  grad.addColorStop(0, "rgba(214,178,96,0)");
  grad.addColorStop(0.5, "rgba(214,178,96,0.9)");
  grad.addColorStop(1, "rgba(214,178,96,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(180, divY, W - 360, 2);

  // ---- ayah text (auto-sized to fit) ----
  const fontFamily = input.fontFamily ?? "'Amiri Quran', 'Amiri', serif";
  const maxWidth = W - 220;
  let fontSize = 72;
  let lines: string[] = [];
  const maxBlockH = 640;
  for (; fontSize >= 34; fontSize -= 4) {
    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    lines = wrapLines(ctx, input.text, maxWidth);
    if (lines.length * fontSize * 1.9 <= maxBlockH) break;
  }
  const lineH = fontSize * 1.9;
  const blockH = lines.length * lineH;
  const startY = divY + 90 + (maxBlockH - blockH) / 2 + fontSize * 0.8;
  ctx.fillStyle = "#fdf8e7";
  ctx.font = `400 ${fontSize}px ${fontFamily}`;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 6;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineH);
  });
  ctx.shadowBlur = 0;

  // ---- reference + brand ----
  const refY = H - 210;
  ctx.fillStyle = "#f6e3a1";
  ctx.font = "700 44px 'Amiri', serif";
  ctx.fillText(`﴿ ${input.surahNameAr} — آية ${input.ayahNumber} ﴾`, W / 2, refY);
  ctx.fillStyle = "rgba(253,248,231,0.75)";
  ctx.font = "500 34px 'Tajawal', sans-serif";
  ctx.fillText("حافظ — رحلتك مع القرآن الكريم", W / 2, refY + 62);

  // ---- export ----
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Image export failed");

  const file = new File([blob], `hafiz-${input.surahNameAr}-${input.ayahNumber}.png`, {
    type: "image/png",
  });
  const nav = navigator as Navigator & { share?: (d: { files: File[]; title?: string }) => Promise<void> };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: `سورة ${input.surahNameAr} — آية ${input.ayahNumber}` });
      return "shared";
    } catch {
      /* user cancelled — fall through to download */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
