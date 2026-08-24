"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { RECITERS, type Reciter } from "@/lib/reciterRegistry";
import { SURAHS } from "@/lib/surahs";
import {
  getAyahTimingMap,
  validateTimestamps,
  type WordTimestamp,
  type AyahTimingMap,
  type ValidationIssue,
} from "@/lib/syncEngine";

export default function SyncEditorPage() {
  const [selectedReciterId, setSelectedReciterId] = useState<string>("afasy");
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedAyah, setSelectedAyah] = useState<number>(1);

  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const reciter = RECITERS.find((r) => r.id === selectedReciterId) || RECITERS[0];
  const surahMeta = SURAHS.find((s) => s.number === selectedSurah) || SURAHS[0];

  // Build a fresh selection key so the editable words state below resets whenever
  // the reciter/surah/ayah changes (avoids setState-in-effect cascading renders).
  const selectionKey = `${reciter.id}:${selectedSurah}:${selectedAyah}`;
  const { audioUrl, initialWords, initialIssues } = useMemo(() => {
    const pad3 = (n: number) => String(n).padStart(3, "0");
    const folder = (reciter as { everyayahFolder?: string }).everyayahFolder || "Alafasy_128kbps";
    const url = `https://everyayah.com/data/${folder}/${pad3(selectedSurah)}${pad3(selectedAyah)}.mp3`;
    const map = getAyahTimingMap(reciter.id, selectedSurah, selectedAyah, 4);
    return {
      audioUrl: url,
      initialWords: map.words,
      initialIssues: validateTimestamps(map.words).issues,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionKey]);

  // Editable word timestamps — reset only when the selection identity changes.
  const [words, setWords] = useState<WordTimestamp[]>(initialWords);
  useEffect(() => {
    setWords(initialWords);
    setValidationIssues(initialIssues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionKey]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const t = audioRef.current.currentTime;
    setCurrentTime(t);

    if (words.length > 0) {
      const idx = words.findIndex((w) => t >= w.startTime && t <= w.endTime);
      setActiveWordIdx(idx);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleStampCurrentTime = (idx: number, type: "start" | "end") => {
    if (!audioRef.current) return;
    const t = Number(audioRef.current.currentTime.toFixed(2));
    const next = [...words];
    if (type === "start") {
      next[idx] = { ...next[idx], startTime: t, status: "edited" };
    } else {
      next[idx] = { ...next[idx], endTime: t, status: "edited" };
    }
    setWords(next);
    const val = validateTimestamps(next);
    setValidationIssues(val.issues);
  };

  const handleExportJson = () => {
    const payload = {
      reciterId: reciter.id,
      surahNumber: selectedSurah,
      ayahNumber: selectedAyah,
      syncLevel: "WORD_VERIFIED",
      words,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sync_${reciter.id}_s${selectedSurah}_a${selectedAyah}.json`;
    a.click();
    setSaveToast("تم تصدير ملف المزامنة بنجاح ✓");
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-500/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 mb-1 border border-emerald-200">
            <span>⚙️</span>
            <span>نظام إدارة وتدقيق المزامنة الصوتية</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
            محرر التوقيتات كلمة بكلمة
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            أداة داخلية لضبط وتدقيق التوقيتات الزمنية الدقيقة لكل قارئ وسورة
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
        >
          تصدير JSON المعتمد
        </button>
      </div>

      {saveToast && (
        <div className="rounded-2xl bg-emerald-500 text-white p-3 text-center text-xs font-bold animate-in fade-in">
          {saveToast}
        </div>
      )}

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-emerald-500/15 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-ink-700 mb-1">القارئ:</label>
          <select
            value={selectedReciterId}
            onChange={(e) => setSelectedReciterId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-cream-50 px-3 py-2 text-xs text-ink-900 font-semibold focus:outline-none focus:border-emerald-500"
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nameArabic} ({r.style})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-700 mb-1">السورة:</label>
          <select
            value={selectedSurah}
            onChange={(e) => setSelectedSurah(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 bg-cream-50 px-3 py-2 text-xs text-ink-900 font-semibold focus:outline-none focus:border-emerald-500"
          >
            {SURAHS.map((s) => (
              <option key={s.number} value={s.number}>
                {s.number}. {s.nameAr} ({s.ayahCount} آية)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-700 mb-1">الآية:</label>
          <select
            value={selectedAyah}
            onChange={(e) => setSelectedAyah(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 bg-cream-50 px-3 py-2 text-xs text-ink-900 font-semibold focus:outline-none focus:border-emerald-500"
          >
            {Array.from({ length: surahMeta.ayahCount }, (_, i) => i + 1).map((a) => (
              <option key={a} value={a}>
                الآية {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audio Waveform & Player Controller */}
      <div className="rounded-3xl bg-[#132238] text-white p-6 shadow-xl space-y-4">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white text-xl shadow-lg hover:bg-emerald-400 transition active:scale-95"
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <div>
              <div className="text-sm font-bold">
                سورة {surahMeta.nameAr} · آية {selectedAyah}
              </div>
              <div className="text-xs text-emerald-300/80">
                بصوت الشيخ {reciter.nameArabic}
              </div>
            </div>
          </div>

          <div className="font-mono text-sm font-bold text-emerald-400">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </div>
        </div>

        {/* Timeline bar */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={duration || 10}
            step="0.01"
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* Validation Panel */}
      {validationIssues.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <span>⚠️</span>
            <span>تنبيهات التدقيق الآلي ({validationIssues.length}):</span>
          </div>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            {validationIssues.map((iss, i) => (
              <li key={i}>{iss.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Word Timestamps Grid */}
      <div className="rounded-3xl bg-white p-6 border border-emerald-500/15 shadow-sm space-y-4">
        <h3 className="font-display text-base font-bold text-ink-900 flex items-center justify-between">
          <span>جدول توقيت الكلمات</span>
          <span className="text-xs text-ink-500 font-normal">
            انقر على الأزرار لضبط وقت البداية/النهاية عند موقع التشغيل الحالي
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-cream-50 text-ink-700">
                <th className="p-3">#</th>
                <th className="p-3">وقت البداية</th>
                <th className="p-3">وقت النهاية</th>
                <th className="p-3">المدة (ث)</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">إجراءات الضبط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {words.map((w, idx) => {
                const isActive = activeWordIdx === idx;
                const dur = (w.endTime - w.startTime).toFixed(2);

                return (
                  <tr
                    key={idx}
                    className={`transition ${
                      isActive ? "bg-emerald-50 font-bold" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-3 font-mono">الكلمة {idx + 1}</td>
                    <td className="p-3 font-mono text-emerald-800">{w.startTime.toFixed(2)}s</td>
                    <td className="p-3 font-mono text-emerald-800">{w.endTime.toFixed(2)}s</td>
                    <td className="p-3 font-mono">{dur}s</td>
                    <td className="p-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
                        {w.status || "verified"}
                      </span>
                    </td>
                    <td className="p-3 space-x-1 space-x-reverse">
                      <button
                        onClick={() => handleStampCurrentTime(idx, "start")}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] text-white hover:bg-emerald-700 transition"
                      >
                        تعيين كبداية
                      </button>
                      <button
                        onClick={() => handleStampCurrentTime(idx, "end")}
                        className="rounded-lg bg-ocean-600 px-2.5 py-1 text-[11px] text-white hover:bg-ocean-700 transition"
                      >
                        تعيين كنهاية
                      </button>
                      <button
                        onClick={() => handleSeek(w.startTime)}
                        className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-gray-200 transition"
                      >
                        ▶ استمع
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}