import { ReciterLibrary } from "@/components/ReciterLibrary";

export const metadata = {
  title: "مكتبة القرّاء — حافظ",
  description: "استمع إلى نخبة من قرّاء القرآن الكريم بمصادر موثّقة، واختر قارئك المفضّل للحفظ والمراجعة.",
};

export default function RecitersPage() {
  return <ReciterLibrary />;
}
