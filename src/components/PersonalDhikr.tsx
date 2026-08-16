"use client";

import { useEffect, useState } from "react";
import { initSpeech, speakArabic, stopSpeaking, speechSupported } from "@/lib/speak";

const DHIKR_POOL = [
  { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", virtue: "كلمتان حبيبتان إلى الرحمن، خفيفتان على اللسان، ثقيلتان في الميزان" },
  { text: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", virtue: "من قالها عشر مرات كان كمن أعتق أربعة أنفس" },
  { text: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ", virtue: "من لزم الاستغفار جعل الله له من كل هم فرجاً" },
  { text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", virtue: "من صلّى عليّ صلاةً صلّى الله عليه بها عشراً" },
  { text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", virtue: "كنزٌ من كنوز الجنة" },
];

export function PersonalDhikr({ name }: { name: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [dhikr, setDhikr] = useState(DHIKR_POOL[0]);

  useEffect(() => {
    initSpeech();
    setSupported(speechSupported());
    // pick a dhikr of the day (stable per day)
    const day = Math.floor(Date.now() / 86400000);
    setDhikr(DHIKR_POOL[day % DHIKR_POOL.length]);
  }, []);

  const repeatWithMe = () => {
    if (!speechSupported()) return;
    setSpeaking(true);
    speakArabic(`يا ${name}، كرّر معي هذا الذكر`, { rate: 0.9 });
    window.setTimeout(() => speakArabic(dhikr.text, { rate: 0.8 }), 2200);
    window.setTimeout(() => setSpeaking(false), 7000);
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl card-warm p-7 ${speaking ? "speaking" : ""}`}>
      <div className="aurora breathe" style={{ top: "-60px", left: "10%", width: "220px", height: "220px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>📿</span>
          <div>
            <p className="text-xs tracking-[0.2em] text-gold-600">ذكر اليوم</p>
            <h3 className="font-display text-lg font-bold text-ink-900">يا {name}، كرّر معي هذا الذكر</h3>
          </div>
        </div>

        <p className="mt-5 text-center text-2xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>{dhikr.text}</p>
        <p className="mt-3 text-center text-sm text-ink-500">{dhikr.virtue}</p>

        {supported && (
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={repeatWithMe} className="rounded-2xl btn-primary px-6 py-3 text-sm font-semibold">🔊 كرّر معي</button>
            <button onClick={() => { stopSpeaking(); setSpeaking(false); }} className="rounded-2xl btn-ghost px-5 py-3 text-sm font-semibold">إيقاف</button>
          </div>
        )}
      </div>
    </div>
  );
}
