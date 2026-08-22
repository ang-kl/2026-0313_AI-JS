# SG Career View v3 - Cluster Strip arc spec ("these 47 ads are really 3 jobs")

(№ 1 - 18-06 '26 14:32 SGT)

> **Target repo path:** `v3/script/v3-cluster-strip-spec.md` (build docs live in `v3/script/`; the locked-contract docs it depends on remain in `doc/`).
> **Proposed version:** flat patch line `v3.0.<N+1>` on the next free patch (per the §11 AU-7 flat-patch directive in `v3-result-engine-spec.md`). Version bump is a **G1 confirmation gate** (Rule V-1) - do not bump without Human Lead sign-off.
> **Status:** `READY_FOR_BUILD`. Next agent: `result-engine-builder`.
> **Contract alignment:** the locked v3 contract (`doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`) governs every line. Deterministic = control; LLM = advisory narration only; non-inventive; faithful fidelity; withhold over fabricate; no red/green; every artifact carries Source/Confidence/Time-window + "AI-assisted; human decides".
> **Reader priority:** (1) Claude Code, (2) Human Lead. House rules `doc/CLAUDE-FULL.md` (R001-R011, gates G1-G4, HDR blocks) and the frozen door (`v3-result-engine-spec.md` §1) bind this spec.

---

## §0. Where this sits

This is **Phase 1 of the shelved visualization plan: the MVP cluster strip - grounded, no graph.** It is the deliberately conservative first slice. It renders, as a single horizontal strip on the result page, the split the engine already computes: the fetched MyCareersFuture postings for this role separate into a small number of distinct skill-bundle clusters, each named by its own over-represented skill phrases.

**Phase 2 (the org-relationship graph) stays CUT as ungrounded and is NOT specced here.** No node-edge graph, no force layout, no inferred org structure. If a future ask reaches for the graph, that is a new spec and a fresh grounding argument, not an extension of this one.

**One-line thesis:** the deterministic clusterer `clusterPostingsBySkills(jobs)` (App.jsx ~line 9491) already authors the clusters and their names today, but only inside the **frozen Browse card** (the v3.0.9 surface, §1). This slice surfaces that same deterministic read on the **result page** as a read-only strip - the engine authors every cluster, every label and every count; the LLM authors nothing that reaches the strip.

---

## §1. FROZEN surfaces (do not touch)

Identical to `v3-result-engine-spec.md` §1: the search box + first-run, search -> occupation resolve, the **Browse SG jobs card** (the v3.0.9 surface where `clusterPostingsBySkills` is consumed today, at `JobBrowse` ~line 9714 with `setSectorFilter`/`archGroups`), skill extraction, `/api/claude`, and the `engine-data/*.js` tables. R-FREEZE blocks packaging on any drift.

**Explicit freeze nuance for this slice:** `clusterPostingsBySkills(jobs)` is **reused, not modified.** It is a pure module-level function; the strip calls it read-only. The Browse-card call site (`skillGroups`/`archGroups`/`archLabel` ~line 9714) and its filter behaviour are **byte-frozen** - the strip does NOT share its `sectorFilter` state, does NOT add filtering, and does NOT re-flow the Browse card. If the build finds it cannot render the strip without editing `clusterPostingsBySkills` or the Browse call site, **STOP and surface to the Human Lead** (this would convert the band from ADDITIVE).

---

## §2. Scope

One new collapsible, read-only panel - **`RoleClusterStrip`** - mounted in the result-page `position-market` section (App.jsx ~line 11328, beside `DemandProof`/`AdLanguageScan`/`EmployerReality`/`CompanyBackground`), reading `result.responsibilitiesData.jobs`. It renders a single horizontal strip of the clusters returned by `clusterPostingsBySkills(jobs)`: one segment per cluster, each carrying the engine-authored cluster **name** (its 1-2 over-represented skill phrases), the **count** of postings in it, and the **share** of the sample. Segment width is proportional to count; state is encoded by **width + label + count text**, never by colour alone. No graph, no nodes, no edges, no per-posting drill, no filter action. It withholds when the clusterer returns fewer than 2 clusters.

---

## §3. Radicality band

**ADDITIVE.** One new render component over an existing deterministic function and existing result-page data; no engine number moves, no new prompt, no new API call, no frozen symbol edited. Mirrors the `DemandProof` idiom exactly (collapsible result panel over `result.responsibilitiesData.jobs`, Prov-chipped, shape/label/text state). Per CLAUDE-FULL §6.2 this is a MINOR-class feature shipped on the flat `v3.0.<N>` patch line.

---

## §4. Change map (file by file, real symbols)

### `v3/src/App.jsx` - ADD one component, mount in one place

- **Add** `function RoleClusterStrip({ result })` near the other result panels (place beside `DemandProof`, ~line 5366). It:
  - reads `const jobs = (result && result.responsibilitiesData && Array.isArray(result.responsibilitiesData.jobs)) ? result.responsibilitiesData.jobs : []` (the `DemandProof` guard, verbatim idiom).
  - calls `const clusters = clusterPostingsBySkills(jobs)` (the existing function - **read-only, unmodified**).
  - returns `null` when `clusters.length < 2` (the function already returns `[]` below its internal thresholds; the panel withholds rather than rendering a one-segment "strip" - withhold over fabricate, §6 gate 3).
  - computes `total` and per-cluster `sharePct` client-side from `clusters[i].jobs.length` (counts only, like the demoted "N of M" line and the `DemandProof` band bars). No number is read from any LLM.
  - renders the collapsible-button + body pattern from `DemandProof` (`useState(false)`, `aria-expanded`, 44px min-height header, `▼` rotate caret, `#1e3a5f` open header).
  - renders the strip body as a flex row of segments; each segment `flex: count` (width proportional to count) with the cluster name, count, and `sharePct` as text inside or beneath the segment. Long names wrap or truncate with the full name in `title`. Each segment is `>= 44px` tall and keyboard/`aria-label`-described.
  - tags the strip `<Prov kind="derived" small />` (◐ derived: "computed from the sampled ads shown. Reproducible for this sample, but not a verbatim posting fact." - the exact contract of `clusterPostingsBySkills`, which is deterministic given the fetched ads but not an MCF posting fact). The cluster **names** are skill phrases lifted verbatim from posting `skills`; if shown as their own chips they may additionally carry `<Prov kind="mcf" small />`. No `~ AI estimate` anywhere on this panel.
  - carries the footer line: `Source: MyCareersFuture postings for this role · Confidence: rough sample (N ads) · Time-window: today's fetch` + `AI-assisted; human decides`.
  - honest caveat line in the body: "These clusters are computed from the skills the sampled ads list, not a verbatim fact about the role. Same ads give the same clusters."

- **Mount** `<RoleClusterStrip result={result} />` inside the `position-market` render branch (~line 11330), after `<DemandProof result={result} />` (or first in that group - Human Lead's call; default: after DemandProof so demand reads before the split). Self-guards to `null`, so it adds no risk when MCF data is absent.

- **Respect** R005 (grep the globals list before packaging), R006 (no multi-line async arrow in a JSX prop - the toggle handler is a plain `() => setOpen(o => !o)`), R007 (ASCII only in JSX strings; hyphens, never em/en dash).

### Freeze (leave byte-identical)
- `clusterPostingsBySkills` (the clusterer) - reused, not touched.
- The Browse-card call site (`skillGroups`/`archGroups`/`sectorFilter` ~line 9714) and its filter chips.
- `engine-core.js`, all `api/*.js`, all `engine-data/*.js` - untouched (no new compute, no new fetch).

### Out of scope (explicit, do NOT build)
- The org-relationship / node-edge graph (Phase 2) - stays CUT, ungrounded.
- Any tap-to-filter the result list by cluster (the Browse card already owns filtering; duplicating it here risks touching its frozen state).
- Any new clustering knob (TAU, cluster count, naming) - the function's existing thresholds are the contract.
- Any LLM narration of the clusters - if a one-line plain-English gloss is later wanted, it is a separate slice with its own D1-D8 audit, and it would carry `~ AI estimate`, never author a name or count.

---

## §5. Grounded-in (named source per claim)

| Claim on the strip | Source |
|---|---|
| The postings split into these clusters | `clusterPostingsBySkills(jobs)` in App.jsx ~line 9491 - greedy Jaccard clustering over skill tokens (deterministic, no AI). Jaccard, P. (1912), *The distribution of the flora in the alpine zone*. |
| Each cluster's name (its 1-2 over-represented skill phrases) | same function: per-cluster phrase frequency weighted by over-representation vs the overall sample (`cf` / `overallPF`); names are skill phrases lifted verbatim from posting `skills`. |
| The skill phrases themselves | MyCareersFuture posting `skills` arrays on `result.responsibilitiesData.jobs` (● from MCF). |
| Count and share per cluster | counted client-side from `clusters[i].jobs.length` over `jobs.length` - arithmetic on MCF facts, no model. |

No claim on this panel lacks a named in-repo source. Nothing on the strip is `[UNVERIFIED]`; the whole panel withholds rather than show a guess.

---

## §6. Acceptance (testable, in-repo fixtures, determinism asserted)

Fixtures (do not invent test data): Metta Welfare Transformation Manager uuid `2320493d0e875075d4dbfa6a893b3fdb` (live, the default Leap posting, runs the corpus/jobs path), plus `v3/Sample/2026-0607_Job-Role_NHG_AD_Tech-Strategic-Planning-2.md` (+PDF) and `v3/Sample/2026-0607_Job-Role_PSD_Senior-Mgr-AD_Job-Redesign-2.md` (+PDF).

1. **Determinism (R-SNAPSHOT):** for a fixed `result.responsibilitiesData.jobs`, `clusterPostingsBySkills(jobs)` returns byte-identical clusters across runs (it is already order-stable - it sorts `order` by `uuid`); assert the same cluster names, membership, counts and `sharePct` on repeat render. Same ads -> same strip.
2. **Withhold:** with `< 8` postings, or fewer than 2 clusters, or insufficient skill data on the postings, `clusterPostingsBySkills` returns `[]` and `RoleClusterStrip` renders `null` (no one-segment strip, no fabricated split).
3. **Provenance:** the strip carries `◐ derived`; no `~ AI estimate` chip is present anywhere on the panel; the footer carries Source/Confidence/Time-window + "AI-assisted; human decides".
4. **A11y:** no red/green; cluster state read from width + name + count text (verify by greyscale); header `>= 44px` with `aria-expanded`; each segment `aria-label`-described and keyboard-reachable.
5. **Frozen door (R-FREEZE):** `clusterPostingsBySkills` and the Browse-card call site (`archGroups`/`sectorFilter` ~line 9714) are byte-identical to `main`; R005 globals present; exit 0.
6. **Live verify** on desktop + mobile (v3.takearoundabout.com): a multi-cluster role shows a proportional strip whose segment names match the Browse card's chip names for the same fetch; a thin role hides the panel.

---

## §7. Non-inventive gates (which apply)

- **§6 hard gates (block merge):** (1) no LLM string parsed into a number - trivially held, the strip calls no LLM; (2) every figure carries a Prov chip - the strip carries `◐ derived`, names may carry `● from MCF`; (3) withhold where unverifiable - panel returns `null` under threshold; (4) crosswalk ambiguity as a range - N/A (no crosswalk on this panel); (5) determinism - asserted in §6.1.
- **D1-D8 (static prompt audit):** **NOT required** - this slice adds no prompt template. (State this explicitly in the PR so the auditor does not look for one.)
- **G1-G8 (live read audit):** **required, light** - confirm on a deployed posting that the strip is engine-authored end to end (`Output = ƒ(Prompt, Context, Control)` with Prompt empty), the Prov chip is present, and the withhold path fires on a thin fetch.

---

## §8. Pre-mortem (spec §9 table shape)

| Risk | Likelihood | Guard |
|---|---|---|
| Strip drifts from the Browse card's clusters (two call sites diverge) | Low | both call the SAME unmodified `clusterPostingsBySkills`; assert name-parity with the Browse card on the same fetch in §6.6; never copy/reimplement the function |
| A thin or skill-sparse fetch renders a misleading one/two-segment "strip" read as fact | Med | the function already returns `[]` below its thresholds; panel returns `null` under `< 2` clusters; honest "rough sample" caveat + `◐ derived` on what does render |
| Cluster names long enough to break the strip layout on mobile | Med | truncate with full name in `title`/`aria-label`; segment min-height 44px; wrap, never overflow-clip without the tooltip |
| Someone adds tap-to-filter and reaches into the frozen Browse `sectorFilter` state | Med | §4 forbids filtering on this panel; R-FREEZE on the Browse call site blocks packaging |
| Scope creep toward the Phase-2 graph | Low | §0 + §4 mark the graph CUT/ungrounded; any graph is a new spec with its own grounding argument |
| em/en dash or non-ASCII slips into a JSX string | Low | R007 + house grammar (hyphens only) |

---

## §9. Version gate

On landing: surface `Rule V-1 / G1` to the Human Lead - `RoleClusterStrip panel (Phase 1 cluster strip, ADDITIVE). Prescribed: bump v3.0.<N> -> v3.0.<N+1> (flat patch line). Confirm? (yes/no/modify)`. On yes: R003 x3 (App.jsx line 1, index.html title, package.json), HDR journal entry, `.serial-state.yml` bump, squash-merge, live verify on desktop + mobile.

```
[HDR] #NNN | HH:MM:SS SGT DD-M-YY | v3.0.N | NNNkb | N,NNN lines
[INTENT] Phase 1 cluster strip - surface the deterministic skill-cluster split on the result page
[DELTA] add RoleClusterStrip; mount in position-market after DemandProof; reuse clusterPostingsBySkills read-only
[RISK] Low - additive render over an existing deterministic function; no engine/prompt/API change
[STATUS] BETA
[TEST] snapshot clusters on NHG/PSD/Metta + live verify strip vs Browse-card parity; withhold on thin fetch
[NEXT] confirm patch bump + mount order (before/after DemandProof)
[ADVICE] reuse-not-reimplement - one clusterer, two call sites, asserted parity
```

*End of spec. `RoleClusterStrip` is READY_FOR_BUILD. Build agent: `result-engine-builder`. Phase 2 graph stays CUT.*
