// Professional Arabic TTS via server API (Azure Neural), with graceful fallback.
// NOTE: This module is used ONLY for UI narration (names, adhkar, instructions).
// Quran recitation is always served from verified reciter audio sources — never TTS.

let currentAudio: HTMLAudioElement | null = null;
const cache = new Map<string, string>(); // text -> object URL
let apiAvailable: boolean | null = null; // null = unknown, false = use fallback
let lastWarnedAt = 0; // throttle "service unavailable" notices

/** Non-blocking, polite notice shown when no audio service is available. */
function notifyAudioUnavailable() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastWarnedAt < 8000) return; // at most once every 8s
  lastWarnedAt = now;
  // Use a lightweight inline toast so we don't depend on any component/context.
  const id = "__hafiz_tts_notice";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.setAttribute("role", "status");
    el.dir = "rtl";
    el.style.cssText =
      "position:fixed;z-index:9999;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);" +
      "max-width:min(92vw,420px);padding:10px 16px;border-radius:14px;font:600 13px/1.6 system-ui,Segoe UI,Tahoma,sans-serif;" +
      "background:#0f2a2c;color:#e9fbf6;box-shadow:0 8px 30px rgba(0,0,0,.18);opacity:0;transition:opacity .25s ease;";
    document.body.appendChild(el);
  }
  el.textContent =
    "الخدمة الصوتية غير متاحة مؤقتًا. يمكنك المتابعة بالقراءة والاستماع إلى تلاوة القرآن.";
  requestAnimationFrame(() => {
    el && (el.style.opacity = "1");
  });
  window.setTimeout(() => {
    if (el) el.style.opacity = "0";
  }, 4500);
}

/* ===== Browser fallback (only used if the API isn't configured) ===== */
let cachedVoice: SpeechSynthesisVoice | null | undefined;
function pickArabicVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    cachedVoice = null;
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const arabic = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("ar"));
  const preferred = ["Google العربية", "Google Arabic", "Majed", "Maged", "Naayf", "Amira", "Hoda"];
  let chosen: SpeechSynthesisVoice | null = null;
  for (const name of preferred) {
    chosen = arabic.find((v) => v.name.includes(name)) ?? null;
    if (chosen) break;
  }
  if (!chosen) chosen = arabic.find((v) => !v.localService) ?? arabic[0] ?? null;
  cachedVoice = chosen ?? null;
  return cachedVoice;
}

function fallbackSpeak(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-SA";
  const v = pickArabicVoice();
  if (v) u.voice = v;
  u.rate = rate;
  u.pitch = 1;
  synth.speak(u);
}

export function initSpeech() {
  if (typeof window === "undefined") return;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoice = undefined;
      pickArabicVoice();
    };
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

async function fetchTTS(text: string): Promise<string | null> {
  if (cache.has(text)) return cache.get(text)!;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.status === 501) {
      apiAvailable = false; // not configured — use fallback from now on
      return null;
    }
    if (!res.ok) {
      // 502/503 etc.: neural service failed. Use the browser fallback for this
      // call, but keep the server available flag unknown so we retry next time
      // (the failure may be transient).
      return null;
    }
    apiAvailable = true;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    cache.set(text, url);
    return url;
  } catch {
    return null;
  }
}

// Whether the browser itself can synthesize speech.
function browserSynthesisAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Speak Arabic text with the professional voice; fall back to browser TTS.
// If nothing is available, the Quran and memorization experience remains usable;
// we only show a short, non-blocking notice.
export async function speakArabic(text: string, opts?: { rate?: number }) {
  stopSpeaking();
  if (apiAvailable === false) {
    if (browserSynthesisAvailable()) {
      fallbackSpeak(text, opts?.rate);
    } else {
      notifyAudioUnavailable();
    }
    return;
  }
  const url = await fetchTTS(text);
  if (url) {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.play().catch(() => {
      if (browserSynthesisAvailable()) fallbackSpeak(text, opts?.rate);
      else notifyAudioUnavailable();
    });
  } else if (browserSynthesisAvailable()) {
    fallbackSpeak(text, opts?.rate);
  } else {
    notifyAudioUnavailable();
  }
}

// Speak several parts in sequence (e.g. name then explanation).
export async function speakSequence(parts: string[], _rate = 0.85) {
  // Combine into one natural utterance so the neural voice flows smoothly.
  await speakArabic(parts.join("، "), { rate: _rate });
}

export function speechSupported(): boolean {
  if (typeof window === "undefined") return false;
  // Server neural TTS (when configured) or the browser's own speech synthesis.
  return apiAvailable === true || browserSynthesisAvailable();
}

/* ===== Speech recognition (unchanged) ===== */
type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function recognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function createRecognizer(
  onResult: (transcript: string) => void,
  onError: () => void,
  onEnd: () => void
): SR | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "ar-SA";
  rec.continuous = false;
  rec.interimResults = false;
  rec.onresult = (e) => {
    let text = "";
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + " ";
    onResult(text.trim());
  };
  rec.onerror = onError;
  rec.onend = onEnd;
  return rec;
}
