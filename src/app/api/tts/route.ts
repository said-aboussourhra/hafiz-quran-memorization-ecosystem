import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VOICE = process.env.AZURE_SPEECH_VOICE || "ar-SA-HamedNeural";
const REGION = process.env.AZURE_SPEECH_REGION || "";
const KEY = process.env.AZURE_SPEECH_KEY || "";

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildSSML(text: string): string {
  const escaped = xmlEscape(text)
    .replace(/([.؟!])\s*/g, '$1<break time="450ms"/> ')
    .replace(/([،؛:])\s*/g, '$1<break time="250ms"/> ')
    .replace(/\n+/g, '<break time="600ms"/> ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="ar-SA">
  <voice name="${VOICE}"><mstts:express-as style="calm" styledegree="1"><prosody rate="-8%" pitch="+2%">${escaped}</prosody></mstts:express-as></voice>
</speak>`;
}

async function azureTTS(text: string): Promise<ArrayBuffer | null> {
  if (!KEY || !REGION) return null;
  try {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        "User-Agent": "hafiz-quran",
      },
      body: buildSSML(text),
    });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// Split Arabic text into <=200-char chunks at sentence/word boundaries.
function chunkText(text: string, max = 190): string[] {
  const sentences = text.split(/(?<=[.؟!،؛\n])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).trim().length <= max) {
      cur = (cur + " " + s).trim();
    } else {
      if (cur) chunks.push(cur);
      if (s.length <= max) {
        cur = s;
      } else {
        // hard-split very long single sentences by words
        let line = "";
        for (const w of s.split(/\s+/)) {
          if ((line + " " + w).trim().length <= max) line = (line + " " + w).trim();
          else { if (line) chunks.push(line); line = w; }
        }
        cur = line;
      }
    }
  }
  if (cur) chunks.push(cur);
  return chunks.filter(Boolean);
}

// High-quality neural fallback (no API key required).
async function neuralFallbackTTS(text: string): Promise<ArrayBuffer | null> {
  try {
    const chunks = chunkText(text);
    const buffers: Uint8Array[] = [];
    for (const c of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(c)}&tl=ar&client=tw-ob&ttsspeed=0.85`;
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", Referer: "https://translate.google.com/" } });
      if (!res.ok) continue;
      buffers.push(new Uint8Array(await res.arrayBuffer()));
    }
    if (buffers.length === 0) return null;
    const total = buffers.reduce((n, b) => n + b.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const b of buffers) { out.set(b, off); off += b.length; }
    return out.buffer;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body.text ?? "").slice(0, 4000).trim();
    if (!text) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

    // 1) Azure Neural (best quality) if configured
    let audio = await azureTTS(text);
    // 2) High-quality neural fallback (no key needed)
    if (!audio) audio = await neuralFallbackTTS(text);

    if (!audio) return NextResponse.json({ ok: false, error: "tts_failed" }, { status: 502 });

    return new NextResponse(audio, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
