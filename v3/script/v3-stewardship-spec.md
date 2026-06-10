# SG Career View v3 - Stewardship Arc spec ("the vacancy as an admission of an operational wound")

> **Target repo path:** `v3/script/v3-stewardship-spec.md` (build docs live in `v3/script/`; the goal bundle it implements lives in `v3/goal/`).
> **Status:** READY_FOR_BUILD (FR1). **Version arc:** v3.1.x per PR, G1 gate each (Rule V-1) - do not bump without Human Lead sign-off. Does not collide with the result-engine epic close (B6 -> v3.2.0).
> **Contract alignment:** the locked v3 contract governs every line (deterministic = control; LLM = advisory narration only; non-inventive; `[UNVERIFIED]` over a guess). House rules in `doc/CLAUDE-FULL.md` and the frozen door in `v3/script/v3-result-engine-spec.md` SS1 bind this spec; recipe R-FREEZE runs before every PR here too.
> **Reader priority:** (1) Claude Code, (2) Human Lead.

---

## SS0. Purpose and the one-line thesis

`v3/goal/readme.md` ("Architectural Specification: Agentic AI") and its paper (`v3/goal/AI_Stewardship_Research_Paper.html`, "The Teleology of the Advertised Vacancy") define the next conceptual layer: **read an advertised role as an admission of an operational wound** - "a gap in the matrix of production, governance, or innovation" (paper SS1) - and give the candidate the steward's read of that wound.

**Thesis:** the result page already says *what the role is exposed to* (the engine) and *who pressures it* (Leap). This arc adds *why the role exists at all*: the mandate behind the noun-title, the acute anomaly that triggered the hire, and where the human is meant to sit once procedural execution is commoditised (paper SS3; w34854).

Grounding sources (named, per claim, in each PR):
- `v3/goal/readme.md` protocols 1, 3, 5, 7, 9 (the "Agur paradigm" framing stays in the goal doc - it is the author's voice, not UI copy).
- `v3/goal/AI_Stewardship_Research_Paper.html` SS1-SS9 (ontology of the vacancy, BDF, crux/constraint, Sentinel).
- `v3/goal/w34854.pdf` - Acemoglu, Autor & Johnson 2026, *Building Pro-Worker Artificial Intelligence* (NBER WP 34854): task categories (new task creation / expertise leveling / labor augmenting / automating), human-machine collaboration principles.
- Rumelt, *Good Strategy Bad Strategy* (kernel: diagnosis -> guiding policy -> coherent action) - cited by goal protocol 1.

## SS1. FROZEN surfaces

Identical to `v3-result-engine-spec.md` SS1 (search box, occupation resolve, browse card, skill extraction, `/api/claude` proxy, engine-data tables). R-FREEZE blocks packaging on any drift. v1/v2 untouched.

## SS2. Radicality map

| Surface | Band | What changes |
|---|---|---|
| Frozen door (SS1) | FROZEN | nothing |
| Result Overview tab | ADDITIVE | FR1 panel appended behind a collapsible card (no reflow of existing panels) |
| `?view=leap` | ADDITIVE (BF2, later) | bridge-vs-firewall verdict line on the hub |
| Automation-level help copy | REWIRE-lite (PW4, later) | citations onto the existing 4 levels; no level renamed, no score changed |
| Engine / engine-data | FROZEN this arc | no number moves; FR1 adds NO engine change |

No MAJOR-band change anywhere -> the arc stays v3.1.x (MINOR features per PR).

## SS3. PR sequence

| PR | Protocol | Band | Files | Grounded in | Accept |
|---|---|---|---|---|---|
| **FR1** | goal 7 Forensic Reversal | ADDITIVE | `App.jsx` | goal 7; paper SS1, SS7 | verb-mandate + crux anomaly render on Metta/NHG/PSD with honest chips; LLM authors no number that reaches the page |
| **BF2** | goal 1 Ontological Parsing | ADDITIVE | `LeapView.jsx` | goal 1; paper SS1; Rumelt kernel | bridge/firewall verdict, `~ AI estimate`, never presented as computed |
| **BDF3** | goal 5 BDF | NEW panel | `App.jsx` | goal 5; paper SS4 | boundary (not-to-do) / N-1 -> N+1 map / feedback risks, all `◐ derived` |
| **PW4** | w34854 | REWIRE-lite | `App.jsx` help copy | w34854 task categories | each automation level carries its PWAI citation; zero score change (A8 idiom) |
| **SN5** | goal 9 Sentinel | **PARKED** | - | paper SS8-SS9 | explicitly out of scope: Sentinel telemetry is post-hire ops; a result page has no process stream to watch. Recorded here so the parking is a decision, not an omission |

> **AU-7 amendment (BDF3, at build):** the BDF3 row prescribes *"all `◐ derived`"*. As built, the Steward's Map (boundary / dependency / feedback) is fully `~ AI estimate` (LLM), NOT `◐ derived`. Rationale: a Not-To-Do list and feedback loops are forward-looking judgement with no deterministic source in the ad text (unlike FR1's crux, which IS a computable token-rarity and stays `◐ derived`). Tagging them `derived` would overclaim reproducibility. So the panel is honest narration grounded in the role's duties, tagged advisory end to end, authoring no number. Source wins; prior wording preserved in the table.

> **AU-7 amendment (BF2, at build):** the BF2 row above reads *"bridge/firewall verdict, `~ AI estimate`"*. As built, the verdict is a TRANSPARENT derived word-balance of the ad's own text (build-stems vs governance-stems over title + description, counts shown, hedged "reads like", withheld under 4 stem hits), tagged with Leap's `inferred` vocabulary - NOT an LLM call. Rationale: LeapView is deliberately LLM-free and instant; a visible word-count the user can check beats an opaque model judgement, and "never presented as computed" still holds. Known limitation (audit W2): rare stem misfires (driver/police/transformer) can tip thin ads - mitigated by the hedge, the visible counts and the 4-hit withhold floor. Source wins; prior wording preserved in the table.

## SS4. FR1 change map (build first)

One new collapsible panel in the result Overview: **"Forensic Reversal - why this role exists"**. Three reads, three honesty tags:

1. **Verb mandate** (`~ AI estimate` extraction, counts-only display). A NEW JSON-only prompt (`SYSTEM_FR`) strips nominal nouns and isolates the active verbs across the role's duty statements (goal 7 "Semantic Deconstruction"). The LLM returns ONLY a JSON array of `{verb, count? no - verb + dutyIndex}` mappings; the histogram is counted client-side (counts-only precedent: the demoted "N of M" line). D1-D8 audit applies - this is the arc's first new prompt template.
2. **Crux anomaly** (`◐ derived`, deterministic given the ad set). Goal 7 "Crux Anomaly Isolation": score each duty line's distinctiveness against the comparison ads already fetched (`result.responsibilitiesData.jobs`) by token rarity; the top-scoring lines surface as "the acute need that likely triggered this hire". Reproducible: same ads -> same anomaly lines. Caveat line: rough sample, derived not verbatim-fact.
3. **Reverse-BDF line** (`~ AI estimate`). Inputs-required vs outputs-demanded for the top duties (goal 7 "Reverse-BDF Mapping"), LLM-classified in the same SYSTEM_FR call, narration only.

Constraints: reuse `claudeCall` (Haiku default), `extractJSON`, `Prov` chips, the collapsible-card pattern (`SkillSegments` idiom). No new API file. R005 globals, R006 (no multi-line async arrows in JSX props), R007 (ASCII, hyphens only) respected. Footer: "AI-assisted; human decides".

## SS5. Conformance (every PR)

Same instruments as the result-engine spec SS6: D1-D8 static on SYSTEM_FR (it must not be able to author a number that reaches the page; JSON-only contract; no invention licence - verbs must come FROM the duty text), G1-G8 dynamic on the rendered panel, the 5 hard gates. The crux scorer is deterministic-given-inputs: same fixture ads -> same lines (G7).

## SS6. A11y and honesty

No red/green; chips + labels carry state. 44px touch targets on the collapsible header. `aria-expanded` on the toggle. The panel never claims the anomaly IS the hiring trigger - copy says "likely", tagged derived. The Agur/Proverbs framing from the goal doc stays out of UI copy (author's voice, not product copy).

## SS7. Fixtures

Metta `2320493d0e875075d4dbfa6a893b3fdb` (live posting, full description), NHG and PSD sample MDs (`v3/Sample/`). Accept: the panel renders all three with verbs traceable to duty text and anomaly lines actually present in the posting.

## SS8. Pre-mortem (FR1)

| Risk | Likelihood | Guard |
|---|---|---|
| LLM invents verbs not present in the duty text | Med | prompt: verbs MUST be copied from the given lines; client drops any verb not found as a substring (case-insensitive stem) of the duty text |
| Anomaly scorer flags boilerplate as crux on thin ad samples | Med | minimum ad-sample threshold; below it the panel withholds the crux read with an honest line |
| Panel adds a 4th fingerprint-style network call storm | Low | one claudeCall per role, cached by evidence hash (H1 idiom) |
| Prompt drift (SYSTEM_FR edited without cache bump) | Low | FR cache key carries a `fr1` version tag; bump on prompt change (D8) |
| Frozen symbol drift in the big App.jsx edit | Low | R-FREEZE before packaging |

## SS9. Version gate

On FR1 landing: `Rule FR1 fired: forensic-reversal panel. Prescribed: bump v3.1.3 -> v3.1.4 (minor feature). Confirm? (yes/no/modify)` - then R003 x3 + HDR journal + PR + squash + live verify, per the house rhythm.

*End of spec. FR1 is READY_FOR_BUILD.*
