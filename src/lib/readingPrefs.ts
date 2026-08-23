// Typed, persisted reading preferences for the Mushaf reader.
// All functions are SSR-safe and never touch localStorage during render on the server.
import { readBool, readNumber, readString, writeValue } from "./clientSettings";

export type Theme = "light" | "dark" | "sepia";
export type HighlightStyle = "background" | "underline" | "frame";
export type ReaderMode = "page" | "ayah" | "continuous";

const KEYS = {
  fontSize: "hafiz_fontsize",
  lineHeight: "hafiz_lineheight",
  wordSpacing: "hafiz_wordspacing",
  readingWidth: "hafiz_readingwidth",
  theme: "hafiz_theme",
  highlightStyle: "hafiz_hlstyle",
  mode: "hafiz_mode",
} as const;

export const FONT_SIZE = { min: 22, max: 72, step: 2, def: 34 };
export const LINE_HEIGHT = { min: 1.8, max: 3.4, step: 0.1, def: 2.5 };
export const WORD_SPACING = { min: 0, max: 12, step: 1, def: 0 };
export const READING_WIDTH = { min: 680, max: 1280, step: 40, def: 1024 };

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function readFontSize(): number {
  return clamp(readNumber(KEYS.fontSize, FONT_SIZE.def), FONT_SIZE.min, FONT_SIZE.max);
}
export function writeFontSize(n: number) {
  writeValue(KEYS.fontSize, String(clamp(n, FONT_SIZE.min, FONT_SIZE.max)));
}

export function readLineHeight(): number {
  const v = Math.round(readNumber(KEYS.lineHeight, LINE_HEIGHT.def) * 10) / 10;
  return clamp(v, LINE_HEIGHT.min, LINE_HEIGHT.max);
}
export function writeLineHeight(n: number) {
  writeValue(KEYS.lineHeight, String(clamp(n, LINE_HEIGHT.min, LINE_HEIGHT.max)));
}

export function readWordSpacing(): number {
  return clamp(readNumber(KEYS.wordSpacing, WORD_SPACING.def), WORD_SPACING.min, WORD_SPACING.max);
}
export function writeWordSpacing(n: number) {
  writeValue(KEYS.wordSpacing, String(clamp(n, WORD_SPACING.min, WORD_SPACING.max)));
}

export function readReadingWidth(): number {
  return clamp(readNumber(KEYS.readingWidth, READING_WIDTH.def), READING_WIDTH.min, READING_WIDTH.max);
}
export function writeReadingWidth(n: number) {
  writeValue(KEYS.readingWidth, String(clamp(n, READING_WIDTH.min, READING_WIDTH.max)));
}

export function readTheme(): Theme {
  const v = readString(KEYS.theme, "light");
  return v === "dark" || v === "sepia" ? v : "light";
}
export function writeTheme(t: Theme) {
  writeValue(KEYS.theme, t);
}

export function readHighlightStyle(): HighlightStyle {
  const v = readString(KEYS.highlightStyle, "background");
  return v === "underline" || v === "frame" ? v : "background";
}
export function writeHighlightStyle(s: HighlightStyle) {
  writeValue(KEYS.highlightStyle, s);
}

export function readMode(): ReaderMode {
  const v = readString(KEYS.mode, "page");
  return v === "ayah" || v === "continuous" ? v : "page";
}
export function writeMode(m: ReaderMode) {
  writeValue(KEYS.mode, m);
}
