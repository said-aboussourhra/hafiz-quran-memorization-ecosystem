"use client";

import { useEffect, useState } from "react";
import { ALLAH_NAMES } from "@/lib/names";
import { initSpeech, speakSequence, stopSpeaking, speechSupported } from "@/lib/speak";

export function NamesGrid() {
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    initSpeech();
    setSupported(speechSupported());
  }, []);

  const say = (i: number, name: string, meaning: string) => {
    if (!speechSupported()) return;
    setSpeaking(i);
    // speak the name, then its explanation
    speakSequence([name, meaning], 0.82);
    window.setTimeout(() => setSpeaking((cur) => (cur === i ? null : cur)), 4200);
  };

  return (
    <div>
      {supported && (
        <p className="mb-6 text-center text-sm text-emerald-700">
          🔊 مرّر المؤشّر على أي اسم فيُنطق بصوتٍ واضح ثم يُشرح لك معناه
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ALLAH_NAMES.map((n, i) => (
          <button
            key={i}
            onMouseEnter={() => say(i, n.ar, n.meaning)}
            onClick={() => say(i, n.ar, n.meaning)}
            onMouseLeave={() => stopSpeaking()}
            className={`name-card group rounded-2xl border border-sand-300/70 bg-white p-5 text-center ${speaking === i ? "speaking" : ""}`}
          >
            <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>
              {(i + 1).toLocaleString("ar-EG")}
            </span>
            <span className="sound-badge absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              🔊
            </span>
            <div className="mt-3 text-3xl text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{n.ar}</div>
            <div className="mt-3 text-xs leading-relaxed text-ink-500">{n.meaning}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
