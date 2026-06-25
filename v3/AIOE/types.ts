// SG Career View v3 - AIOE crosswalk types (multi-layer).
// All layers are SOC 2010, 774 detailed occupations.
//   lm2023  - Language Modeling AIOE (Felten, Raj & Seamans 2023)  <- PRIMARY
//   ig2023  - Image Generation AIOE  (Felten, Raj & Seamans 2023)
//   agg2021 - Aggregate AIOE         (Felten, Raj & Seamans 2021)  <- BASELINE

export type SsocCode = string;
export type Isco08Code = string;
export type Soc2010Code = string;

export type LayerKey = "lm2023" | "ig2023" | "agg2021";
export const PRIMARY_LAYER: LayerKey = "lm2023";
export const BASELINE_LAYER: LayerKey = "agg2021";

/** Per-occupation scores across all three layers (raw + 0..100 normalised). */
export interface AioeScore {
  title: string;
  agg2021: number | null;  agg2021_norm: number | null;
  lm2023: number | null;   lm2023_norm: number | null;
  ig2023: number | null;   ig2023_norm: number | null;
}

export interface LayerMeta { label: string; rawMin: number; rawMax: number; source: string }

export interface AioeTable {
  _meta: { socVintage: string; count: number; layers: Record<LayerKey, LayerMeta> };
  scores: Record<Soc2010Code, AioeScore>;
}

export interface CrosswalkEdge<T extends string = string> { to: T; weight?: number }
export type CrosswalkTable<F extends string = string, T extends string = string> =
  Record<F, CrosswalkEdge<T>[]>;

export type AggregationPolicy = "weighted_mean" | "mean" | "max" | "min" | "median";

export interface ResolutionTrace {
  ssoc: SsocCode;
  iscoPath: Isco08Code[];
  socMatched: Soc2010Code[];
  socUnmatched: Soc2010Code[];
  policy: AggregationPolicy;
  confidence: "exact" | "aggregated" | "partial" | "none";
}

/** One resolved layer. */
export interface LayerResult { raw: number | null; norm: number | null }

export interface AioeResult {
  ssoc: SsocCode;
  primary: LayerResult;                 // == layers[PRIMARY_LAYER] (lm2023)
  baseline: LayerResult;                // == layers[BASELINE_LAYER] (agg2021)
  layers: Record<LayerKey, LayerResult>;
  /** primary raw minus baseline raw; positive = generative AI lifts exposure vs 2021. */
  delta: number | null;
  trace: ResolutionTrace;
}
