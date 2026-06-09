(№ 1 - 09-06 ’26 17:41 SGT)

# SG Career View v3 — Result-Engine integration spec (“radical at the result, frozen at the door”)

> **Target repo path:** `doc/v3-result-engine-spec.md` (sits beside `doc/v3-engine-wiring-spec.md` and `doc/v3-leap-view.md`).
> **Status:** design draft for review. **Proposed version arc:** v3.1.x per PR, **v3.2.0** at epic close. Version bump is a **G1 confirmation gate** (Rule V-1) — do not bump without Human Lead sign-off.
> **Contract alignment:** the v3 locked contract (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`) governs every line below. Deterministic = control; LLM = advisory only; non-inventive; faithful fidelity.
> **Reader priority:** (1) Claude Code, (2) Human Lead. House rules in `doc/CLAUDE-FULL.md` (R001-R010, gates G1-G4, HDR blocks, ship rhythm) bind this spec.

-----

## §0. Purpose and the one-line thesis

This spec turns the existing pieces — the deterministic `/api/engine` (PR1), the `?view=leap` stakeholder web, the `?view=graph` mindmap, `anatomy.js`, `esco.js` — into **one coherent result experience: the Placement Read.** The radical change is *only* in how results are computed and shown. The way a user gets there does not move.

**Thesis (your `Output = ƒ(Prompt, Context, Control)`):** today the result page still leads with an LLM-shaped number (“N of M skills”, “AI Exposure Overview” tagged `~ AI estimate`). The radical move is to make **Control** (the deterministic engine) author every number and verdict, and confine the **Prompt** (LLM) to narration. Same input -> same output, every figure carries `source` + `confidence`, `[UNVERIFIED]` over a guess.

This is the engineering instantiation of the advert-reading method we worked through in chat: read the posting as an artefact, reverse-engineer the pressure that produced it, answer the 5W1H, then split human vs AI work. The Leap view already renders the *pressure*; the engine renders the *exposure*; this spec fuses them and adds the candidate-side placement read on top.

-----

## §1. FROZEN surfaces (do not touch)

These are the “landing + searching the role” you asked to protect. **Radicality: FROZEN (zero change).** A change here is a Rule-violation stop (CLAUDE-FULL §11).

|Frozen surface                           |Where it lives (`v3/src/App.jsx` unless noted)                                                                                                                                                                |Why frozen                                                         |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
|The role search box + first-run help     |`searchOccupations(keyword,count)`, `detectFunctionKeyword`, `lookupSeniorMgmt`, `SENIOR_MGMT_LOOKUP`, `FUNCTION_KEYWORDS`/`FUNCTION_SUGGESTIONS`, the v3.0.8 “you’re analysing a 🇸🇬 MyCareersFuture role” copy|this is the user’s entry ritual; it is stable and tested           |
|Search -> occupation resolution          |`getEscoSkills`, the `/api/esco` occupation lookup, `ISCO_COHERENCE_MAP`/`checkIscoCoherence` (the v3.0.4 confidence floor)                                                                                   |the resolver feeds the engine; changing it changes search behaviour|
|Browse SG jobs card incl. “< 4 yrs” scout|the v3.0.9 Browse card + `/api/mcf` browse path                                                                                                                                                               |unrelated to the result read                                       |
|Skill extraction for the searched role   |`getSkills`, `getSkillsFromPosting`                                                                                                                                                                           |output is an INPUT to the engine; freeze its contract              |

**Guard rule (new, propose as R011):** before any result-page PR is packaged, run `recipe R-FREEZE` (see `recipes/`) — a grep/diff that asserts the frozen symbols above are byte-identical to `main`. A non-zero diff on a frozen symbol **blocks packaging** (mirrors R005 grep-before-packaging).

> Note on v2: the repo-root app (`src/App.jsx`, the “AI skilling” v2 lineage at `v2_2026-04-08/v2_0_7/`) is **out of scope**. A v3-only change leaves v2’s build output identical (per `doc/v3-leap-view.md` deploy note). Do not edit v2 to achieve a v3 result.

-----

## §2. The Placement Read — target result information architecture

One server-computed object, rendered across the (existing) result surfaces. Nine panels; the engine authors panels 1-4, 7, 8; the LLM narrates only.

```
SEARCH (frozen) --> role + skills + (optional CV) --> PLACEMENT READ
  P1  AI-Exposure Index            engine  ✓ computed   <-- NEW HEADLINE (replaces "N of M")
  P2  Occupation resolve + coherence engine ✓ computed  <-- reconcile(SSOC, skill-fingerprint)
  P3  Mirror-roles by %            engine  ✓ computed
  P4  Role anatomy / AI-resilience engine  ✓ computed   <-- re-grounded on AIOE (no hand constants)
  P5  Leap stakeholder web         derived ◐ tagged     <-- the "why advertised" pressures (LIVE)
  P6  True-Fit + Proof Ledger      engine  ✓ computed   <-- CV x role, rarity + validity weighted
  P7  Demand-Proof gate            engine  ✓ computed   <-- real / not-real; "do not spend" default
  P8  Fairness + age audit         engine  ✓ computed   <-- index vs signal, p%-rule, WFA/TAFEP line
  P9  Two artifacts                render               <-- Candidate Brief + Employer Fair Scorecard
  ----------------------------------------------------------------
  LLM narration card (claudeCall)  ~ AI estimate        <-- explains numbers, writes none
```

**Provenance vocabulary (already in code, keep and extend):** `✓ computed` (deterministic, reproducible), `~ AI estimate` (LLM judgement, may vary), `● from MCF` (verbatim posting), plus a new `◐ derived` for the Leap flows (tagged `given`/`derived`/`inferred`). `ProvLegend` is the single source of truth for these chips.

**Engine-wins rule (locked):** if the LLM narration and the engine disagree on any figure, the engine value is shown and the LLM line is discarded for that figure. No LLM string is ever parsed into a number.

-----

## §3. Radicality / blast-radius map (your “how radical is this”)

Four bands. Read this as the answer to “how radical”: the *door* is untouched; the *result* is replaced; the *plumbing* is rewired in two places.

|Surface / module                                         |Band               |What changes                                                                                                |
|---------------------------------------------------------|-------------------|------------------------------------------------------------------------------------------------------------|
|Search box, first-run, occupation resolve, browse        |**FROZEN**         |nothing (guarded by R011)                                                                                   |
|`/api/claude` proxy (`claude.js`)                        |**FROZEN**         |nothing — already narration-only, caching + warm errors intact                                              |
|AIOE / SSOC / ISCO / SOC data tables (`engine-data/*.js`)|**FROZEN**         |nothing — generated, provenanced; regenerate only via documented build                                      |
|Result headline (AI Exposure Overview / “N of M”)        |**RADICAL-REPLACE**|LLM number demoted; engine `AI-Exposure Index X/100 ✓ computed` becomes the lead                            |
|`engine-core.computeEngine`                              |**REWIRE**         |add PR2: `reconcile(ssoc, skillFingerprint)`, `coherence`, `mirrorRoles` (today `via:'ssoc'`, both `null`)  |
|`anatomy.js` layer-resilience constants                  |**REWIRE**         |replace hand-coded constants with AIOE/SML/Eloundou scores (PR-8); `scoreJobAnatomy` math unchanged in shape|
|`LeapView.jsx` (`?view=leap`)                            |**ADDITIVE**       |feed the computed engine fields into the Director/Skeptic/You nodes; keep the SVG + palette                 |
|`RoleGraph.jsx` (`?view=graph`)                          |**ADDITIVE**       |wire the RIGHT “AI filter” column to PR2 reconcile + mirror-roles instead of the baked offline value        |
|True-Fit + Proof Ledger                                  |**NEW (ADDITIVE)** |new matcher module + render panel (PR-3)                                                                    |
|Demand-Proof gate                                        |**NEW (ADDITIVE)** |new `demandProof()` over `/api/mcf` (PR-4)                                                                  |
|Fairness + age audit                                     |**NEW (ADDITIVE)** |new `fairness.js` (PR-5/7)                                                                                  |
|Candidate Brief + Employer Fair Scorecard                |**NEW (ADDITIVE)** |render module / `?view=` page (PR-6)                                                                        |

**Reading:** 2 REWIRE (engine PR2, anatomy re-ground), 1 RADICAL-REPLACE (the headline), the rest ADDITIVE or NEW. No architecture rewrite, no data-source replacement — so per CLAUDE-FULL §6.2 this is a **MINOR** arc (new features), not MAJOR. The “radical” is concentrated and contained.

-----

## §4. Change map (where to change, file by file)

Real symbols from the current tree. “Touch” = edit; “Add” = new; “Freeze” = leave.

### `v3/engine-data/engine-core.js` — REWIRE (PR2)

- **Add** `reconcile(ssocPrior, skillFingerprintIscos)` -> `{ iscoChosen, coherence: 'agree'|'conflict', ssocIsco, fingerprintIscos }`. On conflict prefer skill evidence; surface both (engine-wiring-spec §“Engine compute” step 1).
- **Add** `mirrorRolesFor(fingerprintBlend)` -> top-N ISCO with `sharePct` + each one’s `exposureForIsco().index`. Reuse `exposureForIsco` (already exported).
- **Touch** `computeEngine`: accept optional `skills`/`fingerprintIscos`; populate `coherence` and `mirrorRoles` (today hard-`null`); set `occupation.via` to `'reconcile'` when fingerprint present, else keep `'ssoc'`.
- **Keep** the percentile transform, `zRange`, `socsUsed`, `confidence`, the withhold-on-unverifiable branch — all already correct.

### `v3/api/engine.js` — small REWIRE

- **Touch** the body destructure to pass `skills` through to `computeEngine` ( `const { ssoc, title, skills } = req.body` ). No new external calls (CSP unchanged).

### `v3/api/esco.js` — ADDITIVE (PR-1, PR-3)

- **Add** `candidateFingerprint(dutyPhrases[])` mirroring `occupationFingerprint` (returns occupation blend + `isco_major` spread, weighting Occupation-/Sector-specific skills above Transversal). Thin `/api/candidate` entry.
- **Keep** the search-side occupation lookup (frozen — §1).

### `v3/api/anatomy.js` — REWIRE (PR-8) + ADDITIVE (PR-2, PR-3)

- **Touch** the layer-resilience constants: source from AIOE (occupation) + SML rubric + Eloundou, documented mapping. `scoreJobAnatomy(duties)` keeps its shape; only the constants become citable.
- **Add** a candidate-anatomy entry path (run `scoreJobAnatomy` on a person’s owned outcomes); server-recomputed (client cannot write the score).
- **Bump** `JOB_ANATOMY_VERSION` (“ja1” -> “ja2”) when constants change — invalidates the `/api/anatomy` cache (Rule: prompt/input change bumps the cache key).

### `v3/api/mcf.js` — ADDITIVE (PR-4)

- **Add** `demandProof(title|ssoc)` -> rolling 9/30-day posting count (+ sample-size confidence), salary p25/p50/p75, experience band, FCF/compliance-window share (strip compliance-only). Default verdict if demand not real: **“do not spend.”** Reuse `mcfSearch`; keep `action:"job"` (frozen for Leap).

### New modules

- **Add** `v3/api/matcher.js` (or inline module) — True-Fit: map both sides to ESCO essential skills; **set-overlap per layer weighted by skill rarity** (NOT token frequency); every MET claim binds to a verifiability tier (A live/referee, B cert, C self-asserted = “claimed”, never “covered”); weight by Schmidt-Hunter validity. Reuse `screen_keyword_gaps` (counts only). (PR-3)
- **Add** `v3/api/fairness.js` — index vs signal tagger (age/grad-year -> excluded from maths), p%-rule disparate-impact self-check (>= 80%), JD-language scanner for TGFEP-prohibited phrases, WFA-compliant audit trail. (PR-5/7)

### `v3/src/App.jsx` — RADICAL-REPLACE (headline) + ADDITIVE (panels)

- **Touch** the result header region: call `/api/engine` on result load; render `AI-Exposure Index X/100 ✓ computed (AIOE)` as P1; **demote** the LLM “N of M skills” / “AI Exposure Overview” to a secondary `~ AI estimate` line (engine-wiring-spec §“App.jsx wiring”).
- **Touch** Role-Mix panel: keep `assembleRoleMix`/`buildRoleMix`/`narrateRoleMix` but tag the shares `~ AI estimate` until PR2 mirror-roles replaces them with `✓ computed`.
- **Add** P6/P7/P8/P9 panels behind the existing result tabs (no new top-level nav; reuse the tab pattern).
- **Bump** `ROLE_MIX_VERSION` if the fingerprint inputs change; keep `claudeCall` narration-only.
- **Respect** R006 (no multi-line async arrow in JSX props — extract to named fn), R007 (ASCII only in JSX strings; hyphens, never em/en dash — also your house grammar rule), R005 (grep the globals list before packaging).

### `v3/src/LeapView.jsx` — ADDITIVE (PR2 + pressure read)

- **Touch** the Director node (title-vs-experience inflation), Skeptic node (demand) and You node (CV overlap) to consume `engine.exposure`, `demandProof`, and the True-Fit ledger respectively — replacing the rough keyword overlap with the computed read where available; keep the rough read as the labelled fallback.
- **Keep** the SVG, the blue/orange/cyan palette (no red/green), 44px targets, `aria-label`, keyboard focus.

### `v3/src/RoleGraph.jsx` — ADDITIVE (PR2)

- **Touch** the RIGHT “AI filter” column to read PR2 `reconcile` + `mirrorRoles` live, instead of the value baked by `engine-data/build-graph-data.mjs`. Keep the foreignObject cards, curved edges, barycenter ordering, tap-to-trace.

### `v3/src/main.jsx` — FREEZE routing, ADD one route (PR-6)

- **Add** `?view=scorecard` for the Employer Fair Scorecard render (optional); keep `?view=leap` and `?view=graph` exactly as they are.

### Out of scope this arc (explicit)

- Per-skill / per-duty deterministic exposure (needs a per-skill source) — stays `~ AI estimate` (engine-wiring-spec out-of-scope).
- MCP candidate tools (PR-7) — after the read is trusted.
- Adjacency routing (PR-9) — needs the market table.

-----

## §5. PR sequence (extends `doc/v3-build-tasks.md`)

Each PR ships as one PR: PATCH/MINOR bump (G1) + HDR journal entry + `.serial-state.yml` bump + live verify on v3.takearoundabout.com. Build top-down.

|PR    |Title                                      |Band           |Files                                |Grounded in                                     |Accept                                                                        |
|------|-------------------------------------------|---------------|-------------------------------------|------------------------------------------------|------------------------------------------------------------------------------|
|**E2**|Engine reconcile + coherence + mirror-roles|REWIRE         |`engine-core.js`, `engine.js`        |engine-wiring-spec step 1-3                     |Metta + NHG + PSD samples snapshot-stable; `coherence` agree/conflict surfaces|
|**H1**|Headline swap                              |RADICAL-REPLACE|`App.jsx`                            |engine-wiring-spec App wiring                   |`AI-Exposure Index X/100 ✓ computed` leads; LLM number demoted                |
|**A8**|Re-ground anatomy on AIOE                  |REWIRE         |`anatomy.js`                         |Felten; Brynjolfsson; Eloundou; ALM 2003        |every resilience score traces to a citation                                   |
|**C1**|Candidate Fingerprint                      |ADDITIVE       |`esco.js`                            |ESCO v1.2.1; SkillSpan; EC crosswalk            |a CV -> a defensible blend, not one mislabelled title                         |
|**C2**|Candidate Anatomy                          |ADDITIVE       |`anatomy.js`                         |existing engine; ALM                            |Accountability/Relational/Judgment concentration as AI-resilience signal      |
|**T3**|True-Fit + Proof Ledger                    |NEW            |`matcher.js`, `esco.js`, `anatomy.js`|Schmidt-Hunter 1998; ConFit; Wolgast 2017       |per-layer overlap + proof ledger; live builds rank top-validity               |
|**D4**|Demand-Proof gate                          |NEW            |`mcf.js`                             |MOM FCF 14-day; del Rio-Chanona                 |real/not-real verdict with live numbers; “do not spend” default               |
|**F5**|Fairness + age audit                       |NEW            |`fairness.js`                        |EEOC four-fifths; Feldman 2015; TGFEP + WFA 2025|age/grad-year never enter the score; ad-language flags fire; exportable audit |
|**B6**|Candidate Brief + Employer Fair Scorecard  |NEW            |render module / `?view=scorecard`    |Fuller “Hidden Workers” 2021; STARs             |reproduces a real sample scorecard, every cell sourced                        |

**Fastest value, lowest risk first three:** E2 (unblocks the headline), H1 (the visible radical change), A8 (kills the last hand-coded constants). Then C1 -> C2 -> T3 (the candidate read).

-----

## §6. Non-inventive conformance (the control layer)

Every PR must pass the conformance audit (`recipe R-AUDIT`, `agent conformance-auditor`). Two instruments, distinct roles:

- **D1-D8 — Prompt Syntax Governance Audit (static).** Run on every reusable prompt template touched (`searchOccupations`, `getSkills`, `classifyDuties`, `extractPostingFeatures`, `profileScreener`, the narration prompts). Confirms the prompt cannot author a number, has a JSON-only contract where required, and carries no invention licence.
- **G1-G8 — Governance Diagnostic (dynamic).** Run on the live result read (a deployed posting). Confirms `Output = ƒ(Prompt, Context, Control)` holds end to end: engine authors the number, LLM narrates, provenance chip present, withhold-on-unverifiable fires, engine-wins on disagreement.

**Hard gates (block merge):**

1. No LLM string parsed into a number anywhere on the result page.
1. Every figure renders with a Prov chip (`✓ computed` / `~ AI estimate` / `● from MCF` / `◐ derived`).
1. `[UNVERIFIED]` or a withheld number where a data link is unverifiable — never a fabricated value.
1. Crosswalk ambiguity shown as a range (`zRange`), never a fake point.
1. Determinism: same posting -> identical engine output (snapshot test).

-----

## §7. Accessibility and honesty contract

- **No red/green anywhere** (your colour-vision requirement; already enforced by the blue<->orange diverging ramp and the Leap blue/orange/cyan palette). New panels inherit this; encode state with **shape/label/text**, never colour alone.
- **44px touch targets**, `aria-label` on every SVG, keyboard-focusable nodes (carry forward from LeapView).
- Every artifact footer: **“AI-assisted; human decides”** + `Source · Confidence · Time-window`.
- The Leap footer line stays: “Job fields verbatim from MyCareersFuture; flows are derived analysis (tagged); demand is a rough sample.”

-----

## §8. Test fixtures and verification

Use the in-repo samples as golden inputs — do not invent test data.

- `v3/Sample/2026-0607_Job-Role_NHG_AD_Tech-Strategic-Planning-2.md` (+ PDF) — NHG Asst Director, Technology Strategic Planning.
- `v3/Sample/2026-0607_Job-Role_PSD_Senior-Mgr-AD_Job-Redesign-2.md` (+ PDF) — PSD Senior Manager / Asst Director, Job Redesign.
- Metta Welfare Transformation Manager, uuid `2320493d0e875075d4dbfa6a893b3fdb` (the default Leap posting).

**Snapshot (determinism):** assert `computeEngine` returns byte-identical output for each fixture across runs (`recipe R-SNAPSHOT`). Assert `coherence` (agree/conflict), the AIOE index + `zRange`, and the mirror shares. **Live verify** each PR on desktop + mobile: `✓ computed` chips present, no fabricated numbers, no red/green.

-----

## §9. Risks and pre-mortem (run `recipe R-PREMORTEM` before E2)

|Risk                                                                                       |Likelihood|Guard                                                                                               |
|-------------------------------------------------------------------------------------------|----------|----------------------------------------------------------------------------------------------------|
|Headline swap (H1) silently changes a tested result and erodes trust                       |Med       |snapshot the old vs new headline on the 3 fixtures; reviewer diff before merge                      |
|`reconcile` conflict path mislabels SSOC-miscoded postings                                 |Med       |prefer skill evidence, surface both, flag (engine-wiring-spec error-handling)                       |
|FCF/compliance-share classifier false positives -> wrongly calls a real seat a “ghost post”|Med-High  |ship behind a visible caveat + a hand-labelled SG validation sample first (v3-build-tasks guardrail)|
|Fairness p%-rule imported as a US threshold rather than PDPA/TGFEP/WFA fit                 |Med       |declare which criterion and why; do not hard-import EEOC numbers                                    |
|A frozen symbol drifts during a result PR                                                  |Low       |R011 freeze-guard blocks packaging                                                                  |
|Chat compaction drops a module-level global during a long build                            |Med       |R005 grep list before packaging                                                                     |
|em/en dash or non-ASCII slips into a JSX string                                            |Low       |R007 + house grammar (hyphens only)                                                                 |

-----

## §10. Agents and recipes (this bundle)

- `.claude/agents/spec-author.md` — turns an enhancement into a PR-sized spec slice in this idiom; sets `READY_FOR_BUILD`.
- `.claude/agents/result-engine-builder.md` — implements one PR (E2/H1/A8/…) against this spec; deterministic-first; never lets the LLM author a number.
- `.claude/agents/conformance-auditor.md` — runs D1-D8 (static) + G1-G8 (dynamic) + the §6 hard gates; **read-only**, proposes, never edits.
- `.claude/agents/a11y-honesty-reviewer.md` — checks the §7 contract (no red/green, 44px, aria, Prov chips, “human decides”); **read-only**.
- `recipes/v3-result-engine.recipes.md` — R-FREEZE, R-SPEC, R-AUDIT, R-SNAPSHOT, R-PREMORTEM, R-PORT, R-DEBUG.

-----

## §11. Version-bump gate (do this, don’t skip)

When a PR lands: surface `Rule V-1 / G1` to the Human Lead — `Rule E2 fired: engine PR2 reconcile. Prescribed: bump v3.0.x -> v3.1.0 (minor, new feature). Confirm? (yes/no/modify)`. On yes: bump in **all three** per R003 (`App.jsx` line 1 header, `index.html` title, `README` version), write the HDR journal entry, bump `.serial-state.yml`. The epic closes at **v3.2.0** when B6 ships.

```
[HDR] #NNN | HH:MM:SS SGT DD-M-YY | v3.1.N | NNNkb | N,NNN lines
[INTENT] one line — which Placement-Read panel this PR delivers
[DELTA] one line per change
[RISK] Low/Med/High + reason
[STATUS] ALPHA/BETA/STABLE
[TEST] snapshot on NHG/PSD/Metta + live verify
[NEXT] one action for the Lead
[ADVICE] prompt technique + one-line reason
```

*End of spec. Confirm the version arc and the first PR (E2) to proceed.*