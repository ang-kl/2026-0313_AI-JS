# SG Career View v3 — PR-sized build tasks (candidate-side placement engine)

Turns the research-grounded model into shippable slices. Builds on the existing repo
(`v3/api/anatomy.js`, `esco.js`, `mcf.js`, `claude.js`, `datagov.js`) and the market-side
roadmap in `doc/development-plan.md`. Each slice is **independently useful**, ships as **one PR**
with a **PATCH bump + journal entry + serial-state bump** (per house ship rhythm), and is
**grounded in a named source** (so nothing is invented).

Legend — **Size:** S ≈ ½ day · M ≈ 1–2 days · L ≈ 3+ days. **Status:** ✅ reuses existing · 🔧 needs planned table.

---

## Dependency order (build top-down)

```
P0 verify ─┬─ P1 candidate fingerprint ──┬─ P3 true-fit + proof ledger ──┬─ P6 scorecard/brief ── P7 MCP tools
           └─ P2 candidate anatomy ───────┘                              │
P-market (dev-plan Ph1: mcf_market_daily) ── P4 demand-proof gate ───────┤
                                                  P5 fairness + age ──────┘
                                             P8 AI-exposure re-ground (independent)
                                             P9 adjacency routing (later)
```

---

## PR-0 — Verify candidate-side assumptions  ·  Size S  ·  ✅
**Scope:** throwaway script: confirm `esco.js occupationFingerprint` accepts a free-text duty list (person side) and returns essential skills + `reuseLevel`; confirm `anatomy.js scoreJobAnatomy` / `putProfile` / `screen_keyword_gaps` input shapes. Append a "verified candidate-side schema" note to `doc/development-plan.md`.
**Files:** none committed (script) + doc note.
**Grounded in:** repo source (de-risk before building).
**Accept:** documented input/output shapes for the three functions on the candidate side.

## PR-1 — Candidate Fingerprint  ·  Size M  ·  ✅ extend `esco.js`
**Scope:** new `candidateFingerprint(dutyPhrases[])` mirroring `occupationFingerprint`: extract skill spans → link to ESCO essential skills → return occupation **blend** + `isco_major` spread, weighting `Occupation-/Sector-specific` skills above `Transversal`.
**Files:** `v3/api/esco.js` (+ a thin `/api/candidate` entry).
**Grounded in:** ESCO v1.2.1; skill-span extraction (ESCOXLM-R / SkillSpan, Zhang & Plank); ESCO–O*NET crosswalk (EC 2024).
**Accept:** Adrian's CV → a defensible blend (transformation lead + ICT/PM + business analyst + adult educator), not one mislabelled title.

## PR-2 — Candidate Anatomy  ·  Size S–M  ·  ✅ reuse `anatomy.js`
**Scope:** run the existing `scoreJobAnatomy()` on a person's builds/owned outcomes → layer-mix (Activity/Coordination/Accountability/Relational/Judgment) + AI-exposure; **server-recomputed** (client can't write the score).
**Files:** `v3/api/anatomy.js` (add a candidate entry path), `claude.js` (Haiku decomposition prompt).
**Grounded in:** existing engine; Autor-Levy-Murnane task taxonomy.
**Accept:** Adrian's profile surfaces Accountability/Relational/Judgment concentration as an AI-resilience signal.

## PR-3 — True-Fit Match + Proof Ledger  ·  Size L  ·  ✅/🔧 (core)
**Scope:** for a target role, build the tiered screen via `putProfile`; map both sides to ESCO essential skills; score **set-overlap per layer, weighted by skill rarity** (NOT token frequency). Every MET claim binds to an artifact on a **verifiability tier** (A live/referee · B cert · C self-asserted = "claimed", never "covered"). Reuse `screen_keyword_gaps` (counts only). **Weight evidence by Schmidt-Hunter validity** (work-sample ≫ degree/experience).
**Files:** `v3/api/anatomy.js`, `esco.js`, new matcher module.
**Grounded in:** Schmidt & Hunter (1998); ConFit (Yu 2024) / CareerBERT (2025) for recall; Wolgast et al. (2017) structured-selection.
**Accept:** Adrian × a real MCF role → per-layer overlap + a proof ledger where his live builds rank as the top-validity evidence.

## PR-4 — Demand-Proof gate  ·  Size M  ·  🔧 needs market table
**Scope:** before recommending a target, query `mcf_market_daily` (dev-plan Ph1) for rolling 9/30-day posting count (+ sample-size confidence), salary p25/p50/p75, experience band, and the outsourcing/FCF-window share (strip compliance-only). **Default verdict if demand isn't real: "do not spend."**
**Files:** `v3/api/mcf.js`, new `demandProof()`; depends on dev-plan Phase 1.
**Grounded in:** MOM FCF 14-day rule; del Rio-Chanona / Waters-Shutters for the adjacency layer (PR-9).
**Accept:** a target returns a real/not-real verdict with the live numbers behind it.

## PR-5 — Signal/Index classifier + Fairness self-check + Age handling  ·  Size M  ·  🔧
**Scope:** (a) tag every CV/JD field **index** (unalterable — age, grad-year → excluded from the maths) vs **signal** (alterable — must pass cost-to-fake × validity); (b) **p%-rule** disparate-impact self-check (target ≥ 80%); (c) JD-language scanner flagging **TGFEP-prohibited** phrases ("fresh/junior only", coded "digital-native"); (d) a WFA-compliant **audit trail** (traceable, checkable).
**Files:** new `fairness.js`; hook into the matcher; fairness-audit view over `anatomy.js` counts.
**Grounded in:** Spence (1973); EEOC four-fifths (29 CFR 1607.4(D)); Feldman et al. (2015) p%-rule; Raghavan et al. (2020); Neumark / Lahey; TGFEP + Workplace Fairness Act 2025; K&L Gates (2025).
**Accept:** age/grad-year never enter the score; ad-language flags fire; an exportable audit record per match.

## PR-6 — Two artifacts: Candidate Brief + Employer Fair Scorecard  ·  Size M  ·  ✅
**Scope:** from one ledger render (a) candidate bridge sheet (proof → each duty + the one real gap + cheapest costly-signal close); (b) employer **Fair Scorecard** (duty grid + skills-overlap %, priced to live p50, cost-of-gap vs cost-of-hire, FCF/TAFEP audit line). Both labelled "AI-assisted; human decides".
**Files:** `claude.js` (narration only, numbers passed in), a render module / `?view=` page.
**Grounded in:** Fuller "Hidden Workers" (2021); STARs (2020); HBS/Burning Glass (2024) — change the *ranking*, not just the filter.
**Accept:** reproduces the Adrian × Metta scorecard from real data, every cell sourced.

## PR-7 — MCP candidate tools  ·  Size M  ·  🔧 extends planned MCP
**Scope:** expose `candidate_fingerprint`, `true_fit_rank(candidate, role)`, `demand_proof(role)`, `fundable_hire_brief(candidate, employer)` on the MCP read surface (dev-plan Ph2). No blind numeric hire-score.
**Files:** `v3/api/mcp.js` (planned).
**Grounded in:** two-sided liquidity (lets a hospital's own agent query the pool).
**Accept:** an external agent can pull a fundable-hire brief for a target seat.

## PR-8 — Re-ground AI-exposure (independent)  ·  Size M  ·  ✅
**Scope:** replace `anatomy.js` hand-coded layer-resilience constants with published scores: **AIOE** index (O*NET-linked) + **SML** rubric + LLM-exposure (Eloundou). Document the mapping.
**Files:** `v3/api/anatomy.js`, a constants/data file.
**Grounded in:** Felten-Raj-Seamans (AIOE); Brynjolfsson-Mitchell-Rock (SML); Eloundou (2024).
**Accept:** resilience scores trace to a citation, not an arbitrary constant.

## PR-9 — Adjacency / realistic-target routing  ·  Size L  ·  🔧 later
**Scope:** build an occupation-mobility network from MCF flows; directional transition-potential P(S→T); route a candidate to *reachable* adjacent roles where demand is real.
**Files:** new `adjacency.js`; depends on the market table.
**Grounded in:** del Rio-Chanona/Mealy/Farmer (2021); Neffke-Henning (2013); Waters-Shutters (2022); OECD (2024).
**Accept:** Adrian → ranked reachable targets (e.g. Service Transformation Lead, Change Adoption, Data Governance PM) with transition-potential + live demand.

---

## Suggested first three PRs (fastest value, lowest risk)
1. **PR-1 Candidate Fingerprint** — unlocks everything, reuses `esco.js`.
2. **PR-2 Candidate Anatomy** — reuses `scoreJobAnatomy`, immediate "AI-resilient seniority" output.
3. **PR-3 True-Fit + Proof Ledger** — the core; produces a real match a human trusts.

## Cross-cutting guardrails (every PR)
- Deterministic numbers **server-computed**; LLM only narrates; "[UNVERIFIED]" over a guess.
- No PII in the maths; derived data only (matches the repo's privacy stance).
- Each artifact carries Source · Confidence · Time-window and "AI-assisted; human decides".
- Ship the outsourcing/FCF classifier with a visible caveat + a hand-labelled validation sample before any "ghost post" claim.
