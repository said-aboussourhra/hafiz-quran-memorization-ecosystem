/**
 * ============================================================================
 * HAFIZ — INTRO AUDIO STORE (تخزين MP3 في IndexedDB)
 * ----------------------------------------------------------------------------
 * تخزين ملفات MP3 الخاصة بتلاوات شاشة البداية في IndexedDB لتحميل أسرع
 * عند زيارة الموقع مرة أخرى.
 * ===========================================================================
 */

const DB_NAME = "HafizIntroAudioDB";
const STORE_NAME = "audio";
const DB_VERSION = 1;

// أنواع MIME المدعومة
const SUPPORTED_TYPES = ["audio/mpeg", "audio/mp3"];

// فتح قاعدة البيانات
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });

  return dbPromise;
}

/**
 * التحقق من دعم IndexedDB
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

/**
 * التحقق من دعم تخزين الملفات الثنائية
 */
export function isBlobStorageSupported(): boolean {
  return (
    typeof Blob !== "undefined" &&
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL !== "undefined"
  );
}

/**
 * تخزين ملف صوت في IndexedDB
 */
export async function storeAudio(url: string, id: string): Promise<string | null> {
  if (!isIndexedDBSupported() || !isBlobStorageSupported()) {
    return null;
  }

  try {
    // تحميل الملف
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!SUPPORTED_TYPES.includes(blob.type)) return null;

    // تخزين في IndexedDB
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const audioData = {
      id,
      blob,
      url,
      timestamp: Date.now(),
      type: blob.type,
      size: blob.size,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(audioData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // إنشاء URL للملف المخزن
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * الحصول على ملف صوت مخزون
 */
export async function getStoredAudio(id: string): Promise<string | null> {
  if (!isIndexedDBSupported()) return null;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(id);

    const audioData = await new Promise<any>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!audioData || !audioData.blob) return null;

    // إنشاء URL من Blob المخزون
    return URL.createObjectURL(audioData.blob);
  } catch {
    return null;
  }
}

/**
 * التحقق من وجود ملف صوت مخزون
 */
export async function hasStoredAudio(id: string): Promise<boolean> {
  if (!isIndexedDBSupported()) return false;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(id);

    const audioData = await new Promise<any>((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });

    return !!audioData;
  } catch {
    return false;
  }
}

/**
 * حذف ملف صوت مخزون
 */
export async function deleteStoredAudio(id: string): Promise<void> {
  if (!isIndexedDBSupported()) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // تجاهل
  }
}

/**
 * حذف جميع الملفات الصوتية المخزونة
 */
export async function clearAllAudio(): Promise<void> {
  if (!isIndexedDBSupported()) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // تجاهل
  }
}

/**
 * الحصول على جميع الملفات الصوتية المخزونة
 */
export async function getAllStoredAudio(): Promise<Array<{ id: string; url: string; timestamp: number; size: number }>> {
  if (!isIndexedDBSupported()) return [];

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.getAll();

    const audioList = await new Promise<any[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return audioList.map((audio) => ({
      id: audio.id,
      url: audio.url,
      timestamp: audio.timestamp,
      size: audio.size,
    }));
  } catch {
    return [];
  }
}

/**
 * التحقق من وجود ملف صوت مخزون وإعادته أو URL الأصلي
 */
export async function getAudioURL(id: string, fallbackUrl: string): Promise<string> {
  const storedUrl = await getStoredAudio(id);
  return storedUrl || fallbackUrl;
}

// إعادة تعيين dbPromise عند الحاجة (للاختبار)
export function resetDBPromise(): void {
  dbPromise = null;
}
