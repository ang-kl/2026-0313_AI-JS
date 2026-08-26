# SG Career View v3

The v3 codebase behind [v3.takearoundabout.com](https://v3.takearoundabout.com). This document is written for a future contributor or AI coding agent picking the project up cold.

## Purpose

v3 is a **reviewable work-intelligence system** for Singapore job advertisements. It treats a job ad as a manuscript under review, keeps every figure traceable to a source, and refuses to smooth uncertainty into confidence.

It is **not** an ATS-gaming tool. It is not a resume optimiser. It is not an oracle for a candidate's value. It is a lens for reading job ads more carefully.

## Trust loop

Every meaningful figure on the result page follows one path:

```
source evidence → deterministic computation → provenance label → confidence / withhold → human action
```

- **Source evidence** is verbatim posting text, live MyCareersFuture / careers.gov.sg data, or a public SingStat / ILO taxonomy row. It is never fabricated.
- **Deterministic computation** is the engine (`v3/engine-data/`) — SSOC 2024 → ISCO-08 → AIOE lookups, band mapping, classification. No LLM authors a number.
- **Provenance label** is a chip on every claim: `from posting`, `from MCF`, `computed`, `derived`, `AI estimate`, `unverified`.
- **Confidence / withhold** is a visible state. When evidence is thin, the surface withholds instead of guessing.
- **Human action** is what the UI hands back. Copy is information-for-choice, not verdict.

Every footer carries the standing line: **"AI-assisted; human decides."**

## Product surfaces

Three steps in the current flow:

### Step 1 — Search
File: `src/App.jsx` (landing card + mode toggle + SSOC / ESCO typeahead).

Four modes: Analyse role (ESCO taxonomy search), Browse SG jobs (SSOC-anchored MCF + careers.gov.sg posting search), Search by employer (company + optional SSOC filter), Career WikiGraph.

### Step 2 — Posting Evidence Picker
File: `src/App.jsx` (`PostingEvidencePicker`).

Fetches live postings, classifies each via `/api/ssoc action:"classifyTitles"`, and presents them in a two-source grid with SSOC-family facets, an AI-exposure donut, top-5 SSOC family bar, and a live "curating evidence" progress banner. Withheld classifications are surfaced honestly, not hidden.

### Step 3 — Review Studio
File: `src/ReviewStudio.jsx`.

A reviewable workspace built around the picked posting: manuscript pane with per-duty exposure highlights, O-I-A (Observation → Interpretation → Application) dissection, rule-based persona reviewer comments in the right margin, provenance and confidence chips throughout, live Role Graph in the right pane. The Overview tab opens with a **Pre-interview brief** card (PB1) — a collapsible, assembly-only join of the SSOC classification, MCF posting facts and the employer's ACRA/SSIC record; every row is a pass-through of a value computed elsewhere, never authored fresh.

**Status is partial** — see the reconciliation audit at [`script/v3-step3-blueprint-reconciliation.md`](./script/v3-step3-blueprint-reconciliation.md) for feature-by-feature MATCH / PARTIAL / IMPROVISED / UNBUILT verdicts.

## Architecture

- **Frontend**: React 18 + Vite. Single-file entry at `src/main.jsx`; the app itself lives in `src/App.jsx` with feature components split into `ReviewStudio.jsx`, `RoleGraph.jsx`, `LeapView.jsx`, `SphericalGallery.jsx`, `AmbientBackdrop.jsx`, `DebugPanel.jsx`.
- **API routes** (Vercel serverless functions under `api/`): see the endpoint list below.
- **Deterministic engine** (`engine-data/`): SSOC 2024 hierarchy, SSOC ↔ ISCO-08 correspondence, AIOE index, ISCO ↔ US SOC mapping, skill-level data, provenance registry. All static or DB-backed with in-memory fallback. No LLM path.
- **Blueprints** (`goal/`): `v3-blueprint.md`, `v3-ui-blueprint.md`, the AI Stewardship research paper.
- **Specs** (`script/`): fifteen spec slices plus the Step 3 reconciliation audit.
- **Agents** (`agents/`): four **build/review-time** agents — `spec-author`, `result-engine-builder`, `conformance-auditor`, `a11y-honesty-reviewer`. None fire at runtime.

## Data sources

- **MyCareersFuture** — live posting API (`api/mcf.js`).
- **careers.gov.sg** — MIT-licensed dump via opengovsg (`api/careers.js`).
- **SingStat SSOC 2024** — occupation taxonomy (`engine-data/ssoc2024-*.json`, served via `api/ssoc.js`).
- **ILO ISCO-08** — international occupational classification (`engine-data/ssoc2024-isco08-correspondence.json`, `ssoc2024-isco.js`).
- **AIOE** (AI Occupational Exposure) — deterministic index used to map ISCO-08 → exposure band (`engine-data/aioe.js`, `engine-data/isco-soc.js`).
- **SSIC 2020** — Singapore standard industrial classification (`engine-data/ssic2020-index.json`, `api/ssic.js`).
- **data.gov.sg** — proxied at `api/datagov.js`.
- **ESCO v1.2** — European skill taxonomy, used for role analysis (`api/esco.js`).

## Local development

```bash
# From v3/
npm install
npm run dev     # Vite dev server
npm run build   # production build → dist/
npm run preview # serve dist/
```

Node 22.x. See `v3/package.json`.

## Environment variables

The LLM proxy (`api/claude.js`) can dispatch to Anthropic, OpenAI, or Google Gemini depending on which key is present. The engine paths do not require any of them.

- `CLAUDE_API_KEY` — enables Claude routing (primary/default provider). Optional `ANTHROPIC_MODEL` pins a specific model id; otherwise every call resolves to `claude-sonnet-5`.
- `OPENAI_API_KEY` — enables OpenAI routing.
- `OPENAI_MODEL`, `OPENAI_MODEL_STRONG`, `OPENAI_MODEL_FAST` — model overrides.
- `GEMINI_API_KEY`, `GEMINI_MODEL` — enables Gemini routing.
- `POSTGRES_URL` (and `@vercel/postgres` variants) — enables the DB path for `api/ssoc.js`. The in-memory fallback is deterministic and offline-safe.
- `MAPBOX_TOKEN` — used by `api/geocode.js` where relevant.

Every LLM path is narration-only. If the LLM call fails, the engine result still renders.

## API endpoints

All under `v3/api/`, invoked as `/api/<name>` POST unless noted:

- `alert.js` — feedback / issue capture.
- `anatomy.js` — job-anatomy classifier; deterministic duty layers (Activity / Coordination / Accountability / Relational / Judgment).
- `careers.js` — careers.gov.sg posting search (opengovsg dump).
- `claude.js` — LLM proxy with Anthropic / OpenAI / Gemini fallback. Narration only.
- `datagov.js` — data.gov.sg passthrough.
- `engine.js` — engine wrapper exposing `computeEngine(ssoc, title)` → AIOE band + provenance.
- `esco.js` — ESCO v1.2 search + skill lookup.
- `geocode.js` — location resolution.
- `mcf.js` — MyCareersFuture posting search and per-employer poll.
- `ssic.js` — SSIC 2020 lookup / classify.
- `ssoc.js` — SSOC 2024 search + `classifyTitles` batch classifier. DB path with in-memory fallback.

## Verification flow

Before merging a v3 change, an ideal PR runs:

1. **Build** — `npm run build` from `v3/`. **Shipped.**
2. **Freeze guard / frozen-door check** — asserts no protected file was touched. *Manual today; no script wired.*
3. **Conformance audit (D1–D8, G1–G8)** — no LLM-authored numbers, provenance chip on every figure, withhold-over-fabricate, range-over-point, snapshot determinism. Owned by the `conformance-auditor` agent at `agents/conformance-auditor.md`. *Runs at build/review time; not yet enforced as CI.*
4. **A11y + honesty audit** — no red/green dependence, 44px touch targets, `aria-label` on SVG, `Source · Confidence · Time-window` footer, "AI-assisted; human decides" line. Owned by the `a11y-honesty-reviewer` agent at `agents/a11y-honesty-reviewer.md`. *Runs at review time; not yet enforced as CI.*
5. **Snapshot fixtures** — `script/r-snapshot.golden.json` is the deterministic fixture. Same input, same output. *Manual today.*

If a step cannot be run, mark it `not run` in the PR report. Do not claim a check that did not run.

## Governance rules

Adopted from `script/trust-loop-first.instructions.md`:

1. **No new large lens.** No new analytical lens, graph mode, product surface, fairness theory, scoring model, or persona family until the trust loop is verifiable.
2. **Withhold over guess.** Thin, unclear, or unverifiable evidence must render as withheld or `unverified`, never smoothed into confidence.
3. **Engine computes, LLM narrates.** No LLM-authored number reaches the result page. If LLM and engine conflict, engine wins.
4. **Every claim needs provenance.** Use the existing vocabulary: `from posting`, `from MCF`, `computed`, `derived`, `AI estimate`, `unverified`, `withheld`.
5. **Human decides.** No verdict copy on someone's career, hiring outcome, legal position, or worth. Information-for-choice only.
6. **Accessibility and honesty stay linked.** Colour is never the sole signal. 44px touch targets. Source · Confidence · Time-window footer where relevant.
7. **Documentation matches current behaviour.** Distinguish `shipped` / `partial` / `manual` / `planned` / `parked` / `not in scope`. Do not document aspirational behaviour as if it already exists.
8. **Small PRs only.** One concern per PR.

## Restraint gate

Before proposing another lens, another visual, or another persona family, the trust loop must first be **simple enough to verify by three audiences** (per `script/trust-loop-first.instructions.md`):

1. A normal user can see why the product said something.
2. A future contributor can understand the architecture from this file alone.
3. A build/review agent can run a clear verification path before merge.

Until those three read as `PASS`, the next contribution is documentation, verification, canonisation of what exists — **not** expansion.
