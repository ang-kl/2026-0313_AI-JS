# SG Career View v3 — "Wire the Engine" design spec (deterministic AIOE, steps 1–3)

> Status: design approved 2026-06-08. Next: staged implementation plan (PR0 → PR1 → PR2).
> Governs the move from **LLM-guessed** AI-exposure to **deterministic, citable** AI-exposure.

## North-star alignment (the locked contract)

- **Deterministic = control.** Every exposure number, occupation, ranking, % is computed from real data (AIOE / ESCO / ISCO / SSOC). Reproducible: same input → same output.
- **LLM = advisory only.** After this work the LLM may *narrate/explain* the engine's output but has **no write-access** to any number/verdict. If LLM and engine disagree, the engine wins.
- **Non-inventive.** No fabricated facts. Every output carries `source` + `confidence`; `[UNVERIFIED]` over a guess. If a data link can't be verified, the number is **withheld**, never faked.
- **Faithful fidelity.** Show findings at true magnitude (e.g. a crosswalk range stays a range, not a fake point value).

This replaces the v2-era pattern (Sonnet rating skills = LLM influencing the result), which the v3 contract requires fixing.

## Decisions (locked in brainstorming, 2026-06-08)

1. **Exposure source = AIOE occupation-level** (Felten–Raj–Seamans, *AI Occupational Exposure*). Citable, fixes the headline number. Per-skill granularity is a later epic (needs a per-skill source).
2. **Occupation resolution = reconcile engine** — SSOC prior + skill-fingerprint with a **coherence flag**; on conflict, prefer the skill evidence (MCF's SSOC tag can be mis-coded). Reuses the validated `SG-v3-engine-step3` prototype.
3. **Scope = steps 1–3 deterministic** — (1) resolve occupation, (2) AIOE exposure index, (3) mirror-roles-by-%. LLM narration only. Staged into PRs.
4. **Engine home = a new `v3/api/engine.js`** serverless endpoint — isolated deterministic control, bundles the data tables, reuses `esco.js`.

## ⚠️ Hard dependency / risk — the data tables (PR0 is a gate)

The whole feature is non-inventive **only** if it runs on real published data, bundled as verified JSON:

| Table | Source | Keyed by | Risk |
|---|---|---|---|
| **AIOE scores** | Felten, Raj & Seamans (publicly released AIOE dataset) | O\*NET-SOC occupation | obtainable; verify the exact measure + version cited |
| **SSOC ↔ ISCO-08** | SingStat official SSOC correspondence | SSOC ↔ ISCO | official; watch SSOC vintage (2020/2024) |
| **ISCO-08 ↔ SOC** | official ISCO↔SOC crosswalk (BLS/Census) | ISCO ↔ SOC | **many-to-many** — carry a range, not a point |

**Gate rule:** PR0 sources, verifies, and bundles all three with a provenance note (URL + retrieval date + the exact field used). **If any table can't be verified, stop and report it** — the affected number is then withheld/`[UNVERIFIED]`, and scope is revisited. Do not synthesize values to fill a gap.

## Architecture

```
posting (MCF) ─┐
               ▼
        v3/api/engine.js   (deterministic, NO LLM)
        ├─ bundled JSON: AIOE, SSOC↔ISCO, ISCO↔SOC
        ├─ reuses esco.js helpers (occupationFingerprint, skill lookup)
        └─ returns { occupation, exposure, mirrorRoles, provenance }
               ▼
        App.jsx renders computed fields with ✓ computed chips
        /api/claude  →  narration only (~ AI estimate), no numbers
```

## Engine compute (steps 1–3)

1. **Resolve occupation** — `reconcile(ssocPrior, skillFingerprint)`:
   - `ssocPrior`: SSOC → ISCO (via SingStat table, not raw truncation).
   - `skillFingerprint`: posting skills → covering ISCO occupations (ESCO essential-skill overlap; existing `occupationFingerprint`).
   - **coherence**: `agree` if the SSOC ISCO appears among fingerprint ISCOs, else `conflict` (prefer skill evidence; surface both).
2. **AIOE lookup** — resolved ISCO → SOC (crosswalk) → AIOE score ⇒ **AI-Exposure Index**. Carry the crosswalk path and, if SOC is many-to-many, the **min–max range** + the chosen aggregate (documented rule, e.g. employment-weighted mean if available, else simple mean).
3. **Mirror-roles by %** — the fingerprint occupation blend (top-N ISCO with shares) + each one's AIOE ⇒ "other roles sharing this exposure." Reuses `scoreIscoCandidates`.

Every field carries `source` + `confidence` (+ `[UNVERIFIED]` where a link is unverified).

## Output contract (`engine` object)

```json
{
  "occupation": {
    "isco": "1330", "label": "ICT service managers", "soc": ["11-3021"],
    "via": "reconcile", "coherence": "agree|conflict",
    "ssocTag": "13302", "fingerprintIscos": ["1330","1219"]
  },
  "exposure": {
    "index": 0.61, "band": "high|moderate|low",
    "range": [0.55, 0.66],
    "source": "AIOE (Felten et al.)", "crosswalk": ["SSOC→ISCO→SOC"],
    "confidence": "high|medium|low"
  },
  "mirrorRoles": [
    { "isco": "1219", "label": "...", "sharePct": 28, "exposureIndex": 0.49 }
  ],
  "provenance": { "aioe": {...}, "ssocIsco": {...}, "iscoSoc": {...} },
  "version": "engine-1"
}
```

## App.jsx wiring

- **New primary headline:** `AI-Exposure Index  X/100  ✓ computed (AIOE)` — replaces the LLM "N of M skills" as the lead. The LLM skill-count is **demoted** to a secondary `~ AI estimate` line.
- **Coherence flag** surfaced: on conflict, "MyCareersFuture's SSOC tag (X) doesn't match the skill evidence (Y) — using skill evidence; treat the code with caution."
- **Mirror-roles** panel: computed shares + each role's AIOE, all `✓ computed`.
- Phase-2 `Prov` chips throughout (`✓ computed` / `● from MCF`). LLM narration card stays, labelled `~ AI estimate`.

## Error handling / honesty

- **Missing/unverified data** → withhold the number, show why (never fake).
- **Reconcile conflict** → show both, prefer skills, flag.
- **Engine failure** → fall back to the existing LLM view, clearly tagged `~ AI estimate` (no computed-looking fake number).
- **Crosswalk ambiguity** → show the range, not a single fabricated point.

## Staging (small PRs)

- **PR0 — data (gate).** Source + verify + bundle AIOE, SSOC↔ISCO, ISCO↔SOC as JSON; provenance doc. Stop+report if any table is unverifiable.
- **PR1 — engine + headline.** `v3/api/engine.js` (reconcile + AIOE) → computed AI-Exposure Index wired as the headline; LLM number demoted.
- **PR2 — mirror-roles + coherence.** Surface the % blend and the coherence flag.
- Each PR: version bump + journal (HDR) + live verify on v3.takearoundabout.com.

## Testing / verification

- **Unit/snapshot** the engine on real postings (Metta Transformation Mgr + the PSD and NHG samples): assert `coherence` (agree/conflict), the AIOE index/range, and mirror shares. Determinism: same input → identical output (snapshot).
- **Live verify** each PR on the deployed surface (desktop + mobile), confirm `✓ computed` chips and no fabricated numbers.

## Out of scope (explicit)

- **Per-skill / per-duty deterministic exposure** (the full "which skills survive AI" core) — needs a per-skill source (O\*NET task-level / composite); a later epic. Until then, per-skill levels remain `~ AI estimate`.
- Qualification test, org-proof grounding, forecast (steps 4–7) — future.

## Open items to resolve in PR0

- Exact AIOE measure + release to cite (and license for redistribution/bundling).
- SSOC vintage (2020 vs 2024) and the matching ISCO mapping.
- ISCO↔SOC aggregate rule when many-to-many (employment-weighted vs simple mean) — pick one, document it.
