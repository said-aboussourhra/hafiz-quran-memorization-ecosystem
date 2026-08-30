"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { hasAdminSession, clearAdminSession, getAdminUsername } from "@/lib/adminAuth";
import { INTRO_VERSES, type IntroVerse } from "@/lib/introVerses";
import { storeAudio, getStoredAudio, hasStoredAudio, getAllStoredAudio, deleteStoredAudio } from "@/lib/introAudioStore";

/**
 * لوحة تحكم المطوّر
 * تعرض تلاوات القرّاء مع خيار إضافة ملفات MP3 مخصصة
 */
export default function AdminPage() {
  const router = useRouter();
  const [verses, setVerses] = useState<IntroVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [storedAudio, setStoredAudio] = useState<Array<{ id: string; url: string; timestamp: number; size: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحميل الملفات الصوتية المخزونة
  const loadStoredAudio = useCallback(async () => {
    const audioList = await getAllStoredAudio();
    setStoredAudio(audioList);
  }, []);

  // التحقق من المصادقة
  useEffect(() => {
    if (!hasAdminSession()) {
      router.push("/");
    } else {
      // استخدام requestAnimationFrame لتجنب calling setState synchronously
      requestAnimationFrame(() => {
        setVerses(INTRO_VERSES);
        loadStoredAudio();
        setLoading(false);
      });
    }
  }, [router, loadStoredAudio]);

  // تسجيل الخروج
  const handleLogout = () => {
    clearAdminSession();
    router.push("/");
  };

  // فتح نافذة اختيار الملف
  const handleAddMP3Click = (verseId: string) => {
    // حفظ ID للآية في data attribute
    if (fileInputRef.current) {
      fileInputRef.current.dataset.verseId = verseId;
      fileInputRef.current.click();
    }
  };

  // التعامل مع اختيار الملف
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const verseId = e.target.dataset.verseId;
    if (!verseId) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith("audio/")) {
      setError("يرجى اختيار ملف صوت (MP3)");
      return;
    }

    // التحقق من حجم الملف (10MB حد أقصى)
    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الملف كبير جداً. الحد الأقصى 10MB");
      return;
    }

    setUploading(verseId);
    setError(null);
    setUploadProgress((prev) => ({ ...prev, [verseId]: 0 }));

    try {
      // إنشاء URL مؤقت للملف
      const tempUrl = URL.createObjectURL(file);

      // تخزين الملف في IndexedDB
      const storedUrl = await storeAudio(tempUrl, verseId);

      if (storedUrl) {
        // تحديث قائمة الملفات المخزونة
        await loadStoredAudio();
        setSuccess(`تم رفع ملف الآية ${verseId} بنجاح!`);
        
        // إزالة الملف المؤقت
        URL.revokeObjectURL(tempUrl);
      } else {
        setError("فشل تخزين الملف");
      }
    } catch (err) {
      setError("حدث خطأ أثناء الرفع");
    } finally {
      setUploading(null);
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[verseId];
        return newProgress;
      });
      // إعادة تعيين input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        delete fileInputRef.current.dataset.verseId;
      }
    }
  };

  // حذف ملف صوت
  const handleDeleteAudio = async (id: string) => {
    try {
      await deleteStoredAudio(id);
      await loadStoredAudio();
      setSuccess(`تم حذف الملف ${id}`);
    } catch {
      setError("فشل حذف الملف");
    }
  };

  // الحصول على تاريخ ملف مخزون
  const getStoredDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString("ar-EG");
  };

  // الحصول على حجم ملف قابل للقراءة
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" />
          <p className="mt-4 text-ink-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-white">
      {/* رأس الصفحة */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-500/15">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #10b981, #059669, #3b82f6)" }} />
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-ocean-600 text-white text-xl font-bold shadow-lg">
              S
            </div>
            <div>
              <h1 className="font-display text-xl font-bold shine-text">لوحة التحكم</h1>
              <p className="text-sm text-ink-500">مرحبا بك، {getAdminUsername()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl btn-ghost px-4 py-2 text-sm font-semibold"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5M16 17h-6" />
            </svg>
            خروج
          </button>
        </div>
      </header>

      {/* محتوى الصفحة */}
      <main className="mx-auto max-w-7xl px-5 py-8">
        {/* رسالة النجاح أو الخطأ */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-600 hover:text-emerald-800">×</button>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        {/* قسم تلاوات شاشة البداية */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-ink-900">تلاوات شاشة البداية</h2>
              <p className="text-ink-500 mt-1">إدارة الملفات الصوتية للآيات المعروضة عند فتح الموقع</p>
            </div>
          </div>

          {/* جدول الآيات */}
          <div className="overflow-x-auto rounded-xl border border-emerald-100 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-700">#</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-700">النص</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-700">المصدر</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-700">القارئ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-700">حالة الملف</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-ink-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {verses.map((verse, index) => {
                  const stored = storedAudio.find((a) => a.id === verse.audio);
                  const isUploading = uploading === verse.audio;
                  const progress = verse.audio ? uploadProgress[verse.audio] || 0 : 0;

                  return (
                    <tr key={index} className="hover:bg-cream-50/50 transition">
                      <td className="px-6 py-4 text-sm text-ink-600">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-arabic text-ink-900 max-w-xs truncate" dir="rtl">
                        {verse.text}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-600">{verse.source}</td>
                      <td className="px-6 py-4 text-sm text-ink-600">{verse.reciter}</td>
                      <td className="px-6 py-4 text-sm">
                        {stored ? (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <path d="M7 10l5 5 5-5" />
                              <path d="M12 15V3" />
                            </svg>
                            مخزون
                          </span>
                        ) : isUploading ? (
                          <span className="flex items-center gap-1 text-ocean-600">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            جاري الرفع... {progress}%
                          </span>
                        ) : (
                          <span className="text-ink-400">غير مخزون</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => verse.audio && handleAddMP3Click(verse.audio)}
                          disabled={isUploading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition disabled:opacity-50"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <path d="M17 8l-5-5-5 5M17 8v8H7" />
                          </svg>
                          إضافة MP3
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* قسم الملفات المخزونة */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-ink-900">الملفات الصوتية المخزونة</h2>
              <p className="text-ink-500 mt-1">قائمة بجميع الملفات الصوتية المخزونة في المتصفح</p>
            </div>
            {storedAudio.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("هل تريد حذف جميع الملفات الصوتية المخزونة؟")) {
                    storedAudio.forEach((audio) => deleteStoredAudio(audio.id));
                    setStoredAudio([]);
                    setSuccess("تم حذف جميع الملفات");
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                حذف الكل
              </button>
            )}
          </div>

          {storedAudio.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-emerald-100">
              <svg className="mx-auto h-12 w-12 text-ink-300" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              <p className="mt-4 text-ink-500">لا يوجد ملفات صوتية مخزونة</p>
              <p className="mt-2 text-sm text-ink-400">اضف ملفات من جدول الآيات أعلاه</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storedAudio.map((audio) => (
                <div
                  key={audio.id}
                  className="p-4 rounded-xl bg-white border border-emerald-100 hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <code className="text-sm font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{audio.id}</code>
                    </div>
                    <button
                      onClick={() => handleDeleteAudio(audio.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="حذف"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-ink-600">
                      الحجم: <span className="font-medium">{formatFileSize(audio.size)}</span>
                    </p>
                    <p className="text-ink-500">
                      تاريخ الرفع: <span className="font-medium">{getStoredDate(audio.timestamp)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Input مخفي لرفع الملفات */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* تذييل الصفحة */}
      <footer className="mx-auto max-w-7xl px-5 py-8 mt-12 text-center text-sm text-ink-500 border-t border-emerald-500/15">
        <p>لوحة التحكم - نظام حافظ لإدارة المحتوى الصوتي</p>
      </footer>
    </div>
  );
}
