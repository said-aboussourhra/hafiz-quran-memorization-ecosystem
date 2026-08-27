/* Generates a single compact bundle of the local Uthmani Quran text
   from the quran-json package → src/data/quranText.ts */
const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "..", "node_modules", "quran-json", "dist", "chapters");
const out = [];
for (let s = 1; s <= 114; s++) {
  const c = JSON.parse(fs.readFileSync(path.join(base, `${s}.json`), "utf8"));
  out.push({ s, t: c.type, n: c.total_verses, v: c.verses.map((x) => x.text) });
}

const header =
  "// AUTO-GENERATED local Uthmani Quran text (quran-json, CC-BY-4.0). Do not edit by hand.\n" +
  "export type LocalSurahText = { s: number; t: string; n: number; v: string[] };\n";
const body = `export const LOCAL_QURAN: LocalSurahText[] = ${JSON.stringify(out)};\n`;

const destDir = path.join(__dirname, "..", "src", "data");
fs.mkdirSync(destDir, { recursive: true });
const dest = path.join(destDir, "quranText.ts");
fs.writeFileSync(dest, header + body);
console.log("wrote", dest, "surahs:", out.length, "bytes:", (header + body).length);
