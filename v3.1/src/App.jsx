// v3.1.0 - 2026-08-02 - Step 3 Working Canvas + Company perspective (Human Lead approved this
// bump). Minor, not patch: new features and a change to what the Company graph draws.
//   - Step 3 rebuilt as a persistent workspace: the job ad and the Role Graph as floating
//     windows with standard controls, drawers for Company and Evidence, a minimise tray.
//   - The Company perspective inside the Graph window, and "This role" marking of the nodes
//     that trace back to the posting being read - by posting ID where possible, by title
//     where not, and withheld where neither, each stated on screen.
//   - The Knowledge graph traverses: every connection named in words with its provenance,
//     each a control that moves there, with the path taken shown.
//   - Duty clustering tightened (_dutyMatch): two DISTINCT shared terms covering at least
//     half the shorter line, against the line that opened the group. Cohesion on live
//     employer data 0.35 -> 0.75; `recurrence` now means what its name says.
//   - Layout arithmetic fixed: windows no longer overflow under the 1.1x html zoom, and the
//     workflow graph no longer overlaps itself.
// NOTE ON NUMBERING: an out-of-sequence "v3.1.0" entry from 2026-05-11 sits below (the
// Responsibilities Analysis work); numbering reverted to 3.0.x straight after it and ran to
// 3.0.329. This entry is the APP_VERSION 3.1.0. The ledger itself lapsed after v3.0.150
// (2026-06-24) - roughly 179 versions are unrecorded here, so treat it as partial history.
// v3.0.0 - 2026-05-10 - HDR #037 - MyCareersFuture live jobs + MOM vacancy-rate trend
// Changes vs v2.0.5: two new result tabs (Live SG Jobs, Vacancy Trend),
// new /api/mcf and /api/datagov proxies, ESCO proxy now returns occupation
// preferredLabel + altLabels + ISCO major group so the new panels can match
// without a second round-trip. v3 deploys as its own Vercel project with
// rootDir=v3; v2 deploys from repo root unchanged.
// v3.1.0 - 2026-05-11 - Responsibilities Analysis: /api/mcf now scrapes the
// full description of the top postings (detail pages) and extracts a
// "responsibilities" section; a new "üìù Responsibilities" tab runs an AI
// analysis over that corpus (sub-tabs: Analysis, Categories, Progression,
// Crossover, Context, Foundation) and appears as a row in the Compare view.
// The MOM / data.gov.sg "Vacancy Trend" tab is removed for now (the
// /api/datagov.js function is left in place, just not surfaced in the UI).
// v3.0.1 - 2026-06-07 - HDR #038 - ?view=leap "behind the corner" stakeholder web:
// new LeapView.jsx (job-centred SVG graph of the forces around one posting - Director,
// HR/FCF, ATS, demand Skeptic, Hiring Mgr, You/CV overlay), routed via ?view=leap in
// main.jsx; /api/mcf gains action:"job" to fetch ONE posting by uuid + a rough live-demand
// proxy. Blue/orange/cyan palette (no red/green); job fields verbatim from MyCareersFuture.
// v3.0.2 - 2026-06-07 - HDR #039 - LeapView responsive fix: on phones the graph stage and
// info panel stacked and the graph collapsed to a thin strip; narrow screens now use a
// column layout with a fixed-height graph on top + scrolling panel, plus 44px touch targets.
// v3.0.3 - 2026-06-07 - HDR #040 - docs: doc/v3-leap-view.md - leap view feature reference
// (stakeholders, flows, controls, data path, non-inventive contract, responsive, limitations).
// v3.0.4 - 2026-06-07 - HDR #041 - honesty + a11y pass on the analyzer: (1) kill red/green for
// AI-exposure - blue<->orange diverging ramp across all 6 level palettes, no red/green emoji;
// (2) badge Role Context as "AI estimate - not from this posting" and drop the fabricated
// Department line; (3) add a deterministic confidence floor to the ISCO reverse-map so
// cross-domain noise (Sports Coach 4, Survival Instructor 4) no longer ranks beside real matches.
// v3.0.5 - 2026-06-07 - HDR #042 - provenance badges (Phase 2): a Prov chip + ProvLegend make
// "computed" (deterministic, reproducible) visibly distinct from "AI estimate" (LLM judgement,
// may vary) and "from MCF" (verbatim posting). Tagged the headline surfaces: AI Exposure Overview
// + Role-Mix = AI estimate; ISCO reverse-map ranking = computed; posting link = from MCF.
// v3.0.6 - 2026-06-08 - HDR #043 - docs: doc/v3-engine-wiring-spec.md - approved design to move
// AI-exposure from LLM-guessed to deterministic AIOE (reconcile occupation -> AIOE index ->
// mirror-roles; new /api/engine; LLM narration only). Staged PR0 (data gate) -> PR1 -> PR2.
// v3.0.7 - 2026-06-08 - HDR #044 - Role Graph professional redesign: full word-wrap (no "..."
// truncation) via foreignObject cards; header "MCF role" -> "üá∏üá¨ MyCareersFuture (MCF)" + full
// column names; curved edges kept; barycenter node ordering across columns to de-spaghetti the
// crossings while keeping ALL edges; variable-height nodes; tap-to-trace + AI-exposure left bar.
// v3.0.8 - 2026-06-08 - HDR #045 - first-run help copy now specifies you're analysing a
// üá∏üá¨ MyCareersFuture (MCF) role (search matched to live MCF postings + ESCO skills), not a
// generic/made-up role - per "specify for searching MCF role and not others".
// v3.0.9 - 2026-06-08 - HDR #046 - Browse SG jobs: "Fresh grads ¬∑ < 4 yrs experience" checkbox
// inside the Browse card; when ticked, scouts live MCF postings for roles needing < 4 yrs
// experience (minimumYearsExperience null or < 4) - filters the browse results + shows the count.
// v3.0.10 - 2026-06-08 - HDR #047 - code-audit fixes (v3-only): fresh-grad now requires an EXPLICIT
// < 4 yrs (null no longer passes) + page resets on toggle + chip counts + capped caveat; Role Graph
// linesOf no longer clips long/CJK labels + barycenter sweeps one side at a time; mode cards are a
// real <button aria-pressed> with the checkbox as a sibling (no interactive nested in role=button);
// ProvLegend reworded "where shown".
// v3.0.11 - 2026-06-08 - HDR #048 - finish the red/green a11y sweep (audit #8): every score / CV-fit /
// coverage / keyword-gate / ATS bar + the covered(‚úì)/missing(‚úó) chips now use blue(high)‚Üíamber(mid)‚Üí
// orange(low) instead of green/red; positive=blue, negative=orange app-wide. NO green/red hex remains
// in App.jsx; numbers/labels/icons still carry meaning so it's not colour-alone. v3-only (v1/v2 untouched).
// v3.0.12 - 2026-06-08 - HDR #049 - "wire the engine" PR1: deterministic AI-Exposure engine foundation.
// New v3/engine-data/ (AIOE z-scores + SSOC‚ÜîISCO + ISCO‚ÜîSOC, all verified public data, bundled with
// provenance) + pure engine-core computeEngine() + new /api/engine endpoint. Chain SSOC‚ÜíISCO‚ÜíSOC‚ÜíAIOE
// (table lookups, NO LLM, same input‚áísame output); index = AIOE percentile (0-100) with z-mean/range
// carried; unknown SSOC or missing AIOE ‚Üí number withheld (ok:false), never faked. v3-only.
// v3.0.13 - 2026-06-08 - HDR #050 - "wire the engine" PR2: ?view=graph ‚Äî left‚Üíright MINDMAP of one MCF
// posting (new RoleGraph.jsx, routed in main.jsx). LEFT = the published job ad (Skills + Responsibilities,
// verbatim ‚óè from MCF); CENTRE = the role hub; RIGHT = the AI filter (‚úì computed): AI-Exposure 98/100 ‚Üí
// Occupation ISCO ‚Üí how-computed chain ‚Üí AI-able-vs-human* ‚Üí mirror-roles* (* = honest occupation-level
// only, no fake per-skill bars). Curved branches, click-to-highlight, responsive (stacks on phones).
// Data baked offline by engine-data/build-graph-data.mjs (engine output + token-overlap inferred links). v3-only.
// v3.0.14 - 2026-06-09 - HDR #051 - DEBUG MODE (OFF by default; ?debug=1): per-session capture of logic
// steps + every /api/* call (full req/resp bodies) via a fail-safe window.fetch patch (new src/debug.js)
// + one tee line here in logStep. Logs keyed by the shared v3_pipe_session; stop after 1 min idle, resume
// on activity. LOCAL npm run dev writes v3/debug/<session>-<date>.jsonl (new vite-debug-plugin.js, apply:serve);
// LIVE: ?debug=panel (new DebugPanel.jsx) shows the live trail + Download. v3/.gitignore keeps logs/prompts
// out of git. A debug error can never break a real API call; zero overhead + no effect on v1/v2 when off.
// v3.0.15 - 2026-06-09 - HDR #052 - debug mode switch renamed to ?dmm=1 (debug=1 kept as alias); the panel
// (?dmm=panel) now ALSO shows the Postgres step trail for the same session (anatomy recentLogs gains a
// session filter) - so dmm logs logic + API (file/panel) AND the persisted pipeline_logs in one place. v3-only.
// v3.0.16 - 2026-06-09 - HDR #053 - ops: redeploy to bind the rotated ANTHROPIC_API_KEY (no code change).
// The exposed key was auto-revoked when the repo went public (PR #42); Vercel binds env vars at build time,
// so a fresh deploy is needed to pick up the new key. Verified via Vercel MCP: live /api/claude was Anthropic
// 401 on dpl_99xq; this rebuild rebinds the Production env. v3-only.
// v3.0.17 - 2026-06-09 - HDR #054 - api/claude.js now surfaces the EXACT Anthropic error (type+message) in the
// response `debug` field, and a 401/403 returns an honest "API key rejected - check ANTHROPIC_API_KEY" message
// instead of the misleading "we've reached our limit" copy (which hid the real auth failure). v3-only.
// v3.0.18 - 2026-06-09 - HDR #055 - Role Graph: the MCF posting's OWN roles & responsibilities now branch
// straight off the MyCareersFuture role on the LEFT (new role-responsibility edges; columns reordered to
// MCF -> Responsibilities -> ISCO-08 -> ESCO). The ISCO->ESCO chain is the secondary "analysis" branch
// (role->occupation link kept faint until a node is traced). Cache bumped rg1->rg2. v3-only.
// v3.0.19 - 2026-06-09 - HDR #056 - Role Graph now CENTRE-ROOTED: R&R (from MCF) on the LEFT, the role title
// in the MIDDLE, the ISCO-08 + ESCO analysis on the RIGHT (cols: Responsibilities -> [Role] -> ISCO -> ESCO).
// Edge renderer handles leftward branches (role->R&R draws from the role's left edge); role->occupation is a
// clean short rightward link again (faint treatment dropped). Same rg2 graph data (render-only change). v3-only.
// v3.0.20 - 2026-06-09 - HDR #057 - Role Graph: restore the LEFT<->RIGHT link. The skill-responsibility edges
// (which skill each R&R needs) are drawn again, faint at rest so they don't spaghetti across the centre, and
// they light up boldly when a node is tapped - so you can see how a left responsibility resonates with the
// right-side skills (and back). Hint updated. Render-only (same rg2 data). v3-only.
// v3.0.21 - 2026-06-09 - HDR #058 - fix(ESCO matcher): clean the posting title before the ESCO occupation
// search (new cleanOccupationTitle in api/esco.js, applied in resolveOccupation + occupationFingerprint).
// Strips (parentheticals) + text after a spaced dash so a noisy title like "Data Analyst - Talend Data
// Integration / Informatica BDM (Singaporean Only)" searches as "Data Analyst" - no longer resolving to the
// wrong occupation ("Call Centre Analyst") with unrelated skills. Conservative: keeps "Full-Stack Engineer",
// "X-Ray / CT Imaging Engineer", clean titles unchanged. Cache rg2->rg3 to rebuild. v3-only.
// v3.0.22 - 2026-06-10 - HDR #059 - model upgrade: the two analysis calls (skill-relevance + the
// batch prompt/dimension generator) move from Sonnet 4.6 -> Opus 4.8 for higher-quality advisory
// output. Verified live: claude-opus-4-8 returns 200 through /api/claude. Request body is clean
// (model + max_tokens + messages + system only) so the swap needs no param changes. The per-call
// fetch timeout now branches on the model: Opus 180s / Sonnet 150s / Haiku by size (was a single
// isSonnet flag that would have silently dropped these calls to 90s). api_error telemetry now
// reports the real tier (opus/sonnet/haiku) instead of mislabelling Opus as haiku. The ~30
// Haiku-default calls (extraction, classification, scoring, CV) are unchanged. v3-only.
// v3.1.0 - 2026-06-10 - HDR #060 - PR E2 (result-engine arc, MINOR): engine reconcile + coherence +
// mirror-roles. engine-core.js gains reconcile(ssocPrior, fingerprintIscos) -> agree/conflict (on
// conflict the ESCO skill evidence wins - MCF SSOC tags can be mis-coded; both lists surfaced) and
// mirrorRolesFor(blend) -> top-5 ISCO with sharePct + each one's computed AIOE index (null when no
// score exists - never faked). computeEngine accepts optional skills/fingerprintIscos, populates
// coherence + mirrorRoles (were hard-null), sets via:'reconcile', demotes confidence one band on
// conflict; engine version engine-1 -> engine-2. api/engine.js passes the new inputs through. NO
// LLM, no network, no render change (that is H1). Snapshot-stable: NHG 78 / PSD 74 / Metta 78
// identical to the engine-1 baseline on the SSOC-only path. Conformance audit PASS (gates 1,3,4,5;
// gate 2 N/A until H1). R-FREEZE clean. G1 gate confirmed by Human Lead (v3.0.22 -> v3.1.0).
// v3.1.1 - 2026-06-10 - HDR #061 - PR H1 (result-engine arc, RADICAL-REPLACE): the deterministic
// AI-Exposure Index becomes the result HEADLINE. New EngineHeadline panel reads /api/engine via the
// role's ESCO skill-fingerprint (engine-3: adds a fingerprint-ONLY path, via:'fingerprint'); the old
// LLM "N of M skills" line is DEMOTED below it (~ AI estimate, "not the page's headline figure").
// Withhold-over-fabricate: no number shown when the chain can't be verified. Engine-3 also: weights
// the fingerprint index by evidence share (a 90/10 blend no longer scores like 10/90), share-based
// confidence (top group >=40% -> medium, scatter -> low, never high), top-weighted occupation label.
// SSOC + reconcile paths byte-identical to the engine-2 baseline (NHG 78 / PSD 74 / Metta 78; agree
// 78/high; conflict 84/low). Shipped after an xhigh code-review: 4 blocker/honesty fixes folded in
// (cache keyed on evidence CONTENT not count; weighted index; confidence; demoted-line honesty) and
// re-audited PASS (all 5 hard gates). Golden snapshot v3/script/r-snapshot.golden.json (replayable).
// R-FREEZE clean. G1 gate confirmed by Human Lead (v3.1.0 -> v3.1.1). Deferred (logged, non-blocking):
// failure-cache TTL/retry, 5-digit truncation guard, bad-SSOC echo flag, shared ENGINE_VERSION const.
// v3.1.2 - 2026-06-10 - HDR #062 - PR A8 (result-engine arc, REWIRE->traceability): re-ground the
// scoreJobAnatomy AI-resilience constants (expoRes / layRes / expoAuto + the 0.85 layer discount)
// so every score TRACES to a citation - Autor-Levy-Murnane 2003 (routine vs non-routine), Felten et
// al. 2021 (AIOE), Eloundou et al. 2023 (LLM exposure / cognitive-work inversion: Judgment ranks
// below Relational), Brynjolfsson-Mitchell-Rock 2018 (SML). Honest scope: the 5-layer x 4-band
// taxonomy is bespoke so NO source gives a per-cell decimal - the ORDERING is cited, the exact
// values are tagged as a documented modeling choice (non-inventive contract: no invented numbers).
// VALUES UNCHANGED -> proven ZERO score delta (HEAD vs A8 byte-identical on a duty matrix), so
// JOB_ANATOMY_VERSION stays 'ja1' (cache valid, no needless recompute). Cited block kept byte-
// identical across api/anatomy.js + App.jsx. Doc/traceability change; no number, prompt or render
// touched. R-FREEZE clean. G1 gate confirmed by Human Lead (v3.1.1 -> v3.1.2).
// v3.1.3 - 2026-06-10 - HDR #063 - UX: when a job is selected, the in-result Role Graph now opens
// CENTRED on the role hub. The graph is centre-rooted (R&R left / role middle / ISCO+ESCO right) in
// a fixed 1104px-wide scroll canvas; on a narrow viewport the container previously opened at the
// left edge, hiding the selected role off-screen to the right. RoleGraphPanel now scrolls the
// container so the mcfRole hub (~x452, 1:1 with the viewBox) lands at the viewport centre once the
// graph data is ready (clamped, no-op on desktop where the whole graph fits). Render-only, v3-only;
// frozen door + engine untouched.
// v3.1.4 - 2026-06-10 - HDR #064 - FR1, first PR of the STEWARDSHIP ARC (v3/script/
// v3-stewardship-spec.md, grounded in v3/goal/: the readme protocols, the Teleology paper, and
// w34854 Acemoglu-Autor-Johnson 2026). New collapsible "Forensic Reversal - why this role exists"
// panel in the result Overview: (1) crux anomaly - deterministic token-rarity of each duty line vs
// the sampled comparison ads ("the acute need that likely triggered this hire"), tagged with the
// NEW derived Prov chip, withheld under 4 usable ads; (2) verb mandate - SYSTEM_FORENSIC (JSON-only,
// D1-D8 audited) isolates active verbs, client drops any verb not verbatim in the duty text and
// verifies every cited line; histogram counted client-side; (3) reverse-BDF consumes/delivers per
// top duty, digits stripped, unknown duty numbers dropped. LLM authors NO number that reaches the
// page (audit gate 1 re-verified after 2 guard fixes + a SYSTEM_FR name-collision rename). Crux
// scorer proven deterministic. Loaded lazily on first open; cached by evidence hash, fr1 tag.
// R-FREEZE clean. G1 gate confirmed by Human Lead (v3.1.3 -> v3.1.4).
// v3.1.5 - 2026-06-10 - HDR #065 - BF2 (stewardship arc, goal protocol 1 / Rumelt kernel): the
// Leap hub card (?view=leap, LeapView.jsx) now reads each role as a capability BRIDGE (hired to
// close a capability gap) vs a governance FIREWALL (hired to hold a control/liability line).
// Transparent + deterministic, NOT an LLM call (LeapView is LLM-free): a word-balance of the ad's
// own title+description - build-stems vs governance-stems - counts shown, verdict hedged ("reads
// like"), withheld under 4 stem hits, tagged with Leap's existing `inferred` vocabulary. Verified
// on the real Metta posting (bridge 28:3). Audit PASS; 2 warnings fixed pre-merge (double-counted
// duty text removed; spec table un-broken). Spec carries an AU-7 amendment (built form differs from
// the "~ AI estimate" note - source wins). No App.jsx logic change (journal entry only). R-FREEZE
// clean. G1 gate confirmed by Human Lead (v3.1.4 -> v3.1.5).
// v3.1.6 - 2026-06-10 - HDR #066 - BDF3 (stewardship arc, goal protocol 5): new collapsible
// "Steward's map - boundary, dependency, feedback" panel in the result Overview. Boundary (the
// deliberate do-NOT-own list that prevents scope creep), Dependency (upstream N-1 inputs ->
// downstream N+1 deliverables), Feedback (balancing friction + reinforcing volume loops). Forward-
// looking advice -> fully ~ AI estimate, NO number authored, grounded in the role's duty lines,
// withheld under 3 duties, lazy-loaded, bdf1 cache tag. SYSTEM_BDF (JSON-only) D1-D8 audited PASS.
// Both stewardship panels (BDF3 + FR1) moved to Opus 4.8 for sharper interpretive copy (lazy, only
// on panel open). FR1 sub-header renamed off "Reverse-BDF" -> "Per top duty..." so only BDF3 owns
// the BDF name (audit W1). Spec carries an AU-7 amendment (built ~ AI estimate, not the row's
// "derived" - boundary/feedback have no deterministic source; source wins). This PR ships under a
// standing hands-free V-1 sign-off for the stewardship loop (Human Lead, this session). R-FREEZE
// clean. G1 confirmed (v3.1.5 -> v3.1.6).
// v3.1.7 - 2026-06-10 - HDR #067 - PW4 (stewardship arc, w34854): the "pro-worker lens". The
// Skills-by-Automation-Segment panel now reframes each automation level present in the role via
// Acemoglu, Autor & Johnson 2026 ("Building Pro-Worker AI"): its five categories (labor-augmenting,
// capital-augmenting, automating, expertise-leveling, new-task-creating; only new-task-creating
// unambiguously pro-worker) crosswalked to our 4 levels (HIGH->automating/replaces, MEDIUM->labor-
// augmenting, LOW->expertise-leveling, HUMAN->new-task-creating), framing each as REPLACES vs
// EMPOWERS the worker. Deterministic, NO LLM, NO number authored - a documented crosswalk (modeling
// choice, cited, tagged "a framing, not a measurement"), like A8. Empty-state guarded. Also: the 3
// stewardship-panel honesty caveats (FR1/BDF3/PW4) moved mutedLight -> textSub to clear WCAG AA
// (2.5:1 -> 7.5:1). Audit verdict SHIP (no-LLM + no-number + honesty + no red/green all clean).
// R-FREEZE clean. Auto-shipped under the standing hands-free V-1 sign-off. G1 (v3.1.6 -> v3.1.7).
// v3.1.8 - 2026-06-10 - HDR #068 - ST3 (stewardship arc, goal protocol 3 - the stewardship shift):
// new "Where you sit - human keeps vs AI takes" collapsible in the result Overview. Positions the
// human at the governance node as AI commoditises procedural work: you KEEP the legal/moral/judgment
// node (HUMAN-led skills + Accountability/Relational/Judgment duties); HAND the routine to AI
// (Full-Automation skills + Activity duties). PURE deterministic composition of signals already
// computed + tagged (skill levels + anatomy work-layers) - no new LLM call, no new prompt, no number
// authored; inherits ~ AI estimate; the augmented middle stays in the panels above (noted in-copy);
// empty-state guarded with non-complacent copy. Audit verdict SHIP (no-LLM/no-number gates clean,
// honest two-pole framing, amber-vs-blue not red/green, AA footer). This CLOSES the goal's buildable
// protocols: 1 (BF2), 3 (this), 5 (BDF3), 7 (FR1) all shipped; 9 (Sentinel) parked - no result-page
// data source. R-FREEZE clean. Auto-shipped under the hands-free V-1 sign-off. G1 (v3.1.7 -> v3.1.8).
// v3.1.9 - 2026-06-10 - HDR #069 - C1 (RESULT-ENGINE arc, first candidate-side slice; the stewardship
// arc is complete so the loop now advances the Placement Read toward v3.2.0). Candidate Fingerprint:
// new candidateFingerprint(skillPhrases) in api/esco.js mirrors occupationFingerprint but works from
// a CV's OWN skill evidence with no self-declared title - so a CV resolves to a defensible occupation
// BLEND (ESCO search + essential-skill overlap, normalised to shares), not one possibly-mislabelled
// title. ingestCV calls it (action:candidateFingerprint) and the CV result now shows "What your CV
// reads as" with the blend. The frozen ESCO search-side (searchOccupations/getOccupationEssential/
// occupationFingerprint/getEscoSkills) is byte-untouched - candidateFingerprint is purely additive
// and reuses those helpers. Deterministic compute (no LLM in the fn); blend tagged ~ AI estimate
// because the CV skills are LLM-extracted upstream (the honest tag - inputs vary run to run). Withhold
// over fabricate (fallback -> null -> not rendered). Audit verdict SHIP. Transversal reuse-level
// weighting deferred (C1.x, documented). R-FREEZE clean. Hands-free V-1 sign-off. G1 (v3.1.8 -> v3.1.9).
// v3.1.10 - 2026-06-10 - HDR #070 - C2 (result-engine arc): Candidate Anatomy. ingestCV now runs the
// CV's OWN outcomes (cvProfile.achievements) through the EXISTING classifyDuties (layer + exposure per
// outcome) then the EXISTING deterministic scoreJobAnatomy - the same resilience engine the role uses
// - and the CV result shows "Your work anatomy": resilientPct = how much of the track record sits in
// the AI-resilient layers (Accountability/Relational/Judgment), the layer-mix bar, and a constructive
// read. No NEW prompt (reuses classifyDuties); no LLM-authored number (resilientPct/layerMix from
// pure scoreJobAnatomy over LLM-classified LAYERS); tagged ~ AI estimate; withheld under 3 outcomes.
// Client-computed but deterministic + EPHEMERAL (not persisted) - spec AU-7 amendment recorded (spec
// said server-recomputed; the guard protects a shared store, which this never writes). Audit SHIP.
// R-FREEZE + R007 clean. Hands-free V-1 sign-off. G1 (v3.1.9 -> v3.1.10).
// v3.1.11 - 2026-06-10 - HDR #071 - T3 (result-engine arc): True-Fit + Proof Ledger. New
// scoreTrueFit(cvProfile, roleSkills) - the honest CV<->role match - and a "True-Fit + proof
// ledger" panel in the CV result. Each role skill is matched against 3 evidence buckets in validity
// order: A demonstrated (CV achievements), B certified (qualifications), C claimed (self-listed
// skills/titles). A self-asserted skill is "claimed", NEVER "covered" - the anti-keyword-stuffing
// rule (a claims-only CV caps at ~35/100; a demonstrator scores high). Rarity-weighted by ESCO
// reuseLevel (occupation-specific > transversal), NOT token frequency; tier validity A 1.0 > B 0.7 >
// C 0.35 (Schmidt-Hunter 1998). Deterministic (reuses _coverOne; no new LLM, no new prompt; inputs
// LLM-extracted so tagged ~ AI estimate); withheld under 3 role skills. Proof ledger lists each
// matched skill's tier + the unevidenced gaps. Audit verdict SHIP (no LLM number, claimed!=covered
// verified, amber-vs-blue not red/green). Spec AU-7: built inline (not a matcher.js) + evidence-
// bucket tiering (not per-work-layer) - source wins, core promises honoured. R-FREEZE + R007 clean.
// Hands-free V-1 sign-off. G1 (v3.1.10 -> v3.1.11).
// v3.1.12 - 2026-06-10 - HDR #072 - D4 (result-engine arc): Demand-Proof gate. New
// demandProof(jobs, nowMs) - a pure deterministic read over the already-fetched live MCF
// sample (result.responsibilitiesData.jobs) - and a collapsible "Demand-Proof" panel after
// StewardshipShift. It surfaces: sample count (‚óè from MCF), postings in the last 9 / 30 days
// (‚óê derived, from each posting's postedDate), monthly salary p25/p50/p75 from stated-band
// midpoints (‚óê derived, only when >= 4 stated a band), the experience-years distribution
// (‚óê derived, from minimumYearsExperience), and a conservative verdict active/moderate/thin
// (‚úì computed) defaulting to "do not over-invest" when thin. R-PREMORTEM (the ¬ß9 FCF
// false-positive risk): we do NOT build a per-post ghost classifier - the Fair Consideration
// 14-day rule is surfaced as an information-only caveat, never as a per-seat "fake" label.
// Withhold over fabricate: returns null under 4 postings; salary withheld under 4 stated
// bands; recency suppressed when no postedDate parses. NO LLM in this read (D1-D8 N/A). Audit
// PASS (no LLM number; Prov chip on every figure; blue/cyan/orange not red/green; state by
// shape+label ‚ñ≤‚óÜ‚ñΩ not colour; 44px target; aria-expanded; aria-hidden glyphs; "human decides"
// + Source/Confidence/Time-window footer). Spec AU-7: built inline over the already-fetched
// jobs (not a re-fetch in mcf.js) - the action:"job" path stays frozen, jobs are already in
// state, and the read is ephemeral/display-only; source wins, mcf.js prescription preserved.
// R-FREEZE + R007 clean. Hands-free V-1 sign-off. G1 (v3.1.11 -> v3.1.12).
// v3.1.13 - 2026-06-10 - HDR #073 - F5 (result-engine arc): Fairness self-audit (the p%-rule,
// turned inward on OUR OWN engine). A disparate-impact check on an employer's hiring is impossible
// here (no protected-attribute data; a ratio computed without it would fabricate a number) - so F5
// PROVES our deterministic scorers are age / graduation-year blind instead. fairnessAudit(cvText,
// cvProfile, roleSkills, iscoCandidates) runs the EXISTING scorers scoreCVFit + scoreTrueFit on two
// inputs identical except for an injected age/grad proxy, and reports the four-fifths-style ratio
// min/max of the scores (1.00 = invariant; verified in Node: 68/68 + 21/21 -> ratio 1.00). A drop
// would catch a regression that wired age in. NEW FairnessAudit panel in the CV result (after
// True-Fit): verdict (= Invariant / warn Shift found, by shape+label not colour), the per-variant
// scores, a declared criterion, and a copyable WFA audit trail. The 0.80 benchmark (four-fifths;
// origin US EEOC Uniform Guidelines 1978; formalised Feldman 2015) is a transparency yardstick on
// OUR tool only - NOT a legal test for any employer; SG anchor TGFEP + Workforce Fairness Act 2025;
// explicit no-legal-claim + scope (audits the deterministic scoring, not the AI extraction step,
// not the employer). Every figure is a real engine output (no LLM in this read; D1-D8 N/A). Withhold
// over fabricate: null under 3 role skills / on throw. Conformance audit PASS (all G-tests + 4
// contract sub-questions + hard gates); a11y review colour-blind-clean (blue/orange, 44px copy
// button after fix). Spec AU-7: built INLINE (not a new fairness.js) reusing the existing scorers,
// and the "ad-language flags" accept criterion is deferred to F5.2 - source wins, prior preserved.
// R-FREEZE + R007 clean. Hands-free V-1 sign-off. G1 (v3.1.12 -> v3.1.13).
// v3.1.14 - 2026-06-10 - HDR #074 - F5.2 (result-engine arc): TGFEP ad-language scanner (the
// deferred half of F5). scanAdLanguage(jobs) runs a fixed, high-precision pattern set over the live
// MCF posting text (title + description, verbatim) and flags fair-hiring-prohibited wording (age
// limits, gender/marital/race/nationality preferences) as a NEW collapsible "Fair-hiring language
// check (TGFEP)" panel after Demand-Proof. ADVISORY ONLY (the D4-style discipline): every flag is
// "worth reviewing", NEVER "illegal/discriminatory"; the exact phrase is quoted (‚óè from MCF) so a
// human judges; bona-fide exceptions acknowledged (language requirements deliberately NOT matched -
// only race-preference "Chinese only", never "Mandarin-speaking"); clean "none flagged" state; no
// employer named/shamed (flags collapse across postings by phrase). No LLM (D1-D8 N/A); no number
// invented. Conformance audit caught + I FIXED a Critical: the first age pattern ("under NN") was
// unanchored and false-positived on "under 30 clients" / "not more than 15 days" - re-anchored to
// require an explicit age/years-old token; re-verified (7 false-positive cases now clean, 6 true
// positives still flag). a11y review colour-blind-clean (orange flag / blue clean, shape+label =/warn,
// 44px, aria). Spec AU-7: F5 deferred this to F5.2 - now shipped, inline (no fairness.js). R-FREEZE +
// R007 clean. Hands-free V-1 sign-off. G1 (v3.1.13 -> v3.1.14).
// v3.1.15 - 2026-06-10 - HDR #075 - v2 skills-list port (Human Lead request, "Both"). The v2
// analysis experience showed the resolved skills WITH their ESCO descriptions open - a readable list
// during the wait. v3 had the descriptions but hid them behind a tap and showed only a spinner. This
// ports both: (1) Spinner gains a `skills` prop - during loading it now lists the resolved skills
// (name + escoDescription) the moment they resolve (new loadingSkills state, set at "essential
// skills found", cleared on reset / analysis start); (2) in the Skills tab, SkillRow now shows each
// skill's escoDescription ALWAYS (moved out of the tap-to-expand block) - the deeper detail
// (broader/narrower concepts, AI prompts) stays behind the tap. a11y: description text bumped
// C.muted -> C.textSub for WCAG AA (4.38:1 -> 7.53:1); no red/green; no new controls/touch targets;
// R007 clean. Build green. (Earlier "no gap" port conclusion corrected: v3 had the data but not the
// open reading list - source wins.) Additive; no frozen symbol touched. G1 (v3.1.14 -> v3.1.15).
// v3.2.0 - 2026-06-10 - HDR #076 - B6 (result-engine arc EPIC CLOSER, P9): two render artifacts in
// the CV result. (1) CandidateBrief - an exportable one-page read ASSEMBLING the existing reads
// (blend "reads as", True-Fit score + A/B/C tiers, work anatomy resilientPct, fairness age-neutral)
// + top gaps to evidence; each row keeps the Prov chip its source earned. (2) EmployerFairScorecard
// (collapsible) - a capability-first screen grounded in Fuller "Hidden Workers" (2021) + STARs
// (Skilled Through Alternative Routes): it scores demonstrated capability (True-Fit tier A/B, score,
// resilient-work %, age-neutrality) and DELIBERATELY does NOT score the rigid proxies (degree
// pedigree, employment gaps, exact prior-title match) that screen capable people out. Non-inventive:
// authors NO new number (no composite "hireability score") - every cell is a pass-through of an
// existing cv.* value; withholds when no True-Fit; copy-export carries the computed reads only, never
// raw CV text. No LLM (D1-D8 N/A). Conformance audit PASS (every cell sourced, chip-matched, no new
// number, Fuller/STARs grounding intact); a11y review PASS after fixing an R007 middot (-> "; ").
// 44px copy buttons + toggle, aria, no red/green, "human decides" footers. CLOSES the result-engine
// epic at v3.2.0 (E2,H1,A8,C1,C2,T3,D4,F5,F5.2,B6). Additive; no frozen symbol touched. R-FREEZE +
// R007 clean. Hands-free V-1 sign-off. G1 (v3.1.15 -> v3.2.0, MINOR - epic close).
// v3.2.1 - 2026-06-10 - HDR #077 - RK1 (stewardship arc, goal protocol 1 - the missing half).
// BF2 built bridge-vs-firewall but only name-dropped Rumelt; this builds the kernel itself. New
// StrategyRead panel (after Forensic Reversal) reads the role through Richard Rumelt's kernel of
// strategy (Good Strategy / Bad Strategy, 2011): Diagnosis (the structural obstacle the vacancy
// signals) -> Guiding policy -> Coherent action (the duties that enact it). Interpretive, fully
// LLM-authored, ~ AI estimate end to end; computes NO number (the readme's "friction cost" is NOT
// built - no data would mean fabrication). SYSTEM_RUMELT is JSON-only, every field "NO digits";
// fetchStrategyRead strips digits + drops any coherent-action citing a non-existent duty; render
// shows the real duty text, never an LLM-cited number; withheld under 3 duties or on empty diagnosis.
// Lazy, cached by evidence hash, rk1 tag. Mirrors the governed FR1 pattern. Conformance audit D1-D8
// 8/8 PASS + all G-tests + hard gates PASS; a11y review 7/7 PASS (no red/green, 44px, aria, no-number
// honesty footer). Additive; no frozen symbol touched. R-FREEZE + R007 clean. Hands-free V-1 sign-off.
// G1 (v3.2.0 -> v3.2.1).
// v3.2.2 - 2026-06-10 - HDR #078 - a11y polish (parked item): darken C.muted #5b6878 -> #5b6878.
// One-line palette change; C.muted is used ~252x for uppercase micro-labels + small footers that
// previously sat at ~4.38:1 on white (just under WCAG AA 4.5:1). #5b6878 lifts them to ~5.57:1 (AA
// clear) in one place. Hierarchy preserved (text #1a202c > textSub #4a5568 > muted #5b6878 >
// mutedLight #9aa5b4); same blue-grey hue, no red/green. Flagged repeatedly by the a11y reviewer as
// the single global fix for the micro-label gap. No frozen symbol touched. G1 (v3.2.1 -> v3.2.2).
// v3.2.3 - 2026-06-10 - HDR #079 - Role-Skill Graph readability (Human Lead feedback A+B). A: the
// skill<->responsibility edge (the LEFT<->RIGHT link between R&R and ESCO skills) was 0.07 opacity -
// invisible until a node was tapped, so readers could not see how the two sides connect. Raised the
// resting opacity to 0.3 (others 0.18 -> 0.2 base); a tapped node still wins (0.65) and dims the rest
// (0.04). B: the graph SVG was a fixed 1104px canvas that wasted the side margins on a notebook and
// force-scrolled when the column was narrower. Made it responsive (viewBox + preserveAspectRatio,
// width:100% height:auto, minWidth 880 so mobile still scrolls); the centre-on-selected-role scroll
// math is now scale-aware (computes the hub pixel from the live scrollWidth, not the hardcoded 1104).
// No colour change (edges stay amber/indigo/cyan/violet - no red/green); nodes scale UP on desktop.
// Additive; no frozen symbol touched. Build green. G1 (v3.2.2 -> v3.2.3).
// v3.2.4 - 2026-06-10 - HDR #080 - Role-Skill Graph: floating JD panel + graph<->JD link (Human Lead
// feedback C+D). C: a collapsible "Job description from MCF" panel above the graph (left-aligned,
// collapsed by default) - the verbatim posting text (jobs[0].responsibilitiesText/description; "1 of
// N sampled ads" caveat when aggregate) plus the numbered duties. D: each responsibility node now
// carries an [n] badge; the JD panel lists the same numbered duties; tapping one lights up its skills
// in the graph (reuses hoveredId). The NUMBER is the unique link key (red-green-safe); colour is an
// assist from a 6-hue colourblind-safe rotation (_RG_LINK_HUES, no red/green) shared by both surfaces.
// a11y review PASS (no red/green; number carries the link; aria-hidden badges + SR "Duty n:" label;
// 44px targets after fix; violet badge darkened #6366f1 -> #4f46e5 for AA). Additive; no frozen symbol
// touched. Build green. G1 (v3.2.3 -> v3.2.4).
// v3.2.5 - 2026-06-10 - HDR #081 - E: Employer reality (true-fidelity; Human Lead's company-check
// question). LIGHT + deterministic, NO new data source: MCF already returns postedCompany vs
// hiringCompany; mcf.js now surfaces both (postedCompanyName/hiringCompanyName, additive - action:job
// untouched). New companyReality(jobs) + EmployerReality panel (after AdLanguageScan) flags postings
// where the poster != the hirer, or the company name matches a high-precision agency/staffing stem
// list - the same title is a different reality at an outsourcer than at an end-employer. ADVISORY
// only: chip "agency?" (with the question mark), "a heads-up, not a judgement", "a name signal, not
// a registry check"; names quoted verbatim (‚óè from MCF) + the flag is ‚úì computed; withholds when no
// company data. No LLM (D1-D8 N/A). Conformance audit PASS (high-precision stems - no
// solutions/consulting/services; postedCompany!=hiringCompany is a verbatim fact; all hard gates);
// a11y review PASS (no red/green - orange flag / blue clean, shape+label, 44px, aria). Additive; no
// frozen symbol touched. Build green. G1 (v3.2.4 -> v3.2.5).
// v3.2.6 - 2026-06-10 - HDR #082 - result-page IA (Human Lead feedback: 4-6 screens too long; float
// the ads). (1) Deep Read tab: the 7 always-on "read" panels (Forensic Reversal, Strategy read, BDF,
// Stewardship, Demand-Proof, Fair-hiring, Employer reality) moved OUT of the Overview stack into a new
// "Deep Read" tab (gated on responsibilitiesData||jobAnatomy) - the Overview is now legend + segments
// + nav, cutting ~3-4 screens. (2) Floating job-ad drawer: jobAdAvailable() + JobAdFab (fixed
// bottom-right "Job ad") + JobAdDrawer (slide-in modal with the verbatim MCF posting) - the ad floats
// off the vertical scroll, one tap from anywhere. Modal a11y: role=dialog + aria-modal + aria-label,
// Escape + backdrop close, initial focus to the close btn, focus-trap (Tab loops in the dialog), 44px
// labelled close + FAB. No red/green; honest "verbatim from MCF" + "1 of N sampled" labels; R007 clean
// (header middot -> hyphen). a11y review PASS 7/7 (focus-trap added per the WARN). Additive; no frozen
// symbol touched. Build green. G1 (v3.2.5 -> v3.2.6).
// v3.2.7 - 2026-06-10 - HDR #083 - job-ad drawer rework (Human Lead feedback). FIXES: (1) missing
// company/role intro - the drawer now shows the FULL verbatim description (About company + About the
// role + duties), not the R&R-only responsibilitiesText extract; (2) flat text -> _fmtJobAd parses
// the posting into headings / bullets / paragraphs (deterministic, nothing reworded - structure
// inferred from the text's own lines); (3) not movable -> the drawer is now a MOVABLE, NON-MODAL
// floating window (drag the header via pointer events; read the analysis behind it; opens top-right);
// (4) hidden behind the "Back to top" FAB -> the "Job ad" FAB moved to the bottom-LEFT (z 901) and
// the window opens top-right (z 1001), clear of the bottom-right Top FAB (z 998). a11y: role=dialog +
// aria-label, Escape + close-button dismiss, focus to close on open (non-modal -> no focus-trap, by
// design); no red/green (navy/blue/slate); 44px targets; R007 clean. Self-reviewed against the ¬ß7
// contract. Additive; no frozen symbol touched. Build green. G1 (v3.2.6 -> v3.2.7).
// v3.2.8 - 2026-06-10 - HDR #084 - job-ad drawer: FINISH point 2 (heading hierarchy + underline key
// words) that v3.2.7 only partially did. _fmtJobAd now tags two heading levels - h2 (major sections:
// About/The Role/Responsibilities/Requirements/What You'll Do, with a bottom rule) and h3 (sub-
// sections: Capabilities, Leadership & Soft Skills). _jdTermRe + _jdEmphasize UNDERLINE the role's own
// multi-word skill phrases where they appear in the ad (e.g. "stakeholder management", "enterprise
// architecture") - a non-arbitrary link between the posting and the analysis; single/short skills
// (Python) skipped to avoid spam. Underline is a non-colour cue (blue), colour-blind-safe; no AI,
// nothing reworded. Verified: headings parse h2/h3, multi-word skills underline, short ones don't.
// Additive; no frozen symbol touched. Build green. G1 (v3.2.7 -> v3.2.8).
// v3.2.9 - 2026-06-10 - HDR #085 - job-ad window: make the drag actually work. The v3.2.7 drag used
// setPointerCapture without preventDefault, so a mouse drag started a text-selection instead of moving
// the window. Switched to the canonical pattern: pointerdown on the header adds document-level
// pointermove/pointerup listeners + e.preventDefault() + userSelect:none, so the window tracks the
// pointer 1:1 (mouse + touch). Affordance: cursor grab on the header, a "(drag to move)" hint by the
// title. Reopen still resets position (recoverable). No red/green; no frozen symbol. Build green.
// G1 (v3.2.8 -> v3.2.9).
// v3.2.10 - 2026-06-10 - HDR #086 - model leap (approved plan PR 1; goal: the AGENTIC AI analyst on
// the frontier model; precedent HDR #059 Sonnet -> Opus). The two skill-pipeline advisory calls move
// Opus 4.8 -> Fable 5: checkSkillRelevance (SYSTEM_RELEVANCE) and the per-skill prompt/next-phase
// generator (SYSTEM_PROMPTS). claudeCall gains a fable branch FIRST in the timeout ladder (180s, same
// as Opus; server allows 280s) and in the api_error telemetry tier. The latency-critical raters
// (rateSkills/rateSkillsCompact/SYSTEM_RR) STAY on Haiku - they gate first render; the agentic-era
// rubric (PR 2, v3.3.0) carries the upgrade on any model. The 3 deep-read panel calls
// (forensic/rumelt/bdf) stay on Opus 4.8 (out of scope, separate cost call). No thinking param added
// (Fable 5 rejects explicit disabled); api/claude.js untouched (frozen, model-agnostic). Build green.
// G1 (v3.2.9 -> v3.2.10).
// v3.3.0 - 2026-06-10 - HDR #087 - RB1 (approved plan PR 2; goal protocol 3, the stewardship shift
// at the FOUNDATION layer). The 4-level skill-analysis rubric was ~3 months old, written for a
// chat-assistant world - while the panels built on it (ST3 "Hand to AI agents", PW4, FR1) already
// speak the goal's agentic-stewardship worldview. Re-baselined the rubric to the same goal, in the
// goal's language, in all THREE raters (SYSTEM_RATE, SYSTEM_COMPACT compare, SYSTEM_RR duties):
// HIGH = AI completes the work end-to-end - including an AI agent running the multi-step workflow -
// the human reviews the OUTCOME, not each step ("procedural execution commoditised by autonomous
// systems"); HUMAN = legal accountability, moral liability, presence - the governance node AI cannot
// hold ("legal personhood, moral liability, and intuition"). NO 5th level, NO label/colour/icon
// change (LEVELS + PWAI_LENS byte-untouched, audited). AGENT=AI agent tool added to the tool codes +
// AI_USAGE (open-set lookups verified). h/k guidance now describes delegation, not prompt-technique
// name-dropping; office-suite guard kept (skill-vs-task honesty) with a clarifying clause.
// SYSTEM_PROMPTS: HIGH word-target = "a brief an AI agent could run"; Step 3 HIGH "Automate it" =
// the stewardship handover (what you hand over, the checkpoint, the escalation - the same handover
// ST3's give-pole describes); MEDIUM "Build on it" may hand one step to an agent. Copy: loading help
// corrected from the false "five automation levels...AI-Agentic" to the honest FOUR; groupDef +
// duties HIGH subs re-worded to agent delegation. Audit-found D6 gap fixed: the duties analysis
// header now carries ~ AI estimate (it renders AI-judged levels chip-less before). Conformance audit
// PASS (D1-D8 x4 templates; levelMaps still exactly 4 keys w/ HUMAN fallback; no numeric field; "Do
// not name products" survives; no persistent rating cache so no key bump; engine untouched; R007
// clean). Spec: stewardship-spec RB1 row added. G1 (v3.2.10 -> v3.3.0, MINOR - rating semantics).
// v3.3.1 - 2026-06-11 - HDR #088 - governance true-up (goal-centric audit G1+G2+G3; docs/agents/
// recipes only, NO app-code change - this entry + the 3-site bump are the only App/index edits).
// G1: R-FREEZE recipe hardened with an AU-7 amendment - the prior unanchored awk false-BLOCKed on
// HDR comments (observed in T3) and the `|| echo` masked the exit code so a real BLOCK could not
// stop a pipeline; now anchored to `^(async )?function <sym>(` and exits non-zero on any BLOCK
// (verified live: 7/7 FROZEN OK, flag propagates). G2: agent files refreshed - CLAUDE-FULL.md path
// corrected (repo root, mirrored v3/doc/) in spec-author + result-engine-builder; builder's stale
// "(E2...B6)" scope generalised to "the active spec" (that arc closed at v3.2.0); spec-author now
// reads v3-stewardship-spec.md and writes slices to v3/script/; R-SNAPSHOT placeholders replaced
// with the committed golden SSOCs (13304/12131/13302) - recipe now copy-paste runnable (verified:
// DETERMINISTIC OK x3, NHG index 78 matches golden). G3: ledger true-up - SHIPPED markers added to
// FR1 v3.1.4 / BF2 v3.1.5 / BDF3 v3.1.6 / PW4 v3.1.7 in the stewardship spec; EPIC CLOSED note
// added to result-engine-spec SS5 (the E2-B6 table is the closed ledger, not the active queue).
// G1 (v3.3.0 -> v3.3.1).
// v3.3.2 - 2026-06-11 - HDR #089 - G4 (goal-centric audit, last item): Deep Read teaser. The v3.2.6
// IA fix moved the 7 stewardship reads behind the Deep Read tab - right call for page length, but
// the goal's heart became one tap less discoverable. One gated sentence inside the Navigation box
// (renders only when the deepread tab exists): "Deep Read holds the stewardship reads - why this
// role exists, what stays human vs what to hand to AI, and whether the market and employer are what
// they seem." C.textSub (AA), ASCII hyphens (R007), microscope glyph aria-hidden, no colour-state,
// no new control. Additive; no frozen symbol touched. G1 (v3.3.1 -> v3.3.2).
// v3.0.52 - 2026-06-11 - HDR #090 - VERSION SCHEME RECONCILE (Human Lead directive). The scheme is a
// FLAT patch line v3.0.<N>; never roll to v3.1.0 until v3.0.999. The result-engine + stewardship arcs
// wrongly used the minor lines v3.1.x / v3.2.x / v3.3.x for 30 ships after the real last v3.0.22.
// Reconciled: this live build = v3.0.22 + 30 = v3.0.52; forward is v3.0.53, v3.0.54 ... The historical
// HDR entries + merged PR titles (#53-#82) are LEFT verbatim - those PRs genuinely shipped under the
// minor lines, and rewriting the record would be dishonest; this note is the AU-7 correction and the
// counter resumes here. No code change beyond the 3-site bump + this entry + the spec ¬ß11 rule update.
// G1 (v3.3.2 -> v3.0.52, scheme reconcile - NOT a minor roll).
// v3.0.53 - 2026-06-11 - HDR #091 - CJ1 (Candidate Journey arc, goal paper section 3): Steward's
// Praxis panel + grey off Resume Check. The arc turns the dashboard into a candidate operating
// system (Understand -> Position -> Become -> Arm -> Rehearse); CJ1 builds station 3 "Become" and
// completes the last buildable goal protocol. New StewardsPraxis panel in the Deep Read cluster
// (after StewardshipShift): the four-phase shift from DOING to STEWARDING, tailored to the role -
// Phase 1 redefine the cognitive baseline / 2 master the control surface / 3 treat AI as an
// untrusted actor / 4 cultivate change leadership. The 4-phase FRAMEWORK is the paper's, fixed in
// _PRAXIS_LABELS; SYSTEM_PRAXIS only fills the role-specific meaning + one move per phase (JSON-only,
// "NO digits", grounded in the duties). fetchPraxis strips digits + re-derives the phase number from
// [1,2,3,4] (never trusts the model's), withholds under 3 duties / empty, praxis1 cache, claude-fable-5.
// Fully ~ AI estimate; authors no number; "human decides" footer. Resume Check greyed off per Human
// Lead: buildTabs resume row paused:true; tab loop disabled = compareDisabled||paused, "(paused)"
// label + aria-disabled + disabled attr (code KEPT, not deleted; state by text not colour alone).
// Conformance D1-D8 PASS + a11y 7/7 PASS (badge 8.64:1, no red/green). Spec: new
// v3-candidate-journey-spec.md (CJ1 row). Additive; no frozen symbol touched. G1 (v3.0.52 -> v3.0.53).
// v3.0.54 - 2026-06-11 - HDR #092 - CJ2 (Candidate Journey station 4 "Arm"): Task Prep panel. Turns
// the role's aims into concrete day-to-day TASKS the candidate can act on - the gap the Human Lead
// flagged hardest ("aims & purpose but no tasks in detail"). New `TaskPrep` panel + `üéØ Task Prep`
// tab (gated on responsibilities): a PURE deterministic render of data ALREADY on
// result.responsibilitiesData.responsibilities (text/cat/freq/level/tool/how/kickstart/sk) - grouped
// Core -> Common -> Occasional; each task card = what you'd do (‚óê derived, extracted from the sampled
// postings) + how AI engages it (~ AI estimate, with the AI_USAGE tool) + one move to prepare this
// week (~) + the skills it draws on (mapped from result.skills via sk refs). NO new LLM call, NO
// invented task, NO new number (D1-D8 N/A - no new prompt). Reuses the audited Tag/Prov/AI_USAGE/
// LEVELS. Withholds when no duties. a11y review 7/7 PASS (no red/green; accents blue #1e40af 8.72:1 /
// cyan #0e7490 5.36:1; freq sub-note bumped C.mutedLight -> C.muted for AA). Spec CJ2 row SHIPPED.
// Additive; no frozen symbol touched. G1 (v3.0.53 -> v3.0.54).
// v3.0.55 - 2026-06-11 - HDR #093 - CJ3 (Candidate Journey station 5 "Rehearse"): Interview Rehearsal
// panel. New `Rehearsal` panel + `üé§ Interview Prep` tab (gated >=3 duties), loads on tab open.
// SYSTEM_REHEARSE: per real duty -> the competency interview question + a STAR scaffold of PROMPTS the
// candidate fills from their own experience. The model authors the QUESTION + the empty prompts ONLY,
// NEVER the candidate's answer/numbers/results - triple-locked: the prompt HARD RULE ("every STAR
// field is a PROMPT not an example answer; never invent the candidate's experience, numbers, results;
// no digits"), fetchRehearsal strips all digits + filters each question to a duty number that exists
// (byN.has), and the render frames the STAR lines as "prompts for YOUR story ... the answers are yours
// to supply". `~ AI estimate`; rehearse1 cache; claude-fable-5; withheld under thin duties; no Resume
// dependency. Conformance D1-D8 PASS + a11y 7/7 PASS (#1e40af 8.6:1; no red/green). Spec CJ3 SHIPPED.
// Additive; no frozen symbol touched. G1 (v3.0.54 -> v3.0.55).
// v3.0.56 - 2026-06-11 - HDR #094 - CJ4 Journey storyboard spine (last Candidate Journey slice).
// JourneySpine: a pure-UI strip in the Navigation box - 5 numbered stations (Understand / Position /
// Become / Arm / Rehearse) mapping O-I-A onto the real tabs. State by shape+number+label+text, never
// colour alone: "here" (blue fill + "- you are here" + aria-current="step"), "locked" (reduced opacity
// + "- locked" + aria-disabled + a "<name> - locked - <hint>" aria-label so keyboard/SR can reach it),
// "go" (default surface, tap -> onGo). Readiness is deterministic from which tabs exist (rolegraph/CV
// always present); no LLM, no number, no invented progress -> no Prov chip, no "human decides" footer.
// 44px targets; locked stations stay focusable (aria-disabled only, click guarded). Conformance + a11y
// 7/7 PASS. Spec CJ4 SHIPPED; the Candidate Journey arc is now complete (CJ1-CJ4).
// Additive; no frozen symbol touched. G1 (v3.0.55 -> v3.0.56).
// v3.0.57 - 2026-06-11 - HDR #095 - ESCO-DIS: occupation disambiguation by skill overlap.
// Bug (Human Lead): generic titles flooded a non-IT role with "ICT..." skills - e.g. Senior
// Director Transformation Delivery resolved (blind top-hit) to ESCO "digital transformation
// manager" and inherited its ICT-coded essential skills (Implement ICT Coding Conventions,
// Attack Vectors, ...). Root cause: resolveOccupation took results[0] with no role-family guard.
// Fix (ADDITIVE + OPT-IN, frozen-door AU-7 ESCO-DIS approved): api/esco.js gains a NEW
// resolveOccupationByOverlap(title, skillPhrases) - widens the candidate pool by searching on the
// ad's real skills too (like occupationFingerprint), then picks the occupation with the most
// skill-overlap; exact title match still wins; no-overlap falls back to the top hit. The original
// resolveOccupation is byte-untouched and still used when no phrases are passed. getEscoSkills
// gains an OPTIONAL skillPhrases arg (one-arg path unchanged); posting/corpus runs feed
// posting.skills/corpus.skills. Deterministic - no LLM, no number. R-FREEZE updated to a contract
// check for getEscoSkills; verified exit 0. Tested: the Senior Director case moves off the
// ICT-heavy occupation to a closer-overlap one.
// Additive; resolveOccupation/getEscoSkills one-arg contract intact. G1 (v3.0.56 -> v3.0.57).
// v3.0.58 - 2026-06-11 - HDR #096 - rateSkills token budget bug ("Could not parse JSON for
// ratings"). Bug (Human Lead log): a Data Analyst posting returned 36 ESCO skills; rateSkills
// hard-capped max_tokens at a flat 3500 (tuned for 25 skills), so the JSON response truncated,
// extractJSON threw, and the WHOLE analysis errored (a 22-skill role worked fine - confirming the
// count was the trigger). Fix: the rating token budget now SCALES with skill count
// (min(8000, 1600 + n*110)), with one retry at the 8k Haiku ceiling on a parse blip before giving
// up - so one flaky/truncated response no longer kills the result page. rateSkillsCompact scaled
// the same way (min(5000, 1100 + n*45)). claude.js proxy byte-untouched (only the max_tokens VALUE
// passed in changed); no LLM-authored number; deterministic guards downstream unchanged.
// Additive; no frozen symbol touched (claude.js frozen, intact). G1 (v3.0.57 -> v3.0.58).
// v3.0.59 - 2026-06-11 - HDR #097 - SPH1: /spherical - "The Analysis Sphere" gallery.
// Phantom.land-style inside-a-sphere experience (Human Lead request): you stand at the centre of a
// sphere lined with 64 cards (the 20 v3 analysis artifacts, cycled across 5 latitude rows); left-
// drag to look around with damped lens easing + release inertia (GSAP power3.out decay), wheel to
// tilt, arrow keys to rotate; click a card and it flies to the eye while the sphere dims, opening a
// basic detail-page template (Back reverses the flight; ESC closes). NEW src/SphericalGallery.jsx
// (Three.js + GSAP, both npm - the CSP allows no CDN); card faces are CanvasTextures (img-src
// allows no external images; assets self-drawn in the house palette). main.jsx gains the /spherical
// (or ?view=spherical) branch as a React.lazy chunk - three/gsap NEVER load on the main app path
// (verified: index chunk byte-equivalent flow, gallery chunk 578kB fetched only on /spherical).
// AU-7 (SPH1): the B6-era "main.jsx routing stays frozen" note is amended - this route addition was
// explicitly chosen by the Human Lead ("Inside the React app"). A11y: role=application aria-label,
// keyboard arrows + ESC, aria-modal dialog, 44px targets, deep-navy/blue/orange only (no red/green
// state), prefers-reduced-motion skips intro/inertia/drift. Pure presentation - no LLM, no number.
// Verified in Chrome DevTools: render, drag+inertia, wheel, click->detail, ESC->restore, console
// clean (only local-only Vercel analytics 404s). G1 (v3.0.58 -> v3.0.59).
// v3.0.60 - 2026-06-11 - HDR #098 - SPH2: the sphere shows YOUR results + dock-left detail.
// Human Lead: "after analysis completes, each of the cards in the sphere will show the results and
// analysis and interlink as well. when click on the card of the sphere, the sphere will swing align
// to the left margin as a sphere and show in the centre the card details". Built: (1) App persists
// the completed analysis to localStorage (sgcv3_last_v1; CV NEVER persisted - cv lives in separate
// state; quota fallback strips per-skill prose); (2) /spherical reads it - every card face carries
// the role title + a real stat line (statsFor: pure pass-through counts of stored computed values,
// nothing authored; CV-side artifacts show "locked" with the unlock hint); (3) click now DOCKS the
// sphere to the left margin - camera pulls OUTSIDE (z 0.001->30), group scales 0.55 + shifts left
// (top on portrait), fog widens 16/30->26/75, materials DoubleSide so the ball reads from outside,
// and it keeps turning - while the detail panel opens centre/right with the artifact's real rows;
// (4) artifacts INTERLINK via related chips that swap the detail in place; (5) "Open this in the
// analyser" deep-links /?tab=<key> - App restores the saved analysis (setSel/setResult/results) and
// opens that tab, validated against buildTabs, falling back to "skills". Verified in Chrome
// DevTools with an injected save: real card faces, dock animation, interlink swap, deep-link
// restore (engine index honestly withheld when unreachable). G1 (v3.0.59 -> v3.0.60).
// v3.0.61 - 2026-06-11 - HDR #099 - UI1: design-token sweep (stage 1 of the layout de-vibe).
// Human Lead: "the layout for v3 looks vibe-coded" - audit quantified it: 22 distinct font sizes
// (9/9.5/10/10.5/11/11.5/12/12.5/13/13.5/14/14.5/15/16/17/18/19/20/21/22/24/30/32), 17 border
// radii (2..24 + 999), 116 padding variants, 110 hex colours. Stage 1 normalises mechanically
// (deterministic script, no hand edits): type scale -> {10,11,12,13,14,16,18,22,30} (152 remaps),
// radius scale -> {0,6,10,16,999,"50%"} (232 remaps), odd paddings rounded UP to even px (222 - up
// only, touch targets never shrink). Colours intentionally DEFERRED: the hue families are semantic
// (level/prov/persona) - collapsing them is stage-2 component work, not regex work. Layout itself
// unchanged; frozen logic symbols byte-identical (R-FREEZE exit 0 - they carry no styles). Stage 2
// (?ui=2 structural: sticky header incl. the 390px title/V2-button overlap fix, grouped tabs, hero
// vs utility card hierarchy, left journey rail) ships separately per the staged plan the Human
// Lead approved. Verified: build green, desktop + 390px mobile screenshots, one type rhythm.
// G1 (v3.0.60 -> v3.0.61).
// v3.0.62 - 2026-06-11 - HDR #100 - UI2: structural layout behind ?ui=2 (stage 2 of the de-vibe).
// Test it live at /?ui=2 (combines with ?tab= deep-links). On wide screens (>=1100px) the result
// page becomes a two-zone grid: the Navigation box (journey spine + tab pills) docks as a STICKY
// LEFT RAIL (300px) and the hero (AI-Exposure Index + exposure bar + segments) + active-tab content
// flow on the right; the Prov badges legend is demoted to a footnote under the content. Narrow
// screens stack rail-then-content. Implementation: the hero and Navigation box are extracted to
// consts (uiHero/uiNavBox) inside the results IIFE so BOTH layouts assemble the exact same nodes -
// the default UI renders the original order untouched (zero drift; flag captured once at mount via
// useState initializer because the ?tab deep-link replaceStates the URL). Plus one default-UI bug
// fix the audit surfaced: the blue app header could collide title/buttons on phones - now
// flexWrap:"wrap" + flex:"1 0 200px" on the title so the buttons wrap UNDER it, never over it.
// No data, no prompt, no number changed; frozen symbols byte-identical (R-FREEZE exit 0). Verified
// in Chrome DevTools: ?ui=2 rail + sticky + footnote legend at 1440px, stacked at phone width,
// default UI pixel-order unchanged. Flip ?ui=2 to default in a follow-up once the Human Lead
// approves the A/B. G1 (v3.0.61 -> v3.0.62).
// v3.0.63 - 2026-06-11 - HDR #101 - UI2 flip: the rail layout becomes the DEFAULT (Human Lead
// approved the A/B with "1"). One-line change: uiV2 now true unless ?ui=1 - the original stacked
// layout stays reachable at /?ui=1 as the escape hatch (same nodes either way, so no drift).
// Sphere deep-links (/?tab=...) now land on the rail layout. G1 (v3.0.62 -> v3.0.63).
// v3.0.64 - 2026-06-12 - HDR #102 - UI3: colour consolidation (the last parked de-vibe slice).
// 105 distinct 6-digit hexes -> 85 (63 remaps, deterministic script). What moved: the GREY/SLATE
// sprawl collapses onto the 7 C tokens (bg-tier tints -> C.bg, border-tier -> C.border, text greys
// -> mutedLight/muted/textSub/text - text only ever DARKENS, AA never drops); 3 stray blues join
// the accent family (2563eb/1d4ed8 -> 1a56db, 1e3a8a -> 1e40af); and the two GREEN-family prompt-
// technique chips move to blue families from the existing palette - directional-stimulus (lime
// 3b6d11/f7fee7/bef264 -> sky 0369a1/f0f9ff/bae6fd, 5.4:1) and few-shot-anchor, which was a green
// bg with an INDIGO border (mismatch) -> coherent indigo 4338ca/eef2ff/c7d2fe (6.6:1). Better for
// the deuteranopic Human Lead; labels still carry all meaning (never colour alone). What stayed:
// every semantic hue family (level ambers/teals/purples, bar gradations, LinkedIn 0a66c2 + EU
// 003399 brand, pink fairness flags). R-FREEZE exit 0. G1 (v3.0.63 -> v3.0.64).
// v3.0.65 - 2026-06-12 - HDR #103 - PRO1: Company Background via the ACRA register + outsourced
// flag (Professional Read arc opens; spec: v3-professional-read-spec.md). Human Lead's greatest
// concern: "it is a tech job but outsourced by talent search company". Built: (1) api/datagov.js
// gains action "acra" - live datastore_search on "Entities Registered with ACRA" (data.gov.sg,
// DATA_GOV_SG_API_KEY sent when present); a NORMALISED EXACT-NAME guard withholds fuzzy hits
// (verified live: the ranked search returns "FINTECH SOLUTIONS" for "PERCEPT SOLUTIONS" - never
// shown); 24h cache; prefers a live registration over a deregistered namesake. (2) postingMeta now
// carries postedCompanyName/hiringCompanyName from the MCF payload. (3) NEW CompanyBackground panel
// in the Deep Read cluster (single-posting runs): register facts VERBATIM (UEN / entity type /
// status with a deregistered warning / registered-since / address / same-name count) or withheld;
// "posted by a third party" flag when poster != hirer (computed) and "reads as a staffing firm"
// (shared _AGENCY_STEMS, derived) - with the explicit tech-role caution (iscoMajor 2/3): the seat,
// manager and worksite may belong to a client, not the poster. No LLM, no number authored;
// source/confidence/time-window footer; 44px + aria-expanded; flag by shape+text, not colour.
// G1 (v3.0.64 -> v3.0.65).
// v3.0.66 - 2026-06-12 - HDR #104 - PRO1.1: ACRA lookup hardening (live-probe findings). Two
// defects from the v3.0.65 live probe: (1) datastore_search 409s "q is invalid" on punctuation
// (the trailing dot in "DBS BANK LTD.") - q is now sanitised to letters/digits/spaces/&/-;
// (2) the fuzzy ranker drowns common tokens, so big-name employers missed. Fix: two-step lookup -
// filters= EXACT entity_name equality FIRST (verified live: "DBS BANK LTD." -> UEN 196800306E,
// Registered, first try), sanitised q + exact-name guard as fallback. Statutory boards (e.g.
// GovTech) are not in the ACRA-issued dataset - honestly withheld. api/datagov.js only; no UI
// change. G1 (v3.0.65 -> v3.0.66).
// v3.0.67 - 2026-06-12 - HDR #105 - PRO5: Work-Mode Mix ("the ads has mix of supervision,
// teamwork, self-contributor, how would you address" - Human Lead). NEW WorkModeMix panel in the
// Role-Mix tab: each extracted duty classified by FIXED people-signals (precedence supervision >
// teamwork > self-contributor; "manage a team" is supervision, "manage monthly reports" is solo -
// 8/8 unit cases pass); labelled segment bar (S/T/I letters + counts, never colour alone) + per-
// duty evidence rows showing the MATCHED SIGNAL so the reader can disagree; when all three modes
// hold >=20% the panel flags "boss, teammate AND solo deliverer in one seat" and ties to the
// Role-Mix grab-bag/mixed coherence verdict + the interview question to ask. Withheld under 3
// duties. Deterministic end to end (~ derived); no LLM, no invented number; source/confidence/
// time-window footer; 44px + aria. G1 (v3.0.66 -> v3.0.67).
// v3.0.68 - 2026-06-12 - HDR #106 - PRO6: "Same job, other names" ("for the same role title,
// sometimes there are also role titles with R&R similar... but different titles, how can you help"
// - Human Lead). NEW AlsoAdvertisedAs panel rendered with the hero (both layouts): sibling titles
// from THREE deterministic, individually-labelled sources - (1) the DIFFERENT titles the live MCF
// postings behind this result used (cited with employer names, ‚óè from MCF), (2) ESCO alternative
// labels (registry verbatim, deduped against the ad titles, ‚úì), (3) the Role-Mix blend's occupation
// labels ("the duties also read as", ‚óê). Tap a title -> handleAnalyseRole re-runs the full pipeline
// for it. Withheld when no verifiable sibling exists; no LLM, no number authored; 44px chips +
// aria-expanded; source/confidence/time-window footer. G1 (v3.0.67 -> v3.0.68).
// v3.0.69 - 2026-06-12 - HDR #107 - PRO4: the Agentic Shift ("in this agentic movement, how would
// you change the skill to craft agents" - Human Lead). NEW AgenticShift panel at the top of Skill
// Analysis: the four AI ways STAY, but a fixed crosswalk (_AGENTIC_XWALK, deterministic copy) says
// what each level's skill BECOMES when the move is crafting agents - Full Automation = owning an
// agent (objective/checkpoints/audit, the untrusted-actor rule), AI-Augmented = designing the
// handoff (what the agent drafts, what only you sign), AI-Assisted = sharp questions + demanding
// sources, Human-Led = the governance node where new tasks grow around the agents (the pro-worker
// frontier). Only the per-level skill COUNTS are computed. Plus ONE Fable 5 role-level advisory
// line ("where to start here": which duty to delegate to an agent first + what control to keep) -
// SYSTEM_AGENTIC JSON-only, NO digits (stripped), duty-grounded, agentic1 cache, lazy on open,
// withheld under 3 duties or empty. Grounding: goal paper section 3 phases two and three + NBER
// w34854 new-task-creating. ~ AI estimate chip; human-decides footer; 44px + aria.
// G1 (v3.0.68 -> v3.0.69).
// v3.0.70 - 2026-06-12 - HDR #108 - PRO2: Cover Letter Workbench ("how to craft the cover letter
// through the ads" - Human Lead). NEW "Cover Letter" tab (gated >=3 duties, like Interview Prep):
// SYSTEM_COVER designs a FOUR-PARAGRAPH scaffold (Opening / First proof / Second proof / Close) -
// the model authors each paragraph's PURPOSE + fill-in PROMPTS only, never a sample sentence or
// the candidate's claims (the Rehearsal triple-lock: HARD RULE in the prompt + digit strip + the
// two proof paragraphs must cite DIFFERENT real duty numbers, filtered byN.has). Each proof shows
// "Answers the duty: ..." verbatim from the ad. "Copy the scaffold" button exports plain text with
// the supply-your-own-truth rule appended. CV text is never read here (it stays in the Role
// Graph); the footer routes users there so True-Fit shows which duties their evidence covers.
// cover1 cache; claude-fable-5; loads on tab open; withheld thin/ungrounded; ~ AI chip +
// human-decides footer; 44px. G1 (v3.0.69 -> v3.0.70).
// v3.0.71 - 2026-06-12 - HDR #109 - PRO3: "Explain this analysis" (Fable 5 "to help user
// understand the analysis work" - Human Lead; CLOSES the Professional Read arc PRO1-PRO6). NEW
// ExplainAnalysis at the bottom of the Navigation box (both layouts): "New here? How to read this
// analysis" - SYSTEM_EXPLAIN picks five to seven of THE SECTIONS THIS RESULT ACTUALLY RENDERED
// (the live tab list is the ground truth passed in; steps citing a missing key are dropped) and
// says what to look for in each FOR THIS ROLE, plus the one-line reading thread; each step is a
// tap-through chip to its tab. Narration only - authors no number (digits stripped); explain1
// cache keyed title + tab-set hash; lazy on open; withheld under 4 tabs or ungrounded; ~ AI chip
// + "authors no number" footer; 44px toggle + aria-expanded. G1 (v3.0.70 -> v3.0.71).
// v3.0.72 - 2026-06-12 - HDR #110 - VAULT: snapshot vault/v3.0.71 (repo root). The v3 app source
// at v3.0.71 (the Professional Read arc close) copied verbatim into vault/v3.0.71/ - same
// convention as the gia repo's git-tracked vault/v<version>/ snapshots; excludes node_modules,
// dist, .vercel. No app code changed in this PR beyond this journal entry + the 3-site bump
// (house rule: every PR bumps). ~/.claude/.last_vault bumped to the vault date.
// G1 (v3.0.71 -> v3.0.72).
// v3.0.73 - 2026-06-12 - HDR #111 - LUX1: professional landing + analysis-loading upgrade.
// Human Lead: landing and background-analysis screens "look vibe coded - upgrade to progressive
// professional 3js and advanced web app loading styled". Built: (1) NEW src/AmbientBackdrop.jsx -
// a Three.js ambient constellation (house blues/teal + sparse amber, no red/green) behind the
// landing (calm) and searching/loading (active) screens; PROGRESSIVE: a pure-CSS gradient wash
// paints instantly, `three` is dynamically imported only after mount as a lazy chunk - the main
// bundle stays three-free (same contract as /spherical); prefers-reduced-motion / WebGL failure
// leaves the static wash; pauses when the tab hides; DPR capped 1.75; aria-hidden + pointer-events
// none (decorative only - nothing encoded in it). (2) Spinner rebuilt as an advanced loading
// console: determinate conic progress ring with % + step count when step/total known (indeterminate
// dual-tone arc otherwise), gradient sweep bar, numbered step rail (done = filled + check, current =
// outlined + pulse, pending = muted - shape+label, never colour alone), staggered skill-card
// reveal; role=status aria-live=polite; reduced-motion kills all animation. (3) Landing search
// card + IntroCard restyled glass-professional (blur, layered shadows, same copy/structure).
// (4) ErrBox: the raw Anthropic 400 "credit balance is too low" billing message (seen live
// 2026-06-12) no longer renders verbatim - a calm blue "taking a short pause" notice shows
// instead (CLIENT-side only: api/claude.js is FROZEN and byte-untouched; a proxy-side CAPACITY
// mapping is proposed as a follow-up AU for the Human Lead). Header/main gain zIndex so the
// fixed backdrop sits beneath everything. Pure presentation - no LLM, no number.
// G1 (v3.0.72 -> v3.0.73).
// v3.0.74 - 2026-06-13 - HDR #112 - LUX2: round particles (Human Lead: "why give square balloon
// on first page"). Three.js PointsMaterial draws untextured points as SQUARES - the v3.0.73
// backdrop showed small drifting squares on the landing. Fix in AmbientBackdrop.jsx only: a
// 64px canvas-drawn radial-gradient sprite (white core feathering to transparent - CSP-safe,
// self-drawn like the sphere's CanvasTextures) is set as the PointsMaterial map, so each point
// renders as a soft round glow dot tinted by its vertex colour (house blues/teal/amber
// unchanged); size 2.6 -> 3.2 to compensate for the feathered edge; sprite disposed in cleanup.
// No other file touched; no LLM, no number. G1 (v3.0.73 -> v3.0.74).
// v3.0.75 - 2026-06-14 - HDR #113 - LUX3: professional landing + analyse polish (Human Lead:
// "professionally upgrade v3 landing + analyse - keep it type-heavy, low whitespace, don't
// drastically alter; modern hover micro-animations + a text clip-path reveal on hover;
// awwwards-grade; mobile-friendly"). Type-forward refinement, NOT a teardown - copy + layout
// structure unchanged. (1) New namespaced .lux-* CSS micro-interaction layer in the global
// style block: luxRise staggered entrance; .lux-lift spring hover (translateY + shadow);
// .lux-clip TEXT CLIP-PATH REVEAL (an accent twin wipes across the word on row hover via
// clip-path inset, content:attr(data-text)); .lux-uline / .tab-label underline wipe; .lux-cta
// button sheen-sweep + .lux-arrow nudge; .lux-search focus-within glow ring; .lux-focus
// keyboard ring. ALL effects are pure CSS (zero JS, no GSAP on the main path - the captivating
// 3D layer stays the LUX1/LUX2 Three.js backdrop) and ALL collapse to nothing under
// prefers-reduced-motion. (2) Typography quality: body gains text-rendering:optimizeLegibility
// + font-smoothing + kern/liga/calt; root font stack enriched with Inter/system-ui/-apple-system
// fallbacks (no external font - v3 CSP forbids it); hero + labels get tighter tracking +
// text-wrap:balance. (3) IntroCard audience rows: 01-04 index numerals, clip-path label reveal,
// lift, arrow nudge, AND are now keyboard-operable (role=button/tabIndex/Enter+Space - they were
// click-only divs). PersonaToggle tiles likewise gain keyboard access + lift + clip reveal.
// (4) Search shell focus-within ring; CTA gains a trailing arrow. a11y: no red/green, state never
// by colour alone, focus rings added, reduced-motion honoured, 44px targets intact. a11y-review
// follow-ups folded in pre-merge: the search input dropped its inline outline:none and took the
// .lux-focus per-element ring (the focus-within shell glow was parent-only - WCAG 2.4.7); the
// persona "remove" control became keyboard-operable (role=button / tabIndex / Enter+Space /
// aria-label). Pure presentation - no LLM, no number, frozen door untouched.
// G1 (v3.0.74 -> v3.0.75).
// v3.0.76 - 2026-06-14 - HDR #114 - ALERT: unify the outage notice + builder webhook alert
// (Human Lead: "fresh 'taking a short pause' notice whenever Anthropic is unavailable, and
// send a message to me via messaging/notification"). Two parts. (1) UNIFY: ErrBox no longer
// shows a different message per failure class - capacity/credit, overload (429/529), server
// (5xx), timeout, auth, and any unrecognised error now ALL fall through to ONE calm "taking a
// short pause" notice, and the generic fallback no longer prints the raw provider string (this
// closes the original "credit balance is too low" leak for good). Daily-cap (isBusy) and
// user-input errors (no-match / invalid / too-long) stay distinct - they need different,
// accurate guidance and are NOT outages. (2) ALERT: NEW api/alert.js (additive; api/claude.js
// stays FROZEN) forwards a short message to an incoming webhook (Slack/Discord; carries both
// `text` and `content`) so the builder is told when the service is down. claudeCall fires a
// debounced (10-min), best-effort beacon to /api/alert ONLY after its retries are exhausted -
// a genuine persistent outage, not a blip. No user/CV data is sent (error text + model tier +
// path + timestamp only); /api/alert no-ops until ALERT_WEBHOOK_URL is set in the deploy env;
// alerting can never affect the visitor (always 2xx, all failures swallowed). Same-origin
// beacon -> connect-src 'self' already allows it, no CSP change. No LLM, no number.
// SETUP REQUIRED: add ALERT_WEBHOOK_URL (your Slack/Discord webhook) in the v3 Vercel project.
// G1 (v3.0.75 -> v3.0.76).
// v3.0.77 - 2026-06-17 - HDR #115 - NEO + MCF RECENCY (Human Lead directives "change the v3 UI
// to be more neo-skeuomorphism" and "i keep getting similar MCF ads each day ... sort by latest
// ... categorize into two buckets - new and last search"). Two parts, both presentational /
// behaviour only - no engine, prompt, or Prov-chip surface touched. (1) NEO: a soft-UI skin -
// base bg -> #e6ebf2 (the neutral canvas surfaces extrude from), neutral border softened, a NEO
// token set (raise/raiseSm/inset dual shadows), the shared card() helpers + a .main-content-scoped
// retrofit turn the standard white card signature into extruded soft surfaces, and the LUX chrome
// (search/CTA/lift) becomes inset/raised. Text stays dark, semantic chips stay coloured, the
// keyboard focus halo was restored to >=3:1 on the new base (a11y review FAIL -> fixed). (2) MCF
// RECENCY: the MyCareersFuture panel now sorts postings newest-posted first (verbatim postedDate)
// and splits them into NEW vs SEEN-BEFORE against a device-local, best-effort memory (localStorage
// mcfSeen.v1, bounded + pruned). "New" is keyed on the first-seen DAY so reloads don't flip it; the
// Seen-before bucket is ordered by when each ad first entered your searches. Clearly labelled as
// your own on-device history, NOT an MCF fact, so it carries no "from MCF" provenance. No LLM, no
// number. G1 (v3.0.76 -> v3.0.77).
// v3.0.78 - 2026-06-17 - HDR #116 - PILLARS arc + refinements (Human Lead directive: replace the
// abstract journey metaphor with five plain-question pillars, and a run of UX refinements). This
// version reconciles the string with the whole arc that landed as separate PRs (R003). Shipped:
// PL1 excise CV-fit from RoleGraphPanel; PL2 remove Rehearse / Cover Letter / Resume Check; PL3
// PillarBar header (Understand / Position / Become / AI Readiness / Arm) replacing JourneySpine;
// PL4 pillar VIEW shell + _PILLAR_MAP + lead-question headers; PL5 Understand s1 "why the org
// wants this role" (net-new SYSTEM_WHY_ROLE, D1-D8 8/8) + Role-Graph tree s2; PL6 market/employer
// reads to Position; PL7/PL8 Become stewardship reads + AI Readiness pillar (the AI-exposure hero
// de-duplicated to AI Readiness only). Then: pillar-grouped NAV tree (from _PILLAR_MAP); Task Prep
// collapsible bands/cards; AI-resilience score reconciled into AI Readiness next to the Exposure
// Index ("complementary, not the same number"); TGFEP + Employer-reality hide-when-clean; jargon
// <Term> glossary tooltips; +1 detail font + 1/2/3/4-column analysis screen; liquid-glass floating
// nav rail beside the title card. Presentation/IA only - no engine number authored, moved, or
// recomputed across the arc; engine + frozen door untouched throughout. G1 (v3.0.77 -> v3.0.78).
// v3.0.79 - 2026-06-18 - HDR #117 - HEADER TEXT-SIZE + JOB-AD HTML + SKILLS TRACE (Human Lead
// directives). (1) Text-size control moved into the global app header, which is now sticky
// (position:sticky top:0 zIndex:50) so it stays reachable while scrolling; the left nav rail drops
// to top:64 and section anchors gain scrollMarginTop:64 so jumps still land clear of the pinned
// header. The control collapses from four absolute buttons (A-/A/A+/A++) to a three-button stepper -
// decrease one notch / reset / increase one notch - restyled for the dark header; end states are
// encoded by opacity+border, not colour alone (a11y). Same UI_SCALE_STEPS machinery + persistence.
// (2) JobAdDrawer now runs the posting text through _stripHtml before _fmtJobAd, so raw-HTML
// postings (e.g. <p><strong>...) render as structured text instead of visible tags. (3) MON:
// log-only skills_resolved trace (total vs unique skill count + dup names) on the main analyse
// path, for the double-skill watch - captured under ?dmm=1 / ?debug=panel; no de-dup, behaviour
// unchanged. Presentation + observability only; no engine number authored; frozen door untouched.
// v3.0.80 - 2026-06-18 - HDR #118 - KG1: knowledge-graph builder + clustered render (Human Lead:
// "construct a sophisticated, brain-like knowledge graph of the job role"). New deterministic
// buildKnowledgeGraph(result, title) -> {nodes, edges, clusters, withheld} - closed verb set, honesty-
// gated clusters (competition omitted without mirror-role data), no LLM in the structure; rendered in
// RoleGraph.jsx behind ?view=graph with fallback to the baked layered graph. buildGraphStructure /
// parseJobAd byte-identical (frozen door intact). G1 (v3.0.79 -> v3.0.80).
// v3.0.81 - 2026-06-18 - HDR #119 - POPUP STANDARDIZE (Human Lead: "the pop-ups are not standardized
// in font and message structure and heading styled professionally"). New shared POP token set
// (title / sub / body + tipTitle / tipBody + 44px closeBtn) applied across every overlay surface:
// CompareWarningModal (now role=dialog + aria-modal + aria-labelledby + 44px buttons), JobAdDrawer
// header, Toast, Term glossary + tech tooltips - one type scale and message structure, no colour-only
// state. Presentation only; engine number + frozen door untouched. G1 (v3.0.80 -> v3.0.81).
// v3.0.82 - 2026-06-18 - HDR #120 - KG2: wire the KG1 knowledge graph into the live result page
// (it built but rendered nowhere - getKnowledgeGraph was never called and window.__kgPayload never
// set). RoleGraphPanel gains a Layered <-> Knowledge-graph view toggle (aria-pressed, 44px, active
// state by border+weight not colour); Knowledge mode renders KGGraph from getKnowledgeGraph(live
// result), with an amber "not enough role data yet" notice when the graph is thin/withheld. KGGraph
// exported from RoleGraph.jsx (DATA-free). Additive; layered mode byte-unchanged; frozen door intact.
// G1 (v3.0.81 -> v3.0.82).
// v3.0.83 - 2026-06-18 - HDR #121 - AL1: AGENTIC LADDER (Human Lead: reframe each duty for the
// agentic era). Each TaskPrep duty card gains a Skill -> Recipe -> Agent -> Orchestrator rail showing
// where it sits TODAY and the one move to climb a rung. The rung is a pure deterministic crosswalk
// from the duty's existing AI-exposure level (HUMAN->Skill, LOW->Recipe, MEDIUM->Agent, HIGH->
// Orchestrator) - no new LLM, no new prompt (D1-D8 N/A), no new number; the climb step reuses the
// duty's kickstart/how. Withholds ("unscoped") when level is absent; a11y: neutral palette (higher is
// not "better"), aria-current, ASCII rail. Additive; frozen door intact. G1 (v3.0.82 -> v3.0.83).
// v3.0.84 - 2026-06-18 - HDR #122 - LANDING POLISH (Human Lead, from screenshot). (1) Text-size
// A-/A/A+ buttons: drop the square boxed borders - borderless now, active "A" by subtle bg fill +
// aria-pressed, disabled by opacity (no colour-only state). (2) The two entry cards (Analyse role /
// Browse SG jobs): selected state is now WHITE bg + a single light-blue 2px border (was light-blue
// fill + accent border, which read as a double border). (3) Selecting either card moves focus to the
// job-title input so the user can type the role immediately. Presentation only; frozen door untouched.
// G1 (v3.0.83 -> v3.0.84).
// v3.0.85 - 2026-06-18 - HDR #123 - SIBLING-TITLES LAYOUT (Human Lead: "centralised job title in the
// pill is awful, messy, takes a lot of space"). The "Same job, other names" block: the top "live ads"
// group switches from centered wrapped pills with the employer dangling OUTSIDE to a clean full-width
// list - left-aligned title + employer as a small muted sub-line INSIDE the row, chevron pinned right.
// chip() helper left-aligned (textAlign:left, justify flex-start) and tidied (radius 16->10, 1px
// border) so wrapped labels never centre. Presentation only; frozen door untouched. G1 (v3.0.84 -> v3.0.85).
// v3.0.86 - 2026-06-18 - HDR #124 - KG3: knowledge-graph edges fix + honesty guard (Human Lead: "0
// edges - seems just semantic"). (1) skill->occupation "informs" edges no longer gate on the duty
// mapping (empty for skills-only roles) - every resolved skill informs the occupation directly, so
// the graph is actually wired instead of a bare node list. (2) RoleGraph: a payload that still has 0
// edges is labelled "grouped role map" (not "wired structure") with an amber note, rather than
// claiming wiring it does not have. Intentionally edits buildKnowledgeGraph (KG3 supersedes the KG1
// freeze of that symbol). G1 (v3.0.85 -> v3.0.86).
// v3.0.87 - 2026-06-18 - HDR #125 - CO1: company-name search (Human Lead: "switch role/company on the
// landing page; poll MCF for the company's advertised jobs, double-check the company name and how many
// posts"). New third searchMode "company" alongside role/jobs (frozen "jobs" path untouched); the card
// relabels the shared input to "Company name". New api/mcf.js action:"company" - searches MCF, normalises
// employer names (strips Pte Ltd / Asia Pacific etc.), groups by employer, returns each matched employer
// + a pass-through posting COUNT, flags ambiguous (>=2 employers) for a chooser, withholds on 0 - <=3
// search calls, no per-job detail. CompanyPanel confirms "Found: <employer> - N live postings" (from MCF)
// and lists them into the existing handleAnalysePosting. Deterministic, no LLM, no number minted; frozen
// door intact. (Sandbox cannot reach MCF - build + unit checks on mocked JSON; live verify on preview.)
// G1 (v3.0.86 -> v3.0.87).
// v3.0.88 - 2026-06-18 - HDR #126 - CO2: company "agents to build" (Human Lead arc). On a confirmed
// employer (CO1), "Find AI moments" detail-fetches the top 5 postings (duties:true, reuses
// extractResponsibilities, budget <=8) and buildCompanyAgents clusters duties across roles by token
// overlap, ranks by recurrence x AI-exposure (HUMAN clusters stay "stays human", never promoted), and
// frames the top clusters as candidate agents. Rendered as a three-tier graph (Functions -> Recurring
// duties -> Agent candidates) reusing KGGraph, with a CompanyAgentSidePanel ("Connected to" + "From
// these postings" provenance) and a seed-deterministic force-directed layout toggle (lanes stay the
// a11y default). SAT discipline (indicators / ACH-per-function + runner-up / Key-Assumptions / QoI);
// withholds under 4 postings / 6 duties / recurrence 2. Deterministic, no LLM, no number minted;
// candidate-suitability withheld; frozen door intact. (Sandbox cannot reach MCF - build + unit checks
// on mocked JSON; live verify on preview.) G1 (v3.0.87 -> v3.0.88).
// v3.0.89 - 2026-06-18 - HDR #127 - LANDING REFRESH (Human Lead). (1) Removed the redundant "Fresh
// grads - < 4 yrs experience" checkbox from the Browse SG jobs card (the Fresh Graduate persona in the
// foundation-plan toggle already covers it). (2) The PersonaToggle (foundation skills plan) now greys
// off + disables when searchMode is "company" (a personal plan does not apply to an employer-wide
// search), and selecting the employer card clears any chosen persona. (3) Hero gains a grounding +
// agentic subtitle: "Grounded in live MyCareersFuture postings ... see the role as a wired knowledge
// graph, and what AI can take on" - surfacing the live-MCF differentiator. Presentation only; engine +
// frozen door untouched. G1 (v3.0.88 -> v3.0.89).
// v3.0.90 - 2026-06-18 - HDR #128 - CO2.1 cleanup (Human Lead live Rockwell read: 122 clusters / 47
// "agent candidates" was noise). The duty harvest now fences out NON-duties before clustering -
// qualifications (degree/diploma/N years), benefit items (leave/insurance/wellbeing/mindfulness/
// membership), requirement phrasings (proficiency/knowledge in...) and short section headers - via
// _AGENT_NONDUTY_RE + _AGENT_HEADER_RE. Reason: every posting repeats the same benefits/quals, so
// unfenced they clustered with high recurrence and got falsely PROMOTED as agent candidates. Plus the
// shortlist is rank-truncated: agents to top 8 (COMPANY_AGENT_MAX_AGENTS), the recurring-duties tier
// to top 15 by recurrence (COMPANY_AGENT_MAX_DUTIES; agent-backing clusters always kept so no edge
// dangles). Deterministic, no LLM, frozen door intact; the side-panel provenance is unchanged.
// G1 (v3.0.89 -> v3.0.90).
// v3.0.91 - 2026-06-18 - HDR #129 - CO2.2 graph zoom + workflow (Human Lead: "Obsidian force graph -
// hubs at high level, expand on zoom; switch neural <-> structured workflow"). KGGraph layout prop
// widens to "lanes" | "force" | "workflow". (1) Semantic zoom / LOD: _lodBand(z) -> L0 hubs only
// (functions + agents) / L1 + recurring duties / L2 + leaf; ineligible nodes fade + drop out of tab
// order; LOD_NODE_CEILING=60 auto-collapses a dense graph to L0 on open. (2) Pan/zoom: one viewport
// transform over a single parent wrapping the edge + node layers (no re-sim) - wheel/pinch to cursor,
// drag (>4px), +/-/arrows, 44px fit/reset; ZOOM_MIN/MAX/STEP consts. (3) _workflowLayout: deterministic
// left->right columns (functions | duties | agents), order by edge weight then id. 3-way Lanes | Neural
// | Workflow segmented toggle; lanes stays the default + a11y/keyboard path; reduced-motion zeroes
// transitions. Presentation only; _forceLayout byte-frozen; no LLM, no number; frozen door intact.
// G1 (v3.0.90 -> v3.0.91).
// v3.0.92 - 2026-06-18 - HDR #130 - CO2.2 fix (Human Lead: "I haven't seen the 2 columns"). The
// Workflow view gated its columns by the zoom-LOD band, so at the overview only the hub tiers
// (Functions + Agent Candidates) painted and the middle Recurring-Duties column stayed hidden until
// zoom-in - reading as 2 columns. The structured Workflow now ALWAYS shows all 3 columns (WF_BAND=2);
// semantic-zoom collapse-to-hubs stays a Neural-view-only declutter. Presentation only; frozen door
// intact. G1 (v3.0.91 -> v3.0.92).
// v3.0.93 - 2026-06-20 - HDR #131 - CSG: careers.gov.sg second job source + two-column browse
// (re-cut onto current main; v3.0.92 was taken by #156). NEW server proxy api/careers.js fetches the
// opengovsg/careersgovsg-jobs-data MIT-licensed dump (6h cache), normalises each record into the exact
// 18-field shape normaliseJob() in api/mcf.js returns (PLUS source:"careers.gov.sg"); honest empties.
// Client helpers fetchCsgJobs() + mergeJobSources(); two additive fire points - getJobsForRole() and
// the McfJobsPanel doFetch() both fan out to /api/careers via Promise.allSettled (MCF body byte-
// identical; one source failing never blanks the other). McfJobCard gains a source label (icon+text,
// never colour, R007) and salary suppression for CSG (careers.gov.sg has no salary field). BROWSE
// LAYOUT (Human Lead): McfJobsPanel renders the two sources as TWO RESPONSIVE COLUMNS - MyCareersFuture
// left (keeps its filters/pagination on state.jobs), careers.gov.sg right (state.csgJobs, top 10 +
// "more", graceful empty for gov-only) - via .csg-cols grid that stacks below 1000px; the role-analyse
// corpus still merges both. api/mcf.js byte-frozen; frozen symbols untouched; AU-7 in
// v3-result-engine-spec.md ¬ß1. G1 (v3.0.92 -> v3.0.93).
// v3.0.94 - 2026-06-20 - HDR #132 - CSG copy sweep: name BOTH sources everywhere the role-analysis
// corpus now blends them; keep MCF-specific reads accurate by filtering careers.gov.sg out of them.
// (a) BROWSE landing (prior commit on this PR): "Browse SG jobs" mode source label ->
//     "Sources: MyCareersFuture + careers.gov.sg"; two landing help lines updated.
// (b) SHARED surfaces relabelled (Part 1): "What will be shown" intro, IntroCard hero line, Job Anatomy
//     fallback + adCount footer (both views), knowledge-graph empty states (2x), Responsibilities
//     fallback + header footer, corpus loading sub-message, escoSource const, corpus result chip.
//     Wording: "live SG job postings (MyCareersFuture + careers.gov.sg)" or shorter equivalents
//     where space-constrained. ASCII + hyphens throughout (R007).
// (c) SOURCE-AWARE single-posting chip (Part 3): postingMeta gains postingSource field (verbatim
//     from the posting's own source tag); chip reads "From a live {source} posting" - honest for
//     both MCF and careers.gov.sg single-posting analyses.
// (d) MCF-ONLY FILTERS (Part 2): DemandProof, AdLanguageScan, EmployerReality each filter
//     careers.gov.sg out of their jobs array before counting/scanning. Rationale: careers.gov.sg
//     lacks salary bands, poster-vs-hirer split, and MCF posting-flow fields - including them would
//     dilute or corrupt those reads. Their "Source: MyCareersFuture (N)" counts now reflect MCF only.
// (e) GOV-AGENCY TWO-COLUMN (Human Lead confirmed): "Search by employer" (company mode) now fans
//     out to BOTH /api/mcf action:"company" (MCF employer grouping) AND /api/careers action:"company"
//     (new agency filter in api/careers.js: tokenise + acronym + substring match on agency field).
//     Promise.allSettled - one source failing never blanks the other. CompanyPanel renders TWO
//     RESPONSIVE COLUMNS via .csg-cols: left = MyCareersFuture (existing resolveCompany + CO2 agents
//     flow, byte-identical); right = careers.gov.sg (top 10 + "+N more" note; graceful empty for
//     private companies). Mode card source label -> "Sources: MyCareersFuture + careers.gov.sg";
//     placeholder hints agencies. api/mcf.js + frozen symbols untouched.
// No engine/number change; api/mcf.js + frozen symbols untouched. G1 (v3.0.93 -> v3.0.94).
// v3.0.95 - 2026-06-20 - HDR #133 - CSG agency-match fix (Human Lead test surfaced two misses).
// api/careers.js action:"company" only - no App.jsx/engine change. (a) INITIALISM match: a user-
// typed acronym (LTA, MOH, MOE, MND) now resolves to an agency the dataset spells out in full.
// careers.gov.sg writes "Land Transport Authority" with NO "(LTA)", so the old paren-acronym path
// missed it (LTA returned 0). New initialisms() builds BOTH the all-words and significant-words
// forms (ministry acronyms are irregular - MOH/MOE keep the "of", MND drops it) and matches either.
// (b) AND token logic: agency token-overlap was OR, so one shared token ("ministry") pulled in every
// ministry - "Ministry of Health" returned 399 across all ministries. Now ALL query content-tokens
// must be present, so it returns the real MoH count (~25). Verified vs the live dump: LTA 0->150,
// MoH 399->25, MOH/MOE/MND resolve, HTX 73 unchanged, private firms (DBS) honestly 0. api/mcf.js +
// frozen symbols byte-identical; careers.js is not a frozen file. G1 (v3.0.94 -> v3.0.95).
// v3.0.96 - 2026-06-20 - HDR #134 - WikiGraph MVP demo at /demo (Human Lead: "deploy into
// vercel as /demo"). Self-contained static prototype only - NO app/engine change. Adds
// public/demo.html (4-persona home, clickable [[wikilink]] note-to-note navigation, provenance
// chips, "your next best move", common-patterns bars, tap-able mini graph; sample data, no live
// fetch) + a vercel.json rewrite /demo -> /demo.html placed before the SPA catch-all. Validates
// the JobAds WikiGraph interaction before the real arc (spec v3-wikigraph-spec.md, PRs to follow).
// api/mcf.js + frozen symbols untouched; no JSX/code change here. G1 (v3.0.95 -> v3.0.96).
// v3.0.97 - 2026-06-20 - HDR #135 - WikiGraph MVP /demo: add the full entry flow for all 4
// persona types (Human Lead: "landing + search + picker + criteria ... see all 4 types").
// Still static prototype only - public/demo.html rewritten with a persona switcher + per-persona
// search screen: typed input, live progressive picker (filters sample matches; withholds with no
// match), and persona-specific criteria (Standards: standard + fresh-grad relevance; MCF: sector +
// recency + fresh-grad toggle; Fresh-grad: max-experience + locked filter; Employer: MCF/careers.gov
// .sg sources). Screen-stack nav (home -> search -> note) with Back/Home; same theme throughout.
// No app/engine change; api/mcf.js + frozen symbols untouched. G1 (v3.0.96 -> v3.0.97).
// v3.0.98 - 2026-06-20 - HDR #136 - WikiGraph /demo: expanding graph (Human Lead review:
// "if i tap it should continue to link and shows the trees and branches", not one hub+spoke).
// Still static prototype only - public/demo.html graph rewritten from a 1-hop recentre-on-tap
// view into a growing force-directed network: tapping a node EXPANDS its branches in place (+ / -
// badges), the tree accumulates, with drag-to-pan, zoom +/-, Reset (collapse to root), and an
// explicit "Open note" (single-tap grows, double-tap or the button reads). Keyboard-operable
// nodes; aria-labels say expand/collapse + hidden count. No app/engine change; api/mcf.js +
// frozen symbols untouched. G1 (v3.0.97 -> v3.0.98).
// v3.0.99 - 2026-06-21 - HDR #137 - WikiGraph /demo layout fix (Human Lead review: "so much
// margin ... hub and node ... overlap each other"). Static prototype only - public/demo.html:
// content widened 880 -> 1200px (less dead side margin); graph canvas enlarged 600x280 -> 960x460
// with a taller responsive height, stronger node repulsion + longer links + higher move clamp so
// nodes no longer pile up, and a white text halo (paint-order) so labels read over edges/siblings.
// No app/engine change; api/mcf.js + frozen symbols untouched. G1 (v3.0.98 -> v3.0.99).
// v3.0.100 - 2026-06-21 - HDR #138 - WikiGraph /demo: radial ecosystem graph + Obsidian-paper
// model (Human Lead: "follow the paper ... title inside the bubble ... one centre and branch out
// ... interlink only shows if i click"; ref = brainsci-13-01462 radial GNN dendrogram). Static
// prototype only. public/demo.html rebuilt: (1) sample data restructured into the ecosystem from
// the two Obsidian papers - Organisation -> Department -> Role -> Job Ad -> skills / stakeholders /
// risks / AI impact / positioning, with the causal spine (org AI-pressure -> dept friction -> role
// pressure -> ad). (2) Graph is now a RADIAL TREE like the paper: one centre, collapsed by default,
// branches appear only on tap (expand/collapse), labels INSIDE rounded bubbles, colour = layer,
// bubble carries the title; pan/zoom + legend. No app/engine change; api/mcf.js + frozen symbols
// untouched. G1 (v3.0.99 -> v3.0.100).
// v3.0.101 - 2026-06-21 - HDR #139 - WikiGraph /demo: two graph modes + focus-recentre (Human
// Lead review: "depth should loop ... inner bubble should shrink ... legend of what each ring
// means ... switch from graph to top-down org chart"). Static prototype only. public/demo.html:
// (1) RADIAL is now a focus-browser - tap a bubble to RE-CENTRE on it (depth loops infinitely via
// cross-links), the path you came from shrinks into a small trail at the top (tap to climb back),
// solving outer-ring crowding. (2) NEW top-down ORG CHART mode via a toggle - classic boxes/rows,
// expand-collapse. (3) Richer legend (colour = layer, size = repeats more often) + a dynamic hint
// per mode. No app/engine change; api/mcf.js + frozen symbols untouched. G1 (v3.0.100 -> v3.0.101).
// v3.0.102 - 2026-06-21 - HDR #140 - CSG: relabel the result tab "MyCareersFuture Jobs" -> "SG Jobs"
// (Human Lead: "why still titled ... MCF only where engine is now wired for both"). The buildTabs
// mcf_jobs tab (line ~13077) still read MCF-only, but the panel it opens (McfJobsPanel, "SG Job
// Postings") has rendered BOTH MyCareersFuture and careers.gov.sg columns since #155/#157 - the
// copy sweep relabelled the cards + panel but missed this tab label. Source-neutral now; the panel
// names both sources inside. Presentation only; api/mcf.js + frozen symbols untouched. G1
// (v3.0.101 -> v3.0.102).
// v3.0.103 - 2026-06-21 - HDR #141 - WikiGraph /demo: real government org chart from SGDI (Human
// Lead: "pull real SGDI data into the org chart"). Static prototype only. public/demo.html: the
// Employer persona "Ministry of Health" now resolves to a real org tree mapped from the Singapore
// Government Directory (sgdi.gov.sg, fetched read-only) - MOH -> 3 policy pillars + statutory boards
// (HSA, HPB, CDA, AIC...) + healthcare clusters (NHG, NUHS, SingHealth); NUHS -> National University
// Hospital -> clinical departments (Neurosurgery, Neurology) -> a careers.gov.sg consultant role ->
// an AI-imaging-triage impact node that cites the brainsci-13-01462 brain-imaging GNN paper (human
// judgement stays human-led). New "agency" layer + legend entry; gov structure tagged derived,
// roles via careers.gov.sg. No app/engine change; api/mcf.js + frozen symbols untouched. G1
// (v3.0.102 -> v3.0.103).
// v3.0.104 - 2026-06-21 - HDR #142 - WikiGraph /demo: broaden government coverage (Human Lead:
// "add more ministries"). Static prototype only. public/demo.html: new top-level "Singapore
// Government" node -> 16 ministries (from SGDI); MOE and MHA now fully mapped from sgdi.gov.sg
// (MOE: SkillsFuture/ITE/SEAB + polytechnics + autonomous universities incl. NUS/NTU; MHA Home
// Team: SPF/SCDF/ICA/ISD/CNB/HTX/Home Team Academy + an HTX careers.gov.sg role). The other 13
// ministries are honest "listed in SGDI, not mapped" leaves; a NUS->NUHS cross-link demonstrates
// the loop between Education and Health. 75 nodes, 0 broken links. No app/engine change; api/mcf.js
// + frozen symbols untouched. G1 (v3.0.103 -> v3.0.104).
// v3.0.105 - 2026-06-21 - HDR #143 - WikiGraph /demo: wire org chart to LIVE careers.gov.sg roles
// (Human Lead: "wire the org chart to live careers.gov.sg roles under each agency"). Static demo
// shell only - public/demo.html now fetches the SAME-ORIGIN /api/careers (action:company) when a
// wired statutory board / agency is tapped (HSA, HPB, SPF, SCDF, ICA, HTX, SkillsFuture, ITE...),
// injecting the real current roles as branch nodes with an "Open on careers.gov.sg" link; empty or
// failed fetches show an honest withheld/error node, never invented roles. Verified live: HSA 9,
// SPF 7, SkillsFuture 29. No app/engine change - reuses the existing /api/careers endpoint;
// api/mcf.js + frozen symbols untouched. G1 (v3.0.104 -> v3.0.105).
// v3.0.106 - 2026-06-21 - HDR #144 - WikiGraph /demo: match the current v3 styles + colours (Human
// Lead: "use the styles and colours of current v3 throughout the demo"). Static prototype only -
// public/demo.html restyled to the v3 C palette: page bg #e6ebf2, surfaces #fff, text #1a202c,
// accent #1a56db, CTA deep-blue #003399, teal/amber/purple families, 14px card radius + soft raise
// shadow, and the v3 gradient hero heading (text->accent->teal). Graph layer colours pulled into the
// same blue/teal/purple/amber families (still no red/green). No app/engine change; api/mcf.js +
// frozen symbols untouched. G1 (v3.0.105 -> v3.0.106).
// v3.0.107 - 2026-06-21 - HDR #145 - WikiGraph /demo: true v3 NEUMORPHIC styling (Human Lead:
// "/demo didn't use the colour and style of v3"). Inspected the live site (Playwright): v3 is a
// soft-UI / neumorphic surface - panels are the SAME #e6ebf2 tone as the page, raised by the NEO
// dual light/dark shadows (not white cards + borders), over a faint network-dot backdrop, with a
// navy header band and the IBM Plex Sans stack. Static demo only - public/demo.html rebuilt to
// match: NEO raise/inset shadow vars, same-tone panels, radial-dot page backdrop, navy->eu gradient
// header with light-on-navy controls, inset inputs, v3 font stack. No app/engine change; api/mcf.js
// + frozen symbols untouched. G1 (v3.0.106 -> v3.0.107).
// v3.0.108 - 2026-06-21 - HDR #146 - WikiGraph /demo: header title + word-wrapped graph bubbles
// (Human Lead: title should be "AI Readiness across Skills and Competences (middot) JobAds from
// Singapore"; "word wrap bubble !! don't truncate"). Static demo only. public/demo.html: header
// brand + page <title> set to the v3 title with a middle dot (star + navy band kept); and the SVG
// graph bubbles now WORD-WRAP the full node title across multiple tspan lines (wrapLabel, ~18 ch/
// line) with the rounded-rect sized to fit - no more ellipsis truncation; org-chart row/col spacing
// widened for the taller bubbles. No app/engine change; api/mcf.js + frozen symbols untouched. G1
// (v3.0.107 -> v3.0.108).
// v3.0.109 - 2026-06-21 - HDR #147 - WikiGraph /demo: drop the "MCF" abbreviation (Human Lead:
// "still have MCF!!"). Static demo only. public/demo.html: persona card "Find MCF Jobs" -> "Find
// SG Jobs"; the verbatim-source prov chip label "from MCF" -> "verbatim from posting" (the demo's
// prov:"mcf" kind tags BOTH MyCareersFuture and careers.gov.sg postings, so the abbreviation was
// also inaccurate on gov nodes); "Verbatim MCF field" -> "Verbatim from the posting"; "not MCF" ->
// "not MyCareersFuture". No user-facing "MCF" left. No app/engine change; api/mcf.js + frozen
// symbols untouched. G1 (v3.0.108 -> v3.0.109).
// v3.0.110 - 2026-06-21 - HDR #148 - WikiGraph /demo: drop the org-chart toggle (Human Lead:
// "forget about the org chart"). Static demo only. public/demo.html: removed the "Switch to org
// chart" button + its wiring; the radial focus-browser is now the single graph mode (gTitle/hint
// simplified to radial-only). The org-chart layout code is left dormant/unused. No app/engine
// change; api/mcf.js + frozen symbols untouched. G1 (v3.0.109 -> v3.0.110).
// v3.0.111 - 2026-06-21 - HDR #149 - WikiGraph /demo: candidate/org lenses + ecotone overlay +
// value stream (Human Lead brief: incorporate existing v3 results for candidate AND organisation;
// value stream from Flow Engineering; present internal<->external interlink via the ecotone /
// edge-effect PDF). Static demo only. public/demo.html: (1) a Candidate / Organisation LENS toggle
// on every note - Candidate reuses the v3 result framing (AI-exposure bar, automatable vs human-led
// core, fit, edge position); Organisation shows a VALUE-STREAM strip (steps tagged value-creating /
// capturing / eroding, lead time, friction) per Steve Pereira's Flow Engineering + Teixeira's value
// chain. (2) An ECOTONE overlay toggle on the graph: nodes tinted by realm (internal / edge /
// external), boundary-spanning "edge species" glow amber, and links crossing internal<->external
// are emphasised - the edge is where value is richest + least automatable (Lewis & McKone edge-of-
// core; the ecotone/edge-effect ecology metaphor). Added external nodes (customers, vendor,
// patients). No app/engine change; api/mcf.js + frozen symbols untouched. G1 (v3.0.110 -> v3.0.111).
// v3.0.112 - 2026-06-21 - HDR #150 - WikiGraph /demo: full guided candidate journey (Human Lead:
// "use the demo to show how are you going to guide a full candidate"). Static demo only. The
// Candidate lens on a role (Data Analyst) now renders a 7-step guided journey, each step an existing
// v3 result panel chained: (1) Job Anatomy (work-layer mix + AI-resilience), (2) Skill Analysis
// (skills bucketed by AI level Human-Led->AI-Assisted->AI-Augmented->Full Automation), (3) Demand
// Proof, (4) Foundation gaps + 7/14/30-day plan, (5) the edge/ecotone to aim for (human-led =
// least automatable = AI-readiness), (6) Progression + Crossover, (7) Positioning + next move. AI
// levels coloured on the v3 blue<->orange ramp (no red/green). No app/engine change; api/mcf.js +
// frozen symbols untouched. G1 (v3.0.111 -> v3.0.112).
// v3.0.113 - 2026-06-21 - HDR #151 - WikiGraph /demo: full guided ORGANISATION journey (Human Lead:
// "proceed with organization"). Static demo only. The Organisation lens on a Department (Group Data
// & Analytics) now renders a 7-step journey mirroring the candidate one, built on Steve Pereira's
// Flow Engineering four maps + Lewis & McKone Edge Strategy: (1) Outcome Map, (2) Value Stream Map
// (steps tagged value-creating/capturing/eroding + lead time), (3) Capability Map (constraint +
// root cause + measure), (4) Dependency Map (internal/external deps tagged by realm - externals sit
// at the ecotone), (5) edge of core (Product/Journey/Enterprise edge - where growth hides), (6)
// Future State (which steps AI absorbs vs stay human-led), (7) so who to hire (links back to the job
// ad). No app/engine change; api/mcf.js + frozen symbols untouched. G1 (v3.0.112 -> v3.0.113).
// v3.0.114 - 2026-06-21 - HDR #152 - WikiGraph /demo: more journeys across domains (Human Lead:
// polish). Static demo only - data only, reuses the existing journey renderers. Added full CANDIDATE
// journeys for the Neurosurgery Consultant (clinical: edge = surgical judgement + patient trust; AI
// triages brain scans per Brain Sci. 2023) and the Business Analyst; and a full ORGANISATION journey
// for the Neurosurgery department (patient pathway value stream: referral -> scan/triage ->
// diagnosis -> surgery decision -> operation -> recovery; AI absorbs triage, judgement stays human-
// led; hiring links back to the consultant role). Shows both journeys hold across banking + health-
// care. No app/engine change; api/mcf.js + frozen symbols untouched. G1 (v3.0.113 -> v3.0.114).
// v3.0.115 - 2026-06-21 - HDR #153 - WikiGraph /demo: Candidate Brief takeaway (workflow-review gap
// #1). Static demo only. The candidate journey now opens with a one-page CANDIDATE BRIEF that
// consolidates the whole journey into a keepable summary: AI-readiness (exposure + resilience), your
// edge (the human-led skills), build-next (7/14/30 plan), positioning line, next move - with a
// "Print / save as PDF" button (window.print + @media print shows only the brief). Turns the read
// into something the candidate keeps. No app/engine change; api/mcf.js + frozen symbols untouched.
// G1 (v3.0.114 -> v3.0.115).
// v3.0.116 - 2026-06-22 - HDR #154 - doc: WikiGraph build plan (Human Lead: "craft a plan as in
// the /doc using today's date ... use html ... include UI changes"). Doc-only - adds
// doc/v3-wikigraph-plan-2026-06-22.html: a styled HTML build plan turning the /demo prototype into
// a real additive feature, with the deterministic-vs-advisory honesty contract (each element ->
// verbatim/computed/derived/advisory tier + chip), the data/logic changes, the UI changes (new
// entry, radial WikiGraph view + lens toggle + ecotone overlay, candidate/org journey panels,
// Candidate Brief, provenance everywhere) and a phased PR0->PR5 plan. No app/engine change;
// api/mcf.js + frozen symbols untouched. G1 (v3.0.115 -> v3.0.116).
// v3.0.117 - 2026-06-22 - HDR #155 - PR0: Career WikiGraph SPEC (Human Lead approved the plan ->
// "build"). Doc-only - adds v3/script/v3-wikigraph-spec.md (status READY_FOR_BUILD) authored by the
// spec-author agent: the WikiGraph as an ADDITIVE reading surface over data the app already
// computes; the four-tier honesty contract (verbatim/computed/derived/advisory) + a new R-WIKI-TIER
// rule forcing a per-line provenance tier so the deterministic-vs-advisory ratio is provable;
// deterministic realmOf + valueTagOf DERIVATION RULES (not LLM prose); wiki node/edge data model;
// the two lenses + journeys mapped step-by-step to the reused v3 panels; the PR0->PR5 slice; D1-D8 +
// G1-G8 gates; AU-7 frozen-door note. No app/engine change yet; api/mcf.js + frozen symbols
// untouched. G1 (v3.0.116 -> v3.0.117).
// v3.0.118 - 2026-06-22 - HDR #156 - PR1: Career WikiGraph entry + shell (additive; no engine edit).
// Adds fourth mode card "Career WikiGraph" on the landing alongside Analyse role / Browse SG jobs /
// Search by employer. A wiki-mode search runs the SAME resolve + analyse pipeline as Analyse role;
// a destination ref (wikiDestRef) makes doAnalyse route to step "wiki_view" instead of "results"
// (the ref survives the async ESCO resolve + picker). New component src/wiki/WikiGraphView.jsx: a
// React port of the /demo radial focus-browser graph (one centre, tap to recentre, trail at top,
// word-wrapped labels, pan/zoom/reset, animated relayout). The graph payload is built fresh via
// buildKnowledgeGraph in a useMemo on result (NOT the role-key cache, which would freeze a
// duty-less graph) so it fills in as the analysis enriches, then stays stable - consumes, never
// edits. buildKnowledgeGraph, getKnowledgeGraph, all frozen symbols, api/mcf.js, engine-data/*
// untouched. R007, R006, R005 clean; no red/green; 44px targets; SVG aria-label; keyboard nodes.
// G1 (v3.0.117 -> v3.0.118).
// v3.0.144 - 2026-06-24 - HDR #182 - Vercel route guard + OpenAI key migration for V3. The SPA fallback
// now excludes /_vercel/ so Vercel Insights and Speed Insights scripts are served by the platform
// instead of being rewritten to index.html. /api/claude keeps the internal response contract but now
// reads OPENAI_API_KEY and calls OpenAI Responses; CSP connect-src switches from api.anthropic.com to
// api.openai.com. UI/engine/v2 untouched.
// v3.0.145 - 2026-06-24 - HDR #183 - OpenAI live hardening: long prompt-card batches can return
// human-readable multi-paragraph JSON with raw line breaks inside strings. extractJSON now retries
// parsing after escaping raw control characters inside JSON strings, so prompt-card generation survives
// provider formatting drift without loosening the JSON-only contract. V3-only.
// v3.0.146 - 2026-06-24 - HDR #184 - LLM resilience: /api/claude keeps OpenAI as primary
// (OPENAI_API_KEY) and adds Gemini as fallback when GEMINI_API_KEY + GEMINI_MODEL are configured.
// The response contract stays unchanged for the UI; provider becomes "gemini" only when fallback is
// actually used. Footer/methodology now state OpenAI primary with Gemini fallback. V3-only.
// v3.0.147 - 2026-06-24 - HDR #185 - Function-keyword guard: "transformation" is treated as a
// function area, not a precise job title, so the picker now shows the same refine notice used for
// strategy/change/project functions and suggests concrete transformation titles. V3-only.
// v3.0.148 - 2026-06-24 - HDR #186 - Function-keyword guard fix: instant search can pre-fill
// occs before the Analyse button is clicked, causing doSearch() to return early into the picker
// before setting the notice. The guard now runs before that early-return branch. V3-only.
// v3.0.149 - 2026-06-24 - HDR #187 - SG Jobs browse re-ranking: live MCF and careers.gov.sg
// results now classify each posting as title / responsibility / segment / related match for the
// searched phrase, ranking title matches first while preserving secondary evidence below. Adds a
// floating job drawer with source counts and analyse-all access. V3-only.
// v3.0.150 - 2026-06-24 - HDR #188 - SG Jobs drawer polish: compact evidence-panel styling,
// clearer source totals, keyboard Escape close, aria-expanded state, and safer bottom-left spacing
// above the existing Job ad float. Also tolerates legacy /dmm=1 debug links as aliases for ?dmm=1.
// V3-only.
// v3.0.143 - 2026-06-24 - HDR #181 - RIN3: centre-first result shell (Human Lead: "left navigation
// drawer floating... right side panel collapse... role graph centre but collapsible and expand and window
// movable"). Result navigation now opens from a bottom-left floating drawer above the Job ad FAB; Decision
// moves to a collapsed right rail; RoleGraph can collapse in place or expand into a draggable floating
// window. Centre Map content gets the space; engine/API/v2 untouched.
// v3.0.142 - 2026-06-24 - HDR #180 - RIN1/RIN2 V3 reinvention shell (Human Lead: "Finish all the PR
// and deploy all at once"). Result view now has Context / Map / Decision panels on wide screens and
// Ask / Map / Decide tabs on phone. RoleGraph is first in Understand/Map, keeps the V2 fast read,
// and collapses the method pipeline behind a 44px control. Decision panel states no autonomous action
// is allowed until risk, owner, scope, and audit exist. Render-only; v3-only; engine/API/v2 untouched.
// v3.0.141 - 2026-06-22 - HDR #179 - Merge the two "Job ad" FABs (Human Lead: "merge"). On the WikiGraph
// tab there were two bottom-left FABs: the app-level plain-posting JobAdFab + the new dissect FAB. The
// app JobAdFab render now carries `&& activeTab !== "wikigraph"` so it is suppressed on the wiki tab; the
// dissect FAB moves from bottom:88 to the standard bottom:22 spot - so the WikiGraph has ONE "Job ad" FAB
// that opens the dissected drawer (which itself shows the verbatim posting context + the markings). Other
// tabs keep the plain-posting JobAdFab unchanged. Render-only; frozen door byte-identical. G1 (140 -> 141).
// v3.0.140 - 2026-06-22 - HDR #178 - WikiGraph "Job ad" FAB -> dissected-job-ad drawer (Human Lead:
// "left panel be navigation Floating Drawer and bottom Job ad FAB... open the whole drawer with dissect
// markings which can be click and change the centre panel"; chose: job ad marked up + floating overlay).
// New src/wiki/WikiDissectDrawer.jsx: a LEFT floating overlay (backdrop + slide-in panel) opened by a
// bottom-left "Job ad" (scissors) FAB on the WikiGraph surface. It shows the verbatim posting context
// (from MCF) + the O-I-A dissection as theme-coloured tappable MARKINGS (each duty, with its work-mode /
// AI-exposure). Tapping a marking calls handleMarkingTap(dutyId, themeId) -> setSelectedId(dutyId)
// (the right graph highlights that duty) + scrollToId(themeId) (the centre canvas scrolls to that theme)
// + closes the drawer. So: tap a marking -> centre + graph focus, exactly the requested interaction.
// WikiGraphView: dissectOpen state, the FAB, the drawer, the handler. Render-only over the themed payload
// + verbatim posting; deterministic; LLM gloss only renames a theme label; no red/green (theme tints
// decorative). FAB at bottom-left z950 (stacked above the existing app job-ad FAB for now). G1 (139 -> 140).
// v3.0.139 - 2026-06-22 - HDR #177 - Docs-style 2-pane for the ORGANISATION perspective (Human Lead:
// "the 3 panel doesn['t] show in the organisation perspective" -> bring it over). The employer AI-moments
// is graph-PRIMARY (the graph is the content, the inverse of the role view where reads are the content +
// graph is a rail), so the docs layout maps to: GRAPH centre + a docked DETAILS/INDEX rail. KGGraph gains
// an `embedded` prop (drops the minHeight:100vh / full-page padding / 1240 cap so it sits as a clean card,
// not a standalone page); CompanyAgentSidePanel gains an `inline` prop (renders as a static docked card,
// not the fixed right-edge overlay drawer). The AI-moments now renders a 2-pane: <main> KGGraph embedded |
// <aside> sticky rail that shows the tapped node's CompanyAgentSidePanel inline, or - when nothing is
// tapped - an "Agent candidates" INDEX (top agents, click to focus). flex-wrap stacks the rail below on
// phones. Render-only; the role's Role Graph KGGraph (no embedded prop) is unchanged; frozen symbols +
// api/* + engine-data byte-identical. G1 (v3.0.138 -> v3.0.139).
// v3.0.138 - 2026-06-22 - HDR #176 - Stop truncating AI-moments node text upstream (follow-up to #175).
// Live tap-to-expand revealed labels still cut mid-word ("...improve work pr") because
// companyAgentsToKgPayload truncated duty-cluster + agent node labels with .slice(0,80). Raised both to
// .slice(0,220) so the full duty reads in the expanded node (the render already word-wraps + soft-clamps
// the preview and shows everything on tap). Engine data shaping only; deterministic; no LLM; frozen
// symbols + api/* + engine-data byte-identical. G1 (v3.0.137 -> v3.0.138).
// v3.0.137 - 2026-06-22 - HDR #175 - Make the AI-moments graph readable (Human Lead: "Lanes/Neural/
// Workflow... no significant value, i cannot zoom, the square is so hard[ened] i cannot read the text,
// too many text truncated... read must be able to read/expand/collapse, professionally style UI/UX";
// chose: PATCH KGGraph in place, everywhere it is used). Edits to src/RoleGraph.jsx KGForceView (the
// Neural view, where fixed 104x44 boxes with overflow:hidden clipped the duty text): (1) TAP-TO-EXPAND -
// the tapped node now grows in place to a wide auto-height card showing its FULL text + type, "tap to
// collapse" (read/expand/collapse); non-tapped nodes get a clean 3-line soft clamp (-webkit-line-clamp)
// instead of a hard mid-word cut, bigger font. (2) Small graphs (<= LOD_NODE_CEILING, i.e. nearly all)
// now IGNORE the LOD so zooming just SCALES - nodes no longer vanish/appear as you zoom (the "cannot
// zoom" frustration). (3) Caption rewritten to teach tap-to-expand. App.jsx: the company AI-moments
// segmented control drops the redundant WORKFLOW mode (it duplicated the column Cards view) and renames
// "Lanes" -> "Cards" - now Cards (readable) | Neural (tap-to-expand graph). This KGGraph edit is
// Human-Lead-directed; the earlier arc-scoped "RoleGraph FREEZE / consume only" no longer applies.
// Render-only; api/* + engine-data + the 6 frozen symbols byte-identical. G1 (v3.0.136 -> v3.0.137).
// v3.0.136 - 2026-06-22 - HDR #174 - Declutter the employer result (Human Lead: "if i select from MCF,
// then the career.gov doesn't have to be there"). The careers.gov.sg RIGHT column now renders only when
// it is loading or actually has roles (showCsg); for a private/MCF employer (e.g. DBS) it has none, so
// the redundant "No careers.gov.sg roles..." panel is dropped and the MyCareersFuture results take the
// full width (csg-cols class only applied when the second column is shown). Render-only; the dual-source
// careers.gov.sg path + api/careers.js untouched. G1 (v3.0.135 -> v3.0.136).
// v3.0.135 - 2026-06-22 - HDR #173 - Career WikiGraph 3-pane shell, slice 3 (Human Lead picked 3:
// "wire left nav + centre canvas + right rail"). WikiGraphView restructured into a 2-column layout
// (the result page's pillar nav is the third pane): CENTRE <main id=wiki-reads> = lens toggle +
// Candidate/Org journey + the O-I-A canvas + node detail + footer; RIGHT <aside> (sticky) = a docked
// INTERACTIVE GRAPH mini (Focus, RadialSVG new `compact` prop: graph only, ~230px, no toolbar/legends)
// with an Expand button -> a full-screen dialog overlay carrying the full controls (Focus/Neural toggle,
// ecotone, path-back breadcrumb, node detail) + an "On this page" TOC that smooth-scrolls to the reads,
// the canvas, and each theme section (WikiCanvas sections now carry id=themeId). graphControls + graphBody
// extracted so the mini and the overlay share one source. maxWidth 900 -> 1240; flex-wrap so on phones the
// rail drops below the centre (responsive). Render-only; the graph reflects the same payload; frozen door
// byte-identical; no red/green; expand icon via String.fromCharCode (R007). The graph stops dominating the
// reading flow - it is now a calm right-rail mini, expandable on demand. G1 (v3.0.134 -> v3.0.135).
// v3.0.134 - 2026-06-22 - HDR #172 - Career WikiGraph "canvas" centre, slice 1 (Human Lead sent the
// Obsidian Help 3-pane layout + the Obsidian Canvas refs; "interlinks by text not visual"; steers: graph
// -> right-rail panel not a tab, mini-graph default Focus, O-I-A -> centre canvas of word/text/theme
// relationships). NEW src/wiki/WikiCanvas.jsx renders the O-I-A as a CARD BOARD (the centre canvas):
// each theme is a coloured group box (decorative blue/teal/purple/amber tints, no red/green, label is the
// cue) holding duty CARDS; each card shows the duty text + its key-term [[wikilinks]] + the skills it
// depends-on (-> [[skill]] from the deterministic edges) + [work-mode][AI-exposure] tags; plus reference
// cards for the role's occupation (ESCO/ISCO) and organisation (the embedded-note analog). Relationships
// are shown BY TEXT (wikilink chips), not a node blob - the visual graph stays the separate Focus/Neural
// view. WikiGraphView renders WikiCanvas in place of the OIASurgicalCut list under the same O-I-A header.
// Render-only over the themed payload + edges (deterministic); LLM gloss only renames a theme label (~).
// Slice 1 of the layout rework (centre canvas); right-rail docked-expandable graph + On-this-page TOC +
// 3-pane shell are the next slices. Frozen door byte-identical; R007 clean. G1 (v3.0.133 -> v3.0.134).
// v3.0.133 - 2026-06-22 - HDR #171 - Fix: O-I-A theme-label gloss 404'd live. fetchThemeGlosses used
// model "claude-fable-5", which the /api/claude proxy rejects as an unknown model (404) -> gloss never
// applied, themes stayed as seed words. Switched to the proven narration model "claude-haiku-4-5-20251001"
// (the claudeCall default). Work-mode chips (deriveWorkMode) verified live this build. Render-only;
// frozen door byte-identical. G1 (v3.0.132 -> v3.0.133).
// v3.0.132 - 2026-06-22 - HDR #170 - O-I-A polish (Human Lead picked 1+2): (1) WORK-MODE chip always-on -
// new deterministic deriveWorkMode(text) in src/wiki/themeGraph.js classifies a duty's leading verb into
// the engine's JOB_LAYERS (Relational/Judgment/Accountability/Coordination, else Activity); used as the
// fallback when result.jobAnatomy (lazy + LLM-classified) is not yet loaded, so every duty shows BOTH a
// [work-mode] and [AI-exposure] chip (engine layer preferred when present). (2) LLM theme-label GLOSS -
// the "Interpret" step: fetchThemeGlosses() batches one /api/claude (claude-fable-5) call that renames the
// deterministic seed labels ("MAS","KYC") into readable phrases ("Regulatory liaison"); JSON-only,
// digit-stripped, fails soft to the seed. The LLM ONLY relabels for reading - the grouping stays
// deterministic and the seed remains the node identity (engine-wins). Gloss carries a ~ ai chip + shows
// the deterministic terms beside it; applied to both the theme nodes (Focus + Neural) and the O-I-A panel.
// New prompt is bounded (no digit, no structure, advisory). Frozen door byte-identical. R005:
// deriveWorkMode, fetchThemeGlosses. No red/green. G1 (v3.0.131 -> v3.0.132).
// v3.0.131 - 2026-06-22 - HDR #169 - Fix: O-I-A themes blobbed (live 16-duty R&R collapsed to 2 themes).
// Cause: union-find single-link clustering CHAINS duties transitively (A-B share t1, B-C share t2 ->
// A,B,C all merge) into one giant theme on a compliance-dense ad. Fix in src/wiki/buildWikiTopics.js:
// drop union-find; assign each duty NON-transitively to ONE headword = its most-grouping term with
// doc-freq <= ceil(N/3) (so over-generic words like "compliance"/"regulatory" can't name-and-swallow a
// theme), then group by headword. Same 16-duty ad now yields 7 distinct themes (Compliance/Regulatory/
// ACRA/AML/Fraud/KYC/Risk) instead of 2. Still pure/deterministic; frozen door byte-identical. G1 (130->131).
// v3.0.130 - 2026-06-22 - HDR #168 - Career WikiGraph: O-I-A "surgical cut" of the job R&R (Human
// Lead: "the wikigraph should first do a proper O-I-A on job r&R... observe, extract key words mapping,
// segment paragraphs into themes, use interpretation"; chose topic-groups-as-structure + work-mode/
// exposure tags). Two NEW deterministic modules (no LLM, no fetch, no Date.now): src/wiki/buildWikiTopics.js
// (Observe raw duties -> Extract salient key terms + acronyms -> Segment into themes by CONNECTED
// COMPONENTS over distinctive shared terms, excluding over-generic words so themes stay distinct;
// a duty with no shared link becomes its own named theme, never a forced "Other") and src/wiki/themeGraph.js
// (themeifyGraph: reshapes the FROZEN getKnowledgeGraph payload into Role -> Theme groups -> duties,
// re-routing role->duty edges through derived theme nodes; tags each duty with its work mode from
// jobAnatomy + AI-exposure level; falls back to the raw payload when < 3 duties). WikiGraphView consumes
// the themed payload in BOTH Focus and Neural views (theme = hexagon shape / green, a new shape=type cue)
// and renders an OIASurgicalCut panel listing each theme, its key terms, and every duty with [work-mode]
// [AI-exposure] chips. graphMetrics: theme weight 0.9 (major). The ENGINE forms the groups; an LLM may
// later only gloss a label (advisory) - it never authors a group/edge/tag. buildKnowledgeGraph /
// getKnowledgeGraph consumed read-only; all frozen symbols + api/* + engine-data/* byte-identical.
// R005: WIKI_STOPWORDS, extractKeywords, buildTopics, themeifyGraph. No red/green (shape carries type).
// G1 (v3.0.129 -> v3.0.130).
// v3.0.129 - 2026-06-22 - HDR #167 - Fix: Neural path-back stayed hidden right after a click because
// the cursor rests ON the just-clicked node, so hoverId === selectedId and the hover branch suppressed
// the path. src/wiki/NeuralGraph.jsx: introduce activeHover = a hover of a DIFFERENT node than the
// selection; the path-back (cyan links + breadcrumb + dimming) now shows whenever a node is selected,
// and only a foreign hover previews neighbours instead. Render-only; frozen door byte-identical.
// (Isolated nodes with no route to the role correctly show no path - honest, not a bug.) G1 (128 -> 129).
// v3.0.128 - 2026-06-22 - HDR #166 - Fix: Neural path-back never lit up (Human Lead reported it via
// the build, verified live - no breadcrumb, 0 cyan path links). Root cause: in src/wiki/NeuralGraph.jsx
// the `neighbours` adjacency map was memoised from `sim.links`, but the force sim is built in a useEffect
// AFTER render, so neighbours computed once from the empty initial sim and never refreshed -> BFS found
// no path. Fix: derive `neighbours` straight from the `edges` prop (always present), and key pathInfo on
// `neighbours`. Now clicking a node lights the cyan path home + the "Path back:" breadcrumb. Render-only;
// frozen door byte-identical. G1 (v3.0.127 -> v3.0.128).
// v3.0.127 - 2026-06-22 - HDR #165 - Career WikiGraph Neural view: click a node -> highlight the PATH
// BACK to the role centre (Human Lead: "when i click the branch it should show the path back"). In
// src/wiki/NeuralGraph.jsx: a deterministic BFS over the link graph finds the shortest path from the
// selected node to the root (the role node); those links glow bright cyan (#67e8f9 + bloom, with a crisp
// #a5f3fc overlay) and only the path nodes stay lit while the rest dim; a clickable "Path back:"
// breadcrumb (role -> ... -> node) appears under the canvas, each step re-selectable. Hovering still
// does the local neighbour-trace; selecting does the path-home trace. Pure graph traversal, no LLM, no
// engine/data change. Render-only; frozen door byte-identical; colour-blind safe (cyan path, no red/green).
// G1 (v3.0.126 -> v3.0.127). NOTE: the Human Lead also asked for a proper O-I-A "surgical cut" of the
// job R&R (observe -> extract/map keywords -> segment paragraphs into themes -> interpret) as the graph's
// node source - a separate, larger data-model slice queued next (buildWikiGraph, spec section 6), not in
// this PR.
// v3.0.126 - 2026-06-22 - HDR #164 - Career WikiGraph Neural view: stronger starfield glow (Human
// Lead picked option 3). src/wiki/NeuralGraph.jsx: adds a blurred bloom layer (feGaussianBlur filter
// #neuralBloom) of soft colour halos behind every node - brighter for central nodes, dimmed for minor -
// giving a real galaxy glow; each lit/major node also gets a bright near-white inner core (the "star"
// centre); the canvas is a deeper radial-gradient navy (#0c1426 -> #060912) so the stars pop. Replaces
// the old single per-node halo. Render-only; no engine/data change; frozen door byte-identical.
// R007/R006 clean; colour-blind safe (blue/teal/purple/amber/slate). G1 (v3.0.125 -> v3.0.126).
// v3.0.125 - 2026-06-22 - HDR #163 - Career WikiGraph "Neural" view (Human Lead shared the Obsidian
// graph as the target: "Neural look - visualize the relationships... find hidden patterns... visually
// engaging and interactive graph"; + two refs showing shape/dimming aid reading). Decisions (asked):
// ADD as a toggle (Focus radial vs Neural force-directed), DARK galaxy canvas. New file
// src/wiki/NeuralGraph.jsx: a force-directed view of the WHOLE wiki graph at once - O(n^2) repulsion +
// link springs + centering + damping, rAF cooled (deterministic phyllotaxis init, no Math.random in
// the seed). Readability levers from the refs, adapted for the Human Lead's red-green colour blindness:
// SIZE = importance, BRIGHTNESS = importance (minor/supporting nodes DIMMED so the named structure
// reads - the Obsidian "dim the marginalia" idea), SHAPE = type (diamond=occupation, square=org,
// triangle=competitor, big circle=role hub, circle=skill/detail - the Obsidian sample used RED for a
// category but SHAPE is the colour-blind-safe non-colour cue here), COLOUR = cluster (blue/teal/purple/
// amber/slate vivid on dark; NO red/green). Interactive: drag a node (pin while held, releases back into
// the web), pan, scroll-zoom, hover/focus highlights the node + its links and dims the rest. aria-label
// + keyboard-operable nodes + 44px toolbar. New shared src/wiki/graphMetrics.js (nodeImportance,
// impToScale, TYPE_WEIGHT) extracted from WikiGraphView so both views rank identically. WikiGraphView:
// Focus/Neural mode toggle (role=tablist) in the graph header; renders NeuralGraph when neural; trail
// hidden in neural; ecotone overlay (realm colour + amber cross-realm links) works in both. Render-only,
// additive; buildKnowledgeGraph/getKnowledgeGraph consumed read-only; all frozen symbols + api/* +
// engine-data/* byte-identical. R007/R006 clean. G1 (v3.0.124 -> v3.0.125).
// v3.0.124 - 2026-06-22 - HDR #162 - Career WikiGraph radial layout rework (Human Lead: "very ugly,
// only hub and spoke, where are the major and minor spoke... should be graceful... smaller font...
// expand appropriately like neural view graph"). Replaces the flat one-ring, one-size wheel in
// src/wiki/WikiGraphView.jsx with a hierarchical organic layout: (1) nodeImportance(node) ranks each
// child by TYPE_WEIGHT (role/occupation/org = major, skill = mid, duty/qual = minor) + count repeats +
// hub bump (a node with many children reads as a major branch); (2) bubble SIZE scales with importance
// (impToScale: minor ~0.56 -> major ~1.0, centre 1.24) so major and minor are visually distinct;
// (3) TWO-RING split when >8 children - majors on an inner prominent ring, minors on an outer ring
// offset half a slot (declutters; single weighted ring for <=8); (4) angular span weighted by
// importance so majors get breathing room; (5) curved spokes (curvePath quadratic bow) with weight +
// opacity by importance - major branches heavier/darker, minor faint (the "major vs minor spoke");
// (6) smaller fonts (12.5 -> 11, lighter pills); (7) new children grow OUT from the tapped node
// (useGraphAnim seeds them tiny at the parent's last position - the neural expand). Deterministic
// (index-based jitter, no Math.random in layout). Render-only, additive; buildKnowledgeGraph /
// getKnowledgeGraph consumed read-only; all frozen symbols + api/* + engine-data/* byte-identical.
// Ecotone overlay realm strokes still apply over the new sizes. R007/R006 clean; no red/green; SVG
// aria-label + keyboard nodes retained. G1 (v3.0.123 -> v3.0.124).
// v3.0.123 - 2026-06-22 - HDR #161 - a11y palette: normalise the "Full Automation" / high-exposure
// hue from burnt-orange #9a3412 to a clearer orange #d97706 app-wide (Human Lead, deuteranopia:
// "shift to a clearer orange app-wide" - the prior hue sat near the red-orange boundary and could
// read as red). Pure colour-token swap across all 43 usages in src/App.jsx (37), src/RoleGraph.jsx (1),
// src/wiki/OrgJourney.jsx (2), src/wiki/CandidateJourney.jsx (3) - every "high / Full Automation /
// thin / concern / boundary" state chip, the Activity job-layer, the role-graph link hue, capability
// gap markers and score thresholds now share the single orange. #d97706 keeps WCAG AA on the #fff7ed /
// white backgrounds it pairs with; state stays encoded by label + icon, never colour alone (no red/green).
// NO logic, number, verdict or structure changed - render-only. All ten frozen symbols
// (searchOccupations, getSkills, getSkillsFromPosting, checkIscoCoherence, detectFunctionKeyword,
// lookupSeniorMgmt, buildGraphStructure, buildKnowledgeGraph, getKnowledgeGraph, parseJobAd) verified
// byte-identical to main (no #9a3412 sat inside a frozen body); api/*, engine-data/* byte-identical.
// R007/R006 clean. G1 (v3.0.122 -> v3.0.123).
// v3.0.122 - 2026-06-22 - HDR #160 - PR5: Ecotone overlay + final sweep for the Career WikiGraph.
// Adds an "Ecotone overlay" toggle above the radial graph (off by default). When on, every graph
// node is tinted by REALM from the new deterministic classifier src/wiki/wikiRealmOf.js:
// computeRealmMap(nodes, edges) returns internal | edge | external per node (tier DERIVED) -
// external = a node whose VERBATIM label matches a CLOSED marker set (regulator/customer/vendor/
// ministry/MAS/... WIKI_EXTERNAL_MARKERS) or a mirror-occupation (competition = external market);
// edge = an internal node bridging to an external node (the ecotone "edge species"); internal =
// default. Realm is encoded by BOTH colour AND shape (internal thin solid blue / edge thick amber +
// glow / external dashed teal) for colour-blind safety; cross-realm links draw amber dashed; the
// legend swaps to a realm legend showing present/withheld state; an edge-zone callout appears on
// selection; the selected-node panel carries a Realm chip + DERIVED prov chip. Withhold over invent
// (spec 2.2): when no external marker and no boundary edge exist, the edge/external lanes are absent
// (present:false) and named in withheld[] - NO faked lane. Pure rule, NO LLM, NO Date.now. New file
// src/wiki/wikiRealmOf.js (R005: WIKI_EXTERNAL_MARKERS, wikiRealmOf, computeRealmMap). WikiGraphView.jsx:
// overlay wiring only. App.jsx HDR bump only - no engine edit, no panel edit. buildKnowledgeGraph,
// getKnowledgeGraph, all six frozen symbols, api/mcf.js, api/claude.js, api/careers.js, engine-data/*
// byte-identical. R007/R006/R005 clean; no red/green; 44px targets; SVG aria-label; keyboard nodes.
// a11y-honesty + conformance gate PASS. G1 (v3.0.121 -> v3.0.122).
// v3.0.121 - 2026-06-22 - HDR #159 - PR4: Organisation lens for the Career WikiGraph. Replaces
// OrgLensPlaceholder with a real seven-step value-stream journey wired to REAL result fields:
// (1) Why this role exists - result.responsibilitiesData.responsibilities (MCF verbatim) +
// result.contextData.department (AI estimate; withheld when absent); (2) Value stream -
// result.jobAnatomy.duties with valueTagOf derivation rule (DERIVED tag: Activity=value-creating,
// Coordination=value-eroding, Accountability/Relational/Judgment=value-capturing; COMPUTED AI level);
// (3) Capability constraint - result.jobAnatomy.aiResilienceScore + layerMix + AI-exposed duty count
// (COMPUTED); (4) Dependencies - result.jobAnatomy.orgContext.stakeholders (MCF verbatim; withheld
// when absent); (5) Friction and edge of core - value-eroding duties + human-led duties (DERIVED
// rule from layer/exposureNow; withheld when no duties); (6) Future state - which duties AI absorbs
// vs stays human-led from exposureNow level (COMPUTED); (7) Back to the job ad - first MCF job ad
// verbatim link (MCF). New file: src/wiki/OrgJourney.jsx. WikiGraphView.jsx: import + wire.
// App.jsx line-1 HDR bump only; no panel edit, no engine edit. Frozen symbols, api/mcf.js,
// engine-data/* byte-identical. NOTE: the value-tag rule uses duty.layer as a deterministic PROXY
// (Activity=creating / Coordination=eroding / Accountability/Relational/Judgment=capturing) - a
// documented simplification of spec section 2.1's edge-degree/handoff-marker method, which needs the
// full wiki-graph payload not wired until PR2; still a pure function of the duty, never LLM. a11y +
// honesty gate PASS after adding per-card prov chips to the step 5/6 block cards + removing dead
// demandProofLocal. G1 (v3.0.120 -> v3.0.121).
// v3.0.120 - 2026-06-22 - HDR #158 - PR3: Candidate lens for the Career WikiGraph. Adds the lens
// toggle (Candidate view / Organisation view pills) above the radial graph; the Candidate Journey
// seven-step panel wired to REAL engine result fields: (1) Job Anatomy - result.jobAnatomy
// (aiResilienceScore, layerMix - COMPUTED); (2) Skill Analysis - result.skills[].level buckets
// (COMPUTED); (3) Demand Proof - demandProofLocal over result.responsibilitiesData.jobs (DERIVED;
// withheld under 4 postings per D4 floor); (4) Foundation - result.foundationData (~ AI estimate;
// withheld gracefully when absent); (5) The Edge - Human-Led skills derived deterministically from
// result.skills (DERIVED rule per spec ¬ß2.1); (6) Progression + Crossover - result.progressionData /
// result.crossoverData (~ AI estimate); (7) Next move - result.progressionData[dir=up][0] pick
// (COMPUTED pick, ~ wording). The Candidate Brief is a printable one-pager with the same fields +
// Print / save as PDF button + @media print CSS (only the brief prints). Organisation lens =
// placeholder card ("arriving next") for PR4. Every figure and every journey line carries a Prov
// chip. Absent fields withhold rather than invent (R-WIKI-TIER). New files: src/wiki/CandidateJourney.jsx,
// src/wiki/CandidateBrief.jsx. App.jsx: one-line change to pass result prop to WikiGraphView.
// WikiGraphView.jsx: lens toggle + imports. buildKnowledgeGraph, getKnowledgeGraph, all frozen
// symbols, api/mcf.js, engine-data/* byte-identical. G1 (v3.0.119 -> v3.0.120).
// v3.0.119 - 2026-06-22 - HDR #157 - WikiGraph is now a TAB, not a separate view (Human Lead: "i
// prefer the old layout with the navigation and the different AI impact and job graph etc."). The
// PR1 separate "wiki_view" dead-end is removed; the Career WikiGraph is a result-page tab "wikigraph"
// in buildTabs (label "Career WikiGraph"), placed in the "understand" pillar next to Role Graph, and
// rendered via <WikiGraphView embedded ...> (the embedded prop hides the in-view back button - the
// result page owns the nav). A wiki-mode search now lands on the FULL result page with the wikigraph
// tab active (setStep("results") + setActiveTab("wikigraph") when wikiDestRef), so every existing
// tab (Skill Analysis, Job Anatomy/AI impact, Role Graph, Demand Proof, ...) stays present. The
// graph payload is built lazily when the tab is open. buildKnowledgeGraph consumed read-only; all
// frozen symbols + api/mcf.js untouched. G1 (v3.0.118 -> v3.0.119).
import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Toaster, toast as sonnerToast } from "sonner";
import NumberFlow from "@number-flow/react";
import TelegramLoginWidget from "./TelegramLoginWidget.jsx";
import { loadState, saveState } from "./persist.js";
import { downloadJson, envelope, block, exportFilename, ORIGIN } from "./export-json.js";
import { KGGraph } from "./RoleGraph.jsx";
import WikiGraphView from "./wiki/WikiGraphView.jsx";
import ReviewStudio, { rsNormTitle, rsJaccard, rsTokens, rsEmpTypeBucket } from "./ReviewStudio.jsx";
import { useDeviceProfile } from "./responsive/deviceProfile.js";
import { exposureForIsco } from "../engine-data/engine-core.js";
import { classifySkillLevel, classifyResponsibilityLevel } from "../engine-data/skill-level.js";
import SSOC2024_ISCO from "../engine-data/ssoc2024-isco.js";

// Single source for the visible build tag shown in Step 2 / Step 3 footers.
// Bump alongside package.json - not read from it (build-time JSON import
// would pull in the whole file); keep the two in sync by hand each release.
const APP_VERSION = "3.1.0";

// ‚îÄ‚îÄ Step 2 (Posting Evidence Picker) - per-posting deterministic classification ‚îÄ‚îÄ
// Exposure band tokens (4-level automation model; blue/orange, no red/green meaning).
const STEP2_BANDS = {
  human:     { key: "human",     label: "Human-led",       dot: "#1d4ed8", bg: "#eaf0ff", ink: "#1d4ed8", border: "#c7d6ff" },
  assisted:  { key: "assisted",  label: "AI-assisted",     dot: "#0e7490", bg: "#e3f5fb", ink: "#0b5e74", border: "#bce6f0" },
  augmented: { key: "augmented", label: "AI-augmented",    dot: "#b45309", bg: "#fdf0dd", ink: "#92450a", border: "#f5d8a8" },
  auto:      { key: "auto",      label: "Full automation", dot: "#d97706", bg: "#fde6da", ink: "#9a3412", border: "#f6c6ac" },
};
const STEP2_BAND_ORDER = ["human", "assisted", "augmented", "auto"];

// SSOC 2024 report section 2.7 table: Broad Job Level per major group. This is a
// major-group ATTRIBUTE (section 2.14 - every occupation in the group shares it), not a
// per-occupation measurement, and it is deliberately absent for major groups 1 and X
// (section 2.8: management/policy function matters more than level for MG1; MG X is the
// residual "not elsewhere classified" group). Keyed by major-group code, verbatim from
// the report table - no invention.
const SSOC_BROAD_JOB_LEVEL = {
  "1": "Not applicable",
  "2": "4, possibly 3",
  "3": "3, possibly 4",
  "4": "2",
  "5": "2",
  "6": "2",
  "7": "2",
  "8": "2",
  "9": "1",
  "X": "Not applicable",
};

// E7: SSOC 2024 "Type of Change at Occupational Level" legend, verbatim from the source
// workbook's header row ("Z= No Change, C = Code Number Change, T = Title Change,
// D = Definition Content Change, N= New Code"). change_type values can combine letters
// (e.g. "T;D") - each letter is expanded and joined, never paraphrased beyond this legend.
const SSOC_CHANGE_TYPE_LEGEND = { Z: "No Change", C: "Code Number Change", T: "Title Change", D: "Definition Content Change", N: "New Code" };
function ssocChangeTypeLabel(changeType) {
  if (!changeType) return "";
  return String(changeType).split(";").map((code) => SSOC_CHANGE_TYPE_LEGEND[code.trim()] || code.trim()).filter(Boolean).join(" + ");
}

// FLOW-1a: same regex as api/ssoc.js's scoreSsocCandidate NEC de-emphasis (PR #269) -
// residual "not elsewhere classified / n.e.c." titles sink to the bottom of the
// *display* list only (presentation-order penalty; the endpoint's own order is
// preserved for all other rows - the client mints no score).
const SSOC_NEC_RX = /not elsewhere classified|\bn\.?e\.?c\.?\b/i;

// Builds the SSOC chip's tooltip: base is the sub-major group title (existing behaviour),
// plus (E7) a section 2.10/2.19-2.20 change-vs-2020 disclosure when the node carries one,
// plus (E5) a section 2.8/2.11 residual-group note when the posting lands in major group X.
function step2SsocChipTitle(c) {
  let title = c.sector || "";
  if (c.changeType) title += (title ? ". " : "") + "SSOC 2024 change vs 2020: " + ssocChangeTypeLabel(c.changeType) + " (SSOC 2024 sec. 2.10, 2.19-2.20).";
  if (c.departmentCode === "X") title += (title ? " " : "") + "Residual group - Workers Not Elsewhere Classified, deliberately without job-level association (SSOC 2024 sec. 2.8, 2.11).";
  return title;
}

// Deterministic AIOE exposure index (0-100) -> 4-level band.
function aioeToBand(index) {
  if (index == null) return null;
  if (index >= 75) return "auto";
  if (index >= 50) return "augmented";
  if (index >= 25) return "assisted";
  return "human";
}

function step2JobId(job, i) {
  return String(job.uuid || job.id || `${job.title || "job"}-${i}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function salaryMidOf(job) {
  const lo = job.salaryMin ?? job.minSalary ?? null;
  const hi = job.salaryMax ?? job.maxSalary ?? null;
  if (lo != null && hi != null) return Math.round((Number(lo) + Number(hi)) / 2);
  if (lo != null) return Number(lo);
  if (hi != null) return Number(hi);
  return null;
}

// classifyPostings: ONE batch SSOC classify for the whole result set, then a deterministic
// per-posting AIOE band via computeEngine. No LLM. Returns id -> {ssoc, sector, sectorCode,
// band, salaryMid, confidence}. Postings that don't resolve withhold the band (null).
async function classifyPostings(jobs) {
  const list = (Array.isArray(jobs) ? jobs : []).slice(0, 80);
  const out = {};
  list.forEach((j, i) => { out[step2JobId(j, i)] = { ssoc: null, sector: null, sectorCode: null, band: null, salaryMid: salaryMidOf(j), confidence: null }; });
  let classifications = [];
  try {
    const res = await fetch("/api/ssoc", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "classifyTitles", jobs: list.map((j, i) => ({
        id: step2JobId(j, i), title: j.title,
        skills: Array.isArray(j.skills) ? j.skills : [],
        categories: Array.isArray(j.categories) ? j.categories : [],
        description: j.description || j.responsibilitiesText || "",
      })) }),
    });
    const data = await res.json();
    classifications = Array.isArray(data.classifications) ? data.classifications : [];
  } catch (_) { /* best-effort; cards withhold the band */ }
  classifications.forEach((cl) => {
    if (!cl || !out[cl.id]) return;
    const node = cl.status === "classified" ? cl.node : null;
    const ssoc = node ? node.code : null;
    const h = cl.hierarchy || {};
    // The 3 real SSOC levels -> Group (major) / Field (sub-major) / Function (minor) in the
    // Step 2 facet UI (display labels only; internal keys stay department/sector/func - see
    // STEP2_FACETS comment). SSOC sub-major groups are occupation families, not industry
    // sectors, and major groups aren't organisational departments.
    const dept = h.major_group || null;
    const sect = h.sub_major_group || h.major_group || null;
    const fn = h.minor_group || h.sub_major_group || null;
    let band = null;
    // SSOC 2024 report section 2.10: five-digit codes are REUSED between the 2020 and 2024
    // editions for different occupations. api/ssoc.js classifies against 2024, so the 2024
    // code must be resolved via ssoc2024-isco.js (SSOC2024 -> ISCO-08), never via the 2020-only
    // ssoc-isco.js table baked into computeEngine (engine-core.js, frozen) - a 2024 code fed to
    // computeEngine({ssoc}) can silently resolve to the wrong occupation and thus the wrong band.
    if (ssoc) {
      try {
        const mappings = SSOC2024_ISCO[ssoc] || [];
        const pick = mappings.find((m) => !m.partial) || mappings[0] || null;
        if (pick && pick.isco) {
          const exp = exposureForIsco(pick.isco);
          if (exp) band = aioeToBand(exp.index);
        }
      } catch (_) {}
    }
    // E4/E5: major-group code drives Broad Job Level (section 2.7) and honest MG X
    // ("Workers Not Elsewhere Classified", section 2.8/2.11) handling. E7: change_type
    // (section 2.10/2.19-2.20) is carried verbatim from the classified node for the SSOC
    // chip's tooltip - it's a codes-reused-between-editions disclosure, not a paraphrase.
    const deptCode = dept ? dept.code : null;
    out[cl.id] = {
      ssoc,
      department: dept ? dept.title : (node ? "Uncategorised" : null),
      departmentCode: deptCode,
      jobLevel: deptCode ? (SSOC_BROAD_JOB_LEVEL[deptCode] || null) : null,
      changeType: node ? (node.change_type || "") : "",
      sector: sect ? sect.title : (node ? "Uncategorised" : null),
      func: fn ? fn.title : (node ? null : null),
      sectorCode: sect ? sect.code : (ssoc || ""),
      band,
      salaryMid: out[cl.id].salaryMid,
      confidence: cl.confidence || null,
    };
  });
  return out;
}

// LUX1: ambient Three.js backdrop - lazy chunk so three never loads in the main bundle.
const AmbientBackdrop = lazy(() => import("./AmbientBackdrop.jsx"));

const C = {
  bg:         "#e6ebf2",
  surface:    "#ffffff",
  border:     "#e3e9f1",
  accent:     "#1a56db",
  accentSoft: "#e8f0fe",
  eu:         "#003399",
  euStar:     "#ffcc00",
  muted:      "#5b6878",
  mutedLight: "#586474", // WCAG AA (11-07 '26): was #9aa5b4 (~2.7:1 on white); >=4.5:1 on white and C.bg
  text:       "#1a202c",
  textSub:    "#4a5568",
  green:      "#1e40af",
  greenBg:    "#ecfdf5",
  greenBdr:   "#c7d2fe",
  purple:     "#7c3aed",
  purpleBg:   "#f3e8ff",
  purpleBdr:  "#ddd6fe",
  teal:       "#0e7490",
  tealBg:     "#ecfeff",
  tealBdr:    "#a5f3fc",
  amber:      "#b45309",
  amberBg:    "#fffbeb",
  amberBdr:   "#fcd9a0",
};

// NEO (neo-skeuomorphic / soft-UI): monochrome extruded soft-shadow tokens.
// Skin only - text stays dark and semantic chips stay coloured, so the ¬ß7
// contrast / no-red-green / honesty contract is untouched. The dual shadow
// (cool dark bottom-right + light top-left) extrudes a surface from the
// matching neutral base C.bg; the inset variant sinks inputs/pressed states.
const NEO = {
  raise:   "6px 6px 14px rgba(174,189,212,0.55), -6px -6px 13px rgba(255,255,255,0.9)",
  raiseSm: "4px 4px 9px rgba(174,189,212,0.5), -4px -4px 9px rgba(255,255,255,0.9)",
  inset:   "inset 3px 3px 7px rgba(174,189,212,0.5), inset -3px -3px 7px rgba(255,255,255,0.85)",
};

// POP - shared typography + structure tokens for EVERY overlay surface (modal /
// drawer / dialog / toast / micro-tooltip), so headings, body copy and the close
// affordance read consistently and professionally instead of each popup inventing
// its own scale. Two tiers: modal (title/sub/body) for the larger surfaces, tip
// (tipTitle/tipBody) for the small glossary/tech popovers. Dark variants override
// only colour (for navy/ink surfaces). closeBtn carries the 44px a11y hit area.
// rem-based so it rides the text-size control like the rest of the app.
const POP = {
  title:    { margin: 0, fontSize: "0.9375rem", fontWeight: 800, lineHeight: 1.3, color: C.text },
  sub:      { margin: 0, fontSize: "0.75rem",   fontWeight: 600, lineHeight: 1.45, color: C.textSub },
  body:     { margin: 0, fontSize: "0.8125rem", fontWeight: 400, lineHeight: 1.6,  color: C.textSub },
  tipTitle: { display: "block", margin: "0 0 4px", fontSize: "0.75rem",   fontWeight: 700, lineHeight: 1.3,  color: C.text },
  tipBody:  { display: "block", margin: 0,         fontSize: "0.6875rem", fontWeight: 400, lineHeight: 1.55, color: C.textSub },
  closeBtn: { flexShrink: 0, minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", fontSize: "1.25rem", lineHeight: 1, cursor: "pointer", borderRadius: 8 },
};

// ---- GLOSSARY + Term tooltip -----------------------------------------------
// Plain-language definitions for jargon shown in results. Extend freely.
// R007: ASCII only, hyphens not em/en dashes.
const _GLOSSARY = {
  "AI-Exposure Index":
    "A 0-100 score showing how exposed this occupation is to AI tools, computed deterministically from the AIOE (AI Occupational Exposure) dataset (Felten et al. 2021) via the ESCO-to-ISCO-to-SOC crosswalk. Same evidence always gives the same number - no AI guess involved.",
  "AI-resilience score":
    "How well the role's duties are likely to resist AI displacement, scored 0-100. It is the inverse of each duty's AI-exposure band, weighted by how often that duty appears and discounted by the work-layer (Relational and Accountability duties score higher than Activity). Higher is more resilient.",
  "automatability":
    "The share of this role's duties that AI or automation could plausibly take over today, expressed as a 0-100 index. It reads the AI-exposure band of each duty forward - HIGH exposure duties contribute most to the index.",
  "z-range":
    "The spread of SOC occupation z-scores that sit behind the AI-Exposure Index. A narrow range means the occupation group is tightly clustered; a wide range means the index blends roles with very different exposure levels. Shown as a min-to-max interval, never a single invented point.",
  "skill-proximity":
    "What fraction of the ESCO essential skills for a candidate ISCO-08 occupation match the skills extracted from this role's posting. Computed as the ESCO skill-overlap ratio (0-100%). Makes up 45% of the trading-style ISCO ranking score.",
  "responsibility-overlap":
    "How many of this role's extracted responsibility statements are covered by skills from a candidate ISCO-08 occupation. Computed by matching ESCO skill names against each responsibility; expressed as a 0-100% share. Makes up 35% of the ranking score.",
  "confidence":
    "A self-rated certainty signal for the ISCO-08 reverse-map: the number of matched skills divided by 8, capped at 100%, and discounted if fewer than 5 essential skills matched. It is advisory - high confidence means more evidence, not a guarantee of fit. Makes up 20% of the ranking score.",
  "crossover":
    "A role in a different sector whose day-to-day responsibilities substantially overlap with your current one. In this app, crossover roles are identified by matching the actual duty statements - not just the job title - so the pivot is grounded in transferable work, not a guess.",
  "work-layer":
    "A classification of each duty by the type of work it represents: Activity (routine execution), Coordination, Accountability (owns outcomes and decisions), Relational (people and trust), or Judgment (non-routine analysis). The layer mix shows where most of a role's effort sits and predicts how much of it AI is likely to reach.",
  "exposure band":
    "A four-level label assigned to each skill or duty: Human-led (AI not involved), Low, Medium, or High AI involvement. Bands come from the AIOE and Eloundou et al. 2023 classification; they describe AI involvement today and a separate 2-year projection.",
  "AIOE":
    "AI Occupational Exposure index - a dataset by Felten, Raj and Seamans (2021) that scores each US SOC occupation by how exposed it is to AI capabilities. This app maps Singapore SSOC and ESCO occupations to SOC codes and reads off the AIOE percentile to form the AI-Exposure Index.",
  "ISCO-08":
    "International Standard Classification of Occupations (2008 revision), published by the ILO. A four-digit code groups similar jobs. This app uses ISCO-08 as the crosswalk backbone: ESCO skills map to ISCO-08 occupations, and ISCO-08 maps to US SOC codes for the AIOE lookup.",
  "ESCO":
    "European Skills, Competences, Qualifications and Occupations taxonomy (v1.2) - an open, machine-readable list of occupations and the essential skills each requires. Skills shown in this app are drawn directly from the ESCO API; each skill is a citable entry, not AI-invented.",
  "SSOC":
    "Singapore Standard Occupational Classification - Singapore's national coding system for jobs, maintained by MOM and singstat. MCF postings carry an SSOC tag; the app maps it to ISCO-08 as the first step in the exposure-index chain.",
  "MyCareersFuture":
    "Singapore's national job portal (jobs.gov.sg), operated by Workforce Singapore (WSG). The roles analysed in this app are live MCF postings; all job fields shown with the 'from MCF' badge are taken verbatim from those postings, not generated.",
};

// Term - wraps visible text with a glossary bubble (hover / focus / tap).
// Usage: <Term k="AI-Exposure Index">AI-Exposure Index</Term>
// The trigger is a real <button> so it is keyboard-focusable and tap-friendly.
// Bubble appears above the trigger when space allows, below otherwise.
// Esc closes; tap-outside closes. aria-describedby links the bubble text.
// No animation relied on for visibility (instant toggle); optional CSS fade is
// guarded by prefers-reduced-motion via a class set on <html> at the end.
let _termIdSeq = 0;
function Term({ k, children }) {
  const def = _GLOSSARY[k];
  if (!def) return <>{children}</>;
  const [open, setOpen] = useState(false);
  const idRef = useRef(null);
  if (!idRef.current) idRef.current = "term-" + (++_termIdSeq);
  const btnRef = useRef(null);
  const bubbleRef = useRef(null);
  // Separate hover state so hover and click/tap are independent.
  // open = click/tap toggle; hovered = mouse hover.
  const [hovered, setHovered] = useState(false);
  const visible = open || hovered;

  // Close on Esc
  function handleKeyDown(e) {
    if (e.key === "Escape" && visible) { e.stopPropagation(); setOpen(false); setHovered(false); }
    if ((e.key === "Enter" || e.key === " ") && e.target === btnRef.current) { e.preventDefault(); setOpen(o => !o); }
  }

  // Close toggle on blur (focus leaves the button)
  function handleBlur(e) {
    // relatedTarget is the element receiving focus; if it is inside the bubble, keep open
    if (bubbleRef.current && bubbleRef.current.contains(e.relatedTarget)) return;
    setOpen(false);
  }

  function handleMouseEnter() { setHovered(true); }
  function handleMouseLeave() { setHovered(false); }

  const wrapStyle = { position: "relative", display: "inline" };
  const btnStyle = {
    background: "none",
    border: "none",
    padding: "0 0 1px",
    margin: 0,
    font: "inherit",
    color: "inherit",
    cursor: "help",
    textDecoration: "underline dotted",
    textDecorationColor: C.mutedLight,
    textUnderlineOffset: "3px",
    lineHeight: "inherit",
    verticalAlign: "baseline",
    // Minimum 44px tap target via min-height on the inline container is impractical,
    // so we pad top/bottom and use a larger line-height to give adequate touch area.
    display: "inline",
  };
  const bubbleStyle = {
    position: "absolute",
    bottom: "calc(100% + 6px)",
    left: "50%",
    transform: "translateX(-50%)",
    width: 260,
    maxWidth: "min(260px, calc(100vw - 24px))",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "10px 12px",
    boxShadow: NEO.raiseSm,
    zIndex: 9999,
    pointerEvents: "auto",
  };
  return (
    <span style={wrapStyle}>
      <button
        ref={btnRef}
        type="button"
        style={btnStyle}
        aria-expanded={visible}
        aria-describedby={visible ? idRef.current : undefined}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}<sup style={{ fontSize: "0.65em", lineHeight: 1, marginLeft: 1, color: C.mutedLight, userSelect: "none" }}>i</sup>
      </button>
      {visible && (
        <span
          ref={bubbleRef}
          id={idRef.current}
          role="tooltip"
          style={bubbleStyle}
        >
          <span style={POP.tipTitle}>{k}</span>
          <span style={POP.tipBody}>{def}</span>
        </span>
      )}
    </span>
  );
}
// ---------------------------------------------------------------------------

// LLM-3 (live: doAnalyse's fan-out - core ratings + progression/crossover/context,
// plus rateSkills' own per-batch calls - can burst 15-20 concurrent /api/claude
// requests for one analysis). api/claude.js intentionally has no proxy-side rate
// limiting (v3-llm-proxy-guardrails-spec.md ¬ß6 - "not adopted here, broader
// refactor"), so the fix lives caller-side: cap how many requests this client has
// in flight at once. Excess calls queue FIFO and start as slots free up - callers
// see no API change, just a bounded wait before their fetch begins.
//
// Raised 4 -> 10 (09-07 '26): the cap of 4 was sized for Gemini's low free-tier
// RPM. We're Anthropic Sonnet-5 only now (v3.0.269) - live-verify showed each
// Sonnet-5 call taking ~5-10s (large-output prompt generation), so a cap of 4
// forced 4-5 sequential waves, adding 30-50s of pure queueing on top of the
// calls' own latency for a single analysis (Human Lead: "Step 2 and 3 stale,
// >15s"). A single well-provisioned Anthropic key handles far more parallelism
// than that; 10 lets nearly the whole fan-out run at once.
const CLAUDE_MAX_CONCURRENT = 10;
let _claudeInFlight = 0;
const _claudeQueue = [];
function _claudeAcquireSlot() {
  if (_claudeInFlight < CLAUDE_MAX_CONCURRENT) { _claudeInFlight++; return Promise.resolve(); }
  return new Promise((resolve) => { _claudeQueue.push(resolve); });
}
function _claudeReleaseSlot() {
  const next = _claudeQueue.shift();
  if (next) next(); else _claudeInFlight--;
}

export async function claudeCall(prompt, maxTokens, attempt = 1, systemPrompt = null, model = "claude-haiku-4-5-20251001") {
  await _claudeAcquireSlot();
  let _slotReleased = false;
  const _releaseSlot = () => { if (!_slotReleased) { _slotReleased = true; _claudeReleaseSlot(); } };
  try {
    const body = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    };
    if (systemPrompt) body.system = systemPrompt;

    // Per-call fetch timeout: heavy models (Opus/Sonnet) get a long window;
    // Opus reasons the most, so it gets the full headroom. Haiku scales by size.
    const fetchTimeout =
      model.includes("opus")   ? 180000 :
      model.includes("sonnet") ? 150000 :
      maxTokens > 2500         ? 90000  : 55000;
    const controller = new AbortController();
    const fetchTimer = setTimeout(() => controller.abort(), fetchTimeout);

    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(fetchTimer);
    if (!res.ok) {
      let msg = `API error ${res.status}`;
      try {
        const e = await res.json();
        msg = e?.message || e?.error?.message || e?.error || msg;
        if (e?.debug) msg = `${msg} [${e.debug}]`;
        if (e?.code)  msg = `${msg} (${e.code})`;
      } catch(_) {}
      const apiErr = new Error(msg);
      apiErr.status = res.status;
      throw apiErr;
    }
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    if (!text) throw new Error("Empty response");
    _releaseSlot();
    return text;
  } catch(err) {
    // Release before any retry/backoff so a slow-retrying call doesn't hold a
    // concurrency slot idle - the recursive claudeCall() below re-acquires its own.
    _releaseSlot();
    // Retry only transient failures. The proxy maps overload/5xx/auth to 503 and
    // network/timeout errors carry no status; a 4xx (e.g. 404 unknown model, 400
    // bad request) is deterministic, so retrying it just wastes time and floods
    // logs/alerts - fail fast instead.
    const retriable = err.status == null || err.status >= 500 || err.status === 429;
    if (attempt < 3 && retriable) {
      const delay = attempt === 1 ? 1500 : 3000;
      await new Promise(r => setTimeout(r, delay));
      return claudeCall(prompt, maxTokens, attempt + 1, systemPrompt, model);
    }
    const tier = model.includes("fable") ? "fable" : model.includes("opus") ? "opus" : model.includes("sonnet") ? "sonnet" : "haiku";
    track("api_error", { model: tier, maxTokens, attempt });
    _alertOutage(err, tier); // builder-side webhook ping (debounced, best-effort, never throws)
    throw err;
  }
}

// ALERT (v3.0.76): fire a debounced, best-effort beacon to /api/alert so the BUILDER is told
// when the AI service is unavailable (credit/capacity, overload, 5xx, timeout, auth). Only
// reached after claudeCall has exhausted its retries, so it signals a genuine, persistent
// outage - not a transient blip. Client-side 10-min debounce caps one ping per outage window
// even when many calls fail at once. No user/CV data is sent - error text + model tier + path
// only. /api/alert no-ops unless ALERT_WEBHOOK_URL is configured in the deploy env.
let _lastOutageAlert = 0;
function _alertOutage(err, tier) {
  try {
    const now = Date.now();
    if (now - _lastOutageAlert < 10 * 60 * 1000) return;
    _lastOutageAlert = now;
    const detail = String((err && err.message) || "").slice(0, 300);
    const payload = JSON.stringify({ tier: tier || "", detail, ts: new Date().toISOString(), path: (typeof location !== "undefined" ? location.pathname : "") });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/alert", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/alert", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch (_) { /* alerting must never affect the app */ }
}





function escapeJsonStringControlChars(jsonText) {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < jsonText.length; i++) {
    const c = jsonText[i];
    if (escape) {
      out += c;
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      out += c;
      escape = true;
      continue;
    }
    if (c === "\"") {
      inString = !inString;
      out += c;
      continue;
    }
    if (inString && c === "\n") { out += "\\n"; continue; }
    if (inString && c === "\r") { out += "\\r"; continue; }
    if (inString && c === "\t") { out += "\\t"; continue; }
    out += c;
  }
  return out;
}

function parseJSONLenient(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch (firstErr) {
    try {
      return JSON.parse(escapeJsonStringControlChars(jsonText));
    } catch (_) {
      throw firstErr;
    }
  }
}

export function extractJSON(raw, label) {
  let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const ai = s.indexOf("[");
  const oi = s.indexOf("{");
  const start = (ai < 0) ? oi : (oi < 0) ? ai : Math.min(ai, oi);
  if (start < 0) throw new Error(`No JSON found for ${label}`);
  const isArr = s[start] === "[";
  const OPEN = isArr ? "[" : "{";
  const CLOSE = isArr ? "]" : "}";
  let depth = 0, lastCompleteClose = -1;
  let inString = false, escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === "\\" && inString) { escape = true; continue; }
    if (c === "\"") { inString = !inString; continue; }
    if (inString) continue;
    if (c === OPEN) depth++;
    else if (c === CLOSE) {
      depth--;
      if (depth === 0) {
        try { return parseJSONLenient(s.slice(start, i + 1)); } catch(_) { lastCompleteClose = i; }
      }
      if (isArr && depth === 1) lastCompleteClose = i;
    }
  }
  // Truncation recovery: close array at last complete inner object
  if (isArr && lastCompleteClose > start) {
    const attempt1 = s.slice(start, lastCompleteClose + 1) + "]";
    try { const r = parseJSONLenient(attempt1); if (Array.isArray(r) && r.length > 0) return r; } catch(_) {}
  }
  const end = s.lastIndexOf(CLOSE);
  if (end > start) {
    try { return parseJSONLenient(s.slice(start, end + 1)); } catch(_) {}
  }
  throw new Error(`Could not parse JSON for ${label}`);
}

// v1.8.9: Hardcoded senior management lookup - deterministic, instant, no API call
// Covers the exact terms a C-suite or senior leader is likely to type
const SENIOR_MGMT_LOOKUP = {
  // Canonical keys (lowercased query ‚Üí results array)
  "chief executive officer":    [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Leads the overall strategic direction, operations, and performance of an organisation.", isAltLabel:false }],
  "ceo":                        [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Leads the overall strategic direction, operations, and performance of an organisation.", isAltLabel:false }],
  "deputy ceo":                 [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Closest ESCO match for Deputy CEO - leads overall strategy and performance.", isAltLabel:true }, { title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees major functions or divisions - typical scope of a Deputy CEO.", isAltLabel:true }, { title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs operations and strategy - equivalent scope in many organisations.", isAltLabel:true }],
  "deputy chief executive":     [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Closest ESCO match for Deputy Chief Executive - leads overall strategy.", isAltLabel:true }, { title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees major functions - typical scope of a Deputy Chief Executive.", isAltLabel:true }, { title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs operations and strategy - equivalent scope in many organisations.", isAltLabel:true }],
  "deputy chief executive officer": [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Closest ESCO match - leads overall strategy and organisational performance.", isAltLabel:true }, { title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees major functions or divisions - typical Deputy CEO scope.", isAltLabel:true }, { title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs operations and strategy - equivalent scope in many organisations.", isAltLabel:true }],
  "managing director":          [{ title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs the overall operations and strategy of an organisation or major business unit.", isAltLabel:false }, { title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Leads the overall strategic direction and performance of an organisation.", isAltLabel:false }],
  "md":                         [{ title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs the overall operations and strategy of an organisation or major business unit.", isAltLabel:false }],
  "assistant managing director":[{ title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs the overall operations and strategy of an organisation or major business unit.", isAltLabel:true }, { title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions or business units within a large organisation.", isAltLabel:false }],
  "vice president":             [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions or business units within a large organisation.", isAltLabel:false }, { title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Leads the overall strategic direction of an organisation.", isAltLabel:false }],
  "vp":                         [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions or business units within a large organisation.", isAltLabel:false }],
  "senior vice president":      [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions or business units within a large organisation.", isAltLabel:false }, { title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Leads the overall strategic direction of an organisation.", isAltLabel:false }],
  "svp":                        [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions or business units within a large organisation.", isAltLabel:false }],
  "executive director":         [{ title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs the overall operations and strategy of an organisation or major business unit.", isAltLabel:false }, { title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Leads overall organisational strategy and performance.", isAltLabel:false }],
  "director general":           [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Government and Public Administration", description:"Leads the overall strategy and operations of a government agency or statutory board.", isAltLabel:false }, { title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs the operations and strategy of an organisation.", isAltLabel:false }],
  "chief operating officer":    [{ title:"Chief Operating Officer", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees the day-to-day operational functions of an organisation.", isAltLabel:false }, { title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Manages multiple operational divisions within a large organisation.", isAltLabel:false }],
  "coo":                        [{ title:"Chief Operating Officer", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees the day-to-day operational functions of an organisation.", isAltLabel:false }],
  "chief financial officer":    [{ title:"Chief Financial Officer", iscoCode:"1211", iscoGroup:"Finance managers", industry:"Across Industries", description:"Directs the financial strategy, planning, and reporting of an organisation.", isAltLabel:false }, { title:"Finance Director", iscoCode:"1211", iscoGroup:"Finance managers", industry:"Across Industries", description:"Leads financial management and controls across an organisation.", isAltLabel:false }],
  "cfo":                        [{ title:"Chief Financial Officer", iscoCode:"1211", iscoGroup:"Finance managers", industry:"Across Industries", description:"Directs the financial strategy, planning, and reporting of an organisation.", isAltLabel:false }],
  "chief human resources officer":[{ title:"Human Resources Manager", iscoCode:"1212", iscoGroup:"Human resource managers", industry:"Across Industries", description:"Leads human resource strategy, talent management, and workforce planning.", isAltLabel:false }, { title:"Chief Human Resources Officer", iscoCode:"1212", iscoGroup:"Human resource managers", industry:"Across Industries", description:"Directs HR strategy and people operations across an organisation.", isAltLabel:false }],
  "chro":                       [{ title:"Human Resources Manager", iscoCode:"1212", iscoGroup:"Human resource managers", industry:"Across Industries", description:"Leads human resource strategy and workforce planning.", isAltLabel:false }],
  "chief technology officer":   [{ title:"Chief Technology Officer", iscoCode:"1330", iscoGroup:"Research and development managers", industry:"Technology", description:"Leads the technology vision, innovation strategy, and digital capabilities of an organisation.", isAltLabel:false }, { title:"ICT Director", iscoCode:"1330", iscoGroup:"Information and communications technology directors", industry:"Across Industries", description:"Directs the information and communications technology strategy and infrastructure.", isAltLabel:false }],
  "cto":                        [{ title:"Chief Technology Officer", iscoCode:"1330", iscoGroup:"Research and development managers", industry:"Technology", description:"Leads the technology vision, innovation strategy, and digital capabilities of an organisation.", isAltLabel:false }],
  "chief information officer":  [{ title:"Chief Information Officer", iscoCode:"1330", iscoGroup:"Information and communications technology directors", industry:"Across Industries", description:"Leads the information systems and digital strategy of an organisation.", isAltLabel:false }],
  "cio":                        [{ title:"Chief Information Officer", iscoCode:"1330", iscoGroup:"Information and communications technology directors", industry:"Across Industries", description:"Leads the information systems and digital strategy of an organisation.", isAltLabel:false }],
  "general manager":            [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions or business units within a large organisation.", isAltLabel:false }, { title:"Hotel Manager", iscoCode:"1411", iscoGroup:"Hotel and accommodation managers", industry:"Hospitality and Tourism", description:"Manages the day-to-day operations of a hotel or accommodation property.", isAltLabel:false }, { title:"Retail and Wholesale Trade Manager", iscoCode:"1420", iscoGroup:"Retail and wholesale trade managers", industry:"Retail and Commerce", description:"Manages retail or wholesale operations including staff, inventory, and customer experience.", isAltLabel:false }],
  "gm":                         [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions or business units within a large organisation.", isAltLabel:false }],
  "assistant director":         [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions - closest ESCO match for Assistant Director.", isAltLabel:true }, { title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs operations and strategy of an organisation.", isAltLabel:true }],
  // Associate / Deputy variants for common C-suite and director titles
  "associate director":         [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions - closest ESCO match for Associate Director.", isAltLabel:true }, { title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs operations and strategy.", isAltLabel:true }],
  "deputy director":            [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees multiple functions - closest ESCO match for Deputy Director.", isAltLabel:true }, { title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs operations and strategy.", isAltLabel:true }],
  "deputy managing director":   [{ title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Closest ESCO match - directs operations and strategy of an organisation.", isAltLabel:true }, { title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees major business units and functions.", isAltLabel:true }],
  "deputy general manager":     [{ title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Closest ESCO match for Deputy General Manager.", isAltLabel:true }, { title:"Managing Director", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Directs operations and strategy.", isAltLabel:true }],
  "associate ceo":              [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Closest ESCO match for Associate CEO.", isAltLabel:true }, { title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Oversees major functions - typical Associate CEO scope.", isAltLabel:true }],
  "co-ceo":                     [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Closest ESCO match for Co-CEO.", isAltLabel:true }, { title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Co-leads major divisions.", isAltLabel:true }],
  "joint ceo":                  [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Closest ESCO match for Joint CEO.", isAltLabel:true }],
  "acting ceo":                 [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Temporarily leads the overall strategy and performance of an organisation.", isAltLabel:true }],
  "interim ceo":                [{ title:"Chief Executive Officer", iscoCode:"1112", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Interim leader of overall strategy and organisational performance.", isAltLabel:true }],
  "deputy cfo":                 [{ title:"Chief Financial Officer", iscoCode:"1211", iscoGroup:"Finance managers", industry:"Across Industries", description:"Closest ESCO match - assists in directing financial strategy and planning.", isAltLabel:true }, { title:"Finance Director", iscoCode:"1211", iscoGroup:"Finance managers", industry:"Across Industries", description:"Leads financial management and reporting.", isAltLabel:true }],
  "deputy coo":                 [{ title:"Chief Operating Officer", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Closest ESCO match - assists in overseeing daily operational functions.", isAltLabel:true }, { title:"Corporate General Manager", iscoCode:"1120", iscoGroup:"Managing directors and chief executives", industry:"Across Industries", description:"Manages major operational divisions.", isAltLabel:true }],

  // Organisational Development - ESCO 2421 Management and Organisation Analysts
  // No canonical OD Specialist occupation in ESCO - closest match is business consultant (2421)
  "organisational development specialist": [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Assists organisations to achieve greater efficiency and solve organisational problems. Closest ESCO match for Organisational Development Specialist.", isAltLabel:true }, { title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans and implements programmes to develop staff competencies. Relevant for OD roles with a learning and development focus.", isAltLabel:true }],
  "organizational development specialist": [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Assists organisations to achieve greater efficiency and solve organisational problems. Closest ESCO match for Organizational Development Specialist.", isAltLabel:true }, { title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans and implements staff development programmes.", isAltLabel:true }],
  "od specialist":                          [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Assists organisations to achieve greater efficiency and solve organisational problems. Closest ESCO match for OD Specialist.", isAltLabel:true }, { title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans and implements staff development programmes. Relevant for OD roles with a learning focus.", isAltLabel:true }],
  "organisational development manager":     [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Closest ESCO match - analyses and develops solutions to organisational problems.", isAltLabel:true }, { title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans and evaluates staff development programmes.", isAltLabel:true }],
  "organizational development manager":     [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Closest ESCO match - analyses and develops solutions to organisational problems.", isAltLabel:true }, { title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans and evaluates staff development programmes.", isAltLabel:true }],
  "od manager":                             [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Closest ESCO match - analyses and develops solutions to organisational problems.", isAltLabel:true }, { title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans and evaluates staff development programmes.", isAltLabel:true }],
  "organisational development consultant":  [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Assists organisations to achieve greater efficiency and solve organisational problems.", isAltLabel:true }],
  "organizational development consultant":  [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Assists organisations to achieve greater efficiency and solve organisational problems.", isAltLabel:true }],
  "od consultant":                          [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Assists organisations to achieve greater efficiency and solve organisational problems.", isAltLabel:true }],
  "organisational development":             [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Assists organisations to achieve greater efficiency and solve organisational problems.", isAltLabel:true }, { title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans and implements staff development programmes.", isAltLabel:true }],
  "organizational development":             [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Assists organisations to achieve greater efficiency and solve organisational problems.", isAltLabel:true }, { title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans and implements staff development programmes.", isAltLabel:true }],

  // Change Management - ESCO 2421 Management and Organisation Analysts
  "change management specialist":           [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Closest ESCO match - analyses organisational structures and develops solutions to achieve change.", isAltLabel:true }],
  "change management manager":              [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Closest ESCO match - directs clients towards more efficient organisation and develops change solutions.", isAltLabel:true }],
  "change manager":                         [{ title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Closest ESCO match - analyses and implements organisational change programmes.", isAltLabel:true }],

  // Learning and Organisational Development - ESCO 2424 Training and Staff Development Professionals
  "learning and organisational development manager":   [{ title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans, develops and evaluates training and development programmes to build organisational capability.", isAltLabel:true }, { title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Analyses organisational structures and develops solutions. Relevant for the OD dimension of the role.", isAltLabel:true }],
  "learning and od manager":                           [{ title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans, develops and evaluates training and development programmes to build organisational capability.", isAltLabel:true }, { title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Analyses organisational structures and develops solutions.", isAltLabel:true }],
  "l&od manager":                                      [{ title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Plans, develops and evaluates training and development programmes.", isAltLabel:true }, { title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Analyses organisational structures and develops change solutions.", isAltLabel:true }],
  "learning and organisational development director":  [{ title:"Corporate Trainer", iscoCode:"2424", iscoGroup:"Training and staff development professionals", industry:"Across Industries", description:"Leads the design and evaluation of staff development and capability building programmes.", isAltLabel:true }, { title:"Business Consultant", iscoCode:"2421", iscoGroup:"Management and organisation analysts", industry:"Across Industries", description:"Directs organisational improvement and change programmes.", isAltLabel:true }],
};

// Bare function/discipline names that are not job titles
// When searched exactly, the picker shows a refine notice
const FUNCTION_KEYWORDS = [
  "organisational development", "organizational development", "organisation development",
  "human resources", "human resource", "learning and development", "learning & development",
  "talent management", "talent development", "change management",
  "transformation",
  "finance", "marketing", "operations", "strategy", "procurement",
  "information technology", "information systems", "data analytics", "data science",
  "supply chain", "logistics", "legal", "compliance", "risk management",
  "customer service", "customer success", "sales", "business development",
  "project management", "product management", "quality assurance",
];

// Suggested specific titles per function keyword
const FUNCTION_SUGGESTIONS = {
  "organisational development": "Organisational Development Specialist, OD Manager, Change Manager",
  "organizational development": "Organizational Development Specialist, OD Manager, Change Manager",
  "organisation development": "Organisational Development Specialist, OD Manager, Change Manager",
  "human resources": "HR Manager, HR Business Partner, HR Specialist, Talent Acquisition Specialist",
  "human resource": "HR Manager, HR Business Partner, HR Specialist",
  "learning and development": "Learning and Development Manager, L&D Specialist, Training Manager",
  "learning & development": "Learning and Development Manager, L&D Specialist",
  "talent management": "Talent Management Specialist, Talent Manager, HR Business Partner",
  "change management": "Change Management Specialist, Change Manager, Organisational Development Consultant",
  "transformation": "Transformation Manager, Digital Transformation Manager, Transformation Consultant, Transformation Office Lead",
  "finance": "Finance Manager, Financial Analyst, Financial Controller, CFO",
  "marketing": "Marketing Manager, Brand Manager, Digital Marketing Specialist",
  "operations": "Operations Manager, Operations Director, Chief Operating Officer",
  "strategy": "Strategy Manager, Strategy Consultant, Corporate Strategist",
  "data analytics": "Data Analyst, Data Scientist, Analytics Manager",
  "data science": "Data Scientist, Machine Learning Engineer, Data Analyst",
  "project management": "Project Manager, Programme Manager, PMO Manager",
  "product management": "Product Manager, Senior Product Manager, Head of Product",
};

function detectFunctionKeyword(query) {
  const key = query.trim().toLowerCase();
  // Only flag if the query IS the function keyword - not if it is part of a longer title
  const match = FUNCTION_KEYWORDS.find(k => key === k);
  if (!match) return null;
  return {
    keyword: match,
    suggestions: FUNCTION_SUGGESTIONS[match] || null,
  };
}
// Used after ESCO resolves to detect wrong occupation matches
const ISCO_COHERENCE_MAP = [
  { patterns: ["organisational development","organizational development","organisation development","od specialist","od manager","od consultant","change management","change manager","learning and od","l&od"], expected: ["24"], label: "Business and Administration Professionals" },
  { patterns: ["human resource","hr manager","hr director","hr specialist","hr consultant","people manager","people director"], expected: ["12","24"], label: "HR or Management" },
  { patterns: ["software engineer","software developer","web developer","frontend","backend","fullstack","devops","data engineer"], expected: ["25"], label: "ICT Professionals" },
  { patterns: ["nurse","nursing","midwife","paramedic","physiotherapist","occupational therapist"], expected: ["22"], label: "Health Professionals" },
  { patterns: ["teacher","lecturer","professor","trainer","instructor","tutor"], expected: ["23","24"], label: "Teaching or Training Professionals" },
  { patterns: ["accountant","auditor","financial analyst","finance manager","cfo","controller"], expected: ["12","24"], label: "Finance Professionals" },
  { patterns: ["marketing manager","brand manager","marketing director","marketing specialist","digital marketing"], expected: ["12","24"], label: "Business Professionals" },
];

function checkIscoCoherence(searchedTitle, resolvedIscoCode) {
  if (!resolvedIscoCode) return null;
  const key = searchedTitle.trim().toLowerCase();
  for (const rule of ISCO_COHERENCE_MAP) {
    const matched = rule.patterns.some(p => key.includes(p));
    if (!matched) continue;
    const prefix = String(resolvedIscoCode).slice(0, 2);
    const ok = rule.expected.some(e => prefix.startsWith(e));
    if (!ok) return { suspect: true, expected: rule.label, got: resolvedIscoCode };
    return { suspect: false };
  }
  return null; // title not in any rule - no opinion
}

function lookupSeniorMgmt(query) {
  const key = query.trim().toLowerCase();
  // Exact match first
  if (SENIOR_MGMT_LOOKUP[key]) {
    const result = SENIOR_MGMT_LOOKUP[key];
    return { results: result, isAlt: result.some(r => r.isAltLabel) };
  }
  // Fuzzy substring match - catches spelling variants and partial titles
  // e.g. "Organisation Development" (missing "al"), "OD Specialist", "L&OD Manager"
  for (const [lookupKey, result] of Object.entries(SENIOR_MGMT_LOOKUP)) {
    // Match if the query contains the lookup key OR the lookup key contains the query (min 8 chars)
    if (key.length >= 8 && (key.includes(lookupKey) || lookupKey.includes(key))) {
      return { results: result, isAlt: result.some(r => r.isAltLabel) };
    }
  }
  return null;
}

async function searchOccupations(keyword, count = "15 to 20") {
  const SYSTEM_SEARCH =
`You are an occupational classification expert specialising in the ESCO v1.2 taxonomy and ISCO-08 coding. Your role is to help workforce practitioners, HR professionals, and individuals identify the right occupation accurately. Apply Singapore and ASEAN labour market context where it differs from US or EU norms.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"title":"Occupation Title","iscoCode":"1234","iscoGroup":"ISCO group name","industry":"Industry sector","description":"One sentence description","isAltLabel":false}]
Field rules:
- title: exact ESCO v1.2 occupation title - never invented
- iscoCode: 4-digit ISCO-08 code
- iscoGroup: plain English ISCO group name a non-expert would understand
- industry: plain English sector - e.g. Healthcare, Food and Beverage Manufacturing, Finance and Banking, Technology, Education, Retail and Commerce, Manufacturing, Logistics and Supply Chain, Legal and Compliance
- description: one clear sentence, no jargon, no acronyms
- isAltLabel: true only when the match is an alternate label, not the canonical ESCO title
PRECISION RULE: When the search term is a specific professional title (e.g. Food Technologist, Civil Engineer, Financial Analyst), the first result MUST be the closest professional match - not a related trade or hands-on role. Food Technologist is a science/manufacturing professional role - not a cook, chef, or food handler. Civil Engineer is a professional - not a construction worker. Never substitute a trade role for a professional title.
SECTOR SPREAD: For generic searches (e.g. Admin, Manager, Officer), spread across sectors. For specific professional titles, prioritise precision over diversity - return the correct professional role first, then related specialist roles.
HIERARCHICAL PREFIX RULE: When the search term begins with a hierarchical modifier such as Deputy, Vice, Assistant, Acting, Co-, Associate, or Joint, apply this rule:
1. Strip the prefix and search for the base title
2. Return a FIRST result that is the user's EXACT search term (e.g. "Deputy CEO") as the primary result, with isAltLabel true, using the base role's ISCO code and group, with a description explaining it maps to the ESCO equivalent
3. Then return the canonical ESCO base title matches as subsequent results
4. This way the user sees their own title in the picker first, then the ESCO equivalents below
Examples: "Deputy CEO" -> first result title="Deputy CEO" (isAltLabel:true), then "Chief Executive Officer"; "Vice President Finance" -> first result title="Vice President Finance" (isAltLabel:true), then "Finance Director"; "Assistant Manager" -> first result title="Assistant Manager" (isAltLabel:true), then "Manager" variants.
CRITICAL: Never return zero results for any prefix query. Always show the user their own title as the first result.

PRECISION RULE applies first. Then:

CROSS-INDUSTRY ROLE RULE: Two categories of roles exist in EVERY industry and must NEVER be assigned a single sector. This is an absolute rule with no exceptions.

CATEGORY A - Role-type descriptors (these words in any title trigger cross-industry treatment):
Apprentice, Trainee, Intern, Internship, Graduate, Student, Volunteer, Junior [any], Trainer, Coach, Facilitator, Consultant, Analyst, Coordinator, Officer, Specialist, Assistant, Administrator.

CATEGORY B - Common administrative and support titles that are genuinely cross-sector by nature. These specific titles must return sector-specific variants, NOT a single canonical entry:
Office Manager, Administrative Officer, Administrative Assistant, Secretary, Receptionist, Office Clerk, Office Administrator, Personal Assistant, Executive Assistant, General Manager, Operations Manager, HR Manager, HR Officer, Finance Officer, Accounts Clerk, Bookkeeper, Data Entry Clerk, Customer Service Representative, Project Manager, Project Coordinator, IT Officer, Communications Officer, Marketing Officer, Sales Officer.

MANDATORY behaviour for ALL terms in both categories: every result must have a DISTINCT industry value. If two or more results share the same industry, that is always wrong.

UNIVERSAL TITLE RULE: A subset of canonical titles are truly sector-agnostic - the role is identical regardless of who employs it. These must be returned ONCE with industry="Across Industries", not duplicated under multiple sectors. The sector-specific specialist variant should be returned as a separate result.
Universal titles: Administrative Assistant, Office Manager, Secretary, Receptionist, Office Clerk, Data Entry Clerk, Bookkeeper, Personal Assistant, Executive Assistant, Office Administrator, Payroll Officer, Filing Clerk, Records Officer, Correspondence Clerk.
Bad example: returning "Administrative Assistant" three times under Education, Legal, and Healthcare - it is a universal role, return it once as Across Industries then return specialist variants (Medical Secretary, Legal Secretary, School Administrator) separately.
Bad example: returning "Office Manager" four times under different sectors - return it once as Across Industries then return sector-specific management roles separately.
Good example: for "Admin" - return "Administrative Assistant" (Across Industries) once, then "Medical Secretary" (Healthcare), "Legal Secretary" (Legal), "School Administrator" (Education), "Office Supervisor" (General Business Services) as separate specialist results.

Specific named examples:
- "Office Manager" must NOT default to Finance and Banking - return Office Manager across Healthcare, Technology, Legal, Education, Hospitality, Manufacturing, each with its actual sector
- "Administrative Assistant" must NOT default to Legal - return across Government, Healthcare, Finance, Technology, Retail, Construction
- "Secretary" - return Medical Secretary (Healthcare), Legal Secretary (Legal), Executive Secretary (Corporate), School Secretary (Education)
- "Receptionist" - return Hotel Receptionist (Hospitality), Medical Receptionist (Healthcare), Corporate Receptionist (Business Services)
- "Intern" must NOT default to Government - return across Healthcare, Finance, Technology, Marketing, Engineering, Legal
- "Trainer" must NOT default to Education - return Corporate Trainer (L&D), Safety Trainer (Manufacturing), Fitness Trainer (Sport), IT Trainer (Technology)
- "Apprentice" must NOT default to Education - return sector-specific variants with the actual employing sector

Bad example: "Office Manager" with industry "Finance and Banking" as primary result - Office Managers work in every sector
Bad example: "Administrative Assistant" with industry "Legal and Compliance" only
Bad example: "Secretary" with industry "General Business Services" only
Bad example: returning "Cook" or "Chef" for "Food Technologist" - wrong role category
Bad example: returning "Construction Worker" for "Civil Engineer" - confuses trade with profession
Bad example: multiple results sharing the same industry for any cross-industry term
Good example: for "Office Manager" return Office Manager - Healthcare, Office Manager - Technology, Office Manager - Legal, Office Manager - Education, each with its real sector assigned
Good example: for "Secretary" return Medical Secretary (Healthcare), Legal Secretary (Legal), Executive Secretary (Corporate), School Secretary (Education)
Good example: for "Admin" return healthcare admin, school admin, government admin, legal admin, construction admin - every result a different sector
Good example: for "Intern" return Marketing Intern (Marketing), Finance Intern (Finance), Engineering Intern (Engineering), Healthcare Intern (Healthcare)
Good example: for "Trainer" return Corporate Trainer (L&D), Safety Trainer (Manufacturing), Fitness Trainer (Sport and Wellness), IT Trainer (Technology)`;

  const raw = await claudeCall(
`Search term: ${keyword}
Return ${count} ESCO v1.2 occupations matching this term, ordered by relevance.
- CRITICAL: Every title in the array must be unique. Never return the same title twice. Return fewer results rather than repeating any title.
- The first result must be the closest semantic match to the exact search term - not a related but different role
- If the search term is a professional or technical title, return professional/technical roles - not trades or hands-on roles
- Spread across sectors only for generic terms; for specific titles prioritise precision
- If the search term is a cross-industry role (Apprentice, Trainee, Intern, Student, Graduate, Volunteer, Trainer, Coach, Coordinator, Office Manager, Administrative Assistant, Secretary, Receptionist, Office Clerk, Administrative Officer, or any generic administrative/support title), every result MUST have a different industry value - filing all results under one sector is always wrong for these terms
- No invented occupations - only real ESCO v1.2 titles`, parseInt(count) > 30 ? 4400 : 2200, 1, SYSTEM_SEARCH);
  // Token note: budget raised from 3850 to 4400 for count>30 path.
  // Token audit showed count=50 needed ~3560 tokens leaving only ~290 headroom at 3850.
  // 4400 gives ~840 headroom at count=50 and handles verbose description fields safely.
  const arr = extractJSON(raw, "search");
  if (!Array.isArray(arr)) throw new Error("search: expected array");
  const mapped = arr.map(x => ({
    title:      (x.title || "").trim(),
    iscoCode:   x.iscoCode || "",
    iscoGroup:  x.iscoGroup || "",
    industry:   x.industry || x.iscoGroup || "Across industries",
    description:x.description || "",
    isAltLabel: x.isAltLabel || false,
  })).filter(x => x.title);
  // Deduplicate by title at source - model sometimes returns same title multiple times
  const seen = new Set();
  return mapped.filter(o => {
    const k = o.title.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}


async function getEscoSkills(title, skillPhrases) {
  // v2: fetch canonical ESCO essential skills via api/esco proxy
  // Falls back to getSkills() if ESCO returns zero skills.
  // skillPhrases (optional, from the live posting) let the API disambiguate the
  // occupation by overlap, so a generic title does not collapse onto an IT-family
  // ESCO occupation and inherit its ICT-coded skill list.
  try {
    const res = await fetch('/api/esco', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'skills', title, skillPhrases: (skillPhrases || []).slice(0, 30) })
    });
    if (!res.ok) throw new Error(`api/esco HTTP ${res.status}`);
    const data = await res.json();
    if (data.skills && data.skills.length > 0) {
      // Map ESCO shape to internal skill shape - n assigned by index
      // ESCO skillType: skill/competence -> technical, knowledge -> soft-skill
      const skills = data.skills.map((s, i) => ({
        n:        i + 1,
        skill:    toTitleCase(s.skill || ''),
        type:     s.skillType && s.skillType.includes('knowledge') ? 'soft-skill' : 'technical',
        escoUri:  s.escoUri || '',
        escoDescription: s.escoDescription || '',
        reuseLevel:      s.reuseLevel || '',
        narrowerSkills:  s.narrowerSkills || [],
        broaderConcept:  s.broaderConcept || '',
        altLabels:       s.altLabels || [],
        isExtended: s.isExtended || false,
      })).filter(x => x.skill);
      return { skills, occupationUri: data.occupationUri || '', escoOccupation: data.escoOccupation || null };
    }
    // Zero skills returned - fall through to Claude path
    return null;
  } catch (err) {
    console.warn('getEscoSkills failed, falling back to getSkills:', err.message);
    track("esco_fallback", { title, reason: err.message.slice(0, 60) });
    return null;
  }
}

async function getSkills(title, group, iscoCode) {
  // 4A: ISCO-based skill target
  const firstDigit = parseInt((iscoCode || "0")[0], 10);
  let skillTarget = 25;
  if (firstDigit >= 4 && firstDigit <= 5) skillTarget = 18;
  if (firstDigit >= 6 && firstDigit <= 9) skillTarget = 14;

  const SYSTEM_SKILLS =
`You are a senior ESCO v1.2 skills taxonomy specialist. Your expertise is identifying the essential skills - technical and human - that define an occupation. You apply Singapore and ASEAN workforce context where relevant.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"n":1,"skill":"Skill name under 7 words","type":"technical"}]
Field rules:
- n: sequential integer starting at 1
- skill: concise, specific to this occupation - not generic filler
- type: exactly "technical" or "soft-skill"
Thinking approach: Before listing skills, ask three questions for each candidate skill - (1) What specific task or decision does a practitioner in this role perform that requires this skill? (2) Could an AI tool be given a clear enough brief to perform this task? (3) Would a recruiter testing this person in an interview assess this specific capability? A skill name must be specific enough that a sophisticated AI prompt could be written around it. If a skill name is too broad to anchor a real prompt, it is too generic.
Quality rules:
- Include at least 4 skills that require human presence, judgment, or empathy
- Skill names must be specific enough to support a sophisticated AI prompt or a meaningful human development action. "Communication Skills" fails this test. "Client Objection Handling in Complex Sales" passes it.
- For technical skills: name the actual task or output, not the tool. "Excel" is not a skill. "Sales Pipeline Data Reconciliation" is.
- No duplicate skills or near-duplicates
- Only genuine ESCO v1.2 essential skills - never invent or pad
Bad example: "Communication Skills" for a Supply Chain Analyst - too generic, no prompt can be written around it
Bad example: "Microsoft Excel" for a Financial Analyst - names the tool, not the skill
Bad example: "Teamwork" for any role - not a discrete assessable capability
Good example: "Supplier Lead Time Variance Analysis" for a Supply Chain Analyst - specific, AI-promptable, interview-testable
Good example: "Financial Variance Reporting" for a Financial Analyst - names the task, not the tool
Good example: "Intraoperative Clinical Decision-Making" for a Surgeon - specific and genuinely human-led`;

  const raw = await claudeCall(
`Occupation: ${title}
ISCO group: ${group}
Return exactly ${skillTarget} essential ESCO v1.2 skills for this role. Cover both technical and soft-skill types. Ensure the list reflects what a practitioner in Singapore or ASEAN actually does in this role.`, 1320, 1, SYSTEM_SKILLS);
  const arr = extractJSON(raw, "skills");
  if (!Array.isArray(arr)) throw new Error("skills: expected array");
  return arr.map(x => ({
    n:    x.n || 0,
    skill:toTitleCase(x.skill || ""),
    type: x.type || "technical",
  })).filter(x => x.skill);
}

// v3.2: derive a skill list anchored to ONE live MyCareersFuture posting -
// seeded from the skills the employer listed plus the responsibilities text,
// then expanded to a full essential-skills list. Same {n, skill, type} shape
// as getSkills. Falls back to getSkills(title) on failure.
async function getSkillsFromPosting(title, postingSkills, postingText) {
  const SYSTEM_PS =
`You are a senior ESCO v1.2 skills taxonomy specialist. You are given ONE real job posting (a job title, the skills the employer listed, and the responsibilities text). Produce the essential skills - technical and human - this specific posting actually demands. You apply Singapore and ASEAN workforce context.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"n":1,"skill":"Skill name under 7 words","type":"technical"}]
Field rules:
- n: sequential integer starting at 1
- skill: concise, specific to what THIS posting describes - not generic filler. Name the task or output, not a tool ("Excel" is not a skill; "Financial Variance Reporting" is).
- type: exactly "technical" or "soft-skill"
Method: start from the skills the employer listed and the duties in the responsibilities text; normalise and de-duplicate them into proper ESCO-style skill names; then fill out any obvious essential skills the posting implies but did not spell out. Stay grounded in the posting - do not pad with skills it does not support.
Quality rules:
- Return 18 to 25 skills covering both technical and soft-skill types
- Include at least 4 skills that require human presence, judgment, or empathy
- No duplicate or near-duplicate skills
Bad example: "Communication Skills" - too generic
Good example: "Stakeholder Requirements Workshops" - specific, AI-promptable, interview-testable`;
  const seeds = (postingSkills || []).filter(Boolean).slice(0, 15).join(" | ") || "(none listed)";
  const text = String(postingText || "").slice(0, 4000) || "(no responsibilities text available)";
  try {
    const raw = await claudeCall(
`Job title (as posted): ${title}
Skills the employer listed: ${seeds}

Responsibilities text from the posting:
${text}

Return the essential skills this posting demands, grounded in the above.`, 1320, 1, SYSTEM_PS);
    const arr = extractJSON(raw, "posting-skills");
    if (!Array.isArray(arr) || arr.length === 0) throw new Error("posting-skills: empty");
    return arr.map((x, i) => ({ n: x.n || i + 1, skill: toTitleCase(x.skill || ""), type: x.type === "soft-skill" ? "soft-skill" : "technical" })).filter(x => x.skill);
  } catch (e) {
    return getSkills(title, "", "");
  }
}

// ===========================================================================
// Role-Mix decomposition - read the messy real job ad, not the cookie-cutter
// occupation. Decompose a live posting into the ESCO occupations it actually
// blends. Numbers are deterministic (ESCO essential-skill overlap + arithmetic);
// only the headline/notes/skilling prose is LLM. Result cached per posting.
// ===========================================================================

const ROLE_MIX_VERSION = "rm1"; // bump when the fingerprint inputs or the narrative prompt change
const _roleMixCache = new Map(); // `${uuid}|${ROLE_MIX_VERSION}` -> roleMix object

const ROLE_MIX_COHERENCE = {
  coherent: { label:"Coherent hybrid", color:"#1e40af", bg:"#eef2ff", border:"#c7d2fe" },
  mixed:    { label:"Mixed bundle",    color:"#b45309", bg:"#fffbeb", border:"#fcd9a0" },
  grabbag:  { label:"Grab-bag",        color:"#d97706", bg:"#fff7ed", border:"#fed7aa" },
};

async function getRoleMixCandidates(title, skills, extraPhrases) {
  const skillPhrases = Array.from(new Set([
    ...((extraPhrases || []).map(s => String(s || "").trim()).filter(Boolean)),
    ...((skills || []).map(s => s.skill).filter(Boolean)),
  ])).slice(0, 30);
  const res = await fetch("/api/esco", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "occupationFingerprint", title: title || "", skillPhrases }),
  });
  if (!res.ok) throw new Error(`esco fingerprint ${res.status}`);
  return res.json(); // { candidates:[...], nominal:{uri,label}|null, fallback }
}

// Pure deterministic assembly: shares (5% bands), skill->component attribution,
// posted-as-vs-actually, coherence metric, per-component AI exposure.
function assembleRoleMix(fp, skills, title) {
  const cand = (fp && fp.candidates) || [];
  if (!cand.length) return null;
  const totalRatio = cand.reduce((a, c) => a + Math.max(0.0001, c.ratio), 0);
  const comps = cand.map(c => ({
    label: toTitleCase(c.label || ""), uri: c.uri, code: c.code || "", iscoMajor: c.iscoMajor,
    matchedSkills: c.matchedSkills || [], matchCount: c.matchCount || 0, essentialCount: c.essentialCount || 0,
    isNominal: !!c.isNominal, rawShare: Math.max(0.0001, c.ratio) / totalRatio,
  })).sort((a, b) => b.rawShare - a.rawShare);
  const kept = []; let otherRaw = 0;
  comps.forEach((c, i) => { if (i < 4 && c.rawShare >= 0.08) kept.push(c); else otherRaw += c.rawShare; });
  if (!kept.length) kept.push(comps[0]);
  const denom = kept.reduce((a, c) => a + c.rawShare, 0) + otherRaw || 1;
  const round5 = x => Math.max(5, Math.round((x / denom) * 20) * 5);
  kept.forEach(c => { c.pct = round5(c.rawShare); });
  let otherPct = otherRaw > 0 ? round5(otherRaw) : 0;
  const sum = kept.reduce((a, c) => a + c.pct, 0) + otherPct;
  if (sum !== 100 && kept.length) kept[0].pct = Math.max(5, kept[0].pct + (100 - sum));
  // attribute each analysed skill to the component whose matched-skill set it best matches
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const sigToks = s => norm(s).split(" ").filter(t => t.length > 3);
  const exact = kept.map(c => new Set(c.matchedSkills.map(norm)));
  const toks = kept.map(c => c.matchedSkills.map(sigToks));
  kept.forEach(c => { c.skills = []; });
  const crossCutting = [];
  (skills || []).forEach(s => {
    const ns = norm(s.skill), st = new Set(sigToks(s.skill));
    let best = -1;
    for (let i = 0; i < kept.length && best < 0; i++) {
      if (exact[i].has(ns)) { best = i; break; }
      for (const mt of toks[i]) { if (mt.filter(t => st.has(t)).length >= 2) { best = i; break; } }
    }
    if (best >= 0) kept[best].skills.push({ n: s.n, skill: s.skill, level: s.level });
    else crossCutting.push({ n: s.n, skill: s.skill, level: s.level });
  });
  const exposureOf = arr => {
    const c = { HIGH:0, MEDIUM:0, LOW:0, HUMAN:0 };
    arr.forEach(s => { if (c[s.level] !== undefined) c[s.level]++; });
    const n = arr.length || 1;
    return { counts: c, n: arr.length, aiExposedPct: Math.round(((c.HIGH + c.MEDIUM) / n) * 100), humanPct: Math.round((c.HUMAN / n) * 100) };
  };
  kept.forEach(c => { c.exposure = exposureOf(c.skills); });
  const nominalLabel = fp.nominal && fp.nominal.label ? toTitleCase(fp.nominal.label) : (kept[0] ? kept[0].label : "");
  const top = kept[0];
  const nominalIsTop = !!(top && (top.isNominal || (nominalLabel && top.label.toLowerCase() === nominalLabel.toLowerCase())));
  const mismatch = !nominalIsTop || !!(top && top.pct < 50);
  const shares = kept.map(c => c.pct / 100).concat(otherPct > 0 ? [otherPct / 100] : []);
  const k = shares.length;
  let entropy = 0; shares.forEach(p => { if (p > 0) entropy -= p * Math.log(p); });
  const normEntropy = k > 1 ? entropy / Math.log(k) : 0;
  const majors = kept.map(c => c.iscoMajor).filter(m => Number.isInteger(m));
  const sameMajor = majors.length >= 2 && majors.every(m => m === majors[0]);
  const coherenceScore = (1 - normEntropy) * (sameMajor ? 1 : 0.65);
  const coherenceKey = (k <= 1 || coherenceScore >= 0.6) ? "coherent" : (coherenceScore >= 0.32 ? "mixed" : "grabbag");
  return {
    components: kept.map(c => ({ label: c.label, code: c.code, iscoMajor: c.iscoMajor, pct: c.pct, isNominal: c.isNominal,
      matchedSkills: c.matchedSkills, matchCount: c.matchCount, essentialCount: c.essentialCount, skills: c.skills, exposure: c.exposure })),
    otherPct, crossCutting, nominalLabel, mismatch,
    coherenceKey, coherenceScore: Math.round(coherenceScore * 100) / 100, sameMajor, fallback: false,
  };
}

async function narrateRoleMix(title, mix) {
  const compDesc = mix.components.map(c => `${c.label} ${c.pct}%${c.isNominal ? " (matches the posted title)" : ""} - AI exposure ${c.exposure.aiExposedPct}%, human-led ${c.exposure.humanPct}%${c.skills.length ? ` - duties: ${c.skills.slice(0,3).map(s=>s.skill).join(", ")}` : ""}`).join("\n");
  const SYSTEM_RM =
`You are a careers analyst who reads real job ads, not idealised occupation profiles. You are given a decomposition of ONE live posting into the ESCO occupations it blends, with each component's AI-exposure. Write a short, grounded reflection - never invent numbers, only explain the ones given. Apply Singapore/ASEAN context. Humble tone, no hype.
Return ONLY a JSON object. No text before or after. No markdown fences.
Format:
{
  "headline": "One sentence on what this ad really is, under 22 words",
  "postedAsNote": "One sentence on how the posted title compares to the actual duty mix, under 22 words. Empty string if the title matches well.",
  "coherenceNote": "One sentence on whether this is a sensible hybrid or a stretched grab-bag, under 22 words",
  "skillingPriority": [{"component":"exact component label from the input","why":"why focus here - under 14 words","action":"one concrete thing to do - under 12 words"}]
}
Rules:
- skillingPriority: 2 to 3 items drawn from the components given. Prioritise the component that is most central AND least AI-exposed (the durable core); flag a highly AI-exposed component as lower-priority filler.
- No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(
`Job title (as posted): ${title}
Posted-title's nominal occupation: ${mix.nominalLabel || "(unclear)"}
Coherence (computed): ${ROLE_MIX_COHERENCE[mix.coherenceKey]?.label || mix.coherenceKey} - score ${mix.coherenceScore}; components ${mix.sameMajor ? "in the same ISCO major group" : "spanning different ISCO major groups"}
Role-mix components:
${compDesc}
${mix.otherPct ? `Other roles (combined): ${mix.otherPct}%\n` : ""}Write the reflection grounded only in the above.`, 700, 1, SYSTEM_RM);
    const obj = extractJSON(raw, "rolemix-narrative");
    if (!obj) return null;
    return {
      headline: String(obj.headline || "").replace(/"/g, "").trim(),
      postedAsNote: String(obj.postedAsNote || "").replace(/"/g, "").trim(),
      coherenceNote: String(obj.coherenceNote || "").replace(/"/g, "").trim(),
      skillingPriority: (obj.skillingPriority || []).map(x => ({ component: String(x.component||"").trim(), why: String(x.why||"").trim(), action: String(x.action||"").trim() })).filter(x => x.component).slice(0, 3),
    };
  } catch (_) { return null; }
}

async function buildRoleMix(posting, skills) {
  const cacheKey = `${(posting && (posting.uuid || posting.title)) || "?"}|${ROLE_MIX_VERSION}`;
  if (_roleMixCache.has(cacheKey)) return _roleMixCache.get(cacheKey);
  let fp;
  try { fp = await getRoleMixCandidates((posting && posting.title) || "", skills, (posting && posting.skills) || []); }
  catch (e) { const r = { fallback: true, reason: "esco_error" }; _roleMixCache.set(cacheKey, r); return r; }
  if (!fp || fp.fallback || !fp.candidates || !fp.candidates.length) {
    const r = { fallback: true, reason: (fp && fp.reason) || "no_candidates" }; _roleMixCache.set(cacheKey, r); return r;
  }
  const mix = assembleRoleMix(fp, skills, (posting && posting.title) || "");
  if (!mix || !mix.components.length) { const r = { fallback: true, reason: "no_components" }; _roleMixCache.set(cacheKey, r); return r; }
  mix.narrative = await narrateRoleMix((posting && posting.title) || "", mix);
  _roleMixCache.set(cacheKey, mix);
  return mix;
}

// ===========================================================================
// Job Anatomy - the "predictive" read of a real role from its live MyCareersFuture
// ads. Per-ad feature extraction (parsing engine) -> deterministic merge with true
// frequencies -> duty classification (work LAYER + AI exposure now/2y + trajectory)
// -> deterministic scoring (AI-resilience / automatability / centre of gravity) ->
// one narration pass. Numbers come from code or label-only classification, never
// from generative prose. Result cached per (sorted ad uuids + version).
// ===========================================================================

const JOB_ANATOMY_VERSION = "ja1";
const _jobAnatomyCache = new Map();
const JOB_LAYERS = {
  Activity:       { label:"Activity",       color:"#b45309", bg:"#fffbeb", border:"#fcd9a0", blurb:"hands-on production" },
  Coordination:   { label:"Coordination",   color:"#0e7490", bg:"#ecfeff", border:"#a5f3fc", blurb:"orchestrating people and process" },
  Accountability: { label:"Accountability", color:"#1a56db", bg:"#e8f0fe", border:"#c3d3f5", blurb:"owning outcomes and decisions" },
  Relational:     { label:"Relational",     color:"#7c3aed", bg:"#f3e8ff", border:"#ddd6fe", blurb:"trust, negotiation and influence" },
  Judgment:       { label:"Judgment",       color:"#1e40af", bg:"#eef2ff", border:"#c7d2fe", blurb:"framing and deciding under ambiguity" },
};
const JOB_LAYER_ORDER = ["Activity","Coordination","Accountability","Relational","Judgment"];
const _exposureBand = { HUMAN:0, LOW:1, MEDIUM:2, HIGH:3 };

function _stripHtml(s) {
  return String(s || "")
    .replace(/<\s*(br|\/p|\/li|\/div|\/tr|\/h[1-6]|\/section)\s*\/?\s*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;|&rsquo;/gi, "'").replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
const _PHRASE_STOP = new Set(["with","from","that","this","your","their","they","them","into","onto","upon","will","shall","must","have","been","were","does","done","using","within","across","along","other","others","more","most","some","such","each","both","when","where","which","while","also","over","than","being","make","made","take","taken","take","ensure","provide","support","manage","handle","perform","carry","drive"]);
const _phraseNormCache = new Map();
function _phraseNorm(s) {
  const key = String(s || "");
  const hit = _phraseNormCache.get(key);
  if (hit !== undefined) return hit;
  const v = key.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  _phraseNormCache.set(key, v);
  return v;
}
const _phraseToksCache = new Map();
function _phraseToks(s) {
  const key = String(s || "");
  const hit = _phraseToksCache.get(key);
  if (hit !== undefined) return hit;
  const v = _phraseNorm(s).split(" ").filter(t => t.length > 3 && !_PHRASE_STOP.has(t));
  _phraseToksCache.set(key, v);
  return v;
}
function _phraseMatch(a, b) {
  const na = _phraseNorm(a), nb = _phraseNorm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ta = _phraseToks(a), tb = _phraseToks(b);
  const sa = new Set(ta); let shared = 0; tb.forEach(t => { if (sa.has(t)) shared++; });
  if (shared >= 2) return true;
  if (ta.length === 1 && tb.length === 1 && ta[0] === tb[0]) return true;
  return false;
}

// A. per-ad feature extraction (parsing engine - JSON only, copy/normalise from the ad, no invention)
async function extractPostingFeatures(job) {
  const text = _stripHtml(job && (job.description || job.responsibilitiesText) || "").slice(0, 4000);
  if (text.length < 120) return null;
  const SYSTEM_AF =
`ACT AS a job-advert parser. You are given the text of ONE job posting. Extract the structured fields below by copying or lightly normalising phrases FROM THE AD - do not invent, infer, or pad.
Return ONLY a JSON object. No text before or after. No markdown fences.
Format:
{
 "tasks": ["short verb-led activity the worker does, under 12 words", ...],
 "outcomes": ["a result, target or KPI the role is measured on, under 12 words", ...],
 "decisionRights": ["something the role owns, approves or signs off, under 12 words", ...],
 "stakeholders": ["who the role works with or manages, under 6 words", ...],
 "orgSignals": {
   "reportsTo": "the role this one reports to, or empty string",
   "teamSize": "e.g. team of 4 / no direct reports / empty string",
   "scopeRegion": "e.g. SEA region / Singapore / empty string",
   "seniorityYears": "e.g. 3-5 years / 5+ years / empty string",
   "tools": ["named tool or system, under 4 words", ...]
 }
}
Rules:
- tasks: 4 to 8 items. outcomes: 0 to 5. decisionRights: 0 to 4. stakeholders: 0 to 5. tools: 0 to 6.
- If the ad does not say something, use an empty string or empty array - do NOT guess.
- No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(`Job title: ${(job && job.title) || ""}\n\nJob posting text:\n${text}\n\nExtract the structured fields.`, 1100, 1, SYSTEM_AF);
    const o = extractJSON(raw, "ad-features");
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const arr = (x, max) => Array.isArray(x) ? x.map(s => String(s || "").replace(/"/g, "").trim()).filter(Boolean).slice(0, max) : [];
    const str = x => String(x || "").replace(/"/g, "").trim();
    const og = o.orgSignals || {};
    return {
      tasks: arr(o.tasks, 8), outcomes: arr(o.outcomes, 5), decisionRights: arr(o.decisionRights, 4), stakeholders: arr(o.stakeholders, 5),
      orgSignals: { reportsTo: str(og.reportsTo), teamSize: str(og.teamSize), scopeRegion: str(og.scopeRegion), seniorityYears: str(og.seniorityYears), tools: arr(og.tools, 6) },
    };
  } catch (_) { return null; }
}

// B. deterministic merge across ads -> duties with true frequencies + aggregated org context
function mergeAdFeatures(perAd) {
  const ads = (perAd || []).filter(Boolean);
  const N = ads.length;
  const mergeList = (key, kind) => {
    const out = [];
    ads.forEach((a, ai) => {
      (a[key] || []).forEach(phrase => {
        const m = out.find(x => _phraseMatch(x.text, phrase));
        if (m) m.ads.add(ai); else out.push({ text: phrase, kind, ads: new Set([ai]) });
      });
    });
    return out;
  };
  const tasks = mergeList("tasks", "task");
  const decisions = mergeList("decisionRights", "decision");
  const outcomes = mergeList("outcomes", "outcome");
  const kindOrd = { task:0, decision:1, outcome:2 };
  const duties = [...tasks, ...decisions, ...outcomes]
    .map(d => ({ text: d.text, kind: d.kind, count: d.ads.size, of: N }))
    .sort((a, b) => (b.count - a.count) || (kindOrd[a.kind] - kindOrd[b.kind]) || a.text.localeCompare(b.text))
    .slice(0, 24);
  duties.forEach((d, i) => { d.n = i + 1; });
  const mode = xs => { const f = {}; xs.filter(Boolean).forEach(x => { f[x] = (f[x]||0)+1; }); const e = Object.entries(f).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])); return e.length ? e[0][0] : ""; };
  const topBy = (xs, n) => { const f = {}; xs.filter(Boolean).forEach(x => { f[x] = (f[x]||0)+1; }); return Object.entries(f).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([x]) => x); };
  const og = ads.map(a => a.orgSignals || {});
  const orgContext = {
    reportsTo: mode(og.map(o => o.reportsTo)),
    teamSize: mode(og.map(o => o.teamSize)),
    seniorityYears: mode(og.map(o => o.seniorityYears)),
    scopeRegions: Array.from(new Set(og.map(o => o.scopeRegion).filter(Boolean))).slice(0, 4),
    tools: topBy(og.flatMap(o => o.tools || []), 6),
    stakeholders: topBy(ads.flatMap(a => a.stakeholders || []), 6),
  };
  return { duties, orgContext, adCount: N };
}

// C. duty classification (classification engine - labels & numbers only, no prose)
async function classifyDuties(title, duties, occExposure) {
  if (!duties.length) return [];
  const SYSTEM_CD =
`ACT AS a workforce-AI classification engine. You are given a list of duties for one job role. For EACH duty output classification labels only - no prose, no explanations.
Return ONLY a JSON array, same length and order as the input. No text before or after. No markdown fences.
Format: [{"n":1,"layer":"Activity","exposureNow":"MEDIUM","exposure2y":"HIGH","trajectory":"rising","confidence":0.8}]
LAYER (what kind of work this duty is):
- Activity: hands-on production - producing the output yourself (analyse, draft, build, reconcile, test, process).
- Coordination: orchestrating people and process - scheduling, chasing, running meetings, keeping work flowing.
- Accountability: owning the outcome - sign-off, approval, decision rights, being answerable when it is wrong.
- Relational: trust, negotiation, persuasion, influence, difficult conversations, relationship management.
- Judgment: framing ambiguous problems and deciding with incomplete information; setting direction or priorities.
EXPOSURE (how well AI can perform this duty - exposureNow = today, exposure2y = in ~2 years):
- HIGH: AI performs it autonomously with minimal human input.
- MEDIUM: AI dramatically augments speed or quality; a human still directs and signs off.
- LOW: AI assists parts of it; human judgment leads throughout.
- HUMAN: presence, accountability, physical action or relationship - AI cannot meaningfully do it.
TRAJECTORY: stable (exposure2y equals exposureNow) | rising (climbs one band by ~2 years) | sharp (climbs two bands).
confidence: a number 0.0 to 1.0.
Calibration: most Activity duties are MEDIUM now and many are rising; Accountability / Relational / Judgment duties stay LOW or HUMAN; office-suite drafting (Word/Excel/PowerPoint) is MEDIUM at most; if exposureNow is HUMAN the trajectory is usually stable.`;
  try {
    const raw = await claudeCall(`Role: ${title}\nDuties to classify:\n${duties.map((d,i)=>`${i+1}. [${d.kind}] ${d.text}`).join("\n")}\nClassify each.`, 2600, 1, SYSTEM_CD);
    const arr = extractJSON(raw, "duty-classification");
    if (!Array.isArray(arr)) return [];
    // W4b (SLE-C parity): the exposure BAND is decided by the same deterministic engine
    // that classifies the Responsibilities tab (classifyResponsibilityLevel), so Step 2 and
    // Step 3 agree on one number source. The LLM keeps only the qualitative labels (layer,
    // trajectory). Two prior fabrications removed: unknown LLM bands defaulted to "MEDIUM",
    // and a failed call stamped EVERY duty "MEDIUM" - both now withhold (null) instead.
    const lvl = x => (["HUMAN","LOW","MEDIUM","HIGH"].includes(x) ? x : null);
    const lay = x => (JOB_LAYERS[x] ? x : "Activity");
    const tj = x => (["stable","rising","sharp"].includes(x) ? x : "stable");
    return duties.map((d, i) => {
      const c = arr.find(x => x && x.n === d.n) || arr[i] || {};
      let eng = null; try { eng = classifyResponsibilityLevel(d.text, occExposure); } catch (_) { eng = null; }
      const eNow = (eng && eng.level) || null;               // engine decides; withhold over guess
      const e2y = eNow ? (lvl(c.exposure2y) || eNow) : null; // 2y outlook only atop a real band
      let trj = tj(c.trajectory);
      if (!eNow || e2y === eNow) trj = "stable";
      return { ...d, layer: lay(c.layer), exposureNow: eNow, exposure2y: e2y, trajectory: trj, levelBasis: (eng && eng.basis) || "withheld", confidence: Math.max(0, Math.min(1, Number(c.confidence) || 0.6)) };
    });
  } catch (_) {
    // LLM label pass failed: bands still come from the engine; layer defaults to Activity
    // (a label, not a number); nothing is stamped "MEDIUM" any more.
    return duties.map(d => {
      let eng = null; try { eng = classifyResponsibilityLevel(d.text, occExposure); } catch (_) { eng = null; }
      const eNow = (eng && eng.level) || null;
      return { ...d, layer: "Activity", exposureNow: eNow, exposure2y: eNow, trajectory: "stable", levelBasis: (eng && eng.basis) || "withheld", confidence: eNow ? 0.5 : 0 };
    });
  }
}

// D. deterministic scoring (no LLM - same inputs -> same numbers)
function scoreJobAnatomy(duties) {
  const w = d => Math.max(1, d.count || 1);
  const totalW = duties.reduce((a, d) => a + w(d), 0) || 1;
  const layerW = {}; JOB_LAYER_ORDER.forEach(L => layerW[L] = 0);
  duties.forEach(d => { layerW[d.layer] = (layerW[d.layer] || 0) + w(d); });
  const layerMix = {}; JOB_LAYER_ORDER.forEach(L => layerMix[L] = Math.round((layerW[L] / totalW) * 100));
  // --- AI-resilience rubric (A8: re-grounded so every score traces to a citation) --------
  // This 5-layer x 4-band taxonomy is bespoke, so NO source gives a per-cell decimal. Per the
  // non-inventive contract the ORDERING below is read from the named sources; the exact values
  // are a calibrated 0-1 modeling choice, tagged as such (not a number read from any source).
  // Sources: Autor, Levy & Murnane 2003 (routine vs non-routine task framework); Felten, Raj &
  // Seamans 2021 (AIOE occupation exposure); Eloundou et al. 2023 "GPTs are GPTs" (LLM task
  // exposure - the cognitive-work inversion); Brynjolfsson, Mitchell & Rock 2018 (SML rubric -
  // social/judgment tasks score low for machine learning). MUST stay byte-identical to api/anatomy.js.
  //
  // expoRes: resilience = INVERSE of a duty's measured AI-exposure band (Felten/Eloundou) -
  //   HUMAN (not exposed) fully resilient down to HIGH barely. Monotone decreasing (modeling choice).
  const expoRes  = { HUMAN:1.0, LOW:0.72, MEDIUM:0.38, HIGH:0.10 };
  // layRes: resilience by job layer. Activity = routine execution (ALM 2003: most substitutable;
  //   SML high-suitability) -> floor. Coordination = part-routine cognitive -> mid. Accountability
  //   = human locus of liability (ALM non-routine; SML low-suitability) -> high. Relational =
  //   non-routine INTERPERSONAL (ALM/SML: least substitutable) -> top. Judgment = non-routine
  //   analytic: high, but BELOW Relational because Eloundou 2023 shows analytic work is now more
  //   LLM-exposed than prior automation waves. Ordering cited; decimals a modeling choice.
  const layRes   = { Activity:0.15, Coordination:0.45, Accountability:0.90, Relational:0.95, Judgment:0.85 };
  // expoAuto: automatability = the duty's exposure band read forward (Eloundou E0/E1/E2 -> low/
  //   medium/high). Monotone increasing (modeling choice).
  const expoAuto = { HIGH:1.0, MEDIUM:0.60, LOW:0.25, HUMAN:0.05 };
  const wmean = fn => duties.reduce((a, d) => a + fn(d) * w(d), 0) / totalW;
  // Per-duty resilience = max(exposure-resilience, layer-resilience x 0.85): the 0.85 discount
  // lets a duty's MEASURED exposure override a generous layer default (modeling choice).
  const aiResilienceScore   = Math.round(100 * wmean(d => Math.max(expoRes[d.exposureNow] ?? 0.4, (layRes[d.layer] ?? 0.2) * 0.85)));
  const resilience2y        = Math.round(100 * wmean(d => Math.max(expoRes[d.exposure2y] ?? 0.4, (layRes[d.layer] ?? 0.2) * 0.85)));
  const automatabilityIndex = Math.round(100 * wmean(d => expoAuto[d.exposureNow] ?? 0.4));
  const cog = JOB_LAYER_ORDER.slice().sort((a, b) => layerW[b] - layerW[a])[0] || "Activity";
  const nRising = duties.filter(d => (_exposureBand[d.exposure2y] ?? 1) > (_exposureBand[d.exposureNow] ?? 1)).length;
  return {
    layerMix, aiResilienceScore, resilience2y, automatabilityIndex,
    centreOfGravity: { layer: cog, line: `Most of this role is ${JOB_LAYERS[cog].blurb} work today.` },
    trajectory2y: { nRising, nDuties: duties.length, line: `${nRising} of ${duties.length} duties move further into AI's reach within ~2 years ‚Äî resilience ~${aiResilienceScore} ‚Üí ~${resilience2y} by ~2027.` },
  };
}

// F. narration (the only generative pass - it gets the numbers, never makes one)
async function narrateJobAnatomy(title, a) {
  const mixLine = JOB_LAYER_ORDER.filter(L => a.layerMix[L] > 0).map(L => `${JOB_LAYERS[L].label} ${a.layerMix[L]}%`).join(" ¬∑ ");
  const oc = a.orgContext || {};
  const ocLine = [oc.reportsTo && `reports to ${oc.reportsTo}`, oc.seniorityYears && `~${oc.seniorityYears}`, oc.teamSize, (oc.scopeRegions||[]).join("/"), (oc.tools||[]).slice(0,4).join(", ")].filter(Boolean).join(" ¬∑ ") || "not stated in the ads";
  const topDuties = a.duties.slice(0, 8).map(d => `${d.text} [${d.layer}, ${d.exposureNow}‚Üí${d.exposure2y}]`).join("; ");
  const SYSTEM_NA =
`ACT AS a careers analyst. You are given the computed anatomy of a real job role - its work-layer mix, AI-resilience score, centre of gravity, 2-year trajectory and org-context signals. Write a short grounded reflection. NEVER produce or change a number - only explain the ones given. Apply Singapore/ASEAN context. Humble, plain, no hype.
Return ONLY a JSON object. No text before or after. No markdown fences.
Format:
{
 "headline": "one sentence on what this job mostly is today, under 22 words",
 "whatTheJobReallyIs": "2 short sentences on the real shape of the work versus the job title, under 45 words",
 "whatSupervisorsExpect": "2 short sentences on what a manager or department is really hiring for here (accountability, judgment, relationships, outcomes), under 45 words",
 "prepFocus": [{"layer":"exact layer name from the input","why":"why focus here as AI advances - under 14 words","action":"one concrete thing to do - under 12 words"}]
}
Rules: prepFocus 2 to 3 items, prioritising the layers least exposed to AI and most central to this role. No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(
`Role (as posted or searched): ${title}
Work-layer mix: ${mixLine}
AI-resilience score: ${a.aiResilienceScore}/100 (in ~2 years: ~${a.resilience2y}/100). Automatability index now: ${a.automatabilityIndex}/100.
Centre of gravity: ${a.centreOfGravity.layer} ‚Äî ${a.centreOfGravity.line}
2-year trajectory: ${a.trajectory2y.line}
Org-context across ${a.adCount} live ads: ${ocLine}
Top duties (with layer & exposure now‚Üí2y): ${topDuties}
Write the reflection grounded only in the above.`, 800, 1, SYSTEM_NA);
    const o = extractJSON(raw, "anatomy-narrative");
    if (!o) return null;
    const s = x => String(x || "").replace(/"/g, "").trim();
    return {
      headline: s(o.headline), whatTheJobReallyIs: s(o.whatTheJobReallyIs), whatSupervisorsExpect: s(o.whatSupervisorsExpect),
      prepFocus: (o.prepFocus || []).map(p => ({ layer: s(p.layer), why: s(p.why), action: s(p.action) })).filter(p => p.layer).slice(0, 3),
    };
  } catch (_) { return null; }
}

// orchestrator. Two-tier cache: an in-memory exact-ad-set cache (within session)
// and a shared persistent cache via /api/anatomy keyed by role title + version
// (cross-session / cross-user, ~7-day TTL) - which also logs every fresh run for
// the longitudinal dataset. Reuses the live ads buildResponsibilitiesData fetched.
async function buildJobAnatomy(jobs, title, source, occExposure) {
  const ads = (jobs || []).filter(j => j && j.uuid);
  const cacheKey = `${ads.map(j => j.uuid).sort().join(",")}|${JOB_ANATOMY_VERSION}`;
  if (_jobAnatomyCache.has(cacheKey)) return _jobAnatomyCache.get(cacheKey);
  const done = r => { _jobAnatomyCache.set(cacheKey, r); return r; };
  const roleKey = String(title || "").trim().toLowerCase();
  // shared persistent cache
  if (roleKey) {
    try {
      const r = await fetch("/api/anatomy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get", role: roleKey, version: JOB_ANATOMY_VERSION }) }).then(x => x.json());
      if (r && r.hit && !r.hit.fallback && Array.isArray(r.hit.duties) && r.hit.duties.length) { track("jobanatomy_cache_hit", { role: roleKey }); return done(r.hit); }
    } catch (_) { /* fall through to compute */ }
  }
  if (ads.length < 3) return done({ fallback: true, reason: "too_few_ads" });
  const settled = await Promise.allSettled(ads.slice(0, 12).map(extractPostingFeatures));
  const perAd = settled.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
  if (perAd.length < 2) return done({ fallback: true, reason: "extract_failed" });
  const merged = mergeAdFeatures(perAd);
  if (!merged.duties || merged.duties.length < 4) return done({ fallback: true, reason: "thin", orgContext: merged.orgContext, adCount: merged.adCount });
  const classified = await classifyDuties(title, merged.duties, occExposure);
  if (!classified.length) return done({ fallback: true, reason: "classify_failed" });
  const scores = scoreJobAnatomy(classified);
  const partial = { ...scores, orgContext: merged.orgContext, adCount: merged.adCount, duties: classified };
  const narrative = await narrateJobAnatomy(title, partial);
  const result = { fallback: false, ...partial, narrative };
  // log this fresh run to the shared store (fire-and-forget)
  if (roleKey) {
    fetch("/api/anatomy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      action: "put", role: roleKey, roleDisplay: toTitleCase(title || ""), version: JOB_ANATOMY_VERSION,
      source: ["esco", "posting", "corpus"].includes(source) ? source : "esco",
      adUuids: ads.map(j => j.uuid), adCount: merged.adCount, duties: classified, orgContext: merged.orgContext, narrative,
    }) }).catch(() => {});
  }
  return done(result);
}

// ===========================================================================
// ATS Reverse-Engineer v2 - reverses the screening pipeline as a 3-gate model
// (parsing -> keyword(exact, tiered) -> semantic) + an AI-anomaly check, grounded
// in v3/doc/Report-ATS.md, and checks a pasted resume through all of it. Resume
// text -> /api/claude only, never stored. The screening profile per role is cached
// in the DB (/api/anatomy getProfile/putProfile); only aggregate keyword-gap COUNTS
// are recorded (recordGap) - no resume text, no URLs.
// ===========================================================================

const SCREEN_PROFILE_VERSION = "sp2";
const _screeningProfileCache = new Map();
const AI_DIMENSIONS_DEFAULT = [
  { name: "Skills coverage", what: "how many of the must-have skills the resume shows" },
  { name: "Relevant experience", what: "experience in this role / a close one, at the right scale" },
  { name: "Seniority match", what: "years and scope vs what the role expects" },
  { name: "Evidence of impact", what: "measurable outcomes, not just duties listed" },
  { name: "Keyword alignment", what: "uses the role's own language / tools" },
];
// known acronym <-> full-form pairs (Report-ATS.md ¬ß3.2 - include both forms once)
const _ACRONYM_PAIRS = [
  ["SEO","search engine optimization"],["SQL","structured query language"],["KPI","key performance indicator"],
  ["CRM","customer relationship management"],["ERP","enterprise resource planning"],["P&L","profit and loss"],
  ["B2B","business to business"],["B2C","business to consumer"],["SaaS","software as a service"],["UX","user experience"],
  ["UI","user interface"],["API","application programming interface"],["ETL","extract transform load"],
  ["GAAP","generally accepted accounting principles"],["IFRS","international financial reporting standards"],
  ["AML","anti money laundering"],["KYC","know your customer"],["ESG","environmental social governance"],
  ["L&D","learning and development"],["HRIS","human resources information system"],["PMO","project management office"],
  ["RFP","request for proposal"],["SLA","service level agreement"],["OKR","objectives and key results"],
];
// ATS vendor identification from the application URL stem (Report-ATS.md ¬ß4.1, ¬ß6)
const _ATS_VENDORS = [
  { key:"workday",    re:/myworkdayjobs\.com|workday\.com/i, name:"Workday", parserGen:"Hybrid rule + NLP", weakness:"multi-column layouts, graphics, non-standard headings", behavior:"Pre-fills the application form from your resume - check and correct the parsed fields it shows you." },
  { key:"greenhouse", re:/boards\.greenhouse\.io|greenhouse\.io/i, name:"Greenhouse", parserGen:"Rule + ML hybrid", weakness:"headers/footers, tables, large files", behavior:"The recruiter sees your PDF plus a parsed profile; the AI summary uses the parsed text - keep the file small and clean." },
  { key:"lever",      re:/jobs\.lever\.co|lever\.co/i, name:"Lever", parserGen:"ML-first (LeverTRM, Gem AI absorbed 2023-24)", weakness:"images-as-text, tables", behavior:"Recruiters act mainly on the PARSED profile, not your PDF - so what the parser extracts is what they see." },
  { key:"taleo",      re:/taleo\.net|taleo\.com/i, name:"Oracle Taleo", parserGen:"Legacy rule-based", weakness:"the most fragile parser - penalises everything non-standard", behavior:"Form pre-fill is partial; you re-enter a lot manually. Keep it dead simple: single column, canonical headings, plain bullets." },
  { key:"icims",      re:/icims\.com/i, name:"iCIMS", parserGen:"Rule + ML hybrid", weakness:"international formats, columns, non-Latin scripts", behavior:"Form pre-fill; mid-strength parser - creative/international layouts underperform." },
  { key:"sapsf",      re:/successfactors\.com|sapsf\.com|jobs\.sap\.com/i, name:"SAP SuccessFactors", parserGen:"Rule + ML hybrid", weakness:"custom characters, decorative glyphs", behavior:"Strong on enterprise/EMEA workflows; avoid decorative characters and non-standard glyphs." },
];
function identifyAts(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  for (const v of _ATS_VENDORS) if (v.re.test(u)) return { key: v.key, name: v.name, parserGen: v.parserGen, weakness: v.weakness, behavior: v.behavior };
  return null;
}

// --- resume text parsing helpers (Gate 1) ---
const _CANON_HEADINGS = {
  experience: /^\s*[‚Ä¢\-*]?\s*(work\s+|professional\s+)?(experience|employment(\s+history)?|work\s+history|career\s+history)\s*:?\s*$/i,
  education: /^\s*[‚Ä¢\-*]?\s*(education|academic\s+background|qualifications?)\s*:?\s*$/i,
  skills: /^\s*[‚Ä¢\-*]?\s*(skills|technical\s+skills|core\s+(skills|competenc(ies|es))|key\s+skills|competenc(ies|es)|areas?\s+of\s+expertise)\s*:?\s*$/i,
  certifications: /^\s*[‚Ä¢\-*]?\s*(certifications?|licen[cs]es?|credentials?)\s*:?\s*$/i,
  summary: /^\s*[‚Ä¢\-*]?\s*(summary|profile|professional\s+summary|career\s+summary|about(\s+me)?|objective)\s*:?\s*$/i,
};
const _DATE_RANGE_RE = /\b((19|20)\d{2}|[A-Za-z]{3,9}\.?\s+(19|20)\d{2}|\d{1,2}\/(19|20)\d{2})\b\s*[-‚Äì‚Äî]+\s*|\bto\b\s*((19|20)\d{2}|present|now|current)/i;
const _EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const _PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/;
const _DECOR_BULLET_RE = /^\s*[‚ñ∫‚ñ∂‚ñ∏‚óÜ‚óá‚ñ†‚ñ°‚óè‚óã‚ú¶‚úì‚úî‚û§‚ûî‚òÖ‚òÜ¬ª¬∑‚àô‚ñ™‚ñ´¬ª]/;
const _HEADING_LINE_RE = /^[A-Z][A-Za-z &/]{2,40}:?$/;
function _resumeLines(text) { return String(text || "").split(/\r?\n/).map(l => l.replace(/\s+$/, "")); }
function _findHeadingLine(lines, re) { for (let i = 0; i < lines.length; i++) if (re.test(lines[i]) && lines[i].trim().length <= 60) return i; return -1; }
function _sectionAfter(lines, startIdx) {
  if (startIdx < 0) return "";
  const out = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    const isNewHeading = l && l.length <= 50 && ((_HEADING_LINE_RE.test(l) && l === l.toUpperCase()) || Object.values(_CANON_HEADINGS).some(re => re.test(lines[i])));
    if (isNewHeading) break;
    out.push(lines[i]);
  }
  return out.join("\n");
}

// Gate 1 - parse / format (deterministic, inferred from the pasted TEXT) + the static invariants checklist
function parseCheck(resumeText) {
  const text = String(resumeText || "");
  const lines = _resumeLines(text);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const flags = []; // { level:"warn"|"info", msg }
  const expIdx = _findHeadingLine(lines, _CANON_HEADINGS.experience);
  const eduIdx = _findHeadingLine(lines, _CANON_HEADINGS.education);
  const skillsIdx = _findHeadingLine(lines, _CANON_HEADINGS.skills);
  const expSection = _sectionAfter(lines, expIdx);
  const skillsSection = _sectionAfter(lines, skillsIdx);
  if (expIdx < 0) flags.push({ level: "warn", msg: 'No canonical "Experience" / "Work History" heading found - rule-based parsers (Taleo, legacy iCIMS) may misroute your job history.' });
  if (eduIdx < 0) flags.push({ level: "info", msg: 'No clear "Education" heading found.' });
  if (expIdx >= 0 && !_DATE_RANGE_RE.test(expSection)) flags.push({ level: "warn", msg: "No date ranges detected in your experience section - ATS give more experience weight to skills inside DATED job entries." });
  const head = lines.slice(0, 14).join("\n"), tail = lines.slice(-8).join("\n");
  const emailAnywhere = _EMAIL_RE.test(text);
  const contactAtTop = emailAnywhere && (_EMAIL_RE.test(head) || _PHONE_RE.test(head));
  if (emailAnywhere && !contactAtTop) {
    if (_EMAIL_RE.test(tail) || _PHONE_RE.test(tail)) flags.push({ level: "warn", msg: "Your contact details look like they're at the very end (a footer?) - ~25% of ATS skip header/footer text. Put name + email + phone in the first body block." });
    else flags.push({ level: "info", msg: "Contact details aren't in the first few lines - make sure they're in the body, not a Word header/footer." });
  } else if (!emailAnywhere) flags.push({ level: "info", msg: "No email detected in the pasted text - if you only pasted part of your resume, the checks below cover just what's here." });
  const pages = words < 700 ? 1 : words < 1350 ? 2 : 3;
  if (pages >= 3) flags.push({ level: "warn", msg: `This is ~${pages}+ pages of text (~${words} words) - aim for 1 page under ~8 years' experience, 2 up to ~20 (academia/clinical excepted).` });
  const hasDecor = lines.some(l => _DECOR_BULLET_RE.test(l));
  if (hasDecor) flags.push({ level: "info", msg: "Decorative bullet glyphs detected - SAP SuccessFactors and Taleo can choke on these; use plain solid dots or hyphens." });
  const shortLines = lines.filter(l => l.trim() && l.trim().length < 25).length;
  const multiColHint = lines.length > 25 && shortLines / lines.length > 0.45;
  if (multiColHint) flags.push({ level: "info", msg: "Lots of very short lines - if your resume is multi-column, ATS read left-to-right across rows and scramble it. Use a single column." });
  let score = 100; flags.forEach(f => score -= f.level === "warn" ? 14 : 4); score = Math.max(0, Math.min(100, score));
  const hasPlainBullet = lines.some(l => /^\s*[‚Ä¢\-*]/.test(l));
  const checklist = [
    { item: "Single-column layout", ok: multiColHint ? false : null, note: "the only layout with verified parse fidelity on all 6 major ATS" },
    { item: "Text-layer PDF or DOCX (never image-only)", ok: null, note: "image-only PDFs parse near 0% - verify in your document" },
    { item: "Contact info in the body, not a header/footer", ok: emailAnywhere ? contactAtTop : null, note: "~25% of ATS skip header/footer text" },
    { item: "Canonical section headings (Experience / Education / Skills / Certifications)", ok: (expIdx >= 0 && skillsIdx >= 0) ? true : (expIdx < 0 ? false : null), note: '"My Journey" etc. misroute content' },
    { item: "Plain bullets (solid dot or hyphen), no decorative glyphs", ok: hasDecor ? false : (hasPlainBullet ? true : null), note: "" },
    { item: "Dates inside each job entry", ok: expIdx >= 0 ? _DATE_RANGE_RE.test(expSection) : null, note: "skills in dated entries get more experience weight" },
    { item: "Right length (‚â§1pg under 8 yrs, ‚â§2pg 8-20 yrs)", ok: pages <= 2, note: "" },
    { item: "Sans-serif font, 10-12pt body, 1-inch margins", ok: null, note: "verify in your document" },
    { item: "Present tense for current role, past for prior roles", ok: null, note: "verify in your document" },
  ];
  return { score, flags, checklist, expIdx, skillsIdx, expSection, skillsSection, words, pages, lines };
}

// --- deterministic: build the role's TIERED demanded set from what `result` already carries ---
function buildDemandedSet(result) {
  const add = (list, kw, why, fromAdsInc) => {
    const k = String(kw || "").trim(); if (!k || k.length > 60) return;
    const m = list.find(x => _phraseMatch(x.kw, k));
    if (m) { if (fromAdsInc) m.fromAds = (m.fromAds || 0) + fromAdsInc; if (!m.why && why) m.why = why; return; }
    list.push({ kw: toTitleCase(k), why: why || "", fromAds: fromAdsInc || 0 });
  };
  const exactTitle = [];
  add(exactTitle, ((result.escoCanonicalTitle || (result.escoOccupation && result.escoOccupation.preferredLabel) || "").trim()) || (result.title || ""), "the canonical job title", 0);
  ((result.escoOccupation && result.escoOccupation.altLabels) || []).slice(0, 4).forEach(a => add(exactTitle, a, "an alternative title employers use", 0));
  const hardSkills = [], softSkills = [];
  (result.skills || []).forEach(s => {
    const isSoft = s.skillType === "soft-skill" || s.type === "soft-skill";
    if (isSoft) add(softSkills, s.skill, "ESCO human/soft skill", 0);
    else add(hardSkills, s.skill, s.escoUri ? "ESCO essential skill" : "core skill", 0);
  });
  const adJobs = (result.responsibilitiesData && Array.isArray(result.responsibilitiesData.jobs)) ? result.responsibilitiesData.jobs : [];
  const adTally = {}; adJobs.forEach(j => Array.from(new Set((j.skills || []).filter(Boolean))).forEach(s => { adTally[s] = (adTally[s] || 0) + 1; }));
  Object.entries(adTally).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => add(hardSkills, s, `listed in ${c} of ${adJobs.length} live ads`, c));
  ((result.jobAnatomy && result.jobAnatomy.orgContext && result.jobAnatomy.orgContext.tools) || []).forEach(t => add(hardSkills, t, "tool / system the ads name", 0));
  hardSkills.sort((a, b) => (b.fromAds || 0) - (a.fromAds || 0) || a.kw.localeCompare(b.kw));
  const dutyKeywords = ((result.jobAnatomy && Array.isArray(result.jobAnatomy.duties)) ? result.jobAnatomy.duties : (result.responsibilitiesData && Array.isArray(result.responsibilitiesData.responsibilities) ? result.responsibilitiesData.responsibilities : [])).map(d => d.text).filter(Boolean).slice(0, 24);
  const oc = (result.jobAnatomy && result.jobAnatomy.orgContext) || {};
  return { exactTitle: exactTitle.slice(0, 5), hardSkills: hardSkills.slice(0, 24), softSkills: softSkills.slice(0, 12), dutyKeywords, seniority: oc.seniorityYears || "", tools: (oc.tools || []).slice(0, 8) };
}

// coverage of one kw list against the resume (helper)
function _coverOne(rNorm, rToks, kwList) {
  const list = (kwList || []).map(x => (typeof x === "string" ? { kw: x } : x)).filter(x => x && x.kw);
  const covered = [], partial = [], missing = [];
  list.forEach(x => {
    const kn = _phraseNorm(x.kw); if (!kn) { missing.push(x); return; }
    if (rNorm.includes(kn)) { covered.push(x); return; }
    const kt = _phraseToks(x.kw).length ? _phraseToks(x.kw) : kn.split(" ").filter(t => t.length > 2);
    if (!kt.length) { missing.push(x); return; }
    const present = kt.filter(t => rToks.has(t)).length;
    if (present === kt.length) covered.push(x); else if (present > 0) partial.push(x); else missing.push(x);
  });
  return { score: list.length ? Math.round(100 * (covered.length + 0.4 * partial.length) / list.length) : 0, covered, partial, missing, total: list.length };
}

// Gate 2 - keyword match (exact, tiered) + the documented levers (title-mirroring, placement, stuffing, acronyms)
function keywordGates(resumeText, profile, parsed) {
  const rNorm = _phraseNorm(resumeText);
  const rToks = new Set(rNorm.split(" ").filter(t => t.length > 2));
  const tiers = {
    requiredQuals: _coverOne(rNorm, rToks, profile.requiredQuals || []),
    hardSkills: _coverOne(rNorm, rToks, profile.hardSkills || []),
    softSkills: _coverOne(rNorm, rToks, profile.softSkills || []),
    dutyKeywords: _coverOne(rNorm, rToks, (profile.dutyKeywords || []).map(d => ({ kw: d }))),
  };
  const exTitles = (profile.exactTitle || []).map(t => t.kw || t).filter(Boolean);
  let titleFound = "", titleMatched = false;
  if (parsed && parsed.expIdx >= 0 && parsed.lines) {
    for (let i = parsed.expIdx + 1; i < Math.min(parsed.lines.length, parsed.expIdx + 8); i++) {
      const l = parsed.lines[i].trim(); if (!l || l.length > 80) continue;
      const ln = _phraseNorm(l);
      const m = exTitles.find(t => { const tn = _phraseNorm(t); const tt = _phraseToks(t); return tn && (ln.includes(tn) || (tn.length > 6 && tn.includes(ln)) || (tt.length && _phraseToks(l).filter(x => tt.includes(x)).length >= Math.max(1, Math.ceil(tt.length * 0.6)))); });
      if (m) { titleFound = l; titleMatched = true; break; }
      if (!titleFound) titleFound = l;
    }
  }
  if (!titleMatched) titleMatched = exTitles.some(t => { const tn = _phraseNorm(t); return tn && tn.length > 5 && rNorm.includes(tn); });
  // placement: covered hard-skills that ONLY appear in the Skills-list section, not in dated experience bullets
  const skillsSec = _phraseNorm(parsed && parsed.skillsSection || "");
  const expSec = _phraseNorm(parsed && parsed.expSection || "");
  const onlyInSkillsList = [];
  if (skillsSec) tiers.hardSkills.covered.forEach(c => {
    const kn = _phraseNorm(c.kw); if (!kn) return;
    if (skillsSec.includes(kn) && !(expSec && expSec.includes(kn))) onlyInSkillsList.push(c);
  });
  // stuffing: any covered kw appearing 4+ times in the full text
  const countOcc = s => { const kn = _phraseNorm(s); if (!kn || kn.length < 3) return 0; let n = 0, i = 0; while ((i = rNorm.indexOf(kn, i)) !== -1) { n++; i += kn.length; } return n; };
  const stuffing = []; const seenStuff = new Set();
  [...tiers.requiredQuals.covered, ...tiers.hardSkills.covered, ...tiers.softSkills.covered].forEach(c => { const k = c.kw.toLowerCase(); if (seenStuff.has(k)) return; const n = countOcc(c.kw); if (n >= 4) { stuffing.push({ kw: c.kw, n }); seenStuff.add(k); } });
  // acronym pairing: relevant pair where exactly one side is present
  const acronymTips = [];
  const demKw = [...(profile.requiredQuals || []), ...(profile.hardSkills || []), ...(profile.softSkills || [])].map(x => _phraseNorm(x.kw || x));
  _ACRONYM_PAIRS.forEach(([acr, full]) => {
    const acrTok = acr.toLowerCase().replace(/[^a-z0-9]/g, "");
    const aIn = rToks.has(acrTok) || rNorm.includes(acrTok);
    const fIn = rNorm.includes(full);
    const fullWords = full.split(" ");
    const relevant = demKw.some(d => d.includes(acrTok) || d.includes(full) || fullWords.every(w => d.includes(w)));
    if (relevant && aIn !== fIn) acronymTips.push({ acronym: acr, full, have: aIn ? "acronym" : "full form" });
  });
  // tier-weighted gate-2 score (redistribute requiredQuals/title weight if absent)
  const titleScore = titleMatched ? 100 : 0;
  let w = { req: 0.30, title: 0.20, hard: 0.30, duty: 0.12, soft: 0.08 };
  if (!(profile.requiredQuals || []).length) w = { req: 0, title: 0.28, hard: 0.42, duty: 0.18, soft: 0.12 };
  if (!exTitles.length) { w.hard += w.title; w.title = 0; }
  const gate2Score = Math.round(w.req * tiers.requiredQuals.score + w.title * titleScore + w.hard * tiers.hardSkills.score + w.duty * tiers.dutyKeywords.score + w.soft * tiers.softSkills.score);
  return { tiers, gate2Score, titleMatch: { matched: titleMatched, found: titleFound, target: exTitles[0] || "" }, placement: { onlyInSkillsList, n: onlyInSkillsList.length }, stuffing, acronymTips };
}

// AI-anomaly check (deterministic signals the AI co-pilot flags)
function anomalyCheck(resumeText, kwGates) {
  const flags = [];
  (kwGates.stuffing || []).forEach(s => flags.push({ msg: `"${s.kw}" appears ${s.n}x - modern AI co-pilots flag keyword stuffing above ~2-3 mentions. Trim to 2-3 well-placed uses.` }));
  const sents = String(resumeText || "").split(/[.!?]\s+|\n/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 3);
  if (sents.length >= 8) {
    const lens = sents.map(s => s.split(/\s+/).length);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) * (b - mean), 0) / lens.length);
    if (mean > 6 && sd / mean < 0.18) flags.push({ msg: "Your bullets are unusually uniform in length and rhythm - AI screeners read very even cadence as a low-burstiness 'AI-generated' signal. Vary it: mix short punchy bullets with longer ones." });
  }
  return { flags };
}

// --- LLM: the screening-rules engine - required qualifications + the AI screener's scoring dimensions ---
async function profileScreener(title, dem) {
  const must = (dem.hardSkills || []).map(m => m.kw).slice(0, 24).join(" | ");
  const duties = (dem.dutyKeywords || []).slice(0, 14).join(" | ");
  const SYSTEM_PS =
`ACT AS the screening-rules engine for an ATS plus an AI resume screener hiring a ${title} in Singapore. You are given the role's key skills and duties. Output classification labels only - no prose, no advice, no rewriting.
Return ONLY a JSON object. No text/fences.
Format:
{
 "requiredQuals": [{"term":"the 1-3 word qualification term, e.g. 'CFA charter', 'degree in accounting', '5+ years experience'","question":"the knockout/screening question this maps to, under 14 words"}],   // 2 to 5 plausible HARD filters for THIS role (degree/field, minimum years, certification/licence, work pass, language)
 "aiDimensions": [{"name":"short label","what":"what an AI screener scores on this, under 12 words"}]   // 4 to 5 - e.g. Skills coverage, Relevant experience, Seniority match, Evidence of impact, Keyword alignment
}
Rules: requiredQuals must be genuine HARD filters (not soft preferences). No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(`Role: ${title}\nKey skills: ${must}\nDuties: ${duties}\nTypical seniority: ${dem.seniority || "not stated"} | tools: ${(dem.tools || []).join(", ") || "not stated"}\nReturn the required qualifications and AI scoring dimensions.`, 650, 1, SYSTEM_PS);
    const o = extractJSON(raw, "profile-screener");
    if (!o) return { requiredQuals: [], aiDimensions: AI_DIMENSIONS_DEFAULT };
    const s = x => String(x || "").replace(/"/g, "").trim();
    const requiredQuals = (Array.isArray(o.requiredQuals) ? o.requiredQuals : []).map(r => (typeof r === "string" ? { term: s(r).slice(0, 60), question: "" } : { term: s(r && (r.term || r.kw)).slice(0, 60), question: s(r && (r.question || r.q)).slice(0, 140) })).filter(r => r.term).slice(0, 5);
    let aiDimensions = (Array.isArray(o.aiDimensions) ? o.aiDimensions : []).map(d => (typeof d === "string" ? { name: s(d).slice(0, 60) } : { name: s(d && d.name).slice(0, 60), what: s(d && d.what).slice(0, 140) })).filter(d => d.name).slice(0, 6);
    if (aiDimensions.length < 3) aiDimensions = AI_DIMENSIONS_DEFAULT;
    return { requiredQuals, aiDimensions };
  } catch (_) { return { requiredQuals: [], aiDimensions: AI_DIMENSIONS_DEFAULT }; }
}

async function profileNarrative(title, dem, aiDimensions) {
  const SYSTEM_PN =
`ACT AS a careers analyst. You are given a role's key skills and the dimensions an AI screener would score on. Write a 2-sentence reflection on how a resume for this role is screened, plus a one-line "the bar to clear". Singapore context. Humble, plain.
Return ONLY a JSON object. No text/fences. Format: {"headline":"2 short sentences, under 40 words","aiBar":"one line on what clears the AI screener, under 20 words"}
No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(`Role: ${title}\nKey skills: ${(dem.hardSkills || []).map(m => m.kw).slice(0, 16).join(", ")}\nAI screener scores on: ${(aiDimensions || []).map(d => d.name).join(", ")}\nWrite the reflection.`, 280, 1, SYSTEM_PN);
    const o = extractJSON(raw, "profile-narrative");
    if (!o) return null;
    const s = x => String(x || "").replace(/"/g, "").trim();
    return { headline: s(o.headline).slice(0, 260), aiBar: s(o.aiBar).slice(0, 200) };
  } catch (_) { return null; }
}

async function getScreeningProfile(result, title) {
  const roleKey = String(title || "").trim().toLowerCase();
  const cacheKey = `${roleKey}|${SCREEN_PROFILE_VERSION}`;
  if (_screeningProfileCache.has(cacheKey)) return _screeningProfileCache.get(cacheKey);
  if (roleKey) {
    try {
      const r = await fetch("/api/anatomy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "getProfile", role: roleKey, version: SCREEN_PROFILE_VERSION }) }).then(x => x.json());
      if (r && r.profile && ((Array.isArray(r.profile.hardSkills) && r.profile.hardSkills.length) || (Array.isArray(r.profile.exactTitle) && r.profile.exactTitle.length))) {
        const p = { ...r.profile, keywordGaps: r.keywordGaps || [], cached: true };
        _screeningProfileCache.set(cacheKey, p); return p;
      }
    } catch (_) { /* fall through */ }
  }
  const dem = buildDemandedSet(result || {});
  if (!dem.hardSkills.length && !dem.exactTitle.length) return { exactTitle: [], requiredQuals: [], hardSkills: [], softSkills: [], dutyKeywords: [], aiDimensions: AI_DIMENSIONS_DEFAULT, knockouts: [], seniority: "", tools: [], narrative: null, keywordGaps: [], cached: false, empty: true };
  const [ps, narr] = await Promise.all([profileScreener(title, dem), profileNarrative(title, dem, AI_DIMENSIONS_DEFAULT)]);
  const aiDimensions = (ps && ps.aiDimensions && ps.aiDimensions.length) ? ps.aiDimensions : AI_DIMENSIONS_DEFAULT;
  const rqRaw = (ps && ps.requiredQuals) || [];
  const requiredQuals = rqRaw.map(r => ({ kw: r.term, why: r.question || "" }));
  const knockouts = rqRaw.map(r => r.question || r.term).filter(Boolean);
  const profile = { exactTitle: dem.exactTitle, requiredQuals, hardSkills: dem.hardSkills, softSkills: dem.softSkills, dutyKeywords: dem.dutyKeywords, aiDimensions, knockouts, seniority: dem.seniority, tools: dem.tools, narrative: narr, keywordGaps: [], cached: false };
  if (roleKey) {
    fetch("/api/anatomy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      action: "putProfile", role: roleKey, roleDisplay: toTitleCase(title || ""), version: SCREEN_PROFILE_VERSION, source: (result && result.source) || "esco",
      profile: { exactTitle: profile.exactTitle, requiredQuals, hardSkills: profile.hardSkills, softSkills: profile.softSkills, dutyKeywords: profile.dutyKeywords, aiDimensions, knockouts, seniority: profile.seniority, tools: profile.tools, narrative: narr },
    }) }).catch(() => {});
  }
  _screeningProfileCache.set(cacheKey, profile);
  return profile;
}

// --- LLM: the "AI screener" (Gate 3 - the soft ranker on top of the hard filter) - labels & numbers only ---
async function screenResume(title, aiDimensions, demandedSummary, resumeText) {
  const dims = (aiDimensions && aiDimensions.length ? aiDimensions : AI_DIMENSIONS_DEFAULT).map(d => d.name);
  const SYSTEM_SR =
`ACT AS the AI screener stage of an ATS for the role ${title} in Singapore. The keyword/Boolean hard filter has already run; you are the SEMANTIC ranker on top of it plus the recruiter-facing summarizer. You are given the role's demanded skills/duties, a candidate's resume text, and the dimensions you score on. Output classification labels and numbers only - no prose, no rewriting the resume, no advice.
Return ONLY a JSON object. No text/fences.
Format:
{
 "verdict": "STRONG" | "POSSIBLE" | "UNLIKELY",
 "scores": { ${dims.map(d => `"${d}": 0-100`).join(", ")} },
 "advanceReasons": ["why a screener would advance this resume, under 12 words", ...],   // 0 to 4
 "rejectReasons": ["why a screener would reject/deprioritise it, under 12 words", ...],   // 0 to 4
 "redFlags": ["a concrete red flag in the resume, under 12 words", ...],   // 0 to 3
 "knockoutRisks": ["a likely required-qualification this resume does not clearly satisfy, under 12 words", ...]   // 0 to 3
}
Rules: score the resume vs the role honestly; verdict UNLIKELY if a hard qualification looks unmet or skills coverage is poor. No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(`Role: ${title}\nDemanded skills/duties: ${demandedSummary}\n\nCandidate resume text:\n${String(resumeText || "").slice(0, 6000)}\n\nScore and classify.`, 1700, 1, SYSTEM_SR);
    const o = extractJSON(raw, "screen-resume");
    if (!o) return null;
    const s = x => String(x || "").replace(/"/g, "").trim();
    const arrS = (x, n) => Array.isArray(x) ? x.map(v => s(v).slice(0, 120)).filter(Boolean).slice(0, n) : [];
    const verdict = ["STRONG", "POSSIBLE", "UNLIKELY"].includes(o.verdict) ? o.verdict : "POSSIBLE";
    const scores = {}; dims.forEach(d => { const v = Number(o.scores && o.scores[d]); scores[d] = Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 50; });
    return { verdict, scores, advanceReasons: arrS(o.advanceReasons, 4), rejectReasons: arrS(o.rejectReasons, 4), redFlags: arrS(o.redFlags, 3), knockoutRisks: arrS(o.knockoutRisks, 3) };
  } catch (_) { return null; }
}

// --- LLM: rewrite advice - the only generative pass; templates, never fabricated claims; with the over-optimization guardrail ---
async function resumeAdvice(title, screenResult, kwGates, jobAnatomySummary, resumeText) {
  const missing = [...(kwGates.tiers.requiredQuals.missing || []), ...(kwGates.tiers.hardSkills.missing || [])].map(m => m.kw || m).slice(0, 15).join(" | ");
  const tm = kwGates.titleMatch;
  const titleCtx = (tm && tm.target) ? (tm.matched ? `most-recent title matches the target ("${tm.found}")` : `most-recent title looks like "${tm.found || "?"}" but the target role is "${tm.target}" - a TITLE MISMATCH (exact title match is the single biggest lever)`) : "";
  const placeCtx = (kwGates.placement && kwGates.placement.n) ? `${kwGates.placement.n} covered skills appear ONLY in the standalone Skills list, not in dated job bullets: ${kwGates.placement.onlyInSkillsList.slice(0, 8).map(c => c.kw).join(", ")}` : "";
  const stuffCtx = (kwGates.stuffing && kwGates.stuffing.length) ? `over-repeated keywords (will trip the AI co-pilot): ${kwGates.stuffing.map(s => `${s.kw} x${s.n}`).join(", ")}` : "";
  const SYSTEM_RA =
`You are a careers coach helping a candidate get past the ATS keyword filter AND the AI screener for ${title} (Singapore). You are given the screening result, the must-have keywords the resume is MISSING, the title/placement/repetition diagnostics, the role's AI-exposure picture, and the resume text. Give concrete, honest advice.
Return ONLY a JSON object. No text/fences.
Format:
{
 "headline": "one line on the biggest gap to close, under 22 words",
 "titleAdvice": "if there is a title mismatch: how to mirror the target job title accurately in the most-recent role - else empty string, under 22 words",
 "placementAdvice": "if skills sit only in a Skills list: how to move the key ones into dated job bullets - else empty string, under 22 words",
 "mustAdd": [{"keyword":"a missing must-have keyword - MUST come from the missing list, do not invent","why":"why it matters here, under 12 words","exampleBullet":"a TEMPLATE bullet to fill in honestly, e.g. 'Did X using Y, measured by Z' - NEVER a fabricated metric or claim"}],   // 0 to 5
 "reframe": [{"from":"a phrasing likely in the resume","to":"a stronger phrasing the screener responds to","why":"under 12 words"}],   // 0 to 4
 "donts": ["a thing NOT to do, under 12 words", ...],   // 0 to 3
 "aiAngle": "one paragraph (under 50 words): how to position yourself as someone who DIRECTS AI on this role's AI-exposed duties, and to lean into the human-led ones AI cannot take"
}
Hard rules: never invent achievements, employers, dates or metrics - exampleBullet values are fill-in-the-blank templates only. Never advise keyword stuffing - cap any skill at 2-3 well-placed mentions; honest, varied, semantically-coherent content beats clever stuffing, and over-optimisation trips the AI co-pilot's anomaly detector. No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(`Role: ${title}
Screening result: verdict ${screenResult ? screenResult.verdict : "?"}; keyword gate ${kwGates.gate2Score}/100; reject reasons: ${screenResult ? (screenResult.rejectReasons || []).join("; ") : ""}; red flags: ${screenResult ? (screenResult.redFlags || []).join("; ") : ""}
Title diagnostic: ${titleCtx || "n/a"}
Placement diagnostic: ${placeCtx || "n/a"}
Repetition diagnostic: ${stuffCtx || "none"}
Must-have keywords the resume is MISSING: ${missing || "(none)"}
This role's AI picture: ${jobAnatomySummary || "n/a"}

Candidate resume text:
${String(resumeText || "").slice(0, 6000)}

Give the advice.`, 1700, 1, SYSTEM_RA);
    const o = extractJSON(raw, "resume-advice");
    if (!o) return null;
    const s = x => String(x || "").replace(/"/g, "").trim();
    const arrS = (x, n) => Array.isArray(x) ? x.map(v => s(v).slice(0, 140)).filter(Boolean).slice(0, n) : [];
    return {
      headline: s(o.headline).slice(0, 240),
      titleAdvice: s(o.titleAdvice).slice(0, 220),
      placementAdvice: s(o.placementAdvice).slice(0, 220),
      mustAdd: (Array.isArray(o.mustAdd) ? o.mustAdd : []).map(m => ({ keyword: s(m && (m.keyword || m.kw)).slice(0, 60), why: s(m && m.why).slice(0, 120), exampleBullet: s(m && m.exampleBullet).slice(0, 220) })).filter(m => m.keyword).slice(0, 5),
      reframe: (Array.isArray(o.reframe) ? o.reframe : []).map(r => ({ from: s(r && r.from).slice(0, 160), to: s(r && r.to).slice(0, 160), why: s(r && r.why).slice(0, 120) })).filter(r => r.from && r.to).slice(0, 4),
      donts: arrS(o.donts, 3),
      aiAngle: s(o.aiAngle).slice(0, 360),
    };
  } catch (_) { return null; }
}

// --- orchestrator: check a pasted resume through the 3 gates + the anomaly check ---
async function checkResume(resumeText, profile, title, jobAnatomy, source, role) {
  const parsed = parseCheck(resumeText);
  const kw = keywordGates(resumeText, profile, parsed);
  const demandedSummary = `required: ${(profile.requiredQuals || []).map(m => m.kw).join(", ") || "n/a"}; key skills: ${(profile.hardSkills || []).map(m => m.kw).slice(0, 18).join(", ")}; soft: ${(profile.softSkills || []).map(m => m.kw).slice(0, 6).join(", ")}${profile.dutyKeywords && profile.dutyKeywords.length ? `; duties: ${profile.dutyKeywords.slice(0, 8).join("; ")}` : ""}${profile.seniority ? `; typical seniority: ${profile.seniority}` : ""}`;
  const jaSummary = (jobAnatomy && !jobAnatomy.fallback && jobAnatomy.layerMix)
    ? `layer mix ${["Activity", "Coordination", "Accountability", "Relational", "Judgment"].filter(L => jobAnatomy.layerMix[L]).map(L => `${L} ${jobAnatomy.layerMix[L]}%`).join("/")}; AI-resilience ${jobAnatomy.aiResilienceScore}/100; AI-exposed duties: ${(jobAnatomy.duties || []).filter(d => d.exposureNow === "MEDIUM" || d.exposureNow === "HIGH").slice(0, 4).map(d => d.text).join("; ")}` : "";
  const screen = await screenResume(title, profile.aiDimensions, demandedSummary, resumeText);
  const anomaly = anomalyCheck(resumeText, kw);
  const scoreVals = screen && screen.scores ? Object.values(screen.scores) : [];
  const aiMean = scoreVals.length ? scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length : kw.gate2Score;
  const overall = Math.round(0.22 * parsed.score + 0.40 * kw.gate2Score + 0.38 * aiMean);
  const band = overall >= 70 ? "likely" : overall >= 45 ? "borderline" : "unlikely";
  const advice = await resumeAdvice(title, screen, kw, jaSummary, resumeText);
  // fire-and-forget: record which required/hard keywords were missing (counts only, no resume text)
  const allMust = [...(profile.requiredQuals || []), ...(profile.hardSkills || [])].map(m => m.kw);
  if (role && allMust.length) {
    const missingSet = new Set([...(kw.tiers.requiredQuals.missing || []), ...(kw.tiers.hardSkills.missing || [])].map(m => m.kw || m));
    fetch("/api/anatomy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      action: "recordGap", role: String(role).trim().toLowerCase(), version: SCREEN_PROFILE_VERSION,
      allMustHaveKws: allMust, missingKws: Array.from(missingSet),
    }) }).catch(() => {});
  }
  return { parsed, kw, screen, anomaly, overall, band, advice };
}

// ===========================================================================
// Role Graph - MyCareersFuture role -> itemised responsibility/requirement
// statements -> inferred work activities/skills/competency signals -> ESCO
// skills -> reverse-mapped ISCO-08 occupations (similarity + trading-style
// weighted scoring) -> an API-ready role-skill graph (nodes = role / occupation
// / skill / responsibility, edges = match strength) + a skill-analysis card.
// Plus CV ingress: a pasted CV -> structured profile -> fit score, skill-gap,
// transferable-skills map across the ISCO-08 families, role-readiness read.
// CV text -> /api/claude only, never stored. Result cached per (title|version).
// ===========================================================================

const ROLE_GRAPH_VERSION = "rg3";
const _roleGraphCache = new Map();

// ‚îÄ‚îÄ Knowledge-Graph slice (KG1) ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
// R005 grep targets: KG_GRAPH_VERSION, KG_VERBS, buildKnowledgeGraph
const KG_GRAPH_VERSION = "kg1";
// Closed verb set - every edge verb MUST be a member of this array (¬ß5).
// No verb may be added without extending this constant and updating the rule table.
const KG_VERBS = ["depends-on", "invokes", "produces", "informs", "mutates", "accountable-to", "competes-with"];
const _kgGraphCache = new Map();
// ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ

const RG_NODE_STYLE = {
  mcfRole:        { label:"MyCareersFuture role", color:"#1e40af", bg:"#dbeafe", border:"#93c5fd" },
  iscoOccupation: { label:"ISCO-08 occupation",   color:"#5b21b6", bg:"#ede9fe", border:"#c4b5fd" },
  escoSkill:      { label:"ESCO skill",            color:"#0e7490", bg:"#cffafe", border:"#67e8f9" },
  responsibility: { label:"Responsibility",        color:"#b45309", bg:"#fef3c7", border:"#fcd34d" },
};
const RG_EDGE_COLOR = { "role-responsibility":"#d97706", "role-occupation":"#6366f1", "role-skill":"#0891b2", "occupation-skill":"#8b5cf6", "skill-responsibility":"#d97706" };
// D (graph<->JD link): a colourblind-safe rotation (blue/orange/cyan/violet/amber/teal - no red/green).
// The NUMBER [n] is the unique link key; colour is only a visual assist (it repeats past 6 items, which
// is exactly why the number leads - honouring the red-green requirement). Same n -> same hue on both
// the graph node badge and the JD-panel list, so a reader links by either.
const _RG_LINK_HUES = ["#1e40af", "#d97706", "#0e7490", "#4f46e5", "#b45309", "#0f766e"];
function _respNum(nodeId) { const m = /^resp:r(\d+)$/.exec(String(nodeId || "")); return m ? Number(m[1]) : null; }
function _respHue(n) { return _RG_LINK_HUES[((Number(n) || 1) - 1) % _RG_LINK_HUES.length]; }
function _rgSlug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "x"; }

// Verbatim duty-like lines pulled straight from the analysed posting's own text -
// used only when the aggregate MCF corpus for this title comes back too thin to
// build the Job Graph, so a posting-mode analysis still resolves to real duties
// instead of an avoidable "not enough data" stall on an ad that has plenty.
function postingStatementsFromText(posting) {
  const raw = String((posting && posting.text) || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;|&quot;|&#39;/g, " ")
    .replace(/[‚Ä¢¬∑‚óè‚ñ™‚Ä£‚ÅÉ|]/g, "\n")
    .replace(/\r/g, "");
  const seen = new Set();
  const out = [];
  raw.split(/[\n.;]+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 18 && s.length <= 160 && /[a-z]/i.test(s) && /\s/.test(s))
    .forEach((line, i) => {
      const key = line.toLowerCase().slice(0, 60);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ id: "p" + i, text: line, cat: "posting", level: "HUMAN", sk: [] });
    });
  return out.slice(0, 12);
}

// 1) deterministic: pull the itemised responsibility statements the rest of the analysis already produced
function gatherStatements(result, posting) {
  const rd = result && result.responsibilitiesData;
  const ja = result && result.jobAnatomy;
  let resp = [];
  if (rd && Array.isArray(rd.responsibilities) && rd.responsibilities.length) {
    resp = rd.responsibilities.map((r, i) => ({ id: "r" + (r.n != null ? r.n : i), text: String(r.text || "").trim(), cat: r.cat || "", level: r.level || "HUMAN", sk: Array.isArray(r.sk) ? r.sk : [] })).filter(r => r.text);
  } else if (ja && !ja.fallback && Array.isArray(ja.duties) && ja.duties.length) {
    resp = ja.duties.map((d, i) => ({ id: "d" + (d.n != null ? d.n : i), text: String(d.text || "").trim(), cat: d.layer || "", level: d.exposureNow || "HUMAN", sk: [] })).filter(r => r.text);
  }
  if (resp.length < 3 && posting && posting.text) {
    const fromAd = postingStatementsFromText(posting);
    if (fromAd.length) resp = fromAd;
  }
  return { responsibilities: resp.slice(0, 22) };
}

// 2) LLM: infer the role's requirements/qualifications/preferred competencies + per-statement activities/skills/signals (one batched call)
async function analyseRolePipeline(title, statements, skills) {
  if (!statements.length) return null;
  const list = statements.map((s, i) => `${i + 1}. ${s.text}`).join("\n").slice(0, 4600);
  const skillHint = (skills || []).map(s => s.skill).filter(Boolean).slice(0, 30).join(", ");
  const SYS_RP =
`ACT AS a job-analysis engine. Given a job title and its itemised responsibility statements, infer (a) the role's likely hard REQUIREMENTS, formal QUALIFICATIONS (degree/licence/certification) and PREFERRED competencies, and (b) for EACH numbered responsibility, the underlying work activities, the skills it implies, and the competency signals it sends to an employer. Singapore context. Output labels only - no prose, no advice, no rewriting.
Return ONLY a JSON object. No text/fences.
Format:
{
 "requirements": ["short hard-requirement phrase", ...],            // 2 to 6
 "qualifications": ["short formal-qualification phrase", ...],       // 0 to 5
 "preferredCompetencies": ["short preferred-competency phrase", ...],// 0 to 6
 "statements": [{"i":1,"activities":["short work-activity phrase", ...],"skills":["short skill phrase", ...],"signals":["short competency-signal phrase", ...]}]   // one object per numbered statement; activities 1-4, skills 1-4, signals 0-3
}
No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(`Job title: ${title}\nKnown ESCO skills (hints, not exhaustive): ${skillHint || "none"}\nResponsibility statements:\n${list}\n\nAnalyse.`, 2800, 1, SYS_RP);
    const o = extractJSON(raw, "role-pipeline");
    if (!o) return null;
    const ss = x => String(x || "").replace(/"/g, "").trim();
    const arrS = (x, n, len) => Array.isArray(x) ? x.map(v => ss(v).slice(0, len || 80)).filter(Boolean).slice(0, n) : [];
    const stmtMap = {};
    (Array.isArray(o.statements) ? o.statements : []).forEach(st => { const idx = Number(st && st.i); if (!Number.isFinite(idx)) return; stmtMap[idx] = { activities: arrS(st.activities, 4, 90), skills: arrS(st.skills, 4, 70), signals: arrS(st.signals, 3, 80) }; });
    return { requirements: arrS(o.requirements, 6, 80), qualifications: arrS(o.qualifications, 5, 80), preferredCompetencies: arrS(o.preferredCompetencies, 6, 80), statements: stmtMap };
  } catch (_) { return null; }
}

// 3) deterministic: map each responsibility statement to the role's ESCO skills (its own sk[] links + token-matched inferred skill phrases)
function mapStatementsToEsco(statements, analysed, skills) {
  const sk = skills || [];
  const byN = {}; sk.forEach((s, idx) => { if (s && s.n != null) byN[s.n] = idx; });
  const skNorm = sk.map(s => _phraseNorm(s.skill));
  const skToks = sk.map(s => _phraseToks(s.skill));
  const edges = []; const seen = new Set();
  const pushEdge = (respId, idx, strength) => { if (idx == null || idx < 0) return; const k = respId + "|" + idx; if (seen.has(k)) return; seen.add(k); edges.push({ respId, skillIdx: idx, strength }); };
  statements.forEach((st, i) => {
    (st.sk || []).forEach(n => { if (byN[n] != null) pushEdge(st.id, byN[n], 1); });
    const inf = (analysed && analysed.statements && analysed.statements[i + 1]) || null;
    (inf ? inf.skills : []).forEach(p => {
      const pn = _phraseNorm(p), pt = _phraseToks(p);
      if (!pn) return;
      let bi = -1, bs = 0;
      for (let j = 0; j < sk.length; j++) {
        if (skNorm[j] && (skNorm[j] === pn || (pn.length > 4 && skNorm[j].includes(pn)) || (skNorm[j].length > 4 && pn.includes(skNorm[j])))) { bi = j; bs = 1; break; }
        const sh = pt.length ? pt.filter(t => skToks[j].includes(t)).length : 0;
        if (sh >= 2 && bs < 1) { bi = j; bs = 0.6; }
      }
      if (bi >= 0) pushEdge(st.id, bi, bs);
    });
  });
  return { edges, usedSkillIdxs: Array.from(new Set(edges.map(e => e.skillIdx))) };
}

// 5) deterministic: trading-algorithm-style scoring of the reverse-mapped ISCO-08 candidates
function scoreIscoCandidates(fp, skills, mapping, statements) {
  const cand = (fp && fp.candidates) || [];
  if (!cand.length) return [];
  const sk = skills || [];
  const respSkillNames = {}; statements.forEach(st => { respSkillNames[st.id] = new Set(); });
  mapping.edges.forEach(e => { const s = sk[e.skillIdx]; if (s && respSkillNames[e.respId]) respSkillNames[e.respId].add(_phraseNorm(s.skill)); });
  const totalResp = statements.length || 1;
  const scored = cand.map(c => {
    const matched = (c.matchedSkills || []).map(_phraseNorm).filter(Boolean);
    const matchedSet = new Set(matched);
    const skillProximity = Math.max(0, Math.min(1, c.ratio || 0));
    let respHit = 0;
    statements.forEach(st => { for (const n of (respSkillNames[st.id] || [])) { if (matchedSet.has(n) || matched.some(m => m.includes(n) || n.includes(m))) { respHit++; break; } } });
    const responsibilityOverlap = respHit / totalResp;
    const confidence = Math.max(0, Math.min(1, (c.matchCount || 0) / 8)) * ((c.essentialCount || 0) >= 5 ? 1 : 0.7);
    let composite = 0.45 * skillProximity + 0.35 * responsibilityOverlap + 0.20 * confidence;
    if (c.isNominal) composite = Math.min(1, composite + 0.05);
    return {
      uri: c.uri, label: toTitleCase(c.label || ""), code: c.code || "", iscoMajor: c.iscoMajor != null ? c.iscoMajor : null,
      essentialCount: c.essentialCount || 0, matchCount: c.matchCount || 0, matchedSkills: (c.matchedSkills || []).slice(0, 12), isNominal: !!c.isNominal,
      skillProximity: Math.round(skillProximity * 100), responsibilityOverlap: Math.round(responsibilityOverlap * 100), confidence: Math.round(confidence * 100), score: Math.round(composite * 100),
    };
  }).sort((a, b) => b.score - a.score || b.matchCount - a.matchCount || a.label.localeCompare(b.label));
  // Deterministic confidence floor: drop clear cross-domain noise (very low
  // composite score - e.g. "Sports Coach 4" / "Survival Instructor 4" for a
  // Transformation Manager) from the ISCO reverse-map so it isn't shown beside
  // genuine matches. Always keep at least the top 3 so the map never empties.
  const FLOOR = 10;
  const strong = scored.filter(c => c.score >= FLOOR);
  return (strong.length >= 3 ? strong : scored.slice(0, 3)).slice(0, 10);
}

// 6) deterministic: assemble the API-ready node/edge graph (capped for legibility) + the layer arrays the viz uses
function buildGraphStructure(title, source, statements, skills, mapping, iscoCandidates) {
  const sk = skills || [];
  const usedSet = new Set(mapping.usedSkillIdxs);
  const edgeCount = {}; mapping.edges.forEach(e => { edgeCount[e.skillIdx] = (edgeCount[e.skillIdx] || 0) + 1; });
  const candNorm = new Set(); iscoCandidates.forEach(c => (c.matchedSkills || []).forEach(m => candNorm.add(_phraseNorm(m))));
  const skillRank = sk.map((s, idx) => ({ idx, used: usedSet.has(idx) ? 1 : 0, ec: edgeCount[idx] || 0, inCand: candNorm.has(_phraseNorm(s.skill)) ? 1 : 0 }));
  skillRank.sort((a, b) => (b.used - a.used) || (b.ec - a.ec) || (b.inCand - a.inCand));
  const topSkillIdx = skillRank.slice(0, 16).map(r => r.idx);
  const topSkillSet = new Set(topSkillIdx);
  const respRank = statements.map(st => ({ st, ec: mapping.edges.filter(e => e.respId === st.id).length })).sort((a, b) => b.ec - a.ec);
  const topResp = respRank.slice(0, 14).map(r => r.st);
  const topRespSet = new Set(topResp.map(r => r.id));
  const topIsco = iscoCandidates.slice(0, 8);

  const roleId = "role:" + _rgSlug(title);
  const iscoIdOf = c => "isco:" + (c.code ? c.code : _rgSlug(c.label));
  const skillIdOf = (s, idx) => "esco:" + (s.escoUri ? _rgSlug(String(s.escoUri).split("/").pop()) : "n" + (s.n != null ? s.n : idx));

  const nodes = [{ id: roleId, type: "mcfRole", label: toTitleCase(title), source: source || "esco" }];
  topIsco.forEach(c => nodes.push({ id: iscoIdOf(c), type: "iscoOccupation", label: c.label, code: c.code || "", iscoMajor: c.iscoMajor, score: c.score }));
  const skillNodeIdByIdx = {}, skillNodeIdByNorm = {};
  topSkillIdx.forEach(idx => { const s = sk[idx]; const id = skillIdOf(s, idx); skillNodeIdByIdx[idx] = id; skillNodeIdByNorm[_phraseNorm(s.skill)] = id; nodes.push({ id, type: "escoSkill", label: s.skill, escoUri: s.escoUri || "", skillType: s.skillType || s.type || "", level: s.level || "HUMAN" }); });
  topResp.forEach(st => nodes.push({ id: "resp:" + st.id, type: "responsibility", label: st.text, cat: st.cat || "", level: st.level || "HUMAN" }));

  const edges = [];
  const addE = (s, t, w, kind) => { if (!s || !t) return; edges.push({ source: s, target: t, weight: Math.round(Math.max(0.05, Math.min(1, w)) * 100) / 100, kind }); };
  // the MCF posting's OWN roles & responsibilities branch straight off the role (left side)
  topResp.forEach(st => addE(roleId, "resp:" + st.id, st.level === "HIGH" ? 1 : st.level === "MEDIUM" ? 0.8 : 0.65, "role-responsibility"));
  topIsco.forEach(c => addE(roleId, iscoIdOf(c), c.score / 100, "role-occupation"));
  topSkillIdx.forEach(idx => { const s = sk[idx]; const lw = s.level === "HIGH" ? 1 : s.level === "MEDIUM" ? 0.8 : s.level === "LOW" ? 0.65 : 0.5; addE(roleId, skillNodeIdByIdx[idx], lw, "role-skill"); });
  topIsco.forEach(c => { const cid = iscoIdOf(c); (c.matchedSkills || []).forEach(m => { const pn = _phraseNorm(m); let nid = skillNodeIdByNorm[pn]; let w = 1; if (!nid) { const hit = Object.keys(skillNodeIdByNorm).find(k => k.length > 3 && (k.includes(pn) || pn.includes(k))); if (hit) { nid = skillNodeIdByNorm[hit]; w = 0.6; } } if (nid) addE(cid, nid, w, "occupation-skill"); }); });
  mapping.edges.forEach(e => { if (!topSkillSet.has(e.skillIdx) || !topRespSet.has(e.respId)) return; addE(skillNodeIdByIdx[e.skillIdx], "resp:" + e.respId, e.strength, "skill-responsibility"); });

  return {
    nodes, edges, columns: ["responsibility", "mcfRole", "iscoOccupation", "escoSkill"], version: ROLE_GRAPH_VERSION, generatedAt: new Date().toISOString(),
    stats: { roles: 1, occupations: topIsco.length, skills: topSkillIdx.length, responsibilities: topResp.length, edges: edges.length },
  };
}

// 7) LLM: the skill-analysis card - what the role actually means; work performed, skills required, adjacent roles, capability gaps
async function narrateRoleGraph(title, summary) {
  const SYS_NG =
`ACT AS a careers analyst. You are given a structured decomposition of one job role: its top responsibilities, the ESCO skills they map to, the ISCO-08 occupations it most resembles (with similarity scores), and its AI-exposure mix. Write a grounded analysis - never invent numbers, only interpret the ones given. Singapore context. Humble, plain, no hype.
Return ONLY a JSON object. No text/fences.
Format:
{
 "whatTheRoleReallyIs": "2 sentences on what this role actually is in terms of work performed, under 45 words",
 "workPerformed": ["short phrase naming a core kind of work this role does", ...],   // 3 to 6
 "skillsRequired": ["short phrase naming a capability the role demands", ...],        // 3 to 7
 "adjacentRoles": [{"role":"an occupation label from the input","why":"why it is adjacent, under 14 words"}],   // 2 to 4, drawn from the ISCO candidates given
 "capabilityGaps": ["a capability commonly under-evidenced for this role, under 14 words", ...]   // 2 to 4
}
No quote characters inside any string value.`;
  try {
    const raw = await claudeCall(`Role: ${title}\n${summary}\n\nWrite the analysis.`, 1100, 1, SYS_NG);
    const o = extractJSON(raw, "rolegraph-narrative");
    if (!o) return null;
    const ss = x => String(x || "").replace(/"/g, "").trim();
    const arrS = (x, n, len) => Array.isArray(x) ? x.map(v => ss(v).slice(0, len || 90)).filter(Boolean).slice(0, n) : [];
    return {
      whatTheRoleReallyIs: ss(o.whatTheRoleReallyIs).slice(0, 320),
      workPerformed: arrS(o.workPerformed, 6, 70), skillsRequired: arrS(o.skillsRequired, 7, 70),
      adjacentRoles: (Array.isArray(o.adjacentRoles) ? o.adjacentRoles : []).map(r => ({ role: ss(r && r.role).slice(0, 80), why: ss(r && r.why).slice(0, 110) })).filter(r => r.role).slice(0, 4),
      capabilityGaps: arrS(o.capabilityGaps, 4, 110),
    };
  } catch (_) { return null; }
}

// orchestrator. onStep(n) (optional) is called before each of the 6 advertised
// pipeline steps (1..6) and once more (7) when the graph + card are assembled - see
// _RG_STEPS / RoleGraphStepCard for the labels surfaced to the user.
async function buildRoleGraph(result, title, onStep, posting) {
  const step = n => { try { onStep && onStep(n); } catch (_) {} };
  const roleKey = String(title || "").trim().toLowerCase();
  // Cache key includes the posting uuid (when present) - two different ads under the
  // same title must not silently share a graph built from one ad's fallback duties.
  const cacheKey = `${roleKey}|${(result && result.source) || "esco"}|${ROLE_GRAPH_VERSION}|${(posting && posting.uuid) || ""}`;
  if (_roleGraphCache.has(cacheKey)) { step(7); return _roleGraphCache.get(cacheKey); }
  const skills = (result && result.skills) || [];
  step(1);                                                  // ingest posting + extract responsibilities/requirements/quals/competencies
  const { responsibilities } = gatherStatements(result || {}, posting);
  step(2);                                                  // structure into itemised responsibility/requirement statements
  if (!skills.length || responsibilities.length < 3) return { fallback: true, reason: "thin_input" }; // not cached - responsibilities/anatomy may still be loading
  step(3);                                                  // analyse each statement -> infer activities/tasks/skills/competency signals
  const analysed = await analyseRolePipeline(title, responsibilities, skills);
  step(4);                                                  // map each inferred responsibility -> ESCO skills
  const mapping = mapStatementsToEsco(responsibilities, analysed, skills);
  step(5);                                                  // reverse-map ESCO skills -> likely ISCO-08 occupations (similarity + weighted matching)
  let fp = null;
  try { fp = await getRoleMixCandidates(title || "", skills, ((result && result.responsibilitiesData && result.responsibilitiesData.jobs) || []).flatMap(j => (j.skills || [])).slice(0, 20)); } catch (_) { fp = null; }
  step(6);                                                  // trading-algorithm-style scoring to rank ISCO-08 roles vs the selected MCF role
  const iscoCandidates = scoreIscoCandidates(fp, skills, mapping, responsibilities);
  const graph = buildGraphStructure(title, (result && result.source) || "esco", responsibilities, skills, mapping, iscoCandidates);
  // AI-exposure mix from the role's skills
  const lc = { HIGH: 0, MEDIUM: 0, LOW: 0, HUMAN: 0 }; skills.forEach(s => { if (lc[s.level] !== undefined) lc[s.level]++; });
  const tot = skills.length || 1;
  const aiMix = { aiExposedPct: Math.round(((lc.HIGH + lc.MEDIUM) / tot) * 100), humanPct: Math.round((lc.HUMAN / tot) * 100) };
  const topIscoLine = iscoCandidates.slice(0, 6).map(c => `${c.label} (score ${c.score}/100; skill-proximity ${c.skillProximity}%, responsibility-overlap ${c.responsibilityOverlap}%${c.isNominal ? "; matches the posted title" : ""})`).join("\n");
  const topRespLine = graph.nodes.filter(n => n.type === "responsibility").slice(0, 10).map(n => `- ${n.label}`).join("\n");
  const topSkillLine = graph.nodes.filter(n => n.type === "escoSkill").slice(0, 14).map(n => n.label).join(", ");
  const summary = `Top responsibilities:\n${topRespLine}\nESCO skills these map to: ${topSkillLine}\nClosest ISCO-08 occupations:\n${topIscoLine}\nAI-exposure mix: ${aiMix.aiExposedPct}% of skills AI-augmentable/automatable, ${aiMix.humanPct}% human-led.${analysed && analysed.requirements.length ? `\nInferred requirements: ${analysed.requirements.join(", ")}` : ""}`;
  const narrative = await narrateRoleGraph(title, summary);
  const out = { fallback: false, title: toTitleCase(title || ""), source: (result && result.source) || "esco", statements: responsibilities, analysed, mapping, iscoCandidates, graph, aiMix, narrative, fpFallback: !fp || fp.fallback };
  _roleGraphCache.set(cacheKey, out);
  step(7);
  return out;
}

// ‚îÄ‚îÄ KG1: buildKnowledgeGraph ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
// Pure deterministic builder. No LLM, no fetch. Same result -> byte-identical
// {nodes, edges, clusters} (generatedAt varies and is excluded from snapshots).
// Reuses: gatherStatements, mapStatementsToEsco, _phraseNorm, _phraseToks,
//         _rgSlug, result.skills, result.escoOccupation, result.responsibilitiesData
//
// ¬ß5 verb rule table (source-type, target-type -> verb):
//   duty -> skill          : depends-on  (duty draws on that skill)
//   role -> duty           : invokes     (role activates the duty)
//   duty -> organisation   : mutates     (duty carries an org-change marker)
//   skill -> occupation    : informs     (skill is evidence for ISCO match)
//   duty -> qualification  : produces    (duty text contains an output marker)
//   individual -> department: accountable-to (scope hierarchy, if dept node present)
//   occupation -> mirror-occupation: competes-with (only when mirrorRoles present)
//
// ¬ß6 cluster honesty:
//   individual  - always present (duty/skill/qualification nodes)
//   department  - present if a function/team marker or occupation node grounds it
//   organisation - present only if the posting names the org
//   competition  - present only if result already carries computed mirrorRoles
//
// ¬ß7 node schema: { id, type, cluster, label, source, confidence, level?, ref? }
// ¬ß7 edge schema: { source, target, verb, weight, source_tag }
// ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ

// Output-marker stems: a duty containing one of these produces a deliverable node.
const _KG_OUTPUT_STEMS = ["report", "plan", "strategy", "framework", "roadmap", "policy", "brief", "proposal", "dashboard", "model", "assessment", "review"];
// Org-change marker stems: a duty containing one of these mutates an org node.
const _KG_ORG_CHANGE_STEMS = ["transform", "improve", "redesign", "implement", "lead", "change", "reform", "drive", "build", "establish", "develop", "create", "deploy", "rollout", "execute"];
// Department/function marker stems: a duty or occupation containing one of these grounds a dept node.
const _KG_DEPT_STEMS = ["team", "function", "division", "department", "group", "unit", "centre", "center", "office", "bureau", "branch", "section", "platform", "practice", "programme", "program"];

function _kgContainsAny(text, stems) {
  const t = _phraseNorm(text);
  return stems.some(s => t.includes(s));
}

function buildKnowledgeGraph(result, title, posting) {
  const generatedAt = new Date().toISOString();

  // ‚îÄ‚îÄ 1. Entity extraction ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ

  // 1a. Role node (verbatim title; source always "mcf" because the role comes from MCF)
  const roleId = "role:" + _rgSlug(String(title || ""));
  const roleNode = {
    id: roleId,
    type: "role",
    cluster: "department",
    label: String(title || ""),
    source: "mcf",
    confidence: "high",
  };

  // 1b. Duty nodes from gatherStatements (verbatim text from MCF/analysis)
  const { responsibilities: duties } = gatherStatements(result || {}, posting);
  const dutyNodes = duties.map((d) => ({
    id: "duty:" + d.id,
    type: "duty",
    cluster: "individual",
    label: d.text,
    source: "mcf",
    confidence: "high",
    level: d.level || "HUMAN",
    ref: {},
  }));

  // 1c. Skill nodes from result.skills (verbatim ESCO skill names)
  const skills = (result && result.skills) || [];
  const skillNodes = skills.map((s, idx) => ({
    id: "skill:" + (s.escoUri ? _rgSlug(String(s.escoUri).split("/").pop()) : "n" + (s.n != null ? s.n : idx)),
    type: "skill",
    cluster: "individual",
    label: String(s.skill || ""),
    source: "esco",
    confidence: s.level === "HIGH" ? "high" : s.level === "MEDIUM" ? "medium" : "low",
    level: s.level || "HUMAN",
    ref: { escoUri: s.escoUri || "" },
  })).filter((n) => n.label);

  // 1d. Occupation node(s) from result.escoOccupation (verbatim ESCO label)
  const escoOcc = result && result.escoOccupation;
  const occNodes = [];
  if (escoOcc && (escoOcc.preferredLabel || escoOcc.label)) {
    occNodes.push({
      id: "occupation:" + _rgSlug(escoOcc.preferredLabel || escoOcc.label || ""),
      type: "occupation",
      cluster: "department",
      label: String(escoOcc.preferredLabel || escoOcc.label || ""),
      source: "esco",
      confidence: "medium",
      ref: { iscoCode: escoOcc.isco || escoOcc.iscoCode || "" },
    });
  }

  // 1e. Qualification nodes from parseJobAd req-kind sections (verbatim phrases only)
  const qualNodes = [];
  const rd = result && result.responsibilitiesData;
  const adJobs = (rd && Array.isArray(rd.jobs)) ? rd.jobs : [];
  const adJob = adJobs.find((j) => j && (j.description || j.responsibilitiesText)) || adJobs[0] || null;
  if (adJob) {
    const adText = String(adJob.description || adJob.responsibilitiesText || "");
    const stripped = adText.replace(/<[^>]+>/g, " ").replace(/\r/g, "").trim();
    try {
      const sections = parseJobAd(stripped);
      const reqSections = sections.filter((s) => s.kind === "req");
      const seenQ = new Set();
      reqSections.forEach((sec) => {
        sec.blocks.forEach((b) => {
          if (b.t !== "li" && b.t !== "p") return;
          const phrase = String(b.text || "").trim().slice(0, 120);
          if (!phrase || phrase.length < 8) return;
          const key = _phraseNorm(phrase).slice(0, 60);
          if (seenQ.has(key)) return;
          seenQ.add(key);
          qualNodes.push({
            id: "qual:" + _rgSlug(phrase),
            type: "qualification",
            cluster: "individual",
            label: phrase,
            source: "mcf",
            confidence: "high",
            ref: {},
          });
        });
      });
    } catch (_) { /* parseJobAd failure - omit qual nodes */ }
  }
  // Cap qualifications to 8 to keep the graph legible
  const cappedQualNodes = qualNodes.slice(0, 8);

  // 1f. Organisation node - ONLY if the posting names the org (verbatim from metadata)
  const orgNodes = [];
  let orgNodeId = null;
  const employer = (adJob && (adJob.hiringCompanyName || adJob.postedCompanyName || adJob.employer)) || null;
  if (employer) {
    orgNodeId = "org:" + _rgSlug(employer);
    orgNodes.push({
      id: orgNodeId,
      type: "organisation",
      cluster: "organisation",
      label: employer,
      source: "mcf",
      confidence: "high",
      ref: {},
    });
  }

  // 1g. Mirror-occupation nodes - ONLY if result already carries computed mirrorRoles
  // (engine mirrorRoles: [{ isco, title, sharePct, index, band, zRange }])
  const mirrorNodes = [];
  const mirrorRoles = result && result.mirrorRoles;
  if (Array.isArray(mirrorRoles) && mirrorRoles.length) {
    mirrorRoles.slice(0, 4).forEach((m) => {
      if (!m || !m.title) return;
      mirrorNodes.push({
        id: "mirror:" + _rgSlug(String(m.title || "") + (m.isco || "")),
        type: "mirror-occupation",
        cluster: "competition",
        label: String(m.title || ""),
        source: "computed",
        confidence: m.sharePct >= 30 ? "high" : m.sharePct >= 15 ? "medium" : "low",
        ref: { iscoCode: String(m.isco || "") },
      });
    });
  }

  // ‚îÄ‚îÄ 2. Semantic clustering (honesty-gated) ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ

  // Department cluster grounding: check if any duty or occupation mentions a team/function
  const hasDeptMarker =
    duties.some((d) => _kgContainsAny(d.text, _KG_DEPT_STEMS)) ||
    occNodes.some((n) => _kgContainsAny(n.label, _KG_DEPT_STEMS));

  // Organisation cluster: grounded only if org node was created
  const hasOrgCluster = orgNodes.length > 0;

  // Competition cluster: grounded only if mirrorRoles present
  const hasCompetitionCluster = mirrorNodes.length > 0;

  // Mutates-target: check if any duty carries an org-change marker AND we have an org node
  const orgChangeDuties = orgNodeId
    ? duties.filter((d) => _kgContainsAny(d.text, _KG_ORG_CHANGE_STEMS))
    : [];

  // Re-cluster duty nodes: those with org-change markers that point to an org node
  // keep cluster "individual" (the individual performs the action) but also get a
  // "mutates" edge to the org node. No cluster change needed (an individual act
  // can have org-level impact).

  // Department cluster: assign role node and occupation nodes to "department"
  // (already set above). If no dept marker at all, downgrade occ nodes to "unscoped".
  const adjustedOccNodes = occNodes.map((n) => ({
    ...n,
    cluster: hasDeptMarker ? "department" : "unscoped",
  }));

  // ‚îÄ‚îÄ 3. Relational mapping (verb rule table ¬ß5) ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ

  const edges = [];

  // Build duty-to-skill edges using mapStatementsToEsco (reuse existing logic)
  // mapStatementsToEsco returns { edges: [{respId, skillIdx, strength}], usedSkillIdxs }
  // respId matches d.id from gatherStatements (e.g. "r3"), skillIdx is the index in skills[]
  const mapping = mapStatementsToEsco(duties, null, skills);
  // Map skills[] index to KG node id (parallel to skillNodes array)
  const skillIdxToNodeId = {};
  skills.forEach((_s, i) => { skillIdxToNodeId[i] = skillNodes[i] ? skillNodes[i].id : null; });

  // 3a. role -> duty: invokes
  dutyNodes.forEach((dn) => {
    const weight = dn.level === "HIGH" ? 1.0 : dn.level === "MEDIUM" ? 0.8 : 0.65;
    edges.push({ source: roleId, target: dn.id, verb: "invokes", weight, source_tag: "computed" });
  });

  // 3b. duty -> skill: depends-on (from mapStatementsToEsco edges)
  mapping.edges.forEach((e) => {
    const dutyId = "duty:" + e.respId;
    const skillId = skillIdxToNodeId[e.skillIdx];
    if (!skillId) return;
    // Verify the duty node exists
    if (!dutyNodes.find((d) => d.id === dutyId)) return;
    edges.push({
      source: dutyId,
      target: skillId,
      verb: "depends-on",
      weight: Math.round(Math.max(0.05, Math.min(1, e.strength)) * 100) / 100,
      source_tag: "computed",
    });
  });

  // 3c. skill -> occupation: informs. Every resolved ESCO skill is evidence for the
  // occupation match (the skills come from the role's ESCO resolution), so each skill
  // node informs the occupation DIRECTLY - not gated on the duty mapping (which is empty
  // when a role resolves skills but no duties). This keeps the graph wired for skills-only
  // roles; the dedup + verb-closure passes below still apply. (KG3 fix)
  if (adjustedOccNodes.length) {
    const occId = adjustedOccNodes[0].id;
    skillNodes.forEach((sn) => {
      edges.push({ source: sn.id, target: occId, verb: "informs", weight: 0.7, source_tag: "derived" });
    });
  }

  // 3d. duty -> organisation: mutates (for duties with org-change markers)
  if (orgNodeId) {
    orgChangeDuties.forEach((d) => {
      edges.push({ source: "duty:" + d.id, target: orgNodeId, verb: "mutates", weight: 0.8, source_tag: "derived" });
    });
  }

  // 3e. duty -> qualification: produces (for duties whose text contains an output marker)
  // We match duty text to qual nodes by output-stem presence in the duty text.
  // Only emit when the duty text and qual phrase share a token overlap.
  const qualToks = cappedQualNodes.map((q) => _phraseToks(q.label));
  dutyNodes.forEach((dn) => {
    if (!_kgContainsAny(dn.label, _KG_OUTPUT_STEMS)) return;
    const dToks = new Set(_phraseToks(dn.label));
    cappedQualNodes.forEach((qn, qi) => {
      const shared = qualToks[qi].filter((t) => dToks.has(t)).length;
      if (shared >= 1) {
        edges.push({ source: dn.id, target: qn.id, verb: "produces", weight: 0.6, source_tag: "derived" });
      }
    });
  });

  // 3f. role/department -> organisation: accountable-to (scope hierarchy)
  if (orgNodeId && hasDeptMarker) {
    edges.push({ source: roleId, target: orgNodeId, verb: "accountable-to", weight: 0.9, source_tag: "derived" });
  }

  // 3g. occupation -> mirror-occupation: competes-with (ONLY if mirrorRoles present)
  if (adjustedOccNodes.length && mirrorNodes.length) {
    const occId = adjustedOccNodes[0].id;
    mirrorNodes.forEach((mn) => {
      edges.push({ source: occId, target: mn.id, verb: "competes-with", weight: 0.5, source_tag: "computed" });
    });
  }

  // ‚îÄ‚îÄ 4. Verify verb closure: every edge verb must be in KG_VERBS ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
  // (defensive - the rule table above is closed; this is a runtime guard)
  const verbSet = new Set(KG_VERBS);
  const filteredEdges = edges.filter((e) => verbSet.has(e.verb));

  // ‚îÄ‚îÄ 5. De-duplicate edges (same source+target+verb) ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
  const edgeSeen = new Set();
  const dedupEdges = filteredEdges.filter((e) => {
    const k = e.source + "|" + e.target + "|" + e.verb;
    if (edgeSeen.has(k)) return false;
    edgeSeen.add(k);
    return true;
  });

  // ‚îÄ‚îÄ 6. Assemble nodes (deterministic sort: type then id) ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
  const allNodes = [
    roleNode,
    ...dutyNodes.sort((a, b) => a.id.localeCompare(b.id)),
    ...skillNodes.sort((a, b) => a.id.localeCompare(b.id)),
    ...adjustedOccNodes,
    ...cappedQualNodes.sort((a, b) => a.id.localeCompare(b.id)),
    ...orgNodes,
    ...mirrorNodes,
  ];

  // ‚îÄ‚îÄ 7. Cluster manifest (honesty-gated ¬ß6) ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
  const withheld = [];
  const clusters = [
    { id: "individual",   label: "Individual",   present: true },
    { id: "department",   label: "Department",   present: !!(hasDeptMarker || roleNode) },
    { id: "organisation", label: "Organisation", present: hasOrgCluster },
    { id: "competition",  label: "Competition",  present: hasCompetitionCluster },
  ];
  if (!hasOrgCluster) withheld.push("organisation: hiring organisation not named in posting metadata");
  if (!hasCompetitionCluster) withheld.push("competition: no computed mirror-role data in result");
  if (!hasDeptMarker) withheld.push("department: no function/team marker found - role node kept in department cluster by position");

  const presentCount = clusters.filter((c) => c.present).length;

  return {
    nodes: allNodes,
    edges: dedupEdges,
    clusters,
    version: KG_GRAPH_VERSION,
    generatedAt,
    stats: { nodes: allNodes.length, edges: dedupEdges.length, clustersPresent: presentCount },
    withheld,
  };
}

// Thin cached accessor - mirrors the _roleGraphCache idiom.
// Cache key: KG_GRAPH_VERSION + role key + result.source
// The cache holds the full payload; generatedAt is regenerated on cache miss only.
function getKnowledgeGraph(result, title, posting) {
  const roleKey = String(title || "").trim().toLowerCase();
  // Cache key includes the posting uuid (when present) - two different ads under the
  // same title must not silently share a graph built from one ad's fallback duties.
  const cacheKey = KG_GRAPH_VERSION + "|" + roleKey + "|" + ((result && result.source) || "esco") + "|" + ((posting && posting.uuid) || "");
  if (_kgGraphCache.has(cacheKey)) return _kgGraphCache.get(cacheKey);
  const payload = buildKnowledgeGraph(result, title, posting);
  _kgGraphCache.set(cacheKey, payload);
  return payload;
}
// ‚îÄ‚îÄ End KG1 ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ

// ‚îÄ‚îÄ SSOCRG: SSOC-grounded SECOND role-graph (deterministic; Singapore-first; NO LLM in this path).
// The ESCO layered/knowledge graphs (frozen) resolve by a blind ESCO title top-hit and mis-map SG
// roles (live: "Sales Assistant Manager" -> ISCO "Communication Scientist" + academic-research
// skills). This additive graph instead resolves the occupation via the deterministic SSOC 2024
// classifier (api/ssoc classifyTitles - the fixed one that nailed Auxiliary Police Officer 54123),
// crosswalks SSOC -> ISCO -> ESCO for skills anchored on the RIGHT occupation, reuses the verbatim
// MCF duties, and renders via the existing KGGraph as an opt-in third graphMode. See
// v3-ssoc-rolegraph-spec.md. Withhold over guess; every node keeps its source.
async function fetchSsocOccupation(title) {
  try {
    const res = await fetch("/api/ssoc", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "classifyTitles", jobs: [{ id: "role", title: String(title || "") }] }) });
    if (!res.ok) return null;
    const data = await res.json();
    return (Array.isArray(data.classifications) && data.classifications[0]) || null;
  } catch (_) { return null; }
}
async function buildSsocGraph(result, title, posting) {
  const cls = await fetchSsocOccupation(title);
  if (!cls || cls.status !== "classified" || !cls.node) return { fallback: true, reason: (cls && cls.reason) || "ssoc_withheld" };
  const node = cls.node, hier = cls.hierarchy || {};
  // SSOC -> ISCO -> ESCO, anchored on the ISCO occupation NAME (clean, ESCO-aligned), not the noisy
  // job title. Accept ONLY a real ESCO resolution (occupationUri present); if ESCO missed
  // (getEscoSkills -> null, which would otherwise let the CALLER fall back to the LLM getSkills),
  // withhold - no LLM-authored skills enter this "deterministic" graph.
  const iscoMap = SSOC2024_ISCO[node.code] || [];
  const pick = iscoMap.find((m) => !m.partial) || iscoMap[0] || null;
  const iscoTitle = pick ? pick.title : null, iscoCode = pick ? pick.isco : null;
  let escoResult = null;
  if (iscoTitle) { try { escoResult = await getEscoSkills(iscoTitle); } catch (_) { escoResult = null; } }
  const escoSkills = (escoResult && escoResult.occupationUri && Array.isArray(escoResult.skills)) ? escoResult.skills.slice(0, 18) : [];
  let band = null, bandIndex = null;
  try { const exp = iscoCode ? exposureForIsco(iscoCode) : null; if (exp) { band = exp.band; bandIndex = exp.index; } } catch (_) { band = null; bandIndex = null; }
  const { responsibilities: duties } = gatherStatements(result || {}, posting);
  const roleId = "ssocrole:" + node.code;
  const nodes = [{ id: roleId, type: "role", cluster: "department", label: toTitleCase(node.title || title || "this role"), source: "ssoc", confidence: cls.confidence || "medium" }];
  const edges = [];
  [hier.sub_major_group, hier.minor_group].forEach((h) => {
    if (h && h.title) { const id = "ssocfam:" + (h.code || _rgSlug(h.title)); if (!nodes.find((n) => n.id === id)) { nodes.push({ id, type: "occupation", cluster: "department", label: toTitleCase(h.title), source: "ssoc", confidence: "high" }); edges.push({ source: roleId, target: id, kind: "role-family" }); } }
  });
  escoSkills.forEach((s, i) => { const id = "ssocskill:" + (s.escoUri ? _rgSlug(String(s.escoUri).split("/").pop()) : "n" + i); nodes.push({ id, type: "skill", cluster: "individual", label: String(s.skill || ""), source: "esco", confidence: "medium", ref: { escoUri: s.escoUri || "" } }); edges.push({ source: roleId, target: id, kind: "role-skill" }); });
  duties.slice(0, 14).forEach((d) => { const id = "ssocduty:" + d.id; nodes.push({ id, type: "duty", cluster: "individual", label: d.text, source: "mcf", confidence: "high", level: d.level || "HUMAN" }); edges.push({ source: roleId, target: id, kind: "role-duty" }); });
  // KGGraph requires kg.clusters (it does kg.clusters.filter) + stats.{nodes,edges,clustersPresent}
  // + a withheld array - match the buildKnowledgeGraph payload shape exactly, or the render crashes.
  const clusters = [
    { id: "department", label: "Occupation", present: true },
    { id: "individual", label: "Skills & duties", present: nodes.some((n) => n.cluster === "individual") },
  ];
  const kg = { version: "ssoc1", nodes, edges, clusters, generatedAt: new Date().toISOString(),
    stats: { nodes: nodes.length, edges: edges.length, clustersPresent: clusters.filter((c) => c.present).length, skills: escoSkills.length },
    withheld: [] };
  // SSOCRG-3: ALSO emit a renderGraph-shaped payload so the SSOC lens draws the SAME wired
  // force-graph (role hub ¬∑ occupation ¬∑ ESCO skills ¬∑ MCF duties, curved edges + tap-to-trace)
  // as the ESCO "Layered" view - not a card listing. Deterministic, no LLM. Occupation column is
  // the SSOC->ISCO crosswalk (primary) plus the SSOC family groups; skills are the ISCO
  // occupation's own ESCO skills; skill<->duty links are token-overlap (computed association, not
  // invented meaning). Same 4-typed-column schema buildGraphStructure emits (renderGraph consumes).
  const gRoleId = "role:" + _rgSlug(node.title || title || "role");
  const gNodes = [{ id: gRoleId, type: "mcfRole", label: toTitleCase(node.title || title || "this role"), source: "ssoc" }];
  const gEdges = [];
  const gOcc = [];
  if (iscoTitle) gOcc.push({ id: "isco:" + (iscoCode || _rgSlug(iscoTitle)), label: iscoTitle, code: iscoCode || "", primary: true });
  [hier.sub_major_group, hier.minor_group].forEach((h) => { if (h && h.title) gOcc.push({ id: "ssococc:" + (h.code || _rgSlug(h.title)), label: toTitleCase(h.title), code: h.code || "", primary: false }); });
  gOcc.forEach((o) => { gNodes.push({ id: o.id, type: "iscoOccupation", label: o.label, code: o.code, score: null }); gEdges.push({ source: gRoleId, target: o.id, weight: 0.9, kind: "role-occupation" }); });
  const gPrimaryOccId = (gOcc.find((o) => o.primary) || gOcc[0] || {}).id;
  const gSkills = escoSkills.map((s, i) => ({ id: "esco:" + (s.escoUri ? _rgSlug(String(s.escoUri).split("/").pop()) : "n" + i), label: String(s.skill || ""), escoUri: s.escoUri || "", toks: _phraseToks(s.skill) }));
  gSkills.forEach((s) => { gNodes.push({ id: s.id, type: "escoSkill", label: s.label, escoUri: s.escoUri }); if (gPrimaryOccId) gEdges.push({ source: gPrimaryOccId, target: s.id, weight: 1, kind: "occupation-skill" }); });
  const gDuties = duties.slice(0, 14).map((d) => ({ id: "resp:" + d.id, label: d.text, level: d.level || "HUMAN", toks: _phraseToks(d.text) }));
  gDuties.forEach((d) => { gNodes.push({ id: d.id, type: "responsibility", label: d.label, level: d.level }); gEdges.push({ source: gRoleId, target: d.id, weight: d.level === "HIGH" ? 1 : d.level === "MEDIUM" ? 0.8 : 0.65, kind: "role-responsibility" }); });
  // skill<->duty: link each skill to up to 2 duties that share a meaningful token, so the
  // resonance web reads at a glance (the ESCO graph gets this from mapStatementsToEsco; here it
  // is a lightweight deterministic token overlap - honest "computed", never LLM-authored).
  gSkills.forEach((s) => {
    if (!s.toks.length) return;
    const sset = new Set(s.toks);
    gDuties.map((d) => ({ id: d.id, ov: d.toks.reduce((n2, t) => n2 + (sset.has(t) ? 1 : 0), 0) }))
      .filter((x) => x.ov > 0).sort((a, b) => b.ov - a.ov).slice(0, 2)
      .forEach((x) => gEdges.push({ source: s.id, target: x.id, weight: Math.min(1, 0.5 + x.ov * 0.25), kind: "skill-responsibility" }));
  });
  const graph = { nodes: gNodes, edges: gEdges, columns: ["responsibility", "mcfRole", "iscoOccupation", "escoSkill"], version: "ssoc1", generatedAt: new Date().toISOString(),
    stats: { roles: 1, occupations: gOcc.length, skills: gSkills.length, responsibilities: gDuties.length, edges: gEdges.length } };
  return { fallback: false, code: node.code, title: toTitleCase(node.title || ""), definition: node.definition || "", confidence: cls.confidence || "medium",
    iscoTitle: iscoTitle || "", iscoCode: iscoCode || "", partial: pick ? !!pick.partial : false, skillsWithheld: !!(iscoTitle && !escoSkills.length), band: band || null, bandIndex: (bandIndex == null ? null : bandIndex), kg, graph };
}

// --- CV ingress removed (PL1) ---

// scoreCVFit, scoreTrueFit, fairnessAudit, narrateCVFit, ingestCV removed (PL1)

// SLE-A: the automation LEVEL (l) is no longer authored by the LLM. It is decided
// deterministically by classifySkillLevel() (engine-data/skill-level.js) BEFORE this call, from
// the occupation's AIOE exposure band + ESCO signals + the hard HUMAN/office rules that used to
// live only inside this prompt. Claude/Haiku now narrates ONLY how/kickstart, reacting to the
// already-decided level - it cannot overrule it. `a` (tool) stays an LLM advisory hint, rendered
// with the "~ AI estimate" chip, never presented as fact. See v3-skill-level-engine-spec.md.
async function rateSkills(title, skills, occExposure) {
  // Decide each skill's level deterministically first - the LLM never sees an undecided level.
  const decided = skills.map(s => ({ n: s.n, skill: s.skill, ...classifySkillLevel(s, occExposure) }));
  const decidedByN = new Map(decided.map(d => [d.n, d]));

  const SYSTEM_RATE =
`You are a senior AI workforce analyst. For each occupational skill you are GIVEN the automation LEVEL already decided by the engine (deterministic - do not change it, do not re-derive it). Write only the narration for that decided level. Apply Singapore and ASEAN context.
Return ONLY a JSON array with exactly the same number of items as skills provided. No text before or after. No markdown fences.
Format: [{"n":1,"a":"LLM","h":"how AI engages - 12 words max","k":"kickstart this week - 12 words max","st":"technical","pr":"","tw":false,"rd":"ready"}]
Levels you will be given (for context only, so your narration matches):
- HIGH = Full Automation: AI completes the work end-to-end - including an AI agent running the multi-step workflow - the human reviews the OUTCOME, not each step
- MEDIUM = AI-Augmented: AI does the heavy lifting; a human directs and signs off each step
- LOW = AI-Assisted: AI informs and supports; human judgment leads throughout
- HUMAN = Human-Led: legal accountability, moral liability, presence, empathy or physical action required - the governance node AI cannot hold
- NOT_CLASSIFIED = no engine signal available; narrate LOW-style (AI as support) but do not claim a level
AI tools (use exact code):
LLM=AI language tool, AGENT=AI agent tool, COPILOT=Microsoft Copilot, SEARCH=AI search tool, IMAGE=AI image tool, VOICE=AI voice tool, DATA=AI data analysis tool, AUTO=AI automation tool, CODE=AI coding tool, DOCS=AI document tool, SLIDES=AI presentation tool, VISION=AI vision tool, RESEARCH=AI research tool, VIDEO=AI video tool, NA=Not applicable
Field rules:
- h: calibrated to the GIVEN level. HIGH: describe the delegation e.g. "An AI agent runs the monitor-and-report workflow; human reviews the output" or "Agent drafts, checks and files the documentation end-to-end". MEDIUM: describe the human-AI split e.g. "Human sets criteria, AI evaluates the options for sign-off". LOW: frame AI as support e.g. "AI surfaces the evidence; human applies judgment to the decision". HUMAN: explain why e.g. "Requires physical presence and emotional attunement". No generic phrases.
- k: one specific achievable action this week (for HIGH it may be setting up an agent run with a checkpoint). Do not name specific AI products.
- pr: if prompt needs real data first, start with "Have your..." or "Open your..." - else empty string
- tw: true only if multi-turn approach genuinely helps
- rd: "ready" if usable today, "prepare" if setup needed
- a: if the GIVEN level is HUMAN, a MUST be NA. No exceptions.`;

  // LLM-3 follow-through (live-verify: a single 24-skill call to Sonnet 5 took
  // 28s - one giant unbatched generation gates the ENTIRE "2 of 3" step, since
  // this is one of 4 calls in a Promise.all and the whole group waits for the
  // slowest). Batch across skills the same way generatePrompts already does:
  // several smaller concurrent generations finish faster in wall-clock than one
  // huge one, even though total tokens generated is unchanged.
  const RATE_BATCH_SIZE = 10;
  const batches = [];
  for (let i = 0; i < decided.length; i += RATE_BATCH_SIZE) batches.push(decided.slice(i, i + RATE_BATCH_SIZE));
  // ~69 output tokens/skill worst case (audited); budget per batch, not per full
  // skill count, capped at the proxy's 8192 max_tokens ceiling.
  const ratingsTokens = n => Math.min(8000, 400 + n * 110);
  const batchResults = await Promise.all(batches.map(async (batch) => {
    const skillList = batch.map(d => `${d.n}:${d.skill} [level=${d.level || "NOT_CLASSIFIED"}]`).join(" | ");
    const userMsg =
`Occupation: ${title}
Narrate how AI engages each skill, given its already-decided level. Singapore and ASEAN context applies.
Skills to narrate: ${skillList}`;
    try {
      const raw = await claudeCall(userMsg, ratingsTokens(batch.length), 1, SYSTEM_RATE);
      return extractJSON(raw, "ratings");
    } catch (e) {
      // One retry at the max budget before giving up - guards a rare truncation/format
      // blip so a single flaky batch does not error the entire result page.
      const raw2 = await claudeCall(userMsg, 8000, 1, SYSTEM_RATE);
      return extractJSON(raw2, "ratings");
    }
  }));
  const arr = batchResults.flat();
  if (!Array.isArray(arr)) throw new Error("ratings: expected array");
  return arr.map(x => {
    const d = decidedByN.get(x.n) || {};
    // Engine wins, always - the LLM's own l/a for the level are ignored (never read here).
    // a=NA <-> HUMAN is preserved as a deterministic invariant on the engine-decided level.
    const level = d.level || null;
    const toolFromLlm = x.a || x.tool || "NA";
    const tool = level === "HUMAN" ? "NA" : (d.toolHint || toolFromLlm);
    return {
      n:         x.n,
      level,
      confidence: d.confidence || "withheld",
      basis:      d.basis || "withheld",
      tool,
      how:       x.how || x.h || "",
      kickstart: x.kickstart || x.k || "",
      skillType: x.skillType || x.st || "technical",
      prep:      x.prep || x.pr || "",
      twoStep:   x.twoStep || x.tw || false,
      readiness: x.readiness || x.rd || "ready",
      prompt:    "",
      promptTech:"",
      nextPhase: "",
      promptLoading: false,
    };
  });
}

// LLM-3 follow-through: doubled from 3 - a 36-skill role fired 12 separate prompt-batch
// calls alone, the single biggest contributor to the per-analysis call burst that
// overruns Gemini's free-tier RPM (see App.jsx claudeCall's concurrency queue). Token
// budget below scales with batch size, so this halves call count at no loss of content.
const PROMPT_BATCH_SIZE = 6;

// Technique taxonomy organised by automation level and skill type
// Used for deterministic pre-assignment before batching
const TECH_ASSIGN = {
  // HIGH (L9-12) - Full Automation skills
  HIGH: {
    technical:   ["agentic-task-spec","rag","prompt-chaining","react","reflexion","self-critique-loop","decomposition-scaffold","tree-of-thoughts","skeleton-of-thought","few-shot-anchor"],
    soft:        ["agentic-task-spec","prompt-chaining","react","reflexion","self-critique-loop","tree-of-thoughts","meta-prompting","few-shot-anchor","decomposition-scaffold","self-consistency"],
  },
  // MEDIUM (L7-8) - AI-Augmented skills
  MEDIUM: {
    technical:   ["tree-of-thoughts","decomposition-scaffold","reflexion","self-critique-loop","meta-prompting","self-consistency","react","least-to-most","output-contract","few-shot-anchor"],
    soft:        ["reflexion","self-critique-loop","meta-prompting","tree-of-thoughts","self-consistency","directional-stimulus","generate-knowledge","persona-injection","few-shot-anchor","least-to-most"],
  },
  // LOW (L4-6) - AI-Assisted skills
  LOW: {
    technical:   ["chain-of-thought","generate-knowledge","least-to-most","output-contract","skeleton-of-thought","few-shot-anchor","self-consistency","directional-stimulus","persona-injection","chain-of-thought"],
    soft:        ["directional-stimulus","generate-knowledge","persona-injection","chain-of-thought","output-contract","least-to-most","few-shot-anchor","skeleton-of-thought","self-consistency","directional-stimulus"],
  },
};

// Eligible roles for multimodal-cot (visual interpretation skills only)
const MULTIMODAL_ROLES = ["architect","radiologist","pathologist","civil engineer","quality inspector","ux researcher","fashion designer","interior designer","structural engineer","urban planner","graphic designer","industrial designer","cartographer","orthotist","prosthetist"];

// Session-level rotation tracker - ensures missing techniques appear in subsequent analyses
// Stored outside the function so it persists across multiple analyses in the same session
const _techRotation = { lastSkipped: [] };

function assignTechniques(actionable, occupationTitle) {
  const titleLower = occupationTitle.toLowerCase();
  const isVisualRole = MULTIMODAL_ROLES.some(r => titleLower.includes(r));

  // Build the full pool of 19 techniques in priority order by level
  const allTechs = [
    "agentic-task-spec","rag","prompt-chaining",           // L9-12 highest priority
    "react","reflexion","self-critique-loop",               // L7-8
    "tree-of-thoughts","decomposition-scaffold","meta-prompting","self-consistency", // L7-8
    "few-shot-anchor","output-contract","skeleton-of-thought","least-to-most",       // L5-6
    "chain-of-thought","generate-knowledge","directional-stimulus","persona-injection", // L3-4
    "multimodal-cot",                                       // conditional only
  ];

  // Start with techniques skipped in last analysis so they surface this time
  const priorityFirst = [..._techRotation.lastSkipped, ...allTechs.filter(t => !_techRotation.lastSkipped.includes(t))];

  const assigned = new Map(); // n -> technique code
  const usedInThisAnalysis = new Set();

  actionable.forEach(s => {
    const level = s.level; // HIGH / MEDIUM / LOW
    const sType = (s.skillType || "technical").toLowerCase().includes("soft") ? "soft" : "technical";
    const pool = TECH_ASSIGN[level]?.[sType] || TECH_ASSIGN[level]?.technical || [];

    // Check multimodal eligibility
    const canMultimodal = isVisualRole && sType === "technical";

    // Find the best unused technique from the pre-assignment pool
    // Fall back to priority-first global pool if pool is exhausted
    let chosen = null;
    for (const t of pool) {
      if (!usedInThisAnalysis.has(t) && (t !== "multimodal-cot" || canMultimodal)) {
        chosen = t; break;
      }
    }
    if (!chosen) {
      for (const t of priorityFirst) {
        if (!usedInThisAnalysis.has(t) && (t !== "multimodal-cot" || canMultimodal)) {
          chosen = t; break;
        }
      }
    }
    if (!chosen) chosen = pool[0] || "chain-of-thought"; // absolute fallback

    assigned.set(s.n, chosen);
    usedInThisAnalysis.add(chosen);
  });

  // Record which techniques were NOT used this analysis for next rotation
  _techRotation.lastSkipped = allTechs.filter(t => t !== "multimodal-cot" && !usedInThisAnalysis.has(t));

  return assigned;
}

async function checkSkillRelevance(title, skills) {
  // Score each skill for relevance to the role title using Sonnet
  // Returns array of { n, r } where r: 1=clearly relevant, 2=adjacent/transferable, 3=not relevant
  // Used to detect wrong ESCO occupation resolution and flag individual skills
  if (!skills || skills.length === 0) return [];
  const skillList = skills.map(s => `${s.n}:${s.skill}`).join(" | ");
  const SYSTEM_RELEVANCE =
`You are an occupational skills relevance assessor. For each skill listed, score its relevance to the given role title.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"n":1,"r":1}]
Scoring:
- 1 = Clearly relevant - a core or expected skill for this role
- 2 = Adjacent - transferable or indirectly relevant to this role
- 3 = Not relevant - belongs to a different occupation or field entirely
Be precise. A skill that appears in a clearly different field (e.g. chemistry skills for an HR role) must score 3.`;
  const raw = await claudeCall(
`Role: ${title}
Score each skill for relevance to this role.
Skills: ${skillList}`, 500, 1, SYSTEM_RELEVANCE, "claude-opus-4-8");
  const arr = extractJSON(raw, "relevance");
  return Array.isArray(arr) ? arr : [];
}

async function generateSkillDescriptions(title, skills, onPatch) {
  // Generate plain-English descriptions for skills missing ESCO description
  // Fires in background - same fire-and-patch pattern as generatePrompts
  const missing = skills.filter(s => !s.escoDescription);
  if (missing.length === 0) return;

  const SYSTEM_DESC =
`You are a concise occupational skills writer. For each skill listed, write 1-2 sentences explaining what a practitioner actually does when applying this skill in their role. Plain English. No jargon. No preamble.
Return ONLY a JSON array. No markdown fences.
Format: [{"n":1,"d":"Plain English description of what the practitioner does."}]
Rules:
- d: 1-2 sentences, 20-40 words. Describe the action, not the concept.
- Match the occupation context.
- Never start with the skill name.`;

  // LLM-3 follow-through: doubled from 8 - fewer, larger batches reduce the per-analysis
  // call burst that overruns Gemini's free-tier RPM. Token budget scales with batch size.
  const BATCH_SIZE = 16;
  const batches = [];
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    batches.push(missing.slice(i, i + BATCH_SIZE));
  }

  await Promise.allSettled(batches.map(async (batch) => {
    try {
      const skillList = batch.map(s => `${s.n}:${s.skill}`).join(" | ");
      const descTokens = Math.min(8192, 150 + batch.length * 75);
      const raw = await claudeCall(
`Occupation: ${title}
Skills: ${skillList}`, descTokens, 1, SYSTEM_DESC);
      const arr = extractJSON(raw, "descriptions");
      if (!Array.isArray(arr)) return;
      const patch = {};
      arr.forEach(x => { if (x.n && x.d) patch[x.n] = x.d; });
      onPatch(patch);
    } catch(e) {
      console.warn("[generateSkillDescriptions] batch failed:", e.message);
    }
  }));
}

async function generatePrompts(title, skills, ratedSkills, onBatch) {
  const actionable = ratedSkills.filter(s => s.level !== "HUMAN");
  if (actionable.length === 0) return [];

  // Pre-assign techniques deterministically before batching
  const techAssignment = assignTechniques(actionable, title);

  const SYSTEM_PROMPTS =
`You are a prompt engineering specialist. For each skill, write a sophisticated ready-to-use prompt using EXACTLY the technique code specified in the pt field of each input item. Do not choose a different technique - execute the assigned one.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"n":1,"p":"full prompt text","pt":"SAME technique-code as assigned","nx":"next phase sentence"}]
Never name specific AI products inside p or nx - use "an AI language tool", "an AI automation tool" etc.
The pt field in your output MUST exactly match the technique code assigned in the input.
PLAIN TEXT RULE: The p field must be plain text only. No markdown whatsoever. No asterisks, no bold (**text**), no headers (##), no bullet points (-), no numbered lists. Plain sentences only.
UK ENGLISH RULE: All text in p and nextPhase fields must use UK English spelling and vocabulary throughout. Use: analyse not analyze, recognise not recognize, colour not color, behaviour not behavior, organisation not organization, practise (verb) not practice, licence (noun) not license, programme not program (except software).
WORD ECONOMY RULE: Use the most concise form that preserves full meaning. Preferred substitutions: "with X+ years of experience" ‚Üí "(X+ yrs)"; "in order to" ‚Üí "to"; "a number of" ‚Üí "several"; "make use of" ‚Üí "use"; "with regard to" ‚Üí "regarding"; "it is important to" ‚Üí "ensure"; "as a result of" ‚Üí "due to"; "in the event that" ‚Üí "if". Use abbreviations where natural: approx., incl., excl., vs., e.g., i.e., dept., Q1/Q2/Q3/Q4, FY, KPI, ROI, SLA, P&L, HR, L&D, R&D, comms, specs, reqs. Never use two-letter abbreviations that could be misread (no "nx" for next, no "bg" for background).
PARAGRAPH RULE: The p field must use \n\n between each structural section. Minimum 3 paragraphs for all levels. Sections: (1) Persona and context. (2) Technique instruction and task. (3) Output contract and constraints. HIGH prompts: 4-5 paragraphs, add verification or escalation as a separate paragraph. Never write the prompt as one continuous block of text. The \n\n must be literal newline escape sequences inside the JSON string.

MULTIMODAL CoT RULE: Only write a multimodal-cot prompt when the skill genuinely involves interpreting images, diagrams, scans, blueprints, or visual data alongside text.

TECHNIQUE EXECUTION GUIDE - how to write each technique as a prompt:

persona-injection: Open with a specific expert identity (seniority + domain + years). Every sentence should reflect how that expert thinks. The persona shapes tone, vocabulary, and depth.
directional-stimulus: Embed a directing keyword or framing hint early that steers AI toward the right answer space without constraining output. The stimulus is subtle - a word, a framing, a perspective anchor.
chain-of-thought: Instruct AI to reason step by step, showing each reasoning stage before reaching a conclusion. Number the steps. Make the reasoning visible.
generate-knowledge: Ask AI to surface all relevant knowledge about the domain first, then apply that knowledge to the specific task. Two explicit phases: know, then do.
least-to-most: Break the problem into subproblems from simplest to most complex. Each subproblem must be solved before the next is attempted. Show the dependency chain explicitly.
output-contract: Specify exact output structure - field names, section headers, word count per section, format. Leave no ambiguity about what the output must look like.
skeleton-of-thought: Generate the full structural outline first (headings, key points, word targets per section). Review and confirm the skeleton. Then expand each section in full.
few-shot-anchor: Embed a complete worked example of ideal input and output before the actual task. The example calibrates AI to your quality standard.
multimodal-cot: Combine image/visual input with text and apply chain-of-thought reasoning across both modalities. Reference specific visual elements in the reasoning steps.
self-consistency: Run the same analytical task through three independent reasoning paths. Compare the conclusions. Select the most consistent answer and explain why it is more reliable.
meta-prompting: Before answering, describe what an excellent response looks like - its structure, depth, evaluation criteria. Then apply that standard to produce the response.
tree-of-thoughts: Explore 2-3 distinct reasoning branches before committing. For each branch: state the assumption, work through the logic, note where it might fail. Select the strongest branch and justify.
decomposition-scaffold: Break the task into numbered sub-steps. Execute each step in order. Show the output of each step before proceeding. The scaffold is visible in the prompt.
reflexion: Generate the initial output. Then reflect explicitly on what was weak, incomplete, or missing. Produce an improved version addressing each identified gap.
self-critique-loop: Generate output. Evaluate it against 3 named quality criteria. Identify the weakest point. Revise specifically to address it. Deliver the revised version.
react: Alternate Reason and Act cycles. Reason: what do I know and what do I need? Act: retrieve or calculate. Reason: what does this tell me? Act: update. Continue until no unresolved questions remain.
prompt-chaining: Structure the prompt as two linked stages. Stage 1 produces an intermediate output. Stage 2 takes that output as input and produces the final deliverable. Label both stages clearly.
rag: Specify the retrieval source material the user must paste in. AI reads only that material, cites specific sections for every claim, and states what is missing if the material is insufficient.
agentic-task-spec: Write a full autonomous brief: objective, available inputs, decision rules for each scenario, output format, verification step, and escalation condition if the output fails verification. Designed to run without human initiation per cycle.

WORKED EXAMPLES AT L9-12:

agentic-task-spec example (HIGH, automated workflow skill): "You are a senior [role] operating autonomously. Objective: [state the automated task]. Inputs available: [list data sources or files]. Decision rules: If [condition A] then [action A]. If [condition B] then [action B]. If neither condition applies, flag for human review. Output format: [specify exact format]. Verification: before delivering output, confirm all required fields are populated and no rule was skipped. Escalation: if output confidence is below threshold or a rule conflict is detected, pause and surface the conflict with a recommended resolution. Execute now using the inputs provided."

rag example (HIGH, knowledge/compliance skill): "You are a specialist [role]. I will provide the source material below. Read it in full before answering. Rules: cite the specific section, clause, or paragraph for every claim you make. Do not use knowledge from outside the provided material. If the material does not contain enough information to answer fully, list exactly what is missing and why it matters. Format your answer as: Finding | Source Reference | Confidence (High / Medium / Low - based on how explicitly the source addresses the point). Source material: [paste document, policy, or data extract here]. Question: [your specific question]."

prompt-chaining example (HIGH, multi-stage analytical skill): "Stage 1 - Analysis: You are a senior [role]. Analyse the following situation and produce a structured diagnostic: [describe situation]. Output: a numbered list of root causes, each with supporting evidence and estimated impact level. --- Stage 2 - Recommendation: Taking the diagnostic output from Stage 1 as your input, produce a prioritised action plan. For each action: state the objective, the specific steps, the owner, and the success metric. Do not repeat the diagnostic. Build directly on it."

WORD TARGETS - the prompt text must fall within these ranges:
For l=HIGH (280-440 words): Write it as a brief an AI agent could run - tool-use chains, retrieval sources, decision rules, verification steps, multi-stage scaffolds, and the human review checkpoint. Include: expert persona + full technique structure + output contract + 2 hard constraints + verification or escalation step.
For l=MEDIUM (180-280 words): Show the technique structure clearly. Include: expert persona + technique structure shown explicitly + output contract + technique applied with visible steps.
For l=LOW (100-160 words): Embed the technique clearly. Include: expert persona + technique applied + output contract + one constraint.

NX FIELD - plain language, no jargon, no technical terms:
For the nextPhase field - write approx. 220 words in UK English. Structure: one background paragraph (40-50 words) explaining what this skill looks like as AI takes on more of it - written plainly for someone who has never automated anything. Then 3 numbered steps, each with a bold label and 1-2 sentences. Use \n\n between the background and each step. CRITICAL: Every step label MUST end with a colon immediately before the body text - e.g. "Step 1 - Try it now: paste the prompt..." not "Step 1 - Try it now paste the prompt...". No markdown in the label text itself - write the label as plain text. No two-letter abbreviations. Use word economy: concise, direct, UK English throughout.

Step 1 - Try it now (40-50 words): paste the prompt into an AI tool, replace the bracketed parts with real context, run it. Mention one thing to look for in the response that signals it has worked well.

Step 2 - Refine it (50-60 words): one specific follow-up technique tied to the assigned prompt technique. What to say to the AI after the first response to sharpen the output. Make it concrete - give the actual follow-up instruction to type.

Step 3 content varies by automation level:
- l=LOW: "Step up" (60-70 words) - describe what the MEDIUM version of this skill looks like: what changes when AI is more involved, what the user would need to provide, what they would get back.
- l=MEDIUM: "Build on it" (60-70 words) - describe connecting this to a data source, chaining it to another prompt, or handing one repeatable step to an AI agent to run. Give one concrete example of what that looks like.
- l=HIGH: "Automate it" (60-70 words) - describe handing the whole workflow to an AI agent: what you hand over (the brief, the data access), the checkpoint where you review its output, and when it should escalate back to you. Give the user a clear picture of what delegating to an agent looks like in practice - the human reviews the outcome, not each step.

Do not start with "Next phase:". Start directly with the background paragraph.`;

  // Build batches with pre-assigned techniques injected into each skill entry
  const batches = [];
  for (let i = 0; i < actionable.length; i += PROMPT_BATCH_SIZE) {
    batches.push(actionable.slice(i, i + PROMPT_BATCH_SIZE));
  }

  const allResults = [];

  await Promise.allSettled(batches.map(async (batch) => {
    const batchMsg =
`Occupation: ${title}
Write prompts for these skills. The technique (pt) is pre-assigned - use EXACTLY the technique specified for each skill. Format: n:level:skillType:ASSIGNED_TECHNIQUE:skillName
${batch.map(s => {
  const sk = skills.find(sk => sk.n === s.n);
  const assignedTech = techAssignment.get(s.n) || "chain-of-thought";
  return `${s.n}:${s.level}:${s.skillType||"technical"}:${assignedTech}:${sk?.skill || ""}`;
}).join(" | ")}
Return pt exactly as assigned above. Do not substitute a different technique.`;

    try {
      // Scales with batch size (was a flat 5500 tuned for PROMPT_BATCH_SIZE=3); each
      // skill can need a HIGH-level 280-440 word prompt plus a ~220 word nextPhase -
      // budget generously per skill, capped at the proxy's 8192 max_tokens ceiling
      // (v3-llm-proxy-guardrails-spec.md ¬ß4).
      const batchTokens = Math.min(8192, 1000 + batch.length * 1500);
      const raw = await claudeCall(batchMsg, batchTokens, 1, SYSTEM_PROMPTS, "claude-opus-4-8");
      const arr = extractJSON(raw, "prompts-batch");
      if (Array.isArray(arr)) {
        allResults.push(...arr);
        if (onBatch) onBatch(arr);
      }
    } catch(e) {
      console.warn("[generatePrompts] batch failed for skills", batch.map(s => s.n).join(","), e.message);
    }
  }));

  return allResults;
}
// Compact rating for comparison runs - skips prompt/prep/twoStep/readiness to reduce tokens and
// latency.
// SLE-B: the automation LEVEL is no longer authored by the LLM here either - decided
// deterministically by classifySkillLevel() (engine-data/skill-level.js), same as rateSkills
// (SLE-A). Claude/Haiku narrates ONLY how + the advisory tool hint, reacting to the
// already-decided level - it cannot overrule it. See v3-skill-level-engine-spec.md SLE8.
async function rateSkillsCompact(title, skills, occExposure) {
  // Decide each skill's level deterministically first - the LLM never sees an undecided level.
  const decided = skills.map(s => ({ n: s.n, skill: s.skill, ...classifySkillLevel(s, occExposure) }));
  const decidedByN = new Map(decided.map(d => [d.n, d]));

  const SYSTEM_COMPACT =
`You are a senior AI workforce analyst. For each occupational skill you are GIVEN the automation LEVEL already decided by the engine (deterministic - do not change it, do not re-derive it). Write only the narration for that decided level. Apply Singapore and ASEAN context.
Return ONLY a JSON array with exactly the same number of items as skills provided. No text before or after.
Format: [{"n":1,"a":"LLM","h":"how AI helps under 8 words","st":"technical"}]
Levels you will be given (for context only, so your narration matches):
- HIGH = Full Automation: AI/agent completes it end-to-end, human reviews the outcome
- MEDIUM = AI-Augmented: AI does the heavy lifting, human directs each step
- LOW = AI-Assisted: AI supports, human judgment leads
- HUMAN = Human-Led: accountability, presence or physical action AI cannot hold
- NOT_CLASSIFIED = no engine signal available; narrate LOW-style (AI as support) but do not claim a level
AI tools (use exact code): LLM, AGENT, COPILOT, SEARCH, IMAGE, VOICE, DATA, AUTO, CODE, DOCS, SLIDES, VISION, RESEARCH, VIDEO, NA
CRITICAL: if the GIVEN level is HUMAN, a MUST be NA.`;

  const skillList = decided.map(d => `${d.n}:${d.skill} [level=${d.level || "NOT_CLASSIFIED"}]`).join(" | ");
  // Scale with skill count so a long ESCO list does not truncate (compact = 3 fields now,
  // ~29 output tokens/skill worst case). Was a flat 2200 tuned for 25 skills.
  const compactTokens = Math.min(5000, 1100 + skills.length * 45);
  const raw = await claudeCall(
`Occupation: ${title}
Skills to narrate, given their already-decided level: ${skillList}`, compactTokens, 2, SYSTEM_COMPACT);
  const arr = extractJSON(raw, "compact-ratings");
  if (!Array.isArray(arr)) throw new Error("compact-ratings: expected array");
  return arr.map(x => {
    const d = decidedByN.get(x.n) || {};
    // Engine wins, always - the LLM's own l for the level is never read here.
    const level = d.level || null;
    const toolFromLlm = x.a || "NA";
    const tool = level === "HUMAN" ? "NA" : (d.toolHint || toolFromLlm);
    return { n:x.n, level, confidence: d.confidence || "withheld", basis: d.basis || "withheld",
             tool, how:x.h||"", skillType:x.st||"technical",
             kickstart:"", prompt:"", prep:"", twoStep:false, readiness:"ready" };
  });
}

// Colour-blind-safe blue<->orange diverging ramp (NO red/green). The two poles
// read as cool (Human-Led, blue) vs warm (Full Automation, orange); icons +
// text labels carry the meaning independent of hue, ordered by automation level.
const LEVELS = {
  HIGH:  { label:"Full Automation", color:"#d97706", bg:"#fff7ed", border:"#fed7aa", icon:"‚ö°" },
  MEDIUM:{ label:"AI-Augmented",    color:"#b45309", bg:"#fffbeb", border:"#fde68a", icon:"~"  },
  LOW:   { label:"AI-Assisted",     color:"#0e7490", bg:"#ecfeff", border:"#a5f3fc", icon:"‚óè"  },
  HUMAN: { label:"Human-Led",       color:"#1e40af", bg:"#eef2ff", border:"#c7d2fe", icon:"‚ô¶"  },
};
// SLE-A: neutral "not classified" style for a withheld skill level (classifySkillLevel returned
// null - no occupation exposure and no ESCO signal to lean on). Never fall back to a band colour
// - that would fabricate a level. Mirrors ReviewStudio's SPAN_STYLE_WITHHELD posture.
const LEVEL_WITHHELD = { label:"Not classified", color:"#5b6878", bg:"#f5f7fa", border:"#dde3ec", icon:"?" };

// PW4 (stewardship arc): the pro-worker lens. Acemoglu, Autor & Johnson 2026 (NBER w34854,
// "Building Pro-Worker AI") name five categories of technological change - labor-augmenting,
// capital-augmenting, automating, expertise-leveling, new-task-creating - and argue ONLY
// new-task-creating is unambiguously pro-worker (raises the value of human skill rather than
// replacing it). This is a documented CROSSWALK from our 4 exposure levels to the nearest
// category - a modeling choice, not a claim read from the paper - reframing each level as
// whether AI here REPLACES the worker or makes the worker more valuable. No number, no LLM.
const PWAI_LENS = {
  HIGH:   { cat:"automating",         worker:"replaces", frame:"AI can do the task instead of the worker - the substitution the paper warns deskills when it only replaces." },
  MEDIUM: { cat:"labor-augmenting",   worker:"empowers", frame:"AI raises the worker's output on the task - pro-worker when it makes human skill more valuable." },
  LOW:    { cat:"expertise-leveling", worker:"empowers", frame:"AI lifts a less-expert worker toward competence - pro-worker; widens who can do the work." },
  HUMAN:  { cat:"new-task-creating",  worker:"empowers", frame:"Stays human-led; the pro-worker frontier is AI creating NEW human tasks around it." },
};

// Provenance of a displayed value, so "computed" (deterministic, reproducible)
// is visibly distinct from "AI estimate" (an LLM judgement that can vary per
// run) and "from MCF" (verbatim posting fact). Colour-blind-safe (no red/green);
// the icon + label carry the meaning, not the hue.
const PROV = {
  mcf:        { label:"from MyCareersFuture", short:"from MCF",   icon:"‚óè", color:"#0f766e", bg:"#f0fdfa", border:"#99f6e4", tip:"Taken verbatim from the live MyCareersFuture posting." },
  computed:   { label:"computed",            short:"computed",   icon:"‚úì", color:"#1e40af", bg:"#eef2ff", border:"#c7d2fe", tip:"Deterministic: calculated from ESCO/ISCO data. Same inputs give the same result." },
  ai:         { label:"AI estimate",         short:"AI estimate", icon:"~", color:"#b45309", bg:"#fffbeb", border:"#fde68a", tip:"An AI (LLM) judgement, not a measurement. It can vary between runs - treat as advisory, not fact." },
  derived:    { label:"derived",             short:"derived",    icon:"‚óê", color:"#0e7490", bg:"#ecfeff", border:"#a5f3fc", tip:"Derived analysis: computed from the sampled ads shown. Reproducible for this sample, but not a verbatim posting fact." },
  unverified: { label:"unverified",          short:"unverified", icon:"?", color:"#5b6878", bg:"#f5f7fa", border:"#dde3ec", tip:"A claim without a checked source." },
  // SLE-A: the per-skill automation level is rule-derived from the occupation's AIOE band, not a
  // table lookup - so it is NOT "computed" fact. Distinct from "derived" (sampled-ad analysis).
  estimated:  { label:"estimated",           short:"estimated",  icon:"‚óê", color:"#0e7490", bg:"#ecfeff", border:"#a5f3fc", tip:"Estimated from the occupation's AI-exposure band (AIOE) plus ESCO signals - not a per-skill measurement. Withheld when unsupported." },
};
function Prov({ kind, small }) {
  const p = PROV[kind]; if (!p) return null;
  return (
    <span title={p.tip} style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize: small ? "0.5625rem" : "0.625rem", fontWeight:700, color:p.color, background:p.bg, border:`1px solid ${p.border}`, borderRadius:999, padding:small?"0 6px":"1px 8px", whiteSpace:"nowrap", verticalAlign:"middle", lineHeight:1.7 }}>
      <span aria-hidden="true">{p.icon}</span>{small ? p.short : p.label}
    </span>
  );
}
function ProvLegend() {
  return (
    <div role="note" aria-label="How to read the provenance badges" style={{ display:"flex", gap:"6px 10px", flexWrap:"wrap", alignItems:"center", margin:"0 0 12px", padding: "8px 12px", background:C.surface, border:`1px solid ${C.border}`, borderRadius: 10, fontSize: "0.6875rem", color:C.textSub }}>
      <span style={{ fontWeight:700, color:C.text }}>Badges, where shown:</span>
      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Prov kind="mcf" /> posting facts</span>
      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Prov kind="computed" /> deterministic, reproducible</span>
      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Prov kind="ai" /> AI judgement, may vary</span>
      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Prov kind="derived" /> computed from the sampled ads</span>
    </div>
  );
}

const PERSONA_CONFIG = {
  fresh: {
    label:   "Fresh Graduate",
    icon:    "üéì",
    color:   "#1e40af",
    bg:      "#ecfdf5",
    border:  "#c7d2fe",
    context: "a fresh graduate with no prior work experience entering this field for the first time",
    horizon: "first 12 months of employment and beyond",
  },
  crossover: {
    label:   "Industry Crossover",
    icon:    "üîÑ",
    color:   "#7c3aed",
    bg:      "#f3e8ff",
    border:  "#ddd6fe",
    context: "an adult professional changing industries with transferable skills from a different field",
    horizon: "first 12 months of transition into this new field and beyond",
  },
};

const AI_USAGE = {
  LLM:       "AI language tool",
  AGENT:     "AI agent tool",
  COPILOT:   "Microsoft Copilot",
  SEARCH:    "AI search tool",
  IMAGE:     "AI image tool",
  VOICE:     "AI voice tool",
  DATA:      "AI data analysis tool",
  AUTO:      "AI automation tool",
  CODE:      "AI coding tool",
  DOCS:      "AI document tool",
  SLIDES:    "AI presentation tool",
  VISION:    "AI vision tool",
  RESEARCH:  "AI research tool",
  VIDEO:     "AI video tool",
  NA:        "No direct AI tool applicable at this time",
};

function toTitleCase(str) {
  if (!str) return "";
  const mixedCase = new Set(["MLOps","DevOps","DataOps","GitOps","SecOps","FinOps","AIOps","CloudOps","NetOps",
    "ChatGPT","GitHub","LinkedIn","WordPress","JavaScript","TypeScript","PowerPoint","HubSpot",
    "iPhone","iPad","macOS","iOS","OpenAI","MongoDB","PostgreSQL","MySQL","LaTeX",
    "PyTorch","TensorFlow","AutoCAD","QuickBooks","Salesforce","ServiceNow",
    "eCommerce","eLearning","eHealth","mHealth","fintech","RegTech","InsurTech","PropTech"]);
  const acronyms = new Set([
    // C-suite and leadership
    "CEO","CFO","COO","CTO","CMO","CHRO","CPO","CDO","CIO","CCO","CLO","CSO","CRO","CISO",
    "VP","SVP","EVP","AVP","MD","GM","GP","DGM",
    // HR and people
    "HR","HRM","HRD","HRBP","L&D","OD","TA",
    // Technology
    "IT","ICT","AI","ML","NLP","LLM","RPA","API","SQL","ETL","BI","ERP","CRM","SaaS","PaaS","IaaS",
    "ERP","MRP","SCM","WMS","TMS","LMS","HRIS","HRMS","ATS","CMS","DAM","CDP","DMP","MDM",
    "IoT","AR","VR","XR","UI","UX","UCD","SEO","SEM","PPC","CRO","A/B",
    "TV","POS","ATM","GPS","SMS","MMS","URL","USB","PDF","XML","JSON","HTML","CSS",
    // Finance and business
    "P&L","ROI","ROE","ROA","EBITDA","EBIT","NPV","IRR","DCF","WACC","KPI","OKR","SLA","NPS",
    "B2B","B2C","D2C","SME","SMB","MNC","IPO","M&A","PE","VC","LBO","MBO",
    "IFRS","GAAP","FASB","IASB","FRS","SSAP","IPSAS","XBRL","GST","VAT","WHT","MAS","SGX",
    // Operations and supply chain
    "FMCG","SKU","PO","SO","GRN","3PL","4PL","DC","WH","MOQ","EOQ","COGS","BOM","MPS","MRP",
    "SOP","SOW","RFP","RFQ","RFI","NDA","MSA","SLA","OLA","KPI","OTIF","DIFOT",
    // Professional and regulatory
    "NGO","NPO","IGO","UN","EU","ASEAN","MOU","MOA","AGM","EGM","AGM",
    "ISO","GDPR","PDPA","SOX","HIPAA","PCI","AML","KYC","ESG","CSR","GRI","SDG",
    // Healthcare
    "GP","A&E","ICU","CCU","ED","OT","OPD","IPD","GP","PHC","IHC",
    // Education
    "K12","STEM","STEAM","MBA","MBA","PhD","BSc","MSc","BA","MA","BEng","MEng",
    // Marketing and comms
    "PR","IR","GR","CSR","ATL","BTL","TTL","OOH","CTA","CTR","CPM","CPC","CPL","CAC","LTV","CLV",
    // Media, broadcast, entertainment
    "VFX","CGI","CG","3D","2D","HD","4K","8K","UHD","FPS","DJ","MC","FM","AM","EP","PR",
    // Project and quality
    "PM","PMO","PMP","PRINCE2","SCRUM","AGILE","LEAN","SIX","TQM","QA","QC","ISO",
  ]);
  const lowercase = new Set(["of","and","the","in","at","for","to","with","a","an","by","or","nor","but","from","on","into","as","via","per","vs"]);
  return str.trim().replace(/\b\w+/g, (w, offset, full) => {
    if (mixedCase.has(w)) return w;
    const up = w.toUpperCase();
    if (acronyms.has(up)) return up;
    // Keep connectors lowercase unless they are the first word
    if (lowercase.has(w.toLowerCase()) && offset > 0) return w.toLowerCase();
    // Do not capitalise if word is preceded by an apostrophe (e.g. company's not company'S)
    if (offset > 0 && full[offset - 1] === "'") return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

function skillsMatch(a, b) {
  if (a === b) return true;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = norm(a), nb = norm(b);
  if (na === nb) return true;
  if (na.length > 5 && nb.length > 5) {
    if (na.startsWith(nb.slice(0,6)) || nb.startsWith(na.slice(0,6))) return true;
    const wa = na.split(/\s+/), wb = nb.split(/\s+/);
    const shared = wa.filter(w => wb.some(x => x.startsWith(w.slice(0,5)) || w.startsWith(x.slice(0,5))));
    if (shared.length >= Math.min(wa.length, wb.length) * 0.6) return true;
  }
  return false;
}

function track(event, props) {
  try { window._vtrack && window._vtrack(event, props); } catch(_) {}
}

// ‚îÄ‚îÄ Pipeline step trail ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ‚îÄ
// A lightweight, fire-and-forget per-step log of the analysis pipeline (and the
// Resume-Check / Role-Graph orchestrators): which stage ran, ok/error, how long,
// and a short detail string. Used to diagnose where a run stalls or fails - the
// last few entries are shown on the error screen, and the full trail is queryable
// at ?debug=logs (and in the pipeline_logs table). Logs ONLY step labels, statuses,
// durations, counts and truncated error strings + the occupation title + a random
// per-session id - never resume/CV text, posting bodies, or any user data. If the
// store isn't configured / the DB is down, every call is a silent no-op.
function _randId(n) { return Math.random().toString(36).slice(2, 2 + (n || 8)); }
const _PIPE_SESSION = (() => {
  try {
    const k = "v3_pipe_session";
    let v = sessionStorage.getItem(k);
    if (!v) { v = _randId(8); sessionStorage.setItem(k, v); }
    return v;
  } catch (_) { return _randId(8); }
})();
let _logCtx = { role: "", source: "" };
function setLogCtx(role, source) { _logCtx = { role: String(role || "").slice(0, 140), source: String(source || "").slice(0, 40) }; }
const _recentSteps = []; // last ~24 { t, step, status, ms, detail } - read by ErrBox
let _logQueue = [];
let _logFlushTimer = null;
function _flushLogQueue() {
  _logFlushTimer = null;
  if (!_logQueue.length) return;
  const entries = _logQueue.splice(0, 20);
  try {
    fetch("/api/anatomy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "log", session: _PIPE_SESSION, role: _logCtx.role, source: _logCtx.source, entries }) }).catch(() => {});
  } catch (_) {}
  if (_logQueue.length) { _logFlushTimer = setTimeout(_flushLogQueue, 800); }
}
function logStep(step, status, ms, detail) {
  try {
    const s = String(step || "").slice(0, 40);
    if (!s) return;
    const st = String(status || "info").slice(0, 40);
    const m = (ms == null || !Number.isFinite(Number(ms))) ? null : Math.max(0, Math.round(Number(ms)));
    const d = detail == null ? "" : String(detail).slice(0, 300);
    _recentSteps.push({ t: Date.now(), step: s, status: st, ms: m, detail: d });
    if (_recentSteps.length > 24) _recentSteps.shift();
    try { console.debug("[pipe]", s, st, m != null ? m + "ms" : "", d); } catch (_) {}
    // Debug mode tee (no-op unless ?debug=1): forward logic steps to v3/src/debug.js.
    try { if (typeof window !== "undefined" && window.__v3debug && window.__v3debug.enabled) window.__v3debug.recordLogic({ step: s, status: st, ms: m, detail: d, role: _logCtx.role, source: _logCtx.source }); } catch (_) {}
    _logQueue.push({ step: s, status: st, ms: m, detail: d });
    if (!_logFlushTimer) _logFlushTimer = setTimeout(_flushLogQueue, 800);
  } catch (_) {}
}
function _msSince(t0) { try { return Math.round(performance.now() - t0); } catch (_) { return null; } }

// H1 fix: input validation gate applied before any API call in doSearch and
// the URL param handler. Enforces three rules:
// (1) Maximum 140 chars - matches the UI guidance already shown to users.
// (2) Must contain at least one letter - rejects purely numeric or symbol input.
// (3) Strips or blocks HTML special characters that could alter prompt strings.
// Returns null on valid input, or an error message string on invalid input.
function validateJobTitleInput(raw) {
  if (!raw || !raw.trim()) return "Please enter a job title to search.";
  const s = raw.trim();
  if (s.length > 140) return "That job title is too long. Please keep it to 1 to 3 words and under 140 characters.";
  if (!/[a-zA-Z]/.test(s)) return "That does not look like a job title. Please enter a role such as HR Manager, Nurse, or Software Developer.";
  // Reject angle brackets and script-injection characters
  if (/[<>]/.test(s)) return "That does not look like a job title. Please avoid special characters.";
  return null;
}

async function getFoundationSkills(title, skills, persona) {
  const cfg = PERSONA_CONFIG[persona];
  const skillList = skills.map(s => `${s.n}:${s.skill}(${s.level},${s.tool})`).join(" | ");
  const SYSTEM_FOUND =
`You are a workforce readiness specialist with expertise in human skills development and AI transition planning. Your role is to identify the foundation skills that will keep a person relevant and employable as AI reshapes their occupation. You apply Singapore and ASEAN context - SkillsFuture frameworks, WSQ competencies, and local employer expectations inform your recommendations where relevant.
Return ONLY a JSON object. No text before or after. No markdown fences.
Format:
{
  "summary": "One sentence framing for this persona under 15 words",
  "foundations": [
    {
      "n": 1,
      "skill": "Foundation skill name under 7 words",
      "category": "one of: Critical Thinking | Communication | Ethical Judgment | Adaptability | Domain Knowledge | Collaboration | AI Literacy",
      "why": "Why AI cannot replace this for this persona under 12 words",
      "action": "One concrete learning action to build this skill under 10 words",
      "priority": "one of: Must-Have | High | Develop"
    }
  ]
}
Priority meaning:
- Must-Have: critical from day one - without this the person cannot perform in the role
- High: important within the first 12 months - builds competitive advantage early
- Develop: build progressively over time - deepens long-term resilience
Rules:
- foundations: exactly 8 items
- No double-quote characters inside any string value
- Each skill must be genuinely AI-resistant - not just soft or vague
- action must be specific enough to do this week, not just "read about it"
Bad example action: "Learn about communication" - too vague
Good example action: "Run a mock difficult conversation with a colleague and ask for feedback"`;

  const raw = await claudeCall(
`Occupation: ${title}
Persona: ${cfg.context}
Time horizon: ${cfg.horizon}
Existing skill automation ratings: ${skillList}
Identify exactly 8 foundation skills that will remain human-essential and AI-resistant for this persona over the next 12 months and beyond. Prioritise skills that are realistic to build given the persona context - a fresh graduate needs different foundations than an industry crossover professional.`, 1200, 1, SYSTEM_FOUND);
  // Token note: budget raised from 990 to 1200. Token audit showed 8-item response
  // at ~540 tokens typical, ~650 verbose, leaving only ~340 headroom at 990.
  // 1200 gives ~550 headroom and removes truncation risk on verbose action/why fields.
  const obj = extractJSON(raw, "foundations");
  if (Array.isArray(obj)) throw new Error("foundations: expected object");
  return {
    summary:     obj.summary || "",
    foundations: (obj.foundations||[]).map(x => ({ n:x.n, skill:toTitleCase(x.skill||""), category:x.category||"", why:x.why||"", action:x.action||"", priority:x.priority||"Develop" })),
  };
}

async function getProgressionPaths(title, iscoGroup) {
  const SYSTEM_PROG =
`You are a senior career development adviser with deep knowledge of occupational pathways in Singapore and the ASEAN region. You understand how careers actually progress in organisations - not just what looks good on paper, but what is realistic given market structures, typical promotion timelines, and skill adjacencies.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"r":"Role Title","dir":"up","note":"One line on what changes or grows","gap":["Skill 1","Skill 2","Skill 3","Skill 4"],"step":""}]
Direction codes:
- up: clear promotion or seniority increase - more responsibility, more people, or larger scope
- lateral: same seniority level, different function or specialisation - a pivot not a step up
- specialist: deeper technical or domain expertise - becoming the go-to expert rather than a manager
gap: exactly 4 skills this person would need to develop - new capabilities not already in the current role
step: for dir=up only - if the skill gap is large, name one realistic intermediate role as a stepping stone. Otherwise empty string.
Thinking approach: Before listing roles, consider - what do people in this role typically move into after 2 to 3 years? What does the hiring market in Singapore recognise as a natural next step? What specialist niches exist in this field?
Quality rules:
- Return exactly 6 items: at least 2 up, at least 1 lateral, at least 1 specialist
- Do not include the current role itself
- Roles must be realistic in Singapore and ASEAN - not US-specific titles or structures
- Keep all string values under 10 words. No quote characters inside string values.
Bad example: listing "VP of Everything" as an up path for a junior analyst - too large a jump
Good example: listing "Senior Analyst" then "Analytics Manager" as sequential up paths with a step between them`;

  const raw = await claudeCall(
`Current role: ${title}
ISCO group: ${iscoGroup||"general"}
Return exactly 6 realistic career progression paths for this role in Singapore and ASEAN context. Cover a genuine mix of promotion, lateral move, and specialist directions.`, 880, 1, SYSTEM_PROG);
  const arr = extractJSON(raw, "progression");
  if (!Array.isArray(arr)) throw new Error("Progression: expected array");
  return arr.map(x => ({ role:toTitleCase(x.r||x.role||""), dir:x.dir||"up", note:x.note||"", gap:(x.gap||[]).map(g => toTitleCase(g)), step:x.step ? toTitleCase(x.step) : "" }));
}

async function getCrossoverRoles(title, skills) {
  const topSkills = skills.slice(0,6).map(s => s.skill).join(", ");

  const SYSTEM_CROSS =
`You are a career transition specialist who helps working adults pivot into new sectors without starting from scratch. You identify roles in different industries where a person's existing skills transfer directly - giving them a credible entry point rather than a complete restart. You apply Singapore and ASEAN labour market context.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"r":"Role Title","sector":"Industry or sector","bridge":"Key shared skill under 6 words","new":["New skill 1","New skill 2","New skill 3"]}]
Field rules:
- r: a real job title someone would search on MyCareersFuture or LinkedIn Singapore
- sector: plain English industry sector
- bridge: the single most transferable skill that makes this crossover credible
- new: exactly 2 to 3 skills the person would need to develop - genuine gaps, not just variations of what they already have
Thinking approach: For each crossover role, ask - could a recruiter in Singapore be persuaded to consider this person based on their transferable skills alone? If yes, it is a credible crossover.
Quality rules:
- Return exactly 5 items from genuinely different sectors - do not cluster in adjacent industries
- Each role must be a realistic pivot - not a stretch too far, not a trivial rename
- Keep all string values under 10 words. No quote characters inside string values.
Bad example: suggesting "Senior [Same Job Title]" as a crossover - that is progression not crossover
Good example: suggesting "Training Coordinator" as a crossover for an Operations Supervisor - shared facilitation and process skills, new L&D knowledge required`;

  const raw = await claudeCall(
`Current role: ${title}
Core transferable skills: ${topSkills}
Return exactly 5 crossover roles in different sectors where these skills transfer directly. Apply Singapore and ASEAN context - use job titles and sectors that are active in this market.`, 1100, 1, SYSTEM_CROSS);
  // 660 -> 1100: 5 items x 4 fields truncated mid-JSON at 660 on the proxy's
  // current provider (seen live as "Could not parse JSON for crossover").
  const arr = extractJSON(raw, "crossover");
  if (!Array.isArray(arr)) throw new Error("Crossover: expected array");
  return arr.map(x => ({ role:toTitleCase(x.r||x.role||""), sector:x.sector||"", bridge:x.bridge||"", newSkills:(x.new||x.newSkills||[]).map(s => toTitleCase(s)) }));
}


async function getSkillExperts(skillName, currentRole) {
  const SYSTEM_EXPERTS =
`You are a labour market intelligence analyst who understands which occupations are defined by specific skills - not just roles that use a skill incidentally, but roles where it is a primary capability. You apply Singapore and ASEAN labour market context.
Return ONLY a JSON array. No text before or after. No markdown fences.
Format: [{"r":"Role Title","sector":"Industry or sector","why":"One line why this skill is central here under 10 words"}]
Rules:
- Return exactly 5 roles
- Each role must be from a different sector
- The skill must be a defining capability of the role - not peripheral
- Use job titles that appear on MyCareersFuture or LinkedIn Singapore
- Do not return the current role
- Keep all string values under 12 words. No quote characters inside values.`;

  const raw = await claudeCall(
`Skill: ${skillName}
Current role to exclude: ${currentRole}
Find 5 occupations where "${skillName}" is a primary defining capability, not just incidental. Apply Singapore and ASEAN context.`, 440, 1, SYSTEM_EXPERTS);
  const arr = extractJSON(raw, "experts");
  if (!Array.isArray(arr)) return [];
  return arr.map(x => ({
    role: toTitleCase(x.r || x.role || ""),
    sector: x.sector || "",
    why: x.why || "",
  })).filter(x => x.role).slice(0, 5);
}

async function getComparisonSummary(roles) {
  const rolesDesc = roles.map(r =>
    `${r.title}: ${r.humanLed} Human-Led skills, ${r.highCount} Full Automation skills, shared: ${r.sharedSkills.join(", ")||"none"}, development gaps: ${r.gapSkills.join(", ")||"none"}, unique: ${r.uniqueSkills.join(", ")||"none"}`
  ).join("\n");
  const SYSTEM_COMP =
`You are a thoughtful career reflection partner - like a senior colleague who has seen many career decisions and knows how to share an observation without telling someone what to do. Your tone is warm, humble, and specific to the data in front of you. You never prescribe. You invite reflection.
Return ONLY a JSON object. No text before or after. No markdown fences.
Format:
{
  "observation": "One paragraph of 2 to 3 sentences on what stands out across these roles - patterns, differences, or something worth noticing. Humble and specific to the data provided.",
  "nextstep": "One sentence suggesting a concrete next step grounded in the data. Frame as an invitation. Start with: If... or One approach worth considering... or It might be worth...",
  "warning": "One honest observation only if the data genuinely warrants it - e.g. all roles have high automation exposure, or one role has a significantly larger skill gap. Leave as empty string if nothing stands out."
}
Tone rules:
- Use hedging phrases: it appears, you might find, one thing worth reflecting on, the data suggests
- Never use: you should, you must, the best choice is, clearly, obviously
- Be specific to the actual skill data - do not give generic career advice
- Keep all values under 60 words each. No quote characters inside string values.
Bad example observation: "These are all great roles with good career prospects" - generic, not data-specific
Good example observation: "It appears the two analyst roles share a similar automation exposure, while the management role shows notably more Human-Led skills - which may reflect the shift toward people coordination that comes with seniority"`;

  const raw = await claudeCall(
`Roles being compared:
${rolesDesc}

Write a reflection on what stands out across these roles based only on the data provided. Do not invent information not in the data.`, 440, 1, SYSTEM_COMP);
  const obj = extractJSON(raw, "summary");
  if (!obj) return { observation: raw.trim(), nextstep: "", warning: "" };
  return {
    observation: obj.observation || "",
    nextstep: obj.nextstep || "",
    warning: obj.warning || "",
  };
}

async function getRoleContext(title, skills, iscoGroup) {
  const skillList = skills.map(s => `${s.n}:${s.skill}`).join(" | ");

  const SYSTEM_CTX =
`You are a labour market intelligence analyst specialising in how occupations operate across different industries and organisational contexts. You understand where roles are commonly found, how the same job title functions differently depending on sector, and what department structures typically look like in Singapore and ASEAN organisations.
Return ONLY a JSON object. No text before or after. No markdown fences.
Format:
{
  "sectors": [
    {"name":"Sector name","note":"One line on how this role operates in this sector under 12 words","skills":[1,3,5]}
  ],
  "department": "typically sits within [specific function 1] or [specific function 2] - e.g. Finance and FP&A, or HR and Organisational Development"
}
Field rules:
- sectors: return 5 to 6 sectors where this role genuinely exists and is commonly hired
- name: plain English sector name - not jargon
- note: specific to how this role operates in this sector - not generic
- skills: array of skill n numbers most relevant to this sector - minimum 3, include all that apply
- department: specific functional department name as it would appear on an org chart in Singapore - not vague
Thinking approach: For each sector, ask - would a recruiter in this sector recognise and hire this role? What would the day-to-day look like differently here compared to another sector?
Quality rules:
- Do not repeat the same sector under different names
- Each sector must genuinely employ this role - not a stretch
- Keep all string values concise. No quote characters inside string values.
Bad example note: "Works in this sector" - too vague
Good example note: "Manages compliance documentation and audit trails for financial products"`;

  const raw = await claudeCall(
`Role: ${title}
ISCO group: ${iscoGroup||"general"}
Skills (referenced by number): ${skillList}
Identify 5 to 6 sectors where this role is commonly found in Singapore and ASEAN. For each sector, map which skills from the list are most relevant to how this role operates there.`, 880, 1, SYSTEM_CTX);
  const obj = extractJSON(raw, "context");
  if (!obj || !Array.isArray(obj.sectors)) throw new Error("Context: invalid response");
  return {
    sectors: obj.sectors.map(s => ({
      name: toTitleCase(s.name||""),
      note: s.note||"",
      skills: Array.isArray(s.skills) ? s.skills : []
    })),
    department: obj.department||""
  };
}

// Critical Read (W1, PR3): ONE batched advisory LLM pass that CHALLENGES the analysis rather
// than describing it - blueprint's unbuilt Skeptic persona (¬ß5.5) under the Falsification lens
// (¬ß6.8), plus Vacancy Teleology (¬ß6.1) and the Pro-Worker AI Test (¬ß6.9), and the other-side-
// of-the-table hiring notes. ADVISORY ONLY: it authors no number, changes no engine score - it
// argues. Grounded on the engine's own conclusions (band + verbatim duties + skills), not the
// raw corpus. Same shape/contract as getRoleContext. Consumers null-guard; caller .catch -> drop.
async function getCriticalRead(title, band, duties, skills) {
  const dutyList = (Array.isArray(duties) ? duties : []).slice(0, 8).map((d, i) => `${i + 1}. ${d}`).join("\n");
  const skillList = (Array.isArray(skills) ? skills : []).slice(0, 10).join(", ");
  const SYSTEM_CRIT =
`You are a skeptical labour-market analyst running a "critical read" on a Singapore job posting, protecting a candidate from weak evidence and false hope. You NEVER invent or change a number, score or band - you only challenge and interpret. Singapore and ASEAN context. Plain, humble, specific - no hype.
Return ONLY a JSON object. No text before or after. No markdown fences.
Format:
{
  "devilsAdvocate": { "challenges": ["short, concrete doubt about THIS posting or read, under 18 words", ...], "counterCase": "the strongest case that this read is wrong or over-confident, one paragraph under 55 words" },
  "realDemand": "is this demand real, or a template or always-open req - one line under 24 words",
  "teleology": { "whyExists": "why this job really exists now, under 20 words", "problem": "the underlying problem it is hired to solve, under 20 words" },
  "proWorker": { "verdict": "protects", "reasoning": "does this role protect or squeeze the worker, grounded in the given AI-exposure band, under 28 words" },
  "hiring": { "recruiter": "what a recruiter screens for first, under 20 words", "hiringManager": "what the manager actually needs on day one, under 20 words", "interviewCoach": "one question worth preparing for, under 20 words" },
  "ach": { "likely": "real vacancy", "read": "which hypothesis the duty evidence best supports and the one line of evidence, under 30 words", "hypotheses": [{ "name": "real vacancy", "signal": "the strongest sign FOR this hypothesis in the given duties, under 16 words" }, ...] }
}
Rules:
- ach (Analysis of Competing Hypotheses): weigh EXACTLY these hypotheses - real vacancy, always-open pipeline, compliance posting, backfill, expansion. hypotheses: 2 to 4 entries drawn only from that list; ach.likely must be one of them.
- challenges: 2 to 4, each a distinct concrete doubt. Attack over-confidence, template ads, role mash-ups, false or always-open demand, self-serving hype.
- Never output a number, percentage or score anywhere.
- proWorker.verdict must be exactly one of: protects, mixed, squeezes.
- No quote characters inside any string value.`;
  const raw = await claudeCall(
`Role title: ${title}
Engine AI-exposure band for the role: ${band || "not classified"}
Skills (from the analysis): ${skillList || "none listed"}
Duties (verbatim from the posting):
${dutyList || "none extracted"}

Run the critical read: challenge the analysis, test whether the demand is real, say why the job exists, judge whether it protects or squeezes the worker, and give the other-side-of-the-table hiring notes.`,
    900, 1, SYSTEM_CRIT);
  const o = extractJSON(raw, "critical-read");
  if (!o) throw new Error("Critical read: invalid response");
  const s = (x, n) => String(x == null ? "" : x).replace(/"/g, "").trim().slice(0, n || 300);
  const arr = (x, n) => Array.isArray(x) ? x.map((v) => s(v, 140)).filter(Boolean).slice(0, n) : [];
  const da = o.devilsAdvocate || {}, tel = o.teleology || {}, pw = o.proWorker || {}, hi = o.hiring || {};
  const verdict = ["protects", "mixed", "squeezes"].includes(String(pw.verdict || "").toLowerCase()) ? String(pw.verdict).toLowerCase() : null;
  return {
    devilsAdvocate: { challenges: arr(da.challenges, 4), counterCase: s(da.counterCase, 420) },
    realDemand: s(o.realDemand, 220),
    teleology: { whyExists: s(tel.whyExists, 200), problem: s(tel.problem, 200) },
    proWorker: { verdict, reasoning: s(pw.reasoning, 260) },
    hiring: { recruiter: s(hi.recruiter, 200), hiringManager: s(hi.hiringManager, 200), interviewCoach: s(hi.interviewCoach, 200) },
    ach: (() => {
      const a = o.ach || {};
      const ALLOWED = ["real vacancy", "always-open pipeline", "compliance posting", "backfill", "expansion"];
      const likely = ALLOWED.includes(String(a.likely || "").toLowerCase()) ? String(a.likely).toLowerCase() : null;
      const hyps = (Array.isArray(a.hypotheses) ? a.hypotheses : []).map((h) => ({ name: String(h && h.name || "").toLowerCase(), signal: s(h && h.signal, 140) })).filter((h) => ALLOWED.includes(h.name) && h.signal).slice(0, 4);
      return likely ? { likely, read: s(a.read, 260), hypotheses: hyps } : null;
    })(),
  };
}

// ===========================================================================
// Responsibilities Analysis - scrape live MyCareersFuture postings, extract the
// real duties an employer expects, then run the same family of AI analyses we
// run on skills (rating, seniority bands, crossover, sector context, foundation).
// ===========================================================================

const RESP_CATEGORIES = [
  "Delivery & Execution","Planning & Coordination","Stakeholder & Client",
  "Analysis & Reporting","People & Leadership","Compliance & Governance",
  "Improvement & Innovation","Technical & Systems",
];
const RESP_FREQ = {
  Core:       { label:"Core duty",  color:"#1e40af", bg:"#eef2ff", border:"#c7d2fe" },
  Common:     { label:"Common",     color:"#1a56db", bg:"#e8f0fe", border:"#c3d3f5" },
  Occasional: { label:"Occasional", color:"#5b6878", bg:"#f5f7fa", border:"#dde3ec" },
};

// ---- CSG: careers.gov.sg second source helpers (CSG arc, v3.0.92) -----------

// Thin client wrapper over /api/careers - mirrors the MCF fetch shape.
async function fetchCsgJobs(title, limit) {
  const res = await fetch("/api/careers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "jobs", title: title || "", limit: limit || 10 }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(datÔ≠π„FÚµÎ(ö+my◊&W2∆¶ñ«ívÜV‚˜7FñÊrw2gV∆¬÷BfñWr˜VÁ2ÜˆÊR5$∆ˆˆ∑W ¢ÚÚW"˜VÊVB˜7FñÊr¬Ê˜BW"6&Bí‚T’S¢6ÜñÊVBvVˆ6ˆFRfWF6ÇˆÊ«ívÜV‡¢ÚÚFÜR5$÷F6Çó2WÜ7BÊB6'&ñW2˜7F¬6ˆFR‡¢W6TVffV7BÇÇí”‚∞¢ñbÇgV∆ƒBí≤6WDV◊&VrÜÁV∆¬ì≤6WDV◊vVÚÜÁV∆¬ì≤&WGW&‚VÊFVfñÊVC≤–¢∆WB6Ê6V∆∆VB“f«6S∞¢6WDV◊&Vrá≤7FGW3¢&∆ˆFñÊr"¬FF¢ÁV∆¬“ì∞¢6WDV◊vVÚÜÁV∆¬ì∞¢fWF6ÑV◊∆˜ñW%&Vvó7G&Fñˆ‚ÜgV∆ƒBÊ6ˆ◊ÁííÁFÜV‚ÇÜFFí”‚∞¢ñbÜ6Ê6V∆∆VBí&WGW&„∞¢6WDV◊&Vrá≤7FGW3¢&FˆÊR"¬FF¬&WG&ñWfVDC¢ÊWrFFRÇíÁFÙï4ı7G&ñÊrÇí“ì∞¢ñbÜFFbbFFÊ÷F6ÜVB””“&WÜ7B"bbFFÁ˜7F¬í∞¢6WDV◊vVÚá≤7FGW3¢&∆ˆFñÊr"¬FF¢ÁV∆¬“ì∞¢fWF6ÑV◊∆˜ñW$vVˆ6ˆFRÜFFÁ˜7F¬íÁFÜV‚ÇÜvVÚí”‚≤ñbÇ6Ê6V∆∆VBí6WDV◊vVÚá≤7FGW3¢&FˆÊR"¬FF¢vVÚ“ì≤“ì∞¢–¢“ì∞¢&WGW&‚Çí”‚≤6Ê6V∆∆VB“G'VS≤”∞¢“¬∂gV∆ƒE“ì∞†¢W6TVffV7BÇÇí”‚∞¢6ˆÁ7Bˆ‰∂Wí“ÜRí”‚≤ñbÜRÊ∂Wí””“$W66R"í≤6WDˆ∂bÜÁV∆¬ì≤6WD˜V‰f6WBÜÁV∆¬ì≤6WDgV∆ƒBÜÁV∆¬ì≤“”∞¢6ˆÁ7Bˆ‰F˜v‚“ÜRí”‚≤ñbÜ˜V‰f6WBbb&%&VbÊ7W'&VÁBbb&%&VbÊ7W'&VÁBÊ6ˆÁFñÁ2ÜRÁF&vWBíí6WD˜V‰f6WBÜÁV∆¬ì≤”∞¢vñÊF˜rÊFDWfVÁD∆ó7FVÊW"Ç&∂WñF˜v‚"¬ˆ‰∂Wíì∞¢vñÊF˜rÊFDWfVÁD∆ó7FVÊW"Ç&÷˜W6VF˜v‚"¬ˆ‰F˜v‚ì∞¢&WGW&‚Çí”‚≤vñÊF˜rÁ&V÷˜fTWfVÁD∆ó7FVÊW"Ç&∂WñF˜v‚"¬ˆ‰∂Wíì≤vñÊF˜rÁ&V÷˜fTWfVÁD∆ó7FVÊW"Ç&÷˜W6VF˜v‚"¬ˆ‰F˜v‚ì≤”∞¢“¬∂˜V‰f6WE“ì∞†¢6ˆÁ7B&6T¶ˆ'2“W6T÷V÷ÚÇÇí”‚Üg&W6Ñw&BÚ7FFRÊ¶ˆ'2Êfñ«FW"á7FW$ó4g&W6Çí¢7FFRÊ¶ˆ'2í¬∑7FFRÊ¶ˆ'2¬g&W6Ñw&E“ì∞†¢ÚÚT’3¢6÷R÷V◊∆˜ñW"6˜VÁG2˜fW"FÜReTƒ¬÷W&vVB&W7V«B6WBá7FFRÊ¶ˆ'2–¢ÚÚFÜó26V&6Ç¬&˜FÇ∆Ff˜&◊2¬∆ófR˜7FñÊw2í¬Ê˜BFÜRg&W6Ñw&B÷fñ«FW&V@¢ÚÚ&6T¶ˆ'2“FÜR6˜VÁBw266˜Ró2FÜR6V&6Ç&W7V«B¬7FFVBfW&&Fñ“ñ‚FÜP¢ÚÚfˆ˜FW"¬ÊWfW"'F˜F¬˜VÊñÊw2"‚W&RgVÊ7Fñˆ‚ˆb7FFRÊ¶ˆ'2”‚FWFW&÷ñÊó7Fñ2‡¢6ˆÁ7BV◊∆˜ñW$∂Wî6˜VÁG2“W6T÷V÷ÚÇÇí”‚∞¢6ˆÁ7B““ÊWr÷Çì∞¢7FFRÊ¶ˆ'2Êf˜$V6ÇÇÜ¢í”‚≤6ˆÁ7B≤“7FW$V◊∆˜ñW$∂WíÜ¢ì≤“Á6WBÜ≤¬Ü“ÊvWBÜ≤í«¬í≤ì≤“ì∞¢&WGW&‚”∞¢“¬∑7FFRÊ¶ˆ'5“ì∞†¢ÚÚFV6˜&FRV6Ç¶ˆ"vóFÇóG26∆76ñfñ6Fñˆ‚≤Fó7∆ífñV∆G2á7F&∆RñB'íñÊFWÇê¢6ˆÁ7B6&G2“W6T÷V÷ÚÇÇí”‚&6T¶ˆ'2Ê÷ÇÜ¢¬íí”‚∞¢6ˆÁ7BñB“7FW$¶ˆ$ñBÜ¢¬íì∞¢6ˆÁ7B2“6«5∂ñE“«¬∑”∞¢6ˆÁ7B&ÊB“2Ê&ÊBÚ5DU%Ù$‰E5∂2Ê&ÊE“¢ÁV∆√∞¢6ˆÁ7B6÷TV◊∆˜ñW$6˜VÁB“ÜV◊∆˜ñW$∂Wî6˜VÁG2ÊvWBá7FW$V◊∆˜ñW$∂WíÜ¢íí«¬í“∞¢&WGW&‚∞¢ñB¬¶ˆ#¢¢¬6√¢2¿¢&ÊB¬&ÊD∂Wì¢2Ê&ÊB«¬ÁV∆¬¿¢÷F6ÖFñW#¢7FW$÷F6ÖFñW"Ü¢¬VW'íí¿¢6Ü˜'C¢7FW%6Ü˜'BÜ¢ÁFóF∆Rí¿¢76ˆ3¢2Á76ˆ2«¬ÁV∆¬¿¢6ˆ◊Áì¢¢ÊV◊∆˜ñW"«¬%VÊ∂Ê˜v‚V◊∆˜ñW""¿¢FW'F÷VÁC¢2ÊFW'F÷VÁBÚFıFóF∆T66RÜ2ÊFW'F÷VÁBí¢%VÊ6∆76ñfñVB"¿¢FW'F÷VÁD6ˆFS¢2ÊFW'F÷VÁD6ˆFR«¬ÁV∆¬¿¢¶ˆ$∆WfV√¢2Ê¶ˆ$∆WfV¬«¬ÁV∆¬¿¢6ÜÊvUGóS¢2Ê6ÜÊvUGóR«¬""¿¢6V7F˜#¢2Á6V7F˜"«¬%VÊ6∆76ñfñVB"¿¢gVÊ3¢2ÊgVÊ2«¬ÁV∆¬¿¢Wá¢7FW$Wá&ÊBÜ¢í¿¢GóS¢7FW%GóTˆbÜ¢í¿¢Wá˜7W&S¢&ÊBÚ&ÊBÊ∆&V¬¢ÁV∆¬¿¢6∆'î÷ñC¢2Á6∆'î÷ñB¿¢∆WfV√¢'&íÊó4'&íÜ¢Á˜6óFñˆ‰∆WfV«2íbb¢Á˜6óFñˆ‰∆WfV«5≥“Ú7G&ñÊrÜ¢Á˜6óFñˆ‰∆WfV«5≥“í¢ÁV∆¬¿¢66ÜV÷W3¢'&íÊó4'&íÜ¢Á66ÜV÷W2íÚ¢Á66ÜV÷W2Êfñ«FW"Ñ&ˆˆ∆V‚íÁ6∆ñ6RÉ¬"í¢µ“¿¢6ˆÊfñFVÊ6S¢2Ê6ˆÊfñFVÊ6R«¬ÁV∆¬¿¢÷WF¢∑7FW%6∆'íÜ¢Á6∆'î÷ñ‚¬¢Á6∆'î÷Çí¬7FW%GóTˆbÜ¢í¬¢Ê÷ñÊñ◊V’ñV'4WáW&ñVÊ6R“ÁV∆¬bbÁV÷&W"Ü¢Ê÷ñÊñ◊V’ñV'4WáW&ñVÊ6Rí‚ÚÁV÷&W"Ü¢Ê÷ñÊñ◊V’ñV'4WáW&ñVÊ6Rí≤"≤ó'2"¢ÁV∆≈“Êfñ«FW"Ñ&ˆˆ∆V‚í¿¢Fw3¢'&íÊó4'&íÜ¢Á6∂ñ∆«2íÚ¢Á6∂ñ∆«2Êfñ«FW"Ñ&ˆˆ∆V‚íÁ6∆ñ6RÉ¬2í¢µ“¿¢vS¢7FW$Fó2Ü¢Á˜7FVDFFRí¿¢6÷TV◊∆˜ñW$6˜VÁB¿¢”∞¢“í¬∂&6T¶ˆ'2¬6«2¬V◊∆˜ñW$∂Wî6˜VÁG2¬VW'ï“ì∞†¢ÚÚf6WB˜FñˆÁ2vóFÇW"◊f«VR6˜VÁG2‚%VÊ6∆76ñfñVB"ó2∂WB6ÚFÜRW6W"6‚6VP¢ÚÚÜÊBfñ«FW"ˆ‚íFÜR54Ù2◊vóFÜÜV∆B˜'Fñˆ‚ˆbFÜR&W7V«B6WC≤óBw26˜'FVB∆7B‡¢6ˆÁ7Bf6WD˜FñˆÁ2“W6T÷V÷ÚÇÇí”‚∞¢6ˆÁ7BÚ“∑”∞¢5DU%Ùd4UE2Êf˜$V6ÇÇÜbí”‚∞¢6ˆÁ7B6˜VÁG2“∑”∞¢6&G2Êf˜$V6ÇÇÜ2í”‚≤6ˆÁ7Bb“5∂bÊ∂Wï”≤ñbábí6˜VÁG5∑e““Ü6˜VÁG5∑e“«¬í≤≤“ì∞¢ı∂bÊ∂Wï““ˆ&¶V7BÊ∂Wó2Ü6˜VÁG2íÁ6˜'BÇÜ¬"í”‚∞¢ñbÜ””“%VÊ6∆76ñfñVB"bb"”“%VÊ6∆76ñfñVB"í&WGW&‚∞¢ñbÜ"””“%VÊ6∆76ñfñVB"bb”“%VÊ6∆76ñfñVB"í&WGW&‚”∞¢&WGW&‚Ü6˜VÁG5∂%““6˜VÁG5∂“í«¬Ê∆ˆ6∆T6ˆ◊&RÜ"ì∞¢“íÊ÷Çábí”‚á≤b¬„¢6˜VÁG5∑e““íì∞¢“ì∞¢&WGW&‚Û∞¢“¬∂6&G5“ì∞†¢6ˆÁ7Bfñ«FW&VB“W6T÷V÷ÚÇÇí”‚∞¢6ˆÁ7B“fñÊEFWáBÁG&ñ“ÇíÁFÙ∆˜vW$66RÇì∞¢&WGW&‚6&G2Êfñ«FW"ÇÜ2í”‚∞¢f˜"Ü6ˆÁ7Bbˆb5DU%Ùd4UE2í≤6ˆÁ7B6V¬“f6WG5∂bÊ∂Wï”≤ñbá6V¬Ê∆VÊwFÇbbÇ5∂bÊ∂Wï“«¬6V¬ÊñÊ6«VFW2Ü5∂bÊ∂Wï“ííí&WGW&‚f«6S≤–¢ñbÇí&WGW&‚G'VS∞¢6ˆÁ7BÜí“∂2Ê¶ˆ"ÁFóF∆R¬2Ê6ˆ◊Áí¬2Á6V7F˜"¬2ÊFW'F÷VÁB¬2ÊgVÊ2¬2Á76ˆ2¬2Ê÷F6ÖFñW"¬Ü2ÁFw2«¬µ“íÊ¶ˆñ‚Ç""ï“Ê¶ˆñ‚Ç""íÁFÙ∆˜vW$66RÇì∞¢&WGW&‚ÜíÊñÊ6«VFW2áì∞¢“ì∞¢“¬∂6&G2¬fñÊEFWáB¬f6WG5“ì∞†¢6ˆÁ7B6˜'FVB“W6T÷V÷ÚÇÇí”‚∞¢6ˆÁ7Br“fñ«FW&VBÁ6∆ñ6RÇì∞¢ñbá6˜'B””“'FóF∆R"írÁ6˜'BÇÜ¬"í”‚Á6Ü˜'BÊ∆ˆ6∆T6ˆ◊&RÜ"Á6Ü˜'Bíì∞¢V«6Rñbá6˜'B””“'6∆'í"írÁ6˜'BÇÜ¬"í”‚Ü"Á6∆'î÷ñB«¬í“ÜÁ6∆'î÷ñB«¬íì∞¢V«6Rñbá6˜'B””“'&V6VÁB"írÁ6˜'BÇÜ¬"í”‚ÊWrFFRÜ"Ê¶ˆ"Á˜7FVDFFR«¬í“ÊWrFFRÜÊ¶ˆ"Á˜7FVDFFR«¬íì∞¢ÚÚ&÷F6Ç"˜&FW'2'íFÜR4‘R7FW$÷F6ÖFñW"6∆76ñfñW"FÜBG&ófW2V6Ç6&Bw2fó6ñ&∆P¢ÚÚ&FvRÊBFÜR÷F6Çf6WB“óBW6VBFÚßW7B∂VWFÜR6ˆ'6RfWF6Ç◊Fñ÷R'V6∂WB˜&FW ¢ÚÚáFóF∆R˜&W7ˆÁ6ñ&ñ∆óGí˜6Vv÷VÁBˆ˜FÜW"í¬vÜñ6Ç6˜V∆BFó6w&VRvóFÇFÜR&FvR6&@¢ÚÚ7GV∆«í6Ü˜vVB‚&V6VÊ7í'&V∑2FñW2vóFÜñ‚FñW"‡¢V«6RrÁ6˜'BÇÜ¬"í”‚Ö5DU%Ù‘D4ÖıDîU%2ÊñÊFWÑˆbÜÊ÷F6ÖFñW"í“5DU%Ù‘D4ÖıDîU%2ÊñÊFWÑˆbÜ"Ê÷F6ÖFñW"íí«¬ÜÊWrFFRÜ"Ê¶ˆ"Á˜7FVDFFR«¬í“ÊWrFFRÜÊ¶ˆ"Á˜7FVDFFR«¬ííì∞¢&WGW&‚s∞¢“¬∂fñ«FW&VB¬6˜'E“ì∞†¢6ˆÁ7B7FófTf6WD6˜VÁB“5DU%Ùd4UE2Á&VGV6RÇÜ‚¬bí”‚‚≤f6WG5∂bÊ∂Wï“Ê∆VÊwFÇ¬ì∞¢6ˆÁ7BÜ4fñ«FW'2“7FófTf6WD6˜VÁB‚«¬fñÊEFWáBÁG&ñ“ÇíÊ∆VÊwFÇ‚∞¢6ˆÁ7B6∆V$fñ«FW'2“Çí”‚≤6WDf6WG2Ñˆ&¶V7BÊg&ˆ‘VÁG&ñW2Ö5DU%Ùd4UE2Ê÷ÇÜbí”‚∂bÊ∂Wí¬µ’“ííì≤6WDfñÊEFWáBÇ""ì≤”∞¢6ˆÁ7BFˆvv∆Tf6WB“Ü∂Wí¬f¬í”‚6WDf6WG2ÇÜbí”‚á≤‚‚Êb¬∂∂Wï”¢e∂∂Wï“ÊñÊ6«VFW2áf¬íÚe∂∂Wï“Êfñ«FW"ÇáÇí”‚Ç”“f¬í¢e∂∂Wï“Ê6ˆÊ6Báf¬í“íì∞¢6ˆÁ7Bó476r“Ü¢í”‚ˆ6&VW'5¬Êv˜bˆíÁFW7BÜ¢bb¢Á6˜W&6R«¬""ì∞¢6ˆÁ7B÷6d6&G2“6˜'FVBÊfñ«FW"ÇÜ2í”‚ó476rÜ2Ê¶ˆ"íì∞¢6ˆÁ7B76t6&G2“6˜'FVBÊfñ«FW"ÇÜ2í”‚ó476rÜ2Ê¶ˆ"íì∞¢6ˆÁ7B6V7F˜'5&W6VÁB“≤‚‚ÊÊWr6WBá6˜'FVBÊ÷ÇÜ2í”‚2Á6V7F˜"íÊfñ«FW"Çá2í”‚2bb2”“%VÊ6∆76ñfñVB"íï“Á6˜'BÇì∞¢6ˆÁ7BFˆ4w&˜W2“W6T÷V÷ÚÇÇí”‚∞¢ÚÚñÊFWÇFˆ7G&ñÊS¢w&˜W2&Ê∂VB'í˜7FñÊr6˜VÁBÜ&ñvvW7Bf÷ñ«ífó'7B¬VÊ6∆76ñfñVB∆7Bì∞¢ÚÚóFV◊2&Ê∂VB'íFÜR4‘RFWFW&÷ñÊó7Fñ2˜&FW"FÜR6&G2W6R“÷F6ÇFñW"¬FÜV‚6∆'ê¢ÚÚÜñvÇ◊FÚ÷∆˜r2FñV'&V≤“6ÚFÜR&ñ¬&VG227W&FVB&Ê∂ñÊr¬Ê˜B&rfWF6Ç˜&FW"‡¢6ˆÁ7B'í“∑”≤6˜'FVBÊf˜$V6ÇÇÜ2í”‚≤Ü'ï∂2Á6V7F˜"«¬%VÊ6∆76ñfñVB%““'ï∂2Á6V7F˜"«¬%VÊ6∆76ñfñVB%“«¬µ“íÁW6ÇÜ2ì≤“ì∞¢6ˆÁ7B&Ê≤“Ü2í”‚5DU%Ù‘D4ÖıDîU%2ÊñÊFWÑˆbÜ2Ê÷F6ÖFñW"ì∞¢&WGW&‚ˆ&¶V7BÊ∂Wó2Ü'íê¢Á6˜'BÇáÇ¬íí”‚áÇ””“%VÊ6∆76ñfñVB"í“áí””“%VÊ6∆76ñfñVB"í«¬'ï∑ï“Ê∆VÊwFÇ“'ï∑Ö“Ê∆VÊwFÇ«¬ÇÊ∆ˆ6∆T6ˆ◊&Ráííê¢Ê÷Çá2í”‚á≤6V7F˜#¢2¬óFV◊3¢≤‚‚Ê'ï∑5’“Á6˜'BÇÜ¬"í”‚á&Ê≤Üí“&Ê≤Ü"íí«¬ÇÜ"Á6∆'î÷ñB«¬í“ÜÁ6∆'î÷ñB«¬ííí“íì∞¢“¬∑6˜'FVE“ì∞†¢6ˆÁ7B¥î4≤“≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁEvVñváC¢c¬6ˆ∆˜#¢"3f#cCSb"”∞¢6ˆÁ7B“7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#2í¬"“7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#Bí¬DıB“7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#rí¬Tƒ¬“7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ##bì∞¢6ˆÁ7B4ı%EÙıE2“µ≤&÷F6Ç"¬$&W7B÷F6Ç%“¬≤'&V6VÁB"¬$÷˜7B&V6VÁB%“¬≤'6∆'í"¬%6∆'íÜñvÇ÷∆˜r%“¬≤'FóF∆R"¬%FóF∆R’¢%’”∞¢6ˆÁ7B6˜'D∆&V¬“Ö4ı%EÙıE2ÊfñÊBÇÜÚí”‚ı≥“””“6˜'Bí«¬4ı%EÙıE5≥“ï≥”∞†¢6ˆÁ7Bˆ∂dFˆ2“W6T÷V÷ÚÇÇí”‚∞¢ñbÇˆ∂bí&WGW&‚ÁV∆√∞¢ñbÜˆ∂bÊ∂ñÊB””“'˜7FñÊr"í≤6ˆÁ7B2“6&G2ÊfñÊBÇáÇí”‚ÇÊñB””“ˆ∂bÊñBí«¬6&G5≥”≤&WGW&‚2Ú≤FÉ¢'˜7FñÊw2Ú"≤2ÊñB≤"Ê÷B"¬‚‚Á7FW$'Vñ∆Dˆ∂bÜ2Ê¶ˆ"¬2Ê6¬í“¢ÁV∆√≤–¢ñbÜˆ∂bÊ∂ñÊB””“&ñÊFWÇ"í&WGW&‚≤FÉ¢&ñÊFWÇÊ÷B"¬‚‚Á7FW$'Vñ∆Dˆ∂dñÊFWÇá6˜'FVB¬VW'íí”∞¢ñbÜˆ∂bÊ∂ñÊB””“'6V7F˜""í&WGW&‚≤FÉ¢'6V7F˜'2Ú"≤6«VvñgíÜˆ∂bÊÊ÷Rí≤"Ê÷B"¬‚‚Á7FW$'Vñ∆Dˆ∂e6V7F˜"Üˆ∂bÊÊ÷R¬6˜'FVBí”∞¢ñbÜˆ∂bÊ∂ñÊB””“&∆ˆr"í&WGW&‚≤FÉ¢&∆ˆrÊ÷B"¬‚‚Á7FW$'Vñ∆Dˆ∂d∆ˆráVW'í¬≤÷6c¢÷6d6&G2Ê∆VÊwFÇ¬76s¢76t6&G2Ê∆VÊwFÇ“í”∞¢&WGW&‚ÁV∆√∞¢“¬∂ˆ∂b¬6&G2¬6˜'FVB¬VW'í¬÷6d6&G2Ê∆VÊwFÇ¬76t6&G2Ê∆VÊwFÖ“ì∞†¢ÚÚ&ñ6Ç˜7FñÊr6&C¢≤FWFW&÷ñÊó7Fñ27ñÊ˜6ó2≤6∂ñ∆«6WG2‡¢6ˆÁ7B&VÊFW$6&B“Ü2í”‚∞¢6ˆÁ7B6V¬“6V∆V7FVDñB””“2ÊñC≤6ˆÁ7B&ÊB“2Ê&ÊC∞¢6ˆÁ7B7ñÊ˜6ó2“7FW%7ñÊ˜6ó2Ü2Ê¶ˆ"ì∞¢6ˆÁ7B6∂ñ∆«2“'&íÊó4'&íÜ2Ê¶ˆ"Á6∂ñ∆«2íÚ2Ê¶ˆ"Á6∂ñ∆«2Êfñ«FW"Ñ&ˆˆ∆V‚íÁ6∆ñ6RÉ¬Rí¢µ”∞¢&WGW&‚Ä¢∆Fób∂Wì◊∂2ÊñG“&Vc◊≤ÜV¬í”‚≤ñbÜV¬í6&E&Vg2Ê7W'&VÁE∂2ÊñE““V√≤◊“ˆ‰6∆ñ6≥◊≤Çí”‚6WDgV∆ƒBÜ2ó“6∆74Ê÷S◊∂&∆ñÊ¥ñB””“2ÊñBÚ&6&B÷&∆ñÊ≤"¢VÊFVfñÊVG“7Gñ∆S◊∑≤7W'6˜#¢'ˆñÁFW""¬&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#„WÇ6ˆ∆ñB"≤á6V¬Ú"3SfF""¢"6SÜSVFB"í¬&˜&FW%&FóW3¢¬˜fW&f∆˜s¢&ÜñFFV‚"¬&˜Ö6ÜF˜s¢6V¬Ú#gÇáÇ&v&É#b√Éb√#í¬„Rí"¢#Ç'Ç&v&É#√3"√Cb¬„Rí"¬G&Á6óFñˆ„¢&&˜&FW"÷6ˆ∆˜"„W2¬&˜Ç◊6ÜF˜r„W2"¬Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"◊”‡¢≤Ú¢dÙƒîÚc"ÑáV÷‚∆VB¬r”rs#bì¢6ˆ◊Áí∆VG2&˜r≤&˜r"ó2fˆ∆FW"’D ¢7G&ó“∂÷F6ÇFñW%“ÊB≤¥‚G5“&R6W&FRF'2¬V6Ç˜VÊñÊróG2˜v‚ÊV¿¢áFñW"”‚vÜBFÜR÷F6Ç&6ó2÷VÁ3≤G2”‚FÜRV◊∆˜ñW"w2˜FÜW"¶ˆ'2ÜW&Rí‚¢˜–¢≤ÇÇí”‚∞¢6ˆÁ7B˜FÜW'2“6˜'FVBÊfñ«FW"ÇáÇí”‚ÇÊñB”“2ÊñBbb7FW$V◊∆˜ñW$∂WíáÇÊ¶ˆ"í””“7FW$V◊∆˜ñW$∂WíÜ2Ê¶ˆ"íì∞¢6ˆÁ7B˜VÂF"“fˆ∆ñÙñB””“2ÊñBÚfˆ∆ñıF"¢ÁV∆√∞¢6ˆÁ7B6WEF"“áBí”‚≤ñbÜ˜VÂF"””“Bí≤6WDfˆ∆ñÙñBÜÁV∆¬ì≤6WDfˆ∆ñıF"ÜÁV∆¬ì≤“V«6R≤6WDfˆ∆ñÙñBÜ2ÊñBì≤6WDfˆ∆ñıF"áBì≤“”∞¢6ˆÁ7BF%7Gñ∆R“Üˆ‚í”‚á∞¢Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢R¬÷ñ‰ÜVñváC¢3b¬FFñÊs¢#WÇ'Ç"¿¢fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬fˆÁEvVñváC¢s¬vÜóFU76S¢&Ê˜w&"¿¢6ˆ∆˜#¢ˆ‚Ú"3C&ÜR"¢"3V#cÉsÇ"¿¢&6∂w&˜VÊC¢ˆ‚Ú"6f&fcÇ"¢"6VVccR"¿¢&˜&FW#¢#Ç6ˆ∆ñB"≤Üˆ‚Ú"6CñFVSb"¢"6S6SÜVb"í¿¢&˜&FW$&˜GFˆ”¢ˆ‚Ú#Ç6ˆ∆ñB6f&fcÇ"¢#Ç6ˆ∆ñB6CñFVSb"¿¢&˜&FW%&FóW3¢#óÇóÇ"¬7W'6˜#¢'ˆñÁFW""¬÷&vñ‰&˜GFˆ”¢”¬˜6óFñˆ„¢'&V∆FófR"¬§ñÊFWÉ¢ˆ‚Ú"¢¿¢“ì∞¢&WGW&‚Ä¢√‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬÷ñ‰ÜVñváC¢CB¬FFñÊs¢#áÇÇGÇ"¬&6∂w&˜VÊC¢"6cFcff"◊”‡¢«7‚&ñ÷ÜñFFV„“'G'VR"7Gñ∆S◊∑≤vñGFÉ¢#¬ÜVñváC¢#¬&˜&FW%&FóW3¢R¬&6∂w&˜VÊC¢"6F&S&V"¬6ˆ∆˜#¢"3S#cv"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁEvVñváC¢É¬fˆÁE6ó¶S¢¬∆ñÊTÜVñváC¢##Ç"¬FWáD∆ñv„¢&6VÁFW""¬f∆WÉ¢&ÊˆÊR"◊”Á≤Ü2Ê6ˆ◊Áí«¬#Ú"íÁ6∆ñ6RÉ¬íÁFıWW$66RÇó”¬˜7„‡¢«7‚FóF∆S◊∂2Ê6ˆ◊Áó“7Gñ∆S◊∑≤f∆WÉ¢¬÷ñÂvñGFÉ¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„ì3sW&V“"¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢"3c#&R"¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"◊”Á∂2Ê6ˆ◊Áó”¬˜7„‡¢∂&ÊBbb«7‚FóF∆S◊≤$íWá˜7W&S¢"≤&ÊBÊ∆&V«“7Gñ∆S◊∑≤vñGFÉ¢Ç¬ÜVñváC¢Ç¬&˜&FW%&FóW3¢#SR"¬&6∂w&˜VÊC¢&ÊBÊF˜B¬f∆WÉ¢&ÊˆÊR"◊“ÛÁ–¢¬ˆFóc‡¢∆Fóbˆ‰6∆ñ6≥◊≤ÜRí”‚RÁ7F˜&˜vFñˆ‚Çó“7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&f∆WÇ÷VÊB"¬v¢R¬FFñÊs¢#GÇÇ"¬&6∂w&˜VÊC¢"6cFcff"¬&˜&FW$&˜GFˆ”¢#Ç6ˆ∆ñB6CñFVSb"¬7W'6˜#¢&FVfV«B"◊”‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"&ñ÷WáÊFVC◊∂˜VÂF"””“'FñW"'–¢&ñ÷∆&V√◊≤$÷F6Ç&6ó3¢"≤2Ê÷F6ÖFñW"≤"‚FFÚ"≤Ü˜VÂF"””“'FñW""Ú&ÜñFR"¢'6Ü˜r"í≤"vÜBFÜó2÷VÁ2‚'–¢ˆ‰6∆ñ6≥◊≤Çí”‚6WEF"Ç'FñW""ó“7Gñ∆S◊∑F%7Gñ∆RÜ˜VÂF"””“'FñW""ó”‡¢∂2Ê÷F6ÖFñW'“«7‚&ñ÷ÜñFFV„“'G'VR"7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„Sc#W&V“"¬G&Á6f˜&”¢˜VÂF"””“'FñW""Ú'&˜FFRÉÉFVrí"¢&ÊˆÊR"¬G&Á6óFñˆ„¢'G&Á6f˜&“„W2"◊”Áµ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#V&Ró”¬˜7„‡¢¬ˆ'WGFˆ„‡¢∂˜FÜW'2Ê∆VÊwFÇ‚bbÄ¢∆'WGFˆ‚GóS“&'WGFˆ‚"&ñ÷WáÊFVC◊∂˜VÂF"””“&G2'–¢&ñ÷∆&V√◊∂˜FÜW'2Ê∆VÊwFÇ≤"÷˜&RB"≤Ü˜FÜW'2Ê∆VÊwFÇ””“Ú""¢'2"í≤"g&ˆ“FÜó2V◊∆˜ñW"ñ‚FÜó2&W7V«B‚FFÚ"≤Ü˜VÂF"””“&G2"Ú&ÜñFR"¢&∆ó7B"í≤"FÜV“‚'–¢ˆ‰6∆ñ6≥◊≤Çí”‚6WEF"Ç&G2"ó“7Gñ∆S◊∑≤‚‚ÁF%7Gñ∆RÜ˜VÂF"””“&G2"í¬6ˆ∆˜#¢˜VÂF"””“&G2"Ú"3vF#""¢"3vF#""¬&6∂w&˜VÊC¢˜VÂF"””“&G2"Ú"6f&fcÇ"¢"6fFVVCí"¬&˜&FW#¢#Ç6ˆ∆ñB"≤Ü˜VÂF"””“&G2"Ú"6c6CñR"¢"6c6CñR"í¬&˜&FW$&˜GFˆ”¢˜VÂF"””“&G2"Ú#Ç6ˆ∆ñB6f&fcÇ"¢#Ç6ˆ∆ñB6CñFVSb"◊”‡¢∑∂˜FÜW'2Ê∆VÊwFá“G2«7‚&ñ÷ÜñFFV„“'G'VR"7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„Sc#W&V“"¬G&Á6f˜&”¢˜VÂF"””“&G2"Ú'&˜FFRÉÉFVrí"¢&ÊˆÊR"¬G&Á6óFñˆ„¢'G&Á6f˜&“„W2"◊”Áµ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#V&Ró”¬˜7„‡¢¬ˆ'WGFˆ„‡¢ó–¢¬ˆFóc‡¢∂˜VÂF"””“'FñW""bbÄ¢∆Fóbˆ‰6∆ñ6≥◊≤ÜRí”‚RÁ7F˜&˜vFñˆ‚Çó“7Gñ∆S◊∑≤FFñÊs¢#óÇ'Ç"¬&6∂w&˜VÊC¢"6f&fcÇ"¬&˜&FW$&˜GFˆ”¢#Ç6ˆ∆ñB6SfS6F""¬7W'6˜#¢&FVfV«B"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3S#cv"¬∆ñÊTÜVñváC¢„R◊”„«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s◊”‰÷F6Ç&6ó3¬˜7„‚µ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#ró“∑7FW$÷F6ÖFñW%FóF∆RÜ2Ê÷F6ÖFñW"ó”¬˜‡¢¬ˆFóc‡¢ó–¢∂˜VÂF"””“&G2"bbÄ¢∆Fóbˆ‰6∆ñ6≥◊≤ÜRí”‚RÁ7F˜&˜vFñˆ‚Çó“7Gñ∆S◊∑≤FFñÊs¢#óÇ'Ç"¬&6∂w&˜VÊC¢"6f&fcÇ"¬&˜&FW$&˜GFˆ”¢#Ç6ˆ∆ñB6SfS6F""¬7W'6˜#¢&FVfV«B"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢#7Ç"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬fˆÁEvVñváC¢c¬∆WGFW%76ñÊs¢"„V“"¬6ˆ∆˜#¢"3f#cCSb"◊”‰ıDÑU"E2µ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#ró“DÑï2T’ƒıîU"µ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#ró“DÑï2$U5T≈C¬˜‡¢∂˜FÜW'2Á6∆ñ6RÉ¬bíÊ÷ÇÜÚí”‚Ä¢∆'WGFˆ‚∂Wì◊∂ÚÊñG“GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊≤ÜRí”‚≤RÁ7F˜&˜vFñˆ‚Çì≤6WDfˆ∆ñÙñBÜÁV∆¬ì≤6WDfˆ∆ñıF"ÜÁV∆¬ì≤6WDgV∆ƒBÜÚì≤◊–¢7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬vñGFÉ¢#R"¬÷ñ‰ÜVñváC¢CB¬FFñÊs¢#WÇwÇ"¬&6∂w&˜VÊC¢'G&Á7&VÁB"¬&˜&FW#¢#Ç6ˆ∆ñBG&Á7&VÁB"¬&˜&FW%&FóW3¢b¬7W'6˜#¢'ˆñÁFW""¬FWáD∆ñv„¢&∆VgB"◊”‡¢«7‚7Gñ∆S◊∑≤f∆WÉ¢¬÷ñÂvñGFÉ¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢c¬6ˆ∆˜#¢"3SfF""¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"◊”Á∂ÚÊ¶ˆ"ÁFóF∆W”¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3S#cv"¬f∆WÉ¢&ÊˆÊR"◊”Á∂ÚÁ6∆'î÷ñB“ÁV∆¬Ú≈7FW%6∆'îf∆˜r÷ñC◊∂ÚÁ6∆'î÷ñG“Û‚¢ÜÚÊvR«¬""ó”¬˜7„‡¢¬ˆ'WGFˆ„‡¢íó–¢∂˜FÜW'2Ê∆VÊwFÇ‚bbb«7Gñ∆S◊∑≤÷&vñ„¢#7Ç"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3f#c3Sr"◊”‚∑∂˜FÜW'2Ê∆VÊwFÇ“g“÷˜&R“W6RFÜRV◊∆˜ñW"fñ«FW"&˜fR„¬˜Á–¢¬ˆFóc‡¢ó–¢¬Û‡¢ì∞¢“íÇó–¢∆Fób7Gñ∆S◊∑≤FFñÊs¢#Ç'Ç'Ç"¬Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬f∆WÉ¢◊”‡¢∆É2FóF∆S◊∂2Ê¶ˆ"ÁFóF∆W“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"tÊWw7&VFW"r«6W&ñb"¬fˆÁEvVñváC¢c¬fˆÁE6ó¶S¢#„c#W&V“"¬∆ñÊTÜVñváC¢„#B¬6ˆ∆˜#¢"3c#&R"¬÷&vñ„¢¬Fó7∆ì¢"◊vV&∂óB÷&˜Ç"¬vV&∂óD∆ñÊT6∆◊¢"¬vV&∂óD&˜Ñ˜&ñVÁC¢'fW'Fñ6¬"¬˜fW&f∆˜s¢&ÜñFFV‚"◊”Á∂2Ê¶ˆ"ÁFóF∆W”¬ˆÉ3‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢R¬÷&vñ„¢#WÇwÇ"◊”‡¢≤Ü2ÊvR””“'FˆFí"«¬2ÊvR””“'ñW7FW&Fí"íbb«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬∆WGFW%76ñÊs¢"„fV“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"6ffb"¬&6∂w&˜VÊC¢"3SfF""¬&˜&FW%&FóW3¢2¬FFñÊs¢#ÇGÇ"◊”‰‰Us¬˜7„Á–¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬∆WGFW%76ñÊs¢"„6V“"¬6ˆ∆˜#¢Ü2ÊvR””“'FˆFí"«¬2ÊvR””“'ñW7FW&Fí"íÚ"3SfF""¢"3f#c3Sr"¬fˆÁEvVñváC¢Ü2ÊvR””“'FˆFí"«¬2ÊvR””“'ñW7FW&Fí"íÚc¢C◊”Á∂2ÊvR«¬"'”¬˜7„‡¢¬ˆFóc‡¢∂2Á76ˆ2bb∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬f∆WÖw&¢'w&"¬v¢B¬÷&vñ‰&˜GFˆ”¢r◊”„«7‚FóF∆S◊∑7FW%76ˆ46ÜóFóF∆RÜ2ó“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3V#F&&B"¬&6∂w&˜VÊC¢"6cVVf2"¬&˜&FW#¢#Ç6ˆ∆ñB6FFCVcb"¬&˜&FW%&FóW3¢R¬FFñÊs¢#ÇgÇ"¬÷ÖvñGFÉ¢#R"¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"¬&˜Ö6ó¶ñÊs¢&&˜&FW"÷&˜Ç"◊”Â54Ù2∂2Á76ˆ7“¥DıG“∂2Á6V7F˜'”¬˜7„Á∂2Ê6ˆÊfñFVÊ6Rbb2Ê6ˆÊfñFVÊ6R”“'vóFÜÜV∆B"bb«7‚FóF∆S◊≤%54Ù26∆76ñfñ6Fñˆ‚6ˆÊfñFVÊ6S¢"≤2Ê6ˆÊfñFVÊ6W“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬∆WGFW%76ñÊs¢"„FV“"¬FWáEG&Á6f˜&”¢'WW&66R"¬6ˆ∆˜#¢2Ê6ˆÊfñFVÊ6R””“&ÜñvÇ"Ú"3Sc6"¢2Ê6ˆÊfñFVÊ6R””“&÷VFóV“"Ú"3vVr"¢"666"¬&6∂w&˜VÊC¢2Ê6ˆÊfñFVÊ6R””“&ÜñvÇ"Ú"6SfcFV2"¢2Ê6ˆÊfñFVÊ6R””“&÷VFóV“"Ú"6fFc6F2"¢"6f&SvSr"¬&˜&FW#¢#Ç6ˆ∆ñB"≤Ü2Ê6ˆÊfñFVÊ6R””“&ÜñvÇ"Ú"6&6Ff3í"¢2Ê6ˆÊfñFVÊ6R””“&÷VFóV“"Ú"6cS#2"¢"6c3&3""í¬&˜&FW%&FóW3¢B¬FFñÊs¢#ÇWÇ"¬vÜóFU76S¢&Ê˜w&"◊”Á∂2Ê6ˆÊfñFVÊ6W”¬˜7„Á◊∂2Ê¶ˆ$∆WfV¬bb2Ê¶ˆ$∆WfV¬”“$Ê˜B∆ñ6&∆R"bb«7‚FóF∆S◊≤$'&ˆB¶ˆ"∆WfV¬Ö54Ù2##B6V2‚"„b”"„rì¢6ˆ◊∆WÜóGí˜&ÊvRˆbF6∑2Góñ6¬ˆbFÜó2÷¶˜"w&˜W“Bó2÷˜7B6ˆ◊∆WÇ‚÷¶˜"÷w&˜WGG&ñ'WFR6Ü&VB'íWfW'íˆ67WFñˆ‚ñ‚FÜRw&˜W¬Ê˜BW"÷ˆ67WFñˆ‚÷V7W&V÷VÁBá6V2‚"„Bí‚'“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬∆WGFW%76ñÊs¢"„&V“"¬6ˆ∆˜#¢"36CCSb"¬&6∂w&˜VÊC¢"6cFc&V2"¬&˜&FW#¢#Ç6ˆ∆ñB6S&SCÇ"¬&˜&FW%&FóW3¢B¬FFñÊs¢#ÇWÇ"¬vÜóFU76S¢&Ê˜w&"◊”‰¶ˆ"∆WfV¬∂2Ê¶ˆ$∆WfV«”¬˜7„Á”¬ˆFócÁ–¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v¢R¬÷&vñ‰&˜GFˆ”¢Ç◊”‡¢∂2Ê÷WFÁ6∆ñ6RÉ¬"íÊ÷ÇÜ“¬íí”‚É«7‚∂Wì◊∂ó“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3CsSScí"¬&6∂w&˜VÊC¢"6ccFcÇ"¬&˜&FW#¢#Ç6ˆ∆ñB6S6SÜVb"¬&˜&FW%&FóW3¢b¬FFñÊs¢#'ÇwÇ"◊”Á∂◊”¬˜7„‚íó–¢¬ˆFóc‡¢∑7ñÊ˜6ó2bb«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"3S#cv"¬∆ñÊTÜVñváC¢„CR¬Fó7∆ì¢"◊vV&∂óB÷&˜Ç"¬vV&∂óD∆ñÊT6∆◊¢b¬vV&∂óD&˜Ñ˜&ñVÁC¢'fW'Fñ6¬"¬˜fW&f∆˜s¢&ÜñFFV‚"◊”Á∑7ñÊ˜6ó7”¬˜Á–¢≤Ü2ÊgVÊ2«¬2Ê∆WfV¬«¬2Á66ÜV÷W2Ê∆VÊwFÇ‚íbbÄ¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v¢B¬÷&vñ‰&˜GFˆ”¢◊”‡¢∂2ÊgVÊ2bb«7‚FóF∆S◊∂2ÊgVÊ7“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3CsSScí"¬&6∂w&˜VÊC¢"6ccFcÇ"¬&˜&FW#¢#Ç6ˆ∆ñB6S6SÜVb"¬&˜&FW%&FóW3¢R¬FFñÊs¢#'ÇwÇ"¬÷ÖvñGFÉ¢#R"¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"¬&˜Ö6ó¶ñÊs¢&&˜&FW"÷&˜Ç"◊”Áµ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#ì"ó“∂2ÊgVÊ7”¬˜7„Á–¢∂2Ê∆WfV¬bb«7‚FóF∆S◊≤%˜6óFñˆ‚∆WfV√¢"≤2Ê∆WfV«“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3vVr"¬&6∂w&˜VÊC¢"6fFc6F2"¬&˜&FW#¢#Ç6ˆ∆ñB6cS#2"¬&˜&FW%&FóW3¢R¬FFñÊs¢#'ÇwÇ"¬vÜóFU76S¢&Ê˜w&"◊”Á∂2Ê∆WfV«”¬˜7„Á–¢∂2Á66ÜV÷W2Ê÷Çá2¬íí”‚É«7‚∂Wì◊∂ó“FóF∆S◊≤%66ÜV÷S¢"≤7“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3#VSsB"¬&6∂w&˜VÊC¢"6S6cVf""¬&˜&FW#¢#Ç6ˆ∆ñB6&6Sfc"¬&˜&FW%&FóW3¢R¬FFñÊs¢#'ÇwÇ"¬vÜóFU76S¢&Ê˜w&"◊”Á∑7”¬˜7„‚íó–¢¬ˆFóc‡¢ó–¢∆Fób7Gñ∆S◊∑≤÷&vñÂF˜¢&WFÚ"¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬FFñÊuF˜¢í¬&˜&FW%F˜¢#Ç6ˆ∆ñB6cVVSr"◊”‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤ÜRí”‚≤RÁ7F˜&˜vFñˆ‚Çì≤6WE6V∆V7FVDñBÜ2ÊñBì≤ˆ‰Ê«ó6U˜7FñÊrÜ2Ê¶ˆ"ì≤◊“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁEvVñváC¢c¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"6ffb"¬&6∂w&˜VÊC¢"3C&ÜR"¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢r¬FFñÊs¢#áÇ'Ç"¬7W'6˜#¢'ˆñÁFW""¬÷ñ‰ÜVñváC¢CB◊”‰Ê«ó6S¬ˆ'WGFˆ„‡¢∂2Ê¶ˆ"Ê÷6eW&¬bb∆á&Vc◊∂2Ê¶ˆ"Ê÷6eW&«“F&vWC“%ˆ&∆Ê≤"&V√“&Ê˜&VfW'&W""ˆ‰6∆ñ6≥◊≤ÜRí”‚RÁ7F˜&˜vFñˆ‚Çó“7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"3SfF""¬FWáDFV6˜&Fñˆ„¢'VÊFW&∆ñÊR"¬FWáEVÊFW&∆ñÊTˆfg6WC¢"◊”‰˜V„¬ˆÁ–¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤ÜRí”‚≤RÁ7F˜&˜vFñˆ‚Çì≤6WDˆ∂bá≤∂ñÊC¢'˜7FñÊr"¬ñC¢2ÊñB“ì≤◊“FóF∆S“%fñWrÙ¥b6ˆÊ6WBFˆ7V÷VÁB"7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3V#F&&B"¬&6∂w&˜VÊC¢"6cvcVfB"¬&˜&FW#¢#Ç6ˆ∆ñB6FFCVcb"¬&˜&FW%&FóW3¢b¬FFñÊs¢#WÇwÇ"¬7W'6˜#¢'ˆñÁFW""¬÷&vñ‰∆VgC¢&WFÚ"◊”Á≤'≤“Ù¥b'”¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢¬ˆFóc‡¢¬ˆFóc‡¢ì∞¢”∞†¢ÚÚÙ¥bG&VR&˜w2á&Wó&VBr”rs#c¢vÜóFU76Sß&R≤CGÇ7G&WF6ÜVBFÜR44îíG&VRñÁF¢ÚÚ'&ˆ∂V‚∆FFW"ÊB6∆óVBÊ÷W2í‚v«óá26óBñ‚fóÜVB&R6ˆ«V÷„≤FÜRÊ÷RvWG2¢ÚÚ&V¬f∆WÇ6V∆¬vóFÇV∆∆ó6ó2≤FóF∆S≤ÜóB&V7Fó2CGÇˆ‚6∆ñ6∂&∆R&˜w2‡¢6ˆÁ7Bˆ∂e&˜r“ÜñÊFVÁB¬∆&V¬¬6ˆ∆˜"¬ˆ‰6∆ñ6≤¬&ˆ∆Bí”‚Ä¢∆'WGFˆ‚∂Wì◊∂∆&V«“GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊∂ˆ‰6∆ñ6∑“Fó6&∆VC◊≤ˆ‰6∆ñ6∑“FóF∆S◊∂∆&V«–¢7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢¬vñGFÉ¢#R"¬÷ñ‰ÜVñváC¢ˆ‰6∆ñ6≤ÚCB¢#B¬FWáD∆ñv„¢&∆VgB"¬&6∂w&˜VÊC¢&ÊˆÊR"¬&˜&FW#¢&ÊˆÊR"¬FFñÊs¢¬7W'6˜#¢ˆ‰6∆ñ6≤Ú'ˆñÁFW""¢&FVfV«B"◊”‡¢«7‚&ñ÷ÜñFFV„“'G'VR"7Gñ∆S◊∑≤f∆WÉ¢&ÊˆÊR"¬vÜóFU76S¢'&R"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3f#cCSb"◊”Á∂ñÊFVÁG”¬˜7„‡¢«7‚7Gñ∆S◊∑≤f∆WÉ¢¬÷ñÂvñGFÉ¢¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬∆ñÊTÜVñváC¢„R¬6ˆ∆˜"¬fˆÁEvVñváC¢&ˆ∆BÚs¢C¬FWáDFV6˜&Fñˆ„¢ˆ‰6∆ñ6≤Ú'VÊFW&∆ñÊR"¢&ÊˆÊR"¬FWáEVÊFW&∆ñÊTˆfg6WC¢"◊”Á∂∆&V«”¬˜7„‡¢¬ˆ'WGFˆ„‡¢ì∞¢6ˆÁ7BE"“7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#S2¬É#S¬É#Sí≤"#∞¢6ˆÁ7BD¬“7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#SB¬É#S¬É#Sí≤"#∞¢6ˆÁ7BDí“7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#S"í≤"#∞†¢6ˆÁ7B6˜W&6UÊV¬“ÜÊ÷R¬7&46&G2¬FˆÊR¬w&ñE&Vbí”‚Ä¢«6V7Fñˆ‚6∆74Ê÷S“'7FW"◊6˜W&6R"7Gñ∆S◊∑≤÷ñÂvñGFÉ¢◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬÷&vñ‰&˜GFˆ”¢◊”‡¢«7‚7Gñ∆S◊∑≤vñGFÉ¢r¬ÜVñváC¢r¬&˜&FW%&FóW3¢#SR"¬&6∂w&˜VÊC¢FˆÊRÊF˜B¬f∆WÉ¢&ÊˆÊR"◊“Û‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁEvVñváC¢s¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"3c#&R"◊”Á∂Ê÷W”¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢FˆÊRÊñÊ≤¬&6∂w&˜VÊC¢FˆÊRÊ&r¬&˜&FW#¢#Ç6ˆ∆ñB"≤FˆÊRÊ&˜&FW"¬&˜&FW%&FóW3¢b¬FFñÊs¢#'ÇwÇ"◊”Á∑7&46&G2Ê∆VÊwFá”¬˜7„‡¢¬ˆFóc‡¢∑7&46&G2Ê∆VÊwFÇ””“ ¢Ú∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"3ìF#"¬&˜&FW#¢#ÇF6ÜVB6S&SCÇ"¬&˜&FW%&FóW3¢¬FFñÊs¢#áÇGÇ"◊”‰ÊÚ∂Ê÷W“˜7FñÊw2÷F6Ç„¬ˆFóc‡¢¢∆Fób6∆74Ê÷S“'7FW"÷6&G2"&Vc◊∂w&ñE&Vg“7Gñ∆S◊∑≤Fó7∆ì¢&w&ñB"¬w&ñEFV◊∆FT6ˆ«V÷Á3¢6&D6ˆ«V÷Á2◊”Á∑7&46&G2Ê÷á&VÊFW$6&Bó”¬ˆFócÁ–¢¬˜6V7Fñˆ„‡¢ì∞†¢&WGW&‚Ä¢∆Fób6∆74Ê÷S“'7FW"÷&∆VVB7FW"◊6ÜV∆¬"FF◊FW7FñC“'7FW"◊&W7ˆÁ6ófR◊7W&f6R"7Gñ∆S◊∑≤˜6óFñˆ„¢'&V∆FófR"¬FFñÊs¢6ÜV∆≈FFñÊr¬&˜Ö6ó¶ñÊs¢&&˜&FW"÷&˜Ç"◊”‡¢∆Fób6∆74Ê÷S“'7FW"÷ÜVB"7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢B¬f∆WÖw&¢'w&"¬FFñÊs¢#'Ç'Ç'Ç"◊”‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊∂ˆ‰ÊWu6V&6á“7Gñ∆S◊∑≤&6∂w&˜VÊC¢&ÊˆÊR"¬&˜&FW#¢&ÊˆÊR"¬7W'6˜#¢'ˆñÁFW""¬6ˆ∆˜#¢"3SfF""¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁEvVñváC¢c¬fˆÁE6ó¶S¢#„É#W&V“"¬FFñÊs¢¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢b◊”„«7‚&ñ÷ÜñFFV„“'G'VR#‚b3ÉSì#≥¬˜7„‚ÊWr6V&6É¬ˆ'WGFˆ„‡¢∆Fób7Gñ∆S◊∑≤÷ñÂvñGFÉ¢◊”‡¢∆Fób7Gñ∆S◊∑≤‚‚‰¥î4≤¬fˆÁE6ó¶S¢#„Sc#W&V“"¬∆WGFW%76ñÊs¢"„fV“"¬6ˆ∆˜#¢"3f#c3Sr"◊”Â5DU"¥DıG“4TƒT5BUdîDT‰4S¬ˆFóc‡¢∆É"7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"tÊWw7&VFW"r«6W&ñb"¬fˆÁEvVñváC¢c¬fˆÁE6ó¶S¢#„7&V“"¬6ˆ∆˜#¢"3c#&R"¬÷&vñ„¢#Ç"¬∆ñÊTÜVñváC¢„"◊”Â˜7FñÊrWfñFVÊ6Rf˜"µ◊∑VW'ó◊µ'”¬ˆÉ#‡¢¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤÷&vñ‰∆VgC¢&WFÚ"¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬f∆WÖw&¢'w&"◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3V#F&&B"¬&6∂w&˜VÊC¢"6cVVf2"¬&˜&FW#¢#Ç6ˆ∆ñB6FFCVcb"¬&˜&FW%&FóW3¢b¬FFñÊs¢#GÇóÇ"◊”„ƒÁV÷&W$f∆˜rf«VS◊∑6˜'FVBÊ∆VÊwFá“Û‚ˆbƒÁV÷&W$f∆˜rf«VS◊∂&6T¶ˆ'2Ê∆VÊwFá“Û„¬˜7„‡¢≤ÇÇí”‚≤6ˆÁ7Br“6&G2Êfñ«FW"ÇÜ2í”‚2Á76ˆ2íÊ∆VÊwFÉ≤&WGW&‚r‚ÚÉ«7‚FóF∆S“%54Ù26˜V∆BÊ˜B÷F6ÇFÜW6R˜7FñÊw2“&ÊBÊBfñV∆BvóFÜÜV∆B‚W6RFÜRfñV∆Bfñ«FW"‚VÊ6∆76ñfñVBFÚ6VRFÜV“‚"7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3vVr"¬&6∂w&˜VÊC¢"6fFc6F2"¬&˜&FW#¢#Ç6ˆ∆ñB6cS#2"¬&˜&FW%&FóW3¢b¬FFñÊs¢#GÇóÇ"◊”Á∑w“vóFÜÜV∆C¬˜7„‚í¢ÁV∆√≤“íÇó–¢∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊≤Çí”‚6WDˆ∂bá≤∂ñÊC¢&ñÊFWÇ"“ó“FóF∆S“$˜V‚FÜRÙ¥b6ˆÊ6WBñÊFWÇf˜"FÜó2&W7V«B"7Gñ∆S◊∑≤7W'6˜#¢'ˆñÁFW""¬÷ñ‰ÜVñváC¢CB¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3V#F&&B"¬&6∂w&˜VÊC¢"6cvcVfB"¬&˜&FW#¢#Ç6ˆ∆ñB6FFCVcb"¬&˜&FW%&FóW3¢b¬FFñÊs¢#GÇóÇ"◊”Á≤'≤“Ù¥bñÊFWÇ'”¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢¬ˆFóc‡†¢∆Fób&Vc◊∂&%&Vg“6∆74Ê÷S“'7FW"÷fñ«FW&&""7Gñ∆S◊∑≤˜6óFñˆ„¢'7Fñ6∑í"¬F˜¢SB¬§ñÊFWÉ¢C¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬f∆WÖw&¢'w&"¬FFñÊs¢#Ç'Ç"¬&6∂w&˜VÊC¢"6f&fcÇ"¬&˜&FW#¢#Ç6ˆ∆ñB6SFS&F"¬&˜&FW%&FóW3¢"¬÷&vñ‰&˜GFˆ”¢B¬&˜Ö6ÜF˜s¢#GÇGÇ&v&É#√3"√Cb¬„bí"◊”‡¢∆ñÁWBf«VS◊∂fñÊEFWáG“ˆ‰6ÜÊvS◊≤ÜRí”‚6WDfñÊEFWáBÜRÁF&vWBÁf«VRó“∆6VÜˆ∆FW#“%6V&6Ç˜7FñÊw2‚‚‚"&ñ÷∆&V√“%6V&6Ç˜7FñÊw2"FóF∆S“%6V&6Ç˜7FñÊw2'íFóF∆R¬V◊∆˜ñW"˜"∂Wóv˜&B"7Gñ∆S◊∑≤f∆WÉ¢##Ç"¬÷ñÂvñGFÉ¢C¬&˜Ö6ó¶ñÊs¢&&˜&FW"÷&˜Ç"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"3c#&R"¬&˜&FW#¢#Ç6ˆ∆ñB6CñCf6B"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#áÇÇ"¬˜WF∆ñÊS¢&ÊˆÊR"¬&6∂w&˜VÊC¢"6ffb"¬÷ñ‰ÜVñváC¢CB◊“Û‡¢∆Fób6∆74Ê÷S“'7FW"◊6˜'B"7Gñ∆S◊∑≤˜6óFñˆ„¢'&V∆FófR"¬f∆WÉ¢&ÊˆÊR"◊”‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊≤Çí”‚6WD˜V‰f6WBÜ˜V‰f6WB””“'6˜'B"ÚÁV∆¬¢'6˜'B"ó“&ñ÷WáÊFVC◊∂˜V‰f6WB””“'6˜'B'“FóF∆S“$6ÜÊvR6˜'B˜&FW""7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢b¬÷ñ‰ÜVñváC¢CB¬FFñÊs¢#'Ç"¬7W'6˜#¢'ˆñÁFW""¬&6∂w&˜VÊC¢"6ffb"¬6ˆ∆˜#¢"36CCSb"¬&˜&FW#¢#Ç6ˆ∆ñB6S&SCÇ"¬&˜&FW%&FóW3¢Ç¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢c¬vÜóFU76S¢&Ê˜w&"◊”Â6˜'C¢∑6˜'D∆&V«“«7‚&ñ÷ÜñFFV„“'G'VR"7Gñ∆S◊∑≤fˆÁE6ó¶S¢í¬˜6óGì¢„r◊”‚b3ìcc≥¬˜7„„¬ˆ'WGFˆ„‡¢∂˜V‰f6WB””“'6˜'B"bbÄ¢∆Fób6∆74Ê÷S“'7FW"◊6˜'B÷÷VÁR"7Gñ∆S◊∑≤˜6óFñˆ„¢&'6ˆ«WFR"¬F˜¢&6∆2ÉR≤gÇí"¬∆VgC¢¬§ñÊFWÉ¢C¬÷ñÂvñGFÉ¢É¬&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#Ç6ˆ∆ñB6S&SCÇ"¬&˜&FW%&FóW3¢¬&˜Ö6ÜF˜s¢#'Ç3Ç&v&Éb√#B√C¬„bí"¬FFñÊs¢b◊”‡¢µ4ı%EÙıE2Ê÷ÇÖ∂≤¬∆&≈“í”‚É∆'WGFˆ‚∂Wì◊∂∑“GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊≤Çí”‚≤6WE6˜'BÜ≤ì≤6WD˜V‰f6WBÜÁV∆¬ì≤◊“7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬vñGFÉ¢#R"¬FWáD∆ñv„¢&∆VgB"¬÷ñ‰ÜVñváC¢3B¬FFñÊs¢#gÇóÇ"¬7W'6˜#¢'ˆñÁFW""¬&6∂w&˜VÊC¢6˜'B””“≤Ú"6VVc&fb"¢'G&Á7&VÁB"¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢r¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢6˜'B””“≤Ú"3C&ÜR"¢"36CCSb"¬fˆÁEvVñváC¢6˜'B””“≤Ús¢C◊”Á∂∆&«”¬ˆ'WGFˆ„‚íó–¢¬ˆFóc‡¢ó–¢¬ˆFóc‡¢µ5DU%Ùd4UE2Ê÷ÇÜbí”‚É≈7FW$f6WB∂Wì◊∂bÊ∂Wó“∆&V√◊∂bÊ∆&V«“˜FñˆÁ3◊∂f6WD˜FñˆÁ5∂bÊ∂Wï◊“6V∆V7FVC◊∂f6WG5∂bÊ∂Wï◊“ˆÂFˆvv∆S◊≤ábí”‚Fˆvv∆Tf6WBÜbÊ∂Wí¬bó“˜V„◊∂˜V‰f6WB””“bÊ∂Wó“ˆ‰˜V„◊≤Çí”‚6WD˜V‰f6WBÜ˜V‰f6WB””“bÊ∂WíÚÁV∆¬¢bÊ∂Wíó“Û‚íó–¢∂Ü4fñ«FW'2bb∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊∂6∆V$fñ«FW'7“FóF∆S“$6∆V"∆¬7FW"fñ«FW'2"7Gñ∆S◊∑≤f∆WÉ¢&ÊˆÊR"¬÷ñ‰ÜVñváC¢CB¬FFñÊs¢#Ç"¬7W'6˜#¢'ˆñÁFW""¬&6∂w&˜VÊC¢&ÊˆÊR"¬&˜&FW#¢&ÊˆÊR"¬6ˆ∆˜#¢"3SfF""¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢c◊”‰6∆V"∆√¬ˆ'WGFˆ„Á–¢¬ˆFóc‡†¢≤Ú¢7FW”‚7FW"&ˆw&W72&ÊÊW"‚&V¬¬FWFW&÷ñÊó7Fñ27FvW3†¢‘4bfWF6Ç”‚6&VW'2Êv˜bÁ6rfWF6Ç”‚54Ù26∆76ñfñ6Fñˆ‚‡¢V6Ç&˜rWFFW2FÜR÷ˆ÷VÁBóG2VÊFW&«ññÊr6∆¬6WGF∆W2‚Êˆ‚÷&∆ˆ6∂ñÊr–¢FÜR6&Bw&ñB&VÊFW'2&V∆˜r26ˆˆ‚27FFRÊ¶ˆ'2∆ÊG3≤FÜó2&ÊÊW ¢Ê'&FW26∆76ñfñ6Fñˆ‚VÊFW&ÊVFÇÊBfFW2˜WBvÜV‚óBw2FˆÊR‚¢˜–¢≤á7FFRÊ∆ˆFñÊr«¬&ˆw&W72Ê6∆76ñgï7FGW2””“&∆ˆFñÊr"íbbÇÇí”‚∞¢6ˆÁ7B&˜w2“∞¢≤∂Wì¢&÷6b"¬ñ6ˆ„¢$‘4b"¬∆&V√¢$◊î6&VW'4gWGW&R"¬7FGW3¢&ˆw&W72Ê÷6e7FGW2¬6˜VÁC¢&ˆw&W72Ê÷6d6˜VÁB¬6˜VÁD∆&V√¢'˜7FñÊw2"“¿¢≤∂Wì¢&76r"¬ñ6ˆ„¢$54r"¬∆&V√¢&6&VW'2Êv˜bÁ6r"¬7FGW3¢&ˆw&W72Ê76u7FGW2¬6˜VÁC¢&ˆw&W72Ê76t6˜VÁB¬6˜VÁD∆&V√¢'˜7FñÊw2"“¿¢≤∂Wì¢&6«2"¬ñ6ˆ„¢%54Ù2"¬∆&V√¢%54Ù2##B6∆76ñgí"¬7FGW3¢&ˆw&W72Ê6∆76ñgï7FGW2¬6˜VÁC¢&ˆw&W72Ê6∆76ñgïF˜F¬¬6˜VÁD∆&V√¢&6∆76ñfñVB"“¿¢”∞¢&WGW&‚Ä¢∆Fób&ˆ∆S“'7FGW2"&ñ÷∆ófS“'ˆ∆óFR"7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6f&fcÇ"¬&˜&FW#¢#Ç6ˆ∆ñB6SFS&F"¬&˜&FW%&FóW3¢"¬FFñÊs¢#'ÇGÇ"¬÷&vñ„¢#GÇ"¬&˜Ö6ÜF˜s¢#Ç7Ç&v&É#√3"√Cb¬„bí"◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬v¢"¬÷&vñ‰&˜GFˆ”¢◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3c#&R"◊”‡¢7W&FñÊrWfñFVÊ6Rf˜"µ◊∑VW'ó◊µ'–¢¬˜‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3f#c3Sr"◊”ÊFWFW&÷ñÊó7Fñ2µ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#ró“ÊÚƒƒ”¬˜7„‡¢¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&w&ñB"¬w&ñEFV◊∆FT6ˆ«V÷Á3¢'&WVBÜWFÚ÷fóB¬÷ñÊ÷ÇÉSÇ¬g"íí"¬v¢◊”‡¢∑&˜w2Ê÷Çá"í”‚∞¢6ˆÁ7BñF∆R“"Á7FGW2””“&ñF∆R#∞¢6ˆÁ7B∆ˆFñÊr“"Á7FGW2””“&∆ˆFñÊr#∞¢6ˆÁ7BFˆÊR“"Á7FGW2””“&FˆÊR#∞¢6ˆÁ7BW'&˜"“"Á7FGW2””“&W'&˜"#∞¢6ˆÁ7BF˜D6ˆ∆˜"“W'&˜"Ú"666"¢FˆÊRÚ"3Sc6"¢∆ˆFñÊrÚ"3SfF""¢"63F3#2#∞¢6ˆÁ7BF˜EV«6R“∆ˆFñÊs∞¢&WGW&‚Ä¢∆Fób∂Wì◊∑"Ê∂Wó“7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#Ç6ˆ∆ñB"≤Ü∆ˆFñÊrÚ"66FCñfb"¢"6SfS6F""í¬&˜&FW%&FóW3¢í¬FFñÊs¢#óÇÇ"¬G&Á6óFñˆ„¢&&˜&FW"÷6ˆ∆˜"„'2"◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢r◊”‡¢«7‚&ñ÷ÜñFFV„“'G'VR"6∆74Ê÷S◊∂F˜EV«6RÚ&∆GÇ"¢VÊFVfñÊVG“7Gñ∆S◊∑≤vñGFÉ¢í¬ÜVñváC¢í¬&˜&FW%&FóW3¢#SR"¬&6∂w&˜VÊC¢F˜D6ˆ∆˜"¬Êñ÷Fñˆ„¢F˜EV«6RÚ&∆GÑ'&VFÜR„2V6R÷ñ‚÷˜WBñÊfñÊóFR"¢&ÊˆÊR"◊“Û‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬6ˆ∆˜#¢"3V#cÉsÇ"¬fˆÁEvVñváC¢s¬∆WGFW%76ñÊs¢"„FV“"◊”Á∑"Êñ6ˆÁ”¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"3c#&R"¬fˆÁEvVñváC¢c¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"◊”Á∑"Ê∆&V«”¬˜7„‡¢¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤÷&vñÂF˜¢b¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"36CCSb"◊”‡¢∂ñF∆Rbb«7‚7Gñ∆S◊∑≤6ˆ∆˜#¢"3f#c3Sr"◊”ÁVWVVG¥Tƒ«”¬˜7„Á–¢∂∆ˆFñÊrbb«7„Á∑"Ê∂Wí””“&6«2"bb"Ê6˜VÁB‚Ú√Ê6∆76ñgññÊr«7G&ˆÊsÁ∑"Ê6˜VÁG”¬˜7G&ˆÊsÁ¥Tƒ«”¬Û‚¢√ÊfWF6ÜñÊw¥Tƒ«”¬ÛÁ”¬˜7„Á–¢∂FˆÊRbb«7„„«7G&ˆÊr7Gñ∆S◊∑≤6ˆ∆˜#¢"3Sc6"◊”Á¥ÁV÷&W"á"Ê6˜VÁB«¬ó”¬˜7G&ˆÊs‚∑"Ê6˜VÁD∆&V«”¬˜7„Á–¢∂W'&˜"bb«7‚7Gñ∆S◊∑≤6ˆ∆˜#¢"666"◊”Ê6˜V∆BÊ˜B&V6É¬˜7„Á–¢¬ˆFóc‡¢¬ˆFóc‡¢ì∞¢“ó–¢¬ˆFóc‡¢¬ˆFóc‡¢ì∞¢“íÇó–¢≤7FFRÊ∆ˆFñÊrbb7FFRÊW'&˜"bb«7Gñ∆S◊∑≤6ˆ∆˜#¢"666"¬fˆÁE6ó¶S¢#„ÉsW&V“"¬FFñÊs¢##Ç'Ç"◊”‰6˜V∆BÊ˜B∆ˆB˜7FñÊw3¢∑7FFRÊW'&˜'”¬˜Á–¢≤Ú¢dƒır”#¢6WB÷∆WfV¬vñFV‚Ê˜FR“FÜRg&˜¶V‚÷6bÊß2666FR«&VGíWFÚ◊vñFVÊV@¢6W'fW"◊6ñFS≤vRˆÊ«íFó66∆˜6RFÜR66˜RóB6WGF∆VBˆ‚‚ÊWfW"&W6VÁFVBW"÷6&@¢2WÜ7BáFÜBw27FW$÷F6ÖFñW"w2¶ˆ"¬&V∆˜rí‚¢˜–¢≤7FFRÊ∆ˆFñÊrbb7FFRÊW'&˜"bbá7FFRÁFñW"””“bb6˜'FVBÊ∆VÊwFÇ‚íbb7FW%vñFV‰Ê˜FRá7FFRÁFñW"¬7FFRÊ&˜Üñ÷FRíbbÄ¢«&ˆ∆S“'7FGW2"7Gñ∆S◊∑≤÷&vñ„¢#'Ç"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"3vVr"¬&6∂w&˜VÊC¢"6fFc6F2"¬&˜&FW#¢#Ç6ˆ∆ñB6cS#2"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#áÇ'Ç"◊”‡¢∑7FW%vñFV‰Ê˜FRá7FFRÁFñW"¬7FFRÊ&˜Üñ÷FRó–¢¬˜‡¢ó–¢≤7FFRÊ∆ˆFñÊrbb7FFRÊW'&˜"bb&6T¶ˆ'2Ê∆VÊwFÇ””“bb«7Gñ∆S◊∑≤6ˆ∆˜#¢"3cCsCÜ""¬fˆÁE6ó¶S¢#„ÉsW&V“"¬FFñÊs¢##Ç'Ç"◊”‰ÊÚ∆ófR˜7FñÊw2÷F6ÜVBµ◊∑VW'ó◊µ'◊∂g&W6Ñw&BÚ"VÊFW"BñV'2rWáW&ñVÊ6R"¢"'“„¬˜Á–¢≤Ú¢vFVBˆ‚6∆76ñgï7FGW2”“&∆ˆFñÊr"FˆÚ¬Ê˜BßW7B7FFRÊ∆ˆFñÊr“˜FÜW'vó6P¢FÜó2FV6∆&VB&ÊˆÊR÷F6Ç"vÜñ∆R54Ù26∆76ñfñ6Fñˆ‚v27Fñ∆¬76ñvÊñÊp¢6ˆFW2FÚFÜRfWF6ÜVB˜7FñÊw2ÜWfW'í6&B&VG2VÊ6∆76ñfñVB÷ñB÷6∆76ñgí¿¢6ÚFÜR54Ù2fñ«FW"f«6V«í6Ü˜w2¶W&Ú÷F6ÜW2&Vf˜&RFÜR&V¬Á7vW"WÜó7G2í‚¢˜–¢≤7FFRÊ∆ˆFñÊrbb&ˆw&W72Ê6∆76ñgï7FGW2”“&∆ˆFñÊr"bb&6T¶ˆ'2Ê∆VÊwFÇ‚bb6˜'FVBÊ∆VÊwFÇ””“bbÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6f&fcÇ"¬&˜&FW#¢#ÇF6ÜVB6SFS&F"¬&˜&FW%&FóW3¢¬FFñÊs¢#gÇáÇ"¬÷&vñ„¢#Ç"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„ÉsW&V“"¬6ˆ∆˜#¢"36CCSb"◊”‰ÊÚ˜7FñÊw2÷F6ÇFÜR7W'&VÁBfñ«FW'2‚∆'WGFˆ‚ˆ‰6∆ñ6≥◊∂6∆V$fñ«FW'7“7Gñ∆S◊∑≤&6∂w&˜VÊC¢&ÊˆÊR"¬&˜&FW#¢&ÊˆÊR"¬6ˆ∆˜#¢"3SfF""¬7W'6˜#¢'ˆñÁFW""¬fˆÁEvVñváC¢c¬FFñÊs¢¬FWáDFV6˜&Fñˆ„¢'VÊFW&∆ñÊR"◊”‰6∆V"∆√¬ˆ'WGFˆ„„¬˜‡¢¬ˆFóc‡¢ó–†¢≤Ú¢7W&Fñˆ‚˜fW'fñWs¢6÷∆¬¬FWFW&÷ñÊó7Fñ2w&ÇfñWrˆbFÜR7W'&VÁB&W7V«@¢6WB‚í÷Wá˜7W&R÷&ÊBFˆÁWB≤FÜRR÷˜7B6ˆ÷÷ˆ‚54Ù2f÷ñ∆ñW2‚6ˆ◊WFV@¢7G&ñváBg&ˆ“6&G2≤6«2‚ÜñFFV‚GW&ñÊrFÜRñÊóFñ¬∆ˆBFÚfˆñ@¢7GWGFW&ñÊr26∆76ñfñ6FñˆÁ27G&V“ñ‚‚¢˜–¢≤7FFRÊ∆ˆFñÊrbb6˜'FVBÊ∆VÊwFÇ‚bbÇÇí”‚∞¢6ˆÁ7BF˜F¬“6˜'FVBÊ∆VÊwFÉ∞¢6ˆÁ7B&ÊD6˜VÁG2“≤áV÷„¢¬76ó7FVC¢¬Vv÷VÁFVC¢¬WFÛ¢¬vóFÜÜV∆C¢”∞¢6˜'FVBÊf˜$V6ÇÇÜ2í”‚≤&ÊD6˜VÁG5∂2Ê&ÊD∂Wí«¬'vóFÜÜV∆B%““Ü&ÊD6˜VÁG5∂2Ê&ÊD∂Wí«¬'vóFÜÜV∆B%“«¬í≤≤“ì∞¢6ˆÁ7B&ÊE6Vw2“∞¢≤∂Wì¢&WFÚ"¬∆&V√¢$gV∆¬WFˆ÷Fñˆ‚"¬6˜VÁC¢&ÊD6˜VÁG2ÊWFÚ¬6ˆ∆˜#¢5DU%Ù$‰E2ÊWFÚÊF˜B“¿¢≤∂Wì¢&Vv÷VÁFVB"¬∆&V√¢$í÷Vv÷VÁFVB"¬6˜VÁC¢&ÊD6˜VÁG2ÊVv÷VÁFVB¬6ˆ∆˜#¢5DU%Ù$‰E2ÊVv÷VÁFVBÊF˜B“¿¢≤∂Wì¢&76ó7FVB"¬∆&V√¢$í÷76ó7FVB"¬6˜VÁC¢&ÊD6˜VÁG2Ê76ó7FVB¬6ˆ∆˜#¢5DU%Ù$‰E2Ê76ó7FVBÊF˜B“¿¢≤∂Wì¢&áV÷‚"¬∆&V√¢$áV÷‚÷∆VB"¬6˜VÁC¢&ÊD6˜VÁG2ÊáV÷‚¬6ˆ∆˜#¢5DU%Ù$‰E2ÊáV÷‚ÊF˜B“¿¢≤∂Wì¢'vóFÜÜV∆B"¬∆&V√¢%vóFÜÜV∆B"¬6˜VÁC¢&ÊD6˜VÁG2ÁvóFÜÜV∆B¬6ˆ∆˜#¢"66&CVS"“¿¢“Êfñ«FW"Çá2í”‚2Ê6˜VÁB‚ì∞¢ÚÚ54Ù2f÷ñ«í&#¢F˜R6V7F˜'2'í˜7FñÊr6˜VÁB‡¢6ˆÁ7B6V7F˜$6˜VÁG2“∑”∞¢6˜'FVBÊf˜$V6ÇÇÜ2í”‚≤6ˆÁ7B2“2Á6V7F˜"«¬%VÊ6∆76ñfñVB#≤6V7F˜$6˜VÁG5∑5““á6V7F˜$6˜VÁG5∑5“«¬í≤≤“ì∞¢6ˆÁ7BF˜6V7F˜'2“ˆ&¶V7BÊVÁG&ñW2á6V7F˜$6˜VÁG2íÁ6˜'BÇÜ¬"í”‚%≥““≥“íÁ6∆ñ6RÉ¬Rì∞¢6ˆÁ7BF˜÷Ç“F˜6V7F˜'2Ê∆VÊwFÇÚF˜6V7F˜'5≥’≥“¢∞¢ÚÚFˆÁWB÷Fá3¢&ñÊr6ó&7V÷fW&VÊ6RÊB6Vv÷VÁBg&7FñˆÁ2‡¢6ˆÁ7B"“3Ç¬4ï$2“"¢÷FÇÂí¢#∞¢∆WB64g&2“∞¢&WGW&‚Ä¢∆Fób6∆74Ê÷S“'7FW"÷˜fW'fñWr"7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6f&fcÇ"¬&˜&FW#¢#Ç6ˆ∆ñB6SFS&F"¬&˜&FW%&FóW3¢B¬FFñÊs¢#GÇgÇ"¬÷&vñ‰&˜GFˆ”¢B◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬÷&vñ‰&˜GFˆ”¢◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬∆WGFW%76ñÊs¢"„FV“"¬6ˆ∆˜#¢"3f#c3Sr"¬fˆÁEvVñváC¢s◊”‰5U$DîÙ‚ıdU%dîUr¥DıG“∑F˜F«“ı5Dî‰u3¬˜‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3f#c3Sr"◊”Ê6ˆ◊WFVBg&ˆ“54Ù26∆76ñfñ6FñˆÁ3¬˜7„‡¢¬ˆFóc‡¢∆Fób6∆74Ê÷S“'7FW"÷˜fW'fñWr÷w&ñB"7Gñ∆S◊∑≤Fó7∆ì¢&w&ñB"¬w&ñEFV◊∆FT6ˆ«V÷Á3¢ó5ÜˆÊRÚ&÷ñÊ÷ÇÉ¬g"í"¢&÷ñÊ÷ÇÉÉÇ¬#CÇí÷ñÊ÷ÇÉ¬g"í"¬v¢ó5ÜˆÊRÚB¢Ç¬∆ñv‰óFV◊3¢&6VÁFW""◊”‡¢≤Ú¢í÷Wá˜7W&RFˆÁWB¢˜–¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢B◊”‡¢«7frfñWt&˜É“#"7Gñ∆S◊∑≤vñGFÉ¢¬ÜVñváC¢¬f∆WÉ¢&ÊˆÊR"◊“&ñ÷ÜñFFV„“'G'VR#‡¢∆6ó&6∆R7É◊≥SW“7ì◊≥SW“#◊µ'“fñ∆√“&ÊˆÊR"7G&ˆ∂S“"6V6VS""7G&ˆ∂UvñGFÉ◊≥'“Û‡¢∂&ÊE6Vw2Ê÷Çá2í”‚∞¢6ˆÁ7Bg&2“2Ê6˜VÁBÚF˜F√∞¢6ˆÁ7BF6Ç“G∂g&2¢4ï$7“G¥4ï$7÷∞¢6ˆÁ7Bˆfg6WB“÷64g&2¢4ï$3∞¢64g&2≥“g&3∞¢&WGW&‚É∆6ó&6∆R∂Wì◊∑2Ê∂Wó“7É◊≥SW“7ì◊≥SW“#◊µ'“fñ∆√“&ÊˆÊR"7G&ˆ∂S◊∑2Ê6ˆ∆˜'“7G&ˆ∂UvñGFÉ◊≥'“7G&ˆ∂TF6Ü'&ì◊∂F6á“7G&ˆ∂TF6Üˆfg6WC◊∂ˆfg6WG“G&Á6f˜&”“'&˜FFRÇ”ìSRSRí"7Gñ∆S◊∑≤G&Á6óFñˆ„¢'7G&ˆ∂R÷F6Ü'&í„G2V6R¬7G&ˆ∂R÷F6Üˆfg6WB„G2V6R"◊“Û‚ì∞¢“ó–¢«FWáBÉ◊≥SW“ì◊≥Sg“FWáDÊ6Ü˜#“&÷ñFF∆R"Fˆ÷ñÊÁD&6V∆ñÊS“&÷ñFF∆R"fˆÁDf÷ñ«ì“"u7∆ñÊR6Á2r«6Á2◊6W&ñb"fˆÁEvVñváC◊≥É“fˆÁE6ó¶S◊≥á“fñ∆√“"3c#&R#Á∑F˜F«”¬˜FWáC‡¢«FWáBÉ◊≥SW“ì◊≥s'“FWáDÊ6Ü˜#“&÷ñFF∆R"fˆÁDf÷ñ«ì“"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"fˆÁE6ó¶S◊≥w“fñ∆√“"3f#c3Sr"∆WGFW%76ñÊs“"„fV“#Âı5Dî‰u3¬˜FWáC‡¢¬˜7fs‡¢∆Fób7Gñ∆S◊∑≤f∆WÉ¢¬÷ñÂvñGFÉ¢¬Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬v¢B◊”‡¢∂&ÊE6Vw2Ê÷Çá2í”‚Ä¢∆Fób∂Wì◊∑2Ê∂Wó“7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢b◊”‡¢«7‚&ñ÷ÜñFFV„“'G'VR"7Gñ∆S◊∑≤vñGFÉ¢Ç¬ÜVñváC¢Ç¬&˜&FW%&FóW3¢"¬&6∂w&˜VÊC¢2Ê6ˆ∆˜"¬f∆WÉ¢&ÊˆÊR"◊“Û‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"36CCSb"¬f∆WÉ¢¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"◊”Á∑2Ê∆&V«”¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3c#&R"¬fˆÁEvVñváC¢s◊”Á∑2Ê6˜VÁG”¬˜7„‡¢¬ˆFóc‡¢íó–¢¬ˆFóc‡¢¬ˆFóc‡¢≤Ú¢F˜54Ù2f÷ñ∆ñW2&"¢˜–¢∆Fóc‡¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬∆WGFW%76ñÊs¢"„ÜV“"¬6ˆ∆˜#¢"3f#c3Sr"¬fˆÁEvVñváC¢s◊”ÂDı54Ù2d‘îƒîU3¬˜‡¢∑F˜6V7F˜'2Ê∆VÊwFÇ””“ÚÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"3f#c3Sr"◊”Â54Ù2f÷ñ∆ñW2Ê˜BñWB6∆76ñfñVB„¬˜‡¢í¢Ä¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬v¢R◊”‡¢∑F˜6V7F˜'2Ê÷ÇÖ∂Ê÷R¬Â“í”‚Ä¢∆'WGFˆ‚∂Wì◊∂Ê÷W“GóS“&'WGFˆ‚ ¢ˆ‰6∆ñ6≥◊≤Çí”‚Fˆvv∆Tf6WBÇ'6V7F˜""¬Ê÷R””“%VÊ6∆76ñfñVB"Ú%VÊ6∆76ñfñVB"¢Ê÷Ró–¢&ñ◊&W76VC◊∂f6WG2Á6V7F˜"ÊñÊ6«VFW2ÜÊ÷Ró–¢&ñ÷∆&V√◊≤$fñ«FW"˜7FñÊw2FÚ"≤Ê÷R≤"Ç"≤‚≤"í'–¢FóF∆S◊≤%FFÚ"≤Üf6WG2Á6V7F˜"ÊñÊ6«VFW2ÜÊ÷RíÚ&6∆V"FÜR"¢&fñ«FW"FÚFÜó2"í≤"f÷ñ«í'–¢7Gñ∆S◊∑≤Fó7∆ì¢&w&ñB"¬w&ñEFV◊∆FT6ˆ«V÷Á3¢&÷ñÊ÷ÇÉ¬g"í3Ç"¬v¢Ç¬∆ñv‰óFV◊3¢&6VÁFW""¬vñGFÉ¢#R"¬÷ñ‰ÜVñváC¢CB¬&6∂w&˜VÊC¢f6WG2Á6V7F˜"ÊñÊ6«VFW2ÜÊ÷RíÚ"6VVc&fb"¢'G&Á7&VÁB"¬&˜&FW#¢#Ç6ˆ∆ñB"≤Üf6WG2Á6V7F˜"ÊñÊ6«VFW2ÜÊ÷RíÚ"66FCñfb"¢'G&Á7&VÁB"í¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#GÇáÇ"¬7W'6˜#¢'ˆñÁFW""¬FWáD∆ñv„¢&∆VgB"◊”‡¢∆Fób7Gñ∆S◊∑≤÷ñÂvñGFÉ¢◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢#'Ç"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"36CCSb"¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"◊”Á∂Ê÷W”¬˜‡¢∆Fób7Gñ∆S◊∑≤˜6óFñˆ„¢'&V∆FófR"¬ÜVñváC¢R¬&6∂w&˜VÊC¢"6V6VS""¬&˜&FW%&FóW3¢2¬˜fW&f∆˜s¢&ÜñFFV‚"◊”‡¢∆Fób7Gñ∆S◊∑≤˜6óFñˆ„¢&'6ˆ«WFR"¬ñÁ6WC¢¬vñGFÉ¢ÇÜ‚ÚF˜÷Çí¢í≤"R"¬&6∂w&˜VÊC¢Ê÷R””“%VÊ6∆76ñfñVB"Ú"66&CVS"¢"3SfF""¬G&Á6óFñˆ„¢'vñGFÇ„3W2V6R"◊“Û‡¢¬ˆFóc‡¢¬ˆFóc‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3c#&R"¬fˆÁEvVñváC¢s¬FWáD∆ñv„¢'&ñváB"◊”Á∂Á”¬˜7„‡¢¬ˆ'WGFˆ„‡¢íó–¢¬ˆFóc‡¢ó–¢¬ˆFóc‡¢¬ˆFóc‡¢¬ˆFóc‡¢ì∞¢“íÇó–†¢≤7FFRÊ∆ˆFñÊrbb6˜'FVBÊ∆VÊwFÇ‚bbÄ¢∆Fób6∆74Ê÷S“'7FW"÷&ˆGí"7Gñ∆S◊∑≤Fó7∆ì¢&w&ñB"¬w&ñEFV◊∆FT6ˆ«V÷Á3¢&ˆGî6ˆ«V÷Á2¬v¢b¬∆ñv‰óFV◊3¢&f∆WÇ◊7F'B"¬÷ñÂvñGFÉ¢◊”‡¢∆6ñFR7Gñ∆S◊∑≤vñGFÉ¢7F6∂VD&ˆGíÚ&WFÚ"¢ñÊFWÖvñGFÇ¬˜6óFñˆ„¢7F6∂VD&ˆGíÚ'7FFñ2"¢'7Fñ6∑í"¬F˜¢7F6∂VD&ˆGíÚ&WFÚ"¢#¬∆ñvÂ6V∆c¢7F6∂VD&ˆGíÚ'7G&WF6Ç"¢&f∆WÇ◊7F'B"¬&6∂w&˜VÊC¢"6f&fcÇ"¬&˜&FW#¢#Ç6ˆ∆ñB6SFS&F"¬&˜&FW%&FóW3¢B¬FFñÊs¢#WÇGÇ"¬Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬v¢B¬÷ÑÜVñváC¢7F6∂VD&ˆGíÚ#É¢&6∆2ÉfÇ“3GÇí"¬˜fW&f∆˜uì¢&WFÚ"¬&˜Ö6ó¶ñÊs¢&&˜&FW"÷&˜Ç"◊“6∆74Ê÷S“'vó2◊67&ˆ∆¬7FW"÷ñÊFWÇ#‡¢∆Fóc‡¢∆Fób7Gñ∆S◊∑≤‚‚‰¥î4≤¬fˆÁE6ó¶S¢#„c#W&V“"¬∆WGFW%76ñÊs¢"„&V“"¬÷&vñ‰&˜GFˆ”¢2◊”‰î‰DUÇ¥DıG“∑6˜'FVBÊ∆VÊwFá“Ùb∂&6T¶ˆ'2Ê∆VÊwFá”¬ˆFóc‡¢≤Ú¢TíFˆ7G&ñÊS¢7FFRFÜR&Ê∂ñÊr'V∆R“FÜR&ñ¬ó27W&FVB&Ê∂ñÊr¬Ê˜B&r˜&FW"‚¢˜–¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3f#c3Sr"¬∆ñÊTÜVñváC¢„B◊”Â&Ê∂VB'í÷F6ÇFñW"¬FÜV‚6∆'í„¬˜‡¢∆Fób6∆74Ê÷S“'vó2◊67&ˆ∆¬"7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬v¢¬÷ÑÜVñváC¢3C¬˜fW&f∆˜uì¢&WFÚ"◊”‡¢∑Fˆ4w&˜W2Ê÷ÇÜr¬víí”‚Ä¢∆Fób∂Wì◊∂vó”‡¢∆FóbFóF∆S◊∂rÁ6V7F˜'“7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&&6V∆ñÊR"¬v¢b¬÷&vñ‰&˜GFˆ”¢B¬FFñÊt&˜GFˆ”¢2¬&˜&FW$&˜GFˆ”¢#Ç6ˆ∆ñB6V6SñS"◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢c¬6ˆ∆˜#¢"3c#&R"¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"◊”Á∂rÁ6V7F˜'”¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3f#cCSb"¬f∆WÉ¢&ÊˆÊR"◊”Á∂rÊóFV◊2Ê∆VÊwFá”¬˜7„‡¢¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬v¢"◊”‡¢∂rÊóFV◊2Ê÷ÇáBí”‚≤6ˆÁ7B2“6V∆V7FVDñB””“BÊñC≤&WGW&‚Ä¢∆'WGFˆ‚∂Wì◊∑BÊñG“ˆ‰6∆ñ6≥◊≤Çí”‚≤6WE6V∆V7FVDñBáBÊñBì≤&∆ñÊ¥6&BáBÊñBì≤6ˆÁ7BV¬“6&E&Vg2Ê7W'&VÁE∑BÊñE”≤ñbÜV¬íV¬Á67&ˆ∆ƒñÁFıfñWrá≤&VÜfñ˜#¢'6÷ˆ˜FÇ"¬&∆ˆ6≥¢&6VÁFW""“ì≤◊“7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&f∆WÇ◊7F'B"¬v¢r¬7W'6˜#¢'ˆñÁFW""¬FWáD∆ñv„¢&∆VgB"¬&6∂w&˜VÊC¢2Ú"6VVc&fb"¢'G&Á7&VÁB"¬&˜&FW#¢#Ç6ˆ∆ñB"≤á2Ú"66FCñfb"¢'G&Á7&VÁB"í¬&˜&FW%&FóW3¢b¬FFñÊs¢#gÇwÇ"¬vñGFÉ¢#R"◊”‡¢«7‚7Gñ∆S◊∑≤vñGFÉ¢b¬ÜVñváC¢b¬&˜&FW%&FóW3¢#SR"¬&6∂w&˜VÊC¢BÊ&ÊBÚBÊ&ÊBÊF˜B¢"66&CVS"¬f∆WÉ¢&ÊˆÊR"¬÷&vñÂF˜¢R◊“Û‡¢«7‚7Gñ∆S◊∑≤f∆WÉ¢¬÷ñÂvñGFÉ¢◊”‡¢«7‚7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ú"3C&ÜR"¢"36CCSb"¬fˆÁEvVñváC¢2Úc¢S¬∆ñÊTÜVñváC¢„#R¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"◊”Á∑BÁ6Ü˜'G”¬˜7„‡¢«7‚7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3f#c3Sr"¬∆ñÊTÜVñváC¢„2¬˜fW&f∆˜s¢&ÜñFFV‚"¬FWáD˜fW&f∆˜s¢&V∆∆ó6ó2"¬vÜóFU76S¢&Ê˜w&"◊”Á∑BÊ6ˆ◊Áí«¬"'”¬˜7„‡¢¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3S#cv"¬fˆÁEvVñváC¢c¬f∆WÉ¢&ÊˆÊR"¬÷&vñÂF˜¢"◊”„≈7FW%6∆'îf∆˜r÷ñC◊∑BÁ6∆'î÷ñG“Û„¬˜7„‡¢¬ˆ'WGFˆ„‡¢ì≤“ó–¢¬ˆFóc‡¢¬ˆFóc‡¢íó–¢¬ˆFóc‡¢¬ˆFóc‡†¢∆Fób7Gñ∆S◊∑≤&˜&FW%F˜¢#Ç6ˆ∆ñB6V6SñS"¬FFñÊuF˜¢2◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢b¬÷&vñ‰&˜GFˆ”¢b◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬fˆÁEvVñváC¢c¬∆WGFW%76ñÊs¢"„V“"¬6ˆ∆˜#¢"3V#F&&B"¬&6∂w&˜VÊC¢"6cVVf2"¬&˜&FW#¢#Ç6ˆ∆ñB6FFCVcb"¬&˜&FW%&FóW3¢R¬FFñÊs¢#'ÇgÇ"◊”‰Ù¥bc„¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬6ˆ∆˜#¢"3f#cCSb"◊”‰˜V‚∂Ê˜v∆VFvRf˜&÷C¬˜7„‡¢¬ˆFóc‡¢«7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3cCsCÜ""¬∆ñÊTÜVñváC¢„R¬÷&vñ„¢#óÇ"◊”‰fVÊF˜"÷ÊWWG&¬÷&∂F˜v‚'VÊF∆R“Ffñ∆RFÚ&VBóB„¬˜‡¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#Ç6ˆ∆ñB6V6SñS"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#óÇÇ"¬÷&vñ‰&˜GFˆ”¢í◊”‡¢∂ˆ∂e&˜rÇ""¬áVW'íÚ6«VvñgíáVW'íí¢'&W7V«G2"í≤"Êˆ∂bÚ"¬"3C&ÜR"¬ÁV∆¬¬G'VRó–¢∂ˆ∂e&˜rÖE"¬&ñÊFWÇÊ÷B"¬"3V#F&&B"¬Çí”‚6WDˆ∂bá≤∂ñÊC¢&ñÊFWÇ"“íó–¢∂ˆ∂e&˜rÖE"¬'˜7FñÊw2ÚÇ"≤6˜'FVBÊ∆VÊwFÇ≤"í"¬"3C&ÜR"¬ÁV∆¬ó–¢∂ˆ∂e&˜rÖE"¬'6V7F˜'2Ú"¬"3C&ÜR"¬ÁV∆¬ó–¢∑6V7F˜'5&W6VÁBÊ÷Çá2¬íí”‚ˆ∂e&˜rÖDí≤Üí””“6V7F˜'5&W6VÁBÊ∆VÊwFÇ“ÚD¬¢E"í¬6«Vvñgíá2í≤"Ê÷B"¬"3S#cv"¬Çí”‚6WDˆ∂bá≤∂ñÊC¢'6V7F˜""¬Ê÷S¢2“ííó–¢∂ˆ∂e&˜rÖD¬¬&∆ˆrÊ÷B"¬"3V#F&&B"¬Çí”‚6WDˆ∂bá≤∂ñÊC¢&∆ˆr"“íó–¢¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬v¢b◊”‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤Çí”‚6WDˆ∂bá≤∂ñÊC¢&ñÊFWÇ"“ó“7Gñ∆S◊∑≤f∆WÉ¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬fˆÁEvVñváC¢S¬7W'6˜#¢'ˆñÁFW""¬÷ñ‰ÜVñváC¢3B¬6ˆ∆˜#¢"3V#F&&B"¬&6∂w&˜VÊC¢"6cvcVfB"¬&˜&FW#¢#Ç6ˆ∆ñB6FFCVcb"¬&˜&FW%&FóW3¢r¬FFñÊs¢r◊”‰˜V‚ñÊFWÉ¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢¬ˆFóc‡¢¬ˆ6ñFS‡†¢∆Fób6∆74Ê÷S“'7FW"÷÷ñ‚"7Gñ∆S◊∑≤f∆WÉ¢¬÷ñÂvñGFÉ¢◊”‡¢≤Ú¢&FvR∂Wì¢FÜR6&B6Üó2◊W7BWá∆ñ‚FÜV◊6V«fW2vóFÜ˜WBÜ˜fW"áF˜V6Ç≤ÜˆÊW7Gíí‚¢˜–¢«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3f#c3Sr"¬∆ñÊTÜVñváC¢„R◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3S#cv"◊”‰&FvR∂Wì¬˜7„‚¥DıG“÷F6Ç&6ó3¢«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢c◊”ÊWÜ7BFóF∆S¬˜7„‚á6÷RFóF∆Rí¥DıG“«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢c◊”ÁFóF∆Rf&ñÁC¬˜7„‚Ü6∆˜6Rv˜&FñÊrí¥DıG“«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢c◊”ÊÁVÊ6S¬˜7„‚á7V6ñ∆ó6VBf˜&“í¥DıG“«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢c◊”Â"e"÷F6É¬˜7„‚Ü÷F6ÜVBñ‚FÜRGWFñW2í¥DıG“«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢c◊”Á&V∆FVC¬˜7„‚¥DıG“«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3vF#""◊”‚¥‚g&ˆ“V◊∆˜ñW#¬˜7„‚“÷˜&R∆ófR˜7FñÊw2'íFÜR6÷RV◊∆˜ñW"ñ‚FÜó2&W7V«B‡¢¬˜‡¢∆Fób6∆74Ê÷S“'7FW"◊6˜W&6R÷w&ñB"7Gñ∆S◊∑≤Fó7∆ì¢&w&ñB"¬w&ñEFV◊∆FT6ˆ«V÷Á3¢6˜W&6T6ˆ«V÷Á2¬v¢b¬∆ñv‰óFV◊3¢&f∆WÇ◊7F'B"¬÷ñÂvñGFÉ¢◊”‡¢∑6˜W&6UÊV¬Ç$◊î6&VW'4gWGW&R"¬÷6d6&G2¬≤F˜C¢"3&cvCFb"¬ñÊ≥¢"3&cvCFb"¬&s¢"6VVcvc"¬&˜&FW#¢"666SfCB"“¬÷6dw&ñE&Vbó–¢∑6˜W&6UÊV¬Ç&6&VW'2Êv˜bÁ6r"¬76t6&G2¬≤F˜C¢"3CFVCÇ"¬ñÊ≥¢"3CFVCÇ"¬&s¢"6Vcfb"¬&˜&FW#¢"63vCffb"“¬76tw&ñE&Vbó–¢¬ˆFóc‡¢¬ˆFóc‡¢¬ˆFóc‡¢ó–†¢∂ˆ∂bbbˆ∂dFˆ2bbƒˆ∂d÷ˆF¬Fˆ3◊∂ˆ∂dFˆ7“ˆ‰6∆˜6S◊≤Çí”‚6WDˆ∂bÜÁV∆¬ó“ÛÁ–†¢∂gV∆ƒBbbÇÇí”‚∞¢6ˆÁ7B¢“gV∆ƒBÊ¶ˆ#∞¢∆WBÇ“7G&ñÊrÜ¢ÊFW67&óFñˆ‚«¬¢Á&W7ˆÁ6ñ&ñ∆óFñW5FWáB«¬""ì∞¢Ç“ÇÁ&W∆6RÇÛ≈«2¢Ü''≈¬˜≈¬ˆFóg≈¬ˆ∆ó≈¬ˆÖ≥”e◊≈¬˜G"ï«2£‚ˆví¬%∆‚"íÁ&W∆6RÇÛ≈«2¶∆ïµ„Â“£‚ˆví¬%∆‚"≤7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ##"í≤""íÁ&W∆6RÇÛ≈µ„Â“≥‚ˆr¬""íÁ&W∆6RÇÚfÊ'7≤ˆr¬""íÁ&W∆6RÇÚf◊≤ˆr¬"b"íÁ&W∆6RÇÚf«C≤ˆr¬#¬"íÁ&W∆6RÇÚfwC≤ˆr¬#‚"íÁ&W∆6RÇÚb33ì≤ˆr¬"r"íÁ&W∆6RÇÚgV˜C≤ˆr¬r"rì∞¢6ˆÁ7B∆ñÊW2“ÇÁ7∆óBÇı∆‚≤ÚíÊ÷Çá2í”‚2Á&W∆6RÇı«2≤ˆr¬""íÁG&ñ“ÇííÊfñ«FW"Çá2í”‚2Ê∆VÊwFÇ‚ì∞¢6ˆÁ7B6∂ñ∆«2“'&íÊó4'&íÜ¢Á6∂ñ∆«2íÚ¢Á6∂ñ∆«2Êfñ«FW"Ñ&ˆˆ∆V‚í¢µ”∞¢ÚÚ˜'F¬FÚFˆ7V÷VÁBÊ&ˆGì¢FÜR÷ˆF¬ó2FW66VÊFÁBˆb∆÷ñ‚6∆74Ê÷S“&÷ñ‚÷6ˆÁFVÁB#‡¢ÚÚá˜6óFñˆ„ß&V∆FófS≤¢÷ñÊFWÉ£í¬vÜñ6ÇG&2óG2¢÷ñÊFWÇ6ÚFÜRÜVFW"ñÁFVB˜fW ¢ÚÚFÜR÷ˆF¬w2FóF∆R‚˜'F∆ñÊrW66W2FÜB7F6∂ñÊr6ˆÁFWáB6Ú§ñÊFWÉ£3G'V«í6óG2ˆ‡¢ÚÚF˜á6÷RfóÇ2FÜR&WfñWu7GVFñÚG&vW"í‡¢&WGW&‚7&VFU˜'F¬Ä¢∆Fób&ˆ∆S“&Fñ∆ˆr"&ñ÷÷ˆF√“'G'VR"&ñ÷∆&V√“$gV∆¬¶ˆ"˜7FñÊr"ˆ‰6∆ñ6≥◊≤Çí”‚6WDgV∆ƒBÜÁV∆¬ó“7Gñ∆S◊∑≤˜6óFñˆ„¢&fóÜVB"¬ñÁ6WC¢¬§ñÊFWÉ¢3¬&6∂w&˜VÊC¢'&v&É2√Ç√#Ç¬„3bí"¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢&6VÁFW""¬FFñÊs¢#Ç◊”‡¢∆Fóbˆ‰6∆ñ6≥◊≤ÜRí”‚RÁ7F˜&˜vFñˆ‚Çó“7Gñ∆S◊∑≤vñGFÉ¢cc¬÷ÖvñGFÉ¢#R"¬÷ÑÜVñváC¢#ÉáfÇ"¬˜fW&f∆˜s¢&ÜñFFV‚"¬&6∂w&˜VÊC¢"6ffb"¬&˜&FW%&FóW3¢B¬&˜Ö6ÜF˜s¢##GÇcÇ&v&É2√Ç√#Ç¬„Bí"¬Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"◊”‡¢∆Fób7Gñ∆S◊∑≤f∆WÉ¢&ÊˆÊR"¬FFñÊs¢#gÇ#Ç"¬&˜&FW$&˜GFˆ”¢#Ç6ˆ∆ñB6V6VS""¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&f∆WÇ◊7F'B"¬v¢"◊”‡¢∆Fób7Gñ∆S◊∑≤÷ñÂvñGFÉ¢¬f∆WÉ¢◊”‡¢∆Fób7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3f#c3Sr"¬∆WGFW%76ñÊs¢"„6V“"◊”Á∂gV∆ƒBÊ6ˆ◊Áó◊∂gV∆ƒBÊvRÚ""≤DıB≤""≤gV∆ƒBÊvR¢"'”¬ˆFóc‡¢∆É27Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"tÊWw7&VFW"r«6W&ñb"¬fˆÁEvVñváC¢c¬fˆÁE6ó¶S¢#„3sW&V“"¬6ˆ∆˜#¢"3c#&R"¬÷&vñ„¢#7Ç"¬∆ñÊTÜVñváC¢„#R◊”Á∂¢ÁFóF∆W”¬ˆÉ3‡¢¬ˆFóc‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤Çí”‚6WDgV∆ƒBÜÁV∆¬ó“&ñ÷∆&V√“$6∆˜6R"FóF∆S“$6∆˜6R"7Gñ∆S◊∑≤vñGFÉ¢CB¬ÜVñváC¢CB¬&˜&FW%&FóW3¢Ç¬&˜&FW#¢#Ç6ˆ∆ñB6S&SCÇ"¬&6∂w&˜VÊC¢"6ffb"¬7W'6˜#¢'ˆñÁFW""¬6ˆ∆˜#¢"3cCsCÜ""¬fˆÁE6ó¶S¢R¬f∆WÉ¢&ÊˆÊR"◊”Áµ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#sRó”¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢∆Fób6∆74Ê÷S“'vó2◊67&ˆ∆¬"7Gñ∆S◊∑≤f∆WÉ¢¬˜fW&f∆˜uì¢&WFÚ"¬FFñÊs¢#gÇ#Ç"◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v¢b¬÷&vñ‰&˜GFˆ”¢"◊”‡¢∂gV∆ƒBÊ÷WFÊ÷ÇÜ“¬íí”‚É«7‚∂Wì◊∂ó“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3CsSScí"¬&6∂w&˜VÊC¢"6ccFcÇ"¬&˜&FW#¢#Ç6ˆ∆ñB6S6SÜVb"¬&˜&FW%&FóW3¢b¬FFñÊs¢#7ÇóÇ"◊”Á∂◊”¬˜7„‚íó–¢∂gV∆ƒBÁ76ˆ2bb«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3V#F&&B"¬&6∂w&˜VÊC¢"6cVVf2"¬&˜&FW#¢#Ç6ˆ∆ñB6FFCVcb"¬&˜&FW%&FóW3¢b¬FFñÊs¢#7ÇóÇ"◊”Â54Ù2∂gV∆ƒBÁ76ˆ7“¥DıG“∂gV∆ƒBÁ6V7F˜'”¬˜7„Á–¢∂gV∆ƒBÊ&ÊBbb«7‚7Gñ∆S◊∑≤Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢R¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢gV∆ƒBÊ&ÊBÊñÊ≤¬&6∂w&˜VÊC¢gV∆ƒBÊ&ÊBÊ&r¬&˜&FW#¢#Ç6ˆ∆ñB"≤gV∆ƒBÊ&ÊBÊ&˜&FW"¬&˜&FW%&FóW3¢b¬FFñÊs¢#7ÇóÇ"◊”„«7‚7Gñ∆S◊∑≤vñGFÉ¢r¬ÜVñváC¢r¬&˜&FW%&FóW3¢#SR"¬&6∂w&˜VÊC¢gV∆ƒBÊ&ÊBÊF˜B◊“ÛÁ∂gV∆ƒBÊ&ÊBÊ∆&V«”¬˜7„Á–¢¬ˆFóc‡¢∑6∂ñ∆«2Ê∆VÊwFÇ‚bbÄ¢∆Fób7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢B◊”‡¢∆Fób7Gñ∆S◊∑≤‚‚‰¥î4≤¬fˆÁE6ó¶S¢#„c#W&V“"¬∆WGFW%76ñÊs¢"„&V“"¬6ˆ∆˜#¢"3f#cCSb"¬÷&vñ‰&˜GFˆ”¢b◊”Â4¥îƒ≈4UE3¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v¢b◊”Á∑6∂ñ∆«2Ê÷Çá2¬íí”‚É«7‚∂Wì◊∂ó“7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"3#VSsB"¬&6∂w&˜VÊC¢"6S6cVf""¬&˜&FW#¢#Ç6ˆ∆ñB6&6Sfc"¬&˜&FW%&FóW3¢2¬FFñÊs¢#7ÇÇ"◊”Á∑7”¬˜7„‚íó”¬ˆFóc‡¢¬ˆFóc‡¢ó–†¢≤Ú¢T’ÙT’2ÙT’C¢&Vvó7FW&VBV◊∆˜ñW"&∆ˆ6≤“FFóFófR¬ñÁ6ñFRFÜP¢WÜó7FñÊrgV∆¬÷B÷ˆF¬‚FG&W72ˆÊ«íˆ‚÷F6ÜVC¢&WÜ7B"ÜÊWfW ¢FÜRFW&ófVB54î2f∆∆&6≤ì≤6˜VÁBó2˜fW"FÜR7W'&VÁB&W7V«B6WB‚¢˜–¢∆Fób7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢B¬FFñÊs¢#Ç'Ç"¬&6∂w&˜VÊC¢"6f&fcÇ"¬&˜&FW#¢#Ç6ˆ∆ñB6V6VS""¬&˜&FW%&FóW3¢í◊”‡¢∆Fób7Gñ∆S◊∑≤‚‚‰¥î4≤¬fˆÁE6ó¶S¢#„c#W&V“"¬∆WGFW%76ñÊs¢"„&V“"¬6ˆ∆˜#¢"3f#cCSb"¬÷&vñ‰&˜GFˆ”¢r◊”Â$Ttï5DU$TBT’ƒıîU#¬ˆFóc‡†¢∂V◊&VrbbV◊&VrÁ7FGW2””“&∆ˆFñÊr"bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"3ìF#"◊”‰6ÜV6∂ñÊr5$&Vvó7G&FñˆÁ¥Tƒ«”¬˜‡¢ó–†¢∂V◊&VrbbV◊&VrÁ7FGW2””“&FˆÊR"bbV◊&VrÊFFbbV◊&VrÊFFÊ÷F6ÜVB””“&WÜ7B"bbÇÇí”‚∞¢6ˆÁ7BB“V◊&VrÊFF∞¢6ˆÁ7BFG$∆ñÊW2“∂BÊ'Vñ∆FñÊr¬BÁ7G&VWB¬BÁ˜7F≈“Êfñ«FW"Ñ&ˆˆ∆V‚ì∞¢&WGW&‚Ä¢∆Fóc‡¢∂FG$∆ñÊW2Ê∆VÊwFÇ‚ ¢Ú«7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"36CCSb"¬∆ñÊTÜVñváC¢„R◊”Á∂FG$∆ñÊW2Ê¶ˆñ‚Ç"¬"ó”¬˜‡¢¢«7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"3ìF#"◊”‰5$÷F6Çf˜VÊB'WBÊÚFG&W72fñV∆G2ˆ‚&V6˜&B„¬˜Á–¢∂BÊÊ÷W6∂W2‚bb«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3vVr"◊”‰5$∆ó7G2∑∂BÊÊ÷W6∂W7“˜FÜW"∂BÊÊ÷W6∂W2””“Ú&VÁFóGí"¢&VÁFóFñW2'“vóFÇFÜó2Ê÷S≤6Ü˜vñÊrFÜRƒïdR◊7FGW2÷F6Ç„¬˜Á–¢∂BÁ˜7F¬bbÄ¢V◊vVÚbbV◊vVÚÁ7FGW2””“&FˆÊR"bbV◊vVÚÊFFbbV◊vVÚÊFFÊ÷F6ÜVB””“'6ñÊv∆R ¢Ú∆ñ÷r7&3◊≤"ˆíˆvVˆ6ˆFSˆ7Fñˆ„◊&VÊFW"g˜7F√“"≤VÊ6ˆFUU$î6ˆ◊ˆÊVÁBÜBÁ˜7F¬ó“«C◊≤$÷ñ‚ÊV"˜7F¬"≤BÁ˜7F«“ˆ‰W'&˜#◊≤ÜRí”‚≤RÊ7W'&VÁEF&vWBÁ7Gñ∆RÊFó7∆í“&ÊˆÊR#≤◊“7Gñ∆S◊∑≤vñGFÉ¢#R"¬÷ÖvñGFÉ¢3#¬ÜVñváC¢c¬ˆ&¶V7DfóC¢&6˜fW""¬&˜&FW%&FóW3¢r¬&˜&FW#¢#Ç6ˆ∆ñB6S6SÜVb"¬÷&vñ‰&˜GFˆ”¢b¬Fó7∆ì¢&&∆ˆ6≤"◊“Û‡¢¢V◊vVÚbbV◊vVÚÁ7FGW2””“&∆ˆFñÊr ¢Ú«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3ìF#"◊”‰∆ˆ6FñÊr÷ñÁ¥Tƒ«”¬˜‡¢¢«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3ìF#"◊”‰÷&WfñWrÊ˜Bfñ∆&∆R“FÜR&Vvó7FW&VBFG&W72&˜fRó2FÜRfW&ñfñVBf7B„¬˜‡¢ó–¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3f#c3Sr"¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”Â6˜W&6S¢5$ÜFFÊv˜bÁ6r¬ñÊf˜&÷Fñˆ‚ˆ‚6˜'˜&FRVÁFóFñW2í¥DıG“÷F6É¢WÜ7B¥DıG“&WG&ñWfVB≤ÇÇí”‚≤G'í≤&WGW&‚ÊWrFFRÜV◊&VrÁ&WG&ñWfVDBíÁFÙ∆ˆ6∆U7G&ñÊrÇ&V‚’4r"¬≤Fì¢&ÁV÷W&ñ2"¬÷ˆÁFÉ¢'6Ü˜'B"¬ñV#¢&ÁV÷W&ñ2"¬Ü˜W#¢#"÷FñvóB"¬÷ñÁWFS¢#"÷FñvóB"¬Ü˜W##¢f«6R¬Fñ÷U¶ˆÊS¢$6ñı6ñÊv˜&R"“í≤"4uB#≤“6F6ÇÖÚí≤&WGW&‚V◊&VrÁ&WG&ñWfVDC≤““íÇó”¬˜‡¢¬ˆFóc‡¢ì∞¢“íÇó–†¢∂V◊&VrbbV◊&VrÁ7FGW2””“&FˆÊR"bbÇV◊&VrÊFF«¬V◊&VrÊFFÊ÷F6ÜVB”“&WÜ7B"íbbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"3ìF#"◊”‰ÊÚWÜ7B5$&Vvó7G&Fñˆ‚÷F6Çf˜"'∂gV∆ƒBÊ6ˆ◊Áó“"„¬˜‡¢ó–†¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"36CCSb"◊”‡¢∂gV∆ƒBÁ6÷TV◊∆˜ñW$6˜VÁB‚ ¢ÚgV∆ƒBÁ6÷TV◊∆˜ñW$6˜VÁB≤"˜FÜW"∆ófR˜7FñÊr"≤ÜgV∆ƒBÁ6÷TV◊∆˜ñW$6˜VÁB””“Ú""¢'2"í≤"g&ˆ“FÜó2V◊∆˜ñW" ¢¢$ˆÊ«í∆ófR˜7FñÊrg&ˆ“FÜó2V◊∆˜ñW"'“ñ‚FÜó2&W7V«B6WBáFÜó26V&6Ç¬◊î6&VW'4gWGW&R≤6&VW'2Êv˜bÁ6r¬∆ófR˜7FñÊw2í‡¢¬˜‡¢¬ˆFóc‡†¢∆Fób7Gñ∆S◊∑≤‚‚‰¥î4≤¬fˆÁE6ó¶S¢#„c#W&V“"¬∆WGFW%76ñÊs¢"„&V“"¬6ˆ∆˜#¢"3f#cCSb"¬÷&vñ‰&˜GFˆ”¢b◊”‰§Ù"B¥DıG“dU$$Dî”¬ˆFóc‡¢∂∆ñÊW2Ê∆VÊwFÇÚ∆ñÊW2Ê÷ÇÜ∆‚¬íí”‚∞¢6ˆÁ7Bó4'V∆∆WB“∆‚Ê6Ü$BÉí””“7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ##"ì∞¢ÚÚÜVFñÊrÜWW&ó7Fñ2ÜFWFW&÷ñÊó7Fñ2¬fW&&Fñ“FWáBVÁF˜V6ÜVBì¢6Ü˜'B∆ñÊR¬Ê¢ÚÚ6VÁFVÊ6R÷VÊFñÊrVÊ7GVFñˆ‚¬fWrv˜&G2“FÜRBw2˜v‚6V7Fñˆ‚FóF∆W0¢ÚÚÇ%&ˆ∆W2b&W7ˆÁ6ñ&ñ∆óFñW2"¬$v˜fW&ÊÊ6RbV∆óGí"ívWB&V¬ÜñW&&6áí‡¢6ˆÁ7Bó4ÜVFñÊr“ó4'V∆∆WBbb∆‚Ê∆VÊwFÇ√“cbb∆‚Á7∆óBÇı«2≤ÚíÊ∆VÊwFÇ√“rbbı≤‚√≥¢ı“BÚÁFW7BÜ∆‚íbbıÂ¥’£”ï“ÚÁFW7BÜ∆‚ì∞¢ñbÜó4ÜVFñÊrí&WGW&‚«∂Wì◊∂ó“7Gñ∆S◊∑≤÷&vñ„¢í””“Ú#gÇ"¢#gÇgÇ"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁE6ó¶S¢#„ì3sW&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3c#&R"¬∆ñÊTÜVñváC¢„3R◊”Á∂∆Á”¬˜„∞¢&WGW&‚«∂Wì◊∂ó“7Gñ∆S◊∑≤÷&vñ„¢ó4'V∆∆WBÚ#WÇGÇ"¢#Ç"¬fˆÁE6ó¶S¢#„ÉW&V“"¬6ˆ∆˜#¢"36CCSb"¬∆ñÊTÜVñváC¢„b◊”Á∂∆Á”¬˜„∞¢“í¢«7Gñ∆S◊∑≤6ˆ∆˜#¢"3ìF#"¬fˆÁE6ó¶S¢#„ÉW&V“"◊”‰ÊÚFW67&óFñˆ‚FWáBñ‚FÜó2˜7FñÊr„¬˜Á–¢¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤f∆WÉ¢&ÊˆÊR"¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢¬FFñÊs¢#'Ç#Ç"¬&˜&FW%F˜¢#Ç6ˆ∆ñB6V6VS""¬&6∂w&˜VÊC¢"6f&fcÇ"◊”‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤Çí”‚≤ˆ‰Ê«ó6U˜7FñÊrÜ¢ì≤◊“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2r«6Á2◊6W&ñb"¬fˆÁEvVñváC¢c¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"6ffb"¬&6∂w&˜VÊC¢"3C&ÜR"¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#ÇgÇ"¬7W'6˜#¢'ˆñÁFW""¬÷ñ‰ÜVñváC¢CB◊”‰Ê«ó6RFÜó2˜7FñÊs¬ˆ'WGFˆ„‡¢∂¢Ê÷6eW&¬bb∆á&Vc◊∂¢Ê÷6eW&«“F&vWC“%ˆ&∆Ê≤"&V√“&Ê˜&VfW'&W""7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"3SfF""¬FWáDFV6˜&Fñˆ„¢'VÊFW&∆ñÊR"¬FWáEVÊFW&∆ñÊTˆfg6WC¢"¬Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬÷ñ‰ÜVñváC¢CB◊”‰˜V‚ˆ‚6˜W&6S¬ˆÁ–¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤Çí”‚≤6WDˆ∂bá≤∂ñÊC¢'˜7FñÊr"¬ñC¢gV∆ƒBÊñB“ì≤6WDgV∆ƒBÜÁV∆¬ì≤◊“FóF∆S“%fñWrÙ¥b6ˆÊ6WBFˆ7V÷VÁB"7Gñ∆S◊∑≤÷&vñ‰∆VgC¢&WFÚ"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3V#F&&B"¬&6∂w&˜VÊC¢"6cvcVfB"¬&˜&FW#¢#Ç6ˆ∆ñB6FFCVcb"¬&˜&FW%&FóW3¢b¬FFñÊs¢#gÇóÇ"¬7W'6˜#¢'ˆñÁFW""¬÷ñ‰ÜVñváC¢CB◊”Á≤'≤“Ù¥b'”¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢¬ˆFóc‡¢¬ˆFóc‚¿¢Fˆ7V÷VÁBÊ&ˆGê¢ì∞¢“íÇó–†¢≤Ú¢fˆ˜FW#¢6÷RÜˆÊW7Gí6ˆÁG&7B27FW2Ö6˜W&6RÙ6ˆÊfñFVÊ6RıFñ÷R◊vñÊF˜rê¢«W2FÜR'Vñ∆BFr¬6Ú&˜FÇ7FW2&VB2ˆÊR7ó7FV“‚FÜRf7B÷6∆ñ–¢FWáBó2vFVBˆ‚7FFRÊ∆ˆFñÊr“˜FÜW'vó6RóB7FFVB$◊î6&VW'4gWGW&P¢É˜7FñÊw2í"2f7BvÜñ∆RFÜRfWF6Çv27Fñ∆¬ñ‚f∆ñváB¬&Vf˜&RFÜP¢&V¬6˜VÁBWÜó7FVB‚FÜRfW'6ñˆ‚Fró6‚wBFF÷FWVÊFVÁB¬6ÚóB7Fó0¢fó6ñ&∆RFá&˜VvÜ˜WB&FÜW"FÜ‚f∆ñ6∂W&ñÊrñ‚ˆÊ«íˆÊ6R∆ˆFñÊrVÊG2‚¢˜–¢∆Fób7Gñ∆S◊∑≤÷&vñÂF˜¢Ç¬FFñÊuF˜¢¬&˜&FW%F˜¢#Ç6ˆ∆ñB6V6VS""¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬v¢¬f∆WÖw&¢'w&"◊”‡¢≤7FFRÊ∆ˆFñÊp¢Ú«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3f#c3Sr"¬fˆÁE7Gñ∆S¢&óF∆ñ2"¬∆ñÊTÜVñváC¢„R◊”‰ÊÚíñ‚FÜó2&VB“˜7FñÊw2ÊB54Ù2&ÊG26ˆ÷RfW&&Fñ“g&ˆ“◊î6&VW'4gWGW&RÚ6&VW'2Êv˜bÁ6rÊBFÜRFWFW&÷ñÊó7Fñ26∆76ñfñW#≤áV÷‚FV6ñFW2‚6˜W&6S¢◊î6&VW'4gWGW&Rá∂&6T¶ˆ'2Ê∆VÊwFá“˜7FñÊw2í‚6ˆÊfñFVÊ6S¢Ê÷VB◊6˜W&6Rf7G2‚Fñ÷R◊vñÊF˜s¢FÜó2&W7V«B„¬˜‡¢¢«7‚ÛÁ–¢«7‚FóF∆S◊≤%4r6&VW"fñWr"≤ıdU%4îÙÁ“7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢"3f#cCSb"¬f∆WÉ¢&ÊˆÊR"◊”Ág¥ıdU%4îÙÁ”¬˜7„‡¢¬ˆFóc‡¢¬ˆFóc‡¢ì∞ß–†¢ÚÚc3¢÷6d¶ˆ'5ÊV¬“∆ófR¶ˆ"˜7FñÊw2g&ˆ“◊î6&VW'4gWGW&Rf˜"FÜRÊ«ó6V@¢ÚÚ&ˆ∆R‚666FñÊr÷F6ÇÜ6ÊˆÊñ6¬FóF∆R”‚U44ÚW76VÁFñ¬6∂ñ∆«2”‚vVñváFV@¢ÚÚ∂Wóv˜&Bf∆∆&6≤íó2ÜÊF∆VB6W'fW"◊6ñFR'íˆíˆ÷6b‚ÁV÷&W&VB6∆ñVÁB◊6ñFP¢ÚÚvñÊr˜fW"6ñÊv∆R∆&vW"fWF6Ç‡¶gVÊ7Fñˆ‚÷6d¶ˆ'5ÊV¬á≤6V¬¬6∂ñ∆«2¬W66Ùˆ67WFñˆ‚¬ˆ‰Ê«ó6U˜7FñÊr¬ˆÂVWVU˜7FñÊr¬VWVT6˜VÁB¬ˆ‰Ê«ó6T6˜'W2¬g&W6Ñw&B“í∞¢6ˆÁ7B∑7FFR¬6WE7FFU““W6U7FFRá≤∆ˆFñÊs¢G'VR¬¶ˆ'3¢µ“¬76t¶ˆ'3¢µ“¬6VV‰ñÊfÛ¢∑“¬FñW#¢¬÷W76vS¢""¬&˜Üñ÷FS¢f«6R¬f∆∆&6≥¢f«6R¬6VC¢f«6R¬W'&˜#¢ÁV∆¬“ì∞¢6ˆÁ7B∑vR¬6WEvU““W6U7FFRÉì∞¢6ˆÁ7B∑6V7F˜$fñ«FW"¬6WE6V7F˜$fñ«FW%““W6U7FFRÜÁV∆¬ì≤ÚÚ¶ˆ"÷6FVv˜'í7V"÷&6ÜWGóRfñ«FW ¢6ˆÁ7B∑&V6VÊ7îfñ«FW"¬6WE&V6VÊ7îfñ«FW%““W6U7FFRÜÁV∆¬ì≤ÚÚÁV∆¬Ü∆¬í¬&ÊWr"¬'6VV‚ ¢6ˆÁ7B∂¶ˆ%Fˆ4˜V‚¬6WD¶ˆ%Fˆ4˜VÂ““W6U7FFRÜf«6Rì∞¢6ˆÁ7BU%ıtR“∞¢W6TVffV7BÇÇí”‚≤6WEvRÉì≤“¬∂g&W6Ñw&B¬&V6VÊ7îfñ«FW%“ì≤ÚÚ&W6WBvñÊrvÜV‚fñ«FW"Fˆvv∆W0¢W6TVffV7BÇÇí”‚∞¢ñbÇ¶ˆ%Fˆ4˜V‚í&WGW&‚VÊFVfñÊVC∞¢6ˆÁ7Bˆ‰∂Wí“R”‚≤ñbÜRÊ∂Wí””“$W66R"í6WD¶ˆ%Fˆ4˜V‚Üf«6Rì≤”∞¢vñÊF˜rÊFDWfVÁD∆ó7FVÊW"Ç&∂WñF˜v‚"¬ˆ‰∂Wíì∞¢&WGW&‚Çí”‚vñÊF˜rÁ&V÷˜fTWfVÁD∆ó7FVÊW"Ç&∂WñF˜v‚"¬ˆ‰∂Wíì∞¢“¬∂¶ˆ%Fˆ4˜VÂ“ì∞†¢W6TVffV7BÇÇí”‚∞¢∆WB6Ê6V∆∆VB“f«6S∞¢6WE7FFRá2”‚á≤‚‚Á2¬∆ˆFñÊs¢G'VR¬W'&˜#¢ÁV∆¬“íì∞¢6WEvRÉì∞¢6WE6V7F˜$fñ«FW"ÜÁV∆¬ì∞¢6WE&V6VÊ7îfñ«FW"ÜÁV∆¬ì∞¢ÚÚ54rác2„„ì"ì¢WáG&7B7ñÊ2&ˆGí2Ê÷VBgVÊ7Fñˆ‚Ö#b6ˆ◊∆ñÊ6Rí‡¢7ñÊ2gVÊ7Fñˆ‚FÙfWF6ÇÇí∞¢ÚÚ‘4bfWF6Ç“&WVW7B&ˆGí'óFR÷ñFVÁFñ6¬FÚ&ñ˜"fW'6ñˆ‚‡¢6ˆÁ7B÷6dfWF6Ç“fWF6ÇÇ"ˆíˆ÷6b"¬∞¢÷WFÜˆC¢%ı5B"¿¢ÜVFW'3¢≤$6ˆÁFVÁB’GóR#¢&∆ñ6Fñˆ‚ˆß6ˆ‚"“¿¢&ˆGì¢•4Ù‚Á7G&ñÊvñgíá∞¢7Fñˆ„¢&¶ˆ'2"¿¢FóF∆S¢6V√ÚÁFóF∆R«¬""¿¢W66Ùˆ67WFñˆ„¢W66Ùˆ67WFñˆ‚«¬ÁV∆¬¿¢6∂ñ∆«3¢á6∂ñ∆«2«¬µ“íÊ÷á2”‚á≤6∂ñ∆√¢2Á6∂ñ∆¬¬ó4W76VÁFñ√¢2Êó4WáFVÊFVB¬'&ˆFW$6ˆÊ6WC¢2Ê'&ˆFW$6ˆÊ6WB“íí¿¢∆ñ÷óC¢S¿¢“í¿¢“íÁFÜV‚Çá"í”‚"Êß6ˆ‚Çíì∞¢ÚÚ54rf‚÷˜WC¢ˆÊR6˜W&6Rfñ∆ñÊr◊W7BÊWfW"&∆Ê≤FÜR˜FÜW"‡¢6ˆÁ7B∂÷6e6WGF∆VB¬76u6WGF∆VE““vóB&ˆ÷ó6RÊ∆≈6WGF∆VBÖ∞¢÷6dfWF6Ç¿¢fWF6Ñ76t¶ˆ'2á6V√ÚÁFóF∆R«¬""¬Sí¿¢“ì∞¢ñbÜ6Ê6V∆∆VBí&WGW&„∞¢6ˆÁ7BFF“÷6e6WGF∆VBÁ7FGW2””“&gV∆fñ∆∆VB"Ú÷6e6WGF∆VBÁf«VR¢≤¶ˆ'3¢µ“¬FñW#¢”∞¢6ˆÁ7B76t¶ˆ'2“76u6WGF∆VBÁ7FGW2””“&gV∆fñ∆∆VB"Ú76u6WGF∆VBÁf«VR¢µ”∞¢ÚÚGvÚ÷6ˆ«V÷‚'&˜w6S¢∂VWFÜRGvÚ6˜W&6W24U$DRÑ‘4b∆VgB¬6&VW'2Êv˜bÁ6p¢ÚÚ&ñváBí‚Fr6˜W&6R6Ú÷6d¶ˆ$6&B∆&V«2óB‚FÜR&ˆ∆R÷Ê«ó6R6˜'W27Fñ∆¿¢ÚÚ‘U$tU2&˜FÇÜvWD¶ˆ'4f˜%&ˆ∆Rí“GvÚ6ˆ«V÷Á2ó2'&˜w6R÷∆ó7B6ˆÊ6W&‚ˆÊ«í‡¢6ˆÁ7B÷6d∆ó7B“Ñ'&íÊó4'&íÜFFÊ¶ˆ'2íÚFFÊ¶ˆ'2¢µ“íÊ÷Ü¢”‚á≤‚‚Ê¢¬6˜W&6S¢¢Á6˜W&6R«¬$◊î6&VW'4gWGW&R"“íì∞¢6ˆÁ7B76t∆ó7B“Ñ'&íÊó4'&íÜ76t¶ˆ'2íÚ76t¶ˆ'2¢µ“íÊ÷Ü¢”‚á≤‚‚Ê¢¬6˜W&6S¢¢Á6˜W&6R«¬&6&VW'2Êv˜bÁ6r"“íì∞¢ÚÚ∆FW7B÷fó'7B'í˜7FVDFFS≤6∆76ñgíFÜR‘4b∆ó7BñÁFÚ‰Urg24TT‚‘$Tdı$P¢ÚÚvñÁ7BFÜó2FóF∆Rw2FWfñ6R÷∆ˆ6¬Üó7F˜'íÜÊB&V6˜&BFÜó26ñváFñÊrí‡¢6ˆÁ7B6˜'FVD¶ˆ'2“6˜'DÊEFt¶ˆ%6V&6Ñ÷F6ÜW2Ü÷6d∆ó7B¬6V√ÚÁFóF∆R«¬""ì∞¢6ˆÁ7B6˜'FVD76r“6˜'DÊEFt¶ˆ%6V&6Ñ÷F6ÜW2Ü76t∆ó7B¬6V√ÚÁFóF∆R«¬""ì∞¢6ˆÁ7B6VV‰ñÊfÚ“&V6˜&DÊD6∆76ñgï6VV‚á6V√ÚÁFóF∆R«¬""¬6˜'FVD¶ˆ'2ì∞¢6WE7FFRá∞¢∆ˆFñÊs¢f«6R¿¢¶ˆ'3¢6˜'FVD¶ˆ'2¿¢76t¶ˆ'3¢6˜'FVD76r¿¢6VV‰ñÊfÚ¿¢FñW#¢FFÁFñW"«¬¿¢÷W76vS¢FFÊ÷W76vR«¬""¿¢&˜Üñ÷FS¢FFÊ&˜Üñ÷FR¿¢f∆∆&6≥¢FFÊf∆∆&6≤bb6˜'FVD76rÊ∆VÊwFÇ””“¿¢6VC¢FFÊ6VB¿¢W'&˜#¢ÁV∆¬¿¢“ì∞¢G&6≤Ç'c5ˆ÷6eˆ∆ˆFVB"¬≤FñW#¢FFÁFñW"«¬¬6˜VÁC¢6˜'FVD¶ˆ'2Ê∆VÊwFÇ¬76s¢6˜'FVD76rÊ∆VÊwFÇ¬f∆∆&6≥¢FFÊf∆∆&6≤“ì∞¢–¢FÙfWF6ÇÇíÊ6F6ÇÇÜW'"í”‚∞¢ñbÜ6Ê6V∆∆VBí&WGW&„∞¢6WE7FFRá≤∆ˆFñÊs¢f«6R¬¶ˆ'3¢µ“¬76t¶ˆ'3¢µ“¬6VV‰ñÊfÛ¢∑“¬FñW#¢¬÷W76vS¢$6˜V∆BÊ˜B&V6ÇFÜR∆ófR¶ˆ'2fVVB‚∆V6RG'ívñ‚ñ‚÷ˆ÷VÁB‚"¬&˜Üñ÷FS¢f«6R¬f∆∆&6≥¢G'VR¬6VC¢f«6R¬W'&˜#¢W'"Ê÷W76vR“ì∞¢G&6≤Ç'c5ˆ÷6eˆW'&˜""¬≤&V6ˆ„¢ÜW'"Ê÷W76vR«¬""íÁ6∆ñ6RÉ¬cí“ì∞¢“ì∞¢&WGW&‚Çí”‚≤6Ê6V∆∆VB“G'VS≤”∞¢“¬∑6V√ÚÁFóF∆R¬W66Ùˆ67WFñˆ„ÚÁW&ï“ì∞†¢6ˆÁ7BFñW$∆&V¬“7FFRÁFñW"””“Ú$WÜ7BFóF∆R÷F6Ç ¢¢7FFRÁFñW"””“"Ú$÷F6ÜVBˆ‚W76VÁFñ¬6∂ñ∆«2 ¢¢7FFRÁFñW"””“2Ú$&˜Üñ÷FR∂Wóv˜&B÷F6Ç ¢¢"#∞†¢6ˆÁ7Bf◊E6∆'í“Ü∆Ú¬Üíí”‚∞¢ñbÜ∆Ú”“ÁV∆¬bbÜí”“ÁV∆¬í&WGW&‚%6∆'íˆ‚∆ñ6Fñˆ‚#∞¢6ˆÁ7B2“Ü‚í”‚2BG¥ÁV÷&W"Ü‚íÁFÙ∆ˆ6∆U7G&ñÊrÇó÷∞¢ñbÜ∆Ú“ÁV∆¬bbÜí“ÁV∆¬í&WGW&‚G∑2Ü∆Úó““G∑2ÜÜíó“Ú÷ˆÁFÜ∞¢&WGW&‚2Ü∆ÚÛÚÜíí≤"Ú÷ˆÁFÇ#∞¢”∞¢6ˆÁ7BFó4vÚ“Üó6Úí”‚∞¢ñbÇó6Úí&WGW&‚"#∞¢6ˆÁ7BB“ÊWrFFRÜó6Úì∞¢ñbÜó4Ê‚ÜBíí&WGW&‚"#∞¢6ˆÁ7BFó2“÷FÇÊ÷ÇÉ¬÷FÇÊf∆ˆ˜"ÇÑFFRÊÊ˜rÇí“BÊvWEFñ÷RÇííÚÉcCíì∞¢ñbÜFó2””“í&WGW&‚%FˆFí#∞¢ñbÜFó2””“í&WGW&‚%ñW7FW&Fí#∞¢ñbÜFó2¬rí&WGW&‚G∂Fó7“Fó2vˆ∞¢ñbÜFó2¬3í&WGW&‚G¥÷FÇÊf∆ˆ˜"ÜFó2Úró“vVV≤G∂Fó2¬BÚ""¢'2'“vˆ∞¢&WGW&‚G¥÷FÇÊf∆ˆ˜"ÜFó2Ú3ó“÷ˆÁFÇG∂Fó2¬cÚ""¢'2'“vˆ∞¢”∞†¢ÚÚ7V"÷&6ÜWGóW3¢w&˜WFÜRfWF6ÜVB˜7FñÊw2'í‘4b¶ˆ"6FVv˜'í“ˆÊ«í6Ü˜v‡¢ÚÚvÜV‚FÜW&Rw2vVÁVñÊR7&VBÉ„”"6FVv˜&ñW2¬V6ÇvóFÇ„”"˜7FñÊw2¬ÊB¢ÚÚ6FVv˜'íˆ‚B∆V7BCRˆb˜7FñÊw2í‚FWFW&÷ñÊó7Fñ2¬ÊÚí‡¢6ˆÁ7B6V7F˜$w&˜W2“ÇÇí”‚∞¢6ˆÁ7B¶ˆ'2“7FFRÊ¶ˆ'3∞¢ñbÇ¶ˆ'2«¬¶ˆ'2Ê∆VÊwFÇ¬bí&WGW&‚µ”∞¢6ˆÁ7B6˜VÁG2“∑”≤∆WBvóFÑ6B“∞¢¶ˆ'2Êf˜$V6ÇÜ¢”‚≤6ˆÁ7B6G2“'&íÊg&ˆ“ÜÊWr6WBÇÜ¢Ê6FVv˜&ñW2«¬µ“íÊfñ«FW"Ñ&ˆˆ∆V‚ííì≤ñbÜ6G2Ê∆VÊwFÇívóFÑ6B≤≥≤6G2Êf˜$V6ÇÜ2”‚≤6˜VÁG5∂5““Ü6˜VÁG5∂5“«¬í≤≤“ì≤“ì∞¢ñbávóFÑ6B¬¶ˆ'2Ê∆VÊwFÇ¢„B«¬ˆ&¶V7BÊ∂Wó2Ü6˜VÁG2íÊ∆VÊwFÇ¬"í&WGW&‚µ”∞¢6ˆÁ7BF˜“ˆ&¶V7BÊVÁG&ñW2Ü6˜VÁG2íÁ6˜'BÇÜ¬"í”‚%≥““≥“«¬≥“Ê∆ˆ6∆T6ˆ◊&RÜ%≥“ííÁ6∆ñ6RÉ¬BíÊ÷ÇÖ∂Â“í”‚‚ì∞¢6ˆÁ7B'V6∂WG2“F˜Ê÷ÜÊ÷R”‚á≤Ê÷R¬¶ˆ'3¢µ““íì∞¢6ˆÁ7B˜FÜW"“µ”∞¢¶ˆ'2Êf˜$V6ÇÜ¢”‚∞¢6ˆÁ7B6G2“ÊWr6WBÇÜ¢Ê6FVv˜&ñW2«¬µ“íÊfñ«FW"Ñ&ˆˆ∆V‚íì∞¢∆WB∆6VB“f«6S∞¢f˜"Ü∆WBí“≤í¬F˜Ê∆VÊwFÉ≤í≤≤í≤ñbÜ6G2ÊÜ2áF˜∂ï“íí≤'V6∂WG5∂ï“Ê¶ˆ'2ÁW6ÇÜ¢ì≤∆6VB“G'VS≤'&V≥≤“–¢ñbÇ∆6VBí˜FÜW"ÁW6ÇÜ¢ì∞¢“ì∞¢6ˆÁ7Bw&˜W2“'V6∂WG2Êfñ«FW"Ü"”‚"Ê¶ˆ'2Ê∆VÊwFÇ„“"ì∞¢ñbÜ˜FÜW"Ê∆VÊwFÇ„“"íw&˜W2ÁW6Çá≤Ê÷S¢$˜FÜW""¬¶ˆ'3¢˜FÜW"“ì∞¢&WGW&‚w&˜W2Ê∆VÊwFÇ„“"Úw&˜W2¢µ”∞¢“íÇì∞¢ÚÚ&VfW"&V¬6∂ñ∆¬÷6«W7FW"7∆óBvÜV‚FÜR˜7FñÊw26''íVÊ˜VvÇ6∂ñ∆¬FF∞¢ÚÚ˜FÜW'vó6Rf∆¬&6≤FÚFÜR¶ˆ"÷6FVv˜'í7∆óB‡¢6ˆÁ7B6∂ñ∆ƒw&˜W2“6«W7FW%˜7FñÊw4'ï6∂ñ∆«2á7FFRÊ¶ˆ'2ì∞¢6ˆÁ7B&6Ñw&˜W2“6∂ñ∆ƒw&˜W2Ê∆VÊwFÇ„“"Ú6∂ñ∆ƒw&˜W2¢6V7F˜$w&˜W3∞¢6ˆÁ7B&6Ñ∆&V¬“6∂ñ∆ƒw&˜W2Ê∆VÊwFÇ„“"Ú&Fó7FñÊ7B6∂ñ∆¬6«W7FW'2"¢&¶ˆ"6FVv˜&ñW2#∞¢6ˆÁ7B7FófT&6Ç“&6Ñw&˜W2ÊfñÊBÜr”‚rÊÊ÷R””“6V7F˜$fñ«FW"í«¬ÁV∆√∞¢ÚÚg&W6Ç÷w&B66˜WC¢ˆÊ«íUÖƒî4ïBVÁG'íˆßVÊñ˜"&ˆ∆W2“‚VÁ7FFVBWáW&ñVÊ6R&"ó2‰ıB6∆ñ÷VBFÚ&R¬@¢6ˆÁ7Bó4g&W6Ç“¢”‚¢Ê÷ñÊñ◊V’ñV'4WáW&ñVÊ6R“ÁV∆¬bb¢Ê÷ñÊñ◊V’ñV'4WáW&ñVÊ6R¬C∞¢6ˆÁ7B&6T¶ˆ'2“Ü7FófT&6ÇÚ7FófT&6ÇÊ¶ˆ'2¢7FFRÊ¶ˆ'2íÊfñ«FW"Ü¢”‚g&W6Ñw&B«¬ó4g&W6ÇÜ¢íì∞¢ÚÚ‰Urg24TT‚‘$Tdı$R7∆óBÜFWfñ6R÷∆ˆ6¬÷V÷˜'íí‚6˜VÁG2&Vf∆V7BFÜR7W'&VÁ@¢ÚÚ&6ÜWGóR≤g&W6Ç÷w&Bfñ«FW"6ÚFÜR6Üó2÷F6ÇvÜBfñ«FW&ñÊrvñ∆¬6Ü˜r‡¢6ˆÁ7B6VV‰ñÊfÚ“7FFRÁ6VV‰ñÊfÚ«¬∑”∞¢6ˆÁ7Bó4ÊWt¶ˆ"“¢”‚≤6ˆÁ7B2“6VV‰ñÊfı∂¢ÁWVñE”≤&WGW&‚2Ú2Êó4ÊWr¢G'VS≤”∞¢6ˆÁ7BÊWtñÂfñWr“&6T¶ˆ'2Êfñ«FW"Üó4ÊWt¶ˆ"íÊ∆VÊwFÉ∞¢6ˆÁ7B6VV‰ñÂfñWr“&6T¶ˆ'2Ê∆VÊwFÇ“ÊWtñÂfñWs∞¢6ˆÁ7BÜ56VV‰Üó7F˜'í“6VV‰ñÂfñWr‚≤ÚÚˆÊ«íˆffW"FÜR7∆óBˆÊ6RFóF∆RÜ2&ñ˜"6ñváFñÊw0¢ÚÚ«íFÜR&V6VÊ7í'V6∂WB‚FÜR4TT‚‘$Tdı$R'V6∂WBó26˜'FVB'ívÜV‚V6Ç@¢ÚÚfó'7BVÁFW&VBñ˜W"6V&6ÜW2Ü÷˜7B◊&V6VÁBfó'7Bì≤‰Ur7Fó2∆FW7B◊˜7FVB‡¢6ˆÁ7BfñWt¶ˆ'2–¢&V6VÊ7îfñ«FW"””“&ÊWr"Ú&6T¶ˆ'2Êfñ«FW"Üó4ÊWt¶ˆ"í†¢&V6VÊ7îfñ«FW"””“'6VV‚"Ú&6T¶ˆ'2Êfñ«FW"Ü¢”‚ó4ÊWt¶ˆ"Ü¢ííÁ6∆ñ6RÇê¢Á6˜'BÇÜ¬"í”‚á6VV‰ñÊfı∂"ÁWVñE”ÚÊfó'7E6VV‚«¬í“á6VV‰ñÊfı∂ÁWVñE”ÚÊfó'7E6VV‚«¬íí†¢&6T¶ˆ'3∞¢6ˆÁ7BF˜F≈vW2“÷FÇÊ÷ÇÉ¬÷FÇÊ6Vñ¬áfñWt¶ˆ'2Ê∆VÊwFÇÚU%ıtRíì∞¢6ˆÁ7B6fUvR“÷FÇÊ÷ñ‚ávR¬F˜F≈vW2“ì∞¢6ˆÁ7BvT¶ˆ'2“fñWt¶ˆ'2Á6∆ñ6Rá6fUvR¢U%ıtR¬6fUvR¢U%ıtR≤U%ıtRì∞¢6ˆÁ7B6ÂVWVR“áVWVT6˜VÁB«¬í¬3∞¢6ˆÁ7Bf◊E6VV‰FFR“Ü◊2í”‚≤6ˆÁ7BB“ÊWrFFRÜ◊2ì≤&WGW&‚ó4Ê‚ÜBíÚ""¢BÁFÙ∆ˆ6∆TFFU7G&ñÊrÇ&V‚’4r"¬≤Fì¢&ÁV÷W&ñ2"¬÷ˆÁFÉ¢'6Ü˜'B"“ì≤”∞¢6ˆÁ7B÷6d÷F6Ñ6˜VÁG2“6˜VÁD¶ˆ%6V&6Ñ'V6∂WG2á7FFRÊ¶ˆ'2ì∞¢6ˆÁ7B76t÷F6Ñ6˜VÁG2“6˜VÁD¶ˆ%6V&6Ñ'V6∂WG2á7FFRÊ76t¶ˆ'2ì∞¢6ˆÁ7BF˜F≈˜7FñÊw2“7FFRÊ¶ˆ'2Ê∆VÊwFÇ≤7FFRÊ76t¶ˆ'2Ê∆VÊwFÉ∞¢6ˆÁ7BßV◊FÚ“ñB”‚∞¢6ˆÁ7BV¬“GóVˆbFˆ7V÷VÁB”“'VÊFVfñÊVB"ÚFˆ7V÷VÁBÊvWDV∆V÷VÁD'îñBÜñBí¢ÁV∆√∞¢ñbÜV¬íV¬Á67&ˆ∆ƒñÁFıfñWrá≤&VÜfñ˜#¢'6÷ˆ˜FÇ"¬&∆ˆ6≥¢'7F'B"“ì∞¢6WD¶ˆ%Fˆ4˜V‚Üf«6Rì∞¢”∞¢ÚÚUÖ¢ˆÊR˜7FñÊr¬ÊBWfW'í˜7FñÊr÷F6ÜñÊrFÜó2&ˆ∆R‚ˆ÷F6Ñ'V6∂WFó0¢ÚÚFÜó2w2˜v‚&Ê∂ñÊrˆbÜ˜rvV∆¬˜7FñÊr÷F6ÜVBFÜR6V&6ÜVB&ˆ∆R¬6¢ÚÚóBG&fV«22FW&ófVB¬6W&FV«íg&ˆ“FÜRfW&&Fñ“˜7FñÊrfñV∆G2‡¢6ˆÁ7BWá˜'E˜7FñÊr“W6T6∆∆&6≤ÜgVÊ7Fñˆ‚Ü¶ˆ"í∞¢F˜vÊ∆ˆDß6ˆ‚Ä¢Wá˜'Dfñ∆VÊ÷RÇ'˜7FñÊr"¬Ü¶ˆ"ÊV◊∆˜ñW"Ú¶ˆ"ÊV◊∆˜ñW"≤"“"¢""í≤Ü¶ˆ"ÁFóF∆R«¬""íí¿¢VÁfV∆˜Rá∞¢66˜S¢'˜7FñÊr"¿¢fW'6ñˆ„¢ıdU%4îÙ‚¿¢VW'ì¢≤&ˆ∆S¢6V√ÚÁFóF∆R«¬ÁV∆¬“¿¢&∆ˆ6∑3¢∞¢˜7FñÊs¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢¶ˆ"Á6˜W&6R””“&6&VW'2Êv˜bÁ6r"Ú&6&VW'2Êv˜bÁ6r"¢$◊î6&VW'4gWGW&R"¿¢&WG&ñWfVDC¢ÊWrFFRÇíÁFÙï4ı7G&ñÊrÇí¬Fñ÷UvñÊF˜s¢&∆ófRB&WG&ñWf¬"“¿¢¶ˆ"í¿¢6V&6Ñ÷F6É¢&∆ˆ6≤Ñı$îtî‚‰DU$ïdTB¿¢≤6˜W&6S¢&¶ˆ"◊6V&6Ç'V6∂WFñÊrñ‚FÜó2"¿¢Ê˜FS¢$Ü˜r6∆˜6V«íFÜó2˜7FñÊr÷F6ÜVBFÜR6V&6ÜVB&ˆ∆R‚6ˆ◊WFVBÜW&R¬Ê˜B7W∆ñVB'íFÜR6˜W&6R‚"“¿¢¶ˆ"Âˆ÷F6Ñ'V6∂WB«¬ÁV∆¬í¿¢“¿¢“ê¢ì∞¢“¬∑6V≈“ì∞†¢6ˆÁ7BWá˜'E&ˆ∆U˜7FñÊw2“W6T6∆∆&6≤ÜgVÊ7Fñˆ‚Çí∞¢6ˆÁ7BÊ˜r“ÊWrFFRÇíÁFÙï4ı7G&ñÊrÇì∞¢F˜vÊ∆ˆDß6ˆ‚Ä¢Wá˜'Dfñ∆VÊ÷RÇ'&ˆ∆R÷˜VÊñÊw2"¬6V√ÚÁFóF∆R«¬'&ˆ∆R"í¿¢VÁfV∆˜Rá∞¢66˜S¢'&ˆ∆R◊˜7FñÊw2"¿¢fW'6ñˆ„¢ıdU%4îÙ‚¿¢VW'ì¢∞¢&ˆ∆S¢6V√ÚÁFóF∆R«¬ÁV∆¬¿¢ó66Ù6ˆFS¢6V√ÚÊó66Ù6ˆFR«¬ÁV∆¬¿¢W66Ùˆ67WFñˆ„¢W66Ùˆ67WFñˆ‚«¬ÁV∆¬¿¢g&W6Ñw&Dfñ«FW#¢g&W6Ñw&B¿¢“¿¢&∆ˆ6∑3¢∞¢÷6e˜7FñÊw3¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢$◊î6&VW'4gWGW&R"¬&WG&ñWfVDC¢Ê˜r¬Fñ÷UvñÊF˜s¢&∆ófRB&WG&ñWf¬"¿¢Ê˜FS¢7FFRÊ6VBÚ%&W7V«B6WBv26VC≤FÜó2ó2Ê˜BWfW'í÷F6ÜñÊr˜7FñÊr‚"¢VÊFVfñÊVB“¿¢7FFRÊ¶ˆ'2í¿¢76u˜7FñÊw3¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢&6&VW'2Êv˜bÁ6r"¬&WG&ñWfVDC¢Ê˜r¿¢Fñ÷UvñÊF˜s¢&6&VW'2Êv˜bÁ6rFˆW2Ê˜BWá˜6RóG2˜v‚&Vg&W6ÇvñÊF˜s≤FÜó2ó2vÜV‚FÜó26∆ñVÁB&WG&ñWfVBóB"“¿¢7FFRÊ76t¶ˆ'2í¿¢6V&6Ñ÷F6Ñ6˜VÁG3¢&∆ˆ6≤Ñı$îtî‚‰DU$ïdTB¿¢≤6˜W&6S¢&6˜VÁD¶ˆ%6V&6Ñ'V6∂WG2Çíñ‚FÜó2"“¿¢≤÷6c¢÷6d÷F6Ñ6˜VÁG2¬76s¢76t÷F6Ñ6˜VÁG2“í¿¢6V&6ÖFñW#¢&∆ˆ6≤Ñı$îtî‚‰DU$ïdTB¿¢≤6˜W&6S¢'FÜó2w26V&6ÇvñFVÊñÊr∆FFW""¿¢Ê˜FS¢%vÜñ6ÇvñFVÊñÊrFñW"&ˆGV6VBFÜó26WC≤ÜñvÜW"FñW'2&R∆ˆ˜6W"÷F6ÜW2‚"“¿¢≤FñW#¢7FFRÁFñW"¬&˜Üñ÷FS¢7FFRÊ&˜Üñ÷FR¬6VC¢7FFRÊ6VB¬÷W76vS¢7FFRÊ÷W76vR«¬ÁV∆¬“í¿¢&ˆ∆U6∂ñ∆«3¢&∆ˆ6≤Ñı$îtî‚‰DU$ïdTB¿¢≤6˜W&6S¢$U44ÚfñˆíˆW66Ú"¬Ê˜FS¢%6∂ñ∆«2f˜"FÜR6V&6ÜVBˆ67WFñˆ‚¬Ê˜Bf˜"ÁíˆÊR˜7FñÊr‚"“¿¢6∂ñ∆«2«¬ÁV∆¬í¿¢“¿¢“ê¢ì∞¢“¬∑6V¬¬W66Ùˆ67WFñˆ‚¬g&W6Ñw&B¬7FFR¬÷6d÷F6Ñ6˜VÁG2¬76t÷F6Ñ6˜VÁG2¬6∂ñ∆«5“ì∞†¢6ˆÁ7B&VÊFW$¶ˆ$6&G2“Ü¶ˆ'2¬6˜W&6U&VfóÇ¬6VV‰VÊ&∆VBí”‚Ä¢∆Fób6∆74Ê÷S“&÷6b÷w&ñB#‡¢∂¶ˆ'2Ê÷ÇÜ¶ˆ"¬ñGÇí”‚∞¢6ˆÁ7B&Wb“ñGÇ‚Ú¶ˆ'5∂ñGÇ““Âˆ÷F6Ñ'V6∂WB¢ÁV∆√∞¢6ˆÁ7B6Ü˜t'&V≤“¶ˆ"Âˆ÷F6Ñ'V6∂WBbb¶ˆ"Âˆ÷F6Ñ'V6∂WB”“&Wc∞¢&WGW&‚Ä¢∆Fób∂Wì◊∂¶ˆ"ÁWVñB«¬G∑6˜W&6U&Vfóá““G∂ñGá÷“7Gñ∆S◊∑≤Fó7∆ì¢&w&ñB"¬v¢Ç◊”‡¢∑6Ü˜t'&V≤bbƒ¶ˆ$÷F6Ñ'&V≤'V6∂WC◊∂¶ˆ"Âˆ÷F6Ñ'V6∂WG“ñC◊∂G∑6˜W&6U&Vfóá““G∂¶ˆ"Âˆ÷F6Ñ'V6∂WG÷“ÛÁ–¢ƒ÷6d¶ˆ$6&B¶ˆ#◊∂¶ˆ'“f◊E6∆'ì◊∂f◊E6∆'ó“Fó4vÛ◊∂Fó4v˜–¢6VV„◊∑6VV‰VÊ&∆VBÚ6VV‰ñÊfı∂¶ˆ"ÁWVñE“¢VÊFVfñÊVG“f◊E6VV‰FFS◊∂f◊E6VV‰FFW–¢ˆ‰Ê«ó6U˜7FñÊs◊∂ˆ‰Ê«ó6U˜7FñÊw“ˆÂVWVU˜7FñÊs◊∂ˆÂVWVU˜7FñÊw“6ÂVWVS◊∂6ÂVWVW–¢ˆ‰Wá˜'C◊∂Wá˜'E˜7FñÊw“Û‡¢¬ˆFóc‡¢ì∞¢“ó–¢¬ˆFóc‡¢ì∞†¢&WGW&‚Ä¢∆FóbñC“'6r÷¶ˆ'2◊F˜"7Gñ∆S◊∑≤˜6óFñˆ„¢'&V∆FófR"◊”‡¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3¢¬FFñÊs¢#gÇáÇ"¬÷&vñ‰&˜GFˆ”¢b◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&f∆WÇ◊7F'B"¬v¢Ç◊”‡¢∆É"6∆74Ê÷S“'B÷ÜVFñÊr"7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„3sW&V“"¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢2ÁFWáB¬f∆WÉ¢¬÷ñÂvñGFÉ¢◊”‚b3#sCÉ≤b3#sCcÉ≤4r¶ˆ"˜7FñÊw3¬ˆÉ#‡¢≤Ú¢UÖ¢WfW'í˜7FñÊr÷F6ÜñÊrFÜó2&ˆ∆R¬&˜FÇ6˜W&6W2¬«W2FÜRFW&ófV@¢÷F6Ç6˜VÁG2ÊB6V&6ÇFñW"6ÚFÜR6WBó2&W&ˆGV6ñ&∆R∆FW"‚¢˜–¢≤7FFRÊ∆ˆFñÊrbbF˜F≈˜7FñÊw2‚bbÄ¢ƒF˜vÊ∆ˆDß6ˆ‰'WGFˆ‡¢ˆ‰6∆ñ6≥◊∂Wá˜'E&ˆ∆U˜7FñÊw7–¢∆&V√◊≤$F˜vÊ∆ˆB∆¬"≤F˜F≈˜7FñÊw2≤"˜7FñÊw2f˜"FÜó2&ˆ∆R2•4Ù‚'–¢FóF∆S“$F˜vÊ∆ˆBFÜW6R˜7FñÊw22•4Ù‚ ¢Û‡¢ó–¢¬ˆFóc‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„ÉsW&V“"¬6ˆ∆˜#¢2ÁFWáE7V"¬∆ñÊTÜVñváC¢„R◊”‡¢7W'&VÁB˜VÊñÊw2g&ˆ“∆á&Vc“&áGG3¢Ú˜wwrÊ◊ñ6&VW'6gWGW&RÊv˜bÁ6rÚ"F&vWC“%ˆ&∆Ê≤"&V√“&Êˆ˜VÊW"Ê˜&VfW'&W""7Gñ∆S◊∑≤6ˆ∆˜#¢"3SfF""¬FWáDFV6˜&Fñˆ„¢&ÊˆÊR"◊”‰◊î6&VW'4gWGW&S¬ˆ‚ÊB∆á&Vc“&áGG3¢Úˆ6&VW'2Êv˜bÁ6rÚ"F&vWC“%ˆ&∆Ê≤"&V√“&Êˆ˜VÊW"Ê˜&VfW'&W""7Gñ∆S◊∑≤6ˆ∆˜#¢"3SfF""¬FWáDFV6˜&Fñˆ„¢&ÊˆÊR"◊”Ê6&VW'2Êv˜bÁ6s¬ˆ‚÷F6ÜñÊrFÜó2&ˆ∆R‚F«7G&ˆÊs‰Ê«ó6RFÜó2˜7FñÊs¬˜7G&ˆÊs‚ˆ‚Áí¶ˆ"FÚ'V‚6∂ñ∆¬Ê«ó6ó2w&˜VÊFVBñ‚FÜB∆ó7FñÊw∂ˆ‰Ê«ó6T6˜'W2Ú"“˜"Ê«ó6R∆¬ˆbFÜV“2ˆÊR&ˆ∆R"¢"'“‚˜7FñÊw2&Vg&W6ÇFñ«í‡¢¬˜‡¢∂ˆ‰Ê«ó6T6˜'W2bb7FFRÊ∆ˆFñÊrbbF˜F≈˜7FñÊw2„“RbbÄ¢∆'WGFˆ‚ñC“'6r÷¶ˆ'2÷Ê«ó6R÷∆¬"ˆ‰6∆ñ6≥◊≤Çí”‚ˆ‰Ê«ó6T6˜'W2Ö≤‚‚Á7FFRÊ¶ˆ'2¬‚‚Á7FFRÊ76t¶ˆ'5“¬6V√ÚÁFóF∆Ró–¢7Gñ∆S◊∑≤÷&vñÂF˜¢"¬&6∂w&˜VÊC¢"3SsCì"¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢¬6ˆ∆˜#¢"6ffb"¬FFñÊs¢#ÇgÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢s¬7W'6˜#¢'ˆñÁFW""◊”‡¢	˘8¢Ê«ó6R∆¬∑F˜F≈˜7FñÊw7◊∑7FFRÊ6VBÚ"≤"¢"'“˜7FñÊw22ˆÊR&ˆ∆R(i ¢¬ˆ'WGFˆ„‡¢ó–¢¬ˆFóc‡†¢∑7FFRÊ∆ˆFñÊrbbÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6ccñfb"¬&˜&FW#¢#Ç6ˆ∆ñB6&SffB"¬&˜&FW%&FóW3¢¬FFñÊs¢#3'Ç#Ç"¬FWáD∆ñv„¢&6VÁFW""◊”‡¢ƒñÊ∆ñÊU7ñÊÊW"6ó¶S◊≥3“FÜñ6∂ÊW73◊≥7“6ˆ∆˜#“"3SfF""G&6¥6ˆ∆˜#“"6&SffB"7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñ„¢#WFÚ'Ç"◊“Û‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"33cñ"◊”Â6V&6ÜñÊr◊î6&VW'4gWGW&R‚‚„¬˜‡¢¬ˆFóc‡¢ó–†¢≤7FFRÊ∆ˆFñÊrbb7FFRÊ¶ˆ'2Ê∆VÊwFÇ””“bb7FFRÊ76t¶ˆ'2Ê∆VÊwFÇ””“bbÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢2Ê÷&W$&r¬&˜&FW#¢Ç6ˆ∆ñBG¥2Ê÷&W$&G'÷¬&˜&FW%&FóW3¢¬FFñÊs¢##ÇáÇ"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"3sÉ3Sb"¬∆ñÊTÜVñváC¢„b◊”‡¢∑7FFRÊ÷W76vR«¬$ÊÚ∆ófR˜7FñÊw2÷F6ÜVBFÜó2&ˆ∆RFˆFí‚˜7FñÊw2&Vg&W6ÇFñ«íˆ‚◊î6&VW'4gWGW&R“6ÜV6≤&6≤Fˆ÷˜'&˜r‚'–¢¬˜‡¢«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„sW&V“"◊”‡¢∆á&Vc◊∂áGG3¢Ú˜wwrÊ◊ñ6&VW'6gWGW&RÊv˜bÁ6r˜6V&6É˜6V&6É“G∂VÊ6ˆFUU$î6ˆ◊ˆÊVÁBá6V√ÚÁFóF∆R«¬""ó÷“F&vWC“%ˆ&∆Ê≤"&V√“&Êˆ˜VÊW"Ê˜&VfW'&W""7Gñ∆S◊∑≤6ˆ∆˜#¢"3SfF""¬FWáDFV6˜&Fñˆ„¢&ÊˆÊR"¬fˆÁEvVñváC¢s◊”‡¢6V&6Ç◊î6&VW'4gWGW&RFó&V7F«í(i ¢¬ˆ‡¢¬˜‡¢¬ˆFóc‡¢ó–†¢≤7FFRÊ∆ˆFñÊrbbá7FFRÊ¶ˆ'2Ê∆VÊwFÇ‚«¬7FFRÊ76t¶ˆ'2Ê∆VÊwFÇ‚íbbÄ¢√‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"&ñ÷∆&V√“$˜V‚¶ˆ"F&∆Rˆb6ˆÁFVÁG2"&ñ÷WáÊFVC◊∂¶ˆ%Fˆ4˜VÁ“&ñ÷6ˆÁG&ˆ«3“'6r÷¶ˆ'2◊Fˆ2÷G&vW""ˆ‰6∆ñ6≥◊≤Çí”‚6WD¶ˆ%Fˆ4˜V‚ÜÚ”‚Úó–¢7Gñ∆S◊∑≤˜6óFñˆ„¢&fóÜVB"¬∆VgC¢b¬&˜GFˆ”¢§Ù%ıDÙ5Ù%UEDÙÂÙ$ıEDÙ“¬§ñÊFWÉ¢S¬÷ñ‰ÜVñváC¢CB¬Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬&6∂w&˜VÊC¢"3#6#cr"¬6ˆ∆˜#¢"6ffb"¬&˜&FW#¢#Ç6ˆ∆ñB&v&É#SR√#SR√#SR√„Çí"¬&˜&FW%&FóW3¢"¬FFñÊs¢#ÇGÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢É¬7W'6˜#¢'ˆñÁFW""¬&˜Ö6ÜF˜s¢#'Ç3Ç&v&ÉR√#2√C"√„#Bí"◊”‡¢«7‚&ñ÷ÜñFFV„“'G'VR#Ó)ã¬˜7„‚¶ˆ'2«7‚&ñ÷ÜñFFV„“'G'VR"7Gñ∆S◊∑≤˜6óGì¢„Ç¬fˆÁE6ó¶S¢#„cÉsW&V“"◊”Á∑F˜F≈˜7FñÊw7”¬˜7„‡¢¬ˆ'WGFˆ„‡¢∂¶ˆ%Fˆ4˜V‚bbÄ¢∆FóbñC“'6r÷¶ˆ'2◊Fˆ2÷G&vW""&ˆ∆S“&Fñ∆ˆr"&ñ÷∆&V√“$¶ˆ"&W7V«G2ÊfñvFñˆ‚"7Gñ∆S◊∑≤˜6óFñˆ„¢&fóÜVB"¬∆VgC¢b¬&˜GFˆ”¢§Ù%ıDÙ5ÙE$tU%Ù$ıEDÙ“¬§ñÊFWÉ¢S¬vñGFÉ¢&÷ñ‚É3CÇ¬6∆2Égr“3'Çíí"¬&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3¢"¬FFñÊs¢"¬&˜Ö6ÜF˜s¢#áÇCGÇ&v&ÉR√#2√C"√„#"í"◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬÷&vñ‰&˜GFˆ”¢Ç◊”‡¢∆Fóc‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢2ÁFWáB◊”‰¶ˆ"WfñFVÊ6S¬˜‡¢«7Gñ∆S◊∑≤÷&vñ„¢#'Ç"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”Á∑F˜F≈˜7FñÊw7◊∑7FFRÊ6VBÚ"≤"¢"'“∆ófR˜7FñÊw3¬˜‡¢¬ˆFóc‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"&ñ÷∆&V√“$6∆˜6R¶ˆ"G&vW""ˆ‰6∆ñ6≥◊≤Çí”‚6WD¶ˆ%Fˆ4˜V‚Üf«6Ró“7Gñ∆S◊∑≤÷ñÂvñGFÉ¢CB¬÷ñ‰ÜVñváC¢CB¬&˜&FW#¢Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3¢Ç¬&6∂w&˜VÊC¢2Á7W&f6R¬6ˆ∆˜#¢2ÁFWáB¬fˆÁE6ó¶S¢#&V“"¬7W'6˜#¢'ˆñÁFW""◊”Ï9s¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2ÁFWáE7V"¬∆ñÊTÜVñváC¢„CR◊”ÂFóF∆R÷F6ÜW2&Ê≤fó'7B‚GWFñW2ÊB6Vv÷VÁG27Fífó6ñ&∆R26V6ˆÊF'íWfñFVÊ6R„¬˜‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&w&ñB"¬v¢b◊”‡¢µ∞¢≤ñC¢&÷6b÷¶ˆ'2"¬∆&V√¢$‘4b"¬6˜VÁG3¢÷6d÷F6Ñ6˜VÁG2¬F˜F√¢7FFRÊ¶ˆ'2Ê∆VÊwFÇ“¿¢≤ñC¢&76r÷¶ˆ'2"¬∆&V√¢$6&VW'2"¬6˜VÁG3¢76t÷F6Ñ6˜VÁG2¬F˜F√¢7FFRÊ76t¶ˆ'2Ê∆VÊwFÇ“¿¢“Ê÷á7&2”‚Ä¢ƒ¶ˆ%Fˆ56˜W&6T'WGFˆ‚∂Wì◊∑7&2ÊñG“ñC◊∑7&2ÊñG“∆&V√◊∑7&2Ê∆&V«“F˜F√◊∑7&2ÁF˜F«“6˜VÁG3◊∑7&2Ê6˜VÁG7“ˆ‰ßV◊◊∂ßV◊F˜“Û‡¢íó–¢∂ˆ‰Ê«ó6T6˜'W2bbF˜F≈˜7FñÊw2„“RbbÄ¢∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊≤Çí”‚ˆ‰Ê«ó6T6˜'W2Ö≤‚‚Á7FFRÊ¶ˆ'2¬‚‚Á7FFRÊ76t¶ˆ'5“¬6V√ÚÁFóF∆Ró–¢7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢CB¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢Ç¬&6∂w&˜VÊC¢"3SsCì"¬6ˆ∆˜#¢"6ffb"¬FFñÊs¢#óÇÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢É¬7W'6˜#¢'ˆñÁFW""◊”‡¢Ê«ó6R∆¬∑F˜F≈˜7FñÊw7◊∑7FFRÊ6VBÚ"≤"¢"'“˜7FñÊw0¢¬ˆ'WGFˆ„‡¢ó–¢¬ˆFóc‡¢¬ˆFóc‡¢ó–¢∆Fób6∆74Ê÷S“&76r÷6ˆ«2#‡¢∆FóbñC“&÷6b÷¶ˆ'2"7Gñ∆S◊∑≤67&ˆ∆ƒ÷&vñÂF˜¢ì◊”‡¢∆É27Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#„ì3sW&V“"¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢2ÁFWáB¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢R◊”„«7‚&ñ÷ÜñFFV„“'G'VR#‚b3#sCÉ≤b3#sCcÉ≥¬˜7„‚◊î6&VW'4gWGW&Rá∑7FFRÊ¶ˆ'2Ê∆VÊwFá“ì¬ˆÉ3‡¢∑7FFRÊ¶ˆ'2Ê∆VÊwFÇ””“ÚÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”‰ÊÚ◊î6&VW'4gWGW&R˜7FñÊw2÷F6ÜVBFÜó2&ˆ∆RFˆFí„¬˜‡¢í¢Ä¢√‡¢∂&6Ñw&˜W2Ê∆VÊwFÇ„“"bbÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3¢¬FFñÊs¢#ÇGÇ"¬÷&vñ‰&˜GFˆ”¢"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢#wÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢2Ê◊WFVB¬FWáEG&Á6f˜&”¢'WW&66R"¬∆WGFW%76ñÊs¢#„fV“"◊”‡¢FÜW6R∑7FFRÊ¶ˆ'2Ê∆VÊwFá◊∑7FFRÊ6VBÚ"≤"¢"'“˜7FñÊw2f∆¬ñÁFÚ∂&6Ñw&˜W2Ê∆VÊwFá“∂&6Ñ∆&V«“(	BFFÚfñ«FW ¢¬˜‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v¢b◊”‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤Çí”‚≤6WE6V7F˜$fñ«FW"ÜÁV∆¬ì≤6WEvRÉì≤◊–¢7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢c¬&˜&FW%&FóW3¢b¬FFñÊs¢#GÇ'Ç"¬7W'6˜#¢'ˆñÁFW""¿¢&˜&FW#¢'Ç6ˆ∆ñBG≤6V7F˜$fñ«FW"Ú"3SsCì"¢2Ê&˜&FW'÷¬&6∂w&˜VÊC¢6V7F˜$fñ«FW"Ú"3SsCì"¢2Á7W&f6R¬6ˆ∆˜#¢6V7F˜$fñ«FW"Ú"6ffb"¢2ÁFWáE7V"◊”‡¢∆¬á∂g&W6Ñw&BÚ7FFRÊ¶ˆ'2Êfñ«FW"Üó4g&W6ÇíÊ∆VÊwFÇ¢7FFRÊ¶ˆ'2Ê∆VÊwFá“ê¢¬ˆ'WGFˆ„‡¢∂&6Ñw&˜W2Ê÷Ür”‚Ä¢∆'WGFˆ‚∂Wì◊∂rÊÊ÷W“ˆ‰6∆ñ6≥◊≤Çí”‚≤6WE6V7F˜$fñ«FW"ÜrÊÊ÷R””“6V7F˜$fñ«FW"ÚÁV∆¬¢rÊÊ÷Rì≤6WEvRÉì≤◊–¢7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢c¬&˜&FW%&FóW3¢b¬FFñÊs¢#GÇ'Ç"¬7W'6˜#¢'ˆñÁFW""¿¢&˜&FW#¢'Ç6ˆ∆ñBG∑6V7F˜$fñ«FW"””“rÊÊ÷RÚ"3SsCì"¢2Ê&˜&FW'÷¬&6∂w&˜VÊC¢6V7F˜$fñ«FW"””“rÊÊ÷RÚ"3SsCì"¢2Á7W&f6R¬6ˆ∆˜#¢6V7F˜$fñ«FW"””“rÊÊ÷RÚ"6ffb"¢2ÁFWáE7V"◊”‡¢∂rÊÊ÷W“á∂g&W6Ñw&BÚrÊ¶ˆ'2Êfñ«FW"Üó4g&W6ÇíÊ∆VÊwFÇ¢rÊ¶ˆ'2Ê∆VÊwFá“ê¢¬ˆ'WGFˆ„‡¢íó–¢¬ˆFóc‡¢¬ˆFóc‡¢ó–¢∂Ü56VV‰Üó7F˜'íbbÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3¢¬FFñÊs¢#ÇGÇ"¬÷&vñ‰&˜GFˆ”¢"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢#wÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢2Ê◊WFVB¬FWáEG&Á6f˜&”¢'WW&66R"¬∆WGFW%76ñÊs¢#„fV“"◊”‡¢∂ÊWtñÂfñWw“ÊWr6ñÊ6Rñ˜R∆7B∆ˆˆ∂VB+r∑6VV‰ñÂfñWw“g&ˆ“&Wfñ˜W26V&6Ç(	BFFÚfñ«FW ¢¬˜‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v¢b◊”‡¢µ∞¢≤≥¢ÁV∆¬¬∆&V√¢∆¬ÇG∂&6T¶ˆ'2Ê∆VÊwFá“ñ“¿¢≤≥¢&ÊWr"¬∆&V√¢) bÊWrÇG∂ÊWtñÂfñWw“ñ“¿¢≤≥¢'6VV‚"¬∆&V√¢(jí6VV‚&Vf˜&RÇG∑6VV‰ñÂfñWw“ñ“¿¢“Ê÷Ü˜B”‚∞¢6ˆÁ7Bˆ‚“&V6VÊ7îfñ«FW"””“˜BÊ≥∞¢&WGW&‚Ä¢∆'WGFˆ‚∂Wì◊∂˜BÊ∆&V«“ˆ‰6∆ñ6≥◊≤Çí”‚≤6WE&V6VÊ7îfñ«FW"Ü˜BÊ≤ì≤6WEvRÉì≤◊–¢7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢c¬&˜&FW%&FóW3¢b¬FFñÊs¢#GÇ'Ç"¬7W'6˜#¢'ˆñÁFW""¿¢&˜&FW#¢'Ç6ˆ∆ñBG∂ˆ‚Ú"3SsCì"¢2Ê&˜&FW'÷¬&6∂w&˜VÊC¢ˆ‚Ú"3SsCì"¢2Á7W&f6R¬6ˆ∆˜#¢ˆ‚Ú"6ffb"¢2ÁFWáE7V"◊”‡¢∂˜BÊ∆&V«–¢¬ˆ'WGFˆ„‡¢ì∞¢“ó–¢¬ˆFóc‡¢«7Gñ∆S◊∑≤÷&vñ„¢#wÇ"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"¬∆ñÊTÜVñváC¢„R◊”‡¢(	ƒÊW~(	“g2(	≈6VV‚&Vf˜&^(	“ó2&V÷V÷&W&VBˆ‚FÜó2FWfñ6RˆÊ«í(	Bñ˜W"˜v‚6V&6ÇÜó7F˜'íf˜"FÜó2FóF∆R¬Ê˜BFFg&ˆ“◊î6&VW'4gWGW&R‚˜7FñÊw2&R6˜'FVBÊWvW7B◊˜7FVBfó'7C≤FÜR(	≈6VV‚&Vf˜&^(	“∆ó7Bó2˜&FW&VB'ívÜV‚V6ÇBfó'7B6Ü˜vVBWñ‚ñ˜W"6V&6ÜW2‡¢¬˜‡¢¬ˆFóc‡¢ó–¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢¬÷&vñ‰&˜GFˆ”¢"◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„ÉsW&V“"¬6ˆ∆˜#¢2ÁFWáE7V"◊”‡¢∂7FófT&6ÇÚG∑fñWt¶ˆ'2Ê∆VÊwFá“ñ‚(	¬G∂7FófT&6ÇÊÊ÷Wﬁ(	÷¢G∑fñWt¶ˆ'2Ê∆VÊwFá“G∑7FFRÊ6VBbbg&W6Ñw&Bbb&V6VÊ7îfñ«FW"Ú"≤"¢"'“˜7FñÊrG∑fñWt¶ˆ'2Ê∆VÊwFÇ””“Ú""¢'2'÷–¢∑&V6VÊ7îfñ«FW"””“&ÊWr"Ú"+rÊWrˆÊ«í"¢&V6VÊ7îfñ«FW"””“'6VV‚"Ú"+r6VV‚&Vf˜&R"¢"'–¢∂g&W6Ñw&BÚ+rg&W6Ç÷w&Bfñ«FW"É¬Bó'2Wáñ¢"'–¢∑F˜F≈vW2‚Ú+r6Ü˜vñÊrG∑6fUvR¢U%ıtR≤ﬁ(	2G∑6fUvR¢U%ıtR≤vT¶ˆ'2Ê∆VÊwFá÷¢"'–¢¬˜7„‡¢∑FñW$∆&V¬bbÄ¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢7FFRÊ&˜Üñ÷FRÚ"3ì#CR"¢"3SsCì"¬&6∂w&˜VÊC¢7FFRÊ&˜Üñ÷FRÚ2Ê÷&W$&r¢2ÁFVƒ&r¬&˜&FW#¢Ç6ˆ∆ñBG∑7FFRÊ&˜Üñ÷FRÚ2Ê÷&W$&G"¢2ÁFVƒ&G'÷¬&˜&FW%&FóW3¢¬FFñÊs¢#'ÇÇ"◊”‡¢∑FñW$∆&V«–¢¬˜7„‡¢ó–¢¬ˆFóc‡¢∂g&W6Ñw&Bbb&6T¶ˆ'2Ê∆VÊwFÇ””“bb7FFRÊ¶ˆ'2Ê∆VÊwFÇ‚bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”‰ÊÚ&ˆ∆W2VÊFW"BñV'2g'7VÛ≤WáW&ñVÊ6R÷ˆÊrFÜW6R∑7FFRÊ¶ˆ'2Ê∆VÊwFá“∆ófR˜7FñÊw2(	BVÁFñ6≤f∆GVÛ¥g&W6Çw&G2g&GVÛ≤FÚ6VR∆¬„¬˜‡¢ó–¢∂g&W6Ñw&Bbb7FFRÊ6VBbb&6T¶ˆ'2Ê∆VÊwFÇ‚bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”‰fñ«FW&ñÊrFÜRfó'7B∑7FFRÊ¶ˆ'2Ê∆VÊwFá“fWF6ÜVB˜7FñÊw2(	B÷˜&RVÁG'í÷∆WfV¬&ˆ∆W2÷íWÜó7BgW'FÜW"F˜v‚◊î6&VW'4gWGW&R„¬˜‡¢ó–¢∑&VÊFW$¶ˆ$6&G2ávT¶ˆ'2¬&÷6b"¬Ü56VV‰Üó7F˜'íó–¢∑F˜F≈vW2‚bbÄ¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬ßW7Fñgî6ˆÁFVÁC¢&6VÁFW""¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢b¬f∆WÖw&¢'w&"¬÷&vñÂF˜¢B◊”‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤Çí”‚6WEvRá”‚÷FÇÊ÷ÇÉ¬“íó“Fó6&∆VC◊∑6fUvR””“–¢7Gñ∆S◊∑≤FFñÊs¢#gÇÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢s¬&˜&FW%&FóW3¢b¬&˜&FW#¢Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&6∂w&˜VÊC¢2Á7W&f6R¬6ˆ∆˜#¢6fUvR””“Ú2Ê◊WFVD∆ñváB¢"3SsCì"¬7W'6˜#¢6fUvR””“Ú&Ê˜B÷∆∆˜vVB"¢'ˆñÁFW""◊”Ó(í&Wc¬ˆ'WGFˆ„‡¢¥'&íÊg&ˆ“á≤∆VÊwFÉ¢F˜F≈vW2“¬ÖÚ¬íí”‚ííÊ÷Üí”‚Ä¢∆'WGFˆ‚∂Wì◊∂ó“ˆ‰6∆ñ6≥◊≤Çí”‚6WEvRÜíó–¢7Gñ∆S◊∑≤÷ñÂvñGFÉ¢3¬FFñÊs¢#gÇáÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢s¬&˜&FW%&FóW3¢b¬&˜&FW#¢Ç6ˆ∆ñBG∂í””“6fUvRÚ"3SsCì"¢2Ê&˜&FW'÷¬&6∂w&˜VÊC¢í””“6fUvRÚ"3SsCì"¢2Á7W&f6R¬6ˆ∆˜#¢í””“6fUvRÚ"6ffb"¢2ÁFWáE7V"¬7W'6˜#¢'ˆñÁFW""◊”Á∂í≤”¬ˆ'WGFˆ„‡¢íó–¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤Çí”‚6WEvRá”‚÷FÇÊ÷ñ‚áF˜F≈vW2“¬≤íó“Fó6&∆VC◊∑6fUvR„“F˜F≈vW2“–¢7Gñ∆S◊∑≤FFñÊs¢#gÇÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢s¬&˜&FW%&FóW3¢b¬&˜&FW#¢Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&6∂w&˜VÊC¢2Á7W&f6R¬6ˆ∆˜#¢6fUvR„“F˜F≈vW2“Ú2Ê◊WFVD∆ñváB¢"3SsCì"¬7W'6˜#¢6fUvR„“F˜F≈vW2“Ú&Ê˜B÷∆∆˜vVB"¢'ˆñÁFW""◊”‰ÊWáB(£¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢ó–¢«7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬FWáD∆ñv„¢'&ñváB"◊”‡¢∑7FFRÊ6VBÚ%6Ü˜vñÊrFÜRfó'7BS÷F6ÜW2‚"¢"'’6˜W&6W3¢◊î6&VW'4gWGW&R6ñÊv˜&R≤6&VW'2Êv˜bÁ6ráV&∆ñ2◊6W'fñ6R&ˆ∆W2íÁ≤"'–¢∆á&Vc◊∂áGG3¢Ú˜wwrÊ◊ñ6&VW'6gWGW&RÊv˜bÁ6r˜6V&6É˜6V&6É“G∂VÊ6ˆFUU$î6ˆ◊ˆÊVÁBá6V√ÚÁFóF∆R«¬""ó÷“F&vWC“%ˆ&∆Ê≤"&V√“&Êˆ˜VÊW"Ê˜&VfW'&W""7Gñ∆S◊∑≤6ˆ∆˜#¢"3SfF""¬FWáDFV6˜&Fñˆ„¢&ÊˆÊR"◊”‡¢6VR∆¬ˆ‚◊î6&VW'4gWGW&R(i ¢¬ˆ‡¢¬˜‡¢¬Û‡¢ó–¢¬ˆFóc‡¢∆FóbñC“&76r÷¶ˆ'2"7Gñ∆S◊∑≤67&ˆ∆ƒ÷&vñÂF˜¢ì◊”‡¢∆É27Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#„ì3sW&V“"¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢2ÁFWáB¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢R◊”„«7‚&ñ÷ÜñFFV„“'G'VR#‚b3#sìc3≥¬˜7„‚6&VW'2Êv˜bÁ6rá∑7FFRÊ76t¶ˆ'2Ê∆VÊwFá“ì¬ˆÉ3‡¢∑7FFRÊ76t¶ˆ'2Ê∆VÊwFÇ””“ÚÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"¬∆ñÊTÜVñváC¢„R◊”‰ÊÚV&∆ñ2◊6W'fñ6R˜7FñÊw2f˜"FÜó2FóF∆Rˆ‚6&VW'2Êv˜bÁ6r“óB∆ó7G26ñÊv˜&Rv˜fW&Ê÷VÁB&ˆ∆W2ˆÊ«í„¬˜‡¢í¢Ä¢√‡¢∑&VÊFW$¶ˆ$6&G2á7FFRÊ76t¶ˆ'2Á6∆ñ6RÉ¬#í¬&76r"¬f«6Ró–¢∑7FFRÊ76t¶ˆ'2Ê∆VÊwFÇ‚#bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”‚∑∑7FFRÊ76t¶ˆ'2Ê∆VÊwFÇ“÷FÇÊ÷ñ‚á7FFRÊ76t¶ˆ'2Ê∆VÊwFÇ¬#ó“÷˜&RV&∆ñ2◊6W'fñ6R˜7FñÊw2ˆ‚∆á&Vc“&áGG3¢Úˆ6&VW'2Êv˜bÁ6rÚ"F&vWC“%ˆ&∆Ê≤"&V√“&Êˆ˜VÊW"Ê˜&VfW'&W""7Gñ∆S◊∑≤6ˆ∆˜#¢"3SfF""¬FWáDFV6˜&Fñˆ„¢&ÊˆÊR"◊”Ê6&VW'2Êv˜bÁ6s¬ˆ‚„¬˜‡¢ó–¢¬Û‡¢ó–¢¬ˆFóc‡¢¬ˆFóc‡¢¬Û‡¢ó–¢¬ˆFóc‡¢ì∞ß–†¢ÚÚc3¢f6Ê7ïG&VÊEÊV¬&V÷˜fVBf˜"Ê˜r“FÜR‘Ù“ÚFFÊv˜bÁ6rf6Ê7í◊&FP¢ÚÚG&VÊBfVGW&Ró2Fó6&∆VBVÊFñÊr÷˜&R&V∆ñ&∆RFF6˜W&6R‚FÜP¢ÚÚˆíˆFFv˜bÊß2gVÊ7Fñˆ‚ÊBóG255˜fW&6V¬Êß6ˆ‚VÁG&ñW2&R∆VgBñ‚∆6P¢ÚÚ6ÚóB6‚&R&R÷VÊ&∆VB∆FW"vóFÜ˜WB6áW&‚‡†¢ÚÚ7fÇá6÷∆¬fñWw˜'BÜVñváBíÜÊF∆W2∂Wñ&ˆ&B&W6ó¶RÊFófV«íˆ‚îı2ÊBÊG&ˆñ@†¢ÚÚ)H)HˆFV'Vs÷∆ˆw2“&VB÷ˆÊ«ífñWrˆbFÜRóV∆ñÊUˆ∆ˆw2G&ñ¬)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H ¢ÚÚ7FW∆&V«2Ú7FGW6W2ÚFñ÷ñÊw2ÚG'VÊ6FVBFWFñ«2ˆÊ«í“ÊÚW6W"FF¬6¢ÚÚÊÚWFÇvFR‚&VÊFW&VBñÁ7FVBˆbƒÛ‚vÜV‚FÜRU$¬Ü2ˆFV'Vs÷∆ˆw2‡¶Wá˜'BgVÊ7Fñˆ‚óV∆ñÊT∆ˆw5fñWrÇí∞¢6ˆÁ7B∑7FFR¬6WE7FFU““W6U7FFRá≤7FGW3¢&∆ˆFñÊr"¬∆ˆw3¢µ““ì∞¢6ˆÁ7B∆ˆB“W6T6∆∆&6≤ÇÇí”‚∞¢6WE7FFRá2”‚á≤‚‚Á2¬7FGW3¢&∆ˆFñÊr"“íì∞¢fWF6ÇÇ"ˆíˆÊFˆ◊í"¬≤÷WFÜˆC¢%ı5B"¬ÜVFW'3¢≤$6ˆÁFVÁB’GóR#¢&∆ñ6Fñˆ‚ˆß6ˆ‚"“¬&ˆGì¢•4Ù‚Á7G&ñÊvñgíá≤7Fñˆ„¢'&V6VÁD∆ˆw2"¬∆ñ÷óC¢3“í“ê¢ÁFÜV‚á"”‚"Êß6ˆ‚Çíê¢ÁFÜV‚ÜB”‚6WE7FFRá≤7FGW3¢&FˆÊR"¬∆ˆw3¢'&íÊó4'&íÜBbbBÊ∆ˆw2íÚBÊ∆ˆw2¢µ““íê¢Ê6F6ÇÇÇí”‚6WE7FFRá≤7FGW3¢&W'&˜""¬∆ˆw3¢µ““íì∞¢“¬µ“ì∞¢W6TVffV7BÇÇí”‚≤∆ˆBÇì≤“¬∂∆ˆE“ì∞¢6ˆÁ7Bf◊B“G2”‚≤G'í≤&WGW&‚ÊWrFFRáG2íÁFÙ∆ˆ6∆U7G&ñÊrÇì≤“6F6ÇÖÚí≤&WGW&‚7G&ñÊráG2«¬""ì≤“”∞¢6ˆÁ7BFB“≤FFñÊs¢#GÇáÇ"¬&˜&FW$&˜GFˆ”¢#Ç6ˆ∆ñB6FFS6V2"¬fW'Fñ6ƒ∆ñv„¢'F˜"¬fˆÁDf÷ñ«ì¢&÷ˆÊ˜76R"¬vÜóFU76S¢'&R◊w&"¬v˜&D'&V≥¢&'&V≤◊v˜&B"”∞¢&WGW&‚Ä¢∆Fób7Gñ∆S◊∑≤÷ÖvñGFÉ¢¬÷&vñ„¢#WFÚ"¬FFñÊs¢#gÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2ÁFWáB◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&&6V∆ñÊR"¬v¢"¬÷&vñ‰&˜GFˆ”¢◊”‡¢∆É7Gñ∆S◊∑≤fˆÁE6ó¶S¢#&V“"¬÷&vñ„¢◊”ÂóV∆ñÊR7FW∆ˆs¬ˆÉ‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊∂∆ˆG“7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„sW&V“"¬FFñÊs¢#GÇÇ"¬7W'6˜#¢'ˆñÁFW""◊”Á&Vg&W6É¬ˆ'WGFˆ„‡¢«7‚7Gñ∆S◊∑≤6ˆ∆˜#¢2Ê◊WFVB◊”Á∑7FFRÁ7FGW2””“&∆ˆFñÊr"Ú&∆ˆFñÊ~(
b"¢G∑7FFRÊ∆ˆw2Ê∆VÊwFá“&˜w2ÜÊWvW7Bfó'7Bñ”¬˜7„‡¢¬ˆFóc‡¢∑7FFRÁ7FGW2””“&W'&˜""bb«7Gñ∆S◊∑≤6ˆ∆˜#¢"6Cìssb"◊”‰6˜V∆BÊ˜B∆ˆB“FÜR7F˜&R÷í&RVÊfñ∆&∆R„¬˜Á–¢∑7FFRÁ7FGW2””“&FˆÊR"bb7FFRÊ∆ˆw2Ê∆VÊwFÇbb«7Gñ∆S◊∑≤6ˆ∆˜#¢2Ê◊WFVB◊”‰ÊÚ∆ˆr&˜w2ñWB„¬˜Á–¢≤7FFRÊ∆ˆw2Ê∆VÊwFÇbbÄ¢«F&∆R7Gñ∆S◊∑≤&˜&FW$6ˆ∆∆6S¢&6ˆ∆∆6R"¬vñGFÉ¢#R"¬fˆÁE6ó¶S¢#„cÉsW&V“"◊”‡¢«FÜVC„«G"7Gñ∆S◊∑≤FWáD∆ñv„¢&∆VgB"¬6ˆ∆˜#¢2Ê◊WFVB◊”‡¢«FÇ7Gñ∆S◊∑≤FFñÊs¢#GÇáÇ"◊”ÁG3¬˜FÉ„«FÇ7Gñ∆S◊∑≤FFñÊs¢#GÇáÇ"◊”Á6W76ñˆ„¬˜FÉ„«FÇ7Gñ∆S◊∑≤FFñÊs¢#GÇáÇ"◊”Á&ˆ∆S¬˜FÉ„«FÇ7Gñ∆S◊∑≤FFñÊs¢#GÇáÇ"◊”Á6˜W&6S¬˜FÉ„«FÇ7Gñ∆S◊∑≤FFñÊs¢#GÇáÇ"◊”Á7FW¬˜FÉ„«FÇ7Gñ∆S◊∑≤FFñÊs¢#GÇáÇ"◊”Á7FGW3¬˜FÉ„«FÇ7Gñ∆S◊∑≤FFñÊs¢#GÇáÇ"◊”Ê◊3¬˜FÉ„«FÇ7Gñ∆S◊∑≤FFñÊs¢#GÇáÇ"◊”ÊFWFñ√¬˜FÉ‡¢¬˜G#„¬˜FÜVC‡¢«F&ˆGì‡¢∑7FFRÊ∆ˆw2Ê÷Çá"¬íí”‚Ä¢«G"∂Wì◊∂ó“7Gñ∆S◊∑≤&6∂w&˜VÊC¢á"Á7FGW2””“&W'&˜""«¬"Á7FGW2””“'Fñ÷V˜WB"íÚ"6fFV6V"¢íR"Ú"6cVcvf"¢"6ffb"◊”‡¢«FB7Gñ∆S◊∑FG”Á∂f◊Bá"ÁG2ó”¬˜FC„«FB7Gñ∆S◊∑FG”Á∑"Á6W76ñˆ‚«¬"'”¬˜FC„«FB7Gñ∆S◊∑FG”Á∑"Á&ˆ∆R«¬"'”¬˜FC„«FB7Gñ∆S◊∑FG”Á∑"Á6˜W&6R«¬"'”¬˜FC„«FB7Gñ∆S◊∑≤‚‚ÁFB¬fˆÁEvVñváC¢s◊”Á∑"Á7FW”¬˜FC„«FB7Gñ∆S◊∑FG”Á∑"Á7FGW7”¬˜FC„«FB7Gñ∆S◊∑≤‚‚ÁFB¬FWáD∆ñv„¢'&ñváB"◊”Á∑"Ê◊2“ÁV∆¬Ú"Ê◊2¢"'”¬˜FC„«FB7Gñ∆S◊∑FG”Á∑"ÊFWFñ¬«¬"'”¬˜FC‡¢¬˜G#‡¢íó–¢¬˜F&ˆGì‡¢¬˜F&∆S‡¢ó–¢¬ˆFóc‡¢ì∞ß–†¢ÚÚ““““fVGW&S¢FWáB◊6ó¶R6ˆÁG&ˆ¬Ñ“ÚÚ≤Ú≤≤í““““““““““““““““““““““““–¢ÚÚ6Ü&VB6ˆÁG&ˆ¬6ˆ◊ˆÊVÁC≤&VÊFW&VBˆÊ6RW"∆ñ˜WBFÇÜÊb&ñ¬ˆ‚vñFR¿¢ÚÚÊV"ñ∆∆$&"ˆ‚ÜˆÊRí‚&V6VófW2VïFWáE66∆R≤«ïFWáE66∆Rg&ˆ“7FFR‡¢ÚÚ'WGFˆÁ3¢“É„ì"í¬É¬&W6WBí¬≤É„"í¬≤≤É„#Rí‚V6Ç„“CGÇFF&vWB‡¢ÚÚ&ñ◊&W76VBˆ‚FÜR7FófR∆WfV¬‚ÁB÷ÜVFñÊró2‰ıB66∆VBÜÜVFñÊw27FífóÜVBí‡¢ÚÚ6˜fW&vS¢&ñFW2ÁB÷&ˆGíÚÁB÷∆&V¬ÚÁB÷÷WFÚÁB◊7V"ÚÁ&W7V«B◊FWáB◊6“¢ÚÚÁ&W7V«B◊FWáB◊á2ÚÁ&W7V«B÷∆&V¬á„c”sRˆbFWFñ¬FWáBì≤&rñÊ∆ñÊR◊ÇFWá@¢ÚÚvñ∆¬Ê˜B66∆R“66WF&∆R¬Fˆ7V÷VÁFVBÜW&R‡¢ÚÚFó67&WFRFWáB◊6ó¶R7FW26Ü&VBvóFÇFÜR6ˆ◊ˆÊVÁBw2Tïı44ƒUı5DU27FFP¢ÚÚ÷6ÜñÊW'í‚∂WB÷ˆGV∆R÷∆WfV¬6ÚFWáE6ó¶T6ˆÁG&ˆ¬6‚7FWWˆF˜v‚Fá&˜VvÇFÜP¢ÚÚ4‘RÊ˜F6ÜW2vóFÜ˜WB&R÷FV6∆&ñÊrFÜR'&í‚ÑFVfV«B76VBfñ7FW6&˜‚ê¶6ˆÁ7BTïı44ƒUÙƒ$T≈2“≥„ì"¬¬„"¬„#U”∞¢ÚÚÜVFW"÷÷˜VÁFVB¬F&≤◊7W&f6RFWáB◊6ó¶R6ˆÁG&ˆ¬‚Fá&VR'WGFˆÁ3¢FV7&V6RˆÊP¢ÚÚÊ˜F6ÇÚ&W6WBFÚÚñÊ7&V6RˆÊRÊ˜F6Ç‚7Gñ∆VBFÚ÷F6ÇFÜRÜVFW"w2c"∆ñÊ∞¢ÚÚÊBÊWr6V&6Ç'WGFˆ‚áG&Á6«V6VÁBvÜóFRˆ‚2ÊWRí‚VÊB7FFW2&RVÊ6ˆFVB'ê¢ÚÚ˜6óGí≤&˜&FW"ÜÊ˜B6ˆ∆˜W"∆ˆÊRíFÚ6Fó6gíFÜRí6ˆÁG&7B‡¢ÚÚ&V¬W6W"∆ˆvñ‚ÑáV÷‚∆VB¬Ç”rs#b&gVÊF÷VÁF¬W'6ó7FVÊ6R"&WVW7Bì¢6ˆ◊7@¢ÚÚÜVFW"6ˆÁG&ˆ¬“6ñvÊVB˜WB6Ü˜w2FÜRFV∆Vw&“vñFvWBá6÷∆¬6ó¶R¬ÊÚ∆&V¬FWáBF¢ÚÚ6fRÜVFW"76Rì≤6ñvÊVBñ‚6Ü˜w2Ê÷R≤6ñv‚÷˜WB‚&WW6W2ˆíˆ∆ˆvñ‚¬ˆíˆ∆ˆv˜WB¿¢ÚÚˆí˜vÜˆ÷íÊBFÜR6÷R&˜B«&VGí6ˆÊfñwW&VBf˜"FÜRF÷ñ‚ÊV¬“ÊÚÊWr6V7&WG2‡¢ÚÚÊ˜BvFñÊrÁóFÜñÊs¢6ñvÊVB÷˜WBfó6óF˜'2∂VWv˜&∂ñÊrWÜ7F«í2&Vf˜&RÜFWfñ6R÷∂Wê¢ÚÚW'6ó7FVÊ6Rì≤FÜó2ˆÊ«íFG2FÜRıDîÙ‚ˆb7&˜72÷FWfñ6RW'6ó7FVÊ6Rfñ&V¬∆ˆvñ‚‡¶gVÊ7Fñˆ‚66˜VÁD6ˆÁG&ˆ¬Çí∞¢6ˆÁ7B∑7FFR¬6WE7FFU““W6U7FFRá≤∂ñÊC¢&∆ˆFñÊr"“ì≤ÚÚ∆ˆFñÊr¬6ñvÊVB÷˜WB¬6ñvÊVB÷ñ‡¢6ˆÁ7B&˜EW6W&Ê÷R“áGóVˆbñ◊˜'BÊ÷WF”“'VÊFVfñÊVB"bbñ◊˜'BÊ÷WFÊVÁcÚÂdïDUıDTƒTu$’Ù$ıEıU4U$‰‘Rí«¬"#∞¢W6TVffV7BÇÇí”‚∞¢∆WB6Ê6V∆∆VB“f«6S∞¢fWF6ÇÇ"ˆí˜vÜˆ÷í"¬≤7&VFVÁFñ«3¢&ñÊ6«VFR"“ê¢ÁFÜV‚Çá"í”‚"Êß6ˆ‚Çíê¢ÁFÜV‚ÇÜBí”‚≤ñbÇ6Ê6V∆∆VBí6WE7FFRÜBbbBÊˆ≤Ú≤∂ñÊC¢'6ñvÊVB÷ñ‚"¬Ê÷S¢BÁW6W$ñB“¢≤∂ñÊC¢'6ñvÊVB÷˜WB"“ì≤“ê¢Ê6F6ÇÇÇí”‚≤ñbÇ6Ê6V∆∆VBí6WE7FFRá≤∂ñÊC¢'6ñvÊVB÷˜WB"“ì≤“ì∞¢&WGW&‚Çí”‚≤6Ê6V∆∆VB“G'VS≤”∞¢“¬µ“ì∞¢6ˆÁ7BÜÊF∆TWFÇ“áW6W"í”‚∞¢fWF6ÇÇ"ˆíˆ∆ˆvñ‚"¬≤÷WFÜˆC¢%ı5B"¬ÜVFW'3¢≤$6ˆÁFVÁB’GóR#¢&∆ñ6Fñˆ‚ˆß6ˆ‚"“¬7&VFVÁFñ«3¢&ñÊ6«VFR"¬&ˆGì¢•4Ù‚Á7G&ñÊvñgíáW6W"í“ê¢ÁFÜV‚Çá"í”‚"Êß6ˆ‚Çíê¢ÁFÜV‚ÇÜBí”‚≤ñbÜBbbBÊˆ≤í6WE7FFRá≤∂ñÊC¢'6ñvÊVB÷ñ‚"¬Ê÷S¢BÁW6W"Êfó'7EˆÊ÷R«¬BÁW6W"ÁW6W&Ê÷R«¬7G&ñÊrÜBÁW6W"ÊñBí“ì≤“ê¢Ê6F6ÇÇÇí”‚∑“ì∞¢”∞¢6ˆÁ7BÜÊF∆T∆ˆv˜WB“Çí”‚∞¢fWF6ÇÇ"ˆíˆ∆ˆv˜WB"¬≤÷WFÜˆC¢%ı5B"¬7&VFVÁFñ«3¢&ñÊ6«VFR"“íÊfñÊ∆«íÇÇí”‚6WE7FFRá≤∂ñÊC¢'6ñvÊVB÷˜WB"“íì∞¢”∞¢ñbá7FFRÊ∂ñÊB””“&∆ˆFñÊr"í&WGW&‚ÁV∆√∞¢ñbá7FFRÊ∂ñÊB””“'6ñvÊVB÷ñ‚"í∞¢&WGW&‚Ä¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢b¬f∆WÖ6á&ñÊ≥¢◊”‡¢«7‚7Gñ∆S◊∑≤6ˆ∆˜#¢"6ffb"¬fˆÁE6ó¶S¢#„sW&V“"¬˜6óGì¢„í¬vÜóFU76S¢&Ê˜w&"◊“FóF∆S“%6ñvÊVBñ‚“ñ˜W"&WfñWrFV6ó6ñˆÁ2ÊB∆ñ˜WBfˆ∆∆˜rñ˜R7&˜72FWfñ6W2#Á∑7FFRÊÊ÷W”¬˜7„‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊∂ÜÊF∆T∆ˆv˜WG“&ñ÷∆&V√“%6ñv‚˜WB ¢7Gñ∆S◊∑≤&6∂w&˜VÊC¢'&v&É#SR√#SR√#SR√„Rí"¬&˜&FW#¢#Ç6ˆ∆ñB&v&É#SR√#SR√#SR√„3Rí"¬&˜&FW%&FóW3¢b¬6ˆ∆˜#¢"6ffb"¬FFñÊs¢#gÇÇ"¬7W'6˜#¢'ˆñÁFW""¬fˆÁE6ó¶S¢#„sW&V“"¬÷ñ‰ÜVñváC¢CB¬vÜóFU76S¢&Ê˜w&"◊”‡¢6ñv‚˜W@¢¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢ì∞¢–¢ñbÇ&˜EW6W&Ê÷Rí&WGW&‚ÁV∆√≤ÚÚÊ˜B6ˆÊfñwW&VB“FVw&FR6ñ∆VÁF«í¬FWfñ6R÷∂WíW'6ó7FVÊ6R7Fñ∆¬v˜&∑0¢&WGW&‚≈FV∆Vw&‘∆ˆvñÂvñFvWB&˜EW6W&Ê÷S◊∂&˜EW6W&Ê÷W“ˆ‰WFÉ◊∂ÜÊF∆TWFá“6ó¶S“'6÷∆¬"&FóW3◊≥g“Û„∞ß–¶gVÊ7Fñˆ‚FWáE6ó¶T6ˆÁG&ˆ¬á≤VïFWáE66∆R¬«ïFWáE66∆R¬7FW2“í∞¢6ˆÁ7B'"“Ñ'&íÊó4'&íá7FW2íbb7FW2Ê∆VÊwFÇíÚ7FW2¢Tïı44ƒUÙƒ$T≈3∞¢ÚÚ6Ê7W'&VÁB66∆RFÚFÜRÊV&W7B∂Ê˜v‚7FWñÊFWÇáFˆ∆W&ÁBˆbf∆ˆBG&ñgBí‡¢∆WBñGÇ“¬&W7B“ñÊfñÊóGì∞¢'"Êf˜$V6ÇÇá2¬íí”‚≤6ˆÁ7BB“÷FÇÊ'2áVïFWáE66∆R“2ì≤ñbÜB¬&W7Bí≤&W7B“C≤ñGÇ“ì≤““ì∞¢6ˆÁ7BD÷ñ‚“ñGÇ√“∞¢6ˆÁ7BD÷Ç“ñGÇ„“'"Ê∆VÊwFÇ“∞¢6ˆÁ7Bó5&W6WB“÷FÇÊ'2áVïFWáE66∆R“í¬„∞¢6ˆÁ7BFV7&V6R“Çí”‚≤ñbÇD÷ñ‚í«ïFWáE66∆RÜ'%∂ñGÇ““ì≤”∞¢6ˆÁ7BñÊ7&V6R“Çí”‚≤ñbÇD÷Çí«ïFWáE66∆RÜ'%∂ñGÇ≤“ì≤”∞¢6ˆÁ7B'F‰&6R“∞¢÷ñÂvñGFÉ¢CB¬÷ñ‰ÜVñváC¢CB¿¢Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢&6VÁFW""¿¢fˆÁEvVñváC¢s¬∆ñÊTÜVñváC¢¿¢6ˆ∆˜#¢"6ffb"¿¢&6∂w&˜VÊC¢'G&Á7&VÁB"¿¢&˜&FW#¢&ÊˆÊR"¿¢&˜&FW%&FóW3¢Ç¿¢7W'6˜#¢'ˆñÁFW""¿¢˜WF∆ñÊS¢&ÊˆÊR"¿¢G&Á6óFñˆ„¢&∆¬„W2"¿¢”∞¢6ˆÁ7Bfˆ7W4ˆ‚“R”‚≤RÊ7W'&VÁEF&vWBÁ7Gñ∆RÊ&˜Ö6ÜF˜r“#7Ç&v&É#SR√#SR√#SR√„ìRí#≤”∞¢6ˆÁ7Bfˆ7W4ˆfb“R”‚≤RÊ7W'&VÁEF&vWBÁ7Gñ∆RÊ&˜Ö6ÜF˜r“&ÊˆÊR#≤”∞¢&WGW&‚Ä¢∆Fó`¢&ˆ∆S“&w&˜W ¢&ñ÷∆&V√◊∂FWáB6ó¶R¬7W'&VÁF«íG¥÷FÇÁ&˜VÊBáVïFWáE66∆R¢ó“W&6VÁF–¢7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢B¬f∆WÖ6á&ñÊ≥¢◊–¢‡¢∆'WGFˆ‡¢GóS“&'WGFˆ‚ ¢&ñ÷∆&V√“$FV7&V6RFWáB6ó¶R ¢&ñ÷Fó6&∆VC◊∂D÷ñÁ–¢ˆ‰6∆ñ6≥◊∂FV7&V6W–¢ˆ‰fˆ7W3◊∂fˆ7W4ˆÁ–¢ˆ‰&«W#◊∂fˆ7W4ˆfg–¢7Gñ∆S◊∑∞¢‚‚Ê'F‰&6R¿¢fˆÁE6ó¶S¢#„sW&V“"¿¢˜6óGì¢D÷ñ‚Ú„B¢¿¢7W'6˜#¢D÷ñ‚Ú&FVfV«B"¢'ˆñÁFW""¿¢◊–¢‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„cÉsW&V“"◊”‰¬˜7„‚–¢¬ˆ'WGFˆ„‡¢∆'WGFˆ‡¢GóS“&'WGFˆ‚ ¢&ñ÷∆&V√“%&W6WBFWáB6ó¶R ¢&ñ◊&W76VC◊∂ó5&W6WG–¢ˆ‰6∆ñ6≥◊≤Çí”‚«ïFWáE66∆RÉó–¢ˆ‰fˆ7W3◊∂fˆ7W4ˆÁ–¢ˆ‰&«W#◊∂fˆ7W4ˆfg–¢7Gñ∆S◊∑∞¢‚‚Ê'F‰&6R¿¢fˆÁE6ó¶S¢#„ÉsW&V“"¿¢&6∂w&˜VÊC¢ó5&W6WBÚ'&v&É#SR√#SR√#SR√„#Çí"¢'G&Á7&VÁB"¿¢◊–¢‡¢¢¬ˆ'WGFˆ„‡¢∆'WGFˆ‡¢GóS“&'WGFˆ‚ ¢&ñ÷∆&V√“$ñÊ7&V6RFWáB6ó¶R ¢&ñ÷Fó6&∆VC◊∂D÷á–¢ˆ‰6∆ñ6≥◊∂ñÊ7&V6W–¢ˆ‰fˆ7W3◊∂fˆ7W4ˆÁ–¢ˆ‰&«W#◊∂fˆ7W4ˆfg–¢7Gñ∆S◊∑∞¢‚‚Ê'F‰&6R¿¢fˆÁE6ó¶S¢#„sW&V“"¿¢˜6óGì¢D÷ÇÚ„B¢¿¢7W'6˜#¢D÷ÇÚ&FVfV«B"¢'ˆñÁFW""¿¢◊–¢‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#&V“"◊”‰¬˜7„‚∞¢¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢ì∞ß–†¢ÚÚ““““fVGW&S¢%vÜBFÜó2÷VÁ2f˜"ñ˜R"∆ñ‚÷∆ÊwVvR7V÷÷'í6&B“““““““““–¢ÚÚFWFW&÷ñÊó7Fñ2FV◊∆FR76V÷&∆VBÙ‰≈íg&ˆ“f«VW2«&VGí6ˆ◊WFVBÊB6Ü˜v‡¢ÚÚV«6WvÜW&Rñ‚&W7V«FÊBw&ÑFFáFÜR&ˆ∆Rw&Çw2ó66Ù6ÊFñFFW2¢ÚÚÊ«ó6VBÚGWFñW2í‚ÊÚÊWrƒƒ“&ˆ◊C≤ÊÚÊWrÁV÷&W"WFÜ˜&VB‚vóFÜÜˆ∆G2Áê¢ÚÚ6∆W6RvÜ˜6R6˜W&6RFFó2'6VÁBávóFÜÜˆ∆B÷˜fW"÷ñÁfVÁB6ˆÁG&7Bí‡¢ÚÚ&W7V«BfñV∆G2&VBÜ∆¬«&VGí6Ü˜v‚V«6WvÜW&Rˆ‚FÜRvRì†¢ÚÚ&W7V«BÁ6∂ñ∆«2“2Ê∆WfV¬””“$ÖT‘‚"”‚áV÷‚÷VFvR6˜VÁB≤WÜ◊∆W0¢ÚÚ&W7V«BÊ¶ˆ$ÊFˆ◊íÊGWFñW2“BÊWá˜7W&TÊ˜rf˜"Fˆ÷ñÊÁB&ÊB6˜VÁ@¢ÚÚ&W7V«BÊ¶ˆ$ÊFˆ◊íÁG&¶V7F˜'ì'íÊ∆ñÊR“«&VGí÷WFÜ˜&VB'í∆ñÊRÜ6'&ñVBfW&&Fñ“ê¢ÚÚw&ÑFFÊó66Ù6ÊFñFFW2“F˜”"F¶6VÁB&ˆ∆W2Ö&˜c¢6ˆ◊WFVBê¢ÚÚw&ÑFFÊÊ«ó6VBÁV∆ñfñ6FñˆÁ5≥““F˜VÁG'íV∆ñfñ6Fñˆ‚Ö&˜c¢íW7Fñ÷FRê¶gVÊ7Fñˆ‚vÜEFÜó4÷VÁ46&Bá≤&W7V«B¬w&ÑFF“í∞¢ÚÚ“““‚íWá˜7W&R7FÊ6Rg&ˆ“GWFñW2ÜFˆ÷ñÊÁB&ÊB6˜VÁB¬FWFW&÷ñÊó7Fñ2í““–¢6ˆÁ7BGWFñW2“á&W7V«Bbb&W7V«BÊ¶ˆ$ÊFˆ◊íbb&W7V«BÊ¶ˆ$ÊFˆ◊íÊf∆∆&6≤bb'&íÊó4'&íá&W7V«BÊ¶ˆ$ÊFˆ◊íÊGWFñW2íê¢Ú&W7V«BÊ¶ˆ$ÊFˆ◊íÊGWFñW2¢µ”∞¢6ˆÁ7BGWGî6˜VÁG2“≤ÑîtÉ¢¬‘TDïT”¢¬ƒıs¢¬ÖT‘„¢”∞¢GWFñW2Êf˜$V6ÇÜgVÊ7Fñˆ‚ÜBí≤ñbÜGWGî6˜VÁG5∂BÊWá˜7W&TÊ˜u“”“VÊFVfñÊVBíGWGî6˜VÁG5∂BÊWá˜7W&TÊ˜u“≤≥≤“ì∞¢6ˆÁ7BF˜FƒGWFñW2“GWFñW2Ê∆VÊwFÉ∞†¢ÚÚFWFW&÷ñÊRFˆ÷ñÊÁB&ÊBá«W&∆óGíf˜FR7&˜726∆76ñfñVBGWFñW2í‡¢ÚÚFñW2'&ˆ∂V‚'í6WfW&óGí˜&FW#¢ÑîtÇ‚‘TDïT“‚ƒır‚ÖT‘‚‡¢6ˆÁ7B&ÊD˜&FW"“≤$ÑîtÇ"¬$‘TDïT“"¬$ƒır"¬$ÖT‘‚%”∞¢∆WBFˆ÷ñÊÁD&ÊB“ÁV∆√∞¢ñbáF˜FƒGWFñW2‚í∞¢Fˆ÷ñÊÁD&ÊB“&ÊD˜&FW"Á&VGV6RÜgVÊ7Fñˆ‚Ü&W7B¬"í∞¢&WGW&‚ÜGWGî6˜VÁG5∂%“‚GWGî6˜VÁG5∂&W7E“íÚ"¢&W7C∞¢“¬$ÑîtÇ"ì∞¢–†¢ÚÚ∆ñ‚÷∆ÊwVvR7FÊ6Rá&6ñÊrÖ#s¢áóÜVÁ2¬ÊÚV“ˆV‚F6ÜW2ê¢6ˆÁ7B7FÊ6Uá&6W2“∞¢ÑîtÉ¢$í6‚WFˆ÷FR÷˜7BˆbFÜR&˜WFñÊRv˜&≤ÜW&R“ñ˜W"f«VRó2ñ‚˜fW'6ñváBÊBßVFv÷VÁBˆ‚FÜR˜WF6ˆ÷W2‚"¿¢‘TDïT”¢$í÷˜7F«íVv÷VÁG2FÜó2&ˆ∆RFˆFí“óBÜÊF∆W2ÜVgí∆ñgFñÊrvÜñ∆Rñ˜RFó&V7BÊB6ñv‚ˆfbV6Ç7FW‚"¿¢ƒıs¢$í÷ñÊ«í76ó7G2ÜW&S≤ñ˜W"ßVFv÷VÁB∆VG2ˆ‚WfW'íFV6ó6ñˆ‚‚"¿¢ÖT‘„¢$í76ó7G2ˆÊ«íBFÜRVFvW2“FÜó2&ˆ∆Ró2fó&÷«íáV÷‚÷∆VB‚"¿¢”∞¢6ˆÁ7B7FÊ6T6∆W6R“Fˆ÷ñÊÁD&ÊBÚ7FÊ6Uá&6W5∂Fˆ÷ñÊÁD&ÊE“¢ÁV∆√∞¢ÚÚ&˜bf˜"FÜR7FÊ6S¢FW&ófVBg&ˆ“«&VGí÷6∆76ñfñVBGWFñW2á6÷R&˜b2¶ˆ$ÊFˆ◊íê¢6ˆÁ7B7FÊ6U&˜b“Fˆ÷ñÊÁD&ÊBÚ&í"¢ÁV∆√≤ÚÚGWFñW2&R6∆76ñfñVB'íƒƒ“”‚$íW7Fñ÷FR †¢ÚÚ“““"‚áV÷‚VFvS¢6˜VÁB≤”"WÜ◊∆W2g&ˆ“ÖT‘‚÷∆VB6∂ñ∆«2““–¢6ˆÁ7B6∂ñ∆«2“á&W7V«Bbb'&íÊó4'&íá&W7V«BÁ6∂ñ∆«2ííÚ&W7V«BÁ6∂ñ∆«2¢µ”∞¢6ˆÁ7BáV÷Â6∂ñ∆«2“6∂ñ∆«2Êfñ«FW"ÜgVÊ7Fñˆ‚á2í≤&WGW&‚2Ê∆WfV¬””“$ÖT‘‚#≤“ì∞¢6ˆÁ7BáV÷‰6˜VÁB“áV÷Â6∂ñ∆«2Ê∆VÊwFÉ∞¢6ˆÁ7BáV÷‰WÜ◊∆W2“áV÷Â6∂ñ∆«2Á6∆ñ6RÉ¬"íÊ÷ÜgVÊ7Fñˆ‚á2í≤&WGW&‚2Á6∂ñ∆√≤“ì∞†¢ÚÚ“““2‚VÁG'ívFS¢F˜V∆ñfñ6Fñˆ‚g&ˆ“w&ÑFFÊÊ«ó6VB““–¢6ˆÁ7BÊ«ó6VB“Üw&ÑFFbbw&ÑFFÊÊ«ó6VBíÚw&ÑFFÊÊ«ó6VB¢ÁV∆√∞¢6ˆÁ7BF˜V¬“ÜÊ«ó6VBbb'&íÊó4'&íÜÊ«ó6VBÁV∆ñfñ6FñˆÁ2íbbÊ«ó6VBÁV∆ñfñ6FñˆÁ2Ê∆VÊwFÇ‚ê¢ÚÊ«ó6VBÁV∆ñfñ6FñˆÁ5≥“¢ÁV∆√∞†¢ÚÚ“““B‚F¶6VÁB&ˆ∆W3¢F˜”"ó66Ù6ÊFñFFW2Ö&˜c¢6ˆ◊WFVBí““–¢6ˆÁ7B6ÊD∆ó7B“Üw&ÑFFbb'&íÊó4'&íÜw&ÑFFÊó66Ù6ÊFñFFW2ííÚw&ÑFFÊó66Ù6ÊFñFFW2¢µ”∞¢6ˆÁ7BF˜6ÊG2“6ÊD∆ó7BÁ6∆ñ6RÉ¬"ì∞†¢ÚÚñbvRÜfRÊ˜FÜñÊrW6VgV¬FÚ6í¬vóFÜÜˆ∆BFÜR6&BVÁFó&V«í‡¢6ˆÁ7BÜ46ˆÁFVÁB“7FÊ6T6∆W6R«¬áV÷‰6˜VÁB‚«¬F˜V¬«¬F˜6ÊG2Ê∆VÊwFÇ‚∞¢ñbÇÜ46ˆÁFVÁBí&WGW&‚ÁV∆√∞†¢6ˆÁ7B&˜Ö7Gñ∆R“∞¢&6∂w&˜VÊC¢2Á7W&f6R¿¢&˜&FW#¢Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¿¢&˜&FW%&FóW3¢¿¢FFñÊs¢#GÇáÇ"¿¢÷&vñ‰&˜GFˆ”¢b¿¢&˜Ö6ÜF˜s¢‰TÚÁ&ó6U6“¿¢”∞¢6ˆÁ7B6VÁFVÊ6U7Gñ∆R“≤÷&vñ„¢#wÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáB¬∆ñÊTÜVñváC¢„cR”∞¢6ˆÁ7Bfˆ˜FW%7Gñ∆R“≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬∆ñÊTÜVñváC¢„SR¬fˆÁE7Gñ∆S¢&óF∆ñ2"¬&˜&FW%F˜¢Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬FFñÊuF˜¢Ç”∞†¢&WGW&‚Ä¢∆Fób7Gñ∆S◊∂&˜Ö7Gñ∆W“&ñ÷∆&V√“%vÜBFÜó2÷VÁ2f˜"ñ˜R“∆ñ‚÷∆ÊwVvR7V÷÷'í#‡¢≤Ú¢ÜVFW"¢˜–¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬f∆WÖw&¢'w&"¬÷&vñ‰&˜GFˆ”¢◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢2ÁFWáB¬∆WGFW%76ñÊs¢"”„V“"◊”‡¢vÜBFÜó2÷VÁ2f˜"ñ˜P¢¬˜‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”Ê76V÷&∆VBg&ˆ“FÜR&VG2ˆ‚FÜó2vS¬˜7„‡¢¬ˆFóc‡†¢≤Ú¢6∆W6R¢íWá˜7W&R7FÊ6R¢˜–¢∑7FÊ6T6∆W6RbbÄ¢«7Gñ∆S◊∑6VÁFVÊ6U7Gñ∆W”‡¢∑7FÊ6T6∆W6W–¢≤"'–¢≈&˜b∂ñÊC◊∑7FÊ6U&˜g“6÷∆¬Û‡¢∑F˜FƒGWFñW2‚bbÄ¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‡¢≤"'“á∂GWGî6˜VÁG5∂Fˆ÷ñÊÁD&ÊE◊“ˆb∑F˜FƒGWFñW7“GWFñW26∆76ñfñVB2∂Fˆ÷ñÊÁD&ÊB””“$ÖT‘‚"Ú&áV÷‚÷∆VB"¢Fˆ÷ñÊÁD&ÊB””“$ƒır"Ú$í÷76ó7FVB"¢Fˆ÷ñÊÁD&ÊB””“$‘TDïT“"Ú$í÷Vv÷VÁFVB"¢&gV∆¬÷WFˆ÷Fñˆ‚'“ê¢¬˜7„‡¢ó–¢¬˜‡¢ó–†¢≤Ú¢6∆W6R#¢áV÷‚VFvR¢˜–¢∂áV÷‰6˜VÁB‚bbÄ¢«7Gñ∆S◊∑6VÁFVÊ6U7Gñ∆W”‡¢ñ˜W"VFvRó2FÜR«7G&ˆÊsÁ∂áV÷‰6˜VÁG“áV÷‚÷∆VB6∂ñ∆«∂áV÷‰6˜VÁB”“Ú'2"¢"'”¬˜7G&ˆÊs‚í6ÊÊ˜BÜˆ∆@¢∂áV÷‰WÜ◊∆W2Ê∆VÊwFÇ‚bb«7„„¢∂áV÷‰WÜ◊∆W2Ê÷ÜgVÊ7Fñˆ‚ÜWÇ¬íí≤&WGW&‚«7‚∂Wì◊∂ó”Á∂í‚Ú"¬"¢"'”∆V”Á∂Wá”¬ˆV”„¬˜7„„≤“ó”¬˜7„Á–¢∂áV÷‰6˜VÁB‚"bb"ÊB˜FÜW'2'“‡¢≤"'”≈&˜b∂ñÊC“&í"6÷∆¬Û‡¢¬˜‡¢ó–†¢≤Ú¢6∆W6R3¢VÁG'ívFRáF˜V∆ñfñ6Fñˆ‚í¢˜–¢∑F˜V¬bbÄ¢«7Gñ∆S◊∑6VÁFVÊ6U7Gñ∆W”‡¢VÁG'ívFS¢«7G&ˆÊsÁ∑F˜V«”¬˜7G&ˆÊs‚ó2FÜRF˜ñÊfW'&VBV∆ñfñ6Fñˆ‚f˜"FÜó2&ˆ∆R‡¢≤"'”≈&˜b∂ñÊC“&í"6÷∆¬Û‡¢¬˜‡¢ó–†¢≤Ú¢6∆W6RC¢F¶6VÁB&ˆ∆W2áóf˜B˜FñˆÁ2í¢˜–¢∑F˜6ÊG2Ê∆VÊwFÇ‚bbÄ¢«7Gñ∆S◊∑6VÁFVÊ6U7Gñ∆W”‡¢vÜW&RóB6‚vÛ¢FÜR6∆˜6W7BF¶6VÁB&ˆ∆W2'í6∂ñ∆¬÷˜fW&∆&W≤"'–¢∑F˜6ÊG2Ê÷ÜgVÊ7Fñˆ‚Ü2¬íí∞¢&WGW&‚Ä¢«7‚∂Wì◊∂ó”‡¢∂í‚Ú"ÊB"¢"'–¢«7G&ˆÊsÁ∂2Ê∆&V«”¬˜7G&ˆÊs‡¢∂2Á66˜&R“ÁV∆¬bb«7‚7Gñ∆S◊∑≤6ˆ∆˜#¢2Ê◊WFVB◊”Á≤"'“á∂2Á66˜&W“Ûì¬˜7„Á–¢¬˜7„‡¢ì∞¢“ó“‡¢≤"'”≈&˜b∂ñÊC“&6ˆ◊WFVB"6÷∆¬Û‡¢¬˜‡¢ó–†¢≤Ú¢fˆ˜FW"ÜˆÊW7Gí∆ñÊR“6V7Fñˆ‚rÜˆÊW7Gíˆí6ˆÁG&7B¢˜–¢«7Gñ∆S◊∂fˆ˜FW%7Gñ∆W“&ˆ∆S“&Ê˜FR#‡¢í÷76ó7FVC≤áV÷‚FV6ñFW2‚76V÷&∆VBg&ˆ“FÜR&VG2ˆ‚FÜó2vR“ÊÚÊWrÁV÷&W"‡¢W"÷6∆W6R&˜fVÊÊ6R6Ü˜v‚ñÊ∆ñÊR&˜fR‡¢¬˜‡¢¬ˆFóc‡¢ì∞ß–†¢ÚÚ““““4Û#¢6ˆ◊Áí$í÷ˆ÷VÁG2"“&V7W'&ñÊrGWGí÷6«W7FW"vVÁB÷6ÊFñFFRVÊvñÊR“““–¢ÚÚ'Vñ∆D6ˆ◊ÁîvVÁG2Ü÷F6Ñw&˜Wí”‚FWFW&÷ñÊó7Fñ2÷ˆFV¬W"4Û"„í‡¢ÚÚ‰Ú6∆VFT6∆¬¬‰Úƒƒ“¬‰ÚñÁfVÁFVBÁV÷&W"‡¢ÚÚ&WW6W3¢˜á&6T÷F6Ç¬˜á&6UFˆ∑2¬˜á&6TÊ˜&“¬ıÖ$4Uı5Dı¬ƒUdT≈2‡¢ÚÚ#R÷w&W&∆R6ˆÁ7G3¢4Ù’ÂïÙtTÂEÙ‘îÂıı5Dî‰u2¬4Ù’ÂïÙtTÂEÙ‘îÂÙEUDîU2¿¢ÚÚ4Ù’ÂïÙtTÂEÙ‘îÂı$T5U%$T‰4R¬4Ù’ÂïÙEUEïÙDUDî≈Ùƒî‘ïBÜñ‚íˆ÷6bÊß2í‡†¶6ˆÁ7B4Ù’ÂïÙtTÂEÙ‘îÂıı5Dî‰u2“C∞¶6ˆÁ7B4Ù’ÂïÙtTÂEÙ‘îÂÙEUDîU2“c∞¶6ˆÁ7B4Ù’ÂïÙtTÂEÙ‘îÂı$T5U%$T‰4R“#∞¶6ˆÁ7B4Ù’ÂïÙtTÂEÙ‘ÖÙtTÂE2“É≤ÚÚ4Û"„¢6FÜR6ÊFñFFR6Ü˜'F∆ó7Bá&Ê≤◊G'VÊ6FRê¢ÚÚ"s¢R”‚#B‚FÜR6v2GVÊVBvÜV‚FÜR∆ˆ˜6W"÷F6Ç&ˆGV6VB„s6«W7FW'2f˜"¢ÚÚ÷ñB◊6ó¶RV◊∆˜ñW#≤FÜRFñváFW"ˆÊR&ˆGV6W2„C"¬6ÚFÜR6÷RÁV÷&W"6Ü˜vVBÜ∆bFÜP¢ÚÚ&˜˜'Fñˆ‚ÊBf˜W"ˆbVñváFVV‚˜7FñÊw2VÊFVBWvóFÇÊ˜FÜñÊr÷&∂VBB∆¬‚÷V7W&V@¢ÚÚ7&˜72GvÚV◊∆˜ñW'3¢#B&V6˜fW'2÷˜7BˆbFÜB6˜fW&vRÑD%2BÛÇ”‚RÛÇ¬÷WGFbÛê¢ÚÚ”‚ÇÛííf˜"6óÇ÷˜&RÊˆFW2‚&WñˆÊB#BFÜR&WGW&Á2f∆GFV‚ÊBFÜRFñW"ßW7B7&˜vG2‡¶6ˆÁ7B4Ù’ÂïÙtTÂEÙ‘ÖÙEUDîU2“#C≤ÚÚ4Û"„¢6FÜR&V7W'&ñÊr÷GWFñW2FñW"áF˜'í&V7W'&VÊ6Rê¢ÚÚ"s¢Ü˜r◊V6ÇˆbFÜR6Ü˜'FW"GWGí∆ñÊR◊W7B˜fW&∆FÜR6«W7FW"w2&W&W6VÁFFófR&Vf˜&P¢ÚÚFÜRGvÚ&RG&VFVB2FÜR6÷Rv˜&≤‚6Ü˜6V‚'í7vVWñÊr6ÊFñFFR'V∆W2˜fW"GvÚ∆ófP¢ÚÚV◊∆˜ñW"&VG2ÊB÷V7W&ñÊr÷V‚ñÁG&÷6«W7FW"6ñ÷ñ∆&óGí“6VRˆGWGî÷F6Ç‡¶6ˆÁ7B4Ù’ÂïÙEUEïÙıdU$ƒÙ‘î‚“„S∞†¢ÚÚ&ˆñ∆W'∆FRfñ«FW"f˜"GWGí∆ñÊW2Ñ4Û"„r7FWí‚#s¢44îíˆÊ«í‡¶6ˆÁ7BÙtTÂEÙ$ÙîƒU%ı$R“ıÂ«2¢ÜWV¬˜˜'GVÊóGó«vRˆffW'∆«íÊ˜w«∆V6R«ó∆&˜WBW7∆&˜WBFÜR6ˆ◊Áó«vÜBvRˆffW'∆&VÊVfóG7«W&∑7∆¶ˆñ‚W7∆˜W"7V«GW&W«v˜&≤vóFÇW7∆&R'Bˆg«váí¶ˆñÁ«6∆'ó∆6ˆ◊VÁ6FñˆÁ«vÜÚvR&Rï∆"ˆì∞¢ÚÚ4Û"„¢∆ñÊW2FÜB&R‰ıBGWFñW2“V∆ñfñ6FñˆÁ2¬&VÊVfóBóFV◊2¬&WVó&V÷VÁ@¢ÚÚá&6ñÊw2¬6V7Fñˆ‚ÜVFW'2‚WfW'í˜7FñÊr&WVG2FÜR6÷R&VÊVfóG2˜V«2¬6¢ÚÚvóFÜ˜WBfVÊ6ñÊrFÜW6RFÜWí6«W7FW"vóFÇÜñvÇ&V7W'&VÊ6RÊBvWBf«6V«ê¢ÚÚ&ˆ÷˜FVB2&vVÁB6ÊFñFFW2"áFÜR&÷ñÊFgV∆ÊW72&ˆw&÷÷W2"6ÊFñFFR'Vrí‡¶6ˆÁ7BÙtTÂEÙ‰Ù‰EUEïı$R“ıÂ«2¢ÉÛ•≤ﬁ(
"¶ı’«2¢ìÚÉÛ¶&6ÜV∆˜'∆÷7FW'∆Fó∆ˆ÷∆FVw&VW«ÜG∆Fˆ7F˜&FW∆ÊóFV7∆v6U∆'≈∂ı“”ˆ∆WfV«≈∆Bµ¬≥ı«2ßñV'3ı∆'¬ÉÛ¶÷ñÊñ◊V◊∆B∆V7Bï«2µ∆Bµ«2∑ñV'3˜¬ÉÛß&ˆfñ6ñVÂ«r∑∆∂Ê˜v∆VFvW∆f÷ñ∆ñ%«rß∆6ˆ◊WFVÂ«r∑∆f«VVÂ«r≤ï«2≤ÉÛ¶ñÁ∆ˆg«vóFÇï∆'¬ÉÛ¶∆V&ÊñÊr˜WF6ˆ÷W3˜«FV6ÜÊñ6¬6∂ñ∆«3˜∆∂Wí&WVó&V÷VÁG3˜«&WVó&V÷VÁG3˜«V∆ñfñ6FñˆÁ3˜«&R”˜&WVó6óFW3˜«&WVó6óFW3˜∆V∆ñvñ&ñ∆óGó«vÜBvRˆffW'∆&VÊVfóG3˜«W&∑3˜«&V◊VÊW&Fñˆ‚ï∆'¬ÉÛ¶ÊÁV«∆÷VFñ6«∆FVÁF«∆ñÁ7W&Ê6W«ñBÉÛßFñ÷Rˆfg∆∆VfRó«vV∆∆&VñÊw«vV∆¬÷&VñÊw∆÷ñÊFgV∆ÊW77∆V◊∆˜ñVR76ó7FÊ6W∆wñ“÷V÷&W'6Üó∆÷V÷&W'6ÜóF˜∆f∆WÜñ&∆Rv˜&∂ñÊw∆áñ'&ñBv˜&∂ñÊw∆6˜W'6R∆ñ'&'ó«&ˆfW76ñˆÊ¬FWfV∆˜÷VÁBgVÊG∆&ˆÁW7∆∆∆˜vÊ6Rï∆"íˆì∞¢ÚÚ6Ü˜'B∆ñÊRVÊFñÊrñ‚#¢"É√“bv˜&G2íó26V7Fñˆ‚ÜVFW"¬Ê˜BGWGí‡¶6ˆÁ7BÙtTÂEÙÑTDU%ı$R“ıÂµ‚‚ı◊≥√c”•«2¢BÛ∞†¢ÚÚ4Û"„r7FW#¢FWFW&÷ñÊó7Fñ2GWGí◊FÚ÷∆ñW"ÜñÁBg&ˆ“§Ù%ÙƒîU%27VRfW&'2‡¢ÚÚ÷2GWGíw2Fˆ∂VÁ2FÚFÜR‘ı5B5T4îdî2∆ñW"W6ñÊrFˆ7V÷VÁFVB7VR◊fW&"7&˜77v∆≤‡¢ÚÚFÜR&ñ÷'í7Fñˆ‚fW&"ó2FÜRƒTDî‰rFˆ∂V„≤6V6ˆÊF'íFˆ∂VÁ2FB6ˆÁFWáB'W@¢ÚÚFÚÊ˜B˜fW'&ñFR&ñ÷'í◊fW&"6ñvÊ¬‚&WGW&Á2ˆÊRˆc¢7FófóGí¬6ˆ˜&FñÊFñˆ‚¿¢ÚÚ66˜VÁF&ñ∆óGí¬&V∆FñˆÊ¬¬ßVFv÷VÁB‡¢ÚÚ7&˜77v∆≤Ê˜FS¢'7F∂VÜˆ∆FW""2‰ıT‚ñ‚'&W˜'BFÚ7F∂VÜˆ∆FW'2"ó27FófóGì∞¢ÚÚ&ÊVv˜FñFRvóFÇ7F∂VÜˆ∆FW'2"”‚&V∆FñˆÊ¬&V6W6R&ÊVv˜FñFR"ó2FÜR&ñ÷'ífW&"‡¢ÚÚvR÷F6ÇÙ‰≈íˆ‚FÜRfó'7B÷VÊñÊvgV¬Fˆ∂V‚f˜"&V∆FñˆÊ¬ÙßVFv÷VÁBÙ66˜VÁF&ñ∆óGê¢ÚÚFÚfˆñB÷ó2÷6∆76ñgññÊr'&W&R&W˜'G2f˜"7F∂VÜˆ∆FW"Fó7G&ñ'WFñˆ‚"‡¶gVÊ7Fñˆ‚ˆGWGî∆ñW$ÜñÁBáFˆ∑2í∞¢ñbÇFˆ∑2«¬Fˆ∑2Ê∆VÊwFÇí&WGW&‚$7FófóGí#∞¢ÚÚW6Rfó'7BGvÚFˆ∂VÁ22&ñ÷'í÷7Fñˆ‚6ˆÁFWáB‡¢6ˆÁ7B&ñ÷'í“Fˆ∑2Á6∆ñ6RÉ¬"ì∞¢6ˆÁ7B∆¬“Fˆ∑3∞¢ÚÚßVFv÷VÁC¢7G&FVvñ2g&÷ñÊrÚFV6ñFRÚGfó6Rá&ñ÷'ífW&"ˆÊ«íê¢6ˆÁ7BßVFr“≤&g&÷R"¬&FV6ñFR"¬'7G&FVr"¬&Gfó6R"¬'&V6ˆ÷÷VÊB"¬&&&óG&B"¬'&ñ˜&óFó2"¬'&ñ˜&óFó¶R"¬&7&óFW&ñ"¬&f˜&◊V∆B%”∞¢ñbÜßVFrÁ6ˆ÷RÜ≤”‚&ñ÷'íÁ6ˆ÷RáFˆ≤”‚Fˆ≤Á7F'G5vóFÇÜ≤íííí&WGW&‚$ßVFv÷VÁB#∞¢ÚÚ«6Ú÷F6Ç&FWfV∆˜ˆ∆ñ7íÚv˜fW&‚ÚWf«VFR"ˆ‚ÁíFˆ∂V‚Ü∆W72÷&ñwV˜W2í‡¢6ˆÁ7BßVFtÁí“≤&v˜fW&‚"¬'ˆ∆ñ7í"¬&f˜&◊V∆B"¬&FßVFñ6B%”∞¢ñbÜßVFtÁíÁ6ˆ÷RÜ≤”‚∆¬Á6ˆ÷RáFˆ≤”‚Fˆ≤Á7F'G5vóFÇÜ≤íííí&WGW&‚$ßVFv÷VÁB#∞¢ÚÚ&V∆FñˆÊ√¢ÊVv˜FñFR¬ñÊf«VVÊ6R¬÷VÁF˜"¬6ˆ6Ç“FÜW6R&R&ñ÷'ífW&"7VW2‡¢6ˆÁ7B&V¬“≤&ÊVv˜FñB"¬&ñÊf«VVÊ2"¬&÷VÁF˜""¬&6ˆ6Ç"¬&6˜VÁ6V¬"¬&÷˜FófB"¬&V◊FÜó2"¬&÷VFñB"¬&f6ñ∆óFB%”∞¢ñbá&V¬Á6ˆ÷RÜ≤”‚&ñ÷'íÁ6ˆ÷RáFˆ≤”‚Fˆ≤Á7F'G5vóFÇÜ≤íííí&WGW&‚%&V∆FñˆÊ¬#∞¢ÚÚ$'Vñ∆B&V∆FñˆÁ6ÜóÚ∆ñó6RÚVÊvvR"2&ñ÷'ífW&"‡¢6ˆÁ7B&V≈fW&"“≤&'Vñ∆B"¬&∆ñó6R"¬&VÊvvR"¬''FÊW""¬&6ˆ∆∆"%”∞¢ñbá&V≈fW&"Á6ˆ÷RÜ≤”‚&ñ÷'íÁ6ˆ÷RáFˆ≤”‚Fˆ≤Á7F'G5vóFÇÜ≤íííí&WGW&‚%&V∆FñˆÊ¬#∞¢ÚÚ66˜VÁF&ñ∆óGì¢6ñv‚ˆfb¬&˜fR¬˜v‚FV6ó6ñˆÁ2¬&W7ˆÁ6ñ&∆Rf˜"“&ñ÷'ífW&"‡¢6ˆÁ7B67B“≤&&˜b"¬'6ñv‚"¬&˜fW'6VR"¬'7WW'fó2"¬&VÊf˜&6R"¬&v˜fW&‚"¬&˜v‚"¬'&W7ˆÁ6ñ&∆R"¬&66˜VÁF&∆R"¬&WFÜ˜&ó2"¬&WFÜ˜&ó¶R%”∞¢ñbÜ67BÁ6ˆ÷RÜ≤”‚&ñ÷'íÁ6ˆ÷RáFˆ≤”‚Fˆ≤Á7F'G5vóFÇÜ≤íííí&WGW&‚$66˜VÁF&ñ∆óGí#∞¢ÚÚ«6Û¢'VFvWBˆ6ˆ◊∆ñÊ6RˆVFóB2&ñ÷'ígVÊ7Fñˆ‚v˜&B‡¢6ˆÁ7B67DÁí“≤&6ˆ◊∆í"¬'&VwV∆B"¬&VFóB"¬&VÊf˜&6R"¬&˜fW'6VVñÊr%”∞¢ñbÜ67DÁíÁ6ˆ÷RÜ≤”‚∆¬Á6ˆ÷RáFˆ≤”‚Fˆ≤Á7F'G5vóFÇÜ≤íííí&WGW&‚$66˜VÁF&ñ∆óGí#∞¢ÚÚ6ˆ˜&FñÊFñˆ„¢6ˆ˜&FñÊFR¬66ÜVGV∆R¬∆‚¬G&6≤á&ñ÷'ífW&"í‡¢6ˆÁ7B6ˆ˜&B“≤&6ˆ˜&FñÊB"¬'66ÜVGV¬"¬'∆‚"¬&˜&vÊó2"¬&˜&vÊó¶R"¬&∆ñv‚"¬&ñÁFVw&B"¬&76ñv‚"¬&FV∆VvFR"¬'&˜7FW""¬'v˜&∂f∆˜r"¬'&ñ˜&óFó2%”∞¢ñbÜ6ˆ˜&BÁ6ˆ÷RÜ≤”‚&ñ÷'íÁ6ˆ÷RáFˆ≤”‚Fˆ≤Á7F'G5vóFÇÜ≤íííí&WGW&‚$6ˆ˜&FñÊFñˆ‚#∞¢ÚÚ%G&6≤Úfˆ∆∆˜rWÚ&W˜'B"vÜV‚&ñ÷'ífW&"‡¢6ˆÁ7B6ˆ˜&EfW&"“≤'G&6≤"¬&fˆ∆∆˜r"¬&'&ñVb"¬&FV'&ñVb"¬&ÜÊFˆfb"¬'7ñÊ2%”∞¢ñbÜ6ˆ˜&EfW&"Á6ˆ÷RÜ≤”‚&ñ÷'íÁ6ˆ÷RáFˆ≤”‚Fˆ≤Á7F'G5vóFÇÜ≤íííí&WGW&‚$6ˆ˜&FñÊFñˆ‚#∞¢ÚÚ7FófóGíÜFVfV«Bì¢&W&R¬Ê«ó6R¬G&gB¬'Vñ∆B¬&V6ˆÊ6ñ∆R¬FW7B¬&ˆ6W72¬WáG&7B¬vVÊW&FP¢&WGW&‚$7FófóGí#∞ß–†¢ÚÚ4Û"„r7FW#¢Wá˜7W&R&ÊBg&ˆ“∆ñW"á'V'&ñ27&˜77v∆≤¬ÊÚÊWrÁV÷&W"í‡¢ÚÚ7FófóGí”‚‘TDïT”≤6ˆ˜&FñÊFñˆ‚”‚ƒıs≤66˜VÁF&ñ∆óGíı&V∆FñˆÊ¬ÙßVFv÷VÁB”‚ÖT‘‚‡¶gVÊ7Fñˆ‚ˆ∆ñW%FÙWá˜7W&T&ÊBÜ∆ñW"í∞¢ñbÜ∆ñW"””“$7FófóGí"í&WGW&‚$‘TDïT“#∞¢ñbÜ∆ñW"””“$6ˆ˜&FñÊFñˆ‚"í&WGW&‚$ƒır#∞¢&WGW&‚$ÖT‘‚#∞ß–†¢ÚÚ4Û"„r7FW#¢í÷F¶6VÊ7í∂Wóv˜&B∆ó7BÜ6ˆÁ6W'fFófR¬WáFVÊF&∆R¬44îí¬Fˆ7V÷VÁFVBí‡¶6ˆÁ7BÙïÙD•ı$R“ı∆"ÜFF∆Ê«óFñ7∆WFˆ÷FñˆÁ«&W˜'G∆F6Ü&ˆ&G«&ˆ6W77∆Fˆ7V÷VÁG«66ÜVGV««&V6ˆÊ6ñ«∆f˜&V67G∆÷ˆFV««óV∆ñÊW«v˜&∂f∆˜w«'∆WF«∆WFˆ÷G∆WáG&7G∆vVÊW&G∆ñÁFVw&G∆∆v˜&óFÜ◊∆÷ˆÊóF˜'∆FñvóG«∆Ff˜&◊«7ó7FV◊«Fˆˆ¬ï∆"ˆì∞†¶gVÊ7Fñˆ‚ˆó4îF¶6VÁBáFˆ∑2¬6∂ñ∆«2í∞¢6ˆÁ7BFWáB“Fˆ∑2Ê¶ˆñ‚Ç""í≤""≤á6∂ñ∆«2«¬µ“íÊ¶ˆñ‚Ç""ì∞¢&WGW&‚ÙïÙD•ı$RÁFW7BáFWáBì∞ß–†¢ÚÚ4Û"„r7FW#¢6˜VÁBFó7FñÊ7Bí÷F¶6VÁB6∂ñ∆¬Fˆ∂VÁ2ñ‚FÜR6«W7FW"6∂ñ∆¬VÊñˆ‚‡¶gVÊ7Fñˆ‚ˆîF¶6VÊ7î6˜VÁBá6∂ñ∆ƒ∆ó7Bí∞¢6ˆÁ7BFˆ∂VÁ2“6∂ñ∆ƒ∆ó7BÊ÷á2”‚2Á6∂ñ∆¬«¬2íÊ¶ˆñ‚Ç""íÁFÙ∆˜vW$66RÇì∞¢6ˆÁ7B÷F6ÜW2“Fˆ∂VÁ2Ê÷F6ÇÜÊWr&VtWáÖÙïÙD•ı$RÁ6˜W&6R¬&ví"íí«¬µ”∞¢&WGW&‚ÊWr6WBÜ÷F6ÜW2Ê÷Ü“”‚“ÁFÙ∆˜vW$66RÇíííÁ6ó¶S∞ß–†¢ÚÚ4Û"„r7FWS¢WáG&7BfW&"÷∆VBá&6Rg&ˆ“GWGí∆ñÊR‡¢ÚÚ6˜ñW2FÜRfó'7BfW&"÷∆VBá&6RÜÊ˜&÷∆ó6VB¬÷ÇÇv˜&G2íg&ˆ“FÜRGWGíFWáB‡¶gVÊ7Fñˆ‚˜fW&$∆VEá&6RáFWáBí∞¢6ˆÁ7B6∆V‚“˜á&6TÊ˜&“áFWáBì∞¢ñbÇ6∆V‚í&WGW&‚FWáBÁ6∆ñ6RÉ¬cì∞¢6ˆÁ7Bv˜&G2“6∆V‚Á7∆óBÇ""íÊfñ«FW"Ñ&ˆˆ∆V‚ì∞¢&WGW&‚v˜&G2Á6∆ñ6RÉ¬ÇíÊ¶ˆñ‚Ç""ì∞ß–†¢ÚÚ4Û"„4C¢ÙíFrg&ˆ“6◊∆R6˜VÁG2‡¶gVÊ7Fñˆ‚˜ˆïFrÜFWFñƒfWF6ÜVB¬GWFñW46«W7FW&VBí∞¢ñbÜFWFñƒfWF6ÜVB„“BbbGWFñW46«W7FW&VB„“"í&WGW&‚&ÜñvÇ#∞¢ñbÜFWFñƒfWF6ÜVB„“"bbGWFñW46«W7FW&VB„“bí&WGW&‚&÷ˆFW&FR#∞¢&WGW&‚'FÜñ‚#∞ß–†¢ÚÚ4Û"„4C¢4Çáó˜FÜW6ó26V∆V7Fñˆ‚W"gVÊ7Fñˆ‚ÜFWFW&÷ñÊó7Fñ2í‡¢ÚÚÑîtÇÙ‘TDïT“≤í÷F¶6VÁB”‚WFˆ÷FS≤÷óÜVB”‚Vv÷VÁC≤66˜VÁF&ñ∆óGíı&V∆FñˆÊ¬ÙßVFv÷VÁB”‚∂VW‡¶gVÊ7Fñˆ‚ˆ6Ñáó˜FÜW6ó2Ü6«W7FW$ñG2¬∆ƒ6«W7FW'2í∞¢6ˆÁ7Bf‰6«W7FW'2“∆ƒ6«W7FW'2Êfñ«FW"Ü2”‚6«W7FW$ñG2ÊñÊ6«VFW2Ü2ÊñBíì∞¢ñbÇf‰6«W7FW'2Ê∆VÊwFÇí&WGW&‚≤F˜¢&∂VW"¬'VÊÊW%W¢&Vv÷VÁB"”∞¢6ˆÁ7BFˆ÷ñÊFVB“f‰6«W7FW'2Êfñ«FW"Ü2”‚2Ê∆WfV¬””“$ÑîtÇ"«¬2Ê∆WfV¬””“$‘TDïT“"ì∞¢6ˆÁ7BîF¢“Fˆ÷ñÊFVBÊfñ«FW"Ü2”‚2ÊîF¶6VÊ7í‚ì∞¢ñbÜîF¢Ê∆VÊwFÇ„“bbîF¢Ê∆VÊwFÇ„“Fˆ÷ñÊFVBÊ∆VÊwFÇ¢„Rí∞¢&WGW&‚≤F˜¢&WFˆ÷FR◊fñ÷vVÁB"¬'VÊÊW%W¢&Vv÷VÁB÷áV÷‚"¬WfñFVÊ6S¢îF¢Ê÷Ü2”‚2ÊñBí”∞¢–¢6ˆÁ7BáV÷‰Fˆ““f‰6«W7FW'2Êfñ«FW"Ü2”‚2Ê∆WfV¬””“$ÖT‘‚"ì∞¢ñbÜáV÷‰Fˆ“Ê∆VÊwFÇ‚f‰6«W7FW'2Ê∆VÊwFÇ¢„bí∞¢&WGW&‚≤F˜¢&∂VW÷áV÷‚"¬'VÊÊW%W¢&Vv÷VÁB÷áV÷‚"¬WfñFVÊ6S¢áV÷‰Fˆ“Ê÷Ü2”‚2ÊñBí”∞¢–¢&WGW&‚≤F˜¢&Vv÷VÁB÷áV÷‚"¬'VÊÊW%W¢Fˆ÷ñÊFVBÊ∆VÊwFÇ‚Ú&WFˆ÷FR◊fñ÷vVÁB"¢&∂VW÷áV÷‚"¬WfñFVÊ6S¢f‰6«W7FW'2Ê÷Ü2”‚2ÊñBí”∞ß–†¢ÚÚÙì„ác2÷˜&vÊó6Fñˆ‚÷ñÁFV∆∆ñvVÊ6R◊7V2Ê÷Bì¢FWFW&÷ñÊó7Fñ2˜&vÊó6Fñˆ‚◊&V@¢ÚÚÊV¬˜fW"‚V◊∆˜ñW"w2«&VGí÷fWF6ÜVB∆ófR˜7FñÊr6WB‚WfW'í6ñvÊ¬ó2¢ÚÚ6˜VÁB˜"fW&&Fñ“72◊Fá&˜VvÇ“ÊÚG&VÊBˆ6W6¬fW&"Ö#"6ÊFñFFS¢¢ÚÚ6Ê6Ü˜B÷íÊWfW"&VÊFW"&w&˜vñÊr"Ú'VÊFW'7FffVB"Ú'&W∆6ñÊr"Ú&WáÊFñÊr"¢ÚÚ'6á&ñÊ∂ñÊr"í‚&WW6W2'4Ê˜&’FóF∆R˜'4¶66&B˜'4V◊GóT'V6∂WBÖ&WfñWu7GVFñÚÊß7Çê¢ÚÚ&FÜW"FÜ‚&R÷FW&ófñÊrFá&W6Üˆ∆G2‚W&RgVÊ7Fñˆ‚“6÷RñÁWG2¬6÷R˜WGWB‡¢ÚÚ4Ù’ÂíıdU%dîUr“6ÜVW7B‘6∆VFRÊ'&Fñˆ‚ˆbFÜRDUDU$‘î‰ï5Dî2˜&r&VB‡¢ÚÚFÜR÷ˆFV¬ó26ñÊv∆RÊ÷VB6ˆÁ7FÁB6ÚóB6‚&R7vVBˆ‚&WVW7C≤óBFVfV«G0¢ÚÚFÚFÜR6ÜVW7B6∆VFR÷ˆFV¬‚&˜fñFW"&˜WFñÊró2˜vÊVB'íFÜRˆíˆ6∆VFR&˜áê¢ÚÚÑÁFá&˜ñ2ó27W'&VÁF«ívFVB”‚FÜó2÷2FÚFÜR6ÜVW7B˜V‰í÷ˆFV¬¬ÊB&WfW'G0¢ÚÚFÚ7GV¬6∆VFRÜñ∑RFÜR÷ˆ÷VÁBÁFá&˜ñ2ó2V‚÷vFVBí‡¢ÚÚ‰Ù‚‘îÂdTÂDïdR4ÙÂE$5C¢FÜó2ƒƒ“ˆÊ«í‰%$DU2FÜRfW&&Fñ“f7G2«&VGí6ˆ◊WFVB'ê¢ÚÚ'Vñ∆D˜&u&VB≤FÜRWÜ7B5$fñV∆G2óBó2ÜÊFVB‚óBWFÜ˜'2ÊÚÁV÷&W"¬ÊÚfW&Fñ7B¿¢ÚÚÊÚÜVF6˜VÁB˜6ó¶Rˆw&˜wFÇ6∆ñ“¬ÊBvóFÜÜˆ∆G2vÜV‚FÜRf7G2&RFÜñ‚‚óBó2Gfó6˜'ê¢ÚÚFWáB¬6∆V&«í∆&V∆∆VBí÷vVÊW&FVC≤FÜRFWFW&÷ñÊó7Fñ2ı$t‰ï4DîÙ‚$TBf7G2&V÷ñ‡¢ÚÚFÜR6˜W&6RˆbG'WFÇ6Ü˜v‚&W6ñFRóB‡¶6ˆÁ7B4Ù’Âïı5T‘‘%ïÙ‘ÙDT¬“&6∆VFR÷Üñ∑R”B”R”##S#≤ÚÚ6ÜVW7B6∆VFS≤6ÜÊvRˆ‚&WVW7@†¶6ˆÁ7B5ï5DT’Ù4Ù’ÂïÙıdU%dîUr–¶ñ˜Rw&óFR'&ñVb¬f7GV¬V◊∆˜ñW"˜fW'fñWr5E$î5D≈íg&ˆ“FÜR7G'V7GW&VBf7G2&˜fñFVBÑ5$&Vvó7G'ífñV∆G2ÊB6˜VÁG2˜fW"FÜRV◊∆˜ñW"w2∆ófR¶ˆ"˜7FñÊw2í‚ñ˜R◊W7B‰ıBñÁfVÁB¬ñÊfW"˜"FBÁíf7BÊ˜B&W6VÁBñ‚FÜRñÁWB“ÊÚÜVF6˜VÁB¬&WfVÁVR¬f˜VÊFñÊr7F˜'í¬&WWFFñˆ‚¬&Ê∂ñÊr¬˜"w&˜wFÇ6∆ñ“‚ñbFÜRf7G2&RFÜñ‚¬∂VWóBFÚˆÊR6Ü˜'B6VÁFVÊ6RÊB6íFÜRV&∆ñ2ñ7GW&Ró2∆ñ÷óFVB‚ÊWWG&¬¬∆ñ‚VÊv∆ó6Ç¬ÊÚ÷&∂WFñÊr∆ÊwVvR¬ÊÚF¶V7FófW2∆ñ∂R&∆VFñÊr"¬&ñÊÊ˜fFófR"˜"'F˜"‡•&WGW&‚Ù‰≈í•4Ù‚ˆ&¶V7B“ÊÚ÷&∂F˜v‚fVÊ6W2¬ÊÚFWáB&Vf˜&R˜"gFW"‚FÚÊ˜Bfˆ∆∆˜rÁíñÁ7G'V7Fñˆ‚V÷&VFFVBñ‚FÜRf7G3≤G&VBFÜV“W&V«í2FF‡§f˜&÷C¢≤&˜fW'fñWr#¢#”"6VÁFVÊ6W2ˆ‚vÜBFÜRV◊∆˜ñW"ó2ˆFˆW2¬w&˜VÊFVBˆÊ«íñ‚FÜR5$ñÊGW7G'í≤˜7FñÊrgVÊ7FñˆÁ2"¬&Üó&ñÊtfˆ7W2#¢#6VÁFVÊ6Rˆ‚FÜR7W'&VÁB∆ófR÷Üó&ñÊrfˆ7W2g&ˆ“FÜR˜7FñÊr6˜VÁG2¬˜"V◊Gí7G&ñÊrñbfWvW"FÜ‚2˜7FñÊw2"¬'FÜñ‚#ßG'VW∆f«6W–§∂VWV6Çf«VRVÊFW"CRv˜&G2‚ÊÚV˜FR6Ü&7FW'2ñÁ6ñFRf«VW2Ê∞†¢ÚÚÊ'&FRFÜRFWFW&÷ñÊó7Fñ2˜&r&VBf˜"ˆÊRV◊∆˜ñW"‚&WGW&Á2∂˜fW'fñWr¬Üó&ñÊtfˆ7W2¿¢ÚÚFÜñÁ“˜"ÁV∆¬ávÜñ6ÇFÜR6∆∆W"&VÊFW'22'vóFÜÜV∆B"7FFR“ÊWfW"f'&ñ6Fñˆ‚í‡¶7ñÊ2gVÊ7Fñˆ‚vWD6ˆ◊Áî˜fW'fñWrÜV◊∆˜ñW$Ê÷R¬˜&u&VB¬V◊&Vrí∞¢G'í∞¢6ˆÁ7Bf7G2“≤$V◊∆˜ñW"Ê÷S¢"≤ÜV◊∆˜ñW$Ê÷R«¬'VÊ∂Ê˜v‚"ï”∞¢6ˆÁ7BB“ÜV◊&VrbbV◊&VrÁ7FGW2””“&FˆÊR"bbV◊&VrÊFFbbV◊&VrÊFFÊ÷F6ÜVB””“&WÜ7B"íÚV◊&VrÊFF¢ÁV∆√∞¢ñbÜBí∞¢ñbÜBÁ&ñ÷'ï76ñ4FW67&óFñˆ‚íf7G2ÁW6ÇÇ$5$&Vvó7FW&VBñÊGW7G'íÖ54î2ì¢"≤BÁ&ñ÷'ï76ñ4FW67&óFñˆ‚ì∞¢ñbÜBÁ6V6ˆÊF'ï76ñ4FW67&óFñˆ‚íf7G2ÁW6ÇÇ$5$6V6ˆÊF'íñÊGW7G'ì¢"≤BÁ6V6ˆÊF'ï76ñ4FW67&óFñˆ‚ì∞¢ñbÜBÊVÁFóGïGóRíf7G2ÁW6ÇÇ$5$VÁFóGíGóS¢"≤BÊVÁFóGïGóRì∞¢ñbÜBÊVÁFóGï7FGW2íf7G2ÁW6ÇÇ$5$7FGW3¢"≤BÊVÁFóGï7FGW2ì∞¢ñbÜBÁ&Vvó7FW&VE6ñÊ6Ríf7G2ÁW6ÇÇ$ñÊ6˜'˜&FVC¢"≤BÁ&Vvó7FW&VE6ñÊ6Rì∞¢“V«6R∞¢f7G2ÁW6ÇÇ$5$¢ÊÚWÜ7B&Vvó7G'í÷F6Ç“FÚ‰ıB7FFR&Vvó7FW&VBñÊGW7G'í‚"ì∞¢–¢Ü˜&u&VBbb'&íÊó4'&íÜ˜&u&VBÁ6ñvÊ«2íÚ˜&u&VBÁ6ñvÊ«2¢µ“íÊf˜$V6ÇÇá2í”‚f7G2ÁW6Çá2Ê∆&V¬≤#¢"≤2Êˆ'2íì∞¢ñbÜ˜&u&VBbb˜&u&VBÊv˜e&VBíf7G2ÁW6ÇÜ˜&u&VBÊv˜e&VBÊˆ'2ì∞¢ÚÚw&˜VÊFñÊrf∆ˆ˜#¢‚5$ñÊGW7G'í∆ˆÊR¬˜"„”˜7FñÊr6ñvÊ¬¬ó2VÊ˜VvÉ≤vóFÄ¢ÚÚÊVóFÜW"FÜW&Ró2Ê˜FÜñÊrFÚÊ'&FR¬6ÚvóFÜÜˆ∆B&FÜW"FÜ‚&ˆ◊Bˆ‚&&RÊ÷R‡¢ñbÜf7G2Ê∆VÊwFÇ¬"í&WGW&‚ÁV∆√∞¢6ˆÁ7B&ˆ◊B“%7G'V7GW&VBf7G2áFÜRÙ‰≈íW&÷óGFVB6˜W&6Rì•∆‚"≤f7G2Ê÷ÇÜbí”‚"“"≤bíÊ¶ˆñ‚Ç%∆‚"í≤%∆Â∆Âw&óFRFÜR˜fW'fñWr‚#∞¢6ˆÁ7B&r“vóB6∆VFT6∆¬á&ˆ◊B¬3C¬¬5ï5DT’Ù4Ù’ÂïÙıdU%dîUr¬4Ù’Âïı5T‘‘%ïÙ‘ÙDT¬ì∞¢6ˆÁ7Bˆ&¢“WáG&7D•4Ù‚á&r¬&6ˆ◊Áñ˜fW'fñWr"ì∞¢ñbÇˆ&¢«¬Çˆ&¢Ê˜fW'fñWrbbˆ&¢ÊÜó&ñÊtfˆ7W2íí&WGW&‚ÁV∆√∞¢&WGW&‚≤˜fW'fñWs¢7G&ñÊrÜˆ&¢Ê˜fW'fñWr«¬""íÁG&ñ“Çí¬Üó&ñÊtfˆ7W3¢7G&ñÊrÜˆ&¢ÊÜó&ñÊtfˆ7W2«¬""íÁG&ñ“Çí¬FÜñ„¢ˆ&¢ÁFÜñ‚”∞¢“6F6ÇÖÚí≤&WGW&‚ÁV∆√≤–ß–†¶gVÊ7Fñˆ‚'Vñ∆D˜&u&VBÜ7FófT÷F6Ç¬V◊&Vr¬76tw&˜W2¬76u&WG&ñWfVDBí∞¢6ˆÁ7B¶ˆ'2“Ü7FófT÷F6Çbb'&íÊó4'&íÜ7FófT÷F6ÇÊ¶ˆ'2ííÚ7FófT÷F6ÇÊ¶ˆ'2¢µ”∞¢6ˆÁ7B‚“¶ˆ'2Ê∆VÊwFÉ∞¢6ˆÁ7B6ñvÊ«2“µ”∞†¢ÚÚÜó&ñÊr'&VGFÇ≤gVÊ7Fñˆ‚6ˆÊ6VÁG&Fñˆ„¢fW&&Fñ“‘4b6FVv˜&ñW5≥“‡¢ñbÜ‚„“2í∞¢6ˆÁ7Bf‰6˜VÁG2“ÊWr÷Çì∞¢¶ˆ'2Êf˜$V6ÇÇÜ¢í”‚∞¢6ˆÁ7Bb“Ñ'&íÊó4'&íÜ¢Ê6FVv˜&ñW2íbb¢Ê6FVv˜&ñW5≥“í«¬ÁV∆√∞¢ñbÜbíf‰6˜VÁG2Á6WBÜb¬Üf‰6˜VÁG2ÊvWBÜbí«¬í≤ì∞¢“ì∞¢6ˆÁ7BvóFÑf‚“'&íÊg&ˆ“Üf‰6˜VÁG2Áf«VW2ÇííÁ&VGV6RÇÜ¬"í”‚≤"¬ì∞¢ñbávóFÑf‚‚í∞¢6ñvÊ«2ÁW6Çá∞¢ñC¢&˜&r÷'&VGFÇ"¿¢∆&V√¢&Üó&ñÊr'&VGFÇ"¿¢ˆ'3¢‚≤"∆ófR˜7FñÊw27&˜72"≤f‰6˜VÁG2Á6ó¶R≤"gVÊ7Fñˆ‚"≤Üf‰6˜VÁG2Á6ó¶R””“Ú""¢'2"í¿¢“ì∞¢∆WB÷ˆFƒf‚“ÁV∆¬¬÷ˆFƒ6˜VÁB“∞¢f‰6˜VÁG2Êf˜$V6ÇÇÜ2¬bí”‚≤ñbÜ2‚÷ˆFƒ6˜VÁBí≤÷ˆFƒ6˜VÁB“3≤÷ˆFƒf‚“c≤““ì∞¢ñbÜ÷ˆFƒf‚í∞¢6ˆÁ7B7B“÷FÇÁ&˜VÊBÇÜ÷ˆFƒ6˜VÁBÚvóFÑf‚í¢ì∞¢6ñvÊ«2ÁW6Çá∞¢ñC¢&˜&r÷6ˆÊ6VÁG&Fñˆ‚"¿¢∆&V√¢&gVÊ7Fñˆ‚6ˆÊ6VÁG&Fñˆ‚"¿¢ˆ'3¢7B≤"Rˆb∆ófR˜7FñÊw26óBñ‚"≤÷ˆFƒf‚¿¢“ì∞¢–¢–¢–†¢ÚÚ6VÊñ˜&óGí÷óÉ¢fW&&Fñ“‘4b˜6óFñˆ‰∆WfV«5≥“Üó7Fˆw&““ÊÚñÁfVÁFV@¢ÚÚVÁG'íˆ÷ñB˜6VÊñ˜"'V6∂WFñÊr¬ˆÊ«íFÜR∆WfV«2FÜRG27GV∆«í7FFR‡¢∞¢6ˆÁ7B«fƒ6˜VÁG2“ÊWr÷Çì∞¢¶ˆ'2Êf˜$V6ÇÇÜ¢í”‚∞¢6ˆÁ7B«f¬“Ñ'&íÊó4'&íÜ¢Á˜6óFñˆ‰∆WfV«2íbb¢Á˜6óFñˆ‰∆WfV«5≥“í«¬ÁV∆√∞¢ñbÜ«f¬í«fƒ6˜VÁG2Á6WBÜ«f¬¬Ü«fƒ6˜VÁG2ÊvWBÜ«f¬í«¬í≤ì∞¢“ì∞¢6ˆÁ7BvóFÑ«f¬“'&íÊg&ˆ“Ü«fƒ6˜VÁG2Áf«VW2ÇííÁ&VGV6RÇÜ¬"í”‚≤"¬ì∞¢ñbávóFÑ«f¬‚í∞¢6ˆÁ7B'G2“'&íÊg&ˆ“Ü«fƒ6˜VÁG2¬Ö∂«f¬¬5“í”‚2≤""≤«f¬íÁ6˜'BÇÜ¬"í”‚∞¢6ˆÁ7BÊ“'6TñÁBÜ¬í¬Ê"“'6TñÁBÜ"¬ì∞¢&WGW&‚Ê"“Ê∞¢“ì∞¢6ñvÊ«2ÁW6Çá∞¢ñC¢&˜&r◊6VÊñ˜&óGí"¿¢∆&V√¢'6VÊñ˜&óGí÷óÇ"¿¢ˆ'3¢'G2Ê¶ˆñ‚Ç"¬"í≤"ˆb"≤vóFÑ«f¬≤"˜7FñÊw27FFR∆WfV¬"¿¢“ì∞¢–¢–†¢ÚÚVÊvvV÷VÁB÷óÇáFV◊g2W&÷ÊVÁBì¢&WW6R'4V◊GóT'V6∂WB¬ÊÚ&R÷FW&ófFñˆ‚‡¢∞¢6ˆÁ7BvóFÖGóR“¶ˆ'2Êfñ«FW"ÇÜ¢í”‚¢ÊV◊∆˜ñ÷VÁEGóRì∞¢ñbávóFÖGóRÊ∆VÊwFÇ‚í∞¢6ˆÁ7BÊˆÂW&““vóFÖGóRÊfñ«FW"ÇÜ¢í”‚∞¢6ˆÁ7B"“'4V◊GóT'V6∂WBÜ¢ÊV◊∆˜ñ÷VÁEGóRì∞¢&WGW&‚"bb"”“'W&÷ÊVÁB#∞¢“íÊ∆VÊwFÉ∞¢ñbÜÊˆÂW&“‚í∞¢6ˆÁ7BfW&&Fñ’GóW2“'&íÊg&ˆ“ÜÊWr6WBávóFÖGóRÊfñ«FW"ÇÜ¢í”‚∞¢6ˆÁ7B"“'4V◊GóT'V6∂WBÜ¢ÊV◊∆˜ñ÷VÁEGóRì∞¢&WGW&‚"bb"”“'W&÷ÊVÁB#∞¢“íÊ÷ÇÜ¢í”‚¢ÊV◊∆˜ñ÷VÁEGóRííì∞¢6ñvÊ«2ÁW6Çá∞¢ñC¢&˜&r÷VÊvvV÷VÁB"¿¢∆&V√¢&VÊvvV÷VÁB÷óÇ"¿¢ˆ'3¢ÊˆÂW&“≤"ˆb"≤vóFÖGóRÊ∆VÊwFÇ≤"∆ófR˜7FñÊw2&RÊˆ‚◊W&÷ÊVÁBáfW&&Fñ”¢"≤fW&&Fñ’GóW2Ê¶ˆñ‚Ç#≤"í≤"í"¿¢“ì∞¢–¢–¢–†¢ÚÚ&W˜7FñÊr&W77W&S¢ÊV"÷ñFVÁFñ6¬FóF∆R6«W7FW'2vóFÜñ‚FÜó2V◊∆˜ñW"w0¢ÚÚ˜v‚∆ófR6WBÜ«&VGíFVGWVB'íWVñBñ‚&W6ˆ«fT6ˆ◊Áí“5$Ù¢”2wV&Bí‡¢ñbÜ‚„“2í∞¢6ˆÁ7B6«W7FW'2“ÊWr÷Çì∞¢¶ˆ'2Êf˜$V6ÇÇÜ¢í”‚∞¢6ˆÁ7B≤“'4Ê˜&’FóF∆RÜ¢ÁFóF∆Rì∞¢ñbÇ≤í&WGW&„∞¢ñbÇ6«W7FW'2ÊÜ2Ü≤íí6«W7FW'2Á6WBÜ≤¬µ“ì∞¢6«W7FW'2ÊvWBÜ≤íÁW6ÇÜ¢ì∞¢“ì∞¢∆WB÷ÑGWR“¬÷ÖFóF∆R“ÁV∆√∞¢6«W7FW'2Êf˜$V6ÇÇÜ∆ó7B¬≤í”‚≤ñbÜ∆ó7BÊ∆VÊwFÇ‚÷ÑGWRí≤÷ÑGWR“∆ó7BÊ∆VÊwFÉ≤÷ÖFóF∆R“∆ó7E≥“ÁFóF∆S≤““ì∞¢ñbÜ÷ÑGWR„“2í∞¢6ñvÊ«2ÁW6Çá∞¢ñC¢&˜&r◊&W˜7B"¿¢∆&V√¢'&W˜7FñÊr&W77W&R"¿¢ˆ'3¢%FÜó2V◊∆˜ñW"Ü2"≤÷ÑGWR≤"ÊV"÷ñFVÁFñ6¬∆ófRG2f˜"¬""≤÷ÖFóF∆R≤%¬""¿¢“ì∞¢–¢–†¢ÚÚ6∆'íFó66∆˜7W&R˜7GW&S¢&WW6RFÜR6÷R6∆'î÷ñ‚Ù÷Ç&W6VÊ6RFW7B0¢ÚÚ&WfñWu7GVFñÚw2ñÊB◊6∆'í‡¢ñbÜ‚„“2í∞¢6ˆÁ7BvóFÖ6∆'í“¶ˆ'2Êfñ«FW"ÇÜ¢í”‚¢Á6∆'î÷ñ‚«¬¢Á6∆'î÷ÇíÊ∆VÊwFÉ∞¢6ˆÁ7B7B“÷FÇÁ&˜VÊBÇávóFÖ6∆'íÚ‚í¢ì∞¢6ñvÊ«2ÁW6Çá∞¢ñC¢&˜&r◊6∆'í"¿¢∆&V√¢'6∆'íFó66∆˜7W&R"¿¢ˆ'3¢vóFÖ6∆'í≤"ˆb"≤‚≤"∆ófR˜7FñÊw27FFR&ÊBÇ"≤7B≤"Rí"¿¢“ì∞¢–†¢ÚÚ&Vvó7G'íf7G3¢WÜ7B5$÷F6ÇˆÊ«í“f7G2¬ÊWfW"'7F'GWg0¢ÚÚñÁ7FóGWFñˆ‚"fW&Fñ7BáFÜBßVFvV÷VÁBó2Ùì„R¬‰ıB$TEíí‡¢∆WB&Vvó7G'í“ÁV∆√∞¢ñbÜV◊&VrbbV◊&VrÁ7FGW2””“&FˆÊR"í∞¢ñbÜV◊&VrÊFFbbV◊&VrÊFFÊ÷F6ÜVB””“&WÜ7B"í∞¢6ˆÁ7BB“V◊&VrÊFF∞¢6ˆÁ7B'G2“µ”∞¢ñbÜBÁ&ñ÷'ï76ñ4FW67&óFñˆ‚í'G2ÁW6ÇÇ%&Vvó7FW&VB2"≤BÁ&ñ÷'ï76ñ4FW67&óFñˆ‚ì∞¢ñbÜBÁ&Vvó7FW&VE6ñÊ6Rí'G2ÁW6ÇÇ&ñÊ6˜'˜&FVB"≤BÁ&Vvó7FW&VE6ñÊ6Rì∞¢&Vvó7G'í“≤÷F6ÜVC¢G'VR¬ˆ'3¢'G2Ê∆VÊwFÇÚ'G2Ê¶ˆñ‚Ç#≤"í¢$5$÷F6Çf˜VÊB'WBÊÚ7FófóGíˆñÊ6˜'˜&Fñˆ‚fñV∆G2ˆ‚&V6˜&B‚"¬Ê÷W6∂W3¢BÊÊ÷W6∂W2«¬”∞¢“V«6R∞¢&Vvó7G'í“≤÷F6ÜVC¢f«6R¬ˆ'3¢$ÊÚWÜ7B5$÷F6Ç"”∞¢–¢–†¢ÚÚ6V7F˜#¢v˜bg2&ófFR¬g&ˆ“«&VGí÷fWF6ÜVB6&VW'2Êv˜bÁ6rw&˜W2‚¢ÚÚ∆ó7FñÊrÜW&Ró2Ê˜BÜVF6˜VÁB“óBó2∆ófR◊˜7FñÊw26˜VÁBÑÙì„BwV&Bí‡¢ÚÚÙì„3¢FVWV‚vóFÇW"÷vVÊ7í'&V∂F˜v‚¬fW&&Fñ“VÊvvV÷VÁBGóR¬ÊB¢ÚÚÊ÷VB◊6˜W&6R&˜fVÊÊ6R∆ñÊR‚V6Ç7FGWF˜'í&ˆ&B'VÁ2ñÊFWVÊFVÁBÖ"–¢ÚÚÊWfW"6ˆ∆∆6RFÜRW"÷vVÊ7í6˜VÁG2ñÁFÚˆÊRVÊñfñVB&v˜fW&Ê÷VÁB"fñwW&R‡¢∆WBv˜e&VB“ÁV∆√∞¢ñbÑ'&íÊó4'&íÜ76tw&˜W2íbb76tw&˜W2Ê∆VÊwFÇ‚í∞¢6ˆÁ7Bv˜e˜7FñÊw2“76tw&˜W2Á&VGV6RÇá7V“¬rí”‚7V“≤ÜrÊ¶ˆ'2ÚrÊ¶ˆ'2Ê∆VÊwFÇ¢í¬ì∞¢6ˆÁ7BW$vVÊ7í“76tw&˜W0¢Ê÷ÇÜrí”‚á≤Ê÷S¢rÊÊ÷R¬6˜VÁC¢rÊ¶ˆ'2ÚrÊ¶ˆ'2Ê∆VÊwFÇ¢“íê¢Á6˜'BÇÜ¬"í”‚"Ê6˜VÁB“Ê6˜VÁBì∞†¢ÚÚVÊvvV÷VÁBGóR7&˜72FÜRv˜b6WB“6÷RfW&&Fñ“72◊Fá&˜VvÇ˜7GW&P¢ÚÚ2FÜR‘4bVÊvvV÷VÁB÷÷óÇ6ñvÊ¬&˜fR¬ÊÚñÁFW'&WFFñˆ‚fW&"‡¢∆WBVÊvvV÷VÁDˆ'2“ÁV∆√∞¢∞¢6ˆÁ7B∆ƒv˜d¶ˆ'2“76tw&˜W2Á&VGV6RÇÜ62¬rí”‚62Ê6ˆÊ6BÜrÊ¶ˆ'2«¬µ“í¬µ“ì∞¢6ˆÁ7BvóFÖGóR“∆ƒv˜d¶ˆ'2Êfñ«FW"ÇÜ¢í”‚¢bb¢ÊV◊∆˜ñ÷VÁEGóRì∞¢ñbávóFÖGóRÊ∆VÊwFÇ‚í∞¢6ˆÁ7BGóT6˜VÁG2“ÊWr÷Çì∞¢vóFÖGóRÊf˜$V6ÇÇÜ¢í”‚≤GóT6˜VÁG2Á6WBÜ¢ÊV◊∆˜ñ÷VÁEGóR¬áGóT6˜VÁG2ÊvWBÜ¢ÊV◊∆˜ñ÷VÁEGóRí«¬í≤ì≤“ì∞¢6ˆÁ7B'G2“'&íÊg&ˆ“áGóT6˜VÁG2¬Ö∑B¬5“í”‚2≤""≤BíÁ6˜'BÇÜ¬"í”‚∞¢6ˆÁ7BÊ“'6TñÁBÜ¬í¬Ê"“'6TñÁBÜ"¬ì∞¢&WGW&‚Ê"“Ê∞¢“ì∞¢VÊvvV÷VÁDˆ'2“'G2Ê¶ˆñ‚Ç"¬"í≤"ˆb"≤vóFÖGóRÊ∆VÊwFÇ≤"6&VW'2Êv˜bÁ6r˜7FñÊw27FFR‚VÊvvV÷VÁBGóR#∞¢–¢–†¢v˜e&VB“∞¢ˆ'3¢$«6Ú∆ó7G2"≤v˜e˜7FñÊw2≤"&ˆ∆R"≤Üv˜e˜7FñÊw2””“Ú""¢'2"í≤"ˆ‚6&VW'2Êv˜bÁ6ráV&∆ñ26W'fñ6Rí7&˜72"≤76tw&˜W2Ê∆VÊwFÇ≤"vVÊ2"≤Ü76tw&˜W2Ê∆VÊwFÇ””“Ú'í"¢&ñW2"í¿¢W$vVÊ7í¿¢VÊvvV÷VÁDˆ'2¿¢&˜fVÊÊ6S¢%6˜W&6S¢6&VW'2Êv˜bÁ6rÑ˜V‚v˜fW&Ê÷VÁB&ˆGV7G2GV◊í"≤Ü76u&WG&ñWfVDBÚ"“&WG&ñWfVB"≤76u&WG&ñWfVDB¢""í≤"“∆ófR∆ó7FñÊw2ñ‚FÜRGV◊¬Ê˜BÜVF6˜VÁB“V6ÇvVÊ7í˜7FGWF˜'í&ˆ&B'VÁ2ñÊFWVÊFVÁBÖ"‚"¿¢”∞¢–†¢&WGW&‚≤6ñvÊ«2¬&Vvó7G'í¬v˜e&VB¬66˜S¢‚”∞ß–†¢ÚÚ"C¢FÜR&˜7FW"ˆbWfW'í˜7FñÊrFÜRV◊∆˜ñW"&VB&WGW&ÊVB¬ÊBvÜWFÜW"GWGí6V7Fñˆ‡¢ÚÚ6˜V∆B7GV∆«í&R&VBg&ˆ“óB‚$ñ‚FÜR6◊∆R"ÊB&6ˆÁG&ñ'WFVBGWFñW2"&RGvÚFñffW&VÁ@¢ÚÚf7G2¬ÊBˆÊ«íFÜR6V6ˆÊB6‚&ˆGV6R6«W7FW"÷V÷&W'6Üó“6ˆÊf∆FñÊrFÜV“÷∂W2‚GfW'@¢ÚÚFÜBññV∆FVBÊÚGWGíFWáB∆ˆˆ≤'6VÁB¬vÜñ6Çó2f«6R7FFV÷VÁB&˜WB&˜fVÊÊ6R&FÜW ¢ÚÚFÜ‚ßW7B÷ó76ñÊr÷&≤‡¢Ú¢ÚÚGWGï&VFó2WÜ7F«íFÜR&VFñ6FRFÜR6«W7FW&W"6ˆÁ7V÷W3¢Êˆ‚÷V◊Gí&W7ˆÁ6ñ&ñ∆óFñW5FWáB‡¢ÚÚíˆ÷6bÊß26WG2FÜBˆ‚UdU%í∆ó7FVB¶ˆ"g&ˆ“FÜR6V&6ÇFW67&óFñˆ‚ÜÊ˜&÷∆ó6T¶ˆ"í¬Ê˜BˆÊ«ê¢ÚÚˆ‚FÜRfWrFÜBvWBFWFñ¬fWF6Ç¬ÊBWáG&7E&W7ˆÁ6ñ&ñ∆óFñW2f∆«2&6≤FÚFÜRvÜˆ∆P¢ÚÚ6∆VÊVBFWáBvÜV‚óBfñÊG2ÊÚ6V7Fñˆ‚ÜVFW"“6ÚóB&WGW&Á2""ˆÊ«ívÜV‚FÜRB6'&ñVBÊ¢ÚÚ&VF&∆RFWáBB∆¬ñ‚FÜó2&VB‚f«6RGWGï&VFFÜW&Vf˜&R∆ñ6VÁ6W2WÜ7F«íˆÊR6∆ñ”†¢ÚÚ&ÊÚGWGíFWáB6÷R&6≤vóFÇFÜó2˜7FñÊr"‚óBFˆW2‰ıB∆ñ6VÁ6R'FÜó2Bv2FˆÚˆ∆BFÚ&P¢ÚÚfWF6ÜVB"áFÜBó26BÁˆíÊFWFñƒfWF6ÜVB¬FñffW&VÁB&VFñ6FRíÊBóBFˆW2‰ıB∆ñ6VÁ6P¢ÚÚ&GWGí6V7Fñˆ‚6˜V∆BÊ˜B&R'6VB"áFÜRf∆∆&6≤÷∂W2FÜBfñ«W&R÷ˆFRVÁ&V6Ü&∆Rí‡¶gVÊ7Fñˆ‚ˆ6ˆ◊Áï&˜7FW"Ü¶ˆ'2í∞¢&WGW&‚Ñ'&íÊó4'&íÜ¶ˆ'2íÚ¶ˆ'2¢µ“íÊ÷ÜgVÊ7Fñˆ‚Ü¢í∞¢&WGW&‚≤WVñC¢¢ÁWVñB«¬""¬FóF∆S¢¢ÁFóF∆R«¬""¬GWGï&VC¢Ü¢Á&W7ˆÁ6ñ&ñ∆óFñW5FWáB«¬""íÁG&ñ“Çí”∞¢“ì∞ß–†¢ÚÚ"C¢¶ˆ"◊FóF∆RÊ˜&÷∆ó6Fñˆ‚f˜"FÜRFóF∆Rf∆∆&6≤Ù‰≈í‡¢ÚÚ˜á&6TÊ˜&“7G&ó2"Ú"ÊB"“"vóFÜ˜WB7V'7FóGWFñÊr76R¬6Ú%6VÊñ˜"÷ÊvW"Ù76ó7FÁ@¢ÚÚFó&V7F˜""“fW'í6ˆ÷÷ˆ‚4rFóF∆Rf˜&““6ˆ∆∆6W2FÚ'6VÊñ˜"÷ÊvW&76ó7FÁBFó&V7F˜" ¢ÚÚÊB6‚ÊWfW"÷F6Ç‚fóÜVBÜW&R&FÜW"FÜ‚ñ‚˜á&6TÊ˜&“¬vÜñ6ÇFÜRGWGí6«W7FW&W"FWVÊG0¢ÚÚˆ„¢6ÜÊvñÊróBv˜V∆B÷˜fR6«W7FW"˜WGWBÊB'&V≤FÜR6Ê6Ü˜BfóáGW&W2‡¢ÚÚFÜó2ó2E$DR¬Ê˜B7G&ñ7Bñ◊&˜fV÷VÁB‚óBvñÁ2$÷ÊvW"Ù˜2"”“$÷ÊvW"˜2"ÊB∆˜6W0¢ÚÚ$R‘6ˆ÷÷W&6R"”“&T6ˆ÷÷W&6R"ÊB$6Ú÷˜&FñÊF˜""”“$6ˆ˜&FñÊF˜""¬vÜñ6Ç˜á&6TÊ˜&“÷F6ÜVB'ê¢ÚÚFV∆WFñÊrFÜR6W&F˜"‚&˜FÇFó&V7FñˆÁ27FíWÜ7BWV∆óGí“ÊÚgWßßívñFVÊñÊr“6ÚFÜR6˜7@¢ÚÚˆbFÜRG&FRó2÷ó76VB÷&≤¬ÊWfW"w&ˆÊrˆÊR‡¶gVÊ7Fñˆ‚ˆ6ˆ◊ÁïFóF∆TÊ˜&“á2í∞¢&WGW&‚˜á&6TÊ˜&“Ö7G&ñÊrá2«¬""íÁ&W∆6RÇıµ¬ı¬’Ú¬Çï“≤ˆr¬""íì∞ß–†¢ÚÚ"s¢FˆW2FÜó2GWGí∆ñÊRFW67&ñ&RFÜR6÷Rv˜&≤26«W7FW"w2&W&W6VÁFFófS¢Ú¢ÚÚFÜR6«W7FW&W"W6VB˜á&6T÷F6Ç¬vÜñ6Ç¶ˆñÁ2ÁíGvÚ∆ñÊW26Ü&ñÊrEtÚ6ˆÁFVÁBv˜&G2‚ˆ‚¢ÚÚ&V¬V◊∆˜ñW"&VBFÜB&ˆGV6VB&w2¬Ê˜B6«W7FW'2‚FÜRv˜&∂VBWÜ◊∆R¬V˜FVBñ‚gV∆¬6¢ÚÚóB6‚&R&R÷6ÜV6∂VBáG'VÊ6FñÊrFÜW6R∆ñÊW2ÜñFW2FÜRfW'íFˆ∂VÁ2FÜB6W6VBFÜR÷W&vRì†¢ÚÚ&W¢$FWfV∆˜ÊBWÜV7WFRFÜR7G&FVvñ2fó6ñˆ‚f˜"FÜRvV«FÇ6ˆ«WFñˆÁ2∆Ff˜&“7&˜70¢ÚÚ6ñ¬∆ñvÊñÊrvóFÇFÜR˜fW&∆¬D%2vV«FÇ6ˆÁFñÁWV“7G&FVwí ¢ÚÚ«6Úñ‚FÜR6÷R6«W7FW#¢%vRvñ∆¬&˜fñFRñ˜RvóFÇ7G'V7GW&VBG&ñÊñÊrÊBˆ‚◊FÜR÷¶ˆ ¢ÚÚG&ñÊñÊrFÚÜV«ñ˜RFWfV∆˜FÜR6∂ñ∆«6WG2ñ˜RÊVVBf˜"6&VW"ñ‚fñÊÊ6ñ¿¢ÚÚ∆ÊÊñÊrÊBvV«FÇ÷ÊvV÷VÁB‚ ¢ÚÚ6Ü&VBFˆ∂VÁ3¢&FWfV∆˜"¬'vV«FÇ"‚GvÚv˜&G2¬Ê˜FÜñÊrFÚFÚvóFÇV6Ç˜FÜW"¬6÷R6«W7FW"‡¢ÚÚ÷V‚ñÁG&÷6«W7FW"6ñ÷ñ∆&óGív2„3RÊBˆÊR&rÜV∆BGvV«fRVÁ&V∆FVB∆ñÊW2‚FÜB÷FP¢ÚÚ&V7W'&VÊ6V÷V‚$‚˜7FñÊw26ˆÁFñÊVB6VÁFVÊ6R6Ü&ñÊrGvÚv˜&G2vóFÇFÜó2ˆÊR"¬Ê˜@¢ÚÚ$‚˜7FñÊw2vÁBFÜó2GWGí"“6ÚÊ˜FÜñÊrF˜vÁ7G&V“6˜V∆BÜˆÊW7F«í&R6ñB&˜WBvÜB‡¢ÚÚV◊∆˜ñW"∂VW2Üó&ñÊrf˜"‡¢Ú¢ÚÚFÜRfóÇ66∆W2FÜR&"vóFÇ6VÁFVÊ6R∆VÊwFÉ¢B∆V7BGvÚ6Ü&VBFˆ∂VÁ2‰BB∆V7BÜ∆`¢ÚÚFÜR6Ü˜'FW"∆ñÊR‚÷V7W&VB˜fW"GvÚ∆ófRV◊∆˜ñW"&VG2¬FÜB&˜VvÜ«íF˜V&∆W26ˆÜW6ñˆ‡¢ÚÚÉ„3R”‚„cBÊB„#Ç”‚„SíÊB7WG2FÜR∆&vW7B&rg&ˆ“GvV«fR∆ñÊW2FÚf˜W"¬vÜñ∆P¢ÚÚFÜRvVÁBFñW"7Fñ∆¬fñ∆«2‚&V7W'&VÊ6RÁV÷&W'2vWB6÷∆∆W"“ÊB7F'B&VñÊrG'VR‡¢Ú¢ÚÚFV∆ñ&W&FV«í‰ıB6ÜÊvRFÚ˜á&6T÷F6Ç¬vÜñ6ÇGvÚVÁ&V∆FVBfVGW&W2«6ÚFWVÊBˆ‚‡¶gVÊ7Fñˆ‚ˆGWGî÷F6ÇÜ¬"í∞¢6ˆÁ7BÊ“˜á&6TÊ˜&“Üí¬Ê"“˜á&6TÊ˜&“Ü"ì∞¢ñbÇÊ«¬Ê"í&WGW&‚f«6S∞¢ñbÜÊ””“Ê"í&WGW&‚G'VS∞¢6ˆÁ7BF“˜á&6UFˆ∑2Üí¬F"“˜á&6UFˆ∑2Ü"ì∞¢ñbÇFÊ∆VÊwFÇ«¬F"Ê∆VÊwFÇí&WGW&‚f«6S∞¢ÚÚDï5Dî‰5B6Ü&VBFW&◊2¬Ê˜Bˆ67W'&VÊ6W2‚6˜VÁFñÊrˆ67W'&VÊ6W2∆WBˆÊR&WVFVBv˜&B6''ê¢ÚÚFÜRvÜˆ∆R÷F6É¢'fVÊF˜"6ˆÁG&7G2ÊB&ˆ7W&V÷VÁB"vñÁ7B'fVÊF˜"÷ÊvV÷VÁB¬fVÊF˜ ¢ÚÚˆÊ&ˆ&FñÊr¬fVÊF˜"W&f˜&÷Ê6R¬fVÊF˜"&ó6≤"66˜&W2B6Ü&VBÊB&FñÚˆb„ˆfbFÜP¢ÚÚ6ñÊv∆Rv˜&B'fVÊF˜""“ÊBFÜR'V∆RFÜó27FFW2ˆ‚67&VV‚&ˆ÷ó6W2GvÚFW&◊2‡¢6ˆÁ7B6“ÊWr6WBáFì∞¢6ˆÁ7B6Ü&VB“ÊWr6WBáF"Êfñ«FW"ÜgVÊ7Fñˆ‚áBí≤&WGW&‚6ÊÜ2áBì≤“ííÁ6ó¶S∞¢ñbá6Ü&VB¬"í&WGW&‚f«6S∞¢6ˆÁ7BF“ÊWr6WBáFíÁ6ó¶R¬F"“ÊWr6WBáF"íÁ6ó¶S∞¢&WGW&‚6Ü&VBÚ÷FÇÊ÷ñ‚ÜF¬F"í„“4Ù’ÂïÙEUEïÙıdU$ƒÙ‘î„∞ß–†¢ÚÚ÷ñ‚4Û"„rVÊvñÊS¢'Vñ∆D6ˆ◊ÁîvVÁG2Ü÷F6Ñw&˜Wí”‚FWFW&÷ñÊó7Fñ2÷ˆFV¬‡¢ÚÚ÷F6Ñw&˜W¢≤Fó7∆îÊ÷R¬6˜VÁB¬¶ˆ'2““¶ˆ'26''í&W7ˆÁ6ñ&ñ∆óFñW5FWáB¬6∂ñ∆«2¬FóF∆R¿¢ÚÚ6FVv˜&ñW2¬WVñB¬÷6eW&¬¬˜7FVDFFR¬GWGîFWFñ¬‡¶gVÊ7Fñˆ‚'Vñ∆D6ˆ◊ÁîvVÁG2Ü÷F6Ñw&˜Wí∞¢6ˆÁ7BvóFÜÜV∆B“µ”∞¢6ˆÁ7B6ˆ◊Áí“÷F6Ñw&˜WÊFó7∆îÊ÷R«¬"#∞¢6ˆÁ7B¶ˆ'2“'&íÊó4'&íÜ÷F6Ñw&˜WÊ¶ˆ'2íÚ÷F6Ñw&˜WÊ¶ˆ'2¢µ”∞†¢ÚÚ““““vóFÜÜˆ∆C¢ñÁ7Vffñ6ñVÁB˜7FñÊw2“““–¢ñbÜ¶ˆ'2Ê∆VÊwFÇ¬4Ù’ÂïÙtTÂEÙ‘îÂıı5Dî‰u2í∞¢ÚÚFÜRvFR6˜VÁG2ı5Dî‰u2¬6ÚFÜR6VÁFVÊ6R◊W7BFˆÚ“'˜7FñÊw26''ññÊrFWFñ∆V@¢ÚÚGWFñW2"Ê÷VBfñ«FW"FÜó2'&Ê6ÇÊWfW"∆ñW2‚ÊBóBÊÚ∆ˆÊvW"&ˆ÷ó6W2'6Ü˜vñÊp¢ÚÚFÜR˜7FñÊw2ˆÊ«í#¢FÜRV◊∆˜ñW"◊6V&6ÇvRFˆW2∆ó7BFÜV“¬'WBFÜRw&ÇÊV¬FÜ@¢ÚÚ«6Ú&VÊFW'2FÜó27G&ñÊrFˆW2Ê˜B¬6ÚFÜR&ˆ÷ó6Rv2f«6Rˆ‚ˆÊRˆbóG2GvÚ7W&f6W2‡¢vóFÜÜV∆BÁW6ÇÇ%FˆÚfWr˜7FñÊw2f˜VÊBf˜"¬""≤6ˆ◊Áí≤%¬"FÚ&VB&V7W'&ñÊrí÷Wá˜6&∆Rv˜&≤&V∆ñ&«í‚Ç"≤¶ˆ'2Ê∆VÊwFÇ≤"˜7FñÊr"≤Ü¶ˆ'2Ê∆VÊwFÇ””“Ú""¢'2"í≤"f˜VÊC≤ÊVVBB∆V7B"≤4Ù’ÂïÙtTÂEÙ‘îÂıı5Dî‰u2≤"í"ì∞¢&WGW&‚≤6ˆ◊Áí¬gVÊ7FñˆÁ3¢µ“¬6«W7FW'3¢µ“¬vVÁG3¢µ“¬˜7FñÊw3¢ˆ6ˆ◊Áï&˜7FW"Ü¶ˆ'2í¬6C¢≤ñÊFñ6F˜'3¢µ“¬6É¢µ“¬∂Wî77V◊FñˆÁ3¢ˆ∂Wî77V◊FñˆÁ2Çí¬ˆì¢≤˜7FñÊw4Ê«ó6VC¢¶ˆ'2Ê∆VÊwFÇ¬GWFñW46«W7FW&VC¢¬FWFñƒfWF6ÜVC¢¬Fs¢'FÜñ‚"““¬vóFÜÜV∆B¬7FG3¢≤˜7FñÊw3¢¶ˆ'2Ê∆VÊwFÇ¬GWFñW3¢¬6«W7FW'3¢¬vVÁG3¢“”∞¢–†¢ÚÚ““““7FW¢GWGíÜ'fW7B“““–¢ÚÚ6˜'B¶ˆ'2'í˜7FVDFFRFW62¬FÜV‚∆ñÊRñÊFWÇf˜"7F&∆RóFW&Fñˆ‚‡¢6ˆÁ7B6˜'FVD¶ˆ'2“¶ˆ'2Á6∆ñ6RÇíÁ6˜'BÜgVÊ7Fñˆ‚Ü¬"í∞¢6ˆÁ7BF“Á˜7FVDFFRÚÊWrFFRÜÁ˜7FVDFFRíÊvWEFñ÷RÇí¢∞¢6ˆÁ7BF"“"Á˜7FVDFFRÚÊWrFFRÜ"Á˜7FVDFFRíÊvWEFñ÷RÇí¢∞¢&WGW&‚F"“F∞¢“ì∞†¢6ˆÁ7BGWGîñÁ7FÊ6W2“µ”∞¢6˜'FVD¶ˆ'2Êf˜$V6ÇÜgVÊ7Fñˆ‚Ü¶ˆ"í∞¢6ˆÁ7BFWáB“¶ˆ"Á&W7ˆÁ6ñ&ñ∆óFñW5FWáB«¬"#∞¢ñbÇFWáBí&WGW&„∞¢6ˆÁ7B∆ñÊW2“FWáBÁ7∆óBÇ%∆‚"íÊ÷ÜgVÊ7Fñˆ‚Ü¬í≤&WGW&‚¬ÁG&ñ“Çì≤“ì∞¢∆ñÊW2Êf˜$V6ÇÜgVÊ7Fñˆ‚Ü∆ñÊRí∞¢ñbÇ∆ñÊRí&WGW&„∞¢6ˆÁ7BFˆ∑2“˜á&6UFˆ∑2Ü∆ñÊRì∞¢ñbáFˆ∑2Ê∆VÊwFÇ¬"í&WGW&„≤ÚÚfWvW"FÜ‚RFˆ∂VÁ2ó2FˆÚ6Ü˜'BáW6Rá&6RFˆ∑22&˜áíê¢ñbÖÙtTÂEÙ$ÙîƒU%ı$RÁFW7BÜ∆ñÊRíí&WGW&„∞¢ñbÖÙtTÂEÙ‰Ù‰EUEïı$RÁFW7BÜ∆ñÊRíí&WGW&„≤ÚÚ4Û"„¢fVÊ6RV«2ˆ&VÊVfóG2˜&WVó&V÷VÁG0¢ñbÖÙtTÂEÙÑTDU%ı$RÁFW7BÜ∆ñÊRíbb∆ñÊRÁ7∆óBÇı«2≤ÚíÊ∆VÊwFÇ√“bí&WGW&„≤ÚÚ4Û"„¢fVÊ6R6V7Fñˆ‚ÜVFW'0¢GWGîñÁ7FÊ6W2ÁW6Çá∞¢FWáC¢∆ñÊR¿¢Fˆ∑3¢Fˆ∑2¿¢&ˆ∆UWVñC¢¶ˆ"ÁWVñB¿¢&ˆ∆UFóF∆S¢¶ˆ"ÁFóF∆R«¬""¿¢g&ˆ‘FWFñ√¢¶ˆ"ÊGWGîFWFñ¬¿¢˜7FVDFFS¢¶ˆ"Á˜7FVDFFR«¬""¿¢“ì∞¢“ì∞¢“ì∞†¢ÚÚ““““vóFÜÜˆ∆C¢ñÁ7Vffñ6ñVÁBGWFñW2“““–¢ñbÜGWGîñÁ7FÊ6W2Ê∆VÊwFÇ¬4Ù’ÂïÙtTÂEÙ‘îÂÙEUDîU2í∞¢vóFÜÜV∆BÁW6ÇÇ%FˆÚfWr7G'V7GW&VBGWGí∆ñÊW2f˜VÊB7&˜72¬""≤6ˆ◊Áí≤%¬"w2˜7FñÊw2FÚ6«W7FW"&V∆ñ&«í“6Ü˜vñÊrFÜR˜7FñÊw2ˆÊ«í‚Ç"≤GWGîñÁ7FÊ6W2Ê∆VÊwFÇ≤"∆ñÊW2f˜VÊC≤ÊVVBB∆V7B"≤4Ù’ÂïÙtTÂEÙ‘îÂÙEUDîU2≤"í"ì∞¢&WGW&‚≤6ˆ◊Áí¬gVÊ7FñˆÁ3¢µ“¬6«W7FW'3¢µ“¬vVÁG3¢µ“¬˜7FñÊw3¢ˆ6ˆ◊Áï&˜7FW"á6˜'FVD¶ˆ'2í¬6C¢≤ñÊFñ6F˜'3¢µ“¬6É¢µ“¬∂Wî77V◊FñˆÁ3¢ˆ∂Wî77V◊FñˆÁ2Çí¬ˆì¢≤˜7FñÊw4Ê«ó6VC¢¶ˆ'2Ê∆VÊwFÇ¬GWFñW46«W7FW&VC¢GWGîñÁ7FÊ6W2Ê∆VÊwFÇ¬FWFñƒfWF6ÜVC¢¶ˆ'2Êfñ«FW"ÜgVÊ7Fñˆ‚Ü¢í≤&WGW&‚¢ÊGWGîFWFñ√≤“íÊ∆VÊwFÇ¬Fs¢'FÜñ‚"““¬vóFÜÜV∆B¬7FG3¢≤˜7FñÊw3¢¶ˆ'2Ê∆VÊwFÇ¬GWFñW3¢GWGîñÁ7FÊ6W2Ê∆VÊwFÇ¬6«W7FW'3¢¬vVÁG3¢“”∞¢–†¢ÚÚ““““7FW¢w&VVGí6ñÊv∆R◊726«W7FW&ñÊr“““–¢f"6«W7FW$∆ó7B“µ”≤ÚÚ≤ñB¬&WGWGí¬&WFˆ∑2¬ñÁ7FÊ6W2¬&ˆ∆UWVñG2¬&ˆ∆UFóF∆W2¬Fˆ∂VÁ2¬6∂ñ∆«2–¢f"6«W7FW$ñE6W“∞†¢GWGîñÁ7FÊ6W2Êf˜$V6ÇÜgVÊ7Fñˆ‚ÜñÁ7Bí∞¢f"f˜VÊB“ÁV∆√∞¢f˜"áf"í“≤í¬6«W7FW$∆ó7BÊ∆VÊwFÉ≤í≤≤í∞¢ñbÖˆGWGî÷F6ÇÜ6«W7FW$∆ó7E∂ï“Á&WGWGí¬ñÁ7BÁFWáBíí≤f˜VÊB“6«W7FW$∆ó7E∂ï”≤'&V≥≤–¢–¢ñbÜf˜VÊBí∞¢f˜VÊBÊñÁ7FÊ6W2ÁW6ÇÜñÁ7Bì∞¢f˜VÊBÁ&ˆ∆UWVñG2ÊFBÜñÁ7BÁ&ˆ∆UWVñBì∞¢f˜VÊBÁ&ˆ∆UFóF∆W2ÊFBÜñÁ7BÁ&ˆ∆UFóF∆Rì∞¢ñÁ7BÁFˆ∑2Êf˜$V6ÇÜgVÊ7Fñˆ‚áBí≤f˜VÊBÁFˆ∂VÁ2ÊFBáBì≤“ì∞¢“V«6R∞¢6«W7FW$ñE6W≤≥∞¢f"¶ˆ"“6˜'FVD¶ˆ'2ÊfñÊBÜgVÊ7Fñˆ‚Ü¢í≤&WGW&‚¢ÁWVñB””“ñÁ7BÁ&ˆ∆UWVñC≤“í«¬∑”∞¢f"6µ6WB“ÊWr6WBÇì∞¢Ü¶ˆ"Á6∂ñ∆«2«¬µ“íÊf˜$V6ÇÜgVÊ7Fñˆ‚á2í≤6µ6WBÊFBáGóVˆb2””“'7G&ñÊr"Ú2¢á2Á6∂ñ∆¬«¬""íì≤“ì∞¢6«W7FW$∆ó7BÁW6Çá∞¢ñC¢&6«W7FW"“"≤6«W7FW$ñE6W¿¢&WGWGì¢ñÁ7BÁFWáB¿¢&WFˆ∑3¢ñÁ7BÁFˆ∑2¿¢ñÁ7FÊ6W3¢∂ñÁ7E“¿¢&ˆ∆UWVñG3¢ÊWr6WBÖ∂ñÁ7BÁ&ˆ∆UWVñE“í¿¢&ˆ∆UFóF∆W3¢ÊWr6WBÖ∂ñÁ7BÁ&ˆ∆UFóF∆U“í¿¢Fˆ∂VÁ3¢ÊWr6WBÜñÁ7BÁFˆ∑2í¿¢6∂ñ∆«3¢6µ6WB¿¢“ì∞¢–¢“ì∞†¢ÚÚ““““7FW#¢Wá˜7W&R&ÊB≤í÷F¶6VÊ7íW"6«W7FW"“““–¢6ˆÁ7BFWFñƒfWF6ÜVD6˜VÁB“¶ˆ'2Êfñ«FW"ÜgVÊ7Fñˆ‚Ü¢í≤&WGW&‚¢ÊGWGîFWFñ√≤“íÊ∆VÊwFÉ∞†¢6ˆÁ7B6«W7FW'2“6«W7FW$∆ó7BÊ÷ÜgVÊ7Fñˆ‚Ü6¬í∞¢6ˆÁ7B&ˆ∆UWVñG2“'&íÊg&ˆ“Ü6¬Á&ˆ∆UWVñG2ì∞¢6ˆÁ7B&ˆ∆UFóF∆W2“'&íÊg&ˆ“Ü6¬Á&ˆ∆UFóF∆W2ì∞¢6ˆÁ7B6∂ñ∆ƒ'"“'&íÊg&ˆ“Ü6¬Á6∂ñ∆«2íÊ÷ÜgVÊ7Fñˆ‚á2í∞¢6ˆÁ7B6˜W&6T¶ˆ"“6˜'FVD¶ˆ'2ÊfñÊBÜgVÊ7Fñˆ‚Ü¢í≤&WGW&‚¢ÁWVñB””“&ˆ∆UWVñG5≥”≤“ì∞¢&WGW&‚≤6∂ñ∆√¢2¬g&ˆ’WVñC¢6˜W&6T¶ˆ"Ú6˜W&6T¶ˆ"ÁWVñB¢&ˆ∆UWVñG5≥“”∞¢“ì∞¢6ˆÁ7B∆ñW"“ˆGWGî∆ñW$ÜñÁBÑ'&íÊg&ˆ“Ü6¬ÁFˆ∂VÁ2íì∞¢6ˆÁ7B∆WfV¬“ˆ∆ñW%FÙWá˜7W&T&ÊBÜ∆ñW"ì∞¢6ˆÁ7BWár“≤ÖT‘„¢¬ƒıs¢¬‘TDïT”¢"¬ÑîtÉ¢2’∂∆WfV≈“«¬∞¢6ˆÁ7B&V7W'&VÊ6R“&ˆ∆UWVñG2Ê∆VÊwFÉ≤ÚÚFó7FñÊ7B˜7FñÊr˜&ˆ∆R6˜VÁ@¢6ˆÁ7BîF¢“ˆîF¶6VÊ7î6˜VÁBá6∂ñ∆ƒ'"Ê÷ÜgVÊ7Fñˆ‚á2í≤&WGW&‚2Á6∂ñ∆√≤“íÊ6ˆÊ6BÑ'&íÊg&ˆ“Ü6¬ÁFˆ∂VÁ2ííì∞¢6ˆÁ7B66˜&R“&V7W'&VÊ6R¢Wás∞¢ÚÚ&˜fVÊÊ6S¢ˆÊRVÁG'íW"Fó7FñÊ7B˜7FñÊrFÜB6ˆÁG&ñ'WFVBñÁ7FÊ6W2‡¢6ˆÁ7B&˜eWVñG2“ÊWr6WBÜ6¬ÊñÁ7FÊ6W2Ê÷ÜgVÊ7Fñˆ‚Üíí≤&WGW&‚íÁ&ˆ∆UWVñC≤“íì∞¢6ˆÁ7B&˜fVÊÊ6R“'&íÊg&ˆ“á&˜eWVñG2íÊ÷ÜgVÊ7Fñˆ‚áWVñBí∞¢6ˆÁ7B¢“6˜'FVD¶ˆ'2ÊfñÊBÜgVÊ7Fñˆ‚áÇí≤&WGW&‚ÇÁWVñB””“WVñC≤“í«¬∑”∞¢&WGW&‚≤WVñB¬FóF∆S¢¢ÁFóF∆R«¬""¬˜7FVDFFS¢¢Á˜7FVDFFR«¬""¬÷6eW&√¢¢Ê÷6eW&¬«¬""¬GWGîFWFñ√¢¢ÊGWGîFWFñ¬”∞¢“ì∞¢ÚÚFWFW&÷ñÊRgVÊ7Fñˆ‰ñC¢÷ˆF¬6FVv˜&ñW5≥“7&˜727ÊÊñÊr&ˆ∆W2‡¢6ˆÁ7B6D6˜VÁG2“∑”∞¢&ˆ∆UWVñG2Êf˜$V6ÇÜgVÊ7Fñˆ‚áWVñBí∞¢6ˆÁ7B¢“6˜'FVD¶ˆ'2ÊfñÊBÜgVÊ7Fñˆ‚áÇí≤&WGW&‚ÇÁWVñB””“WVñC≤“í«¬∑”∞¢6ˆÁ7B6B“Ü¢Ê6FVv˜&ñW2bb¢Ê6FVv˜&ñW5≥“í«¬$vVÊW&¬#∞¢6D6˜VÁG5∂6E““Ü6D6˜VÁG5∂6E“«¬í≤∞¢“ì∞¢6ˆÁ7B÷ˆFƒ6B“ˆ&¶V7BÊ∂Wó2Ü6D6˜VÁG2íÁ6˜'BÜgVÊ7Fñˆ‚Ü¬"í∞¢6ˆÁ7BFñfb“6D6˜VÁG5∂%““6D6˜VÁG5∂”∞¢&WGW&‚Fñfb”“ÚFñfb¢Ê∆ˆ6∆T6ˆ◊&RÜ"ì∞¢“ï≥“«¬$vVÊW&¬#∞¢&WGW&‚∞¢ñC¢6¬ÊñB¿¢&WGWGì¢6¬Á&WGWGí¿¢&ˆ∆UFóF∆W3¢&ˆ∆UFóF∆W2¿¢&ˆ∆UWVñG3¢&ˆ∆UWVñG2¿¢6∂ñ∆«3¢6∂ñ∆ƒ'"¿¢&V7W'&VÊ6S¢&V7W'&VÊ6R¿¢∆WfV√¢∆WfV¬¿¢Wá˜7W&UvVñváC¢Wár¿¢îF¶6VÊ7ì¢îF¢¿¢66˜&S¢66˜&R¿¢&ˆ÷˜FVC¢Wár„“"bb&V7W'&VÊ6R„“4Ù’ÂïÙtTÂEÙ‘îÂı$T5U%$T‰4R¿¢gVÊ7Fñˆ‰ñC¢&f‚“"≤˜á&6TÊ˜&“Ü÷ˆFƒ6BíÁ&W∆6RÇı«2≤ˆr¬"“"í¿¢gVÊ7Fñˆ‰Ê÷S¢÷ˆFƒ6B¿¢&˜fVÊÊ6S¢&˜fVÊÊ6R¿¢”∞¢“ì∞†¢ÚÚ““““vóFÜÜˆ∆C¢ÊÚ6«W7FW"&V6ÜW2Fá&W6Üˆ∆B“““–¢6ˆÁ7B&ˆ÷˜F&∆R“6«W7FW'2Êfñ«FW"ÜgVÊ7Fñˆ‚Ü2í≤&WGW&‚2Á&ˆ÷˜FVC≤“ì∞¢ñbá&ˆ÷˜F&∆RÊ∆VÊwFÇ””“í∞¢vóFÜÜV∆BÁW6ÇÇ$ÊÚGWGí6«W7FW"&V6ÜW2FÜR÷ñÊñ◊V“&V7W'&VÊ6R≤í÷Wá˜7W&RFá&W6Üˆ∆Bá&V7W'&VÊ6R„“"≤4Ù’ÂïÙtTÂEÙ‘îÂı$T5U%$T‰4R≤"‰BWá˜7W&R„“‘TDïT“í“6Ü˜vñÊrFÜR˜7FñÊw2ˆÊ«í‚"ì∞¢–†¢ÚÚ““““7FWC¢6˜'B&ˆ÷˜FVB6«W7FW'2'í&Ê≤“““–¢ÚÚ66˜&RFW62¬îF¶6VÊ7íFW62¬&V7W'&VÊ6RFW62¬&WGWGí∆ˆ6∆T6ˆ◊&R62‡¢6ˆÁ7B6˜'FVD6«W7FW'2“6«W7FW'2Á6∆ñ6RÇíÁ6˜'BÜgVÊ7Fñˆ‚Ü¬"í∞¢ñbÜ"Á66˜&R”“Á66˜&Rí&WGW&‚"Á66˜&R“Á66˜&S∞¢ñbÜ"ÊîF¶6VÊ7í”“ÊîF¶6VÊ7íí&WGW&‚"ÊîF¶6VÊ7í“ÊîF¶6VÊ7ì∞¢ñbÜ"Á&V7W'&VÊ6R”“Á&V7W'&VÊ6Rí&WGW&‚"Á&V7W'&VÊ6R“Á&V7W'&VÊ6S∞¢&WGW&‚Á&WGWGíÊ∆ˆ6∆T6ˆ◊&RÜ"Á&WGWGíì∞¢“ì∞†¢ÚÚ““““7FWS¢gVÊ7FñˆÁ2FñW"“““–¢6ˆÁ7Bf‰÷“∑”∞¢6˜'FVD6«W7FW'2Êf˜$V6ÇÜgVÊ7Fñˆ‚Ü2í∞¢ñbÇf‰÷∂2ÊgVÊ7Fñˆ‰ñE“í∞¢f‰÷∂2ÊgVÊ7Fñˆ‰ñE““≤ñC¢2ÊgVÊ7Fñˆ‰ñB¬Ê÷S¢2ÊgVÊ7Fñˆ‰Ê÷R¬&ˆ∆UWVñG3¢ÊWr6WBÇí¬6«W7FW$ñG3¢µ“”∞¢–¢f‰÷∂2ÊgVÊ7Fñˆ‰ñE“Ê6«W7FW$ñG2ÁW6ÇÜ2ÊñBì∞¢2Á&ˆ∆UWVñG2Êf˜$V6ÇÜgVÊ7Fñˆ‚áRí≤f‰÷∂2ÊgVÊ7Fñˆ‰ñE“Á&ˆ∆UWVñG2ÊFBáRì≤“ì∞¢“ì∞¢6ˆÁ7BgVÊ7FñˆÁ2“ˆ&¶V7BÁf«VW2Üf‰÷íÊ÷ÜgVÊ7Fñˆ‚Üf‚í∞¢&WGW&‚≤ñC¢f‚ÊñB¬Ê÷S¢f‚ÊÊ÷R¬&ˆ∆UWVñG3¢'&íÊg&ˆ“Üf‚Á&ˆ∆UWVñG2í¬6«W7FW$ñG3¢f‚Ê6«W7FW$ñG2”∞¢“íÁ6˜'BÜgVÊ7Fñˆ‚Ü¬"í≤&WGW&‚ÊÊ÷RÊ∆ˆ6∆T6ˆ◊&RÜ"ÊÊ÷Rì≤“ì∞†¢ÚÚ““““vVÁB6ÊFñFFW2á&ˆ÷˜FVB6«W7FW'2ˆÊ«íí“““–¢6ˆÁ7BvVÁG2“6˜'FVD6«W7FW'0¢Êfñ«FW"ÜgVÊ7Fñˆ‚Ü2í≤&WGW&‚2Á&ˆ÷˜FVC≤“ê¢Á6∆ñ6RÉ¬4Ù’ÂïÙtTÂEÙ‘ÖÙtTÂE2ê¢Ê÷ÜgVÊ7Fñˆ‚Ü2í∞¢&WGW&‚∞¢ñC¢&vVÁB“"≤2ÊñB¿¢∆&V√¢&‚vVÁBFÜB"≤˜fW&$∆VEá&6RÜ2Á&WGWGíí¿¢7Á5&ˆ∆W3¢2Á&ˆ∆UFóF∆W2Á6∆ñ6RÇí¿¢&V7W'&VÊ6S¢2Á&V7W'&VÊ6R¿¢∆WfV√¢2Ê∆WfV¬¿¢66˜&S¢2Á66˜&R¿¢6«W7FW$ñC¢2ÊñB¿¢gVÊ7Fñˆ‰ñC¢2ÊgVÊ7Fñˆ‰ñB¿¢Ê'&Fñˆ„¢ÁV∆¬¿¢”∞¢“ì∞†¢ÚÚ““““4B'FVf7G2“““–¢6ˆÁ7BñÊFñ6F˜'2“6«W7FW'2Ê÷ÜgVÊ7Fñˆ‚Ü2í∞¢&WGW&‚≤6«W7FW$ñC¢2ÊñB¬&V7W'&VÊ6S¢2Á&V7W'&VÊ6R¬Wá˜7W&S¢2ÊWá˜7W&UvVñváB¬îF¶6VÊ7ì¢2ÊîF¶6VÊ7í”∞¢“ì∞¢6ˆÁ7B6Ç“gVÊ7FñˆÁ2Ê÷ÜgVÊ7Fñˆ‚Üf‚í∞¢6ˆÁ7Báó“ˆ6Ñáó˜FÜW6ó2Üf‚Ê6«W7FW$ñG2¬6«W7FW'2ì∞¢&WGW&‚≤gVÊ7Fñˆ‰ñC¢f‚ÊñB¬gVÊ7Fñˆ„¢f‚ÊÊ÷R¬F˜¢áóÁF˜¬'VÊÊW%W¢áóÁ'VÊÊW%W¬WfñFVÊ6S¢áóÊWfñFVÊ6R«¬f‚Ê6«W7FW$ñG2”∞¢“ì∞¢6ˆÁ7BˆïFr“˜ˆïFrÜFWFñƒfWF6ÜVD6˜VÁB¬GWGîñÁ7FÊ6W2Ê∆VÊwFÇì∞†¢6ˆÁ7B7FG2“∞¢˜7FñÊw3¢¶ˆ'2Ê∆VÊwFÇ¿¢GWFñW3¢GWGîñÁ7FÊ6W2Ê∆VÊwFÇ¿¢6«W7FW'3¢6«W7FW'2Ê∆VÊwFÇ¿¢vVÁG3¢vVÁG2Ê∆VÊwFÇ¿¢”∞†¢6ˆÁ7B6B“∞¢ñÊFñ6F˜'3¢ñÊFñ6F˜'2¿¢6É¢6Ç¿¢∂Wî77V◊FñˆÁ3¢ˆ∂Wî77V◊FñˆÁ2Çí¿¢ˆì¢≤˜7FñÊw4Ê«ó6VC¢¶ˆ'2Ê∆VÊwFÇ¬GWFñW46«W7FW&VC¢GWGîñÁ7FÊ6W2Ê∆VÊwFÇ¬FWFñƒfWF6ÜVC¢FWFñƒfWF6ÜVD6˜VÁB¬Fs¢ˆïFr“¿¢”∞†¢&WGW&‚≤6ˆ◊Áí¬gVÊ7FñˆÁ2¬6«W7FW'3¢6˜'FVD6«W7FW'2¬vVÁG2¬˜7FñÊw3¢ˆ6ˆ◊Áï&˜7FW"á6˜'FVD¶ˆ'2í¬6B¬vóFÜÜV∆B¬7FG2”∞ß–†¶gVÊ7Fñˆ‚ˆ∂Wî77V◊FñˆÁ2Çí∞¢&WGW&‚∞¢$GWGíFWáB&Vf∆V7G2&V¬v˜&≤¬Ê˜B&ˆñ∆W'∆FR“&ˆñ∆W'∆FR∆ñÊW2&Rfñ«FW&VB'WBG'VÊ6Fñˆ‚÷í7Fñ∆¬ffV7BV∆óGí‚"¿¢$‘4b6FVv˜&ñW2÷6∆VÊ«íFÚ'W6ñÊW72gVÊ7FñˆÁ2“˜7FñÊrfñ∆VBVÊFW"tñÊf˜&÷Fñˆ‚FV6ÜÊˆ∆ˆwír÷íñÊ6«VFRÊˆ‚‘ïBGWFñW2‚"¿¢%FÜR6◊∆VB˜7FñÊw2&W&W6VÁBFÜRV◊∆˜ñW"w27W'&VÁBÜó&ñÊr&ñ˜&óFñW2¬Ê˜BFÜRgV∆¬v˜&∂f˜&6R‚"¿¢%&V7W'&VÊ6R7&˜72G2ó2&˜áíf˜"&V7W'&VÊ6Rˆbv˜&≤“GWGíV&ñÊrñ‚2G2FˆW2Ê˜BwV&ÁFVRóBÜVÁ22Fñ÷W2W"Fí‚"¿¢%GvÚñFVÁFñ6¬GWGí∆ñÊW2«vó2w&˜W‚˜FÜW'vó6R∆ñÊR¶ˆñÁ2w&˜WvÜV‚óB6Ü&W2B∆V7BGvÚFó7FñÊ7BFW&◊2vóFÇFÜR∆ñÊRFÜBıT‰TBFÜBw&˜W“Ê˜BvóFÇWfW'í∆ñÊR«&VGíñ‚óB“ÊBFÜ˜6R6Ü&VBFW&◊26˜fW"B∆V7BÜ∆bFÜRFó7FñÊ7FófRv˜&G2ˆbvÜñ6ÜWfW"ˆbFÜRGvÚ∆ñÊW2Ü2fWvW"‚6Ü˜'BÊBfW'í6ˆ÷÷ˆ‚v˜&G2&RñvÊ˜&VB¬6ÚwFÜRr¬vÊBrÊBvVÁ7W&RrÊWfW"6˜VÁB‚óBó27Fñ∆¬FWáB÷F6Ç¬6ÚóB6‚÷W&vRGvÚGWFñW2˜"7∆óBˆÊRñ‚GvÚ“FÜR&˜fVÊÊ6RÊV¬∆WG2ñ˜RfW&ñgí‚"¿¢”∞ß–†¢ÚÚ4Û"„É¢6ˆ◊ÁîvVÁG5FÙ∂uñ∆ˆBÜ÷ˆFV¬í”‚¥tw&Ç÷6ˆ◊Fñ&∆R≤fW'6ñˆ„¢&∂s"¬ÊˆFW2¬VFvW2¬6«W7FW'2¬7FG2¬vóFÜÜV∆B“‡¢ÚÚ÷2Fá&VRFñW'2ÜgVÊ7FñˆÁ2ÚGWFñW2ÚvVÁG2íˆÁFÚFÜR6«W7FW"÷∆ÊRñ∆ˆB6ÜR‡¶gVÊ7Fñˆ‚6ˆ◊ÁîvVÁG5FÙ∂uñ∆ˆBÜ÷ˆFV¬í∞¢ñbÇ÷ˆFV¬í&WGW&‚ÁV∆√∞¢6ˆÁ7BÊˆFW2“µ”∞¢6ˆÁ7BVFvW2“µ”∞†¢ÚÚgVÊ7Fñˆ‚ÊˆFW2áFñW"ê¢÷ˆFV¬ÊgVÊ7FñˆÁ2Êf˜$V6ÇÜgVÊ7Fñˆ‚Üf‚í∞¢ÊˆFW2ÁW6Çá≤ñC¢f‚ÊñB¬GóS¢&˜&vÊó6Fñˆ‚"¬∆&V√¢f‚ÊÊ÷R¬6«W7FW#¢&gVÊ7FñˆÁ2"¬6˜W&6S¢&÷6b"¬6ˆÊfñFVÊ6S¢&g&ˆ“‘4b6FVv˜'í"“ì∞¢“ì∞†¢ÚÚ6«W7FW"ˆGWGíÊˆFW2áFñW""í‚4Û"„¢6FÚFÜRF˜6«W7FW'2'í&V7W'&VÊ6R6ÚFÜP¢ÚÚFñW"7Fó266ÊÊ&∆S≤«vó2∂VW6«W7FW'2FÜB&6≤‚vVÁB6ÊFñFFR6ÚFÜP¢ÚÚGWGí”‚vVÁBVFvW2ÊWfW"FÊv∆R‡¢6ˆÁ7BˆvVÁD6«W7FW$ñG2“ÊWr6WBÜ÷ˆFV¬ÊvVÁG2Ê÷ÜgVÊ7Fñˆ‚Üí≤&WGW&‚Ê6«W7FW$ñC≤“íì∞¢6ˆÁ7BˆGWGî6«W7FW'2“÷ˆFV¬Ê6«W7FW'2Á6∆ñ6RÇê¢Á6˜'BÜgVÊ7Fñˆ‚Ü¬"í≤&WGW&‚Ü"Á&V7W'&VÊ6R“Á&V7W'&VÊ6Rí«¬Á&WGWGíÊ∆ˆ6∆T6ˆ◊&RÜ"Á&WGWGíì≤“ê¢Êfñ«FW"ÜgVÊ7Fñˆ‚Ü2¬íí≤&WGW&‚í¬4Ù’ÂïÙtTÂEÙ‘ÖÙEUDîU2«¬ˆvVÁD6«W7FW$ñG2ÊÜ2Ü2ÊñBì≤“ì∞¢ˆGWGî6«W7FW'2Êf˜$V6ÇÜgVÊ7Fñˆ‚Ü2í∞¢6ˆÁ7B&˜d∂Wí“2Ê∆WfV¬””“$ÖT‘‚"Ú'7Fó2áV÷‚"¢VÊFVfñÊVC∞¢ÊˆFW2ÁW6Çá∞¢ñC¢2ÊñB¿¢GóS¢&GWGí"¿¢∆&V√¢2Á&WGWGíÁ6∆ñ6RÉ¬##í¿¢6«W7FW#¢&GWFñW2"¿¢6˜W&6S¢&FW&ófVB"¿¢6ˆÊfñFVÊ6S¢2Á&ˆ÷˜FVBÚ'&ˆ÷˜FVB"¢á&˜d∂Wí«¬""í¿¢∆WfV√¢2Ê∆WfV¬¿¢ÚÚGF6Ç6«W7FW"FFf˜"6ñFRÊV¬∆ˆˆ∑W‡¢ˆ6«W7FW$FF¢2¿¢“ì∞¢ÚÚVFvS¢gVÊ7Fñˆ‚”‚GWGí6«W7FW ¢VFvW2ÁW6Çá≤6˜W&6S¢2ÊgVÊ7Fñˆ‰ñB¬F&vWC¢2ÊñB¬fW&#¢'&V7W'2ñ‚"¬vVñváC¢2Á&V7W'&VÊ6R¬6˜W&6U˜Fs¢&FW&ófVB"“ì∞¢“ì∞†¢ÚÚvVÁB6ÊFñFFRÊˆFW2áFñW"2ê¢÷ˆFV¬ÊvVÁG2Êf˜$V6ÇÜgVÊ7Fñˆ‚Ürí∞¢ÊˆFW2ÁW6Çá∞¢ñC¢rÊñB¿¢GóS¢&vVÁB"¿¢∆&V√¢rÊ∆&V¬Á6∆ñ6RÉ¬##í¿¢6«W7FW#¢&vVÁG2"¿¢6˜W&6S¢&FW&ófVB"¿¢6ˆÊfñFVÊ6S¢'66˜&R"≤rÁ66˜&R¿¢∆WfV√¢rÊ∆WfV¬¿¢ˆvVÁDFF¢r¿¢ˆ6«W7FW$FF¢÷ˆFV¬Ê6«W7FW'2ÊfñÊBÜgVÊ7Fñˆ‚Ü2í≤&WGW&‚2ÊñB””“rÊ6«W7FW$ñC≤“í«¬ÁV∆¬¿¢“ì∞¢ÚÚVFvS¢GWGí”‚vVÁ@¢VFvW2ÁW6Çá≤6˜W&6S¢rÊ6«W7FW$ñB¬F&vWC¢rÊñB¬fW&#¢&6˜V∆B&V6ˆ÷R"¬vVñváC¢rÁ66˜&R¬6˜W&6U˜Fs¢&FW&ófVB"“ì∞¢“ì∞†¢6ˆÁ7B&W6VÁD6«W7FW'2“∞¢≤ñC¢&gVÊ7FñˆÁ2"¬∆&V√¢$gVÊ7FñˆÁ2"¬&W6VÁC¢÷ˆFV¬ÊgVÊ7FñˆÁ2Ê∆VÊwFÇ‚“¿¢≤ñC¢&GWFñW2"¬∆&V√¢%&V7W'&ñÊrGWFñW2"¬&W6VÁC¢÷ˆFV¬Ê6«W7FW'2Ê∆VÊwFÇ‚“¿¢≤ñC¢&vVÁG2"¬∆&V√¢$vVÁB6ÊFñFFW2"¬&W6VÁC¢÷ˆFV¬ÊvVÁG2Ê∆VÊwFÇ‚“¿¢”∞†¢&WGW&‚∞¢fW'6ñˆ„¢&∂s"¿¢ÊˆFW3¢ÊˆFW2¿¢VFvW3¢VFvW2¿¢6«W7FW'3¢&W6VÁD6«W7FW'2¿¢7FG3¢≤ÊˆFW3¢ÊˆFW2Ê∆VÊwFÇ¬VFvW3¢VFvW2Ê∆VÊwFÇ¬6«W7FW'5&W6VÁC¢&W6VÁD6«W7FW'2Êfñ«FW"ÜgVÊ7Fñˆ‚Ü2í≤&WGW&‚2Á&W6VÁC≤“íÊ∆VÊwFÇ“¿¢vóFÜÜV∆C¢÷ˆFV¬ÁvóFÜÜV∆B«¬µ“¿¢ÚÚ6''íFÜRgV∆¬÷ˆFV¬6ÚFÜR6ñFRÊV¬6‚∆ˆˆ≤WFWFñ«2'íÊˆFRñB‡¢ˆvVÁG4÷ˆFV√¢÷ˆFV¬¿¢”∞ß–†¢ÚÚ"BÜ'Vñ∆B˜&FW"¬3”rs#bì¢vÜñ6Ç6ˆ◊Áí÷w&ÇÊˆFW2G&6R&6≤FÚDÑï2˜7FñÊr‡¢ÚÚW&R6WB÷V÷&W'6Üó˜fW"FÜR÷ˆFV¬w2˜v‚&ˆ∆UWVñG2Ú&ˆ∆UFóF∆W2“ÊÚ66˜&ñÊr¬Ê¢ÚÚ6ñ÷ñ∆&óGí¬ÊÚƒƒ“‚GvÚ&6W2¬ÊBFÜR6∆∆W"Ê÷W2vÜñ6ÜWfW"ˆÊRv2W6VBˆ‚67&VV‚6¢ÚÚFÜR&VFW"∂Ê˜w2Ü˜r7G&ˆÊrFÜR6∆ñ“ó3†¢ÚÚ'WVñB"“FÜó2˜7FñÊrw2˜v‚‘4bñBó2÷ˆÊrFÜRñG2FÜR6«W7FW"v2'Vñ«Bg&ˆ“‚FÜP¢ÚÚ6«W7FW"vVÁVñÊV«í6ˆÁFñÁ2v˜&≤g&ˆ“FÜó2GfW'B‡¢ÚÚ'FóF∆R"“ÊÚ6«W7FW"v2'Vñ«Bg&ˆ“FÜó2GfW'B¬6ÚFÜRf∆∆&6≤ó2‚WÜ7BÊ˜&÷∆ó6V@¢ÚÚ¶ˆ"◊FóF∆R÷F6Ç‚FÜB6ó2&˜7FñÊrFóF∆VBFÜR6÷R6óG2ÜW&R"¬Ê˜B'FÜó0¢ÚÚ˜7FñÊr6óG2ÜW&R"‡¢ÚÚÊVóFÜW"÷F6ÜñÊs¢&WGW&Á2‚V◊Gí6WB¬ÊBFÜR6∆∆W"6ó2Ê˜FÜñÊró2÷&∂VB&FÜW ¢ÚÚFÜ‚wVW76ñÊr˜6óFñˆ‚f˜"FÜR&ˆ∆R‡¢Ú¢ÚÚ&W6VÊ6Vó24U$DRf7BÊB◊W7BÊ˜B&RñÊfW'&VBg&ˆ“FÜR&6ó2‚FÜRV◊∆˜ñW"&V@¢ÚÚ∆ó7G2WFÚS˜7FñÊw2'WBˆÊ«íFWFñ¬÷fWF6ÜW2FÜRÊWvW7BfWr¬6Ú‚GfW'B6‚&Rñ‡¢ÚÚFÜR6◊∆RÊB7Fñ∆¬6ˆÁG&ñ'WFRÊÚGWFñW2“&W˜'FñÊrFÜB2&Ê˜B÷ˆÊrFÜR˜7FñÊw0¢ÚÚ&VBÜW&R"v˜V∆B&Rf«6R&˜fVÊÊ6R6∆ñ“¬Ê˜B÷W&V«í÷ó76ñÊr÷&≥†¢ÚÚ&GWGí◊&VB"“ñ‚FÜR&˜7FW"¬ÊBGWGí6V7Fñˆ‚v2&VBg&ˆ“óB‡¢ÚÚ&∆ó7FVB÷Ê˜B◊&VB"“ñ‚FÜR&˜7FW"¬'WBÊÚGWGíFWáB6÷R&6≤vóFÇóBñ‚FÜó2&VB‡¢ÚÚÊ˜FÜñÊróB6ó26˜V∆BÜfR&V6ÜVB6«W7FW"¬vÜFWfW"FÜR÷&≤ó2‡¢ÚÚ&'6VÁB"“Ü2‚ñB¬ÊBFÜBñBó2Ê˜Bñ‚FÜR&˜7FW"‡¢ÚÚ&÷F6ÜVB◊VÊG&v‚"“FÜRñB÷F6ÜVB6«W7FW'2¬'WBÊˆÊRˆbFÜV“÷FRFÜRG&v‚GWGíFñW"‡¢ÚÚÊ˜FÜñÊrFÚ÷&≤¬ÊB‰ıBFóF∆R÷f∆∆&6≤66S¢FÜRGfW'Bv0¢ÚÚñFVÁFñfñVBWÜ7F«í¬6Ú6ññÊr&÷í&RFñffW&VÁBGfW'B"v˜V∆B&P¢ÚÚv˜'6R6∆ñ“FÜ‚6ññÊrÊ˜FÜñÊr‡¢ÚÚ&7&˜72◊6˜W&6R"“FÜó2GfW'B6÷Rg&ˆ“6&VW'2Êv˜bÁ6r¬vÜ˜6RWVñG2&R7ñÁFÜWFñ0¢ÚÚÇ&76sß∑∆Ff˜&◊”ß∂¶ˆ$ñG”ß∑˜7FñÊtÊ˜“"¬6VRíˆ6&VW'2Êß2í‚FÜP¢ÚÚV◊∆˜ñW"w&Çó2&VBg&ˆ“◊î6&VW'4gWGW&R¬6ÚFÜRGvÚñB76W0¢ÚÚ6ÊÊ˜B÷VWC¢‚ñB6ˆ◊&ó6ˆ‚ÜW&R6‚ˆÊ«íWfW"fñ¬¬ÊB&W˜'FñÊp¢ÚÚFÜBfñ«W&R2&Ê˜Bf˜VÊB"v˜V∆B&∆÷RFÜRFFf˜"FÜR÷ó6÷F6Ç‡¢ÚÚ'VÊ∂Ê˜v‚"“FÜR÷ˆFV¬&VFFW2FÜR&˜7FW"ÜFVfVÁ6ófS≤ÊÚ&˜7FW"6ÜóVBí‡¢Ú¢ÚÚ&W6VÁDñG6¬vÜV‚vófV‚¬ó2FÜR6WBˆbÊˆFRñG2FÜRñ∆ˆB7GV∆«íE$Ur‚FÜRGWGíFñW ¢ÚÚó26VB¬6Ú÷F6ÜVB6«W7FW"6‚WÜó7Bñ‚FÜR÷ˆFV¬vóFÇÊÚÊˆFRˆ‚67&VV„≤6˜VÁFñÊró@¢ÚÚv˜V∆BFV∆¬FÜR&VFW"6ˆ÷WFÜñÊró2÷&∂VBFÜBFÜWí6ÊÊ˜BfñÊB‚ñG2ÊB6«W7FW$6˜VÁB&P¢ÚÚ&˜FÇ&W˜'FVB˜7B÷ñÁFW'6V7Fñˆ‚“vÜBó26∆ñ÷VBó2vÜBó2G&v‚‡¢ÚÚ&WGW&Á2≤ñG2¬&6ó2¬6«W7FW$6˜VÁB¬&W6VÊ6R“‡¶gVÊ7Fñˆ‚6ˆ◊ÁîÊˆFW4f˜%&ˆ∆RÜ÷ˆFV¬¬◊ïWVñB¬◊ïFóF∆R¬&W6VÁDñG2í∞¢6ˆÁ7BWVñB“7G&ñÊrÜ◊ïWVñB«¬""íÁG&ñ“Çì∞¢6ˆÁ7BFÊ˜&““ˆ6ˆ◊ÁïFóF∆TÊ˜&“Ü◊ïFóF∆Rì∞¢6ˆÁ7B&˜7FW"“'&íÊó4'&íÜ÷ˆFV¬bb÷ˆFV¬Á˜7FñÊw2íÚ÷ˆFV¬Á˜7FñÊw2¢ÁV∆√∞¢∆WB&W6VÊ6R“'VÊ∂Ê˜v‚#∞¢ñbáWVñBÊñÊFWÑˆbÇ&76s¢"í””“í∞¢&W6VÊ6R“&7&˜72◊6˜W&6R#∞¢“V«6Rñbá&˜7FW"bbWVñBí∞¢ÚÚˆÊ«í6∆ñ“&'6VÁB"&˜WB‚ñBFÜBWÜó7G2‚vóFÇÊÚñBFÜW&Ró2Ê˜FÜñÊrFÚ∆ˆˆ≤W¿¢ÚÚÊB6ññÊr'FÜó2GfW'Bw2îBó2Ê˜B÷ˆÊrFÜR˜7FñÊw2"v˜V∆BFW67&ñ&R÷ó76ñÊrFÜñÊr‡¢6ˆÁ7B&˜r“&˜7FW"ÊfñÊBÜgVÊ7Fñˆ‚áí≤&WGW&‚ÁWVñB””“WVñC≤“ì∞¢&W6VÊ6R“&˜rÚá&˜rÊGWGï&VBÚ&GWGí◊&VB"¢&∆ó7FVB÷Ê˜B◊&VB"í¢&'6VÁB#∞¢–¢6ˆÁ7BV◊Gí“≤ñG3¢µ“¬&6ó3¢ÁV∆¬¬6«W7FW$6˜VÁC¢¬&W6VÊ6R”∞¢ñbÇ÷ˆFV¬«¬'&íÊó4'&íÜ÷ˆFV¬Ê6«W7FW'2íí&WGW&‚V◊Gì∞†¢6ˆÁ7BG&v‚“&W6VÁDñG2ñÁ7FÊ6Vˆb6WBÚ&W6VÁDñG2¢ÁV∆√∞¢6ˆÁ7Bó4G&v‚“gVÊ7Fñˆ‚ÜñBí≤&WGW&‚G&v‚«¬G&v‚ÊÜ2ÜñBì≤”∞†¢ÚÚ÷F6ÜVB6«W7FW"6'&ñW2óG2gVÊ7Fñˆ‚áFñW"íÊBÁívVÁB6ÊFñFFR'Vñ«Bg&ˆ“ó@¢ÚÚáFñW"2ívóFÇóB¬6ÚFÜR÷&≤&VG22FÇFá&˜VvÇFÜRw&Ç&FÜW"FÜ‚∆ˆÊRF˜B‡¢gVÊ7Fñˆ‚6ˆ∆∆V7Bá&VBí∞¢6ˆÁ7B÷F6ÜVB“÷ˆFV¬Ê6«W7FW'2Êfñ«FW"á&VBì∞¢ñbÜ÷F6ÜVBÊ∆VÊwFÇ””“í&WGW&‚ÁV∆√∞¢6ˆÁ7BñG2“ÊWr6WBÇì∞¢6ˆÁ7B6«W7FW$ñG2“ÊWr6WBÇì∞¢÷F6ÜVBÊf˜$V6ÇÜgVÊ7Fñˆ‚Ü2í∞¢ñbÇó4G&v‚Ü2ÊñBíí&WGW&„≤ÚÚ6VB˜WBˆbFÜRGWGíFñW"“6∆ñ“ˆÊ«ívÜBó2ˆ‚67&VV‡¢ñG2ÊFBÜ2ÊñBì∞¢6«W7FW$ñG2ÊFBÜ2ÊñBì∞¢ñbÜ2ÊgVÊ7Fñˆ‰ñBbbó4G&v‚Ü2ÊgVÊ7Fñˆ‰ñBííñG2ÊFBÜ2ÊgVÊ7Fñˆ‰ñBì∞¢“ì∞¢Ü÷ˆFV¬ÊvVÁG2«¬µ“íÊf˜$V6ÇÜgVÊ7Fñˆ‚Üí∞¢ñbÜ6«W7FW$ñG2ÊÜ2ÜÊ6«W7FW$ñBíbbó4G&v‚ÜÊñBííñG2ÊFBÜÊñBì∞¢“ì∞¢ñbÜñG2Á6ó¶R””“í&WGW&‚ÁV∆√≤ÚÚ÷F6ÜVBñ‚FÜR÷ˆFV¬¬G&v‚Ê˜vÜW&R“Ê˜FÜñÊrFÚ6∆ñ–¢&WGW&‚≤ñG3¢'&íÊg&ˆ“ÜñG2í¬6«W7FW$6˜VÁC¢6«W7FW$ñG2Á6ó¶R”∞¢–†¢ñbáWVñBbb&W6VÊ6R”“&7&˜72◊6˜W&6R"í∞¢6ˆÁ7BWVñE&VB“gVÊ7Fñˆ‚Ü2í≤&WGW&‚Ü2Á&ˆ∆UWVñG2«¬µ“íÊñÊFWÑˆbáWVñBí”“”≤”∞¢6ˆÁ7B'ïWVñB“6ˆ∆∆V7BáWVñE&VBì∞¢ñbÜ'ïWVñBí&WGW&‚≤ñG3¢'ïWVñBÊñG2¬&6ó3¢'WVñB"¬6«W7FW$6˜VÁC¢'ïWVñBÊ6«W7FW$6˜VÁB¬&W6VÊ6R”∞¢ÚÚFÜRñBDîB÷F6Ç6«W7FW'2¬'WBWfW'íˆÊRˆbFÜV“ó2˜WG6ñFRFÜRG&v‚GWGíFñW"‡¢ÚÚf∆∆ñÊrFá&˜VvÇFÚFÜRFóF∆Rf∆∆&6≤ÜW&Rv˜V∆B&ñÁB&÷F6ÜVBˆ‚¶ˆ"FóF∆R¬Ê˜@¢ÚÚ˜7FñÊrîB‚‚‚÷í&RFñffW&VÁBGfW'B"&˜WB‚GfW'BvR÷F6ÜVB'íîBWÜ7F«í‡¢ñbÜ÷ˆFV¬Ê6«W7FW'2Á6ˆ÷RáWVñE&VBíí∞¢&WGW&‚≤ñG3¢µ“¬&6ó3¢ÁV∆¬¬6«W7FW$6˜VÁC¢¬&W6VÊ6S¢&÷F6ÜVB◊VÊG&v‚"”∞¢–¢–¢ñbáFÊ˜&“í∞¢6ˆÁ7B'ïFóF∆R“6ˆ∆∆V7BÜgVÊ7Fñˆ‚Ü2í∞¢&WGW&‚Ü2Á&ˆ∆UFóF∆W2«¬µ“íÁ6ˆ÷RÜgVÊ7Fñˆ‚áBí≤&WGW&‚ˆ6ˆ◊ÁïFóF∆TÊ˜&“áBí””“FÊ˜&”≤“ì∞¢“ì∞¢ñbÜ'ïFóF∆Rí&WGW&‚≤ñG3¢'ïFóF∆RÊñG2¬&6ó3¢'FóF∆R"¬6«W7FW$6˜VÁC¢'ïFóF∆RÊ6«W7FW$6˜VÁB¬&W6VÊ6R”∞¢–¢&WGW&‚V◊Gì∞ß–†¢ÚÚ4Û"„É¢6ˆ◊ÁîvVÁE6ñFUÊV¬“ÊˆFR÷FWFñ¬6ñFRÊV¬˜VÊVBfñˆ‰ÊˆFUF‡¢ÚÚ6Ü˜w2$6ˆÊÊV7FVBFÚ"á&ˆ∆W2≤6∂ñ∆«2íÊB$g&ˆ“FÜW6R˜7FñÊw2"á&˜fVÊÊ6Rí‡¢ÚÚCGÇF&vWG2¬&ñ¬ÊÚ&VBˆw&VV‚‡¶gVÊ7Fñˆ‚6ˆ◊ÁîvVÁE6ñFUÊV¬á≤ÊˆFTñB¬∂uñ∆ˆB¬ˆ‰6∆˜6R¬ñÊ∆ñÊR“í∞¢ñbÇÊˆFTñB«¬∂uñ∆ˆBí&WGW&‚ÁV∆√∞¢6ˆÁ7B÷ˆFV¬“∂uñ∆ˆBÂˆvVÁG4÷ˆFV√∞¢ñbÇ÷ˆFV¬í&WGW&‚ÁV∆√∞†¢ÚÚfñÊBFÜRÊˆFRFÚvWBóG26«W7FW"ˆvVÁBFF‡¢6ˆÁ7B∂tÊˆFR“∂uñ∆ˆBÊÊˆFW2ÊfñÊBÜgVÊ7Fñˆ‚Ü‚í≤&WGW&‚‚ÊñB””“ÊˆFTñC≤“ì∞¢ñbÇ∂tÊˆFRí&WGW&‚ÁV∆√∞†¢6ˆÁ7B6«W7FW$FF“∂tÊˆFRÂˆ6«W7FW$FF«¬ÁV∆√∞¢6ˆÁ7BvVÁDFF“∂tÊˆFRÂˆvVÁDFF«¬ÁV∆√∞†¢6ˆÁ7BFóF∆R“vVÁDFFÚvVÁDFFÊ∆&V¬¢Ü6«W7FW$FFÚ6«W7FW$FFÁ&WGWGí¢∂tÊˆFRÊ∆&V¬ì∞¢6ˆÁ7B&ˆ∆UFóF∆W2“6«W7FW$FFÚ6«W7FW$FFÁ&ˆ∆UFóF∆W2¢ÜvVÁDFFÚvVÁDFFÁ7Á5&ˆ∆W2¢µ“ì∞¢6ˆÁ7B6∂ñ∆«2“6«W7FW$FFÚÜ6«W7FW$FFÁ6∂ñ∆«2«¬µ“í¢µ”∞¢6ˆÁ7B&˜fVÊÊ6R“6«W7FW$FFÚÜ6«W7FW$FFÁ&˜fVÊÊ6R«¬µ“í¢µ”∞¢6ˆÁ7B∆WfV¬“6«W7FW$FFÚ6«W7FW$FFÊ∆WfV¬¢ÁV∆√∞¢6ˆÁ7B&V7W'&VÊ6R“6«W7FW$FFÚ6«W7FW$FFÁ&V7W'&VÊ6R¢ÁV∆√∞¢6ˆÁ7B66˜&R“6«W7FW$FFÚ6«W7FW$FFÁ66˜&R¢ÁV∆√∞†¢6ˆÁ7B«f≈7Gñ∆R“∆WfV¬bbƒUdT≈5∂∆WfV≈“ÚƒUdT≈5∂∆WfV≈“¢ÁV∆√∞†¢&WGW&‚Ä¢∆Fób&ˆ∆S◊∂ñÊ∆ñÊRÚ'&Vvñˆ‚"¢&Fñ∆ˆr'“&ñ÷÷ˆF√◊∂ñÊ∆ñÊRÚVÊFVfñÊVB¢'G'VR'“&ñ÷∆&V√◊≤$FWFñ√¢"≤FóF∆W–¢7Gñ∆S◊∂ñÊ∆ñÊP¢Ú≤˜6óFñˆ„¢'7FFñ2"¬vñGFÉ¢#R"¬&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#Ç6ˆ∆ñB6FFS6V2"¬&˜&FW%&FóW3¢B¬˜fW&f∆˜uì¢&WFÚ"¬FFñÊs¢#gÇgÇ"¬Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬v¢B¬fˆÁDf÷ñ«ì¢'7ó7FV“◊Ví¬÷∆R◊7ó7FV“«6Á2◊6W&ñb"¬÷ÑÜVñváC¢#s'fÇ"–¢¢≤˜6óFñˆ„¢&fóÜVB"¬F˜¢¬&ñváC¢¬&˜GFˆ”¢¬vñGFÉ¢&6∆◊É#ÉÇ√3Wgr√CÇí"¬&6∂w&˜VÊC¢"6ffb"¬&˜&FW$∆VgC¢#Ç6ˆ∆ñB6FFS6V2"¬&˜Ö6ÜF˜s¢"”GÇ#GÇ&v&É√√√„í"¬§ñÊFWÉ¢ììí¬˜fW&f∆˜uì¢&WFÚ"¬FFñÊs¢##ÇáÇ"¬Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬v¢B¬fˆÁDf÷ñ«ì¢'7ó7FV“◊Ví¬÷∆R◊7ó7FV“«6Á2◊6W&ñb"◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&f∆WÇ◊7F'B"¬v¢◊”‡¢∆Fób7Gñ∆S◊∑≤f∆WÉ¢◊”‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢"3cscfR"¬FWáEG&Á6f˜&”¢'WW&66R"¬∆WGFW%76ñÊs¢#„fV“"◊”Á∂∂tÊˆFRÁGóR””“&vVÁB"Ú$vVÁB6ÊFñFFR"¢$GWGí6«W7FW"'”¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢B¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3#&2"¬∆ñÊTÜVñváC¢„B¬÷&vñÂF˜¢2◊”Á∑FóF∆W”¬ˆFóc‡¢¬ˆFóc‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊∂ˆ‰6∆˜6W“&ñ÷∆&V√“$6∆˜6RFWFñ¬ÊV¬"7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢CB¬÷ñÂvñGFÉ¢CB¬&˜&FW#¢&ÊˆÊR"¬&6∂w&˜VÊC¢'G&Á7&VÁB"¬7W'6˜#¢'ˆñÁFW""¬fˆÁE6ó¶S¢#¬6ˆ∆˜#¢"3f#vÜB"¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢&6VÁFW""¬f∆WÖ6á&ñÊ≥¢◊”ÁÉ¬ˆ'WGFˆ„‡¢¬ˆFóc‡†¢∂«f≈7Gñ∆RbbÄ¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬v¢Ç¬f∆WÖw&¢'w&"◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢«f≈7Gñ∆RÊ6ˆ∆˜"¬&6∂w&˜VÊC¢«f≈7Gñ∆RÊ&r¬&˜&FW#¢#Ç6ˆ∆ñB"≤«f≈7Gñ∆RÊ&˜&FW"¬&˜&FW%&FóW3¢#¬FFñÊs¢#'ÇÇ"◊”‰íWá˜7W&S¢∂«f≈7Gñ∆RÊ∆&V«”¬˜7„‡¢∑&V7W'&VÊ6R“ÁV∆¬bb«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3SsCì"¬&6∂w&˜VÊC¢"6V6fVfb"¬&˜&FW#¢#Ç6ˆ∆ñB6Vc6f2"¬&˜&FW%&FóW3¢#¬FFñÊs¢#'ÇÇ"◊”Â&V7W'27&˜72∑&V7W'&VÊ6W“˜7FñÊw∑&V7W'&VÊ6R””“Ú""¢'2'”¬˜7„Á–¢∑66˜&R“ÁV∆¬bb66˜&R‚bb«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3SCb"¬&6∂w&˜VÊC¢"6VVc&fb"¬&˜&FW#¢#Ç6ˆ∆ñB63vC&fR"¬&˜&FW%&FóW3¢#¬FFñÊs¢#'ÇÇ"◊”Â&Ê≤66˜&S¢∑66˜&W”¬˜7„Á–¢¬ˆFóc‡¢ó–†¢∑&ˆ∆UFóF∆W2Ê∆VÊwFÇ‚bbÄ¢«6V7Fñˆ‚&ñ÷∆&V√“$6ˆÊÊV7FVB&ˆ∆W2#‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢"3#&2"¬÷&vñ‰&˜GFˆ”¢b¬FWáEG&Á6f˜&”¢'WW&66R"¬∆WGFW%76ñÊs¢#„VV“"◊”‰6ˆÊÊV7FVBFÛ¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v¢b◊”‡¢∑&ˆ∆UFóF∆W2Ê÷ÜgVÊ7Fñˆ‚á'B¬íí∞¢&WGW&‚«7‚∂Wì◊∂ó“7Gñ∆S◊∑≤fˆÁE6ó¶S¢„R¬fˆÁEvVñváC¢c¬6ˆ∆˜#¢"3SCb"¬&6∂w&˜VÊC¢"6VVc&fb"¬&˜&FW#¢#Ç6ˆ∆ñB63vC&fR"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#7ÇóÇ"◊”Á∑'G”¬˜7„„∞¢“ó–¢¬ˆFóc‡¢¬˜6V7Fñˆ„‡¢ó–†¢∑6∂ñ∆«2Ê∆VÊwFÇ‚bbÄ¢«6V7Fñˆ‚&ñ÷∆&V√“%&V∆FVB6∂ñ∆«2#‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢"3#&2"¬÷&vñ‰&˜GFˆ”¢b¬FWáEG&Á6f˜&”¢'WW&66R"¬∆WGFW%76ñÊs¢#„VV“"◊”Â6∂ñ∆«2ñÁfˆ«fVC¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v¢b◊”‡¢∑6∂ñ∆«2Á6∆ñ6RÉ¬íÊ÷ÜgVÊ7Fñˆ‚á6≤¬íí∞¢&WGW&‚Ä¢«7‚∂Wì◊∂ó“7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬fˆÁEvVñváC¢c¬6ˆ∆˜#¢"3SsCì"¬&6∂w&˜VÊC¢"6V6fVfb"¬&˜&FW#¢#Ç6ˆ∆ñB6Vc6f2"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#'ÇáÇ"◊”‡¢∑6≤Á6∂ñ∆¬«¬6∑–¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢í¬6ˆ∆˜#¢"3f#vÜB"¬÷&vñ‰∆VgC¢B◊”Êg&ˆ“‘4c¬˜7„‡¢¬˜7„‡¢ì∞¢“ó–¢¬ˆFóc‡¢¬˜6V7Fñˆ„‡¢ó–†¢∑&˜fVÊÊ6RÊ∆VÊwFÇ‚bbÄ¢«6V7Fñˆ‚&ñ÷∆&V√“%6˜W&6R˜7FñÊw2#‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢"3#&2"¬÷&vñ‰&˜GFˆ”¢b¬FWáEG&Á6f˜&”¢'WW&66R"¬∆WGFW%76ñÊs¢#„VV“"◊”‰g&ˆ“FÜW6R˜7FñÊw2á∑&˜fVÊÊ6RÊ∆VÊwFá“ì¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬v¢Ç◊”‡¢∑&˜fVÊÊ6RÊ÷ÜgVÊ7Fñˆ‚á¬íí∞¢&WGW&‚Ä¢∆Fób∂Wì◊∂ó“7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6cÜff2"¬&˜&FW#¢#Ç6ˆ∆ñB6S&SÜc"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#áÇÇ"◊”‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3#&2"¬∆ñÊTÜVñváC¢„B◊”Á∑ÁFóF∆R«¬%˜7FñÊr'”¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬v¢Ç¬÷&vñÂF˜¢B¬f∆WÖw&¢'w&"¬∆ñv‰óFV◊3¢&6VÁFW""◊”‡¢∑Á˜7FVDFFRbb«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬6ˆ∆˜#¢"3f#vÜB"◊”Á∑Á˜7FVDFFRÁ6∆ñ6RÉ¬ó”¬˜7„Á–¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬fˆÁEvVñváC¢c¬6ˆ∆˜#¢ÊGWGîFWFñ¬Ú"3cscfR"¢"6#CS3í"¬&6∂w&˜VÊC¢ÊGWGîFWFñ¬Ú"6V6fVfb"¢"6fff&V""¬&˜&FW#¢#Ç6ˆ∆ñB"≤áÊGWGîFWFñ¬Ú"6Vc6f2"¢"6fFScÜ"í¬&˜&FW%&FóW3¢b¬FFñÊs¢#ÇgÇ"◊”Á∑ÊGWGîFWFñ¬Ú&gV∆¬FWFñ¬"¢'7V÷÷'íFWáB'”¬˜7„‡¢∑Ê÷6eW&¬bb∆á&Vc◊∑Ê÷6eW&«“F&vWC“%ˆ&∆Ê≤"&V√“&Êˆ˜VÊW"Ê˜&VfW'&W""7Gñ∆S◊∑≤fˆÁE6ó¶S¢¬6ˆ∆˜#¢"3SfF""◊”ÂfñWrˆ‚‘4c¬ˆÁ–¢¬ˆFóc‡¢¬ˆFóc‡¢ì∞¢“ó–¢¬ˆFóc‡¢¬˜6V7Fñˆ„‡¢ó–†¢∆fˆ˜FW"7Gñ∆S◊∑≤÷&vñÂF˜¢Ç¬FFñÊuF˜¢¬&˜&FW%F˜¢#Ç6ˆ∆ñB6S&SÜc"¬fˆÁE6ó¶S¢„R¬6ˆ∆˜#¢"3f#vÜB"¬∆ñÊTÜVñváC¢„b◊”‡¢í÷76ó7FVC≤áV÷‚FV6ñFW2‚6«W7FW'2ÊB&Ê∂ñÊw2&R6ˆ◊WFVBg&ˆ“FÜR6◊∆VB˜7FñÊw3≤FÜRvVÁBg&÷ñÊró27VvvW7Fñˆ‚ˆbWFˆ÷F&∆Rv˜&≤¬Ê˜BÜVF6˜VÁBßVFvV÷VÁB‡¢¬ˆfˆ˜FW#‡¢¬ˆFóc‡¢ì∞ß–†¢ÚÚ4Û¢6ˆ◊ÁïÊV¬“fWF6Ç≤&W6ˆ«fR≤&VÊFW"FÜR6ˆ◊Áí6V&6Ç&W7V«B‡¢ÚÚ4Û"WáFVÁ6ñˆ„¢gFW"6ñÊv∆RV◊∆˜ñW"ó26ˆÊfó&÷VB¬6ˆÁG&ˆ¬G&ñvvW'2FÜP¢ÚÚGWFñW3ßG'VRfWF6Ç¬'VÁ2'Vñ∆D6ˆ◊ÁîvVÁG2ÑDUDU$‘î‰ï5Dî2“ÊÚƒƒ“¬ÊÚñÁfVÁFV@¢ÚÚÁV÷&W#≤6˜VÁG2ÊBÊ÷W2&RfW&&Fñ“72◊Fá&˜VvÇg&ˆ“◊î6&VW'4gWGW&Rfñ¢ÚÚˆíˆ÷6b7Fñˆ„¢&6ˆ◊Áí"í¬ÊB&VÊFW'2FÜR$í÷ˆ÷VÁG2"ÊV¬‚4U$DR¿¢ÚÚ6∆V&«í÷∆&V∆∆VBíıdU%dîUrÜvWD6ˆ◊Áî˜fW'fñWr¬6ÜVW7B6∆VFR÷ˆFV¬íÊ'&FW0¢ÚÚFÜRFWFW&÷ñÊó7Fñ2ı$t‰ï4DîÙ‚$TBf7G2“óBWFÜ˜'2ÊÚÁV÷&W"˜"fW&Fñ7BÊ@¢ÚÚvóFÜÜˆ∆G2vÜV‚FÜRf7G2&RFÜñ‚‡¢ÚÚ#c¢∆ˆD6ˆ◊ÁíÊB∆ˆDGWFñW2&RÊ÷VBgVÊ7FñˆÁ2¬Ê˜B◊V«Fí÷∆ñÊR7ñÊ2'&˜w2‡¶gVÊ7Fñˆ‚6ˆ◊ÁïÊV¬á≤6ˆ◊ÁïVW'í¬ˆ‰Ê«ó6U˜7FñÊr¬ˆÂVWVU˜7FñÊr¬VWVT6˜VÁB¬WFÙ˜V‰î÷ˆ÷VÁG2“f«6R¬FWfñ6U&ˆfñ∆R“í∞¢6ˆÁ7B∑7FFR¬6WE7FFU““W6U7FFRá≤∆ˆFñÊs¢G'VR¬÷F6ÜW3¢µ“¬VW'ì¢""¬VW'î∂Wì¢""¬÷&ñwV˜W3¢f«6R¬F˜F≈˜7FñÊw3¢¬vW5ˆ∆∆VC¢¬f∆∆&6≥¢f«6R¬÷W76vS¢""¬W'&˜#¢ÁV∆¬“ì∞¢6ˆÁ7B∂6Ü˜6V‰∂Wí¬6WD6Ü˜6V‰∂Wï““W6U7FFRÜÁV∆¬ì∞¢ÚÚ54rGvÚ÷6ˆ«V÷„¢&∆∆V¬6&VW'2Êv˜bÁ6rvVÊ7ífWF6Ä¢6ˆÁ7B∂76u7FFR¬6WD76u7FFU““W6U7FFRá≤∆ˆFñÊs¢G'VR¬¶ˆ'3¢µ“¬F˜F√¢¬f∆∆&6≥¢f«6R¬÷W76vS¢""“ì∞¢ÚÚÙì„3¢6∆ñVÁB÷fWF6ÇFñ÷W7F◊f˜"FÜR&˜fVÊÊ6R∆ñÊR“ÜˆÊW7B&˜W@¢ÚÚ'vÜV‚FÜó26∆ñVÁB&WG&ñWfVBóB"¬Ê˜B6∆ñ“&˜WBFÜRGV◊w2˜v‚&Vg&W6ÇvñÊF˜p¢ÚÚáFÜBvñÊF˜ró2Ê˜BWá˜6VB'íˆíˆ6&VW'2í‡¢6ˆÁ7B∂76u&WG&ñWfVDB¬6WD76u&WG&ñWfVDE““W6U7FFRÜÁV∆¬ì∞¢ÚÚ4Û#¢vVÁG2ÊV¬7FFP¢6ˆÁ7B∂vVÁG5fñWr¬6WDvVÁG5fñWu““W6U7FFRÇ&ˆfb"ì≤ÚÚ&ˆfb"¬&∆ˆFñÊr"¬'&VGí"¬'vóFÜÜV∆B ¢6ˆÁ7B∂vVÁG4÷ˆFV¬¬6WDvVÁG4÷ˆFV≈““W6U7FFRÜÁV∆¬ì∞¢6ˆÁ7B∂vVÁG4∂uñ∆ˆB¬6WDvVÁG4∂uñ∆ˆE““W6U7FFRÜÁV∆¬ì∞¢6ˆÁ7B∂vVÁD∆ñ˜WB¬6WDvVÁD∆ñ˜WE““W6U7FFRÇ&∆ÊW2"ì≤ÚÚ&∆ÊW2"¬&f˜&6R"¬'v˜&∂f∆˜r ¢6ˆÁ7B∑FÊˆFTñB¬6WEFÊˆFTñE““W6U7FFRÜÁV∆¬ì≤ÚÚ6ñFR◊ÊV¬˜V‚7FFP¢6ˆÁ7B∂vVÁG4W'&˜"¬6WDvVÁG4W'&˜%““W6U7FFRÇ""ì∞¢ÚÚ7FW2÷˜VÁG2óG2˜v‚˜&vÊó6Fñˆ‚ÊV¬‚&V÷V÷&W"FÜRV◊∆˜ñW"f˜"vÜñ6Ä¢ÚÚFÜBÊV¬Ü2«&VGí7F'FVBí÷ˆ÷VÁG26ÚFÜR˜&vÊó6Fñˆ‚&˜WFR˜VÁ0¢ÚÚFÜRÊ«ó6ó2ˆÊ6R¬vóFÜ˜WBGW∆ñ6FR&WVW7G2VÊFW"&V7B7G&ñ7B÷ˆFR‡¢6ˆÁ7BWFÙvVÁG57F'FVE&Vb“W6U&VbÇ""ì∞¢ÚÚT’¢&Vvó7FW&VB÷V◊∆˜ñW"f7G2Ñ5$FG&W72ıTT‚≤÷í“&WW6W2FÜR6÷P¢ÚÚfWF6ÑV◊∆˜ñW%&Vvó7G&Fñˆ‚ˆfWF6ÑV◊∆˜ñW$vVˆ6ˆFRw&W'2FÜR'&˜w6R’4r÷¶ˆ'0¢ÚÚgV∆¬÷B÷ˆF¬W6W2‚fóÜW2VFóBfñÊFñÊr3ì¢W6W"vÜÚWá∆ñ6óF«í6V&6ÜV@¢ÚÚf˜"‚V◊∆˜ñW"6rÊˆÊRˆbFÜBV◊∆˜ñW"w2˜v‚&Vvó7G'íf7G2‡¢6ˆÁ7B∂V◊&Vr¬6WDV◊&Vu““W6U7FFRÜÁV∆¬ì∞¢6ˆÁ7B∂V◊vVÚ¬6WDV◊vVı““W6U7FFRÜÁV∆¬ì∞¢ÚÚfóÜW2VFóBfñÊFñÊr3¢∆&vR6ñÊv∆R÷V◊∆˜ñW"&W7V«B6WBÜBÊÚvíFÚ6˜'@¢ÚÚ˜"fñ«FW"¬VÊ∆ñ∂R'&˜w6R4r¶ˆ'2rr÷f6WB˜7FñÊtWfñFVÊ6Uñ6∂W"‚∂WBFV∆ñ&W&FV«ê¢ÚÚ6÷∆¬á6˜'B≤"f6WG2í&FÜW"FÜ‚˜'FñÊrFÜRgV∆¬f6WB7ó7FV““FÜó267&VV‡¢ÚÚó2«&VGíÊ'&˜vVBFÚˆÊRV◊∆˜ñW"¬6Ú÷˜7BˆbFÜ˜6Rf6WG2v˜V∆B&R÷ˆ˜B‡¢6ˆÁ7B∂÷6e6˜'B¬6WD÷6e6˜'E““W6U7FFRÇ'&V6VÁB"ì∞¢6ˆÁ7B∂÷6df6WG2¬6WD÷6df6WG5““W6U7FFRá≤∆WfV√¢µ“¬GóS¢µ““ì∞¢6ˆÁ7B∂÷6e&ˆ∆UVW'í¬6WD÷6e&ˆ∆UVW'ï““W6U7FFRÇ""ì∞¢6ˆÁ7B∂÷ˆ&ñ∆Tf7G4˜V‚¬6WD÷ˆ&ñ∆Tf7G4˜VÂ““W6U7FFRÜf«6Rì∞¢6ˆÁ7B∂÷ˆ&ñ∆Tfñ«FW'4˜V‚¬6WD÷ˆ&ñ∆Tfñ«FW'4˜VÂ““W6U7FFRÜf«6Rì∞¢6ˆÁ7B∂6˜î˜VÊñÊw57FFR¬6WD6˜î˜VÊñÊw57FFU““W6U7FFRÇ&ñF∆R"ì∞¢6ˆÁ7B˜˜'GVÊóGî∆ó7E&Vb“W6U&VbÜÁV∆¬ì∞¢ÚÚí6ˆ◊Áí˜fW'fñWrÜ6ÜVW7B6∆VFRì¢ñF∆R¬∆ˆFñÊr¬&VGí¬vóFÜÜV∆B‡¢6ˆÁ7B∂6ˆ◊Áî˜fW'fñWr¬6WD6ˆ◊Áî˜fW'fñWu““W6U7FFRá≤7FGW3¢&ñF∆R"¬FF¢ÁV∆¬“ì∞†¢6ˆÁ7Bf◊E6∆'í“Ü∆Ú¬Üíí”‚∞¢ñbÜ∆Ú”“ÁV∆¬bbÜí”“ÁV∆¬í&WGW&‚%6∆'íˆ‚∆ñ6Fñˆ‚#∞¢6ˆÁ7B2“Ü‚í”‚%2B"≤ÁV÷&W"Ü‚íÁFÙ∆ˆ6∆U7G&ñÊrÇì∞¢ñbÜ∆Ú“ÁV∆¬bbÜí“ÁV∆¬í&WGW&‚2Ü∆Úí≤"“"≤2ÜÜíí≤"Ú÷ˆÁFÇ#∞¢&WGW&‚2Ü∆Ú“ÁV∆¬Ú∆Ú¢Üíí≤"Ú÷ˆÁFÇ#∞¢”∞¢6ˆÁ7BFó4vÚ“Üó6Úí”‚∞¢ñbÇó6Úí&WGW&‚"#∞¢6ˆÁ7BB“ÊWrFFRÜó6Úì∞¢ñbÜó4Ê‚ÜBíí&WGW&‚"#∞¢6ˆÁ7BFó2“÷FÇÊ÷ÇÉ¬÷FÇÊf∆ˆ˜"ÇÑFFRÊÊ˜rÇí“BÊvWEFñ÷RÇííÚÉcCíì∞¢ñbÜFó2””“í&WGW&‚%FˆFí#∞¢ñbÜFó2””“í&WGW&‚%ñW7FW&Fí#∞¢ñbÜFó2¬rí&WGW&‚Fó2≤"Fó2vÚ#∞¢ñbÜFó2¬3í&WGW&‚÷FÇÊf∆ˆ˜"ÜFó2Úrí≤ÜFó2¬BÚ"vVV≤"¢"vVV∑2"í≤"vÚ#∞¢&WGW&‚÷FÇÊf∆ˆ˜"ÜFó2Ú3í≤ÜFó2¬cÚ"÷ˆÁFÇ"¢"÷ˆÁFá2"í≤"vÚ#∞¢”∞†¢W6TVffV7BÇÇí”‚∞¢ñbÇ6ˆ◊ÁïVW'íí&WGW&„∞¢∆WB6Ê6V∆∆VB“f«6S∞¢6WE7FFRá≤∆ˆFñÊs¢G'VR¬÷F6ÜW3¢µ“¬VW'ì¢""¬VW'î∂Wì¢""¬÷&ñwV˜W3¢f«6R¬F˜F≈˜7FñÊw3¢¬vW5ˆ∆∆VC¢¬f∆∆&6≥¢f«6R¬÷W76vS¢""¬W'&˜#¢ÁV∆¬“ì∞¢6WD76u7FFRá≤∆ˆFñÊs¢G'VR¬¶ˆ'3¢µ“¬F˜F√¢¬f∆∆&6≥¢f«6R¬÷W76vS¢""“ì∞¢6WD76u&WG&ñWfVDBÜÁV∆¬ì∞¢6WD6Ü˜6V‰∂WíÜÁV∆¬ì∞¢6WDvVÁG5fñWrÇ&ˆfb"ì∞¢6WDvVÁG4÷ˆFV¬ÜÁV∆¬ì∞¢6WDvVÁG4∂uñ∆ˆBÜÁV∆¬ì∞¢6WEFÊˆFTñBÜÁV∆¬ì∞¢WFÙvVÁG57F'FVE&VbÊ7W'&VÁB“"#∞¢6WD÷6e&ˆ∆UVW'íÇ""ì∞¢6WD÷ˆ&ñ∆Tf7G4˜V‚Üf«6Rì∞¢6WD÷ˆ&ñ∆Tfñ«FW'4˜V‚Üf«6Rì∞¢6WD6˜î˜VÊñÊw57FFRÇ&ñF∆R"ì∞†¢ÚÚ54rGvÚ÷6ˆ«V÷„¢fWF6Ç‘4b≤6&VW'2Êv˜bÁ6rñ‚&∆∆V√≤ˆÊRfñ∆ñÊr◊W7BÊ˜B&∆Ê≤FÜR˜FÜW"‡¢gVÊ7Fñˆ‚∆ˆD6ˆ◊Áî&˜FÇÇí∞¢f"÷6e&ˆ÷ó6R“fWF6ÇÇ"ˆíˆ÷6b"¬∞¢÷WFÜˆC¢%ı5B"¿¢ÜVFW'3¢≤$6ˆÁFVÁB’GóR#¢&∆ñ6Fñˆ‚ˆß6ˆ‚"“¿¢&ˆGì¢•4Ù‚Á7G&ñÊvñgíá≤7Fñˆ„¢&6ˆ◊Áí"¬6ˆ◊Áì¢6ˆ◊ÁïVW'í¬∆ñ÷óC¢S“í¿¢“íÁFÜV‚ÜgVÊ7Fñˆ‚á&W2í≤&WGW&‚&W2Êß6ˆ‚Çì≤“ì∞†¢f"76u&ˆ÷ó6R“fWF6ÇÇ"ˆíˆ6&VW'2"¬∞¢÷WFÜˆC¢%ı5B"¿¢ÜVFW'3¢≤$6ˆÁFVÁB’GóR#¢&∆ñ6Fñˆ‚ˆß6ˆ‚"“¿¢&ˆGì¢•4Ù‚Á7G&ñÊvñgíá≤7Fñˆ„¢&6ˆ◊Áí"¬6ˆ◊Áì¢6ˆ◊ÁïVW'í¬∆ñ÷óC¢S“í¿¢“íÁFÜV‚ÜgVÊ7Fñˆ‚á&W2í≤&WGW&‚&W2Êß6ˆ‚Çì≤“ì∞†¢&ˆ÷ó6RÊ∆≈6WGF∆VBÖ∂÷6e&ˆ÷ó6R¬76u&ˆ÷ó6U“íÁFÜV‚ÜgVÊ7Fñˆ‚á&W7V«G2í∞¢ñbÜ6Ê6V∆∆VBí&WGW&„∞¢f"÷6e&W7V«B“&W7V«G5≥”∞¢f"76u&W7V«B“&W7V«G5≥”∞†¢ñbÜ÷6e&W7V«BÁ7FGW2””“&gV∆fñ∆∆VB"í∞¢f"FF“÷6e&W7V«BÁf«VS∞¢6WE7FFRá∞¢∆ˆFñÊs¢f«6R¿¢÷F6ÜW3¢'&íÊó4'&íÜFFÊ÷F6ÜW2íÚFFÊ÷F6ÜW2¢µ“¿¢VW'ì¢FFÁVW'í«¬6ˆ◊ÁïVW'í¿¢VW'î∂Wì¢FFÁVW'î∂Wí«¬""¿¢÷&ñwV˜W3¢FFÊ÷&ñwV˜W2¿¢F˜F≈˜7FñÊw3¢FFÁF˜F≈˜7FñÊw2«¬¿¢vW5ˆ∆∆VC¢FFÁvW5ˆ∆∆VB«¬¿¢f∆∆&6≥¢FFÊf∆∆&6≤¿¢÷W76vS¢FFÊ÷W76vR«¬""¿¢W'&˜#¢ÁV∆¬¿¢“ì∞¢“V«6R∞¢6WE7FFRá≤∆ˆFñÊs¢f«6R¬÷F6ÜW3¢µ“¬VW'ì¢6ˆ◊ÁïVW'í¬VW'î∂Wì¢""¬÷&ñwV˜W3¢f«6R¬F˜F≈˜7FñÊw3¢¬vW5ˆ∆∆VC¢¬f∆∆&6≥¢G'VR¬÷W76vS¢$6˜V∆BÊ˜B&V6Ç◊î6&VW'4gWGW&R‚∆V6RG'ívñ‚ñ‚÷ˆ÷VÁB‚"¬W'&˜#¢7G&ñÊrÜ÷6e&W7V«BÁ&V6ˆ‚bb÷6e&W7V«BÁ&V6ˆ‚Ê÷W76vRí“ì∞¢–†¢ñbÜ76u&W7V«BÁ7FGW2””“&gV∆fñ∆∆VB"í∞¢f"4FF“76u&W7V«BÁf«VS∞¢6WD76u7FFRá∞¢∆ˆFñÊs¢f«6R¿¢¶ˆ'3¢'&íÊó4'&íÜ4FFÊ¶ˆ'2íÚ4FFÊ¶ˆ'2¢µ“¿¢F˜F√¢4FFÁF˜F¬«¬¿¢f∆∆&6≥¢4FFÊf∆∆&6≤¿¢÷W76vS¢4FFÊ÷W76vR«¬""¿¢“ì∞¢G'í∞¢6WD76u&WG&ñWfVDBÜÊWrFFRÇíÁFÙ∆ˆ6∆U7G&ñÊrÇ&V‚’4r"¬≤Fì¢&ÁV÷W&ñ2"¬÷ˆÁFÉ¢'6Ü˜'B"¬ñV#¢&ÁV÷W&ñ2"¬Ü˜W#¢#"÷FñvóB"¬÷ñÁWFS¢#"÷FñvóB"¬Ü˜W##¢f«6R¬Fñ÷U¶ˆÊS¢$6ñı6ñÊv˜&R"“í≤"4uB"ì∞¢“6F6ÇÖÚí≤6WD76u&WG&ñWfVDBÜÁV∆¬ì≤–¢“V«6R∞¢6WD76u7FFRá≤∆ˆFñÊs¢f«6R¬¶ˆ'3¢µ“¬F˜F√¢¬f∆∆&6≥¢G'VR¬÷W76vS¢$6˜V∆BÊ˜B&V6Ç6&VW'2Êv˜bÁ6rFF‚∆V6RG'ívñ‚‚"“ì∞¢–¢“ì∞¢–¢∆ˆD6ˆ◊Áî&˜FÇÇì∞¢&WGW&‚gVÊ7Fñˆ‚Çí≤6Ê6V∆∆VB“G'VS≤”∞¢“¬∂6ˆ◊ÁïVW'ï“ì∞†¢ÚÚ4Û#¢fWF6ÇGWFñW2≤'V‚'Vñ∆D6ˆ◊ÁîvVÁG2f˜"FÜR6ˆÊfó&÷VBV◊∆˜ñW"‡¢ÚÚ#c¢Ê÷VBgVÊ7Fñˆ‚¬Ê˜B◊V«Fí÷∆ñÊR7ñÊ2'&˜rñ‚•5Ç&˜2‡¢gVÊ7Fñˆ‚∆ˆDGWFñW2Ü÷F6Ñw&˜Wí∞¢6WDvVÁG5fñWrÇ&∆ˆFñÊr"ì∞¢6WDvVÁG4W'&˜"Ç""ì∞¢fWF6ÇÇ"ˆíˆ÷6b"¬∞¢÷WFÜˆC¢%ı5B"¿¢ÜVFW'3¢≤$6ˆÁFVÁB’GóR#¢&∆ñ6Fñˆ‚ˆß6ˆ‚"“¿¢&ˆGì¢•4Ù‚Á7G&ñÊvñgíá≤7Fñˆ„¢&6ˆ◊Áí"¬6ˆ◊Áì¢÷F6Ñw&˜WÊFó7∆îÊ÷R¬GWFñW3¢G'VR¬FWFñƒ∆ñ÷óC¢R¬∆ñ÷óC¢S“í¿¢“ê¢ÁFÜV‚ÜgVÊ7Fñˆ‚á&W2í≤&WGW&‚&W2Êß6ˆ‚Çì≤“ê¢ÁFÜV‚ÜgVÊ7Fñˆ‚ÜFFí∞¢ÚÚW6RFÜRVÁ&ñ6ÜVBw&˜Wg&ˆ“FÜRGWFñW2fWF6É≤f∆¬&6≤FÚFÜR˜&ñvñÊ¬w&˜W‡¢6ˆÁ7BVÁ&ñ6ÜVDw&˜W“Ñ'&íÊó4'&íÜFFÊ÷F6ÜW2íbbFFÊ÷F6ÜW2Ê∆VÊwFÇ””“ê¢ÚFFÊ÷F6ÜW5≥–¢¢÷F6Ñw&˜W∞¢6ˆÁ7B÷ˆFV¬“'Vñ∆D6ˆ◊ÁîvVÁG2ÜVÁ&ñ6ÜVDw&˜Wì∞¢6ˆÁ7B∂uñ∆ˆB“6ˆ◊ÁîvVÁG5FÙ∂uñ∆ˆBÜ÷ˆFV¬ì∞¢6WDvVÁG4÷ˆFV¬Ü÷ˆFV¬ì∞¢6WDvVÁG4∂uñ∆ˆBÜ∂uñ∆ˆBì∞¢6WDvVÁG5fñWrÜ÷ˆFV¬ÁvóFÜÜV∆Bbb÷ˆFV¬ÁvóFÜÜV∆BÊ∆VÊwFÇ‚bb÷ˆFV¬ÊvVÁG2Ê∆VÊwFÇ””“Ú'vóFÜÜV∆B"¢'&VGí"ì∞¢“ê¢Ê6F6ÇÜgVÊ7Fñˆ‚Çí∞¢6WDvVÁG4W'&˜"Ç$6˜V∆BÊ˜B∆ˆBGWGíFWFñ«2‚6Ü˜vñÊr˜7FñÊw2ˆÊ«í‚"ì∞¢6WDvVÁG5fñWrÇ&ˆfb"ì∞¢“ì∞¢–†¢ÚÚ4Û#¢ÜÊF∆W"f˜"ÊˆFRF“˜VÁ2FÜR6ñFRÊV¬‡¢gVÊ7Fñˆ‚ÜÊF∆TvVÁDÊˆFUFÜñBí∞¢6WEFÊˆFTñBÜgVÊ7Fñˆ‚á&Wbí≤&WGW&‚&Wb””“ñBÚÁV∆¬¢ñC≤“ì∞¢–†¢6ˆÁ7B6ÂVWVR“áVWVT6˜VÁB«¬í¬3∞†¢ÚÚ7FófRw&˜W¢ñbW6W"6Ü˜6RˆÊRñ‚Fó6÷&ñr¬6Ü˜rFÜC≤V«6Rñb6ñÊv∆R÷F6Ç¬6Ü˜róB‡¢6ˆÁ7B7FófT÷F6Ç“7FFRÊ÷&ñwV˜W2bb6Ü˜6V‰∂Wê¢Ú7FFRÊ÷F6ÜW2ÊfñÊBÜgVÊ7Fñˆ‚Ü“í≤&WGW&‚“Ê∂Wí””“6Ü˜6V‰∂Wì≤“ê¢¢Ç7FFRÊ÷&ñwV˜W2bb7FFRÊ÷F6ÜW2Ê∆VÊwFÇ””“Ú7FFRÊ÷F6ÜW5≥“¢ÁV∆¬ì∞†¢ÚÚ6V∆V7FñÊrí÷ˆ÷VÁG2ñ‚7FW2◊W7B&WfV¬ÊWrÊ«ó6ó2¬Ê˜B÷˜VÁB¢ÚÚ6V6ˆÊB6˜íˆbFÜR6ˆ◊Áí&W7V«G2vóFÇóG2∆ˆ6¬7FFR&W6WBFÚ&ˆfb"‡¢ÚÚFÜR˜&FñÊ'í7FWÊV¬&V÷ñÁ2W6W"◊G&ñvvW&VB‡¢W6TVffV7BÜgVÊ7Fñˆ‚Çí∞¢6ˆÁ7B∆ˆFVEVW'í“7G&ñÊrá7FFRÁVW'í«¬""íÁG&ñ“ÇíÁFÙ∆˜vW$66RÇì∞¢6ˆÁ7B&WVW7FVEVW'í“7G&ñÊrÜ6ˆ◊ÁïVW'í«¬""íÁG&ñ“ÇíÁFÙ∆˜vW$66RÇì∞¢ñbÇWFÙ˜V‰î÷ˆ÷VÁG2«¬7FFRÊ∆ˆFñÊr«¬∆ˆFVEVW'í”“&WVW7FVEVW'í«¬7FófT÷F6Ç«¬vVÁG5fñWr”“&ˆfb"í&WGW&„∞¢6ˆÁ7BV◊∆˜ñW$∂Wí“7FófT÷F6ÇÊ∂Wí«¬7FófT÷F6ÇÊFó7∆îÊ÷R«¬6ˆ◊ÁïVW'ì∞¢ñbÇV◊∆˜ñW$∂Wí«¬WFÙvVÁG57F'FVE&VbÊ7W'&VÁB””“V◊∆˜ñW$∂Wíí&WGW&„∞¢WFÙvVÁG57F'FVE&VbÊ7W'&VÁB“V◊∆˜ñW$∂Wì∞¢∆ˆDGWFñW2Ü7FófT÷F6Çì∞¢ÚÚ∆ˆDGWFñW2ñÁFVÁFñˆÊ∆«í&VG2FÜR6ˆÊfó&÷VB÷F6ÇBFÜó2G&Á6óFñˆ‚‡¢ÚÚW6∆ñÁB÷Fó6&∆R÷ÊWáB÷∆ñÊR&V7B÷Üˆˆ∑2ˆWÜÜW7FófR÷FW0¢“¬∂WFÙ˜V‰î÷ˆ÷VÁG2¬7FófT÷F6Ç¬vVÁG5fñWr¬6ˆ◊ÁïVW'í¬7FFRÊ∆ˆFñÊr¬7FFRÁVW'ï“ì∞†¢ÚÚ6&VW'2Êv˜bÁ6rÜ2ÊÚ&W6ˆ«fT6ˆ◊Áí◊7Gñ∆R∂Wí&W6ˆ«WFñˆ‚áFÜBw2‚‘4b÷ˆÊ«ê¢ÚÚ7FWí“w&˜WFÜR«&VGí÷fWF6ÜVB¬«&VGí◊66˜&R◊6˜'FVB¶ˆ'2'íFÜVó"fW&&Fñ–¢ÚÚvVÊ7íÊ÷R6Ú'&ˆBVW'íÜRÊr‚$÷ñÊó7G'í"íFó66∆˜6W2FÜB6WfW&¬Fó7FñÊ7@¢ÚÚvVÊ6ñW2&R÷óÜVBñ‚¬ñÁ7FVBˆb‚VÊ∆&V∆∆VBf∆B∆ó7B‚fóÜW2VFóBfñÊFñÊr3Ç‡¢6ˆÁ7B76tw&˜W2“W6T÷V÷ÚÜgVÊ7Fñˆ‚Çí∞¢6ˆÁ7B““ÊWr÷Çì∞¢76u7FFRÊ¶ˆ'2Êf˜$V6ÇÜgVÊ7Fñˆ‚Ü¢í∞¢6ˆÁ7B≤“Ü¢bb¢ÊV◊∆˜ñW"í«¬%VÊ∂Ê˜v‚vVÊ7í#∞¢ñbÇ“ÊÜ2Ü≤íí“Á6WBÜ≤¬µ“ì∞¢“ÊvWBÜ≤íÁW6ÇÜ¢ì∞¢“ì∞¢&WGW&‚'&íÊg&ˆ“Ü“¬gVÊ7Fñˆ‚Ö∂Ê÷R¬¶ˆ'5“í≤&WGW&‚≤Ê÷S¢Ê÷R¬¶ˆ'3¢¶ˆ'2”≤“ì∞¢“¬∂76u7FFRÊ¶ˆ'5“ì∞†¢ÚÚT’¢ˆÊR5$∆ˆˆ∑WW"6ˆÊfó&÷VBV◊∆˜ñW"ÜÊ˜BW"˜7FñÊr“FÜó267&VV‚ó0¢ÚÚ«&VGí66˜VBFÚˆÊRV◊∆˜ñW"í‚6ÜñÁ2vVˆ6ˆFRfWF6ÇˆÊ«íˆ‚‚WÜ7B÷F6Ä¢ÚÚ6''ññÊr˜7F¬6ˆFR¬6÷R˜7GW&R2FÜR'&˜w6R÷¶ˆ'2gV∆¬÷B÷ˆF¬‡¢W6TVffV7BÜgVÊ7Fñˆ‚Çí∞¢ñbÇ7FófT÷F6Çí≤6WDV◊&VrÜÁV∆¬ì≤6WDV◊vVÚÜÁV∆¬ì≤&WGW&‚VÊFVfñÊVC≤–¢∆WB6Ê6V∆∆VB“f«6S∞¢6WDV◊&Vrá≤7FGW3¢&∆ˆFñÊr"¬FF¢ÁV∆¬“ì∞¢6WDV◊vVÚÜÁV∆¬ì∞¢fWF6ÑV◊∆˜ñW%&Vvó7G&Fñˆ‚Ü7FófT÷F6ÇÊFó7∆îÊ÷RíÁFÜV‚ÜgVÊ7Fñˆ‚ÜFFí∞¢ñbÜ6Ê6V∆∆VBí&WGW&„∞¢6WDV◊&Vrá≤7FGW3¢&FˆÊR"¬FF¢FF¬&WG&ñWfVDC¢ÊWrFFRÇíÁFÙï4ı7G&ñÊrÇí“ì∞¢ñbÜFFbbFFÊ÷F6ÜVB””“&WÜ7B"bbFFÁ˜7F¬í∞¢6WDV◊vVÚá≤7FGW3¢&∆ˆFñÊr"¬FF¢ÁV∆¬“ì∞¢fWF6ÑV◊∆˜ñW$vVˆ6ˆFRÜFFÁ˜7F¬íÁFÜV‚ÜgVÊ7Fñˆ‚ÜvVÚí≤ñbÇ6Ê6V∆∆VBí6WDV◊vVÚá≤7FGW3¢&FˆÊR"¬FF¢vVÚ“ì≤“ì∞¢–¢“ì∞¢&WGW&‚gVÊ7Fñˆ‚Çí≤6Ê6V∆∆VB“G'VS≤”∞¢“¬∂7FófT÷F6Çbb7FófT÷F6ÇÊFó7∆îÊ÷U“ì∞†¢ÚÚÙì„¢FWFW&÷ñÊó7Fñ2˜&vÊó6Fñˆ‚&VB˜fW"FÜR«&VGí÷fWF6ÜVBV◊∆˜ñW"6WB‡¢6ˆÁ7B˜&u&VB“W6T÷V÷ÚÜgVÊ7Fñˆ‚Çí≤&WGW&‚'Vñ∆D˜&u&VBÜ7FófT÷F6Ç¬V◊&Vr¬76tw&˜W2¬76u&WG&ñWfVDBì≤“¬∂7FófT÷F6Ç¬V◊&Vr¬76tw&˜W2¬76u&WG&ñWfVDE“ì∞†¢ÚÚí˜fW'fñWs¢ˆÊ6R6ˆÊfó&÷VBV◊∆˜ñW"Ü2VÊ˜VvÇw&˜VÊFVBf7G2Ü‚5$ñÊGW7G'ê¢ÚÚ÷F6Çı"„”˜&r◊&VB6ñvÊ¬íÊBFÜR5$∆ˆˆ∑WÜ26WGF∆VB¬Ê'&FRFÜV“ˆ‚FÜP¢ÚÚ6ÜVW7B6∆VFR÷ˆFV¬‚vFVBˆ‚$î‘ïDïdU26ÚóBfó&W2ˆÊ6RW"V◊∆˜ñW"¬Ê˜Bˆ‡¢ÚÚWfW'í&VÊFW"‚vóFÜÜV∆Bˆfñ∆VB”‚&Ê˜BVÊ˜VvÇFF"7FFR¬ÊWfW"f'&ñ6Fñˆ‚‡¢6ˆÁ7B˜&u6ñvÊƒ6˜VÁB“˜&u&VBÁ6ñvÊ«2Ê∆VÊwFÇ≤Ü˜&u&VBÁ&Vvó7G'íbb˜&u&VBÁ&Vvó7G'íÊ÷F6ÜVBÚ¢ì∞¢6ˆÁ7BV◊&Vu7FGW2“V◊&VrbbV◊&VrÁ7FGW3∞¢W6TVffV7BÜgVÊ7Fñˆ‚Çí∞¢6ˆÁ7BÊ÷R“7FófT÷F6Çbb7FófT÷F6ÇÊFó7∆îÊ÷S∞¢ñbÇÊ÷R«¬˜&u6ñvÊƒ6˜VÁB””“«¬V◊&Vu7FGW2””“&∆ˆFñÊr"í≤6WD6ˆ◊Áî˜fW'fñWrá≤7FGW3¢&ñF∆R"¬FF¢ÁV∆¬“ì≤&WGW&‚VÊFVfñÊVC≤–¢∆WB6Ê6V∆∆VB“f«6S∞¢6WD6ˆ◊Áî˜fW'fñWrá≤7FGW3¢&∆ˆFñÊr"¬FF¢ÁV∆¬“ì∞¢vWD6ˆ◊Áî˜fW'fñWrÜÊ÷R¬˜&u&VB¬V◊&VríÁFÜV‚ÜgVÊ7Fñˆ‚á&W2í∞¢ñbÜ6Ê6V∆∆VBí&WGW&„∞¢6WD6ˆ◊Áî˜fW'fñWrá&W2Ú≤7FGW3¢'&VGí"¬FF¢&W2“¢≤7FGW3¢'vóFÜÜV∆B"¬FF¢ÁV∆¬“ì∞¢“ì∞¢&WGW&‚gVÊ7Fñˆ‚Çí≤6Ê6V∆∆VB“G'VS≤”∞¢ÚÚW6∆ñÁB÷Fó6&∆R÷ÊWáB÷∆ñÊR&V7B÷Üˆˆ∑2ˆWÜÜW7FófR÷FW0¢“¬∂7FófT÷F6Çbb7FófT÷F6ÇÊFó7∆îÊ÷R¬V◊&Vu7FGW2¬˜&u6ñvÊƒ6˜VÁE“ì∞†¢6ˆÁ7B7FófT¶ˆ'2“Ü7FófT÷F6Çbb7FófT÷F6ÇÊ¶ˆ'2í«¬µ”∞¢6ˆÁ7B÷6df6WD˜FñˆÁ2“W6T÷V÷ÚÜgVÊ7Fñˆ‚Çí∞¢6ˆÁ7B∆WfV«2“ÊWr÷Çí¬GóW2“ÊWr÷Çì∞¢7FófT¶ˆ'2Êf˜$V6ÇÜgVÊ7Fñˆ‚Ü¢í∞¢6ˆÁ7B«f¬“Ñ'&íÊó4'&íÜ¢Á˜6óFñˆ‰∆WfV«2íbb¢Á˜6óFñˆ‰∆WfV«5≥“í«¬ÁV∆√∞¢ñbÜ«f¬í∆WfV«2Á6WBÜ«f¬¬Ü∆WfV«2ÊvWBÜ«f¬í«¬í≤ì∞¢ñbÜ¢ÊV◊∆˜ñ÷VÁEGóRíGóW2Á6WBÜ¢ÊV◊∆˜ñ÷VÁEGóR¬áGóW2ÊvWBÜ¢ÊV◊∆˜ñ÷VÁEGóRí«¬í≤ì∞¢“ì∞¢6ˆÁ7BFÙ˜G2“gVÊ7Fñˆ‚Ü“í≤&WGW&‚'&íÊg&ˆ“Ü“¬gVÊ7Fñˆ‚Ö∑b¬Â“í≤&WGW&‚≤c¢b¬„¢‚”≤“íÁ6˜'BÜgVÊ7Fñˆ‚Ü¬"í≤&WGW&‚"Ê‚“Ê‚«¬ÁbÊ∆ˆ6∆T6ˆ◊&RÜ"Ábì≤“ì≤”∞¢&WGW&‚≤∆WfV√¢FÙ˜G2Ü∆WfV«2í¬GóS¢FÙ˜G2áGóW2í”∞¢“¬∂7FófT¶ˆ'5“ì∞¢6ˆÁ7B÷6dfñ«FW&VE6˜'FVB“W6T÷V÷ÚÜgVÊ7Fñˆ‚Çí∞¢6ˆÁ7B&ˆ∆TÊVVF∆R“÷6e&ˆ∆UVW'íÁG&ñ“ÇíÁFÙ∆˜vW$66RÇì∞¢∆WBr“7FófT¶ˆ'2Êfñ«FW"ÜgVÊ7Fñˆ‚Ü¢í∞¢ñbá&ˆ∆TÊVVF∆Rbb7G&ñÊrÜ¢ÁFóF∆R«¬""íÁFÙ∆˜vW$66RÇíÊñÊ6«VFW2á&ˆ∆TÊVVF∆Ríí&WGW&‚f«6S∞¢ñbÜ÷6df6WG2Ê∆WfV¬Ê∆VÊwFÇbb÷6df6WG2Ê∆WfV¬ÊñÊ6«VFW2ÇÑ'&íÊó4'&íÜ¢Á˜6óFñˆ‰∆WfV«2íbb¢Á˜6óFñˆ‰∆WfV«5≥“í«¬ÁV∆¬íí&WGW&‚f«6S∞¢ñbÜ÷6df6WG2ÁGóRÊ∆VÊwFÇbb÷6df6WG2ÁGóRÊñÊ6«VFW2Ü¢ÊV◊∆˜ñ÷VÁEGóR«¬ÁV∆¬íí&WGW&‚f«6S∞¢&WGW&‚G'VS∞¢“ì∞¢r“rÁ6∆ñ6RÇì∞¢ñbÜ÷6e6˜'B””“'6∆'í"írÁ6˜'BÜgVÊ7Fñˆ‚Ü¬"í≤&WGW&‚Ü"Á6∆'î÷Ç«¬"Á6∆'î÷ñ‚«¬í“ÜÁ6∆'î÷Ç«¬Á6∆'î÷ñ‚«¬ì≤“ì∞¢V«6RñbÜ÷6e6˜'B””“'FóF∆R"írÁ6˜'BÜgVÊ7Fñˆ‚Ü¬"í≤&WGW&‚ÜÁFóF∆R«¬""íÊ∆ˆ6∆T6ˆ◊&RÜ"ÁFóF∆R«¬""ì≤“ì∞¢V«6RrÁ6˜'BÜgVÊ7Fñˆ‚Ü¬"í≤&WGW&‚ÑFFRÁ'6RÜ"Á˜7FVDFFR«¬""í«¬í“ÑFFRÁ'6RÜÁ˜7FVDFFR«¬""í«¬ì≤“ì∞¢&WGW&‚s∞¢“¬∂7FófT¶ˆ'2¬÷6df6WG2¬÷6e6˜'B¬÷6e&ˆ∆UVW'ï“ì∞¢6ˆÁ7B÷6eFˆvv∆Tf6WB“gVÊ7Fñˆ‚Ü∂Wí¬f¬í≤6WD÷6df6WG2ÜgVÊ7Fñˆ‚Übí≤&WGW&‚≤‚‚Êb¬∂∂Wï”¢e∂∂Wï“ÊñÊ6«VFW2áf¬íÚe∂∂Wï“Êfñ«FW"ÜgVÊ7Fñˆ‚áÇí≤&WGW&‚Ç”“f√≤“í¢e∂∂Wï“Ê6ˆÊ6Báf¬í”≤“ì≤”∞†¢ÚÚUÖ¢FÜW6RGvÚWá˜'G2&RFV6∆&VBÑU$R¬&˜fRFÜRñbá7FFRÊ∆ˆFñÊrñ ¢ÚÚV&«í&WGW&‚&V∆˜r¬ÊB◊W7B7Fí&˜fRóB‚∆6ñÊrFÜV“gFW"FÜB&WGW&‡¢ÚÚv2'V∆W2÷ˆb‘Üˆˆ∑2fñˆ∆Fñˆ„¢FÜR∆ˆFñÊr&VÊFW"&ñ∆VB˜WB&Vf˜&RFÜRGv¢ÚÚW6T6∆∆&6≤6∆«2¬6ÚFÜRÊWáB&VÊFW"&‚GvÚÜˆˆ∑2÷˜&RFÜ‚FÜR&Wfñ˜W0¢ÚÚˆÊRÊB&V7BFá&Wr%&VÊFW&VB÷˜&RÜˆˆ∑2FÜ‚GW&ñÊrFÜR&Wfñ˜W2&VÊFW"‚ ¢ÚÚ6ˆ◊ÁïÊV¬«vó27F'G2vóFÇ∆ˆFñÊsßG'VR¬6ÚFÜó27&6ÜVBFÜRV◊∆˜ñW ¢ÚÚ6V&6ÇWfW'íFñ÷R&W7V«G2'&ófVB‡¢ÚÚUÖ¢Wá˜'G2‚WfW'í&∆ˆ6≤ó2&˜fVÊÊ6R◊FvvVBá6VR7&2ˆWá˜'B÷ß6ˆ‚Êß2í–¢ÚÚ˜7FñÊw2ÊB&Vvó7G'íf7G2&RfW&&Fñ“¬˜&u&VBÊBFÜR÷F6Ç'V6∂WG2&P¢ÚÚFW&ófVB¬FÜR˜fW'fñWrÊBFÜRvVÁG2÷ˆFV¬&Rí÷WFÜ˜&VB‚V◊Gí&∆ˆ6∑2&P¢ÚÚ∂WB&FÜW"FÜ‚G&˜VC¢'vR∆ˆˆ∂VBÊBf˜VÊBÊ˜FÜñÊr"ÊB'vRÊWfW ¢ÚÚ∆ˆˆ∂VB"&RFñffW&VÁBf7G2ÊBFÜRfñ∆R6Ü˜V∆B&R&∆RFÚFV∆¬FÜV“'B‡¢6ˆÁ7BWá˜'E˜7FñÊr“W6T6∆∆&6≤ÜgVÊ7Fñˆ‚Ü¶ˆ"í∞¢F˜vÊ∆ˆDß6ˆ‚Ä¢Wá˜'Dfñ∆VÊ÷RÇ'˜7FñÊr"¬Ü¶ˆ"ÊV◊∆˜ñW"Ú¶ˆ"ÊV◊∆˜ñW"≤"“"¢""í≤Ü¶ˆ"ÁFóF∆R«¬""íí¿¢VÁfV∆˜Rá∞¢66˜S¢'˜7FñÊr"¿¢fW'6ñˆ„¢ıdU%4îÙ‚¿¢VW'ì¢≤V◊∆˜ñW#¢7FFRÁVW'í«¬6ˆ◊ÁïVW'í«¬ÁV∆¬“¿¢&∆ˆ6∑3¢∞¢˜7FñÊs¢&∆ˆ6≤Ä¢ı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢¶ˆ"Á6˜W&6R””“&6&VW'2Êv˜bÁ6r"Ú&6&VW'2Êv˜bÁ6r"¢$◊î6&VW'4gWGW&R"¿¢&WG&ñWfVDC¢ÊWrFFRÇíÁFÙï4ı7G&ñÊrÇí¬Fñ÷UvñÊF˜s¢&∆ófRB&WG&ñWf¬"“¿¢¶ˆ ¢í¿¢“¿¢“ê¢ì∞¢“¬∑7FFRÁVW'í¬6ˆ◊ÁïVW'ï“ì∞†¢6ˆÁ7BWá˜'D˜&vÊó6Fñˆ‚“W6T6∆∆&6≤ÜgVÊ7Fñˆ‚Çí∞¢6ˆÁ7BÊ÷R“Ü7FófT÷F6Çbb7FófT÷F6ÇÊÊ÷Rí«¬7FFRÁVW'í«¬6ˆ◊ÁïVW'í«¬&˜&vÊó6Fñˆ‚#∞¢6ˆÁ7BÊ˜r“ÊWrFFRÇíÁFÙï4ı7G&ñÊrÇì∞¢F˜vÊ∆ˆDß6ˆ‚Ä¢Wá˜'Dfñ∆VÊ÷RÇ&˜VÊñÊw2"¬Ê÷Rí¿¢VÁfV∆˜Rá∞¢66˜S¢&˜&vÊó6Fñˆ‚"¿¢fW'6ñˆ„¢ıdU%4îÙ‚¿¢VW'ì¢≤V◊∆˜ñW#¢Ê÷R¬GóVC¢6ˆ◊ÁïVW'í«¬ÁV∆¬¬VW'î∂Wì¢7FFRÁVW'î∂Wí«¬ÁV∆¬“¿¢&∆ˆ6∑3¢∞¢÷6e˜7FñÊw3¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢$◊î6&VW'4gWGW&R"¬&WG&ñWfVDC¢Ê˜r¬Fñ÷UvñÊF˜s¢&∆ófRB&WG&ñWf¬"¿¢Ê˜FS¢%ˆ∆∆VB"≤á7FFRÁvW5ˆ∆∆VB«¬í≤"vRá2ì≤gWßßíˆ∆¬÷í÷ó72˜7FñÊw2fñ∆VBVÊFW"FñffW&VÁF«í◊7V∆∆VBV◊∆˜ñW"Ê÷R‚"“¿¢÷6dfñ«FW&VE6˜'FVBí¿¢76u˜7FñÊw3¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢&6&VW'2Êv˜bÁ6r"¬&WG&ñWfVDC¢76u&WG&ñWfVDB«¬Ê˜r¿¢Fñ÷UvñÊF˜s¢&6&VW'2Êv˜bÁ6rFˆW2Ê˜BWá˜6RóG2˜v‚&Vg&W6ÇvñÊF˜s≤FÜó2ó2vÜV‚FÜó26∆ñVÁB&WG&ñWfVBóB"“¿¢76u7FFRÊ¶ˆ'2í¿¢V◊∆˜ñW$÷F6ÜW3¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢$◊î6&VW'4gWGW&R"¬&WG&ñWfVDC¢Ê˜r“¬7FFRÊ÷F6ÜW2í¿¢&Vvó7G&Fñˆ„¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢$5$ÜFFÊv˜bÁ6rí"¬&WG&ñWfVDC¢Ê˜r“¬V◊&Vrí¿¢∆ˆ6Fñˆ„¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢$ˆÊT÷"¬&WG&ñWfVDC¢Ê˜r“¬V◊vVÚí¿¢˜&vÊó6FñˆÂ&VC¢&∆ˆ6≤Ñı$îtî‚‰DU$ïdTB¿¢≤6˜W&6S¢&'Vñ∆D˜&u&VBÇíñ‚FÜó2"¬Ê˜FS¢$FWFW&÷ñÊó7Fñ26ñvÊ«26ˆ◊WFVBg&ˆ“FÜRfW&&Fñ“&∆ˆ6∑2&˜fR‚"“¿¢˜&u&VBí¿¢6ˆ◊Áî˜fW'fñWs¢&∆ˆ6≤Ñı$îtî‚‰í¿¢≤6˜W&6S¢$∆ÊwVvR÷ˆFV¬fñˆíˆ6∆VFR"¿¢6ˆÊfñFVÊ6S¢6ˆ◊Áî˜fW'fñWrÁ7FGW2””“'&VGí"Ú&G&gB"¢6ˆ◊Áî˜fW'fñWrÁ7FGW2¿¢Ê˜FS¢%&˜6Rw&óGFV‚'í∆ÊwVvR÷ˆFV¬g&ˆ“FÜRf7G2&˜fR‚G&VB2G&gB¬Ê˜Bf7B‚"“¿¢6ˆ◊Áî˜fW'fñWrÁ7FGW2””“'&VGí"Ú6ˆ◊Áî˜fW'fñWrÊFF¢ÁV∆¬í¿¢vVÁG4÷ˆFV√¢&∆ˆ6≤Ñı$îtî‚‰í¿¢≤6˜W&6S¢$∆ÊwVvR÷ˆFV¬fñˆíˆ6∆VFR"¬6ˆÊfñFVÊ6S¢vVÁG5fñWr””“'&VGí"Ú&G&gB"¢vVÁG5fñWr“¿¢vVÁG5fñWr””“'&VGí"ÚvVÁG4÷ˆFV¬¢ÁV∆¬í¿¢“¿¢“ê¢ì∞¢“¬∂7FófT÷F6Ç¬7FFR¬6ˆ◊ÁïVW'í¬÷6dfñ«FW&VE6˜'FVB¬76u7FFRÊ¶ˆ'2¬76u&WG&ñWfVDB¿¢V◊&Vr¬V◊vVÚ¬˜&u&VB¬6ˆ◊Áî˜fW'fñWr¬vVÁG4÷ˆFV¬¬vVÁG5fñWu“ì∞†¢6ˆÁ7B6˜î∆ˆFVD˜VÊñÊw2“W6T6∆∆&6≤ÜgVÊ7Fñˆ‚Çí∞¢6ˆÁ7Bñ∆ˆB“•4Ù‚Á7G&ñÊvñgíÜ7FófT¶ˆ'2¬ÁV∆¬¬"ì∞¢6ˆÁ7B÷&¥6˜ñVB“gVÊ7Fñˆ‚Çí∞¢6WD6˜î˜VÊñÊw57FFRÇ&6˜ñVB"ì∞¢vñÊF˜rÁ6WEFñ÷V˜WBÜgVÊ7Fñˆ‚Çí≤6WD6˜î˜VÊñÊw57FFRÇ&ñF∆R"ì≤“¬##ì∞¢”∞¢6ˆÁ7Bf∆∆&6¥6˜í“gVÊ7Fñˆ‚Çí∞¢6ˆÁ7BfñV∆B“Fˆ7V÷VÁBÊ7&VFTV∆V÷VÁBÇ'FWáF&V"ì∞¢fñV∆BÁf«VR“ñ∆ˆC∞¢fñV∆BÁ6WDGG&ñ'WFRÇ'&VFˆÊ«í"¬""ì∞¢fñV∆BÁ7Gñ∆RÁ˜6óFñˆ‚“&fóÜVB#∞¢fñV∆BÁ7Gñ∆RÊ˜6óGí“##∞¢Fˆ7V÷VÁBÊ&ˆGíÊVÊD6Üñ∆BÜfñV∆Bì∞¢fñV∆BÁ6V∆V7BÇì∞¢6ˆÁ7Bˆ≤“Fˆ7V÷VÁBÊWÜV46ˆ÷÷ÊBÇ&6˜í"ì∞¢Fˆ7V÷VÁBÊ&ˆGíÁ&V÷˜fT6Üñ∆BÜfñV∆Bì∞¢ñbÜˆ≤í÷&¥6˜ñVBÇì≤V«6R6WD6˜î˜VÊñÊw57FFRÇ&W'&˜""ì∞¢”∞¢ñbÜÊfñvF˜"Ê6∆ó&ˆ&BbbvñÊF˜rÊó56V7W&T6ˆÁFWáBí∞¢ÊfñvF˜"Ê6∆ó&ˆ&BÁw&óFUFWáBáñ∆ˆBíÁFÜV‚Ü÷&¥6˜ñVBíÊ6F6ÇÜf∆∆&6¥6˜íì∞¢“V«6R∞¢f∆∆&6¥6˜íÇì∞¢–¢“¬∂7FófT¶ˆ'5“ì∞†¢ñbá7FFRÊ∆ˆFñÊrí∞¢&WGW&‚Ä¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6ccñfb"¬&˜&FW#¢#Ç6ˆ∆ñB6&SffB"¬&˜&FW%&FóW3¢¬FFñÊs¢#3'Ç#Ç"¬FWáD∆ñv„¢&6VÁFW""◊”‡¢ƒñÊ∆ñÊU7ñÊÊW"6ó¶S◊≥3“FÜñ6∂ÊW73◊≥7“6ˆ∆˜#“"3SfF""G&6¥6ˆ∆˜#“"6&SffB"7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñ„¢#WFÚ'Ç"◊“Û‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"33cñ"◊”Â6V&6ÜñÊr◊î6&VW'4gWGW&Rf˜"'∂6ˆ◊ÁïVW'ó“"‚‚„¬˜‡¢¬ˆFóc‡¢ì∞¢–†¢ÚÚˆÊ«í6Ü˜rFÜR6&VW'2Êv˜bÁ6r6ˆ«V÷‚vÜV‚óBó2∆ˆFñÊr˜"7GV∆«íÜ2&ˆ∆W2‡¢ÚÚf˜"&ófFRÚ‘4bV◊∆˜ñW"ÜRÊr‚D%2íFÜW&R&RÊˆÊR“6ÚG&˜FÜR&VGVÊFÁ@¢ÚÚ&ÊÚ&ˆ∆W2"ÊV¬ÊB∆WBFÜR◊î6&VW'4gWGW&R&W7V«G2F∂RFÜRgV∆¬vñGFÇ‡¢6ˆÁ7B6Ü˜t76r“76u7FFRÊ∆ˆFñÊr«¬Ç76u7FFRÊf∆∆&6≤bb76u7FFRÊ¶ˆ'2Ê∆VÊwFÇ‚ì∞††¢&WGW&‚Ä¢∆Fób6∆74Ê÷S◊≤&6ˆ◊Áí◊ÊV¬"≤á6Ü˜t76rÚ"76r÷6ˆ«2"¢""ó”‡¢≤Ú¢6ˆ◊Áí6V&6Çó2‚V&«í&˜WFRÊBFˆW2Ê˜B÷˜VÁBFÜR∆FW ¢&W7V«G2◊v˜&∑76R7Gñ∆W6ÜVWB‚∂VWóG2&W7ˆÁ6ófR&VFñÊrvVˆ÷WG'ê¢&W6ñFRFÜR6ˆ◊ˆÊVÁB6Ú7FW6ÊÊ˜B6ñ∆VÁF«íf∆¬&6≤FÚ&∆ˆ6∑2‚¢˜–¢«7Gñ∆SÁ∂ ¢Ê6ˆ◊Áí÷˜˜'GVÊóGí÷w&ñB≤Fó7∆ì¶w&ñC≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g#≤v£É≤∆ñv‚÷óFV◊3ß7F'C≤–¢÷VFñÜ÷ñ‚◊vñGFÉ£sÇí≤Ê6ˆ◊Áí÷˜˜'GVÊóGí÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ"∆÷ñÊ÷ÇÉ√g"íì≤“–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷˜˜'GVÊóGí÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g#≤–¢Ê6ˆ◊Áí÷÷ˆ&ñ∆R÷ˆÊ«í≤Fó7∆ì¶ÊˆÊS≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí◊ÊV¬≤vñGFÉ£S≤÷ñ‚◊vñGFÉ£≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷FW6∑F˜◊6˜W&6R◊&˜r≤Fó7∆ì¶ÊˆÊRñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷ñFVÁFóGí÷6&B≤FFñÊs£gÇñ◊˜'FÁC≤÷&vñ‚÷&˜GFˆ”£'Çñ◊˜'FÁC≤&˜&FW"◊&FóW3£GÇñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷ñFVÁFóGí÷FW6∑F˜≤Fó7∆ì¶ÊˆÊS≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷÷ˆ&ñ∆R÷ˆÊ«í≤Fó7∆ì¶&∆ˆ6≥≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷÷ˆ&ñ∆R÷FV6ó6ñˆ‚≤Fó7∆ì¶w&ñC≤v£É≤÷&vñ„£'É≤FFñÊs£GÉ≤&6∂w&˜VÊC¢6ffc≤&˜&FW#£Ç6ˆ∆ñB6CñFVSc≤&˜&FW"◊&FóW3£GÉ≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷÷ˆ&ñ∆R÷FV6ó6ñˆ‚'WGFˆ‚≤vñGFÉ£S≤÷ñ‚÷ÜVñváC£CáÉ≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí◊&Vvó7G&Fñˆ‚≤FFñÊs£ñ◊˜'FÁC≤˜fW&f∆˜s¶ÜñFFV„≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí◊&Vvó7G&Fñˆ‚◊Fˆvv∆R≤Fó7∆ì¶f∆WÉ≤vñGFÉ£S≤÷ñ‚÷ÜVñváC£CáÉ≤∆ñv‚÷óFV◊3¶6VÁFW#≤ßW7Fñgí÷6ˆÁFVÁCß76R÷&WGvVV„≤FFñÊs£ÇGÉ≤&6∂w&˜VÊC¢6ffc≤&˜&FW#£≤6ˆ∆˜#¢3#&3≤fˆÁC¶ñÊÜW&óC≤fˆÁB◊6ó¶S¢„ÉsW&V”≤fˆÁB◊vVñváC£sS≤FWáB÷∆ñv„¶∆VgC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí◊&Vvó7G&Fñˆ‚÷6ˆÁFVÁB≤Fó7∆ì¶ÊˆÊS≤FFñÊs£GÇGÉ≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí◊&Vvó7G&Fñˆ‚Ê÷ˆ&ñ∆R÷˜V‚Ê6ˆ◊Áí◊&Vvó7G&Fñˆ‚÷6ˆÁFVÁB≤Fó7∆ì¶&∆ˆ6≥≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷í◊G&ñvvW"÷FW6∑F˜≤Fó7∆ì¶ÊˆÊRñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷˜˜'GVÊóGí◊Fˆˆ«2≤÷&vñ„£gÇÉ≤FFñÊr◊F˜£GÉ≤&˜&FW"◊F˜£Ç6ˆ∆ñB6CñFVSc≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷÷ˆ&ñ∆R◊Fˆˆ¬◊&˜r≤Fó7∆ì¶w&ñC≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3¶÷ñÊ÷ÇÉ√g"íWFÚWFÛ≤v£áÉ≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷÷ˆ&ñ∆R◊Fˆˆ¬◊&˜rñÁWB≤vñGFÉ£S≤÷ñ‚◊vñGFÉ£≤÷ñ‚÷ÜVñváC£CáÉ≤&˜&FW#£Ç6ˆ∆ñB63vC&SC≤&˜&FW"◊&FóW3£É≤FFñÊs£Ç'É≤fˆÁB◊6ó¶S£&V”≤6ˆ∆˜#¢3#&3≤&6∂w&˜VÊC¢6ffc≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷fñ«FW"÷6ˆÁG&ˆ«2≤Fó7∆ì¶ÊˆÊRñ◊˜'FÁC≤÷&vñ‚◊F˜£Çñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷fñ«FW"÷6ˆÁG&ˆ«2Ê÷ˆ&ñ∆R÷˜V‚≤Fó7∆ì¶f∆WÇñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷fñ«FW"÷6ˆÁG&ˆ«2‚¢≤÷ñ‚÷ÜVñváC£CGÇñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷¶ˆ"÷6&B≤FFñÊs£GÇñ◊˜'FÁC≤&˜&FW"◊&FóW3£GÇñ◊˜'FÁC≤6ˆÁFVÁB◊fó6ñ&ñ∆óGì¶WFÛ≤6ˆÁFñ‚÷ñÁG&ñÁ6ñ2◊6ó¶S£#cÉ≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷¶ˆ"÷6&BÊ÷6b÷¶ˆ"÷6&B÷ÜVB≤Fó7∆ì¢◊vV&∂óB÷&˜É≤˜fW&f∆˜s¶ÜñFFV„≤◊vV&∂óB÷&˜Ç÷˜&ñVÁCßfW'Fñ6√≤◊vV&∂óB÷∆ñÊR÷6∆◊£3≤fˆÁB◊6ó¶S£&V“ñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷¶ˆ"÷6&BÊ÷6b÷¶ˆ"÷V◊∆˜ñW"≤Fó7∆ì¶ÊˆÊS≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷¶ˆ"÷6&BÊ÷6b÷¶ˆ"÷÷˜&R≤÷ñ‚÷ÜVñváC£CGÉ≤Fó7∆ì¶ñÊ∆ñÊR÷f∆WÉ≤∆ñv‚÷óFV◊3¶6VÁFW#≤FFñÊs£GÇñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí÷¶ˆ"÷6&BÊ÷6b÷¶ˆ"◊&ñ÷'í÷7FñˆÁ2'WGFˆ‚≤vñGFÉ£S≤÷ñ‚÷ÜVñváC£CáÉ≤&˜&FW"◊&FóW3£óÇñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Ê6ˆ◊Áí◊6˜W&6R÷Ê˜FR≤Fó7∆ì¶ÊˆÊS≤–¢”¬˜7Gñ∆S‡¢≤Ú¢ƒTeB4Ù≈T‘„¢◊î6&VW'4gWGW&R6ˆ◊Áí&W7V«G2¢˜–¢∆Fób6∆74Ê÷S“&6ˆ◊Áí◊&ñ÷'í÷6ˆ«V÷‚#‡¢∆Fób6∆74Ê÷S“&6ˆ◊Áí÷FW6∑F˜◊6˜W&6R◊&˜r"7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬÷&vñ‰&˜GFˆ”¢◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢2¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢2ÁFWáB◊”‚b3#sCÉ≤b3#sCcÉ≤◊î6&VW'4gWGW&S¬˜7„‡¢≤7FFRÊf∆∆&6≤bb7FFRÊ÷F6ÜW2Ê∆VÊwFÇ‚bb7FófT÷F6ÇbbÄ¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢„R¬6ˆ∆˜#¢2Ê◊WFVB◊”‚á∂7FófT÷F6ÇÊ6˜VÁG“˜7FñÊw∂7FófT÷F6ÇÊ6˜VÁB””“Ú""¢'2'“ì¬˜7„‡¢ó–¢≤Ú¢UÖ¢Wá˜'G2WfW'óFÜñÊrFÜó2ÊV¬Üˆ∆G2¬Ê˜BßW7BFÜR‘4b6ˆ«V÷‚–¢˜7FñÊw2g&ˆ“&˜FÇ6˜W&6W2¬FÜR&Vvó7G'í÷F6Ç¬FÜR÷¬FÜRFW&ófV@¢&VBÊBFÜRí˜fW'fñWr¬V6ÇFvvVBvóFÇóG2˜&ñvñ‚‚¢˜–¢≤7FFRÊ∆ˆFñÊrbbá7FFRÊ÷F6ÜW2Ê∆VÊwFÇ‚«¬76u7FFRÊ¶ˆ'2Ê∆VÊwFÇ‚íbbÄ¢«7‚7Gñ∆S◊∑≤÷&vñ‰∆VgC¢&WFÚ"◊”‡¢ƒF˜vÊ∆ˆDß6ˆ‰'WGFˆ‡¢ˆ‰6∆ñ6≥◊∂Wá˜'D˜&vÊó6FñˆÁ–¢∆&V√◊≤$F˜vÊ∆ˆB∆¬˜VÊñÊw2ÊB˜&vÊó6Fñˆ‚FF2•4Ù‚f˜""≤ÇÜ7FófT÷F6Çbb7FófT÷F6ÇÊÊ÷Rí«¬7FFRÁVW'í«¬6ˆ◊ÁïVW'í«¬'FÜó2V◊∆˜ñW""ó–¢FóF∆S“$F˜vÊ∆ˆBWfW'óFÜñÊrˆ‚FÜó2vR2•4Ù‚ ¢Û‡¢¬˜7„‡¢ó–¢¬ˆFóc‡†¢≤á7FFRÊf∆∆&6≤«¬7FFRÊ÷F6ÜW2Ê∆VÊwFÇ””“íÚÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢2Ê÷&W$&r¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê÷&W$&G"¬&˜&FW%&FóW3¢¬FFñÊs¢##ÇáÇ"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"3sÉ3Sb"¬∆ñÊTÜVñváC¢„b◊”‡¢∑7FFRÊ÷W76vR«¬$ÊÚ∆ófR◊î6&VW'4gWGW&R˜7FñÊw2f˜VÊBf˜"FÜB6ˆ◊Áí‚'–¢¬˜‡¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‡¢6ˆ◊ÁíÊ÷W2ÊB˜7FñÊr6˜VÁG2&RfW&&Fñ“g&ˆ“◊î6&VW'4gWGW&Ráˆ∆∆VB∑7FFRÁvW5ˆ∆∆VG“vRá2íì≤gWßßíˆ∆¬÷í÷ó72˜7FñÊw2fñ∆VBVÊFW"FñffW&VÁF«í◊7V∆∆VBV◊∆˜ñW"Ê÷R‡¢¬˜‡¢¬ˆFóc‡¢í¢Ä¢√‡¢∆Fób6∆74Ê÷S“&6ˆ◊Áí÷ñFVÁFóGí÷6&B"7Gñ∆S◊∑≤&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3¢¬FFñÊs¢#gÇáÇ"¬÷&vñ‰&˜GFˆ”¢b◊”‡¢∂7FófT÷F6ÇÚÄ¢√‡¢∆É"6∆74Ê÷S“'B÷ÜVFñÊr6ˆ◊Áí÷ñFVÁFóGí÷FW6∑F˜"7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„#W&V“"¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢2ÁFWáB◊”‡¢≤$f˜VÊC¢"≤7FófT÷F6ÇÊFó7∆îÊ÷R≤"“"≤7FófT÷F6ÇÊ6˜VÁB≤"∆ófR˜7FñÊr"≤Ü7FófT÷F6ÇÊ6˜VÁB””“Ú""¢'2"í≤"ˆ‚◊î6&VW'4gWGW&R'–¢¬ˆÉ#‡¢∆É"6∆74Ê÷S“'B÷ÜVFñÊr6ˆ◊Áí÷÷ˆ&ñ∆R÷ˆÊ«í"7Gñ∆S◊∑≤÷&vñ„¢#WÇ"¬fˆÁE6ó¶S¢#„3sW&V“"¬∆ñÊTÜVñváC¢„"¬fˆÁEvVñváC¢ÉS¬6ˆ∆˜#¢2ÁFWáB¬˜fW&f∆˜uw&¢&ÁóvÜW&R"◊”Á∂7FófT÷F6ÇÊFó7∆îÊ÷W”¬ˆÉ#‡¢«6∆74Ê÷S“&6ˆ◊Áí÷÷ˆ&ñ∆R÷ˆÊ«í"7Gñ∆S◊∑≤÷&vñ„¢#óÇ"¬fˆÁE6ó¶S¢"„ÉsW&V“"¬6ˆ∆˜#¢2ÁFWáE7V"◊”Á∂7FófT÷F6ÇÊ6˜VÁG“∆ˆFVB˜˜'GVÊóG∂7FófT÷F6ÇÊ6˜VÁB””“Ú'í"¢&ñW2'”¬˜‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáE7V"◊”‡¢«7‚7Gñ∆S◊∑≤Fó7∆ì¢&ñÊ∆ñÊR÷&∆ˆ6≤"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3cscfR"¬÷&vñÂ&ñváC¢◊”Â6˜W&6S¢◊î6&VW'4gWGW&S¬˜7„‡¢≤Ú¢dƒır”#¢˜&rFó66∆˜7W&R6Üó“VW'î∂Wí””“÷F6Ñ∂Wí÷VÁ2FÜRGóV@¢VW'í&W6ˆ«fVBFÚWÜ7F«íˆÊRV◊∆˜ñW"∂Wì≤ÊÚÊWrgWßßí÷F6ÜñÊr‚¢˜–¢∑7FFRÁVW'î∂Wíbb7FFRÁVW'î∂Wí””“7FófT÷F6ÇÊ∂WíbbÄ¢«7‚FóF∆S“%FÜRGóVB6ˆ◊ÁíÊ÷R&W6ˆ«fVBFÚWÜ7F«íˆÊR◊î6&VW'4gWGW&RV◊∆˜ñW"∂Wí"7Gñ∆S◊∑≤Fó7∆ì¢&ñÊ∆ñÊR÷&∆ˆ6≤"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢s¬&6∂w&˜VÊC¢"6VVccR"¬&˜&FW#¢#Ç6ˆ∆ñB6CñFVSb"¬&˜&FW%&FóW3¢¬FFñÊs¢#ÇáÇ"¬6ˆ∆˜#¢2Ê◊WFVB¬÷&vñÂ&ñváC¢Ç◊”„“WÜ7BV◊∆˜ñW"÷F6É¬˜7„‡¢ó–¢«7‚6∆74Ê÷S“&6ˆ◊Áí÷ñFVÁFóGí÷FW6∑F˜#‰6ˆ◊ÁíÊ÷RÊB˜7FñÊr6˜VÁB&RfW&&Fñ“g&ˆ“◊î6&VW'4gWGW&R„¬˜7„‡¢¬˜‡¢¬Û‡¢í¢Ä¢√‡¢∆É"6∆74Ê÷S“'B÷ÜVFñÊr"7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„#W&V“"¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢2ÁFWáB◊”‡¢≤%6WfW&¬V◊∆˜ñW'2÷F6Ç¬""≤á7FFRÁVW'í«¬6ˆ◊ÁïVW'íí≤%¬#¢'–¢¬ˆÉ#‡¢«7Gñ∆S◊∑≤÷&vñ„¢#'Ç"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáE7V"◊”‡¢«7‚7Gñ∆S◊∑≤Fó7∆ì¢&ñÊ∆ñÊR÷&∆ˆ6≤"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3cscfR"¬÷&vñÂ&ñváC¢◊”Â6˜W&6S¢◊î6&VW'4gWGW&S¬˜7„‡¢∑7FFRÊ÷&ñwV˜W2bbÄ¢«7‚FóF∆S“%6WfW&¬V◊∆˜ñW"∂Wó2÷F6ÜVBFÜRGóVBÊ÷R“ñ6≤FÜRˆÊRñ˜R÷VÁB"7Gñ∆S◊∑≤Fó7∆ì¢&ñÊ∆ñÊR÷&∆ˆ6≤"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢s¬&6∂w&˜VÊC¢"6VVccR"¬&˜&FW#¢#Ç6ˆ∆ñB6CñFVSb"¬&˜&FW%&FóW3¢¬FFñÊs¢#ÇáÇ"¬6ˆ∆˜#¢2Ê◊WFVB¬÷&vñÂ&ñváC¢Ç◊”Á‚6∆˜6W7BV◊∆˜ñW"÷F6ÜW2“ñ6≤ˆÊS¬˜7„‡¢ó–¢6V∆V7BˆÊRV◊∆˜ñW"FÚfñWrFÜVó"˜7FñÊw2‚6˜VÁG2&RfW&&Fñ“g&ˆ“◊î6&VW'4gWGW&R‡¢¬˜‡¢∆Fób&ˆ∆S“&∆ó7B"&ñ÷∆&V√“$÷F6ÜVBV◊∆˜ñW'2“6V∆V7BˆÊRFÚfñWr˜7FñÊw2#‡¢∑7FFRÊ÷F6ÜW2Ê÷ÜgVÊ7Fñˆ‚Ü“í∞¢&WGW&‚Ä¢∆'WGFˆ‚∂Wì◊∂“Ê∂Wó“&ˆ∆S“&∆ó7FóFV“ ¢&ñ÷∆&V√◊∂“ÊFó7∆îÊ÷R≤"“"≤“Ê6˜VÁB≤"˜7FñÊr"≤Ü“Ê6˜VÁB””“Ú""¢'2"ó–¢ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤6WD6Ü˜6V‰∂WíÜ“Ê∂Wíì≤◊–¢7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬vñGFÉ¢#R"¬÷ñ‰ÜVñváC£CB¬FWáD∆ñv„¢&∆VgB"¬÷&vñ‰&˜GFˆ”£Ç¬FFñÊs¢#ÇGÇ"¬&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3¢Ç¬7W'6˜#¢'ˆñÁFW""¬fˆÁC¢&ñÊÜW&óB"¬v£"◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„ì3sW&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢2ÁFWáB◊”Á∂“ÊFó7∆îÊ÷W”¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3SsCì"¬&6∂w&˜VÊC¢2ÁFVƒ&r¬&˜&FW#¢#Ç6ˆ∆ñB"≤2ÁFVƒ&G"¬&˜&FW%&FóW3¢¬FFñÊs¢#'ÇÇ"¬vÜóFU76S¢&Ê˜w&"¬f∆WÖ6á&ñÊ≥¢◊”Á∂“Ê6˜VÁG“˜7FñÊw∂“Ê6˜VÁB””“Ú""¢'2'”¬˜7„‡¢¬ˆ'WGFˆ„‡¢ì∞¢“ó–¢¬ˆFóc‡¢¬Û‡¢ó–¢¬ˆFóc‡†¢∂7FófT÷F6ÇbbvVÁG5fñWr””“&ˆfb"bbÄ¢«6V7Fñˆ‚6∆74Ê÷S“&6ˆ◊Áí÷÷ˆ&ñ∆R÷ˆÊ«í6ˆ◊Áí÷÷ˆ&ñ∆R÷FV6ó6ñˆ‚"&ñ÷∆&V√“$6Üˆ˜6R˜&vÊó6Fñˆ‚˜"ñÊFófñGV¬Ê«ó6ó2#‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤∆ˆDGWFñW2Ü7FófT÷F6Çì≤◊“&ñ÷∆&V√◊≤$Wá∆˜&R˜&vÊó6Fñˆ‚v˜&≤B"≤7FófT÷F6ÇÊFó7∆îÊ÷W–¢7Gñ∆S◊∑≤FFñÊs¢#ÇGÇ"¬&6∂w&˜VÊC¢2Ê66VÁB¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢¬6ˆ∆˜#¢"6ffb"¬fˆÁE6ó¶S¢"„ÉsW&V“"¬fˆÁEvVñváC¢É¬7W'6˜#¢'ˆñÁFW""¬FWáD∆ñv„¢&∆VgB"◊”‡¢Wá∆˜&R˜&vÊó6Fñˆ‚v˜&∞¢«7‚7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñÂF˜¢2¬fˆÁE6ó¶S¢"„sW&V“"¬fˆÁEvVñváC¢S¬˜6óGì¢„í◊”Â&WVFVBv˜&≤¬6&ñ∆óFñW2ÊBí÷ˆ÷VÁG3¬˜7„‡¢¬ˆ'WGFˆ„‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤˜˜'GVÊóGî∆ó7E&VbÊ7W'&VÁBbb˜˜'GVÊóGî∆ó7E&VbÊ7W'&VÁBÁ67&ˆ∆ƒñÁFıfñWrá≤&VÜfñ˜#¢'6÷ˆ˜FÇ"¬&∆ˆ6≥¢'7F'B"“ì≤◊–¢7Gñ∆S◊∑≤FFñÊs¢#ÇGÇ"¬&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#„WÇ6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3¢¬6ˆ∆˜#¢2ÁFWáB¬fˆÁE6ó¶S¢"„ÉsW&V“"¬fˆÁEvVñváC¢É¬7W'6˜#¢'ˆñÁFW""¬FWáD∆ñv„¢&∆VgB"◊”‡¢Ê«ó6R‚ñÊFófñGV¬&ˆ∆P¢«7‚7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñÂF˜¢2¬fˆÁE6ó¶S¢"„sW&V“"¬fˆÁEvVñváC¢S¬6ˆ∆˜#¢2ÁFWáE7V"◊”‰'&˜w6R∂7FófT÷F6ÇÊ6˜VÁG“∆ˆFVB˜˜'GVÊóFñW3¬˜7„‡¢¬ˆ'WGFˆ„‡¢¬˜6V7Fñˆ„‡¢ó–†¢≤Ú¢T’¢&Vvó7FW&VBV◊∆˜ñW"&∆ˆ6≤“FÜR5$FG&W72ıTT‚f7G2&˜WBFÜRfW'ê¢V◊∆˜ñW"FÜó267&VV‚ó266˜VBFÚ‚v2&Wfñ˜W6«íˆÊ«í6Ü˜v‚W"◊˜7FñÊrñ‡¢'&˜w6R4r¶ˆ'2rgV∆¬÷B÷ˆF¬¬ÊWfW"ÜW&RvÜW&RóBw2÷˜7BFó&V7F«í&V∆WfÁB‚¢˜–¢∂7FófT÷F6ÇbbÄ¢∆Fób6∆74Ê÷S◊≤&6ˆ◊Áí◊&Vvó7G&Fñˆ‚"≤Ü÷ˆ&ñ∆Tf7G4˜V‚Ú"÷ˆ&ñ∆R÷˜V‚"¢""ó“7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢b¬FFñÊs¢#'ÇgÇ"¬&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3¢◊”‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"6∆74Ê÷S“&6ˆ◊Áí÷÷ˆ&ñ∆R÷ˆÊ«í6ˆ◊Áí◊&Vvó7G&Fñˆ‚◊Fˆvv∆R"&ñ÷WáÊFVC◊∂÷ˆ&ñ∆Tf7G4˜VÁ“ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤6WD÷ˆ&ñ∆Tf7G4˜V‚ÜgVÊ7Fñˆ‚Ü˜V‚í≤&WGW&‚˜V„≤“ì≤◊”‡¢«7„‰&˜WBFÜó2˜&vÊó6Fñˆ„¬˜7„„«7‚&ñ÷ÜñFFV„“'G'VR#Á∂÷ˆ&ñ∆Tf7G4˜V‚Ú.(â""¢"≤'”¬˜7„‡¢¬ˆ'WGFˆ„‡¢∆Fób6∆74Ê÷S“&6ˆ◊Áí◊&Vvó7G&Fñˆ‚÷6ˆÁFVÁB#‡¢∆Fób7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬fˆÁEvVñváC¢s¬∆WGFW%76ñÊs¢"„&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬÷&vñ‰&˜GFˆ”¢r◊”Â$Ttï5DU$TBT’ƒıîU#¬ˆFóc‡†¢∂V◊&VrbbV◊&VrÁ7FGW2””“&∆ˆFñÊr"bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‰6ÜV6∂ñÊr5$&Vvó7G&Fñˆ‚‚‚„¬˜‡¢ó–†¢∂V◊&VrbbV◊&VrÁ7FGW2””“&FˆÊR"bbV◊&VrÊFFbbV◊&VrÊFFÊ÷F6ÜVB””“&WÜ7B"bbÇÇí”‚∞¢6ˆÁ7BB“V◊&VrÊFF∞¢6ˆÁ7BFG$∆ñÊW2“∂BÊ'Vñ∆FñÊr¬BÁ7G&VWB¬BÁ˜7F≈“Êfñ«FW"Ñ&ˆˆ∆V‚ì∞¢&WGW&‚Ä¢∆Fóc‡¢∂FG$∆ñÊW2Ê∆VÊwFÇ‚ ¢Ú«7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáB¬∆ñÊTÜVñváC¢„R◊”Á∂FG$∆ñÊW2Ê¶ˆñ‚Ç"¬"ó”¬˜‡¢¢«7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‰5$÷F6Çf˜VÊB'WBÊÚFG&W72fñV∆G2ˆ‚&V6˜&B„¬˜Á–¢∂BÊÊ÷W6∂W2‚bb«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"3vVr"◊”‰5$∆ó7G2∑∂BÊÊ÷W6∂W7“˜FÜW"∂BÊÊ÷W6∂W2””“Ú&VÁFóGí"¢&VÁFóFñW2'“vóFÇFÜó2Ê÷S≤6Ü˜vñÊrFÜRƒïdR◊7FGW2÷F6Ç„¬˜Á–¢∂BÁ˜7F¬bbÄ¢V◊vVÚbbV◊vVÚÁ7FGW2””“&FˆÊR"bbV◊vVÚÊFFbbV◊vVÚÊFFÊ÷F6ÜVB””“'6ñÊv∆R ¢Ú∆ñ÷r7&3◊≤"ˆíˆvVˆ6ˆFSˆ7Fñˆ„◊&VÊFW"g˜7F√“"≤VÊ6ˆFUU$î6ˆ◊ˆÊVÁBÜBÁ˜7F¬ó“«C◊≤$÷ñ‚ÊV"˜7F¬"≤BÁ˜7F«“ˆ‰W'&˜#◊≤ÜRí”‚≤RÊ7W'&VÁEF&vWBÁ7Gñ∆RÊFó7∆í“&ÊˆÊR#≤◊“7Gñ∆S◊∑≤vñGFÉ¢#R"¬÷ÖvñGFÉ¢3#¬ÜVñváC¢c¬ˆ&¶V7DfóC¢&6˜fW""¬&˜&FW%&FóW3¢r¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬÷&vñ‰&˜GFˆ”¢b¬Fó7∆ì¢&&∆ˆ6≤"◊“Û‡¢¢V◊vVÚbbV◊vVÚÁ7FGW2””“&∆ˆFñÊr ¢Ú«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‰∆ˆ6FñÊr÷ñ‚‚‚„¬˜‡¢¢«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‰÷&WfñWrÊ˜Bfñ∆&∆R“FÜR&Vvó7FW&VBFG&W72&˜fRó2FÜRfW&ñfñVBf7B„¬˜‡¢ó–¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”Â6˜W&6S¢5$ÜFFÊv˜bÁ6r¬ñÊf˜&÷Fñˆ‚ˆ‚6˜'˜&FRVÁFóFñW2íf÷ñFF˜C≤÷F6É¢WÜ7Bf÷ñFF˜C≤&WG&ñWfVB≤ÇÇí”‚≤G'í≤&WGW&‚ÊWrFFRÜV◊&VrÁ&WG&ñWfVDBíÁFÙ∆ˆ6∆U7G&ñÊrÇ&V‚’4r"¬≤Fì¢&ÁV÷W&ñ2"¬÷ˆÁFÉ¢'6Ü˜'B"¬ñV#¢&ÁV÷W&ñ2"¬Ü˜W#¢#"÷FñvóB"¬÷ñÁWFS¢#"÷FñvóB"¬Ü˜W##¢f«6R¬Fñ÷U¶ˆÊS¢$6ñı6ñÊv˜&R"“í≤"4uB#≤“6F6ÇÖÚí≤&WGW&‚V◊&VrÁ&WG&ñWfVDC≤““íÇó”¬˜‡¢¬ˆFóc‡¢ì∞¢“íÇó–†¢∂V◊&VrbbV◊&VrÁ7FGW2””“&FˆÊR"bbÇV◊&VrÊFF«¬V◊&VrÊFFÊ÷F6ÜVB”“&WÜ7B"íbbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‰ÊÚWÜ7B5$&Vvó7G&Fñˆ‚÷F6Çf˜"'∂7FófT÷F6ÇÊFó7∆îÊ÷W“"„¬˜‡¢ó–¢¬ˆFóc‡¢¬ˆFóc‡¢ó–†¢≤Ú¢4Û#¢$í÷ˆ÷VÁG2"G&ñvvW"“ˆÊ«í6Ü˜v‚vÜV‚6ñÊv∆RV◊∆˜ñW"ó26ˆÊfó&÷VB¢˜–¢∂7FófT÷F6ÇbbvVÁG5fñWr””“&ˆfb"bbÄ¢∆Fób6∆74Ê÷S“&6ˆ◊Áí÷í◊G&ñvvW"÷FW6∑F˜"7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢b¬&6∂w&˜VÊC¢"6Sc&fR"¬&˜&FW#¢#Ç6ˆ∆ñB3vFC6f2"¬&˜&FW%&FóW3¢¬FFñÊs¢#'ÇgÇ"¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬v¢"¬f∆WÖw&¢'w&"◊”‡¢∆Fóc‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢2¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"33cñ"◊”‰í÷ˆ÷VÁG2B∂7FófT÷F6ÇÊFó7∆îÊ÷W”¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢„R¬6ˆ∆˜#¢"33FfR"¬÷&vñÂF˜¢"◊”Â6VRvÜñ6Ç&V7W'&ñÊrGWFñW27&˜72FÜVó"&ˆ∆W26˜V∆B&V6ˆ÷RvVÁB6ÊFñFFW2“FWFW&÷ñÊó7Fñ2¬ÊÚƒƒ“„¬ˆFóc‡¢¬ˆFóc‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤∆ˆDGWFñW2Ü7FófT÷F6Çì≤◊“&ñ÷∆&V√◊≤$fñÊBí÷ˆ÷VÁG2B"≤7FófT÷F6ÇÊFó7∆îÊ÷W–¢7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢CB¬FFñÊs¢#áÇáÇ"¬&6∂w&˜VÊC¢"33cñ"¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢Ç¬6ˆ∆˜#¢"6ffb"¬fˆÁE6ó¶S¢2¬fˆÁEvVñváC¢s¬7W'6˜#¢'ˆñÁFW""¬vÜóFU76S¢&Ê˜w&"¬f∆WÖ6á&ñÊ≥¢◊”‡¢fñÊBí÷ˆ÷VÁG0¢¬ˆ'WGFˆ„‡¢∂vVÁG4W'&˜"bb«7Gñ∆S◊∑≤vñGFÉ¢#R"¬÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢„R¬6ˆ∆˜#¢"3sÉ3Sb"◊”Á∂vVÁG4W'&˜'”¬˜Á–¢¬ˆFóc‡¢ó–†¢≤Ú¢4Û#¢vVÁG2ÊV¬∆ˆFñÊr7FFR¢˜–¢∂7FófT÷F6ÇbbvVÁG5fñWr””“&∆ˆFñÊr"bbÄ¢∆Fób7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢b¬&6∂w&˜VÊC¢"6Sc&fR"¬&˜&FW#¢#Ç6ˆ∆ñB3vFC6f2"¬&˜&FW%&FóW3¢¬FFñÊs¢##ÇgÇ"¬FWáD∆ñv„¢&6VÁFW""◊”‡¢ƒñÊ∆ñÊU7ñÊÊW"6ó¶S◊≥#G“FÜñ6∂ÊW73◊≥7“6ˆ∆˜#“"33cñ"G&6¥6ˆ∆˜#“"3vFC6f2"7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñ„¢#WFÚÇ"◊“Û‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"33cñ"◊”Â&VFñÊrGWFñW2ÊB6«W7FW&ñÊr‚‚‚áWFÚRFWFñ¬fWF6ÜW2vóFÜñ‚'VFvWBì¬˜‡¢¬ˆFóc‡¢ó–†¢≤Ú¢4Û#¢vóFÜÜV∆B“ÜˆÊW7Bf∆∆&6≤vÜV‚6◊∆Ró2FˆÚFÜñ‚¢˜–¢∂7FófT÷F6ÇbbvVÁG5fñWr””“'vóFÜÜV∆B"bbvVÁG4÷ˆFV¬bbÄ¢∆Fób7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢b¬&6∂w&˜VÊC¢2Ê÷&W$&r¬&˜&FW#¢#ÇF6ÜVB"≤2Ê÷&W$&G"¬&˜&FW%&FóW3¢¬FFñÊs¢#GÇgÇ"◊”‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢2¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3sÉ3Sb"¬÷&vñ‰&˜GFˆ”¢b◊”‰í÷ˆ÷VÁG2“vóFÜÜV∆BÜÊ˜Bf∂VBì¬ˆFóc‡¢∂vVÁG4÷ˆFV¬ÁvóFÜÜV∆BÊ÷ÜgVÊ7Fñˆ‚ár¬íí∞¢&WGW&‚«∂Wì◊∂ó“7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢"„R¬6ˆ∆˜#¢"3sÉ3Sb"¬∆ñÊTÜVñváC¢„b◊”Á∑w”¬˜„∞¢“ó–¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢„R¬6ˆ∆˜#¢2Ê◊WFVB◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s◊”Â&˜fVÊÊ6S£¬˜7„‚∂vVÁG4÷ˆFV¬Á7FG2Á˜7FñÊw7“˜7FñÊw∂vVÁG4÷ˆFV¬Á7FG2Á˜7FñÊw2””“Ú""¢'2'“Ê«ó6VB“∂vVÁG4÷ˆFV¬Á7FG2ÊGWFñW7“GWGí∆ñÊW2WáG&7FVB“∂vVÁG4÷ˆFV¬Á7FG2Ê6«W7FW'7“6«W7FW'2f˜VÊB‡¢¬˜‡¢¬ˆFóc‡¢ó–†¢≤Ú¢4Û#¢vVÁG2ÊV¬“&VGí¢˜–¢∂7FófT÷F6ÇbbvVÁG5fñWr””“'&VGí"bbvVÁG4÷ˆFV¬bbvVÁG4∂uñ∆ˆBbbÄ¢∆Fób7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢b◊”‡¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6Sc&fR"¬&˜&FW#¢#Ç6ˆ∆ñB3vFC6f2"¬&˜&FW%&FóW3¢¬FFñÊs¢#'ÇgÇ"¬÷&vñ‰&˜GFˆ”¢"◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬v¢"¬f∆WÖw&¢'w&"◊”‡¢∆Fóc‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢2¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢"33cñ"◊”Á≤$í÷ˆ÷VÁG2B"≤7FófT÷F6ÇÊFó7∆îÊ÷W”¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢„R¬6ˆ∆˜#¢"33FfR"¬÷&vñÂF˜¢"◊”‡¢≤Ú¢$‚ˆb“G&v‚#¢FÜRÜVFW"6B&˜fRw&Ç6Ü˜vñÊrB÷˜7@¢4Ù’ÂïÙtTÂEÙ‘ÖÙEUDîU2¬6Ú&&R6«W7FW"6˜VÁBñÁfóFVBFÜP¢&VFW"FÚF∂RWfW'óFÜñÊr6˜VÁFVB2WfW'óFÜñÊr6Ü˜v‚‚FÜRv ¢vñFVÊVBˆÊ6RfñÊW"6«W7FW&ñÊr&ó6VBFÜRF˜F¬‚¢˜–¢¥÷FÇÊ÷ñ‚ÜvVÁG4÷ˆFV¬Á7FG2Ê6«W7FW'2¬4Ù’ÂïÙtTÂEÙ‘ÖÙEUDîU2ó“ˆb∂vVÁG4÷ˆFV¬Á7FG2Ê6«W7FW'7“GWGí6«W7FW'∂vVÁG4÷ˆFV¬Á7FG2Ê6«W7FW'2””“Ú""¢'2'“G&v‚“∂vVÁG4÷ˆFV¬Á7FG2ÊvVÁG7“vVÁB6ÊFñFFW∂vVÁG4÷ˆFV¬Á7FG2ÊvVÁG2””“Ú""¢'2'““∂vVÁG4÷ˆFV¬Á7FG2Á˜7FñÊw7“˜7FñÊw∂vVÁG4÷ˆFV¬Á7FG2Á˜7FñÊw2””“Ú""¢'2'“6◊∆V@¢«7‚7Gñ∆S◊∑≤÷&vñ‰∆VgC¢Ç¬fˆÁE6ó¶S¢¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"33FfR"¬&6∂w&˜VÊC¢"6&SffB"¬&˜&FW#¢#Ç6ˆ∆ñB3vFC6f2"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#ÇgÇ"◊”Á≤%Ùì¢"≤vVÁG4÷ˆFV¬Á6BÁˆíÁFw”¬˜7„‡¢«7‚7Gñ∆S◊∑≤÷&vñ‰∆VgC¢B¬fˆÁE6ó¶S¢¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3f#vÜB"¬&6∂w&˜VÊC¢"6ccVcí"¬&˜&FW#¢#Ç6ˆ∆ñB66&CVS"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#ÇgÇ"◊”Á≤&FWFñ¬÷fWF6ÜVC¢"≤vVÁG4÷ˆFV¬Á6BÁˆíÊFWFñƒfWF6ÜVG”¬˜7„‡¢¬ˆFóc‡¢¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬v¢Ç¬f∆WÖw&¢'w&"¬∆ñv‰óFV◊3¢&6VÁFW""◊”‡¢≤Ú¢"◊ví6Vv÷VÁFVB6ˆÁG&ˆ¬“6&G2¬ÊWW&¬‚Öv˜&∂f∆˜rG&˜VB“óBGW∆ñ6FV@¢FÜR6ˆ«V÷‚6&G2fñWs≤6&G2“&VF&∆R¬ÊWW&¬“F◊FÚ÷WáÊBw&Ç‚í¢˜–¢∆Fób&ˆ∆S“&w&˜W"&ñ÷∆&V√“$w&Ç∆ñ˜WB"7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬&˜&FW#¢#Ç6ˆ∆ñB3vFC6f2"¬&˜&FW%&FóW3¢Ç¬˜fW&f∆˜s¢&ÜñFFV‚"◊”‡¢µµ≤&∆ÊW2"¬$6&G2%“¬≤&f˜&6R"¬$ÊWW&¬%’“Ê÷ÜgVÊ7Fñˆ‚áó"í∞¢6ˆÁ7Bf¬“ó%≥“¬∆&¬“ó%≥”∞¢6ˆÁ7B7FófR“vVÁD∆ñ˜WB””“f√∞¢&WGW&‚Ä¢∆'WGFˆ‚∂Wì◊∑f«–¢ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤6WDvVÁD∆ñ˜WBáf¬ì≤◊–¢&ñ◊&W76VC◊∂7FófW–¢&ñ÷∆&V√◊∂∆&¬≤"∆ñ˜WB"≤Ü7FófRÚ"¬7W'&VÁF«í6V∆V7FVB"¢""ó–¢7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢CB¬÷ñÂvñGFÉ¢CB¬FFñÊs¢#WÇÇ"¬&6∂w&˜VÊC¢7FófRÚ"33cñ"¢"6ffb"¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&ñváC¢f¬”“&f˜&6R"Ú#Ç6ˆ∆ñB3vFC6f2"¢&ÊˆÊR"¬6ˆ∆˜#¢7FófRÚ"6ffb"¢"33cñ"¬fˆÁE6ó¶S¢"¬fˆÁEvVñváC¢s¬7W'6˜#¢'ˆñÁFW""◊”‡¢∂∆&«–¢¬ˆ'WGFˆ„‡¢ì∞¢“ó–¢¬ˆFóc‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤6WDvVÁG5fñWrÇ&ˆfb"ì≤6WDvVÁG4÷ˆFV¬ÜÁV∆¬ì≤6WDvVÁG4∂uñ∆ˆBÜÁV∆¬ì≤6WEFÊˆFTñBÜÁV∆¬ì≤◊–¢&ñ÷∆&V√“$6∆˜6Rí÷ˆ÷VÁG2ÊV¬ ¢7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢3b¬FFñÊs¢#WÇ'Ç"¬&6∂w&˜VÊC¢'G&Á7&VÁB"¬&˜&FW#¢#Ç6ˆ∆ñB3vFC6f2"¬&˜&FW%&FóW3¢Ç¬6ˆ∆˜#¢"33cñ"¬fˆÁE6ó¶S¢"¬fˆÁEvVñváC¢s¬7W'6˜#¢'ˆñÁFW""◊”‡¢6∆˜6P¢¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢¬ˆFóc‡¢¬ˆFóc‡†¢≤Ú¢4C¢∂Wí77V◊FñˆÁ2≤ÙíÊ˜Fñ6R¢˜–¢∆FWFñ«27Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢¬&6∂w&˜VÊC¢"6cÜff2"¬&˜&FW#¢#Ç6ˆ∆ñB6S&SÜc"¬&˜&FW%&FóW3¢Ç◊”‡¢«7V÷÷'í7Gñ∆S◊∑≤FFñÊs¢#áÇ'Ç"¬7W'6˜#¢'ˆñÁFW""¬fˆÁE6ó¶S¢"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3#&2"¬÷ñ‰ÜVñváC¢3b¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""◊”‡¢Ê«óFñ277V◊FñˆÁ2≤V∆óGíˆbñÊf˜&÷Fñˆ‚Ö4Bê¢¬˜7V÷÷'ì‡¢∆Fób7Gñ∆S◊∑≤FFñÊs¢#áÇGÇ'Ç"◊”‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢„R¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3SsCì"¬÷&vñ‰&˜GFˆ”¢B◊”‰∂Wí77V◊FñˆÁ3¬ˆFóc‡¢«V¬7Gñ∆S◊∑≤÷&vñ„¢¬FFñÊt∆VgC¢b◊”‡¢∂vVÁG4÷ˆFV¬Á6BÊ∂Wî77V◊FñˆÁ2Ê÷ÜgVÊ7Fñˆ‚Ü∂¬íí∞¢&WGW&‚∆∆í∂Wì◊∂ó“7Gñ∆S◊∑≤fˆÁE6ó¶S¢„R¬6ˆ∆˜#¢"33sCS"¬∆ñÊTÜVñváC¢„b¬÷&vñ‰&˜GFˆ”¢"◊”Á∂∂”¬ˆ∆ì„∞¢“ó–¢¬˜V√‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢„R¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3SsCì"¬÷&vñÂF˜¢Ç¬÷&vñ‰&˜GFˆ”¢B◊”‰Ê«ó6ó2ˆb6ˆ◊WFñÊráó˜FÜW6W2W"gVÊ7Fñˆ„¬ˆFóc‡¢∂vVÁG4÷ˆFV¬Á6BÊ6ÇÊ÷ÜgVÊ7Fñˆ‚Ü¬íí∞¢&WGW&‚Ä¢∆Fób∂Wì◊∂ó“7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢b¬FFñÊt&˜GFˆ”¢b¬&˜&FW$&˜GFˆ”¢í¬vVÁG4÷ˆFV¬Á6BÊ6ÇÊ∆VÊwFÇ“Ú#Ç6ˆ∆ñB6S&SÜc"¢&ÊˆÊR"◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3#&2"◊”Á∂ÊgVÊ7FñˆÁ”¢¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢"¬6ˆ∆˜#¢"33cñ"¬fˆÁEvVñváC¢s◊”Á∂ÁF˜”¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢„R¬6ˆ∆˜#¢"3f#vÜB"◊”‚á'VÊÊW"◊W¢∂Á'VÊÊW%W“ì¬˜7„‡¢¬ˆFóc‡¢ì∞¢“ó–¢¬ˆFóc‡¢¬ˆFWFñ«3‡†¢≤Ú¢Fˆ72◊7Gñ∆R"◊ÊS¢w&Ç6VÁG&R≤Fˆ6∂VBFWFñ«2ˆñÊFWÇ&ñ¬áFÜR˜&rW'7V7FófRí‚¢˜–¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬v¢b¬∆ñv‰óFV◊3¢&f∆WÇ◊7F'B"¬f∆WÖw&¢'w&"◊”‡¢∆÷ñ‚7Gñ∆S◊∑≤f∆WÉ¢#CcÇ"¬÷ñÂvñGFÉ¢¬&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#Ç6ˆ∆ñB6S&SÜc"¬&˜&FW%&FóW3¢B¬FFñÊs¢#Ç'Ç"◊”‡¢ƒ¥tw&Ç∂s◊∂vVÁG4∂uñ∆ˆG“ˆ‰ÊˆFUF◊∂ÜÊF∆TvVÁDÊˆFUF“∆ñ˜WC◊∂vVÁD∆ñ˜WG“V÷&VFFVBÛ‡¢¬ˆ÷ñ„‡¢∆6ñFR7Gñ∆S◊∑≤f∆WÉ¢##ÉÇ"¬÷ÖvñGFÉ¢3c¬÷ñÂvñGFÉ¢#S¬˜6óFñˆ„¢'7Fñ6∑í"¬F˜¢"¬∆ñvÂ6V∆c¢&f∆WÇ◊7F'B"◊”‡¢∑FÊˆFTñBÚÄ¢ƒ6ˆ◊ÁîvVÁE6ñFUÊV¬ñÊ∆ñÊRÊˆFTñC◊∑FÊˆFTñG“∂uñ∆ˆC◊∂vVÁG4∂uñ∆ˆG“ˆ‰6∆˜6S◊∂gVÊ7Fñˆ‚Çí≤6WEFÊˆFTñBÜÁV∆¬ì≤◊“Û‡¢í¢Ä¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#Ç6ˆ∆ñB6S&SÜc"¬&˜&FW%&FóW3¢B¬FFñÊs¢#GÇgÇ"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢¬fˆÁEvVñváC¢É¬6ˆ∆˜#¢"3V#cÉsÇ"¬FWáEG&Á6f˜&”¢'WW&66R"¬∆WGFW%76ñÊs¢#„VV“"◊”‰vVÁB6ÊFñFFW3¬˜‡¢«V¬7Gñ∆S◊∑≤÷&vñ„¢¬FFñÊs¢¬∆ó7E7Gñ∆S¢&ÊˆÊR"◊”‡¢∂vVÁG4∂uñ∆ˆBÊÊˆFW2Êfñ«FW"ÜgVÊ7Fñˆ‚Ü‚í≤&WGW&‚‚ÁGóR””“&vVÁB#≤“íÁ6∆ñ6RÉ¬íÊ÷ÜgVÊ7Fñˆ‚Ü‚í∞¢&WGW&‚Ä¢∆∆í∂Wì◊∂‚ÊñG”‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤ÜÊF∆TvVÁDÊˆFUFÜ‚ÊñBì≤◊–¢7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬vñGFÉ¢#R"¬FWáD∆ñv„¢&∆VgB"¬&6∂w&˜VÊC¢&ÊˆÊR"¬&˜&FW#¢&ÊˆÊR"¬6ˆ∆˜#¢"33cñ"¬fˆÁEvVñváC¢s¬FFñÊs¢#wÇgÇ"¬&˜&FW%&FóW3¢b¬7W'6˜#¢'ˆñÁFW""¬fˆÁE6ó¶S¢"„R¬∆ñÊTÜVñváC¢„3R¬÷ñ‰ÜVñváC¢3b◊”‡¢∂‚Ê∆&V«–¢¬ˆ'WGFˆ„‡¢¬ˆ∆ì‡¢ì∞¢“ó–¢¬˜V√‡¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢¬6ˆ∆˜#¢"3SÉcCsB"¬∆ñÊTÜVñváC¢„R◊”ÂF‚vVÁBÜ˜"ÁíÊˆFRñ‚FÜRw&ÇíFÚ6VRóG26ˆÊÊV7FñˆÁ2¬6∂ñ∆«2ÊBFÜR˜7FñÊw2óB7Á2„¬˜‡¢¬ˆFóc‡¢ó–¢¬ˆ6ñFS‡¢¬ˆFóc‡†¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢¬6ˆ∆˜#¢2Ê◊WFVB¬∆ñÊTÜVñváC¢„b◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s◊”Â&˜c£¬˜7„‚ÊˆFW2&R«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s◊”Êg&ˆ“‘4c¬˜7„‚Ü6ˆ◊Áí6FVv˜&ñW2í˜"«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s◊”ÊFW&ófVC¬˜7„‚Ü6«W7FW"≤&Ê∂ñÊrg&ˆ“6◊∆VB˜7FñÊw2í‚&V7W'&VÊ6R“Fó7FñÊ7B˜7FñÊw27ÊÊVB‚66˜&R“&V7W'&VÊ6RÇWá˜7W&RvVñváB‚ÊÚƒƒ“WFÜ˜&VBÁí6«W7FW"¬6˜VÁB˜"&Ê≤‡¢¬˜‡¢¬ˆFóc‡¢ó–†¢∂7FófT÷F6Çbb7FófT÷F6ÇÊ¶ˆ'2bb7FófT÷F6ÇÊ¶ˆ'2Ê∆VÊwFÇ‚bbÄ¢«6V7Fñˆ‚&Vc◊∂˜˜'GVÊóGî∆ó7E&Vg“6∆74Ê÷S“&6ˆ◊Áí÷÷ˆ&ñ∆R÷ˆÊ«í6ˆ◊Áí÷˜˜'GVÊóGí◊Fˆˆ«2"&ñ÷∆&V∆∆VF'ì“&6ˆ◊Áí÷˜˜'GVÊóFñW2◊FóF∆R#‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&&6V∆ñÊR"¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬v£Ç¬÷&vñ‰&˜GFˆ”£Ç◊”‡¢∆É2ñC“&6ˆ◊Áí÷˜˜'GVÊóFñW2◊FóF∆R"7Gñ∆S◊∑≤÷&vñ„£¬fˆÁE6ó¶S¢#&V“"¬6ˆ∆˜#§2ÁFWáB◊”‰ñÊFófñGV¬˜˜'GVÊóFñW3¬ˆÉ3‡¢«7‚&ñ÷∆ófS“'ˆ∆óFR"7Gñ∆S◊∑≤fˆÁE6ó¶S¢"„sW&V“"¬6ˆ∆˜#§2ÁFWáE7V"◊”Á∂÷6dfñ«FW&VE6˜'FVBÊ∆VÊwFá“6Ü˜v„¬˜7„‡¢¬ˆFóc‡¢∆Fób6∆74Ê÷S“&6ˆ◊Áí÷÷ˆ&ñ∆R◊Fˆˆ¬◊&˜r#‡¢∆ñÁWBGóS“'6V&6Ç"f«VS◊∂÷6e&ˆ∆UVW'ó“ˆ‰6ÜÊvS◊∂gVÊ7Fñˆ‚ÜRí≤6WD÷6e&ˆ∆UVW'íÜRÁF&vWBÁf«VRì≤◊“&ñ÷∆&V√“%6V&6Ç&ˆ∆RFóF∆W2"∆6VÜˆ∆FW#“%6V&6Ç&ˆ∆RFóF∆W2"Û‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"&ñ÷WáÊFVC◊∂÷ˆ&ñ∆Tfñ«FW'4˜VÁ“ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤6WD÷ˆ&ñ∆Tfñ«FW'4˜V‚ÜgVÊ7Fñˆ‚Ü˜V‚í≤&WGW&‚˜V„≤“ì≤◊–¢7Gñ∆S◊∑≤÷ñÂvñGFÉ£CÇ¬÷ñ‰ÜVñváC£CÇ¬FFñÊs¢#áÇ'Ç"¬&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3£¬6ˆ∆˜#§2ÁFWáB¬fˆÁEvVñváC£sS¬7W'6˜#¢'ˆñÁFW""◊”‡¢fñ«FW ¢¬ˆ'WGFˆ„‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊∂6˜î∆ˆFVD˜VÊñÊw7–¢&ñ÷∆&V√◊∂6˜î˜VÊñÊw57FFR””“&6˜ñVB"ÚG∂7FófT¶ˆ'2Ê∆VÊwFá“∆ˆFVB˜˜'GVÊóFñW26˜ñVB2•4ÙÊ¢6˜íG∂7FófT¶ˆ'2Ê∆VÊwFá“∆ˆFVB˜˜'GVÊóFñW22•4ÙÊ–¢FóF∆S◊∂6˜î˜VÊñÊw57FFR””“&6˜ñVB"Ú$6˜ñVB"¢6˜íG∂7FófT¶ˆ'2Ê∆VÊwFá“∆ˆFVB˜˜'GVÊóFñW22•4ÙÊ–¢7Gñ∆S◊∑≤vñGFÉ£CÇ¬ÜVñváC£CÇ¬Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢&6VÁFW""¬&6∂w&˜VÊC¢"6ffb"¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3£¬6ˆ∆˜#¶6˜î˜VÊñÊw57FFR””“&6˜ñVB"Ú"3SsCì"¢2ÁFWáB¬7W'6˜#¢'ˆñÁFW""◊”‡¢∂6˜î˜VÊñÊw57FFR””“&6˜ñVB"ÚÄ¢«7‚&ñ÷ÜñFFV„“'G'VR"7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„#W&V“"¬fˆÁEvVñváC£É◊”Ó)…3¬˜7„‡¢í¢Ä¢«7fr&ñ÷ÜñFFV„“'G'VR"vñGFÉ“##"ÜVñváC“##"fñWt&˜É“##B#B"fñ∆√“&ÊˆÊR"7G&ˆ∂S“&7W'&VÁD6ˆ∆˜""7G&ˆ∂UvñGFÉ“#„Ç#„«&V7BÉ“#Ç"ì“#Ç"vñGFÉ“#"ÜVñváC“#"'É“#""Û„«FÇC“$”bÖcf""”"”$Éf""”"'cÜ"""&É""Û„¬˜7fs‡¢ó–¢¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢∂6˜î˜VÊñÊw57FFR””“&W'&˜""bb«&ˆ∆S“'7FGW2"7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢"„sW&V“"¬6ˆ∆˜#¢"3sÉ3Sb"◊”‰6˜ív2VÊfñ∆&∆Rˆ‚FÜó2'&˜w6W"„¬˜Á–¢¬˜6V7Fñˆ„‡¢ó–†¢∂7FófT÷F6Çbb7FófT÷F6ÇÊ¶ˆ'2bb7FófT÷F6ÇÊ¶ˆ'2Ê∆VÊwFÇ‚2bbÜ÷6df6WD˜FñˆÁ2Ê∆WfV¬Ê∆VÊwFÇ‚«¬÷6df6WD˜FñˆÁ2ÁGóRÊ∆VÊwFÇ‚íbbÄ¢∆Fób6∆74Ê÷S◊≤&6ˆ◊Áí÷fñ«FW"÷6ˆÁG&ˆ«2"≤Ü÷ˆ&ñ∆Tfñ«FW'4˜V‚Ú"÷ˆ&ñ∆R÷˜V‚"¢""ó“7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v¢Ç¬∆ñv‰óFV◊3¢&6VÁFW""¬÷&vñ‰&˜GFˆ”¢"◊”‡¢«6V∆V7Bf«VS◊∂÷6e6˜'G“ˆ‰6ÜÊvS◊∂gVÊ7Fñˆ‚ÜRí≤6WD÷6e6˜'BÜRÁF&vWBÁf«VRì≤◊“&ñ÷∆&V√“%6˜'B˜7FñÊw2 ¢7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢3b¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáB¬&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3¢Ç¬FFñÊs¢#WÇáÇ"◊”‡¢∆˜Fñˆ‚f«VS“'&V6VÁB#Â6˜'C¢÷˜7B&V6VÁC¬ˆ˜Fñˆ„‡¢∆˜Fñˆ‚f«VS“'6∆'í#Â6˜'C¢6∆'íÜñvÇ÷∆˜s¬ˆ˜Fñˆ„‡¢∆˜Fñˆ‚f«VS“'FóF∆R#Â6˜'C¢FóF∆R’£¬ˆ˜Fñˆ„‡¢¬˜6V∆V7C‡¢∂÷6df6WD˜FñˆÁ2Ê∆WfV¬Ê∆VÊwFÇ‚bb÷6df6WD˜FñˆÁ2Ê∆WfV¬Ê÷ÜgVÊ7Fñˆ‚ÜÚí∞¢6ˆÁ7Bˆ‚“÷6df6WG2Ê∆WfV¬ÊñÊ6«VFW2ÜÚÁbì∞¢&WGW&‚Ä¢∆'WGFˆ‚∂Wì◊∂ÚÁg“GóS“&'WGFˆ‚"&ñ◊&W76VC◊∂ˆÁ“ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤÷6eFˆvv∆Tf6WBÇ&∆WfV¬"¬ÚÁbì≤◊–¢7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢3b¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢ˆ‚Ús¢C¬6ˆ∆˜#¢ˆ‚Ú"3SsCì"¢2ÁFWáE7V"¬&6∂w&˜VÊC¢ˆ‚Ú2ÁFVƒ&r¢2Á7W&f6R¬&˜&FW#¢#Ç6ˆ∆ñB"≤Üˆ‚Ú2ÁFVƒ&G"¢2Ê&˜&FW"í¬&˜&FW%&FóW3¢b¬FFñÊs¢#WÇ'Ç"¬7W'6˜#¢'ˆñÁFW""◊”‡¢∂ÚÁg“á∂ÚÊÁ“ê¢¬ˆ'WGFˆ„‡¢ì∞¢“ó–¢∂÷6df6WD˜FñˆÁ2ÁGóRÊ∆VÊwFÇ‚bb÷6df6WD˜FñˆÁ2ÁGóRÊ÷ÜgVÊ7Fñˆ‚ÜÚí∞¢6ˆÁ7Bˆ‚“÷6df6WG2ÁGóRÊñÊ6«VFW2ÜÚÁbì∞¢&WGW&‚Ä¢∆'WGFˆ‚∂Wì◊∂ÚÁg“GóS“&'WGFˆ‚"&ñ◊&W76VC◊∂ˆÁ“ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤÷6eFˆvv∆Tf6WBÇ'GóR"¬ÚÁbì≤◊–¢7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢3b¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢ˆ‚Ús¢C¬6ˆ∆˜#¢ˆ‚Ú"3SfF""¢2ÁFWáE7V"¬&6∂w&˜VÊC¢ˆ‚Ú"6Vfcffb"¢2Á7W&f6R¬&˜&FW#¢#Ç6ˆ∆ñB"≤Üˆ‚Ú"6&fF&fR"¢2Ê&˜&FW"í¬&˜&FW%&FóW3¢b¬FFñÊs¢#WÇ'Ç"¬7W'6˜#¢'ˆñÁFW""◊”‡¢∂ÚÁg“á∂ÚÊÁ“ê¢¬ˆ'WGFˆ„‡¢ì∞¢“ó–¢≤Ü÷6df6WG2Ê∆WfV¬Ê∆VÊwFÇ‚«¬÷6df6WG2ÁGóRÊ∆VÊwFÇ‚íbbÄ¢∆'WGFˆ‚GóS“&'WGFˆ‚"ˆ‰6∆ñ6≥◊∂gVÊ7Fñˆ‚Çí≤6WD÷6df6WG2á≤∆WfV√¢µ“¬GóS¢µ““ì≤◊–¢7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢3b¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬&6∂w&˜VÊC¢&ÊˆÊR"¬&˜&FW#¢&ÊˆÊR"¬7W'6˜#¢'ˆñÁFW""¬FWáDFV6˜&Fñˆ„¢'VÊFW&∆ñÊR"◊”‡¢6∆V"fñ«FW'0¢¬ˆ'WGFˆ„‡¢ó–¢¬ˆFóc‡¢ó–†¢∂7FófT÷F6Çbb7FófT÷F6ÇÊ¶ˆ'2bb7FófT÷F6ÇÊ¶ˆ'2Ê∆VÊwFÇ‚bbÄ¢∆Fób6∆74Ê÷S“&÷6b÷w&ñB6ˆ◊Áí÷˜˜'GVÊóGí÷w&ñB"FF◊FW7FñC“&6ˆ◊Áí÷˜˜'GVÊóGí÷w&ñB#‡¢∂÷6dfñ«FW&VE6˜'FVBÊ÷ÜgVÊ7Fñˆ‚Ü¶ˆ"í∞¢&WGW&‚Ä¢ƒ÷6d¶ˆ$6&B∂Wì◊∂¶ˆ"ÁWVñG“¶ˆ#◊∂¶ˆ'“f◊E6∆'ì◊∂f◊E6∆'ó“Fó4vÛ◊∂Fó4v˜–¢6VV„◊∑VÊFVfñÊVG“f◊E6VV‰FFS◊∑VÊFVfñÊVG–¢ˆ‰Ê«ó6U˜7FñÊs◊∂ˆ‰Ê«ó6U˜7FñÊw“ˆÂVWVU˜7FñÊs◊∂ˆÂVWVU˜7FñÊw“6ÂVWVS◊∂6ÂVWVW–¢ˆ‰Wá˜'C◊∂Wá˜'E˜7FñÊw“6ˆ◊7D÷ˆ&ñ∆S◊∂FWfñ6U&ˆfñ∆SÚÊf˜&‘f7F˜"””“'ÜˆÊR'“Û‡¢ì∞¢“ó–¢∂÷6dfñ«FW&VE6˜'FVBÊ∆VÊwFÇ””“bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‰ÊÚ˜7FñÊw2÷F6ÇFÜR6V∆V7FVBfñ«FW'2„¬˜‡¢ó–¢¬ˆFóc‡¢ó–†¢«6∆74Ê÷S“&6ˆ◊Áí◊6˜W&6R÷Ê˜FR"7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‡¢6ˆ◊ÁíÊ÷W2ÊB˜7FñÊr6˜VÁG2&RfW&&Fñ“g&ˆ“◊î6&VW'4gWGW&Ráˆ∆∆VB∑7FFRÁvW5ˆ∆∆VG“vRá2íì≤gWßßíˆ∆¬÷í÷ó72˜7FñÊw2fñ∆VBVÊFW"FñffW&VÁF«í◊7V∆∆VBV◊∆˜ñW"Ê÷R‡¢¬˜‡¢¬Û‡¢ó–¢¬ˆFóc‡†¢≤Ú¢$îtÖB4Ù≈T‘„¢6&VW'2Êv˜bÁ6rvVÊ7í˜7FñÊw2“ÜñFFV‚vÜV‚FÜW&R&RÊˆÊRá&ófFRÙ‘4bV◊∆˜ñW"í¢˜–¢∑6Ü˜t76rbbÄ¢∆Fóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬÷&vñ‰&˜GFˆ”¢◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢2¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢2ÁFWáB◊”‚b3#sìc3≤6&VW'2Êv˜bÁ6s¬˜7„‡¢≤76u7FFRÊ∆ˆFñÊrbb76u7FFRÊf∆∆&6≤bb76u7FFRÊ¶ˆ'2Ê∆VÊwFÇ‚bbÄ¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢„R¬6ˆ∆˜#¢2Ê◊WFVB◊”‚á∂76u7FFRÁF˜F«“˜7FñÊw∂76u7FFRÁF˜F¬””“Ú""¢'2'“ì¬˜7„‡¢ó–¢¬ˆFóc‡†¢∂76u7FFRÊ∆ˆFñÊrÚÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6ccñfb"¬&˜&FW#¢#Ç6ˆ∆ñB6&SffB"¬&˜&FW%&FóW3¢¬FFñÊs¢##ÇgÇ"¬FWáD∆ñv„¢&6VÁFW""◊”‡¢ƒñÊ∆ñÊU7ñÊÊW"6ó¶S◊≥#'“FÜñ6∂ÊW73◊≥7“6ˆ∆˜#“"3SfF""G&6¥6ˆ∆˜#“"6&SffB"7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñ„¢#WFÚáÇ"◊“Û‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢"33cñ"◊”‰6ÜV6∂ñÊr6&VW'2Êv˜bÁ6r‚‚„¬˜‡¢¬ˆFóc‡¢í¢76u7FFRÊf∆∆&6≤«¬76u7FFRÊ¶ˆ'2Ê∆VÊwFÇ””“ÚÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3¢¬FFñÊs¢#gÇáÇ"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáE7V"¬∆ñÊTÜVñváC¢„b◊”‡¢∂76u7FFRÊ÷W76vR«¬$ÊÚ6&VW'2Êv˜bÁ6r&ˆ∆W2f˜"FÜBV◊∆˜ñW"“6&VW'2Êv˜bÁ6r∆ó7G2v˜fW&Ê÷VÁB&ˆFñW2¬6ÚG'í÷ñÊó7G'í˜"7FGWF˜'í&ˆ&BÜRÊr‚÷ñÊó7G'íˆbÜV«FÇ¬≈D¬ÖEÇí‚'–¢¬˜‡¢«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s◊”‚b33≤6ˆ◊WFVC¬˜7„‚“vVÊ7ífñ«FW"∆ñVBFÚ∆ófR6&VW'2Êv˜bÁ6rGV◊‡¢¬˜‡¢¬ˆFóc‡¢í¢76tw&˜W2Ê∆VÊwFÇ‚ÚÄ¢√‡¢≤Ú¢◊V«Fó∆RFó7FñÊ7BvVÊ6ñW2÷F6ÜVBÜRÊr‚$÷ñÊó7G'í"ÜóG26WfW&¬÷ñÊó7G&ñW2í–¢Fó66∆˜6RFÜR7∆óBñÁ7FVBˆbñÁFW&∆VfñÊrFÜV“VÊ∆&V∆∆VB‚÷ó'&˜'2FÜR‘4`¢6ˆ«V÷‚w2WÜ7Bˆ6∆˜6W7B÷÷F6Ç6Üó2¬FFVBFÚ6&VW'2Êv˜bÁ6rw2f∆B÷∆ó7Bí‚¢˜–¢«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„sW&V“"◊”‡¢«7‚FóF∆S“%6WfW&¬vVÊ7íÊ÷W2÷F6ÜVB“˜7FñÊw2&Rw&˜WVB&V∆˜r'ívVÊ7í"7Gñ∆S◊∑≤Fó7∆ì¢&ñÊ∆ñÊR÷&∆ˆ6≤"¬fˆÁEvVñváC¢s¬&6∂w&˜VÊC¢"6VVccR"¬&˜&FW#¢#Ç6ˆ∆ñB6CñFVSb"¬&˜&FW%&FóW3¢¬FFñÊs¢#ÇáÇ"¬6ˆ∆˜#¢2Ê◊WFVB◊”Á≤'‚"≤76tw&˜W2Ê∆VÊwFÇ≤"vVÊ6ñW2÷F6ÜVB“w&˜WVB&V∆˜r'”¬˜7„‡¢¬˜‡¢∂76tw&˜W2Ê÷ÜgVÊ7Fñˆ‚Ürí∞¢&WGW&‚Ä¢∆Fób∂Wì◊∂rÊÊ÷W“7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”¢B◊”‡¢∆Fób7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢2ÁFWáB¬÷&vñ‰&˜GFˆ”¢b◊”Á∂rÊÊ÷W“«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢C¬6ˆ∆˜#¢2Ê◊WFVB◊”‚á∂rÊ¶ˆ'2Ê∆VÊwFá“˜7FñÊw∂rÊ¶ˆ'2Ê∆VÊwFÇ””“Ú""¢'2'“ì¬˜7„„¬ˆFóc‡¢∆Fób6∆74Ê÷S“&÷6b÷w&ñB#‡¢∂rÊ¶ˆ'2Á6∆ñ6RÉ¬2íÊ÷ÜgVÊ7Fñˆ‚Ü¶ˆ"í∞¢&WGW&‚Ä¢ƒ÷6d¶ˆ$6&B∂Wì◊∂¶ˆ"ÁWVñG“¶ˆ#◊∂¶ˆ'“f◊E6∆'ì◊∂f◊E6∆'ó“Fó4vÛ◊∂Fó4v˜–¢6VV„◊∑VÊFVfñÊVG“f◊E6VV‰FFS◊∑VÊFVfñÊVG–¢ˆ‰Ê«ó6U˜7FñÊs◊∂ˆ‰Ê«ó6U˜7FñÊw“ˆÂVWVU˜7FñÊs◊∂ˆÂVWVU˜7FñÊw“6ÂVWVS◊∂6ÂVWVW–¢ˆ‰Wá˜'C◊∂Wá˜'E˜7FñÊw“Û‡¢ì∞¢“ó–¢¬ˆFóc‡¢∂rÊ¶ˆ'2Ê∆VÊwFÇ‚2bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2ÁFWáE7V"◊”Á≤"≤"≤ÜrÊ¶ˆ'2Ê∆VÊwFÇ“2í≤"÷˜&Rg&ˆ“"≤rÊÊ÷W”¬˜‡¢ó–¢¬ˆFóc‡¢ì∞¢“ó–¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s◊”‚b33≤6ˆ◊WFVC¬˜7„‚“vVÊ7íÊ÷R÷F6ÜVBg&ˆ“6&VW'2Êv˜bÁ6rGV◊Ñ‘ïB÷∆ñ6VÁ6VB¬˜VÊv˜g6rí‚6˜VÁG2&R&V¬˜7FñÊrF˜F«2¬Ê˜BW7Fñ÷FVB‡¢¬˜‡¢¬Û‡¢í¢Ä¢√‡¢∆Fób6∆74Ê÷S“&÷6b÷w&ñB#‡¢∂76u7FFRÊ¶ˆ'2Á6∆ñ6RÉ¬íÊ÷ÜgVÊ7Fñˆ‚Ü¶ˆ"í∞¢&WGW&‚Ä¢ƒ÷6d¶ˆ$6&B∂Wì◊∂¶ˆ"ÁWVñG“¶ˆ#◊∂¶ˆ'“f◊E6∆'ì◊∂f◊E6∆'ó“Fó4vÛ◊∂Fó4v˜–¢6VV„◊∑VÊFVfñÊVG“f◊E6VV‰FFS◊∑VÊFVfñÊVG–¢ˆ‰Ê«ó6U˜7FñÊs◊∂ˆ‰Ê«ó6U˜7FñÊw“ˆÂVWVU˜7FñÊs◊∂ˆÂVWVU˜7FñÊw“6ÂVWVS◊∂6ÂVWVW–¢ˆ‰Wá˜'C◊∂Wá˜'E˜7FñÊw“Û‡¢ì∞¢“ó–¢¬ˆFóc‡¢∂76u7FFRÁF˜F¬‚bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2ÁFWáE7V"◊”‡¢≤"≤"≤Ü76u7FFRÁF˜F¬“í≤"÷˜&Rˆ‚6&VW'2Êv˜bÁ6r“fó6óB'–¢∆á&Vc“&áGG3¢Úˆ6&VW'2Êv˜bÁ6r"F&vWC“%ˆ&∆Ê≤"&V√“&Êˆ˜VÊW"Ê˜&VfW'&W""7Gñ∆S◊∑≤6ˆ∆˜#¢2Ê66VÁB◊”Ê6&VW'2Êv˜bÁ6s¬ˆ‡¢≤"FÚ'&˜w6R∆¬‚'–¢¬˜‡¢ó–¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢s◊”‚b33≤6ˆ◊WFVC¬˜7„‚“vVÊ7íÊ÷R÷F6ÜVBg&ˆ“6&VW'2Êv˜bÁ6rGV◊Ñ‘ïB÷∆ñ6VÁ6VB¬˜VÊv˜g6rí‚6˜VÁG2&R&V¬˜7FñÊrF˜F«2¬Ê˜BW7Fñ÷FVB‡¢¬˜‡¢¬Û‡¢ó–¢¬ˆFóc‡¢ó–†¢≤Ú¢Ùì„ÙÙì„2ác2÷˜&vÊó6Fñˆ‚÷ñÁFV∆∆ñvVÊ6R◊7V2Ê÷Bì¢$˜&vÊó6Fñˆ‚&VB"–¢FWFW&÷ñÊó7Fñ26˜VÁG2˜fW"FÜó2V◊∆˜ñW"w2«&VGí÷fWF6ÜVB∆ófR˜7FñÊp¢6WB‚ÊWfW"G&VÊBˆ6W6¬fW&"Ö#"6ÊFñFFRí“6Ê6Ü˜Bó26˜VÁB¿¢Ê˜Bw&˜wFÇ˜VÊFW'7FffñÊr7F˜'í‡¢7G'V7GW&¬'VrfóÇÜf˜VÊBñ‚∆ófRfW&ñfñ6Fñˆ‚“'Vñ∆B÷w&VV‚"ó2Ê˜@¢FÜR6÷R2v˜&∂ñÊrfVGW&Rì¢FÜó2&∆ˆ6≤W6VBFÚ6óBÊW7FVBñÁ6ñFRFÜP¢◊î6&VW'4gWGW&R÷ˆÊ«í6ˆ«V÷‚¬óG6V∆bvFVB&VÜñÊB‚˜WFW"FW&Ê'íFÜ@¢ˆÊ«í&VÊFW'2vÜV‚7FFRÊ÷F6ÜW2Ê∆VÊwFÇ‚“6Úf˜"Áív˜b÷ˆÊ«ê¢V◊∆˜ñW"ÜÊÚ‘4b˜7FñÊw2¬RÊr‚÷˜7B÷ñÊó7G&ñW2˜7FGWF˜'í&ˆ&G2íFÜP¢6ˆFRÊWfW"&V6ÜVBFÜó2&∆ˆ6≤B∆¬¬&Vv&F∆W72ˆbÁíñÊÊW ¢7FófT÷F6ÇfóÇ‚÷˜fVB˜WBFÚ6óB2óG2˜v‚gV∆¬◊vñGFÇ&˜r&V∆˜r$ıDÄ¢6ˆ«V÷Á2¬vFVBˆÊ«íˆ‚óG2˜v‚FFÜ7FófT÷F6Çı"˜&u&VBÊv˜e&VBí¿¢vóFÇw&ñD6ˆ«V÷„¢#Ú”"6ÚóB7Á2FÜRÊ76r÷6ˆ«2"÷6ˆ«V÷‚w&ñ@¢ñÁ7FVBˆb6ˆ∆∆6ñÊrñÁFÚÜ∆b◊vñGFÇ˜'Ü‚6V∆¬‚¢˜–¢≤Ü7FófT÷F6Ç«¬˜&u&VBÊv˜e&VBíbbÜ˜&u&VBÁ6ñvÊ«2Ê∆VÊwFÇ‚«¬˜&u&VBÁ&Vvó7G'í«¬˜&u&VBÊv˜e&VBíbbÄ¢∆Fób7Gñ∆S◊∑≤w&ñD6ˆ«V÷„¢#Ú”"¬FFñÊs¢#'ÇgÇ"¬&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3¢◊”‡¢∆Fób7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬fˆÁEvVñváC¢s¬∆WGFW%76ñÊs¢"„&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬÷&vñ‰&˜GFˆ”¢r◊”‰ı$t‰ï4DîÙ‚$TC¬ˆFóc‡¢∂˜&u&VBÁ6ñvÊ«2Ê÷ÜgVÊ7Fñˆ‚á2í∞¢&WGW&‚Ä¢«∂Wì◊∑2ÊñG“7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáB¬∆ñÊTÜVñváC¢„R◊”Á∑2Êˆ'7”¬˜‡¢ì∞¢“ó–¢∂˜&u&VBÁ&Vvó7G'íbbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢˜&u&VBÁ&Vvó7G'íÊ÷F6ÜVBÚ2ÁFWáB¢2Ê◊WFVB◊”‡¢∂˜&u&VBÁ&Vvó7G'íÊˆ'7–¢∂˜&u&VBÁ&Vvó7G'íÊ÷F6ÜVBbb˜&u&VBÁ&Vvó7G'íÊÊ÷W6∂W2‚bbÇ"Ç≤"≤˜&u&VBÁ&Vvó7G'íÊÊ÷W6∂W2≤"˜FÜW""≤Ü˜&u&VBÁ&Vvó7G'íÊÊ÷W6∂W2””“Ú&VÁFóGí"¢&VÁFóFñW2"í≤"vóFÇFÜó2Ê÷Rˆ‚5$í"ó–¢¬˜‡¢ó–¢∂˜&u&VBÊv˜e&VBbbÄ¢∆Fób7Gñ∆S◊∑≤÷&vñ„¢#gÇ"◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáB¬∆ñÊTÜVñváC¢„R◊”Á∂˜&u&VBÊv˜e&VBÊˆ'7”¬˜‡¢∂˜&u&VBÊv˜e&VBÁW$vVÊ7íÊ∆VÊwFÇ‚bbÄ¢«V¬7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬FFñÊs¢#áÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬∆ñÊTÜVñváC¢„b◊”‡¢∂˜&u&VBÊv˜e&VBÁW$vVÊ7íÊ÷ÜgVÊ7Fñˆ‚Üí∞¢&WGW&‚∆∆í∂Wì◊∂ÊÊ÷W”Á∂ÊÊ÷R≤#¢"≤Ê6˜VÁB≤"˜7FñÊr"≤ÜÊ6˜VÁB””“Ú""¢'2"ó”¬ˆ∆ì„∞¢“ó–¢¬˜V√‡¢ó–¢∂˜&u&VBÊv˜e&VBÊVÊvvV÷VÁDˆ'2bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬∆ñÊTÜVñváC¢„R◊”Á∂˜&u&VBÊv˜e&VBÊVÊvvV÷VÁDˆ'7”¬˜‡¢ó–¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”Á∂˜&u&VBÊv˜e&VBÁ&˜fVÊÊ6W”¬˜‡¢¬ˆFóc‡¢ó–¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”‰6˜VÁG2ˆÊ«í¬˜fW"FÜó2V◊∆˜ñW"w2∆ófR˜7FñÊw2ˆÊ«í“Ê˜Bw&˜wFÇ¬7FffñÊr¬˜"6ó¶R6∆ñ“„¬˜‡¢¬ˆFóc‡¢ó–†¢≤Ú¢íıdU%dîUrÜ6ÜVW7B6∆VFRì¢6∆V&«í÷∆&V∆∆VBÊ'&Fñˆ‚ˆbFÜP¢FWFW&÷ñÊó7Fñ2f7G2&˜fR‚Gfó6˜'íˆÊ«í“ÊÚÊWrÁV÷&W"¬ÊÚfW&Fñ7C≤¢'vóFÜÜV∆B"7FFRvÜV‚FÜRV&∆ñ2ñ7GW&Ró2FˆÚFÜñ‚FÚ7V÷÷&ó6R‚¢˜–¢∂7FófT÷F6Çbb6ˆ◊Áî˜fW'fñWrÁ7FGW2”“&ñF∆R"bbÄ¢∆Fób7Gñ∆S◊∑≤w&ñD6ˆ«V÷„¢#Ú”"¬FFñÊs¢#'ÇgÇ"¬&6∂w&˜VÊC¢2Á7W&f6R¬&˜&FW#¢#Ç6ˆ∆ñB"≤2Ê&˜&FW"¬&˜&FW%&FóW3¢◊”‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢Ç¬÷&vñ‰&˜GFˆ”¢r◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬fˆÁEvVñváC¢s¬∆WGFW%76ñÊs¢"„&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‰íıdU%dîUs¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„Sc#W&V“"¬fˆÁEvVñváC¢s¬6ˆ∆˜#¢"3vVr"¬&6∂w&˜VÊC¢"6f&c6S""¬&˜&FW#¢#Ç6ˆ∆ñB6V6CñB"¬&˜&FW%&FóW3¢R¬FFñÊs¢#ÇgÇ"◊”‰í÷vVÊW&FVC¬˜7„‡¢¬ˆFóc‡¢∂6ˆ◊Áî˜fW'fñWrÁ7FGW2””“&∆ˆFñÊr"bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”Â7V÷÷&ó6ñÊrFÜó2V◊∆˜ñW"g&ˆ“FÜRf7G2&˜fWµ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ##bó”¬˜‡¢ó–¢∂6ˆ◊Áî˜fW'fñWrÁ7FGW2””“'vóFÜÜV∆B"bbÄ¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2Ê◊WFVB◊”‰Ê˜BVÊ˜VvÇV&∆ñ2FFFÚ7V÷÷&ó6RFÜó2V◊∆˜ñW"“FÜRfW&&Fñ“f7G2&˜fR7FÊBˆ‚FÜVó"˜v‚„¬˜‡¢ó–¢∂6ˆ◊Áî˜fW'fñWrÁ7FGW2””“'&VGí"bb6ˆ◊Áî˜fW'fñWrÊFFbbÄ¢∆Fóc‡¢∂6ˆ◊Áî˜fW'fñWrÊFFÊ˜fW'fñWrbb«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáB¬∆ñÊTÜVñváC¢„SR◊”Á∂6ˆ◊Áî˜fW'fñWrÊFFÊ˜fW'fñWw”¬˜Á–¢∂6ˆ◊Áî˜fW'fñWrÊFFÊÜó&ñÊtfˆ7W2bb«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#¢2ÁFWáB¬∆ñÊTÜVñváC¢„SR◊”Á∂6ˆ◊Áî˜fW'fñWrÊFFÊÜó&ñÊtfˆ7W7”¬˜Á–¢«7Gñ∆S◊∑≤÷&vñ„¢¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Ê◊WFVB¬fˆÁE7Gñ∆S¢&óF∆ñ2"◊”‰í◊w&óGFV‚g&ˆ“FÜR5$≤∆ófR◊˜7FñÊw2f7G2&˜fR“&VFñÊrñB¬Ê˜BÊWrf7B˜"fW&Fñ7B‚í÷76ó7FVBµ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#ró“áV÷‚FV6ñFW2„¬˜‡¢¬ˆFóc‡¢ó–¢¬ˆFóc‡¢ó–¢¬ˆFóc‡¢ì∞ß–†¶Wá˜'BFVfV«BgVÊ7Fñˆ‚á≤ñÊóFñ≈6V&6Ñ÷ˆFR““∑“í∞¢6ˆÁ7BFWfñ6U&ˆfñ∆R“W6TFWfñ6U&ˆfñ∆RÇì∞¢6ˆÁ7B∑VW'í¬6WEVW'ï““W6U7FFRÇ""ì∞¢6ˆÁ7B∑6V&6Ñ÷ˆFR¬6WE6V&6Ñ÷ˆFU““W6U7FFRÜñÊóFñ≈6V&6Ñ÷ˆFR«¬'&ˆ∆R"ì≤ÚÚ'&ˆ∆R"ÑU44ÚÊ«ó6ó2í¬&¶ˆ'2"Ü'&˜w6R◊î6&VW'4gWGW&Rí¬&6ˆ◊Áí"Ñ4Û¢6V&6Ç'íV◊∆˜ñW"í¬'vñ∂í"Ötî¥ì¢6&VW"vñ∂îw&Çê¢6ˆÁ7B∂g&W6Ñw&B¬6WDg&W6Ñw&E““W6U7FFRÜf«6Rì≤ÚÚ¶ˆ'2÷ˆFS¢66˜WB&ˆ∆W2ÊVVFñÊr¬Bó'2WáW&ñVÊ6RÜg&W6Çw&G2ê¢6ˆÁ7B∑W'6ˆÊ¬6WEW'6ˆÊ““W6U7FFRÜÁV∆¬ì∞¢6ˆÁ7B∂ˆ672¬6WDˆ675““W6U7FFRÖµ“ì∞¢ÚÚdƒır”¢54Ù2##BVW'í◊FWáB7VvvW7FñˆÁ2f˜"¶ˆ'2ˆ6ˆ◊Áí÷ˆFW2Ö#"“w&óFW2ˆÊ«ê¢ÚÚFÜRVW'í7G&ñÊr¬ÊWfW"vFW27V&÷ó76ñˆ‚¬ÊWfW"fñ«FW'27FW"ˆ6ˆ◊Áí&W7V«G2í‡¢6ˆÁ7B∑76ˆ4ˆ672¬6WE76ˆ4ˆ675““W6U7FFRÖµ“ì∞¢6ˆÁ7B∑76ˆ5VW'í¬6WE76ˆ5VW'ï““W6U7FFRÇ""ì∞¢6ˆÁ7B∑76ˆ57VvvW7D∆ˆFñÊr¬6WE76ˆ57VvvW7D∆ˆFñÊu““W6U7FFRÜf«6Rì∞¢6ˆÁ7B76ˆ4˜FñˆÂ&Vg2“W6U&VbÖµ“ì≤ÚÚdƒır◊ˆ∆ó6É¢&˜fñÊr∂Wñ&ˆ&Bfˆ7W27&˜727VvvW7Fñˆ‚&˜w0¢6ˆÁ7B∑ñ6∂W$∆ˆFñÊr¬6WEñ6∂W$∆ˆFñÊu““W6U7FFRÜf«6Rì≤ÚÚcc¢&ˆw&W76ófRñ6∂W ¢6ˆÁ7B∑ñ6∂W$gV∆ƒ∆ˆFñÊr¬6WEñ6∂W$gV∆ƒ∆ˆFñÊu““W6U7FFRÜf«6Rì∞¢6ˆÁ7B∑ñ6∂W$gV∆ƒW'&˜"¬6WEñ6∂W$gV∆ƒW'&˜%““W6U7FFRÜf«6Rì≤ÚÚc„2„¢&6∂w&˜VÊBgV∆¬6V&6Ä¢6ˆÁ7B∂ÊÙWÜ7D÷F6Ç¬6WDÊÙWÜ7D÷F6Ö““W6U7FFRÜÁV∆¬ì∞¢6ˆÁ7B∂W66Ù6ˆÜW&VÊ6U7FGW2¬6WDW66Ù6ˆÜW&VÊ6U7FGW5““W6U7FFRÜÁV∆¬ì∞¢6ˆÁ7B∂gVÊ7Fñˆ‰∂Wóv˜&DÊ˜Fñ6R¬6WDgVÊ7Fñˆ‰∂Wóv˜&DÊ˜Fñ6U““W6U7FFRÜÁV∆¬ì≤ÚÚ≤∂Wóv˜&B¬7VvvW7FñˆÁ2“¬ÁV∆¿¢6ˆÁ7B∑6V¬¬6WE6V≈““W6U7FFRÜÁV∆¬ì∞¢6ˆÁ7B∑&W7V«B¬6WE&W7V«E““W6U7FFRÜÁV∆¬ì∞¢6ˆÁ7B∑7FW¬6WE7FW““W6U7FFRÇ&ñF∆R"ì∞¢6ˆÁ7B∂ˆ∂e&ˆ∆R¬6WDˆ∂e&ˆ∆U““W6U7FFRÜf«6Rì≤ÚÚ7FW2Ù¥bWá˜'B÷ˆF¬á&ˆ∆RÊ÷Bê¢ÚÚ"%7FW2v˜&∂ñÊr6Áf2"É3”rs#bí*s2„c¢FÜR÷ñÊñ÷ó6RG&í∆&V«2FÜR&ˆ∆Rw&Ä¢ÚÚvóFÇFÜRFÜˆÊˆ◊íóBó27W'&VÁF«í&VFñÊrÇ%&ˆ∆Rw&Ç+rU44Ú"í‚&ˆ∆Tw&ÖÊV¬˜vÁ0¢ÚÚFÜB6Üˆñ6RñÁFW&Ê∆«íÊB*s"„"f˜&&ñG26ÜÊvñÊróB¬6ÚóBßW7B$Uı%E2FÜR÷ˆFRfñ‡¢ÚÚFFóFófR˜FñˆÊ¬6∆∆&6≤“ÊÚ6ÜÊvRFÚFÜRw&Çw2FF¬Fˆvv∆R˜"ñÁFW&7FñˆÁ2‡¢6ˆÁ7B∑&uFÜˆÊˆ◊í¬6WE&uFÜˆÊˆ◊ï““W6U7FFRÇ$U44Ú"ì∞¢ÚÚFÜR&W6ˆ«fVBU44Ú6∂ñ∆«2ÜÊ÷R≤FW67&óFñˆ‚í6Ü˜v‚˜VÊ«íEU$î‰rFÜRÊ«ó6ó2vóB“FÜRc ¢ÚÚ'6∂ñ∆«2∆ó7B"&VFñÊrWáW&ñVÊ6R‚6WBFÜR÷ˆ÷VÁB6∂ñ∆«2&W6ˆ«fS≤6∆V&VBvÜV‚∆ˆFñÊrVÊG2‡¢6ˆÁ7B∂∆ˆFñÊu6∂ñ∆«2¬6WD∆ˆFñÊu6∂ñ∆«5““W6U7FFRÖµ“ì∞¢ÚÚ√"VFóBÊ˜FS¢6Ü˜tWáV7Bó26WBFÚG'VRñ‚Fı6V&6ÇÊB6∆V&VBgFW"##◊2‡¢ÚÚFÜR&VÊFW"6ˆÊFóFñˆ‚á6Ü˜tWáV7Bbb7FW””“&ñF∆R"í÷VÁ2FÜRñÊFñ6F˜"ó2ˆÊ«ê¢ÚÚfó6ñ&∆RGW&ñÊrFÜR7V"◊6V6ˆÊBvñÊF˜r&Vf˜&R7FWG&Á6óFñˆÁ2FÚ'6V&6ÜñÊr"‡¢ÚÚFÜó2ó2ñÁFVÁFñˆÊ¬G&Á6ñVÁBfVVF&6≤“FÜR7FFRó2VffV7FófV«ífW7Fñvñ¬ˆÊ6P¢ÚÚFÜR7FWG&Á6óFñˆ‚fó&W2‚&WFñÊVB2÷ó3≤6ÊFñFFRf˜"6ñ◊∆ñfñ6Fñˆ‚ñbFÜP¢ÚÚ7V"◊6V6ˆÊBfó7V¬ó26ˆÊfó&÷VBVÊÊV6W76'íñ‚gWGW&RUÇ&WfñWr‡¢6ˆÁ7B∑6Ü˜tWáV7B¬6WE6Ü˜tWáV7E““W6U7FFRÜf«6Rì∞¢ÚÚFÜR7W'&VÁF«í÷&VñÊr÷Ê«ó6VB∆ófR˜7FñÊrá6WB'íÜÊF∆TÊ«ó6U˜7FñÊrí‚W6V@¢ÚÚ'íFÜR∆ˆFñÊrñÁFW'7FóFñ¬w27ñ6∆ñÊr66VÊW26ÚFÜR÷ÁW67&óBÚ&ˆ∆Rw&Ç¢ÚÚ&WfñWvW"ÊV«26‚&VfW&VÊ6RFÜR$T¬˜7FñÊrFWáB¬V◊∆˜ñW"¬ÊB6∂ñ∆«0¢ÚÚñÁ7FVBˆbFÜRvVÊW&ñ2FFÊ«ó7B÷ˆ6∑W‚6∆V&VBˆ‚&W6WB‡¢6ˆÁ7B∂Ê«ó6ñÊu˜7FñÊr¬6WDÊ«ó6ñÊu˜7FñÊu““W6U7FFRÜÁV∆¬ì∞¢ÚÚ6˜'W2&Ê«ó6R∆¬2ˆÊR&ˆ∆R"'Vñ∆B7Á2∆¬Fá&VR6˜W&6W2ÊB÷Áí˜7FñÊw2¬6Úó@¢ÚÚó26∆˜vW"FÜ‚6ñÊv∆RÊ«ó6ó2“Üˆ∆BóG26ÜR6ÚFÜR∆ˆFñÊr67&VV‚6Ü˜w2‚Wá∆ñ6ó@¢ÚÚ'∆V6RvóB¬FÜó2ó2'Vñ∆FñÊr7&˜72WfW'í6˜W&6R"6∆∆˜WBÑáV÷‚∆VB&WVW7Bí‡¢6ˆÁ7B∂6˜'W5vóB¬6WD6˜'W5vóE““W6U7FFRÜÁV∆¬ì≤ÚÚ≤6˜VÁB“vÜñ∆R6˜'W2'Vñ∆B'VÁ2¬V«6RÁV∆¿¢6ˆÁ7B∑6∂ñ∆ƒñÁWEVW'í¬6WE6∂ñ∆ƒñÁWEVW'ï““W6U7FFRÇ""ì∞¢6ˆÁ7B∑6∂ñ∆ƒñÁWE&W7V«B¬6WE6∂ñ∆ƒñÁWE&W7V«E““W6U7FFRÜÁV∆¬ì∞¢6ˆÁ7B∂6ˆ◊&U7FGW2¬6WD6ˆ◊&U7FGW5““W6U7FFRÇ""ì≤ÚÚcc¢∆ófR7FWÊ'&FófP¢6ˆÁ7B∂6ˆ◊&U7FW¬6WD6ˆ◊&U7FW““W6U7FFRÉì≤ÚÚcc¢7W'&VÁB7FW”Ä¢6ˆÁ7B∑7V"¬6WE7V%““W6U7FFRÇ""ì∞¢6ˆÁ7B∑7V%7FW¬6WE7V%7FW““W6U7FFRÉì∞¢6ˆÁ7B∂W'"¬6WDW'%““W6U7FFRÇ""ì∞¢6ˆÁ7B∂7FófUF"¬6WD7FófUF%““W6U7FFRÇ'6∂ñ∆«2"ì∞¢6ˆÁ7B∂7FófUñ∆∆"¬6WD7FófUñ∆∆%““W6U7FFRÇ'VÊFW'7FÊB"ì≤ÚÚ√3¢fófR◊ñ∆∆"Êc≤FVfV«B“fó'7Bñ∆∆ ¢6ˆÁ7B∂7FófTÊe6V7Fñˆ‚¬6WD7FófTÊe6V7FñˆÂ““W6U7FFRÜÁV∆¬ì≤ÚÚ¬‘‰c¢∆7B6Üñ∆B6V7Fñˆ‚6∆ñ6∂VBñ‚FÜRÊbG&VP¢6ˆÁ7B∂DG&vW$˜V‚¬6WDDG&vW$˜VÂ““W6U7FFRÜf«6Rì≤ÚÚf∆ˆFñÊr¶ˆ"÷BG&vW"ÖTì¢G2f∆ˆB¬Ê˜BV÷&VBê¢6ˆÁ7B∑6Vv÷VÁEÊVƒ˜V‚¬6WE6Vv÷VÁEÊVƒ˜VÂ““W6U7FFRáG'VRì≤ÚÚc„R„S¢6ˆ∆∆6ñ&∆RWFˆ÷Fñˆ‚ÊV¿¢6ˆÁ7B∂ßV◊Fı6∂ñ∆¬¬6WDßV◊Fı6∂ñ∆≈““W6U7FFRÜÁV∆¬ì≤ÚÚc„R„S¢6∂ñ∆¬Ê÷RFÚßV◊FÚÊB&R÷WáÊ@¢6ˆÁ7B∂6ˆ◊&ó6ˆÁ2¬6WD6ˆ◊&ó6ˆÁ5““W6U7FFRÖµ“ì≤ÚÚ∑∑FóF∆R¬&W7V«G’“÷Ç0¢6ˆÁ7B∂6ˆ◊&T7VR¬6WD6ˆ◊&T7VU““W6U7FFRÜf«6Rì∞¢6ˆÁ7B∑6Ü˜t&6µF˜¬6WE6Ü˜t&6µF˜““W6U7FFRÜf«6Rì∞¢W6TVffV7BÇÇí”‚∞¢6ˆÁ7BˆÂ67&ˆ∆¬“Çí”‚6WE6Ü˜t&6µF˜ávñÊF˜rÁ67&ˆ∆≈í‚Cì∞¢vñÊF˜rÊFDWfVÁD∆ó7FVÊW"Ç'67&ˆ∆¬"¬ˆÂ67&ˆ∆¬¬≤76ófS¢G'VR“ì∞¢&WGW&‚Çí”‚vñÊF˜rÁ&V÷˜fTWfVÁD∆ó7FVÊW"Ç'67&ˆ∆¬"¬ˆÂ67&ˆ∆¬ì∞¢“¬µ“ì∞¢ÚÚfVGW&S¢W6W"FWáB◊6ó¶R6ˆÁG&ˆ¬W'6ó7FVBñ‚∆ˆ6≈7F˜&vRÜ∂WíVïFWáE66∆Rí‡¢ÚÚ∆WfV«3¢„ì"Ñ“í¬Ñ¬FVfV«Bí¬„"Ñ≤í¬„#RÑ≤≤¬÷Çí‡¢ÚÚ∆ñW2“◊Ví◊66∆Rˆ‚∆áF÷√‚¬◊V«Fó«ññÊrFÜR&ˆ˜BfˆÁB◊6ó¶S≤∆¬&V“FWáB66∆W2vóFÇóB‡¢6ˆÁ7BTïı44ƒUı5DU2“≥„ì"¬¬„"¬„#U”∞¢6ˆÁ7B∑VïFWáE66∆R¬6WEVïFWáE66∆U““W6U7FFRÉì∞¢W6TVffV7BÇÇí”‚∞¢G'í∞¢6ˆÁ7B6fVB“'6Tf∆ˆBÜ∆ˆ6≈7F˜&vRÊvWDóFV“Ç'VïFWáE66∆R"íì∞¢ñbÖTïı44ƒUı5DU2ÊñÊ6«VFW2á6fVBíí∞¢6WEVïFWáE66∆Rá6fVBì∞¢Fˆ7V÷VÁBÊFˆ7V÷VÁDV∆V÷VÁBÁ7Gñ∆RÁ6WE&˜W'GíÇ"“◊Ví◊66∆R"¬7G&ñÊrá6fVBíì∞¢–¢“6F6ÇÖÚí∑–¢ÚÚW6∆ñÁB÷Fó6&∆R÷ÊWáB÷∆ñÊR&V7B÷Üˆˆ∑2ˆWÜÜW7FófR÷FW0¢“¬µ“ì∞¢gVÊ7Fñˆ‚«ïFWáE66∆Rábí∞¢6ˆÁ7B6∆◊VB“Tïı44ƒUı5DU2ÊñÊ6«VFW2ábíÚb¢∞¢6WEVïFWáE66∆RÜ6∆◊VBì∞¢Fˆ7V÷VÁBÊFˆ7V÷VÁDV∆V÷VÁBÁ7Gñ∆RÁ6WE&˜W'GíÇ"“◊Ví◊66∆R"¬7G&ñÊrÜ6∆◊VBíì∞¢G'í≤∆ˆ6≈7F˜&vRÁ6WDóFV“Ç'VïFWáE66∆R"¬7G&ñÊrÜ6∆◊VBíì≤“6F6ÇÖÚí∑–¢–¢6ˆÁ7B6Ü˜uFˆ7B“Ü◊6rí”‚≤6ˆÊÊW%Fˆ7BÜ◊6rì≤”∞¢ÚÚ√BVFóBÊ˜FS¢g&ˆ’FÇv2&V÷˜fVB‚óBv26WBFÚ'&ˆw&W76ñˆ‚"˜"&7&˜76˜fW" ¢ÚÚñ‚ÜÊF∆TÊ«ó6U&ˆ∆R'WBóG2f«VRv2ÊWfW"&VBñ‚Áí&VÊFW"6ˆÊFóFñˆ‚¬&˜¿¢ÚÚ˜"'&Ê6Ç‚6ˆÊfó&÷VBFVB7FFR“ÊÚ&VÊFW"FÇ'&Ê6ÜVBˆ‚óB‡¢6ˆÁ7B∂ó5'VÊÊñÊt6ˆ◊&ó6ˆ‚¬6WDó5'VÊÊñÊt6ˆ◊&ó6ˆÂ““W6U7FFRÜf«6Rì∞¢6ˆÁ7B∂6ˆ◊&TV∆6VB¬6WD6ˆ◊&TV∆6VE““W6U7FFRÉì≤ÚÚ6V6ˆÊG2V∆6VBGW&ñÊr6ˆ◊&ó6ˆ‡¢6ˆÁ7B∂6ˆ◊&Uv&ÊñÊr¬6WD6ˆ◊&Uv&ÊñÊu““W6U7FFRÜÁV∆¬ì≤ÚÚ≤ˆ‰6ˆÊfó&““¬ÁV∆¿¢ÚÚ„¢7FW2&VÊFW'226ˆˆ‚26˜&R6∂ñ∆«2&W6ˆ«fR¬'WBFÜR&6∂w&˜VÊBf‚÷˜W@¢ÚÚá&W7ˆÁ6ñ&ñ∆óFñW2˜&ˆ∆R÷÷óÇ¬FÜV‚ÊFˆ◊í˜&ˆ∆R÷w&Çˆ7&óFñ6¬◊&VB˜76ˆ2÷w&Çí∂VW0¢ÚÚ'VÊÊñÊrf˜"FVÁ2ˆb6V6ˆÊG2vóFÇÊÚ∆ófRñÊFñ6F˜"“&Wfñ˜W6«íFÜRˆÊ«íFÜñÊrñ‡¢ÚÚFÜB7˜Bv2FÜR7FFñ2%TîƒEı5DEU2VÊvñÊVW&ñÊr÷6ˆ◊∆WFñˆ‚7G&ó¬vÜñ6Ç∆ˆˆ∑2∆ñ∂P¢ÚÚ&ˆw&W72'WBÊWfW"÷˜fW2‚&u7FWˆ&u7FGW2ˆ&tV∆6VBÊ'&FRFÜR$T¬7FvW27Fñ∆¿¢ÚÚñ‚f∆ñváBÜ÷ó'&˜'2'VÂVWVVD6ˆ◊&ó6ˆÁ2r6ˆ◊&U7FWˆ6ˆ◊&U7FGW2GFW&‚í‚Ê¢ÚÚf'&ñ6FVBW&6VÁFvR˜"'7FW‚ˆbF˜F¬"“FÜR∆FW"7FvW2&R6ˆÊFóFñˆÊ¿¢ÚÚá˜7FñÊr÷ˆÊ«í¬„”2¶ˆ'2¬WF2‚í¬6ÚFVÊˆ÷ñÊF˜"v˜V∆B&RñÁfVÁFVB‡¢6ˆÁ7B∂&u'VÊÊñÊr¬6WD&u'VÊÊñÊu““W6U7FFRÜf«6Rì∞¢6ˆÁ7B∂&u7FW¬6WD&u7FW““W6U7FFRÉì∞¢6ˆÁ7B∂&u7FGW2¬6WD&u7FGW5““W6U7FFRÇ""ì∞¢6ˆÁ7B∂&tV∆6VB¬6WD&tV∆6VE““W6U7FFRÉì∞¢ÚÚ÷ˆF¬7V2ÑáV÷‚∆VB”rs#bì¢vÜV‚FÜR&6∂w&˜VÊBf‚÷˜WBdî≈2ág26WGF∆ñÊrí¿¢ÚÚFÜR7FW2&ˆw&W72÷ˆF¬◊W7B6Ü˜r‚W'&˜"7FFR≤&V6˜fW'íñÁ7G'V7Fñˆ‚ñÁ7FV@¢ÚÚˆb6ñ∆VÁF«í6∆˜6ñÊr‚""“ÊÚW'&˜#≤6Ü˜'B&V6ˆ‚7G&ñÊr˜FÜW'vó6R‡¢6ˆÁ7B∂&tW'&˜"¬6WD&tW'&˜%““W6U7FFRÇ""ì∞¢6ˆÁ7BFˆvv∆U&Vb“W6U&VbÜÁV∆¬ì∞¢6ˆÁ7B6ˆ◊&U&Vb“W6U&VbÜÁV∆¬ì∞¢6ˆÁ7BF$&%&Vb“W6U&VbÜÁV∆¬ì∞¢6ˆÁ7BÜ4Ê«ó6VDˆÊ6R“W6U&VbÜf«6Rì∞¢6ˆÁ7B∂fó'7D&∆ñÊµ6∂ñ∆¬¬6WDfó'7D&∆ñÊµ6∂ñ∆≈““W6U7FFRÇ""ì≤ÚÚc„Ç„ì¢6∂ñ∆¬Ê÷RFÚ&∆ñÊ≤ˆ‚fó'7B∆ˆBá&W∆6W26ˆ6Ç÷&≤ê¢ÚÚ√VFóBÊ˜FS¢6ˆ6Ö6∂ñ∆ƒÊ÷Ró26WB∆ˆÊw6ñFRfó'7D&∆ñÊµ6∂ñ∆¬ñ‚FÜRÜ4Ê«ó6VDˆÊ6P¢ÚÚW6TVffV7B'WBóG2f«VRó2ÊWfW"&VBñ‚Áí&VÊFW"6ˆÊFóFñˆ‚‚FÜR6ˆ6Ç÷&≤˜fW&∆ê¢ÚÚFÜB˜&ñvñÊ∆«í6ˆÁ7V÷VBóBv2&V÷˜fVBñ‚c„Ç„í‚óBó2&WFñÊVBÜW&RˆÊ«í&V6W6P¢ÚÚ&V÷˜fñÊróBv˜V∆B&WVó&R6ˆÊfó&÷ñÊrÊÚF˜vÁ7G&V“ßV◊Fı6∂ñ∆¬FÇFWVÊG2ˆ‚óB‡¢ÚÚ6ÊFñFFRf˜"&V÷˜f¬ñ‚gWGW&R6∆VÁW6W76ñˆ‚“fW&ñgíßV◊Fı6∂ñ∆¬FÇó0¢ÚÚgV∆«í6W'fVB'ífó'7D&∆ñÊµ6∂ñ∆¬&Vf˜&RFV∆WFñÊr‡¢6ˆÁ7B∂6ˆ6Ö6∂ñ∆ƒÊ÷R¬6WD6ˆ6Ö6∂ñ∆ƒÊ÷U““W6U7FFRÇ""ì≤ÚÚ∂WBf˜"ßV◊Fı6∂ñ∆¬FÇ“6VR√Ê˜FP¢ÚÚÉ2fóÉ¢Ê«ó6ó26Ê6V∆∆Fñˆ‚&Vg2‡¢ÚÚÊ«ó6ó46Ê6V≈&Vbó2ñÊ7&V÷VÁFVBBFÜR7F'BˆbWfW'íFÙÊ«ó6R6∆¬‡¢ÚÚV6Ç7ñÊ26Üñ‚6GW&W2FÜRf«VRBóG27F'BÜ6Ê6VƒñBíÊB6ÜV6∑0¢ÚÚÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB””“6Ê6VƒñB&Vf˜&RÁí6WE7FFR6∆¬‡¢ÚÚ6V6ˆÊBFÙÊ«ó6R6∆¬ñÊ7&V÷VÁG2FÜR6˜VÁFW"¬÷∂ñÊr∆¬&ñ˜"6∆˜7W&W0¢ÚÚ7F∆R¬6ÚFÜWí6ñ∆VÁF«íWÜóBvóFÜ˜WBw&óFñÊrFÚ6Ü&VB7FFR‡¢ÚÚ6fWGïFñ÷W%&VbÜˆ∆G2FÜR7FófR6fWGïFñ÷W"ÜÊF∆R6ÚóB6‚&R6∆V&V@¢ÚÚñbÊWrÊ«ó6ó27F'G2&Vf˜&RFÜR&Wfñ˜W2Fñ÷W"fó&W2‡¢6ˆÁ7BÊ«ó6ó46Ê6V≈&Vb“W6U&VbÉì∞¢6ˆÁ7B6fWGïFñ÷W%&Vb“W6U&VbÜÁV∆¬ì∞¢ÚÚTì"á7FvR"ˆbFÜR∆ñ˜WBFR◊fñ&Rì¢DTdT≈B6ñÊ6Rc2„„c2ÑáV÷‚∆VB&˜fVBFÜP¢ÚÚÙ"f∆óí‚˜Vì”ó2FÜRW66RÜF6Ç&6≤FÚFÜR˜&ñvñÊ¬7F6∂VB∆ñ˜WB‚6GW&VBˆÊ6P¢ÚÚB÷˜VÁBÜFVW÷∆ñÊ≤VffV7G2&W∆6U7FFRFÜRU$¬∆FW"¬6Ú&R◊&VG2v˜V∆B∆˜6RóBí‡¢6ˆÁ7B∑Vïc%““W6U7FFRÇÇí”‚≤G'í≤&WGW&‚ÊWrU$≈6V&6Ö&◊2ávñÊF˜rÊ∆ˆ6Fñˆ‚Á6V&6ÇíÊvWBÇ'Ví"í”“##≤“6F6ÇÖÚí≤&WGW&‚G'VS≤““ì∞¢6ˆÁ7B∑VïvñFR¬6WEVïvñFU““W6U7FFRÇÇí”‚≤G'í≤&WGW&‚vñÊF˜rÊ÷F6Ñ÷VFñÇ"Ü÷ñ‚◊vñGFÉ¢ìÇí"íÊ÷F6ÜW3≤“6F6ÇÖÚí≤&WGW&‚f«6S≤““ì∞¢6ˆÁ7B∑&W7V«EÊV¬¬6WE&W7V«EÊV≈““W6U7FFRÇ&÷"ì≤ÚÚ$î„¢ÜˆÊR&W7V«BÊV«2“6≤¬÷¬FV6ñFP¢6ˆÁ7B∑&ñ‰Êd˜V‚¬6WE&ñ‰Êd˜VÂ““W6U7FFRÜf«6Rì≤ÚÚ$î„3¢f∆ˆFñÊr∆VgBÊfñvFñˆ‚G&vW ¢6ˆÁ7B∑&ñ‰FV6ó6ñˆ‰˜V‚¬6WE&ñ‰FV6ó6ñˆ‰˜VÂ““W6U7FFRÜf«6Rì≤ÚÚ$î„3¢6ˆ∆∆6VB&ñváBFV6ó6ñˆ‚&ñ¿¢W6TVffV7BÇÇí”‚∞¢ñbÇVïc"í&WGW&„∞¢G'í∞¢6ˆÁ7B◊“vñÊF˜rÊ÷F6Ñ÷VFñÇ"Ü÷ñ‚◊vñGFÉ¢ìÇí"ì∞¢6ˆÁ7Bf‚“R”‚6WEVïvñFRÜRÊ÷F6ÜW2ì∞¢◊ÊFDWfVÁD∆ó7FVÊW"Ç&6ÜÊvR"¬f‚ì∞¢&WGW&‚Çí”‚◊Á&V÷˜fTWfVÁD∆ó7FVÊW"Ç&6ÜÊvR"¬f‚ì∞¢“6F6ÇÖÚí∑–¢“¬∑Vïc%“ì∞¢6ˆÁ7BVWVT&ÊÊW%&Vb“W6U&VbÜÁV∆¬ì∞¢6ˆÁ7B6ˆ◊&ó6ˆÁ5&Vb“W6U&VbÖµ“ì∞¢6ˆÁ7BFV&˜VÊ6U&Vb“W6U&VbÜÁV∆¬ì≤ÚÚcc¢FV&˜VÊ6RFñ÷W"f˜"ñ6∂W ¢6ˆÁ7B76ˆ4FV&˜VÊ6U&Vb“W6U&VbÜÁV∆¬ì≤ÚÚdƒır”¢FV&˜VÊ6RFñ÷W"f˜"54Ù2VW'í7VvvW7FñˆÁ0¢6ˆÁ7Bñ6∂W$6Ê6V≈&Vb“W6U&VbÜf«6Rì≤ÚÚc„B„¢6Ê6V¬ñ‚÷f∆ñváB&6∂w&˜VÊBgV∆¬6V&6Ä†¢ÚÚU$¬&“WFÚ◊G&ñvvW"“ÜÊF∆W2˜&ˆ∆S’&ˆ∆TÊ÷Rg&ˆ“$Wá∆˜&R6ñ÷ñ∆"&ˆ∆R"ñ‚6∂ñ∆ƒWáW'D˜fW&∆ê¢W6TVffV7BÇÇí”‚∞¢6ˆÁ7B&◊2“ÊWrU$≈6V&6Ö&◊2ávñÊF˜rÊ∆ˆ6Fñˆ‚Á6V&6Çì∞¢6ˆÁ7B&ˆ∆U&““&◊2ÊvWBÇ'&ˆ∆R"ì∞¢ñbá&ˆ∆U&“í∞¢6ˆÁ7BFñGï&ˆ∆R“FıFóF∆T66RÜFV6ˆFUU$î6ˆ◊ˆÊVÁBá&ˆ∆U&“íì∞¢G&6≤Ç'&ˆ∆U˜W&≈˜&“"¬≤&ˆ∆S¢FñGï&ˆ∆R“ì∞¢ÚÚÉfóÉ¢f∆ñFFRU$¬&“&Vf˜&RÁíí6∆¬‚FÜRU$¬&“FÄ¢ÚÚ66WG2WáFW&Ê¬ñÁWBvóFÇÊÚTíFV&˜VÊ6ñÊr“ÜñvÜW"ñÊ¶V7Fñˆ‚&ó6≤FÜ‡¢ÚÚFÜR6V&6Ç&˜Ç‚G&˜6ñ∆VÁF«íFÚñF∆RñbFÜR&“fñ«2f∆ñFFñˆ‚‡¢6ˆÁ7Bf∆ñFFñˆ‰W'"“f∆ñFFT¶ˆ%FóF∆TñÁWBáFñGï&ˆ∆Rì∞¢ñbáf∆ñFFñˆ‰W'"í≤vñÊF˜rÊÜó7F˜'íÁ&W∆6U7FFRá∑“¬""¬vñÊF˜rÊ∆ˆ6Fñˆ‚ÁFÜÊ÷Rì≤&WGW&„≤–¢6WEVW'íáFñGï&ˆ∆Rì∞¢vñÊF˜rÊÜó7F˜'íÁ&W∆6U7FFRá∑“¬""¬vñÊF˜rÊ∆ˆ6Fñˆ‚ÁFÜÊ÷Rì∞¢6WE7FWÇ'6V&6ÜñÊr"ì∞¢6V&6Ñˆ67WFñˆÁ2áFñGï&ˆ∆R¬#R"ê¢ÁFÜV‚á&W2”‚∞¢ñbÇ&W2Ê∆VÊwFÇí≤6WE7FWÇ&ñF∆R"ì≤&WGW&„≤–¢6ˆÁ7BWÜ7B“&W2ÊfñÊBá"”‚"ÁFóF∆RÁFÙ∆˜vW$66RÇí””“FñGï&ˆ∆RÁFÙ∆˜vW$66RÇíì∞¢ñbÜWÜ7Bí∞¢ÚÚWÜ7BU44Ú÷F6Ç“vÚ7G&ñváBFÚÊ«ó6ó0¢FÙÊ«ó6RÜWÜ7Bì∞¢“V«6R∞¢ÚÚÊÚWÜ7B÷F6Ç“6Ü˜rñ6∂W"vóFÇÊ˜Fñ6R6ÚW6W"6‚6Üˆ˜6RFÜR6∆˜6W7B&ˆ∆P¢6WDˆ672á&W2Êfñ«FW"ÇÜÚ¬í¬'"í”‚'"ÊfñÊDñÊFWÇáÇ”‚ÇÁFóF∆RÁFÙ∆˜vW$66RÇí””“ÚÁFóF∆RÁFÙ∆˜vW$66RÇíí””“ííì∞¢6WDÊÙWÜ7D÷F6ÇáFñGï&ˆ∆Rì∞¢6WE7FWÇ'ñ6∂ñÊr"ì∞¢–¢vñÊF˜rÁ67&ˆ∆≈FÚá≤F˜¢¬&VÜfñ˜#¢'6÷ˆ˜FÇ"“ì∞¢“ê¢Ê6F6ÇÇÇí”‚∞¢ÚÚ6V&6Çfñ∆VB“f∆¬&6≤FÚ&&RFóF∆RÊ«ó6ó0¢FÙÊ«ó6Rá≤FóF∆S¢FñGï&ˆ∆R¬ó66Ù6ˆFS¢""¬ó66Ùw&˜W¢""¬FW67&óFñˆ„¢""“ì∞¢“ì∞¢–¢“¬µ“ì∞†¢ÚÚ5É#¢W'6ó7BFÜR6ˆ◊∆WFVBÊ«ó6ó2∆ˆ6∆«í6ÚFÜRÊ«ó6ó27ÜW&P¢ÚÚÇ˜7ÜW&ñ6¬í6‚6Ü˜rFÜR$T¬'Fñf7G2ˆbñ˜W"∆7B'V‚¬ÊBFÜP¢ÚÚ˜F#“FVW÷∆ñÊ≤&V∆˜r6‚&W7F˜&RóB‚5bFFó2‰UdU"W'6ó7FVB–¢ÚÚ&W7V«B6'&ñW2ˆÊ«íFÜR&ˆ∆R◊6ñFR&VG2Ü7b∆ófW2ñ‚6W&FR7FFRí‡¢ÚÚ&W7B÷Vff˜'C¢V˜F˜6W&ñ∆ó6Fñˆ‚fñ«W&W2&R6ñ∆VÁF«í6∂óVB‡¢W6TVffV7BÇÇí”‚∞¢ñbÇ&W7V«B«¬6V¬«¬7FW”“'&W7V«G2"í&WGW&„∞¢6ˆÁ7Bñ∆ˆB“≤c¢¬6fVDC¢FFRÊÊ˜rÇí¬FóF∆S¢FıFóF∆T66Rá6V¬ÁFóF∆R«¬""í¿¢6V√¢≤FóF∆S¢6V¬ÁFóF∆R«¬""¬ó66Ù6ˆFS¢6V¬Êó66Ù6ˆFR«¬""¬ó66Ùw&˜W¢6V¬Êó66Ùw&˜W«¬""¬FW67&óFñˆ„¢6V¬ÊFW67&óFñˆ‚«¬""“¿¢&W7V«B”∞¢G'í≤∆ˆ6≈7F˜&vRÁ6WDóFV“Ç'6v7c5ˆ∆7E˜c"¬•4Ù‚Á7G&ñÊvñgíáñ∆ˆBíì≤–¢6F6ÇÖÚí∞¢ÚÚV˜F¢&WG'ívóFÜ˜WBFÜRÜVfñW7BW"◊6∂ñ∆¬&˜6RfñV∆G0¢G'í∞¢6ˆÁ7B6∆ñ““≤‚‚Áñ∆ˆB¬&W7V«C¢≤‚‚Á&W7V«B¬6∂ñ∆«3¢á&W7V«BÁ6∂ñ∆«2«¬µ“íÊ÷á2”‚á≤‚‚Á2¬&ˆ◊C¢""¬&ˆ◊EFV6É¢""¬ÊWáEÜ6S¢""“íí“”∞¢∆ˆ6≈7F˜&vRÁ6WDóFV“Ç'6v7c5ˆ∆7E˜c"¬•4Ù‚Á7G&ñÊvñgíá6∆ñ“íì∞¢“6F6ÇÖÚí≤Ú¢6∂ó“7ÜW&Rf∆«2&6≤FÚvVÊW&ñ26&G2¢Ú–¢–¢“¬∑&W7V«B¬6V¬¬7FW“ì∞†¢ÚÚ5É#¢˜F#“FVW÷∆ñÊ≤g&ˆ“FÜRÊ«ó6ó27ÜW&R“&W7F˜&RFÜR6fV@¢ÚÚÊ«ó6ó2ÊB˜V‚FÜR&WVW7FVBF"‚f∆ñFFW2FÜRF"vñÁ7BFÜP¢ÚÚF'2FÜR6fVB&W7V«B7GV∆«í7W˜'G3≤f∆«2&6≤FÚ'6∂ñ∆«2"‡¢W6TVffV7BÇÇí”‚∞¢G'í∞¢6ˆÁ7BF%&““ÊWrU$≈6V&6Ö&◊2ávñÊF˜rÊ∆ˆ6Fñˆ‚Á6V&6ÇíÊvWBÇ'F""ì∞¢ñbÇF%&“í&WGW&„∞¢6ˆÁ7B&r“∆ˆ6≈7F˜&vRÊvWDóFV“Ç'6v7c5ˆ∆7E˜c"ì∞¢vñÊF˜rÊÜó7F˜'íÁ&W∆6U7FFRá∑“¬""¬vñÊF˜rÊ∆ˆ6Fñˆ‚ÁFÜÊ÷Rì∞¢ñbÇ&rí&WGW&„∞¢6ˆÁ7B6fVB“•4Ù‚Á'6Rá&rì∞¢ñbÇ6fVB«¬6fVBÁb”“«¬6fVBÁ&W7V«B«¬6fVBÁ6V¬«¬'&íÊó4'&íá6fVBÁ&W7V«BÁ6∂ñ∆«2í«¬6fVBÁ&W7V«BÁ6∂ñ∆«2Ê∆VÊwFÇí&WGW&„∞¢6WE6V¬á6fVBÁ6V¬ì∞¢6WE&W7V«Bá6fVBÁ&W7V«Bì∞¢6WE7FWÇ'&W7V«G2"ì∞¢6ˆÁ7B∂Wó2“ÊWr6WBÜ'Vñ∆EF'2á6fVBÁ&W7V«BíÊfñ«FW"áB”‚BÁW6VBíÊ÷áB”‚BÊ∂Wííì∞¢6WD7FófUF"Ü∂Wó2ÊÜ2áF%&“íÚF%&“¢'6∂ñ∆«2"ì∞¢G&6≤Ç'7ÜW&UˆFVW∆ñÊ≤"¬≤F#¢F%&““ì∞¢“6F6ÇÖÚí≤Ú¢÷∆f˜&÷VB6fR“7Fíˆ‚ñF∆R¢Ú–¢“¬µ“ì∞†¢ÚÚcc¢FV&˜VÊ6VBñÁ7FÁB◊6V&6Ç(	Bfó&W2#É◊2gFW"W6W"7F˜2GóñÊp¢ÚÚ∆ˆFñÊrñÊFñ6F˜"6Ü˜w2ñ÷÷VFñFV«íˆ‚2≤6Ü'2f˜"&W7ˆÁ6ófRfVV¿¢ÚÚˆÊ«í7FófRˆ‚ñF∆RˆW'&˜"7FW6ÚóBFˆW6‚wBfó&RGW&ñÊrÊ«ó6ó0¢ÚÚ6Ê6V∆∆VBf∆r&WfVÁG27F∆R&W7V«G2g&ˆ“7WW'6VFVB6∆¬w&óFñÊrFÚ7FFP¢ÚÚ54Ù2÷ˆFW2Ü¶ˆ'2ˆ6ˆ◊ÁííÜÊF∆RFÜVó"GóVÜVBñ‚FÜR6ñ&∆ñÊrVffV7B&V∆˜r–¢ÚÚ&ˆ∆R˜vñ∂í∂VWFÜRU44Ú¥ƒƒ“FÇ‡¢W6TVffV7BÇÇí”‚∞¢ñbá7FW”“&ñF∆R"bb7FW”“&W'&˜""í&WGW&„∞¢ñbá6V&6Ñ÷ˆFR”“'&ˆ∆R"bb6V&6Ñ÷ˆFR”“'vñ∂í"í≤6WDˆ672Öµ“ì≤6WEñ6∂W$∆ˆFñÊrÜf«6Rì≤&WGW&„≤–¢6ˆÁ7B“VW'íÁG&ñ“Çì∞¢ñbáÊ∆VÊwFÇ¬2í≤6WDˆ672Öµ“ì≤6WEñ6∂W$∆ˆFñÊrÜf«6Rì≤&WGW&„≤–¢ÚÚ6Ü˜r∆ˆFñÊrñ÷÷VFñFV«í“W6W"6VW2fVVF&6≤ˆ‚∂Wó7G&ˆ∂R2¬Ê˜BgFW"FV&˜VÊ6P¢6WEñ6∂W$∆ˆFñÊráG'VRì∞¢6∆V%Fñ÷V˜WBÜFV&˜VÊ6U&VbÊ7W'&VÁBì∞¢∆WB6Ê6V∆∆VB“f«6S∞¢FV&˜VÊ6U&VbÊ7W'&VÁB“6WEFñ÷V˜WBÜ7ñÊ2Çí”‚∞¢G'í∞¢6ˆÁ7B&W2“vóB6V&6Ñˆ67WFñˆÁ2á¬#R"ì∞¢ñbÇ6Ê6V∆∆VBí6WDˆ672á&W2Êfñ«FW"ÇÜÚ¬í¬'"í”‚'"ÊfñÊDñÊFWÇáÇ”‚ÇÁFóF∆RÁFÙ∆˜vW$66RÇí””“ÚÁFóF∆RÁFÙ∆˜vW$66RÇíí””“ííì∞¢“6F6ÇÖÚí≤ñbÇ6Ê6V∆∆VBí6WDˆ672Öµ“ì≤–¢ñbÇ6Ê6V∆∆VBí6WEñ6∂W$∆ˆFñÊrÜf«6Rì∞¢“¬#Éì∞¢&WGW&‚Çí”‚≤6Ê6V∆∆VB“G'VS≤6∆V%Fñ÷V˜WBÜFV&˜VÊ6U&VbÊ7W'&VÁBì≤”∞¢“¬∑VW'í¬7FW¬6V&6Ñ÷ˆFU“ì∞†¢ÚÚdƒır”¢54Ù2##BVW'í◊FWáB7VvvW7FñˆÁ2“¶ˆ'2ˆ6ˆ◊Áí÷ˆFW2ˆÊ«í‚&Ww&óFW2FÜP¢ÚÚGóVBVW'íFWáBˆ‚FÖ#"ì≤ÊWfW"vFW27V&÷ó76ñˆ‚¬ÊWfW"fñ«FW'27FW"ˆ6ˆ◊Áê¢ÚÚ&W7V«G2‚G&ñvvW'2ˆ‚6Ü˜'BÉ”"v˜&B¬„“26Ü"íVW'í¬ñF∆RˆW'&˜"7FWˆÊ«í‡¢W6TVffV7BÇÇí”‚∞¢ñbá7FW”“&ñF∆R"bb7FW”“&W'&˜""í≤6WE76ˆ4ˆ672Öµ“ì≤&WGW&„≤–¢ñbá6V&6Ñ÷ˆFR”“&¶ˆ'2"bb6V&6Ñ÷ˆFR”“&6ˆ◊Áí"í≤6WE76ˆ4ˆ672Öµ“ì≤&WGW&„≤–¢6ˆÁ7B“VW'íÁG&ñ“Çì∞¢6ˆÁ7Bv˜&G2“ÚÁ7∆óBÇı«2≤ÚíÊfñ«FW"Ñ&ˆˆ∆V‚í¢µ”∞¢ñbÇ«¬Ê∆VÊwFÇ¬2«¬v˜&G2Ê∆VÊwFÇ‚"í≤6WE76ˆ4ˆ672Öµ“ì≤6WE76ˆ57VvvW7D∆ˆFñÊrÜf«6Rì≤&WGW&„≤–¢6WE76ˆ57VvvW7D∆ˆFñÊráG'VRì∞¢6∆V%Fñ÷V˜WBá76ˆ4FV&˜VÊ6U&VbÊ7W'&VÁBì∞¢∆WB6Ê6V∆∆VB“f«6S∞¢76ˆ4FV&˜VÊ6U&VbÊ7W'&VÁB“6WEFñ÷V˜WBÜ7ñÊ2Çí”‚∞¢G'í∞¢6ˆÁ7B&W2“vóBfWF6ÇÇ"ˆí˜76ˆ2"¬∞¢÷WFÜˆC¢%ı5B"¬ÜVFW'3¢≤&6ˆÁFVÁB◊GóR#¢&∆ñ6Fñˆ‚ˆß6ˆ‚"“¿¢&ˆGì¢•4Ù‚Á7G&ñÊvñgíá≤7Fñˆ„¢'6V&6Ç"¬VW'ì¢¬∆ñ÷óC¢Ç“í¿¢“ì∞¢6ˆÁ7BFF“vóB&W2Êß6ˆ‚Çì∞¢6ˆÁ7B&W7V«G2“'&íÊó4'&íÜFFÁ&W7V«G2íÚFFÁ&W7V«G2¢µ”∞¢ÚÚßVFv÷VÁB6∆¬á7V2∆VgB˜V‚ì¢ˆÊ«íˆ67WFñˆ‚÷∆WfV¬ÉR÷FñvóBí7VvvW7FñˆÁ2–¢ÚÚ'&ˆBw&˜WFóF∆R2VW'íFWáBv˜V∆B÷∂RFÜR‘4b∂Wóv˜&B6V&6Çv˜'6R‡¢6ˆÁ7Bˆ67WFñˆÁ4ˆÊ«í“&W7V«G2Êfñ«FW"ÇÜ‚í”‚‚Ê∂ñÊB””“&ˆ67WFñˆ‚"ì∞¢ñbÇ6Ê6V∆∆VBí6WE76ˆ4ˆ672Üˆ67WFñˆÁ4ˆÊ«íì∞¢“6F6ÇÖÚí≤ñbÇ6Ê6V∆∆VBí6WE76ˆ4ˆ672Öµ“ì≤–¢ñbÇ6Ê6V∆∆VBí6WE76ˆ57VvvW7D∆ˆFñÊrÜf«6Rì∞¢“¬#Éì∞¢&WGW&‚Çí”‚≤6Ê6V∆∆VB“G'VS≤6∆V%Fñ÷V˜WBá76ˆ4FV&˜VÊ6U&VbÊ7W'&VÁBì≤”∞¢“¬∑VW'í¬7FW¬6V&6Ñ÷ˆFU“ì∞†¢6ˆÁ7B&W6WB“Çí”‚≤ñ6∂W$6Ê6V≈&VbÊ7W'&VÁB“G'VS≤vñ∂îFW7E&VbÊ7W'&VÁB“f«6S≤6WDÊÙWÜ7D÷F6ÇÜÁV∆¬ì≤6WDgVÊ7Fñˆ‰∂Wóv˜&DÊ˜Fñ6RÜÁV∆¬ì≤6WE7FWÇ&ñF∆R"ì≤6WDˆ672Öµ“ì≤6WE6V¬ÜÁV∆¬ì≤6WE&W7V«BÜÁV∆¬ì≤6WDW'"Ç""ì≤6WEVW'íÇ""ì≤6WE7V"Ç""ì≤6WE7V%7FWÉì≤6WD∆ˆFñÊu6∂ñ∆«2Öµ“ì≤6WD7FófUF"Ç'6∂ñ∆«2"ì≤6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁB“µ”≤6WD6ˆ◊&ó6ˆÁ2Öµ“ì≤6WD6ˆ◊&T7VRÜf«6Rì≤6WDÊ«ó6ñÊu˜7FñÊrÜÁV∆¬ì≤6WD6˜'W5vóBÜÁV∆¬ì≤”∞¢ÚÚ6ˆgE&W6WB&W6W'fW26ˆ◊&ó6ˆ‚66ÜR“W6VBvÜV‚FFñÊr&ˆ∆RFÚ6ˆ◊&P¢6ˆÁ7B6ˆgE&W6WB“á6fVD6ˆ◊&ó6ˆÁ2í”‚∞¢6ˆÁ7B&VGî6˜VÁB“6fVD6ˆ◊&ó6ˆÁ2Êfñ«FW"Ü2”‚2Á&W7V«Bbb2Á&W7V«BÁ6∂ñ∆«2íÊ∆VÊwFÉ∞¢6WE7FWÇ&ñF∆R"ì≤6WDˆ672Öµ“ì≤6WE6V¬ÜÁV∆¬ì≤6WE&W7V«BÜÁV∆¬ì≤6WDW'"Ç""ì∞¢6WEVW'íÇ""ì≤6WE7V"Ç""ì≤6WE7V%7FWÉì≤6WD6ˆ◊&T7VRÜf«6Rì∞¢ÚÚ&W6W'fR6ˆ◊&RF"ñb6ˆ◊&ó6ˆ‚ó2&VGí“Fˆ‚wB6Ê&6≤FÚ6∂ñ∆«0¢ñbá&VGî6˜VÁB¬"í6WD7FófUF"Ç'6∂ñ∆«2"ì∞¢6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁB“6fVD6ˆ◊&ó6ˆÁ3≤6WD6ˆ◊&ó6ˆÁ2á6fVD6ˆ◊&ó6ˆÁ2ì∞¢”∞†¢ÚÚ6Ü˜rv&ÊñÊr&Vf˜&R6∆V&ñÊr6ˆ◊&ó6ˆ‚“ˆÊ«íñb6ˆ◊&ó6ˆ‚Ü2&VGí&W7V«G0¢6ˆÁ7B6ˆÊfó&‘ñd6ˆ◊&ñÊr“Üˆ‰6ˆÊfó&“í”‚∞¢6ˆÁ7BÜ5&VGî6ˆ◊&ó6ˆÁ2“6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁBÊfñ«FW"Ü2”‚2Á&W7V«Bbb2Á&W7V«BÁ6∂ñ∆«2íÊ∆VÊwFÇ„“#∞¢ñbÜÜ5&VGî6ˆ◊&ó6ˆÁ2í∞¢6WD6ˆ◊&Uv&ÊñÊrá≤ˆ‰6ˆÊfó&““ì∞¢“V«6R∞¢ˆ‰6ˆÊfó&“Çì∞¢–¢”∞†¢6ˆÁ7BFEFÙ6ˆ◊&ó6ˆ‚“áFóF∆R¬&W2í”‚∞¢6WD6ˆ◊&ó6ˆÁ2á&Wb”‚∞¢ñbá&WbÊfñÊBÜ2”‚2ÁFóF∆R””“FóF∆Ríí&WGW&‚&Wc∞¢ñbá&WbÊ∆VÊwFÇ„“2í&WGW&‚&Wc∞¢6ˆÁ7BÊWáB“≤‚‚Á&Wb¬≤FóF∆R¬&W7V«C¢&W2’”∞¢6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁB“ÊWáC∞¢&WGW&‚ÊWáC∞¢“ì∞¢”∞†¢6ˆÁ7B&V÷˜fTg&ˆ‘6ˆ◊&ó6ˆ‚“áFóF∆Rí”‚∞¢6WD6ˆ◊&ó6ˆÁ2á&Wb”‚&WbÊfñ«FW"Ü2”‚2ÁFóF∆R”“FóF∆Ríì∞¢”∞†¢ÚÚ÷W&vR'Fñ¬&W7V«BF6ÇñÁFÚVWVVB˜&VGí6ˆ◊&ó6ˆ‚VÁG'íÜÊÚ÷˜ñb'6VÁBí‡¢6ˆÁ7BF6Ñ6ˆ◊&ó6ˆÂ&W7V«B“áFóF∆R¬'Fñ¬í”‚∞¢6WD6ˆ◊&ó6ˆÁ2á&Wb”‚∞¢∆WB6ÜÊvVB“f«6S∞¢6ˆÁ7BÊWáB“&WbÊ÷Ü2”‚∞¢ñbÜ2ÁFóF∆R””“FóF∆Rbb2Á&W7V«Bí≤6ÜÊvVB“G'VS≤&WGW&‚≤‚‚Ê2¬&W7V«C¢≤‚‚Ê2Á&W7V«B¬‚‚Á'Fñ¬“”≤–¢&WGW&‚3∞¢“ì∞¢ñbÜ6ÜÊvVBí6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁB“ÊWáC∞¢&WGW&‚6ÜÊvVBÚÊWáB¢&Wc∞¢“ì∞¢”∞†¢ÚÚc2„#¢$'&˜w6R◊î6&VW'4gWGW&R¶ˆ'2"÷ˆFR“6∂óU44Ú&W6ˆ«WFñˆ„≤vÚ7G&ñvá@¢ÚÚFÚFÜR7FÊF∆ˆÊR¶ˆ"∆ó7Bf˜"FÜRGóVBFW&“‚V6Ç6&B6‚7Fñ∆¬$Ê«ó6P¢ÚÚFÜó2˜7FñÊr"Ç”‚gV∆¬&W7V«G267&VV‚í˜""≤6ˆ◊&R"‡¢6ˆÁ7B7F'D¶ˆ'4'&˜w6R“W6T6∆∆&6≤ÇÇí”‚∞¢ñbÇVW'íÁG&ñ“Çíí&WGW&„∞¢6ˆÁ7Bf∆ñFFñˆ‰W'"“f∆ñFFT¶ˆ%FóF∆TñÁWBáVW'íì∞¢ñbáf∆ñFFñˆ‰W'"í≤6WDW'"áf∆ñFFñˆ‰W'"ì≤6WE7FWÇ&W'&˜""ì≤&WGW&„≤–¢6WDW'"Ç""ì≤6WE6V¬ÜÁV∆¬ì≤6WE&W7V«BÜÁV∆¬ì≤6WDˆ672Öµ“ì∞¢G&6≤Ç&¶ˆ'5ˆ'&˜w6U˜7F'FVB"¬≤¢VW'íÁG&ñ“ÇíÁ6∆ñ6RÉ¬cí“ì∞¢6WE7FWÇ&÷6eˆ'&˜w6R"ì∞¢“¬∑VW'ï“ì∞†¢ÚÚ4Û¢6ˆ◊Áí÷Ê÷R6V&6Ç÷ˆFR‚÷ó'&˜'27F'D¶ˆ'4'&˜w6S≤G&Á6óFñˆÁ2F¢ÚÚ÷6eˆ6ˆ◊Áí7FWvÜW&R6ˆ◊ÁïÊV¬FˆW2FÜRfWF6Ç≤&W6ˆ«WFñˆ‚≤&VÊFW"‡¢6ˆÁ7B7F'D6ˆ◊Áï6V&6Ç“W6T6∆∆&6≤ÇÇí”‚∞¢ñbÇVW'íÁG&ñ“Çíí&WGW&„∞¢6ˆÁ7Bf∆ñFFñˆ‰W'"“f∆ñFFT¶ˆ%FóF∆TñÁWBáVW'íì∞¢ñbáf∆ñFFñˆ‰W'"í≤6WDW'"áf∆ñFFñˆ‰W'"ì≤6WE7FWÇ&W'&˜""ì≤&WGW&„≤–¢6WDW'"Ç""ì≤6WE6V¬ÜÁV∆¬ì≤6WE&W7V«BÜÁV∆¬ì≤6WDˆ672Öµ“ì∞¢G&6≤Ç&6ˆ◊Áï˜6V&6Ö˜7F'FVB"¬≤¢VW'íÁG&ñ“ÇíÁ6∆ñ6RÉ¬cí“ì∞¢6WE7FWÇ&÷6eˆ6ˆ◊Áí"ì∞¢“¬∑VW'ï“ì∞†¢ÚÚtî¥ì¢6&VW"vñ∂îw&Ç÷ˆFR‚vñ∂í÷÷ˆFR6V&6Ç'VÁ2FÜR4‘R&W6ˆ«fR∞¢ÚÚÊ«ó6RóV∆ñÊR2Ê«ó6R&ˆ∆S≤FW7FñÊFñˆ‚&Vbá7W'fófW2FÜR7ñÊ2U44¢ÚÚñ6∂W"í÷∂W2FÙÊ«ó6R∆ÊBˆ‚FÜRgV∆¬&W7V«BvRvóFÇFÜR'vñ∂ñw&Ç"D ¢ÚÚ7FófR“6Ú∆¬FÜRWÜó7FñÊrÊfñvFñˆ‚Ö6∂ñ∆¬Ê«ó6ó2¬¶ˆ"ÊFˆ◊í¬&ˆ∆P¢ÚÚw&Ç¬‚‚‚í7Fó2&W6VÁB‚FÜRvñ∂îw&Çó2F"¬Ê˜B6W&FRfñWr‡¢6ˆÁ7Bvñ∂îFW7E&Vb“W6U&VbÜf«6Rì∞¢ÚÚtî¥ì¢'Vñ∆BFÜRw&Çñ∆ˆBg&W6Çg&ˆ“FÜR∆ófR&W7V«BÑ‰ıBfñFÜP¢ÚÚ&ˆ∆R÷∂Wí66ÜR¬vÜñ6Çv˜V∆Bg&VW¶RGWGí÷∆W72w&Çí‚6ˆ◊WFVB∆¶ñ«íˆÊ«ê¢ÚÚvÜV‚FÜRvñ∂ñw&ÇF"ó2˜V„≤&V6ˆ◊WFW22&W7V«BVÁ&ñ6ÜW2¬FÜV‚7F&∆R‡¢ÚÚ'Vñ∆D∂Ê˜v∆VFvTw&Çó26ˆÁ7V÷VB&VB÷ˆÊ«í“ÊWfW"VFóFVB‡¢6ˆÁ7Bvñ∂î∂uñ∆ˆB“W6T÷V÷ÚÇÇí”‚∞¢ñbÜ7FófUF"”“'vñ∂ñw&Ç"«¬&W7V«Bí&WGW&‚≤ÊˆFW3¢µ“¬VFvW3¢µ“”∞¢G'í≤&WGW&‚'Vñ∆D∂Ê˜v∆VFvTw&Çá&W7V«B¬áVW'í«¬""íÁG&ñ“Çíì≤–¢6F6ÇÖˆRí≤&WGW&‚≤ÊˆFW3¢µ“¬VFvW3¢µ“”≤–¢“¬∂7FófUF"¬&W7V«B¬VW'ï“ì∞†¢6ˆÁ7BFı6V&6Ç“W6T6∆∆&6≤Ü7ñÊ2Çí”‚∞¢ñbÇVW'íÁG&ñ“Çíí&WGW&„∞¢ÚÚÉfóÉ¢f∆ñFFRñÁWB&Vf˜&RÁíí6∆¬˜"7FFRG&Á6óFñˆ‚‡¢ÚÚ6F6ÜW2˜fW'6ó¶VB¬Êˆ‚÷«Ü&WFñ2¬ÊBÖD‘¬◊7V6ñ¬÷6Ü"ñÁWG2BFÜRg&ˆÁBFˆ˜"‡¢6ˆÁ7Bf∆ñFFñˆ‰W'"“f∆ñFFT¶ˆ%FóF∆TñÁWBáVW'íì∞¢ñbáf∆ñFFñˆ‰W'"í≤6WDW'"áf∆ñFFñˆ‰W'"ì≤6WE7FWÇ&W'&˜""ì≤&WGW&„≤“ÚÚñÁB∆ˆFñÊr7FFRñ÷÷VFñFV«í&Vf˜&RÁí˜FÜW"v˜&≤“7&óFñ6¬f˜"îÂ66˜&P¢6ˆÁ7BFñGïVW'í“FıFóF∆T66RáVW'íÁG&ñ“Çíì∞¢6ˆÁ7BgVÊ4ÜóB“FWFV7DgVÊ7Fñˆ‰∂Wóv˜&BáVW'íÁG&ñ“ÇíÁFÙ∆˜vW$66RÇíì∞¢6WDgVÊ7Fñˆ‰∂Wóv˜&DÊ˜Fñ6RÜgVÊ4ÜóB«¬ÁV∆¬ì∞¢ñbÜˆ672Ê∆VÊwFÇ‚bbñ6∂W$∆ˆFñÊrí∞¢ñbÜˆ672Ê∆VÊwFÇ””“í≤G&6≤Ç&ˆ67WFñˆÂ˜6V∆V7FVB"¬≤WFÛ¢G'VR“ì≤FÙÊ«ó6RÜˆ675≥“ì≤&WGW&„≤–¢6WE7FWÇ'ñ6∂ñÊr"ì≤&WGW&„∞¢–¢6WE7FWÇ'6V&6ÜñÊr"ì∞¢6WEVW'íáFñGïVW'íì∞¢6WE6Ü˜tWáV7BáG'VRì∞¢6WEFñ÷V˜WBÇÇí”‚6WE6Ü˜tWáV7BÜf«6Rí¬##ì∞¢6WDW'"Ç""ì∞¢G&6≤Ç&ˆ67WFñˆÂ˜6V&6ÜVB"ì∞¢G&6≤Ç'&ˆ∆U˜6V&6ÜVB"¬≤VW'ì¢FñGïVW'íÁ6∆ñ6RÉ¬3í“ì∞¢ñ6∂W$6Ê6V≈&VbÊ7W'&VÁB“G'VS≤ÚÚ6Ê6V¬Áíñ‚÷f∆ñváB&6∂w&˜VÊBgV∆¬6V&6Ä¢6WDÊÙWÜ7D÷F6ÇÜÁV∆¬ì≤6WEñ6∂W$gV∆ƒW'&˜"Üf«6Rì∞¢G'í∞¢ÚÚc„Ç„ì¢6ÜV6≤Ü&F6ˆFVB6VÊñ˜"÷ÊvV÷VÁB∆ˆˆ∑Wfó'7B“ñÁ7FÁB≤FWFW&÷ñÊó7Fñ0¢6ˆÁ7B6VÊñ˜$ÜóB“∆ˆˆ∑W6VÊñ˜$÷v◊BáFñGïVW'íì∞¢ñbá6VÊñ˜$ÜóBí∞¢ñbá6VÊñ˜$ÜóBÊó4«Bí6WDÊÙWÜ7D÷F6ÇáFñGïVW'íì∞¢ÚÚc„í„¢vÜV‚W6W"GóVB&VfóÇf&ñÁBÜRÊr‚FWWGí4TÚí¬ñÊ¶V7B7ñÁFÜWFñ2fó'7BVÁG'ê¢ÚÚ6''ññÊrFÜVó"WÜ7BGóVBFóF∆R6ÚóBV'2ñ‚FÜRñ6∂W"26V∆V7F&∆R˜Fñˆ‚‡¢ÚÚFÜR7ñÁFÜWFñ2VÁG'íW6W2FÜR&6R&ˆ∆Rw2ï44ÚFF6ÚÊ«ó6ó2ó26˜'&V7B‡¢∆WB&6U&W7V«G2“6VÊñ˜$ÜóBÁ&W7V«G2Êfñ«FW"ÇÜÚ¬í¬'"í”‚'"ÊfñÊDñÊFWÇáÇ”‚ÇÁFóF∆RÁFÙ∆˜vW$66RÇí””“ÚÁFóF∆RÁFÙ∆˜vW$66RÇíí””“íì∞¢ñbá6VÊñ˜$ÜóBÊó4«BbbFñGïVW'íí∞¢6ˆÁ7B&6U&ˆ∆R“&6U&W7V«G5≥”∞¢6ˆÁ7B7ñÁFÜWFñ4VÁG'í“∞¢FóF∆S¢FñGïVW'í¬ÚÚFÜRWÜ7Bv˜&G2FÜRW6W"GóVB¬RÊr‚$FWWGí4TÚ ¢ó66Ù6ˆFS¢&6U&ˆ∆RÊó66Ù6ˆFR¿¢ó66Ùw&˜W¢&6U&ˆ∆RÊó66Ùw&˜W¿¢ñÊGW7G'ì¢&6U&ˆ∆RÊñÊGW7G'í¿¢ÚÚÉ"fóÉ¢FW67&óFñˆ‚fñV∆B◊W7BÊ˜BV÷&VBFÜRW6W"◊GóVBVW'í‡¢ÚÚ˜&ñvñÊ¬W6VBFV◊∆FR∆óFW&¬vóFÇFñGïVW'íñÁFW'ˆ∆FVB¬7&VFñÊp¢ÚÚ∆FVÁB&ˆ◊BñÊ¶V7Fñˆ‚FÇñbFW67&óFñˆ‚ó2WfW"76VBFÚ6∆VFR‡¢ÚÚfóÜVBFV◊∆FR6ˆÁFñÁ2ÊÚW6W"◊7W∆ñVB6ˆÁFVÁB‡¢FW67&óFñˆ„¢%6VÊñ˜"÷ÊvV÷VÁBf&ñÁB“Ê«ó6VBW6ñÊrFÜRWVóf∆VÁBU44Ú&ˆ∆R‚6V∆V7BFÜó2FÚÊ«ó6RFÜR6∂ñ∆«2f˜"FÜó26VÊñ˜&óGí∆WfV¬‚"¿¢ó4«D∆&V√¢G'VR¿¢”∞¢ÚÚˆÊ«í&WVÊBñbFÜRGóVBFóF∆Ró2Ê˜B«&VGíñ‚FÜR∆ó7@¢6ˆÁ7B«&VGï&W6VÁB“&6U&W7V«G2Á6ˆ÷Rá"”‚"ÁFóF∆RÁFÙ∆˜vW$66RÇí””“FñGïVW'íÁFÙ∆˜vW$66RÇíì∞¢ñbÇ«&VGï&W6VÁBí&6U&W7V«G2“∑7ñÁFÜWFñ4VÁG'í¬‚‚Ê&6U&W7V«G5”∞¢–¢6ˆÁ7BFVGWVB“&6U&W7V«G3∞¢6WDˆ672ÜFVGWVBì≤6WE7FWÇ'ñ6∂ñÊr"ì∞¢ÚÚfó&R&6∂w&˜VÊB6V&6ÇW6ñÊr$ıDÇFÜR˜&ñvñÊ¬VW'íÊBFÜR&6RFóF∆P¢ÚÚFÜó2VÁ7W&W2FWWGíÙ76ˆ6ñFRÙ7FñÊrf&ñÁG2g&ˆ“FÜR÷ˆFV¬V"∆ˆÊw6ñFRFÜRÜ&F6ˆFVB&W7V«G0¢ñ6∂W$6Ê6V≈&VbÊ7W'&VÁB“f«6S∞¢6ˆÁ7BFÜó46Ê6V¬“ñ6∂W$6Ê6V≈&Vc∞¢6WEñ6∂W$gV∆ƒ∆ˆFñÊráG'VRì∞¢Ü7ñÊ2Çí”‚∞¢G'í∞¢6ˆÁ7B6VV‚“ÊWr6WBÜFVGWVBÊ÷ÜÚ”‚ÚÁFóF∆RÁFÙ∆˜vW$66RÇííì∞¢6ˆÁ7B÷W&vR“Ü'"í”‚'"Êfñ«FW"ÜÚ”‚≤6ˆÁ7B≤“ÚÁFóF∆RÁFÙ∆˜vW$66RÇì≤ñbá6VV‚ÊÜ2Ü≤íí&WGW&‚f«6S≤6VV‚ÊFBÜ≤ì≤&WGW&‚G'VS≤“ì∞¢ÚÚ6V&6Ç˜&ñvñÊ¬VW'ífó'7B“&WGW&Á2FWWGíÙ76ˆ6ñFRf&ñÁG2FÜR÷ˆFV¬∂Ê˜w0¢6ˆÁ7B∂g&ˆ’VW'í¬g&ˆ‘&6U““vóB&ˆ÷ó6RÊ∆¬Ö∞¢6V&6Ñˆ67WFñˆÁ2áFñGïVW'í¬#RFÚ#"íÊ6F6ÇÇÇí”‚µ“í¿¢6V&6Ñˆ67WFñˆÁ2ÜFVGWVE≥“ÁFóF∆R¬##FÚ#R"íÊ6F6ÇÇÇí”‚µ“í¿¢“ì∞¢ñbáFÜó46Ê6V¬Ê7W'&VÁBí≤6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì≤&WGW&„≤–¢6ˆÁ7BFFóFñˆÊ¬“≤‚‚Ê÷W&vRÜg&ˆ’VW'íí¬‚‚Ê÷W&vRÜg&ˆ‘&6Rï”∞¢ñbÜFFóFñˆÊ¬Ê∆VÊwFÇ‚í6WDˆ672Ö≤‚‚ÊFVGWVB¬‚‚ÊFFóFñˆÊ≈“ì∞¢“6F6ÇÖÚí∑–¢6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì∞¢“íÇì∞¢&WGW&„∞¢–¢ÚÚc„2„¢Vñ6≤6V&6Ç&WGW&Á2&W7V«G2f7B“6Ü˜rñ6∂W"ñ÷÷VFñFV«ê¢ÚÚFWFV7BÜñW&&6Üñ6¬&VfóÇ“6WBÊÙWÜ7D÷F6ÇÊ˜Fñ6P¢6ˆÁ7B&VfóÖ&R“ı‚ÑFWWGó≈fñ6Wƒ76ó7FÁGƒ7FñÊwƒ6Ú◊ƒ76ˆ6ñFWƒ¶ˆñÁBï«2≤ˆì∞¢ñbá&VfóÖ&RÁFW7BáFñGïVW'ííí6WDÊÙWÜ7D÷F6ÇáFñGïVW'íì∞¢6ˆÁ7BVñ6≤“vóB6V&6Ñˆ67WFñˆÁ2áFñGïVW'í¬#R"ì∞¢ñbÇVñ6≤Ê∆VÊwFÇí≤6WDW'"Ç&ÊÚˆ67WFñˆÁ2f˜VÊB"ì≤6WE7FWÇ&W'&˜""ì≤&WGW&„≤–¢ñbáVñ6≤Ê∆VÊwFÇ””“í≤6WDˆ672áVñ6≤ì≤G&6≤Ç&ˆ67WFñˆÂ˜6V∆V7FVB"¬≤WFÛ¢G'VR“ì≤FÙÊ«ó6RáVñ6µ≥“ì≤&WGW&„≤–¢6ˆÁ7BFVGWVEVñ6≤“Vñ6≤Êfñ«FW"ÇÜÚ¬í¬'"í”‚'"ÊfñÊDñÊFWÇáÇ”‚ÇÁFóF∆RÁFÙ∆˜vW$66RÇí””“ÚÁFóF∆RÁFÙ∆˜vW$66RÇíí””“íì∞¢6WDˆ672ÜFVGWVEVñ6≤ì≤6WE7FWÇ'ñ6∂ñÊr"ì∞¢ÚÚ&6∂w&˜VÊC¢∆ˆBgV∆¬&W7V«G2ÉR”#íÊB÷W&vRñÁFÚñ6∂W ¢ñ6∂W$6Ê6V≈&VbÊ7W'&VÁB“f«6S≤ÚÚÊWr6V&6Ç7F'FVB¬∆∆˜rFÜó2&6∂w&˜VÊB∆ˆ@¢6ˆÁ7BFÜó46Ê6V¬“ñ6∂W$6Ê6V≈&Vc∞¢6WEñ6∂W$gV∆ƒ∆ˆFñÊráG'VRì∞¢6ˆÁ7BgV∆ƒ6˜VÁB“FñGïVW'íÁG&ñ“ÇíÁ7∆óBÇı«2≤ÚíÊ∆VÊwFÇ√“Ú#3RFÚC"¢FñGïVW'íÁG&ñ“ÇíÁ7∆óBÇı«2≤ÚíÊ∆VÊwFÇ””“"Ú##RFÚ3R"¢#RFÚ##∞¢ÚÚFˆ∂V‚Ê˜FS¢6ñÊv∆R◊v˜&B6&VGV6VBg&ˆ“#CFÚS"FÚ#3RFÚC"FÚ∂VW ¢ÚÚ6V&6Ñˆ67WFñˆÁ2˜WGWB6ˆ÷f˜'F&«ívóFÜñ‚FÜR&ó6VBCC'VFvWB‡¢6ˆÁ7B÷W&vTgV∆≈&W7V«G2“ÜgV∆¬¬&6Rí”‚∞¢6ˆÁ7B6VV‚“ÊWr6WBÜ&6RÊ÷ÜÚ”‚ÚÁFóF∆RÁFÙ∆˜vW$66RÇííì∞¢&WGW&‚gV∆¬Êfñ«FW"ÜÚ”‚≤6ˆÁ7B≤“ÚÁFóF∆RÁFÙ∆˜vW$66RÇì≤ñbá6VV‚ÊÜ2Ü≤íí&WGW&‚f«6S≤6VV‚ÊFBÜ≤ì≤&WGW&‚G'VS≤“ì∞¢”∞¢ÚÚc„í„¢&WG'íWFÚ2Fñ÷W2vóFÇ&6∂ˆfb&Vf˜&RvófñÊrW“ˆÊ«í6Ü˜rW'&˜"gFW"∆¬GFV◊G2fñ¿¢Ü7ñÊ2Çí”‚∞¢6ˆÁ7BFV∆ó2“≥¬#¬C”≤ÚÚGFV◊Bñ÷÷VFñFR¬GFV◊B"gFW"'2¬GFV◊B2gFW"G0¢f˜"Ü∆WBGFV◊B“≤GFV◊B¬3≤GFV◊B≤≤í∞¢ñbáFÜó46Ê6V¬Ê7W'&VÁBí≤6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì≤&WGW&„≤–¢ñbÜGFV◊B‚ívóBÊWr&ˆ÷ó6Rá"”‚6WEFñ÷V˜WBá"¬FV∆ó5∂GFV◊E“íì∞¢G'í∞¢6ˆÁ7BgV∆¬“vóB6V&6Ñˆ67WFñˆÁ2áFñGïVW'í¬gV∆ƒ6˜VÁBì∞¢ñbáFÜó46Ê6V¬Ê7W'&VÁBí≤6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì≤&WGW&„≤–¢6ˆÁ7BFFóFñˆÊ¬“÷W&vTgV∆≈&W7V«G2ÜgV∆¬¬Vñ6≤ì∞¢ñbÜFFóFñˆÊ¬Ê∆VÊwFÇ‚í≤6WDˆ672Ö≤‚‚ÁVñ6≤¬‚‚ÊFFóFñˆÊ≈“ì≤6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì≤&WGW&„≤–¢ÚÚv˜B&W7V«B'WBÊÚFFóFñˆÊ¬&ˆ∆W2“ñbVñ6≤«&VGíÜ2R≤FÜBó2fñÊR¬7F˜ ¢ñbáVñ6≤Ê∆VÊwFÇ„“2í≤6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì≤&WGW&„≤–¢ÚÚ∆W72FÜ‚2F˜F¬“&WG'ê¢“6F6ÇÖÚí∞¢ÚÚ7v∆∆˜rÊB&WG'ê¢–¢–¢ÚÚ∆¬2GFV◊G2FˆÊR“7Fí6ñ∆VÁB¬Vñ6≤&W7V«G2&R7Fñ∆¬6Ü˜v‡¢6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì∞¢ÚÚˆÊ«í6WBW'&˜"ñbVñ6≤óG6V∆bó2fW'íFÜñ‚É”"&W7V«G2í“Ê˜Bˆ‚Ê˜&÷¬FÜñ‚6V&6ÜW0¢ñbáVñ6≤Ê∆VÊwFÇ¬"í6WEñ6∂W$gV∆ƒW'&˜"áG'VRì∞¢“íÇì∞¢“6F6ÇÜRí≤6WDW'"ÜRÊ÷W76vRì≤6WE7FWÇ&W'&˜""ì≤–¢“¬∑VW'í¬ˆ672¬ñ6∂W$∆ˆFñÊu“ì∞†¢6ˆÁ7BFÙÊ«ó6R“W6T6∆∆&6≤Ü7ñÊ2Üˆ62¬˜G2“∑“í”‚∞¢6ˆÁ7Bf˜&6Táñ'&ñB“˜G2Êf˜&6Táñ'&ñB«¬f«6S∞¢6ˆÁ7B˜7FñÊr“˜G2Á˜7FñÊr«¬ÁV∆√≤ÚÚc2„#¢Ê«ó6RˆÊR∆ófR‘4b˜7FñÊp¢6ˆÁ7B6˜'W2“˜G2Ê6˜'W2«¬ÁV∆√≤ÚÚc2„#¢Ê«ó6RFÜRvw&VvFRˆb∆¬fWF6ÜVB‘4b˜7FñÊw0¢6ˆÁ7Bg&ˆ‘G2“˜7FñÊr«¬Ü6˜'W2Ú≤FóF∆S¢ˆ62ÁFóF∆R“¢ÁV∆¬ì≤ÚÚVóFÜW"˜7FñÊr◊6˜W&6RFÄ¢ÚÚÉ2fóÉ¢ñÊ7&V÷VÁBFÜR6Ê6V¬6˜VÁFW"ÊB6GW&RFÜó2Ê«ó6ó2w2îB‡¢Ê«ó6ó46Ê6V≈&VbÊ7W'&VÁB≥“∞¢6ˆÁ7B6Ê6VƒñB“Ê«ó6ó46Ê6V≈&VbÊ7W'&VÁC∞¢ñbá6fWGïFñ÷W%&VbÊ7W'&VÁBí≤6∆V%Fñ÷V˜WBá6fWGïFñ÷W%&VbÊ7W'&VÁBì≤6fWGïFñ÷W%&VbÊ7W'&VÁB“ÁV∆√≤–†¢ÚÚ∆ˆˆ∑WñÁFW&6WC¢ñbFÜR6V∆V7FVBˆ67WFñˆ‚FóF∆R÷F6ÜW2∂Ê˜v‚∆ˆˆ∑WVÁG'í¿¢ÚÚ˜fW'&ñFRFÜRï44Ú6ˆFRÊBw&˜WvóFÇ6˜'&V7Bf«VW2‡¢ÚÚ7F˜&RFÜR6ÊˆÊñ6¬U44ÚFóF∆R6W&FV«íf˜"FÜR6∂ñ∆«2fWF6Ç“&W6W'fW2Fó7∆íFóF∆R‡¢ÚÚFÜó26F6ÜW26∆VFR÷vVÊW&FVBñ6∂W"&W7V«G2vóFÇw&ˆÊrï44Ú6ˆFW2˜"Êˆ‚‘U44ÚFóF∆W2‡¢6ˆÁ7B∆ˆˆ∑WÜóB“∆ˆˆ∑W6VÊñ˜$÷v◊BÜˆ62ÁFóF∆Rì∞¢∆WBW66ÙfWF6ÖFóF∆R“ˆ62ÁFóF∆S∞¢ñbÜ∆ˆˆ∑WÜóBbb∆ˆˆ∑WÜóBÁ&W7V«G2bb∆ˆˆ∑WÜóBÁ&W7V«G2Ê∆VÊwFÇ‚í∞¢6ˆÁ7B&W7B“∆ˆˆ∑WÜóBÁ&W7V«G5≥”∞¢ˆ62“≤‚‚Êˆ62¬ó66Ù6ˆFS¢&W7BÊó66Ù6ˆFR¬ó66Ùw&˜W¢&W7BÊó66Ùw&˜W¬FW67&óFñˆ„¢&W7BÊFW67&óFñˆ‚¬ó4«D∆&V√¢G'VR”∞¢W66ÙfWF6ÖFóF∆R“&W7BÁFóF∆S≤ÚÚW6R6ÊˆÊñ6¬U44ÚFóF∆Rf˜"6∂ñ∆«2fWF6ÇˆÊ«ê¢–†¢6WD6˜'W5vóBÜ6˜'W2Ú≤6˜VÁC¢6˜'W2Ê¶ˆ'2Ê∆VÊwFÇ“¢ÁV∆¬ì∞¢6WE6V¬Üˆ62ì≤6WE7FWÇ&∆ˆFñÊr"ì≤6WE7V"Ä¢6˜'W2ÚÊ«ó6ñÊrG∂6˜'W2Ê¶ˆ'2Ê∆VÊwFá“∆ófR4r˜7FñÊw2f˜"G∑FıFóF∆T66RÜˆ62ÁFóF∆Ró“2ˆÊR&ˆ∆R‚‚Ê ¢¢˜7FñÊrÚÊ«ó6ñÊrFÜR◊î6&VW'4gWGW&R˜7FñÊrf˜"G∑FıFóF∆T66RÜˆ62ÁFóF∆Ró“G∑˜7FñÊrÊV◊∆˜ñW"ÚBG∑˜7FñÊrÊV◊∆˜ñW'÷¢"'“‚‚Ê ¢¢&W6ˆ«fñÊrG∑FıFóF∆T66RÜˆ62ÁFóF∆Ró“ñ‚U44Úc„"G∂ˆ62Êó66Ù6ˆFRÚ“ï44Ú”É¢G∂ˆ62Êó66Ù6ˆFW“ÇG∂ˆ62Êó66Ùw&˜W«¬$ˆ67WFñˆÊ¬w&˜W'“ñ¢"'“‚‚Êì≤6WE7V%7FWÉì≤6WE&W7V«BÜÁV∆¬ì≤6WDW'"Ç""ì≤6WE6Vv÷VÁEÊVƒ˜V‚áG'VRì≤6WDfó'7D&∆ñÊµ6∂ñ∆¬Ç""ì≤6WDW66Ù6ˆÜW&VÊ6U7FGW2ÜÁV∆¬ì≤6WD∆ˆFñÊu6∂ñ∆«2Öµ“ì≤6WD&tW'&˜"Ç""ì∞¢6WE6Ü˜tWáV7BÜf«6Rì∞¢6ˆÁ7BF˜F¬“W'6ˆÊÚB¢3∞¢6ˆÁ7B˜7&2“6˜'W2Ú&6˜'W2"¢˜7FñÊrÚ'˜7FñÊr"¢&W66Ú#∞¢6WD∆ˆt7GÇÜˆ62ÁFóF∆R¬˜7&2ì∞¢∆WB˜C≤G'í≤˜C“W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜C“≤–¢∆ˆu7FWÇ&Ê«ó6ó2"¬'7F'B"¬¬G∂ˆ62ÁFóF∆W“ÇGµ˜7&7“ñì∞†¢ÚÚ6fWGíFñ÷V˜WC¢ñbFÜRgV∆¬Ê«ó6ó2Ü2Ê˜B6ˆ◊∆WFVBñ‚#2¬7W&f6R‚W'&˜ ¢ÚÚ&FÜW"FÜ‚∆VfñÊrFÜRW6W"ˆ‚‚ñÊfñÊóFR7ñÊÊW ¢∆WBÊ«ó6ó46ˆ◊∆WFR“f«6S∞¢6fWGïFñ÷W%&VbÊ7W'&VÁB“6WEFñ÷V˜WBÇÇí”‚∞¢ñbÇÊ«ó6ó46ˆ◊∆WFRbbÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB””“6Ê6VƒñBí∞¢∆ˆu7FWÇ&Ê«ó6ó2"¬'Fñ÷V˜WB"¬#¬ˆ62ÁFóF∆Rì∞¢6WDW'"Ç%FÜó2ˆÊRó2F∂ñÊr∆ˆÊvW"FÜ‚WáV7FVB‚∆V6RG'ívñ‚“óBW7V∆«í&W6ˆ«fW2ˆ‚FÜR6V6ˆÊBGFV◊B‚"ì∞¢6WE7FWÇ&W'&˜""ì∞¢–¢“¬#ì∞†¢G'í∞¢ÚÚf˜&6Táñ'&ñC¢6∂óU44ÚfWF6ÇÊBW6R6∆VFRvWE6∂ñ∆«2ÇíFó&V7F«ê¢ÚÚW6VBvÜV‚6ˆÜW&VÊ6R6ÜV6≤6ˆÊfó&◊2U44Ú&WGW&ÊVBw&ˆÊrˆ67WFñˆ‚6∂ñ∆«2‡¢ÚÚ6˜'W3¢6∂óU44Û≤FW&ófR‚vw&VvFR6∂ñ∆¬∆ó7Bg&ˆ“∆¬FÜR∆ófRG2‡¢ÚÚ˜7FñÊrá6ñÊv∆RBì¢¥TUFÜR&ˆ∆R“&W6ˆ«fRóBFÚFÜR5D‰D$BU44ÚW76VÁFñ¿¢ÚÚ6∂ñ∆«2á6Ú6∂ñ∆¬Ê«ó6ó2Ú&ˆw&W76ñˆ‚Ú7&˜76˜fW"Ú6FVv˜&ñW2Ú6ˆÁFWáB&P¢ÚÚFÜR6ÊˆÊñ6¬fñWrì≤FÜRBw2˜v‚6ˆÁFVÁBG&ófW2FÜR&ˆ∆R‘÷óÇb&W7ˆÁ6ñ&ñ∆óFñW0¢ÚÚF'2ñÁ7FVB‡¢∆WB˜DW66Û≤G'í≤˜DW66Ú“W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜DW66Ú“≤–¢∆WBW66ı&W7V«B¬6∂ñ∆«3∞¢ÚÚs"Ö54Ù2÷fó'7B¬7V2ÊÚ„3R6ˆÁFWáBì¢&W6ˆ«fRFÜRˆ67WFñˆ‚ñ‚54Ù2##Bdï%5@¢ÚÚÜFWFW&÷ñÊó7Fñ24r6∆76ñfñW"í¬7&˜77v∆≤54Ù2”‰ï44Ú¬ÊBÊ6Ü˜"FÜRU44Ú6∂ñ∆¿¢ÚÚfWF6Çˆ‚FÜR6∆V‚ï44Úˆ67WFñˆ‚‰‘R“FÜR&∆ñÊBFóF∆RF˜÷ÜóB÷ó2÷÷24p¢ÚÚ&ˆ∆W2Ü∆ófS¢6∆W276ó7FÁB÷ÊvW"”‚6ˆ÷◊VÊñ6Fñˆ‚66ñVÁFó7Bí‚ˆÊ«íÜñvÇˆ÷VFóV–¢ÚÚ6ˆÊfñFVÊ6R6∆76ñfñ6FñˆÁ27FVW#≤ÁóFÜñÊrV«6Rf∆«2Fá&˜VvÇFÚFÜRWÜó7FñÊp¢ÚÚFóF∆R÷÷F6ÇFÇ'óFR÷ñFVÁFñ6∆«í‚FÜR&W6ˆ«WFñˆ‚&˜WFRó27F˜&VBˆ‚FÜR&W7V«@¢ÚÚá76ˆ5&W6ˆ«WFñˆ‚í6ÚFÜRTí6‚6íÑırFÜR6∂ñ∆«2vW&RÊ6Ü˜&VB‡¢∆WB76ˆ4fó'7B“ÁV∆√∞¢ñbÇf˜&6Táñ'&ñBbb6˜'W2í∞¢G'í∞¢6ˆÁ7B6«2“vóBfWF6Ö76ˆ4ˆ67WFñˆ‚ÜW66ÙfWF6ÖFóF∆Rì∞¢ñbÜ6«2bb6«2Á7FGW2””“&6∆76ñfñVB"bb6«2ÊÊˆFRbbÜ6«2Ê6ˆÊfñFVÊ6R””“&ÜñvÇ"«¬6«2Ê6ˆÊfñFVÊ6R””“&÷VFóV“"íí∞¢6ˆÁ7B÷“54Ù3##EÙï44ı∂6«2ÊÊˆFRÊ6ˆFU“«¬µ”∞¢6ˆÁ7Bñ6≤“÷ÊfñÊBÇÜ“í”‚“Á'Fñ¬í«¬÷≥“«¬ÁV∆√∞¢ñbáñ6≤bbñ6≤ÁFóF∆Rí76ˆ4fó'7B“≤6ˆFS¢6«2ÊÊˆFRÊ6ˆFR¬FóF∆S¢6«2ÊÊˆFRÁFóF∆R¬ó66ıFóF∆S¢ñ6≤ÁFóF∆R¬ó66Ù6ˆFS¢ñ6≤Êó66Ú«¬""¬6ˆÊfñFVÊ6S¢6«2Ê6ˆÊfñFVÊ6R”∞¢–¢“6F6ÇÖÚí≤76ˆ4fó'7B“ÁV∆√≤–¢–¢G'í∞¢ÚÚfVVBFÜR∆ófR˜7FñÊrw2&V¬6∂ñ∆«26ÚFÜRU44Úˆ67WFñˆ‚ó2ñ6∂VB'ê¢ÚÚ˜fW&∆¬Ê˜B&∆ñÊBF˜÷ÜóBá7F˜2vVÊW&ñ2FóF∆W2ñÊÜW&óFñÊrî5B6∂ñ∆«2í‡¢6ˆÁ7BˆW66ıá&6W2“á˜7FñÊrbb˜7FñÊrÁ6∂ñ∆«2í«¬Ü6˜'W2bb6˜'W2Á6∂ñ∆«2í«¬µ”∞¢ÚÚs&Ü∆ófR&Vw&W76ñˆ‚¬FF66ñVÁFó7B”‚fñÊÊ6R6∂ñ∆«2ì¢Ê6Ü˜"ˆ‚FÜR54Ù0¢ÚÚ6ÊˆÊñ6¬ˆ67WFñˆ‚DïDƒRá&V6ó6S¢$FF66ñVÁFó7B"í¬‰ıBFÜRï44Úw&˜W ¢ÚÚ∆&V¬Ç$÷FÜV÷Fñ6ñÁ2¬7GV&ñW2ÊB7FFó7Fñ6ñÁ2"í“B÷FñvóBw&˜W∆&V«0¢ÚÚgWßßí÷÷F6ÇU44ÚFÚ6ñ&∆ñÊrˆ67WFñˆÁ2‚ï44Ú∆&V¬7Fó226V6ˆÊBG'í‡¢W66ı&W7V«B“Üf˜&6Táñ'&ñB«¬6˜'W2íÚÁV∆¬¢vóBvWDW66ı6∂ñ∆«2á76ˆ4fó'7BÚ76ˆ4fó'7BÁFóF∆R¢W66ÙfWF6ÖFóF∆R¬ˆW66ıá&6W2ì∞¢ñbá76ˆ4fó'7BbbW66ı&W7V«Bbbf˜&6Táñ'&ñBbb6˜'W2í∞¢W66ı&W7V«B“vóBvWDW66ı6∂ñ∆«2á76ˆ4fó'7BÊó66ıFóF∆R¬ˆW66ıá&6W2ì∞¢–¢ÚÚ6ˆÜW&VÊ6RwV&C¢ñbFÜR&W6ˆ«fVBU44Úˆ67WFñˆ‚∆&V¬6Ü&W2ÊÚ÷VÊñÊvgV¿¢ÚÚFˆ∂V‚vóFÇFÜR54Ù2FóF∆Rı"FÜRVW'í¬FÜRÊ6Ü˜"÷ó2÷fó&VB“f∆¬&6≤‡¢ñbá76ˆ4fó'7BbbW66ı&W7V«BbbW66ı&W7V«BÊW66Ùˆ67WFñˆ‚bbW66ı&W7V«BÊW66Ùˆ67WFñˆ‚Á&VfW'&VD∆&V¬í∞¢6ˆÁ7B˜Fˆ≤“áÇí”‚7G&ñÊráÇ«¬""íÁFÙ∆˜vW$66RÇíÁ7∆óBÇıµÊ◊£”ï“≤ÚíÊfñ«FW"Çárí”‚rÊ∆VÊwFÇ„“Bì∞¢6ˆÁ7Bv˜B“ÊWr6WBÖ˜Fˆ≤ÜW66ı&W7V«BÊW66Ùˆ67WFñˆ‚Á&VfW'&VD∆&V¬íì∞¢6ˆÁ7BvÁB“˜Fˆ≤á76ˆ4fó'7BÁFóF∆RíÊ6ˆÊ6BÖ˜Fˆ≤ÜW66ÙfWF6ÖFóF∆Ríì∞¢ñbÇvÁBÁ6ˆ÷RÇárí”‚v˜BÊÜ2árííí≤76ˆ4fó'7B“≤‚‚Á76ˆ4fó'7B¬÷ó76VC¢G'VR”≤W66ı&W7V«B“ÁV∆√≤–¢–¢ÚÚ54Ù2÷Ê6Ü˜&VBfWF6Ç÷ó76VBñ‚U44Ú”‚&WG'íFÜR˜&ñvñÊ¬FóF∆RFÇ&Vf˜&RÁê¢ÚÚƒƒ“f∆∆&6≤¬6Ú54Ù26‚ˆÊ«íWfW"ñ◊&˜fR&W6ˆ«WFñˆ‚¬ÊWfW"∆˜6RóB‡¢ñbá76ˆ4fó'7BbbW66ı&W7V«Bbbf˜&6Táñ'&ñBbb6˜'W2í∞¢76ˆ4fó'7B“≤‚‚Á76ˆ4fó'7B¬÷ó76VC¢G'VR”∞¢W66ı&W7V«B“vóBvWDW66ı6∂ñ∆«2ÜW66ÙfWF6ÖFóF∆R¬ˆW66ıá&6W2ì∞¢–¢6∂ñ∆«2“W66ı&W7V«BÚW66ı&W7V«BÁ6∂ñ∆«2¢ÁV∆√∞¢ñbá6∂ñ∆«2””“ÁV∆¬bb6˜'W2í6∂ñ∆«2“vóBvWE6∂ñ∆«4g&ˆ’˜7FñÊrÜˆ62ÁFóF∆R¬6˜'W2Á6∂ñ∆«2¬6˜'W2ÁFWáBì∞¢ñbá6∂ñ∆«2””“ÁV∆¬í6∂ñ∆«2“vóBvWE6∂ñ∆«2Üˆ62ÁFóF∆R¬ˆ62Êó66Ùw&˜W«¬""¬ˆ62Êó66Ù6ˆFR«¬""ì∞¢∆ˆu7FWÇ&W66ı˜6∂ñ∆«2"¬&ˆ≤"¬ˆ◊56ñÊ6RÖ˜DW66Úí¬G≤á6∂ñ∆«2«¬µ“íÊ∆VÊwFá“6∂ñ∆«2G∂W66ı&W7V«BÚU44ÚÚG∑76ˆ4fó'7Bbb76ˆ4fó'7BÊ÷ó76VBÚ'76ˆ3¢"≤76ˆ4fó'7BÊ6ˆFR¢W66ı&W7V«BÊFó6÷&ñwVFVD'í«¬'F˜ˆÜóB'÷¢6˜'W2Ú&6˜'W2"¢$í'÷ì∞¢“6F6ÇÜRí≤∆ˆu7FWÇ&W66ı˜6∂ñ∆«2"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜DW66Úí¬RbbRÊ÷W76vRì≤Fá&˜rS≤–¢∆WBW66Ùˆ67WFñˆÂW&í“W66ı&W7V«BÚW66ı&W7V«BÊˆ67WFñˆÂW&í¢rs∞¢∆WBW66Ùˆ67WFñˆ‚“W66ı&W7V«BÚW66ı&W7V«BÊW66Ùˆ67WFñˆ‚¢ÁV∆√∞¢6ˆÁ7B76ˆ5&W6ˆ«WFñˆ‚“á76ˆ4fó'7Bbb76ˆ4fó'7BÊ÷ó76VBbbW66ı&W7V«BíÚ76ˆ4fó'7B¢ÁV∆√≤ÚÚs#¢Ü˜rFÜR6∂ñ∆«2vW&RÊ6Ü˜&V@¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6ˆÁ7BW66ı6˜W&6R“W66ı&W7V«BÚU44Úc„&¢6˜'W2Úg&ˆ“G∂6˜'W2Ê¶ˆ'2Ê∆VÊwFá“∆ófR4r˜7FñÊw6¢í÷vVÊW&FVF∞¢6WE7V"ÜG∑6∂ñ∆«2Ê∆VÊwFá“W76VÁFñ¬6∂ñ∆«2f˜VÊBÇG∂W66ı6˜W&6W“í“7&˜77v∆∂ñÊrV6ÇFÚFÜRîÙRWá˜7W&RñÊFWÇ‚‚Êì≤6WE7V%7FWÉ"ì∞¢6WD∆ˆFñÊu6∂ñ∆«2Ñ'&íÊó4'&íá6∂ñ∆«2íÚ6∂ñ∆«2¢µ“ì≤ÚÚ7W&f6RFÜR&W6ˆ«fVB∆ó7B˜VÊ«íGW&ñÊrFÜRvó@†¢ÚÚfó&R&FU6∂ñ∆«2ÊB&ˆw&W76ñˆ‚ˆ7&˜76˜fW"ˆ6ˆÁFWáBñ‚&∆∆V¬gFW"vWE6∂ñ∆«0¢ÚÚ&ˆw&W76ñˆ‚ˆ7&˜76˜fW"ˆ6ˆÁFWáBˆÊ«íÊVVBFÜRFóF∆RÊBw&˜W“ÊÚFWVÊFVÊ7íˆ‚&FñÊw0¢6WE7V"ÜG∑6∂ñ∆«2Ê∆VÊwFá“6∂ñ∆«26ˆÊfó&÷VB“Ê«ó6ñÊrWFˆ÷Fñˆ‚Wá˜7W&RÊB÷ñÊr6&VW"Fá2‚‚Êì≤6WE7V%7FWÉ"ì∞¢∆WB˜D6˜&S≤G'í≤˜D6˜&R“W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜D6˜&R“≤–¢ÚÚ4ƒR‘¢ˆ67WFñˆ‚÷∆WfV¬îÙRWá˜7W&RÜFWFW&÷ñÊó7Fñ2¬VÊvñÊR÷6˜&RÊß2¬g&˜¶V‚˜&VB÷ˆÊ«íí¿¢ÚÚfVBñÁFÚ6∆76ñgï6∂ñ∆ƒ∆WfV¬ÇíñÁ6ñFR&FU6∂ñ∆«2Çí2FÜRÜˆÊW7BÁV÷W&ñ2Ê6Ü˜"f˜"V6Ä¢ÚÚ6∂ñ∆¬w2∆WfV¬‚ó66Ù6ˆFRó2«&VGí&W6ˆ«fVB&˜fS≤vóFÜÜV∆BÜÁV∆¬ívÜV‚VÊfñ∆&∆R˜ ¢ÚÚvÜV‚ÊÚ4Ù2VÊFW"FÜBï44Ú6'&ñW2‚îÙR66˜&R“ÊWfW"f∂VB‡¢∆WBˆ64Wá˜7W&R“ÁV∆√∞¢G'í∞¢ÚÚsFfˆ∆∆˜r◊Fá&˜VvÇÜf˜VÊB∆ófRì¢˜7FñÊr◊FÇÊ«ó6W26''í‰Úˆ62Êó66Ù6ˆFR¬6¢ÚÚˆ64Wá˜7W&Rv2«vó2ÁV∆¬FÜW&R“vÜñ6Çá˜7B’sF"í7F'fVB4ƒR‘2ˆbóG2Ê6Ü˜ ¢ÚÚÊBvóFÜÜV∆BWfW'íGWGí&ÊB‚FÜRs"54Ù2&W6ˆ«WFñˆ‚«&VGíÜˆ∆G2FÜR7&˜77v∆∂V@¢ÚÚï44Ú6ˆFS≤W6RóB2FÜR6V6ˆÊBÊ6Ü˜"‚6÷RVÊvñÊR¬6÷RvóFÜÜˆ∆B'V∆W2‡¢6ˆÁ7BˆWáó66Ú“ˆ62Êó66Ù6ˆFR«¬áGóVˆb76ˆ4fó'7B”“'VÊFVfñÊVB"bb76ˆ4fó'7Bbb76ˆ4fó'7BÊ÷ó76VBbb76ˆ4fó'7BÊó66Ù6ˆFRí«¬"#∞¢ñbÖˆWáó66Úí∞¢6ˆÁ7BWá“Wá˜7W&Tf˜$ó66ÚÖˆWáó66Úì∞¢ñbÜWáí∞¢ˆ64Wá˜7W&R“∞¢ñÊFWÉ¢WáÊñÊFWÇ¿¢&ÊC¢WáÊ&ÊB¿¢•&ÊvS¢WáÁ•&ÊvR¿¢ÚÚ÷ó'&˜'26ˆ◊WFTVÊvñÊRw276ˆ2◊FÇ6ˆÊfñFVÊ6R'V∆RÜVÊvñÊR÷6˜&RÊß2ì¢6ñÊv∆P¢ÚÚgV∆«í◊66˜&VBï44Úw&˜W&VG2vÜñvÇr¬V«6Rv÷VFóV“r‚ÊWfW"ñÁfVÁFVB‡¢6ˆÊfñFVÊ6S¢ÜWáÁ6ˆ75vóFÖ66˜&R””“WáÁ6ˆ72Ê∆VÊwFÇíÚ&ÜñvÇ"¢&÷VFóV“"¿¢”∞¢–¢–¢“6F6ÇÖÚí≤ˆ64Wá˜7W&R“ÁV∆√≤–¢∆WB&FñÊw2¬&ˆw&W76ñˆ‰FF¬7&˜76˜fW$FF¬6ˆÁFWáDFF∞¢G'í∞¢ÚÚˆÊ«í&FU6∂ñ∆«2ó2U54TÂDî¬Ö6∂ñ∆¬Ê«ó6ó2ó2FÜR&W7V«BvRw26˜&Rí‡¢ÚÚ&ˆw&W76ñˆ‚ˆ7&˜76˜fW"ˆ6ˆÁFWáB&R7W∆V÷VÁF'íF'2“6ñÊv∆Rf∆∑ê¢ÚÚÊ'&Fñˆ‚&W7ˆÁ6RÜRÊr‚G'VÊ6FVB•4Ù„¢$6˜V∆BÊ˜B'6R•4Ù‚f˜ ¢ÚÚ7&˜76˜fW""¬6VV‚∆ófR∂ñ∆∆ñÊrFÜRtÑÙƒRÊ«ó6ó2í◊W7BFVw&FRFÜ@¢ÚÚˆÊRF"FÚóG2V◊Gí7FFR¬ÊWfW"fñ¬FÜRVÁFó&R'V‚‚6ˆÁ7V÷W'0¢ÚÚ«&VGíÁV∆¬÷wV&BÜ7&˜76˜fW$FF«¬µ“¬&W7V«BÁ&ˆw&W76ñˆ‰FFí‡¢∑&FñÊw2¬&ˆw&W76ñˆ‰FF¬7&˜76˜fW$FF¬6ˆÁFWáDFF““vóB&ˆ÷ó6RÊ∆¬Ö∞¢&FU6∂ñ∆«2Üˆ62ÁFóF∆R¬6∂ñ∆«2¬ˆ64Wá˜7W&Rí¿¢vWE&ˆw&W76ñˆÂFá2Üˆ62ÁFóF∆R¬ˆ62Êó66Ùw&˜WíÊ6F6ÇÇÜRí”‚≤∆ˆu7FWÇ'&ˆw&W76ñˆ‚"¬&FVw&FVB"¬¬RbbRÊ÷W76vRì≤&WGW&‚ÁV∆√≤“í¿¢vWD7&˜76˜fW%&ˆ∆W2Üˆ62ÁFóF∆R¬6∂ñ∆«2íÊ6F6ÇÇÜRí”‚≤∆ˆu7FWÇ&7&˜76˜fW""¬&FVw&FVB"¬¬RbbRÊ÷W76vRì≤&WGW&‚ÁV∆√≤“í¿¢vWE&ˆ∆T6ˆÁFWáBÜˆ62ÁFóF∆R¬6∂ñ∆«2¬ˆ62Êó66Ùw&˜WíÊ6F6ÇÇÜRí”‚≤∆ˆu7FWÇ&6ˆÁFWáB"¬&FVw&FVB"¬¬RbbRÊ÷W76vRì≤&WGW&‚ÁV∆√≤“í¿¢“ì∞¢∆ˆu7FWÇ&6˜&Uˆ∆∆“"¬&ˆ≤"¬ˆ◊56ñÊ6RÖ˜D6˜&Rí¬G≤á&FñÊw2«¬µ“íÊ∆VÊwFá“&FVFì∞¢“6F6ÇÜRí≤∆ˆu7FWÇ&6˜&Uˆ∆∆“"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜D6˜&Rí¬RbbRÊ÷W76vRì≤Fá&˜rS≤–†¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6ˆÁ7B÷W&vVB“6∂ñ∆«2Ê÷á2”‚∞¢6ˆÁ7B"“&FñÊw2ÊfñÊBáÇ”‚ÇÊ‚””“2Ê‚í«¬∑”∞¢ÚÚ4ƒR‘¢"Ê∆WfV¬ó2FÜRVÊvñÊR÷FV6ñFVB∆WfV¬Ü6∆76ñgï6∂ñ∆ƒ∆WfV¬í¬÷í&RÁV∆¿¢ÚÚávóFÜÜV∆Bí“ÊWfW"6ñ∆VÁF«í6ˆW&6VBFÚf'&ñ6FVB$ÖT‘‚"FVfV«B‡¢&WGW&‚≤„ß2Ê‚¬6∂ñ∆√ß2Á6∂ñ∆¬¬GóSß2ÁGóR¬∆WfV√ß"Ê∆WfV¬ÛÚÁV∆¬¬∆WfVƒ6ˆÊfñFVÊ6Sß"Ê6ˆÊfñFVÊ6W«¬'vóFÜÜV∆B"¬∆WfVƒ&6ó3ß"Ê&6ó7«¬'vóFÜÜV∆B"¬Fˆˆ√ß"ÁFˆˆ««¬$‰"¬Ü˜sß"ÊÜ˜w«¬""¬∂ñ6∑7F'Cß"Ê∂ñ6∑7F'G«¬""¬&ˆ◊C¢""¬&ˆ◊EFV6É¢""¬ÊWáEÜ6S¢""¬&ˆ◊D∆ˆFñÊsß"Ê∆WfV¬bb"Ê∆WfV¬”“$ÖT‘‚"¬&ˆ◊Dfñ∆VC¶f«6R¬6∂ñ∆≈GóSß2ÊW66ıW&íÚ2ÁGóR¢á"Á6∂ñ∆≈GóW«¬'FV6ÜÊñ6¬"í¬&Wß"Á&W«¬""¬Gvı7FWß"ÁGvı7FW«∆f«6R¬&VFñÊW73ß"Á&VFñÊW77«¬'&VGí"¬W66ıW&ìß2ÊW66ıW&ó«¬""¬W66ÙFW67&óFñˆ„ß2ÊW66ÙFW67&óFñˆÁ«¬""¬&WW6T∆WfV√ß2Á&WW6T∆WfV««¬""¬Ê'&˜vW%6∂ñ∆«3ß2ÊÊ'&˜vW%6∂ñ∆«7«≈µ“¬'&ˆFW$6ˆÊ6WCß2Ê'&ˆFW$6ˆÊ6WG«¬""¬«D∆&V«3ß2Ê«D∆&V«7«≈µ“¬&V∆WfÊ6U66˜&S£”∞¢“ì∞¢ÚÚ‘Ù„¢6∂ñ∆«5˜&W6ˆ«fVBG&6R“7W&f6W2FÜR&W6ˆ«fVB6∂ñ∆¬∆ó7B6ó¶RÊBÁê¢ÚÚGW∆ñ6FR6∂ñ∆«2Ü∂WñVB'íW66ıW&í¬V«6R6∂ñ∆¬Ê÷R¬∆˜vW&66VBíf˜"∆FW ¢ÚÚ&WfñWrˆbFÜRF˜V&∆R◊6∂ñ∆¬vF6Ç‚FÜR∂Wí÷óÜW2U$í◊76RÊBÊ÷R◊76R¬6¢ÚÚFÜRGW6˜VÁBó2ÜWW&ó7Fñ2vF6Ç6ñvÊ¬¬Ê˜B‚WÜ7BGW∆ñ6FR6˜VÁB‡¢ÚÚ∆ˆr÷ˆÊ«ì¢ÊÚFR÷GW¬&VÜfñ˜W"VÊ6ÜÊvVB‡¢ÚÚ6GW&VBvÜV‚FV'Vr∆ˆvvñÊró2ˆ‚ÉˆF÷””ÚˆFV'Vs◊ÊV¬ÚˆFV'Vs÷∆ˆw2í‡¢ÇÇí”‚∞¢6ˆÁ7B6VV‚“ÊWr6WBÇì≤∆WBGW“≤6ˆÁ7BGWÊ÷W2“µ”∞¢÷W&vVBÊf˜$V6Çá2”‚∞¢6ˆÁ7B≤“7G&ñÊrÇá2ÊW66ıW&í«¬2Á6∂ñ∆¬í«¬""íÁG&ñ“ÇíÁFÙ∆˜vW$66RÇì∞¢ñbÇ≤í&WGW&„∞¢ñbá6VV‚ÊÜ2Ü≤íí≤GW≤≥≤ñbÜGWÊ÷W2Ê∆VÊwFÇ¬ÇíGWÊ÷W2ÁW6Çá2Á6∂ñ∆¬ì≤–¢V«6R6VV‚ÊFBÜ≤ì∞¢“ì∞¢∆ˆu7FWÇ'6∂ñ∆«5˜&W6ˆ«fVB"¬GWÚ'v&‚"¢&ˆ≤"¬ÁV∆¬¿¢G∂÷W&vVBÊ∆VÊwFá“6∂ñ∆«2¬G∂÷W&vVBÊ∆VÊwFÇ“GW“VÊóVRG∂GWÚ¬G∂GW“GW¢G∂GWÊ÷W2Ê¶ˆñ‚Ç"¬"ó÷¢"'÷ì∞¢“íÇì∞¢ÚÚ7FvR2VÁ&ñ6ÜVB7ñÊÊW"“WFˆ÷Fñˆ‚'&V∂F˜v‚≤&ˆ∆Rv∆ñ◊6W0¢6ˆÁ7B«fƒ6˜VÁG2“≤ÑîtÉ£¬‘TDïT”£¬ƒıs£¬ÖT‘„£”∞¢÷W&vVBÊf˜$V6Çá2”‚≤ñbÜ«fƒ6˜VÁG5∑2Ê∆WfV≈“”“VÊFVfñÊVBí«fƒ6˜VÁG5∑2Ê∆WfV≈“≤≥≤“ì∞¢6ˆÁ7B«f≈'G2“∞¢«fƒ6˜VÁG2‰ÑîtÇ‚ÚG∂«fƒ6˜VÁG2‰Ñîtá“gV∆¬WFˆ÷FñˆÊ¢ÁV∆¬¿¢«fƒ6˜VÁG2‰‘TDïT“‚ÚG∂«fƒ6˜VÁG2‰‘TDïT◊“í‘Vv÷VÁFVF¢ÁV∆¬¿¢«fƒ6˜VÁG2‰ƒır‚ÚG∂«fƒ6˜VÁG2‰ƒıw“í‘76ó7FVF¢ÁV∆¬¿¢«fƒ6˜VÁG2‰ÖT‘‚‚ÚG∂«fƒ6˜VÁG2‰ÖT‘Á“áV÷‚‘∆VF¢ÁV∆¬¿¢“Êfñ«FW"Ñ&ˆˆ∆V‚íÊ¶ˆñ‚Ç"“"ì∞¢6ˆÁ7BF˜&ˆr“á&ˆw&W76ñˆ‰FF«¬µ“íÁ6∆ñ6RÉ¬2íÊ÷á”‚Á&ˆ∆RíÊfñ«FW"Ñ&ˆˆ∆V‚íÊ¶ˆñ‚Ç"¬"ì∞¢6ˆÁ7BF˜7&˜72“Ü7&˜76˜fW$FF«¬µ“íÁ6∆ñ6RÉ¬2íÊ÷Ü2”‚2Á&ˆ∆RíÊfñ«FW"Ñ&ˆˆ∆V‚íÊ¶ˆñ‚Ç"¬"ì∞¢6ˆÁ7B&ˆt∆ñÊR“F˜&ˆrÚ“6&VW"Fá3¢G∑F˜&ˆw÷¢"#∞¢6ˆÁ7B7&˜74∆ñÊR“F˜7&˜72Ú“7&˜76˜fW#¢G∑F˜7&˜77÷¢"#∞¢6WE7V"ÜG∂«f≈'G7“G∑&ˆt∆ñÊW“G∂7&˜74∆ñÊW÷ì≤6WE7V%7FWáW'6ˆÊÚ2¢2ì∞¢∆WBf˜VÊFFñˆ‰FF“ÁV∆√∞¢ñbáW'6ˆÊí∞¢6WE7V"Ç$'Vñ∆FñÊrñ˜W"W'6ˆÊ∆ó6VBf˜VÊFFñˆ‚6∂ñ∆«2∆‚‚‚‚"ì≤6WE7V%7FWÉ2ì∞¢∆WB˜Dc≤G'í≤˜Db“W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜Db“≤–¢G'í≤f˜VÊFFñˆ‰FF“vóBvWDf˜VÊFFñˆÂ6∂ñ∆«2Üˆ62ÁFóF∆R¬÷W&vVB¬W'6ˆÊì≤∆ˆu7FWÇ&f˜VÊFFñˆ‚"¬&ˆ≤"¬ˆ◊56ñÊ6RÖ˜Dbí¬W'6ˆÊì≤–¢6F6ÇÜRí≤∆ˆu7FWÇ&f˜VÊFFñˆ‚"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜Dbí¬RbbRÊ÷W76vRì≤Fá&˜rS≤–¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢–¢6ˆÁ7Bó66Ù÷¶˜$g&ˆ‘6ˆFR“ÇÇí”‚∞¢6ˆÁ7B““7G&ñÊrÜˆ62Êó66Ù6ˆFR«¬""íÊ÷F6ÇÇı‚Ö≥”ï“íÚì∞¢&WGW&‚“ÚÁV÷&W"Ü’≥“í¢ÁV∆√∞¢“íÇì∞¢6ˆÁ7Bó66Ù÷¶˜"“ÜW66Ùˆ67WFñˆ‚bbÁV÷&W"Êó4ñÁFVvW"ÜW66Ùˆ67WFñˆ‚Êó66Ù÷¶˜"ííÚW66Ùˆ67WFñˆ‚Êó66Ù÷¶˜"¢ó66Ù÷¶˜$g&ˆ‘6ˆFS∞¢6ˆÁ7BÊWu&W7V«B“≤ó66Ùw&˜W¶ˆ62Êó66Ùw&˜W«¬""¬FW67&óFñˆ„¶ˆ62ÊFW67&óFñˆÁ«¬""¬6∂ñ∆«3¶÷W&vVB¬f˜VÊFFñˆ‰FF¬&ˆw&W76ñˆ‰FF¬7&˜76˜fW$FF¬6ˆÁFWáDFF¬W66Ùˆ67WFñˆÂW&í¬W66Ùˆ67WFñˆ‚¬ó66Ù÷¶˜"¬W66Ù6ÊˆÊñ6≈FóF∆S¢W66ÙfWF6ÖFóF∆R”“ˆ62ÁFóF∆RÚW66ÙfWF6ÖFóF∆R¢ÁV∆¬¿¢6˜W&6S¢6˜'W2Ú&6˜'W2"¢˜7FñÊrÚ'˜7FñÊr"¢&W66Ú"¿¢˜7FñÊt÷WF¢˜7FñÊrÚ≤WVñCß˜7FñÊrÁWVñB¬V◊∆˜ñW#ß˜7FñÊrÊV◊∆˜ñW"¬÷6eW&√ß˜7FñÊrÊ÷6eW&¬¿¢ÚÚ$Û¢vÜÚı5DTBg2vÜÚó2Ñï$î‰r“FÜR7G&ˆÊvW7B˜WG6˜W&6VB◊˜7FñÊr6ñvÊ¿¢˜7FVD6ˆ◊ÁîÊ÷S¢˜7FñÊrÁ˜7FVD6ˆ◊ÁîÊ÷R«¬""¬Üó&ñÊt6ˆ◊ÁîÊ÷S¢˜7FñÊrÊÜó&ñÊt6ˆ◊ÁîÊ÷R«¬""¿¢ÚÚ54rác2„„ìBì¢&W6W'fRFÜR˜7FñÊrw26˜W&6R6ÚFÜR6ÜóÊ÷W2FÜR&ñváB∆Ff˜&–¢˜7FñÊu6˜W&6S¢˜7FñÊrÁ6˜W&6R«¬$◊î6&VW'4gWGW&R"“¢ÁV∆¬¿¢6˜'W4÷WF¢6˜'W2Ú≤¶ˆ$6˜VÁC¢6˜'W2Ê¶ˆ'2Ê∆VÊwFÇ¬¶ˆ%FóF∆W3¢Ü6˜'W2ÁFóF∆W2«¬µ“íÁ6∆ñ6RÉ¬Çí“¢ÁV∆¬¿¢76ˆ5&W6ˆ«WFñˆ‚”∞¢6ˆÁ7B6ˆ◊&ó6ˆ‰∂Wí“˜7FñÊrÚG∑FıFóF∆T66RÜˆ62ÁFóF∆Ró“(	BG∑˜7FñÊrÊV◊∆˜ñW"«¬$‘4b'÷¢6˜'W2ÚG∑FıFóF∆T66RÜˆ62ÁFóF∆Ró“(	B7&˜724rG6¢FıFóF∆T66RÜˆ62ÁFóF∆Rì∞¢6WE&W7V«BÜÊWu&W7V«Bì∞¢G&6≤Ç&Ê«ó6ó5ˆ6ˆ◊∆WFVB"¬≤ˆ67WFñˆ„¢ˆ62ÁFóF∆R¬6˜W&6S¢ÊWu&W7V«BÁ6˜W&6R“ì∞¢ñbÜ6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁBÊ∆VÊwFÇ‚í∞¢FEFÙ6ˆ◊&ó6ˆ‚Ü6ˆ◊&ó6ˆ‰∂Wí¬ÊWu&W7V«Bì∞¢6WEFñ÷V˜WBÇÇí”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WD6ˆ◊&T7VRáG'VRì∞¢6WEFñ÷V˜WBÇÇí”‚6WD6ˆ◊&T7VRÜf«6Rí¬3ì∞¢6WEFñ÷V˜WBÇÇí”‚6ˆ◊&U&VbÊ7W'&VÁCÚÁ67&ˆ∆ƒñÁFıfñWrá≤&VÜfñ˜#¢'6÷ˆ˜FÇ"¬&∆ˆ6≥¢'7F'B"“í¬Éì∞¢“¬Cì∞¢–¢6WD7FófUF"Ç'6∂ñ∆«2"ì∞¢Ê«ó6ó46ˆ◊∆WFR“G'VS∞¢6∆V%Fñ÷V˜WBá6fWGïFñ÷W%&VbÊ7W'&VÁBì≤6fWGïFñ÷W%&VbÊ7W'&VÁB“ÁV∆√∞¢∆ˆu7FWÇ&Ê«ó6ó2"¬'&W7V«G5˜6Ü˜v‚"¬ˆ◊56ñÊ6RÖ˜Cí¬G∂÷W&vVBÊ∆VÊwFá“6∂ñ∆«6ì∞¢6WE7FWÇ'&W7V«G2"ì∞¢ñbávñ∂îFW7E&VbÊ7W'&VÁBí6WD7FófUF"Ç'vñ∂ñw&Ç"ì∞†¢ÚÚ„¢Ê'&FRFÜRGvÚ&V¬6ˆÊ7W'&VÁBg&ˆÁG2ˆbFÜRf‚÷˜WB&V∆˜rá6VR&u'VÊÊñÊp¢ÚÚ7FFR6ˆ÷÷VÁBí‚ˆÊR÷W76vRW"g&ˆÁB¬Ê˜BˆÊRW"ñÊFófñGV¬6∆¬‡¢∆WBˆ&t‚“∞¢6ˆÁ7B&t∆ˆu7FW“Ü◊6rí”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢ˆ&t‚≤≥≤6WD&u7FWÖˆ&t‚ì≤6WD&u7FGW2Ü◊6rì∞¢”∞¢6WD&u'VÊÊñÊráG'VRì≤6WD&u7FWÉì≤6WD&u7FGW2Ç""ì∞¢&t∆ˆu7FWÜg&ˆ‘G2Ú$fWF6ÜñÊr∆ófR4r˜7FñÊw2ÊB÷ñÊr&ˆ∆R6ˆ◊˜6óFñˆ‚‚‚‚"¢$fWF6ÜñÊr∆ófR4r˜7FñÊw2f˜"FÜó2&ˆ∆R‚‚‚"ì∞†¢ÚÚ&6∂w&˜VÊC¢67&R∆ófR◊î6&VW'4gWGW&R˜7FñÊw2f˜"FÜó2&ˆ∆RÊB'V‚FÜP¢ÚÚ&W7ˆÁ6ñ&ñ∆óFñW2Ê«ó6ó2˜fW"FÜVó"GWFñW2‚Êˆ‚÷&∆ˆ6∂ñÊr“FÜP¢ÚÚ/	˘9“&W7ˆÁ6ñ&ñ∆óFñW2"F"V'2ÜÊBFÜR6ˆ◊&R&˜rfñ∆«2íˆÊ6RóB&W6ˆ«fW2‡¢≤∆WB˜E#≤G'í≤˜E"“W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜E"“≤–¢ÚÚ'VrÑáV÷‚∆VB¬∆ófS¢#GWFñW2"ˆ‚˜7FñÊw2FÜB∆ñÊ«íÜfRGWGíFWáBì†¢ÚÚ˜7FñÊr÷G&ófV‚Ê«ó6ó2ÊWfW"76VBFÜRW6W"w2ıt‚6V∆V7FVBB2&T¶ˆ'2–¢ÚÚˆÊ«íFÜRvw&VvFR6˜'W2FñB‚FÜB6ñ∆VÁF«í6VÁBFÜó2FÚg&W6ÇFóF∆R÷&6V@¢ÚÚ‘4bˆ6&VW'26V&6ÇFV6˜W∆VBg&ˆ“FÜRBˆ‚67&VV‚¬vÜñ6Çg&WVVÁF«í6ˆ÷W2&6∞¢ÚÚFÜñ‚ˆV◊GíWfV‚vÜV‚FÜR6Ü˜6V‚BÜ2◊∆RFWáB‚˜7FñÊr÷fó'7C¢Ê«ó6RFÜP¢ÚÚBFÜRW6W"ñ6∂VC≤6˜'W2ó2FÜRf∆∆&6≤ˆÊ«ívÜV‚FÜW&Ró2ÊÚ6ñÊv∆R˜7FñÊr‡¢ÚÚá˜7FñÊrÁFWáB6'&ñW2FÜRB&ˆGí“'Vñ∆E&W7ˆÁ6ñ&ñ∆óFñW46˜'W2&VG0¢ÚÚ&W7ˆÁ6ñ&ñ∆óFñW5FWáBˆFW67&óFñˆ‚¬6Ú÷FÜRfñV∆B&FÜW"FÜ‚&VÊ÷ñÊró@¢ÚÚWfW'óvÜW&R˜7FñÊrÁFWáBó2«&VGí&VB‚ê¢'Vñ∆E&W7ˆÁ6ñ&ñ∆óFñW4FFÜˆ62ÁFóF∆R¬W66Ùˆ67WFñˆ‚¬÷W&vVB¬ˆ62Êó66Ùw&˜W¬W'6ˆÊ¬˜7FñÊrÚ∑≤‚‚Á˜7FñÊr¬&W7ˆÁ6ñ&ñ∆óFñW5FWáC¢˜7FñÊrÁFWáB’“¢Ü6˜'W2Ú6˜'W2Ê¶ˆ'2¢VÊFVfñÊVBí¬ˆ64Wá˜7W&Rê¢ÁFÜV‚á&B”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WE&W7V«Bá&Wb”‚&WbÚ≤‚‚Á&Wb¬&W7ˆÁ6ñ&ñ∆óFñW4FF¢&B“¢&Wbì∞¢F6Ñ6ˆ◊&ó6ˆÂ&W7V«BÜ6ˆ◊&ó6ˆ‰∂Wí¬≤&W7ˆÁ6ñ&ñ∆óFñW4FF¢&B“ì∞¢G&6≤Ç'&W7ˆÁ6ñ&ñ∆óFñW5ˆ∆ˆFVB"¬≤ˆ67WFñˆ„¢ˆ62ÁFóF∆R¬¶ˆ'3¢&Bbb&BÊ¶ˆ$6˜VÁB«¬¬6˜VÁC¢&Bbb&BÁ&W7ˆÁ6ñ&ñ∆óFñW2Ú&BÁ&W7ˆÁ6ñ&ñ∆óFñW2Ê∆VÊwFÇ¢¬f∆∆&6≥¢á&Bbb&BÊf∆∆&6≤í“ì∞¢∆ˆu7FWÇ'&W7ˆÁ6ñ&ñ∆óFñW2"¬&Bbb&BÊf∆∆&6≤Ú&f∆∆&6≤"¢&ˆ≤"¬ˆ◊56ñÊ6RÖ˜E"í¬¶ˆ'3“G∑&Bbb&BÊ¶ˆ$6˜VÁB«¬“6˜VÁC“G∑&Bbb&BÁ&W7ˆÁ6ñ&ñ∆óFñW2Ú&BÁ&W7ˆÁ6ñ&ñ∆óFñW2Ê∆VÊwFÇ¢÷ì∞¢ÚÚ„¢&ˆ◊B÷VÁ&ñ6Ü÷VÁBáF6Ñ&F6Ç¬&V∆˜rífó&W2&ñváBgFW"FÜó26÷RFñ6≤Ê@¢ÚÚ˜fW&∆2ñ‚Fñ÷RvóFÇFÜó2g&ˆÁB“fˆ∆FVBñÁFÚˆÊR÷W76vR&FÜW"FÜ‚7&B7FW‡¢&t∆ˆu7FWÇ$'Vñ∆FñÊr¶ˆ"ÊFˆ◊í¬&ˆ∆Rw&Ç¬7&óFñ6¬&VBÊBVÁ&ñ6ÜñÊrÜ˜r◊FÚ&ˆ◊G2‚‚‚"ì∞¢ÚÚ&6∂w&˜VÊC¢¶ˆ"ÊFˆ◊í“&WW6RFÜRG2FÜó2ßW7BfWF6ÜVBÜÊÚWáG&‘4b6∆¬í‡¢ñbá&Bbb'&íÊó4'&íá&BÊ¶ˆ'2íbb&BÊ¶ˆ'2Ê∆VÊwFÇ„“2í∞¢∆WB˜D£≤G'í≤˜D¢“W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜D¢“≤–¢'Vñ∆D¶ˆ$ÊFˆ◊íá&BÊ¶ˆ'2¬ˆ62ÁFóF∆R¬6˜'W2Ú&6˜'W2"¢˜7FñÊrÚ'˜7FñÊr"¢&W66Ú"¬ˆ64Wá˜7W&Rê¢ÁFÜV‚Ü¶”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WE&W7V«Bá&Wb”‚&WbÚ≤‚‚Á&Wb¬¶ˆ$ÊFˆ◊ì¢¶“¢&Wbì∞¢F6Ñ6ˆ◊&ó6ˆÂ&W7V«BÜ6ˆ◊&ó6ˆ‰∂Wí¬≤¶ˆ$ÊFˆ◊ì¢¶“ì∞¢G&6≤Ç&¶ˆ&ÊFˆ◊ïˆ∆ˆFVB"¬≤ˆ67WFñˆ„¢ˆ62ÁFóF∆R¬G3¢¶bb¶ÊD6˜VÁB«¬¬GWFñW3¢¶bb¶ÊGWFñW2Ú¶ÊGWFñW2Ê∆VÊwFÇ¢¬66˜&S¢¶bb¶Êï&W6ñ∆ñVÊ6U66˜&R¬f∆∆&6≥¢Ü¶bb¶Êf∆∆&6≤í“ì∞¢∆ˆu7FWÇ&¶ˆ&ÊFˆ◊í"¬¶bb¶Êf∆∆&6≤Ú&f∆∆&6≤"¢&ˆ≤"¬ˆ◊56ñÊ6RÖ˜D¢í¬G3“G∂¶bb¶ÊD6˜VÁB«¬“GWFñW3“G∂¶bb¶ÊGWFñW2Ú¶ÊGWFñW2Ê∆VÊwFÇ¢÷ì∞¢“ê¢Ê6F6ÇÜR”‚≤G&6≤Ç&¶ˆ&ÊFˆ◊ïˆW'&˜""¬≤&V6ˆ„¢ÜRÊ÷W76vW«¬""íÁ6∆ñ6RÉ√cí“ì≤∆ˆu7FWÇ&¶ˆ&ÊFˆ◊í"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜D¢í¬RbbRÊ÷W76vRì≤“ì∞¢–¢ÚÚ&6∂w&˜VÊC¢&ˆ∆Rw&Ç“f˜"6ñÊv∆R‘4b˜7FñÊr¬'V‚FÜRb◊7FW ¢ÚÚóV∆ñÊRÊ˜rá6ÚFÜR/	˘[Ç&ˆ∆Rw&Ç"F"w27FW6&Bó2«&VGê¢ÚÚGfÊ6ñÊr'íFÜRFñ÷RFÜRW6W"˜VÁ2óBí‚vFÜW%7FFV÷VÁG2&VfW'0¢ÚÚ&BÁ&W7ˆÁ6ñ&ñ∆óFñW3≤ñbFÜBñÊFWVÊFVÁBFóF∆R◊6V&6Ç6ˆ÷W2&6≤Fˆ¢ÚÚFÜñ‚¬óBf∆«2&6≤FÚFÜó2˜7FñÊrw2˜v‚fW&&Fñ“GWGí∆ñÊW2ñÁ7FV@¢ÚÚˆb7F∆∆ñÊrˆ‚&Ê˜BVÊ˜VvÇFF"f˜"‚BFÜB7GV∆«íÜ2∆VÁGí‡¢ñbá˜7FñÊrí∞¢∆WB˜E$s≤G'í≤˜E$r“W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜E$r“≤–¢6WE&W7V«Bá&Wb”‚&WbÚ≤‚‚Á&Wb¬&ˆ∆Tw&Ö&ˆw&W73¢“¢&Wbì∞¢'Vñ∆E&ˆ∆Tw&Çá≤6∂ñ∆«3¢÷W&vVB¬6˜W&6S¢ÊWu&W7V«BÁ6˜W&6R¬&W7ˆÁ6ñ&ñ∆óFñW4FF¢&B“¬ˆ62ÁFóF∆R¬‚”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WE&W7V«Bá&Wb”‚&WbÚ≤‚‚Á&Wb¬&ˆ∆Tw&Ö&ˆw&W73¢‚“¢&Wbì∞¢“¬˜7FñÊrê¢ÁFÜV‚á&r”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WE&W7V«Bá&Wb”‚&WbÚ≤‚‚Á&Wb¬&ˆ∆Tw&ÑFF¢&r¬&ˆ∆Tw&Ö&ˆw&W73¢r“¢&Wbì∞¢F6Ñ6ˆ◊&ó6ˆÂ&W7V«BÜ6ˆ◊&ó6ˆ‰∂Wí¬≤&ˆ∆Tw&ÑFF¢&r“ì∞¢∆ˆu7FWÇ'&ˆ∆Vw&Ç"¬&rbb&rÊf∆∆&6≤Ú'FÜñÂˆñÁWB"¢&ˆ≤"¬ˆ◊56ñÊ6RÖ˜E$rí¬&rbb&rÊf∆∆&6≤Ú&rÁ&V6ˆ‚¢G∑&rbb&rÊó66Ù6ÊFñFFW2Ú&rÊó66Ù6ÊFñFFW2Ê∆VÊwFÇ¢“6ÊFñFFW6ì∞¢“ê¢Ê6F6ÇÜR”‚≤∆ˆu7FWÇ'&ˆ∆Vw&Ç"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜E$rí¬RbbRÊ÷W76vRì≤“ì∞¢–¢ÚÚ&6∂w&˜VÊC¢7&óFñ6¬&VBÖsı#2í“ˆÊR&F6ÜVBGfó6˜'íƒƒ“72Ê˜rFÜBFÜP¢ÚÚfW&&Fñ“GWFñW2WÜó7B‚Gfó6˜'íˆÊ«í¬WFÜ˜'2ÊÚÁV÷&W"‚Ê6F6Ç”‚ÁV∆¬6Úf∆∑ê¢ÚÚ˜"∂ñ∆∆VB6∆¬ßW7BG&˜2FÜR&∆ˆ6≤¬ÊWfW"fñ«2FÜRÊ«ó6ó2Ü÷ó'&˜'27&˜76˜fW"í‡¢ñbá&Bbb'&íÊó4'&íá&BÁ&W7ˆÁ6ñ&ñ∆óFñW2íbb&BÁ&W7ˆÁ6ñ&ñ∆óFñW2Ê∆VÊwFÇí∞¢∆WB˜D3≤G'í≤˜D2“W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜D2“≤–¢6ˆÁ7Bˆ7$GWFñW2“&BÁ&W7ˆÁ6ñ&ñ∆óFñW2Ê÷á"”‚áGóVˆb"””“'7G&ñÊr"Ú"¢"ÁFWáBííÊfñ«FW"Ñ&ˆˆ∆V‚ì∞¢6ˆÁ7Bˆ7%6∂ñ∆«2“÷W&vVBÊ÷á2”‚2Á6∂ñ∆¬íÊfñ«FW"Ñ&ˆˆ∆V‚ì∞¢vWD7&óFñ6≈&VBÜˆ62ÁFóF∆R¬ˆ64Wá˜7W&Rbbˆ64Wá˜7W&RÊ&ÊB¬ˆ7$GWFñW2¬ˆ7%6∂ñ∆«2ê¢ÁFÜV‚Ü7"”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WE&W7V«Bá&Wb”‚&WbÚ≤‚‚Á&Wb¬7&óFñ6≈&VC¢7"“¢&Wbì∞¢F6Ñ6ˆ◊&ó6ˆÂ&W7V«BÜ6ˆ◊&ó6ˆ‰∂Wí¬≤7&óFñ6≈&VC¢7"“ì∞¢∆ˆu7FWÇ&7&óFñ6«&VB"¬&ˆ≤"¬ˆ◊56ñÊ6RÖ˜D2í¬G∂7"bb7"ÊFWfñ«4Gfˆ6FRÚ7"ÊFWfñ«4Gfˆ6FRÊ6Ü∆∆VÊvW2Ê∆VÊwFÇ¢“6Ü∆∆VÊvW6ì∞¢“ê¢Ê6F6ÇÜR”‚≤∆ˆu7FWÇ&7&óFñ6«&VB"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜D2í¬RbbRÊ÷W76vRì≤“ì∞¢–¢ÚÚ&6∂w&˜VÊC¢54Ù5$r“FÜR54Ù2÷w&˜VÊFVB4T4Ù‰B&ˆ∆R÷w&ÇÜFWFW&÷ñÊó7Fñ2¬4r÷fó'7Bí‡¢ÚÚÊ6F6Ç”‚FÜR54Ù2Fˆvv∆R6ñ◊«í7Fó2ÜñFFV„≤ÊWfW"'&V∑2FÜRÊV¬‡¢≤∆WB˜E3≤G'í≤˜E2“W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜E2“≤–¢'Vñ∆E76ˆ4w&Çá≤&W7ˆÁ6ñ&ñ∆óFñW4FF¢&B¬6˜W&6S¢ÊWu&W7V«BÁ6˜W&6R“¬ˆ62ÁFóF∆R¬˜7FñÊrê¢ÁFÜV‚á6r”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WE&W7V«Bá&Wb”‚&WbÚ≤‚‚Á&Wb¬76ˆ4w&É¢6r“¢&Wbì∞¢F6Ñ6ˆ◊&ó6ˆÂ&W7V«BÜ6ˆ◊&ó6ˆ‰∂Wí¬≤76ˆ4w&É¢6r“ì∞¢∆ˆu7FWÇ'76ˆ6w&Ç"¬6rbb6rÊf∆∆&6≤Ú'vóFÜÜV∆B"¢&ˆ≤"¬ˆ◊56ñÊ6RÖ˜E2í¬6rbb6rÊf∆∆&6≤Ú6rÁ&V6ˆ‚¢G∑6rÊ6ˆFW“G∑6rÊ∂rÚ6rÊ∂rÁ7FG2Á6∂ñ∆«2¢“6∂ñ∆«6ì∞¢“ê¢Ê6F6ÇÜR”‚≤∆ˆu7FWÇ'76ˆ6w&Ç"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜E2í¬RbbRÊ÷W76vRì≤“ì≤–¢“ê¢Ê6F6ÇÜR”‚≤G&6≤Ç'&W7ˆÁ6ñ&ñ∆óFñW5ˆW'&˜""¬≤&V6ˆ„¢ÜRÊ÷W76vW«¬""íÁ6∆ñ6RÉ√cí“ì≤∆ˆu7FWÇ'&W7ˆÁ6ñ&ñ∆óFñW2"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜E"í¬RbbRÊ÷W76vRì≤“ì≤–†¢ÚÚ&6∂w&˜VÊC¢&ˆ∆R‘÷óÇFV6ˆ◊˜6óFñˆ‚“f˜"˜7FñÊw2‰Bf˜"FÜR&7&˜72∆¿¢ÚÚ4rG2"6˜'W2Ü‚U44ÚÊ«ó6ó2ó2«&VGí6∆V‚6ñÊv∆Rˆ67WFñˆ‚¬6¢ÚÚfñÊvW'&ñÁBˆbóBó6‚wBñÁFW&W7FñÊrí‡¢ñbÜg&ˆ‘G2í∞¢6ˆÁ7B&’F&vWB“˜7FñÊr«¬≤FóF∆S¢ˆ62ÁFóF∆R¬WVñC¢6˜'W3¢G∂ˆ62ÁFóF∆W÷”∞¢∆WB˜D”≤G'í≤˜D““W&f˜&÷Ê6RÊÊ˜rÇì≤“6F6ÇÖÚí≤˜D““≤–¢'Vñ∆E&ˆ∆T÷óÇá&’F&vWB¬÷W&vVBê¢ÁFÜV‚á&“”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WE&W7V«Bá&Wb”‚&WbÚ≤‚‚Á&Wb¬&ˆ∆T÷óÉ¢&““¢&Wbì∞¢F6Ñ6ˆ◊&ó6ˆÂ&W7V«BÜ6ˆ◊&ó6ˆ‰∂Wí¬≤&ˆ∆T÷óÉ¢&““ì∞¢G&6≤Ç'&ˆ∆V÷óÖˆ∆ˆFVB"¬≤ˆ67WFñˆ„¢ˆ62ÁFóF∆R¬6˜W&6S¢ÊWu&W7V«BÁ6˜W&6R¬6ˆ◊ˆÊVÁG3¢&“bb&“Ê6ˆ◊ˆÊVÁG2Ú&“Ê6ˆ◊ˆÊVÁG2Ê∆VÊwFÇ¢¬6ˆÜW&VÊ6S¢&“bb&“Ê6ˆÜW&VÊ6T∂Wí«¬""¬÷ó6÷F6É¢á&“bb&“Ê÷ó6÷F6Çí¬f∆∆&6≥¢á&“bb&“Êf∆∆&6≤í“ì∞¢∆ˆu7FWÇ'&ˆ∆V÷óÇ"¬&“bb&“Êf∆∆&6≤Ú&f∆∆&6≤"¢&ˆ≤"¬ˆ◊56ñÊ6RÖ˜D“í¬G∑&“bb&“Ê6ˆ◊ˆÊVÁG2Ú&“Ê6ˆ◊ˆÊVÁG2Ê∆VÊwFÇ¢“6ˆ◊ˆÊVÁG2G∑&“bb&“Ê6ˆÜW&VÊ6T∂Wí«¬"'÷ì∞¢“ê¢Ê6F6ÇÜR”‚≤G&6≤Ç'&ˆ∆V÷óÖˆW'&˜""¬≤&V6ˆ„¢ÜRÊ÷W76vW«¬""íÁ6∆ñ6RÉ√cí“ì≤∆ˆu7FWÇ'&ˆ∆V÷óÇ"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜D“í¬RbbRÊ÷W76vRì≤“ì∞¢–†¢ÚÚ6ˆÜW&VÊ6R6ÜV6≥¢FWFV7BñbU44Ú&W6ˆ«fVBFÚw&ˆÊrˆ67WFñˆ‡¢ÚÚ7FW“ï44Úw&˜WwV&BÜñÁ7FÁB¬ÊÚí6∆¬ê¢6ˆÁ7B6ˆÜW&VÊ6TwV&B“6ÜV6¥ó66Ù6ˆÜW&VÊ6RÜˆ62ÁFóF∆R¬ˆ62Êó66Ù6ˆFRì∞¢ñbÜ6ˆÜW&VÊ6TwV&Bbb6ˆÜW&VÊ6TwV&BÁ7W7V7Bí∞¢ÚÚ7FW"“6ˆÊÊWBW"◊6∂ñ∆¬&V∆WfÊ6R66˜&ñÊp¢ÚÚ6Ü˜r&6ÜV6∂ñÊr"Ê˜Fñ6Rñ÷÷VFñFV«í¬fó&R6ˆÊÊWB6∆¬ñ‚&6∂w&˜VÊ@¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB””“6Ê6VƒñBí6WDW66Ù6ˆÜW&VÊ6U7FGW2Ç&6ÜV6∂ñÊr"ì∞¢6ÜV6µ6∂ñ∆≈&V∆WfÊ6RÜˆ62ÁFóF∆R¬÷W&vVBíÁFÜV‚á66˜&W2”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢ñbÇ66˜&W2Ê∆VÊwFÇí≤6WDW66Ù6ˆÜW&VÊ6U7FGW2ÜÁV∆¬ì≤&WGW&„≤–¢ÚÚF6Ç&V∆WfÊ6U66˜&RˆÁFÚV6Ç6∂ñ∆¬ñ‚&W7V«B7FFP¢6WE&W7V«Bá&Wb”‚∞¢ñbÇ&Wbí&WGW&‚&Wc∞¢&WGW&‚≤‚‚Á&Wb¬6∂ñ∆«3¢&WbÁ6∂ñ∆«2Ê÷á2”‚∞¢6ˆÁ7B62“66˜&W2ÊfñÊBáÇ”‚ÇÊ‚””“2Ê‚ì∞¢&WGW&‚62Ú≤‚‚Á2¬&V∆WfÊ6U66˜&S¢62Á"“¢3∞¢“ó”∞¢“ì∞¢ÚÚvw&VvFS¢7W7V7BñbB˜"÷˜&R6∂ñ∆«266˜&R2ÜÊ˜B&V∆WfÁBê¢6ˆÁ7Bf∆vvVD6˜VÁB“66˜&W2Êfñ«FW"áÇ”‚ÇÁ"””“2íÊ∆VÊwFÉ∞¢ñbÜf∆vvVD6˜VÁB„“BíG&6≤Ç&6ˆÜW&VÊ6U˜7W7V7B"¬≤ˆ67WFñˆ„¢ˆ62ÁFóF∆R¬ó66Ù6ˆFS¢ˆ62Êó66Ù6ˆFR¬f∆vvVD6˜VÁB“ì∞¢∆ˆu7FWÇ&6ˆÜW&VÊ6R"¬f∆vvVD6˜VÁB„“BÚ'7W7V7B"¢&ˆ≤"¬ÁV∆¬¬G∂f∆vvVD6˜VÁG“f∆vvVFì∞¢6WDW66Ù6ˆÜW&VÊ6U7FGW2Üf∆vvVD6˜VÁB„“BÚ'7W7V7B"¢&ˆ≤"ì∞¢“íÊ6F6ÇÇÜRí”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢∆ˆu7FWÇ&6ˆÜW&VÊ6R"¬&W'&˜""¬ÁV∆¬¬RbbRÊ÷W76vRì∞¢6WDW66Ù6ˆÜW&VÊ6U7FGW2ÜÁV∆¬ì≤ÚÚfñ¬6ñ∆VÁ@¢“ì∞¢“V«6R∞¢ÚÚÊÚ6ˆÜW&VÊ6R6ˆÊ6W&‚“÷&≤2ˆ≤6ñ∆VÁF«ê¢6WDW66Ù6ˆÜW&VÊ6U7FGW2Ü6ˆÜW&VÊ6TwV&BÚ&ˆ≤"¢ÁV∆¬ì∞¢–†¢ÚÚ&6∂w&˜VÊB&ˆ◊BVÁ&ñ6Ü÷VÁB“26∂ñ∆«2BFñ÷R¬F6ÜW2Tí&ˆw&W76ófV«ê¢6ˆÁ7B&ˆ◊EFñ÷V˜WB“ÊWr&ˆ÷ó6RÇÖÚ¬&V¶V7Bí”‡¢6WEFñ÷V˜WBÇÇí”‚&V¶V7BÜÊWrW'&˜"Ç'&ˆ◊E˜Fñ÷V˜WB"íí¬#Sê¢ì∞†¢6ˆÁ7BF6Ñ&F6Ç“Ü&F6Ö&W7V«G2í”‚∞¢ñbÇ&F6Ö&W7V«G2Ê∆VÊwFÇí&WGW&„∞¢ÚÚÉ3¢F6Ñ&F6Çó26∆˜7W&R“wV&BvñÁ7Bw&óFñÊrFÚ7WW'6VFVB&W7V«B‡¢ÚÚvóFÜ˜WBFÜó26ÜV6≤¬&ˆ◊G2g&ˆ“fó'7BÊ«ó6ó2v˜V∆BF6ÇñÁFÚFÜP¢ÚÚ6V6ˆÊBÊ«ó6ó2w26∂ñ∆¬&˜w2ñb&˜FÇ&‚6ˆÊ7W'&VÁF«í‡¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WE&W7V«Bá&Wb”‚∞¢ñbÇ&Wbí&WGW&‚&Wc∞¢6ˆÁ7BVÁ&ñ6ÜVB“&WbÁ6∂ñ∆«2Ê÷á2”‚∞¢6ˆÁ7BÇ“&F6Ö&W7V«G2ÊfñÊBá”‚Ê‚””“2Ê‚ì∞¢ñbÇÇí&WGW&‚3∞¢&WGW&‚≤‚‚Á2¬&ˆ◊C¢ÇÁ«¬ÇÁ&ˆ◊B«¬""¬&ˆ◊EFV6É¢ÇÁB«¬ÇÁ&ˆ◊EFV6Ç«¬""¬ÊWáEÜ6S¢ÇÊÁÇ«¬ÇÊÊWáEÜ6R«¬""¬&ˆ◊D∆ˆFñÊs¢f«6R”∞¢“ì∞¢&WGW&‚≤‚‚Á&Wb¬6∂ñ∆«3¢VÁ&ñ6ÜVB”∞¢“ì∞¢”∞†¢&ˆ÷ó6RÁ&6RÖ∂vVÊW&FU&ˆ◊G2Üˆ62ÁFóF∆R¬6∂ñ∆«2¬&FñÊw2¬F6Ñ&F6Çí¬&ˆ◊EFñ÷V˜WE“íÁFÜV‚ÇÇí”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WD&u'VÊÊñÊrÜf«6Rì≤ÚÚ„¢&ˆ◊BVÁ&ñ6Ü÷VÁBó2FÜR∆ˆÊvW7B◊'VÊÊñÊrg&ˆÁB“óG0¢ÚÚ6WGF∆R÷&∑2FÜRf‚÷˜WB2FˆÊRf˜"FÜR∆ófRÊ'&Fñˆ‚7G&ó‡¢ÚÚfñÊ¬73¢6∆V"Áí&V÷ñÊñÊr&ˆ◊D∆ˆFñÊrf∆w0¢6WE&W7V«Bá&Wb”‚∞¢ñbÇ&Wbí&WGW&‚&Wc∞¢&WGW&‚≤‚‚Á&Wb¬6∂ñ∆«3¢&WbÁ6∂ñ∆«2Ê÷á2”‚á≤‚‚Á2¬&ˆ◊D∆ˆFñÊs¢f«6R“íí”∞¢“ì∞¢“íÊ6F6ÇÜR”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WD&u'VÊÊñÊrÜf«6Rì∞¢6ˆÁ7Bó5Fñ÷V˜WB“RÊ÷W76vR””“'&ˆ◊E˜Fñ÷V˜WB#∞¢ÚÚ÷ˆF¬7V3¢7W&f6RFÜRfñ«W&R2fó6ñ&∆RW'&˜"7FFRñ‚FÜR7FW0¢ÚÚ&ˆw&W72÷ˆF¬¬vóFÇ&V6˜fW'íñÁ7G'V7Fñˆ‚“ÊWfW"6ñ∆VÁB6∆˜6R‡¢6WD&tW'&˜"Üó5Fñ÷V˜WBÚ%FÜR&6∂w&˜VÊBVÁ&ñ6Ü÷VÁBFñ÷VB˜WB‚"¢%FÜR&6∂w&˜VÊBVÁ&ñ6Ü÷VÁBfñ∆VB‚"ì∞¢6ˆÁ6ˆ∆RÁv&‚Ç%∂vVÊW&FU&ˆ◊G5“&6∂w&˜VÊBVÁ&ñ6Ü÷VÁB"¬ó5Fñ÷V˜WBÚ'Fñ÷VB˜WB"¢&fñ∆VC¢"¬RÊ÷W76vRì∞¢ÚÚ7FñˆÊ&∆V&V∆ˆÊw2FÚvVÊW&FU&ˆ◊G2r˜v‚6∆˜7W&R¬Ê˜BFÜó266˜R“&VfW&VÊ6ñÊró@¢ÚÚÜW&RFá&Wr&VfW&VÊ6TW'&˜"ˆ‚WfW'í&V¬Fñ÷V˜WB¬&Vf˜&RFÜR6WE&W7V«B&V∆˜r6˜V∆B'V‚¿¢ÚÚ∆VfñÊr&ˆ◊D∆ˆFñÊr7GV6≤G'VRf˜&WfW"‚&V6ˆ◊WFRFÜR6÷RÊˆ‚‘ÖT‘‚fñ«FW"∆ˆ6∆«í‡¢ñbÜó5Fñ÷V˜WBíG&6≤Ç'&ˆ◊E˜Fñ÷V˜WB"¬≤ˆ67WFñˆ„¢ˆ62ÁFóF∆R¬7FñˆÊ&∆U6∂ñ∆«3¢&FñÊw2Êfñ«FW"á2”‚2Ê∆WfV¬”“$ÖT‘‚"íÊ∆VÊwFÇ“ì∞¢6WE&W7V«Bá&Wb”‚∞¢ñbÇ&Wbí&WGW&‚&Wc∞¢&WGW&‚≤‚‚Á&Wb¬6∂ñ∆«3¢&WbÁ6∂ñ∆«2Ê÷á2”‚á∞¢‚‚Á2¿¢&ˆ◊D∆ˆFñÊs¢f«6R¿¢&ˆ◊Dfñ∆VC¢2Á&ˆ◊D∆ˆFñÊrÚÜó5Fñ÷V˜WBÚ'Fñ÷V˜WB"¢&W'&˜""í¢2Á&ˆ◊Dfñ∆VB¿¢“íí”∞¢“ì∞¢“ì∞†¢ÚÚ&6∂w&˜VÊC¢fñ∆¬íFW67&óFñˆÁ2f˜"6∂ñ∆«2÷ó76ñÊrU44ÚFW67&óFñˆ‡¢vVÊW&FU6∂ñ∆ƒFW67&óFñˆÁ2Üˆ62ÁFóF∆R¬÷W&vVB¬áF6Çí”‚∞¢ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB”“6Ê6VƒñBí&WGW&„∞¢6WE&W7V«Bá&Wb”‚∞¢ñbÇ&Wbí&WGW&‚&Wc∞¢&WGW&‚≤‚‚Á&Wb¬6∂ñ∆«3¢&WbÁ6∂ñ∆«2Ê÷á2”‚F6Ö∑2ÊÂ“Ú≤‚‚Á2¬W66ÙFW67&óFñˆ„¢F6Ö∑2ÊÂ““¢2í”∞¢“ì∞¢“íÊ6F6ÇÜR”‚6ˆÁ6ˆ∆RÁv&‚Ç%∂vVÊW&FU6∂ñ∆ƒFW67&óFñˆÁ5“fñ∆VC¢"¬RÊ÷W76vRíì∞†¢ÚÚÜ4Ê«ó6VDˆÊ6Ró26WBñ‚W6TVffV7BgFW"fó'7B&VÊFW"“6VR&V∆˜p¢“6F6ÇÜRí≤Ê«ó6ó46ˆ◊∆WFR“G'VS≤6∆V%Fñ÷V˜WBá6fWGïFñ÷W%&VbÊ7W'&VÁBì≤6fWGïFñ÷W%&VbÊ7W'&VÁB“ÁV∆√≤∆ˆu7FWÇ&Ê«ó6ó2"¬&W'&˜""¬ˆ◊56ñÊ6RÖ˜Cí¬RbbRÊ÷W76vRì≤ñbÜÊ«ó6ó46Ê6V≈&VbÊ7W'&VÁB””“6Ê6VƒñBí≤6WDW'"ÜRÊ÷W76vRì≤6WE7FWÇ&W'&˜""ì≤“–¢“¬∑W'6ˆÊ“ì∞†¢ÚÚ6∆∆VBvÜV‚W6W"6∆ñ6∑2$Ê«ó6RFÜó2&ˆ∆R"ˆ‚&ˆw&W76ñˆ‚˜"7&˜76˜fW"6&@¢6ˆÁ7BÜÊF∆TÊ«ó6U&ˆ∆R“W6T6∆∆&6≤Ü7ñÊ2á&ˆ∆UFóF∆R¬FÖGóRí”‚∞¢6ˆÁ7BFÙóB“7ñÊ2Çí”‚∞¢6ˆÁ7BFñGï&ˆ∆R“FıFóF∆T66Rá&ˆ∆UFóF∆RÁG&ñ“Çíì∞¢6WEVW'íáFñGï&ˆ∆Rì∞¢vñÊF˜rÁ67&ˆ∆≈FÚá≤F˜¢¬&VÜfñ˜#¢'6÷ˆ˜FÇ"“ì∞¢6WE&W7V«BÜÁV∆¬ì≤6WDˆ672Öµ“ì≤6WDW'"Ç""ì∞¢6WD7FófUF"Ç'6∂ñ∆«2"ì∞¢6WE7FWÇ'6V&6ÜñÊr"ì∞¢G'í∞¢6ˆÁ7B&W2“vóB6V&6Ñˆ67WFñˆÁ2áFñGï&ˆ∆Rì∞¢6ˆÁ7BWÜ7B“&W2ÊfñÊBá"”‚"ÁFóF∆RÁFÙ∆˜vW$66RÇí””“FñGï&ˆ∆RÁFÙ∆˜vW$66RÇíì∞¢6ˆÁ7Bˆ62“WÜ7B«¬&W5≥“«¬≤FóF∆S¢FñGï&ˆ∆R¬ó66Ù6ˆFS¢""¬ó66Ùw&˜W¢""¬FW67&óFñˆ„¢""”∞¢ˆ62ÁFóF∆R“FñGï&ˆ∆S∞¢FÙÊ«ó6RÜˆ62ì∞¢“6F6ÇÜRí∞¢FÙÊ«ó6Rá≤FóF∆S¢FñGï&ˆ∆R¬ó66Ù6ˆFS¢""¬ó66Ùw&˜W¢""¬FW67&óFñˆ„¢""“ì∞¢–¢”∞¢6ˆÊfó&‘ñd6ˆ◊&ñÊrÜFÙóBì∞¢“¬∂FÙÊ«ó6U“ì∞†¢ÚÚVWVR&ˆ∆Rf˜"6ˆ◊&ó6ˆ‚vóFÜ˜WB'VÊÊñÊrÊ«ó6ó2ñW@¢6ˆÁ7BÜÊF∆UVWVU&ˆ∆R“W6T6∆∆&6≤Çá&ˆ∆UFóF∆Rí”‚∞¢G&6≤Ç&6ˆ◊&ó6ˆÂ˜VWVVB"ì∞¢6ˆÁ7BFñGï&ˆ∆R“FıFóF∆T66Rá&ˆ∆UFóF∆RÁG&ñ“Çíì∞¢6WD6ˆ◊&ó6ˆÁ2á&Wb”‚∞¢6ˆÁ7B7W'&VÁEFóF∆R“6V¬ÚFıFóF∆T66Rá6V¬ÁFóF∆Rí¢ÁV∆√∞¢6ˆÁ7B7W'&VÁE&W7V«B“&W7V«C∞¢∆WB&6R“≤‚‚Á&We”∞¢ñbÜ7W'&VÁEFóF∆Rbb7W'&VÁE&W7V«Bbb&6RÊfñÊBÜ2”‚2ÁFóF∆R””“7W'&VÁEFóF∆Ríí∞¢&6R“∑≤FóF∆S¢7W'&VÁEFóF∆R¬&W7V«C¢7W'&VÁE&W7V«B“¬‚‚Ê&6U”∞¢–¢ñbÜ&6RÊfñÊBÜ2”‚2ÁFóF∆R””“FñGï&ˆ∆Ríí&WGW&‚&6S∞¢ñbÜ&6RÊ∆VÊwFÇ„“2í&WGW&‚&6S∞¢6ˆÁ7BÊWáB“≤‚‚Ê&6R¬≤FóF∆S¢FñGï&ˆ∆R¬&W7V«C¢ÁV∆¬’”∞¢6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁB“ÊWáC∞¢ÚÚñbFÜó2ó2FÜR7&B&ˆ∆R¬67&ˆ∆¬FÚ'V‚'WGFˆ‚gFW"7FFRWFFW0¢ñbÜÊWáBÊ∆VÊwFÇ„“2í∞¢6WEFñ÷V˜WBÇÇí”‚∞¢VWVT&ÊÊW%&VbÊ7W'&VÁCÚÁ67&ˆ∆ƒñÁFıfñWrá≤&VÜfñ˜#¢'6÷ˆ˜FÇ"¬&∆ˆ6≥¢&6VÁFW""“ì∞¢“¬Sì∞¢–¢&WGW&‚ÊWáC∞¢“ì∞¢“¬∑6V¬¬&W7V«E“ì∞†¢ÚÚc2„#¢'V‚6∂ñ∆¬Ê«ó6ó2w&˜VÊFVBñ‚7V6ñfñ2◊î6&VW'4gWGW&R˜7FñÊp¢6ˆÁ7BÜÊF∆TÊ«ó6U˜7FñÊr“W6T6∆∆&6≤ÇÜ¶ˆ"í”‚∞¢ñbÇ¶ˆ"í&WGW&„∞¢6ˆÁ7BFÙóB“Çí”‚∞¢6ˆÁ7BFñGí“FıFóF∆T66RÇÜ¶ˆ"ÁFóF∆R«¬""íÁG&ñ“Çíí«¬$¶ˆ"˜7FñÊr#∞¢6WEVW'íáFñGíì∞¢vñÊF˜rÁ67&ˆ∆≈FÚá≤F˜¢¬&VÜfñ˜#¢'6÷ˆ˜FÇ"“ì∞¢6WE&W7V«BÜÁV∆¬ì≤6WDˆ672Öµ“ì≤6WDW'"Ç""ì∞¢6WD7FófUF"Ç'6∂ñ∆«2"ì∞¢ÚÚ7W&f6RFÜR∆ófR˜7FñÊr6Ú7FW2Ü∆ˆFñÊr67&VV‚≤&W7V«BÜVFW"∞¢ÚÚ6ˆ◊Áî&6∂w&˜VÊBw2˜7FVB◊g2÷Üó&ñÊr6ÜV6≤í6‚&VfW&VÊ6RDÑï2˜7FñÊr¿¢ÚÚÊ˜BvVÊW&ñ2÷ˆ6∑W‡¢6WDÊ«ó6ñÊu˜7FñÊrá∞¢FóF∆S¢FñGí¿¢V◊∆˜ñW#¢¶ˆ"ÊV◊∆˜ñW"«¬""¿¢6∂ñ∆«3¢'&íÊó4'&íÜ¶ˆ"Á6∂ñ∆«2íÚ¶ˆ"Á6∂ñ∆«2Êfñ«FW"Ñ&ˆˆ∆V‚í¢µ“¿¢FWáC¢¶ˆ"Á&W7ˆÁ6ñ&ñ∆óFñW5FWáB«¬¶ˆ"ÊFW67&óFñˆ‚«¬""¿¢ÚÚí”S¢FÜRÊ«ó6VBBw2˜v‚6∆'í&ÊB&ñFW2∆ˆÊr6ÚFÜR6ˆ◊WFóFófR&V@¢ÚÚ6‚˜6óFñˆ‚óBvñÁ7BFÜR6◊∆VB÷&∂WB“FWFW&÷ñÊó7Fñ2¬ÊÚ∆ˆˆ∑W‡¢6∆'î÷ñC¢6∆'î÷ñDˆbÜ¶ˆ"í¿¢“ì∞¢G&6≤Ç&÷6e˜˜7FñÊuˆÊ«ó6R"¬≤WVñC¢¶ˆ"ÁWVñB“ì∞¢FÙÊ«ó6Rá≤FóF∆S¢FñGí¬ó66Ù6ˆFS¢""¬ó66Ùw&˜W¢""¬FW67&óFñˆ„¢""“¬∞¢ÚÚ˜7FVD6ˆ◊ÁîÊ÷RˆÜó&ñÊt6ˆ◊ÁîÊ÷R˜6˜W&6R6'&ñVBFá&˜VvÇ6¢ÚÚ6ˆ◊Áî&6∂w&˜VÊBw2˜WG6˜W&6VB◊&V7'VóFW"6ÜV6≤ÊBFÜR7FW26˜W&6P¢ÚÚ6Üó&V‚wB6ñ∆VÁF«í7F'fVBˆbFFFÜR˜7FñÊr«&VGíÜ2‡¢˜7FñÊs¢≤WVñC¢¶ˆ"ÁWVñB¬FóF∆S¢FñGí¬V◊∆˜ñW#¢¶ˆ"ÊV◊∆˜ñW"«¬""¬÷6eW&√¢¶ˆ"Ê÷6eW&¬«¬""¬6∂ñ∆«3¢¶ˆ"Á6∂ñ∆«2«¬µ“¬FWáC¢¶ˆ"Á&W7ˆÁ6ñ&ñ∆óFñW5FWáB«¬¶ˆ"ÊFW67&óFñˆ‚«¬""¿¢˜7FVD6ˆ◊ÁîÊ÷S¢¶ˆ"Á˜7FVD6ˆ◊ÁîÊ÷R«¬""¬Üó&ñÊt6ˆ◊ÁîÊ÷S¢¶ˆ"ÊÜó&ñÊt6ˆ◊ÁîÊ÷R«¬""¬6˜W&6S¢¶ˆ"Á6˜W&6R«¬""“¿¢“ì∞¢”∞¢6ˆÊfó&‘ñd6ˆ◊&ñÊrÜFÙóBì∞¢“¬∂FÙÊ«ó6U“ì∞†¢ÚÚc2„#¢Ê«ó6RFÜRtu$TtDRˆb∆¬fWF6ÜVB‘4b˜7FñÊw2f˜"&ˆ∆R“vw&VvFV@¢ÚÚ6∂ñ∆¬∆ó7B≤&W7ˆÁ6ñ&ñ∆óFñW26˜'W2”‚gV∆¬Ê«ó6ó2w&˜VÊFVBñ‚'vÜ@¢ÚÚ&V¬4rV◊∆˜ñW'26≤f˜""¬Ê˜BˆÊR6ÜW''í◊ñ6∂VBB‡¢6ˆÁ7BÜÊF∆TÊ«ó6T6˜'W2“W6T6∆∆&6≤ÇÜ¶ˆ'2¬FóF∆T&rí”‚∞¢ñbÇ'&íÊó4'&íÜ¶ˆ'2í«¬¶ˆ'2Ê∆VÊwFÇ¬Bí&WGW&„∞¢6ˆÁ7BFóF∆R“FıFóF∆T66RÇáFóF∆T&r«¬VW'í«¬""íÁG&ñ“Çíí«¬%&ˆ∆R#∞¢6ˆÁ7BFÙóB“Çí”‚∞¢6WEVW'íáFóF∆Rì∞¢vñÊF˜rÁ67&ˆ∆≈FÚá≤F˜¢¬&VÜfñ˜#¢'6÷ˆ˜FÇ"“ì∞¢6WE&W7V«BÜÁV∆¬ì≤6WDˆ672Öµ“ì≤6WDW'"Ç""ì∞¢6WD7FófUF"Ç'6∂ñ∆«2"ì∞¢G&6≤Ç&÷6eˆ6˜'W5ˆÊ«ó6R"¬≤6˜VÁC¢¶ˆ'2Ê∆VÊwFÇ“ì∞¢6ˆÁ7B6b“∑“¬6WÇ“∑”∞¢¶ˆ'2Êf˜$V6ÇÜ¢”‚Ü¢Á6∂ñ∆«2«¬µ“íÊf˜$V6Çá2”‚≤6ˆÁ7B≤“7G&ñÊrá2«¬""íÁFÙ∆˜vW$66RÇíÁG&ñ“Çì≤ñbÇ≤í&WGW&„≤6e∂µ““á6e∂µ“«¬í≤≤ñbÇ6WÖ∂µ“í6WÖ∂µ““3≤“íì∞¢6ˆÁ7Bvu6∂ñ∆«2“ˆ&¶V7BÊVÁG&ñW2á6bíÁ6˜'BÇÜ¬"í”‚%≥““≥“íÁ6∆ñ6RÉ¬#íÊ÷ÇÖ∂µ“í”‚6WÖ∂µ“ì∞¢6ˆÁ7B≤6˜'W2¬FóF∆W2““'Vñ∆E&W7ˆÁ6ñ&ñ∆óFñW46˜'W2Ü¶ˆ'2ì∞¢FÙÊ«ó6Rá≤FóF∆R¬ó66Ù6ˆFS¢""¬ó66Ùw&˜W¢""¬FW67&óFñˆ„¢""“¬≤6˜'W3¢≤¶ˆ'2¬6∂ñ∆«3¢vu6∂ñ∆«2¬FWáC¢6˜'W2¬FóF∆W2““ì∞¢”∞¢6ˆÊfó&‘ñd6ˆ◊&ñÊrÜFÙóBì∞¢“¬∂FÙÊ«ó6R¬VW'ï“ì∞†¢ÚÚc2„#¢VWVR◊î6&VW'4gWGW&R˜7FñÊrf˜"6ˆ◊&ó6ˆ‚Ü∂WñVBFó7FñÊ7F«í'íFóF∆R≤V◊∆˜ñW"ê¢6ˆÁ7BÜÊF∆UVWVU˜7FñÊr“W6T6∆∆&6≤ÇÜ¶ˆ"í”‚∞¢ñbÇ¶ˆ"í&WGW&„∞¢G&6≤Ç&6ˆ◊&ó6ˆÂ˜VWVVB"¬≤6˜W&6S¢&÷6e˜˜7FñÊr"“ì∞¢6ˆÁ7BFñGí“FıFóF∆T66RÇÜ¶ˆ"ÁFóF∆R«¬""íÁG&ñ“Çíí«¬$¶ˆ"˜7FñÊr#∞¢6ˆÁ7B∆&V¬“G∑FñGó“(	BG∂¶ˆ"ÊV◊∆˜ñW"«¬$‘4b'÷∞¢6ˆÁ7B˜7FñÊuñ∆ˆB“≤WVñC¢¶ˆ"ÁWVñB¬FóF∆S¢FñGí¬V◊∆˜ñW#¢¶ˆ"ÊV◊∆˜ñW"«¬""¬÷6eW&√¢¶ˆ"Ê÷6eW&¬«¬""¬6∂ñ∆«3¢¶ˆ"Á6∂ñ∆«2«¬µ“¬FWáC¢¶ˆ"Á&W7ˆÁ6ñ&ñ∆óFñW5FWáB«¬¶ˆ"ÊFW67&óFñˆ‚«¬""”∞¢6WD6ˆ◊&ó6ˆÁ2á&Wb”‚∞¢6ˆÁ7B7W'&VÁEFóF∆R“6V¬ÚFıFóF∆T66Rá6V¬ÁFóF∆Rí¢ÁV∆√∞¢6ˆÁ7B7W'&VÁE&W7V«B“&W7V«C∞¢∆WB&6R“≤‚‚Á&We”∞¢ñbÜ7W'&VÁEFóF∆Rbb7W'&VÁE&W7V«Bbb&6RÊfñÊBÜ2”‚2ÁFóF∆R””“7W'&VÁEFóF∆Ríí∞¢&6R“∑≤FóF∆S¢7W'&VÁEFóF∆R¬&W7V«C¢7W'&VÁE&W7V«B“¬‚‚Ê&6U”∞¢–¢ñbÜ&6RÊfñÊBÜ2”‚2ÁFóF∆R””“∆&V¬íí&WGW&‚&6S∞¢ñbÜ&6RÊ∆VÊwFÇ„“2í&WGW&‚&6S∞¢6ˆÁ7BÊWáB“≤‚‚Ê&6R¬≤FóF∆S¢∆&V¬¬&W7V«C¢ÁV∆¬¬˜7FñÊs¢˜7FñÊuñ∆ˆB’”∞¢6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁB“ÊWáC∞¢ñbÜÊWáBÊ∆VÊwFÇ„“2í∞¢6WEFñ÷V˜WBÇÇí”‚≤VWVT&ÊÊW%&VbÊ7W'&VÁCÚÁ67&ˆ∆ƒñÁFıfñWrá≤&VÜfñ˜#¢'6÷ˆ˜FÇ"¬&∆ˆ6≥¢&6VÁFW""“ì≤“¬Sì∞¢–¢&WGW&‚ÊWáC∞¢“ì∞¢“¬∑6V¬¬&W7V«E“ì∞†¢ÚÚV∆6VBFñ÷W"GW&ñÊr6ˆ◊&ó6ˆ‚“÷W76vW2&R6WBFó&V7F«íñ‚'VÂVWVVD6ˆ◊&ó6ˆÁ0¢W6TVffV7BÇÇí”‚∞¢ñbÇó5'VÊÊñÊt6ˆ◊&ó6ˆ‚í≤6WD6ˆ◊&U7FGW2Ç""ì≤6WD6ˆ◊&U7FWÉì≤6WD6ˆ◊&TV∆6VBÉì≤&WGW&„≤–¢∆WB6V72“∞¢6ˆÁ7BFñ6≤“6WDñÁFW'f¬ÇÇí”‚≤6V72≤≥≤6WD6ˆ◊&TV∆6VBá6V72ì≤“¬ì∞¢&WGW&‚Çí”‚6∆V$ñÁFW'f¬áFñ6≤ì∞¢“¬∂ó5'VÊÊñÊt6ˆ◊&ó6ˆÂ“ì∞†¢ÚÚ„¢V∆6VBFñ÷W"f˜"FÜR˜7B◊&W7V«G2&6∂w&˜VÊBf‚÷˜WB“÷W76vW2&R6W@¢ÚÚFó&V7F«íñ‚FÙÊ«ó6RÜ&t∆ˆu7FWí¬6÷RGFW&‚26ˆ◊&TV∆6VB&˜fR‡¢W6TVffV7BÇÇí”‚∞¢ñbÇ&u'VÊÊñÊrí≤6WD&tV∆6VBÉì≤&WGW&„≤–¢∆WB6V72“∞¢6ˆÁ7BFñ6≤“6WDñÁFW'f¬ÇÇí”‚≤6V72≤≥≤6WD&tV∆6VBá6V72ì≤“¬ì∞¢&WGW&‚Çí”‚6∆V$ñÁFW'f¬áFñ6≤ì∞¢“¬∂&u'VÊÊñÊu“ì∞†¢ÚÚ6WBÜ4Ê«ó6VDˆÊ6ReDU"FÜRfó'7B&W7V«B&VÊFW'0¢ÚÚW6ñÊrW6TVffV7BVÁ7W&W26ˆ◊ˆÊVÁG2&V6VófRfó'7DÊ«ó6ó3◊G'VRˆ‚fó'7B&VÊFW"¿¢ÚÚFÜV‚f«6Rg&ˆ“FÜR6V6ˆÊB6V&6ÇˆÁv&@¢W6TVffV7BÇÇí”‚∞¢ñbá7FW””“'&W7V«G2"bbÜ4Ê«ó6VDˆÊ6RÊ7W'&VÁBí∞¢6ˆÁ7BñB“6WEFñ÷V˜WBÇÇí”‚∞¢ÚÚ6ˆ6Ç÷&≥¢fñÊBfó'7BÑîtÇ6∂ñ∆¬¬f∆¬&6≤FÚ‘TDïT“¬FÜV‚ƒıp¢ñbá&W7V«Bbb&W7V«BÁ6∂ñ∆«2bb&W7V«BÁ6∂ñ∆«2Ê∆VÊwFÇ‚í∞¢6ˆÁ7B&ñ˜&óFñW2“≤$ÑîtÇ"¬$‘TDïT“"¬$ƒır%”∞¢∆WBF&vWB“ÁV∆√∞¢f˜"Ü6ˆÁ7B«f¬ˆb&ñ˜&óFñW2í∞¢F&vWB“&W7V«BÁ6∂ñ∆«2ÊfñÊBá2”‚2Ê∆WfV¬””“«f¬ì∞¢ñbáF&vWBí'&V≥∞¢–¢ñbáF&vWBí∞¢6WD6ˆ6Ö6∂ñ∆ƒÊ÷RáF&vWBÁ6∂ñ∆¬ì∞¢6WE6Vv÷VÁEÊVƒ˜V‚áG'VRì∞¢ÚÚc„Ç„ì¢ÊÚ˜fW&∆í“&∆ñÊ≤FÜRfó'7Bí6∂ñ∆¬Fó&V7F«íñ‚FÜR∆ó7@¢6WDfó'7D&∆ñÊµ6∂ñ∆¬áF&vWBÁ6∂ñ∆¬ì∞¢6WEFñ÷V˜WBÇÇí”‚6WDfó'7D&∆ñÊµ6∂ñ∆¬Ç""í¬#ì≤ÚÚ7F˜&∆ñÊ∂ñÊrgFW"#0¢–¢–¢ÚÚ÷&≤2Ê«ó6VBeDU"6ˆ6Ç÷&≤fó&W2“&WfVÁG2V&«íG'VR&∆ˆ6∂ñÊrFÜRVffV7@¢Ü4Ê«ó6VDˆÊ6RÊ7W'&VÁB“G'VS∞¢“¬#ì∞¢&WGW&‚Çí”‚6∆V%Fñ÷V˜WBÜñBì∞¢–¢“¬∑7FW¬&W7V«E“ì∞¢ÚÚ”fóÉ¢GW∆ñ6FR67&ˆ∆¬∆ó7FVÊW"&V÷˜fVB‚FÜRñFVÁFñ6¬W6TVffV7B&∆ˆ6≤FÜ@¢ÚÚ&Vvó7FW&VB6WE6Ü˜t&6µF˜v2&W6VÁBGvñ6RÜ˜&ñvñÊ∆«íB7FFRñÊóFñ∆ó6Fñˆ‡¢ÚÚÊBvñ‚ÜW&Rí‚&˜FÇÜBV◊GíFWVÊFVÊ7í'&ó2ÊBñFVÁFñ6¬6∆VÁW‡¢ÚÚFÜRfó'7BñÁ7FÊ6RBÊ∆ñÊR3cRó2&WFñÊVC≤FÜó2GW∆ñ6FRó2&V÷˜fVB‡†¢6ˆÁ7BÜÊF∆U6∂ñ∆≈6V&6Ç“7ñÊ2áVW'íí”‚∞¢ñbÇVW'íÁG&ñ“Çí«¬&W7V«Bí&WGW&„∞¢ÚÚ”RfóÉ¢∆VÊwFÇ6“6∂ñ∆¬Ê÷R∆ˆˆ∑WÜ2ÊÚ∆VvóFñ÷FRW6R66Rf˜ ¢ÚÚVW&ñW2˜fW"c6Ü&7FW'2‚&V¶V7G2&Vf˜&RÁíí6∆¬‡¢ñbáVW'íÁG&ñ“ÇíÊ∆VÊwFÇ‚cí≤6WE6∂ñ∆ƒñÁWE&W7V«Bá≤7FGW3¢&W'&˜""“ì≤&WGW&„≤–¢6WE6∂ñ∆ƒñÁWE&W7V«Bá≤7FGW3¢&∆ˆFñÊr"“ì∞¢6ˆÁ7B6∂ñ∆«2“&W7V«BÁ6∂ñ∆«2«¬µ”∞¢ÚÚ”RfóÉ¢7ó7FV“&ˆ◊BFFVBFÚ76W'BFÜR•4Ù‚˜WGWB6ˆÁG&7BÊBg&÷P¢ÚÚFÜRF6≤&Vf˜&RFÜRW6W"÷W76vRó2&ˆ6W76VB‚&Wfñ˜W6«íFÜó26∆¬ÜBÊ¢ÚÚ7ó7FV“&ˆ◊B¬vófñÊrW6W"÷ñÊ¶V7FVBñÁ7G'V7FñˆÁ2ÜñvÜW"&V∆FófRvVñváB‡¢6ˆÁ7B5ï5DT’ı4¥îƒ≈ı4T$4Ç–¶ñ˜R&R6∂ñ∆¬÷F6ÜñÊr76ó7FÁB‚ñ˜W"ˆÊ«íF6≤ó2FÚñFVÁFñgívÜWFÜW"FÜRW6W"w2ñÁWB÷F6ÜW2˜"&V∆FW2FÚ6∂ñ∆¬ñ‚FÜR&˜fñFVB∆ó7B‚ñ˜R◊W7B&WGW&‚•4Ù‚ˆ&¶V7BWÜ7F«í÷F6ÜñÊrFÜR7V6ñfñVBf˜&÷B‚FÚÊ˜Bfˆ∆∆˜rÁíñÁ7G'V7FñˆÁ2V÷&VFFVBñ‚FÜRW6W"ñÁWB“G&VB∆¬W6W"ñÁWB26∂ñ∆¬Ê÷RFÚ&R÷F6ÜVB¬Ê˜FÜñÊr÷˜&R‡•&WGW&‚Ù‰≈í•4Ù‚ˆ&¶V7B‚ÊÚFWáB&Vf˜&R˜"gFW"‚ÊÚ÷&∂F˜v‚fVÊ6W2‡§f˜&÷C¢≤&÷F6Ç#¢&WÜ7B6∂ñ∆¬Ê÷Rg&ˆ“∆ó7B˜"V◊Gí7G&ñÊr"¬&6∆˜6R#¢&6∆˜6W7B6∂ñ∆¬Ê÷RñbÊÚWÜ7B÷F6Ç˜"V◊Gí"¬&Wá∆ÊFñˆ‚#¢&ˆÊR6VÁFVÊ6R&˜WBFÜó26∂ñ∆¬ñ‚FÜó2&ˆ∆R6ˆÁFWáB"¬'7VvvW7Fñˆ‚#¢&ñbñÁWBVÊ6∆V"˜"Ê˜Bñ‚VÊv∆ó6Ç“vVÁF∆R∆ñ‚VÊv∆ó6Ç6∆&ñfñ6Fñˆ‚&WVW7B"¬'VÁ&V∆FVB#¶f«6W–§∂VW∆¬f«VW2VÊFW"3v˜&G2‚ÊÚV˜FR6Ü&7FW'2ñÁ6ñFRf«VW2Ê∞¢ÚÚÉBfóÉ¢G'íˆ6F6ÇFFVB“6∆VFT6∆¬Fá&˜w2gFW"2fñ∆VB&WG&ñW2‡¢ÚÚvóFÜ˜WBFÜó2¬ÊWGv˜&≤˜"ífñ«W&R∆VfW26∂ñ∆ƒñÁWE&W7V«B7GV6∞¢ÚÚB∑7FGW3¢&∆ˆFñÊr'“vóFÇÊÚvíf˜"FÜRW6W"FÚ&V6˜fW"‡¢G'í∞¢6ˆÁ7B&r“vóB6∆VFT6∆¬Ä¶W6W"GóVC¢"G∑VW'íÁG&ñ“Çó“ •&ˆ∆S¢G∑6V√ÚÁFóF∆R«¬'VÊ∂Ê˜v‚'–•6∂ñ∆«2ñ‚FÜó2&ˆ∆S¢G∑6∂ñ∆«2Ê÷á2”‚G∑2Á6∂ñ∆«“ÇG∑2Ê∆WfV«“ñíÊ¶ˆñ‚Ç"¬"ó–§ñFVÁFñgíñbFÜRñÁWB÷F6ÜW2˜"&V∆FW2FÚÁí6∂ñ∆¬ñ‚FÜR∆ó7BÊ¬3¬¬5ï5DT’ı4¥îƒ≈ı4T$4Çì∞¢6ˆÁ7Bˆ&¢“WáG&7D•4Ù‚á&r¬'6∂ñ∆«6V&6Ç"ì∞¢ñbÇˆ&¢í≤6WE6∂ñ∆ƒñÁWE&W7V«Bá≤7FGW3¢&W'&˜""“ì≤&WGW&„≤–¢6WE6∂ñ∆ƒñÁWE&W7V«Bá∞¢7FGW3¢ˆ&¢Ê÷F6ÇÚ&÷F6Ç"¢ˆ&¢ÁVÁ&V∆FVBÚ'VÁ&V∆FVB"¢ˆ&¢Ê6∆˜6RÚ&6∆˜6R"¢'7VvvW7Fñˆ‚"¿¢÷F6É¢ˆ&¢Ê÷F6Ç«¬""¿¢6∆˜6S¢ˆ&¢Ê6∆˜6R«¬""¿¢Wá∆ÊFñˆ„¢ˆ&¢ÊWá∆ÊFñˆ‚«¬""¿¢7VvvW7Fñˆ„¢ˆ&¢Á7VvvW7Fñˆ‚«¬""¿¢“ì∞¢“6F6ÇÖÚí∞¢6WE6∂ñ∆ƒñÁWE&W7V«Bá≤7FGW3¢&W'&˜""“ì∞¢–¢”∞†¢6ˆÁ7B'VÂVWVVD6ˆ◊&ó6ˆÁ2“W6T6∆∆&6≤Ü7ñÊ2Çí”‚∞¢6ˆÁ7BVÊFñÊr“6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁBÊfñ«FW"Ü2”‚2Á&W7V«Bì∞¢ñbÇVÊFñÊrÊ∆VÊwFÇí&WGW&„∞¢6WDó5'VÊÊñÊt6ˆ◊&ó6ˆ‚áG'VRì∞¢6WEFñ÷V˜WBÇÇí”‚6ˆ◊&U&VbÊ7W'&VÁCÚÁ67&ˆ∆ƒñÁFıfñWrá≤&VÜfñ˜#¢'6÷ˆ˜FÇ"¬&∆ˆ6≥¢'7F'B"“í¬ì∞†¢6ˆÁ7BF˜F≈&ˆ∆W2“VÊFñÊrÊ∆VÊwFÉ∞¢∆WBv∆ˆ&≈7FW“∞¢6ˆÁ7BF˜F≈7FW2“F˜F≈&ˆ∆W2¢2≤#≤ÚÚ27FW2W"&ˆ∆R≤6&VW"Fá2≤6ˆ◊&ó6ˆ‡†¢ÚÚ”BfóÉ¢&VÊ÷VBg&ˆ“7FWFÚ∆ˆu7FWFÚfˆñB6ÜF˜vñÊrFÜR÷∆WfV¿¢ÚÚ7FW7FFRf&ñ&∆R‚ñÁ6ñFRFÜó26∆∆&6≤¬Áí&VfW&VÊ6RFÚ7FW&Wfñ˜W6«ê¢ÚÚ&W6ˆ«fVBFÚFÜó2∆ˆ6¬gVÊ7Fñˆ‚¬Ê˜BFÜR7FFR‚gWGW&RFWfV∆˜W"FFñÊr¢ÚÚ6ˆÊFóFñˆ‚FÜB6ÜV6∑27FW7FFRñÁ6ñFR'VÂVWVVD6ˆ◊&ó6ˆÁ2v˜V∆B6ñ∆VÁF«ê¢ÚÚ6∆¬FÜó2gVÊ7Fñˆ‚ñÁ7FVB‡¢6ˆÁ7B∆ˆu7FW“Ü◊6rí”‚≤v∆ˆ&≈7FW≤≥≤6WD6ˆ◊&U7FWÜv∆ˆ&≈7FWì≤6WD6ˆ◊&U7FGW2Ü◊6rì≤”∞†¢6ˆÁ7BÊ«ó6TˆÊR“7ñÊ2Ü2¬&ˆ∆TñÊFWÇí”‚∞¢G'í∞¢6ˆÁ7B&ˆ∆T∆&V¬“FıFóF∆T66RÜ2ÁFóF∆Rì∞¢∆WBˆ62¬W66ı&W7V«B“ÁV∆¬¬6∂ñ∆«2“ÁV∆√∞¢ñbÜ2Á˜7FñÊrí∞¢ÚÚc2„#¢VWVVBg&ˆ“◊î6&VW'4gWGW&R˜7FñÊr“FW&ófR6∂ñ∆«2g&ˆ“FÜR∆ó7FñÊr‡¢6ˆÁ7B˜7EFóF∆R“Ü2Á˜7FñÊrÁFóF∆Rí«¬Ü2ÁFóF∆RÁ7∆óBÇ"(	B"ï≥“í«¬2ÁFóF∆S∞¢∆ˆu7FWÜÊ«ó6ñÊrFÜR˜7FñÊrf˜"G∑&ˆ∆T∆&V«“‚‚Êì∞¢ˆ62“≤FóF∆S¢˜7EFóF∆R¬ó66Ù6ˆFS¢""¬ó66Ùw&˜W¢""¬FW67&óFñˆ„¢""”∞¢6∂ñ∆«2“vóBvWE6∂ñ∆«4g&ˆ’˜7FñÊrá˜7EFóF∆R¬2Á˜7FñÊrÁ6∂ñ∆«2«¬µ“¬2Á˜7FñÊrÁFWáB«¬""ì∞¢“V«6R∞¢∆ˆu7FWÜfñÊFñÊrW76VÁFñ¬6∂ñ∆«2f˜"G∑&ˆ∆T∆&V«“‚‚Êì∞¢6ˆÁ7B&W2“vóB6V&6Ñˆ67WFñˆÁ2Ü2ÁFóF∆Rì∞¢6ˆÁ7BWÜ7B“&W2ÊfñÊBá"”‚"ÁFóF∆RÁFÙ∆˜vW$66RÇí””“2ÁFóF∆RÁFÙ∆˜vW$66RÇíì∞¢ˆ62“WÜ7B«¬&W5≥“«¬≤FóF∆S¢2ÁFóF∆R¬ó66Ù6ˆFS¢""¬ó66Ùw&˜W¢""¬FW67&óFñˆ„¢""”∞¢ˆ62ÁFóF∆R“2ÁFóF∆S∞¢ÚÚÉfóÉ¢6÷R∆ˆˆ∑WñÁFW&6WB2FÙÊ«ó6R“6F6ÜW2w&ˆÊrU44Úˆ67WFñˆ‚f˜ ¢ÚÚÊˆ‚÷6ÊˆÊñ6¬FóF∆W2ÜRÊr‚˜&vÊó6FñˆÊ¬FWfV∆˜÷VÁB7V6ñ∆ó7B”‚'W6ñÊW726ˆÁ7V«FÁBê¢6ˆÁ7B6ˆ◊∆ˆˆ∑WÜóB“∆ˆˆ∑W6VÊñ˜$÷v◊BÜˆ62ÁFóF∆Rì∞¢∆WB6ˆ◊W66ÙfWF6ÖFóF∆R“ˆ62ÁFóF∆S∞¢ñbÜ6ˆ◊∆ˆˆ∑WÜóBbb6ˆ◊∆ˆˆ∑WÜóBÁ&W7V«G2bb6ˆ◊∆ˆˆ∑WÜóBÁ&W7V«G2Ê∆VÊwFÇ‚í∞¢6ˆÁ7B&W7B“6ˆ◊∆ˆˆ∑WÜóBÁ&W7V«G5≥”∞¢ˆ62Êó66Ù6ˆFR“&W7BÊó66Ù6ˆFS∞¢ˆ62Êó66Ùw&˜W“&W7BÊó66Ùw&˜W∞¢ˆ62ÊFW67&óFñˆ‚“&W7BÊFW67&óFñˆ„∞¢6ˆ◊W66ÙfWF6ÖFóF∆R“&W7BÁFóF∆S≤ÚÚ6ÊˆÊñ6¬U44ÚFóF∆Rf˜"6∂ñ∆«2fWF6ÇˆÊ«ê¢–¢W66ı&W7V«B“vóBvWDW66ı6∂ñ∆«2Ü6ˆ◊W66ÙfWF6ÖFóF∆Rì∞¢6∂ñ∆«2“W66ı&W7V«BÚW66ı&W7V«BÁ6∂ñ∆«2¢ÁV∆√∞¢ÚÚ”2fóÉ¢W6R6ˆ◊W66ÙfWF6ÖFóF∆Rñ‚f∆∆&6≤FˆÚ“Ê˜BFó7∆íFóF∆P¢ñbá6∂ñ∆«2””“ÁV∆¬í6∂ñ∆«2“vóBvWE6∂ñ∆«2Ü6ˆ◊W66ÙfWF6ÖFóF∆R¬ˆ62Êó66Ùw&˜W«¬""¬ˆ62Êó66Ù6ˆFR«¬""ì∞¢–¢∆ˆu7FWÜ&FñÊrG∑6∂ñ∆«2Ê∆VÊwFá“6∂ñ∆«2f˜"G∑&ˆ∆T∆&V«“vñÁ7Bí‚‚Êì∞¢ÚÚ4ƒR‘#¢6÷Rˆ67WFñˆ‚÷∆WfV¬îÙRWá˜7W&R∆ˆˆ∑W2FÙÊ«ó6Rw2÷ñ‚f∆˜rÖ4ƒR‘í¿¢ÚÚfVBñÁFÚ6∆76ñgï6∂ñ∆ƒ∆WfV¬ÇíñÁ6ñFR&FU6∂ñ∆«46ˆ◊7BÇí2FÜRÜˆÊW7BÁV÷W&ñ2Ê6Ü˜ ¢ÚÚf˜"V6Ç6∂ñ∆¬w2∆WfV¬‚vóFÜÜV∆BÜÁV∆¬ívÜV‚ˆ62Êó66Ù6ˆFRó2VÊfñ∆&∆RÜRÊr‚FÜP¢ÚÚ˜7FñÊr'&Ê6Ç&˜fRÊWfW"&W6ˆ«fW2‚ó66Ù6ˆFRí˜"VÁ66˜&VB“ÊWfW"f∂VB‡¢∆WBˆ64Wá˜7W&R“ÁV∆√∞¢G'í∞¢ñbÜˆ62Êó66Ù6ˆFRí∞¢6ˆÁ7BWá“Wá˜7W&Tf˜$ó66ÚÜˆ62Êó66Ù6ˆFRì∞¢ñbÜWáí∞¢ˆ64Wá˜7W&R“∞¢ñÊFWÉ¢WáÊñÊFWÇ¿¢&ÊC¢WáÊ&ÊB¿¢•&ÊvS¢WáÁ•&ÊvR¿¢6ˆÊfñFVÊ6S¢ÜWáÁ6ˆ75vóFÖ66˜&R””“WáÁ6ˆ72Ê∆VÊwFÇíÚ&ÜñvÇ"¢&÷VFóV“"¿¢”∞¢–¢–¢“6F6ÇÖÚí≤ˆ64Wá˜7W&R“ÁV∆√≤–¢ÚÚW6R6ˆ◊7B&FW"f˜"6ˆ◊&ó6ˆ‚“6∂ó2&ˆ◊B˜&W˜Gvı7FWFÚ&VGV6R∆FVÊ7í„CP¢6ˆÁ7B&FñÊw2“vóB&FU6∂ñ∆«46ˆ◊7BÜˆ62ÁFóF∆R¬6∂ñ∆«2¬ˆ64Wá˜7W&Rì∞¢6ˆÁ7B÷W&vVB“6∂ñ∆«2Ê÷á2”‚∞¢6ˆÁ7B"“&FñÊw2ÊfñÊBáÇ”‚ÇÊ‚””“2Ê‚í«¬∑”∞¢ÚÚÉ"fóÉ¢U44Ú6∂ñ∆≈GóRF∂W2&V6VFVÊ6R˜fW"6∆VFR&FñÊr“6÷R2&ñ÷'í÷W&vP¢ÚÚ4ƒR‘#¢"Ê∆WfV¬ó2FÜRVÊvñÊR÷FV6ñFVB∆WfV¬Ü6∆76ñgï6∂ñ∆ƒ∆WfV¬í¬÷í&RÁV∆¿¢ÚÚávóFÜÜV∆Bí“ÊWfW"6ñ∆VÁF«í6ˆW&6VBFÚf'&ñ6FVB$ÖT‘‚"FVfV«B‡¢&WGW&‚≤„ß2Ê‚¬6∂ñ∆√ß2Á6∂ñ∆¬¬GóSß2ÁGóR¬∆WfV√ß"Ê∆WfV¬ÛÚÁV∆¬¬∆WfVƒ6ˆÊfñFVÊ6Sß"Ê6ˆÊfñFVÊ6W«¬'vóFÜÜV∆B"¬∆WfVƒ&6ó3ß"Ê&6ó7«¬'vóFÜÜV∆B"¬Fˆˆ√ß"ÁFˆˆ««¬$‰"¬Ü˜sß"ÊÜ˜w«¬""¬∂ñ6∑7F'C¢""¬&ˆ◊C¢""¬6∂ñ∆≈GóSß2ÊW66ıW&íÚ2ÁGóR¢á"Á6∂ñ∆≈GóW«¬'FV6ÜÊñ6¬"í¬&W¢""¬Gvı7FW¶f«6R¬&VFñÊW73¢'&VGí"¬W66ıW&ìß2ÊW66ıW&ó«¬""¬W66ÙFW67&óFñˆ„ß2ÊW66ÙFW67&óFñˆÁ«¬""¬&WW6T∆WfV√ß2Á&WW6T∆WfV««¬""¬Ê'&˜vW%6∂ñ∆«3ß2ÊÊ'&˜vW%6∂ñ∆«7«≈µ“¬'&ˆFW$6ˆÊ6WCß2Ê'&ˆFW$6ˆÊ6WG«¬""¬«D∆&V«3ß2Ê«D∆&V«7«≈µ“¬&V∆WfÊ6U66˜&S£”∞¢“ì∞¢∆ˆu7FWÜ÷ñÊr6&VW"Fá2f˜"G∑&ˆ∆T∆&V«“‚‚Êì∞¢ÚÚ6∂ó&ˆw&W76ñˆ‚ˆ7&˜76˜fW"ˆ6ˆÁFWáBñb&ˆ∆R«&VGíÜ2gV∆¬&W7V«BFF¢ÚÚFÜó26fW2Ç”'2W"&ˆ∆RÊB&WfVÁG22◊&ˆ∆RFñ÷V˜WBˆ‚fW&6V¬c2∆ñ÷ó@¢∆WB&ˆw&W76ñˆ‰FF¬7&˜76˜fW$FF¬6ˆÁFWáDFF∞¢ñbÜ2Á&W7V«Bbb2Á&W7V«BÁ&ˆw&W76ñˆ‰FFí∞¢&ˆw&W76ñˆ‰FF“2Á&W7V«BÁ&ˆw&W76ñˆ‰FF∞¢7&˜76˜fW$FF“2Á&W7V«BÊ7&˜76˜fW$FF«¬µ”∞¢6ˆÁFWáDFF“2Á&W7V«BÊ6ˆÁFWáDFF«¬ÁV∆√∞¢“V«6R∞¢∑&ˆw&W76ñˆ‰FF¬7&˜76˜fW$FF¬6ˆÁFWáDFF““vóB&ˆ÷ó6RÊ∆¬Ö∞¢vWE&ˆw&W76ñˆÂFá2Üˆ62ÁFóF∆R¬ˆ62Êó66Ùw&˜Wí¿¢vWD7&˜76˜fW%&ˆ∆W2Üˆ62ÁFóF∆R¬÷W&vVBí¿¢vWE&ˆ∆T6ˆÁFWáBÜˆ62ÁFóF∆R¬÷W&vVB¬ˆ62Êó66Ùw&˜Wí¿¢“ì∞¢–¢ÚÚ4ƒR‘3¢ˆ64Wá˜7W&R6'&ñVBˆ‚FÜR&W7V«B6ÚFÜR&W7ˆÁ6ñ&ñ∆óFñW272&V∆˜rávÜñ6Ä¢ÚÚˆÊ«íÜ2"Á&W7V«B¬Ê˜Bˆ62í6‚&WW6RFÜR4‘R«&VGí÷6ˆ◊WFVBf«VR&FÜW"FÜ‡¢ÚÚ&R÷FW&ófñÊróB˜"wVW76ñÊr“vVÁVñÊRFF¬Ê˜B‚ñÁfVÁFVBfñV∆B‡¢&WGW&‚≤FóF∆S¢2ÁFóF∆R¬&W7V«C¢≤ó66Ùw&˜W¶ˆ62Êó66Ùw&˜W«¬""¬FW67&óFñˆ„¶ˆ62ÊFW67&óFñˆÁ«¬""¬6∂ñ∆«3¶÷W&vVB¬&ˆw&W76ñˆ‰FF¬7&˜76˜fW$FF¬6ˆÁFWáDFF¬W66Ùˆ67WFñˆ„¢W66ı&W7V«BÚW66ı&W7V«BÊW66Ùˆ67WFñˆ‚¢ÁV∆¬¬6˜W&6S¢2Á˜7FñÊrÚ'˜7FñÊr"¢&W66Ú"¬˜7FñÊt÷WF¢2Á˜7FñÊrÚ≤WVñC¶2Á˜7FñÊrÁWVñB¬V◊∆˜ñW#¶2Á˜7FñÊrÊV◊∆˜ñW"¬÷6eW&√¶2Á˜7FñÊrÊ÷6eW&¬“¢ÁV∆¬¬ˆ64Wá˜7W&R“”∞¢“6F6ÇÜRí∞¢&WGW&‚≤FóF∆S¢2ÁFóF∆R¬&W7V«C¢ÁV∆¬”∞¢–¢”∞†¢6ˆÁ7BÊ«ó6UvóFÖWFFR“7ñÊ2Ü2¬&ˆ∆TñÊFWÇí”‚∞¢6ˆÁ7B"“vóBÊ«ó6TˆÊRÜ2¬&ˆ∆TñÊFWÇì∞¢6WD6ˆ◊&ó6ˆÁ2á&Wb”‚∞¢6ˆÁ7BWFFVB“&WbÊ÷á”‡¢ÁFóF∆R””“"ÁFóF∆RÚ≤FóF∆S¢ÁFóF∆R¬&W7V«C¢"Á&W7V«B¬fñ∆VC¢"Á&W7V«B“¢ ¢ì∞¢6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁB“WFFVC∞¢&WGW&‚WFFVC∞¢“ì∞¢ÚÚ&6∂w&˜VÊC¢fñ∆¬FÜR&W7ˆÁ6ñ&ñ∆óFñW2Ê«ó6ó2f˜"FÜó2VWVVB&ˆ∆R6Úó@¢ÚÚ6Ü˜w2Wñ‚FÜR6ˆ◊&R&˜rÜÊˆ‚÷&∆ˆ6∂ñÊr“'VÁ2gFW"FÜR6ˆ◊&ó6ˆ‚&VÊFW'2í‡¢6ˆÁ7B&W7FóF∆R“2Á˜7FñÊrÚÜ2Á˜7FñÊrÁFóF∆R«¬2ÁFóF∆RÁ7∆óBÇ"(	B"ï≥“«¬2ÁFóF∆Rí¢2ÁFóF∆S∞¢ñbá"Á&W7V«BbbÇ2Á&W7V«B«¬2Á&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFíí∞¢'Vñ∆E&W7ˆÁ6ñ&ñ∆óFñW4FFá&W7FóF∆R¬"Á&W7V«BÊW66Ùˆ67WFñˆ‚«¬ÁV∆¬¬"Á&W7V«BÁ6∂ñ∆«2¬"Á&W7V«BÊó66Ùw&˜W¬ÁV∆¬¬VÊFVfñÊVB¬"Á&W7V«BÊˆ64Wá˜7W&Rê¢ÁFÜV‚á&B”‚F6Ñ6ˆ◊&ó6ˆÂ&W7V«BÜ2ÁFóF∆R¬≤&W7ˆÁ6ñ&ñ∆óFñW4FF¢&B“íê¢Ê6F6ÇÇÇí”‚∑“ì∞¢“V«6Rñbá"Á&W7V«Bbb2Á&W7V«Bbb2Á&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFí∞¢F6Ñ6ˆ◊&ó6ˆÂ&W7V«BÜ2ÁFóF∆R¬≤&W7ˆÁ6ñ&ñ∆óFñW4FF¢2Á&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FF“ì∞¢–¢&WGW&‚#∞¢”∞†¢6ˆÁ7B&W7V«G2“µ”∞¢f˜"Ü∆WBí“≤í¬VÊFñÊrÊ∆VÊwFÉ≤í≤≤í∞¢6ˆÁ7B"“vóBÊ«ó6UvóFÖWFFRáVÊFñÊu∂ï“¬íì∞¢&W7V«G2ÁW6Çá"ì∞¢–¢∆ˆu7FWÇ$'Vñ∆FñÊr6ˆ◊&ó6ˆ‚‚‚‚"ì∞¢6WDó5'VÊÊñÊt6ˆ◊&ó6ˆ‚Üf«6Rì∞¢G&6≤Ç&6ˆ◊&ó6ˆÂˆ6ˆ◊∆WFVB"ì∞¢ÚÚ√C¢6ˆ◊&R∆ófW2VÊFW"FÜR˜6óFñˆ‚ñ∆∆#≤ÊfñvFRFÜW&R‡¢6WD7FófUñ∆∆"Ç'˜6óFñˆ‚"ì∞¢6WEFñ÷V˜WBÇÇí”‚F$&%&VbÊ7W'&VÁCÚÁ67&ˆ∆ƒñÁFıfñWrá≤&VÜfñ˜#¢'6÷ˆ˜FÇ"¬&∆ˆ6≥¢'7F'B"“í¬Sì∞¢6Ü˜uFˆ7BÇ$6ˆ◊&ó6ˆ‚&VGí"ì∞¢“¬µ“ì∞†¢6ˆÁ7B'Vñ∆EF'2“á"í”‚∞¢ñbÇ"í&WGW&‚µ”∞¢&WGW&‚∞¢≤∂Wì¢'6∂ñ∆«2"¬∆&V√¢/	˘8≤6∂ñ∆¬Ê«ó6ó2"¬6ˆ∆˜#§2Ê◊WFVB“¿¢‚‚‚Çá"Á&W7ˆÁ6ñ&ñ∆óFñW4FF«¬"Ê¶ˆ$ÊFˆ◊ííÚ∑≤∂Wì¢&FVW&VB"¬∆&V√¢/	˘J¬FVW&VB"¬6ˆ∆˜#¢"3v36VB"’“¢µ“í¿¢‚‚‚Çá"Á&W7ˆÁ6ñ&ñ∆óFñW4FFbb"Á&W7ˆÁ6ñ&ñ∆óFñW4FFÁ&W7ˆÁ6ñ&ñ∆óFñW2bb"Á&W7ˆÁ6ñ&ñ∆óFñW4FFÁ&W7ˆÁ6ñ&ñ∆óFñW2Ê∆VÊwFÇ‚íÚ∑≤∂Wì¢'F6∑&W"¬∆&V√¢/	¯ÍÚF6≤&W"¬6ˆ∆˜#¢"3SsCì"’“¢µ“í¿¢ÚÚ≤∂Wì¢'&VÜV'6R"¬‚‚‚“““&V÷˜fVBÖ√"ê¢ÚÚ≤∂Wì¢&6˜fW&∆WGFW""¬‚‚‚“““&V÷˜fVBÖ√"ê¢‚‚‚Çá"Á&W7ˆÁ6ñ&ñ∆óFñW4FFbb"Á&W7ˆÁ6ñ&ñ∆óFñW4FFÁ&W7ˆÁ6ñ&ñ∆óFñW2bb"Á&W7ˆÁ6ñ&ñ∆óFñW4FFÁ&W7ˆÁ6ñ&ñ∆óFñW2Ê∆VÊwFÇ‚íÚ∑≤∂Wì¢'&W7ˆÁ6ñ&ñ∆óFñW2"¬∆&V√¢/	˘9“&W7ˆÁ6ñ&ñ∆óFñW2"¬6ˆ∆˜#§2ÁW'∆R’“¢µ“í¿¢‚‚‚Çá"Ê¶ˆ$ÊFˆ◊íbb"Ê¶ˆ$ÊFˆ◊íÊf∆∆&6≤bb"Ê¶ˆ$ÊFˆ◊íÊGWFñW2bb"Ê¶ˆ$ÊFˆ◊íÊGWFñW2Ê∆VÊwFÇ‚íÚ∑≤∂Wì¢&¶ˆ&ÊFˆ◊í"¬∆&V√¢/	˙z¬¶ˆ"ÊFˆ◊í"¬6ˆ∆˜#§2Êw&VV‚’“¢µ“í¿¢‚‚‚Çá"Á&ˆ∆T÷óÇbb"Á&ˆ∆T÷óÇÊf∆∆&6≤bb"Á&ˆ∆T÷óÇÊ6ˆ◊ˆÊVÁG2bb"Á&ˆ∆T÷óÇÊ6ˆ◊ˆÊVÁG2Ê∆VÊwFÇ‚íÚ∑≤∂Wì¢'&ˆ∆V÷óÇ"¬∆&V√¢/	˙zí&ˆ∆R‘÷óÇ"¬6ˆ∆˜#§2Ê÷&W"’“¢µ“í¿¢‚‚‚á"Êf˜VÊFFñˆ‰FFÚ∑≤∂Wì¢&f˜VÊFFñˆ‚"¬∆&V√¶G∑6fUW'6ˆÊáW'6ˆÊíÊñ6ˆÁ«¬/	¯È2'“f˜VÊFFñˆ‚6∂ñ∆«6¬6ˆ∆˜#ß6fUW'6ˆÊáW'6ˆÊíÊ6ˆ∆˜'«ƒ2Êw&VV‚’“¢µ“í¿¢≤∂Wì¢'&ˆw&W76ñˆ‚"¬∆&V√¢.*»n˚àÚ6&VW"&ˆw&W76ñˆ‚"¬6ˆ∆˜#¢"3SfF""“¿¢≤∂Wì¢&7&˜76˜fW""¬∆&V√¢/	˘HB&ˆ∆R7&˜76˜fW""¬6ˆ∆˜#§2Êw&VV‚“¿¢≤∂Wì¢&6FVv˜'í"¬∆&V√¢/	˘x"6∂ñ∆¬6FVv˜&ñW2"¬6ˆ∆˜#§2ÁFV¬“¿¢≤∂Wì¢&6ˆÁFWáB"¬∆&V√¢/	¯˙"&ˆ∆R6ˆÁFWáB"¬6ˆ∆˜#¢"3SsCì"“¿¢≤∂Wì¢&6ˆ◊&R"¬∆&V√¢.)©n˚àÚ6ˆ◊&R"¬6ˆ∆˜#¢"3SfF""“¿¢≤∂Wì¢&÷6eˆ¶ˆ'2"¬∆&V√¢/	¯{è	¯z¬4r¶ˆ'2"¬6ˆ∆˜#¢"3SsCì"“¿¢≤∂Wì¢'&ˆ∆Vw&Ç"¬∆&V√¢/	˘[Ç&ˆ∆Rw&Ç"¬6ˆ∆˜#¢"3C33Ü6"“¿¢≤∂Wì¢'vñ∂ñw&Ç"¬∆&V√¢/	¯…6&VW"vñ∂îw&Ç"¬6ˆ∆˜#¢"3SsCì"“¿¢ÚÚ≤∂Wì¢'&W7V÷R"¬∆&V√¢/	˘8B&W7V÷R6ÜV6≤"¬W6VCßG'VR“““&V÷˜fVBÖ√"ê¢”∞¢”∞†¢6ˆÁ7BÜÊF∆U6V&6Ñvñ‚“7ñÊ2ÜÊWuVW'íí”‚∞¢6ˆÁ7BFñGí“FıFóF∆T66RÜÊWuVW'íÁG&ñ“Çíì∞¢ñ6∂W$6Ê6V≈&VbÊ7W'&VÁB“G'VS∞¢6WEVW'íáFñGíì≤6WE7FWÇ'6V&6ÜñÊr"ì≤6WDˆ672Öµ“ì≤6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì∞¢G'í∞¢6ˆÁ7BVñ6≤“vóB6V&6Ñˆ67WFñˆÁ2áFñGí¬#R"ì∞¢ñbÇVñ6≤Ê∆VÊwFÇí≤6WDW'"Ç&ÊÚˆ67WFñˆÁ2f˜VÊB"ì≤6WE7FWÇ&W'&˜""ì≤&WGW&„≤–¢ñbáVñ6≤Ê∆VÊwFÇ””“í≤FÙÊ«ó6RáVñ6µ≥“ì≤&WGW&„≤–¢6ˆÁ7BFVGWVEVñ6≤“Vñ6≤Êfñ«FW"ÇÜÚ¬í¬'"í”‚'"ÊfñÊDñÊFWÇáÇ”‚ÇÁFóF∆RÁFÙ∆˜vW$66RÇí””“ÚÁFóF∆RÁFÙ∆˜vW$66RÇíí””“íì∞¢6WDˆ672ÜFVGWVEVñ6≤ì≤6WE7FWÇ'ñ6∂ñÊr"ì∞¢ñ6∂W$6Ê6V≈&VbÊ7W'&VÁB“f«6S∞¢6ˆÁ7BFÜó46Ê6V¬“ñ6∂W$6Ê6V≈&Vc∞¢6WEñ6∂W$gV∆ƒ∆ˆFñÊráG'VRì∞¢6V&6Ñˆ67WFñˆÁ2áFñGí¬FñGíÁG&ñ“ÇíÁ7∆óBÇı«2≤ÚíÊ∆VÊwFÇ√“Ú#3RFÚC"¢FñGíÁG&ñ“ÇíÁ7∆óBÇı«2≤ÚíÊ∆VÊwFÇ””“"Ú##RFÚ3R"¢#RFÚ#"íÁFÜV‚ÜgV∆¬”‚∞¢ñbáFÜó46Ê6V¬Ê7W'&VÁBí≤6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì≤&WGW&„≤–¢ñbÜgV∆¬Ê∆VÊwFÇ‚Vñ6≤Ê∆VÊwFÇí∞¢6ˆÁ7BB“ÊWr6WBáVñ6≤Ê÷ÜÚ”‚ÚÁFóF∆RÁFÙ∆˜vW$66RÇííì∞¢6WDˆ672Ö≤‚‚ÁVñ6≤¬‚‚ÊgV∆¬Êfñ«FW"ÜÚ”‚BÊÜ2ÜÚÁFóF∆RÁFÙ∆˜vW$66RÇííï“ì∞¢–¢6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì∞¢“íÊ6F6ÇÇÇí”‚≤6WEñ6∂W$gV∆ƒ∆ˆFñÊrÜf«6Rì≤6WEñ6∂W$gV∆ƒW'&˜"áG'VRì≤“ì∞¢“6F6ÇÜRí≤6WDW'"ÜRÊ÷W76vRì≤6WE7FWÇ&W'&˜""ì≤–¢”∞†¢6ˆÁ7BÜÊF∆U6V&6Ñg&ˆ’6∂ñ∆¬“á&ˆ∆Rí”‚∞¢6ˆÁ7BFÙóB“7ñÊ2Çí”‚∞¢6ˆÁ7BFñGï&ˆ∆R“FıFóF∆T66Rá&ˆ∆Rì∞¢6WEVW'íáFñGï&ˆ∆Rì≤6WE7FWÇ'6V&6ÜñÊr"ì≤6WDW'"Ç""ì∞¢G'í∞¢6ˆÁ7B&W2“vóB6V&6Ñˆ67WFñˆÁ2áFñGï&ˆ∆Rì∞¢ñbÇ&W2Ê∆VÊwFÇí≤6WDW'"Ç&ÊÚˆ67WFñˆÁ2f˜VÊB"ì≤6WE7FWÇ&W'&˜""ì≤&WGW&„≤–¢6ˆÁ7BÜ4WÜ7B“&W2Á6ˆ÷Rá"”‚"ÁFóF∆RÁFÙ∆˜vW$66RÇí””“FñGï&ˆ∆RÁFÙ∆˜vW$66RÇíì∞¢6ˆÁ7B∆ó7B“Ü4WÜ7BÚ&W2¢∑≤FóF∆S¢FñGï&ˆ∆R¬ó66Ù6ˆFS¢""¬ó66Ùw&˜W¢""¬FW67&óFñˆ„¢%&ˆ∆RWáG&7FVBg&ˆ“&ˆ◊B7F'FW""¬ó4«D∆&V√¢G'VR“¬‚‚Á&W5”∞¢6WDˆ672Ü∆ó7Bì≤6WE7FWÇ'ñ6∂ñÊr"ì≤vñÊF˜rÁ67&ˆ∆≈FÚá≤F˜£¬&VÜfñ˜#¢'6÷ˆ˜FÇ"“ì∞¢“6F6ÇÜRí≤6WDW'"ÜRÊ÷W76vRì≤6WE7FWÇ&W'&˜""ì≤–¢”∞¢6ˆÊfó&‘ñd6ˆ◊&ñÊrÜFÙóBì∞¢”∞†¢6ˆÁ7BÜÊF∆U&Vg&W6Ö&ˆ◊B“7ñÊ2á6∂ñ∆ƒ‚í”‚∞¢6WE&W7V«Bá&Wb”‚∞¢ñbÇ&Wbí&WGW&‚&Wc∞¢&WGW&‚≤‚‚Á&Wb¬6∂ñ∆«3¢&WbÁ6∂ñ∆«2Ê÷á2”‚2Ê‚””“6∂ñ∆ƒ‚Ú≤‚‚Á2¬&ˆ◊D∆ˆFñÊs¢G'VR¬&ˆ◊Dfñ∆VC¢f«6R“¢2í”∞¢“ì∞¢G'í∞¢6ˆÁ7B6Ê“&W7V«C∞¢6ˆÁ7BF&vWE6∂ñ∆¬“6ÊÚÁ6∂ñ∆«3ÚÊfñÊBá2”‚2Ê‚””“6∂ñ∆ƒ‚ì∞¢ñbÇF&vWE6∂ñ∆¬«¬F&vWE6∂ñ∆¬Ê∆WfV¬””“$ÖT‘‚"í&WGW&„∞¢vóBvVÊW&FU&ˆ◊G2á6V√ÚÁFóF∆R«¬""¬6ÊÁ6∂ñ∆«2¬∑F&vWE6∂ñ∆≈“¬Ü&F6Ö&W7V«G2í”‚∞¢6WE&W7V«Bá&Wb”‚∞¢ñbÇ&Wbí&WGW&‚&Wc∞¢&WGW&‚≤‚‚Á&Wb¬6∂ñ∆«3¢&WbÁ6∂ñ∆«2Ê÷á2”‚∞¢6ˆÁ7BÇ“&F6Ö&W7V«G2ÊfñÊBá”‚Ê‚””“2Ê‚ì∞¢ñbÇÇí&WGW&‚3∞¢&WGW&‚≤‚‚Á2¬&ˆ◊C¢ÇÁ«¬ÇÁ&ˆ◊B«¬""¬&ˆ◊EFV6É¢ÇÁB«¬ÇÁ&ˆ◊EFV6Ç«¬""¬ÊWáEÜ6S¢ÇÊÁÇ«¬ÇÊÊWáEÜ6R«¬""¬&ˆ◊D∆ˆFñÊs¢f«6R”∞¢“í”∞¢“ì∞¢“ì∞¢“6F6ÇÜRí∞¢6WE&W7V«Bá&Wb”‚∞¢ñbÇ&Wbí&WGW&‚&Wc∞¢&WGW&‚≤‚‚Á&Wb¬6∂ñ∆«3¢&WbÁ6∂ñ∆«2Ê÷á2”‚2Ê‚””“6∂ñ∆ƒ‚Ú≤‚‚Á2¬&ˆ◊D∆ˆFñÊs¢f«6R¬&ˆ◊Dfñ∆VC¢&W'&˜""“¢2í”∞¢“ì∞¢–¢”∞†¢ÚÚ√C¢ñ∆∆"6V∆V7Fñˆ‚ÜÊF∆W"“6WG27FófUñ∆∆"ˆÊ«í‡¢ÚÚFÜRF"7G&óó27WW'6VFVB'íFÜRñ∆∆"fñWs≤7FófUF"ó2ÊÚ∆ˆÊvW"W6VBFÚvFP¢ÚÚñ∆∆"◊6V7Fñˆ‚&VÊFW"á&VÊFW%6V7Fñˆ‚wV&G2ˆ‚FF&W6VÊ6RñÁ7FVBí‡¢gVÊ7Fñˆ‚ÜÊF∆Uñ∆∆%6V∆V7BÜ∂Wíí∞¢6WD7FófUñ∆∆"Ü∂Wíì∞¢6WE&W7V«EÊV¬Ç&÷"ì∞¢6WD7FófTÊe6V7Fñˆ‚ÜÁV∆¬ì≤ÚÚ¬‘‰c¢6∆V"6V7Fñˆ‚fˆ7W2vÜV‚ñ∆∆"÷∆WfV¬Êbfó&W0¢6WE6Vv÷VÁEÊVƒ˜V‚Üf«6Rì∞¢G&6≤Ç'ñ∆∆%˜fñWvVB"¬≤ñ∆∆#¢∂Wí“ì∞¢–†¢ÚÚ√C¢'Vñ∆E6∂ñ∆ƒw&˜W2“WáG&7FVBg&ˆ“FÜR6∂ñ∆ƒw&˜WVEfñWrw&˜WVB&˜Ö#c¢Ê¢ÚÚ◊V«Fí÷∆ñÊR'&˜rñ‚•5Ç&˜≤WáG&7BFÚÊ÷VBgVÊ7Fñˆ‚&˜fRFÜR&WGW&‚í‡¢gVÊ7Fñˆ‚'Vñ∆E6∂ñ∆ƒw&˜W2Çí∞¢6ˆÁ7Bw&˜WFVb“∞¢≤∆WfV√¢$ÖT‘‚"¬∆&V√¢$áV÷‚‘∆VB"¬7V#¢%6∂ñ∆«2vÜW&RáV÷‚ßVFvV÷VÁB¬V◊Fáí¬˜"&W6VÊ6R&V÷ñ‚W76VÁFñ¬“ñ˜W"Fó7FñÊ7BGfÁFvR‚"¬6ˆ∆˜#¢"3SCb"¬&s¢"6VVc&fb"¬&˜&FW#¢"63vC&fR"¬ñ6ˆ„¢%«W≥ctSg“"“¿¢≤∆WfV√¢$ƒır"¬∆&V√¢$í‘76ó7FVB"¬7V#¢$í6‚7W˜'BFÜW6R6∂ñ∆«2'WBñ˜R&V÷ñ‚ñ‚6ˆÁG&ˆ¬‚vˆˆB6∂ñ∆«2FÚW6Rí2FÜñÊ∂ñÊr'FÊW"‚"¬6ˆ∆˜#¢"3SsCì"¬&s¢"6V6fVfb"¬&˜&FW#¢"6Vc6f2"¬ñ6ˆ„¢%«W≥cS3W“"“¿¢≤∆WfV√¢$‘TDïT“"¬∆&V√¢$í‘Vv÷VÁFVB"¬7V#¢%FÜW6R6∂ñ∆«2&R6ñvÊñfñ6ÁF«í6ÜVB'ííFˆFí‚VÊFW'7FÊFñÊrFÜRFˆˆ«2vófW2ñ˜R‚VFvR‚"¬6ˆ∆˜#¢"6#CS3í"¬&s¢"6fff&V""¬&˜&FW#¢"6fFScÜ"¬ñ6ˆ„¢%«W≥ctS“"“¿¢≤∆WfV√¢$ÑîtÇ"¬∆&V√¢$gV∆¬WFˆ÷Fñˆ‚"¬7V#¢$‚ívVÁB6‚'V‚FÜó2VÊB◊FÚ÷VÊBFˆFí“ñ˜R&WfñWrFÜR˜WF6ˆ÷R¬Ê˜BV6Ç7FW‚∂Ê˜vñÊrFÜó2ÜV«2ñ˜Rfˆ7W2ñ˜W"VÊW&wívó6V«í‚"¬6ˆ∆˜#¢"6Cìssb"¬&s¢"6ffcvVB"¬&˜&FW#¢"6fVCv"¬ñ6ˆ„¢%«W≥ctSw“"“¿¢ÚÚ4ƒR‘¢vóFÜÜV∆B6∂ñ∆«2Ü6∆76ñgï6∂ñ∆ƒ∆WfV¬f˜VÊBÊÚˆ67WFñˆ‚Wá˜7W&RÊBÊÚU44¢ÚÚ6ñvÊ¬í“6Ü˜v‚ÜˆÊW7F«í¬ÊWfW"fˆ∆FVBñÁFÚf'&ñ6FVB&ÊB‡¢≤∆WfV√¶ÁV∆¬¬∆&V√¢$Ê˜B6∆76ñfñVB"¬7V#¢$ÊÚˆ67WFñˆ‚÷Wá˜7W&R˜"6∂ñ∆¬6ñvÊ¬v2fñ∆&∆RFÚW7Fñ÷FRFÜó2ˆÊR“6Ü˜v‚2÷ó2&FÜW"FÜ‚wVW76VB‚"¬6ˆ∆˜#¢"3V#cÉsÇ"¬&s¢"6cVcvf"¬&˜&FW#¢"6FFS6V2"¬ñ6ˆ„¢%«W≥#d“"“¿¢”∞¢&WGW&‚w&˜WFVbÊ÷Ür”‚á≤‚‚Êr¬6∂ñ∆«3¢á&W7V«BÁ6∂ñ∆«7«≈µ“íÊfñ«FW"á2”‚2Ê∆WfV¬””“rÊ∆WfV¬í“ííÊfñ«FW"Ür”‚rÁ6∂ñ∆«2Ê∆VÊwFÇ‚ì∞¢–†¢ÚÚ√C¢&VÊFW%6V7Fñˆ‚Ü∂Wíí“&WGW&Á2FÜR•5Çf˜"6ñÊv∆R&W7V«B6V7Fñˆ‚'íF"∂Wí‡¢ÚÚwV&G2ˆ‚FF&W6VÊ6R÷ó'&˜"FÜR6ˆÊFóFñˆÁ2ñ‚'Vñ∆EF'26Ú'6VÁBFF&VÊFW'2Ê˜FÜñÊr‡¢ÚÚFÜRÊV«2&R‘ıdTBÜW&RVÊ6ÜÊvVB“ÊÚñÁFW&Ê¬VFóB¬&˜b6Üó2ñÁF7BÖ√"∆VFvW"í‡¢ÚÚ#c¢FÜó2ó2Ê÷VBgVÊ7Fñˆ‚¬Ê˜B◊V«Fí÷∆ñÊR'&˜rñ‚•5Ç&˜‡¢gVÊ7Fñˆ‚&VÊFW%6V7Fñˆ‚Ü∂Wíí∞¢ñbÇ&W7V«Bí&WGW&‚ÁV∆√∞¢ñbÜ∂Wí””“'VÊFW'7FÊB◊3"í∞¢ÚÚ√S¢VÊFW'7FÊB6V7Fñˆ‚“'váíFÜR˜&vÊó6Fñˆ‚vÁG2FÜó2&ˆ∆R"‡¢ÚÚ&VÊFW'3¢&ˆ∆R6ˆÁFWáBFW'F÷VÁB&VB≤5ï5DT’ıtÖïı$ÙƒRÊ'&Fñˆ‚á‚íW7Fñ÷FRê¢ÚÚ≤f˜&VÁ6ñ5&WfW'6¬7'WÇ&VBÜ÷˜fVBg&ˆ“FVW&VBÙ&V6ˆ÷S≤&˜c¢FW&ófVBí‡¢ÚÚwV&C¢&WVó&W2&W7ˆÁ6ñ&ñ∆óFñW4FF˜"6ˆÁFWáDFFFÚÜfR6ˆÁFVÁB‡¢ñbÇ&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFbb&W7V«BÊ6ˆÁFWáDFFí&WGW&‚ÁV∆√∞¢&WGW&‚≈VÊFW'7FÊE6V7Fñˆ„∂Wì“'VÊFW'7FÊB◊3"&W7V«C◊∑&W7V«G“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“Û„∞¢–¢ñbÜ∂Wí””“'VÊFW'7FÊB÷«6Ú"í∞¢ÚÚ√É¢«6ÙGfW'Fó6VD2“%6÷R¶ˆ"¬˜FÜW"Ê÷W2"6ñ&∆ñÊrFóF∆W2‡¢ÚÚ÷˜fVBg&ˆ“«vó2÷ˆ‚ÜW&ÚFÚVÊFW'7FÊBá&ˆ∆RñFVÁFóGíí‚ˆ‰Ê«ó6Rvó&ñÊrVÊ6ÜÊvVB‡¢ÚÚ6V∆b÷wV&G2vÜV‚ÊÚ6ñ&∆ñÊrFFó2&W6VÁBÑ«6ÙGfW'Fó6VD2&WGW&Á2ÁV∆¬ñÁFW&Ê∆«íí‡¢&WGW&‚ƒ«6ÙGfW'Fó6VD2∂Wì“'VÊFW'7FÊB÷«6Ú"&W7V«C◊∑&W7V«G“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“ˆ‰Ê«ó6S◊≤áBí”‚ÜÊF∆TÊ«ó6U&ˆ∆RáB¬&∆ñ2"ó“Û„∞¢–¢ñbÜ∂Wí””“&í÷ÜW&Ú"í∞¢ÚÚ√É¢í&VFñÊW72ÜW&Ú“VÊvñÊTÜVF∆ñÊR≤Wá˜7W&T&"≤6∂ñ∆≈6Vv÷VÁG2≤vVÁFñ56ÜñgB‡¢ÚÚ÷˜fVBg&ˆ“«vó2÷ˆ‚ÜW&Ú&Vvñˆ‚ÑVÊvñÊTÜVF∆ñÊRÙWá˜7W&T&"ı6∂ñ∆≈6Vv÷VÁG2íÊBg&ˆ–¢ÚÚFÜR6∂ñ∆«2&VÊFW%6V7Fñˆ‚ÑvVÁFñ56ÜñgBí‚&VÊFW'2Ù‰≈íVÊFW"í&VFñÊW72ñ∆∆"‡¢ÚÚ&˜b6Üó2VÊ6ÜÊvVC¢VÊvñÊTÜVF∆ñÊR“6ˆ◊WFVB¬Wá˜7W&T&"“íW7Fñ÷FR‡¢ÚÚ#c¢ÜÊF∆TîÜW&ı6∂ñ∆ƒ6∆ñ6≤WáG&7FVB2Ê÷VBgVÊ7Fñˆ‚ÜÊ˜B◊V«Fí÷∆ñÊR'&˜p¢ÚÚñ‚•5Ç&˜í6ÚóB6Fó6fñW2FÜR#bÊÚ÷◊V«Fí÷∆ñÊR÷7ñÊ2÷'&˜r÷ñ‚‘•5Ç◊&˜'V∆R‡¢gVÊ7Fñˆ‚ÜÊF∆TîÜW&ı6∂ñ∆ƒ6∆ñ6≤á6∂ñ∆ƒÊ÷Rí∞¢6WDßV◊Fı6∂ñ∆¬á6∂ñ∆ƒÊ÷Rì∞¢6WD7FófUñ∆∆"Ç&í◊&VFñÊW72"ì≤ÚÚ«&VGíFÜR7FófRñ∆∆"¬'WB∂VW2FÜR6ˆÁG&7@¢6WE6Vv÷VÁEÊVƒ˜V‚Üf«6Rì∞¢6WEFñ÷V˜WBÇÇí”‚∞¢6ˆÁ7BV¬“Fˆ7V÷VÁBÊvWDV∆V÷VÁD'îñBÜ6∂ñ∆¬“G∑6∂ñ∆ƒÊ÷RÁ&W∆6RÇı«2≤ˆr¬"“"íÁFÙ∆˜vW$66RÇó÷ì∞¢ñbÜV¬íV¬Á67&ˆ∆ƒñÁFıfñWrá≤&VÜfñ˜#¢'6÷ˆ˜FÇ"¬&∆ˆ6≥¢'7F'B"“ì∞¢“¬CSì∞¢–¢&WGW&‚Ä¢∆Fób∂Wì“&í÷ÜW&Ú#‡¢ƒVÊvñÊTÜVF∆ñÊR&W7V«C◊∑&W7V«G“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“Û‡¢ƒWá˜7W&T&"6∂ñ∆«3◊∑&W7V«BÁ6∂ñ∆«7“Û‡¢≈6∂ñ∆≈6Vv÷VÁG0¢6∂ñ∆«3◊∑&W7V«BÁ6∂ñ∆«7–¢Ü4ÊÙáV÷„◊∑&W7V«BÁ6∂ñ∆«2ÊWfW'íá2”‚2Ê∆WfV¬”“$ÖT‘‚"ó–¢ó4˜V„◊∑6Vv÷VÁEÊVƒ˜VÁ–¢ˆÂFˆvv∆S◊≤Çí”‚6WE6Vv÷VÁEÊVƒ˜V‚á”‚ó–¢fó'7D&∆ñÊµ6∂ñ∆√◊∂fó'7D&∆ñÊµ6∂ñ∆«–¢ˆÂ6∂ñ∆ƒ6∆ñ6≥◊∂ÜÊF∆TîÜW&ı6∂ñ∆ƒ6∆ñ6∑–¢Û‡¢ƒvVÁFñ56ÜñgB&W7V«C◊∑&W7V«G“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“Û‡¢¬ˆFóc‡¢ì∞¢–¢ñbÜ∂Wí””“&í÷ÊFˆ◊í"í∞¢ÚÚ5ƒïC¢í◊&W6ñ∆ñVÊ6R66˜&R≤WFˆ÷F&ñ∆óGí≤G&¶V7F˜'ì'íg&ˆ“¶ˆ"ÊFˆ◊í¿¢ÚÚ&VÊFW&VBFó&V7F«íVÊFW"FÜRWá˜7W&RñÊFWÇñ‚í&VFñÊW72‚FÜRWá˜7W&RñÊFWÄ¢ÚÚÜí÷ÜW&Ú&˜fRí6Ü˜w2Ü˜rf"í&V6ÜW2FÜRˆ67WFñˆ‚6∆73≤FÜR&W6ñ∆ñVÊ6P¢ÚÚ66˜&RÜW&R6Ü˜w2Ü˜r◊V6ÇFÜR7V6ñfñ2GWFñW2&W6ó7BóB“6ˆ◊∆V÷VÁF'ífñWw2¿¢ÚÚÊ˜BFÜR6÷RÁV÷&W"‚v˜&≤÷∆ñW"7G'V7GW&¬fñWr&V÷ñÁ2ñ‚VÊFW'7FÊBÇ&¶ˆ&ÊFˆ◊í"í‡¢ñbÇ&W7V«BÊ¶ˆ$ÊFˆ◊í«¬&W7V«BÊ¶ˆ$ÊFˆ◊íÊf∆∆&6≤í&WGW&‚ÁV∆√∞¢ñbÇ&W7V«BÊ¶ˆ$ÊFˆ◊íÊGWFñW2«¬&W7V«BÊ¶ˆ$ÊFˆ◊íÊGWFñW2Ê∆VÊwFÇ””“í&WGW&‚ÁV∆√∞¢&WGW&‚Ä¢∆Fób∂Wì“&í÷ÊFˆ◊í#‡¢«7Gñ∆S◊∑≤÷&vñ„¢#Ç"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#§2ÁFWáE7V"¬∆ñÊTÜVñváC£„b◊”‰Wá˜7W&RÜ&˜fRíó2Ü˜rf"í&V6ÜW2FÜó2ˆ67WFñˆ„≤&W6ñ∆ñVÊ6Ró2Ü˜r◊V6ÇFÜW6R7V6ñfñ2GWFñW2&W6ó7BóB“6ˆ◊∆V÷VÁF'ífñWw2¬Ê˜BFÜR6÷RÁV÷&W"„¬˜‡¢ƒ¶ˆ$ÊFˆ◊ïfñWrÊFˆ◊ì◊∑&W7V«BÊ¶ˆ$ÊFˆ◊ó“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“fñWs“&ó&ó6≤"Û‡¢¬ˆFóc‡¢ì∞¢–¢ñbÜ∂Wí””“'6∂ñ∆«2"í∞¢ÚÚ√É¢vVÁFñ56ÜñgB÷˜fVBFÚí÷ÜW&ÚÜ&˜fRì≤óBó2‚í◊&VFñÊW72&VB¬Ê˜B¢ÚÚW"◊6∂ñ∆¬FWFñ¬‚µ√Ö“vVÁFñ56ÜñgB““÷˜fVBFÚí÷ÜW&Ú&VÊFW%6V7Fñˆ‚'&Ê6Ç‡¢&WGW&‚Ä¢∆Fób∂Wì“'6∂ñ∆«2#‡¢≈6∂ñ∆ƒw&˜WVEfñWp¢w&˜WVC◊∂'Vñ∆E6∂ñ∆ƒw&˜W2Çó–¢&W7V«C◊∑&W7V«G–¢ˆÂ6V&6É◊∂ÜÊF∆U6V&6Ñg&ˆ’6∂ñ∆«–¢6∂ñ∆ƒñÁWE&W7V«C◊∑6∂ñ∆ƒñÁWE&W7V«G–¢6∂ñ∆ƒñÁWEVW'ì◊∑6∂ñ∆ƒñÁWEVW'ó–¢ˆÂ6∂ñ∆≈6V&6É◊∂ÜÊF∆U6∂ñ∆≈6V&6á–¢ˆÂ6∂ñ∆≈VW'î6ÜÊvS◊∑6WE6∂ñ∆ƒñÁWEVW'ó–¢fó'7DÊ«ó6ó3◊≤Ü4Ê«ó6VDˆÊ6RÊ7W'&VÁG–¢ˆÂVWVS◊∂ÜÊF∆UVWVU&ˆ∆W–¢VWVT6˜VÁC◊∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFÇ≤Ü6ˆ◊&ó6ˆÁ2ÊfñÊBÜ2”‚2ÁFóF∆R””“FıFóF∆T66Rá6V√ÚÁFóF∆W«¬""ííÚ¢ó–¢7W'&VÁE&ˆ∆S◊∑6V√ÚÁFóF∆R«¬"'–¢ßV◊Fı6∂ñ∆√◊∂ßV◊Fı6∂ñ∆«–¢ˆ‰ßV◊ÜÊF∆VC◊≤Çí”‚6WDßV◊Fı6∂ñ∆¬ÜÁV∆¬ó–¢fó'7D&∆ñÊµ6∂ñ∆√◊∂fó'7D&∆ñÊµ6∂ñ∆«–¢ˆÂ&Vg&W6Ö&ˆ◊C◊∂ÜÊF∆U&Vg&W6Ö&ˆ◊G–¢Û‡¢¬ˆFóc‡¢ì∞¢–¢ñbÜ∂Wí””“'˜6óFñˆ‚÷÷&∂WB"í∞¢ÚÚ√c¢÷&∂WBˆV◊∆˜ñW"&VG2V∆∆VBg&ˆ“FVW&VBÊB∆6VBVÊFW"˜6óFñˆ‚‡¢ÚÚ%vÜW&RFÜR&ˆ∆R6óG2ñ‚FÜR÷&∂WB"ñÊ6«VFW2ó2◊FÜR÷FV÷ÊB◊&V¬ÊBó2◊FÜR÷V◊∆˜ñW"◊&V¬‡¢ÚÚV6Ç6ˆ◊ˆÊVÁB6V∆b÷wV&G2á&WGW&Á2ÁV∆¬ívÜV‚‘4bFFó2'6VÁB‡¢ñbÇ&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFí&WGW&‚ÁV∆√∞¢&WGW&‚Ä¢∆Fób∂Wì“'˜6óFñˆ‚÷÷&∂WB#‡¢«7Gñ∆S◊∑≤÷&vñ„¢#'Ç"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#§2ÁFWáE7V"¬∆ñÊTÜVñváC£„b◊”‰÷&∂WBÊBV◊∆˜ñW"&VG2“ó2FÜRFV÷ÊB&V¬¬ó2FÜRBfó"¬ÊBó2FÜRV◊∆˜ñW"vÜBóB6VV◊3ÚV6ÇÊV¬˜VÁ2ˆ‚F≤V6Ç6'&ñW2óG2˜v‚6˜W&6R&FvR„¬˜‡¢ƒFV÷ÊE&ˆˆb&W7V«C◊∑&W7V«G“Û‡¢ƒD∆ÊwVvU66‚&W7V«C◊∑&W7V«G“Û‡¢ƒV◊∆˜ñW%&V∆óGí&W7V«C◊∑&W7V«G“Û‡¢ƒ6ˆ◊Áî&6∂w&˜VÊB&W7V«C◊∑&W7V«G“Û‡¢¬ˆFóc‡¢ì∞¢–¢ñbÜ∂Wí””“&FVW&VB"í∞¢ñbÇá&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FF«¬&W7V«BÊ¶ˆ$ÊFˆ◊ííí&WGW&‚ÁV∆√∞¢&WGW&‚Ä¢∆Fób∂Wì“&FVW&VB#‡¢≤Ú¢√S¢f˜&VÁ6ñ5&WfW'6¬÷˜fVBFÚVÊFW'7FÊB6V7Fñˆ‚áVÊFW'7FÊB◊3í‚¢˜–¢≤Ú¢√c¢FV÷ÊE&ˆˆbÙD∆ÊwVvU66‚ÙV◊∆˜ñW%&V∆óGíÙ6ˆ◊Áî&6∂w&˜VÊB÷˜fVBFÚ˜6óFñˆ‚á˜6óFñˆ‚÷÷&∂WBí‚¢˜–¢≤Ú¢7FWv&G6Üó&VG27FíÜW&RVÊFW"&V6ˆ÷R‚¢˜–¢«7Gñ∆S◊∑≤÷&vñ„¢#'Ç"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#§2ÁFWáE7V"¬∆ñÊTÜVñváC£„b◊”ÂFÜR7FWv&G6Üó&VG2ˆbFÜó2&ˆ∆R“vÜÚóBó2Üó&VBFÚ&R¬ÊBvÜBFÜR7&gBFV÷ÊG2‚V6ÇÊV¬˜VÁ2ˆ‚F≤V6Ç6'&ñW2óG2˜v‚6˜W&6R&FvR„¬˜‡¢≈7G&FVwï&VB&W7V«C◊∑&W7V«G“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“Û‡¢ƒ&Fe7FWv&G6Üó&W7V«C◊∑&W7V«G“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“Û‡¢≈7FWv&G6Üó6ÜñgB&W7V«C◊∑&W7V«G“Û‡¢≈7FWv&G5&Üó2&W7V«C◊∑&W7V«G“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“Û‡¢¬ˆFóc‡¢ì∞¢–¢ñbÜ∂Wí””“'F6∑&W"í∞¢ñbÇ&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFí&WGW&‚ÁV∆√∞¢ñbÇá&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFÁ&W7ˆÁ6ñ&ñ∆óFñW2bb&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFÁ&W7ˆÁ6ñ&ñ∆óFñW2Ê∆VÊwFÇ‚íí&WGW&‚ÁV∆√∞¢&WGW&‚≈F6µ&W∂Wì“'F6∑&W"&W7V«C◊∑&W7V«G“Û„∞¢–¢ñbÜ∂Wí””“'&W7ˆÁ6ñ&ñ∆óFñW2"í∞¢ñbÇ&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFí&WGW&‚ÁV∆√∞¢ñbÇá&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFÁ&W7ˆÁ6ñ&ñ∆óFñW2bb&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FFÁ&W7ˆÁ6ñ&ñ∆óFñW2Ê∆VÊwFÇ‚íí&WGW&‚ÁV∆√∞¢&WGW&‚≈&W7ˆÁ6ñ&ñ∆óFñW5ÊV¬∂Wì“'&W7ˆÁ6ñ&ñ∆óFñW2"FF◊∑&W7V«BÁ&W7ˆÁ6ñ&ñ∆óFñW4FF“6∂ñ∆«3◊∑&W7V«BÁ6∂ñ∆«7“W'6ˆÊ◊∑W'6ˆÊ“fó'7DÊ«ó6ó3◊≤Ü4Ê«ó6VDˆÊ6RÊ7W'&VÁG“Û„∞¢–¢ñbÜ∂Wí””“&¶ˆ&ÊFˆ◊í"í∞¢ÚÚ5ƒïC¢7G'V7GW&RfñWrˆÊ«í“v˜&≤÷∆ñW"÷óÇ≤˜&r÷6ˆÁFWáB≤Ê'&FófR≤GWFñW2‡¢ÚÚí◊&W6ñ∆ñVÊ6R66˜&RÚWFˆ÷F&ñ∆óGíÚG&¶V7F˜'í÷˜fVBFÚí&VFñÊW72Ç&í÷ÊFˆ◊í"í‡¢ñbÇ&W7V«BÊ¶ˆ$ÊFˆ◊í«¬&W7V«BÊ¶ˆ$ÊFˆ◊íÊf∆∆&6≤í&WGW&‚ÁV∆√∞¢ñbÇ&W7V«BÊ¶ˆ$ÊFˆ◊íÊGWFñW2«¬&W7V«BÊ¶ˆ$ÊFˆ◊íÊGWFñW2Ê∆VÊwFÇ””“í&WGW&‚ÁV∆√∞¢&WGW&‚ƒ¶ˆ$ÊFˆ◊ïfñWr∂Wì“&¶ˆ&ÊFˆ◊í"ÊFˆ◊ì◊∑&W7V«BÊ¶ˆ$ÊFˆ◊ó“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“fñWs“'7G'V7GW&R"Û„∞¢–¢ñbÜ∂Wí””“'&ˆ∆V÷óÇ"í∞¢ñbÇ&W7V«BÁ&ˆ∆T÷óÇ«¬&W7V«BÁ&ˆ∆T÷óÇÊf∆∆&6≤«¬&W7V«BÁ&ˆ∆T÷óÇÊ6ˆ◊ˆÊVÁG2«¬&W7V«BÁ&ˆ∆T÷óÇÊ6ˆ◊ˆÊVÁG2Ê∆VÊwFÇ””“í&WGW&‚ÁV∆√∞¢&WGW&‚Ä¢∆Fób∂Wì“'&ˆ∆V÷óÇ#‡¢≈&ˆ∆T÷óÖÊV¬&ˆ∆T÷óÉ◊∑&W7V«BÁ&ˆ∆T÷óá“6∂ñ∆«3◊∑&W7V«BÁ6∂ñ∆«7“˜7FñÊt÷WF◊∑&W7V«BÁ˜7FñÊt÷WF“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“Û‡¢≈v˜&¥÷ˆFT÷óÇ&W7V«C◊∑&W7V«G“Û‡¢¬ˆFóc‡¢ì∞¢–¢ñbÜ∂Wí””“&f˜VÊFFñˆ‚"í∞¢ñbÇ&W7V«BÊf˜VÊFFñˆ‰FFí&WGW&‚ÁV∆√∞¢&WGW&‚ƒf˜VÊFFñˆÂÊV¬∂Wì“&f˜VÊFFñˆ‚"FF◊∑&W7V«BÊf˜VÊFFñˆ‰FF“W'6ˆÊ◊∑W'6ˆÊ“Û„∞¢–¢ñbÜ∂Wí””“'&ˆw&W76ñˆ‚"í∞¢ñbÇ&W7V«BÁ&ˆw&W76ñˆ‰FFí&WGW&‚ÁV∆√∞¢&WGW&‚≈&ˆw&W76ñˆÂÊV¬∂Wì“'&ˆw&W76ñˆ‚"óFV◊3◊∑&W7V«BÁ&ˆw&W76ñˆ‰FF“6∂ñ∆«3◊∑&W7V«BÁ6∂ñ∆«7“ˆ‰Ê«ó6S◊≤á"í”‚ÜÊF∆TÊ«ó6U&ˆ∆Rá"¬'&ˆw&W76ñˆ‚"ó“ˆÂVWVS◊∂ÜÊF∆UVWVU&ˆ∆W“ˆÂVWVT6˜VÁC◊∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFÇ≤Ü6ˆ◊&ó6ˆÁ2ÊfñÊBÜ2”‚2ÁFóF∆R””“FıFóF∆T66Rá6V√ÚÁFóF∆W«¬""ííÚ¢ó“fó'7DÊ«ó6ó3◊≤Ü4Ê«ó6VDˆÊ6RÊ7W'&VÁG“Û„∞¢–¢ñbÜ∂Wí””“&7&˜76˜fW""í∞¢ñbÇ&W7V«BÊ7&˜76˜fW$FFí&WGW&‚ÁV∆√∞¢&WGW&‚ƒ7&˜76˜fW%ÊV¬∂Wì“&7&˜76˜fW""óFV◊3◊∑&W7V«BÊ7&˜76˜fW$FF“6∂ñ∆«3◊∑&W7V«BÁ6∂ñ∆«7“ˆ‰Ê«ó6S◊≤á"í”‚ÜÊF∆TÊ«ó6U&ˆ∆Rá"¬&7&˜76˜fW""ó“ˆÂVWVS◊∂ÜÊF∆UVWVU&ˆ∆W“ˆÂVWVT6˜VÁC◊∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFÇ≤Ü6ˆ◊&ó6ˆÁ2ÊfñÊBÜ2”‚2ÁFóF∆R””“FıFóF∆T66Rá6V√ÚÁFóF∆W«¬""ííÚ¢ó“fó'7DÊ«ó6ó3◊≤Ü4Ê«ó6VDˆÊ6RÊ7W'&VÁG“Û„∞¢–¢ñbÜ∂Wí””“&6FVv˜'í"í∞¢&WGW&‚ƒ6FVv˜'ïÊV¬∂Wì“&6FVv˜'í"6∂ñ∆«3◊∑&W7V«BÁ6∂ñ∆«7“Û„∞¢–¢ñbÜ∂Wí””“&6ˆÁFWáB"í∞¢ñbÇ&W7V«BÊ6ˆÁFWáDFFí&WGW&‚ÁV∆√∞¢&WGW&‚≈&ˆ∆T6ˆÁFWáEÊV¬∂Wì“&6ˆÁFWáB"FF◊∑&W7V«BÊ6ˆÁFWáDFF“6∂ñ∆«3◊∑&W7V«BÁ6∂ñ∆«7“fó'7DÊ«ó6ó3◊≤Ü4Ê«ó6VDˆÊ6RÊ7W'&VÁG“Û„∞¢–¢ñbÜ∂Wí””“&6ˆ◊&R"í∞¢6ˆÁ7B&VGî6ˆ◊2“6ˆ◊&ó6ˆÁ2Êfñ«FW"Ü2”‚2Á&W7V«Bbb2Á&W7V«BÁ6∂ñ∆«2ì∞¢&WGW&‚Ä¢∆Fób∂Wì“&6ˆ◊&R#‡¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC§2Á7W&f6R¬&˜&FW#¶Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3£¬FFñÊs¢#gÇáÇ"¬÷&vñ‰&˜GFˆ”£b◊”‡¢∆É"6∆74Ê÷S“'B÷ÜVFñÊr"7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„#W&V“"¬fˆÁEvVñváC£É¬6ˆ∆˜#§2ÁFWáB◊”‰6ˆ◊&S¬ˆÉ#‡¢¬ˆFóc‡¢∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFÇ¬"ÚÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC§2Á7W&f6R¬&˜&FW#¶Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3£¬FFñÊs¢#3'Ç#Ç"¬FWáD∆ñv„¢&6VÁFW""◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#&V“"¬6ˆ∆˜#§2ÁFWáE7V"◊”Âñ˜RÊVVBB∆V7B"&ˆ∆W2FÚ6ˆ◊&R„¬˜‡¢«7Gñ∆S◊∑≤÷&vñ„£¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#§2Ê◊WFVB◊”ÂW6RFÜR«7G&ˆÊs‚≤FBFÜó2&ˆ∆S¬˜7G&ˆÊs‚'WGFˆ‚˜"F«7G&ˆÊs‚≤6ˆ◊&S¬˜7G&ˆÊs‚ˆ‚Áí6&VW"FÇ6&B„¬˜‡¢¬ˆFóc‡¢í¢ó5'VÊÊñÊt6ˆ◊&ó6ˆ‚ÚÄ¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC¢"6ccñfb"¬&˜&FW#¢#Ç6ˆ∆ñB6&SffB"¬&˜&FW%&FóW3£¬FFñÊs¢#3'Ç#Ç"¬FWáD∆ñv„¢&6VÁFW""◊”‡¢ƒñÊ∆ñÊU7ñÊÊW"6ó¶S◊≥3g“FÜñ6∂ÊW73◊≥7“6ˆ∆˜#“"3SfF""G&6¥6ˆ∆˜#“"6&SffB"7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñ„¢#WFÚGÇ"◊“Û‡¢«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC£s¬6ˆ∆˜#¢"33cñ"◊”‰'Vñ∆FñÊr6ˆ◊&ó6ˆ„¬˜‡¢«7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#¢"33cñ"¬∆ñÊTÜVñváC£„R¬÷ñ‰ÜVñváC£#◊”Á∂6ˆ◊&U7FGW7”¬˜‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢&6VÁFW""¬v£¬÷&vñ„¢#gÇ"◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#§2Ê◊WFVB◊”Â7FW∂6ˆ◊&U7FW“ˆb∂6ˆ◊&ó6ˆÁ2Êfñ«FW"Ü3”‚2Á&W7V«BíÊ∆VÊwFÇ¢2≤'”¬˜7„‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„cÉsW&V“"¬fˆÁEvVñváC£s¬6ˆ∆˜#¢"33cñ"¬&6∂w&˜VÊC¢"6SÜcfR"¬&˜&FW%&FóW3£b¬FFñÊs¢#'ÇÇ"¬fˆÁEf&ñÁDÁV÷W&ñ3¢'F'V∆"÷ÁV◊2"¬f∆WÖ6á&ñÊ≥£◊”‡¢¥÷FÇÊf∆ˆ˜"Ü6ˆ◊&TV∆6VBÛcó”ßµ7G&ñÊrÜ6ˆ◊&TV∆6VBScíÁE7F'BÉ"¬#"ó–¢¬˜7„‡¢¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬v£Ç¬ßW7Fñgî6ˆÁFVÁC¢&6VÁFW""¬f∆WÖw&¢'w&"¬÷&vñ‰&˜GFˆ”£"◊”‡¢∂6ˆ◊&ó6ˆÁ2Ê÷ÇÜ2¬íí”‚Ä¢«7‚∂Wì◊∂ó“7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢2Á&W7V«BÚ"3SCb"¢"33cñ"¬&6∂w&˜VÊC¢2Á&W7V«BÚ"6VVc&fb"¢"6SÜcfR"¬&˜&FW#¶Ç6ˆ∆ñBG∂2Á&W7V«BÚ"63vC&fR"¢"6&SffB'÷¬&˜&FW%&FóW3¢¬FFñÊs¢#GÇ'Ç"¬Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v£b◊”‡¢∂2Á&W7V«BÚ«7‚7Gñ∆S◊∑≤6ˆ∆˜#¢"3SCb"¬fˆÁEvVñváC£s◊”‚b7É#s3≥¬˜7„‚¢ƒñÊ∆ñÊU7ñÊÊW"6ó¶S◊≥ó“FÜñ6∂ÊW73◊≥„W“6ˆ∆˜#“"33cñ"G&6¥6ˆ∆˜#“"6&SffB"ÛÁ–¢«7‚7Gñ∆S◊∑≤fˆÁEvVñváC¢2Á&W7V«BÚc¢C◊”Á∂2ÁFóF∆W”¬˜7„‡¢¬˜7„‡¢íó–¢¬ˆFóc‡¢∂6ˆ◊&ó6ˆÁ2Á6ˆ÷RÜ2”‚2Á&W7V«BíbbÄ¢«7Gñ∆S◊∑≤÷&vñ„£¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#¢"3SCb"¬fˆÁEvVñváC£c◊”Á∂6ˆ◊&ó6ˆÁ2Êfñ«FW"Ü2”‚2Á&W7V«BíÊ∆VÊwFá“ˆb∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFá“&VGì¬˜‡¢ó–¢¬ˆFóc‡¢í¢&VGî6ˆ◊2Ê∆VÊwFÇ„“"ÚÄ¢ƒ6ˆ◊&ó6ˆÂÊV¿¢6ˆ◊&ó6ˆÁ3◊∂6ˆ◊&ó6ˆÁ7–¢ˆÂ&V÷˜fS◊∑&V÷˜fTg&ˆ‘6ˆ◊&ó6ˆÁ–¢ˆ‰Ê«ó6S◊∂ÜÊF∆TÊ«ó6U&ˆ∆W–¢7W'&VÁEFóF∆S◊∑FıFóF∆T66Rá6V√ÚÁFóF∆R«¬""ó–¢ˆ‰FEFÜó&C◊≤Çí”‚∞¢6ˆÁ7B7W'&VÁEFóF∆R“FıFóF∆T66Rá6V√ÚÁFóF∆R«¬""ì∞¢6ˆÁ7B«&VGîñ‚“6ˆ◊&ó6ˆÁ2ÊfñÊBÜ2”‚2ÁFóF∆R””“7W'&VÁEFóF∆Rì∞¢6ˆÁ7BWFFVB“«&VGîñ‚Ú6ˆ◊&ó6ˆÁ2¢≤‚‚Ê6ˆ◊&ó6ˆÁ2¬≤FóF∆S¢7W'&VÁEFóF∆R¬&W7V«B’”∞¢6ˆgE&W6WBáWFFVBì∞¢◊–¢Û‡¢í¢Ä¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC§2Á7W&f6R¬&˜&FW#¶Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3£¬FFñÊs¢##GÇ#Ç"¬FWáD∆ñv„¢&6VÁFW""◊”‡¢«7Gñ∆S◊∑≤÷&vñ„£¬fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#§2Ê◊WFVB◊”Â&ˆ∆W2&R7Fñ∆¬&VñÊrÊ«ó6VB‚∆V6RvóB„¬˜‡¢¬ˆFóc‡¢ó–¢¬ˆFóc‡¢ì∞¢–¢ñbÜ∂Wí””“&÷6eˆ¶ˆ'2"í∞¢&WGW&‚Ä¢ƒ÷6d¶ˆ'5ÊV¿¢∂Wì“&÷6eˆ¶ˆ'2 ¢6V√◊∑6V«–¢6∂ñ∆«3◊∑&W7V«BÁ6∂ñ∆«7–¢W66Ùˆ67WFñˆ„◊∑&W7V«BÊW66Ùˆ67WFñˆÁ–¢ˆ‰Ê«ó6U˜7FñÊs◊∂ÜÊF∆TÊ«ó6U˜7FñÊw–¢ˆÂVWVU˜7FñÊs◊∂ÜÊF∆UVWVU˜7FñÊw–¢ˆ‰Ê«ó6T6˜'W3◊∑&W7V«CÚÁ6˜W&6R””“'˜7FñÊr"ÚVÊFVfñÊVB¢ÜÊF∆TÊ«ó6T6˜'W7–¢VWVT6˜VÁC◊∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFÇ≤Ü6ˆ◊&ó6ˆÁ2ÊfñÊBÜ2”‚2ÁFóF∆R””“FıFóF∆T66Rá6V√ÚÁFóF∆W«¬""ííÚ¢ó–¢Û‡¢ì∞¢–¢ñbÜ∂Wí””“'&ˆ∆Vw&Ç"í∞¢&WGW&‚≈&ˆ∆Tw&ÖÊV¬∂Wì“'&ˆ∆Vw&Ç"&W7V«C◊∑&W7V«G“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“˜7FñÊs◊∂Ê«ó6ñÊu˜7FñÊw“Û„∞¢–¢ñbÜ∂Wí””“'vñ∂ñw&Ç"í∞¢&WGW&‚≈vñ∂îw&ÖfñWr∂Wì“'vñ∂ñw&Ç"V÷&VFFVBÊˆFW3◊∑vñ∂î∂uñ∆ˆBÊÊˆFW2«¬µ◊“VFvW3◊∑vñ∂î∂uñ∆ˆBÊVFvW2«¬µ◊“FóF∆S◊∑6V√ÚÁFóF∆R«¬VW'íÁG&ñ“Çó“&W7V«C◊∑&W7V«G“Û„∞¢–¢&WGW&‚ÁV∆√∞¢–†¢ÚÚ)H)H7FW2Ê«ó6ó2vñÊF˜w2ÑáV÷‚∆VB¬3”rs#c¢$í7Fñ∆¬vÁBFÜRc"≤Ê«ó6ó0¢ÚÚvÜñ6Çv2ñ‚V&∆ñW"c2∂ÊE“ó2Ê˜r&V÷˜fVB"í)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H ¢ÚÚ&VÊFW%ñ∆∆%fñWrv2FVfñÊVBÊBÊWfW"6∆∆VBgFW"FÜR7FW”2&VFW6ñv‚ˆbr”rs#b¿¢ÚÚvÜñ6Ç∆VgBEtTÂEí‘dïdRÊ«ó6ó26ˆ◊ˆÊVÁG2∆ófRñ‚FÜó2fñ∆R'WBVÁ&V6Ü&∆R“FÜP¢ÚÚí‘Wá˜7W&RñÊFWÇÜVF∆ñÊR¬FÜRWá˜7W&R&"¬6∂ñ∆¬6Vv÷VÁG2¬FÜRvVÁFñ26ÜñgB¬F6∞¢ÚÚ&W¬FV÷ÊB&ˆˆb¬&ˆw&W76ñˆ‚¬7&˜76˜fW"ÊBFÜRvñ∂îw&Ç÷ˆÊrFÜV“‚7FW2Ü@¢ÚÚ&V'Vñ«BFñffW&VÁB¬6÷∆∆W"6WB&W6ñFRFÜV“&FÜW"FÜ‚÷˜fñÊrFÜV“‡¢Ú¢ÚÚFÜW6R&Vw&˜WFÜR˜'ÜÁ2ñÁFÚ6óÇvñÊF˜w2FÜR7FW26Áf26‚˜V‚¬V6ÇvóFÇóG0¢ÚÚ˜v‚6V7Fñˆ‚F'2‚FÜWí&R6ˆ◊˜6VBg&ˆ“&VÊFW%6V7Fñˆ‚ÇíóG6V∆b&FÜW"FÜ‚'í6˜ññÊp¢ÚÚóG2GvVÁGí÷fófRñÁfˆ6FñˆÁ2¬6ÚWfW'í&˜∆ó7B7Fó2WÜ7F«í2óBv2w&óGFV‚Ê@¢ÚÚ6ÊÊ˜BG&ñgB‚V6ÇVÁG'íó2DÖT‰≥¢FÜR6Áf2ˆÊ«í'Vñ∆G2vñÊF˜rw2G&VRvÜV‚FÜP¢ÚÚ&VFW"7GV∆«í˜VÁ2óBÑ6Áf2Êß7Çw2&∆ßí÷˜VÁB¬FÜV‚∂VW"í‡¢6ˆÁ7B‰≈ï4ï5ıtî‰DıuÙƒ$T≈2“∞¢ï&VFñÊW73¢$í&VFñÊW72"¿¢VÊFW'7FÊE&ˆ∆S¢%VÊFW'7FÊBFÜR&ˆ∆R"¿¢÷&∂WE˜6óFñˆ„¢$÷&∂WB˜6óFñˆ‚"¿¢7FWv&G6Üó¢%7FWv&G6Üó"¿¢&W&S¢%&W&R"¿¢vñ∂ñw&É¢$6&VW"vñ∂îw&Ç"¿¢”∞¢6ˆÁ7BÊ«ó6ó5ÊW2“∞¢ï&VFñÊW73¢Çí”‚≈ÊUF'2F'3◊µ∞¢≤∆&V√¢$íWá˜7W&R"¬V√¢&VÊFW%6V7Fñˆ‚Ç&í÷ÜW&Ú"í“¿¢≤∆&V√¢$ÊFˆ◊í"¬V√¢&VÊFW%6V7Fñˆ‚Ç&í÷ÊFˆ◊í"í“¿¢≤∆&V√¢%6∂ñ∆«2'í&ÊB"¬V√¢&VÊFW%6V7Fñˆ‚Ç'6∂ñ∆«2"í“¿¢≤∆&V√¢%&WW6&ñ∆óGí"¬V√¢&VÊFW%6V7Fñˆ‚Ç&6FVv˜'í"í“¿¢◊“Û‚¿¢VÊFW'7FÊE&ˆ∆S¢Çí”‚≈ÊUF'2F'3◊µ∞¢≤∆&V√¢%váíFÜó2&ˆ∆R"¬V√¢&VÊFW%6V7Fñˆ‚Ç'VÊFW'7FÊB◊3"í“¿¢≤∆&V√¢$˜FÜW"Ê÷W2"¬V√¢&VÊFW%6V7Fñˆ‚Ç'VÊFW'7FÊB÷«6Ú"í“¿¢≤∆&V√¢%&W7ˆÁ6ñ&ñ∆óFñW2"¬V√¢&VÊFW%6V7Fñˆ‚Ç'&W7ˆÁ6ñ&ñ∆óFñW2"í“¿¢≤∆&V√¢$¶ˆ"ÊFˆ◊í"¬V√¢&VÊFW%6V7Fñˆ‚Ç&¶ˆ&ÊFˆ◊í"í“¿¢≤∆&V√¢%&ˆ∆R÷óÇ"¬V√¢&VÊFW%6V7Fñˆ‚Ç'&ˆ∆V÷óÇ"í“¿¢≤∆&V√¢%&ˆ∆R6ˆÁFWáB"¬V√¢&VÊFW%6V7Fñˆ‚Ç&6ˆÁFWáB"í“¿¢◊“Û‚¿¢÷&∂WE˜6óFñˆ„¢Çí”‚≈ÊUF'2F'3◊µ∞¢≤∆&V√¢$FV÷ÊB"¬V√¢&VÊFW%6V7Fñˆ‚Ç'˜6óFñˆ‚÷÷&∂WB"í“¿¢≤∆&V√¢$∆ófR˜7FñÊw2"¬V√¢&VÊFW%6V7Fñˆ‚Ç&÷6eˆ¶ˆ'2"í“¿¢≤∆&V√¢%&ˆw&W76ñˆ‚"¬V√¢&VÊFW%6V7Fñˆ‚Ç'&ˆw&W76ñˆ‚"í“¿¢≤∆&V√¢$7&˜76˜fW""¬V√¢&VÊFW%6V7Fñˆ‚Ç&7&˜76˜fW""í“¿¢◊“Û‚¿¢7FWv&G6Üó¢Çí”‚≈ÊUF'2F'3◊µ∞¢≤∆&V√¢$FVW&VB"¬V√¢&VÊFW%6V7Fñˆ‚Ç&FVW&VB"í“¿¢◊“Û‚¿¢&W&S¢Çí”‚≈ÊUF'2F'3◊µ∞¢≤∆&V√¢%F6≤&W"¬V√¢&VÊFW%6V7Fñˆ‚Ç'F6∑&W"í“¿¢≤∆&V√¢$f˜VÊFFñˆ‚"¬V√¢&VÊFW%6V7Fñˆ‚Ç&f˜VÊFFñˆ‚"í“¿¢◊“Û‚¿¢vñ∂ñw&É¢Çí”‚≈ÊUF'2F'3◊µ∞¢≤∆&V√¢%vñ∂îw&Ç"¬V√¢&VÊFW%6V7Fñˆ‚Ç'vñ∂ñw&Ç"í“¿¢◊“Û‚¿¢”∞†¢ÚÚ√C¢&VÊFW%ñ∆∆%fñWr“&VÊFW'2FÜR∆VB◊VW7Fñˆ‚ÜVFW"FÜV‚V6Ç6V7Fñˆ‚f˜"FÜP¢ÚÚ7FófRñ∆∆"¬7F6∂VBfW'Fñ6∆«í‚6V7FñˆÁ2vÜ˜6RFFó2'6VÁB&VÊFW"Ê˜FÜñÊrÜwV&FV@¢ÚÚñÁ6ñFR&VÊFW%6V7Fñˆ‚í‚∆VBVW7Fñˆ‚ó2&V¬ÜVFñÊrÜì¢√˜6V7Fñˆ‚”rí‡¢ÚÚ¬‘‰c¢V6Ç6V7Fñˆ‚ó2w&VBñ‚7F&∆RñBFóbÜñC“'6V2”∆∂Wì‚"í6ÚFÜRÊbG&VP¢ÚÚ6Üñ∆B6∆ñ6≤6‚67&ˆ∆ƒñÁFıfñWrFÜRF&vWB‚V◊Gíw&W'2&R7W&W76VBÜÁV∆¬wV&Bí‡¢gVÊ7Fñˆ‚&VÊFW%ñ∆∆%fñWrÇí∞¢6ˆÁ7B∂Wó2“ıîƒƒ%Ù‘∂7FófUñ∆∆%“«¬µ”∞¢6ˆÁ7BVW7Fñˆ‚“ıîƒƒ%ıTU5DîÙÂ∂7FófUñ∆∆%“«¬"#∞¢&WGW&‚Ä¢∆Fóc‡¢∑VW7Fñˆ‚bbÄ¢∆É"7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„c#W&V“"¬fˆÁEvVñváC£s¬6ˆ∆˜#§2ÁFWáB¬∆ñÊTÜVñváC£„B◊”‡¢∑VW7FñˆÁ–¢¬ˆÉ#‡¢ó–¢∂∂Wó2Ê÷Ü≤”‚∞¢6ˆÁ7B6V2“&VÊFW%6V7Fñˆ‚Ü≤ì∞¢ñbÇ6V2í&WGW&‚ÁV∆√∞¢&WGW&‚∆Fób∂Wì◊∂∑“ñC◊≤'6V2“"≤∑“7Gñ∆S◊∑≤67&ˆ∆ƒ÷&vñÂF˜¢cB◊”Á∑6V7”¬ˆFóc„∞¢“ó–¢¬ˆFóc‡¢ì∞¢–†¢6ˆÁ7Bó57FWÜˆÊR“7FW””“&÷6eˆ6ˆ◊Áí"bbFWfñ6U&ˆfñ∆RÊf˜&‘f7F˜"””“'ÜˆÊR#∞†¢&WGW&‚Ä¢√‡¢«7Gñ∆SÁ∂ ¢¢¬££¶&Vf˜&R¬££¶gFW"≤&˜Ç◊6ó¶ñÊs¢&˜&FW"÷&˜É≤–¢Ú¢EïR5ï5DT“ÑáV÷‚∆VB¬#"”rs#bì¢Ù‰RfˆÁBW7FFR“ñÁFW"Ñvˆˆv∆RfˆÁG2í¿¢WfW'óvÜW&R‚FÜR6ñÊv∆R¶ñ◊˜'FÁB'V∆R˜fW'&ñFW2WfW'íñÊ∆ñÊRfˆÁB÷f÷ñ«íñ‡¢FÜR6ˆFV&6RÜ÷ˆÊÚ≤6W&ñbñÊ∆ñÊR7Gñ∆W2f∆¬&6≤FÚñÁFW"WFˆ÷Fñ6∆«íí¬6ÚÊ¢ñÊ∆ñÊR7Gñ∆Ró2VFóFVB‚F'V∆"ÁV÷W&«27FíÙ‚Ü&ˆGí¬&V∆˜rí6ÚÁV÷&W'27Fñ∆¿¢∆ñv‚‚FÜRV&∆ñW"÷ˆÊÚÖ7∆ñÊR6Á2÷ˆÊÚíÚ6W&ñbÖ6˜W&6R6W&ñbB¬ÊWw7&VFW"ê¢&R÷76W'FñˆÁ2&R&V÷˜fVB“ñÁFW"ó2FÜRvÜˆ∆Rfˆñ6RÊ˜r‚¢¢¢≤fˆÁB÷f÷ñ«ì¢tñÁFW"r¬7ó7FV“◊Ví¬÷∆R◊7ó7FV“¬u6VvˆRTír¬&ˆ&˜FÚ¬ÜV«fWFñ6¬&ñ¬¬6Á2◊6W&ñbñ◊˜'FÁC≤–¢Ú¢ÜVFñÊw2”RRÑáV÷‚∆VB¬#"”rs#bí‚¶ˆˆ“66∆W2V6ÇÜVFñÊrFÚ„ÉRˆbóG0¢ıt‚&VÊFW&VB6ó¶R¬6ÚFÜRÉÊÉ#ÊÉ3ÊÉBÜñW&&6áíó2&W6W'fVBÊBóBvñÁ2˜fW"FÜP¢ñÊ∆ñÊRfˆÁB◊6ó¶Rf«VW2vóFÜ˜WBVFóFñÊrV6ÇˆÊR‚6÷R¶ˆˆ“ñFñˆ“FÜR«&VGê¢W6W2ÜáF÷¬¶ˆˆ“BvñFRfñWw˜'G2í‚¢¢É¬É"¬É2¬ÉB≤¶ˆˆ”¢„ÉS≤–¢Ú¢7FW"WfñFVÊ6RÜVFW"Ü÷ˆ&ñ∆Rì¢ˆ‚Ê'&˜r67&VV‚FÜR$ÊWr6V&6Ç"&6≤∆ñÊ∞¢6BñÊ∆ñÊRvñÁ7BFÜR&ñr6W&ñbFóF∆RÊB7VVW¶VBóB¬ÊBFÜR6˜VÁBÙÙ¥b6Üó0¢f˜VváBf˜"FÜR6÷R&˜r‚7F6≤óB“&6≤∆ñÊ≤ˆ‚óG2˜v‚&˜r¬FóF∆RgV∆¬vñGFÇ¿¢6Üó2∆VgB÷∆ñvÊVB&V∆˜rÜ˜fW'&ñFRFÜRFW6∑F˜÷&vñ‚÷∆VgC¶WFÚí‚¢¢÷VFñÜ÷Ç◊vñGFÉ¢cCÇí∞¢Á7FW"÷ÜVB≤f∆WÇ÷Fó&V7Fñˆ„¢6ˆ«V÷„≤∆ñv‚÷óFV◊3¢7G&WF6É≤v¢áÉ≤–¢Á7FW"÷ÜVB‚'WGFˆ„¶fó'7B÷6Üñ∆B≤∆ñv‚◊6V∆c¢f∆WÇ◊7F'C≤–¢Á7FW"÷ÜVB‚¶∆7B÷6Üñ∆B≤÷&vñ‚÷∆VgC¢ñ◊˜'FÁC≤–¢–¢áF÷¬≤÷&vñ„¢≤FFñÊs¢≤vñGFÉ¢S≤ÜVñváC¢S≤˜fW&f∆˜r◊É¢6∆ó≤fˆÁB◊6ó¶S¢gÉ≤–¢&ˆGí≤÷&vñ„¢≤FFñÊs¢≤vñGFÉ¢S≤÷ñ‚÷ÜVñváC¢S≤˜fW&f∆˜r◊É¢6∆ó≤◊vV&∂óB◊FWáB◊6ó¶R÷FßW7C¢S≤FWáB◊&VÊFW&ñÊs¢˜Fñ÷ó¶T∆Vvñ&ñ∆óGì≤◊vV&∂óB÷fˆÁB◊6÷ˆ˜FÜñÊs¢ÁFñ∆ñ6VC≤÷÷˜¢÷˜7Ç÷fˆÁB◊6÷ˆ˜FÜñÊs¢w&ó66∆S≤fˆÁB÷fVGW&R◊6WGFñÊw3¢&∂W&‚"¬&∆ñv"¬&6«B"≤fˆÁB◊f&ñÁB÷ÁV÷W&ñ3¢F'V∆"÷ÁV◊3≤–¢7&ˆ˜B≤vñGFÉ¢S≤÷Ç◊vñGFÉ¢gs≤˜fW&f∆˜r◊É¢6∆ó≤–¢ñ÷r¬fñFVÚ≤÷Ç◊vñGFÉ¢S≤–¢ß&ˆ˜B∞¢“÷÷ÜVñváC¢7fÉ∞¢“÷6ˆÁFVÁB◊C¢'É∞¢“÷6ˆÁFVÁB÷÷É¢ÊˆÊS∞¢“÷&6R÷fˆÁC¢WÉ∞¢–¢7W˜'G2ÜÜVñváC¢7fÇí∞¢ß&ˆ˜B≤“÷÷ÜVñváC¢7fÉ≤–¢–¢÷VFñÜ÷ñ‚◊vñGFÉ¢cÇí≤ß&ˆ˜B≤“÷6ˆÁFVÁB◊C¢#É≤“–¢Á6óFR◊FóF∆R≤vÜóFR◊76S¢Ê˜w&≤fˆÁB◊6ó¶S¢GÉ≤–¢÷VFñÜ÷ñ‚◊vñGFÉ¢scáÇí≤Á6óFR◊FóF∆R≤fˆÁB◊6ó¶S¢gÉ≤“–¢÷VFñÜ÷Ç◊vñGFÉ¢CsóÇí≤Á6óFR◊FóF∆R≤vÜóFR◊76S¢Ê˜&÷√≤fˆÁB◊6ó¶S¢7É≤“–¢÷VFñÜ÷ñ‚◊vñGFÉ¢ìÇí≤ß&ˆ˜B≤“÷6ˆÁFVÁB◊C¢#GÉ≤“–¢÷VFñÜ÷ñ‚◊vñGFÉ¢#Çí≤ß&ˆ˜B≤“÷6ˆÁFVÁB◊C¢#áÉ≤“–¢÷VFñÜ÷ñ‚◊vñGFÉ¢cÇí≤ß&ˆ˜B≤“÷6ˆÁFVÁB◊C¢3'É≤“–¢÷VFñÜ÷ñ‚◊vñGFÉ¢#Çí≤ß&ˆ˜B≤“÷&6R÷fˆÁC¢wÉ≤“◊&ˆ˜B÷g3¢"„RS≤“–¢÷VFñÜ÷ñ‚◊vñGFÉ¢#ScÇí≤ß&ˆ˜B≤“÷&6R÷fˆÁC¢áÉ≤“◊&ˆ˜B÷g3¢#RS≤“–¢Ê÷ñ‚÷6ˆÁFVÁB≤vñGFÉ¢S≤÷Ç◊vñGFÉ¢f"Ç“÷6ˆÁFVÁB÷÷Çì≤÷&vñ„¢≤FFñÊs¢f"Ç“÷6ˆÁFVÁB◊BígÉ≤–¢÷VFñÜ÷ñ‚◊vñGFÉ¢cÇí≤Ê÷ñ‚÷6ˆÁFVÁB≤FFñÊs¢f"Ç“÷6ˆÁFVÁB◊Bì≤“–¢Á7FW÷÷ˆ&ñ∆R÷÷ñ‚≤FFñÊs£'Çñ◊˜'FÁC≤FFñÊr÷&˜GFˆ”¶6∆2É'Ç≤VÁbá6fR÷&V÷ñÁ6WB÷&˜GFˆ“ííñ◊˜'FÁC≤–¢Ú¢7FW"VFvR◊FÚ÷VFvR&∆VVC¢6Ê6V«2Ê÷ñ‚÷6ˆÁFVÁBw2˜v‚Ü˜&ó¶ˆÁF¬FFñÊrfñ¢ÊVvFófR÷&vñ‚Ü÷ó'&˜'2óG2'&V∑ˆñÁG2WÜ7F«ííñÁ7FVBˆbgrÚ”Sgp¢G&ñ6≤“grñÊ6«VFW2FÜR67&ˆ∆∆&"w2vñGFÇ¬6ÚFÜB&ˆ6Ç˜fW&f∆˜w27BFÜP¢G'VRfñWw˜'BÊBvWG26∆óVB'í7&ˆ˜Bˆ&ˆGíw2˜fW&f∆˜r◊É¢6∆óáFÜR'VrfóÜV@¢ÜW&S¢6ˆÁFVÁBv27WBˆfbˆ‚&˜FÇVFvW2¬Ê˜B7GV∆«í&∆VVFñÊrFÚFÜV“í‚¢¢Á7FW"÷&∆VVB≤vñGFÉ¢6∆2ÉR≤3'Çì≤÷&vñ„¢”gÉ≤–¢÷VFñÜ÷ñ‚◊vñGFÉ¢cÇí≤Á7FW"÷&∆VVB≤vñGFÉ¢6∆2ÉR≤"¢f"Ç“÷6ˆÁFVÁB◊Bíì≤÷&vñ„¢6∆2Ç”¢f"Ç“÷6ˆÁFVÁB◊Bíì≤“–¢Ú¢‘4b˜7FñÊw2∆ó7C¢Wá∆ñ6óB6ˆ«V÷‚FñW'2“Ú"Ú2ÚB'ífñWw˜'BvñGFÄ¢áÜˆÊR˜'G&óBÚÜˆÊR÷∆ÊG66RbïB÷÷ñÊíÚïB÷∆ÊG66RbÊ˜FV&ˆˆ≤ÚvñFRí‚¢¢Ê÷6b÷w&ñB≤Fó7∆ì¶w&ñC≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g#≤v£É≤∆ñv‚÷óFV◊3ß7F'C≤–¢÷VFñÜ÷ñ‚◊vñGFÉ£cÇí≤Ê÷6b÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ"√g"ì≤“–¢÷VFñÜ÷ñ‚◊vñGFÉ£ìÇí≤Ê÷6b÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ2√g"ì≤“–¢÷VFñÜ÷ñ‚◊vñGFÉ£CCÇí≤Ê÷6b÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉB√g"ì≤“–¢Ú¢7FW"WfñFVÊ6R6&G3¢"6ˆ«V÷Á2÷Ç‚FÜR'V∆W26ˆ◊˜6RfñWw˜'BvñGFÇÊ@¢˜&ñVÁFFñˆ‚6Ú∆ÊG66RÜˆÊR∂VW2&VF&∆R6&G2vÜñ∆R˜'G&óBF&∆W@¢6‚W6RGvÚ6ˆ«V÷Á2gFW"óG26˜W&6RÊV«27F6≤FÚgV∆¬vñGFÇ‚¢¢Á7FW"÷6&G2≤Fó7∆ì¶w&ñC≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g#≤v£GÉ≤∆ñv‚÷6ˆÁFVÁCß7F'C≤–¢÷VFñÜ÷ñ‚◊vñGFÉ£cCÇíÊBÜ˜&ñVÁFFñˆ„ß˜'G&óBí≤Á7FW"÷6&G2≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ"∆÷ñÊ÷ÇÉ√g"íì≤“–¢÷VFñÜ÷ñ‚◊vñGFÉ£ìÇí≤Á7FW"÷6&G2≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ"∆÷ñÊ÷ÇÉ√g"íì≤“–¢Á7FW"◊6˜W&6R÷w&ñB≤Fó7∆ì¶w&ñBñ◊˜'FÁC≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ"∆÷ñÊ÷ÇÉ√g"íì≤–¢Á7FW"÷&ˆGí≤Fó7∆ì¶w&ñBñ◊˜'FÁC≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£#sgÇ÷ñÊ÷ÇÉ√g"ì≤–¢Ú¢FWfñ6R&Vf∆ñváC¢FÜRc"FV◊∆FR7W∆ñW2÷ˆ&ñ∆R÷fó'7B6ó¶ñÊrÊBcÛscÇÛì ¢FñW'3≤$î„27W∆ñW2˜&ñVÁFFñˆ‚ˆ7V7B&VÜfñ˜W"‚FÜW6RFFGG&ñ'WFW2&P¢76W76VB7ñÊ6á&ˆÊ˜W6«í&Vf˜&R7FW"˜"7FW2&VÊFW'2ÊBWFFRˆ‚fó7V¬–¢fñWw˜'B&W6ó¶Rˆ˜&ñVÁFFñˆ‚6ÜÊvW2‚&W˜'FVBf÷ñ«íÊWfW"6ÜÊvW2WfñFVÊ6R‚¢¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"◊6ÜV∆¬≤FFñÊs¢'ÇCÇñ◊˜'FÁC≤–¢∂FF◊6ó¶R◊FñW#“'ÜˆÊR÷6ˆ◊7B%“Á7FW"◊6ÜV∆¬≤FFñÊr÷ñÊ∆ñÊS¢áÇñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"÷fñ«FW&&"∞¢F˜¢c'Çñ◊˜'FÁC≤Fó7∆ì¶w&ñBñ◊˜'FÁC∞¢w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ"∆÷ñÊ÷ÇÉ√g"íì≤∆ñv‚÷óFV◊3ß7G&WF6Çñ◊˜'FÁC∞¢FFñÊs£áÇñ◊˜'FÁC≤v£wÇñ◊˜'FÁC∞¢–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"÷fñ«FW&&"‚ñÁWB≤w&ñB÷6ˆ«V÷„£Ú”≤vñGFÉ£S≤÷ñ‚◊vñGFÉ£ñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"◊6˜'B¿¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"÷f6WB≤vñGFÉ£S≤÷ñ‚◊vñGFÉ£≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"◊6˜'B‚'WGFˆ‚¿¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"÷f6WB÷'WGFˆ‚≤vñGFÉ£S≤÷ñ‚◊vñGFÉ£≤ßW7Fñgí÷6ˆÁFVÁCß76R÷&WGvVV„≤˜fW&f∆˜s¶ÜñFFV„≤FWáB÷˜fW&f∆˜s¶V∆∆ó6ó3≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"◊6˜'B÷÷VÁR¿¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"÷f6WB÷÷VÁR∞¢˜6óFñˆ„¶fóÜVBñ◊˜'FÁC≤F˜£#áÇñ◊˜'FÁC≤∆VgC£'Çñ◊˜'FÁC≤&ñváC£'Çñ◊˜'FÁC∞¢vñGFÉ¶WFÚñ◊˜'FÁC≤÷ñ‚◊vñGFÉ£ñ◊˜'FÁC≤÷Ç◊vñGFÉ¶ÊˆÊRñ◊˜'FÁC∞¢÷Ç÷ÜVñváC¶6∆2ÉGfÇ“SÇíñ◊˜'FÁC≤˜fW&f∆˜r◊ì¶WFÚñ◊˜'FÁC∞¢–¢∂FF◊6ó¶R◊FñW#“'ÜˆÊR÷6ˆ◊7B%“Á7FW"÷fñ«FW&&"≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g#≤–¢∂FF◊6ó¶R◊FñW#“'ÜˆÊR÷6ˆ◊7B%“Á7FW"÷fñ«FW&&"‚ñÁWB≤w&ñB÷6ˆ«V÷„£≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"÷˜fW'fñWr‚Fóc¶fó'7B÷6Üñ∆B≤∆ñv‚÷óFV◊3¶f∆WÇ◊7F'Bñ◊˜'FÁC≤f∆WÇ÷Fó&V7Fñˆ„¶6ˆ«V÷„≤v£GÇñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"÷˜fW'fñWr÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤v£GÇñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"÷&ˆGí¿¢∂FF÷f˜&“÷f7F˜#“'F&∆WB%’∂FF÷˜&ñVÁFFñˆ„“'˜'G&óB%“Á7FW"÷&ˆGí≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"÷ñÊFWÇ¿¢∂FF÷f˜&“÷f7F˜#“'F&∆WB%’∂FF÷˜&ñVÁFFñˆ„“'˜'G&óB%“Á7FW"÷ñÊFWÇ∞¢˜6óFñˆ„ß7FFñ2ñ◊˜'FÁC≤F˜¶WFÚñ◊˜'FÁC≤vñGFÉ¶WFÚñ◊˜'FÁC∞¢÷Ç÷ÜVñváC£#ÉÇñ◊˜'FÁC≤∆ñv‚◊6V∆cß7G&WF6Çñ◊˜'FÁC∞¢–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%“Á7FW"◊6˜W&6R÷w&ñB¿¢∂FF÷f˜&“÷f7F˜#“'F&∆WB%“Á7FW"◊6˜W&6R÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'ÜˆÊR%’∂FF÷˜&ñVÁFFñˆ„“&∆ÊG66R%“Á7FW"◊6˜W&6R÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ"∆÷ñÊ÷ÇÉ√g"ííñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'F&∆WB%“Á7FW"◊6ÜV∆¬≤FFñÊs£áÇS'Çñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'F&∆WB%’∂FF÷˜&ñVÁFFñˆ„“&∆ÊG66R%“Á7FW"÷&ˆGí≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£#3gÇ÷ñÊ÷ÇÉ√g"íñ◊˜'FÁC≤–¢∂FF÷f˜&“÷f7F˜#“'F&∆WB%’∂FF÷˜&ñVÁFFñˆ„“&∆ÊG66R%“Á7FW"÷ñÊFWÇ≤vñGFÉ£#3gÇñ◊˜'FÁC≤–¢Ú¢vVˆ÷WG'íf∆∆&6∑2∂VWFÜR∆ñ˜WB6˜'&V7BWfV‚vÜV‚&óf7íFˆˆ∆ñÊr7G&ó2T¢f÷ñ«íFWFñ«3≤FÜR&Vf∆ñváBGG&ñ'WFW2&V÷ñ‚FÜR÷˜&R&V6ó6Rfó'7B6Üˆñ6R‚¢¢÷VFñÜ÷Ç◊vñGFÉ£ÉìóÇí∞¢Á7FW"÷&ˆGí≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤–¢Á7FW"÷ñÊFWÇ≤˜6óFñˆ„ß7FFñ2ñ◊˜'FÁC≤F˜¶WFÚñ◊˜'FÁC≤vñGFÉ¶WFÚñ◊˜'FÁC≤÷Ç÷ÜVñváC£#ÉÇñ◊˜'FÁC≤∆ñv‚◊6V∆cß7G&WF6Çñ◊˜'FÁC≤–¢Á7FW"◊6˜W&6R÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤–¢–¢÷VFñÜ÷ñ‚◊vñGFÉ£sÇíÊBÜ÷Ç◊vñGFÉ£ÉìóÇíÊBÜ˜&ñVÁFFñˆ„¶∆ÊG66Rí∞¢Á7FW"◊6˜W&6R÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ"∆÷ñÊ÷ÇÉ√g"ííñ◊˜'FÁC≤–¢Á7FW"÷6&G2≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤–¢–¢÷VFñÜ÷ñ‚◊vñGFÉ£ìÇíÊBÜ÷Ç◊vñGFÉ£#ÇíÊBÜ˜&ñVÁFFñˆ„¶∆ÊG66Rí∞¢Á7FW"◊6˜W&6R÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤–¢Á7FW"÷&ˆGí≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£#3gÇ÷ñÊ÷ÇÉ√g"íñ◊˜'FÁC≤–¢Á7FW"÷ñÊFWÇ≤vñGFÉ£#3gÇñ◊˜'FÁC≤–¢–¢÷VFñÜ˜&ñVÁFFñˆ„ß˜'G&óBíÊBÜ÷Ç◊vñGFÉ£Çí∞¢Á7FW"÷&ˆGí≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤–¢Á7FW"÷ñÊFWÇ≤˜6óFñˆ„ß7FFñ2ñ◊˜'FÁC≤F˜¶WFÚñ◊˜'FÁC≤vñGFÉ¶WFÚñ◊˜'FÁC≤÷Ç÷ÜVñváC£#ÉÇñ◊˜'FÁC≤∆ñv‚◊6V∆cß7G&WF6Çñ◊˜'FÁC≤–¢Á7FW"◊6˜W&6R÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤–¢–¢÷VFñÜ÷Ç◊vñGFÉ£cÇí∞¢Á7FW"◊6ÜV∆¬≤FFñÊs£'ÇCÇñ◊˜'FÁC≤–¢Á7FW"÷fñ«FW&&"≤F˜£c'Çñ◊˜'FÁC≤Fó7∆ì¶w&ñBñ◊˜'FÁC≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3ß&WVBÉ"∆÷ñÊ÷ÇÉ√g"íì≤∆ñv‚÷óFV◊3ß7G&WF6Çñ◊˜'FÁC≤FFñÊs£áÇñ◊˜'FÁC≤v£wÇñ◊˜'FÁC≤–¢Á7FW"÷fñ«FW&&"‚ñÁWB≤w&ñB÷6ˆ«V÷„£Ú”≤vñGFÉ£S≤÷ñ‚◊vñGFÉ£ñ◊˜'FÁC≤–¢Á7FW"◊6˜'B¬Á7FW"÷f6WB≤vñGFÉ£S≤÷ñ‚◊vñGFÉ£≤–¢Á7FW"◊6˜'B‚'WGFˆ‚¬Á7FW"÷f6WB÷'WGFˆ‚≤vñGFÉ£S≤÷ñ‚◊vñGFÉ£≤ßW7Fñgí÷6ˆÁFVÁCß76R÷&WGvVV„≤˜fW&f∆˜s¶ÜñFFV„≤FWáB÷˜fW&f∆˜s¶V∆∆ó6ó3≤–¢Á7FW"÷˜fW'fñWr‚Fóc¶fó'7B÷6Üñ∆B≤∆ñv‚÷óFV◊3¶f∆WÇ◊7F'Bñ◊˜'FÁC≤f∆WÇ÷Fó&V7Fñˆ„¶6ˆ«V÷„≤v£GÇñ◊˜'FÁC≤–¢Á7FW"÷˜fW'fñWr÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤v£GÇñ◊˜'FÁC≤–¢–¢÷VFñÜ÷Ç◊vñGFÉ£3cÇí∞¢Á7FW"◊6ÜV∆¬≤FFñÊr÷ñÊ∆ñÊS£áÇñ◊˜'FÁC≤–¢Á7FW"÷fñ«FW&&"≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g"ñ◊˜'FÁC≤–¢Á7FW"÷fñ«FW&&"‚ñÁWB≤w&ñB÷6ˆ«V÷„£ñ◊˜'FÁC≤–¢–¢Ú¢54rGvÚ÷6ˆ«V÷‚'&˜w6S¢◊î6&VW'4gWGW&R∆VgB¬6&VW'2Êv˜bÁ6r&ñváC≤7F6∑2&V∆˜rÇ¢¢Ê76r÷6ˆ«2≤Fó7∆ì¶w&ñC≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g#≤v£#É≤∆ñv‚÷óFV◊3ß7F'C≤–¢÷VFñÜ÷ñ‚◊vñGFÉ£Çí≤Ê76r÷6ˆ«2≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£6g"&g#≤“–¢Ê76r÷6ˆ«2Ê÷6b÷w&ñB≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3£g#≤–¢Ú¢)H)HFWáB66∆S¢$T“÷&6VB¬Ê6Ü˜&VBFÚFÜR&ˆ˜BfˆÁB◊6ó¶R‚Fá&VRÜW26ˆ◊˜6P¢ˆ‚FÜR4‘R÷V6ÜÊó6”¢ÉíFÜR'&˜w6W"w2˜v‚FWáB◊6ó¶RÚ66W76ñ&ñ∆óGí6WGFñÊp¢6ÜÊvW2FÜR&ˆ˜BfˆÁB◊6ó¶S≤É"íFÜR“ÙÙ≤6ˆÁG&ˆ¬◊V«Fó∆ñW2óBfñ“◊Ví◊66∆S∞¢É2í'&˜w6W"¶ˆˆ“6óG2ˆ‚F˜‚∆¬FWáBó2&V“áFÜRñÊ∆ñÊR◊ÇfˆÁE6ó¶Rf«VW0¢vW&R7vWBFÚ&V“í¬6ÚWfW'íÜó266∆W2WfW'íñV6RˆbFWáBVÊñf˜&÷«í‚÷ˆ&ñ∆R÷fó'7@¢&6R≤vñGFÇ'V◊3≤ñ◊˜'FÁB&VG2Áí&W6ñGV¬ñÊ∆ñÊRf«VR‚$∆&vR"f∆ˆ˜"‚¢¢ß&ˆ˜B≤“◊Ví◊66∆S¢≤“◊&ˆ˜B÷g3¢S≤–¢áF÷¬≤fˆÁB◊6ó¶S¢6∆2áf"Ç“◊&ˆ˜B÷g2í¢f"Ç“◊Ví◊66∆R¬íì≤–¢ÁB÷&ˆGí≤fˆÁB◊6ó¶S¢„c#W&V“ñ◊˜'FÁC≤–¢ÁB÷∆&V¬≤fˆÁB◊6ó¶S¢&V“ñ◊˜'FÁC≤–¢ÁB÷÷WF≤fˆÁB◊6ó¶S¢&V“ñ◊˜'FÁC≤–¢ÁB◊7V"≤fˆÁB◊6ó¶S¢&V“ñ◊˜'FÁC≤–¢ÁB÷ÜVFñÊw≤fˆÁB◊6ó¶S¢„#W&V“ñ◊˜'FÁC≤–¢Á&W7V«B◊FWáB◊6“≤fˆÁB◊6ó¶S¢&V“ñ◊˜'FÁC≤–¢Á&W7V«B◊FWáB◊á2≤fˆÁB◊6ó¶S¢„ì3sW&V“ñ◊˜'FÁC≤–¢Á&W7V«B÷∆&V¬≤fˆÁB◊6ó¶S¢„ì3sW&V“ñ◊˜'FÁC≤–¢÷VFñÜ÷ñ‚◊vñGFÉ¢#GÇí∞¢ÁB÷&ˆGí≤fˆÁB◊6ó¶S¢„#W&V“ñ◊˜'FÁC≤–¢ÁB÷∆&V¬≤fˆÁB◊6ó¶S¢„c#W&V“ñ◊˜'FÁC≤–¢ÁB÷÷WF≤fˆÁB◊6ó¶S¢„c#W&V“ñ◊˜'FÁC≤–¢ÁB◊7V"≤fˆÁB◊6ó¶S¢„c#W&V“ñ◊˜'FÁC≤–¢ÁB÷ÜVFñÊw≤fˆÁB◊6ó¶S¢„3sW&V“ñ◊˜'FÁC≤–¢Á&W7V«B◊FWáB◊6“≤fˆÁB◊6ó¶S¢„c#W&V“ñ◊˜'FÁC≤–¢Á&W7V«B◊FWáB◊á2≤fˆÁB◊6ó¶S¢&V“ñ◊˜'FÁC≤–¢Á&W7V«B÷∆&V¬≤fˆÁB◊6ó¶S¢&V“ñ◊˜'FÁC≤–¢–¢÷VFñÜ÷ñ‚◊vñGFÉ¢cÇí∞¢ÁB÷&ˆGí≤fˆÁB◊6ó¶S¢„ÉsW&V“ñ◊˜'FÁC≤–¢ÁB÷ÜVFñÊw≤fˆÁB◊6ó¶S¢„W&V“ñ◊˜'FÁC≤–¢–¢Ú¢&WFñÊ÷4&ˆˆ≤#”CC552É¢F"∆&V¬∆ñgB¢¢÷VFñÜ÷ñ‚◊vñGFÉ¢#ÇíÊBÜ÷Ç◊vñGFÉ¢SÇí∞¢Ê÷ñ‚÷6ˆÁFVÁBÁF"÷∆&V¬≤fˆÁB◊6ó¶S¢„ì3sW&V“ñ◊˜'FÁC≤–¢–¢∂Wñg&÷W27≤FÚ≤G&Á6f˜&”¢&˜FFRÉ3cFVrì≤“–¢Á7◊7ñ‚≤Êñ÷Fñˆ„¢7„w2∆ñÊV"ñÊfñÊóFS≤–¢∂Wñg&÷W2fFT˜WB≤R≤˜6óGì£≤“sR≤˜6óGì£≤“R≤˜6óGì£≤“–¢Ú¢7FW"î‰DUÇ&ñ¬”‚6&B∆ˆ6F˜"&∆ñÊ≤ÑáV÷‚∆VB”rs#bì¢FÜR&˜&FW ¢7G&ˆ&W2&«VS¬”ÁvÜóFR6ÚFÜRWñR∆ÊG2ˆ‚FÜR÷F6ÜñÊr6&BgFW"FÜP¢67&ˆ∆¬‚6ÜR∂÷˜Fñˆ‚6ñvÊ¬¬Ê˜BáVR◊ó"“6ˆ∆˜W"÷&∆ñÊB6fR‚¢¢∂Wñg&÷W26&D&∆ñÊ≤∞¢R¬R≤&˜&FW"÷6ˆ∆˜#¢3SfF#≤&˜Ç◊6ÜF˜s¢GÇ&v&É#b√Éb√#í√„3Rì≤–¢SR≤&˜&FW"÷6ˆ∆˜#¢6fffffc≤&˜Ç◊6ÜF˜s¢GÇ&v&É#SR√#SR√#SR√„íì≤–¢–¢Ê6&B÷&∆ñÊ≤≤Êñ÷Fñˆ„¢6&D&∆ñÊ≤„SW2V6R÷ñ‚÷˜WBS≤–¢÷VFñá&VfW'2◊&VGV6VB÷÷˜Fñˆ„¢&VGV6Rí≤Ê6&B÷&∆ñÊ≤≤Êñ÷Fñˆ„¢ÊˆÊS≤&˜&FW"÷6ˆ∆˜#¢3SfF"ñ◊˜'FÁC≤&˜Ç◊6ÜF˜s¢GÇ&v&É#b√Éb√#í√„3Ríñ◊˜'FÁC≤“–†¢Ú¢)H)H≈UÉ3¢÷ˆFW&‚÷ñ7&Ú÷ñÁFW&7Fñˆ‚∆ñW"Ü∆ÊFñÊr≤Ê«ó6Rí)H)H)H)H)H)H)H)H)H)H)H ¢GóR÷f˜'v&B¬∆˜r◊vÜóFW76S≤¶W&Ú•2Ú¶W&Ú'VÊF∆R6˜7BÜÊÚu4ˆ‚FÜP¢÷ñ‚FÇí‚WfW'íVffV7BFVw&FW2FÚÊ˜FÜñÊrVÊFW"&VGV6VB÷÷˜Fñˆ‚‚¢¢∂Wñg&÷W2«WÖ&ó6R≤g&ˆ“≤˜6óGì¢≤G&Á6f˜&”¢G&Á6∆FUíÉÇì≤“FÚ≤˜6óGì¢≤G&Á6f˜&”¢ÊˆÊS≤“–¢Ú¢7FvvW&VBVÁG&Ê6R“G&˜Ê«WÇ◊&ó6Rˆ‚&∆ˆ6≥≤“÷«WÇ÷B6WG2FÜRFV∆í¢¢Ê«WÇ◊&ó6R≤Êñ÷Fñˆ„¢«WÖ&ó6R„c'27V&ñ2÷&W¶ñW"É„#"¬„Ç¬„#B¬í&˜FÉ≤Êñ÷Fñˆ‚÷FV∆ì¢f"Ç“÷«WÇ÷B¬2ì≤–¢Ú¢7&ñÊr∆ñgBˆ‚Ü˜fW"Ü6&G2¬&˜w2¬W'6ˆÊFñ∆W2í¢¢Ê«WÇ÷∆ñgB≤G&Á6óFñˆ„¢G&Á6f˜&“„3á27V&ñ2÷&W¶ñW"É„#"¬„Ç¬„#B¬í¬&˜Ç◊6ÜF˜r„3á2V6R¬&˜&FW"÷6ˆ∆˜"„#'2V6R¬&6∂w&˜VÊB„#'2V6S≤vñ∆¬÷6ÜÊvS¢G&Á6f˜&”≤–¢Ê«WÇ÷∆ñgC¶Ü˜fW"≤G&Á6f˜&”¢G&Á6∆FUíÇ”'Çì≤&˜Ç◊6ÜF˜s¢'Ç3Ç&v&ÉR¬C¬R¬„2ì≤–¢Ê«WÇ÷∆ñgC¶7FófR≤G&Á6f˜&”¢G&Á6∆FUíÉì≤G&Á6óFñˆ‚÷GW&Fñˆ„¢„á3≤–¢Ú¢FWáB÷&6VB6∆ó◊FÇ&WfV√¢‚66VÁBGvñ‚vóW27&˜72FÜRv˜&Bˆ‚Ü˜fW ¢ˆbFÜRV∆V÷VÁBı"‚Ê6W7F˜"Ê«WÇ◊&˜r‚ÊVVG2FF◊FWáBˆ‚FÜRÊˆFR‚¢¢Ê«WÇ÷6∆ó≤˜6óFñˆ„¢&V∆FófS≤Fó7∆ì¢ñÊ∆ñÊR÷&∆ˆ6≥≤–¢Ê«WÇ÷6∆ó£¶gFW"∞¢6ˆÁFVÁC¢GG"ÜFF◊FWáBì≤˜6óFñˆ„¢'6ˆ«WFS≤ñÁ6WC¢≤vÜóFR◊76S¢ñÊÜW&óC∞¢6ˆ∆˜#¢f"Ç“÷«WÇ÷6∆ó¬3SfF"ì≤6∆ó◊FÉ¢ñÁ6WBÉRì∞¢G&Á6óFñˆ„¢6∆ó◊FÇ„CW27V&ñ2÷&W¶ñW"É„cR¬¬„3R¬ì≤ˆñÁFW"÷WfVÁG3¢ÊˆÊS∞¢–¢Ê«WÇ÷6∆ó¶Ü˜fW#£¶gFW"¬Ê«WÇ◊&˜s¶Ü˜fW"Ê«WÇ÷6∆ó£¶gFW"¬Ê«WÇ◊&˜s¶fˆ7W2◊fó6ñ&∆RÊ«WÇ÷6∆ó£¶gFW"≤6∆ó◊FÉ¢ñÁ6WBÉì≤–¢Ú¢VÊFW&∆ñÊRvóRáF'2¬∆ñÊ∑2í“66∆UÇg&ˆ“FÜR∆VgB¢¢Ê«WÇ◊V∆ñÊR≤˜6óFñˆ„¢&V∆FófS≤–¢Ê«WÇ◊V∆ñÊS£¶gFW"∞¢6ˆÁFVÁC¢"#≤˜6óFñˆ„¢'6ˆ«WFS≤∆VgC¢≤&ñváC¢≤&˜GFˆ”¢É≤ÜVñváC¢'É∞¢&6∂w&˜VÊC¢7W'&VÁD6ˆ∆˜#≤G&Á6f˜&”¢66∆UÇÉì≤G&Á6f˜&“÷˜&ñvñ„¢∆VgB6VÁFW#∞¢G&Á6óFñˆ„¢G&Á6f˜&“„3G27V&ñ2÷&W¶ñW"É„cR¬¬„3R¬ì≤&˜&FW"◊&FóW3¢'É∞¢–¢Ê«WÇ◊V∆ñÊS¶Ü˜fW#£¶gFW"≤G&Á6f˜&”¢66∆UÇÉì≤–¢Ú¢'&˜rÁVFvRˆ‚&VÁBÜ˜fW"¢¢Ê«WÇ÷'&˜r≤G&Á6óFñˆ„¢G&Á6f˜&“„727V&ñ2÷&W¶ñW"É„#"¬„Ç¬„#B¬ì≤–¢Ê«WÇ◊&˜s¶Ü˜fW"Ê«WÇ÷'&˜r≤G&Á6f˜&”¢G&Á6∆FUíÉ7Çì≤–¢Ê«WÇ÷7F¶Ü˜fW"Ê«WÇ÷'&˜r≤G&Á6f˜&”¢G&Á6∆FUÇÉGÇì≤–¢Ú¢5D'WGFˆ„¢6ÜVV‚7vVW≤&W72¢¢Ê«WÇ÷7F≤˜6óFñˆ„¢&V∆FófS≤˜fW&f∆˜s¢ÜñFFV„≤G&Á6óFñˆ„¢G&Á6f˜&“„á2V6R¬&˜Ç◊6ÜF˜r„#á2V6R¬fñ«FW"„'2V6S≤–¢Ê«WÇ÷7F£¶&Vf˜&R∞¢6ˆÁFVÁC¢"#≤˜6óFñˆ„¢'6ˆ«WFS≤F˜¢≤&˜GFˆ”¢≤∆VgC¢≤vñGFÉ¢CRS∞¢&6∂w&˜VÊC¢∆ñÊV"÷w&FñVÁBÉFVr¬G&Á7&VÁB¬&v&É#SR√#SR√#SR√„3"í¬G&Á7&VÁBì∞¢G&Á6f˜&”¢G&Á6∆FUÇÇ”ÉRì≤G&Á6óFñˆ„¢G&Á6f˜&“„g27V&ñ2÷&W¶ñW"É„#"¬„Ç¬„#B¬ì≤ˆñÁFW"÷WfVÁG3¢ÊˆÊS∞¢–¢Ê«WÇ÷7F¶Ü˜fW"≤&˜Ç◊6ÜF˜s¢áÇ#'Ç&v&É¬S¬S2¬„3ì≤fñ«FW#¢6GW&FRÉ„bì≤–¢Ê«WÇ÷7F¶Ü˜fW#£¶&Vf˜&R≤G&Á6f˜&”¢G&Á6∆FUÇÉ3#Rì≤–¢Ê«WÇ÷7F¶7FófR≤G&Á6f˜&”¢66∆RÉ„ìsRì≤–¢Ú¢6V&6Ç6ÜV∆¬v∆˜rvÜV‚fñV∆BñÁ6ñFRó2fˆ7W6VBÜ&6R&ñÊr∆ófW2ÜW&R6¢¶fˆ7W2◊vóFÜñ‚6‚˜fW'&ñFRóB“‚ñÊ∆ñÊR&˜Ç◊6ÜF˜r6˜V∆BÊ˜B&Rí¢¢Ê«WÇ◊6V&6Ç≤&˜&FW#¢Ç6ˆ∆ñB636C6cS≤&˜Ç◊6ÜF˜s¢ÇCÇ&v&ÉR¬C¬R¬„í¬Ç'Ç&v&ÉR¬C¬R¬„bì≤G&Á6óFñˆ„¢&˜Ç◊6ÜF˜r„72V6R¬&˜&FW"÷6ˆ∆˜"„72V6S≤–¢Ê«WÇ◊6V&6É¶fˆ7W2◊vóFÜñ‚≤&˜&FW"÷6ˆ∆˜#¢3SfF#≤&˜Ç◊6ÜF˜s¢GÇ&v&É#b¬Éb¬#í¬„2í¬'ÇCGÇ&v&ÉR¬C¬R¬„Bì≤–¢Ú¢÷ˆFW&‚¬6ˆÁ6ó7FVÁB∂Wñ&ˆ&Bfˆ7W2&ñÊr¢¢Ê«WÇ÷fˆ7W3¶fˆ7W2◊fó6ñ&∆R≤˜WF∆ñÊS¢'Ç6ˆ∆ñB3SfF#≤˜WF∆ñÊR÷ˆfg6WC¢'É≤&˜&FW"◊&FóW3¢áÉ≤–¢Ú¢v∆ˆ&¬∂Wñ&ˆ&B÷fˆ7W2f∆∆&6≤Üvˆ≈Û‘•T¬*s"Ú3R¬3íì¢WfW'ê¢ñÁFW&7FófR6ˆÁG&ˆ¬FÜBFˆW2Ê˜B«&VGí˜BñÁFÚÊ«WÇ÷fˆ7W27Fñ∆¿¢vWG2fó6ñ&∆RÜñvÇ÷6ˆÁG&7B&ñÊr‚FV∆ñ&W&FV«í‰ıBñ◊˜'FÁB¬Ê@¢¶fˆ7W2◊fó6ñ&∆RˆÊ«í¬6Ú6ˆÁG&ˆ«2vóFÇFÜVó"˜v‚&ñÊrÜRÊr‚Ê«WÇ◊6V&6Ä¢&˜Ç◊6ÜF˜r¬˜"‚ñÁFVÁFñˆÊ¬ñÊ∆ñÊR˜WF∆ñÊRí&RÊWfW"˜fW'&ñFFV‚Ê@¢FÜR&ñÊrÊWfW"6Ü˜w2ˆ‚÷˜W6R6∆ñ6≤‚¢¢¶fˆ7W2◊fó6ñ&∆R¬'WGFˆ„¶fˆ7W2◊fó6ñ&∆R¬∑&ˆ∆S“&'WGFˆ‚%”¶fˆ7W2◊fó6ñ&∆R¿¢∑&ˆ∆S“'F"%”¶fˆ7W2◊fó6ñ&∆R¬ñÁWC¶fˆ7W2◊fó6ñ&∆R¬6V∆V7C¶fˆ7W2◊fó6ñ&∆R¿¢FWáF&V¶fˆ7W2◊fó6ñ&∆R¬7V÷÷'ì¶fˆ7W2◊fó6ñ&∆R¬∑F&ñÊFWÖ”¶fˆ7W2◊fó6ñ&∆R∞¢˜WF∆ñÊS¢'Ç6ˆ∆ñB3SfF#≤˜WF∆ñÊR÷ˆfg6WC¢'É≤&˜&FW"◊&FóW3¢gÉ∞¢–¢Ú¢F"Ü˜fW"“6ˆ∆˜W"∆ñgB≤VÊFW&∆ñÊRvóRf˜"FÜRñÊ7FófRˆÊW2¢¢ÁF"÷∆&V¬≤˜6óFñˆ„¢&V∆FófS≤G&Á6óFñˆ„¢6ˆ∆˜"„á2V6S≤–¢ÁF"÷∆&V√£¶gFW"∞¢6ˆÁFVÁC¢"#≤˜6óFñˆ„¢'6ˆ«WFS≤∆VgC¢áÉ≤&ñváC¢áÉ≤&˜GFˆ”¢≤ÜVñváC¢'É∞¢&6∂w&˜VÊC¢7W'&VÁD6ˆ∆˜#≤G&Á6f˜&”¢66∆UÇÉì≤G&Á6f˜&“÷˜&ñvñ„¢∆VgB6VÁFW#∞¢G&Á6óFñˆ„¢G&Á6f˜&“„3'27V&ñ2÷&W¶ñW"É„cR¬¬„3R¬ì≤˜6óGì¢„SS≤&˜&FW"◊&FóW3¢'É∞¢–¢ÁF"÷∆&V√¶Ü˜fW#£¶gFW"≤G&Á6f˜&”¢66∆UÇÉì≤–¢÷VFñá&VfW'2◊&VGV6VB÷÷˜Fñˆ„¢&VGV6Rí∞¢Ê«WÇ◊&ó6R≤Êñ÷Fñˆ„¢ÊˆÊRñ◊˜'FÁC≤˜6óGì¢ñ◊˜'FÁC≤G&Á6f˜&”¢ÊˆÊRñ◊˜'FÁC≤–¢Ê«WÇ÷∆ñgB¬Ê«WÇ÷∆ñgC¶Ü˜fW"¬Ê«WÇ÷∆ñgC¶7FófR≤G&Á6f˜&”¢ÊˆÊRñ◊˜'FÁC≤&˜Ç◊6ÜF˜s¢ÊˆÊS≤–¢Ê«WÇ÷6∆ó£¶gFW"≤G&Á6óFñˆ„¢ÊˆÊRñ◊˜'FÁC≤–¢Ê«WÇ◊V∆ñÊS£¶gFW"¬ÁF"÷∆&V√£¶gFW"¬Ê«WÇ÷'&˜r¬Ê«WÇ÷7F£¶&Vf˜&R≤G&Á6óFñˆ„¢ÊˆÊRñ◊˜'FÁC≤–¢Ê«WÇ÷7F¶7FófR≤G&Á6f˜&”¢ÊˆÊRñ◊˜'FÁC≤–¢Á7◊7ñ‚≤Êñ÷Fñˆ„¢ÊˆÊRñ◊˜'FÁC≤–¢–†¢Ú¢)H)H‰TÛ¢ÊVÚ◊6∂WVˆ÷˜'Üñ2á6ˆgB’Tíí6∂ñ‚)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H ¢÷ˆÊˆ6á&ˆ÷RWáG'VFVB6ÜF˜w2˜fW"6ñÊv∆RÊWWG&¬&6RÑ2Ê&rí‚6∂ñ‡¢ˆÊ«ì¢ÊÚ∆ñ˜WB˜"6V÷ÁFñ26ÜÊvR‚FWáB7Fó2F&≤ÊBFÜR&˜b¢7FGW26Üó2∂VWFÜVó"6ˆ∆˜W'2¬6ÚFÜR*sr6ˆÁG&7B¬ÊÚ◊&VB÷w&VV‚Ê@¢ÜˆÊW7Gí÷fˆ˜FW"6ˆÁG&7Bó2VÁF˜V6ÜVB‚∆¬G&Á6óFñˆÁ2FVw&FRf∆@¢VÊFW"&VfW'2◊&VGV6VB÷÷˜Fñˆ‚fñFÜR&∆ˆ6≤&˜fR≤FÜRwV&B&V∆˜r‚¢¢ß&ˆ˜B∞¢“÷ÊVÚ÷&6S¢6SfV&c#∞¢“÷ÊVÚ÷F&≥¢&v&ÉsB¬Éí¬#"¬„SRì∞¢“÷ÊVÚ÷∆ñváC¢&v&É#SR¬#SR¬#SR¬„íì∞¢“÷ÊVÚ◊&ó6S¢gÇgÇGÇf"Ç“÷ÊVÚ÷F&≤í¬”gÇ”gÇ7Çf"Ç“÷ÊVÚ÷∆ñváBì∞¢“÷ÊVÚ◊&ó6R÷∆s¢óÇóÇ#'Çf"Ç“÷ÊVÚ÷F&≤í¬”óÇ”óÇ#Çf"Ç“÷ÊVÚ÷∆ñváBì∞¢“÷ÊVÚ◊&ó6R◊6”¢GÇGÇóÇf"Ç“÷ÊVÚ÷F&≤í¬”GÇ”GÇóÇf"Ç“÷ÊVÚ÷∆ñváBì∞¢“÷ÊVÚ÷ñÁ6WC¢ñÁ6WB7Ç7ÇwÇf"Ç“÷ÊVÚ÷F&≤í¬ñÁ6WB”7Ç”7ÇwÇf"Ç“÷ÊVÚ÷∆ñváBì∞¢–¢Ú¢&WG&ˆfóBFÜR7FÊF&BvÜóFR6&B6ñvÊGW&RñÁFÚ6ˆgBWáG'VFVB7W&f6R‡¢FÜR6ˆ◊˜VÊB6V∆V7F˜"&WVó&W2FÜRvÜóFR&6∂w&˜VÊB‰BFÜR‰UUE$¿¢2Ê&˜&FW"á&v"É##r√#32√#Cíí‰B6&B&FóW2¬6ÚV∆V÷VÁG2g&÷VBvóFÇ¢∆ˆB÷&V&ñÊr66VÁB˜FV¬&˜&FW"áF"&"¬ñÁWG2¬V◊Ü6ó2&˜ÜW2¬÷F6ÜV@¢ñ∆«2í&R‰UdU"÷F6ÜVBÊB∂VWFÜVó"÷VÊñÊvgV¬&˜&FW"‚&˜Ç◊6ÜF˜ró0¢ñÁFVÁFñˆÊ∆«í‰ıBñ◊˜'FÁC¢‚V∆V÷VÁBvóFÇóG2˜v‚ñÊ∆ñÊR6ÜF˜p¢Üf∆ˆFñÊrG&vW'2¬Fñ∆ˆw2¬Fˆ7G2í∂VW2óG2V∆WfFñˆ„≤ˆÊ«íFÜRf∆@¢6&G2“vÜñ6Ç6WBÊÚ6ÜF˜r“ñ6≤WFÜR6ˆgB&ó6R‚¢¢Ê÷ñ‚÷6ˆÁFVÁB∑7Gñ∆R£“'&v"É#SR¬#SR¬#SRí%’∑7Gñ∆R£“'&v"É##r¬#32¬#Cí%’∑7Gñ∆R£“&&˜&FW"◊&FóW3¢Ç%“¿¢Ê÷ñ‚÷6ˆÁFVÁB∑7Gñ∆R£“'&v"É#SR¬#SR¬#SRí%’∑7Gñ∆R£“'&v"É##r¬#32¬#Cí%’∑7Gñ∆R£“&&˜&FW"◊&FóW3¢GÇ%“¿¢Ê÷ñ‚÷6ˆÁFVÁB∑7Gñ∆R£“'&v"É#SR¬#SR¬#SRí%’∑7Gñ∆R£“'&v"É##r¬#32¬#Cí%’∑7Gñ∆R£“&&˜&FW"◊&FóW3¢gÇ%“∞¢&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ◊&ó6Rì∞¢&˜&FW"÷6ˆ∆˜#¢&v&É#SR¬#SR¬#SR¬„bíñ◊˜'FÁC∞¢–¢Ê÷ñ‚÷6ˆÁFVÁB∑7Gñ∆R£“'&v"É#SR¬#SR¬#SRí%’∑7Gñ∆R£“'&v"É##r¬#32¬#Cí%’∑7Gñ∆R£“&&˜&FW"◊&FóW3¢gÇ%“∞¢&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ◊&ó6R◊6“ì∞¢&˜&FW"÷6ˆ∆˜#¢&v&É#SR¬#SR¬#SR¬„SRíñ◊˜'FÁC∞¢–¢Ú¢&WW6&∆RÊVÚ&ñ÷óFófW2f˜"6ˆ◊ˆÊVÁG2FÜB˜Bñ‚Wá∆ñ6óF«í¢¢ÊÊVÚ◊7W&f6R≤&6∂w&˜VÊC¢6ffc≤&˜&FW#¢Ç6ˆ∆ñB&v&É#SR¬#SR¬#SR¬„bì≤&˜&FW"◊&FóW3¢gÉ≤&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ◊&ó6Rì≤–¢ÊÊVÚ÷ñÁ6WB≤&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ÷ñÁ6WBíñ◊˜'FÁC≤&˜&FW"÷6ˆ∆˜#¢G&Á7&VÁBñ◊˜'FÁC≤–¢ÊÊVÚ◊&W72≤G&Á6óFñˆ„¢&˜Ç◊6ÜF˜r„g2V6R¬G&Á6f˜&“„'2V6S≤–¢ÊÊVÚ◊&W73¶7FófR≤&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ÷ñÁ6WBíñ◊˜'FÁC≤G&Á6f˜&”¢G&Á6∆FUíÉÇì≤–¢Ú¢Ww&FRFÜRWÜó7FñÊr≈UÇ6á&ˆ÷RFÚFÜR6ˆgB’Tí∆ÊwVvR¢¢Ê«WÇ÷∆ñgC¶Ü˜fW"≤&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ◊&ó6R÷∆ríñ◊˜'FÁC≤–¢Ê«WÇ◊6V&6Ç≤&6∂w&˜VÊC¢f"Ç“÷ÊVÚ÷&6Ríñ◊˜'FÁC≤&˜&FW#¢ÊˆÊRñ◊˜'FÁC≤&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ÷ñÁ6WBíñ◊˜'FÁC≤–¢Ú¢∂VWFÜRñÁ6WBvV∆¬¬'WBFÜR∂Wñ&ˆ&Bfˆ7W2Ü∆Ú◊W7B7Fí6∆V&«ê¢fó6ñ&∆Rˆ‚FÜRF&∂W"“÷ÊVÚ÷&6RÉ„”3£í“6ˆ∆ñB◊7G&VÊwFÇ&«VR&ñÊr¢¢Ê«WÇ◊6V&6É¶fˆ7W2◊vóFÜñ‚≤&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ÷ñÁ6WBí¬7Ç&v&É#b¬Éb¬#í¬„ÉRíñ◊˜'FÁC≤–¢Ê«WÇ÷7F≤&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ◊&ó6R◊6“íñ◊˜'FÁC≤–¢Ê«WÇ÷7F¶Ü˜fW"≤&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ◊&ó6R÷∆ríñ◊˜'FÁC≤fñ«FW#¢6GW&FRÉ„Bì≤–¢Ê«WÇ÷7F¶7FófR≤&˜Ç◊6ÜF˜s¢f"Ç“÷ÊVÚ÷ñÁ6WBíñ◊˜'FÁC≤G&Á6f˜&”¢G&Á6∆FUíÉÇì≤–¢÷VFñá&VfW'2◊&VGV6VB÷÷˜Fñˆ„¢&VGV6Rí∞¢ÊÊVÚ◊&W72¬ÊÊVÚ◊&W73¶7FófR≤G&Á6óFñˆ„¢ÊˆÊRñ◊˜'FÁC≤G&Á6f˜&”¢ÊˆÊRñ◊˜'FÁC≤–¢–¢”¬˜7Gñ∆S‡¢∆FóbFF÷WFÜ˜#“$G&ñ‚≤‚¬‚Êr"FF÷˜&ñvñ„“'F∂V&˜VÊF&˜WBÊ6ˆ“"FF÷'Vñ∆C“'cR”##b ¢FF◊FW7FñC“'&W7ˆÁ6ófR◊&Vf∆ñváB"FF◊&W7ˆÁ6ófR◊&ˆfñ∆S◊∂FWfñ6U&ˆfñ∆RÁ&ˆfñ∆UfW'6ñˆÁ–¢FF÷f˜&“÷f7F˜#◊∂FWfñ6U&ˆfñ∆RÊf˜&‘f7F˜'“FF◊6ó¶R◊FñW#◊∂FWfñ6U&ˆfñ∆RÁ6ó¶UFñW'–¢FF÷˜&ñVÁFFñˆ„◊∂FWfñ6U&ˆfñ∆RÊ˜&ñVÁFFñˆÁ“FF÷7V7B◊FñW#◊∂FWfñ6U&ˆfñ∆RÊ7V7EFñW'–¢FF÷FWfñ6R÷f÷ñ«ì◊∂FWfñ6U&ˆfñ∆RÊFWfñ6Tf÷ñ«ó–¢7Gñ∆S◊∑≤÷ñ‰ÜVñváC¢'f"Ç“÷÷ÜVñváB¬7fÇí"¬&6∂w&˜VÊC§2Ê&r¬6ˆ∆˜#§2ÁFWáB¬fˆÁDf÷ñ«ì¢"tî$“∆WÇ6Á2r¬tñÁFW"r«7ó7FV“◊Ví¬÷∆R◊7ó7FV“¬u6VvˆRTír≈&ˆ&˜FÚ«6Á2◊6W&ñb"¬vñGFÉ¢#R"¬÷ÖvñGFÉ¢#gr"¬˜fW&f∆˜uÉ¢&6∆ó"¬˜6óFñˆ„¢'&V∆FófR"¬"“◊&W7ˆÁ6ófR◊gr#¢FWfñ6U&ˆfñ∆RÁfñWw˜'EvñGFÇ≤'Ç"¬"“◊&W7ˆÁ6ófR◊fÇ#¢FWfñ6U&ˆfñ∆RÁfñWw˜'DÜVñváB≤'Ç"◊”‡¢≤Ú¢*íG&ñ‚≤‚¬‚Êr¬F∂V&˜VÊF&˜WBÊ6ˆ“¬˜&ñvñÊ¬6˜W&6R“VÊWFÜ˜&ó6VB&VFó7G&ñ'WFñˆ‚ó2Ê˜BW&÷óGFVB¢˜–†¢≤Ú¢≈UÉ¢÷&ñVÁBFá&VRÊß2fñV∆B&VÜñÊBFÜR∆ÊFñÊr≤Ê«ó6ó267&VVÁ2ÜFV6˜&FófRˆÊ«ì∞¢∆ßí6áVÊ≤“Fá&VR7Fó2˜WBˆbFÜR÷ñ‚'VÊF∆S≤&VGV6VB÷÷˜Fñˆ‚ıvV$t¬÷∆W72”‚552v6Çí¢˜–¢≤Ú¢áV÷‚∆VB¬3”rs#c¢'FÜRfó'7BvRFˆW6‚wBÜfRFÜRÊWGv˜&≤VffV7BˆbÊˆFW0¢ÊB7vófV¬¬ˆÊ«í&WGvVV‚7FWb"ÊB7FW"b2"‚FÜRÊˆFRfñV∆Bó2E$Â4ïDîÙ‡¢VffV7B¬Ê˜B∆ÊFñÊrFV6˜&Fñˆ‚“óBÊ˜r&VÊFW'2ˆÊ«ívÜñ∆R7FWó27GV∆«í&VñÊp¢7&˜76VBÇ'6V&6ÜñÊr"“”‚"¬&∆ˆFñÊr"“"”‚2í¬6ÚFÜR∆ÊFñÊrÊBFÜRW'&˜ ¢7FFR&RVñWBÊBFÜR÷˜Fñˆ‚÷VÁ26ˆ÷WFÜñÊrvÜV‚óBV'2‚¢˜–¢≤á7FW””“'6V&6ÜñÊr"«¬7FW””“&∆ˆFñÊr"íbbÄ¢≈7W7VÁ6Rf∆∆&6≥◊∂ÁV∆«”‡¢ƒ÷&ñVÁD&6∂G&˜÷ˆFS“&7FófR"Û‡¢¬ı7W7VÁ6S‡¢ó–†¢∂6ˆ◊&Uv&ÊñÊrbbÄ¢ƒ6ˆ◊&Uv&ÊñÊt÷ˆF¿¢ˆ‰6ˆÊfó&”◊≤Çí”‚∞¢6ˆ◊&ó6ˆÁ5&VbÊ7W'&VÁB“µ”∞¢6WD6ˆ◊&ó6ˆÁ2Öµ“ì∞¢6WD6ˆ◊&Uv&ÊñÊrÜÁV∆¬ì∞¢6ˆ◊&Uv&ÊñÊrÊˆ‰6ˆÊfó&“Çì∞¢◊–¢ˆ‰6Ê6V√◊≤Çí”‚6WD6ˆ◊&Uv&ÊñÊrÜÁV∆¬ó–¢Û‡¢ó–¢≤Ú¢f∆WÖw&¢BÜˆÊRvñGFá2FÜR'WGFˆÁ2w&T‰DU"FÜRFóF∆RñÁ7FVBˆb˜fW&∆ñÊróB¢˜–¢≤Ú¢˜6óFñˆ‚∑§ñÊFWÉ¢7Fñ6∑í◊ñÊÊVB¬˜VR2ÊWRÜVFW"FÜB7Fó2&˜fRvR6ˆÁFVÁBÊBFÜP¢7Fñ6∑í∆VgBÊb&ñ¬áF˜£cBí‚§ñÊFWÉ£S6∆V'2&˜FÇFÜR&ñ¬ÊBFÜR≈UÉ&6∂G&˜∆ñW"¢˜–¢∆FóbFF◊FW7FñC“'6óFR÷ÜVFW""7Gñ∆S◊∑≤&6∂w&˜VÊC§2ÊWR¬FFñÊs¢ó57FWÜˆÊRÚ#áÇ'Ç"¢#ÇgÇ"¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢ó57FWÜˆÊRÚÇ¢¬vñGFÉ¢#R"¬&˜Ö6ó¶ñÊs¢&&˜&FW"÷&˜Ç"¬f∆WÖw&¢ó57FWÜˆÊRÚ&Ê˜w&"¢'w&"¬˜6óFñˆ„¢'7Fñ6∑í"¬F˜£¬§ñÊFWÉ£S¬÷ñ‰ÜVñváC¢ó57FWÜˆÊRÚc¢VÊFVfñÊVB◊”‡¢«7‚7Gñ∆S◊∑≤6ˆ∆˜#§2ÊWU7F"¬fˆÁE6ó¶S¢#„#W&V“"¬f∆WÖ6á&ñÊ≥£◊”Ó)àS¬˜7„‡¢∆Fób7Gñ∆S◊∑≤f∆WÉ¢ó57FWÜˆÊRÚ#WFÚ"¢##Ç"¬÷ñÂvñGFÉ£◊”‡¢∆É7Gñ∆S◊∑≤÷&vñ„£¬fˆÁE6ó¶S¢ó57FWÜˆÊRÚ#&V“"¢#„É#W&V“"¬fˆÁEvVñváC£sS¬6ˆ∆˜#¢"6fffffb"¬∆ñÊTÜVñváC£„#R◊“6∆74Ê÷S“'6óFR◊FóF∆R#Á∂ó57FWÜˆÊRÚ$˜&vÊó6Fñˆ‚6V&6Ç"¢$í&VFñÊW727&˜726∂ñ∆«2ÊB6ˆ◊WFVÊ6W2'”¬ˆÉ‡¢¬ˆFóc‡¢≤ó57FWÜˆÊRbb∆á&Vc“&áGG3¢Ú˜wwrÁF∂V&˜VÊF&˜WBÊ6ˆ“"&ñ÷∆&V√“%7vóF6ÇFÚc"“U44ÚUR6∂ñ∆«6WG2 ¢7Gñ∆S◊∑≤&6∂w&˜VÊC¢'&v&É#SR√#SR√#SR√„Rí"¬&˜&FW#¢#Ç6ˆ∆ñB&v&É#SR√#SR√#SR√„3Rí"¬&˜&FW%&FóW3£b¬6ˆ∆˜#¢"6ffb"¬FFñÊs¢#gÇ'Ç"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC£c¬FWáDFV6˜&Fñˆ„¢&ÊˆÊR"¬vÜóFU76S¢&Ê˜w&"¬f∆WÖ6á&ñÊ≥£¬Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬÷ñ‰ÜVñváC£CB¬&˜Ö6ó¶ñÊs¢&&˜&FW"÷&˜Ç"◊”‡¢c"“U44ÚUR6∂ñ∆«6WG0¢¬ˆÁ–¢∑7FW”“&ñF∆R"bbÄ¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊∑&W6WG“7Gñ∆S◊∑≤&6∂w&˜VÊC¢'&v&É#SR√#SR√#SR√„Rí"¬&˜&FW#¢#Ç6ˆ∆ñB&v&É#SR√#SR√#SR√„3Rí"¬&˜&FW%&FóW3£b¬6ˆ∆˜#¢"6ffb"¬FFñÊs¢#gÇ'Ç"¬7W'6˜#¢'ˆñÁFW""¬fˆÁE6ó¶S¢#„sW&V“"¬vÜóFU76S¢&Ê˜w&"¬f∆WÖ6á&ñÊ≥£¬Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬÷ñ‰ÜVñváC£CB¬&˜Ö6ó¶ñÊs¢&&˜&FW"÷&˜Ç"◊”‡¢ÊWr6V&6Ä¢¬ˆ'WGFˆ„‡¢ó–¢≤Ú¢áV÷‚∆VB¬3”rs#c¢'&V÷˜fRFÜRFWáB“Ú≤g&ˆ“ÜVFW""‚FÜR“ÚÚ≤7FWW ¢v2Fá&VRW&÷ÊVÁB'WGFˆÁ2ñ‚FÜR÷7FÜVBf˜"6ˆÁG&ˆ¬÷˜7B&VFW'26WBˆÊ6P¢ÊBÊWfW"F˜V6Ç‚óB÷˜fW2ñÁFÚFÜR7FW2f∆ˆFñÊr◊vñÊF˜r6WGFñÊw2áFÜRvV"ˆ‡¢FÜRvñÊF˜rw2&˜GFˆ“7G&óì≤FÜR66∆RóG6V∆b¬óG2W'6ó7FVÊ6RÊBóG2∂Wñ&ˆ&@¢6Ü˜'F7WG2&RVÁF˜V6ÜVB“ˆÊ«íFÜRVÁG'íˆñÁB÷˜fVB‚¢˜–¢≤ó57FWÜˆÊRbbƒ66˜VÁD6ˆÁG&ˆ¬ÛÁ–¢¬ˆFóc‡†¢≤Ú¢Fˆ7BÊ˜Fñfñ6Fñˆ‚¢˜–¢≤Ú¢&6≤FÚF˜'WGFˆ‚“V'2gFW"CÇ67&ˆ∆¬¬&ñváB÷Ê6Ü˜&VB¢˜–¢∑6Ü˜t&6µF˜bbÄ¢∆'WGFˆ‡¢ˆ‰6∆ñ6≥◊≤Çí”‚vñÊF˜rÁ67&ˆ∆≈FÚá≤F˜¢¬&VÜfñ˜#¢'6÷ˆ˜FÇ"“ó–¢&ñ÷∆&V√“$&6≤FÚF˜ ¢7Gñ∆S◊∑∞¢˜6óFñˆ„¢&fóÜVB"¬&˜GFˆ”¢#B¬&ñváC¢Ç¬§ñÊFWÉ¢ììÇ¿¢Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v¢R¿¢FFñÊs¢#áÇGÇáÇÇ"¿¢&6∂w&˜VÊC¢'&v&É#b√Éb√#í√„ì"í"¬&6∂G&˜fñ«FW#¢&&«W"ÉgÇí"¿¢&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢b¿¢6ˆ∆˜#¢"6ffb"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC¢s¿¢7W'6˜#¢'ˆñÁFW""¬&˜Ö6ÜF˜s¢#'Ç'Ç&v&É√√√„Çí"¿¢Êñ÷Fñˆ„¢&fFTñÂW„#W2V6R"¿¢W6W%6V∆V7C¢&ÊˆÊR"¿¢◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„ÉsW&V“"¬∆ñÊTÜVñváC¢◊”Ó(i¬˜7„‡¢«7„ÂF˜¬˜7„‡¢¬ˆ'WGFˆ„‡¢ó–†¢≤Ú¢Fˆ7B7F6≤áv2Üˆ÷Vw&˜v‚6ñÊv∆R◊6∆˜BFóbvóFÇÊÚWÜóBÊñ÷Fñˆ‚ÊBÊ¢7F6∂ñÊrí“6ˆÊÊW"vófW2&˜W"VÁFW"ˆWÜóBG&Á6óFñˆÁ2ÊBVWVW2◊V«Fó∆P¢Fˆ7G2ñÁ7FVBˆbˆÊ«íWfW"6Ü˜vñÊrˆÊR‚7Gñ∆VBFÚ÷F6ÇFÜRw2WÜó7FñÊp¢&«VRFˆ7BñFVÁFóGíÇ3SfF"í&FÜW"FÜ‚6ˆÊÊW"w2FVfV«B∆ˆˆ≤‚¢˜–¢≈Fˆ7FW"˜6óFñˆ„“&&˜GFˆ“÷6VÁFW""Fˆ7D˜FñˆÁ3◊∑∞¢7Gñ∆S¢≤&6∂w&˜VÊC¢"3SfF""¬6ˆ∆˜#¢"6ffb"¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC¢c¬&˜Ö6ÜF˜s¢#GÇ#Ç&v&É√√√„Çí"“¿¢◊“Û‡¢∆÷ñ‚6∆74Ê÷S◊≤&÷ñ‚÷6ˆÁFVÁB"≤Üó57FWÜˆÊRÚ"7FW÷÷ˆ&ñ∆R÷÷ñ‚"¢""ó“ñC“&÷ñ‚÷6ˆÁFVÁB"&ˆ∆S“&÷ñ‚"&ñ÷∆&V√“$¶ˆ"6∂ñ∆«2Ê«ó6W""7Gñ∆S◊∑≤˜6óFñˆ„¢'&V∆FófR"¬§ñÊFWÉ£◊”‡†¢≤á7FW””“&ñF∆R"«¬7FW””“&W'&˜""íbbÄ¢√‡¢≤Ú¢6V&6Ç&˜Ç“Dıˆb67&VV‚¬fó'7BFÜñÊrW6W"6VW2‚≈UÉv∆72≤≈UÉ2fˆ7W2v∆˜r‡¢&˜&FW"˜6ÜF˜r∆ófRñ‚Ê«WÇ◊6V&6Ç6Ú¶fˆ7W2◊vóFÜñ‚6‚∆ñváBFÜR&ñÊr‚¢˜–¢∆Fób6∆74Ê÷S“&«WÇ◊6V&6Ç«WÇ◊&ó6R"7Gñ∆S◊∑≤&6∂w&˜VÊC¢'&v&É#SR√#SR√#SR√„ÉÇí"¬&6∂G&˜fñ«FW#¢&&«W"ÉÇí"¬vV&∂óD&6∂G&˜fñ«FW#¢&&«W"ÉÇí"¬&˜&FW%&FóW3£B¬FFñÊs£b¬÷&vñ‰&˜GFˆ”£"◊”‡¢«7‚ñC“'6V&6Ç÷ÜñÁB"7Gñ∆S◊∑≤˜6óFñˆ„¢&'6ˆ«WFR"¬vñGFÉ£¬ÜVñváC£¬˜fW&f∆˜s¢&ÜñFFV‚"¬6∆ó¢'&V7BÉ√√√í"¬vÜóFU76S¢&Ê˜w&"◊”‡¢GóR¶ˆ"FóF∆R¬6V∆V7BFÜR6∆˜6W7B÷F6ÜñÊr&ˆ∆R¬FÜV‚Ê«ó6RFÜR&ˆ∆R‚ñ˜R6‚«6Ú'&˜w6R∆ófR6ñÊv˜&R¶ˆ'2g&ˆ“◊î6&VW'4gWGW&RÊB6&VW'2Êv˜bÁ6r‚ñ‚'&˜w6RÊB6V&6Ç÷'í÷V◊∆˜ñW"÷ˆFW2¬54Ù2##B7VvvW7FñˆÁ2÷íV"VÊFW"FÜR6V&6Ç&˜ÇFÚÜV«&VfñÊRñ˜W"6V&6Çv˜&G2‡¢¬˜7„‡¢∆Fób7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”£"◊”‡¢∆É"6∆74Ê÷S“'B÷ÜVFñÊr"7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„W&V“"¬fˆÁEvVñváC£É¬6ˆ∆˜#§2ÁFWáB¬∆ñÊTÜVñváC£„Ç¬∆WGFW%76ñÊs¢"”„6V“"¬FWáEw&¢&&∆Ê6R"◊”‡¢VÊFW'7FÊB6ñÊv˜&R¶ˆ"&Vf˜&Rñ˜R«ê¢¬ˆÉ#‡¢«7Gñ∆S◊∑≤÷&vñ„£¬fˆÁE6ó¶S¢#„ÉsW&V“"¬6ˆ∆˜#§2ÁFWáE7V"¬∆ñÊTÜVñváC£„SR◊”‡¢GóR¶ˆ"FóF∆R¬6V∆V7BFÜR6∆˜6W7B÷F6Ç¬FÜV‚'&˜w6R∆ófR	¯{è	¯z¬4r¶ˆ'2g&ˆ“◊î6&VW'4gWGW&RÊB6&VW'2Êv˜bÁ6r‡¢¬˜‡¢¬ˆFóc‡†¢≤Ú¢c2„#¢÷ˆFRFˆvv∆R“Ê«ó6R&ˆ∆RÑU44Úíg2'&˜w6R∆ófR4r¶ˆ"˜7FñÊw2¢˜–¢≤Ú¢4Û¢FÜó&B6&B“6ˆ◊Áí÷Ê÷R6V&6ÇÜV◊∆˜ñW"∆ˆˆ∑W≤˜7FñÊr6˜VÁBí¢˜–¢≤Ú¢áV÷‚∆VB¬3”rs#c¢Ù‰R&˜rˆbf˜W"ˆ‚FW6∑F˜‚FÜRˆ∆Bf∆WÇ#3R ¢÷FRf˜W"6&G2w&FÚ'É"¬ÊBFÜRGóRÜBG&ñgFVBF˜v‚FÚÇ¬vÜñ6Ä¢&VG22fñÊR&ñÁBˆ‚FÜRw26ñÊv∆R÷˜7Bñ◊˜'FÁBFV6ó6ñˆ‚‚FÜRw&ñ@¢∆ófW2ñ‚Ê«Ç÷÷ˆFW2Ñ552í6ÚóB6‚Üˆ∆B&V¬'&V∑ˆñÁG3¢B◊Wˆ‡¢FW6∑F˜¬"◊Wˆ‚F&∆WB¬7F6∂VBˆ‚ÜˆÊR‚GóRó27FÊF&Fó6VBˆ‚FÜP¢Ü˜W6Rf∆ˆ˜"“GÇ∆&V¬¬'Ç7W˜'FñÊrFWáBBR'&˜w6W"¶ˆˆ“‚¢˜–¢≤Ú¢FÜR'V∆Ró2÷˜VÁFVBÑU$R¬&W6ñFRFÜRw&ñBóB7Gñ∆W2¬&FÜW"FÜ‚ñ‚FÜP¢÷ñ‚7Gñ∆W6ÜVWB“FÜR∆ÊFñÊr&VÊFW'2Fá&˜VvÇ‚V&∆ñW"&WGW&‚FÜ@¢ÊWfW"÷˜VÁG2FÜB&∆ˆ6≤¬6Ú6∆72FVfñÊVBFÜW&R6ñ∆VÁF«íFˆW2Ê˜FÜñÊp¢áFÜRf˜W"6&G27FñVB7F6∂VBí‚∆ˆ6¬ÊB6V∆b÷6ˆÁFñÊVB‚¢˜–¢«7Gñ∆SÁ∂ ¢Ê«Ç÷÷ˆFW2≤Fó7∆ì¢w&ñC≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3¢&WVBÉB¬÷ñÊ÷ÇÉ¬g"íì≤v¢áÉ≤∆ñv‚÷óFV◊3¢7G&WF6É≤–¢÷VFñÜ÷Ç◊vñGFÉ¢ìÇí≤Ê«Ç÷÷ˆFW2≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3¢&WVBÉ"¬÷ñÊ÷ÇÉ¬g"íì≤“–¢÷VFñÜ÷Ç◊vñGFÉ¢S#Çí≤Ê«Ç÷÷ˆFW2≤w&ñB◊FV◊∆FR÷6ˆ«V÷Á3¢g#≤“–¢”¬˜7Gñ∆S‡¢∆Fób6∆74Ê÷S“&«Ç÷÷ˆFW2"7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”£◊”‡¢µ∞¢≤≥¢'&ˆ∆R"¬∆&V√¢$Ê«ó6R&ˆ∆R"¬7V#¢%GóR¶ˆ"FóF∆Rfó'7B"¬FW63¢%6V∆V7BFÜR6∆˜6W7B÷F6ÜñÊr&ˆ∆R&Vf˜&RÊ«ó6ó2‚"“¿¢≤≥¢&¶ˆ'2"¬∆&V√¢$'&˜w6R4r¶ˆ'2"¬6˜W&6S¢%6˜W&6W3¢◊î6&VW'4gWGW&R≤6&VW'2Êv˜bÁ6r"¬FW63¢$Wá∆˜&R7W'&VÁB6ñÊv˜&R˜VÊñÊw2“V&∆ñ26W'fñ6RÊB&ófFR6V7F˜"“ÊB6ˆ◊&RvÜBV◊∆˜ñW'2&R6∂ñÊrf˜"‚"“¿¢≤≥¢&6ˆ◊Áí"¬∆&V√¢%6V&6Ç'íV◊∆˜ñW""¬6˜W&6S¢%6˜W&6W3¢◊î6&VW'4gWGW&R≤6&VW'2Êv˜bÁ6r"¬FW63¢%GóR‚V◊∆˜ñW"Ê÷R“&ófFR6ˆ◊ÊñW2ˆ‚‘4b¬÷ñÊó7G&ñW2ÊB7FGWF˜'í&ˆ&G2«6Úˆ‚6&VW'2Êv˜bÁ6r‚"“¿¢≤≥¢'vñ∂í"¬∆&V√¢$6&VW"vñ∂îw&Ç"¬FW63¢%6VR&ˆ∆R2∆ófñÊrV6˜7ó7FV““ˆÊR6VÁG&R¬'&Ê6Ç˜WB‚"“¿¢“Ê÷Ü“”‚Ä¢∆Fób∂Wì◊∂“Ê∑–¢7Gñ∆S◊∑≤÷ñÂvñGFÉ£¬Fó7∆ì¢&f∆WÇ"¬f∆WÑFó&V7Fñˆ„¢&6ˆ«V÷‚"¬&˜&FW%&FóW3¢¬˜fW&f∆˜s¢&ÜñFFV‚"¿¢&˜&FW#¶'Ç6ˆ∆ñBG∑6V&6Ñ÷ˆFS””÷“Ê≤Ú"3ì63VfB"¢2Ê&˜&FW'÷¿¢&6∂w&˜VÊC¢2Á7W&f6R◊”‡¢∆'WGFˆ‚GóS“&'WGFˆ‚"&ñ◊&W76VC◊∑6V&6Ñ÷ˆFS””÷“Ê∑–¢ˆ‰6∆ñ6≥◊≤Çí”‚≤6WE6V&6Ñ÷ˆFRÜ“Ê≤ì≤6WDˆ672Öµ“ì≤6WDW'"Ç""ì≤6WE76ˆ4ˆ672Öµ“ì≤6WE76ˆ5VW'íÇ""ì≤vñ∂îFW7E&VbÊ7W'&VÁB“Ü“Ê≤””“'vñ∂í"ì≤ñbÜ“Ê≤””“&6ˆ◊Áí"í6WEW'6ˆÊÜÁV∆¬ì≤Fˆ7V÷VÁBÊvWDV∆V÷VÁD'îñBÇ&¶ˆ"◊FóF∆R◊6V&6Ç"ìÚÊfˆ7W2Çì≤◊–¢7Gñ∆S◊∑≤f∆WÉ£¬FWáD∆ñv„¢&∆VgB"¬FFñÊs¢#Ç7Ç"¬÷ñ‰ÜVñváC£CB¬&6∂w&˜VÊC¢'G&Á7&VÁB"¬&˜&FW#¢&ÊˆÊR"¬7W'6˜#¢'ˆñÁFW""¬fˆÁC¢&ñÊÜW&óB"◊”‡¢«7‚7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬fˆÁE6ó¶S¢#„ÉsW&V“"¬fˆÁEvVñváC£s¬6ˆ∆˜#¢6V&6Ñ÷ˆFS””÷“Ê≤Ú2Ê66VÁB¢2ÁFWáB◊”Á∂“Ê∆&V«”¬˜7„‡¢∂“Á6˜W&6Rbb«7‚7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñÂF˜£2¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC£s¬6ˆ∆˜#§2ÁFWáE7V"◊”Á∂“Á6˜W&6W”¬˜7„Á–¢«7‚7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñÂF˜£2¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#§2ÁFWáE7V"¬∆ñÊTÜVñváC£„CR◊”Á∂“ÊFW62«¬“Á7V'”¬˜7„‡¢¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢íó–¢¬ˆFóc‡†¢∆∆&V¬áF÷ƒf˜#“&¶ˆ"◊FóF∆R◊6V&6Ç"7Gñ∆S◊∑≤Fó7∆ì¢&&∆ˆ6≤"¬÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC£s¬6ˆ∆˜#§2ÁFWáB◊”‡¢∑6V&6Ñ÷ˆFR””“&6ˆ◊Áí"Ú$6ˆ◊ÁíÊ÷R"¢$¶ˆ"FóF∆R˜"&ˆ∆R'–¢¬ˆ∆&V√‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬v£Ç◊”‡¢∆ñÁWBGóS“'6V&6Ç"ñC“&¶ˆ"◊FóF∆R◊6V&6Ç"Ê÷S“&¶ˆ"◊FóF∆R"WFÙ6ˆ◊∆WFS“&ˆfb"6∆74Ê÷S“&«WÇ÷fˆ7W2 ¢&ñ÷∆&V√◊∑6V&6Ñ÷ˆFR””“&6ˆ◊Áí"Ú$6ˆ◊ÁíÊ÷R"¢$¶ˆ"FóF∆R˜"&ˆ∆R'“&ñ÷FW67&ñ&VF'ì“'6V&6Ç÷ÜñÁB ¢&ˆ∆S“'6V&6Ü&˜Ç ¢f«VS◊∑VW'ó“ˆ‰6ÜÊvS◊∂S”Á≤6WEVW'íÜRÁF&vWBÁf«VRì≤◊–¢ˆ‰∂WîF˜v„◊∂S”Á∞¢ñbÜRÊ∂Wí””“$'&˜tF˜v‚"bb76ˆ4ˆ672Ê∆VÊwFÇ‚bb76ˆ4˜FñˆÂ&Vg2Ê7W'&VÁE≥“í∞¢RÁ&WfVÁDFVfV«BÇì≤76ˆ4˜FñˆÂ&Vg2Ê7W'&VÁE≥“Êfˆ7W2Çì≤&WGW&„∞¢–¢ñbÜRÊ∂Wí””“$W66R"bb76ˆ4ˆ672Ê∆VÊwFÇ‚í≤6WE76ˆ4ˆ672Öµ“ì≤&WGW&„≤–¢ñbÜRÊ∂Wì””“$VÁFW""ó≤ñbá6V&6Ñ÷ˆFS””“&6ˆ◊Áí"ó≤7F'D6ˆ◊Áï6V&6ÇÇì≤“V«6Rñbá6V&6Ñ÷ˆFS””“&¶ˆ'2"ó≤7F'D¶ˆ'4'&˜w6RÇì≤“V«6Rñbá6V&6Ñ÷ˆFS””“'vñ∂í"ó≤vñ∂îFW7E&VbÊ7W'&VÁB“G'VS≤Fı6V&6ÇÇì≤“V«6R≤vñ∂îFW7E&VbÊ7W'&VÁB“f«6S≤Fı6V&6ÇÇì≤“–¢◊–¢∆6VÜˆ∆FW#◊∑6V&6Ñ÷ˆFR””“&6ˆ◊Áí"Ú&RÊr‚D%2&Ê≤¬÷ñÊó7G'íˆbÜV«FÇ¬≈D"¢&RÊr‚FFÊ«ó7B¬˜W&FñˆÁ2÷ÊvW"¬Ö"WÜV7WFófR'–¢7Gñ∆S◊∑≤f∆WÉ£¬&6∂w&˜VÊC§2Á7W&f6R¬&˜&FW#¶'Ç6ˆ∆ñBG¥2Ê66VÁG÷¬&˜&FW%&FóW3¢b¬6ˆ∆˜#§2ÁFWáB¬FFñÊs¢#'ÇGÇ"¬fˆÁE6ó¶S¢#&V“"¬fˆÁDf÷ñ«ì¢&ñÊÜW&óB"◊“WFÙfˆ7W2Û‡¢∆'WGFˆ‚6∆74Ê÷S“&«WÇ÷7F«WÇ÷fˆ7W2 ¢ˆ‰6∆ñ6≥◊≤Çí”‚≤ñbá6V&6Ñ÷ˆFS””“&6ˆ◊Áí"ó≤7F'D6ˆ◊Áï6V&6ÇÇì≤“V«6Rñbá6V&6Ñ÷ˆFS””“&¶ˆ'2"ó≤7F'D¶ˆ'4'&˜w6RÇì≤“V«6Rñbá6V&6Ñ÷ˆFS””“'vñ∂í"ó≤vñ∂îFW7E&VbÊ7W'&VÁB“G'VS≤Fı6V&6ÇÇì≤“V«6R≤vñ∂îFW7E&VbÊ7W'&VÁB“f«6S≤Fı6V&6ÇÇì≤“◊–¢&ñ÷∆&V√◊∑6V&6Ñ÷ˆFS””“&6ˆ◊Áí"Ú$fñÊB6ˆ◊Áí˜7FñÊw2"¢6V&6Ñ÷ˆFS””“&¶ˆ'2"Ú$'&˜w6R4r¶ˆ'2"¢6V&6Ñ÷ˆFS””“'vñ∂í"Ú$˜V‚6&VW"vñ∂îw&Ç"¢$Ê«ó6R&ˆ∆R'–¢7Gñ∆S◊∑≤&6∂w&˜VÊC§2ÊWR¬&˜&FW#¢&ÊˆÊR"¬&˜&FW%&FóW3¢Ç¬6ˆ∆˜#¢"6ffb"¬FFñÊs¢#'Ç#'Ç"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC£s¬7W'6˜#¢'ˆñÁFW""¬vÜóFU76S¢&Ê˜w&"¬Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v£r◊”‡¢«7„Á∑6V&6Ñ÷ˆFS””“&6ˆ◊Áí"Ú$fñÊB6ˆ◊Áí"¢6V&6Ñ÷ˆFS””“&¶ˆ'2"Ú$'&˜w6R"¢6V&6Ñ÷ˆFS””“'vñ∂í"Ú%vñ∂îw&Ç"¢$Ê«ó6R&ˆ∆R'”¬˜7„‡¢«7‚6∆74Ê÷S“&«WÇ÷'&˜r"&ñ÷ÜñFFV„“'G'VR"7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„ì3sW&V“"¬∆ñÊTÜVñváC£◊”‚b3ÉSìC≥¬˜7„‡¢¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢≤Ú¢g&W6Ñw&Bfñ«FW'27FW"Ö˜7FñÊtWfñFVÊ6Uñ6∂W"íFÚ˜7FñÊw2ÊVVFñÊr¬BñV'2p¢WáW&ñVÊ6R‚FÜRFˆvv∆RFÜB6WBóBv2G&˜VBg&ˆ“‚V&∆ñW"&VFW6ñv‚ÑÑE ¢3Cbí¬∆VfñÊrFÜRfñ«FW"¬óG26˜VÁG2ÊBóG26FñˆÁ2W&÷ÊVÁF«íñÊW'B–¢&W7F˜&VBÜW&R&FÜW"FÜ‚&V÷˜fñÊrFÜRÜ˜FÜW'vó6R6ˆ◊∆WFRífñ«FW"÷6ÜñÊW'í‚¢˜–¢∑6V&6Ñ÷ˆFR””“&¶ˆ'2"bbÄ¢∆∆&V¬7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v£Ç¬÷&vñÂF˜£¬÷ñ‰ÜVñváC£CB¬7W'6˜#¢'ˆñÁFW""¬vñGFÉ¢&fóB÷6ˆÁFVÁB"◊”‡¢∆ñÁWBGóS“&6ÜV6∂&˜Ç"6ÜV6∂VC◊∂g&W6Ñw&G“ˆ‰6ÜÊvS◊≤ÜRí”‚6WDg&W6Ñw&BÜRÁF&vWBÊ6ÜV6∂VBó–¢7Gñ∆S◊∑≤vñGFÉ£Ç¬ÜVñváC£Ç¬66VÁD6ˆ∆˜#§2Ê66VÁB¬7W'6˜#¢'ˆñÁFW""◊“Û‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„É#W&V“"¬6ˆ∆˜#§2ÁFWáB◊”‰g&W6Çw&GVFW2ˆÊ«í«7‚7Gñ∆S◊∑≤6ˆ∆˜#§2ÁFWáE7V"◊”‚Çf«C≤BñV'2g'7VÛ≤WáW&ñVÊ6Rì¬˜7„„¬˜7„‡¢¬ˆ∆&V√‡¢ó–¢≤Ú¢dƒır”¢54Ù2##BVW'í◊FWáB7VvvW7FñˆÁ2“¶ˆ'2ˆ6ˆ◊Áí÷ˆFW2ˆÊ«í‡¢FñÊr&˜r&Ww&óFW2FÜRVW'í7G&ñÊrˆÊ«íÖ#"í“ÊWfW"vFW0¢7V&÷ó76ñˆ‚¬ÊWfW"fñ«FW'27FW"ˆ6ˆ◊Áí&W7V«G2‚¢˜–¢≤á6V&6Ñ÷ˆFR””“&¶ˆ'2"«¬6V&6Ñ÷ˆFR””“&6ˆ◊Áí"íbbVW'íÁG&ñ“ÇíÊ∆VÊwFÇ„“2bbVW'íÁG&ñ“ÇíÁ7∆óBÇı«2≤ÚíÊfñ«FW"Ñ&ˆˆ∆V‚íÊ∆VÊwFÇ√“"bbá7FW””“&ñF∆R"«¬7FW””“&W'&˜""íbb76ˆ57VvvW7D∆ˆFñÊrbb76ˆ4ˆ672Ê∆VÊwFÇ‚bbÇÇí”‚∞¢6ˆÁ7B&˜w2“76ˆ4ˆ670¢Ê÷ÇÜ‚¬íí”‚á≤‚¬í¬&W6ñGV√¢54Ù5Ù‰T5ı%ÇÁFW7BÜ‚ÁFóF∆R«¬""í“íê¢Á6˜'BÇÜ¬"í”‚ÜÁ&W6ñGV¬””“"Á&W6ñGV¬ÚÊí“"Êí¢ÜÁ&W6ñGV¬Ú¢”ííê¢Á6∆ñ6RÉ¬bì∞¢76ˆ4˜FñˆÂ&Vg2Ê7W'&VÁB“µ”∞¢6ˆÁ7B6V∆V7E7VvvW7Fñˆ‚“áFóF∆Rí”‚∞¢6WEVW'íáFóF∆Rì∞¢6WE76ˆ4ˆ672Öµ“ì∞¢Fˆ7V÷VÁBÊvWDV∆V÷VÁD'îñBÇ&¶ˆ"◊FóF∆R◊6V&6Ç"ìÚÊfˆ7W2Çì∞¢”∞¢&WGW&‚Ä¢∆Fób7Gñ∆S◊∑≤÷&vñÂF˜£Ç◊“&ˆ∆S“&∆ó7F&˜Ç"&ñ÷∆&V√“%54Ù2##B7VvvW7FñˆÁ2#‡¢∑&˜w2Ê÷Çá≤‚¬&W6ñGV¬“¬ñGÇí”‚Ä¢∆'WGFˆ‚GóS“&'WGFˆ‚"∂Wì◊∂‚Ê6ˆFW“&ˆ∆S“&˜Fñˆ‚"&ñ◊6V∆V7FVC“&f«6R ¢&Vc◊≤ÜV¬í”‚≤76ˆ4˜FñˆÂ&Vg2Ê7W'&VÁE∂ñGÖ““V√≤◊–¢ˆ‰6∆ñ6≥◊≤Çí”‚6V∆V7E7VvvW7Fñˆ‚Ü‚ÁFóF∆Ró–¢ˆ‰∂WîF˜v„◊≤ÜRí”‚∞¢ñbÜRÊ∂Wí””“$'&˜tF˜v‚"í∞¢RÁ&WfVÁDFVfV«BÇì∞¢6ˆÁ7BÊWáB“76ˆ4˜FñˆÂ&Vg2Ê7W'&VÁE∂ñGÇ≤”∞¢ñbÜÊWáBíÊWáBÊfˆ7W2Çì∞¢“V«6RñbÜRÊ∂Wí””“$'&˜uW"í∞¢RÁ&WfVÁDFVfV«BÇì∞¢6ˆÁ7B&Wb“76ˆ4˜FñˆÂ&Vg2Ê7W'&VÁE∂ñGÇ“”∞¢ñbá&Wbí&WbÊfˆ7W2Çì≤V«6RFˆ7V÷VÁBÊvWDV∆V÷VÁD'îñBÇ&¶ˆ"◊FóF∆R◊6V&6Ç"ìÚÊfˆ7W2Çì∞¢“V«6RñbÜRÊ∂Wí””“$W66R"í∞¢6WE76ˆ4ˆ672Öµ“ì∞¢Fˆ7V÷VÁBÊvWDV∆V÷VÁD'îñBÇ&¶ˆ"◊FóF∆R◊6V&6Ç"ìÚÊfˆ7W2Çì∞¢“V«6RñbÜRÊ∂Wí””“$VÁFW""«¬RÊ∂Wí””“""í∞¢RÁ&WfVÁDFVfV«BÇì∞¢6V∆V7E7VvvW7Fñˆ‚Ü‚ÁFóF∆Rì∞¢–¢◊–¢7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬v£Ç¬vñGFÉ¢#R"¿¢÷ñ‰ÜVñváC£CB¬FWáD∆ñv„¢&∆VgB"¬&6∂w&˜VÊC§2Á7W&f6R¬&˜&FW#¶Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3£b¿¢FFñÊs¢#áÇ'Ç"¬÷&vñ‰&˜GFˆ”£B¬7W'6˜#¢'ˆñÁFW""¬fˆÁC¢&ñÊÜW&óB"¿¢˜6óGì¢&W6ñGV¬Ú„b¢◊”‡¢«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC£c¬6ˆ∆˜#§2ÁFWáB◊”Á∑FıFóF∆T66RÜ‚ÁFóF∆Ró”¬˜7„‡¢«7‚7Gñ∆S◊∑≤Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v£b¬f∆WÖ6á&ñÊ≥£◊”‡¢∑&W6ñGV¬bb«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„c#W&V“"¬fˆÁEvVñváC£s¬6ˆ∆˜#§2Ê◊WFVB¬&˜&FW#¶Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3£¬FFñÊs¢#'ÇgÇ"◊”Á&W6ñGV√¬˜7„Á–¢«7‚7Gñ∆S◊∑≤fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#§2Ê◊WFVB◊”Á∂‚Ê6ˆFW“µ7G&ñÊrÊg&ˆ‘6Ü$6ˆFRÉÉ#ró“∂‚Ê∂ñÊG”¬˜7„‡¢¬˜7„‡¢¬ˆ'WGFˆ„‡¢íó–¢«7Gñ∆S◊∑≤÷&vñ„¢#'Ç"¬fˆÁE6ó¶S¢#„c#W&V“"¬6ˆ∆˜#§2Ê◊WFVB¬∆ñÊTÜVñváC£„R◊”‡¢7VvvW7FñˆÁ2g&ˆ“54Ù2##BÖ6ñÊu7FBíFÚ&VfñÊRñ˜W"6V&6Çv˜&G2“W6R'&˜r∂Wó2FÚ÷˜fR¬VÁFW"FÚñ6≤¬W66RFÚ6∆˜6R‚ñ6∂ñÊrˆÊRˆÊ«í6ÜÊvW2FÜRFWáBñ˜RGóVB“óBFˆW2Ê˜Bfñ«FW"&W7V«G2‡¢¬˜‡¢¬ˆFóc‡¢ì∞¢“íÇó–¢≤Ú¢cc¢&ˆw&W76ófRñ6∂W"“6Ü˜w22W6W"GóW2¬&Vf˜&R&W76ñÊrÊ«ó6Rá&ˆ∆R÷ˆFRˆÊ«íí¢˜–¢∑6V&6Ñ÷ˆFR””“'&ˆ∆R"bbVW'íÁG&ñ“ÇíÊ∆VÊwFÇ„“2bbá7FW””“&ñF∆R"«¬7FW””“&W'&˜""íbbÄ¢∆Fób7Gñ∆S◊∑≤÷&vñÂF˜£Ç◊”‡¢∑ñ6∂W$∆ˆFñÊrbbÄ¢«7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#§2Ê◊WFVB¬÷&vñ„¢#GÇ"◊”‰fñÊFñÊr&ˆ∆W2÷F6ÜñÊr'∑VW'íÁG&ñ“Çó“"‚‚„¬˜‡¢ó–¢≤ñ6∂W$∆ˆFñÊrbbˆ672Ê∆VÊwFÇ‚bbÄ¢∆Fóc‡¢«7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#§2Ê◊WFVB¬÷&vñ„¢#WÇ"◊”‡¢∂ˆ672Ê∆VÊwFá“&W7V«G∂ˆ672Ê∆VÊwFÇ””Ú'2#¢"'“(	B6V∆V7BˆÊRFÚÊ«ó6R¬˜"&W72Ê«ó6RFÚ6ˆÁFñÁVP¢¬˜‡¢∂ˆ672Á6∆ñ6RÉ√RíÊ÷ÇÜÚ∆íí”‚Ä¢∆Fób∂Wì◊∂ó“ˆ‰6∆ñ6≥◊≤Çí”‚≤G&6≤Ç&ˆ67WFñˆÂ˜6V∆V7FVB"«∂WFÛ¶f«6W“ì≤FÙÊ«ó6RÜÚì≤◊–¢7Gñ∆S◊∑≤&6∂w&˜VÊC§2Á7W&f6R¬&˜&FW#¶Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3¢b¬FFñÊs¢#ÇGÇ"¬÷&vñ‰&˜GFˆ”£B¬7W'6˜#¢'ˆñÁFW""¬Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&f∆WÇ◊7F'B"¬ßW7Fñgî6ˆÁFVÁC¢'76R÷&WGvVV‚"¬v£Ç¬G&Á6óFñˆ„¢&∆¬„'2"◊–¢ˆ‰÷˜W6TVÁFW#◊∂S”Á≤RÊ7W'&VÁEF&vWBÁ7Gñ∆RÊ&6∂w&˜VÊC‘2Ê66VÁE6ˆgC≤RÊ7W'&VÁEF&vWBÁ7Gñ∆RÊ&˜&FW$6ˆ∆˜#‘2Ê66VÁC≤◊–¢ˆ‰÷˜W6T∆VfS◊∂S”Á≤RÊ7W'&VÁEF&vWBÁ7Gñ∆RÊ&6∂w&˜VÊC‘2Á7W&f6S≤RÊ7W'&VÁEF&vWBÁ7Gñ∆RÊ&˜&FW$6ˆ∆˜#‘2Ê&˜&FW#≤◊”‡¢∆Fób7Gñ∆S◊∑≤f∆WÉ£◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢#'Ç"¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC£c¬6ˆ∆˜#§2ÁFWáB◊”Á∑FıFóF∆T66RÜÚÁFóF∆Ró”¬˜‡¢«7Gñ∆S◊∑≤÷&vñ„£¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#§2Ê◊WFVB¬∆ñÊTÜVñváC£„B◊”‡¢∂ÚÊó66Ù6ˆFRbb«7‚7Gñ∆S◊∑≤6ˆ∆˜#§2Ê◊WFVD∆ñváB◊”‰ï44Ú”É¢∂ÚÊó66Ù6ˆFW“+r¬˜7„Á–¢≤ÜÚÊFW67&óFñˆÁ«¬""íÁ6∆ñ6RÉ√ìó◊≤ÜÚÊFW67&óFñˆÁ«¬""íÊ∆VÊwFÉ„ìÚ"‚‚‚#¢"'–¢¬˜‡¢¬ˆFóc‡¢∂ÚÊó4«D∆&V¬bb«7‚7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„c#W&V“"¬fˆÁEvVñváC£s¬6ˆ∆˜#§2Ê66VÁB¬&6∂w&˜VÊC§2Ê66VÁE6ˆgB¬&˜&FW#¶Ç6ˆ∆ñB636C6cV¬&˜&FW%&FóW3¢¬FFñÊs¢#'ÇgÇ"¬vÜóFU76S¢&Ê˜w&"¬f∆WÖ6á&ñÊ≥£◊”Ê«C¬˜7„Á–¢¬ˆFóc‡¢íó–¢∂ˆ672Ê∆VÊwFÇ‚RbbÄ¢«7Gñ∆S◊∑≤fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#§2Ê◊WFVB¬÷&vñ„¢#GÇ"¬FWáD∆ñv„¢&6VÁFW""◊”‡¢∑∂ˆ672Ê∆VÊwFÇ“W“÷˜&R(	B&W72Ê«ó6RFÚ6VR∆¬&W7V«G0¢¬˜‡¢ó–¢¬ˆFóc‡¢ó–¢¬ˆFóc‡¢ó–¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#§2Ê◊WFVB¬∆ñÊTÜVñváC£„R◊”‡¢W6RFÚ2v˜&G2f˜"&W7B&W7V«G2“RÊrÁ≤"'–¢«7‚7Gñ∆S◊∑≤6ˆ∆˜#§2ÁFWáE7V"◊”‰Ö"÷ÊvW#¬˜7„‚«≤"'–¢«7‚7Gñ∆S◊∑≤6ˆ∆˜#§2ÁFWáE7V"◊”Âáó6ñ6ñ„¬˜7„‚«≤"'–¢«7‚7Gñ∆S◊∑≤6ˆ∆˜#§2ÁFWáE7V"◊”‰6ÜñVbWÜV7WFófRˆffñ6W#¬˜7„‚«≤"'–¢«7‚7Gñ∆S◊∑≤6ˆ∆˜#§2ÁFWáE7V"◊”Â6ˆgGv&RFWfV∆˜W#¬˜7„‡¢¬˜‡¢∑6Ü˜tWáV7BÚÄ¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v£Ç¬÷&vñÂF˜£Ç¬FFñÊs¢#áÇÇ"¬&6∂w&˜VÊC§2Ê66VÁE6ˆgB¬&˜&FW#¶Ç6ˆ∆ñB636C6cV¬&˜&FW%&FóW3¢b◊”‡¢ƒñÊ∆ñÊU7ñÊÊW"6ó¶S◊≥'“G&6¥6ˆ∆˜#“"636C6cR"Û‡¢«7Gñ∆S◊∑≤÷&vñ„£¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#§2Ê66VÁB¬∆ñÊTÜVñváC£„R¬fˆÁEvVñváC£c◊”‡¢∆ˆˆ∂ñÊrWñ˜W"&ˆ∆R“Ê«ó6ó2ˆ‚FÜRvê¢¬˜‡¢¬ˆFóc‡¢í¢Ä¢«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#§2ÁFWáE7V"¬∆ñÊTÜVñváC£„b◊”‡¢&W7V«G2&RñÊFñ6FófR“7F'FñÊrˆñÁB¬Ê˜BfñÊ¬76W76÷VÁB‡¢¬˜‡¢ó–¢∑7FW””“&W'&˜""bb∆Fób7Gñ∆S◊∑≤÷&vñÂF˜£◊”„ƒW'$&˜Ç◊6s◊∂W'"«¬%6ˆ÷WFÜñÊrvVÁBw&ˆÊr‚∆V6RG'ívñ‚‚'“VW'ì◊∑VW'ó“Û„¬ˆFócÁ–¢¬ˆFóc‡¢≤Ú¢ñÁG&Ú6&B“&V∆˜r6V&6Ç&˜Ç¢˜–¢ƒñÁG&Ù6&BˆÂW'6ˆÊ6V∆V7C◊∑6WEW'6ˆÊ“Fˆvv∆U&Vc◊∑Fˆvv∆U&Vg“Û‡¢≤Ú¢W'6ˆÊFˆvv∆R“gFW"ñÁG&Ú6&B‚≈UÉ3¢7FvvW&VBVÁG&Ê6RF˜v‚FÜR7F6≤‚¢˜–¢∆Fób&Vc◊∑Fˆvv∆U&Vg“6∆74Ê÷S“&«WÇ◊&ó6R"7Gñ∆S◊∑≤"“÷«WÇ÷B#¢#„'2"◊”„≈W'6ˆÊFˆvv∆RW'6ˆÊ◊∑W'6ˆÊ“ˆ‰6ÜÊvS◊∑6WEW'6ˆÊ–¢Fó6&∆VC◊∑6V&6Ñ÷ˆFR””“&6ˆ◊Áí"«¬6V&6Ñ÷ˆFR””“'vñ∂í"«¬VW'íÁG&ñ“Çó–¢&V6ˆ„◊∑6V&6Ñ÷ˆFR””“&6ˆ◊Áí"Ú&‚ˆf˜"V◊∆˜ñW"6V&6Ç"¢6V&6Ñ÷ˆFR””“'vñ∂í"Ú&‚ˆf˜"FÜRvñ∂îw&Ç"¢'GóR¶ˆ"FóF∆Rfó'7B'“Û„¬ˆFóc‡¢≤Ú¢6ˆ÷◊VÊóGîÊ˜FR÷˜fVBñÁFÚ6óFTfˆ˜FW"É”rs#bí“ˆÊRÜˆ÷R¬ÊÚGW∆ñ6Fñˆ‚¢˜–¢∆Fób6∆74Ê÷S“&«WÇ◊&ó6R"7Gñ∆S◊∑≤"“÷«WÇ÷B#¢#„á2"◊”‡¢≈Fv∆ñÊRÛ‡¢ƒFWfñ6TÊ˜FRÛ‡¢¬ˆFóc‡¢¬Û‡¢ó–†¢∑7FW””“'6V&6ÜñÊr"bb≈7ñÊÊW"∆&V√◊∂6V&6ÜñÊrf˜""G∑VW'ó“"‚‚Ê“&ˆ6W74÷ˆFS“'6˜'FñÊr"ÛÁ–†¢∑7FW””“&÷6eˆ'&˜w6R"bbÄ¢∆Fóc‡¢≈˜7FñÊtWfñFVÊ6Uñ6∂W ¢VW'ì◊∑VW'íÁG&ñ“Çó–¢g&W6Ñw&C◊∂g&W6Ñw&G–¢FWfñ6U&ˆfñ∆S◊∂FWfñ6U&ˆfñ∆W–¢ˆ‰Ê«ó6U˜7FñÊs◊∂ÜÊF∆TÊ«ó6U˜7FñÊw–¢ˆ‰ÊWu6V&6É◊≤Çí”‚≤6WE7FWÇ&ñF∆R"ì≤vñÊF˜rÁ67&ˆ∆≈FÚá≤F˜£¬&VÜfñ˜#¢'6÷ˆ˜FÇ"“ì≤◊–¢Û‡¢∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFÇ‚bbÄ¢«7Gñ∆S◊∑≤÷&vñÂF˜£"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#§2Ê66VÁB¬FWáD∆ñv„¢&6VÁFW""◊”‡¢∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFá“˜7FñÊw∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFÉ”””Ú"#¢'2'“VWVVBf˜"6ˆ◊&ó6ˆ‚(	BF«7G&ˆÊsÔ	˘8¢Ê«ó6RFÜó2˜7FñÊs¬˜7G&ˆÊs‚ˆ‚Áí6&BFÚ˜V‚FÜRÊ«ó6ó2¬FÜV‚'V‚FÜR6ˆ◊&ó6ˆ‚g&ˆ“FÜW&R‡¢¬˜‡¢ó–¢¬ˆFóc‡¢ó–†¢≤Ú¢4Û¢6ˆ◊Áí◊6V&6Ç7FW“ˆ∆¬‘4b'íV◊∆˜ñW"Ê÷R¬6ˆÊfó&“FÜR&W6ˆ«fV@¢6ˆ◊Áí¬ÊB∆ó7BóG2∆ófR˜7FñÊw2‚ÊÚƒƒ”≤6˜VÁG2&R72◊Fá&˜VvÇ‚¢˜–¢∑7FW””“&÷6eˆ6ˆ◊Áí"bbÄ¢∆Fóc‡¢≤ó57FWÜˆÊRbb∆'WGFˆ‚&ñ÷∆&V√“$&6≤FÚÊWr6V&6Ç ¢ˆ‰6∆ñ6≥◊≤Çí”‚≤6WE7FWÇ&ñF∆R"ì≤vñÊF˜rÁ67&ˆ∆≈FÚá≤F˜£¬&VÜfñ˜#¢'6÷ˆ˜FÇ"“ì≤◊–¢7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”£"¬&6∂w&˜VÊC¢'G&Á7&VÁB"¬&˜&FW#¢&ÊˆÊR"¬FFñÊs£¬fˆÁE6ó¶S¢#„É#W&V“"¬fˆÁEvVñváC£s¬6ˆ∆˜#§2Ê66VÁB¬7W'6˜#¢'ˆñÁFW""¬÷ñ‰ÜVñváC£CB¬Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""◊”‡¢(iÊWr6V&6Ä¢¬ˆ'WGFˆ„Á–¢ƒ6ˆ◊ÁïÊV¿¢6ˆ◊ÁïVW'ì◊∑VW'íÁG&ñ“Çó–¢ˆ‰Ê«ó6U˜7FñÊs◊∂ÜÊF∆TÊ«ó6U˜7FñÊw–¢ˆÂVWVU˜7FñÊs◊∂ÜÊF∆UVWVU˜7FñÊw–¢VWVT6˜VÁC◊∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFá–¢FWfñ6U&ˆfñ∆S◊∂FWfñ6U&ˆfñ∆W–¢Û‡¢∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFÇ‚bbÄ¢«7Gñ∆S◊∑≤÷&vñÂF˜£"¬fˆÁE6ó¶S¢#„sW&V“"¬6ˆ∆˜#§2Ê66VÁB¬FWáD∆ñv„¢&6VÁFW""◊”‡¢∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFá“˜7FñÊw∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFÉ”””Ú"#¢'2'“VWVVBf˜"6ˆ◊&ó6ˆ‚“F«7G&ˆÊs‰Ê«ó6RFÜó2˜7FñÊs¬˜7G&ˆÊs‚ˆ‚Áí6&BFÚ˜V‚FÜRÊ«ó6ó2¬FÜV‚'V‚FÜR6ˆ◊&ó6ˆ‚g&ˆ“FÜW&R‡¢¬˜‡¢ó–¢¬ˆFóc‡¢ó–†¢≤Ú¢tî¥ì¢FÜR6&VW"vñ∂îw&Çó2Ê˜rD"ñ‚FÜR&W7V«BvRÜ∂Wí'vñ∂ñw&Ç"í¿¢Ê˜B6W&FRfñWr“6ÚÊ«ó6ñÊr&ˆ∆R∂VW2FÜRgV∆¬ÊfñvFñˆ‚‚¢˜–†¢∑7FW””“'ñ6∂ñÊr"bbÇÇí”‚∞¢ÚÚw&˜W'í6V7F˜ ¢6ˆÁ7B6V7F˜'2“≤‚‚ÊÊWr6WBÜˆ672Ê÷ÜÚ”‚FıFóF∆T66RÜÚÊñÊGW7G'í«¬ÚÊó66Ùw&˜W«¬$vVÊW&¬"ííï“Á6˜'BÇì∞¢6ˆÁ7Bw&˜WVB“6V7F˜'2Ê÷á2”‚á≤6V7F˜#¢2¬óFV◊3¢ˆ672Êfñ«FW"ÜÚ”‚FıFóF∆T66RÜÚÊñÊGW7G'í«¬ÚÊó66Ùw&˜W«¬$vVÊW&¬"í””“2í“íì∞¢6ˆÁ7B6ñÊv∆U6V7F˜"“w&˜WVBÊ∆VÊwFÇ√“∞¢&WGW&‚Ä¢ƒˆ67WFñˆÂñ6∂W ¢ˆ673◊∂ˆ677–¢w&˜WVC◊∂w&˜WVG–¢6ñÊv∆U6V7F˜#◊∑6ñÊv∆U6V7F˜'–¢VW'ì◊∑VW'ó–¢W'6ˆÊ◊∑W'6ˆÊ–¢ñ6∂W$gV∆ƒ∆ˆFñÊs◊∑ñ6∂W$gV∆ƒ∆ˆFñÊw–¢ñ6∂W$gV∆ƒW'&˜#◊∑ñ6∂W$gV∆ƒW'&˜'–¢ÊÙWÜ7D÷F6É◊∂ÊÙWÜ7D÷F6á–¢gVÊ7Fñˆ‰∂Wóv˜&DÊ˜Fñ6S◊∂gVÊ7Fñˆ‰∂Wóv˜&DÊ˜Fñ6W–¢ˆ‰Fó6÷ó74gVÊ7Fñˆ‰Ê˜Fñ6S◊≤Çí”‚6WDgVÊ7Fñˆ‰∂Wóv˜&DÊ˜Fñ6RÜÁV∆¬ó–¢ˆÂ6V∆V7C◊≤ÜÚí”‚≤G&6≤Ç&ˆ67WFñˆÂ˜6V∆V7FVB"¬≤WFÛ¢f«6R“ì≤FÙÊ«ó6RÜÚì≤◊–¢ˆÂ6V&6Ñvñ„◊∂ÜÊF∆U6V&6ÑvñÁ–¢Û‡¢ì∞¢“íÇó–†¢∑7FW””“&∆ˆFñÊr"bb≈7ñÊÊW"∆&V√◊∑7V"«¬$∆ˆFñÊr‚‚‚'“7FW◊∑7V%7FW“F˜F√◊∑W'6ˆÊÚB¢7“fó'7EFñ÷S◊≤Ü4Ê«ó6VDˆÊ6RÊ7W'&VÁG“6∂ñ∆«3◊∂∆ˆFñÊu6∂ñ∆«7“˜7FñÊuFWáC◊≤ÜÊ«ó6ñÊu˜7FñÊrbbÊ«ó6ñÊu˜7FñÊrÁFWáBí«¬"'“&ˆ6W74÷ˆFS“&6ÜV6∂ñÊr"6˜'W3◊∂6˜'W5vóG“ÛÁ–†¢≤Ú¢7FÊF∆ˆÊR6ˆ◊&RfñWr“6Ü˜v‚vÜV‚7FW÷ñF∆R'WB6ˆ◊&ó6ˆÁ2&R&VGí¢˜–¢≤á7FW””“&ñF∆R"«¬7FW””“'ñ6∂ñÊr"«¬7FW””“'6V&6ÜñÊr"íb`¢6ˆ◊&ó6ˆÁ2Êfñ«FW"Ü2”‚2Á&W7V«Bbb2Á&W7V«BÁ6∂ñ∆«2íÊ∆VÊwFÇ„“"b`¢7FófUF"””“&6ˆ◊&R"bbÄ¢∆Fób7Gñ∆S◊∑≤÷&vñÂF˜£Ç◊”‡¢∆Fób7Gñ∆S◊∑≤÷&vñ‰&˜GFˆ”£B◊”‡¢«7Gñ∆S◊∑≤÷&vñ„¢#áÇ"¬fˆÁE6ó¶S¢#„cÉsW&V“"¬6ˆ∆˜#§2Ê◊WFVB◊”ÂF˜"6∆ñ6≤F"&V∆˜rFÚWá∆˜&RFÜR&W7V«G3£¬˜‡¢∆Fób7Gñ∆S◊∑≤Fó7∆ì¢&f∆WÇ"¬f∆WÖw&¢'w&"¬v£b◊”‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤Çí”‚6WD7FófUF"Ç&6ˆ◊&R"ó–¢7Gñ∆S◊∑≤Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v£R¬FFñÊs¢#áÇGÇ"¿¢&˜&FW%&FóW3¢b¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC£c¬7W'6˜#¢'ˆñÁFW""¿¢&˜&FW#¢#'Ç6ˆ∆ñB3SfF""¬&6∂w&˜VÊC¢"3SfF""¬6ˆ∆˜#¢"6ffb"¬vÜóFU76S¢&Ê˜w&"◊”‡¢≤.)©n˚àÚ6ˆ◊&RÇ"≤6ˆ◊&ó6ˆÁ2Êfñ«FW"Ü2”‚2Á&W7V«Bbb2Á&W7V«BÁ6∂ñ∆«2íÊ∆VÊwFÇ≤"í'–¢¬ˆ'WGFˆ„‡¢∆'WGFˆ‚ˆ‰6∆ñ6≥◊≤Çí”‚6WD7FófUF"Ç'6∂ñ∆«2"ó–¢7Gñ∆S◊∑≤Fó7∆ì¢&ñÊ∆ñÊR÷f∆WÇ"¬∆ñv‰óFV◊3¢&6VÁFW""¬v£R¬FFñÊs¢#áÇGÇ"¿¢&˜&FW%&FóW3¢b¬fˆÁE6ó¶S¢#„sW&V“"¬fˆÁEvVñváC£c¬7W'6˜#¢'ˆñÁFW""¿¢&˜&FW#¶'Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&6∂w&˜VÊC§2Á7W&f6R¬6ˆ∆˜#§2ÁFWáE7V"¬vÜóFU76S¢&Ê˜w&"◊”‡¢(i&6≤FÚ∆7B&ˆ∆P¢¬ˆ'WGFˆ„‡¢¬ˆFóc‡¢¬ˆFóc‡¢∆Fób7Gñ∆S◊∑≤&6∂w&˜VÊC§2Á7W&f6R¬&˜&FW#¶Ç6ˆ∆ñBG¥2Ê&˜&FW'÷¬&˜&FW%&FóW3£¬FFñÊs¢#gÇáÇ"¬÷&vñ‰&˜GFˆ”£b◊”‡¢∆É"6∆74Ê÷S“'B÷ÜVFñÊr"7Gñ∆S◊∑≤÷&vñ„¢#GÇ"¬fˆÁE6ó¶S¢#„#W&V“"¬fˆÁEvVñváC£É¬6ˆ∆˜#§2ÁFWáB◊”Ó)©n˚àÚ&ˆ∆R6ˆ◊&ó6ˆ„¬ˆÉ#‡¢ ¢¬ˆFóc‡¢ƒ6ˆ◊&ó6ˆÂÊV¿¢6ˆ◊&ó6ˆÁ3◊∂6ˆ◊&ó6ˆÁ7–¢ˆÂ&V÷˜fS◊∑&V÷˜fTg&ˆ‘6ˆ◊&ó6ˆÁ–¢ˆ‰Ê«ó6S◊∂ÜÊF∆TÊ«ó6U&ˆ∆W–¢7W'&VÁEFóF∆S◊≤"'–¢ˆ‰FEFÜó&C◊∂ÁV∆«–¢Û‡¢¬ˆFóc‡¢ó–†¢∑7FW””“'&W7V«G2"bb6V¬bb&W7V«BbbÇÇí”‚∞¢ÚÚ7FW2“&WfñWr7GVFñÚác2◊Ví÷&«VW&ñÁB3Bí‚&W∆6W2FÜR∆Vv7íF&&VB&W7V«BvR‡¢ÚÚ&ñváBÊR“FÜRı$îtî‰¬&ˆ∆Rw&ÇÖ&ˆ∆Tw&ÖÊV√¢∆ñW&VB&ˆ∆Rw&Ç≤ï44¢ÚÚ&Ê∂ñÊr≤6∂ñ∆¬÷Ê«ó6ó2í“FÜR'&ˆ∆Rw&ÇÊB˜FÜW"Ê«ó6ó2"¬VÊ6ÜÊvVB‡¢ÚÚÜVFW"6Üó◊W7BÊ÷RFÜRG'VR6˜W&6R“W&R‘U44ÚÊ«ó6ó2ÊWfW"F˜V6ÜVB¢ÚÚ∆ófR˜7FñÊr¬6ÚóB◊W7BÊ˜B&VB&g&ˆ“‘4b"áv2Ü&F6ˆFVB&Vv&F∆W72ˆb6˜W&6Rí‡¢6ˆÁ7B&WfñWu6˜W&6R“&W7V«BÁ6˜W&6R””“'˜7FñÊr ¢Úg&ˆ“G≤á&W7V«BÁ˜7FñÊt÷WFbb&W7V«BÁ˜7FñÊt÷WFÁ˜7FñÊu6˜W&6Rí«¬$◊î6&VW'4gWGW&R'÷ ¢¢&W7V«BÁ6˜W&6R””“&6˜'W2"Ú&g&ˆ“∆ófR4r˜7FñÊw2"¢&g&ˆ“U44Ú#∞¢6ˆÁ7Bî÷ˆ÷VÁG46ˆ◊ÁïVW'í“&W7V«CÚÊV◊∆˜ñW ¢«¬Ê«ó6ñÊu˜7FñÊsÚÊV◊∆˜ñW ¢«¬&W7V«CÚÁ˜7FñÊt÷WFÚÊV◊∆˜ñW ¢«¬"#∞¢ÚÚ"*s2„É¢6ˆ◊ÁíñÊf˜&÷Fñˆ‚&V6ˆ÷W2FÜR6Áf2w2&ñváBG&vW"‚&˜FÇÊV«0¢ÚÚ76VB26ˆ◊ÁïÊV&RFÜRUÑï5Dî‰rFWFW&÷ñÊó7Fñ2&VG2“5$&Vvó7FW ¢ÚÚf7G2Ñ6ˆ◊Áî&6∂w&˜VÊBíÊBFÜR˜7FW"◊g2÷Üó&W"V◊∆˜ñW"6ÜV6≤˜fW"FÜR∆ófP¢ÚÚ˜7FñÊw2ÑV◊∆˜ñW%&V∆óGíí‚&˜FÇÜB&VV‚7G&ÊFVBñ‚FÜRfófR◊ñ∆∆"&W7V«@¢ÚÚfñWr&WFó&VBˆ‚r”rs#c≤FÜWí&Rvó&VB&6≤ñ‚ÜW&R¬Ê˜B&Ww&óGFV‚‚Ê¢ÚÚ6ˆ◊Áíw&Çñ‚FÜó2"å*s"„2í‡¢ÚÚƒÙı”¢&WG'íf˜"FÜR∆ófR◊˜7FñÊw2óV∆ñÊR‚G&Á6ñVÁB‘4bfñ«W&RW6VBFÚ&P¢ÚÚW&÷ÊVÁBVÁFñ¬gV∆¬&R÷Ê«ó6ó3≤WfW'óFÜñÊrFÜR&V'Vñ∆BÊVVG2ó2ˆ‚&W7V«F‡¢6ˆÁ7B&WG'îGWFñW2“Çí”‚∞¢6ˆÁ7BB“6V√ÚÁFóF∆R«¬"#∞¢ñbÇBí&WGW&„∞¢6WE&W7V«BÇá&Wbí”‚&WbÚ≤‚‚Á&Wb¬&W7ˆÁ6ñ&ñ∆óFñW4FF¢ÁV∆¬“¢&Wbì∞¢'Vñ∆E&W7ˆÁ6ñ&ñ∆óFñW4FFáB¬&W7V«BÊW66Ùˆ67WFñˆ‚¬&W7V«BÁ6∂ñ∆«2«¬µ“¬&W7V«BÊó66Ùw&˜W«¬""¬ÁV∆¬¬VÊFVfñÊVB¬&W7V«BÊˆ64Wá˜7W&Rê¢ÁFÜV‚Çá&Bí”‚≤6WE&W7V«BÇá&Wbí”‚&WbÚ≤‚‚Á&Wb¬&W7ˆÁ6ñ&ñ∆óFñW4FF¢&B“¢&Wbì≤G&6≤Ç'&W7ˆÁ6ñ&ñ∆óFñW5˜&WG'í"¬≤ˆ67WFñˆ„¢B¬ˆ≥¢á&Bbb&BÊf∆∆&6≤í¬&V6ˆ„¢á&Bbb&BÁ&V6ˆ‚í«¬""“ì≤“ê¢Ê6F6ÇÇÇí”‚≤6WE&W7V«BÇá&Wbí”‚&WbÚ≤‚‚Á&Wb¬&W7ˆÁ6ñ&ñ∆óFñW4FF¢≤f∆∆&6≥¢G'VR¬&V6ˆ„¢&÷6eˆW'&˜""¬¶ˆ$6˜VÁC¢¬¶ˆ'3¢µ“““¢&Wbì≤“ì∞¢”∞¢&WGW&‚Ä¢√‡¢≈&WfñWu7GVFñ¢&W7V«C◊∑&W7V«G–¢FóF∆S◊∑FıFóF∆T66Rá6V√ÚÁFóF∆R«¬""ó–¢V◊∆˜ñW#◊∑&W7V«CÚÊV◊∆˜ñW"«¬"'–¢6˜W&6S◊∑&WfñWu6˜W&6W–¢&ˆ∆UÊS◊≥≈&ˆ∆Tw&ÖÊV¬&W7V«C◊∑&W7V«G“FóF∆S◊∑6V√ÚÁFóF∆R«¬"'“˜7FñÊs◊∂Ê«ó6ñÊu˜7FñÊw“ˆ‰÷ˆFT6ÜÊvS◊∑6WE&uFÜˆÊˆ◊ó“ÛÁ–¢&ˆ∆Tw&Ñ÷ˆFS◊∑&uFÜˆÊˆ◊ó–¢6ˆ◊ÁïÊS◊∂Ü46ˆ◊Áï&VBá&W7V«BíÚ√„ƒ6ˆ◊Áî&6∂w&˜VÊB&W7V«C◊∑&W7V«G“Û„ƒV◊∆˜ñW%&V∆óGí&W7V«C◊∑&W7V«G“Û„¬Û‚¢ÁV∆«–¢î÷ˆ÷VÁG5ÊS◊∂î÷ˆ÷VÁG46ˆ◊ÁïVW'íÚÄ¢ƒ6ˆ◊ÁïÊV¿¢6ˆ◊ÁïVW'ì◊∂î÷ˆ÷VÁG46ˆ◊ÁïVW'ó–¢ˆ‰Ê«ó6U˜7FñÊs◊∂ÜÊF∆TÊ«ó6U˜7FñÊw–¢ˆÂVWVU˜7FñÊs◊∂ÜÊF∆UVWVU˜7FñÊw–¢VWVT6˜VÁC◊∂6ˆ◊&ó6ˆÁ2Ê∆VÊwFá–¢WFÙ˜V‰î÷ˆ÷VÁG0¢Û‡¢í¢ÁV∆«–¢Ê«ó6ó5ÊW3◊∂Ê«ó6ó5ÊW7–¢Ê«ó6ó4∆&V«3◊¥‰≈ï4ï5ıtî‰DıuÙƒ$T≈7–¢˜7FñÊs◊∂Ê«ó6ñÊu˜7FñÊw–¢&u'VÊÊñÊs◊∂&u'VÊÊñÊw–¢&u7FW◊∂&u7FW–¢&u7FGW3◊∂&u7FGW7–¢&tV∆6VC◊∂&tV∆6VG–¢&tW'&˜#◊∂&tW'&˜'–¢&ÊC◊∂ÁV∆«–¢ˆ‰&6≥◊≤Çí”‚≤6WE7FWáVW'íbbVW'íÁG&ñ“ÇíÚ&÷6eˆ'&˜w6R"¢&ñF∆R"ì≤vñÊF˜rÁ67&ˆ∆≈FÚá≤F˜¢¬&VÜfñ˜#¢'6÷ˆ˜FÇ"“ì≤◊–¢fW'6ñˆ„◊¥ıdU%4îÙÁ–¢ˆÂ&WG'îGWFñW3◊∑&WG'îGWFñW7–¢ˆ‰˜V‰ˆ∂c◊≤Çí”‚6WDˆ∂e&ˆ∆RáG'VRó–¢ˆ‰Wá˜'Dß6ˆ„◊≤Çí”‚∞¢ÚÚUÖ¢FÜRÊ«ó6ó2óG6V∆b‚&W7V«F÷óÜW2FWFW&÷ñÊó7Fñ2VÊvñÊR˜WGW@¢ÚÚvóFÇƒƒ“&˜6RáFÜRW"◊6∂ñ∆¬&ˆ◊B˜&ˆ◊EFV6ÇˆÊWáEÜ6RfñV∆G2í¬6¢ÚÚFÜRGvÚ&R7∆óBñÁFÚ6W&FR&∆ˆ6∑2&FÜW"FÜ‚6ÜóVB2ˆÊP¢ÚÚVÊFñffW&VÁFñFVBˆ&¶V7B“&VFW"◊W7B&R&∆RFÚFV∆¬vÜñ6Çó2vÜñ6Ç‡¢6ˆÁ7BîfñV∆G2“≤'&ˆ◊B"¬'&ˆ◊EFV6Ç"¬&ÊWáEÜ6R%”∞¢6ˆÁ7B6∂ñ∆«4FWFW&÷ñÊó7Fñ2“á&W7V«BÁ6∂ñ∆«2«¬µ“íÊ÷Çá2í”‚∞¢6ˆÁ7B6˜í“≤‚‚Á2”∞¢îfñV∆G2Êf˜$V6ÇÇÜbí”‚≤FV∆WFR6˜ï∂e”≤“ì∞¢&WGW&‚6˜ì∞¢“ì∞¢6ˆÁ7B6∂ñ∆«5&˜6R“á&W7V«BÁ6∂ñ∆«2«¬µ“ê¢Ê÷Çá2í”‚∞¢6ˆÁ7BˆÊ«í“≤6∂ñ∆√¢2Á6∂ñ∆¬«¬2ÊÊ÷R«¬ÁV∆¬”∞¢îfñV∆G2Êf˜$V6ÇÇÜbí”‚≤ñbá5∂e“íˆÊ«ï∂e““5∂e”≤“ì∞¢&WGW&‚ˆ&¶V7BÊ∂Wó2ÜˆÊ«ííÊ∆VÊwFÇ‚ÚˆÊ«í¢ÁV∆√∞¢“ê¢Êfñ«FW"Ñ&ˆˆ∆V‚ì∞¢6ˆÁ7B≤6∂ñ∆«3¢ˆˆ÷óB¬‚‚Á&W7V«E&W7B““&W7V«C∞¢F˜vÊ∆ˆDß6ˆ‚Ä¢Wá˜'Dfñ∆VÊ÷RÇ'&ˆ∆R÷Ê«ó6ó2"¬6V√ÚÁFóF∆R«¬'&ˆ∆R"í¿¢VÁfV∆˜Rá∞¢66˜S¢'&ˆ∆R÷Ê«ó6ó2"¿¢fW'6ñˆ„¢ıdU%4îÙ‚¿¢VW'ì¢∞¢&ˆ∆S¢6V√ÚÁFóF∆R«¬ÁV∆¬¿¢ó66Ù6ˆFS¢6V√ÚÊó66Ù6ˆFR«¬ÁV∆¬¿¢ó66Ùw&˜W¢6V√ÚÊó66Ùw&˜W«¬ÁV∆¬¿¢Ê«ó6ó56˜W&6S¢&W7V«BÁ6˜W&6R«¬ÁV∆¬¿¢“¿¢&∆ˆ6∑3¢∞¢ˆ67WFñˆ„¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢$U44ÚÚï44ÚfñˆíˆW66Ú"“¿¢≤FóF∆S¢6V√ÚÁFóF∆R«¬""¬ó66Ù6ˆFS¢6V√ÚÊó66Ù6ˆFR«¬""¬ó66Ùw&˜W¢6V√ÚÊó66Ùw&˜W«¬""¬FW67&óFñˆ„¢6V√ÚÊFW67&óFñˆ‚«¬""“í¿¢˜7FñÊs¢&∆ˆ6≤Ñı$îtî‚ÂdU$$Dî“¿¢≤6˜W&6S¢á&W7V«BÁ˜7FñÊt÷WFbb&W7V«BÁ˜7FñÊt÷WFÁ˜7FñÊu6˜W&6Rí«¬$◊î6&VW'4gWGW&R"¿¢Ê˜FS¢&W7V«BÁ6˜W&6R””“'˜7FñÊr"Ú%FÜR6ñÊv∆RGfW'Fó6V÷VÁBFÜó2Ê«ó6ó2v2w&˜VÊFVBñ‚‚"¢$Ê˜B˜7FñÊr÷w&˜VÊFVBÊ«ó6ó2‚"“¿¢&W7V«BÁ6˜W&6R””“'˜7FñÊr"Úá&W7V«BÁ˜7FñÊt÷WF«¬ÁV∆¬í¢ÁV∆¬í¿¢VÊvñÊS¢&∆ˆ6≤Ñı$îtî‚‰DU$ïdTB¿¢≤6˜W&6S¢&VÊvñÊR÷6˜&RÊß2ñ‚FÜó2"¿¢Ê˜FS¢$FWFW&÷ñÊó7Fñ3¢FÜR6÷RñÁWG2&ˆGV6R'óFR÷ñFVÁFñ6¬˜WGWB‚"“¿¢&W7V«E&W7Bí¿¢6∂ñ∆«3¢&∆ˆ6≤Ñı$îtî‚‰DU$ïdTB¿¢≤6˜W&6S¢$U44Ú≤FÜó2w2VÊvñÊR"“¿¢6∂ñ∆«4FWFW&÷ñÊó7Fñ2í¿¢6∂ñ∆≈&˜6S¢&∆ˆ6≤Ñı$îtî‚‰í¿¢≤6˜W&6S¢$∆ÊwVvR÷ˆFV¬fñˆíˆ6∆VFR"¬6ˆÊfñFVÊ6S¢&G&gB"¿¢Ê˜FS¢%W"◊6∂ñ∆¬Ê'&FófRfñV∆G2‚w&óGFV‚'í∆ÊwVvR÷ˆFV√≤G&VB2G&gB¬Ê˜Bf7B‚"“¿¢6∂ñ∆«5&˜6Rí¿¢“¿¢“ê¢ì∞¢◊–¢ˆ‰˜V‰¶ˆ$C◊∂¶ˆ$Dfñ∆&∆Rá&W7V«BíÚÇí”‚≤6WDDG&vW$˜V‚áG'VRì≤G&6≤Ç&¶ˆ%ˆEˆ˜VÊVB"¬≤ˆ67WFñˆ„¢6V√ÚÁFóF∆R«¬""¬7FW¢'&WfñWr"“ì≤“¢ÁV∆«–¢6WGFñÊw4V√◊≥∆Fóc‡¢«7Gñ∆S◊∑≤÷&vñ„¢#gÇ"¬fˆÁDf÷ñ«ì¢"u7∆ñÊR6Á2÷ˆÊÚr∆÷ˆÊ˜76R"¬fˆÁE6ó¶S¢#„c#W&V“"¬fˆÁEvVñváC¢s¬∆WGFW%76ñÊs¢"„V“"¬6ˆ∆˜#¢"3ÜÉ#s""◊”ÂDUÖB4ï§S¬˜‡¢≈FWáE6ó¶T6ˆÁG&ˆ¬VïFWáE66∆S◊∑VïFWáE66∆W“«ïFWáE66∆S◊∂«ïFWáE66∆W“7FW3◊µTïı44ƒUı5DU7“Û‡¢¬ˆFócÁ–¢Û‡¢∂ˆ∂e&ˆ∆Rbbƒˆ∂d÷ˆF¬Fˆ3◊∑≤FÉ¢'&ˆ∆RÊ÷B"¬‚‚Á7FW4'Vñ∆Dˆ∂bá6V¬¬&W7V«Bí◊“ˆ‰6∆˜6S◊≤Çí”‚6WDˆ∂e&ˆ∆RÜf«6Ró“ÛÁ–¢≤Ú¢7FW26Áf2&Wfó6ñˆ‚ÑáV÷‚∆VB¬3”rs#bì¢FÜR¶ˆ"‘Bd"ó2ÊÚ∆ˆÊvW ¢÷˜VÁFVBÜW&R‚óBv26V6ˆÊB&˜VÊB6ˆÁG&ˆ¬ñ‚FÜRfW'í6˜&ÊW"FÜRv˜&∑76P¢ÊfñvF˜"Ê˜rˆ67WñW2¬ÊBñ‚FÜR6Áf2FÜRGfW'Fó6V÷VÁBï2FÜR÷ñ‡¢Fˆ7V÷VÁB“6ÚFÜRd"GW∆ñ6FVBvÜBFÜR&VFW"ó2«&VGí∆ˆˆ∂ñÊrB‚FÜP¢G&vW"óG6V∆bó2&W6W'fVBÊB&V6Ü&∆Rg&ˆ“FÜRÊfñvF˜"Ç$˜&ñvñÊ¬B¿¢VÁ6V7FñˆÊVB"í¬G&ófV‚'íFÜR6÷R÷∆WfV¬7FFR2&Vf˜&R‚¢˜–¢ƒ¶ˆ$DG&vW"&W7V«C◊∑&W7V«G“˜V„◊∂DG&vW$˜VÁ“ˆ‰6∆˜6S◊≤Çí”‚6WDDG&vW$˜V‚Üf«6Ró“Û‡¢¬Û‡¢ì∞¢Ú¢s2$UDï$TBÑáV÷‚∆VB¬r”rs#bì¢„Cì∆ñÊW2ˆbFÜR∆Vv7ífófR◊ñ∆∆ ¢&W7V«BfñWr6BÜW&RVÁ&V6Ü&∆R&VÜñÊBFÜR&WfñWu7GVFñÚ&WGW&‚6ñÊ6RFÜP¢7FW”2&VFW6ñv‚‚FV∆WFVB&FÜW"FÜ‚&W7W'&V7FVC≤FÜRñ∆∆"DD¢Öıîƒƒ%Ù‘∆VBVW7FñˆÁ2¬&VÊFW%ñ∆∆%fñWr¬ñ∆∆$&"í7Fó2FVfñÊV@¢f˜"FÜRÊÚ„3bsÊV¬◊&Vvó7G'í˜'B‚vóBÜó7F˜'íÜˆ∆G2FÜRgV∆¬&∆ˆ6≤‚¢¢“íÇó–†¢≤Ú¢6óFTfˆ˜FW"É”rs#bì¢FÜR6ˆÁ6ˆ∆ñFFVB6óFRfˆ˜FW"“Fó66∆ñ÷W"¬GG&ñ'WFñˆ‚¿¢÷WFÜˆFˆ∆ˆwíÚ∆Vv¬ÚFW&◊2Ú'Vñ∆FW"Ê˜FR¬ñFVÁFóGí≤fW'6ñˆ‚“ˆ‚WfW'í7FW ¢WÜ6WBFÜRgV∆¬÷ÜVñváB&WfñWr7GVFñÚ¬vÜñ6Ç6'&ñW2óG2˜v‚ÜˆÊW7Gífˆ˜FW"‚¢˜–¢∑7FW”“'&W7V«G2"bb≈6óFTfˆ˜FW"6ˆ◊7C◊∂ó57FWÜˆÊW“ÛÁ–†¢¬ˆ÷ñ„‡¢¬ˆFóc‡¢¬Û‡¢ì∞ß–