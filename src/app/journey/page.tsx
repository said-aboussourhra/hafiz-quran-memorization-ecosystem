import type { Metadata } from "next";
import { JourneyView } from "@/components/hafiz/JourneyView";

export const metadata: Metadata = {
  title: "رحلة الحفظ — حافظ",
  description: "تتبع رحلة حفظك للقرآن الكريم: الإتقان، الاحتفاظ، نقاط الضعف، والمراجعة.",
};

export default function JourneyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <JourneyView />
    </div>
  );
}
