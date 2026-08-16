"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QR({ value, size = 160 }: { value: string; size?: number }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#047857", light: "#ffffff" },
    })
      .then(setUrl)
      .catch(() => setUrl(""));
  }, [value, size]);

  if (!url) {
    return <div className="animate-pulse rounded-xl bg-cream-100" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-2xl border border-sand-300 bg-white p-2 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="QR" width={size} height={size} className="rounded-lg" />
    </div>
  );
}
