"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SurahContent, QuranAyah } from "@/lib/quran";
import { diffAyah, normalizeWord, type DiffResult } from "@/lib/arabicText";
import { ENCOURAGEMENTS } from "@/lib/virtues";
import { DEFAULT_RECITER, ayahUrl, perAyahFallback, hasPerAyah } from "@/lib/reciters";
import { createRecognizer, recognitionSupported } from "@/lib/speak";
import { Certificate } from "@/components/Certificate";

type Phase = "setup" | "method" | "done";
type Method = "listen" | "repeat" | "voice" | "liverecite" | "hide" | "dictation" | "write" | "arrange" | "complete";

const METHODS: { id: Method; label: string; icon: string; desc: string; scored: boolean }[] = [
  { id: "listen", label: "استماع", icon: "🔊", desc: "استمع للمقطع بصوت الشيخ", scored: false },
  { id: "repeat", label: "تكرار", icon: "🔁", desc: "كرّر معي كل آية حتى ترسخ", scored: false },
  { id: "voice", label: "اقرأ بصوتك", icon: "🎙️", desc: "اقرأ الآية بصوتك فنقارنها بنطق الشيخ ونصحّح لك", scored: true },
  { id: "liverecite", label: "تلاوة حيّة", icon: "📿", desc: "انطق الآية فتُكتب أمامك، وننبّهك عند الخطأ", scored: true },
  { id: "dictation", label: "استمع وصحّح", icon: "🎧", desc: "استمع للآية ثم اكتبها ويُصحّح لك", scored: true },
  { id: "hide", label: "إخفاء", icon: "🙈", desc: "استرجع الآية من حفظك ثم اكشفها", scored: true },
  { id: "write", label: "كتابة", icon: "✍️", desc: "اكتب الآية مع تصحيح كلمة بكلمة", scored: true },
  { id: "arrange", label: "ترتيب", icon: "🧩", desc: "رتّب كلمات الآية بالشكل الصحيح", scored: true },
  { id: "complete", label: "إكمال", icon: "⬚", desc: "اختر الكلمة الصحيحة من الخيارات", scored: true },
];

type Opt = { t: string; correct: boolean; key: string };

const REQUIRED_REPS = 3;
const PASS = 0.8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Word = { t: string; i: number };

export function MemorizeFlow({ surah, isLoggedIn, userName }: { surah: SurahContent; isLoggedIn: boolean; userName?: string | null }) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const surahNum = surah.meta.number;
  const totalAyahs = surah.ayahs.length;

  const [chunk, setChunk] = useState(Math.min(5, totalAyahs));
  const [startIdx, setStartIdx] = useState(0);
  const sessionAyahs = useMemo(() => surah.ayahs.slice(startIdx, startIdx + chunk), [surah.ayahs, startIdx, chunk]);

  const [phase, setPhase] = useState<Phase>("setup");
  const [method, setMethod] = useState<Method | null>(null);
  const [done, setDone] = useState<Set<Method>>(new Set());
  const [scores, setScores] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // per-ayah cursor inside a method
  const [idx, setIdx] = useState(0);
  // repeat
  const [reps, setReps] = useState(0);
  // hide
  const [revealed, setRevealed] = useState(false);
  const [hintWords, setHintWords] = useState(0);
  // write
  const [written, setWritten] = useState("");
  const [writeDiff, setWriteDiff] = useState<DiffResult | null>(null);
  // voice (speech recognition)
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [voiceDiff, setVoiceDiff] = useState<DiffResult | null>(null);
  const recRef = useRef<ReturnType<typeof createRecognizer>>(null);
  // live recite (transcribe into mushaf + warn on error)
  const [liveWords, setLiveWords] = useState<{ t: string; ok: boolean }[]>([]);
  const [liveWarn, setLiveWarn] = useState(false);
  const [liveDone, setLiveDone] = useState(false);
  const name = userName || "أخي الكريم";
  // arrange
  const [pool, setPool] = useState<Word[]>([]);
  const [built, setBuilt] = useState<Word[]>([]);
  const [arrangeChecked, setArrangeChecked] = useState<null | { ok: boolean; accuracy: number; firstWrong: number }>(null);
  // complete (multiple-choice)
  const [blankIdx, setBlankIdx] = useState<number[]>([]);
  const [blankCursor, setBlankCursor] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState<(Opt | null)[]>([]);
  const [optionsBySlot, setOptionsBySlot] = useState<Opt[][]>([]);
  const [blanksChecked, setBlanksChecked] = useState<null | { accuracy: number }>(null);

  const cur = sessionAyahs[idx];

  // pool of unique surah words used to generate wrong (distractor) options
  const surahWordPool = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const ay of surah.ayahs) {
      for (const w of ay.words) {
        const n = normalizeWord(w.t);
        if (n.length >= 2 && !seen.has(n)) { seen.add(n); out.push(w.t); }
      }
    }
    return out;
  }, [surah.ayahs]);

  const buildOptions = (correctText: string): Opt[] => {
    const correctNorm = normalizeWord(correctText);
    const distractors = shuffle(surahWordPool.filter((t) => normalizeWord(t) !== correctNorm)).slice(0, 3);
    const opts: Opt[] = [
      { t: correctText, correct: true, key: "c" },
      ...distractors.map((t, i) => ({ t, correct: false, key: `d${i}` })),
    ];
    return shuffle(opts);
  };

  const play = (a: QuranAyah | undefined) => {
    if (!a || !audioRef.current) return;
    const r = hasPerAyah(DEFAULT_RECITER) ? DEFAULT_RECITER : perAyahFallback();
    const url = ayahUrl(r, surahNum, a.numberInSurah, a.globalNumber);
    if (!url) return;
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const resetMethodState = (m: Method, a: QuranAyah | undefined) => {
    setReps(0);
    setRevealed(false);
    setHintWords(0);
    setWritten("");
    setWriteDiff(null);
    setHeard("");
    setVoiceDiff(null);
    setListening(false);
    setLiveWords([]);
    setLiveWarn(false);
    setLiveDone(false);
    setArrangeChecked(null);
    setBuilt([]);
    setBlanksChecked(null);
    if (m === "arrange" && a) setPool(shuffle(a.words)); else setPool([]);
    if (m === "complete" && a) {
      const count = Math.max(1, Math.round(a.words.length * 0.4));
      const idxs = shuffle(a.words.map((w) => w.i)).slice(0, count).sort((x, y) => x - y);
      setBlankIdx(idxs);
      setBlankCursor(0);
      setBlankAnswers(new Array(idxs.length).fill(null));
      setOptionsBySlot(idxs.map((wi) => buildOptions(a.words[wi].t)));
    } else {
      setBlankIdx([]); setBlankCursor(0); setBlankAnswers([]); setOptionsBySlot([]);
    }
  };

  const startMethod = (m: Method) => {
    setMethod(m);
    setPhase("method");
    setIdx(0);
    resetMethodState(m, sessionAyahs[0]);
    if (m === "listen" || m === "repeat" || m === "dictation") setTimeout(() => play(sessionAyahs[0]), 250);
  };

  // advance to next ayah inside a method; if finished, complete the method
  const nextAyah = (recordedAccuracy?: number) => {
    if (recordedAccuracy != null) {
      setScores((s) => [...s, recordedAccuracy]);
      if (recordedAccuracy >= PASS) showToast(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    }
    const ni = idx + 1;
    if (ni < sessionAyahs.length) {
      setIdx(ni);
      resetMethodState(method!, sessionAyahs[ni]);
      if (method === "listen" || method === "repeat" || method === "dictation") setTimeout(() => play(sessionAyahs[ni]), 250);
    } else {
      completeMethod();
    }
  };

  const completeMethod = () => {
    if (method) setDone((d) => new Set(d).add(method));
    setMethod(null);
    setPhase("method"); // stay on hub
  };

  const finishSession = async () => {
    const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0.85;
    const retention = Math.round(avg * 100);
    if (isLoggedIn) {
      setSaving(true);
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surahNumber: surahNum, memorizedAyahs: startIdx + sessionAyahs.length, retention }),
        });
        router.refresh();
      } finally { setSaving(false); }
    }
    setPhase("done");
  };

  // ---- repeat ----
  const doRep = () => {
    const n = reps + 1;
    if (n >= REQUIRED_REPS) nextAyah();
    else { setReps(n); play(cur); }
  };
  // ---- write ----
  const checkWrite = () => setWriteDiff(diffAyah(cur.text, written));
  // ---- voice (read aloud, we listen then correct) ----
  const startListening = () => {
    const rec = createRecognizer(
      (transcript) => {
        setHeard(transcript);
        setVoiceDiff(diffAyah(cur.text, transcript));
      },
      () => setListening(false),
      () => setListening(false)
    );
    if (!rec) return;
    recRef.current = rec;
    setHeard("");
    setVoiceDiff(null);
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };
  const stopListening = () => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  };
  // ---- live recite: word-by-word into the mushaf, warns on mistake ----
  const startLiveRecite = () => {
    const rec = createRecognizer(
      (transcript) => {
        const said = transcript.trim().split(/\s+/).map(normalizeWord).filter(Boolean);
        const expected = cur.words.map((w) => ({ raw: w.t, norm: normalizeWord(w.t) }));
        const rendered: { t: string; ok: boolean }[] = [];
        let anyWrong = false;
        for (let k = 0; k < expected.length; k++) {
          if (k < said.length) {
            const ok = said[k] === expected[k].norm;
            if (!ok) anyWrong = true;
            rendered.push({ t: expected[k].raw, ok });
          }
        }
        setLiveWords(rendered);
        setLiveDone(said.length >= expected.length);
        if (anyWrong) {
          setLiveWarn(true);
          window.setTimeout(() => setLiveWarn(false), 2600);
        }
      },
      () => setListening(false),
      () => setListening(false)
    );
    if (!rec) return;
    recRef.current = rec;
    setLiveWords([]);
    setLiveWarn(false);
    setLiveDone(false);
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };
  const liveAccuracy = () => {
    if (liveWords.length === 0) return 0;
    return liveWords.filter((w) => w.ok).length / cur.words.length;
  };
  // ---- arrange ----
  const pick = (w: Word) => { setBuilt((b) => [...b, w]); setPool((p) => p.filter((x) => x.i !== w.i)); };
  const unpick = (w: Word) => { setPool((p) => [...p, w]); setBuilt((b) => b.filter((x) => x.i !== w.i)); };
  // drag & drop reorder within the built row
  const moveBuilt = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setBuilt((b) => {
      const next = [...b];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };
  const checkArrange = () => {
    const exp = cur.words; let correct = 0; let firstWrong = -1;
    for (let k = 0; k < exp.length; k++) {
      if (built[k] && built[k].i === exp[k].i) correct++;
      else if (firstWrong === -1) firstWrong = k;
    }
    setArrangeChecked({ ok: correct === exp.length, accuracy: correct / exp.length, firstWrong });
  };
  // ---- complete (multiple-choice) ----
  // Pick an option for the active blank; advance to the next empty blank.
  // Does NOT auto-check — the user presses "تصحيح" to reveal mistakes.
  const chooseOption = (slot: number, opt: Opt) => {
    if (blanksChecked) return;
    const updated = blankAnswers.map((a, i) => (i === slot ? opt : a));
    setBlankAnswers(updated);
    const nextEmpty = updated.findIndex((a) => a === null);
    if (nextEmpty !== -1) setBlankCursor(nextEmpty);
  };
  // Click a chosen blank to re-select it before correcting.
  const focusBlank = (slot: number) => {
    if (blanksChecked) return;
    setBlankCursor(slot);
  };
  const checkBlanks = () => {
    const correct = blankAnswers.filter((x) => x?.correct).length;
    setBlanksChecked({ accuracy: blankIdx.length ? correct / blankIdx.length : 0 });
  };
  const allBlanksAnswered = blankIdx.length > 0 && blankAnswers.every((a) => a !== null);

  const scoredCount = scores.filter((s) => s >= PASS).length;

  return (
    <div className="relative rounded-3xl card-warm p-6 sm:p-8">
      <audio ref={audioRef} />

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 -top-3 z-30 flex justify-center px-4">
          <div className="sheet-panel rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>
        </div>
      )}

      {/* SETUP */}
      {phase === "setup" && (
        <div className="text-center">
          <div className="text-4xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{surah.meta.nameAr}</div>
          <p className="mt-2 text-sm text-ink-500">اختر مقطع الحفظ لهذه الجلسة</p>
          <div className="mx-auto mt-6 max-w-md space-y-6 text-start">
            <div>
              <div className="mb-2 flex justify-between text-sm text-ink-700">
                <span>عدد الآيات في الجلسة</span>
                <span className="font-bold text-emerald-700">{chunk.toLocaleString("ar-EG")} آية</span>
              </div>
              {/* quick presets */}
              <div className="flex flex-wrap gap-2">
                {[5, 10, 20, 50].filter((n) => n < totalAyahs).map((n) => (
                  <button
                    key={n}
                    onClick={() => setChunk(Math.min(n, totalAyahs - startIdx))}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${chunk === n ? "btn-primary" : "btn-ghost"}`}
                  >
                    {n.toLocaleString("ar-EG")}
                  </button>
                ))}
                <button
                  onClick={() => { setStartIdx(0); setChunk(totalAyahs); }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${chunk >= totalAyahs ? "btn-primary" : "btn-ghost"}`}
                >
                  السورة كاملة ({totalAyahs.toLocaleString("ar-EG")})
                </button>
              </div>
              <input type="range" min={1} max={Math.max(1, totalAyahs - startIdx)} value={chunk} onChange={(e) => setChunk(Number(e.target.value))} className="mt-3 w-full accent-teal-600" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm text-ink-700"><span>ابدأ من الآية</span><span className="font-bold text-emerald-700">{(startIdx + 1).toLocaleString("ar-EG")}</span></div>
              <input type="range" min={0} max={Math.max(0, totalAyahs - 1)} value={startIdx} onChange={(e) => { const v = Math.min(Number(e.target.value), totalAyahs - 1); setStartIdx(v); setChunk((c) => Math.min(c, totalAyahs - v)); }} className="w-full accent-teal-600" />
            </div>
            <div className="rounded-xl bg-cream-100 px-4 py-3 text-center text-sm text-ink-700">
              ستحفظ من الآية <span className="font-bold text-emerald-700">{(startIdx + 1).toLocaleString("ar-EG")}</span> إلى الآية <span className="font-bold text-emerald-700">{Math.min(startIdx + chunk, totalAyahs).toLocaleString("ar-EG")}</span>
            </div>
          </div>
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-cream-100 p-4 text-start">
            <p className="text-xs text-ink-500">معاينة المقطع:</p>
            <p className="mt-2 text-lg leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>
              {sessionAyahs.map((a) => <span key={a.numberInSurah}>{a.text} <span className="text-gold-600">﴿{a.numberInSurah.toLocaleString("ar-EG")}﴾</span> </span>)}
            </p>
          </div>
          <button onClick={() => setPhase("method")} className="mt-7 rounded-2xl btn-primary px-8 py-3.5 font-semibold">ابدأ الحفظ</button>
          {!isLoggedIn && <p className="mt-3 text-xs text-ink-500">سجّل الدخول لحفظ تقدّمك تلقائياً.</p>}
        </div>
      )}

      {/* METHOD HUB */}
      {phase === "method" && method === null && (
        <div>
          <div className="text-center">
            <p className="text-xs tracking-[0.3em] text-gold-600">طرق الحفظ</p>
            <h3 className="mt-2 font-display text-xl font-bold text-ink-900">اختر طريقة الحفظ</h3>
            <p className="mt-1 text-sm text-ink-500">المقطع: {sessionAyahs.length.toLocaleString("ar-EG")} آية · ابدأ بالاستماع ثم التكرار، ثم اختبر نفسك</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => startMethod(m.id)}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-right transition hover:-translate-y-0.5 hover:shadow-lg ${done.has(m.id) ? "border-emerald-500/40 bg-emerald-50" : "card"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{m.icon}</span>
                  {done.has(m.id) && <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-700 text-xs text-white">✓</span>}
                </div>
                <div className="mt-3 font-display text-lg font-bold text-ink-900">{m.label}</div>
                <div className="mt-1 text-xs text-ink-500">{m.desc}</div>
              </button>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button onClick={finishSession} disabled={saving} className="rounded-2xl btn-primary px-7 py-3 font-semibold disabled:opacity-60">
              {saving ? "جارٍ الحفظ…" : "إنهاء الجلسة وحفظ التقدّم"}
            </button>
            <button onClick={() => setPhase("setup")} className="rounded-2xl btn-ghost px-6 py-3 font-semibold">تغيير المقطع</button>
          </div>
          {scores.length > 0 && <p className="mt-4 text-center text-sm text-ink-500">نتيجة الاختبارات: أتقنت {scoredCount.toLocaleString("ar-EG")} من {scores.length.toLocaleString("ar-EG")}</p>}
        </div>
      )}

      {/* ACTIVE METHOD */}
      {phase === "method" && method && cur && (
        <div>
          <div className="mb-5 flex items-center justify-between">
            <button onClick={() => { setMethod(null); }} className="text-sm text-ink-500 hover:text-ink-900">← الطرق</button>
            <div className="text-center">
              <p className="text-xs tracking-[0.2em] text-gold-600">{METHODS.find((m) => m.id === method)?.label}</p>
              <p className="text-sm text-ink-500">الآية {(idx + 1).toLocaleString("ar-EG")} من {sessionAyahs.length.toLocaleString("ar-EG")}</p>
            </div>
            <button onClick={() => play(cur)} className="rounded-lg btn-ghost px-3 py-1.5 text-xs">▷ استماع</button>
          </div>

          {/* LISTEN */}
          {method === "listen" && (
            <div className="text-center">
              <div className="mx-auto max-w-2xl rounded-2xl bg-white p-7 shadow-sm">
                <p className="text-3xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>
                  {cur.text}<span className="ayah-marker">{cur.numberInSurah.toLocaleString("ar-EG")}</span>
                </p>
              </div>
              <div className="mt-5 flex justify-center gap-3">
                <button onClick={() => play(cur)} className="rounded-2xl btn-ghost px-6 py-3 font-semibold">🔊 أعد الاستماع</button>
                <button onClick={() => nextAyah()} className="rounded-2xl btn-primary px-7 py-3 font-semibold">{idx + 1 < sessionAyahs.length ? "الآية التالية ←" : "أتممت الاستماع ✓"}</button>
              </div>
            </div>
          )}

          {/* REPEAT */}
          {method === "repeat" && (
            <div className="text-center">
              <p className="text-sm text-ink-500">كرّر الآية بصوتك بعد سماعها</p>
              <div className="mx-auto mt-4 max-w-2xl rounded-2xl bg-white p-7 shadow-sm">
                <p className="text-3xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>
                  {cur.text}<span className="ayah-marker">{cur.numberInSurah.toLocaleString("ar-EG")}</span>
                </p>
              </div>
              <button onClick={() => play(cur)} className="mt-4 rounded-xl btn-ghost px-5 py-2.5 text-sm">▷ استمع مرة أخرى</button>
              <div className="mt-5 flex items-center justify-center gap-2">
                {Array.from({ length: REQUIRED_REPS }).map((_, i) => <span key={i} className="h-3 w-8 rounded-full transition" style={{ background: i < reps ? "#1f6f5c" : "#e1d6bb" }} />)}
              </div>
              <p className="mt-2 text-sm text-ink-500">كرّرت {reps.toLocaleString("ar-EG")} من {REQUIRED_REPS.toLocaleString("ar-EG")}</p>
              <button onClick={doRep} className="mt-4 rounded-2xl btn-primary px-8 py-3.5 font-semibold">كرّرتُ ✓</button>
            </div>
          )}

          {/* HIDE */}
          {method === "hide" && (
            <div className="text-center">
              <p className="text-sm text-ink-500">استرجع الآية من حفظك ثم اكشفها للتحقق</p>
              <div className="mx-auto mt-5 max-w-2xl rounded-2xl bg-white p-7 shadow-sm">
                {hintWords > 0 && !revealed && (
                  <p className="mb-3 text-2xl text-emerald-700" style={{ fontFamily: "var(--font-quran)" }}>{cur.words.slice(0, hintWords).map((w) => w.t).join(" ")} …</p>
                )}
                <p className={`text-3xl leading-loose text-ink-900 transition ${revealed ? "" : "select-none blur-md"}`} style={{ fontFamily: "var(--font-quran)" }}>
                  {cur.text}<span className="ayah-marker">{cur.numberInSurah.toLocaleString("ar-EG")}</span>
                </p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button onClick={() => play(cur)} className="rounded-xl btn-ghost px-5 py-2.5 text-sm">▷ استماع</button>
                {!revealed && <button onClick={() => setHintWords((h) => Math.min(cur.words.length, h + 1))} className="rounded-xl btn-ghost px-5 py-2.5 text-sm">💡 تلميح</button>}
              </div>
              {!revealed ? (
                <button onClick={() => setRevealed(true)} className="mt-4 block w-full max-w-xs mx-auto rounded-2xl btn-primary py-3 font-semibold">اكشف الآية</button>
              ) : (
                <div className="mt-5 flex justify-center gap-3">
                  <button onClick={() => nextAyah(1)} className="rounded-2xl bg-emerald-700 px-6 py-3 font-semibold text-white">حفظتها صحيحة ✓</button>
                  <button onClick={() => nextAyah(0.4)} className="rounded-2xl btn-ghost px-5 py-3 font-semibold">أخطأت قليلاً</button>
                  <button onClick={() => nextAyah(0)} className="rounded-2xl btn-ghost px-5 py-3 font-semibold">لم أتذكر ✕</button>
                </div>
              )}
            </div>
          )}

          {/* LIVE RECITE — speak, words appear in the mushaf, warns on error */}
          {method === "liverecite" && (
            <div>
              <p className="text-center text-sm text-ink-500">انطق الآية وستظهر كلماتك أمامك — ننبّهك فوراً عند أي خطأ</p>

              {liveWarn && (
                <div className="warn-toast mx-auto mt-4 max-w-md rounded-2xl bg-red-50 p-4 text-center">
                  <p className="text-lg font-bold text-red-600">⚠️ احذر يا {name}، هذا خاطئ!</p>
                  <p className="mt-1 text-sm text-red-500">راجع الكلمة المظللّة بالأحمر وأعد النطق</p>
                </div>
              )}

              <div className="mt-4 min-h-[120px] rounded-2xl bg-white p-6 text-center shadow-sm">
                <p dir="rtl" className="text-3xl leading-loose" style={{ fontFamily: "var(--font-quran)" }}>
                  {cur.words.map((w, k) => {
                    const said = liveWords[k];
                    if (!said) return <span key={k} className="mx-1 text-ink-300" style={{ opacity: 0.28 }}>{w.t}</span>;
                    return (
                      <span key={k} className="mx-1 rounded px-1" style={said.ok
                        ? { color: "#047857", background: "rgba(4,120,87,0.10)" }
                        : { color: "#c0392b", background: "rgba(192,57,43,0.12)", textDecoration: "underline", textDecorationStyle: "wavy" }}>
                        {w.t}
                      </span>
                    );
                  })}
                </p>
                <span className="ayah-marker">{cur.numberInSurah.toLocaleString("ar-EG")}</span>
              </div>

              {!recognitionSupported() ? (
                <p className="mt-4 rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700">متصفّحك لا يدعم التعرّف على الصوت. جرّب Chrome.</p>
              ) : (
                <div className="mt-5 text-center">
                  {!listening ? (
                    <button onClick={startLiveRecite} className="mic-btn mx-auto grid h-20 w-20 place-items-center rounded-full text-3xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>🎙️</button>
                  ) : (
                    <button onClick={stopListening} className="mic-btn speaking mx-auto grid h-20 w-20 place-items-center rounded-full text-3xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#c0392b,#e1306c)" }}>■</button>
                  )}
                  <p className="mt-3 text-sm text-ink-500">{listening ? "أستمع إليك…" : "اضغط الميكروفون وابدأ التلاوة"}</p>
                </div>
              )}

              {liveDone && liveWords.length > 0 && (
                <div className="mt-4">
                  <p className="text-center text-sm font-bold" style={{ color: liveAccuracy() >= PASS ? "#047857" : "#c0392b" }}>
                    الدقة {Math.round(liveAccuracy() * 100)}٪
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={startLiveRecite} className="flex-1 rounded-2xl btn-ghost py-3 font-semibold">أعد التلاوة</button>
                    <button onClick={() => nextAyah(liveAccuracy())} className="flex-1 rounded-2xl btn-primary py-3 font-semibold">{idx + 1 < sessionAyahs.length ? "التالية ←" : "إنهاء الطريقة ✓"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VOICE — read aloud, we listen then correct */}
          {method === "voice" && (
            <div>
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <p className="text-3xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>
                  {cur.text}<span className="ayah-marker">{cur.numberInSurah.toLocaleString("ar-EG")}</span>
                </p>
              </div>

              {!recognitionSupported() ? (
                <p className="mt-4 rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700">
                  متصفّحك لا يدعم التعرّف على الصوت. جرّب متصفّح Chrome على الحاسوب أو الأندرويد.
                </p>
              ) : (
                <>
                  <div className="mt-5 text-center">
                    {!listening ? (
                      <button onClick={startListening} className="mic-btn mx-auto grid h-20 w-20 place-items-center rounded-full text-3xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>🎙️</button>
                    ) : (
                      <button onClick={stopListening} className="mic-btn speaking mx-auto grid h-20 w-20 place-items-center rounded-full text-3xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#c0392b,#e1306c)" }}>■</button>
                    )}
                    <p className="mt-3 text-sm text-ink-500">{listening ? "أستمع إليك… اقرأ الآية بصوتك لنقارنها بنطق الشيخ" : "اضغط الميكروفون واقرأ الآية بصوتك، فنقارن تلاوتك بنطق الشيخ"}</p>
                  </div>

                  {heard && (
                    <div className="mt-5">
                      <div className="rounded-2xl bg-cream-100 p-4">
                        <p className="text-xs text-ink-500">ما سمعتُه منك:</p>
                        <p className="mt-1 text-xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{heard}</p>
                      </div>
                      {voiceDiff && (
                        <div className="mt-3 rounded-2xl bg-white p-5 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-ink-700">التصحيح كلمة بكلمة</span>
                            <span className="text-sm font-bold" style={{ color: voiceDiff.accuracy >= PASS ? "#047857" : "#2563eb" }}>الدقة {Math.round(voiceDiff.accuracy * 100)}٪</span>
                          </div>
                          <p dir="rtl" className="text-2xl leading-loose" style={{ fontFamily: "var(--font-quran)" }}>
                            {voiceDiff.expected.map((w, i) => (
                              <span
                                key={i}
                                className="mx-0.5 rounded px-1"
                                style={w.status === "ok" ? { color: "#047857", background: "rgba(4,120,87,0.08)" } : { color: "#c0392b", background: "rgba(192,57,43,0.1)", textDecoration: "underline", textDecorationStyle: "wavy" }}
                              >
                                {w.word}
                              </span>
                            ))}
                          </p>
                          {voiceDiff.expected.some((w) => w.status !== "ok") ? (
                            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">راجع الكلمات المظللّة بالأحمر، واستمع للآية بصوت الشيخ لتصحيح نطقك.</p>
                          ) : (
                            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">ما شاء الله! تلاوة صحيحة كاملة 🌿</p>
                          )}
                          <button onClick={() => play(cur)} className="mt-3 w-full rounded-xl btn-primary py-2.5 text-sm font-semibold">🔊 استمع للتصحيح بصوت الشيخ</button>
                          <p className="mt-2 text-[11px] text-ink-500">💡 التصحيح على النطق لا التشكيل.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {voiceDiff && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={startListening} className="flex-1 rounded-2xl btn-ghost py-3 font-semibold">أعد المحاولة</button>
                      <button onClick={() => nextAyah(voiceDiff.accuracy)} className="flex-1 rounded-2xl btn-primary py-3 font-semibold">{idx + 1 < sessionAyahs.length ? "التالية ←" : "إنهاء الطريقة ✓"}</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* DICTATION — listen then write then correct */}
          {method === "dictation" && (
            <div>
              <div className="rounded-2xl bg-cream-100 p-5 text-center">
                <div className="text-4xl">🎧</div>
                <p className="mt-2 text-sm text-ink-700">استمع جيداً للآية ثم اكتب ما سمعت</p>
                <button onClick={() => play(cur)} className="mt-3 rounded-2xl btn-ghost px-6 py-2.5 text-sm font-semibold">🔊 استمع مرة أخرى</button>
              </div>
              <textarea value={written} onChange={(e) => { setWritten(e.target.value); setWriteDiff(null); }} placeholder="اكتب ما سمعته هنا…" dir="rtl" rows={3} disabled={!!writeDiff}
                className="mt-4 w-full rounded-2xl border border-sand-300 bg-white p-4 text-2xl leading-loose text-ink-900 outline-none focus:border-emerald-500 disabled:opacity-70" style={{ fontFamily: "var(--font-quran)" }} />
              {!writeDiff ? (
                <button onClick={checkWrite} disabled={!written.trim()} className="mt-4 w-full rounded-2xl btn-primary py-3 font-semibold disabled:opacity-50">تحقق وصحّح</button>
              ) : (
                <div className="mt-4">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-700">التصحيح كلمة بكلمة</span>
                      <span className="text-sm font-bold" style={{ color: writeDiff.accuracy >= PASS ? "#047857" : "#2563eb" }}>الدقة {Math.round(writeDiff.accuracy * 100)}٪</span>
                    </div>
                    <p dir="rtl" className="text-2xl leading-loose" style={{ fontFamily: "var(--font-quran)" }}>
                      {writeDiff.expected.map((w, i) => (
                        <span key={i} className="mx-0.5 rounded px-1" style={w.status === "ok" ? { color: "#047857", background: "rgba(4,120,87,0.08)" } : { color: "#c0392b", background: "rgba(192,57,43,0.08)", textDecoration: "underline", textDecorationStyle: "wavy" }}>{w.word}</span>
                      ))}
                    </p>
                    {writeDiff.extras.length > 0 && <p className="mt-3 text-xs text-ink-500">كلمات زائدة: <span className="text-red-600" style={{ fontFamily: "var(--font-quran)" }}>{writeDiff.extras.join("، ")}</span></p>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => { setWriteDiff(null); play(cur); }} className="flex-1 rounded-2xl btn-ghost py-3 font-semibold">أعد الاستماع</button>
                    <button onClick={() => nextAyah(writeDiff.accuracy)} className="flex-1 rounded-2xl btn-primary py-3 font-semibold">{idx + 1 < sessionAyahs.length ? "التالية ←" : "إنهاء الطريقة ✓"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WRITE */}
          {method === "write" && (
            <div>
              <p className="text-center text-sm text-ink-500">اكتب الآية من حفظك (التشكيل غير مطلوب)</p>
              <textarea value={written} onChange={(e) => { setWritten(e.target.value); setWriteDiff(null); }} placeholder="اكتب الآية هنا…" dir="rtl" rows={3} disabled={!!writeDiff}
                className="mt-4 w-full rounded-2xl border border-sand-300 bg-white p-4 text-2xl leading-loose text-ink-900 outline-none focus:border-gold-500 disabled:opacity-70" style={{ fontFamily: "var(--font-quran)" }} />
              {!writeDiff ? (
                <button onClick={checkWrite} disabled={!written.trim()} className="mt-4 w-full rounded-2xl btn-primary py-3 font-semibold disabled:opacity-50">تحقق وصحّح</button>
              ) : (
                <div className="mt-4">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-700">التصحيح كلمة بكلمة</span>
                      <span className="text-sm font-bold" style={{ color: writeDiff.accuracy >= PASS ? "#1f6f5c" : "#2563eb" }}>الدقة {Math.round(writeDiff.accuracy * 100)}٪</span>
                    </div>
                    <p dir="rtl" className="text-2xl leading-loose" style={{ fontFamily: "var(--font-quran)" }}>
                      {writeDiff.expected.map((w, i) => (
                        <span key={i} className="mx-0.5 rounded px-1" style={w.status === "ok" ? { color: "#1f6f5c", background: "rgba(31,111,92,0.08)" } : { color: "#c0392b", background: "rgba(192,57,43,0.08)", textDecoration: "underline", textDecorationStyle: "wavy" }}>{w.word}</span>
                      ))}
                    </p>
                    {writeDiff.extras.length > 0 && <p className="mt-3 text-xs text-ink-500">كلمات زائدة: <span className="text-red-600" style={{ fontFamily: "var(--font-quran)" }}>{writeDiff.extras.join("، ")}</span></p>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setWriteDiff(null)} className="flex-1 rounded-2xl btn-ghost py-3 font-semibold">حاول مجدداً</button>
                    <button onClick={() => nextAyah(writeDiff.accuracy)} className="flex-1 rounded-2xl btn-primary py-3 font-semibold">{idx + 1 < sessionAyahs.length ? "التالية ←" : "إنهاء الطريقة ✓"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ARRANGE — click or drag to reorder */}
          {method === "arrange" && (
            <div>
              <p className="text-center text-sm text-ink-500">انقر الكلمات بالترتيب، أو اسحبها لإعادة ترتيبها</p>
              <div className="mt-4 min-h-[80px] rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-4">
                <div className="flex flex-wrap gap-2" dir="rtl">
                  {built.map((w, k) => {
                    const wrong = arrangeChecked && arrangeChecked.firstWrong !== -1 && k >= arrangeChecked.firstWrong && !(cur.words[k] && cur.words[k].i === w.i);
                    const ok = arrangeChecked && cur.words[k] && cur.words[k].i === w.i;
                    return (
                      <button
                        key={w.i}
                        draggable={!arrangeChecked}
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", String(k))}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); moveBuilt(Number(e.dataTransfer.getData("text/plain")), k); }}
                        onClick={() => !arrangeChecked && unpick(w)}
                        className="cursor-grab rounded-lg px-3 py-2 text-xl text-white shadow-sm transition active:cursor-grabbing"
                        style={{ fontFamily: "var(--font-quran)", background: ok ? "#059669" : wrong ? "#c0392b" : "linear-gradient(135deg,#10b981,#2563eb)" }}
                      >
                        {w.t}
                      </button>
                    );
                  })}
                  {built.length === 0 && <span className="text-sm text-ink-500">انقر الكلمات بالأسفل بالترتيب…</span>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" dir="rtl">
                {pool.map((w) => <button key={w.i} onClick={() => pick(w)} className="rounded-lg card px-3 py-2 text-xl text-ink-900 transition hover:-translate-y-0.5 hover:bg-cream-100" style={{ fontFamily: "var(--font-quran)" }}>{w.t}</button>)}
              </div>
              {!arrangeChecked ? (
                <button onClick={checkArrange} disabled={built.length !== cur.words.length} className="mt-5 w-full rounded-2xl btn-primary py-3 font-semibold disabled:opacity-50">تحقق</button>
              ) : (
                <div className="mt-5">
                  <div className={`rounded-2xl p-4 ${arrangeChecked.ok ? "bg-emerald-50" : "bg-amber-50"}`}>
                    <p className="text-sm font-semibold" style={{ color: arrangeChecked.ok ? "#1f6f5c" : "#2563eb" }}>{arrangeChecked.ok ? "ترتيب صحيح، ما شاء الله! ✓" : `الدقة ${Math.round(arrangeChecked.accuracy * 100)}٪ — الصحيح:`}</p>
                    {!arrangeChecked.ok && <p dir="rtl" className="mt-2 text-xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{cur.text}</p>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => resetMethodState("arrange", cur)} className="flex-1 rounded-2xl btn-ghost py-3 font-semibold">أعد</button>
                    <button onClick={() => nextAyah(arrangeChecked.accuracy)} className="flex-1 rounded-2xl btn-primary py-3 font-semibold">{idx + 1 < sessionAyahs.length ? "التالية ←" : "إنهاء الطريقة ✓"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPLETE — multiple choice with a "تصحيح" button */}
          {method === "complete" && (
            <div>
              <p className="text-center text-sm text-ink-500">اختر الكلمة الصحيحة لكل فراغ، ثم اضغط «تصحيح»</p>
              <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
                <p dir="rtl" className="text-2xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>
                  {cur.words.map((w) => {
                    const slot = blankIdx.indexOf(w.i);
                    if (slot === -1) return <span key={w.i} className="mx-0.5">{w.t} </span>;
                    const ans = blankAnswers[slot];

                    // After correction: show the user's chosen word, colored right/wrong.
                    if (blanksChecked) {
                      const ok = ans?.correct;
                      return (
                        <span key={w.i} className="mx-1 inline-flex flex-col items-center align-middle">
                          <span
                            className="rounded-md border-b-2 px-2"
                            style={{ fontFamily: "var(--font-quran)", borderColor: ok ? "#047857" : "#c0392b", color: ok ? "#047857" : "#c0392b", background: ok ? "rgba(4,120,87,0.08)" : "rgba(192,57,43,0.08)" }}
                          >
                            {ans ? ans.t : "—"}
                          </span>
                          {/* show the correct word under a wrong answer */}
                          {!ok && <span className="mt-0.5 text-xs text-emerald-700" style={{ fontFamily: "var(--font-quran)" }}>✓ {w.t}</span>}
                        </span>
                      );
                    }

                    // Before correction: neutral. Chosen blanks are clickable to re-select.
                    const isCurrent = slot === blankCursor;
                    return (
                      <button
                        key={w.i}
                        onClick={() => focusBlank(slot)}
                        className="mx-1 inline-block min-w-[4rem] rounded-md border-b-2 px-2 text-center align-middle"
                        style={{
                          fontFamily: "var(--font-quran)",
                          borderColor: isCurrent ? "#059669" : ans ? "#10b981" : "#2563eb",
                          background: isCurrent ? "rgba(16,185,129,0.14)" : ans ? "rgba(16,185,129,0.06)" : "transparent",
                          color: ans ? "#0f2a2c" : "#2563eb",
                        }}
                      >
                        {ans ? ans.t : isCurrent ? "؟" : "____"}
                      </button>
                    );
                  })}
                </p>
                {blanksChecked && (
                  <p className="mt-3 text-sm font-bold" style={{ color: blanksChecked.accuracy >= PASS ? "#047857" : "#2563eb" }}>
                    الدقة {Math.round(blanksChecked.accuracy * 100)}٪ — {blankAnswers.filter((a) => a?.correct).length.toLocaleString("ar-EG")} من {blankIdx.length.toLocaleString("ar-EG")} صحيحة
                  </p>
                )}
              </div>

              {/* options for the active blank */}
              {!blanksChecked && optionsBySlot[blankCursor] && (
                <div className="mt-5">
                  <p className="text-center text-xs text-ink-500">الفراغ {(blankCursor + 1).toLocaleString("ar-EG")} من {blankIdx.length.toLocaleString("ar-EG")} — اختر الكلمة الصحيحة</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {optionsBySlot[blankCursor].map((opt) => {
                      const chosen = blankAnswers[blankCursor]?.key === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => chooseOption(blankCursor, opt)}
                          className={`rounded-xl border px-4 py-3.5 text-2xl shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50 ${chosen ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-sand-300 bg-white text-ink-900"}`}
                          style={{ fontFamily: "var(--font-quran)" }}
                        >
                          {opt.t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* تصحيح / next */}
              {!blanksChecked ? (
                <button
                  onClick={checkBlanks}
                  disabled={!allBlanksAnswered}
                  className="mt-6 w-full rounded-2xl btn-primary py-3.5 font-semibold disabled:opacity-50"
                >
                  {allBlanksAnswered ? "تصحيح" : `اختر باقي الفراغات (${blankAnswers.filter((a) => a === null).length.toLocaleString("ar-EG")} متبقّ)`}
                </button>
              ) : (
                <div className="mt-5 flex gap-2">
                  <button onClick={() => resetMethodState("complete", cur)} className="flex-1 rounded-2xl btn-ghost py-3 font-semibold">أعد</button>
                  <button onClick={() => nextAyah(blanksChecked.accuracy)} className="flex-1 rounded-2xl btn-primary py-3 font-semibold">{idx + 1 < sessionAyahs.length ? "التالية ←" : "إنهاء الطريقة ✓"}</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {phase === "done" && (
        <div className="text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full card-warm text-5xl animate-floaty">🌟</div>
          <h3 className="mt-6 font-display text-2xl font-bold gold-text">أتممت الجلسة!</h3>
          <p className="mt-3 text-ink-700">حفظت {sessionAyahs.length.toLocaleString("ar-EG")} آية · أكملت {done.size.toLocaleString("ar-EG")} طرق{scores.length ? ` · أتقنت ${scoredCount.toLocaleString("ar-EG")} من ${scores.length.toLocaleString("ar-EG")} في الاختبارات` : ""}</p>
          <p className="mt-2 text-sm text-ink-500">{isLoggedIn ? (saving ? "جارٍ حفظ تقدّمك…" : "تم حفظ تقدّمك بنجاح.") : "سجّل الدخول لحفظ تقدّمك."}</p>

          {/* Certificate when the whole surah is completed */}
          {startIdx + sessionAyahs.length >= totalAyahs && (
            <div className="mt-8">
              <div className="mb-4 inline-block rounded-full bg-emerald-50 px-5 py-2 text-sm font-bold text-emerald-700">🎓 أتممت السورة كاملة — استلم شهادتك</div>
              <Certificate
                name={userName || "عبد الله"}
                surahName={surah.meta.nameAr}
                ayahCount={totalAyahs}
                accuracy={scores.length ? (scores.reduce((s, v) => s + v, 0) / scores.length) * 100 : 90}
              />
            </div>
          )}

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button onClick={() => { const ns = Math.min(startIdx + chunk, totalAyahs - 1); setStartIdx(ns); setScores([]); setDone(new Set()); setPhase("setup"); }} className="rounded-2xl btn-primary px-6 py-3 font-semibold">المقطع التالي</button>
            <a href={`/mushaf/${surahNum}`} className="rounded-2xl btn-ghost px-6 py-3 font-semibold">اقرأ في المصحف</a>
          </div>
        </div>
      )}
    </div>
  );
}
