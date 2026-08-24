import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReciterDetail } from "@/components/ReciterDetail";
import { getReciter } from "@/lib/reciterRegistry";

export function generateStaticParams() {
  // Most-viewed reciters pre-rendered; others render on demand.
  return ["dosari", "afasy", "sudais", "maher", "husary", "minshawi", "abdulbasit"].map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const reciter = getReciter(id);
  if (!reciter) return { title: "القارئ غير موجود — حافظ" };
  return {
    title: `${reciter.nameArabic} — مكتبة القرّاء | حافظ`,
    description: `استمع إلى تلاوات ${reciter.nameArabic}${reciter.nameEnglish ? ` (${reciter.nameEnglish})` : ""} على منصة حافظ.`,
  };
}

export default async function ReciterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reciter = getReciter(id);
  if (!reciter) notFound();
  return <ReciterDetail id={id} />;
}
