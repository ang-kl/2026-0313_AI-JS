# V3 Generative UI — governed, evidence-bound panel selection (W5)

(№ 136 - 07-07 '26 14:17 SGT)

STATUS: DRAFT — awaiting Human Lead approval (product decisions in §5)
SCOPE: Step 3 Review Studio right pane + Critical Read. Greenfield arc; nothing here is
built. Blueprint anchors: v3-ui-blueprint.md §7 (generated UI must be explainable,
reversible, evidence-bound, human-controlled, auditable, printable, and must declare
why-this-panel-appeared + its governing blueprint section); v3-blueprint.md §10.8.5
(guardrails). This spec deliberately narrows "generative UI" to something shippable and
honest: the system SELECTS and ORDERS governed panels from a fixed registry based on the
evidence present — it never invents new panel types at runtime.

## 1. Definition (what "generative" means here)

NOT: an LLM emitting arbitrary JSX/HTML. That breaks auditability and the frozen-door rule.
YES: a deterministic **panel selector** over a **fixed registry** of governed panels
(each with an id, its blueprint section, its data preconditions, and its renderer),
where the *composition* — which panels appear, in what order, with what emphasis — is
computed from the evidence objects present in the result. An optional LLM pass may
*suggest* ordering emphasis, chipped "AI estimate", never adding or removing a panel.

## 2. Panel registry (initial; all renderers already exist)

| id | governing § | precondition (evidence object) |
|----|-------------|-------------------------------|
| trajectory | №135 AI-4 | ≥4 engine-classified duties |
| market-position | №135 AI-5 | posting salaryMid + ≥4 comparable ads |
| blind-spots | №135 AI-2 | ad text ≥80 chars |
| contradictions | №135 AI-2 | ≥4 duties, majority domain |
| qoi | №135 AI-3 | ≥1 requirement span |
| indicators | №135 AI-3 | ≥3 sampled jobs |
| ach / deep-read | №135 AI-3 | criticalRead payload |
| ai-trace | §10.3 | any engine exposure signal |
| ssoc-graph | SSOCRG | classified SSOC node |
| employer-registration | EMP0 | ACRA exact match |

## 3. Selector rules (deterministic)

1. A panel renders IFF its precondition object exists — same withhold-over-guess gate the
   lenses already implement; the selector just formalises it.
2. Ordering = severity-first: panels whose findings carry the highest information value
   for THIS ad rank first (e.g. contradictions found → contradictions panel above blind
   spots; salary at 25th pct → market-position promoted). Ranking keys are counts the
   lenses already compute — no new numbers.
3. Every rendered panel carries a "why this panel" affordance: one line naming the
   triggering evidence + the governing blueprint section (§7 explainability), e.g.
   "Shown because 4 near-identical ads were found · spec №135 AI-3".
4. Human control: a panel can be dismissed (per-analysis, persisted via KV-1 "prefs");
   dismissal is reversible from a "hidden panels" chip row (§7 reversibility).
5. Print: the composed set prints in its ranked order (§7 printable).

## 4. Build slices

- **G1**: registry + selector + "why this panel" line on the Critical Read sections
  (formalises what exists; no visual change beyond the why-line).
- **G2**: severity-first ordering + dismiss/restore with KV-1 persistence.
- **G3** (optional, LLM-advisory): ordering-emphasis suggestion, chipped "AI estimate".

## 5. Decisions needed from the Human Lead before build

1. Approve the narrowed definition in §1 (select-and-order, never invent)?
2. G3 LLM ordering pass — in or out?
3. Should the selector also govern the LEFT manuscript sections, or right pane only?

Source of truth: shipped code > this spec > memory. AU-7 for amendments.
