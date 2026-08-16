export type LetterPart = { text: string; hadith?: boolean };

export function DeveloperLetter({ parts }: { parts: LetterPart[] }) {
  return (
    <div className="letter-frame relative overflow-hidden rounded-[2rem] bg-white p-8 sm:p-12">
      <span className="letter-corner right-4 top-4 border-r-2 border-t-2" style={{ borderTopRightRadius: 14 }} />
      <span className="letter-corner left-4 top-4 border-l-2 border-t-2" style={{ borderTopLeftRadius: 14 }} />
      <span className="letter-corner right-4 bottom-4 border-r-2 border-b-2" style={{ borderBottomRightRadius: 14 }} />
      <span className="letter-corner left-4 bottom-4 border-l-2 border-b-2" style={{ borderBottomLeftRadius: 14 }} />

      <div className="text-center">
        <p className="text-3xl text-emerald-700 sm:text-4xl" style={{ fontFamily: "var(--font-quran)" }}>بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ</p>
        <div className="basmala-ornament mx-auto mt-5 max-w-xs" />
      </div>

      <div className="mx-auto mt-8 max-w-2xl space-y-5 text-[18px] font-medium leading-[2.1] text-ink-900" style={{ textAlign: "justify" }}>
        {parts.map((p, i) =>
          p.hadith ? (
            <div key={i} className="relative my-7 overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-l from-emerald-50 to-blue-50 p-6 text-center">
              <span className="absolute right-4 top-2 text-4xl text-emerald-500/20">”</span>
              <p className="text-2xl leading-loose" style={{ fontFamily: "var(--font-quran)", color: "#047857" }}>{p.text}</p>
              <p className="mt-2 text-xs text-emerald-600">رواه الترمذي</p>
            </div>
          ) : (
            <p key={i}>{p.text}</p>
          )
        )}
      </div>

      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-lg" style={{ boxShadow: "0 10px 30px -12px rgba(37,99,235,0.4)" }}>
          <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-black text-white" style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)" }}>S</span>
          <span className="font-display text-lg font-bold shine-text">SAID</span>
        </div>
      </div>
    </div>
  );
}
