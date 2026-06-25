# AIOE crosswalk for SG Career View v3 (multi-layer)

Maps Singapore **SSOC** codes (as tagged on MyCareerFuture postings) to AI
Occupational Exposure scores, across three layers from Felten, Raj & Seamans.

## Layers (all SOC 2010, 774 occupations)
| Key       | Measure                                   | Role     | Source |
|-----------|-------------------------------------------|----------|--------|
| `lm2023`  | Language Modeling AIOE (generative era)   | PRIMARY  | arXiv 2303.01157 |
| `ig2023`  | Image Generation AIOE (generative era)    | -        | SSRN 4414065 |
| `agg2021` | Aggregate AIOE (all 10 AI applications)   | BASELINE | SMJ 42(12) |

`resolveAioe` returns `primary` (= `lm2023`), `baseline` (= `agg2021`), the full
`layers` map, and `delta` (primary raw - baseline raw). A positive delta means
generative language modeling lifts an occupation's exposure relative to the
pre-ChatGPT 2021 measure - e.g. Writers & Authors: LM 1.17 vs 2021 0.99.

## The chain
```
SSOC --(SingStat)--> ISCO-08 --(BLS)--> SOC 2010 --(AIOE layers)--> scores
```
The SSOC->SOC crosswalk is resolved once; all three layers reuse it, so switching
or comparing layers never touches the crosswalk - only the scores asset.

## Files
- `aioe-scores.json` - committed asset, all 3 layers x 774 occupations (real data).
- `ssoc-to-isco08.json`  - SEED. Replace with the full SingStat correspondence.
- `isco08-to-soc2010.json` - SEED. Replace with the full BLS/Census crosswalk.
- `crosswalk.ts` / `types.ts` - resolver + types.

## Usage
```ts
import { resolveAioe, resolveMany, PRIMARY_LAYER } from "@/lib/aioe/crosswalk";

const r = resolveAioe("26411");
r.primary.raw;        // Language Modeling AIOE (2023)
r.baseline.raw;       // Aggregate AIOE (2021)
r.layers.ig2023.norm; // Image Generation, 0..100
r.delta;              // generative-era shift vs 2021
r.trace.confidence;   // exact | aggregated | partial | none
```

## Confidence flags
- `exact`      - one SOC matched, none missing.
- `aggregated` - several SOC matched (collapsed by policy), none missing.
- `partial`    - some SOC codes had no AIOE entry (mapping loss).
- `none`       - chain incomplete; all layer scores `null` (never silently 0).

## Data still to source (the two seeds)
1. SSOC <-> ISCO-08: SingStat correspondence (match your SSOC vintage, 2020/2024).
2. ISCO-08 <-> SOC 2010: US BLS / Census crosswalk. Use `weight` on 1:many edges
   (e.g. by SG employment share) to keep `weighted_mean` defensible.

## Regenerate the asset
```
git clone https://github.com/AIOE-Data/AIOE.git
npx tsx scripts/build-aioe-data.ts ./AIOE
```

## Note on vintage
All three layers are SOC 2010, so they are mutually consistent and need no
internal reconciliation. Only mixing in SOC 2018 measures (GPTs-are-GPTs, the
Anthropic Economic Index) would require a 2010<->2018 crosswalk.

## Citations
Felten E, Raj M, Seamans R (2021) SMJ 42(12):2195-2217.
Felten E, Raj M, Seamans R (2023) "How will Language Modelers like ChatGPT
Affect Occupations and Industries?" arXiv:2303.01157; "Occupational
Heterogeneity in Exposure to Generative AI", SSRN 4414065.
Data: github.com/AIOE-Data/AIOE
