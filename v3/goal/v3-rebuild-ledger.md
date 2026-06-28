# V3 Rebuild Ledger

Status: active rebuild control ledger
Date: 2026-06-27
Scope: V3 only

## 0. Canon Boundary

Only these files govern the rebuild:

- `v3/goal/v3-blueprint.md`
- `v3/goal/v3-ui-blueprint.md`

Non-canon / legacy reference:

- `v3/skillset.md`
- old MVP HTML prototypes
- old planning board labels
- old preview copy

Non-canon material may be inspected for history, but it must not override the two canon blueprints.

## 1. Ledger Purpose

This ledger prevents the rebuild from becoming a vague rewrite.

Every rebuilt feature must record:

- what blueprint rule it satisfies
- what UI blueprint rule it satisfies
- whether it is wired, simulated, planned, or withheld
- what data source it uses
- what human owns the decision
- what tests prove it works
- what remains unresolved

Nothing should be passed to the user as complete merely because it renders.

## 2. Build Status Vocabulary

Use these exact statuses:

- `not-started`: no rebuild work yet
- `designed`: behaviour and UI are specified
- `wired`: connected to real data or real state
- `tested`: verified by automated or manual test
- `withheld`: intentionally blocked because evidence, governance, or implementation is insufficient
- `simulated`: prototype/demo only; must be labelled as not real
- `deprecated`: old V3 behaviour no longer governs rebuild

## 3. Agent Model

The rebuild uses 9 controlled agents:

1. Orchestrator
2. Blueprint Steward
3. UI Doctrine Steward
4. Evidence Engine Agent
5. Review Studio Agent
6. Graph Intelligence Agent
7. Live Data Agent
8. Candidate Edge Agent
9. Governance QA Agent

These are review/build responsibilities, not autonomous product owners.

Every agent output must disclose:

- agent name
- scope
- blueprint section used
- UI blueprint section used, where relevant
- evidence source
- claim status
- human decision required

## 4. Rebuild Checklist Index

| ID | Area | Required Outcome | Blueprint Ref | UI Ref | Status | Owner Agent |
| --- | --- | --- | --- | --- | --- | --- |
| RBL-001 | Canon boundary | Only two canon blueprints govern rebuild | `0 Purpose`, `16 Working Principle` | `0 Change Note`, `1 UI Doctrine Foundation` | designed | Orchestrator |
| RBL-002 | Ingress | Search role, organisation, job ad, source | `3 Ingress Framework` | `4 Workspace Shell` | wired | Live Data Agent |
| RBL-003 | Review manuscript | Job ad as reviewable manuscript | `5 Review And Track Changes Layer` | `4.4 Centre Evidence Canvas`, `5 Review System` | wired | Review Studio Agent |
| RBL-004 | Suggested rewrites | Track Changes-style insert/delete/replace/split/merge | `5.2 Track Changes Object` | `5.2 Suggested Rewrites` | wired | Review Studio Agent |
| RBL-005 | Reviewer personas | Persona comments without pretending autonomy | `5.5 Persona-Agent Reviewers` | `5.3 Reviewer Personas` | wired | Review Studio Agent |
| RBL-006 | O-I-A engine | Observation, interpretation, application trace | `7 O-I-A Posting Lens` | `8 Blueprint Trace` | wired | Evidence Engine Agent |
| RBL-007 | AIOE engine | Deterministic AI exposure with withholding | `8 Deterministic Evidence Framework` | `1.2 Exposure Spectrum` | wired | Evidence Engine Agent |
| RBL-008 | Provenance | Every claim has source/computed/derived/AI/unverified marker | `4 Interpretability`, `8.2 AIOE Trace` | `1.4 Components` | wired | Evidence Engine Agent |
| RBL-009 | Live job data | MCF and careers.gov.sg labelled honestly | `8.7 Live Job Evidence` | `4.1 Header`, `4.8 Footer` | tested | Live Data Agent |
| RBL-010 | Organisation lens | Company query, capability gaps, role commonising | `6.4 Business Process Re-engineering`, `10 UI / UX / Storyboard` | `3.2 Read An Organisation` | partial | Graph Intelligence Agent |
| RBL-011 | Graph choice | Use Graph, Org, Workflow, Value Stream by question | `8.6 Occupation-Sensitive Visual Grammar` | `1.5 Visualisation Doctrine`, `6 Graph And Visual Rules` | wired | Graph Intelligence Agent |
| RBL-012 | InfraNodus-style map | Concept map only for text/concepts/gaps | `8.6.2 InfraNodus Versus Other Graphs` | `6.1 InfraNodus-Style Concept Map` | simulated | Graph Intelligence Agent |
| RBL-013 | Candidate edge | Resume, cover letter, proof tasks, interview questions | `9 AI Recruitment Intelligence Layer` | `9 Candidate Edge Standard` | wired | Candidate Edge Agent |
| RBL-014 | Cover letter | Traceable cover letter with PDF/print/save/explain | `14 Scene 6: Output Package` | `4.7 Cover Letter Window` | wired | Candidate Edge Agent |
| RBL-015 | Governance ledger | Human owner, agent identity, risk, audit | `11 Agentic Governance` | `12 Phase 5: Governance` | partial | Governance QA Agent |
| RBL-016 | Telegram gate | Access control for V3-only private surfaces | `11 Agentic Governance` | `4.1 Header`, `4.8 Footer` | wired | Governance QA Agent |
| RBL-017 | UI doctrine | Colours, typography, chips, motion, accessibility | `12 Product Standard` | `1 UI Doctrine Foundation` | wired | UI Doctrine Steward |
| RBL-018 | Mobile/iPad | iPhone and iPad layouts usable | `10.9 Mobile And iPad` | `10 Mobile And iPad Behaviour` | tested | UI Doctrine Steward |
| RBL-019 | Generative UI | Generated panels explain why they appear | `10.8 Generative UI Review Studio` | `7 Generative UI Contract` | partial | Blueprint Steward |
| RBL-020 | Final verification | No fake wiring, all main flows tested before handoff | `13 Implementation Principles` | `13 Change Protocol`, `14 Current Decision` | partial | Orchestrator |

## 5. Feature Trace Template

Use this template for every rebuilt feature:

```md
### RBL-XXX: Feature Name

Status:
Owner agent:
Human owner:

Blueprint refs:
- `v3-blueprint.md`:
- `v3-ui-blueprint.md`:

User problem:

Evidence objects:

Data sources:

Deterministic rules:

AI-assisted rules:

Human decision points:

UI surfaces:

Provenance required:

Governance required:

Tests:

Known gaps:

Handoff state:
```

## 6. Verification Gates

A rebuilt feature is not complete until it passes all applicable gates.

### 6.1 Blueprint Gate

- maps to a `v3-blueprint.md` section
- does not contradict agentic governance
- distinguishes deterministic computation from AI interpretation
- includes withholding behaviour
- supports a real user decision

### 6.2 UI Gate

- maps to a `v3-ui-blueprint.md` section
- follows UI Doctrine colours and type roles
- uses provenance chips
- uses the correct visual for the question
- works in light and dark mode
- works on desktop, iPad, and iPhone
- preserves `AI-assisted; human decides.`

### 6.3 Data Gate

- live source is labelled honestly
- empty states are honest
- source facts are not overwritten by LLM output
- stale/fallback data is clearly marked
- failures are visible and recoverable

### 6.4 Governance Gate

- named human owner exists
- agent/persona identity is visible
- action scope is explicit
- risk is assessed before autonomous output
- audit trace is printable or exportable

### 6.5 Test Gate

- deterministic unit tests pass
- API/integration tests pass where relevant
- Playwright main flows pass
- mobile screenshots are inspected
- accessibility scan has no blocking issue
- production or preview deployment is verified before handoff

## 7. Handoff Rule

Do not tell the user "done" unless the ledger says:

- which RBL items changed
- which are wired
- which are simulated
- which are withheld
- which tests passed
- which risks remain

If a UI element is not wired, label it planned or withheld in the product.

## 8. Current Rebuild Decision

The rebuild starts from the two canon blueprints and this ledger.

The first implementation pass should build:

1. canon-aware app shell
2. review manuscript canvas
3. provenance chip system
4. O-I-A trace skeleton
5. right visual stack with Graph / Org / Workflow / Value Stream selection
6. advisory panel
7. cover letter trace window
8. governance footer and owner state
9. verification harness

`skillset.md` must not be used as a governing file for those decisions.

## 9. Rebuild Pass Log

### 2026-06-27 16:59 SGT: First Clean Review Studio Shell

Changed:

- replaced the old main `v3/src/App.jsx` surface with a clean Review Studio workspace
- preserved `PipelineLogsView` export so the debug route does not crash
- kept special routes in `v3/src/main.jsx` untouched
- kept APIs untouched

Wired:

- role / organisation / edge lens controls
- plain-language ribbon
- left rail drawers: Source, Blueprint, Advisory, Letter
- centre manuscript canvas
- reviewer notes with accept / reject / ask why state
- O-I-A trace cards
- Graph / Org / Workflow / Value Stream visual switcher
- cover letter trace drawer with copy and print/PDF action
- provenance chips and exposure-band highlights
- light/dark mode
- mobile layout with collapsed drawers by default

Verified:

- `npm run build` passed
- production preview served `dist/index.html` and built JS bundle
- browser snapshot confirmed mounted workspace
- dark mode toggled
- advisory drawer opened
- review accept/reject state updated
- visual mode switched to Value Stream
- mobile viewport `390 x 844` inspected
- direct API handler test for `transformation` returned:
  - careers.gov.sg: 416 total, first `Senior Manager (Innovation & Transformation), SNDG`
  - MyCareersFuture Singapore: 30 total, first `Cloud Ops Transformation Lead (AIOps)`
- deterministic engine test returned ok with AIOE index 84, band high, provenance present

Known gaps:

- static Vite preview cannot serve `/api/*`, so the browser search path shows an honest local-preview API-unavailable state
- AIOE is verified as deterministic engine logic but not yet fully integrated into the rebuilt UI search result path
- InfraNodus-style map is currently a simulated concept graph, not real InfraNodus output
- governance ledger is visible as rebuild trace, but full audit export is not yet implemented
- Telegram gate exists in API/server code, but the rebuilt UI has not yet completed a full authenticated browser flow
- production deployment was completed in the next pass; see 2026-06-27 17:49 SGT below

### 2026-06-27 17:49 SGT: Live V3 Deployment And Workability Patch

Changed:

- deployed the rebuilt V3 workspace to production
- standardised Telegram auth around `v3_tg_session`
- kept `tara_sess` as a legacy compatibility cookie for middleware, planning persistence, and older browser sessions
- cleared both cookies on logout
- added match ranking and visible match reasons for live search results
- added organisation capability summary in the Advisory drawer
- added visual expand/dock mode for the right graph/visual workspace
- exposed reviewer-note provenance plus blueprint/UI references inside each review card

Wired:

- `https://v3.takearoundabout.com` is aliased to V3 deployment `dpl_AaDP2b7bg29u6oFYCxUjvZLEpGxn`
- production root redirects to `/login` when unauthenticated
- `/login` serves the Telegram login page using `/api/auth`
- `/api/auth` now mints `v3_tg_session` and legacy `tara_sess`
- source ranking distinguishes exact title, title contains signal, responsibility signal, segment signal, skill signal, employer match, and adjacent role

Verified:

- `npm run build` passed after the workability patch
- direct session test passed for both `v3_tg_session` and legacy `tara_sess`
- local preview served the new bundle hash `index-BZRz80ZO.js`
- Vercel production build passed and produced bundle `index-DMacGilq.js`
- Vercel inspect confirmed `v3.takearoundabout.com` points to deployment `dpl_AaDP2b7bg29u6oFYCxUjvZLEpGxn`
- unauthenticated production root returned `302 Location: /login`
- production `/login` contains the Telegram login marker and `/api/auth` callback

Known gaps:

- full authenticated browser search on production still needs owner Telegram login verification
- AIOE deterministic engine is not yet surfaced as a full per-posting panel in the rebuilt UI
- InfraNodus-style graph remains a local concept-map approximation, not the real plugin output
- organisation lens now summarises capabilities and handoffs, but role commonising across employers is still partial
- governance audit export is still partial; visible trace exists, formal export does not

### 2026-06-27 17:54 SGT: AIOE Withhold/Compute Panel

Changed:

- stripped live posting HTML before it enters the manuscript canvas
- added an AIOE determinism panel to the right visual stack
- wired the panel to call `/api/engine` only when SSOC or ESCO fingerprint evidence exists
- added an explicit withhold state when the occupation chain is missing

Wired:

- deterministic AIOE is surfaced as computed only when the engine returns `ok`
- missing occupation evidence appears as a user-visible withheld state
- authenticated production users can compute through the gated `/api/engine` endpoint

Verified:

- `npm run build` passed
- direct deterministic engine test with ESCO fingerprint returned ok, occupation `Database designers and administrators`, AIOE index 84, band high
- Vercel production build passed and produced bundle `index-lAx9wc2c.js`
- Vercel inspect confirmed `v3.takearoundabout.com` points to deployment `dpl_AyUX5kokKKwaWcXtvgw6fVVYEMn2`
- unauthenticated production root still returns `302 Location: /login`

Known gaps:

- full authenticated owner browser test is still required to verify live search plus AIOE from the production UI
- most live MCF postings do not expose SSOC/fingerprint in the current result shape, so the panel correctly withholds rather than scores

### 2026-06-27 18:14 SGT: Telegram Gate Temporarily Disabled

Changed:

- changed `v3/middleware.js` so Telegram login is enforced only when `TELEGRAM_GATE_ENABLED` is explicitly `1`, `true`, `yes`, or `on`
- kept Telegram login, cookies, and auth callbacks in place for later re-enable
- left `v3/server/telegram-session.js` behaviour aligned with the same explicit gate flag

Wired:

- public root route no longer redirects to `/login`
- APIs are reachable without a Telegram session while the gate flag is off
- re-enable path remains: set `TELEGRAM_GATE_ENABLED=true` in production and redeploy/restart the environment

Verified:

- `npm run build` passed
- Vercel production build passed and produced bundle `index-DV1FVbhx.js`
- Vercel inspect confirmed `v3.takearoundabout.com` points to deployment `dpl_GK2EmiqsNo98YnbQGmRQtnNFHv85`
- production root returned `HTTP 200` with app bundle `/assets/index-DV1FVbhx.js`
- production `/api/engine` returned deterministic AIOE output without Telegram session
- production `/api/mcf` for `transformation` returned 30 MyCareersFuture results, first `Cloud Ops Transformation Lead (AIOps)`

Known gaps:

- this is intentionally less private until the gate is re-enabled
- `/login` still exists, but it is no longer required while `TELEGRAM_GATE_ENABLED` is unset/off

### 2026-06-27 21:35 SGT: SSOC 2024 Database And Crosswalk Wiring

Changed:

- compiled SingStat SSOC 2024 hierarchy into `v3/engine-data/ssoc2024-hierarchy.json`
- compiled SSOC 2024 type-of-change data into `v3/engine-data/ssoc2024-type-of-change.json`
- downloaded and compiled official SingStat correspondence workbooks:
  - SSOC 2024 to ISCO-08
  - SSOC 2024 to SSOC 2020
- added `v3/engine-data/ssoc2024-isco.js` and wired it into `engine-core.js`
- added `/api/ssoc` with `status`, `seed`, `search`, `get`, and `correspondence` actions
- seeded production Postgres tables:
  - `ssoc_taxonomy_nodes`
  - `ssoc_taxonomy_meta`
  - `ssoc_correspondence`
- UI AIOE panel now performs SSOC lookup before deciding whether to compute or withhold

Wired:

- SSOC 2024 taxonomy is queryable from production DB
- SSOC 2024 type-of-change is visible on occupation lookup/search
- SSOC 2024 to ISCO-08 correspondence is queryable by code
- SSOC 2024 to SSOC 2020 migration row is queryable by code
- AIOE can compute from SSOC 2024 code `25213`

Verified:

- production deployment `dpl_GgJSKvypvuozbcove2kS1N7C71RB` is aliased to `v3.takearoundabout.com`
- production SSOC DB status returned `node_count=1632`, `occupation_count=1006`
- production correspondence counts returned:
  - `ssoc2024_isco08=1120`
  - `ssoc2024_ssoc2020=1040`
- production search for `Data Engineer` returned:
  - unit group `2521 Database Designers, Administrators and Data Engineers`
  - occupation `25213 Data engineer`, change type `N`
- production correspondence for `25213` returned:
  - ISCO-08 `2521 Database designers and administrators`
  - SSOC 2020 `25212 Database architect`
- production `/api/engine` for SSOC `25213` returned AIOE index `87`, band `high`

Known gaps:

- role commonising across employers is still partial
- not every live job title will map cleanly to one SSOC occupation; ambiguous results must remain derived or withheld
- UI does not yet expose the full correspondence table as an inspectable drawer

### 2026-06-27 21:44 SGT: SSOC Evidence Drawer And AIOE Trace Ladder

Changed:

- added a dedicated `SSOC` working drawer tab beside Source, Blueprint, Advisory, and Letter
- exposed selected job title, SSOC 2024 match, AIOE status, occupation definition, SSOC type-of-change, and correspondence rows in the drawer
- added a compact AIOE trace ladder:
  - SSOC 2024 spine
  - SSOC 2024 to ISCO-08 crosswalk
  - AIOE calculation
  - SSOC 2024 to SSOC 2020 migration
- styled taxonomy and crosswalk evidence rows for light and dark mode

Wired:

- UI calls `/api/ssoc` `correspondence` after a SSOC occupation is selected
- right AIOE panel now shows the actual computation route instead of only the final number
- SSOC drawer uses the same live lookup, correspondence, and AIOE state as the right panel

Verified:

- local `npm run build` passed and produced bundle `index-DlP2t4I8.js`
- production deployment `dpl_5R1f1s83GhmNsUo1wb2NaycWhmzN` completed successfully
- production custom domain `v3.takearoundabout.com` returned `HTTP 200`
- production custom domain served app bundle `/assets/index-CCjlP00T.js`
- production `/api/ssoc` status returned `node_count=1632`, `occupation_count=1006`, `ssoc2024_isco08=1120`, and `ssoc2024_ssoc2020=1040`
- production correspondence for `25213` returned:
  - ISCO-08 `2521 Database designers and administrators`
  - SSOC 2020 `25212 Database architect`
- production `/api/engine` for SSOC `25213` returned AIOE index `87`, band `high`

Known gaps:

- browser-level visual inspection of the new SSOC drawer is still needed on iPhone and iPad proportions
- role commonising across employers is still partial
- ambiguous job titles must still withhold rather than force a single SSOC occupation

### 2026-06-27 22:08 SGT: Concept Graph Readability Pass

Changed:

- replaced crowded inline graph labels with numbered concept nodes
- added a readable concept label stack beside the graph on desktop
- changed phone-width graph labels to a single-column list so long terms do not break awkwardly
- kept concept graph scoped to text clusters, gaps, and bridge concepts; organisation, workflow, and value-stream visuals remain separate forms

Wired:

- graph still uses the existing deterministic concept token extraction from the selected job
- numbered nodes correspond directly to the concept label stack
- responsive layout switches from graph-plus-labels to stacked graph and labels under narrow widths

Verified:

- local `npm run build` passed and produced bundle `index-DNRzpBrb.js`
- local production preview was inspected with system Chrome at desktop width `1366x900`
- local production preview was inspected with system Chrome at phone width `390x844`
- phone-width concept list computed as a single column and rendered without chopped labels
- production deployment `dpl_32vzRpbs7DazCq4hhyfJhZmzP9ec` completed successfully
- production custom domain `v3.takearoundabout.com` returned `HTTP 200`
- production custom domain served app bundle `/assets/index-DGSk0avT.js`
- production `/api/ssoc` status returned `node_count=1632`, `occupation_count=1006`, `ssoc2024_isco08=1120`, and `ssoc2024_ssoc2020=1040`
- production `/api/engine` for SSOC `25213` returned AIOE index `87`, band `high`
- production graph was inspected with system Chrome at desktop width `1366x900`
- production graph was inspected with system Chrome at phone width `390x844`

Known gaps:

- the graph is now readable, but deeper InfraNodus-style graph operations such as cluster expansion, bridge-term pruning, and floating graph windows are still future work
- organisation perspective still needs richer org-chart and capability-map behaviour

### 2026-06-27 22:31 SGT: Rebuild Audit Pass

Changed:

- fixed the rebuilt shell so the document skip link lands on `#main-content`
- aligned the in-app rebuild checklist so final verification is shown as `partial`, not `not-started`
- updated the footer rebuild pass timestamp

Wired:

- accessibility skip target now exists in the React shell
- final verification status in the app now matches the ledger reality: audited but not complete across the whole V3 vision
- OpenAI proxy remains primary LLM path, with Gemini fallback still configured by environment variables

Verified:

- local `npm run build` passed and produced bundle `index-BOE8uzS3.js`
- deterministic engine returned AIOE index `87`, band `high`, for SSOC `25213`
- deterministic engine withheld when no SSOC was provided
- deterministic engine withheld when unknown SSOC `99999` was provided
- local `/api/ssoc` handler fallback returned compiled JSON results without a database
- local production preview was inspected with system Chrome at desktop width `1366x900`
- local production preview confirmed:
  - skip link target `#main-content` exists
  - concept graph renders
  - AIOE panel renders
  - SSOC drawer opens
  - mobile graph renders at phone width `390x844`
- production `/api/mcf` for `transformation` returned 30 MyCareersFuture roles; first role was `Cloud Ops Transformation Lead (AIOps)` by `IBM SINGAPORE PTE LTD`
- production `/api/careers` for `transformation` returned 416 careers.gov.sg roles; first role was `Senior Manager (Innovation & Transformation), SNDG` by `Ministry of Digital Development and Information`
- production `/api/ssoc` search for `Data Engineer` returned unit group `2521` and occupation `25213 Data engineer`
- production `/api/ssoc` correspondence for `25213` returned ISCO-08 `2521` and SSOC 2020 `25212`
- production `/api/claude` used OpenAI successfully and returned provider `openai`, model `gpt-4.1-mini-2025-04-14`
- production deployment `dpl_GJ1DV2Ef7BEDYHyXmZWvns2nrUn6` completed successfully
- production custom domain `v3.takearoundabout.com` returned `HTTP 200`
- production custom domain served app bundle `/assets/index-B4KpOwgZ.js`
- production browser smoke with system Chrome confirmed:
  - skip target `#main-content` exists
  - concept graph renders
  - AIOE panel renders
  - SSOC drawer opens with `25213 Data engineer` and AIOE `87 / 100 (high)`
  - mobile graph renders at phone width `390x844`

Known gaps:

- this audit does not make the whole V3 blueprint complete; organisation commonising, full governance export, true InfraNodus operations, floating graph windows, and richer generative UI remain partial or future work
- Vite preview cannot serve Vercel API routes, so API route behaviour must continue to be verified against production or Vercel preview deployments

### 2026-06-27 22:45 SGT: Formal UI Blueprint Checklist

Changed:

- ran an explicit checklist against `v3/goal/v3-ui-blueprint.md`
- fixed visible interactive controls that were below the UI Doctrine `44 x 44px` target-size rule
- kept the compact V3 shell but restored touch-target compliance for ribbon buttons, rail refs, drawer close, visual expand, theme, and reviewer action controls

Checklist result:

- UI Doctrine tokens: pass for light/dark grounds, accent, exposure colours, Newsreader/Spline/mono type roles
- One workspace / three starting lenses: pass
- Header / ribbon / left rail / centre canvas / right stack / footer: pass
- Review manuscript and review actions: pass
- Source / SSOC / Blueprint / Advisory / Letter drawers: pass
- Graph / Org / Workflow / Value Stream controls: pass
- SSOC + AIOE evidence drawer: pass against production data in the prior audit
- Candidate edge cover-letter drawer: pass for traceable draft, copy, print/PDF route
- Mobile phone graph rendering: pass
- Accessibility skip link: pass after `#main-content` fix
- Visible target size: pass after target-size patch

Verified:

- local `npm run build` passed and produced bundle `index-BTsE9_Wm.js`
- local production preview checklist confirmed:
  - header, ribbon, left rail, centre manuscript, right stack, footer render
  - three starting lenses render
  - review controls render
  - graph and AIOE panels render
  - all five drawers open
  - `#main-content` exists and skip link targets it
  - visible interactive controls under `44 x 44px`: none
  - Newsreader and Spline Sans Mono type roles are applied
  - mobile graph renders at phone width
- local interaction checklist confirmed:
  - dark mode toggles
  - Org, Workflow, Value Stream, and Graph visual modes switch
  - Accept / Reject state updates footer counts
  - Cover Letter drawer opens
  - Print View toggles

Known gaps:

- this checklist is UI-blueprint coverage, not a full automated accessibility scan with axe
- iPad Mini exact viewport was not separately screenshotted in this pass
- organisation commonising, full governance export, true InfraNodus operations, and floating graph windows remain partial/future work

### 2026-06-27 23:02 SGT: Organisation Intelligence Pass 1

Changed:

- added deterministic organisation-intelligence functions to the rebuilt V3 shell
- commonised postings into role families using title, category, skill, and description evidence
- derived capability signals across postings
- derived handoff signals across functions such as Product, Operations, Compliance, Risk, Business units, Technology, and Customers
- derived BPR hypotheses for role mash-up, governance load, handoff density, and unclear ownership
- aggregated repeated BPR hypotheses so the organisation map shows signal strength instead of duplicate rows
- added an `Org` working drawer with:
  - postings read
  - confidence level
  - commonised role families
  - capability signals
  - BPR hypotheses
  - explicit withholding when evidence is thin
- upgraded the right-side `Org` visual into an organisation map with role-family, capability, and BPR lanes
- updated organisation advisory copy to use role families and confidence instead of a loose capability list

Wired:

- organisation mode uses the same live job search result list, then computes organisation intelligence client-side from visible postings
- role-family commonising is deterministic and explainable, not LLM-authored
- BPR hypotheses are derived from repeated capability/handoff/ownership signals and remain labelled as hypotheses
- Org visual answers the UI blueprint's organisation-map question instead of reusing the concept graph

Verified:

- local `npm run build` passed and produced bundle `index-DVOx2-5y.js`
- follow-up build after BPR aggregation passed and produced bundle `index-C2bP2NlN.js`
- local production preview was inspected with system Chrome at desktop width `1366x900`
- local preview confirmed:
  - organisation lens can be selected
  - right-side Org visual renders
  - Org drawer opens
  - commonised role families render
  - capability signals render
  - BPR hypotheses render
  - visible interactive controls under `44 x 44px`: none
  - mobile Org visual renders at phone width `390x844`
- production deployment `dpl_86AZSzvZ5FNd1WtQdXiMsY3j3Tr5` completed successfully for first org-intelligence pass
- production custom domain served bundle `/assets/index-Dokmxk39.js`
- production DBS company probe returned 10 MCF postings and no careers.gov.sg company matches
- production browser smoke confirmed DBS organisation mode loads 30 postings, Org visual renders, Org drawer opens, commonised role families render, BPR hypotheses render, and mobile Org map renders
- follow-up production deployment `dpl_D6e1Hih6AQQaiSc8i1vFbMzny7Bm` completed successfully after BPR aggregation fix
- production custom domain served corrected bundle `/assets/index-CqUwS_NO.js`
- production browser smoke confirmed aggregated BPR trigger rows:
  - `handoff density` high, 30 signals
  - `governance load` medium, 29 signals
  - `unclear ownership` medium, 24 signals
- production visible target-size audit found no visible controls under `44 x 44px`

Known gaps:

- role-family commonising is deterministic heuristic pass 1; it does not yet use SSOC hierarchy for every live posting
- organisation-level confidence is still posting-count based and should later include source diversity, recency, and department/function diversity
- BPR hypotheses are evidence prompts, not recommendations to redesign without human review
- iPad Mini exact screenshot is still pending

### 2026-06-28 07:28 SGT: SSOC Organisation Spine Pass

Changed:

- restored the original V2/V3 ingress sequence as visible workflow copy:
  - Step 1 searches Singapore careers sources
  - Step 2 selects the right returned role or posting from the combined source evidence
- made Step 1 explicit for both `SG Careers role` and `Organisation view`
- added deterministic bulk SSOC classification to `/api/ssoc`
- classified postings to 5-digit SSOC occupations where confidence is sufficient
- commonised organisation role families at the SSOC unit-group level when available
- kept weak or ambiguous phrases withheld instead of forcing an occupational code
- retained the earlier heuristic role-family classifier only as a fallback
- added organisation SSOC coverage to the Org drawer
- added an SSOC occupation spine section showing occupation, unit group, confidence, and score
- updated the Org visual to show SSOC-backed role families and coverage
- added `api/ssoc.js` to Vercel function duration settings
- updated V3 CSP to allow the Google Fonts already imported by the rebuilt UI

Wired:

- live organisation search still calls MCF and careers.gov.sg
- MCF employer matches populate Step 2 role/posting selection
- careers.gov.sg remains part of the source pass and reports when an employer is not a government body
- organisation summary consumes `/api/ssoc?action=classifyTitles`
- SSOC-backed role families use unit-group labels such as `2521 Database Designers, Administrators and Data Engineers`
- ambiguous organisation phrases such as `Transformation Lead` are withheld when no SSOC occupation crosses the threshold

Verified:

- local `npm run build` passed
- local SSOC regression confirmed:
  - `Data Engineer` -> `25213 Data engineer`
  - unit-group family -> `2521 Database Designers, Administrators and Data Engineers`
  - `Transformation Lead` withheld
- production deployment `dpl_H9GuBEMUJ3xd4Yz2pqrZqRLyqyFe` completed successfully
- production custom domain `https://v3.takearoundabout.com` served bundle `/assets/index-DdNVHXTn.js`
- production CSP now includes `https://fonts.googleapis.com` and `https://fonts.gstatic.com`
- production `/api/ssoc` confirmed `Data Engineer` -> `25213` and family `2521`
- production browser smoke with DBS confirmed:
  - Step 1 Organisation View visible
  - Step 2 source evidence visible
  - 30 live postings loaded
  - Org drawer opens
  - SSOC coverage renders
  - SSOC occupation spine renders

Known gaps:

- SSOC classification is deterministic title/context scoring, not a trained occupational classifier
- some senior platform, transformation, and strategy postings are correctly withheld or fall back because SSOC occupation titles do not map cleanly to organisation capability language
- organisation confidence still needs recency, source diversity, and function-diversity weighting
- one non-blocking browser console 404 remains from a small asset/request path and did not block the verified workflow

### 2026-06-28 07:35 SGT: Step 3 Live Manuscript Repair

Changed:

- made the centre manuscript explicitly Step 3
- Step 3 now says `review selected live posting` when the selected role comes from MCF or careers.gov.sg
- Step 3 now says `sample standby` only before live results are selected
- while Step 1 is loading, Step 3 shows a pending live-review state instead of visually presenting the default sample as if it were the final review
- added a compact source strip under the manuscript title showing source status and live source name

Verified:

- local `npm run build` passed
- production deployment `dpl_J1oEkMa6bKYy31a9YR1i7PSACjGx` completed successfully
- production custom domain `https://v3.takearoundabout.com` served bundle `/assets/index-CHfiOk0x.js`
- production browser smoke with `transformation` confirmed:
  - live postings loaded
  - Step 2 remains the role selection list
  - Step 3 displays `review selected live posting`
  - Step 3 no longer displays `sample standby` after live postings load
  - source is MCF or careers.gov.sg

### 2026-06-28 07:47 SGT: Vault v3.0.71 Step 1 And Step 2 Restoration

Source read:

- read `vault/v3.0.71/src/App.jsx`
- confirmed the old interaction contract:
  - Step 1 exposes a source-mode entry with `Analyse a role` and `Browse SG jobs`
  - `Browse SG jobs` searches live MyCareersFuture postings
  - Step 2 is a live posting card list
  - Step 3 analysis begins only when the user taps `Analyse this posting`

Changed:

- added a Step 1 source-mode selector in the rebuilt shell
- changed the role search button copy back to `Browse`
- changed Step 2 from an automatic manuscript selector into live posting cards with `Analyse this posting`
- separated highlighted Step 2 posting from the Step 3 analysis target
- live search now resets Step 3 until a posting is explicitly analysed
- Step 3 now shows a waiting state until `Analyse this posting` is clicked

Verified:

- local `npm run build` passed
- production deployment `dpl_Es121HYhTBZubfhdFicoxeLJSPuQ` completed successfully
- production custom domain `https://v3.takearoundabout.com` served bundle `/assets/index-CsOfBMJs.js`
- production browser smoke with `transformation` confirmed:
  - live postings loaded
  - Step 1 shows `Browse SG jobs`
  - Step 2 cards include `Analyse this posting`
  - before clicking, Step 3 waits for posting action
  - after clicking, Step 3 analyses the selected live posting

### 2026-06-28 07:56 SGT: Exact Vault Step 1/2 Wording And Card Repair

Correction:

- prior pass restored the concept but not enough of the exact `vault/v3.0.71` surface
- this pass restores the visible Step 1 labels and Step 2 card behaviour more directly from the vault

Changed:

- Step 1 now shows the vault labels:
  - `Analyse a role`
  - `ESCO essential skills`
  - `Browse SG jobs`
  - `live MyCareersFuture postings`
- restored the `Fresh grads · < 4 yrs experience` filter
- restored `Browse` as the role-search action label
- Step 2 cards now show richer live posting facts:
  - salary
  - employment type
  - years of experience
  - posting age
  - listed skills
  - source/open posting link
- `Analyse this posting` remains the explicit Step 2 -> Step 3 transition

Verified:

- local `npm run build` passed
- production deployment `dpl_9QCWu9cvtpozMQ39f2gtXahqHCDm` completed successfully
- production custom domain `https://v3.takearoundabout.com` served bundle `/assets/index-BiVT2d3O.js`
- production browser smoke confirmed:
  - `Analyse a role / ESCO essential skills`
  - `Browse SG jobs / live MyCareersFuture postings`
  - `Fresh grads · < 4 yrs experience`
  - live postings load
  - Step 2 cards include posting metadata and `Analyse this posting`
  - Step 3 waits before click and opens after click

### 2026-06-28 08:04 SGT: Remove Initial Sample Workspace

Correction:

- user screenshot showed production still booted into the sample `Data Engineer` manuscript, Step 2 list, and graph
- that violated the restored `vault/v3.0.71` contract because Step 1 and Step 2 must happen before any analysis workspace is shown

Changed:

- initial `jobs`, `selectedId`, and `reviewId` are now empty
- initial state is `idle`, not `sample`
- the sample job is kept only as a hidden internal fallback for defensive rendering
- failed live searches now withhold analysis instead of loading a labelled sample manuscript
- the workspace appears only after live postings are returned
- the first screen now states that Step 2 appears only after live MCF plus careers.gov.sg evidence returns
- `Browse SG jobs` copy now says `MCF + careers.gov.sg postings`

Verified:

- local `npm run build` passed
- local headless Chrome DOM check at `http://127.0.0.1:4173/` confirmed:
  - `Start from live SG job evidence` is present
  - `MCF + careers.gov.sg postings` is present
  - `Data Engineer` is absent
  - `Step 2: select` is absent
  - `Sample manuscript loaded` is absent

### 2026-06-28 08:10 SGT: Retire Static Review Studio Prototypes

Correction:

- user browser was opened to `file:///.../v3/public/review-studio-blueprint-trace.html`, which was a stale standalone prototype, not the rebuilt V3 app
- this made V3 appear unchanged even after the React app and production domain had been corrected

Changed:

- replaced these old static prototype files with redirect/notice pages:
  - `public/review-studio-blueprint-trace.html`
  - `public/review-studio-mvp.html`
  - `public/review-studio-visual-workspace.html`
  - `public/review-ui-preview.html`
- `file://` opens now route to `https://v3.takearoundabout.com/`
- hosted preview paths route to `/`

Verified:

- local `npm run build` passed
- production deployment completed successfully
- production `https://v3.takearoundabout.com/review-studio-blueprint-trace.html` serves the retired-preview notice instead of the old prototype
- production `https://v3.takearoundabout.com/` headless DOM check confirmed:
  - Step 1 first screen is present
  - Step 2 is absent before search
  - sample `Data Engineer` state is absent
  - `MCF + careers.gov.sg postings` is present

### 2026-06-28 08:21 SGT: Restore V2 Step 1 And Step 2 Shape

Correction:

- previous restoration kept V3's ribbon/search-band shell on first load
- user clarified Step 1 and Step 2 should follow V2/vault behaviour, not merely the same sequence

Source read:

- V2 root `src/App.jsx` first screen: blue product bar, large search box, guidance/persona section, optional Fresh Graduate / Industry Crossover cards
- `vault/v3.0.71/src/App.jsx`: role/jobs toggle, live SG browse, fresh-grad filter, and Step 2 browse panel
- PR #148: `Search by employer` as company mode against MCF
- PR #157: shared browse surfaces must name MyCareersFuture + careers.gov.sg, and organisation search fans out to MCF + careers.gov.sg
- PR #158: gov-agency acronym search such as LTA/MOH must remain supported

Changed:

- before a posting is analysed, V3 now uses a V2-style flow:
  - blue product bar
  - centered search card
  - `Analyse a role`, `Browse SG jobs`, `Search by employer`
  - persona guidance
  - Fresh Graduate foundation toggle
- Step 2 is now a V2-style result picker, not the V3 manuscript workspace
- V3 ribbon, drawers, graphs, manuscript review, advisory notes, and cover-letter tools appear only after `Analyse this posting`

Verified:

- local `npm run build` passed
- local headless Chrome DOM check confirmed:
  - V2 product title is present
  - large search field is present
  - V2 heading/persona/foundation cards are present
  - V3 `Reviewable Work Intelligence` header is absent on first load
  - V3 ribbon/output controls are absent on first load
  - sample `Data Engineer` state is absent
  - Step 2 is absent before search
- production deployment completed successfully
- production `https://v3.takearoundabout.com/` headless DOM check confirmed:
  - V2 product title is present
  - search field/persona/foundation cards are present
  - V3 header/ribbon are absent on first load
  - sample `Data Engineer` state is absent
- production API smoke confirmed:
  - `/api/mcf` returns live `transformation` jobs
  - `/api/careers` returns live `transformation` jobs
  - `/api/careers` `action:company` returns live `LTA` agency jobs

### 2026-06-28 09:04 SGT: Step 1 Field Placement And No Sample Fallback

Correction:

- user clarified the role / organisation field belongs below the three Step 1 selections
- the rebuilt shell still carried a hidden sample-job fallback and a default `transformation` query from testing

Changed:

- Step 1 order is now:
  - V2-style heading
  - three choices: `Analyse a role`, `Browse SG jobs`, `Search by employer`
  - role / keyword or organisation / employer field
  - persona and foundation options
- initial query is blank
- removed the sample job fallback from the active analysis pipeline
- SSOC and AIOE now remain withheld until a live posting is selected for review

Verified:

- local `npm run build` passed
- source-order check confirms `Start mode` renders before `Role / keyword`
- `App.jsx` no longer contains `SAMPLE_JOB` or `fallbackJob`
- production deployment completed successfully
- production `https://v3.takearoundabout.com/` serves the new frontend asset
- production API smoke confirmed:
  - `/api/mcf` `action:jobs`, `title:transformation` returns live postings
  - `/api/careers` `action:jobs`, `title:transformation` returns live postings
  - `/api/careers` `action:company`, `company:LTA` returns live agency postings
  - `/api/mcf` `action:company`, `company:DBS` returns live company matches
