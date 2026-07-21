# Phase 0 findings — data acquisition gate

**Date:** 2026-07-21 · **Outcome: BLOCKED in this environment. Gate not passed.**

## What was probed

| Source | Endpoint | Result |
|---|---|---|
| ESCO REST API (occupation→skill relations) | `https://ec.europa.eu/esco/api/search?...` | **403** — CONNECT tunnel rejected by egress proxy |
| MyCareersFuture API (skill co-occurrence) | `https://api.mycareersfuture.gov.sg/v2/jobs/search` | **403** — CONNECT tunnel rejected by egress proxy |

Evidence: the agent proxy's `__agentproxy/status` recorded
`connect_rejected … "gateway answered 403 to CONNECT (policy denial)" host: ec.europa.eu:443`.
The proxy's `noProxy` allowlist covers only package registries (npm, pypi, crates, …) and
Anthropic. `/root/.ccr/README.md` is explicit: *"The destination host is not allowed by your
organization's egress policy for this session. Do not retry or route around it — report the
blocked host."* — so neither harvest was attempted further.

## Why this is a gate, not a failure of the plan

The substrate's whole value is the **independent signal** — ESCO's occupation→skill relations
and live MCF skill co-occurrence — precisely the data that lives behind these two hosts. The
in-repo assets (SSOC hierarchy, SSOC→ISCO crosswalk, one role's baked `src/graph-data.json`)
give occupation **text + structure** but none of the occupation↔skill edges. Building on those
alone would repeat the first probe's "no lift" result by construction.

Note: the app's own `api/esco.js` and `api/mcf.js` proxies reach these hosts fine **in
production (Vercel)** — the block is specific to this sandbox's egress policy, not to the data.

## Re-scope — three ways to unblock (Human Lead's call)

1. **Widen the environment network policy** to allow `ec.europa.eu` and
   `api.mycareersfuture.gov.sg`, then re-run Phase 0 here directly (testable, cleanest). The
   policy is set at environment creation — see the remote-execution docs.
2. **Harvest externally**: run the acquisition from a networked machine (or a one-off Vercel
   function reusing the existing `api/esco.js` / `api/mcf.js` logic) and commit the raw
   `data/` tables back. Phases 1–2 then run fully offline on the committed data.
3. **ESCO bulk download**: a Human Lead downloads the ESCO classification CSV package
   (occupations / skills / occupationSkillRelations, CC-BY) once and drops it into `data/`;
   MCF co-occurrence still needs path 1 or 2.

Until one of these lands, Phases 1–3 stay blocked on data. Nothing was routed around the
policy.

## Tooling ready (for path 1 or 2)

Two harvesters are committed so whichever unblock path you pick just runs them:

- `harvest_esco.py` — walks the 1,006 SSOC 2024 leaf occupations (verified offline against
  `ssoc2024-hierarchy.json`), resolves each to an ESCO occupation and pulls essential +
  optional skills. Mirrors the request shapes of the production-tested `api/esco.js`.
  Resumable (JSONL checkpoint), rate-limited. → `data/esco_occupation_skills.jsonl`.
- `harvest_mcf.py` — samples MCF postings across SSOC-spanning seed queries and keeps each
  posting's skill-tag set (the co-occurrence signal). Mirrors `api/mcf.js`. Deduped by uuid,
  resumable. → `data/mcf_postings.jsonl`.

Both are **network-untested in this sandbox** (egress blocked); their offline logic (SSOC
leaf enumeration, title cleaning, parsing) is verified. Run from a networked host, or here
once the env policy allows the two hosts. Raw outputs are gitignored.
