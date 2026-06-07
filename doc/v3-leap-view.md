# SG Career View v3 — the Leap View (`?view=leap`)

> **Status:** shipped & live — v3.0.1 (feature), v3.0.2 (responsive) — at
> <https://v3.takearoundabout.com/?view=leap>
> **Data spine:** MyCareersFuture (MCF). **Non-inventive:** job fields are verbatim;
> the forces drawn around them are tagged by confidence, never asserted as fact.

---

## What it is

The Leap View is a candidate-side, one-screen **stakeholder web** for a single MCF job
posting — *"behind the corner of the advert."* The advert sits at the centre (**THE JOB**);
around it sit the parties and pressures that actually shaped it.

It is the **inverse of an ATS**: an ATS filters people *for employers* and floods the worker;
this reveals the forces *to the worker* and subtracts noise. It answers "who shaped this advert,
and what is really being asked?" — not "does this candidate pass."

## How to reach it

- URL: `https://v3.takearoundabout.com/?view=leap`
- On load it pulls a live sample posting (Metta Welfare *"Transformation Manager (Strategic
  Planning & Change Management)"*, uuid `2320493d…`).
- Paste **any** MCF job link or UUID, then **Load job**, to analyse another role.

## The web — centre, ring, flows

**Centre — THE JOB.** Title, employer, salary band, seniority, experience bar. The
"Advert → Real" toggle switches the framing from the advert to the real role.

**Ring — six stakeholders.** Each node is a party; each arrow is a pressure that party puts on
the job. Every node carries a **source tag**: `given` (a general SG hiring fact), `derived`
(computed from this posting's own fields), or `inferred` (a rough live-market estimate).

| Node | Represents | Flow | Source | What it shows |
|---|---|---|---|---|
| **Director** | budget + narrative | budget/inflation | `derived` | seniority & band; flags title-vs-experience **inflation** (senior title + ≤3 yrs bar) |
| **HR** | writes the JD | compliance | `given` | Fair Consideration Framework — advertise ≥14 days; posting age |
| **ATS** | keyword filter | distortion | `given` | the literal tag list; mirror the exact words to pass it (it can't read real work) |
| **Skeptic** | demand check | compliance | `inferred` | ≈N similar live postings (rough sample) → thin / moderate / healthy market |
| **Hiring Mgr** | the real job | genuine fit | `derived` | the real duties pulled from the posting's description |
| **You** | the candidate | genuine fit | `derived` | paste a CV → proof vs gap on the job's tags |

**Flows (colour-blind safe — no red/green):**

- budget / inflation — magenta `#d6409f`
- compliance — blue `#1668c7`
- distortion — orange `#e8810c`
- genuine fit — cyan `#0aa2c0`

## Controls

- **👤 CV overlay** — paste CV text; the *You* link lights **proof vs gap** tags (rough keyword
  overlap, both listed in the panel).
- **🫥 Advert → Real** — spotlights the distorting forces (ATS, title inflation) and your fit, and
  dims the rest. Distortion edges are drawn **dashed**.
- **🏷 Labels** — show the one-line take on every edge at once.
- Tap **THE JOB** or any node → an evidence panel with the field and its source tag.

## Data path

- **Frontend:** `v3/src/LeapView.jsx`, routed by `?view=leap` in `v3/src/main.jsx`
  (`params.get('view') === 'leap'`).
- **Backend:** `v3/api/mcf.js` `action:"job"` — fetches ONE posting by uuid
  (`fetchJobDetail` → `normaliseJob`) plus a rough live-demand proxy
  (`mcfSearch("\"title\"")`, capped at 30). Best-effort: on failure it returns a *warm-empty*
  payload (never a hard error), mirroring the rest of the handler.

Request shape:

```http
POST /api/mcf
{ "action": "job", "uuid": "2320493d0e875075d4dbfa6a893b3fdb" }
→ { "job": { …verbatim MCF fields… }, "demand": 1, "source": "MyCareersFuture Singapore" }
```

## Non-inventive contract

Aligned with the v3 locked contract (see [`v3-research-grounded-model.md`](./v3-research-grounded-model.md)):

- **Job fields are verbatim** from MCF (title, employer, salary, levels, years, skills, description).
- **Forces are tagged, not asserted** — `given` / `derived` / `inferred`. The panel footer states:
  *"Job fields verbatim from MyCareersFuture; flows are derived analysis (tagged). Demand is a rough sample."*
- **No fabricated numbers.** Demand is an honest small-sample count; CV overlap is explicitly a
  *rough keyword overlap*, not a score. The engine (not an LLM) produces every value shown.

## Responsive & accessibility

- **Desktop (≥760px):** graph and side panel in a row.
- **Phone (<760px):** column — fixed-height graph on top (`min(58dvh, 480px)`), panel scrolls below.
- **44px** touch targets (buttons + input); blue/orange/cyan palette (no red/green); the SVG carries
  an `aria-label`; nodes are keyboard-focusable (Tab + Enter).

## Honest limitations

- **Demand proxy is weak for hyper-specific titles.** A quoted title that includes a location
  (e.g. *"… - Simei"*) may match only itself → "≈1". It is a sample, not a census.
- **CV overlap is keyword-level, not semantic** — a starting signal, not a match score.
- **Director / Hiring-Mgr / You takes are derived** from posting fields. The deterministic
  ESCO→skill / ISCO→occupation / AI-exposure engine (the locked 7-step pipeline) is **not yet wired
  into this view** — today it visualises the *forces* around a posting, not the
  skills-survive-AI analysis. That is the next build.

## Files

| File | Role |
|---|---|
| `v3/src/LeapView.jsx` | the view (new in v3.0.1; responsive in v3.0.2) |
| `v3/src/main.jsx` | `?view=leap` route |
| `v3/api/mcf.js` | `action:"job"` endpoint |

## Deploy

Git-connected. A push/merge to `main` of `ang-kl/2026-0313_AI-JS` auto-builds the Vercel project
**`2026-0511-ai-js`** (framework Vite, **rootDirectory `v3/`**) → **v3.takearoundabout.com**.
This is **not** `vercel --prod` — there is no `2026-0511-ai-js` folder; that is the *project name*,
and the build source is this repo's `v3/`. (The same push also rebuilds the v2 project from the repo
root; a v3-only change leaves v2's output identical.)

## Version history

| Version | Date | Serial | Change |
|---|---|---|---|
| v3.0.1 | 2026-06-07 | HDR #038 | Leap view shipped (`LeapView.jsx`, `?view=leap`, `/api/mcf action:"job"`). |
| v3.0.2 | 2026-06-07 | HDR #039 | Responsive mobile fix — column layout, fixed-height graph, 44px targets. |
| v3.0.3 | 2026-06-07 | HDR #040 | This reference doc. |
