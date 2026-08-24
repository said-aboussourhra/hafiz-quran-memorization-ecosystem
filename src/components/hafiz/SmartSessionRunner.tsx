"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { HafizTeacher } from "@/lib/hafiz/useHafiz";
import { METHODS } from "@/lib/hafiz/session";
import { CorrectionPanel } from "./CorrectionPanel";
import type { MistakeType } from "@/lib/hafiz/profile";
import type { QuranAyah, SurahContent } from "@/lib/quran";

function wordSplit(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

interface Gap {
  masked: string;
  answer: string;
  options: string[];
}

/** Build a deterministic-ish (step-keyed) word-gap quiz for a test step. */
function buildGap(ayah: QuranAyah | undefined, stepKey: string): Gap | null {
  if (!ayah) return null;
  const words = wordSplit(ayah.text);
  const content = words
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => w.replace(/[^\u0600-\u06FF]/g, "").length >= 3);
  if (content.length < 2) return null;
  // Seeded pick so the gap stays stable across re-renders of the same step.
  let h = 0;
  for (let i = 0; i < stepKey.length; i++) h = (h * 31 + stepKey.charCodeAt(i)) >>> 0;
  const target = content[h % content.length];
  const distractors = content
    .filter((c) => c.i !== target.i)
    .sort((a, b) => {
      const ha = (h + a.i * 7) % 100;
      const hb = (h + b.i * 13) % 100;
      return ha - hb;
    })
    .slice(0, 3)
    .map((c) => c.w);
  const options = [...distractors, target.w].sort((a, b) => {
    const ha = (h + a.length * 17) % 100;
    const hb = (h + b.length * 19) % 100;
    return ha - hb;
  });
  const masked = words.map((w, i) => (i === target.i ? "⋯" : w)).join(" ");
  return { masked, answer: target.w, options };
}

/**
 * The Smart Session runner — presents each step of the adaptive lesson:
 * listen → read → repeat → hide → recite → correct → retry → test.
 *
 * Quran text is drawn verbatim from verified `SurahContent`; this component
 * only HIDES or SHOWS it, never modifies it.
 */
export function SmartSessionRunner({
  teacher,
  surah,
  onExit,
  onListenAyah,
}: {
  teacher: HafizTeacher;
  surah: SurahContent;
  onExit: () => void;
  /** Play the current ayah's recitation (optional; supplied by the reader). */
  onListenAyah?: (ayah: number) => void;
}) {
  const {
    session,
    currentItem,
    currentStep,
    itemIndex,
    stepIndex,
    gradeCurrent,
    scoreCurrentTest,
    advance,
    endSession,
    addStudySeconds,
    recordMistake,
  } = teacher;

  // Report study seconds when the runner unmounts (start time captured in effect).
  useEffect(() => {
    const startedAt = Date.now();
    return () => {
      addStudySeconds(Math.round((Date.now() - startedAt) / 1000));
    };
  }, [addStudySeconds]);

  const [showAnswer, setShowAnswer] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correction, setCorrection] = useState<{
    word: string | null;
    type: MistakeType;
  } | null>(null);

  const ayah: QuranAyah | undefined = useMemo(() => {
    if (!currentItem) return undefined;
    return surah.ayahs.find((a) => a.numberInSurah === currentItem.ayah);
  }, [currentItem, surah.ayahs]);

  const stepKey = `${itemIndex}:${stepIndex}`;
  const gap = useMemo(
    () => (currentStep?.kind === "test" ? buildGap(ayah, stepKey) : null),
    [currentStep, ayah, stepKey],
  );

  // Reset transient UI whenever the step changes (hook before early return).
  useResetOnKeyChange(stepKey, () => {
    setShowAnswer(false);
    setPicked(null);
    setFeedback(null);
    setCorrection(null);
  });

  if (!session || !currentItem || !currentStep || !ayah) return null;

  const totalSteps = currentItem.steps.length;
  const methodInfo = METHODS[currentItem.method];
  const isRecite = currentStep.kind === "recite" || currentStep.kind === "retry";
  const isTest = currentStep.kind === "test";
  const isListen = currentStep.kind === "listen";
  const textHidden = currentStep.hidden && !showAnswer && !isTest;

  const finishWith = (grade: 0 | 1 | 2 | 3 | 4) => {
    gradeCurrent(grade, currentStep.hidden);
    // For honest hidden-recall failures, record the mistake and surface the
    // encouraging correction panel instead of silently advancing.
    if (currentStep.hidden && grade < 2) {
      const words = wordSplit(ayah.text);
      const knownMiss = (teacher.ayahProgress(currentItem.surah, currentItem.ayah)
        ?.weakWords ?? [])[0];
      const idx = knownMiss?.index ?? Math.floor(words.length / 2);
      const word = words[idx] ?? null;
      const type: MistakeType =
        grade === 0 ? "MISSING_WORD" : grade === 1 ? "WRONG_WORD" : "HESITATION";
      recordMistake(currentItem.surah, currentItem.ayah, type, word ? idx : null);
      setCorrection({ word, type });
      return;
    }
    advance();
  };

  const pickOption = (opt: string) => {
    if (!gap || picked) return;
    setPicked(opt);
    if (opt === gap.answer) {
      setFeedback("أحسنت! إجابة صحيحة.");
      scoreCurrentTest(1, []);
    } else {
      setFeedback(`الكلمة الصحيحة: «${gap.answer}»`);
      const missedIndex = wordSplit(ayah.text).indexOf(gap.answer);
      scoreCurrentTest(0.3, missedIndex >= 0 ? [missedIndex] : undefined);
      recordMistake(
        currentItem.surah,
        currentItem.ayah,
        "WRONG_WORD",
        missedIndex >= 0 ? missedIndex : null,
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-cream-50" role="dialog" aria-label="جلسة ذكية">
        <SessionHeader
          methodLabel={methodInfo.ar}
          ayah={currentItem.ayah}
          itemIndex={itemIndex}
          totalItems={session.items.length}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          onExit={() => {
            endSession();
            onExit();
          }}
        />

        <main className="flex flex-1 flex-col items-center justify-center px-5 py-6">
          <div className="mx-auto w-full max-w-2xl">
            <p className="mb-4 text-center text-lg font-semibold text-ink-800">{currentStep.prompt}</p>

            <div
              className="relative rounded-2xl border border-sand-300 bg-white p-6 text-center shadow-sm"
              dir="rtl"
            >
              {isTest && gap ? (
                <>
                  <p className="text-3xl leading-[2.4] text-ink-900">{gap.masked}</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {gap.options.map((opt) => {
                      const isCorrect = opt === gap.answer;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={!!picked}
                          onClick={() => pickOption(opt)}
                          className={`rounded-xl border px-4 py-2 text-lg transition ${
                            picked && isCorrect
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                              : picked && opt === picked
                                ? "border-red-400 bg-red-50 text-red-700"
                                : "border-sand-400 bg-cream-50 text-ink-800 hover:bg-cream-100"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {feedback && <p className="mt-4 text-sm font-semibold text-ocean-700">{feedback}</p>}
                </>
              ) : currentStep.hideLevel && currentStep.hideLevel > 1 ? (
                <GradualHidingText
                  text={ayah.text}
                  level={currentStep.hideLevel}
                  revealed={showAnswer}
                />
              ) : (
                <p
                  className="text-3xl leading-[2.4] text-ink-900 transition"
                  style={{
                    color: textHidden ? "transparent" : undefined,
                    textShadow: textHidden ? "0 0 22px rgba(15,23,42,0.55)" : undefined,
                    userSelect: textHidden ? "none" : "auto",
                  }}
                  aria-hidden={textHidden}
                >
                  {ayah.text}
                </p>
              )}
              {currentStep.hideLevel && currentStep.hideLevel > 1 && !showAnswer && (
                <div className="mt-3 flex items-center justify-center gap-1.5" aria-label={`مستوى الإخفاء ${currentStep.hideLevel} من 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`h-1.5 w-6 rounded-full transition ${
                        n <= (currentStep.hideLevel ?? 1) ? "bg-ocean-500" : "bg-sand-300"
                      }`}
                    />
                  ))}
                  <span className="ms-2 text-[11px] text-ink-400">
                    إخفاء {currentStep.hideLevel}/5
                  </span>
                </div>
              )}
              {textHidden && (!currentStep.hideLevel || currentStep.hideLevel >= 5) && (
                <p className="mt-2 text-xs text-ink-400">النص مخفي — استرجعه من الذاكرة</p>
              )}
            </div>

            {isListen && (
              <p className="mt-3 text-center text-xs text-ink-500">
                استخدم عناصر التشغيل في الأسفل للاستماع إلى هذه الآية.
              </p>
            )}
          </div>
        </main>

        <footer className="border-t border-sand-300/70 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            {textHidden && (
              <button
                type="button"
                onClick={() => setShowAnswer(true)}
                className="rounded-lg border border-sand-400 bg-cream-50 py-2 text-sm text-ink-700 hover:bg-cream-100"
              >
                إظهار النص للمقارنة
              </button>
            )}

            {(isRecite || showAnswer) && (
              <div>
                <p className="mb-2 text-center text-xs text-ink-500">
                  بعد التسميع من الذاكرة، قيّم أداءك بصدق:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <GradeButton label="لم أتذكر" tone="red" onClick={() => finishWith(0)} />
                  <GradeButton label="أخطأت كثيرًا" tone="orange" onClick={() => finishWith(1)} />
                  <GradeButton label="بصعوبة" tone="amber" onClick={() => finishWith(2)} />
                  <GradeButton label="صحيح" tone="emerald" onClick={() => finishWith(3)} />
                </div>
                <button
                  type="button"
                  onClick={() => finishWith(4)}
                  className="mt-2 w-full rounded-lg bg-gradient-to-l from-emerald-500 to-ocean-500 py-2.5 text-sm font-bold text-white"
                >
                  متقن — بدون أخطاء
                </button>
              </div>
            )}

            {isTest && picked && (
              <button
                type="button"
                onClick={advance}
                className="w-full rounded-lg bg-gradient-to-l from-emerald-500 to-ocean-500 py-2.5 text-sm font-bold text-white"
              >
                التالي
              </button>
            )}

            {!isRecite && !isTest && !textHidden && (
              <button
                type="button"
                onClick={advance}
                className="w-full rounded-lg bg-gradient-to-l from-emerald-500 to-ocean-500 py-2.5 text-sm font-bold text-white"
              >
                {currentStep.kind === "correct" ? "تم — التالي" : "التالي"}
              </button>
            )}
          </div>
        </footer>

        {correction && (
          <CorrectionPanel
            word={correction.word}
            mistakeType={correction.type}
            onListen={
              onListenAyah ? () => onListenAyah(currentItem.ayah) : undefined
            }
            onRetry={() => {
              // Show the text once for comparison, then let the learner try again.
              setShowAnswer(true);
              setCorrection(null);
            }}
            onDrill={() => {
              // Restart this ayah's recite step.
              setShowAnswer(false);
              setCorrection(null);
            }}
            onDismiss={() => {
              setCorrection(null);
              advance();
            }}
          />
        )}
      </div>
  );
}

/* ---------- small presentational helpers ---------- */

/**
 * Renders the verified Quran text with progressive word masking.
 * The text is NEVER altered — only hidden/revealed.
 * Level 1 = full, 2 = ~30% hidden, 3 = ~50% (content words),
 * 4 = ~75% hidden, 5 = all hidden.
 */
function GradualHidingText({
  text,
  level,
  revealed,
}: {
  text: string;
  level: 1 | 2 | 3 | 4 | 5;
  revealed: boolean;
}) {
  const words = useMemo(() => wordSplit(text), [text]);
  const hiddenSet = useMemo(() => {
    if (revealed) return new Set<number>();
    const set = new Set<number>();
    if (level <= 1) return set;
    const ratio = level === 2 ? 0.3 : level === 3 ? 0.5 : level === 4 ? 0.75 : 1;
    // Deterministic spread so the mask is stable for this text.
    for (let i = 0; i < words.length; i++) {
      const isContent = words[i].replace(/[^\u0600-\u06FF]/g, "").length >= 3;
      const threshold = level === 3 ? (isContent ? 0.45 : 0.65) : ratio;
      // Pseudo-random but stable per index.
      const v = ((i * 9301 + 49297) % 233280) / 233280;
      if (v < threshold) set.add(i);
    }
    return set;
  }, [words, level, revealed]);

  return (
    <p className="text-3xl leading-[2.4] text-ink-900" dir="rtl">
      {words.map((w, i) => (
        <span
          key={i}
          className="mx-0.5 inline-block rounded transition"
          style={
            hiddenSet.has(i)
              ? {
                  color: "transparent",
                  textShadow: "0 0 18px rgba(15,23,42,0.45)",
                  userSelect: "none",
                }
              : undefined
          }
          aria-hidden={hiddenSet.has(i)}
        >
          {w}
        </span>
      ))}
    </p>
  );
}

function SessionHeader({
  methodLabel,
  ayah,
  itemIndex,
  totalItems,
  stepIndex,
  totalSteps,
  onExit,
}: {
  methodLabel: string;
  ayah: number;
  itemIndex: number;
  totalItems: number;
  stepIndex: number;
  totalSteps: number;
  onExit: () => void;
}) {
  return (
    <header className="border-b border-sand-300/70 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="rounded-lg px-3 py-1.5 text-sm text-ink-600 hover:bg-cream-100"
        >
          إنهاء
        </button>
        <div className="text-center">
          <div className="text-xs font-semibold text-ocean-700">{methodLabel}</div>
          <div className="text-[11px] text-ink-500">
            الآية {ayah.toLocaleString("ar-EG")} · {(itemIndex + 1).toLocaleString("ar-EG")} /{" "}
            {totalItems.toLocaleString("ar-EG")}
          </div>
        </div>
        <div className="text-xs tabular-nums text-ink-500">
          {(stepIndex + 1).toLocaleString("ar-EG")}/{totalSteps.toLocaleString("ar-EG")}
        </div>
      </div>
      <div className="mx-auto mt-2 h-1.5 max-w-2xl overflow-hidden rounded-full bg-sand-300/60">
        <div
          className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-ocean-500 transition-all"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </header>
  );
}

function GradeButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "red" | "orange" | "amber" | "emerald";
  onClick: () => void;
}) {
  const tones: Record<string, string> = {
    red: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
    orange: "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100",
    amber: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${tones[tone]}`}
    >
      {label}
    </button>
  );
}

/* ---------- react-compiler-safe effect helper ---------- */

function useResetOnKeyChange(key: string, reset: () => void) {
  useEffect(() => {
    reset();
    // reset intentionally runs whenever the step key changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
