"use client";

import { useState } from "react";

/**
 * Honest, privacy-first YouTube embed.
 *
 * We only ever embed a video whose ID came from the verified Reciter registry
 * (never fabricated). The iframe is NOT loaded until the user explicitly
 * presses play — this avoids loading third-party cookies/trackers on page load
 * and never re-hosts copyrighted content.
 */
export function YouTubeEmbed({
  videoId,
  title,
  startTime,
}: {
  videoId: string;
  title?: string;
  startTime?: number;
}) {
  const [active, setActive] = useState(false);
  const safeId = encodeURIComponent(videoId);
  const start = typeof startTime === "number" && startTime > 0 ? `&start=${Math.floor(startTime)}` : "";
  const src = `https://www.youtube-nocookie.com/embed/${safeId}?rel=0&hl=ar${start}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-black/10">
      <div className="aspect-video w-full">
        {active ? (
          <iframe
            src={src}
            title={title ?? "تلاوة على يوتيوب"}
            className="h-full w-full"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="group flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink-900 to-emerald-950 text-white"
            aria-label={`تشغيل: ${title ?? "تلاوة على يوتيوب"}`}
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-600 shadow-lg transition group-hover:scale-105 group-hover:bg-emerald-500">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="px-4 text-center text-sm font-semibold opacity-90">
              اضغط للتشغيل عبر يوتيوب
            </span>
            <span className="text-[10px] opacity-60">لن يتم تحميل المشغّل حتى توافق</span>
          </button>
        )}
      </div>
    </div>
  );
}
