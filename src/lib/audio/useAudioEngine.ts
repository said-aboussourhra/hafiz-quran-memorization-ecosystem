"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AudioSource,
  AyahTimings,
  EngineState,
  RecordingTimings,
  RepeatMode,
  SegmentRange,
} from "./types";
import { SYNC_META } from "./types";

const SPEEDS = [0.5, 0.75, 1, 1.25] as const;
export type PlaybackSpeed = (typeof SPEEDS)[number];
export { SPEEDS };

const initial: EngineState = {
  status: "idle",
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  currentAyah: null,
  currentWord: null,
  syncStatus: "NOT_AVAILABLE",
  sourceGranularity: "ayah",
  repeatMode: "off",
  repeatAyah: false,
  sleepTimerMinutes: null,
  sleepEndsAt: null,
  autoScroll: true,
  error: null,
};

/**
 * Professional, exact-sync audio engine.
 *
 * - One `AudioSource` describes a SPECIFIC recording (reciter × surah × source)
 *   along with its OWN timing map. Switching reciter reloads the audio AND the
 *   timing map — timings are never carried over.
 * - Position is derived from real timings when available (WORD_VERIFIED), from
 *   per-ayah file boundaries (VERSE_ONLY), or not at all (AUDIO_ONLY).
 * - No percentage/word-count/generic timing is ever used to fake a highlight.
 */
export function useAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const sourceRef = useRef<AudioSource | null>(null);
  const timingsRef = useRef<RecordingTimings | null>(null);
  const segmentRef = useRef<SegmentRange | null>(null);
  const endedHandlerRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<EngineState>(initial);
  const [timingsVersion, setTimingsVersion] = useState(0);
  const [activeAyahForScroll, setActiveAyahForScroll] = useState<number | null>(null);

  // WORD_AUTO estimates: per-ayah word timings derived from the REAL duration
  // of each loaded ayah file (distributed across words by text-length weights).
  // Completely separate from verified timings; cleared with every source swap.
  const estimatedRef = useRef<RecordingTimings | null>(null);

  // Lazily create the single audio element.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoadedMeta = () => {
      setState((s) => ({ ...s, duration: audio.duration && isFinite(audio.duration) ? audio.duration : 0 }));

      // ---- WORD_AUTO estimation (per-ayah files without verified timings) ----
      const source = sourceRef.current;
      const ayah = source?.currentAyahForGranularity;
      if (!source || source.granularity !== "ayah" || !ayah) return;
      const verified = source.timings?.get(ayah);
      if (verified && verified.words.length > 0) return; // real data wins
      if (estimatedRef.current?.has(ayah)) return; // already estimated
      const weights = source.getWordWeights?.(ayah);
      const dur = audio.duration;
      if (!weights || weights.length === 0 || !isFinite(dur) || dur <= 0.4) return;

      const total = weights.reduce((a, b) => a + b, 0);
      if (total <= 0) return;
      let cursor = 0;
      const words = weights.map((w, idx) => {
        const span = (w / total) * dur;
        const t = {
          wordNumber: idx + 1,
          start: cursor,
          end: Math.min(dur, cursor + span),
        };
        cursor += span;
        return t;
      });

      const map = new Map(estimatedRef.current ?? []);
      map.set(ayah, { ayah, start: 0, end: dur, words });
      estimatedRef.current = map;
      setState((s) =>
        s.syncStatus === "WORD_VERIFIED" ? s : { ...s, syncStatus: "WORD_AUTO" },
      );
    };

    const onPlay = () => setState((s) => ({ ...s, status: "playing", error: null }));
    const onPause = () =>
      setState((s) => (s.status === "loading" ? s : { ...s, status: "paused" }));
    const onEnded = () => endedHandlerRef.current?.();
    const onError = () =>
      setState((s) => ({ ...s, status: "error", error: "تعذّر تشغيل التسجيل." }));

    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("durationchange", onLoadedMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("durationchange", onLoadedMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  /* ----------------------------------------------------------------------- */

  const sortedTimingsRef = useRef<AyahTimings[]>([]);

  /** Pure helper: locate the word active at an exact time within an ayah. */
  function findWordAt(t: AyahTimings, time: number) {
    const words = t.words;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (time >= w.start - 0.02 && time <= w.end + 0.02) return w;
    }
    let nearest = words[0];
    for (const w of words) {
      if (time >= w.start) nearest = w;
    }
    return nearest ?? null;
  }

  /** Find the ayah (and word) at an exact playback position. */
  const positionAt = useCallback(
    (time: number): { ayah: number | null; word: number | null } => {
      const src = sourceRef.current;
      if (!src) return { ayah: null, word: null };

      // Per-ayah files: the current file IS the ayah; word comes from timings
      // (verified first, WORD_AUTO estimates second).
      if (src.granularity === "ayah" && src.currentAyahForGranularity) {
        const n = src.currentAyahForGranularity;
        const t = src.timings?.get(n) ?? estimatedRef.current?.get(n);
        if (t && t.words.length > 0) {
          const localTime = time; // per-ayah file starts at 0
          const word = findWordAt(t, localTime);
          return { ayah: n, word: word ? word.wordNumber : null };
        }
        return { ayah: n, word: null };
      }

      // Full-surah stream: must have a timing map to know the position.
      const list = sortedTimingsRef.current;
      if (list.length === 0) return { ayah: null, word: null };
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        if (time >= t.start - 0.05 && time <= t.end + 0.05) {
          const word = findWordAt(t, time);
          return { ayah: t.ayah, word: word ? word.wordNumber : null };
        }
      }
      return { ayah: null, word: null };
    },
    [sortedTimingsRef],
  );

  // Keep sorted timings in sync whenever a new timing map is loaded.
  useEffect(() => {
    const map = timingsRef.current;
    sortedTimingsRef.current = map
      ? [...map.values()].sort((a, b) => a.ayah - b.ayah)
      : [];
  }, [timingsVersion]);

  /* ----------------------------------------------------------------------- */

  // rAF loop while playing — high-frequency but cheap; updates only on change.
  // We keep the latest position resolver + sleep deadline in refs so the loop
  // is stable and never captures stale values or references itself.
  const positionAtRef = useRef(positionAt);
  const sleepEndsAtRef = useRef<number | null>(state.sleepEndsAt);
  useEffect(() => { positionAtRef.current = positionAt; }, [positionAt]);
  useEffect(() => { sleepEndsAtRef.current = state.sleepEndsAt; }, [state.sleepEndsAt]);

  useEffect(() => {
    if (state.status !== "playing") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      const audio = audioRef.current;
      if (!audio) return;
      const t = audio.currentTime;
      const resolver = positionAtRef.current;
      const { ayah, word } = resolver(t);

      setState((s) => {
        if (s.currentTime === t && s.currentAyah === ayah && s.currentWord === word) return s;
        return { ...s, currentTime: t, currentAyah: ayah, currentWord: word };
      });

      setActiveAyahForScroll((prev) => (prev === ayah ? prev : ayah));

      const deadline = sleepEndsAtRef.current;
      if (deadline && Date.now() >= deadline) {
        audio.pause();
        setState((s) => ({ ...s, status: "paused", sleepTimerMinutes: null, sleepEndsAt: null }));
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [state.status]);

  /* ----------------------------------------------------------------------- */

  const playAyahFile = useCallback(
    async (source: AudioSource, ayah: number, autoPlay: boolean) => {
      const audio = audioRef.current;
      if (!audio) return;
      const url = source.getUrl(ayah);
      if (!url) {
        setState((s) => ({ ...s, status: "error", error: "تسجيل هذه الآية غير متاح." }));
        return;
      }
      source.currentAyahForGranularity = ayah;
      audio.pause();
      audio.src = url;
      audio.currentTime = 0;
      setState((s) => ({ ...s, currentAyah: ayah, currentWord: null, currentTime: 0, status: "loading" }));
      if (autoPlay) {
        audio.play().catch(() => setState((s) => ({ ...s, status: "error", error: "تعذّر التشغيل." })));
      }
    },
    [],
  );

  const loadSource = useCallback(
    async (source: AudioSource, startAyah = 1, opts: { autoPlay?: boolean } = {}) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Switching source = reload audio AND timings (never carry over).
      sourceRef.current = source;
      timingsRef.current = source.timings;
      estimatedRef.current = null;
      segmentRef.current = null;
      setTimingsVersion((v) => v + 1);

      setState((s) => ({
        ...s,
        status: "loading",
        currentAyah: null,
        currentWord: null,
        syncStatus: source.syncStatus,
        sourceGranularity: source.granularity,
        currentTime: 0,
        duration: 0,
        error: null,
      }));

      if (source.granularity === "surah") {
        const url = source.getUrl(startAyah);
        if (!url) {
          setState((s) => ({ ...s, status: "error", error: "التسجيل غير متاح." }));
          return;
        }
        audio.src = url;
        audio.load();
        source.currentAyahForGranularity = undefined;
        const first = source.timings?.get(startAyah);
        if (first) audio.currentTime = first.start;
        if (opts.autoPlay) audio.play().catch(() => setState((s) => ({ ...s, status: "error", error: "تعذّر التشغيل." })));
      } else {
        await playAyahFile(source, startAyah, !!opts.autoPlay);
      }
    },
    [playAyahFile],
  );

  /* ----------------------------------------------------------------------- */

  const play = useCallback(() => {
    const audio = audioRef.current;
    const source = sourceRef.current;
    if (!audio || !source) return;
    if (audio.src) {
      audio.play().catch(() => {});
    } else {
      loadSource(source, 1, { autoPlay: true });
    }
  }, [loadSource]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (state.status === "playing") pause();
    else play();
  }, [state.status, play, pause]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio || !isFinite(audio.duration)) return;
      const clamped = Math.max(0, Math.min(audio.duration, time));
      audio.currentTime = clamped;
      const { ayah, word } = positionAt(clamped);
      setState((s) => ({ ...s, currentTime: clamped, currentAyah: ayah, currentWord: word }));
    },
    [positionAt],
  );

  const seekToAyah = useCallback(
    (ayah: number, autoPlay = true) => {
      const source = sourceRef.current;
      const audio = audioRef.current;
      if (!source || !audio) return;
      if (source.granularity === "ayah") {
        playAyahFile(source, ayah, autoPlay);
        return;
      }
      const t = source.timings?.get(ayah);
      if (t) {
        audio.currentTime = t.start;
        const { word } = positionAt(t.start);
        setState((s) => ({ ...s, currentAyah: ayah, currentWord: word, currentTime: t.start }));
        if (autoPlay) audio.play().catch(() => {});
      }
    },
    [playAyahFile, positionAt],
  );

  const nextAyah = useCallback(() => {
    const source = sourceRef.current;
    if (!source) return;
    const cur = sourceRef.current?.currentAyahForGranularity ?? state.currentAyah ?? 0;
    const nextN = cur + 1;
    if (source.granularity === "ayah" && source.getUrl(nextN)) {
      playAyahFile(source, nextN, state.status === "playing");
    } else if (source.timings?.has(nextN)) {
      seekToAyah(nextN, state.status === "playing");
    }
  }, [playAyahFile, seekToAyah, state.currentAyah, state.status]);

  const prevAyah = useCallback(() => {
    const source = sourceRef.current;
    if (!source) return;
    const cur = sourceRef.current?.currentAyahForGranularity ?? state.currentAyah ?? 2;
    const prevN = Math.max(1, cur - 1);
    if (source.granularity === "ayah") {
      playAyahFile(source, prevN, state.status === "playing");
    } else if (source.timings?.has(prevN)) {
      seekToAyah(prevN, state.status === "playing");
    }
  }, [playAyahFile, seekToAyah, state.currentAyah, state.status]);

  const setRate = useCallback((rate: PlaybackSpeed) => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
    setState((s) => ({ ...s, playbackRate: rate }));
  }, []);

  const toggleRepeatAyah = useCallback(() => {
    setState((s) => ({ ...s, repeatAyah: !s.repeatAyah, repeatMode: s.repeatAyah ? "off" : "ayah" }));
  }, []);

  const startSegmentRepeat = useCallback((fromAyah: number, toAyah: number) => {
    segmentRef.current = { fromAyah, toAyah };
    setState((s) => ({ ...s, repeatMode: "segment" as RepeatMode }));
  }, []);

  const stopRepeat = useCallback(() => {
    segmentRef.current = null;
    setState((s) => ({ ...s, repeatMode: "off", repeatAyah: false }));
  }, []);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (!minutes) {
      setState((s) => ({ ...s, sleepTimerMinutes: null, sleepEndsAt: null }));
      return;
    }
    setState((s) => ({ ...s, sleepTimerMinutes: minutes, sleepEndsAt: Date.now() + minutes * 60_000 }));
  }, []);

  const toggleAutoScroll = useCallback(() => {
    setState((s) => ({ ...s, autoScroll: !s.autoScroll }));
  }, []);

  /* ----------------------------------------------------------------------- */

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  function handleEnded() {
    const source = sourceRef.current;
    if (!source) return;
    const audio = audioRef.current!;
    const live = stateRef.current;
    const cur = source.currentAyahForGranularity
      ?? live.currentAyah;

    // Repeat ayah
    if (live.repeatAyah && cur) {
      if (source.granularity === "ayah") {
        playAyahFile(source, cur, true);
      } else {
        const t = source.timings?.get(cur);
        if (t) {
          audio.currentTime = t.start;
          audio.play().catch(() => {});
        }
      }
      return;
    }

    // Repeat segment
    if (live.repeatMode === "segment" && segmentRef.current) {
      const { fromAyah, toAyah } = segmentRef.current;
      const nextN = cur && cur < toAyah ? cur + 1 : fromAyah;
      if (source.granularity === "ayah") playAyahFile(source, nextN, true);
      else seekToAyah(nextN, true);
      return;
    }

    // Advance
    if (source.granularity === "ayah") {
      const nextN = (cur ?? 0) + 1;
      if (source.getUrl(nextN)) {
        playAyahFile(source, nextN, true);
        return;
      }
      setState((s) => ({ ...s, status: "ended", currentWord: null }));
    } else {
      setState((s) => ({ ...s, status: "ended", currentWord: null, currentAyah: null }));
    }
  }
  useEffect(() => {
    endedHandlerRef.current = handleEnded;
  });

  /* ----------------------------------------------------------------------- */

  const canHighlightWord = SYNC_META[state.syncStatus].canHighlightWord;

  const seekToWord = useCallback(
    (ayah: number, word: number) => {
      const source = sourceRef.current;
      const audio = audioRef.current;
      if (!source || !audio) return;
      if (!canHighlightWord) return; // no word timings → do not fake it
      const t = source.timings?.get(ayah) ?? estimatedRef.current?.get(ayah);
      const wt = t?.words.find((w) => w.wordNumber === word);
      if (!t || !wt) return;
      const timeInRecording =
        source.granularity === "ayah" ? wt.start : t.start + wt.start;
      audio.currentTime = timeInRecording;
      setState((s) => ({ ...s, currentAyah: ayah, currentWord: word, currentTime: timeInRecording }));
      if (state.status !== "playing") audio.play().catch(() => {});
    },
    [canHighlightWord, state.status]
  );

  return {
    state,
    activeAyahForScroll,
    canHighlightWord,
    speeds: SPEEDS,
    loadSource,
    play,
    pause,
    toggle,
    seek,
    seekToAyah,
    seekToWord,
    nextAyah,
    prevAyah,
    setRate,
    toggleRepeatAyah,
    startSegmentRepeat,
    stopRepeat,
    setSleepTimer,
    toggleAutoScroll,
  };
}

export type AudioEngine = ReturnType<typeof useAudioEngine>;
