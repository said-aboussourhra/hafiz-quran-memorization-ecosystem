import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import {
  getProgressStats,
  getUserProgress,
  getReviewQueue,
  getActivityDays,
  computeStreak,
  buildHeatmap,
  getBadges,
  getJuzProgress,
  lastWeek,
} from "@/lib/progress";

import { planForRemaining, PACES, JUZ_INFO } from "@/lib/plan";
import { getSurah, SURAHS } from "@/lib/surahs";

import { PersonalDhikr } from "@/components/PersonalDhikr";
import { Heatmap } from "@/components/Heatmap";
import { WeeklyBars } from "@/components/WeeklyBars";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  mastered: "#047857",
  memorized: "#10b981",
  learning: "#3b82f6",
};

const STATUS_LABEL: Record<string, string> = {
  mastered: "متقَن",
  memorized: "محفوظ",
  learning: "قيد الحفظ",
};

export default async function DashboardPage() {
  /* -----------------------------------------------------------------------
     AUTH
  ----------------------------------------------------------------------- */

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  /* -----------------------------------------------------------------------
     DATA
     يتم تنفيذ الاستدعاءات بشكل منفصل لتسهيل تحديد أي خدمة تسبب Runtime Error.
  ----------------------------------------------------------------------- */

  const stats = await getProgressStats(user.id);
  const map = await getUserProgress(user.id);
  const review = await getReviewQueue(user.id);
  const days = await getActivityDays(user.id);
  const badgeData = await getBadges(user.id);
  const juz = await getJuzProgress(user.id);

  /* -----------------------------------------------------------------------
     DERIVED DATA
  ----------------------------------------------------------------------- */

  const streak = computeStreak(days);
  const heatmap = buildHeatmap(days);

  const week = lastWeek(days);
  const weekTotal = week.reduce((sum, day) => sum + day.count, 0);

  const startedNums = new Set(map.keys());

  const suggested =
    [...SURAHS]
      .reverse()
      .find((surah) => !startedNums.has(surah.number)) ?? SURAHS[0];

  const remaining = Math.max(
    0,
    stats.totalAyahs - stats.memorizedAyahs,
  );

  const plan = planForRemaining(
    remaining,
    PACES[1].ayahsPerDay,
  );

  const dueReviews = review.filter(
    (item) => item.dueIn <= 0,
  );

  const inProgress = [...map.values()]
    .filter((item) => item.memorizedAyahs > 0)
    .sort(
      (a, b) =>
        b.surahNumber - a.surahNumber,
    )
    .slice(0, 6);

  const nextBadge =
    badgeData.badges.find(
      (badge) => !badge.earned,
    );

  const earnedBadges =
    badgeData.badges.filter(
      (badge) => badge.earned,
    );

  const completedJuz =
    juz.filter(
      (item) => item.pct >= 100,
    ).length;

  const ringPct = Math.min(
    100,
    Math.max(0, stats.completionPct),
  );

  const R = 78;
  const C = 2 * Math.PI * R;

  const todayKey =
    new Date()
      .toISOString()
      .slice(0, 10);

  const activeToday =
    (days.get(todayKey) ?? 0) > 0;

  const hour =
    new Date().getHours();

  const greeting =
    hour < 12
      ? "صباح الخير"
      : hour < 18
        ? "طاب يومك"
        : "مساء الخير";

  /* -----------------------------------------------------------------------
     UI
  ----------------------------------------------------------------------- */

  return (
    <div
      dir="rtl"
      className="space-y-6"
    >
      {/* ================================================================
          HERO
      ================================================================= */}

      <section
        className="relative overflow-hidden rounded-3xl p-5 sm:rounded-[2rem] sm:p-8"
        style={{
          background:
            "linear-gradient(135deg,#0d7a6b 0%,#059669 45%,#1d4ed8 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(255,255,255,0.18),transparent 70%)",
          }}
        />

        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-52 w-52 rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(255,255,255,0.12),transparent 70%)",
          }}
        />

        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-right">
            <p className="text-sm text-white/70">
              {greeting} 🌿
            </p>

            <h1 className="mt-1 truncate font-display text-2xl font-black text-white sm:text-3xl lg:text-4xl">
              {user.name}
            </h1>

            <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-3 backdrop-blur">
              <span className="text-3xl">
                {streak.current > 0
                  ? "🔥"
                  : "🌱"}
              </span>

              <div className="text-right">
                <div className="font-display text-2xl font-black text-white">
                  {streak.current.toLocaleString(
                    "ar-EG",
                  )}

                  <span className="text-base font-bold">
                    {" "}
                    يوم
                  </span>
                </div>

                <div className="text-[11px] text-white/70">
                  سلسلة المواظبة{" "}
                  {activeToday
                    ? "· نشِط اليوم ✓"
                    : "· تابع اليوم"}
                </div>
              </div>

              <div className="mr-3 border-r border-white/25 pr-3 text-right">
                <div className="font-display text-lg font-bold text-white">
                  {streak.best.toLocaleString(
                    "ar-EG",
                  )}
                </div>

                <div className="text-[10px] text-white/60">
                  الأطول
                </div>
              </div>
            </div>
          </div>

          {/* Progress ring */}

          <div className="relative mt-2 grid h-40 w-40 shrink-0 place-items-center sm:mt-0 sm:h-48 sm:w-48">
            <svg
              className="h-40 w-40 -rotate-90 sm:h-48 sm:w-48"
              viewBox="0 0 180 180"
            >
              <circle
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="12"
              />

              <circle
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke="#ffffff"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={
                  C -
                  (ringPct / 100) * C
                }
              />
            </svg>

            <div className="absolute text-center text-white">
              <div className="font-display text-3xl font-black sm:text-4xl">
                {stats.completionPct}٪
              </div>

              <div className="text-xs text-white/70">
                من القرآن
              </div>

              <div className="mt-1 text-[11px] text-white/60">
                {stats.memorizedAyahs.toLocaleString(
                  "ar-EG",
                )}{" "}
                آية
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          QUICK STATS
      ================================================================= */}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            value:
              stats.completedSurahs.toLocaleString(
                "ar-EG",
              ),
            label: "سورة محفوظة",
            icon: "📖",
          },
          {
            value: `${completedJuz.toLocaleString(
              "ar-EG",
            )} / ٣٠`,
            label: "أجزاء مكتملة",
            icon: "🏅",
          },
          {
            value:
              dueReviews.length.toLocaleString(
                "ar-EG",
              ),
            label: "مراجعة مستحقّة",
            icon: "🔁",
          },
          {
            value:
              earnedBadges.length.toLocaleString(
                "ar-EG",
              ),
            label: "أوسمة مكتسبة",
            icon: "⭐",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="lift card rounded-2xl p-4 text-center"
          >
            <div className="text-2xl">
              {item.icon}
            </div>

            <div className="mt-1 font-display text-2xl font-black shine-text">
              {item.value}
            </div>

            <div className="text-[11px] text-ink-500">
              {item.label}
            </div>
          </div>
        ))}
      </section>

      {/* ================================================================
          WEEKLY ACTIVITY + SUGGESTION
      ================================================================= */}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card rounded-3xl p-6 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900">
              نشاط هذا الأسبوع
            </h2>

            <span className="text-sm font-semibold text-emerald-700">
              {weekTotal.toLocaleString(
                "ar-EG",
              )}{" "}
              آية
            </span>
          </div>

          <WeeklyBars data={week} />
        </div>

        <div
          className="lift rounded-3xl p-6"
          style={{
            background:
              "linear-gradient(135deg,#ecfdf5,#eff6ff)",
            border:
              "1px solid rgba(16,185,129,0.3)",
          }}
        >
          <div className="flex items-center gap-2 text-lg">
            ✨
            <span className="font-display font-bold text-ink-900">
              مقترح لك
            </span>
          </div>

          <p className="mt-2 text-xs text-ink-500">
            ابدأ سورة جديدة قصيرة يسهل حفظها
          </p>

          <div className="mt-4 flex items-center gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-md"
              style={{
                background:
                  "linear-gradient(135deg,#10b981,#3b82f6)",
              }}
            >
              {suggested.number.toLocaleString(
                "ar-EG",
              )}
            </span>

            <div>
              <div
                className="text-2xl text-ink-900"
                style={{
                  fontFamily:
                    "var(--font-quran)",
                }}
              >
                {suggested.nameAr}
              </div>

              <div className="text-[11px] text-ink-500">
                {suggested.ayahCount.toLocaleString(
                  "ar-EG",
                )}{" "}
                آية
              </div>
            </div>
          </div>

          <Link
            href={`/memorize?surah=${suggested.number}`}
            className="mt-4 inline-block rounded-2xl btn-primary px-5 py-2.5 text-sm font-semibold"
          >
            ابدأ حفظها ←
          </Link>
        </div>
      </section>

      {/* ================================================================
          REVIEW / PLAN / BADGE
      ================================================================= */}

      <section className="grid gap-4 lg:grid-cols-3">
        <div
          className={`lift rounded-3xl p-6 ${
            dueReviews.length > 0
              ? ""
              : "card"
          }`}
          style={
            dueReviews.length > 0
              ? {
                  background:
                    "linear-gradient(135deg,#fef2f2,#fff7ed)",
                  border:
                    "1px solid rgba(192,57,43,0.25)",
                }
              : undefined
          }
        >
          <div className="flex items-center gap-2 text-lg">
            🔁
            <span className="font-display font-bold text-ink-900">
              مراجعة اليوم
            </span>
          </div>

          {dueReviews.length > 0 ? (
            <>
              <p className="mt-2 text-sm text-ink-700">
                لديك{" "}
                <span className="font-black text-red-600">
                  {dueReviews.length.toLocaleString(
                    "ar-EG",
                  )}
                </span>{" "}
                سورة مستحقّة للمراجعة قبل أن تنساها.
              </p>

              <Link
                href="/review"
                className="mt-4 inline-block rounded-2xl btn-primary px-5 py-2.5 text-sm font-semibold"
              >
                ابدأ المراجعة الآن ←
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-500">
              لا مراجعات مستحقّة اليوم — تعاهدك ممتاز 🌿
            </p>
          )}
        </div>

        <div className="lift card rounded-3xl p-6">
          <div className="flex items-center gap-2 text-lg">
            🎯
            <span className="font-display font-bold text-ink-900">
              هدف اليوم
            </span>
          </div>

          <p className="mt-2 text-sm text-ink-700">
            احفظ{" "}
            <span className="font-black text-emerald-700">
              ١٠ آيات
            </span>{" "}
            اليوم — بهذا الإيقاع تختم في{" "}
            <span className="font-bold">
              {plan.human}
            </span>{" "}
            بإذن الله.
          </p>

          <Link
            href="/memorize"
            className="mt-4 inline-block rounded-2xl btn-ghost px-5 py-2.5 text-sm font-semibold"
          >
            ابدأ جلسة حفظ ←
          </Link>
        </div>

        <div className="lift card rounded-3xl p-6">
          <div className="flex items-center gap-2 text-lg">
            🏆
            <span className="font-display font-bold text-ink-900">
              الوسام القادم
            </span>
          </div>

          {nextBadge ? (
            <>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl text-2xl opacity-40 grayscale"
                  style={{
                    background:
                      "rgba(16,185,129,0.1)",
                  }}
                >
                  {nextBadge.icon}
                </span>

                <div>
                  <div className="font-display font-bold text-ink-900">
                    {nextBadge.title}
                  </div>

                  <div className="text-[11px] text-ink-500">
                    {nextBadge.desc}
                  </div>
                </div>
              </div>

              <Link
                href="/achievements"
                className="mt-4 inline-block text-sm font-semibold text-emerald-700"
              >
                كل الأوسمة ←
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-emerald-700">
              فتحت كل الأوسمة — ما شاء الله! 👑
            </p>
          )}
        </div>
      </section>

      {/* ================================================================
          IN PROGRESS
      ================================================================= */}

      {inProgress.length > 0 && (
        <section className="card rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900">
              قيد الحفظ الآن
            </h2>

            <Link
              href="/mushaf"
              className="text-sm font-semibold text-emerald-700"
            >
              كل السور ←
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((progress) => {
              const meta =
                getSurah(
                  progress.surahNumber,
                );

              if (!meta) {
                return null;
              }

              const pct = Math.min(
                100,
                Math.round(
                  (progress.memorizedAyahs /
                    meta.ayahCount) *
                    100,
                ),
              );

              const color =
                STATUS_COLOR[
                  progress.status
                ] ?? "#3b82f6";

              return (
                <Link
                  key={progress.surahNumber}
                  href={`/memorize?surah=${progress.surahNumber}`}
                  className="lift rounded-2xl border border-sand-300/60 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xl text-ink-900"
                      style={{
                        fontFamily:
                          "var(--font-quran)",
                      }}
                    >
                      {meta.nameAr}
                    </span>

                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: `${color}18`,
                        color,
                      }}
                    >
                      {STATUS_LABEL[
                        progress.status
                      ] ?? "قيد الحفظ"}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-200">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg,#10b981,#3b82f6)",
                      }}
                    />
                  </div>

                  <div className="mt-1.5 text-[11px] text-ink-500">
                    {progress.memorizedAyahs.toLocaleString(
                      "ar-EG",
                    )}{" "}
                    /{" "}
                    {meta.ayahCount.toLocaleString(
                      "ar-EG",
                    )}{" "}
                    آية · {pct}٪
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ================================================================
          JUZ PROGRESS
      ================================================================= */}

      <section className="card rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">
            تقدّم الأجزاء
          </h2>

          <Link
            href="/plan"
            className="text-sm font-semibold text-emerald-700"
          >
            تحدّي الأجزاء ←
          </Link>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
          {juz.map((item) => {
            const done =
              item.pct >= 100;

            const juzInfo =
              JUZ_INFO[
                item.juz - 1
              ];

            return (
              <Link
                key={item.juz}
                href={`/memorize?surah=${
                  juzInfo?.startSurah ?? 1
                }`}
                title={`جزء ${
                  juzInfo?.name ?? item.juz
                } · ${item.pct}٪`}
                className="group relative grid aspect-square place-items-center rounded-xl text-sm font-bold transition hover:scale-110"
                style={{
                  background: done
                    ? "linear-gradient(135deg,#047857,#059669)"
                    : item.pct > 0
                      ? `linear-gradient(180deg,rgba(59,130,246,0.15),rgba(16,185,129,${
                          0.1 +
                          (item.pct / 100) *
                            0.4
                        }))`
                      : "rgba(16,185,129,0.07)",

                  color: done
                    ? "#fff"
                    : item.pct > 0
                      ? "#047857"
                      : "#94b0a8",
                }}
              >
                {done
                  ? "✓"
                  : item.juz.toLocaleString(
                      "ar-EG",
                    )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================================================================
          HEATMAP
      ================================================================= */}

      <section className="card rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">
            تقويم المواظبة
          </h2>

          <span className="text-xs text-ink-500">
            {streak.total.toLocaleString(
              "ar-EG",
            )}{" "}
            يوم نشاط · آخر سنة
          </span>
        </div>

        <Heatmap data={heatmap} />
      </section>

      {/* ================================================================
          PERSONAL DHIKR
      ================================================================= */}

      <PersonalDhikr
        name={user.name}
      />
    </div>
  );
}