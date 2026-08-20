"use client";

import Image from "next/image";
import { type ReactNode } from "react";

interface CertificateProps {
  /** اسم المكرم */
  name: string;
  /** السورة المحفوظة */
  surahName: string;
  /** عدد الآيات المتقنة */
  ayahCount: number;
  /** نسبة الإتقان */
  perfection: string;
  /** أيقونة إضافية أو أي عنصر */
  extra?: ReactNode;
}

/**
 * شهادة تقدير فاخرة على طراز منصة حافظ
 * تعتمد على هوية بصرية موحدة: أزرق داكن + ذهبي + زمردي
 * مع خلفية فاتحة وإطار أنيق مزدوج
 */
export function Certificate({
  name,
  surahName,
  ayahCount,
  perfection,
  extra,
}: CertificateProps) {
  const year = new Date().getFullYear().toLocaleString("ar-EG", { useGrouping: false });

  return (
    <div className="certificate-wrapper">
      <div className="certificate-card">
        {/* الإطار الخارجي */}
        <div className="certificate-outer-frame">
          {/* الإطار الداخلي */}
          <div className="certificate-inner-frame">
            {/* خلفية مزخرفة شفافة */}
            <div className="certificate-bg-pattern" />

            {/* المحتوى */}
            <div className="certificate-content">
              {/* الزاوية العلوية اليمنى */}
              <div className="certificate-corner top-right" />
              {/* الزاوية العلوية اليسرى */}
              <div className="certificate-corner top-left" />
              {/* الزاوية السفلية اليمنى */}
              <div className="certificate-corner bottom-right" />
              {/* الزاوية السفلية اليسرى */}
              <div className="certificate-corner bottom-left" />

              {/* الشعار */}
              <div className="certificate-logo">
                <Image
                  src="/HAFIZ.jpg"
                  alt="شعار حافظ"
                  width={60}
                  height={60}
                  className="rounded-full shadow-md"
                />
              </div>

              {/* النص العلوي */}
              <div className="certificate-header">
                <p className="certificate-bismillah">بسم الله الرحمن الرحيم</p>
                <div className="certificate-divider" />
                <p className="certificate-title-arabic">شهادة تقدير</p>
                <p className="certificate-title-heart">❤️ إتمام حفظ</p>
                <p className="certificate-congrats">تهانينا</p>
              </div>

              {/* اسم المكرم */}
              <div className="certificate-name-section">
                <p className="certificate-label">نشهد أن الأخ/الأخت</p>
                <p className="certificate-name">{name}</p>
              </div>

              {/* الإنجاز */}
              <div className="certificate-achievement">
                <p className="certificate-achievement-text">
                  قد أتمّ بفضل الله حفظ سورة {surahName}
                </p>
                <p className="certificate-perfection">
                  بنسبة إتقان {perfection} (آية {ayahCount})
                </p>
              </div>

              {/* الفاصل */}
              <div className="certificate-divider gold" />

              {/* الحديث */}
              <div className="certificate-hadith">
                <p className="certificate-hadith-text">
                  "خيركم من تعلم القرآن وعلمه"
                </p>
                <p className="certificate-hadith-source">رواه البخاري</p>
              </div>

              {/* التذييل */}
              <div className="certificate-footer">
                <p className="certificate-date">
                  صدرت هذه الشهادة في {new Date().toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <div className="certificate-divider small" />
                <p className="certificate-brand">
                  حافظ © {year} — رفيقك في حفظ القرآن الكريم
                </p>
              </div>

              {extra && <div className="certificate-extra">{extra}</div>}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ============================================================
           شهادة تقدير — حافظ
           الهوية البصرية: أزرق داكن + ذهبي + زمردي
           خلفية فاتحة، إطار مزدوج، زخارف شفافة
           ============================================================ */

        .certificate-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1.5rem;
          min-height: 100vh;
          background: linear-gradient(145deg, #f5f0e8 0%, #ede8dd 100%);
          font-family: var(--font-ui);
        }

        .certificate-card {
          max-width: 720px;
          width: 100%;
          padding: 1.5rem;
          background: #fffcf7;
          border-radius: 32px;
          box-shadow:
            0 2px 4px rgba(26, 35, 53, 0.04),
            0 12px 40px rgba(26, 35, 53, 0.10),
            0 0 0 1px rgba(184, 144, 47, 0.12);
        }

        .certificate-outer-frame {
          position: relative;
          padding: 16px;
          border-radius: 20px;
          background: linear-gradient(135deg, #1a2a4a, #2c3e6b);
        }

        .certificate-inner-frame {
          position: relative;
          padding: 28px 24px;
          border-radius: 14px;
          background: #fefcf7;
          border: 2px solid rgba(184, 144, 47, 0.35);
          overflow: hidden;
        }

        /* ===== خلفية زخرفية شفافة ===== */
        .certificate-bg-pattern {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.04;
          background-image:
            repeating-linear-gradient(
              45deg,
              #b8902f 0px,
              #b8902f 2px,
              transparent 2px,
              transparent 12px
            ),
            repeating-linear-gradient(
              -45deg,
              #b8902f 0px,
              #b8902f 2px,
              transparent 2px,
              transparent 12px
            );
          background-size: 24px 24px;
        }

        /* ===== الزوايا المزخرفة ===== */
        .certificate-corner {
          position: absolute;
          width: 28px;
          height: 28px;
          border-color: rgba(184, 144, 47, 0.35);
          border-style: solid;
          border-width: 0;
          pointer-events: none;
          z-index: 2;
        }
        .certificate-corner.top-left {
          top: 12px;
          left: 12px;
          border-top-width: 2px;
          border-left-width: 2px;
        }
        .certificate-corner.top-right {
          top: 12px;
          right: 12px;
          border-top-width: 2px;
          border-right-width: 2px;
        }
        .certificate-corner.bottom-left {
          bottom: 12px;
          left: 12px;
          border-bottom-width: 2px;
          border-left-width: 2px;
        }
        .certificate-corner.bottom-right {
          bottom: 12px;
          right: 12px;
          border-bottom-width: 2px;
          border-right-width: 2px;
        }

        /* ===== المحتوى ===== */
        .certificate-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* ===== الشعار ===== */
        .certificate-logo {
          margin-bottom: 0.75rem;
        }
        .certificate-logo :global(img) {
          box-shadow: 0 4px 12px rgba(26, 35, 53, 0.08);
        }

        /* ===== النص العلوي ===== */
        .certificate-header {
          margin-bottom: 1.25rem;
        }
        .certificate-bismillah {
          font-family: var(--font-arabic);
          font-size: 1.2rem;
          color: #1a2a4a;
          margin-bottom: 0.25rem;
        }
        .certificate-divider {
          width: 60px;
          height: 2px;
          margin: 0.5rem auto;
          background: linear-gradient(90deg, transparent, #b8902f, transparent);
        }
        .certificate-divider.gold {
          background: linear-gradient(90deg, transparent, #b8902f, #d4ae54, #b8902f, transparent);
          height: 2px;
          width: 80px;
        }
        .certificate-divider.small {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #b8902f, transparent);
        }
        .certificate-title-arabic {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 700;
          color: #1a2a4a;
          letter-spacing: 0.02em;
        }
        .certificate-title-heart {
          font-size: 1.1rem;
          color: #b8902f;
          font-weight: 500;
          margin-top: 0.1rem;
        }
        .certificate-congrats {
          font-family: var(--font-arabic);
          font-size: 1.6rem;
          color: #1a2a4a;
          font-weight: 700;
          margin-top: 0.2rem;
        }

        /* ===== اسم المكرم ===== */
        .certificate-name-section {
          margin: 1rem 0 1.25rem;
        }
        .certificate-label {
          font-size: 0.9rem;
          color: #4a5a6a;
          font-weight: 400;
        }
        .certificate-name {
          font-family: var(--font-display);
          font-size: 2.6rem;
          font-weight: 700;
          color: #1a2a4a;
          background: linear-gradient(135deg, #1a2a4a, #2c3e6b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-top: 0.2rem;
          letter-spacing: 0.02em;
        }

        /* ===== الإنجاز ===== */
        .certificate-achievement {
          margin-bottom: 1.25rem;
        }
        .certificate-achievement-text {
          font-family: var(--font-arabic);
          font-size: 1.1rem;
          color: #2a3a4a;
          line-height: 1.6;
        }
        .certificate-perfection {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1a7a5a;
          margin-top: 0.3rem;
          background: linear-gradient(135deg, #1a7a5a, #2e9b7a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ===== الحديث ===== */
        .certificate-hadith {
          margin: 1rem 0 1.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(184, 144, 47, 0.04);
          border-radius: 12px;
          border: 1px solid rgba(184, 144, 47, 0.10);
          max-width: 90%;
        }
        .certificate-hadith-text {
          font-family: var(--font-arabic);
          font-size: 1.1rem;
          color: #1a2a3a;
          line-height: 1.6;
        }
        .certificate-hadith-source {
          font-size: 0.8rem;
          color: #6a7a8a;
          margin-top: 0.2rem;
        }

        /* ===== التذييل ===== */
        .certificate-footer {
          margin-top: 0.75rem;
        }
        .certificate-date {
          font-size: 0.8rem;
          color: #5a6a7a;
        }
        .certificate-brand {
          font-size: 0.7rem;
          color: #7a8a9a;
          margin-top: 0.3rem;
        }

        .certificate-extra {
          margin-top: 0.75rem;
        }

        /* ===== التجاوب ===== */
        @media (max-width: 480px) {
          .certificate-card {
            padding: 0.75rem;
            border-radius: 20px;
          }
          .certificate-outer-frame {
            padding: 10px;
            border-radius: 14px;
          }
          .certificate-inner-frame {
            padding: 18px 14px;
          }
          .certificate-title-arabic {
            font-size: 1.4rem;
          }
          .certificate-name {
            font-size: 2rem;
          }
          .certificate-achievement-text {
            font-size: 0.95rem;
          }
          .certificate-perfection {
            font-size: 1rem;
          }
          .certificate-hadith-text {
            font-size: 0.95rem;
          }
          .certificate-corner {
            width: 18px;
            height: 18px;
          }
          .certificate-corner.top-left,
          .certificate-corner.top-right {
            top: 8px;
          }
          .certificate-corner.top-left,
          .certificate-corner.bottom-left {
            left: 8px;
          }
          .certificate-corner.top-right,
          .certificate-corner.bottom-right {
            right: 8px;
          }
          .certificate-corner.bottom-left,
          .certificate-corner.bottom-right {
            bottom: 8px;
          }
          .certificate-bismillah {
            font-size: 1rem;
          }
          .certificate-congrats {
            font-size: 1.2rem;
          }
          .certificate-label {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 380px) {
          .certificate-name {
            font-size: 1.6rem;
          }
          .certificate-title-arabic {
            font-size: 1.2rem;
          }
          .certificate-achievement-text {
            font-size: 0.85rem;
          }
          .certificate-hadith-text {
            font-size: 0.85rem;
          }
          .certificate-logo :global(img) {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </div>
  );
}