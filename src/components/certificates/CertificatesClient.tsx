"use client";

import { useCallback, useEffect, useState } from "react";
import { Certificate } from "@/components/Certificate";
import type { CertificateAchievement } from "@/lib/certificates";

interface Eligible {
  id: CertificateAchievement;
  label: string;
  surah?: number;
  juz?: number;
}

interface Issued {
  token: string;
  id: string;
  name: string;
  achievementAr: string;
  surah?: number;
  juz?: number;
  iat: number;
  verifyUrl: string;
}

export function CertificatesClient() {
  const [eligible, setEligible] = useState<Eligible[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/certificate")
      .then((r) => (r.ok ? r.json() : { ok: false }))
      .then((d) => {
        if (!active) return;
        if (d.ok) {
          setEligible(d.eligible ?? []);
          setName(d.name ?? "");
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const issue = useCallback(
    async (achievement: CertificateAchievement, opts?: { surah?: number; juz?: number }) => {
      setError(null);
      setIssued(null);
      try {
        const res = await fetch("/api/certificate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            achievement,
            surah: opts?.surah,
            juz: opts?.juz,
          }),
        });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "تعذّر إصدار الشهادة.");
        return;
      }
      setIssued({ ...data.certificate, token: data.token, verifyUrl: data.verifyUrl });
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <div className="h-10 w-1/3 animate-pulse rounded-xl bg-cream-100" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-cream-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold text-ink-900">شهادات الإنجاز الرقمية</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">
          شهادات تقديرية يصدرها الخادم بعد تحققّه من تقدّمك الحقيقي. كل شهادة موقّعة ويمكن التحقق منها.
        </p>
      </header>

      {eligible.length === 0 ? (
        <div className="rounded-3xl border border-sand-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cream-100 text-3xl">📜</div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink-900">لا توجد إنجازات بعد</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            أكمل حفظ آية أو سورة، وثبّتها بالمراجعة لتُفتح لك الشهادات.
          </p>
        </div>
      ) : (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-ink-900">الإنجازات المتاحة</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {eligible.map((e, i) => (
              <button
                key={`${e.id}-${i}`}
                type="button"
                onClick={() => issue(e.id, { surah: e.surah, juz: e.juz })}
                className="rounded-2xl border border-sand-200 bg-white p-5 text-start shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="text-2xl">🏅</div>
                <div className="mt-2 font-bold text-ink-900">{e.label}</div>
                <div className="mt-1 text-xs text-emerald-700">إصدار الشهادة ←</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
          {error}
        </div>
      )}

      {issued && (
        <section className="space-y-4">
          <Certificate
            name={issued.name}
            surahName={issued.achievementAr}
            ayahCount={0}
            perfection="إتقان"
            issuedAt={new Date(issued.iat).toISOString()}
          />
          <div className="mx-auto max-w-2xl rounded-2xl border border-sand-200 bg-white p-4 text-center">
            <p className="text-xs text-ink-400">رابط التحقق</p>
            <a
              href={issued.verifyUrl}
              className="mt-1 block break-all font-mono text-sm text-emerald-700 hover:underline"
              dir="ltr"
            >
              {issued.verifyUrl}
            </a>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
              هذه شهادة إنجاز رقمية صادرة عن منصة حافظ، وليست إجازة شرعية أو شهادة رسمية.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
