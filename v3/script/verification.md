# v3 Verification Path

The single entry point for verifying a v3 change before merge. Owned by the trust-loop-first arc (PR 2). Any figure on the result page must survive this path unchanged, or the delta must be explained in the PR's `[HDR] [DELTA]` block.

**Rule:** if a step cannot be run, mark it `not run` in your PR report. Do **not** claim `PASS` for a check that did not run.

## Quick check — five commands

From `v3/`:

```bash
npm install              # once
npm run verify           # runs verify:build + verify:snapshot in one shot
```

`npm run verify` chains the two real, wired checks below. The other three (freeze, conformance, a11y-honesty) are agent-invocations documented under **Manual + agent-driven** — they cannot be safely automated as shell scripts today.

## Wired checks

### 1. Build — `npm run verify:build` — **shipped**

Runs `vite build`. Fails on any parse / import / bundle error.

- **Owner:** Vite.
- **When to run:** every PR that touches `v3/src/**` or `v3/api/**`.
- **PR report field:** `Build: PASS / FAIL`.

### 2. Snapshot — `npm run verify:snapshot` — **shipped**

Runs `node script/verify-snapshot.mjs`. For each fixture committed to `script/r-snapshot.golden.json`:

- **Determinism check** — `computeEngine(input)` called twice; the two outputs must be byte-identical.
- **Golden check** — the engine's output must match every pinned field in the fixture (`index`, `zMean`, `zRange`, `via`, `confidence`, `version`, `isco`, and where present `topShare` + `label`).

A changed snapshot is not a script failure — it is a real engine change. If the drift is intended, update `script/r-snapshot.golden.json` in the same PR and explain the delta in the `[HDR] [DELTA]` block. Otherwise, revert.

- **Owner:** `engine-data/engine-core.js`, `script/r-snapshot.golden.json`, `script/verify-snapshot.mjs`.
- **When to run:** every PR that touches `v3/engine-data/**`, `v3/api/engine.js`, `v3/api/ssoc.js`, `v3/api/anatomy.js`, or any table under `v3/engine-data/`.
- **Recipe source:** `R-SNAPSHOT` in `script/v3-result-engine.recipes.md`.
- **PR report field:** `Snapshot fixtures: PASS / FAIL`.

## Manual + agent-driven checks

The next three checks describe **when** to run them and **which agent contract** to invoke. They are not wired as `npm run …` because the underlying operation is prompt-driven, not a shell script. Every one of them can be automated later — but only after the underlying inputs (frozen-symbol table for freeze; live NHG/PSD/Metta reads for conformance; a fresh preview URL for a11y) are captured deterministically. Do not fake them.

### 3. Freeze guard — **manual** — recipe `R-FREEZE`

Asserts the "landing + search" surfaces did not move. The frozen symbol set is defined per PR; the audit-corrected recipe is in `script/v3-result-engine.recipes.md` under `R-FREEZE`.

- **When to run:** every PR that touches `v3/src/App.jsx`, `v3/src/main.jsx`, `v3/src/RoleGraph.jsx`, or any component the frozen door pins.
- **How today:** copy the audit-corrected shell block from `R-FREEZE`, run it against the diff. `FROZEN OK` on all pinned symbols → PASS; any `BLOCK: <symbol>` → FAIL.
- **PR report field:** `Freeze guard: PASS / FAIL / not run`.
- **Automate later:** once the frozen symbol table is committed to a real file (e.g. `script/frozen-symbols.json`), turn this into `npm run verify:freeze`.

### 4. Conformance audit (D1–D8, G1–G8) — **agent** — recipe `R-AUDIT`

Owned by the `conformance-auditor` agent at `agents/conformance-auditor.md`. Two passes:

- **D1–D8** (static, on prompt templates): confirms no LLM prompt can author a number that reaches the result page; every JSON output is shape-locked; no invention licence.
- **G1–G8** (dynamic, on a live read): Prov chip on every figure; headline is `✓ computed`; no LLM string parsed to a number; withhold-over-fabricate; range-over-point; snapshot determinism.

- **When to run:** every PR that changes any result-page figure, prompt, or classification path — **before the version bump**.
- **How today:** invoke the `conformance-auditor` agent per the `R-AUDIT` prompt skeleton in `script/v3-result-engine.recipes.md`. Attach the PASS report to the PR.
- **PR report field:** `Conformance audit: PASS / FAIL / not run`.
- **Automate later:** the D-pass can eventually run as a static analysis over `v3/api/**` prompt strings. The G-pass needs a live read and stays agent-driven for now.

### 5. A11y + honesty audit — **agent**

Owned by the `a11y-honesty-reviewer` agent at `agents/a11y-honesty-reviewer.md`. Checks:

- No red/green anywhere; state doubled with shape/label/text.
- Every interactive element ≥ 44×44 px.
- `aria-label` on every SVG.
- Focus ring visible; keyboard-reachable.
- Every artifact footer carries **"AI-assisted; human decides"** + `Source · Confidence · Time-window`.
- Voice: information-for-choice, not verdict.

- **When to run:** every PR that changes a result-page component, panel, or footer.
- **How today:** invoke the `a11y-honesty-reviewer` agent against the Vercel preview URL for the PR. Attach the PASS report.
- **PR report field:** `A11y/honesty audit: PASS / FAIL / not run`.
- **Automate later:** an axe-core or pa11y-based check can catch the mechanical gates (touch target, aria-label, focus). The honesty voice-check stays agent-driven.

## PR report format

Every PR should append the block below (or the fuller version in `script/trust-loop-first.instructions.md` §7). Mark each row honestly.

```markdown
## Verification
- Build: PASS / FAIL / not run
- Snapshot fixtures: PASS / FAIL / not run
- Freeze guard: PASS / FAIL / not run
- Conformance audit: PASS / FAIL / not run
- A11y/honesty audit: PASS / FAIL / not run
```

Do not claim a check passed if it was not run. Say `not run` plainly. `not run` is not a failure — it is a truthful statement about the audit surface.

## What this document is not

- Not a substitute for the recipes in `script/v3-result-engine.recipes.md`. Those are the source of truth for the prompts; this file is the entry point for **when** and **how** each recipe fires.
- Not a substitute for the agent contracts in `agents/*.md`. Those are the source of truth for **what** each agent audits; this file is the map that tells a PR author which agent to invoke.
- Not a mandate that every PR runs every check. A docs-only PR should mark every result-page check `not run` and move on — that is truthful.
