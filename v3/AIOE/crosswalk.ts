// SG Career View v3 - deterministic, multi-layer SSOC -> AIOE resolver.
// Chain: SSOC --(SingStat)--> ISCO-08 --(BLS)--> SOC 2010 --(AIOE layers)--> scores
// PRIMARY layer = Language Modeling AIOE (2023, generative era).
// BASELINE layer = Aggregate AIOE (2021). Also exposes Image Generation AIOE (2023).
// No inference. The SSOC->SOC crosswalk is resolved once; each layer reuses it.

import {
  PRIMARY_LAYER, BASELINE_LAYER,
  type AioeTable, type AioeResult, type AggregationPolicy, type CrosswalkTable,
  type Isco08Code, type SsocCode, type Soc2010Code, type ResolutionTrace,
  type LayerKey, type LayerResult,
} from "./types";

import scoresJson from "./aioe-scores.json";
import ssocToIsco from "./ssoc-to-isco08.json";    // CrosswalkTable<SsocCode, Isco08Code>
import iscoToSoc from "./isco08-to-soc2010.json";   // CrosswalkTable<Isco08Code, Soc2010Code>

const AIOE = scoresJson as unknown as AioeTable;
const SSOC_ISCO = ssocToIsco as unknown as CrosswalkTable<SsocCode, Isco08Code>;
const ISCO_SOC = iscoToSoc as unknown as CrosswalkTable<Isco08Code, Soc2010Code>;

const LAYERS: LayerKey[] = ["lm2023", "ig2023", "agg2021"];

function collapse(values: number[], weights: number[], policy: AggregationPolicy): number {
  if (values.length === 1) return values[0];
  const sorted = [...values].sort((a, b) => a - b);
  switch (policy) {
    case "max": return Math.max(...values);
    case "min": return Math.min(...values);
    case "median": {
      const m = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
    }
    case "mean": return values.reduce((a, b) => a + b, 0) / values.length;
    case "weighted_mean":
    default: {
      const wsum = weights.reduce((a, b) => a + b, 0) || 1;
      return values.reduce((acc, v, i) => acc + v * weights[i], 0) / wsum;
    }
  }
}

/** Resolve one SSOC code to AIOE scores across all layers, deterministically. */
export function resolveAioe(
  ssoc: SsocCode,
  policy: AggregationPolicy = "weighted_mean",
): AioeResult {
  const iscoEdges = SSOC_ISCO[ssoc] ?? [];
  const iscoPath: Isco08Code[] = iscoEdges.map(e => e.to);

  // SSOC -> ISCO -> SOC, carrying the product of edge weights to each SOC leaf.
  const socWeight = new Map<Soc2010Code, number>();
  for (const ie of iscoEdges) {
    const wIsco = ie.weight ?? 1;
    for (const se of ISCO_SOC[ie.to] ?? []) {
      const w = wIsco * (se.weight ?? 1);
      socWeight.set(se.to, (socWeight.get(se.to) ?? 0) + w);
    }
  }

  const socMatched: Soc2010Code[] = [];
  const socUnmatched: Soc2010Code[] = [];
  for (const soc of socWeight.keys()) {
    (AIOE.scores[soc] ? socMatched : socUnmatched).push(soc);
  }

  let confidence: ResolutionTrace["confidence"] = "none";
  if (socMatched.length === 1 && socUnmatched.length === 0) confidence = "exact";
  else if (socMatched.length > 1 && socUnmatched.length === 0) confidence = "aggregated";
  else if (socMatched.length >= 1 && socUnmatched.length > 0) confidence = "partial";

  const trace: ResolutionTrace = { ssoc, iscoPath, socMatched, socUnmatched, policy, confidence };

  // Collapse each layer over the matched SOC set (weights identical across layers).
  const layers = {} as Record<LayerKey, LayerResult>;
  for (const layer of LAYERS) {
    const vals: number[] = [], wts: number[] = [];
    for (const soc of socMatched) {
      const raw = AIOE.scores[soc][layer];
      if (raw != null) { vals.push(raw); wts.push(socWeight.get(soc)!); }
    }
    if (vals.length === 0) { layers[layer] = { raw: null, norm: null }; continue; }
    const raw = collapse(vals, wts, policy);
    const { rawMin, rawMax } = AIOE._meta.layers[layer];
    layers[layer] = { raw: round6(raw), norm: round3(((raw - rawMin) / (rawMax - rawMin)) * 100) };
  }

  const primary = layers[PRIMARY_LAYER];
  const baseline = layers[BASELINE_LAYER];
  const delta = (primary.raw != null && baseline.raw != null)
    ? round6(primary.raw - baseline.raw) : null;

  return { ssoc, primary, baseline, layers, delta, trace };
}

export function resolveMany(
  ssocs: SsocCode[],
  policy: AggregationPolicy = "weighted_mean",
): Record<SsocCode, AioeResult> {
  const out: Record<SsocCode, AioeResult> = {};
  for (const s of ssocs) out[s] = resolveAioe(s, policy);
  return out;
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const round3 = (n: number) => Math.round(n * 1e3) / 1e3;

export { AIOE, PRIMARY_LAYER, BASELINE_LAYER };
