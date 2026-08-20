"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getAyahs, getSurahName, type Ayah } from "@/lib/quran";
import { getReciterAudio, type Reciter } from "@/lib/reciters";
import { Play, Pause, ChevronRight, ChevronLeft, Settings } from "lucide-react";

interface MushafReaderProps {
  surahNumber: number;
  initialAyah?: number;
}

export function MushafReader({ surahNumber, initialAyah = 1 }: MushafReaderProps) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [currentAyah, setCurrentAyah] = useState(initialAyah);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(1.2);
  const [reciter, setReciter] = useState<Reciter>("ar.alafasy");
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadAyahs = async () => {
      const data = await getAyahs(surahNumber);
      setAyahs(data);
      setLoading(false);
    };
    loadAyahs();
  }, [surahNumber]);

  const surahName = getSurahName(surahNumber);

  const playAyah = async (ayahNumber: number) => {
    const audioUrl = await getReciterAudio(reciter, surahNumber, ayahNumber);
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
      } else {
        audioRef.current = new Audio(audioUrl);
      }
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentAyah(ayahNumber);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const nextAyah = () => {
    if (currentAyah < ayahs.length) {
      playAyah(currentAyah + 1);
    }
  };

  const prevAyah = () => {
    if (currentAyah > 1) {
      playAyah(currentAyah - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-ink-500">جاري تحميل المصحف...</div>
      </div>
    );
  }

  return (
    <div className="mushaf-page relative max-w-4xl mx-auto p-6 md:p-8 lg:p-10">
      {/* رأس الصفحة */}
      <div className="text-center mb-6 md:mb-8">
        <div className="basmala-ornament mb-4" />
        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold gold-text">
          سورة {surahName}
        </h2>
        <p className="text-sm text-ink-500 mt-1">
          {ayahs.length} آية · {surahNumber === 1 ? "مكية" : surahNumber < 10 ? "مكية" : "مدنية"}
        </p>
        <div className="basmala-ornament mt-4" />
      </div>

      {/* الآيات */}
      <div className="space-y-6 md:space-y-8">
        {ayahs.map((ayah) => (
          <div
            key={ayah.id}
            className={`group relative p-4 md:p-6 rounded-2xl transition-all duration-300 ${
              currentAyah === ayah.number
                ? "bg-emerald-50/50 border border-emerald-200/50 shadow-md"
                : "hover:bg-cream-50/50"
            }`}
            onClick={() => playAyah(ayah.number)}
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-1 text-sm text-ink-500 font-arabic">
                {ayah.number}
              </span>
              <p
                className="mushaf-text flex-1"
                style={{ fontSize: `${fontSize}rem` }}
              >
                {ayah.text}
              </p>
            </div>
            {currentAyah === ayah.number && isPlaying && (
              <div className="absolute -top-2 -right-2">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* أدوات التحكم */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-lg border-t border-gold-500/20 mt-8 -mx-6 md:-mx-8 lg:-mx-10 px-6 md:px-8 lg:px-10 py-4">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          <button
            onClick={prevAyah}
            disabled={currentAyah <= 1}
            className="p-2 rounded-full hover:bg-cream-100 disabled:opacity-30 transition"
          >
            <ChevronRight size={20} />
          </button>

          <button
            onClick={togglePlay}
            className="p-3 rounded-full btn-primary shadow-lg"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={nextAyah}
            disabled={currentAyah >= ayahs.length}
            className="p-2 rounded-full hover:bg-cream-100 disabled:opacity-30 transition"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2 border-r border-gold-500/20 pr-3">
            <span className="text-xs text-ink-500">الآية</span>
            <span className="text-sm font-bold text-ink-900">{currentAyah}</span>
            <span className="text-xs text-ink-500">من</span>
            <span className="text-sm font-bold text-ink-900">{ayahs.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <Settings size={16} className="text-ink-500" />
            <input
              type="range"
              min="0.8"
              max="2"
              step="0.1"
              value={fontSize}
              onChange={(e) => setFontSize(parseFloat(e.target.value))}
              className="w-20 md:w-32 accent-gold-500"
            />
          </div>

          <select
            value={reciter}
            onChange={(e) => setReciter(e.target.value as Reciter)}
            className="text-xs md:text-sm border border-gold-500/20 rounded-lg px-2 py-1 bg-white"
          >
            <option value="ar.alafasy">المعيقلي</option>
            <option value="ar.husary">الحصري</option>
            <option value="ar.abdulbasit">عبد الباسط</option>
          </select>
        </div>
      </div>
    </div>
  );
}