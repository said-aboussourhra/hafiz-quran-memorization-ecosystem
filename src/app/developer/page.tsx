import { QR } from "@/components/QRCode";
import { DeveloperLetter } from "@/components/DeveloperLetter";

export const dynamic = "force-static";

const WHATSAPP = "0719274535";
const WHATSAPP_INTL = "212719274535";
const EMAIL = "s01said@outlook.fr";
const INSTA = "s_a_id_9";

const CONTACTS = [
  {
    label: "واتساب",
    value: WHATSAPP,
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.45-.15-.65.15-.19.29-.74.94-.9 1.13-.17.19-.33.22-.62.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.5.14-.18.19-.3.29-.5.1-.19.05-.36-.02-.5-.08-.15-.65-1.57-.9-2.15-.24-.57-.48-.49-.65-.5h-.56c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.4 0 1.41 1.03 2.78 1.17 2.97.14.19 2.03 3.1 4.92 4.35.69.3 1.22.48 1.64.61.69.22 1.31.19 1.81.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2z" /></svg>
    ),
    href: `https://wa.me/${WHATSAPP_INTL}`,
    qr: `https://wa.me/${WHATSAPP_INTL}`,
    color: "#25D366",
    grad: "linear-gradient(135deg,#25D366,#128C7E)",
  },
  {
    label: "البريد الإلكتروني",
    value: EMAIL,
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>
    ),
    href: `mailto:${EMAIL}`,
    qr: `mailto:${EMAIL}`,
    color: "#2563eb",
    grad: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  },
  {
    label: "إنستغرام",
    value: `@${INSTA}`,
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" /></svg>
    ),
    href: `https://instagram.com/${INSTA}`,
    qr: `https://instagram.com/${INSTA}`,
    color: "#E1306C",
    grad: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)",
  },
];

export default function DeveloperPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-[2rem] p-10 text-center sm:p-16" style={{ background: "linear-gradient(160deg,#f4fbf9,#eaf4f8)" }}>
        <div className="aurora breathe" style={{ top: "-90px", right: "12%", width: "300px", height: "300px", background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
        <div className="aurora" style={{ bottom: "-100px", left: "8%", width: "280px", height: "280px", background: "radial-gradient(circle,#3b82f6,transparent 70%)", animationDelay: "2s" }} />
        <div className="shimmer absolute inset-x-0 top-0 h-px" />

        <div className="relative">
          <div className="relative mx-auto grid h-36 w-36 place-items-center">
            <span className="orbit absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30" />
            <span className="absolute -inset-3 rounded-full breathe" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%)" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/developer.jpg" alt="SAID" className="h-28 w-28 rounded-full object-cover shadow-2xl ring-4 ring-white" />
          </div>
          <p className="mt-7 text-xs tracking-[0.4em] text-gold-600">مطوّر المنصة</p>
          <h1 className="mt-2 font-display text-5xl font-black sm:text-7xl">
            <span className="shine-text">SAID</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-ink-700">
            صانع منصة «حافظ» — صُنعت بحبٍّ وإتقان لخدمة كتاب الله وتيسير حفظه على المسلمين في كل مكان.
            نسأل الله أن يجعلها في ميزان حسنات كل من أسهم فيها أو نشرها.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={`https://wa.me/${WHATSAPP_INTL}`} target="_blank" rel="noopener noreferrer" className="rounded-2xl btn-primary px-7 py-3.5 font-semibold">تواصل عبر واتساب</a>
            <a href={`mailto:${EMAIL}`} className="rounded-2xl btn-ghost px-7 py-3.5 font-semibold">راسلني بالبريد</a>
          </div>
        </div>
      </header>

      {/* Contact cards with QR */}
      <section>
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-gold-600">تواصل معي</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">للاقتراحات والدعم والتعاون</h2>
          <p className="mt-2 text-sm text-ink-500">امسح رمز QR بكاميرا هاتفك أو اضغط على البطاقة مباشرة</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {CONTACTS.map((c, i) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="card-in lift group relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/60 bg-white p-8 text-center shadow-lg"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: c.grad }} />
              <span className="grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg transition group-hover:scale-110" style={{ background: c.grad }}>
                {c.icon}
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-ink-900">{c.label}</h3>
              <p dir="ltr" className="mt-1 text-sm text-ink-500">{c.value}</p>
              <div className="mt-6 transition group-hover:scale-105">
                <QR value={c.qr} size={155} />
              </div>
              <span className="mt-5 rounded-full px-5 py-2 text-xs font-semibold text-white shadow-md" style={{ background: c.grad }}>
                اضغط للتواصل ←
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Personal letter — in a luxurious frame with human-voice playback */}
      <section className="relative">
        <DeveloperLetter parts={LETTER} />
      </section>
    </div>
  );
}

const LETTER: { text: string; hadith?: boolean }[] = [
  { text: "الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد ﷺ، وعلى آله وصحبه أجمعين." },
  { text: "لم أكن يومًا حافظًا لكتاب الله، ولا أزعم لنفسي منزلةً في أهل القرآن، وإنما أنا عبدٌ من عباد الله، أحببتُ أن يكون لي نصيبٌ من خدمة كتابه، وأن أقدّم شيئًا أستطيع من خلاله أن أكون سببًا في تسهيل طريقٍ عظيمٍ لغيري." },
  { text: "ومن هنا بدأت الفكرة… فكّرتُ في كل من يحمل في قلبه أمنية حفظ القرآن، لكنه يحتاج إلى تنظيمٍ يعينه، أو متابعةٍ تشجعه، أو وسيلةٍ تجعله أكثر ثباتًا واستمرارًا. فكانت هذه المنظومة." },
  { text: "لم أبنِها لأقول: انظروا ماذا صنعت، ولا لأطلب مدحًا أو شهرة، ولا ابتغاءَ مقابلٍ من أحد. إنما بنيتُها وأنا أرجو شيئًا واحدًا: أن يرضى الله عني." },
  { text: "وما أعظم أن يكون للإنسان عملٌ صغير في نظره، لكنه يصبح سببًا في أن يحفظ شخصٌ آية، أو يراجع سورة، أو يثبت حفظًا، أو يبدأ رحلةً مع كتاب الله كان يؤجلها منذ سنوات." },
  { text: "«من قرأ حرفًا من كتاب الله فله به حسنة، والحسنة بعشر أمثالها»", hadith: true },
  { text: "فكيف لا نرجو الخير في أن نكون سببًا في إعانة الناس على كتاب الله؟" },
  { text: "أسأل الله أن يجعل هذه المنظومة نافعةً لكل من يدخلها، وأن يبارك في كل آيةٍ تُحفظ من خلالها، وكل حرفٍ يُتلى، وكل مراجعةٍ تُنجز، وكل قلبٍ يزداد تعلقًا بالقرآن." },
  { text: "وأسأله سبحانه أن يجعل لي ولوالديّ، ولأهلي وعائلتي، ولمن علّمني، ولكل من أعانني أو شجعني أو ساهم في هذا العمل، نصيبًا من أجره." },
  { text: "اللهم إن كان في هذا العمل خيرٌ، فبارك فيه، وإن كان فيه نقصٌ فأصلحه، وإن كان فيه رياءٌ فطهّر قلبي منه، وإن كان فيه نفعٌ لعبادك فاجعله ممتدًا ما امتد نفعه." },
  { text: "ولا أريد لهذا المشروع أن يكون مجرد موقعٍ يُفتح ثم يُغلق، بل أطمح أن أنمّيه وأطوّره باستمرار، حتى يصبح بإذن الله تطبيقًا متكاملًا يرافق الحافظ في رحلته، ويكون عونًا له في الحفظ والمراجعة والثبات." },
  { text: "أنا لا أملك أن أعلّم الناس القرآن، لكنني أستطيع أن أساعد في بناء طريقٍ يعينهم على حفظه. وهذا هو دوري، وهذه أمنيتي، وهذه مسؤوليتي." },
  { text: "فإن انتفع به إنسان، فذلك عندي أعظم من أي رقمٍ أو شهرة." },
  { text: "اللهم اجعل هذا العمل خالصًا لوجهك الكريم، واجعلني فيه سببًا للخير لا طالبًا للثناء، واكتب لي ولوالديّ وأهلي ومَن علّمني أجرًا كلما قُرئ حرف، وحُفظت آية، ورُوجعت سورة، وانتفع عبدٌ من عبادك بهذا العمل." },
  { text: "وما أريده من هذه الرحلة كلها… أن أصل في نهايتها إلى شيءٍ واحد: أن أجد هذا العمل يوم ألقاك، فتقول لي: لقد قبلتُه." },
];
