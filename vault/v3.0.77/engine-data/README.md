# v3 engine-data — deterministic AI-Exposure tables

These bundled JSON-in-JS modules are the **deterministic control** layer for the v3
AI-Exposure engine. Every number the engine returns is a table lookup on **verified
public data** — same input ⇒ same output. No LLM, no network, no invention.

Lives **outside `api/`** on purpose: Vercel routes every file under `api/` as a
serverless function, so the data + core compute sit here and are pulled into
`api/engine.js` by import-tracing.

## The chain

```
SSOC (MCF posting tag) → ISCO-08 (SingStat) → SOC 2010 (BLS) → AIOE (Felten et al.)
```

AIOE and the BLS crosswalk **share the 2010 SOC vintage**, so the join is clean — no
extra SOC-version hop.

## Files

| File | Rows | What |
|---|---|---|
| `aioe.js` | 774 | SOC 2010 → AIOE z-score (AI Occupational Exposure) |
| `ssoc-isco.js` | 993 SSOC | SSOC 2020 (5-digit) → ISCO-08 (with `partial` split flag) |
| `isco-soc.js` | 438 ISCO | ISCO-08 → SOC 2010 (many-to-many; `part` flag) |
| `provenance.js` | — | sources, URLs, retrieval dates, citations, licences |
| `engine-core.js` | — | pure `computeEngine({ ssoc, title })` → exposure contract |

## Sources & licences (retrieved 2026-06-08)

- **AIOE** — Felten, Raj & Seamans (2021), *Strategic Management Journal* 42(12):2195–2217.
  `https://github.com/AIOE-Data/AIOE` (`AIOE_DataAppendix.xlsx`, Appendix A).
  **No licence file in the repo** → used here with the required academic citation +
  source link (owner-approved 2026-06-08). z-score, mean 0 / SD 1.
- **SSOC 2020 ↔ ISCO-08** — Singapore Dept. of Statistics (SingStat), correspondence
  table updated 20 Mar 2020. SingStat Terms of Use: free reproduction **with source
  acknowledgement**. Attribute: *"Source: Singapore Department of Statistics, SSOC 2020 –
  Correspondence Table with ISCO-08."*
- **ISCO-08 ↔ SOC 2010** — U.S. Bureau of Labor Statistics, *ISCO-08 × SOC 2010 Crosswalk*
  (Aug 2012, upd Jun 2015). U.S. federal work → **public domain**.

## The 0–100 index (documented transform)

`exposure.index` = **percentile rank** of the occupation's AIOE (unweighted mean across
the SOC codes mapped from its ISCO) among all 774 AIOE occupations. The raw `zMean` and
`zRange` are carried alongside so the true magnitude is never lost. Bands: `high` ≥ 80,
`moderate` 50–79, `low` < 50.

## Honesty rules baked in

- Unknown / missing SSOC, or no AIOE for any mapped SOC → `ok:false` + reason. **The
  number is withheld, never faked.**
- SSOC→multi-ISCO splits are unioned and weighted as one occupation; `confidence` drops.
- Per-skill / per-duty exposure is **out of scope** (AIOE is occupation-level only); the
  engine never emits a per-skill bar.

Raw source files (xlsx/json + extracts) are kept locally under `sample/` (untracked) as
the audit trail.
