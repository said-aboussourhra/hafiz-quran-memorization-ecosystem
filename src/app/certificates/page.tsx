import type { Metadata } from "next";
import { CertificatesClient } from "@/components/certificates/CertificatesClient";

export const metadata: Metadata = {
  title: "الشهادات — حافظ",
  description: "شهادات الإنجاز الرقمية من منصة حافظ.",
};

export default function CertificatesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <CertificatesClient />
    </div>
  );
}
