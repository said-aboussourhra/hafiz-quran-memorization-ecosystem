"use client";

import { useState } from "react";

export function VerifyClient({ initialToken }: { initialToken: string }) {
  const [token, setToken] = useState(initialToken);

  return (
    <form
      action="/verify"
      method="get"
      className="mt-6 flex flex-col gap-2 sm:flex-row"
      dir="rtl"
    >
      <input
        name="token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="HFZ-20260823-XXXXXXX"
        className="flex-1 rounded-xl border border-sand-300 bg-white px-4 py-3 text-sm text-ink-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        dir="ltr"
        autoComplete="off"
      />
      <button
        type="submit"
        className="rounded-xl bg-gradient-to-l from-emerald-500 to-ocean-500 px-6 py-3 text-sm font-bold text-white transition active:scale-[0.99]"
      >
        تحقّق
      </button>
    </form>
  );
}
