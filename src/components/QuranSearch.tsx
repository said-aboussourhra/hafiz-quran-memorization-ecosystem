"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { SearchMatch } from "@/lib/search";

const EXAMPLES = ["الرحمن", "الصبر", "الجنة", "التوبة", "النور", "الذكر"];

function highlight(text: string, q: string) {
  const t = q.trim();
  if (!t) return text;
  const parts = text.split(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "g"));
  return parts.map((p, i) =>
    p === t ? (
      <mark key={i} className="rounded bg-gold-500/25 px-0.5 text-ink-900">{p}</mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function QuranSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState("");
  const debounce = useRef<number | null>(null);

  const run = async (term: string) => {
    const t = term.trim();
    if (t.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    setSearched(t);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(t)}`);
      const data = await res.json();
      setResults(data.matches ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (v: string) => {
    setQ(v);
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => run(v), 450);
  };

  return (
    <div>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(q)}
          placeholder="ابحث في القرآن الكريم… (مثال: الرحمن، الصبر)"
          className="w-full rounded-2xl border border-sand-300 bg-white px-5 py-4 text-lg text-ink-900 outline-none focus:border-gold-500"
          style={{ fontFamily: "var(--font-quran)" }}
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600">🔍</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-ink-500">جرّب:</span>
        {EXAMPLES.map((e) => (
          <button key={e} onClick={() => { setQ(e); run(e); }} className="rounded-full bg-cream-100 px-3 py-1 text-xs text-ink-700 transition hover:bg-cream-200">
            {e}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading && <p className="text-center text-ink-500">جارٍ البحث…</p>}
        {!loading && results && (
          <p className="mb-4 text-sm text-ink-500">
            {results.length > 0 ? `${results.length.toLocaleString("ar-EG")} نتيجة لـ «${searched}»` : `لا توجد نتائج لـ «${searched}»`}
          </p>
        )}
        <div className="space-y-3">
          {results?.map((m, i) => (
            <Link
              key={`${m.surahNumber}-${m.numberInSurah}-${i}`}
              href={`/mushaf/${m.surahNumber}`}
              className="block rounded-2xl card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-gold-600">
                <span className="rounded-full bg-cream-100 px-2.5 py-0.5">سورة {m.surahNameAr}</span>
                <span className="text-ink-500">الآية {m.numberInSurah.toLocaleString("ar-EG")}</span>
              </div>
              <p className="text-2xl leading-loose text-ink-900" style={{ fontFamily: "var(--font-quran)" }}>
                {highlight(m.text, searched)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
