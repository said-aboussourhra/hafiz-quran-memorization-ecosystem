"use client";

import { useEffect, useState } from "react";
import { ADHKAR } from "@/lib/adhkar";
import { initSpeech, speakArabic, stopSpeaking, speechSupported } from "@/lib/speak";

export function AdhkarView() {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState<string | null>(null);

  useEffect(() => {
    initSpeech();
    setSupported(speechSupported());
  }, []);

  const say = (key: string, text: string) => {
    if (!speechSupported()) return;
    setSpeaking(key);
    speakArabic(text, { rate: 0.82 });
    window.setTimeout(() => setSpeaking((c) => (c === key ? null : c)), 2500);
  };

  return (
    <div>
      {supported && (
        <p className="mb-6 text-center text-sm text-emerald-700">🔊 انقر على أي ذكر لتستمع إليه</p>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        {ADHKAR.map((set) => (
          <section key={set.title} className="dhikr-card card rounded-3xl p-6">
            <div className="flex items-center gap-3 border-b border-sand-300/60 pb-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>{set.icon}</span>
              <h2 className="font-display text-xl font-bold text-ink-900">{set.title}</h2>
            </div>
            <div className="mt-4 space-y-4">
              {set.items.map((d, i) => {
                const key = `${set.title}-${i}`;
                return (
                  <button
                    key={i}
                    onClick={() => say(key, d.text)}
                    onMouseLeave={() => stopSpeaking()}
                    className={`dhikr-card group relative block w-full rounded-2xl bg-cream-100 p-4 text-right ${speaking === key ? "speaking" : ""}`}
                  >
                    <span className="sound-badge absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700">🔊</span>
                    <p className="text-lg leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{d.text}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">{d.count}</span>
                      {d.note && <span className="text-[11px] text-ink-500">{d.note}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
