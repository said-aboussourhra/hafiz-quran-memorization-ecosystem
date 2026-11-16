import type { Metadata } from "next";
import { AcademyClient } from "@/components/academy/AcademyClient";
import { TAJWEED_ACADEMY } from "@/lib/tajweedAcademy";

export const metadata: Metadata = {
  title: "أكاديمية التجويد والمدارس — حافظ",
  description: "مسار تفاعلي لتعلّم القرآن والتجويد للطلاب، مع خطة حصة وأدوات عرض للمعلم.",
};

export default async function AcademyPage({ searchParams }: { searchParams: Promise<{ lesson?: string }> }) {
  const { lesson } = await searchParams;
  const initialLessonId = TAJWEED_ACADEMY.some((item) => item.id === lesson) ? lesson : undefined;
  return <AcademyClient initialLessonId={initialLessonId} />;
}
