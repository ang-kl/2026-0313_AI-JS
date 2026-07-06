# v3 Persona Output Contract — spec

**Status:** live canon. Present-state truth for every persona-authored output on Step 3.
**Scope:** rule-based reviewer comments (`rsComments`), Critical Read O-I-A cards (`CritCard`), Critical Read advisory cards (`AdvisoryCard`), and any future persona-agent output that would render on a v3 result page.
**Governance:** `trust-loop-first.instructions.md` §4 P2 + §5 rules 1, 3, 4, 5; `v3-blueprint.md` §4 (Interpretability), §5.5 (Persona-Agent Reviewers); `v3-result-engine-spec.md` §7 (Honesty Contract).

## 1. Purpose

Before a new persona family is added to v3, every persona-authored output must speak the **same disclosure language**. Today's Review Studio renders three surfaces that produce persona-shaped output — rule-based margin comments, Critical Read O-I-A cards, and batched LLM advisory cards — and each was designed independently. This spec pins one contract that all three (and any future one) must satisfy.

The goal is not more density on the page. The goal is that **every persona comment is auditable in one shape**: which span it cites, which lens it used, whether the method was deterministic or advisory, how confident it is, what it lets the user *do*, and what it explicitly forbids.

## 2. The contract

Every persona output object rendered on a v3 result page **must** carry the seven fields below. Missing a field is a spec violation; either populate it truthfully or mark it `unverified` / `withheld`.

| Field | Type | Values | Semantics |
|---|---|---|---|
| `source` | string / object | e.g. `"span:s3"`, `"posting:desc"`, `{ ssoc: "13304" }` | The verifiable source the comment cites. For span-anchored personas this is the span id; for posting-anchored (Hiring Filter, Critical Read Signal / Noise, Forensic Reversal) it is a verbatim substring or field id. |
| `persona` | string | One of the registered persona names in `PERSONA` (see §5) | The named reviewer voice. |
| `lens` | `"ROLE" \| "ORG" \| "AI" \| "SIGNAL" \| "HIRING" \| null` | O-I-A lens (see `rsLens` at `ReviewStudio.jsx:76–81`) plus two Critical-Read lenses. `null` for personas that do not choose a lens. |
| `method` | `"deterministic" \| "advisory"` | **Required.** `deterministic` means the output was authored by a rule (regex, count, engine lookup) — same input, same output. `advisory` means an LLM authored the reasoning; the LLM must not have authored a number, band, or verdict. |
| `confidence` | `"high" \| "moderate" \| "thin" \| "withheld"` | **Required.** Matches the confidence vocabulary in `v3-step3-spec.md` §8. `withheld` is a valid, expected value. |
| `allowed` | string | e.g. `"cite when self-assessing readiness"` | One short sentence: what the user *may do* with this output. Information for choice. |
| `forbidden` | string | e.g. `"do not treat as a hiring decision"` | One short sentence: what the user (or the system) must *not do*. |
| `decisionState` | `"pending" \| "accepted" \| "rejected" \| null` | The Accept / Reject / Ask-why state tracked in `commentStatus`; `null` for outputs that do not accept a decision (Critical Read cards, advisory cards). |

The eighth field `provenance` (`from posting` / `computed` / `derived` / `AI estimate` / `unverified` / `withheld`) is **already** required by `v3-step3-spec.md` §8 and is not re-listed here — but every persona output that renders a provenance chip must also carry the seven fields above.

## 3. Method rule (deterministic vs advisory)

The single hardest question this contract makes explicit: **who authored the reasoning**.

- **`method: "deterministic"`** — the output was derived by a rule or engine lookup. If you re-ran the code on the same input, byte-for-byte, you would get the same output. All of today's `rsComments` (`ReviewStudio.jsx:101–120`), `rsSignalNoise`, `rsForensicReversal`, `rsFalsification`, and `rsHiringFilter` are `deterministic`.
- **`method: "advisory"`** — an LLM authored some of the reasoning text. The LLM may **not** have authored a number, band, rank, or verdict; if it did, that is a spec violation regardless of the `method` tag. All of today's `result.criticalRead` cards (batched devil's-advocate / teleology / pro-worker / real-demand personas) are `advisory`.

**Anti-goal:** a `method: "advisory"` card that carries an engine-authored number without labelling it. If the number came from the engine, the number itself needs its own `computed` chip; the advisory field is only about the *reasoning*.

## 4. Allowed / forbidden rules

Every persona output must say — in one short sentence each — what the reader is *allowed* to do with it and what they *must not*. These are not lawyerly. They are decision-boundary signals.

Two invariants across every persona today:

- **Forbidden invariant (universal):** *"do not use as a hiring or rejection decision."* Rendered explicitly on every card or captured in the persona's `forbidden` field.
- **Allowed invariant (voice-shaped):** framed as *information for choice*, never as instruction. "Cite when self-assessing your readiness" is allowed; "Apply to this role" is not.

The wording is per-persona so the same forbidden idea reads differently depending on who is speaking. See §5 for the shipped copy.

## 5. Shipped personas + their contract

Six persona voices ship today (`PERSONA` at `ReviewStudio.jsx:29–33`). Each row below pins the `allowed` and `forbidden` copy that renders on the persona's cards.

| Persona | Lens | Method | Allowed | Forbidden |
|---|---|---|---|---|
| **AI Exposure Reviewer** | `AI` | `deterministic` | "Cite when framing which parts of this role are AI-heavy and where the human edge sits." | "Do not treat as a hiring or exposure verdict on any individual." |
| **Process Redesign Reviewer** | `ORG` | `deterministic` | "Cite the vague-ownership signal when asking what workflow this role actually owns." | "Do not use the suggested rewrite as the posting's real requirement." |
| **Role Analyst** | `ROLE` | `deterministic` | "Cite when asking whether this role is one job or two." | "Do not treat the duty-bundling count as a scope estimate." |
| **Candidate Advocate** | `ROLE` | `deterministic` | "Cite when preparing proof of human-led work for interview." | "Do not treat as a hiring recommendation for you or against anyone." |
| **Evidence Auditor** | `null` | `deterministic` | "Cite when questioning a weak claim in the posting; ask for a measurable threshold." | "Do not treat the flagged phrase as evidence of unfitness." |
| **Signal Auditor** | `SIGNAL` / `HIRING` | `deterministic` | "Cite the flagged verbatim phrase when asking the recruiter what the posting actually means." | "Do not treat the finding as an accusation; hype language is common and not always intentional." |

Advisory-pass personas (batched LLM under `result.criticalRead`, `AdvisoryCard` at `ReviewStudio.jsx:301–311`) all share the same defaults:

- **Method:** `advisory`.
- **Allowed:** "Cite to widen the interpretation; the deterministic lenses above are the audit-safe read."
- **Forbidden:** "Do not treat as evidence of anything the deterministic lenses did not already flag."

## 6. Rendering rules

- **Density.** The `allowed` / `forbidden` strip is compact: two lines, monospaced 10.5 px, under the reason. Not headline-sized; the reason is still the point.
- **Placement.** Below the reason, above the Accept / Reject / Ask-why row (for margin comments) or below the Application column (for O-I-A cards).
- **A11y.** No red/green. `allowed` renders on a soft-teal ground; `forbidden` on a soft-amber ground. Both readable at 4.5:1 contrast in light and dark themes.
- **No new persona family.** Per `trust-loop-first.instructions.md` §5 Rule 1, this PR **does not add** a new persona. It aligns the six shipped ones (plus the shared advisory-pass shape) to this contract.

## 7. Verification

Every PR that touches persona output (`rsComments`, `buildCriticalRead`, or `result.criticalRead` pipeline) must:

1. **Confirm the seven fields** are on every rendered persona output. Missing a field must fall to `unverified` / `withheld` / `null` as documented.
2. **Run `npm run verify`** — build + snapshot.
3. **Report** in the format at `trust-loop-first.instructions.md` §7 with each row honestly `PASS / FAIL / not run`.

## 8. Change log

- **2026-07-06 — initial canon.** Written as PR 4 of the trust-loop-first arc. Codifies the disclosure shape that today's three surfaces already almost share, and lets any future persona-agent output (planned in `v3-blueprint.md` §5.5, deferred by the restraint gate) inherit the same contract without a new spec pass.
