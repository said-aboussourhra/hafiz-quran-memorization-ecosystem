// Professional Arabic TTS via server API (Azure Neural), with graceful fallback.

let currentAudio: HTMLAudioElement | null = null;
const cache = new Map<string, string>(); // text -> object URL
let apiAvailable: boolean | null = null; // null = unknown, false = use fallback

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
    if (!res.ok) return null;
    apiAvailable = true;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    cache.set(text, url);
    return url;
  } catch {
    return null;
  }
}

// Speak Arabic text with the professional voice; fall back to browser TTS.
export async function speakArabic(text: string, opts?: { rate?: number }) {
  stopSpeaking();
  if (apiAvailable === false) {
    fallbackSpeak(text, opts?.rate);
    return;
  }
  const url = await fetchTTS(text);
  if (url) {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.play().catch(() => fallbackSpeak(text, opts?.rate));
  } else {
    fallbackSpeak(text, opts?.rate);
  }
}

// Speak several parts in sequence (e.g. name then explanation).
export async function speakSequence(parts: string[], _rate = 0.85) {
  // Combine into one natural utterance so the neural voice flows smoothly.
  await speakArabic(parts.join("، "), { rate: _rate });
}

export function speechSupported(): boolean {
  // Always true — the API works everywhere, and browser fallback covers the rest.
  return true;
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
