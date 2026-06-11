// GENERATED from verified public sources — do not hand-edit. See provenance.js / README.md.
// Regenerate via the documented build (sources retrieved 2026-06-08).
export default {
  "aioe": {
    "name": "AI Occupational Exposure (AIOE)",
    "measure": "AIOE standardized index (z-score, mean 0 / SD 1)",
    "occupations": 774,
    "socVintage": "2010 SOC",
    "source": "Felten, Raj & Seamans (2021), Strategic Management Journal 42(12):2195-2217",
    "url": "https://github.com/AIOE-Data/AIOE",
    "file": "AIOE_DataAppendix.xlsx (Appendix A)",
    "retrieved": "2026-06-08",
    "license": "No license file in repo; used with required academic citation + source link.",
    "citation": "Felten E, Raj M, Seamans R (2021). Occupational, industry, and geographic exposure to artificial intelligence: A novel dataset and its potential uses. Strategic Management Journal 42(12):2195-2217."
  },
  "ssocIsco": {
    "name": "SSOC 2020 - ISCO-08 correspondence",
    "vintage": "SSOC 2020",
    "source": "Singapore Department of Statistics (SingStat)",
    "url": "https://www.singstat.gov.sg/standard-classifications/national-classifications/singapore-standard-occupational-classification-ssoc",
    "file": "SSOC2020-ISCO08 correspondence (updated 20 Mar 2020)",
    "retrieved": "2026-06-08",
    "cardinality": "many-to-many (most many-to-one; ~16% partial splits)",
    "license": "SingStat Terms of Use: free reproduction with source acknowledgement.",
    "attribution": "Source: Singapore Department of Statistics, SSOC 2020 - Correspondence Table with ISCO-08."
  },
  "iscoSoc": {
    "name": "ISCO-08 - SOC 2010 crosswalk",
    "socVintage": "2010 SOC",
    "source": "U.S. Bureau of Labor Statistics (BLS) / SOC Policy Committee",
    "url": "https://www.bls.gov/soc/soccrosswalks.htm",
    "file": "ISCO_SOC_Crosswalk.xls (Aug 2012, updated Jun 2015)",
    "retrieved": "2026-06-08",
    "cardinality": "many-to-many (carry all matches)",
    "license": "U.S. federal government work - public domain."
  },
  "chain": "SSOC -> ISCO-08 (SingStat) -> SOC 2010 (BLS) -> AIOE (Felten et al.). AIOE and BLS crosswalk share the 2010 SOC vintage (clean join, no extra hop).",
  "indexTransform": "AI-Exposure Index (0-100) = percentile rank of the occupation's AIOE (unweighted mean across mapped SOC codes) among all 774 AIOE occupations. Raw z-mean and z-range are carried for fidelity."
};
