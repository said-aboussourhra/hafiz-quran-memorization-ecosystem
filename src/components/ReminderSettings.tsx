"use client";

import { useEffect, useState } from "react";

const TIMES = [
  { id: "fajr", label: "بعد الفجر", time: "05:30" },
  { id: "duha", label: "الضحى", time: "09:00" },
  { id: "asr", label: "بعد العصر", time: "16:30" },
  { id: "maghrib", label: "بعد المغرب", time: "19:00" },
  { id: "night", label: "قبل النوم", time: "22:00" },
];

export function ReminderSettings() {
  const [enabled, setEnabled] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem("hafiz_reminder_on") === "1"
  );
  const [time, setTime] = useState(() => {
    if (typeof window === "undefined") return "05:30";
    return window.localStorage.getItem("hafiz_reminder_time") || "05:30";
  });
  const [perm, setPerm] = useState<NotificationPermission>(
    () => (typeof Notification !== "undefined" ? Notification.permission : "default")
  );
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Lightweight in-tab scheduler: fires once per day at the chosen time while the app is open,
    // and the service worker can show a reminder even in the background PWA.
    const intervalId = window.setInterval(() => {
      try {
        if (window.localStorage.getItem("hafiz_reminder_on") !== "1") return;
        const t = window.localStorage.getItem("hafiz_reminder_time") || "05:30";
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const lastFired = window.localStorage.getItem("hafiz_reminder_last");
        const todayKey = now.toISOString().slice(0, 10);
        if (hhmm === t && lastFired !== todayKey && Notification.permission === "granted") {
          window.localStorage.setItem("hafiz_reminder_last", todayKey);
          navigator.serviceWorker?.ready.then((reg) => reg.active?.postMessage({ type: "review-reminder" }));
        }
      } catch { /* ignore */ }
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const enable = async () => {
    if (typeof Notification === "undefined") {
      setMsg("متصفّحك لا يدعم الإشعارات.");
      return;
    }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      setEnabled(true);
      try {
        localStorage.setItem("hafiz_reminder_on", "1");
        localStorage.setItem("hafiz_reminder_time", time);
      } catch { /* ignore */ }
      setMsg("تم تفعيل التذكير اليومي بإذن الله.");
      // instant confirmation notification
      navigator.serviceWorker?.ready.then((reg) => reg.showNotification("حافظ · تم تفعيل التذكير", { body: `سنذكّرك يومياً في الساعة ${time} بمراجعة وردك.`, icon: "/icon-192.png", dir: "rtl", lang: "ar" }));
    } else {
      setMsg("لم يُسمح بالإشعارات. فعّلها من إعدادات المتصفح.");
    }
  };

  const disable = () => {
    setEnabled(false);
    try { localStorage.setItem("hafiz_reminder_on", "0"); } catch { /* ignore */ }
    setMsg("تم إيقاف التذكير.");
  };

  const changeTime = (t: string) => {
    setTime(t);
    try { localStorage.setItem("hafiz_reminder_time", t); } catch { /* ignore */ }
  };

  return (
    <div className="card rounded-3xl p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl text-xl text-white shadow-md" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>🔔</span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">تذكير المراجعة اليومي</h2>
          <p className="text-xs text-ink-500">اختر وقتك المناسب وسنذكّرك بتعاهد وردك</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-ink-700">الوقت المفضّل</p>
        <div className="flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTime(t.time)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${time === t.time ? "btn-primary" : "btn-ghost"}`}
            >
              {t.label} · {t.time}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-ink-500">أو حدّد وقتاً:</span>
          <input type="time" value={time} onChange={(e) => changeTime(e.target.value)} dir="ltr" className="rounded-xl border border-sand-300 bg-white px-3 py-1.5 text-sm text-ink-900 outline-none focus:border-emerald-500" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!enabled ? (
          <button onClick={enable} className="rounded-2xl btn-primary px-6 py-3 font-semibold">تفعيل التذكير</button>
        ) : (
          <>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">✓ مُفعّل يومياً في {time}</span>
            <button onClick={disable} className="rounded-2xl btn-ghost px-5 py-2.5 text-sm font-semibold">إيقاف</button>
          </>
        )}
      </div>
      {msg && <p className="mt-3 text-xs text-ink-500">{msg}</p>}
      {perm === "denied" && <p className="mt-2 text-xs text-red-500">الإشعارات محظورة في المتصفح — فعّلها من إعدادات الموقع.</p>}
    </div>
  );
}
