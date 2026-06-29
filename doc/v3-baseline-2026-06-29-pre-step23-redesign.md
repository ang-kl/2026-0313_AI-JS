# v3 Baseline — pre step-2/step-3 redesign (2026-06-29)

**Purpose.** A clean snapshot + reference taken right before the planned redesign of
**Step 2 (browse postings)** and **Step 3 (analysis)**. If anything drifts, restore from
the anchors below. This is the source of truth for what v3 *is* today.

---

## 1. Current state

- **Version:** `v3.0.159` (this doc bumps to the next patch on commit).
- **Live (v3 project):** https://v3-ai-js.vercel.app  ← the real, current v3.
- **Codebase = the original pre-Codex app** (restored from `052b49b`). Single-file
  React app in `v3/src/App.jsx` (~15,260 lines) + `v3/src/RoleGraph.jsx`, `v3/src/wiki/*`.

### Domain caveat (important, unfixed by choice)
- **`takearoundabout.com` and `www` point to the *v2 project*** deployment
  (`v2_20260324_ai-jobskill-analyser-v2`), **not** the v3 project. So the custom domain
  does **not** show v3. The user chose not to re-point it (2026-06-29).
- To see v3, use **`v3-ai-js.vercel.app`**. Re-pointing the domain is a separate, deliberate
  step (Vercel: move `takearoundabout.com` to the v3 project / alias the v3 prod deployment).

---

## 2. Restore anchors (the reference)

| Anchor | What it is |
|---|---|
| **`052b49b`** (v3.0.150, 2026-06-25) | **Last commit before the Codex slim rewrite.** The canonical pre-Codex v3. |
| **PR #230** (v3.0.159) | Restored the full v3 to `052b49b` after the Codex episode. |
| **Vault bundle** | `~/v3-vault/v3-pre-step23-redesign-2026-06-29.bundle` (full history of `origin/main`). Restore with `git clone <bundle>`. |

**To restore the app to this baseline:** `git checkout 052b49b -- v3` (then bump version).

---

## 3. The Codex episode (what was added, then reverted — all recoverable)

Between **2026-06-27 ~16:59** and **2026-06-29**, a parallel "Codex" effort rewrote v3 into a
slim blueprint app and added features. It was **fully reverted** in PR #230 per the user.
Everything below is still in git history — cherry-pick any piece back if wanted:

| Work | PRs | Notes |
|---|---|---|
| Slim App.jsx rewrite (2,265 lines, blueprint-driven) | #223 | Replaced the full app; removed step 2/3 + graphs. |
| Telegram login gate + kill-switch | #225 | `middleware.js`, `api/auth.js`, `server/telegram-session.js`. ⚠ had security findings (fail-open gate, unauthenticated `seed`). |
| Live deterministic RoleGraph (sessionStorage handoff) | #226 | `?view=graph` LiveGraph from a selected posting. |
| Deep-chain RoleGraph view | #227 | Job ad → Role → SSOC → ISCO → ESCO → AIOE columns. |
| SSOC `classifyTitles` + official ISCO crosswalk | #228 | The good SSOC-resolution approach (see §6). |
| Mindmap tree view | #229 | markmap-style tree renderer. |
| Kanban planning board | (codex branch) | `v3/src/StrategyKanban.jsx`, `api/planning.js`. |
| SSOC 2024 data + service | (codex branch) | `engine-data/ssoc2024-*.json`, `api/ssoc.js`. |
| OpenAI/Gemini LLM proxy | #209–211 | `api/claude.js` switched off Anthropic. **Reverted → back to Anthropic** (note: Anthropic credits were exhausted earlier; verify the key before relying on LLM features). |

**Reusable ideas worth keeping for the redesign** (even though reverted):
- **SSOC `classifyTitles`** beats the old ILIKE `search` for title→occupation (resolves novel
  titles with a confidence band + full hierarchy; in-memory, no DB).
- **Official `ssoc2024-isco08` crosswalk** gives accurate ISCO/ILO titles (vs noisy ESCO
  fingerprint guesses).
- The **mindmap tree** and **deep-chain** renderers (in the #226–#229 commits).

---

## 4. Architecture map (the baseline you'll redesign on)

- **`v3/src/App.jsx`** — the whole app (single file). HDR journal/version history is the comment
  block at the top (≈ lines 1–1140).
- **`v3/src/RoleGraph.jsx`** — `?view=graph` role × AI-exposure graph (BakedGraph + KGGraph).
- **`v3/src/wiki/*`** — Career WikiGraph (radial/neural graph, canvas, journeys).
- **`v3/src/main.jsx`** — the `?view=` router (leap | graph | spherical | debug). **Frozen.**
- **`v3/api/*`** — serverless: `mcf.js`, `careers.js`, `claude.js`, `esco.js`, `engine.js`,
  `anatomy.js`, `datagov.js`, `alert.js`.
- **`v3/engine-data/*`** — `engine-core.js` (`computeEngine`: SSOC→ISCO→SOC→AIOE), SSOC/ISCO/SOC
  tables, baked `graph-data.json`.

### App flow + state (`function App` ~ line 12826)
- `searchMode` — `role` (ESCO) | `jobs` (MCF browse) | `company` (employer) | `wiki`.
- `freshGrad` — filter to < 4 yrs experience.
- `step` — `idle` → `searching` → `picking` → `results`. (`reset()` ~ line 13051.)
- `activeTab` — the Step-3 result tab (`skills`, `rolegraph`, `wikigraph`, `responsibilities`,
  `jobanatomy`, `rolemix`, …). Tab groups defined ~ line 7517.

### Step 2 — browse postings  (**`McfJobsPanel`** ~ line 11254)
- Live postings from MyCareersFuture **+** careers.gov.sg, rendered as **two responsive columns**
  (both sources fan out via `Promise.allSettled`; one failing never blanks the other).
- Per posting: **Analyse this posting** (→ Step 3), queue, open posting.
- `freshGrad` filter applies here. Employer path: **`CompanyPanel`** ~ line 12408.

### Step 3 — analysis  (**`RoleGraphPanel`** ~ line 10078, plus tabs)
- Driven by the deterministic-first pipeline: `getResponsibilities` (~4520) → `analyseRolePipeline`
  (~3060) → `buildKnowledgeGraph`/`getKnowledgeGraph` → tabs.
- Tabs include skills (AIOE per skill), RoleGraph (MCF→ESCO→ISCO-08), WikiGraph, responsibilities,
  job anatomy, role mix.

---

## 5. Contracts to keep when redesigning (non-negotiable)

- **Frozen door:** do not edit `api/mcf.js`, `api/claude.js`, `engine-data/*`, `src/main.jsx`,
  or the 6 frozen symbols (`searchOccupations`, `getSkills`, `getSkillsFromPosting`,
  `checkIscoCoherence`, `detectFunctionKeyword`, `lookupSeniorMgmt`). All new work is additive.
- **Non-inventive:** the engine authors every number/structure; the LLM only narrates. Withhold
  over invent. Provenance chip on every figure (mcf ● / computed ✓ / derived ◐ / ai ~ / unverified ?).
- **A11y:** no red/green (deuteranopia — encode state by shape/label/icon); 44px touch targets;
  SVG aria-labels; keyboard nav; "AI-assisted; human decides" + Source/Confidence/Time-window footer.
- **House R-rules:** ASCII-only JSX (R007 — use `String.fromCharCode`), no multiline async arrow in
  JSX props (R006). Every PR bumps the flat version `v3.0.<N>` + HDR journal block + index.html +
  package.json/lock.

---

## 6. The SSOC / ESCO / AIOE chain (reference for the redesign)

```
job title → SSOC 2024 (SingStat) → ISCO-08 (ILO) → SOC (US BLS) → AIOE (AI exposure)
                                 ↘ ESCO skills (EU)
```
- **SSOC** = Singapore occupation standard; the anchor that turns a title into a code.
- **ESCO** = skills (SSOC has none); also a 2nd-opinion occupation via skill fingerprint.
- **ISCO-08** = the common join key both map to. `computeEngine.reconcile` flags SSOC-vs-ESCO
  `agree` / `conflict` (skill evidence wins on conflict, confidence demoted) — they don't conflict
  when each is given its lane (SSOC→occupation, ESCO→skills).
- Best title→SSOC matcher = `api/ssoc.js` **`classifyTitles`** (not `search`). Official ISCO via the
  `ssoc2024-isco08` correspondence.

---

## 7. How to restore this baseline later

```bash
# from the repo
git checkout 052b49b -- v3          # restore the app to this baseline
# OR from the vault bundle
git clone ~/v3-vault/v3-pre-step23-redesign-2026-06-29.bundle restored-v3
```
