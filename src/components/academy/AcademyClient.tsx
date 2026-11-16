"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getTajweedRule, TAJWEED_RULES } from "@/lib/tajweed";
import { TAJWEED_ACADEMY, type AcademyLesson } from "@/lib/tajweedAcademy";

type LessonRecord = { bestScore: number; attempts: number; passed: boolean; lastAt: string };
type Mode = "student" | "teacher";

function readRecords(): Record<string, LessonRecord> {
  try {
    const raw = localStorage.getItem("hafiz-academy-progress-v1");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LessonRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function LessonExample({ text, note }: { text: string; note: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  const labels = words.map((_, index) => getTajweedRule(words, index));
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5">
      <p className="font-quran text-xl leading-[2.1] text-ink-900 sm:text-2xl" dir="rtl">
        {words.map((word, index) => {
          const rule = labels[index];
          return (
            <span
              key={`${word}-${index}`}
              className={rule ? `tajweed-word tajweed-${rule.id}` : undefined}
              title={rule ? rule.label : undefined}
            >
              {word}{" "}
            </span>
          );
        })}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ink-500">{note}</p>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
      <span className="text-xl" aria-hidden>{icon}</span>
      <div className="mt-2 font-display text-2xl font-black text-emerald-800">{value}</div>
      <div className="mt-0.5 text-[11px] font-semibold text-slate-500">{label}</div>
    </div>
  );
}

export function AcademyClient({ initialLessonId }: { initialLessonId?: string }) {
  const [mode, setMode] = useState<Mode>("student");
  const [records, setRecords] = useState<Record<string, LessonRecord>>({});
  const [ready, setReady] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(
    TAJWEED_ACADEMY.some((lesson) => lesson.id === initialLessonId) ? initialLessonId! : null,
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [projector, setProjector] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(5 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSavedProgress = window.setTimeout(() => {
      setRecords(readRecords());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(loadSavedProgress);
  }, []);

  useEffect(() => {
    if (ready) {
      try { localStorage.setItem("hafiz-academy-progress-v1", JSON.stringify(records)); } catch { /* storage may be unavailable */ }
    }
  }, [ready, records]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const activeLesson = TAJWEED_ACADEMY.find((lesson) => lesson.id === activeLessonId) ?? null;
  const passedCount = Object.values(records).filter((record) => record.passed).length;
  const averageScore = useMemo(() => {
    const scores = Object.values(records).filter((record) => record.attempts > 0).map((record) => record.bestScore);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [records]);
  const currentQuestion = activeLesson?.questions[questionIndex] ?? null;
  const selectedAnswer = answers[questionIndex];
  const nextLesson = TAJWEED_ACADEMY.find((lesson) => !records[lesson.id]?.passed) ?? TAJWEED_ACADEMY[0];
  const units = [...new Set(TAJWEED_ACADEMY.map((lesson) => lesson.unit))];

  const beginLesson = (lesson: AcademyLesson) => {
    setActiveLessonId(lesson.id);
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setCopied(false);
  };

  const answerQuestion = (answer: number) => {
    if (selectedAnswer !== undefined || !currentQuestion) return;
    setAnswers((current) => ({ ...current, [questionIndex]: answer }));
  };

  const advanceQuestion = () => {
    if (!activeLesson || selectedAnswer === undefined) return;
    if (questionIndex + 1 < activeLesson.questions.length) {
      setQuestionIndex((index) => index + 1);
      return;
    }
    const score = activeLesson.questions.reduce((sum, _, index) => {
      const chosen = index === questionIndex ? selectedAnswer : answers[index];
      return sum + (chosen === activeLesson.questions[index].answer ? 1 : 0);
    }, 0);
    const passed = score >= Math.ceil(activeLesson.questions.length * 2 / 3);
    setRecords((current) => {
      const previous = current[activeLesson.id];
      return {
        ...current,
        [activeLesson.id]: {
          bestScore: Math.max(previous?.bestScore ?? 0, Math.round((score / activeLesson.questions.length) * 100)),
          attempts: (previous?.attempts ?? 0) + 1,
          passed: Boolean(previous?.passed || passed),
          lastAt: new Date().toISOString(),
        },
      };
    });
    setResult({ score, passed });
  };

  const retryLesson = () => {
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
  };

  const shareLesson = async (lesson: AcademyLesson) => {
    const url = `${window.location.origin}/academy?lesson=${encodeURIComponent(lesson.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("انسخ رابط الدرس وشاركه مع الصف:", url);
    }
  };

  const enterProjector = (lesson: AcademyLesson) => {
    setActiveLessonId(lesson.id);
    setTimerSeconds(5 * 60);
    setTimerRunning(false);
    setProjector(true);
  };

  useEffect(() => {
    if (!activeLessonId) return;
    window.requestAnimationFrame(() => document.getElementById("academy-lesson")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [activeLessonId]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-12" dir="rtl">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#092d31] px-5 py-7 text-white shadow-xl sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300" /> برنامج تعلّم القرآن والتجويد للمدارس
            </p>
            <h1 className="mt-4 font-display text-3xl font-black leading-tight sm:text-5xl">من القاعدة إلى التلاوة المتقنة</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
              مسار دراسي قصير، تدريب تفاعلي، وتقويم بنّاء للطالب؛ مع خطة حصة وأدوات عرض جاهزة للمعلم.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-emerald-50/90">
              {["١٢ درساً متدرجاً", "اختبار بعد كل درس", "خطة صفية للطباعة", "يعمل على الهاتف واللوح"].map((label) => (
                <span key={label} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">{label}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/15 bg-white/10 p-1.5" role="tablist" aria-label="نوع الاستخدام">
            <button type="button" role="tab" aria-selected={mode === "student"} onClick={() => setMode("student")} className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${mode === "student" ? "bg-white text-emerald-900 shadow" : "text-white hover:bg-white/10"}`}>مسار الطالب</button>
            <button type="button" role="tab" aria-selected={mode === "teacher"} onClick={() => setMode("teacher")} className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${mode === "teacher" ? "bg-white text-emerald-900 shadow" : "text-white hover:bg-white/10"}`}>عدة المعلم</button>
          </div>
        </div>
      </section>

      {mode === "student" ? (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="ملخص المسار">
            <StatCard icon="📘" value={`${passedCount.toLocaleString("ar-EG")} / ${TAJWEED_ACADEMY.length.toLocaleString("ar-EG")}`} label="دروس مجتازة على هذا الجهاز" />
            <StatCard icon="🎯" value={`${averageScore.toLocaleString("ar-EG")}٪`} label="أفضل النتائج المسجلة" />
            <StatCard icon="🧭" value={nextLesson.level} label="المستوى التالي" />
            <StatCard icon="⏱️" value="١٠–١٥" label="دقيقة للحصة القصيرة" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-emerald-700">خطة تعلّم واضحة</p>
                  <h2 className="mt-1 font-display text-xl font-black text-ink-900 sm:text-2xl">المسار من الأساس إلى التطبيق</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-800">{Math.round((passedCount / TAJWEED_ACADEMY.length) * 100).toLocaleString("ar-EG")}٪ مكتمل</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-blue-500 transition-all" style={{ width: `${(passedCount / TAJWEED_ACADEMY.length) * 100}%` }} /></div>
              <div className="mt-6 space-y-6">
                {units.map((unit) => (
                  <div key={unit}>
                    <h3 className="mb-2 text-xs font-black text-slate-500">{unit}</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {TAJWEED_ACADEMY.filter((lesson) => lesson.unit === unit).map((lesson, index) => {
                        const record = records[lesson.id];
                        const isNext = lesson.id === nextLesson.id;
                        return (
                          <button key={lesson.id} type="button" onClick={() => beginLesson(lesson)} className={`group flex items-center gap-3 rounded-2xl border p-3 text-right transition hover:-translate-y-0.5 hover:shadow-md ${record?.passed ? "border-emerald-200 bg-emerald-50/60" : isNext ? "border-blue-200 bg-blue-50/50" : "border-slate-100 bg-white hover:border-emerald-200"}`}>
                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black ${record?.passed ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800"}`}>{record?.passed ? "✓" : (index + 1).toLocaleString("ar-EG")}</span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className="font-display text-sm font-black text-slate-800">{lesson.title}</span>
                                <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] text-slate-500">{lesson.level}</span>
                              </span>
                              <span className="mt-0.5 block truncate text-[10px] text-slate-500">{record?.passed ? `أفضل نتيجة ${record.bestScore}٪` : `${lesson.minutes} دقائق · ${lesson.objective}`}</span>
                            </span>
                            <span className="text-slate-300 group-hover:text-emerald-600" aria-hidden>←</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-900 p-5 text-white shadow-lg sm:p-6">
                <div className="text-xs font-bold text-emerald-100">حصتك القادمة</div>
                <h2 className="mt-2 font-display text-2xl font-black">{nextLesson.title}</h2>
                <p className="mt-2 text-sm leading-6 text-emerald-50/80">{nextLesson.objective}</p>
                <button type="button" onClick={() => beginLesson(nextLesson)} className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50">ابدأ الدرس · {nextLesson.minutes} دقائق</button>
              </div>
              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
                <div className="flex items-center gap-2 font-black text-blue-950"><span>🗣️</span> تعلّم بالأداء لا بالألوان فقط</div>
                <p className="mt-2 text-xs leading-6 text-slate-600">اقرأ المثال ببطء، استمع إلى معلّم متقن، ثم أعد التلاوة. الاختبار هنا يقيس فهم القاعدة، ولا يستطيع وحده الحكم على مخارج الحروف أو صحة الصوت.</p>
                <Link href="/mushaf" className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-black text-blue-800 ring-1 ring-blue-100">افتح المصحف للتطبيق ←</Link>
              </div>
            </aside>
          </section>

          {activeLesson && <LessonWorkspace lesson={activeLesson} questionIndex={questionIndex} answers={answers} selectedAnswer={selectedAnswer} result={result} onAnswer={answerQuestion} onAdvance={advanceQuestion} onRetry={retryLesson} onShare={() => void shareLesson(activeLesson)} copied={copied} />}
        </>
      ) : (
        <TeacherToolkit
          onTeach={enterProjector}
          onShare={shareLesson}
          copied={copied}
          onPrint={() => window.print()}
        />
      )}

      {projector && activeLesson && (
        <div className="academy-projector fixed inset-0 z-[300] flex flex-col overflow-auto bg-[#071b22] px-5 py-5 text-white sm:px-10 sm:py-7" dir="rtl" role="dialog" aria-modal="true" aria-label="وضع العرض الصفي">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div><div className="text-xs font-bold text-emerald-300">عرض صفي · {activeLesson.unit}</div><div className="mt-1 font-display text-xl font-black">{activeLesson.title}</div></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={toggleFullscreen} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold hover:bg-white/10">⛶ ملء الشاشة</button>
              <button type="button" onClick={() => { setProjector(false); setTimerRunning(false); }} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-900">إنهاء العرض ✕</button>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-8">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-bold text-emerald-200">هدف الحصة</p>
              <h2 className="mt-3 font-display text-2xl font-black leading-relaxed sm:text-4xl">{activeLesson.objective}</h2>
              <div className="mx-auto mt-8 max-w-4xl rounded-[2rem] border border-white/10 bg-white/[.06] p-6 sm:p-10">
                <div className="text-xs font-black text-amber-200">{activeLesson.cue}</div>
                <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 font-quran text-3xl leading-[2.2] sm:text-5xl">
                  {activeLesson.examples[0]?.text.split(/\s+/).map((word, index, words) => {
                    const rule = getTajweedRule(words, index);
                    return <span key={`${word}-${index}`} className={rule ? `tajweed-word tajweed-${rule.id}` : ""}>{word}</span>;
                  })}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/70">{activeLesson.examples[0]?.note}</p>
              </div>
            </div>
            <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => setTimerRunning((running) => !running)} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-black text-emerald-950">{timerRunning ? "إيقاف المؤقت" : "ابدأ مؤقت التدريب"}</button>
              <button type="button" onClick={() => { setTimerRunning(false); setTimerSeconds(5 * 60); }} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold">إعادة ضبط ٥ دقائق</button>
              <span className="rounded-xl bg-white/10 px-4 py-2.5 font-mono text-lg font-black" dir="ltr">{String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:{String(timerSeconds % 60).padStart(2, "0")}</span>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["ما العلامة أو الحرف الذي لاحظته؟", "أدّ المثال ببطء، ثم استمع للتصحيح.", "اطلب من طالب أن يذكر القاعدة بكلماته."].map((prompt, index) => <div key={prompt} className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><span className="text-xs font-black text-emerald-300">سؤال نقاش {index + 1}</span><p className="mt-2 text-sm leading-6 text-white/85">{prompt}</p></div>)}
            </div>
          </div>
        </div>
      )}

      <footer className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-6 text-amber-950">
        أداة رقمية مساندة وليست بديلاً عن التلقي على معلّم مؤهل. نتائج الاختبارات تحفظ في هذا المتصفح فقط في هذه النسخة؛ لا تُزامَن بعد بين أجهزة الطلاب أو حساب المعلم. لا تدخل أسماء أو بيانات شخصية للطلاب.
      </footer>
    </div>
  );
}

function LessonWorkspace({
  lesson, questionIndex, answers, selectedAnswer, result, onAnswer, onAdvance, onRetry, onShare, copied,
}: {
  lesson: AcademyLesson;
  questionIndex: number;
  answers: Record<number, number>;
  selectedAnswer: number | undefined;
  result: { score: number; passed: boolean } | null;
  onAnswer: (answer: number) => void;
  onAdvance: () => void;
  onRetry: () => void;
  onShare: () => void;
  copied: boolean;
}) {
  const question = lesson.questions[questionIndex];
  const isCorrect = selectedAnswer === question?.answer;
  return (
    <section id="academy-lesson" className="scroll-mt-24 rounded-3xl border border-emerald-200 bg-white p-5 shadow-lg sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-black text-emerald-700">{lesson.unit} · {lesson.level} · {lesson.minutes} دقائق</p><h2 className="mt-1 font-display text-2xl font-black text-ink-900">{lesson.title}</h2></div>
        <button type="button" onClick={onShare} className="rounded-xl border border-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50">{copied ? "نُسخ رابط الدرس ✓" : "مشاركة الدرس"}</button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-emerald-50 p-4"><div className="text-xs font-black text-emerald-900">القاعدة</div><p className="mt-2 text-sm leading-7 text-slate-700">{lesson.idea}</p></div>
          <div className="rounded-2xl border-r-4 border-amber-400 bg-amber-50 p-4"><div className="text-xs font-black text-amber-900">مفتاح التذكر</div><p className="mt-1 text-sm font-bold leading-7 text-slate-700">{lesson.cue}</p></div>
          <div className="space-y-2"><h3 className="text-xs font-black text-slate-600">أمثلة مع تلميح لوني</h3>{lesson.examples.map((example) => <LessonExample key={example.text} {...example} />)}</div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><div className="text-xs font-black text-blue-900">اختبر فهمك</div><div className="mt-1 text-[10px] text-slate-500">السؤال {(questionIndex + 1).toLocaleString("ar-EG")} من {lesson.questions.length.toLocaleString("ar-EG")}</div></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-blue-800">اجتياز من ٢/٣</span></div>
          {result ? (
            <div className="mt-5 rounded-2xl bg-white p-5 text-center shadow-sm" role="status">
              <div className="text-4xl">{result.passed ? "🌟" : "🌱"}</div>
              <h3 className="mt-2 font-display text-xl font-black text-slate-900">{result.passed ? "أحسنت، اجتزت الدرس" : "تحتاج محاولة أخرى"}</h3>
              <p className="mt-1 text-sm text-slate-600">إجابات صحيحة: {result.score} من {lesson.questions.length}</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">{result.passed ? "ثبّت القاعدة بالتلاوة أمام معلّمك، ثم تابع الدرس التالي." : "راجع القاعدة والأمثلة، ثم أعد الاختبار بهدوء."}</p>
              <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white">أعد الاختبار</button>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm font-bold leading-7 text-slate-800">{question?.prompt}</p>
              <div className="mt-3 space-y-2">
                {question?.options.map((option, index) => {
                  const chosen = selectedAnswer === index;
                  const correct = index === question.answer;
                  const reveal = selectedAnswer !== undefined;
                  return <button key={option} type="button" disabled={reveal} onClick={() => onAnswer(index)} className={`w-full rounded-xl border px-3 py-3 text-right text-xs font-bold leading-5 transition disabled:cursor-default ${reveal && correct ? "border-emerald-300 bg-emerald-50 text-emerald-900" : chosen ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-100 bg-white text-slate-700 hover:border-blue-300"}`}><span className="ml-2 inline-grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px]">{String.fromCharCode(0x627 + index)}</span>{option}</button>;
                })}
              </div>
              {selectedAnswer !== undefined && <p className={`mt-3 rounded-xl p-3 text-xs leading-6 ${isCorrect ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>{isCorrect ? "إجابة صحيحة. " : "راجع هذه النقطة. "}{question.explanation}</p>}
              <button type="button" disabled={selectedAnswer === undefined} onClick={onAdvance} className="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3 text-xs font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">{questionIndex + 1 === lesson.questions.length ? "اعرض النتيجة" : "السؤال التالي ←"}</button>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-500"><span>بعد الاختبار: اقرأ الأمثلة بصوت مسموع، واستعن بالمعلّم لتصحيح الأداء.</span><span>{Object.keys(answers).length.toLocaleString("ar-EG")} إجابات مسجلة في المحاولة الحالية</span></div>
    </section>
  );
}

function TeacherToolkit({ onTeach, onShare, copied, onPrint }: { onTeach: (lesson: AcademyLesson) => void; onShare: (lesson: AcademyLesson) => void; copied: boolean; onPrint: () => void }) {
  const [selectedId, setSelectedId] = useState(TAJWEED_ACADEMY[0].id);
  const lesson = TAJWEED_ACADEMY.find((item) => item.id === selectedId) ?? TAJWEED_ACADEMY[0];
  const stages = [
    ["تهيئة واستماع", "٥ دقائق", "استمع للمثال كاملاً قبل شرح الاسم."],
    ["اكتشاف القاعدة", "٨ دقائق", "وجّه الطلاب لاكتشاف العلامة والحرف المؤثر."],
    ["نمذجة موجّهة", "١٠ دقائق", "اقرأ المثال ببطء، وأظهر المخرج دون مبالغة."],
    ["تدريب ثنائي", "١٢ دقيقة", "قارئ ومستمع؛ ملاحظة واحدة واضحة ثم تبديل الدور."],
    ["بطاقة خروج", "٥ دقائق", "سؤال قصير: ما الحكم؟ ما دليلك؟"],
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="space-y-4">
        <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-indigo-700">دليل المعلّم</p><h2 className="mt-1 font-display text-2xl font-black text-slate-900">خطة حصة جاهزة · ٤٠ دقيقة</h2></div><button type="button" onClick={onPrint} className="rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-800">طباعة الخطة ⎙</button></div>
          <div className="mt-5 space-y-2">{stages.map(([title, duration, tip], index) => <div key={title} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-xs font-black text-indigo-700">{(index + 1).toLocaleString("ar-EG")}</span><span><span className="block text-sm font-black text-slate-800">{title}</span><span className="mt-0.5 block text-[10px] leading-5 text-slate-500">{tip}</span></span><span className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-600">{duration}</span></div>)}</div>
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4"><div className="text-xs font-black text-amber-950">سُلّم ملاحظة بنّاء</div><div className="mt-2 grid gap-2 sm:grid-cols-3">{["حدّد الحرف والعلامة", "أدّ الحكم في موضعه", "أعد القراءة بعد الملاحظة"].map((item, index) => <div key={item} className="rounded-xl bg-white/80 p-3 text-xs leading-5 text-slate-700"><b className="ml-1 text-amber-700">{index + 1}.</b>{item}</div>)}</div></div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-black text-slate-500">المنهج المقترح</p><h2 className="mt-1 font-display text-xl font-black text-slate-900">خارطة ٥ أسابيع</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">قابلة للتعديل حسب مستوى الصف</span></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{unitsForTeacher().map((unit, index) => <div key={unit} className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-black text-indigo-700">الأسبوع {(index + 1).toLocaleString("ar-EG")}</div><div className="mt-1 text-sm font-black text-slate-800">{unit}</div><div className="mt-1 text-[10px] leading-5 text-slate-500">حصتان تعلّم + مراجعة قصيرة + تقويم شفهي</div></div>)}</div>
          <p className="mt-3 text-[10px] leading-6 text-slate-500">ليس جدولاً وزارياً ثابتاً؛ يكيّفه المعلم وفق العمر، والتمكن السابق، والمنهج المعتمد في المدرسة.</p>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-[#102e49] p-5 text-white shadow-lg sm:p-6">
          <p className="text-xs font-black text-sky-200">لوحة العرض الصفي</p>
          <h2 className="mt-1 font-display text-xl font-black">اختر قاعدة لعرضها على السبورة</h2>
          <label className="mt-4 block text-[10px] font-bold text-white/70" htmlFor="academy-teacher-lesson">الدرس</label>
          <select id="academy-teacher-lesson" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-3 text-sm font-bold text-slate-900">
            {TAJWEED_ACADEMY.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <p className="mt-3 text-xs leading-6 text-white/75">{lesson.objective}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onTeach(lesson)} className="flex-1 rounded-xl bg-emerald-300 px-3 py-3 text-xs font-black text-emerald-950">ابدأ وضع العرض ⛶</button>
            <button type="button" onClick={() => onShare(lesson)} className="rounded-xl border border-white/20 px-3 py-3 text-xs font-bold hover:bg-white/10">{copied ? "نُسخ الرابط ✓" : "نسخ رابط الدرس"}</button>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black text-emerald-700">معايير التقويم الشفهي</p>
          <div className="mt-3 space-y-2">{["التعرّف على موضع الحكم", "سلامة مخرج الحرف", "تطبيق الغنة أو المد باعتدال", "الوقف والابتداء بما يحفظ المعنى"].map((criterion, index) => <div key={criterion} className="flex items-center gap-3 rounded-xl bg-emerald-50/70 p-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-xs font-black text-emerald-700">{(index + 1).toLocaleString("ar-EG")}</span><span className="text-xs font-semibold text-slate-700">{criterion}</span></div>)}</div>
          <Link href="/mushaf" className="mt-3 flex items-center justify-center rounded-xl border border-emerald-100 px-3 py-2.5 text-xs font-black text-emerald-800 hover:bg-emerald-50">حضّر الآيات من المصحف ←</Link>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[10px] leading-6 text-amber-950">
          لحماية الأطفال، لا توجد أسماء طلاب أو سجل صفّي مشترك في هذه النسخة. التقدّم التدريبي محلي على الجهاز؛ مزامنة صف كامل بين أجهزة المدرسة تحتاج ربط حسابات وصلاحيات مدرسية.
        </div>
      </aside>
    </div>
  );
}

function unitsForTeacher() {
  return [...new Set(TAJWEED_ACADEMY.map((lesson) => lesson.unit))];
}
