/**
 * Build-time generator: three AIOE xlsx -> consolidated aioe-scores.json
 * Inputs (from github.com/AIOE-Data/AIOE):
 *   AIOE_DataAppendix.xlsx                  (Appendix A -> agg2021, BASELINE)
 *   "Language Modeling AIOE and AIIE.xlsx"  (LM AIOE   -> lm2023,  PRIMARY)
 *   "Image Generation AIOE and AIIE.xlsx"   (IG AIOE   -> ig2023)
 * Run: npx tsx scripts/build-aioe-data.ts ./AIOE_repo
 */
import * as XLSX from "xlsx";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "./AIOE_repo";
const read = (file: string, sheet: string) =>
  XLSX.utils.sheet_to_json<Record<string, unknown>>(XLSX.readFile(join(dir, file)).Sheets[sheet]);

const a21 = read("AIOE_DataAppendix.xlsx", "Appendix A");
const lm  = read("Language Modeling AIOE and AIIE.xlsx", "LM AIOE");
const ig  = read("Image Generation AIOE and AIIE.xlsx", "IG AIOE");

type Row = { title: string; agg2021: number; lm2023: number; ig2023: number };
const rows = new Map<string, Row>();
const soc = (r: Record<string, unknown>) => String(r["SOC Code"]).trim();
for (const r of a21) rows.set(soc(r), { title: String(r["Occupation Title"]).trim(),
  agg2021: Number(r["AIOE"]), lm2023: NaN, ig2023: NaN });
for (const r of lm) { const e = rows.get(soc(r)); if (e) e.lm2023 = Number(r["Language Modeling AIOE"]); }
for (const r of ig) { const e = rows.get(soc(r)); if (e) e.ig2023 = Number(r["Image Generation AIOE"]); }

const cols = ["agg2021", "lm2023", "ig2023"] as const;
const range = (c: typeof cols[number]) => {
  const v = [...rows.values()].map(r => r[c]).filter(n => !Number.isNaN(n));
  return { rawMin: Math.min(...v), rawMax: Math.max(...v) };
};
const R = { agg2021: range("agg2021"), lm2023: range("lm2023"), ig2023: range("ig2023") };
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;
const r3 = (n: number) => Math.round(n * 1e3) / 1e3;
const norm = (v: number, c: typeof cols[number]) =>
  Number.isNaN(v) ? null : r3(((v - R[c].rawMin) / (R[c].rawMax - R[c].rawMin)) * 100);

const scores: Record<string, Record<string, unknown>> = {};
for (const [code, r] of rows) {
  const e: Record<string, unknown> = { title: r.title };
  for (const c of cols) { e[c] = Number.isNaN(r[c]) ? null : r6(r[c]); e[`${c}_norm`] = norm(r[c], c); }
  scores[code] = e;
}

const lbl = (s: string) => ({ rawMin: r6(R[s as keyof typeof R].rawMin), rawMax: r6(R[s as keyof typeof R].rawMax) });
const out = {
  _meta: {
    socVintage: "SOC 2010", count: rows.size,
    layers: {
      lm2023:  { label: "Language Modeling AIOE (Felten, Raj & Seamans 2023) - PRIMARY", ...lbl("lm2023"),  source: "Language Modeling AIOE and AIIE.xlsx; arXiv 2303.01157" },
      ig2023:  { label: "Image Generation AIOE (Felten, Raj & Seamans 2023)",            ...lbl("ig2023"),  source: "Image Generation AIOE and AIIE.xlsx; SSRN 4414065" },
      agg2021: { label: "Aggregate AIOE (Felten, Raj & Seamans 2021) - BASELINE",        ...lbl("agg2021"), source: "AIOE_DataAppendix.xlsx Appendix A; SMJ 42(12)" },
    },
  },
  scores,
};
writeFileSync("src/lib/aioe/aioe-scores.json", JSON.stringify(out, null, 2));
console.log(`Wrote ${rows.size} occupations x 3 layers.`);
