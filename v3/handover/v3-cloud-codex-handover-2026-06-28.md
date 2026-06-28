# SG Career View v3 - Cloud Codex Handover Historical Report

> **Status:** CLOUD_HANDOVER_READY_FOR_HUMAN_USE.  
> **Prepared:** 28-06 '26, SGT.  
> **Scope:** V3 only. This report is for moving work from desktop Codex to Cloud Codex while preserving the last 100 PRs, last 100 Vercel deployments, current product doctrine, current live state, and known risks.  
> **Source note:** Generated from local checkout `/Users/akla/Library/Mobile Documents/com~apple~CloudDocs/Downloads/Github/2026-0313_AI-JS`, GitHub CLI data for `ang-kl/2026-0313_AI-JS`, Vercel project `v3_2026-0511-ai-js`, live probes against `https://v3.takearoundabout.com`, local repo docs, and the Human Lead's V2.0.7 Word-document pack from `/Users/akla/Library/Mobile Documents/com~apple~CloudDocs/Downloads/ESCO/Documents/01 AI Analyser`. Treat this as a handover map, not a substitute for re-verifying live state before changing production.

-----

## 1. Executive Abstract

V3 has moved from a V2-style AI-readiness skill analyser into a governed work-intelligence project for live Singapore job evidence. The product direction is now: start with live SG job evidence, select the right posting, then open a reviewable manuscript/workspace where the job ad is treated as a work-system signal rather than a vacancy only.

The historical record shows four overlapping arcs:

1. **Live-source restoration and expansion:** MyCareersFuture plus careers.gov.sg, including role search, company/employer search, and agency acronym support.
2. **Deterministic engine ambition:** ESCO, SSOC 2024, ISCO, AIOE, provenance chips, and withhold-over-fabricate rules.
3. **Reviewable UI/workspace rebuild:** V2 Step 1 and Step 2 preserved, V3 review workspace opened only after a live posting is selected.
4. **Planning/storyboard tooling:** private kanban, blueprint files, UI doctrine, and rebuild ledger for project strategy.

The newest live production deployment is `v32026-0511-ai-2onnw730n-adrians-projects-9870cd22.vercel.app`, state `READY`, target `production`, created `28/06/2026 09:05`. The custom production domain is [v3.takearoundabout.com](https://v3.takearoundabout.com/).

-----

## 2. Canonical Files Cloud Codex Must Read First

| Priority | File | Why it matters |
|---|---|---|
| 1 | `v3/goal/v3-blueprint.md` | Product thesis, methodology, governance, agentic work-system doctrine. |
| 2 | `v3/goal/v3-ui-blueprint.md` | UI doctrine, review workspace, manuscript/reviewer graph direction. |
| 3 | `v3/goal/v3-rebuild-ledger.md` | What was rebuilt, corrected, verified, and deployed during the desktop-to-cloud transition. |
| 4 | `v3/src/App.jsx` | Current rebuilt V3 application shell and Step 1 / Step 2 / review workspace wiring. |
| 5 | `v3/api/mcf.js`, `v3/api/careers.js` | Live SG job-source contracts. Use `action: jobs`, `title`; use `action: company`, `company` for employer/agency search. |
| 6 | `v3/api/ssoc.js`, `v3/engine-data/ssoc2024-*.json` | SSOC 2024 local taxonomy and correspondence material. |
| 7 | `v3/api/engine.js`, `v3/engine-data/engine-core.js` | Deterministic AI exposure and occupation-chain logic. |
| 8 | `doc/v3-engine-wiring-spec.md`, `doc/v3-build-tasks.md`, `doc/v3-reinvention-charter.md` | Older but still important design conventions and implementation rhythm. |

Important current convention: **do not use `v3/skillset.md` as the primary blueprint anymore** unless the Human Lead explicitly revives it. The current canon is `v3-blueprint.md` plus `v3-ui-blueprint.md`.

-----

## 3. Current Product Contract

### 3.1 Step Contract

| Step | Required behaviour | Current handover state |
|---|---|---|
| Step 1 | V2-like start. User chooses one of three modes first: Analyse a role, Browse SG jobs, Search by employer. The role/organisation input sits below those choices. | Restored in `App.jsx`. Initial query is blank. |
| Step 2 | Show live results from MCF and/or careers.gov.sg. User selects the right posting before analysis. | Restored as V2-style result picker. |
| Step 3 | Open V3 review workspace only after `Analyse this posting`. | Wired. Manuscript, graph, advisory, SSOC/AIOE panels are gated by a selected live posting. |

### 3.2 Non-Inventive Rule

V3 must not quietly substitute samples when live evidence is absent. The latest correction removed `SAMPLE_JOB` and `fallbackJob` from the active analysis path. SSOC and AIOE are withheld until a selected live posting exists.

### 3.3 Human-Led Governance Rule

V3 outputs are advisory and reviewable. The product text and engine doctrine must keep the line:

`AI-assisted; human decides.`

No candidate-impacting decision should be hidden behind a black-box score. Computed numbers need provenance; LLM outputs must be labelled as estimates/advisory.

-----

## 4. V2.0.7 Source Documents Incorporated

The Human Lead supplied the April 2026 V2.0.7 document pack as the convention source. This V3 handover now follows the V2 handover discipline: identify the project, confirm build state, name critical state, list open items, state first actions for the next session, and prevent coding before state confirmation.

### 4.1 Source Documents Read

| Source document | What it contributes to V3 handover |
|---|---|
| `design-system-v2 0 7- 08-04-26 2145 .docx` | Typographic hierarchy, colour tokens, breakpoints, spacing, card/badge rules, accessibility notes, and mobile-first layout conventions. |
| `builder-lens-addendum-_08-04-26_2145_.docx` | Decision logic: avoid idle-screen API calls, keep preview fonts scoped, show live activity rather than static explanation, parse existing pipeline state before adding duplicate state. |
| `feature-full-v2_0_7-_08-04-26_2145_.docx` | Full feature description for first-screen preview cards and loading-screen live activity feed. |
| `project-register-v2_0_7-_08-04-26_2145_.docx` | Open items, completed HDR entries, known issues, deferred items, and version trail. |
| `technical-v2_0_7-_08-04-26_2145_.docx` | Component/state/API build state: `PreviewSection`, `LivePromptCard`, `Spinner`, `livePrompt`, `liveSkills`, Vercel timeout/region patterns. |
| `handover-v2_0_7-_08-04-26_2145_.docx` | The handover convention itself: project identity, build state, critical state, open items, first-actions prompt, and required attached docs. |
| `journal-v2_0_7-_08-04-26_2145_.docx` | Session chronology and decision trail for why V2.0.7 changed the first screen and loading screen. |

### 4.2 V2.0.7 Handover Convention To Preserve

| V2 convention | V3 cloud handover rule |
|---|---|
| State project identity first. | Cloud Codex must confirm it is working on `SG Career View v3`, repo `ang-kl/2026-0313_AI-JS`, folder `v3`, not V2 or root. |
| Confirm build file state before coding. | First action is to inspect `v3/package.json`, `v3/src/App.jsx`, `v3/goal/v3-rebuild-ledger.md`, and current Git branch/status. |
| Record critical state as structured facts, not prose memory. | Keep Step 1/Step 2, live source contracts, no-sample rule, auth state, and deployment IDs as explicit handover facts. |
| Begin next session with a prompt. | Section 12 contains a Cloud Codex startup prompt and must be pasted into the new cloud session. |
| Attach/read supporting builder docs first. | Cloud Codex must read V3 blueprint/UI blueprint/ledger first, then this V2.0.7 inheritance section for continuity. |
| Do not write code before confirming state. | Cloud Codex should not patch or deploy until it has confirmed current GitHub state, production deploy state, and whether desktop-local changes are committed. |

### 4.3 V2.0.7 Design Inheritance For V3

| V2.0.7 principle | V3 implication |
|---|---|
| Preview cards use hardcoded static data only; idle screen makes zero API calls. | V3 first load must not trigger live job/API analysis before user intent. If preview content exists, it must be clearly marked as preview and must not become analysis fallback. |
| DM Sans was scoped to `PreviewSection` only; no global font change. | Any special visual treatment in V3 must be scoped. Do not introduce global typography drift without an explicit UI-blueprint decision. |
| Loading screen uses a live activity feed because people read activity, not instructions. | V3 search/loading states should show real source progress: MCF, careers.gov.sg, SSOC, engine, and withhold reasons. |
| Explanation cards collapsed by default after preview has oriented the user. | V3 should avoid heavy explanation on first-use surfaces; place doctrine in drawers, trace panels, and blueprint links. |
| Parse existing pipeline state before adding new state. | V3 should reuse job/source/trace/SSOC/engine state where possible; avoid parallel duplicate truth stores. |
| Responsive typography was documented, but px-based inline sizes were a known issue. | V3 should prefer tokenised responsive CSS and avoid viewport-width font scaling or hardcoded text that cannot resize. |
| System fonts by default, minimal external resources, no photographic assets in V2. | V3 may use richer visuals, but must be intentional and production-grade; do not add decorative assets that obscure evidence. |
| Mobile-first layout with `interactive-widget=resizes-content`. | V3 iPhone/iPad Mini layout must keep Step 1/Step 2 usable when the keyboard opens. |
| Touch targets at least 36px in V2. | V3 controls should meet or exceed this while avoiding oversized buttons that waste estate. |
| No red/green-only meaning was fully solved later, but V2 documented colour roles. | V3 must keep colour-blind-safe semantics: status must be readable by text/shape, not colour alone. |

### 4.4 V2.0.7 Feature Patterns That Still Matter

| Pattern | V3 reuse |
|---|---|
| First-screen sample showed Skill Analysis, Career Progression, Compare as realistic windows. | V3 onboarding should show the three real work modes: live job search, organisation view, and candidate edge, without pretending samples are live. |
| `LivePromptCard` typewriter appeared during loading, not after results. | V3 can show live analysis progress during Step 2/Step 3 loading, but it must not block the critical path. |
| `liveSkills` displayed ESCO skill names/descriptions as they arrived. | V3 should surface live source arrival: MCF jobs, careers.gov.sg jobs, SSOC candidates, and engine readiness. |
| Stage 3 parsed automation counts/career paths/crossover roles from existing label text. | V3 should prefer computed trace extraction from existing job evidence over extra LLM calls. |
| Explanation toggle appears on all analyses, not only first-time users. | V3 should keep help/context available for repeat users, especially on unusual roles or slow live-source calls. |

### 4.5 V2.0.7 Open And Deferred Items Reinterpreted For V3

| V2 item | V3 interpretation |
|---|---|
| Phase 4 credibility copy update. | V3 copy must always distinguish live source, computed result, AI estimate, and withheld result. |
| ESCO `isEssentialForOccupation` skill detail link. | V3 RoleGraph and manuscript review should preserve ESCO/SSOC provenance links where possible. |
| Font-size strategy for large screens. | V3 must handle desktop, iPad Mini, and iPhone without cramping the three panels. |
| Code splitting / FCP improvement. | V3 now has large graph and workspace code; Cloud Codex should audit bundle weight before more visual systems are added. |
| Analytics review. | V3 should restore a clear observability story for API errors, source empties, prompt failures, and withhold decisions. |
| PDF export full role analysis was deferred to V3. | V3 cover-letter/print/PDF work should be treated as a real output requirement, not a prototype button. |
| RAG integration with SkillsFuture/MOM was deferred to V3. | V3 organisation/candidate-edge layer should eventually connect official Singapore skills, salary, vacancy, and training sources. |

### 4.6 V2.0.7 Known Technical Warnings

| Warning | Cloud Codex check |
|---|---|
| Vite v5.1.4 esbuild rejects multi-line async arrow functions inside JSX props. | Prefer named functions for async handlers in JSX. |
| Inline px font sizes cannot be overridden cleanly by browser font settings. | Prefer class/token based sizing in V3 rebuild surfaces. |
| V2 was CLI-deployed and GitHub-disconnected from Vercel. | V3 is Vercel project-linked, but recent deployments include dirty local state; always verify exact deployment source. |
| V2 used `regions: [sin1, hnd1]` and long function timeouts. | V3 uses Vercel Functions; check current `vercel.json` and provider timeout needs before assuming old region/runtime behaviour. |

-----

## 5. Early Chat 4 Product DNA Incorporated

The Human Lead also supplied `ia-jobskilla-analy-chat4-combined.docx`, dated 17 March 2026. This is earlier than V2.0.7 and captures the original operating thesis of the AI Skills Analyser before V3 became a broader work-intelligence system. It must remain visible in the handover because it guards V3 from drifting into graphs, ATS theory, or organisation design without candidate action.

### 5.1 Source Document Read

| Source document | What it contributes to V3 handover |
|---|---|
| `ia-jobskilla-analy-chat4-combined.docx` | Original Chat 4 combined handoff for takearoundabout.com: compare workflow, mobile comparison, ESCO direction, O*NET/CareerOneStop plan, "Start Here" action layer, build/deploy patterns, and worker-first product philosophy. |

### 5.2 Original Product DNA To Preserve

| Chat 4 learning | V3 implication |
|---|---|
| The tool was worker-first: it helped a person understand what AI changes in their role. | V3 must not become only a graph laboratory, ATS reverse-engineering surface, or organisation-design dashboard. Every analysis should help a candidate, worker, manager, or organisation actor decide what to do next. |
| Awareness was not enough. The proposed `Start Here` tab existed because "Demand Forecasting is Full Automation" does not tell the user what to do on Monday morning. | V3 candidate edge must include practical action: exact tools, exact steps, expected output, proof artefact, and what can be built this week. |
| Generic AI advice defeats the purpose. | V3 generated advice must be role-specific, duty-specific, and evidence-backed. Do not ship generic "learn AI tools" copy. |
| The target user was a domain expert learning practical AI, not someone wanting an academic AI explanation. | V3 should speak to people with domain judgement who need operational translation: what to try, what to automate, what to prove, and what to avoid. |
| The platform split was already imagined: main tool warm/worker-facing, O*NET tool data/practitioner-facing, shared Singapore interpretation layer optional and labelled. | V3 should preserve mode distinction: candidate/worker warmth, organisation evidence, and authoritative taxonomy panels should not blur into one confusing voice. |

### 5.3 Compare Workflow Lessons

| Chat 4 pattern | V3 reuse |
|---|---|
| Compare moved into a dedicated tab and stayed visible even when inactive. | V3 should treat comparison as a first-class workflow, not a secondary card buried inside the manuscript. |
| Comparison state survived soft reset when two or more roles were ready. | V3 should preserve user-assembled evidence and comparison queues across navigation changes. |
| Comparison readiness had a visible toast and `View comparison` action. | V3 should nudge the user when off-screen evidence becomes available, especially on mobile. |
| Comparison grid used per-section rows across role columns so alignment stayed meaningful. | V3 role/organisation comparisons should align by evidence type: duties, skills, human-core, AI exposure, gaps, proof, and action. |
| Non-current role titles were clickable to trigger full reanalysis. | V3 comparison should support re-centering analysis on any selected role without losing the comparison set. |

### 5.4 Mobile And Responsive Lessons

| Chat 4 pattern | V3 reuse |
|---|---|
| Narrow comparison mode used `ResizeObserver` below 560px, not only media queries. | V3 panels should respond to actual container width, especially with drawers, floating windows, iPad split view, and right-panel collapse. |
| Mobile comparison used a sticky role switcher bar. | V3 mobile review should keep the current role/source/action visible while the user scrolls evidence. |
| Narrow mode filtered out Human-Led skills in the priority section because they already had their own section. | V3 mobile surfaces should avoid duplicate sections. Each panel must do a different job. |

### 5.5 Evidence And Taxonomy Lessons

| Chat 4 learning | V3 implication |
|---|---|
| Skill counts were expanded but the rule was explicit: do not pad with invented skills. | V3 must continue withhold-over-fabricate. Missing evidence is a state, not a gap to fill with AI prose. |
| Option B used ISCO group to set an exact skill target; Option C used live ESCO essential-skill count as the better long-term answer. | V3 should prefer official live or bundled taxonomy evidence over LLM-estimated counts; SSOC/ISCO/ESCO/AIOE must be treated as source layers. |
| O*NET and CareerOneStop were planned as data-first practitioner layers with visible attribution and US wage caveats. | V3 can use non-Singapore sources, but must label jurisdiction, caveat salary/context, and keep Singapore interpretation separate. |
| The main tool was described as AI-first, warm, indicative, and built for workers; the O*NET tool as data-first, authoritative, and built for practitioners. | V3 UI should keep voice and authority aligned to the source: warm guidance for worker actions, dry attribution for official data, and explicit labels for AI interpretation. |

### 5.6 Architecture Lessons

| Chat 4 pattern | V3 reuse |
|---|---|
| `LEVELS` was the single source of truth for automation colours, labels, and icons. | V3 needs equivalent token discipline for status, source, provenance, work mode, review state, and AI exposure. |
| `comparisonsRef` mirrored state to avoid stale closures in async callbacks. | V3 live source, graph, review, and LLM calls must guard stale writes with cancellation or request IDs. |
| Parallel comparison calls were staggered by 900ms. | V3 multi-source and multi-role analysis should manage concurrency deliberately rather than firing everything at once. |
| Known esbuild failures often came from missing JSX closing tags, then misleading errors later. | Cloud Codex should inspect JSX structure around the earlier edit point when Vite reports odd downstream syntax errors. |
| Maintenance tasks included request ID logging across proxy functions. | V3 should standardise source/API request IDs for MCF, careers.gov.sg, SSOC, engine, OpenAI, and Gemini calls. |

### 5.7 Candidate Edge Requirement

V3's candidate edge should inherit the Chat 4 `Start Here` idea and make it stronger:

1. Identify an AI-exposed duty or skill from the live posting.
2. Explain why it matters in the role context.
3. Name a concrete tool or workflow the user can try.
4. Give a three-step plan for this week.
5. Produce one proof artefact the candidate can show.
6. State what remains human-owned.
7. Label the advice as AI-assisted and evidence-linked, not as a deterministic verdict.

This is the bridge between analysis and advantage. Without this layer, V3 risks becoming impressive but not useful enough for a candidate on the go.

-----

## 6. Current Live Verification Snapshot

| Probe | Result at handover |
|---|---|
| Production domain | `https://v3.takearoundabout.com/` |
| Current frontend asset observed | `assets/index-BQB41n0H.js` |
| MCF probe | `POST /api/mcf {"action":"jobs","title":"transformation","limit":1}` returned 1 job, total 30; first title: `Cloud Ops Transformation Lead (AIOps)`. |
| careers.gov.sg probe | `POST /api/careers {"action":"jobs","title":"transformation","limit":1}` returned 1 job, total 416; first title: `Senior Manager (Innovation & Transformation), SNDG`. |
| Latest deployment | `v32026-0511-ai-2onnw730n-adrians-projects-9870cd22.vercel.app`, `READY`, `production`. |
| Vercel project | `prj_SzPfZqqslzsCsAjbk8uusviFNE1T` / `v3_2026-0511-ai-js`. |
| Vercel team | `team_OFr30y2R1lN3pAplr0JxgT7s`. |

-----

## 7. Repository And Deployment Identity

| Item | Value |
|---|---|
| Repository | [ang-kl/2026-0313_AI-JS](https://github.com/ang-kl/2026-0313_AI-JS) |
| Local checkout | `/Users/akla/Library/Mobile Documents/com~apple~CloudDocs/Downloads/Github/2026-0313_AI-JS` |
| Current local branch at report time | `codex-v3-kanban-planning-live` |
| Origin | `https://github.com/ang-kl/2026-0313_AI-JS.git` |
| V3 package | `ai-job-analyser-v3@3.0.152` |
| Build command | `cd v3 && npm run build` |
| Preview command | `cd v3 && npm run preview` |
| Deploy command used in desktop session | `VERCEL_ORG_ID=team_OFr30y2R1lN3pAplr0JxgT7s VERCEL_PROJECT_ID=prj_SzPfZqqslzsCsAjbk8uusviFNE1T vercel --prod --yes` from repo root. |
| Important CLI note | Local Vercel CLI reported `51.2.1`; upgrade recommended to `54.18.1` or newer with `npm i -g vercel@latest` or `pnpm add -g vercel@latest`. |

-----

## 8. Historical PR Summary: Last 100 PRs

| Metric | Count |
|---|---:|
| PR range | #123 to #222 |
| Total PRs captured | 100 |
| Merged | 96 |
| Closed unmerged | 3 |
| Open | 1 |

### 8.1 Theme Counts

- **Engine / AI:** 82
- **Planning kanban:** 10
- **Live sources:** 3
- **V3 general:** 2
- **UI / graph:** 2
- **Docs / doctrine:** 1

### 8.2 PR Arc Interpretation

- **#123-#145:** result-engine, AIOE, role graph, stewardship, provenance, and deterministic/reviewable analysis work.
- **#146-#158:** live-source expansion, company/employer search, careers.gov.sg integration, acronym agency search, and honest source naming.
- **#159-#181:** organisation/wiki graph, O-I-A, role/workspace readability, mobile and visual iterations, and current-v3 styling alignment.
- **#182-#197:** review studio, UI doctrine, blueprint/rebuild experiments, graph/storyboard interactions, and advisory/reviewer concepts.
- **#198-#217:** API model migration to OpenAI, Gemini fallback, SG job drawer polish, transformation ranking, SSOC data integration, and blueprint/docs consolidation.
- **#218-#222:** private planning kanban and board/lane/card controls.

-----

## 9. Historical Deployment Summary: Last 100 Vercel Deployments

| Metric | Count |
|---|---:|
| Deployments captured | 100 |
| READY | 97 |
| ERROR | 3 |
| Production target | 72 |
| Preview/null target | 28 |
| Newest captured | 28/06/2026 09:05 / `v32026-0511-ai-2onnw730n-adrians-projects-9870cd22.vercel.app` |
| Oldest captured | 23/06/2026 09:15 / `v32026-0511-ai-dau8vd2b0-adrians-projects-9870cd22.vercel.app` |

### 9.1 Deployment Lessons

- Many recent deployments were dirty local deployments from Codex rather than clean main-branch deploys. Treat `gitDirty: 1` as a signal to reconcile GitHub state before assuming production equals main.
- Production has repeatedly been deployed from both `main` and Codex branches. Cloud Codex must check the exact deployment commit before editing from GitHub alone.
- The Vercel project root is configured for V3. In this desktop session, deploying from repo root with explicit `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` worked; deploying from `v3` can mis-resolve root paths if the linked project already has `rootDirectory=v3`.
- There are 3 ERROR deployments in the captured 100. Do not treat a deploy command as success until the deployment state is READY and the custom domain is verified.

-----

## 10. Current Working Tree Risk

This desktop checkout is not clean. Cloud Codex should not assume every local file is committed or present on GitHub.

- `M v3/api/alert.js`
- `M v3/api/anatomy.js`
- `M v3/api/careers.js`
- `M v3/api/claude.js`
- `M v3/api/datagov.js`
- `M v3/api/engine.js`
- `M v3/api/esco.js`
- `M v3/api/mcf.js`
- `M v3/api/planning.js`
- `M v3/engine-data/engine-core.js`
- `M v3/index.html`
- `M v3/package-lock.json`
- `M v3/package.json`
- `M v3/skillset.md`
- `M v3/src/App.jsx`
- `M v3/src/StrategyKanban.jsx`
- `M v3/vercel.json`
- `?? v3/api/auth.js`
- `?? v3/api/login-config.js`
- `?? v3/api/logout.js`
- `?? v3/api/ssoc.js`
- `?? v3/api/telegram-auth.js`
- `?? v3/engine-data/ssoc2024-hierarchy.json`
- `?? v3/engine-data/ssoc2024-isco.js`
- `?? v3/engine-data/ssoc2024-isco08-correspondence.json`
- `?? v3/engine-data/ssoc2024-ssoc2020-correspondence.json`
- `?? v3/engine-data/ssoc2024-type-of-change.json`
- `?? v3/goal/v3-blueprint.md`
- `?? v3/goal/v3-rebuild-ledger.md`
- `?? v3/goal/v3-ui-blueprint.md`
- `?? v3/login.html`
- `?? v3/middleware.js`
- `?? v3/public/login.html`
- `?? v3/public/review-studio-blueprint-trace.html`
- `?? v3/public/review-studio-mvp.html`
- `?? v3/public/review-studio-visual-workspace.html`
- `?? v3/public/review-ui-preview.html`
- `?? "v3/script/v3-reinvention-implementation-spec 2.md"`
- `?? v3/server/`
- `?? v3/src/TelegramGate.jsx`
- `?? "v3/src/wiki/OrgJourney 2.jsx"`
- `?? "v3/src/wiki/graphMetrics 2.js"`

Recommended cloud start:

1. Clone or open GitHub `main` fresh.
2. Read this handover plus `v3/goal/v3-rebuild-ledger.md`.
3. Compare production deployment commit with GitHub main and with this handover.
4. Only then decide whether to port desktop-local changes, rebuild from canon, or continue from main.

-----

## 11. Open Technical Risks

| Risk | Why it matters | First check |
|---|---|---|
| Production may include dirty local deployment state | Latest deployment metadata includes `gitDirty: 1`. | Compare production asset/build with GitHub branch and local diff. |
| `@vercel/postgres` dependency remains | Vercel Postgres is no longer a current Vercel product direction; marketplace databases are the current pattern. | Audit whether V3 still uses Vercel Postgres APIs or only `pg`. |
| Telegram gate temporarily disabled | Earlier direction was to code gate but not enforce, then temporarily disable Telegram login. | Inspect `middleware.js`, `server/telegram-session.js`, and auth APIs before turning it on. |
| Old demo/prototype files remain | Some `v3/public` prototypes still contain sample wording. | Decide whether to archive, redirect, or remove. |
| SSOC local data must be treated as source-controlled taxonomy | Cloud Codex must not regenerate SSOC from memory. | Inspect `v3/engine-data/ssoc2024-*.json` and source XLSX provenance. |
| LLM provider migration | User requested OpenAI primary and Gemini fallback. | Inspect `api/claude.js` and env names `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`. |
| UI doctrine vs implementation drift | User is sensitive to fake/ribbon/insider abbreviations and expects storyboard-grade UI. | Run UI checklist from `v3-ui-blueprint.md` before claiming UI completion. |

-----

## 12. Cloud Codex Operating Rules

Use this as the first prompt instruction when starting Cloud Codex:

```text
You are continuing SG Career View V3 from a desktop Codex handover. Work only inside v3 unless explicitly told otherwise. Read v3/handover/v3-cloud-codex-handover-2026-06-28.md first, then v3/goal/v3-blueprint.md, v3/goal/v3-ui-blueprint.md, and v3/goal/v3-rebuild-ledger.md. Do not trust memory or screenshots over repo/live evidence. Preserve V2-style Step 1 and Step 2: choose mode first, input below, live source results second, review workspace only after Analyse this posting. Do not use dummy/sample fallback data for the main flow. Verify live MCF and careers.gov.sg contracts before claiming job search is wired. Keep AI-assisted; human decides. Use OpenAI primary, Gemini fallback, and deterministic computed outputs where available. Before deploying, run npm run build in v3 and verify production state after deployment.
```

-----

## 13. Immediate Next Build Plan

1. **Reconcile source state:** determine whether latest production dirty deployment should be committed, recreated cleanly, or replaced from GitHub main.
2. **Complete Step 1/Step 2 live UX:** ensure the three selections, input placement, live search, result picker, source labels, and organisation view behave on desktop and mobile.
3. **Audit no-sample contract:** remove or isolate legacy public demos that can confuse the Human Lead during review.
4. **Run blueprint checklist:** compare current UI with `v3-ui-blueprint.md`; mark each component as wired, partial, simulated, or absent.
5. **Harden live source tests:** add lightweight tests or scripts for `/api/mcf`, `/api/careers`, company search, and LTA/DBS cases.
6. **Stabilise deployment flow:** upgrade Vercel CLI, use the V3 project IDs, and record deploy ID plus live probes in the rebuild ledger.
7. **Restore the candidate edge:** revive the Chat 4 `Start Here` idea as a V3 evidence-backed action layer: exact tool, exact steps, proof artefact, human-owned judgement.
8. **Only then resume large UI rebuild:** review manuscript, advisory panel, graph windows, organisation workspace, cover letter, print/PDF, and kanban should be wired against the blueprint, not built as isolated prototypes.

-----

## 14. Appendix A - Last 100 PRs

| # | PR | State | Merged/closed SGT | Theme | Title | Branch | Files | Delta |
|---:|---|---|---|---|---|---|---:|---:|
| 1 | [#222](https://github.com/ang-kl/2026-0313_AI-JS/pull/222) | MERGED | 26/06/2026 08:17 | Planning kanban | feat(v3): wire kanban boards and lane controls | codex-v3-kanban-boards-lanes | 2 | +292/-108 |
| 2 | [#221](https://github.com/ang-kl/2026-0313_AI-JS/pull/221) | MERGED | 26/06/2026 08:06 | Planning kanban | fix(v3): dock kanban card panel and expose source picker | codex-v3-kanban-docked-card | 1 | +74/-32 |
| 3 | [#220](https://github.com/ang-kl/2026-0313_AI-JS/pull/220) | MERGED | 26/06/2026 07:56 | Planning kanban | feat(v3): add kanban workspace drawers | codex-v3-kanban-workspace-drawers | 1 | +404/-64 |
| 4 | [#219](https://github.com/ang-kl/2026-0313_AI-JS/pull/219) | MERGED | 25/06/2026 23:30 | Planning kanban | feat(v3): add kanban lane editing and shortcuts | codex-v3-kanban-card-shortcuts | 2 | +776/-72 |
| 5 | [#218](https://github.com/ang-kl/2026-0313_AI-JS/pull/218) | MERGED | 25/06/2026 21:59 | Planning kanban | feat(v3): add private planning kanban | codex-v3-kanban-planning-live | 4 | +1101/-1 |
| 6 | [#217](https://github.com/ang-kl/2026-0313_AI-JS/pull/217) | MERGED | 25/06/2026 19:43 | Docs / doctrine | docs(v3): add skillset doctrine | codex/upload-v3-skillset-md | 1 | +1871/-0 |
| 7 | [#216](https://github.com/ang-kl/2026-0313_AI-JS/pull/216) | MERGED | 25/06/2026 15:55 | Engine / AI | feat(v3): gate v3.takearoundabout.com behind Telegram login | claude/adoring-brahmagupta-oyvjpv | 6 | +345/-8 |
| 8 | [#215](https://github.com/ang-kl/2026-0313_AI-JS/pull/215) | MERGED | 24/06/2026 21:38 | Live sources | polish(v3): refine SG jobs drawer | codex/v3-sg-jobs-drawer-polish | 6 | +70/-19 |
| 9 | [#214](https://github.com/ang-kl/2026-0313_AI-JS/pull/214) | MERGED | 24/06/2026 21:30 | Live sources | fix(v3): rank SG jobs by search match | codex/v3-sg-jobs-transformation-drawer | 4 | +138/-28 |
| 10 | [#213](https://github.com/ang-kl/2026-0313_AI-JS/pull/213) | MERGED | 24/06/2026 21:21 | V3 general | fix(v3): preserve function notice after instant search | codex/v3-function-notice-early-return | 4 | +10/-8 |
| 11 | [#212](https://github.com/ang-kl/2026-0313_AI-JS/pull/212) | MERGED | 24/06/2026 21:18 | V3 general | fix(v3): flag transformation as function keyword | codex/v3-transformation-function-guard | 4 | +9/-4 |
| 12 | [#211](https://github.com/ang-kl/2026-0313_AI-JS/pull/211) | MERGED | 24/06/2026 21:09 | Engine / AI | feat(v3): add Gemini fallback for LLM proxy | codex/v3-gemini-fallback | 5 | +147/-58 |
| 13 | [#210](https://github.com/ang-kl/2026-0313_AI-JS/pull/210) | MERGED | 24/06/2026 20:33 | Engine / AI | fix(v3): harden OpenAI prompt JSON parsing | codex/v3-openai-json-hardening | 4 | +52/-7 |
| 14 | [#209](https://github.com/ang-kl/2026-0313_AI-JS/pull/209) | MERGED | 24/06/2026 20:19 | Engine / AI | feat(v3): use OPENAI_API_KEY for AI proxy (v3.0.144) | codex/v3-openai-api-key | 6 | +85/-42 |
| 15 | [#208](https://github.com/ang-kl/2026-0313_AI-JS/pull/208) | MERGED | 24/06/2026 19:56 | UI / graph | feat(v3): make result shell centre-first with floating drawers (v3.0.143) | codex/v3-centre-first-drawers | 5 | +211/-25 |
| 16 | [#207](https://github.com/ang-kl/2026-0313_AI-JS/pull/207) | MERGED | 24/06/2026 14:00 | UI / graph | feat(v3): add RIN shell and RoleGraph focus (v3.0.142) | codex/v3-rin-shell-rolegraph | 6 | +1004/-44 |
| 17 | [#206](https://github.com/ang-kl/2026-0313_AI-JS/pull/206) | MERGED | 23/06/2026 19:24 | Engine / AI | fix(v3): merge the two Job ad FABs on the WikiGraph tab (v3.0.141) | claude/merge-jobad-fab | 5 | +15/-7 |
| 18 | [#205](https://github.com/ang-kl/2026-0313_AI-JS/pull/205) | MERGED | 23/06/2026 18:32 | Engine / AI | feat(v3): WikiGraph Job ad FAB -> dissected job-ad drawer (v3.0.140) | claude/wiki-dissect-drawer | 6 | +155/-4 |
| 19 | [#204](https://github.com/ang-kl/2026-0313_AI-JS/pull/204) | MERGED | 23/06/2026 13:56 | Engine / AI | feat(v3): docs-style 2-pane for the organisation perspective (AI-moments) (v3.0.139) | claude/org-2pane | 5 | +51/-17 |
| 20 | [#203](https://github.com/ang-kl/2026-0313_AI-JS/pull/203) | MERGED | 23/06/2026 11:26 | Engine / AI | fix(v3): stop truncating AI-moments node labels at 80 chars (v3.0.138) | claude/kggraph-untruncate | 4 | +12/-6 |
| 21 | [#202](https://github.com/ang-kl/2026-0313_AI-JS/pull/202) | MERGED | 23/06/2026 11:20 | Engine / AI | feat(v3): make the AI-moments graph readable - tap-to-expand + fewer modes (v3.0.137) | claude/kggraph-readable | 5 | +52/-23 |
| 22 | [#201](https://github.com/ang-kl/2026-0313_AI-JS/pull/201) | MERGED | 23/06/2026 10:51 | Engine / AI | fix(v3): drop redundant careers.gov.sg panel on private/MCF employer results (v3.0.136) | claude/csg-declutter | 4 | +19/-6 |
| 23 | [#200](https://github.com/ang-kl/2026-0313_AI-JS/pull/200) | MERGED | 23/06/2026 10:29 | Engine / AI | feat(v3): Career WikiGraph 3-pane shell - centre canvas + docked graph rail (v3.0.135) | claude/wiki-3pane | 6 | +154/-130 |
| 24 | [#199](https://github.com/ang-kl/2026-0313_AI-JS/pull/199) | MERGED | 23/06/2026 10:12 | Planning kanban | feat(v3): Career WikiGraph canvas centre - O-I-A as text card-board, slice 1 (v3.0.134) | claude/wiki-canvas-centre | 6 | +176/-6 |
| 25 | [#198](https://github.com/ang-kl/2026-0313_AI-JS/pull/198) | MERGED | 23/06/2026 09:39 | Engine / AI | fix(v3): O-I-A theme-label gloss 404 - wrong model id (v3.0.133) | claude/oia-gloss-modelfix | 5 | +10/-5 |
| 26 | [#197](https://github.com/ang-kl/2026-0313_AI-JS/pull/197) | MERGED | 23/06/2026 09:33 | Engine / AI | feat(v3): O-I-A polish - work-mode always-on + LLM theme-label gloss (v3.0.132) | claude/oia-polish | 6 | +106/-12 |
| 27 | [#196](https://github.com/ang-kl/2026-0313_AI-JS/pull/196) | MERGED | 23/06/2026 09:20 | Engine / AI | fix(v3): O-I-A themes blobbed into 2 - non-transitive headword clustering (v3.0.131) | claude/oia-clustering-fix | 5 | +31/-31 |
| 28 | [#195](https://github.com/ang-kl/2026-0313_AI-JS/pull/195) | MERGED | 23/06/2026 09:15 | Engine / AI | feat(v3): Career WikiGraph - O-I-A surgical cut of the job R&R (v3.0.130) | claude/wikigraph-oia | 9 | +336/-14 |
| 29 | [#194](https://github.com/ang-kl/2026-0313_AI-JS/pull/194) | MERGED | 23/06/2026 08:31 | Engine / AI | fix(v3): Neural path-back hidden right after click (v3.0.129) | claude/neural-pathback-hover | 5 | +17/-8 |
| 30 | [#193](https://github.com/ang-kl/2026-0313_AI-JS/pull/193) | MERGED | 23/06/2026 08:23 | Engine / AI | fix(v3): Neural path-back never lit up - stale neighbours map (v3.0.128) | claude/neural-pathback-fix | 5 | +18/-11 |
| 31 | [#192](https://github.com/ang-kl/2026-0313_AI-JS/pull/192) | MERGED | 23/06/2026 08:17 | Engine / AI | feat(v3): Career WikiGraph Neural - click shows path back to centre (v3.0.127) | claude/neural-path-back | 5 | +100/-11 |
| 32 | [#191](https://github.com/ang-kl/2026-0313_AI-JS/pull/191) | MERGED | 23/06/2026 07:50 | Engine / AI | feat(v3): Career WikiGraph Neural view - stronger starfield glow (v3.0.126) | claude/neural-glow | 5 | +32/-8 |
| 33 | [#190](https://github.com/ang-kl/2026-0313_AI-JS/pull/190) | MERGED | 23/06/2026 07:39 | Engine / AI | feat(v3): Career WikiGraph - Neural force-directed view (Obsidian-style) (v3.0.125) | claude/wikigraph-neural-view | 7 | +481/-30 |
| 34 | [#189](https://github.com/ang-kl/2026-0313_AI-JS/pull/189) | MERGED | 23/06/2026 07:29 | Engine / AI | feat(v3): Career WikiGraph - hierarchical radial layout, major/minor spokes (v3.0.124) | claude/wikigraph-layout-rework | 5 | +138/-34 |
| 35 | [#188](https://github.com/ang-kl/2026-0313_AI-JS/pull/188) | MERGED | 23/06/2026 06:56 | Engine / AI | fix(v3): a11y palette - clearer orange for high AI-exposure, app-wide (v3.0.123) | claude/a11y-orange-palette | 86 | +34913/-47 |
| 36 | [#187](https://github.com/ang-kl/2026-0313_AI-JS/pull/187) | MERGED | 22/06/2026 22:30 | Engine / AI | feat(v3): Career WikiGraph - ecotone overlay + final sweep (v3.0.122) (PR5) | claude/wikigraph-pr5-ecotone | 8 | +266/-31 |
| 37 | [#186](https://github.com/ang-kl/2026-0313_AI-JS/pull/186) | MERGED | 22/06/2026 21:25 | Engine / AI | feat(v3): Career WikiGraph - Organisation lens (value stream) (v3.0.121) | claude/wikigraph-pr4-clean | 6 | +763/-25 |
| 38 | [#185](https://github.com/ang-kl/2026-0313_AI-JS/pull/185) | MERGED | 22/06/2026 17:26 | Engine / AI | feat(v3): Career WikiGraph - Candidate lens (v3.0.120) | claude/wikigraph-pr3-clean | 7 | +1009/-49 |
| 39 | [#184](https://github.com/ang-kl/2026-0313_AI-JS/pull/184) | MERGED | 22/06/2026 16:26 | Engine / AI | feat(v3): Career WikiGraph as a result-page tab (v3.0.119) | claude/wikigraph-as-tab | 5 | +37/-37 |
| 40 | [#183](https://github.com/ang-kl/2026-0313_AI-JS/pull/183) | MERGED | 22/06/2026 16:07 | Engine / AI | feat(v3): PR1 - Career WikiGraph entry + radial graph shell (v3.0.118) | claude/wikigraph-pr1-clean | 6 | +673/-16 |
| 41 | [#182](https://github.com/ang-kl/2026-0313_AI-JS/pull/182) | CLOSED | 22/06/2026 16:06 | Live sources | feat(v3): PR1 - Career WikiGraph entry + radial graph shell (v3.0.118) | feature/wikigraph-pr1-entry-shell | 7 | +1030/-16 |
| 42 | [#181](https://github.com/ang-kl/2026-0313_AI-JS/pull/181) | OPEN | - | Engine / AI | WikiGraph W1 — Employer persona wired live (?view=wiki) · v3.0.116 | claude/wikigraph-w1-employer-spec | 6 | +1793/-4 |
| 43 | [#180](https://github.com/ang-kl/2026-0313_AI-JS/pull/180) | MERGED | 22/06/2026 13:17 | Engine / AI | docs(v3): PR0 - Career WikiGraph spec, READY_FOR_BUILD (v3.0.117) | claude/wikigraph-spec-pr0 | 5 | +361/-4 |
| 44 | [#179](https://github.com/ang-kl/2026-0313_AI-JS/pull/179) | MERGED | 22/06/2026 12:28 | Engine / AI | docs(v3): WikiGraph build plan (HTML, 2026-06-22) (v3.0.116) | claude/wikigraph-plan-doc | 5 | +197/-4 |
| 45 | [#178](https://github.com/ang-kl/2026-0313_AI-JS/pull/178) | MERGED | 21/06/2026 19:34 | Engine / AI | feat(v3): WikiGraph /demo - Candidate Brief takeaway (v3.0.115) | claude/wikigraph-demo-brief | 5 | +45/-6 |
| 46 | [#177](https://github.com/ang-kl/2026-0313_AI-JS/pull/177) | MERGED | 21/06/2026 15:24 | Engine / AI | feat(v3): WikiGraph /demo - more journeys (neurosurgery + BA) (v3.0.114) | claude/wikigraph-demo-morejourneys | 5 | +45/-5 |
| 47 | [#176](https://github.com/ang-kl/2026-0313_AI-JS/pull/176) | MERGED | 21/06/2026 14:20 | Engine / AI | feat(v3): WikiGraph /demo - full guided organisation journey (v3.0.113) | claude/wikigraph-demo-orgjourney | 5 | +36/-5 |
| 48 | [#175](https://github.com/ang-kl/2026-0313_AI-JS/pull/175) | MERGED | 21/06/2026 14:01 | Engine / AI | feat(v3): WikiGraph /demo - full guided candidate journey (v3.0.112) | claude/wikigraph-demo-journey | 5 | +69/-6 |
| 49 | [#174](https://github.com/ang-kl/2026-0313_AI-JS/pull/174) | MERGED | 21/06/2026 13:34 | Engine / AI | feat(v3): WikiGraph /demo - candidate/org lenses + ecotone + value stream (v3.0.111) | claude/wikigraph-demo-ecotone | 5 | +90/-13 |
| 50 | [#173](https://github.com/ang-kl/2026-0313_AI-JS/pull/173) | MERGED | 21/06/2026 13:07 | Engine / AI | feat(v3): WikiGraph /demo - radial only, drop org-chart toggle (v3.0.110) | claude/wikigraph-demo-noorg | 5 | +10/-7 |
| 51 | [#172](https://github.com/ang-kl/2026-0313_AI-JS/pull/172) | MERGED | 21/06/2026 12:32 | Engine / AI | fix(v3): WikiGraph /demo - drop the MCF abbreviation (v3.0.109) | claude/wikigraph-demo-nomcf | 5 | +17/-10 |
| 52 | [#171](https://github.com/ang-kl/2026-0313_AI-JS/pull/171) | MERGED | 21/06/2026 12:13 | Engine / AI | feat(v3): WikiGraph /demo - v3 title + word-wrapped bubbles (v3.0.108) | claude/wikigraph-demo-title | 5 | +26/-12 |
| 53 | [#170](https://github.com/ang-kl/2026-0313_AI-JS/pull/170) | MERGED | 21/06/2026 12:05 | Engine / AI | fix(v3): WikiGraph /demo - true v3 neumorphic styling (v3.0.107) | claude/wikigraph-demo-neumorphic | 5 | +33/-17 |
| 54 | [#169](https://github.com/ang-kl/2026-0313_AI-JS/pull/169) | MERGED | 21/06/2026 11:53 | Engine / AI | feat(v3): WikiGraph /demo - match current v3 styles + colours (v3.0.106) | claude/wikigraph-demo-v3style | 5 | +34/-22 |
| 55 | [#168](https://github.com/ang-kl/2026-0313_AI-JS/pull/168) | MERGED | 21/06/2026 09:54 | Engine / AI | feat(v3): WikiGraph /demo - live careers.gov.sg roles under agencies (v3.0.105) | claude/wikigraph-demo-live | 5 | +40/-5 |
| 56 | [#167](https://github.com/ang-kl/2026-0313_AI-JS/pull/167) | MERGED | 21/06/2026 08:52 | Engine / AI | feat(v3): WikiGraph /demo - 16 ministries, MOE + MHA mapped (v3.0.104) | claude/wikigraph-demo-gov | 5 | +62/-6 |
| 57 | [#166](https://github.com/ang-kl/2026-0313_AI-JS/pull/166) | MERGED | 21/06/2026 08:43 | Engine / AI | feat(v3): WikiGraph /demo - real SGDI government org chart (v3.0.103) | claude/wikigraph-demo-sgdi | 5 | +41/-7 |
| 58 | [#165](https://github.com/ang-kl/2026-0313_AI-JS/pull/165) | MERGED | 21/06/2026 08:26 | Engine / AI | fix(v3,CSG): result tab 'MyCareersFuture Jobs' -> 'SG Jobs' (v3.0.102) | claude/fix-mcf-tab-label | 4 | +12/-5 |
| 59 | [#164](https://github.com/ang-kl/2026-0313_AI-JS/pull/164) | MERGED | 21/06/2026 08:21 | Engine / AI | feat(v3): WikiGraph /demo - focus-browser + org chart toggle (v3.0.101) | claude/wikigraph-demo-dual | 5 | +67/-41 |
| 60 | [#163](https://github.com/ang-kl/2026-0313_AI-JS/pull/163) | MERGED | 21/06/2026 08:06 | Engine / AI | feat(v3): WikiGraph /demo - radial ecosystem graph (v3.0.100) | claude/wikigraph-demo-radial | 5 | +269/-282 |
| 61 | [#162](https://github.com/ang-kl/2026-0313_AI-JS/pull/162) | MERGED | 21/06/2026 07:33 | Engine / AI | fix(v3): WikiGraph /demo layout - widen + de-overlap graph (v3.0.99) | claude/wikigraph-demo-layout | 5 | +22/-16 |
| 62 | [#161](https://github.com/ang-kl/2026-0313_AI-JS/pull/161) | MERGED | 20/06/2026 21:41 | Engine / AI | feat(v3): WikiGraph /demo - expanding graph, tap to grow branches (v3.0.98) | claude/wikigraph-demo-graph | 5 | +102/-30 |
| 63 | [#160](https://github.com/ang-kl/2026-0313_AI-JS/pull/160) | MERGED | 20/06/2026 21:09 | Engine / AI | feat(v3): WikiGraph /demo - full entry flow for all 4 persona types (v3.0.97) | claude/wikigraph-demo-flow | 5 | +229/-247 |
| 64 | [#159](https://github.com/ang-kl/2026-0313_AI-JS/pull/159) | MERGED | 20/06/2026 19:43 | Engine / AI | feat(v3): WikiGraph MVP demo at /demo (v3.0.96) | claude/wikigraph-demo | 6 | +480/-4 |
| 65 | [#158](https://github.com/ang-kl/2026-0313_AI-JS/pull/158) | MERGED | 20/06/2026 18:08 | Engine / AI | fix(v3,CSG): agency search resolves typed acronyms (LTA/MOH) + honest counts (v3.0.95) | claude/csg-agency-match | 5 | +45/-14 |
| 66 | [#157](https://github.com/ang-kl/2026-0313_AI-JS/pull/157) | MERGED | 20/06/2026 18:01 | Engine / AI | feat(v3,CSG): name both job sources across the app + gov-agency search (v3.0.94) | claude/csg-source-copy | 5 | +391/-203 |
| 67 | [#156](https://github.com/ang-kl/2026-0313_AI-JS/pull/156) | MERGED | 20/06/2026 15:18 | Engine / AI | fix(v3): Workflow view shows all 3 columns (stop LOD hiding the middle column) | claude/wf-columns-fix | 3 | +15/-4 |
| 68 | [#155](https://github.com/ang-kl/2026-0313_AI-JS/pull/155) | MERGED | 20/06/2026 16:19 | Engine / AI | feat(v3,CSG): careers.gov.sg 2nd job source + two-column browse (v3.0.92) | claude/careers-recut | 8 | +616/-59 |
| 69 | [#154](https://github.com/ang-kl/2026-0313_AI-JS/pull/154) | CLOSED | 20/06/2026 14:27 | Engine / AI | feat(v3): careers.gov.sg second source + v3.0.78 vault/pillars upkeep (combined, v3.0.78) | claude/careers-source | 66 | +22498/-52 |
| 70 | [#153](https://github.com/ang-kl/2026-0313_AI-JS/pull/153) | CLOSED | 19/06/2026 19:41 | Engine / AI | chore(v3): VAULT v3.0.77 snapshot + pillars AS-BUILT reconcile + journal HDR #116 (v3.0.78) | claude/v3.0.78-upkeep | 63 | +21916/-4 |
| 71 | [#152](https://github.com/ang-kl/2026-0313_AI-JS/pull/152) | MERGED | 19/06/2026 07:53 | Engine / AI | feat(v3): CO2.2 — zoomable hub-first graph (semantic LOD + pan/zoom) + neural⇆workflow toggle | claude/co2-2-graph-spec | 4 | +710/-54 |
| 72 | [#151](https://github.com/ang-kl/2026-0313_AI-JS/pull/151) | MERGED | 19/06/2026 06:33 | Engine / AI | fix(v3): CO2.1 — fence non-duties (quals/benefits/headers) + rank-truncate tiers | claude/co2-1-cleanup | 2 | +31/-3 |
| 73 | [#150](https://github.com/ang-kl/2026-0313_AI-JS/pull/150) | MERGED | 19/06/2026 06:06 | Engine / AI | fix(v3): landing refresh — drop Fresh-grads checkbox, mode-aware persona toggle, grounding line | claude/landing-refresh | 2 | +15/-15 |
| 74 | [#149](https://github.com/ang-kl/2026-0313_AI-JS/pull/149) | MERGED | 19/06/2026 00:55 | Engine / AI | feat(v3): CO2 — company "agents to build" (recurring duty-clusters → candidate agents + graph) | claude/co2-agents-spec | 5 | +1155/-5 |
| 75 | [#148](https://github.com/ang-kl/2026-0313_AI-JS/pull/148) | MERGED | 18/06/2026 23:58 | Engine / AI | feat(v3): CO1 — company-name search (role ⇆ company switch, MCF poll + name double-check) | claude/co1-company-search | 4 | +624/-14 |
| 76 | [#147](https://github.com/ang-kl/2026-0313_AI-JS/pull/147) | MERGED | 18/06/2026 21:14 | Engine / AI | fix(v3): KG3 — wire the knowledge graph (skill→occupation edges) + 0-edge guard | claude/kg3-edges | 3 | +22/-7 |
| 77 | [#146](https://github.com/ang-kl/2026-0313_AI-JS/pull/146) | MERGED | 18/06/2026 21:12 | Engine / AI | fix(v3): professional layout for "Same job, other names" sibling titles | claude/related-titles-layout | 2 | +17/-7 |
| 78 | [#145](https://github.com/ang-kl/2026-0313_AI-JS/pull/145) | MERGED | 18/06/2026 21:11 | Planning kanban | fix(v3): landing polish — text-size buttons, choice-card selection, input focus | claude/landing-fixes | 2 | +15/-11 |
| 79 | [#144](https://github.com/ang-kl/2026-0313_AI-JS/pull/144) | MERGED | 18/06/2026 18:41 | Engine / AI | feat(v3): AL1 — agentic Skill→Recipe→Agent→Orchestrator ladder per duty | claude/agentic-ladder | 3 | +317/-6 |
| 80 | [#143](https://github.com/ang-kl/2026-0313_AI-JS/pull/143) | MERGED | 18/06/2026 18:08 | Engine / AI | feat(v3): KG2 — wire the knowledge graph into the result page (view toggle) | claude/kg2-wire-result-graph | 3 | +62/-3 |
| 81 | [#142](https://github.com/ang-kl/2026-0313_AI-JS/pull/142) | MERGED | 18/06/2026 17:52 | Engine / AI | feat(v3): standardize pop-up/overlay typography + structure (POP tokens) | claude/popup-standardize | 2 | +43/-15 |
| 82 | [#141](https://github.com/ang-kl/2026-0313_AI-JS/pull/141) | MERGED | 18/06/2026 17:34 | Engine / AI | feat(v3): KG1 — deterministic knowledge-graph builder + clustered render | claude/kg1-knowledge-graph | 4 | +877/-56 |
| 83 | [#140](https://github.com/ang-kl/2026-0313_AI-JS/pull/140) | MERGED | 18/06/2026 17:10 | Engine / AI | fix(v3): hide "Analyse all postings as one role" for single-posting results | claude/mcf-posting-no-corpus-cta | 1 | +2/-2 |
| 84 | [#139](https://github.com/ang-kl/2026-0313_AI-JS/pull/139) | MERGED | 18/06/2026 17:10 | Engine / AI | feat(v3): job-ad parser slice 2 — structured sections + collapsible drawer | claude/jobad-slice2-parse | 1 | +74/-14 |
| 85 | [#138](https://github.com/ang-kl/2026-0313_AI-JS/pull/138) | MERGED | 18/06/2026 16:47 | Engine / AI | feat(v3): job-ad parser slice 1 — strip + section-boundary fixes | claude/jobad-slice1-strip | 2 | +19/-6 |
| 86 | [#137](https://github.com/ang-kl/2026-0313_AI-JS/pull/137) | MERGED | 18/06/2026 17:13 | Engine / AI | refactor(v3): text scaling via root font-size + full px→rem sweep | claude/text-scale-rem | 1 | +894/-929 |
| 87 | [#136](https://github.com/ang-kl/2026-0313_AI-JS/pull/136) | MERGED | 18/06/2026 16:05 | Engine / AI | fix(v3): job-title search field reads as fillable (white bg + blue border) | claude/search-field-affordance | 1 | +1/-1 |
| 88 | [#135](https://github.com/ang-kl/2026-0313_AI-JS/pull/135) | MERGED | 18/06/2026 15:55 | Engine / AI | fix(v3): text-size scales every screen, MCF postings column tiers, succinct intro copy | claude/ui-textsize-columns-copy | 1 | +57/-52 |
| 89 | [#134](https://github.com/ang-kl/2026-0313_AI-JS/pull/134) | MERGED | 18/06/2026 12:27 | Engine / AI | fix(v3): repoint claude-fable-5 → claude-opus-4-8 (prod 404) + fail fast on 4xx | claude/fix-claude-model-404 | 1 | +16/-10 |
| 90 | [#133](https://github.com/ang-kl/2026-0313_AI-JS/pull/133) | MERGED | 18/06/2026 13:57 | Planning kanban | fix(v3): result-page UI pass — text-size in sticky header, mobile zoom, tablet skill cards, job-ad render, a11y | claude/check-fgw3h6 | 4 | +293/-67 |
| 91 | [#132](https://github.com/ang-kl/2026-0313_AI-JS/pull/132) | MERGED | 18/06/2026 09:12 | Engine / AI | feat(v3): text-size control + "What this means for you" summary | claude/check-fgw3h6 | 1 | +279/-33 |
| 92 | [#131](https://github.com/ang-kl/2026-0313_AI-JS/pull/131) | MERGED | 18/06/2026 08:59 | Engine / AI | fix(v3): nav - phone PillarBar / tablet+notebook floating rail (sticky fix) | claude/check-fgw3h6 | 1 | +22/-19 |
| 93 | [#130](https://github.com/ang-kl/2026-0313_AI-JS/pull/130) | MERGED | 18/06/2026 08:34 | Engine / AI | chore(v3): bump to v3.0.78 - close the pillars arc | claude/check-fgw3h6 | 3 | +16/-2 |
| 94 | [#129](https://github.com/ang-kl/2026-0313_AI-JS/pull/129) | MERGED | 17/06/2026 21:14 | Planning kanban | feat(v3): liquid-glass floating nav rail beside the title card | claude/check-fgw3h6 | 1 | +48/-38 |
| 95 | [#128](https://github.com/ang-kl/2026-0313_AI-JS/pull/128) | MERGED | 17/06/2026 21:01 | Engine / AI | feat(v3): +1 detail font + 1/2/3/4-column analysis screen | claude/check-fgw3h6 | 1 | +41/-39 |
| 96 | [#127](https://github.com/ang-kl/2026-0313_AI-JS/pull/127) | MERGED | 17/06/2026 20:34 | Engine / AI | feat(v3): jargon glossary tooltips (Term + _GLOSSARY) | claude/check-fgw3h6 | 1 | +151/-13 |
| 97 | [#126](https://github.com/ang-kl/2026-0313_AI-JS/pull/126) | MERGED | 17/06/2026 19:42 | Engine / AI | feat(v3): TGFEP + Employer reality hide-when-clean | claude/check-fgw3h6 | 1 | +2/-0 |
| 98 | [#125](https://github.com/ang-kl/2026-0313_AI-JS/pull/125) | MERGED | 17/06/2026 18:34 | Engine / AI | feat(v3): reconcile AI scores - resilience to AI Readiness, exposure-vs-resilience note | claude/check-fgw3h6 | 1 | +69/-32 |
| 99 | [#124](https://github.com/ang-kl/2026-0313_AI-JS/pull/124) | MERGED | 17/06/2026 17:54 | Planning kanban | feat(v3,ARM): restructure Task Prep into collapsible bands + cards | claude/check-fgw3h6 | 1 | +109/-31 |
| 100 | [#123](https://github.com/ang-kl/2026-0313_AI-JS/pull/123) | MERGED | 17/06/2026 17:42 | Engine / AI | feat(v3,PL-NAV): pillar-grouped navigation tree (replaces flat nav box) | claude/check-fgw3h6 | 1 | +125/-37 |

-----

## 15. Appendix B - Last 100 Vercel Deployments

| # | Created SGT | State | Target | URL | Commit | Ref | Message |
|---:|---|---|---|---|---|---|---|
| 1 | 28/06/2026 09:05 | READY | production | v32026-0511-ai-2onnw730n-adrians-projects-9870cd22.vercel.app | 691f36a | codex-v3-kanban-planning-live | feat(v3): add private planning kanban |
| 2 | 28/06/2026 08:20 | READY | production | v32026-0511-ai-qzli6i8ap-adrians-projects-9870cd22.vercel.app | 691f36a | codex-v3-kanban-planning-live | feat(v3): add private planning kanban |
| 3 | 28/06/2026 08:10 | READY | production | v32026-0511-ai-n7kaluwj2-adrians-projects-9870cd22.vercel.app | 691f36a | codex-v3-kanban-planning-live | feat(v3): add private planning kanban |
| 4 | 28/06/2026 08:06 | READY | production | v32026-0511-ai-rhc0yxt0s-adrians-projects-9870cd22.vercel.app | 691f36a | codex-v3-kanban-planning-live | feat(v3): add private planning kanban |
| 5 | 28/06/2026 07:55 | READY | production | v32026-0511-ai-gfe74khyf-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 6 | 28/06/2026 07:45 | READY | production | v32026-0511-ai-66087fsyj-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 7 | 28/06/2026 07:34 | READY | production | v32026-0511-ai-l2afyqzs0-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 8 | 28/06/2026 07:32 | READY | production | v32026-0511-ai-c8ft6ryia-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 9 | 28/06/2026 07:27 | READY | production | v32026-0511-ai-ctoebo2ml-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 10 | 28/06/2026 07:22 | READY | production | v32026-0511-ai-bhfkw8bnd-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 11 | 27/06/2026 22:58 | READY | production | v32026-0511-ai-e4crljzsp-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 12 | 27/06/2026 22:53 | READY | production | v32026-0511-ai-7qmu2suha-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 13 | 27/06/2026 22:29 | READY | production | v32026-0511-ai-funbrxvsi-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 14 | 27/06/2026 22:12 | READY | production | v32026-0511-ai-d3u6j18ae-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 15 | 27/06/2026 22:10 | READY | production | v32026-0511-ai-qvhj26jmf-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 16 | 27/06/2026 21:57 | READY | production | v32026-0511-ai-8wjeiusn7-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 17 | 27/06/2026 21:45 | READY | production | v32026-0511-ai-juypj3f9r-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 18 | 27/06/2026 21:44 | READY | production | v32026-0511-ai-p1wf6fya2-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 19 | 27/06/2026 21:34 | READY | production | v32026-0511-ai-m78mxkbl6-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 20 | 27/06/2026 21:29 | READY | production | v32026-0511-ai-8ezipovym-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 21 | 27/06/2026 21:26 | READY | production | v32026-0511-ai-6fzascnoh-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 22 | 27/06/2026 21:22 | READY | production | v32026-0511-ai-img2vo2ne-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 23 | 27/06/2026 21:18 | READY | production | v32026-0511-ai-42t634czu-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 24 | 27/06/2026 18:14 | READY | production | v32026-0511-ai-7kf83bn4d-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 25 | 27/06/2026 17:54 | READY | production | v32026-0511-ai-ndqkvacyq-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 26 | 27/06/2026 17:49 | READY | production | v32026-0511-ai-3cqhlajj8-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 27 | 27/06/2026 17:42 | READY | production | v32026-0511-ai-l3kbq4457-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 28 | 26/06/2026 18:19 | READY | production | v32026-0511-ai-kilpy9nua-adrians-projects-9870cd22.vercel.app | 731a9f5 | main | docs(v3): add skillset source for kanban build |
| 29 | 26/06/2026 17:54 | READY | production | v32026-0511-ai-6bdb8ef8b-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 30 | 26/06/2026 16:48 | ERROR | production | v32026-0511-ai-3uwz88bqg-adrians-projects-9870cd22.vercel.app | 5dbea67 | main | Add files via upload |
| 31 | 26/06/2026 10:43 | READY | production | v32026-0511-ai-1hqrt6spr-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 32 | 26/06/2026 10:09 | READY | production | v32026-0511-ai-h3vnn8hpg-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 33 | 26/06/2026 10:05 | READY | production | v32026-0511-ai-r2r3f8nzk-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 34 | 26/06/2026 10:04 | READY | production | v32026-0511-ai-3yuma2etd-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 35 | 26/06/2026 09:04 | READY | production | v32026-0511-ai-oa4k07m6t-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 36 | 26/06/2026 08:54 | READY | production | v32026-0511-ai-ctnutu0ih-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 37 | 26/06/2026 08:51 | ERROR | production | v32026-0511-ai-aj3mf1kir-adrians-projects-9870cd22.vercel.app | - | - | codex |
| 38 | 26/06/2026 08:17 | READY | production | v32026-0511-ai-3b233eyiu-adrians-projects-9870cd22.vercel.app | dca61ad | main | feat(v3): wire kanban boards and lane controls  Wire board icons to real board keys and add lane create, dupli |
| 39 | 26/06/2026 08:17 | READY | preview/null | v32026-0511-ai-5loml9ww6-adrians-projects-9870cd22.vercel.app | a5facb6 | codex-v3-kanban-boards-lanes | feat(v3): wire kanban boards and lane controls |
| 40 | 26/06/2026 08:06 | READY | production | v32026-0511-ai-2yzya4br1-adrians-projects-9870cd22.vercel.app | 37cbfdc | main | fix(v3): dock kanban card panel and expose source picker  Docks Selected Card as a right-side layout panel and |
| 41 | 26/06/2026 08:05 | READY | preview/null | v32026-0511-ai-5szara5hs-adrians-projects-9870cd22.vercel.app | bf9ebc6 | codex-v3-kanban-docked-card | fix(v3): dock kanban card panel and expose source picker |
| 42 | 26/06/2026 07:56 | READY | production | v32026-0511-ai-dqbf6p257-adrians-projects-9870cd22.vercel.app | c372c89 | main | feat(v3): add kanban workspace drawers  Adds floating workspace drawers, a left rail, file switching, board ic |
| 43 | 26/06/2026 07:55 | READY | preview/null | v32026-0511-ai-jzmg9vhdl-adrians-projects-9870cd22.vercel.app | 71adf76 | codex-v3-kanban-workspace-drawers | feat(v3): add kanban workspace drawers |
| 44 | 25/06/2026 23:31 | READY | production | v32026-0511-ai-1j03v7684-adrians-projects-9870cd22.vercel.app | c0f84da | main | feat(v3): add kanban lane editing and shortcuts  Adds editable persisted lane headers, compact storyboard card |
| 45 | 25/06/2026 23:30 | READY | preview/null | v32026-0511-ai-ku5zakgmp-adrians-projects-9870cd22.vercel.app | 4276463 | codex-v3-kanban-card-shortcuts | feat(v3): add kanban lane editing and shortcuts |
| 46 | 25/06/2026 21:59 | READY | production | v32026-0511-ai-ky21gpwre-adrians-projects-9870cd22.vercel.app | 08bc144 | main | feat(v3): add private planning kanban  Adds a V3-only planning/storyboard Kanban at /plan/kanban.  Includes th |
| 47 | 25/06/2026 21:58 | READY | preview/null | v32026-0511-ai-cydmqmin8-adrians-projects-9870cd22.vercel.app | d4a7d6d | codex-v3-kanban-planning-live | feat(v3): add private planning kanban |
| 48 | 25/06/2026 21:27 | ERROR | preview/null | v32026-0511-ai-3jk82ut3q-adrians-projects-9870cd22.vercel.app | 691f36a | codex-v3-kanban-planning-live | feat(v3): add private planning kanban |
| 49 | 25/06/2026 19:43 | READY | production | v32026-0511-ai-5bop9dsr1-adrians-projects-9870cd22.vercel.app | f2ec9eb | main | docs(v3): add skillset doctrine  Add v3/skillset.md as the central V3 doctrine and implementation-methodology  |
| 50 | 25/06/2026 19:24 | READY | preview/null | v32026-0511-ai-coy1r4zgn-adrians-projects-9870cd22.vercel.app | 052b49b | codex/upload-v3-skillset-md | docs(v3): add skillset doctrine |
| 51 | 25/06/2026 15:55 | READY | production | v32026-0511-ai-althbq9jb-adrians-projects-9870cd22.vercel.app | ebdc2a9 | main | feat(v3): gate v3.takearoundabout.com behind Telegram login (#216)  Adds a single-user Telegram-Login gate aro |
| 52 | 25/06/2026 14:29 | READY | preview/null | v32026-0511-ai-lji278u7u-adrians-projects-9870cd22.vercel.app | bf25da0 | claude/adoring-brahmagupta-oyvjpv | feat(v3): gate v3.takearoundabout.com behind Telegram login  Adds a single-user Telegram-Login gate around the |
| 53 | 25/06/2026 14:20 | READY | production | v32026-0511-ai-kkkznfqm5-adrians-projects-9870cd22.vercel.app | b02f02f | main | Create O-I-A Posting Lens documentation  Added O-I-A Posting Lens document outlining the methodology for analy |
| 54 | 25/06/2026 14:08 | READY | production | v32026-0511-ai-mtf8hpnmh-adrians-projects-9870cd22.vercel.app | b02f02f | main | Create O-I-A Posting Lens documentation  Added O-I-A Posting Lens document outlining the methodology for analy |
| 55 | 25/06/2026 09:08 | READY | production | v32026-0511-ai-ohkqf86t4-adrians-projects-9870cd22.vercel.app | c707498 | main | Add files via upload |
| 56 | 25/06/2026 09:07 | READY | production | v32026-0511-ai-ppoqp20yf-adrians-projects-9870cd22.vercel.app | 1780d84 | main | Add readme for AIOE crosswalk v3  Added a comprehensive readme for the AIOE crosswalk, detailing layers, usage |
| 57 | 25/06/2026 08:27 | READY | production | v32026-0511-ai-4fyzi68nk-adrians-projects-9870cd22.vercel.app | 6a4438d | main | polish(v3): refine SG jobs drawer (#215) |
| 58 | 24/06/2026 21:38 | READY | production | v32026-0511-ai-i6mttmfkh-adrians-projects-9870cd22.vercel.app | 6a4438d | main | polish(v3): refine SG jobs drawer (#215) |
| 59 | 24/06/2026 21:37 | READY | preview/null | v32026-0511-ai-a3ohuxe0n-adrians-projects-9870cd22.vercel.app | 3d7b2c2 | codex/v3-sg-jobs-drawer-polish | polish(v3): refine SG jobs drawer |
| 60 | 24/06/2026 21:30 | READY | production | v32026-0511-ai-nshg16l2z-adrians-projects-9870cd22.vercel.app | 46dafb7 | main | fix(v3): rank SG jobs by search match (#214) |
| 61 | 24/06/2026 21:29 | READY | preview/null | v32026-0511-ai-9wrsxpu1w-adrians-projects-9870cd22.vercel.app | 0b8380b | codex/v3-sg-jobs-transformation-drawer | fix(v3): rank SG jobs by search match |
| 62 | 24/06/2026 21:21 | READY | production | v32026-0511-ai-mtxrai809-adrians-projects-9870cd22.vercel.app | 8b7971b | main | fix(v3): preserve transformation notice after instant search (#213) |
| 63 | 24/06/2026 21:20 | READY | preview/null | v32026-0511-ai-atbyxsfpf-adrians-projects-9870cd22.vercel.app | d0f050a | codex/v3-function-notice-early-return | fix(v3): preserve transformation notice after instant search |
| 64 | 24/06/2026 21:18 | READY | production | v32026-0511-ai-ijs6ft1sx-adrians-projects-9870cd22.vercel.app | 37e0aa9 | main | fix(v3): flag transformation as function keyword (#212) |
| 65 | 24/06/2026 21:18 | READY | preview/null | v32026-0511-ai-rna6noifu-adrians-projects-9870cd22.vercel.app | f871471 | codex/v3-transformation-function-guard | fix(v3): flag transformation as function keyword |
| 66 | 24/06/2026 21:09 | READY | production | v32026-0511-ai-jan4vd0qu-adrians-projects-9870cd22.vercel.app | 6ee920b | main | feat(v3): add Gemini LLM fallback (#211) |
| 67 | 24/06/2026 21:08 | READY | preview/null | v32026-0511-ai-ko1njcg1p-adrians-projects-9870cd22.vercel.app | 5275c50 | codex/v3-gemini-fallback | feat(v3): add Gemini LLM fallback |
| 68 | 24/06/2026 21:03 | READY | production | v32026-0511-ai-pdt17mvo5-adrians-projects-9870cd22.vercel.app | 162924b | main | fix(v3): harden OpenAI prompt JSON parsing (#210) |
| 69 | 24/06/2026 20:33 | READY | production | v32026-0511-ai-58epte0uf-adrians-projects-9870cd22.vercel.app | 162924b | main | fix(v3): harden OpenAI prompt JSON parsing (#210) |
| 70 | 24/06/2026 20:32 | READY | preview/null | v32026-0511-ai-fcmpk338v-adrians-projects-9870cd22.vercel.app | 48c01f9 | codex/v3-openai-json-hardening | fix(v3): harden OpenAI prompt JSON parsing |
| 71 | 24/06/2026 20:19 | READY | production | v32026-0511-ai-1v1fn0ft5-adrians-projects-9870cd22.vercel.app | 5589179 | main | feat(v3): use OPENAI_API_KEY for AI proxy (v3.0.144) (#209) |
| 72 | 24/06/2026 20:19 | READY | preview/null | v32026-0511-ai-pmq6p1512-adrians-projects-9870cd22.vercel.app | d2dd2ff | codex/v3-openai-api-key | feat(v3): use OPENAI_API_KEY for AI proxy (v3.0.144) |
| 73 | 24/06/2026 20:08 | READY | production | v32026-0511-ai-kqdgrvc42-adrians-projects-9870cd22.vercel.app | 38f2fcf | main | feat(v3): make result shell centre-first with floating drawers (v3.0.143) (#208) |
| 74 | 24/06/2026 19:56 | READY | production | v32026-0511-ai-8og597ndi-adrians-projects-9870cd22.vercel.app | 38f2fcf | main | feat(v3): make result shell centre-first with floating drawers (v3.0.143) (#208) |
| 75 | 24/06/2026 19:56 | READY | preview/null | v32026-0511-ai-4xgldq4hp-adrians-projects-9870cd22.vercel.app | 14f2e8f | codex/v3-centre-first-drawers | feat(v3): make result shell centre-first with floating drawers (v3.0.143) |
| 76 | 24/06/2026 14:00 | READY | production | v32026-0511-ai-4gafjp0pd-adrians-projects-9870cd22.vercel.app | d09304a | main | feat(v3): add RIN shell and RoleGraph focus (v3.0.142) (#207) |
| 77 | 24/06/2026 13:46 | READY | preview/null | v32026-0511-ai-j7ilw661n-adrians-projects-9870cd22.vercel.app | e37742e | codex/v3-rin-shell-rolegraph | feat(v3): add RIN shell and RoleGraph focus (v3.0.142) |
| 78 | 23/06/2026 19:25 | READY | production | v32026-0511-ai-7t44lfjgb-adrians-projects-9870cd22.vercel.app | ae790a6 | main | fix(v3): merge the two Job ad FABs on the WikiGraph tab (v3.0.141) (#206)  Human Lead: "merge". The wiki tab h |
| 79 | 23/06/2026 19:24 | READY | preview/null | v32026-0511-ai-mz6zp7xt9-adrians-projects-9870cd22.vercel.app | fd1ab71 | claude/merge-jobad-fab | fix(v3): merge the two Job ad FABs on the WikiGraph tab (v3.0.141)  Human Lead: "merge". The wiki tab had two  |
| 80 | 23/06/2026 18:32 | READY | production | v32026-0511-ai-dyq2olqzc-adrians-projects-9870cd22.vercel.app | e6585d2 | main | feat(v3): WikiGraph "Job ad" FAB -> dissected job-ad drawer (v3.0.140) (#205)  Human Lead: "bottom Job ad FAB. |
| 81 | 23/06/2026 18:32 | READY | preview/null | v32026-0511-ai-fapci3djo-adrians-projects-9870cd22.vercel.app | 9d80cd9 | claude/wiki-dissect-drawer | feat(v3): WikiGraph "Job ad" FAB -> dissected job-ad drawer (v3.0.140)  Human Lead: "bottom Job ad FAB... open |
| 82 | 23/06/2026 13:56 | READY | production | v32026-0511-ai-mqy0krmtq-adrians-projects-9870cd22.vercel.app | f9c25f6 | main | feat(v3): docs-style 2-pane for the organisation perspective (AI-moments) (v3.0.139) (#204)  Human Lead: "the  |
| 83 | 23/06/2026 13:56 | READY | preview/null | v32026-0511-ai-m942t2fb5-adrians-projects-9870cd22.vercel.app | c40f61f | claude/org-2pane | feat(v3): docs-style 2-pane for the organisation perspective (AI-moments) (v3.0.139)  Human Lead: "the 3 panel |
| 84 | 23/06/2026 11:26 | READY | production | v32026-0511-ai-edvccy8x4-adrians-projects-9870cd22.vercel.app | 85dbfd4 | main | fix(v3): stop truncating AI-moments node labels at 80 chars (v3.0.138) (#203)  Follow-up to v3.0.137: live tap |
| 85 | 23/06/2026 11:26 | READY | preview/null | v32026-0511-ai-omstzhr9d-adrians-projects-9870cd22.vercel.app | c865255 | claude/kggraph-untruncate | fix(v3): stop truncating AI-moments node labels at 80 chars (v3.0.138)  Follow-up to v3.0.137: live tap-to-exp |
| 86 | 23/06/2026 11:20 | READY | production | v32026-0511-ai-3zogllh3l-adrians-projects-9870cd22.vercel.app | d8db3b4 | main | feat(v3): make the AI-moments graph readable - tap-to-expand + fewer modes (v3.0.137) (#202)  Human Lead: the  |
| 87 | 23/06/2026 11:20 | READY | preview/null | v32026-0511-ai-dtwx3dv45-adrians-projects-9870cd22.vercel.app | c34a30a | claude/kggraph-readable | feat(v3): make the AI-moments graph readable - tap-to-expand + fewer modes (v3.0.137)  Human Lead: the Lanes/N |
| 88 | 23/06/2026 10:51 | READY | production | v32026-0511-ai-ai7bi0kdi-adrians-projects-9870cd22.vercel.app | d83eecf | main | fix(v3): drop redundant careers.gov.sg panel on private/MCF employer results (v3.0.136) (#201)  Human Lead: "i |
| 89 | 23/06/2026 10:51 | READY | preview/null | v32026-0511-ai-ar8kixxu8-adrians-projects-9870cd22.vercel.app | ba90050 | claude/csg-declutter | fix(v3): drop redundant careers.gov.sg panel on private/MCF employer results (v3.0.136)  Human Lead: "if i sel |
| 90 | 23/06/2026 10:29 | READY | production | v32026-0511-ai-phmqo2y3v-adrians-projects-9870cd22.vercel.app | ae3105e | main | feat(v3): Career WikiGraph 3-pane shell - centre canvas + docked graph rail (v3.0.135) (#200)  Human Lead pick |
| 91 | 23/06/2026 10:29 | READY | preview/null | v32026-0511-ai-dcko9i8za-adrians-projects-9870cd22.vercel.app | 9cb9a5c | claude/wiki-3pane | feat(v3): Career WikiGraph 3-pane shell - centre canvas + docked graph rail (v3.0.135)  Human Lead picked 3 (" |
| 92 | 23/06/2026 10:12 | READY | production | v32026-0511-ai-qxixs0r4y-adrians-projects-9870cd22.vercel.app | 75d6799 | main | feat(v3): Career WikiGraph canvas centre - O-I-A as text card-board, slice 1 (v3.0.134) (#199)  Human Lead sen |
| 93 | 23/06/2026 10:12 | READY | preview/null | v32026-0511-ai-jc4ggx9yz-adrians-projects-9870cd22.vercel.app | df01d46 | claude/wiki-canvas-centre | feat(v3): Career WikiGraph canvas centre - O-I-A as text card-board, slice 1 (v3.0.134)  Human Lead sent the O |
| 94 | 23/06/2026 09:39 | READY | production | v32026-0511-ai-q0il0wvvd-adrians-projects-9870cd22.vercel.app | 1b39d1e | main | fix(v3): O-I-A theme-label gloss 404'd - wrong model id (v3.0.133) (#198)  fetchThemeGlosses used "claude-fabl |
| 95 | 23/06/2026 09:39 | READY | preview/null | v32026-0511-ai-8rz2foexq-adrians-projects-9870cd22.vercel.app | 577a3b7 | claude/oia-gloss-modelfix | fix(v3): O-I-A theme-label gloss 404'd - wrong model id (v3.0.133)  fetchThemeGlosses used "claude-fable-5", w |
| 96 | 23/06/2026 09:33 | READY | production | v32026-0511-ai-gw3aol58z-adrians-projects-9870cd22.vercel.app | 663fb3c | main | feat(v3): O-I-A polish - work-mode chip always-on + LLM theme-label gloss (v3.0.132) (#197)  Human Lead picked |
| 97 | 23/06/2026 09:33 | READY | preview/null | v32026-0511-ai-gt1vpdz82-adrians-projects-9870cd22.vercel.app | 59c4400 | claude/oia-polish | feat(v3): O-I-A polish - work-mode chip always-on + LLM theme-label gloss (v3.0.132)  Human Lead picked both:  |
| 98 | 23/06/2026 09:20 | READY | production | v32026-0511-ai-2lzxetmdm-adrians-projects-9870cd22.vercel.app | 88e4ccd | main | fix(v3): O-I-A themes blobbed into 2 - drop chaining union-find clustering (v3.0.131) (#196)  A live 16-duty R |
| 99 | 23/06/2026 09:20 | READY | preview/null | v32026-0511-ai-q2tdp9z41-adrians-projects-9870cd22.vercel.app | 860b713 | claude/oia-clustering-fix | fix(v3): O-I-A themes blobbed into 2 - drop chaining union-find clustering (v3.0.131)  A live 16-duty R&R coll |
| 100 | 23/06/2026 09:15 | READY | production | v32026-0511-ai-dau8vd2b0-adrians-projects-9870cd22.vercel.app | f1e1fbc | main | feat(v3): Career WikiGraph - O-I-A surgical cut of the job R&R (v3.0.130) (#195)  Human Lead: "the wikigraph s |

-----

## 16. Appendix C - Verification Commands

```sh
cd /Users/akla/Library/Mobile\ Documents/com~apple~CloudDocs/Downloads/Github/2026-0313_AI-JS/v3
npm run build
```

```sh
curl -sS -X POST https://v3.takearoundabout.com/api/mcf \
  -H 'content-type: application/json' \
  --data '{"action":"jobs","title":"transformation","limit":1}'
```

```sh
curl -sS -X POST https://v3.takearoundabout.com/api/careers \
  -H 'content-type: application/json' \
  --data '{"action":"jobs","title":"transformation","limit":1}'
```

```sh
curl -sS -X POST https://v3.takearoundabout.com/api/careers \
  -H 'content-type: application/json' \
  --data '{"action":"company","company":"LTA","limit":2}'
```

```sh
VERCEL_ORG_ID=team_OFr30y2R1lN3pAplr0JxgT7s \
VERCEL_PROJECT_ID=prj_SzPfZqqslzsCsAjbk8uusviFNE1T \
vercel --prod --yes
```

-----

## 17. Appendix D - Source Capture Limits

- PR data came from `gh pr list --state all --limit 100` and therefore covers the most recent 100 PRs visible to the authenticated GitHub CLI at generation time.
- Deployment data came from `vercel list v3_2026-0511-ai-js --format json` paged five times, 20 rows per page.
- V2.0.7 inheritance data came from the supplied `.docx` files in `/Users/akla/Library/Mobile Documents/com~apple~CloudDocs/Downloads/ESCO/Documents/01 AI Analyser`.
- Early product DNA came from `ia-jobskilla-analy-chat4-combined.docx` in `/Users/akla/Library/Mobile Documents/com~apple~CloudDocs/Downloads/ESCO/Documents/01 AI Analyser/Chat Handover`.
- Runtime logs were not exhaustively copied into this report.
- The report intentionally does not resolve every design disagreement from the long desktop chat; it gives Cloud Codex the historical map and the non-negotiable current contracts.
