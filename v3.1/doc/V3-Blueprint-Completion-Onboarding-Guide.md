# V3.1 Blueprint Completion: Onboarding and Delivery Guide

**Document ID:** `GUIDE-V3-BLUEPRINT-COMPLETION-001`  
**Version:** 1.0.36  
**Prepared:** 2026-09-08 (SGT)  
**Repository:** [`ang-kl/2026-0313_AI-JS`](https://github.com/ang-kl/2026-0313_AI-JS)  
**Product surface:** [`https://v3.takearoundabout.com`](https://v3.takearoundabout.com)  
**Canonical baseline:** `990a83a870f41253ebcc9125d9cee011cb5a56b6` (`origin/main`)  
**Current main observed:** `8642b22cdfb89f02e546ec63b143a698d98dbb67` (`fix(v3.1): an eighth focus control, a defect the fix introduced, and three record corrections (#513)`)  
**Completion programme:** `V3-BLUEPRINT-COMPLETION-REGISTER-001`  
**Register snapshot SHA-256:** `fd9d1c69a92be1e1e933cc7538a8cfad4a6fc3677050fe59ff5115a716588478`  
**Audience:** a new engineer, product designer, evaluator, test engineer, release verifier, or agent who has not previously read this repository.

> This guide explains the product, what is already built, what is not complete, how the 30-item completion programme must be executed, and what evidence is required before anyone may claim that the blueprint is complete. The normative authority remains [V3-Blueprint-Completion-Instructions.md](./V3-Blueprint-Completion-Instructions.md) and the machine-readable [completion register](./v3-blueprint-completion-register.json).

## Contents

1. [Executive summary](#1-executive-summary)
2. [What this product is](#2-what-this-product-is)
3. [The end-to-end journey](#3-the-end-to-end-journey)
4. [Goals, objectives, and non-goals](#4-goals-objectives-and-non-goals)
5. [How to understand completion](#5-how-to-understand-completion)
6. [What has been completed](#6-what-has-been-completed)
7. [What remains incomplete](#7-what-remains-incomplete)
8. [The 30 canonical requirements](#8-the-30-canonical-requirements)
9. [Target evidence architecture](#9-target-evidence-architecture)
10. [Candidate proof and review workflow](#10-candidate-proof-and-review-workflow)
11. [AI and prompt engineering contract](#11-ai-and-prompt-engineering-contract)
12. [UI, accessibility, and responsive contract](#12-ui-accessibility-and-responsive-contract)
13. [Failure states and recovery](#13-failure-states-and-recovery)
14. [Testing and evaluation](#14-testing-and-evaluation)
15. [Provenance and release evidence](#15-provenance-and-release-evidence)
16. [Agent operating model](#16-agent-operating-model)
17. [Recommended delivery sequence](#17-recommended-delivery-sequence)
18. [New contributor start procedure](#18-new-contributor-start-procedure)
19. [Definition of done](#19-definition-of-done)
20. [Known approval gate and immediate next action](#20-known-approval-gate-and-immediate-next-action)
21. [Reference index](#21-reference-index)
22. [Glossary](#22-glossary)

## 1. Executive summary

V3.1 is a role and work-intelligence application. It starts from a role, organisation, or job posting; preserves the source evidence; classifies the occupation and skills; exposes a five-graph Work Universe; maps work across human, agent, and organisational boundaries; supports an auditable review workspace; and produces candidate-facing outputs only when supporting evidence exists.

The product is not an ATS keyword generator and not a generic career-advice chatbot. Its purpose is to help a person answer four practical questions:

1. What does this role actually require?
2. What should the candidate prove, ask, prepare, or avoid?
3. What may AI assist with, and what remains human-owned?
4. Which claims are supported, uncertain, conflicting, stale, or unavailable?

The present repository contains a strong working foundation: Step 1a role and organisation entry, Step 2 posting-evidence curation, the Step 3 Work Universe, five canonical graphs, three signals per graph, the Business Cube, specialised organisation views, Review Studio, Role Graph return navigation, governance views, and Clean and Full Review output. These surfaces have feature maps and executable browser or contract evidence.

However, the full blueprint is **not complete**. The completion programme intentionally starts from a stricter definition than "the screen exists." A requirement becomes complete only when its contracts, implementation, positive and negative tests, provenance, responsive behaviour, and Blueprint Supervisor approval are all recorded. The canonical register currently contains:

- `12` requirements approved as `COMPLETE`: `BLP-001` through `BLP-012`; the P0 gate is closed and the first six P1 requirements are approved.
- `0` requirements `IMPLEMENTED_UNVERIFIED`: `BLP-012` was the last, and was approved `COMPLETE` on 2026-09-18 at 19:58 SGT on gate run 110 at its merge commit.
- `18` requirements `NOT_STARTED`: `BLP-013` through `BLP-030` (code for `BLP-013` through `BLP-028` was merged and deployed by PR #508 on 2026-09-16 ahead of any register record; it is recorded as undeclared material, never as provenance, and each build starts with a scope ruling before code).
- `0` requirements `IN_PROGRESS`, `BLOCKED` or `WITHHELD`.

This does not erase completed product work. It means the existing work must be reconciled against the new canonical contracts and evidence gates before it can satisfy a `BLP-*` completion claim.

The Blueprint Supervisor reviewed PR #486 and its exact merge commit on 2026-09-08 and approved `BLP-001` as `COMPLETE`; the approval evidence is recorded in the register. `BLP-002`, the shared evidence contracts, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at contract 1.0.3. `BLP-003`, stable evidence identifiers, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 15:32 SGT (implementation `4020d3c` merged as `25cff53` by PR #490, revision `6750323` merged as `98a99d7` by PR #491, automated-runtime evidence on `98a99d7` at desktop and phone width). A first approval was drafted and withdrawn before merge on two upheld automated review findings; the phone-width pass they required found and fixed an untappable return control. Six known omissions ride on the record with owners. `BLP-004`, independent evidence-window fields, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 17:24 SGT (route commit `431a7a7` and implementation commit `cd75686` merged as `384db4c` by PR #493; automated-runtime evidence is the dispatch run on `384db4c` at desktop and phone width). The seven fields are decoded from the routes' raw facts by one documented rule, contract 1.0.4 records day precision where a source publishes a calendar date and stays backward-compatible so `BLP-002` remains `COMPLETE`, and the workspace footer, overview toolbar and print package render each field independently with every unavailable value shown as withheld. The two exit audits passed and their findings were fixed before merge, one of them a real defect in the posting export. Known omissions ride on the record with owners. `BLP-006`, reviewer roster and vocabulary, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 19:45 SGT (implementation commit `b672a1b` merged as `1dacc67` by PR #496; automated-runtime evidence is the dispatch run on `1dacc67` at desktop and phone width). One roster of twelve entries replaces the competing counts, every active voice carries identity, lens, method, confidence scale and action boundary, humans are never roster entries and a decision must be a human act, contract 1.1.0 makes the review verbs canonical and stays backward-compatible so `BLP-002` remains `COMPLETE`; three blueprint mappings and open question 15.2 are escalated to the Human Lead rather than inferred. `BLP-005`, round-trip and failure-path tests, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 20:20 SGT (implementation commit `6a75e9f` merged as `c703d9c` by PR #497; automated-runtime evidence is the dispatch run on `c703d9c` at desktop and phone width). The failure-path suite drives every route failure cause and proves no row is invented, pins one definition of the words each withheld, stale, failed and empty state shows, keeps an identifier inventory byte-identical across a rebuild, and renders three distinct states at both widths; it found and fixed a failure phrased as an absence on the MyCareersFuture company route, admitted with two further product changes under the Supervisor's Q1 ruling and named on the record. With `BLP-001` through `BLP-006` `COMPLETE`, the P0 gate is closed. `BLP-007`, exact candidate-evidence excerpts, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 21:43 SGT (implementation commit `5ee2f71` merged as `15a20c6` by PR #498; automated-runtime evidence is the dispatch run on `15a20c6` at desktop and phone width), the first P1 requirement approved: one pasted text is one candidate-document source whose id is a content hash of its canonical text, each marked excerpt is a verbatim span sliced from that text with a stable `span:` id, each proof is `CLAIMED_ONLY` with a confirmation record naming the local human with identity withheld in words, and a stale excerpt is refused rather than emitted. `BLP-008`, the structured candidate-proof ledger, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 22:34 SGT (implementation commit `86e4320`, two test-only revisions of `159e429`, merged as `c3923af` by PR #500; automated-runtime evidence is the dispatch run on `c3923af` at desktop and phone width): each confirmed excerpt is a distinct source-linked proof record that remembers across edits (any change to the pasted text stales every earlier record together, said so in the panel; restoring the text resumes the same record with its history), carrying the human's own claim (never pre-filled), a governed proof type whose words are provisional pending the Human Lead, the confirmation, and computed missing evidence and downstream uses in `not yet` words. `BLP-009`, proof-to-target links, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 23:33 SGT (implementation commit `592db34`, a revision of `ff4c7c0` after the Supervisor found the fault boundary set state inside a React updater, merged as `f1d94e9` by PR #502; automated-runtime evidence is the dispatch run on `f1d94e9` at desktop and phone width; the earlier merge `e6b3af3` by PR #501 carried `ff4c7c0` to main before the correction and is recorded without approval): a proof record links only to stable identifiers from the posting's canonical evidence (verified duties and verbatim requirements), the target's text is snapshotted at link time and shown beside the excerpt labelled as such, a posting change or a stale record invalidates the links together by system detection without touching any text, and skills, competencies and accepted observations are refused in words until an identifier class or a decision record exists. `BLP-010`, the six canonical proof states, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-09 at 00:20 SGT (implementation commit `baf8700`, a third revision after `06ef237` and `9610332`, merged as `967a8ff` by PR #504; automated-runtime evidence is the dispatch run on `967a8ff` at desktop and phone width): demonstrated and certified are the human's declarations (demonstrated only on a declared link standing under a live judgement against the posting evidence, refused in words otherwise), conflicting is declared by the human between two accepted records over one shared standing target and resolved for both sides, stale carries its causes (the text changed, a declared link lost) and withheld its cause, resumption from either is always to claimed only and never re-asserts a declaration, and the words for every state are the adapter's, defined once. `BLP-011`, control of accepted proof destinations, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-18 at 11:57 SGT (implementation commit `6ce3a69`, merged as `8c0aaa0` by PR #506 on 2026-09-16, corrected post-merge by `0e7aecc` (PR #507); automated-runtime evidence is the dispatch run on main at `8c0aaa0` at desktop and phone width): each demonstrated or certified record is approved or revoked by the human for each of the five destinations (resume, cover letter, interview, portfolio, work sample), approval on a demonstration needs its declared link standing under a live judgement and approval on a certification needs no bundle, every approval lapses by the system with a governed event when the record leaves its accepted state and is said from history as approved at, lapsed at, because, a revoked destination is untouched by lapse, the proof type gates nothing, the words are the adapter's, and the print package carries the approved proof with its instant and the statement that link standing was not re-checked at print time. `BLP-012`, verification of the complete candidate-proof workflow, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-18 at 19:58 SGT (implementation commit `ba3216a`, which supersedes `44543bc` and keeps it as evidence, merged as `8642b22` by PR #513; automated-runtime evidence is the `workflow_dispatch` gate run 110 on `main` at the merge commit, 988 checks across the four BLP-028 widths). One session drives the whole chain - paste, excerpt, ledger record, link, state declaration, destination approval, output - and the focus defect the suite measured is fixed on EIGHT controls, not the seven an accessibility review named and the coordinating session reported as the complete set; a refused act is asserted to leave focus where the human put it, closing a defect the focus fix itself introduced. Criterion (ii) is satisfied for the workflow this requirement verifies: re-link, declare conflict and resolve conflict are neither wired nor measured and ride on the record as named omissions owned by `BLP-009` and `BLP-010`, because they are not stages of that workflow and the suite cannot reach them. Run 110's two caveats are recorded with the approval rather than folded into it: `FEATURE_MAP_BASE_REF` is empty on a dispatch so the feature-map scope comparison is not exercised, and the register-scope step is skipped because its condition is a branch-name prefix, `startsWith(github.head_ref, 'codex/v31-blueprint-completion-register-')`, which this branch matches on no event at all. CORRECTED 2026-09-19 after the Codex reviewer found that this sentence still carried the event-based reason that had already been corrected in the register at `1f9340a`: the claim was fixed where it was noticed and not searched for across the repository, leaving a corrected register beside an uncorrected guide. The remaining occurrences of the false wording, in section 6.8 and in the register, are quotations of it inside the sentences that refute it and are deliberately untouched.

## 2. What this product is

### 2.1 Core thesis

The product treats a job advertisement as evidence about a work system, not merely as a vacancy. A posting may disclose duties, capability demand, process friction, governance needs, role boundaries, and organisational signals. Those signals must remain traceable to the text or structured source that produced them.

The blueprint describes the posting as the manuscript, the analysis engine as the editorial room, specialist agents as reviewers, and the human user as editor-in-chief. The software may organise, classify, compare, and propose; it must not silently make human review decisions or invent missing evidence.

### 2.2 Primary users

- Candidate or career switcher preparing for a screen or interview.
- Worker assessing role change, skills, and AI exposure.
- Hiring manager or recruiter examining role coherence.
- Organisation designer or process-improvement practitioner examining work design.
- Policy or workforce actor examining occupation and labour-market signals.

### 2.3 Product truth model

Every material value must identify one of these origins:

- **Source-verbatim:** text or data copied from an identified posting, taxonomy, candidate source, or organisation record.
- **Deterministic:** a repeatable calculation, classification, crosswalk, count, state transition, or rule result.
- **AI-assisted:** a model proposal or interpretation that remains subordinate to schema, evidence, and policy checks.
- **User-authored:** a statement entered or confirmed by the human user.
- **Withheld:** a value the product refuses to infer because supporting evidence is absent, rejected, conflicting, or stale.

## 3. The end-to-end journey

### 3.1 Step 1a: role or organisation entry

Step 1a lets the user search for a role or organisation and inspect available opportunities. The organisation path can load MyCareersFuture opportunities, filter and sort them, show source-supplied details, and enter organisation AI Moments. The role path carries the selected role or posting into the next stage.

Canonical map: [`MAP-V3-STEP1A-001`](./V3-Step1a-Agent-Readable-Feature-Map.html)  
Machine-readable manifest: [`v3-step1a-feature-map.manifest.json`](./v3-step1a-feature-map.manifest.json)

### 3.2 Step 2: posting evidence picker

Step 2 retrieves postings from MyCareersFuture and Careers@Gov, keeps source results distinct, classifies titles into SSOC families, exposes filters and curation statistics, and lets the user select one evidence-bearing posting. A source may legitimately return zero results; this must not erase useful rows from the other source.

The Step 2 handoff produces both a reduced display object for Step 3 and a separate source-bearing analysis request. It must not treat an inferred SSOC suggestion as if it were source evidence, and it must not lose source identity, posting identity, employer, or duty text.

Canonical map: [`MAP-V3-STEP2-001`](./V3-Step2-Agent-Readable-Feature-Map.html)  
Machine-readable manifest: [`v3-step2-feature-map.manifest.json`](./v3-step2-feature-map.manifest.json)

### 3.3 Step 3: Work Universe and review

Step 3 begins with a Work Universe rather than a generic network diagram. It presents five parallel views of the role and exactly three first-order signals within each view:

1. **Labour Graph:** duties, work units, skills, and occupation relationships.
2. **Organisation Work Graph:** capabilities, authority, organisation coverage, and operating boundaries.
3. **Intelligence Graph:** information objects, evidence, and agent-actionable knowledge.
4. **Human-Agent Graph:** human-owned, hybrid, and agent-assisted work boundaries.
5. **Transition Graph:** change, formation, and evidence-bound development needs.

The organisation AI Moments view uses a 3 x 3 x 3 Business Cube across function, work, and decision dimensions. All 27 intersections remain addressable. Unsupported cells remain visible as withheld instead of disappearing. Selection, drag, keyboard rotation, explode state, the selection strip, and the inspector use one state model.

The advanced Review Studio preserves the posting manuscript, source spans, deterministic analysis, reviewer comments, accepted or rejected suggestions, governance records, Role Graph return navigation, and printable Clean or Full Review packages.

Canonical map: [`MAP-V3-STEP3-001`](./V3-Step3-Agent-Readable-Feature-Map.html)  
Machine-readable manifest: [`v3-step3-feature-map.manifest.json`](./v3-step3-feature-map.manifest.json)

### 3.4 Master map

The three stages and their handoff contracts are linked by the [V3 Agent-Readable Feature Map Index](./V3-Agent-Readable-Feature-Map-Index.html) and its [JSON index](./v3-feature-map-index.json).

## 4. Goals, objectives, and non-goals

### 4.1 Goal

Complete the V3 blueprint as a reviewable, evidence-bound work-intelligence system in which every consequential claim can be traced to an immutable source, deterministic method, explicit user decision, or clearly labelled AI proposal.

### 4.2 Objectives

1. Preserve stable evidence identity from source ingestion through review, visualisation, candidate output, and return navigation.
2. Keep posting evidence, candidate evidence, organisation evidence, deterministic computation, and AI interpretation structurally distinct.
3. Build a candidate-proof ledger that records exact excerpts and controls where accepted proof may be used.
4. Make review actions reversible and auditable without mutating source text.
5. Produce resumes and cover letters only from accepted, current evidence, with claim-level traceability.
6. Prevent export while unsupported, conflicting, or stale claims remain unresolved.
7. Make the Business Cube and every specialised map useful with positive supplied-data tests, explicit withholding, selection feedback, and accessible alternatives.
8. Verify desktop, phone, keyboard, focus, error, empty, withheld, and stale behaviour.
9. Separate implementation, merge, deployment, automated-runtime, and physical-runtime provenance.
10. Publish an immutable final release attestation only after all applicable gates pass against the exact deployed commit.

### 4.3 Non-goals

- Do not redesign Step 1 or existing Step 2 behaviour while completing this programme.
- Do not modify `v3/` or Railway configuration unless the user explicitly authorises a separate change.
- Do not optimise for ATS keyword stuffing or promise hiring outcomes.
- Do not infer candidate credentials, organisation hierarchy, process sequence, maturity, ownership, capability, metrics, dates, or outcomes.
- Do not make an LLM responsible for deterministic classification, review decisions, state transitions, governance controls, or export eligibility.
- Do not count a source file, hidden component, label, mock, or placeholder as a completed user-facing feature.
- Do not treat automated mobile emulation as physical-device evidence.

## 5. How to understand completion

### 5.1 Three separate ledgers

New contributors must not combine these ledgers:

| Ledger | Question answered | Vocabulary |
|---|---|---|
| Product cross-reference | What useful surface exists today? | `BUILT`, `WIRED`, `PARTIAL`, `PARKED`, `WITHHELD` |
| Feature maps | What current behaviour, component, state, transition, payload, invariant, and evidence is documented? | `VERIFIED`, `PARTIAL`, `NOT_IMPLEMENTED`, `NOT_VERIFIABLE` plus map-specific states |
| Blueprint completion register | Has a canonical requirement passed every applicable contract and release gate? | `NOT_STARTED` through `COMPLETE` |

A surface can be `BUILT` in the product cross-reference while its corresponding `BLP-*` requirement is still `NOT_STARTED`. This occurs when existing behaviour has not yet been migrated to the canonical contract, tested for all mandatory states, tied to exact provenance, and approved by the Blueprint Supervisor.

### 5.2 Canonical lifecycle

The normal lifecycle is:

```text
NOT_STARTED
  -> IN_PROGRESS
  -> IMPLEMENTED_UNVERIFIED
  -> AUTOMATED_VERIFIED
  -> DEPLOYED_VERIFIED        when deployment is required
  -> PHYSICAL_VERIFIED        when physical verification is required
  -> COMPLETE
```

A requirement whose `completionPolicy.requiresAutomatedRuntime` is `false` has no automated-runtime stage to pass, so it moves `IMPLEMENTED_UNVERIFIED -> COMPLETE` directly on Blueprint Supervisor approval. That edge is policy-gated in the instructions and enforced by the contract test; `BLP-001` is the only current instance.

`BLOCKED` means implementation cannot proceed because a named prerequisite is unmet. `WITHHELD` means a required proof legitimately does not exist and the missing evidence and consequence are recorded. Neither word means "probably complete."

### 5.3 Current register state

As of this guide:

| Status | Count | Requirements |
|---|---:|---|
| `COMPLETE` | 12 | `BLP-001`, `BLP-002`, `BLP-003`, `BLP-004`, `BLP-005`, `BLP-006`, `BLP-007`, `BLP-008`, `BLP-009`, `BLP-010`, `BLP-011`, `BLP-012` |
| `IMPLEMENTED_UNVERIFIED` | 0 | None |
| `NOT_STARTED` | 18 | `BLP-013` through `BLP-030` |
| `IN_PROGRESS` | 0 | None |

The authoritative current values are in [`v3-blueprint-completion-register.json`](./v3-blueprint-completion-register.json), not this narrative snapshot.

## 6. What has been completed

### 6.1 Product foundation

The following is present in the current product baseline. The detailed status and remaining qualification for each row are in the [blueprint component cross-reference](../script/v3.1-blueprint-component-cross-reference.md).

| Area | Present capability | Honest limit |
|---|---|---|
| Step 1 | Role, organisation, and candidate ingress; live opportunity path | Must remain behaviourally unchanged during the completion programme |
| Step 2 | Two-source posting curation, SSOC classification, filters, curation overview, responsive cards, waiting and partial-source states | Full canonical evidence-window and stable-ID contract is not yet approved |
| Work Universe | Five canonical graphs with three signals each, role anchor, evidence highlighting, and responsive three-panel shell | Full positive source round trip is conditional on source-bearing fixtures |
| Business Cube | 27 function-work-decision intersections, withheld cells, shared selection, inspector, pointer and keyboard movement | Positive supplied-data coverage must be reconciled under `BLP-022` and `BLP-023` |
| Organisation map | Supplied hierarchy, relationships, functions, dependencies, capabilities, authority, and process ownership | No hierarchy or maturity may be inferred from a posting |
| Workflow map | Supplied steps, transitions, actors, decisions, queues, bottlenecks, and handoffs | Duties are never converted into invented sequence |
| Value stream map | Supplied stages, classifications, timing/cost labels, owners, friction, impact, boundaries, and proposals | No timing, waste, savings, layoffs, quality, or maturity may be inferred |
| Visual selector | Reversible Graph, Org, Workflow, and Value Stream choice with role-sensitive recommendation | Unsupported families are unavailable or withheld, not silently remapped |
| Review Studio | Manuscript, evidence spans, O-I-A inspector, six review lenses, accept/reject, links, critical read, hard gates | Full split/merge/relabel/escalate/withhold/resolve/reopen/undo vocabulary remains incomplete |
| Candidate preparation | Preparation and interview material, person-evidence ingress, target-skill confirmation | Unified source-linked proof ledger and claim workbench remain unbuilt |
| Governance | Evidence-bound governance ledger and disagreement review | Must remain supplied-data and human-decision controlled |
| Output | Structured export and printable Clean/Full Review packages | Resume claim workbench and cover-letter workbench remain incomplete |

### 6.2 Published feature maps

- Step 1a map and responsive evidence were merged in [PR #475](https://github.com/ang-kl/2026-0313_AI-JS/pull/475), commit [`1ca2f402c0191e268d41ef103e614ef50b6bfec1`](https://github.com/ang-kl/2026-0313_AI-JS/commit/1ca2f402c0191e268d41ef103e614ef50b6bfec1).
- Step 2 has a published HTML map and machine-readable manifest linked from the master index.
- Step 3 has a published HTML map and machine-readable manifest covering the Work Universe, review paths, Business Cube, and known gaps.
- Feature-map schema, link, locator, asset, provenance, and protected-scope rules are enforced by [`feature-map-contract.mjs`](../tests/feature-map-contract.mjs).

### 6.3 Step 2 and Business Cube audit work

The broad audit correction was merged in [PR #484](https://github.com/ang-kl/2026-0313_AI-JS/pull/484), merge commit [`2c0146be34ee3ea87e11d7b9c40b52bce42b0095`](https://github.com/ang-kl/2026-0313_AI-JS/commit/2c0146be34ee3ea87e11d7b9c40b52bce42b0095). It includes the evidence-bound Business Cube and Step 2/Step 3 audit corrections.

The compact Step 2 desktop toolbar follow-up was merged in [PR #485](https://github.com/ang-kl/2026-0313_AI-JS/pull/485), merge commit [`990a83a870f41253ebcc9125d9cee011cb5a56b6`](https://github.com/ang-kl/2026-0313_AI-JS/commit/990a83a870f41253ebcc9125d9cee011cb5a56b6). That commit is the baseline for this completion programme.

### 6.4 Completion governance package

The present branch adds the operating package needed to manage completion:

- Canonical instructions: [`V3-Blueprint-Completion-Instructions.md`](./V3-Blueprint-Completion-Instructions.md).
- Machine-readable register: [`v3-blueprint-completion-register.json`](./v3-blueprint-completion-register.json).
- Strict schema: [`v3-blueprint-completion-register.schema.json`](./v3-blueprint-completion-register.schema.json).
- Executable register contract: [`blueprint-completion-contract.mjs`](../tests/blueprint-completion-contract.mjs).
- Master Feature Map links: [`v3-feature-map-index.json`](./v3-feature-map-index.json) and [HTML index](./V3-Agent-Readable-Feature-Map-Index.html).
- CI integration: [`.github/workflows/v31-browser-gate.yml`](../../.github/workflows/v31-browser-gate.yml).

This package defines exactly 30 immutable IDs, exact dependencies, protected scopes, lifecycle transitions, evidence rules, completion policies, supervisor authority, and final release-attestation requirements. It was merged to `main` in commit `ad69d8b48d5686a08fea5d968e695a1362430702` on 2026-09-08, and its contract test passes against that commit. Merging the package is governance work; it is not a `BLP-*` completion claim.

### 6.5 Provenance already known

| Surface | Implementation or merge evidence | Deployment evidence | Automated runtime | Physical runtime |
|---|---|---|---|---|
| Step 1a map | PR #475, merge `1ca2f402c0191e268d41ef103e614ef50b6bfec1` | Not reverified by this programme | Existing map evidence | Not reverified |
| Step 2 latest UI | implementation `1a043664434ae9c3c2cd21850ed23df50138fb66`; PR #485; merge `990a83a870f41253ebcc9125d9cee011cb5a56b6` | Production origin passed, but provider record and served commit were unavailable | Chromium against deployed origin passed; exact served commit unverified | Not run |
| Step 3 Business Cube audit | implementation `7da49403434d5c2791e70a36440ba19fe120efa6`; PR #484; merge `2c0146be34ee3ea87e11d7b9c40b52bce42b0095` | Recorded successful provider statuses for the merge commit | Chromium against deployed origin passed | Not run |
| Completion programme | unmerged working branch | Not applicable yet | Register contract passes locally | Not applicable yet |

The key rule is that a successful deployment badge does not prove runtime behaviour, and a passing runtime URL does not prove which commit the server is serving unless the runtime exposes or the provider records the exact commit.

### 6.6 Programme events outside the register: PR #508 (recorded 2026-09-18)

Three squash merges landed on `main` on 2026-09-16, each by the account `ang-kl` per the commit author: `8c0aaa0` (PR #506, `BLP-011`) at 04:08:12Z, `0e7aecc` (PR #507, two post-merge corrections to `BLP-011` files) at 06:25:02Z, and `61531dc` (PR #508, "implement BLP-012 through BLP-028", 48 files) at 10:05:22Z. Who issued them is not a fact anyone holds. `61531dc` carried no scope ruling, no `IMPLEMENTED_UNVERIFIED` record and no Blueprint Supervisor verification, and was deployed to Railway production at 10:05Z; its `pull_request` run 98 was green and no `workflow_dispatch` ran on it until run 99 on 2026-09-18. The Supervisor records this as a section 13 execution-discipline breach and a section 8 evidence gap. The register was not advanced by any of it, which is why the position is recoverable: the register asserts nothing about #508.

The Supervisor's rulings, each verified against the artefacts: (1) `BLP-012` through `BLP-028` stay `NOT_STARTED` with `implementationCommit` `NOT_IMPLEMENTED`; each carries a note that partial material exists on `main` at `61531dc`, unverified and undeclared, which a future implementation may adopt or discard, and each build starts with a scope ruling before code. (2) The review-state library, the generation route and the organisation-synthesis and visual-family contracts are recorded as delivered-but-unconsumed, never as behaviour. (3) Two protected scopes were touched without declaration: the Step 2 per-source failure states in `App.jsx` and `api/mcf.js` are authorised and recorded retrospectively on `BLP-005` (reverting working failure-state honesty would make the product less truthful); the print package's refusal to print under a ledger fault is reverted to withhold-not-refuse at `50690c1`. (4) The gate-list edits are acceptable: the responsive matrix verifies each child's artefact, not merely its exit code. (5) The reopen test on `BLP-002` through `BLP-007` passes; nothing reopens; records whose printed figures moved carry the new figures beside, never over, the approved ones. (6) Three defects fixed at `50690c1` before any status moved: the self-referential stale gate in the two workbenches (a release gate that could not fire), and two assertions that could not fail, one added by #508 to `BLP-006`'s suite and one pre-existing in `BLP-003`'s since PR #491, which the Supervisor approved and records as their own miss.

The temporary verification ref `verify/blp-011-8c0aaa0`, created under the Human Lead's authorisation to dispatch on `BLP-011`'s exact merge tree, is recorded as found rather than as expected: it still exists at the time of this record. The deletion push was refused twice by the coordinating container's git proxy and the GitHub tools available to that session carry no delete-branch call, so the Human Lead was asked to delete it in the GitHub UI. It points at `8c0aaa0` with no commit of its own and served exactly one dispatch, run `35304935300`, job `105475079828`.

The register schema has no programme-level container (it is closed at every level), so this section is the programme-level entry and the register carries the per-requirement facts as appended evidence notes. Repository hygiene observed in passing and not acted on: some thirty tracked duplicate files named with a trailing ` 2` (among them `src/App 2.jsx` and `src/main 2.jsx`, the latter flagged at `BLP-008`); one of them is the only importer of the review-state library.

### 6.7 Two rulings carried forward from the #508 arc (recorded 2026-09-18)

**A skipped gate step is not by itself evidence of a gap.** Gate run 105 reported step 9, "Enforce blueprint-register construction scope", as `SKIPPED` on a change that included the register. The coordinating session raised it: it read the job's step list, checked the workflow rather than assuming what the skip meant, established that the skip was the guard behaving as written, and brought it to the Blueprint Supervisor as something that might belong against the programme rather than leaving it as a thing one session happened to see. This register names the finder of every defect it records - the conformance auditor, the gate at phone width, the builder, the Supervisor - and a ruling is recorded on the same terms, because a reader deciding how far to trust the programme's checks is helped by knowing which check found what. The step is the one named `Enforce blueprint-register construction scope` in `.github/workflows/v31-browser-gate.yml`, and its `if:` reads `startsWith(github.head_ref, 'codex/v31-blueprint-completion-register-')`; the branch that carried the change is a `claude/` branch, so the skip is the guard doing what it says rather than a silent bypass. **This sentence carried line numbers until 1.0.33 and they are removed deliberately.** The Blueprint Supervisor supplied `:99-100`, which was correct for the commit that published the sentence and off by one for the run the paragraph describes, because the change publishing it inserts a suite line above the step; the numbers would have drifted again at the next registration. The Supervisor recorded the error against itself. A step name and a quoted expression identify the same thing and do not move.

The Blueprint Supervisor ruled this is **not** a member of the family this programme has been tracking, and the distinction is worth having on the record because the two look alike in a step list and are opposites in substance. The family is *a check whose subject cannot fail it*. This is *a check that correctly does not apply to this subject, while the check that does apply ran and passed*: `tests/blueprint-completion-contract.mjs` validates the register against its schema, the thirty canonical identifiers, the dependency graph, the permitted transitions, provenance consistency and the register-to-Markdown-to-HTML hash chain, and it ran. Step 9 adds only a docs-only scope constraint that is meaningful for the branch family which *constructs* the register; running it against a change that legitimately carries both code and register edits would have failed a correctly shaped pull request. **A skipped step is evidence of a gap only where nothing else covers the ground, and here something does.**

The residual is recorded honestly rather than as a lapse: **no rule currently enforces docs-only on register changes made from non-`codex/` branches.** Nobody has stated that rule, so nothing is being violated. If the programme wants it, that is a workflow change needing its own scope ruling.

**A gate must not be widened under the commit it is gating.** Stated generally, because it is a rule about how to change a gate rather than about what this gate does: *a gate widened under the commit it is gating produces an approving run from the pre-change gate, so the changed gate is trusted without ever having been exercised.* That is why a gate change needs its own commit and its own run before anything relies on it. It is recorded here, beside the reasoning it arose from, rather than in the workflow file, because a reader of the YAML would meet it without its context and the question it answers - "why not just widen the trigger?" - is asked while reading this note.


### 6.8 A digest certifies only what it was computed over (recorded 2026-09-18)

**The defect.** This programme's record chain publishes an HTML guide and certifies it with a digest **of the Markdown**. `tests/blueprint-completion-contract.mjs` parsed the thirty requirement rows from the Markdown alone and checked the HTML only for the document identifier, the register hash, the presence of the thirty identifiers somewhere in the file, and the provenance field names. Nothing a stale body would fail.

So an HTML that was never regenerated passed every check while telling readers an obsolete story. At the merge of PR #511 the published HTML named `61531dc` as current main - the very commit this programme had ruled was undeclared material - reported nineteen requirements `NOT_STARTED` where the register said eighteen, showed `BLP-012` as `NOT_STARTED` after the register said otherwise, and omitted section 6.7 entirely. Its version string and its digest were both current and both truthful. The body they were attached to was not.

**Who missed it.** This register names the finder of every defect it records, and where a defect stood in front of someone whose task was to catch it, it names them too. The automated reviewer on PR #511 found it. The contract did not. The coordinating session did not, having re-stamped the digest and patched the version string at every guide update in the arc. **The Blueprint Supervisor did not**, having verified that digest equality at `8c0aaa0` and again at the PR #511 merge and reported it, in a list of verification steps, as establishing something about the published guide. The one instance where naming is least comfortable is the one where it matters.

**The narrow rule.** *A digest certifies the bytes it was computed over and nothing else. A chain that hashes A and publishes B has certified only that A is A, until something compares B with A.* That sounds obvious after the fact and did not stop two parties across eleven consecutive approvals.

**The rule that matters more, and its second instance.** Both parties re-reported that equality as verification every time, because it had the shape of what a thorough report says, and neither asked what it ruled out. This is the same mechanism recorded during the PR #508 arc, now with a second instance and a second victim: **a check is performed under the felt authority of being a check, and that authority is indistinguishable from having checked.** The first instance was a correction - the pair-sampling guard that carried the defect it existed to catch, and the print-focus effect that measured no better than the defect it was fixing, found by running a probe against the fix rather than by reading it. This instance is a verification step. The mechanism is identical, which is the evidence that it is a mechanism and not an anecdote.

**What this means for the eleven `COMPLETE` approvals: nothing, and the reason is worth stating.** An approval is sound if the artefacts its evidence rests on were sound. For all eleven the evidence was the register record read field by field, blob identity between implementation and merge commits, and a CI run read from its run object and job log. Every one of those was sound and none of them is the HTML, which is a derived reading surface and was never load-bearing for any approval. No approval is withdrawn, no requirement is reopened, and a reader of any of the eleven needs to do nothing: their evidence is independently re-derivable today. **What was wrong was the description of a check, eleven times, not the check the approvals actually rested on** - and misdescribing a check is the same defect class as writing one that cannot fail.

**What now guards it.** The contract parses the requirement rows out of the HTML and compares identifier, priority and status against the register; requires the HTML's version, register digest and current-main fields to equal the Markdown's; requires every Markdown section heading to appear as a heading in the HTML; and requires the HTML's status counts to equal the counts computed from the register. Each of the four was observed failing on the stale file before the repair, on the symptom it exists to catch. **The durable remedy is not in place:** the HTML is maintained by hand-patching, which is why a body could lag its digest at all. Generating the HTML from the Markdown and having the contract regenerate and compare would make every field check unnecessary. No canonical requirement owns the guide's build, which is a coverage gap of the same kind as `wu-open-print-package` and is escalated to the Human Lead in the same terms.

**And what it still does not cover, stated here rather than after the next thing slips through.** The chain proves the HTML body agrees with the register's ROWS - identifier, priority, status, counts, headings, digests. It proves nothing about whether the two documents' REASONING agrees. Measured instance, 2026-09-18: a note in the register said the gate's register-scope step skips because its condition keys on a `pull_request` event, while section 6.7 of this guide correctly recorded that it is gated on a `codex/` branch-name prefix. Two documents in one repository contradicted each other in prose and every check passed, because no check reads prose. A prose comparator is NOT the remedy and the Blueprint Supervisor has ruled against automating prose equality; the remedy is that the limit is written down, so a reader does not take "the chain is closed" for more than it means. This is the third time this programme has had to say what a check does not cover, and each time it was said only after something had already slipped through it.


### 6.9 The care went into qualifying the claim, not into checking it (recorded 2026-09-18)

Section 6.8 records five instances of one family. This is a sixth, and it is a different
mechanism from the other five, which is why it is written down rather than folded into them.

Reporting gate run 110 to the Blueprint Supervisor, the coordinating session wrote that the
four suite figures "equal the figures you set as expected", and attached a careful epistemic
qualification: that this was agreement between a log line and a prior expectation, not
independent corroboration, since the same suite produced both. The qualification was accurate
and it was beside the point. Nobody checked whether the claim it qualified was **true**: the
Supervisor's stated expectation for the continuity suite was `972` and the run reported `988`.

**The fact that makes the mechanism worse, not better.** The coordinating session's own carried
expectation WAS `988`. It had named that figure to the Human Lead before the run finished, and
the run's `988` sat four lines above the sentence asserting agreement. So the claim was not made
in ignorance of the number, and the writer was not wrong about it. **Two figures occupied the
same role - "the expected figure" - and a role is not a value.** The writer's own correct figure
was substituted for the one being attributed to another party, and being right about the number
is precisely what made the substitution invisible: nothing felt like a gap, because from the
inside nothing was.

**The mechanism.** In the five earlier instances a check was performed under the felt authority
of being a check. Here the authority came from somewhere else: the hedging was applied to the
strength of a relationship whose second operand was never read. The claim had support - for the
writer's own expectation. What it lacked was support for the attribution, and no amount of care
spent on characterising the evidence could supply that, because the missing step was not an
appraisal but a read. A disclaimer about the strength of evidence reads like scrupulousness, and
scrupulousness is what a reader credits; it is not verification and it does not become
verification by being well-phrased.

**And the Supervisor committed the same error while diagnosing it**, which is recorded here at
the Supervisor's own insistence rather than left out of a section it would flatter. Its finding
named the mechanism confidently and implied the coordinating session had held `972` and had
failed to notice its own artefact contradicting it. That is not what happened, and the
Supervisor had not asked which expectation was at issue - it characterised the relationship
between two expectations having read only one of them, which is the closing guard below,
breached in the act of writing the section that states it. A record that misdescribes what it
records is worse than no record, which is why 6.8 exists and why this paragraph is in 6.9.

**The guard is the same one that always applies and was not applied, twice:** a claim of
agreement between two values is checked by reading both values, not by characterising the
relationship between them. Both figures were right, which is the only reason this cost nothing.

## 7. What remains incomplete

### 7.1 Highest-risk foundation gaps

1. There is no approved canonical implementation of `EvidenceSource`, `EvidenceSpan`, `ProofRecord`, `ReviewChange`, `OutputBlock`, `VisualProfile`, and `EvidenceWindow`.
2. Stable evidence identifiers are not yet contractually proven across every Step 2 to Step 3 to review to output transition.
3. Published, closing, retrieved, analysed, corpus-range, posting-count, and source-timezone fields are not yet carried independently end to end.
4. Positive source-bearing round-trip fixtures, unknown-reference rejection, stale-data handling, and failure-path tests are incomplete.
5. Competing reviewer roster and action vocabulary assumptions have not been reconciled into one approved contract.

### 7.2 Candidate-proof gaps

1. Candidate evidence needs exact immutable excerpts and spans.
2. The product needs a structured proof ledger linking accepted evidence to duties, requirements, skills, competencies, and review observations.
3. Proof needs explicit states: demonstrated, certified, claimed-only, withheld, conflicting, and stale.
4. The user must control whether accepted proof may be used in a resume, cover letter, interview, portfolio, or work sample.
5. Desktop, phone, keyboard, focus restoration, and evidence round-trip behaviour require executable positive and failure coverage.

### 7.3 Review gaps

1. First-class `split`, `merge`, `relabel`, `escalate`, `withhold`, `resolve`, `reopen`, and `undo` operations are not complete.
2. Source text must remain immutable while review history becomes append-only and reversible.
3. Reviewer identity and review filters must remain stable across every review surface.
4. Tests must cover overlapping spans, stale and rejected evidence, escalation, withholding, undo, and restored decisions.

### 7.4 Candidate-output gaps

1. A source-linked resume-claim workbench is not complete.
2. The generation service is not yet server-owned and schema-constrained by task.
3. The cover-letter workbench is intentionally parked until accepted evidence can support every sentence.
4. Copy, save, print, PDF, and export must be blocked while unsupported, conflicting, or stale claims remain unresolved.
5. Adversarial tests for prompt injection, invented metrics, unknown IDs, invalid schema, provider failure, stale hashes, and rejected evidence are not complete.

### 7.5 Visual and organisation gaps

1. Existing specialised maps need positive supplied-data browser tests, not only builder or empty-state tests.
2. Inspector placement, docking, floating, restoration, mobile linear alternatives, selection feedback, and keyboard behaviour need one complete cross-surface contract.
3. Cross-posting organisation synthesis must be evidence-bound and must not infer hierarchy or maturity.
4. Remaining role-sensitive visual families must be added individually, only when a supplied-data grammar and withholding path exist.
5. Generated or adaptive panels need visible blueprint trace and reversible explanations.

### 7.6 Release gaps

1. The final in-scope P0-P4 implementation has not been deployed and verified in Chromium against one exact commit.
2. The complete 1440, 2048, 390, and 430 width/state matrix has not been run against that exact deployed commit.
3. Physical Safari and physical-phone verification has not been performed against that exact deployed commit.
4. No immutable GitHub release attestation names the final subject commit and register hash.

## 8. The 30 canonical requirements

The table below is an onboarding summary. Exact normative wording and dependencies are enforced by the [instructions](./V3-Blueprint-Completion-Instructions.md), [register](./v3-blueprint-completion-register.json), [schema](./v3-blueprint-completion-register.schema.json), and [contract test](../tests/blueprint-completion-contract.mjs).

| ID | Gate | Status | Objective and practical definition of done | Required predecessors |
|---|---|---|---|---|
| `BLP-001` | P0 | `COMPLETE` | Merge and record the Step 2 provenance-only update without altering product behaviour. | None |
| `BLP-002` | P0 | `COMPLETE` | Define canonical `EvidenceSource`, `EvidenceSpan`, `ProofRecord`, `ReviewChange`, `OutputBlock`, `VisualProfile`, and `EvidenceWindow` contracts. | `BLP-001` |
| `BLP-003` | P0 | `COMPLETE` | Preserve stable evidence identifiers across Step 2, Step 3, graphs, review, candidate proof, generated outputs, and return navigation. | `BLP-002` |
| `BLP-004` | P0 | `COMPLETE` | Carry published, closing, retrieved, analysed, corpus-range, posting-count, and source-timezone fields independently; withhold each unavailable value. | `BLP-002` |
| `BLP-005` | P0 | `COMPLETE` | Add positive source round-trip, reference-integrity, withholding, stale-data, and failure-path contract tests. | `BLP-002`, `BLP-003`, `BLP-004` |
| `BLP-006` | P0 | `COMPLETE` | Reconcile one canonical reviewer roster and one canonical review-action vocabulary. | `BLP-002` |
| `BLP-007` | P1 | `COMPLETE` | Capture exact candidate-evidence excerpts with immutable source and span identifiers. | `BLP-002`, `BLP-003` |
| `BLP-008` | P1 | `COMPLETE` | Build the structured candidate-proof ledger. | `BLP-007` |
| `BLP-009` | P1 | `COMPLETE` | Link proof records to duties, requirements, skills, competencies, and accepted review observations. | `BLP-008` |
| `BLP-010` | P1 | `COMPLETE` | Support demonstrated, certified, claimed-only, withheld, conflicting, and stale proof states. | `BLP-008`, `BLP-009` |
| `BLP-011` | P1 | `COMPLETE` | Control accepted proof destinations: resume, cover letter, interview, portfolio, and work sample. | `BLP-009`, `BLP-010` |
| `BLP-012` | P1 | `COMPLETE` | Verify candidate-proof workflows on desktop, phone, keyboard, focus restoration, and evidence round trip. | `BLP-007`, `BLP-008`, `BLP-009`, `BLP-010`, `BLP-011` |
| `BLP-013` | P2 | `NOT_STARTED` | Implement first-class `split`, `merge`, `relabel`, `escalate`, `withhold`, `resolve`, `reopen`, and `undo` review operations. | `BLP-003`, `BLP-006` |
| `BLP-014` | P2 | `NOT_STARTED` | Preserve immutable source text and reversible, append-only review history. | `BLP-013` |
| `BLP-015` | P2 | `NOT_STARTED` | Add review filters and stable reviewer identity across every review view. | `BLP-006`, `BLP-013` |
| `BLP-016` | P2 | `NOT_STARTED` | Test overlapping spans, stale evidence, rejected evidence, escalation, withholding, undo, and restored decisions. | `BLP-013`, `BLP-014`, `BLP-015` |
| `BLP-017` | P3 | `NOT_STARTED` | Build a source-linked resume-claim workbench using accepted job evidence and confirmed candidate proof. | `BLP-008`, `BLP-009`, `BLP-010`, `BLP-011`, `BLP-012`, `BLP-013`, `BLP-014`, `BLP-015`, `BLP-016` |
| `BLP-018` | P3 | `NOT_STARTED` | Add a server-owned, schema-constrained generation service with evidence-reference and policy validation. | `BLP-002`, `BLP-003`, `BLP-010` |
| `BLP-019` | P3 | `NOT_STARTED` | Build an evidence-gated cover-letter workbench with sentence-level traceability. | `BLP-011`, `BLP-017`, `BLP-018` |
| `BLP-020` | P3 | `NOT_STARTED` | Block copy, save, print, PDF, and export while unsupported, conflicting, or stale claims remain unresolved. | `BLP-017`, `BLP-019` |
| `BLP-021` | P3 | `NOT_STARTED` | Test prompt injection, invented metrics, unknown IDs, invalid schemas, provider failure, stale hashes, and rejected-evidence exclusion. | `BLP-018`, `BLP-019`, `BLP-020` |
| `BLP-022` | P4 | `NOT_STARTED` | Add positive supplied-data tests for the Business Cube and every existing specialised map. | `BLP-003`, `BLP-005` |
| `BLP-023` | P4 | `NOT_STARTED` | Complete inspector placement, selection feedback, docking, floating, restoration, mobile linear views, and keyboard behaviour for visual workspaces. | `BLP-022` |
| `BLP-024` | P4 | `NOT_STARTED` | Add evidence-bound, cross-posting organisation synthesis without inferred hierarchy or maturity. | `BLP-003`, `BLP-005` |
| `BLP-025` | P4 | `NOT_STARTED` | Add remaining role-sensitive visual families individually, each with an explicit supplied-data contract and withholding path. | `BLP-002`, `BLP-022` |
| `BLP-026` | P4 | `NOT_STARTED` | Add blueprint trace and reversible explanations for generated or adaptive panels. | `BLP-002`, `BLP-006` |
| `BLP-027` | P5 | `NOT_STARTED` | Pass production Chromium gates against the exact deployed commit. | `BLP-001`, `BLP-002`, `BLP-003`, `BLP-004`, `BLP-005`, `BLP-006`, `BLP-007`, `BLP-008`, `BLP-009`, `BLP-010`, `BLP-011`, `BLP-012`, `BLP-013`, `BLP-014`, `BLP-015`, `BLP-016`, `BLP-017`, `BLP-018`, `BLP-019`, `BLP-020`, `BLP-021`, `BLP-022`, `BLP-023`, `BLP-024`, `BLP-025`, `BLP-026` |
| `BLP-028` | P5 | `NOT_STARTED` | Verify 1440 and 2048 desktop widths and 390 and 430 phone widths, including positive, empty, withheld, error, and stale states. | `BLP-027` |
| `BLP-029` | P5 | `NOT_STARTED` | Perform physical Safari and physical-phone verification against the exact deployed commit. | `BLP-027`, `BLP-028` |
| `BLP-030` | P5 | `NOT_STARTED` | Publish the final completion record with implementation, merge, deployment, automated-runtime, and physical-runtime provenance kept separate. | `BLP-001`, `BLP-002`, `BLP-003`, `BLP-004`, `BLP-005`, `BLP-006`, `BLP-007`, `BLP-008`, `BLP-009`, `BLP-010`, `BLP-011`, `BLP-012`, `BLP-013`, `BLP-014`, `BLP-015`, `BLP-016`, `BLP-017`, `BLP-018`, `BLP-019`, `BLP-020`, `BLP-021`, `BLP-022`, `BLP-023`, `BLP-024`, `BLP-025`, `BLP-026`, `BLP-027`, `BLP-028`, `BLP-029` |

## 9. Target evidence architecture

### 9.1 Canonical records

The first implementation wave must establish these records before feature teams create local substitutes:

| Contract | Responsibility |
|---|---|
| `EvidenceSource` | Identifies an immutable posting, candidate document, taxonomy record, organisation record, or other source and its retrieval context. |
| `EvidenceSpan` | Identifies an exact range or structured field within an `EvidenceSource`; stores no unsupported paraphrase as source text. |
| `ProofRecord` | Connects confirmed candidate evidence to target duties, requirements, skills, competencies, and destinations. |
| `ReviewChange` | Records an append-only proposal, human decision, executed operation, predecessor, reviewer, rationale, and timestamp. |
| `OutputBlock` | Stores a generated or user-edited claim with source references, evidence hash, state, policy result, and provenance. |
| `VisualProfile` | Declares which visual grammar is supported for a role, why it is supported, and which supplied fields it requires. |
| `EvidenceWindow` | Carries published, closing, retrieved, analysed, corpus-range, posting-count, and source-timezone values independently. |

### 9.2 Stable identity

Identifiers are the backbone of the product. At minimum, preserve distinct stable IDs for:

- source and source version;
- posting and employer;
- source row or field;
- evidence span;
- deterministic claim;
- AI proposal;
- reviewer and review change;
- human decision;
- candidate proof;
- output block;
- visual node, cell, and selection;
- runtime verification artefact.

Display labels may change. IDs must not change because a label, sort order, or panel changes. A superseded record remains addressable and points to its successor.

### 9.3 Immutability and invalidation

- Source text is immutable.
- Review history is append-only.
- Rejected, reopened, and superseded states remain in history.
- A changed source, proof, review decision, prompt version, schema version, policy version, or evidence hash invalidates dependent generated output.
- Invalidated output becomes `STALE`; it is not silently regenerated or exported.

### 9.4 Withholding

Missing evidence is a first-class outcome. The system must record a reason such as `WITHHELD_NO_SOURCE_ROWS`, `WITHHELD_NO_CANDIDATE_PROOF`, `WITHHELD_CONFLICTING_EVIDENCE`, `WITHHELD_STALE_EVIDENCE`, or another versioned reason code. A blank panel or fabricated fallback is not an acceptable substitute.

## 10. Candidate proof and review workflow

### 10.1 Candidate-proof flow

```text
Candidate source
  -> exact excerpt selection
  -> immutable EvidenceSpan
  -> ProofRecord
  -> human confirmation
  -> target links
  -> proof state
  -> allowed destinations
  -> review and output eligibility
```

The product may help the user find a passage, but only the exact selected excerpt becomes proof. Raw pasted text must not automatically create a skill, authority, access, outcome, or credential claim.

### 10.2 Proof states

- `DEMONSTRATED`: evidence describes performed work or an observable artefact.
- `CERTIFIED`: evidence references a verifiable qualification or certification.
- `CLAIMED_ONLY`: the user asserts the capability, but no supporting artefact is linked.
- `WITHHELD`: required evidence is absent or deliberately not supplied.
- `CONFLICTING`: accepted evidence and another source disagree.
- `STALE`: evidence or its governing source changed after assessment.

These are evidence states, not confidence-coloured decoration. Each state changes whether a destination is eligible.

### 10.3 Review state model

Review must distinguish:

1. A reviewer **comment**: an observation or question.
2. A reviewer **proposal**: a suggested change that has not occurred.
3. A human **decision**: accept, reject, escalate, resolve, reopen, or undo.
4. An executed **ReviewChange**: an append-only event changing the reviewed representation, never the source.

Every split, merge, relabel, withhold, resolve, reopen, and undo action must retain predecessors and be reproducible from history. "Accept" must not overwrite the original span or delete a rejected alternative.

### 10.4 Output eligibility

A resume or cover-letter claim is eligible only when:

- its target job evidence is accepted and current;
- its candidate proof is confirmed and allowed for that destination;
- all source references exist in the supplied allowlist;
- no referenced evidence is rejected, revoked, conflicting, unconfirmed, or stale;
- deterministic policy validation passes;
- the user has not left an unresolved blocking review state.

## 11. AI and prompt engineering contract

### 11.1 The required architecture

AI generation must follow this sequence:

```text
validated evidence
  -> deterministic eligibility gate
  -> server-owned task prompt
  -> schema-constrained model call
  -> JSON Schema validation
  -> evidence-reference validation
  -> policy validation
  -> proposal state
  -> human action
```

Client code must not own hidden system policy. The server must identify the task, prompt version, schema version, model, evidence hash, policy version, timing, and result state.

### 11.2 No-LLM zones

An LLM must not decide or calculate:

- whether evidence is confirmed;
- taxonomy identity or deterministic crosswalk results;
- AI exposure scores and source counts;
- salary, posting, or applicant counts;
- review decisions and audit history;
- visual topology, cell identity, ordering, or organisation hierarchy;
- process sequence, governance controls, owners, or permissions;
- persistence, export eligibility, or UI rendering state.

### 11.3 Prompt requirements

Each generation task should use:

- a server-owned task ID and prompt version;
- a single explicit purpose;
- untrusted evidence enclosed as data, never as instructions;
- an allowlist of valid source, span, proof, and target IDs;
- a strict output JSON Schema;
- temperature `0` where the provider supports it;
- one bounded repair attempt for invalid JSON or schema only;
- explicit withholding behaviour;
- a prohibition on unsupported facts, numbers, dates, organisations, credentials, outcomes, and relationships;
- a cache key containing task, prompt version, schema version, model, and evidence hash.

### 11.4 Suggested bounded budgets

The current engineering audit recommends starting with these ceilings and changing them only with measured evidence:

| Task | Maximum supplied evidence | Maximum output |
|---|---:|---:|
| Candidate-proof proposal | 12,000 characters | 1,600 tokens |
| Cover-letter proposal | 12,000 characters | 1,400 tokens |
| Track-change proposal | 10,000 characters | 1,600 tokens |
| Map annotation | 10,000 characters | 900 tokens |

The product should summarise or deterministically select evidence before the model boundary, but it must never discard the identifiers required to prove the output.

### 11.5 Hard evaluation gates

- 100% schema validity after the permitted validation process.
- 100% evidence-reference membership in the supplied allowlist.
- Zero unsupported factual sentences.
- Zero invented numbers, dates, organisations, capabilities, relationships, outcomes, or credentials.
- 100% withholding when a negative fixture lacks required evidence.
- Exact exclusion of rejected, revoked, conflicting, unconfirmed, and stale evidence.
- No raw candidate evidence or secrets in logs.
- Equivalent reference and policy behaviour across configured model providers.

An LLM judge may assess wording quality. It may not overrule a deterministic schema, reference, provenance, or policy failure.

## 12. UI, accessibility, and responsive contract

### 12.1 Information hierarchy

- Keep source evidence available while the user inspects a derived claim.
- Put selection feedback next to the selected visual and repeat the selected identity in the inspector.
- Keep inspectors visible beside the workspace when space permits and stack them below on narrow surfaces.
- Use compact, work-focused layouts. Do not allow summary panels such as Curation Overview to crowd out the primary evidence list.
- Wrap role, posting, employer, and inspector titles; do not truncate the only visible identity.
- Prevent the Step 2 to Step 3 analysis surface from hiding behind the persistent top banner.
- Preserve a waiting state after role submission so network work is visible and distinct from empty or failed results.
- When one posting source returns a valid zero, collapse or compress its empty lane without hiding the source outcome or the other source.

### 12.2 Business Cube

- The cube is an evidence matrix, not a decorative neural network.
- Exactly 27 function-work-decision cells remain addressable.
- Drag and keyboard rotation must work.
- Selection made before WebGL initialisation must be replayed after initialisation.
- Matrix, cube, selection strip, and inspector share one selected-cell state.
- Withheld cells remain selectable and explain why evidence is absent.
- Provide a linear, keyboard-readable alternative to the 3D surface.
- Announce selection once through one polite live region.

### 12.3 Accessibility

- Interactive controls should meet a 44 x 44 CSS-pixel target where the layout permits.
- Every interaction must be keyboard reachable with a visible focus indicator.
- Closing dialogs, sheets, and inspectors restores focus to the triggering control.
- State cannot be communicated by colour alone; use text, icon, shape, or stroke as a second cue.
- Meet WCAG AA text contrast.
- Honour reduced-motion preferences.
- Canvas or WebGL content must have an equivalent linear representation.

### 12.4 Required widths

The release matrix must include:

- Desktop: `1440` pixels wide.
- Wide desktop: `2048` pixels wide.
- Phone: `390` pixels wide.
- Large phone: `430` pixels wide.

At each applicable width, verify positive, empty, withheld, error, and stale states. No title, toolbar, card, inspector, dialog, sheet, footer, output, or close control may overlap or become unreachable.

## 13. Failure states and recovery

### 13.1 Canonical user-visible states

Use distinct states and language. Do not collapse them into a spinner or blank area.

| State | Meaning | Required UI and recovery |
|---|---|---|
| `LOADING` | Work is still in progress | Show the operation and source currently being processed; preserve layout; allow safe cancellation when possible |
| `EMPTY` | The request succeeded and returned no qualifying records | Say what is empty; retain filters and alternate source results; offer a clear next action |
| `WITHHELD` | A claim cannot be made because required evidence is missing | Name the missing evidence and consequence; do not generate a substitute |
| `UNAVAILABLE` | The visual or function is recognised but not implemented in this build | Name the unavailable item; do not silently remap it to another view |
| `ERROR` | The operation failed | Keep user evidence and edits unchanged; show retry or recovery; do not expose raw provider errors |
| `STALE` | A source, proof, decision, prompt, schema, or policy changed after derivation | Block dependent export; identify what changed; require review or regeneration |
| `CONFLICTING` | Accepted evidence disagrees | Show both positions and source links; require a human resolution or explicit withholding |
| `BLOCKED` | A required dependency or decision prevents progress | Name the predecessor, owner, and next action |

### 13.2 Approved wording examples

```text
EMPTY - No candidate proof has been added yet.
WITHHELD - No confirmed candidate evidence supports this claim.
UNAVAILABLE - This visual is recognised but is not available in this build.
ERROR - The draft could not be generated. Your evidence and edits are unchanged.
STALE - Source or proof changed after this output was generated.
```

### 13.3 Source-specific failure behaviour

- One source failure must not blank valid results from another source.
- A valid zero from MyCareersFuture is not a Careers@Gov failure.
- An SSOC classifier failure must not erase source postings.
- A provider failure must not mutate accepted evidence or review history.
- An unavailable physical test must remain unverified; it must not be replaced by emulation.
- Raw provider billing, quota, stack, or secret-bearing errors must not reach visitors.

## 14. Testing and evaluation

### 14.1 Test layers

| Layer | Purpose | Typical evidence |
|---|---|---|
| Contract | Validate schemas, IDs, dependencies, protected scope, and provenance | Deterministic Node test output |
| Unit/data | Validate builders, state transitions, selectors, and withholding | Named fixtures and exact assertions |
| Integration | Validate handoffs among Step 2, Step 3, review, proof, and output | Source-bearing fixture journey |
| Browser | Validate rendered UI, geometry, keyboard, focus, and state | Chromium route, viewport, assertion IDs, screenshot |
| Accessibility | Validate semantics, focus order, live regions, and non-colour cues | Automated checks plus keyboard trace |
| Adversarial AI | Validate injection resistance, schema, IDs, unsupported claims, stale hashes, and provider failure | Deterministic fixtures and policy results |
| Production runtime | Validate the deployed origin against the exact commit | Deployment record plus automated runtime evidence |
| Physical runtime | Validate actual Safari and phone behaviour | Device, OS, browser, orientation, timestamp, exact commit |

### 14.2 Existing executable references

- [`feature-map-contract.mjs`](../tests/feature-map-contract.mjs): map schema, references, asset integrity, provenance, and protected scope.
- [`blueprint-completion-contract.mjs`](../tests/blueprint-completion-contract.mjs): exactly 30 requirements, schema execution, exact dependencies, lifecycle, evidence, supervisor authority, completion policy, and final attestation.
- [`browser-gate.mjs`](../tests/browser-gate.mjs): Step 3 shell, graphs, maps, withholding, print, and return paths.
- [`company-flow-browser.mjs`](../tests/company-flow-browser.mjs): company path and Business Cube behaviour.
- [`step2-feature-map-browser.mjs`](../tests/step2-feature-map-browser.mjs): Step 2 responsive and state behaviour.
- [`audit-integrity-contract.mjs`](../tests/audit-integrity-contract.mjs): cross-audit source and invariant checks.
- [`business-cube-contract.mjs`](../tests/business-cube-contract.mjs): Business Cube data contract.
- [`device-profile-contract.mjs`](../tests/device-profile-contract.mjs): responsive device-profile rules.

### 14.3 Required evidence format

Every accepted test artefact should name:

- requirement ID;
- exact 40-character commit SHA;
- command or suite identity;
- fixture identity;
- environment;
- browser or device;
- viewport or orientation when applicable;
- timestamp;
- pass or failure result;
- retained artefact path or URL.

## 15. Provenance and release evidence

### 15.1 Five records that must never be collapsed

| Record | What it proves | What it does not prove |
|---|---|---|
| `implementationCommit` | The code or documentation exists on a named branch at an exact SHA | That it was reviewed, merged, deployed, or exercised |
| `mergeCommit` | A pull request was merged into the target branch at an exact SHA | That the deployment succeeded or runtime works |
| `deploymentStatus` | A provider associated an environment and deployment with an exact commit | That the user workflow passed |
| `automatedRuntimeVerification` | A named automated suite passed against a named runtime and exact commit | That a person used a physical device |
| `physicalRuntimeVerification` | A named physical device, OS, browser, and orientation passed against the exact deployed commit | That unrelated devices or future commits pass |

A compare URL or `/pull/new/` URL is not a pull request. A preview deployment is not production. An abbreviated SHA is not sufficient. A deployment badge is not a runtime test.

### 15.2 Final attestation

`BLP-030` may become complete only after `BLP-001` through `BLP-029` are complete. The Blueprint Supervisor must publish an immutable GitHub release attestation that:

1. names the already merged and deployed `BLP-029` subject commit;
2. records implementation, merge, deployment, automated-runtime, and physical-runtime evidence separately;
3. includes the SHA-256 hash of the attested register payload;
4. names approved omissions without representing them as complete;
5. is mirrored by the in-repository register without changing the attested subject commit.

## 16. Agent operating model

### 16.1 Maximum effective team

Use no more than four agents in one implementation wave unless the user explicitly requests otherwise:

1. **Contract and data agent:** canonical records, IDs, validators, state machines, persistence, and migrations.
2. **Product UI agent:** workflows, responsive composition, inspectors, selection, accessibility, and failure states.
3. **Test and evaluation agent:** fixtures, contract tests, browser tests, accessibility, adversarial evaluation, and release evidence.
4. **Blueprint Supervisor:** dependency control, scope review, evidence approval, status transitions, and final reconciliation.

Builders do not approve their own completion. The Supervisor should remain read-only during implementation and inspect artefacts directly.

### 16.2 Required context for every agent

Every task prompt must include:

- exact `BLP-*` IDs and canonical requirement text;
- baseline branch and exact commit;
- allowed files and prohibited files;
- predecessors and their approved statuses;
- relevant canonical contracts;
- positive, empty, withheld, error, stale, and adversarial states;
- exact tests to add or run;
- evidence return format;
- the ten protected scopes;
- a statement that the agent may propose, but not approve, a register transition.

### 16.3 Standard agent return

Agents must use the exact return headings in [Section 12 of the canonical instructions](./V3-Blueprint-Completion-Instructions.md#12-per-agent-return-format). Missing work is reported as `NONE` or `NOT_CHECKED`, never implied.

## 17. Recommended delivery sequence

### Wave 0: merge the governance package

1. Merge the completion instructions, register, schema, contract test, guide, and master-index links as documentation and governance work. Done in `ad69d8b48d5686a08fea5d968e695a1362430702`.
2. Amend the instructions and the contract test so that a requirement whose policy does not require automated runtime may move `IMPLEMENTED_UNVERIFIED -> COMPLETE` directly, gated on that policy flag, and correct the `BLP-001` deployment provenance resting state and note.
3. Complete Blueprint Supervisor review and approval of merged PR #486 for `BLP-001`, recording the approval in the register and regenerating this guide.
4. Confirm Step 1, Step 2 behaviour, `v3/`, and Railway configuration remain unchanged.

### Wave 1: P0 truth foundation

1. `BLP-002`: canonical contracts.
2. `BLP-003`: stable identity propagation.
3. `BLP-004`: evidence windows.
4. `BLP-006`: reviewer roster and vocabulary.
5. `BLP-005`: positive and negative cross-surface tests.

Do not begin resume or cover-letter generation before this gate passes.

### Wave 2: P1 candidate proof

Implement `BLP-007` through `BLP-011` in dependency order, then verify the complete responsive and keyboard journey in `BLP-012`.

### Wave 3: P2 review state

Implement the full review action vocabulary and append-only history in `BLP-013` through `BLP-015`, then prove overlap, stale, rejected, escalation, withholding, undo, and restoration in `BLP-016`.

### Wave 4: P3 outputs

Build the resume workbench and server generation boundary in parallel only after their predecessors pass. Add the evidence-gated cover letter, export blocking, and adversarial suite. Do not restore earlier cover-letter UI without the accepted-evidence contract.

### Wave 5: P4 visual and organisation completion

First add positive tests for existing maps and the cube. Then complete shared inspector/mobile/keyboard behaviour. Only afterward add cross-posting synthesis or a new visual family. Declare which optional visual families belong to the milestone before seeking approval.

### Wave 6: P5 release

1. Merge the final in-scope code.
2. Record the exact deployment commit.
3. Run production Chromium against that exact commit.
4. Run the full width and state matrix.
5. Perform physical Safari and phone verification.
6. Publish the immutable final release attestation and register hash.

## 18. New contributor start procedure

### 18.1 Read in this order

1. This guide.
2. [V3 blueprint](../goal/v3-blueprint.md).
3. [Canonical completion instructions](./V3-Blueprint-Completion-Instructions.md).
4. [Master Feature Map](./V3-Agent-Readable-Feature-Map-Index.html).
5. [Blueprint component cross-reference](../script/v3.1-blueprint-component-cross-reference.md).
6. The register record for the assigned `BLP-*` ID.
7. The affected source files and tests named by that record.

### 18.2 Establish the baseline

```bash
git fetch origin
git switch main
git pull --ff-only
git switch -c codex/<short-purpose>-<yyyymmdd>
git status --short --branch
```

Do not use an old branch as the basis for a new requirement. Do not repair unrelated working-tree changes. Confirm the exact baseline SHA in the register and task prompt.

### 18.3 Install and run the local gates

The package requires Node `22.x`. From `v3.1/`:

```bash
npm ci
npm run build
node tests/blueprint-completion-contract.mjs
node tests/feature-map-contract.mjs --strict-scope
node tests/audit-integrity-contract.mjs
```

Run the narrower affected tests first, then the broader browser gates when the change reaches a rendered or shared behaviour surface.

### 18.4 Before editing

- Verify predecessor status in the register.
- Identify the canonical data contract and stable IDs.
- Write positive and failure fixtures before or with implementation.
- Define how missing, conflicting, and stale evidence behaves.
- Define the desktop, phone, keyboard, and focus path.
- Confirm the allowed file list and protected scopes.

### 18.5 Before requesting review

- Run formatting and diff checks.
- Run affected contract and browser tests.
- Record exact commit and artefact identities.
- Update only the relevant register record and append status history.
- Propose a transition; do not self-approve it.
- Have the Blueprint Supervisor review the diff and evidence.

## 19. Definition of done

A requirement is not done because code compiles or a screenshot looks correct. It may become `COMPLETE` only when all applicable conditions hold:

- all predecessors are `COMPLETE`;
- canonical requirement and protected scope are satisfied;
- source and evidence IDs remain stable and addressable;
- deterministic, AI-assisted, and human provenance remain separate;
- missing or unsupported evidence is explicitly withheld;
- required contract, unit, integration, browser, accessibility, evaluation, and regression tests pass;
- positive, empty, withheld, error, and stale states are verified where applicable;
- desktop and phone behaviour pass for user-facing work;
- implementation and merge commits are separate exact SHAs;
- deployment, automated-runtime, and physical-runtime evidence, where `completionPolicy` requires them, identify the exact same release commit;
- no unresolved P0 or P1 regression exists;
- status history is valid and append-only;
- the Blueprint Supervisor records approval with evidence.

For the full programme, completion additionally requires all 30 canonical records, all included P0-P4 work, P5 runtime evidence, approved omissions represented honestly, and the final external release attestation.

## 20. Known approval gate and immediate next action

### 20.1 Current approval gate

PR [#486](https://github.com/ang-kl/2026-0313_AI-JS/pull/486) merged the provenance-only implementation commit `bf6c2ab7b8f97151370e9a822406988a1d4b04c0` into `main` as `ffc9dea8c6aaa5945fdd06778571e8cca8923097` on 2026-09-07. On 2026-09-08 the Blueprint Supervisor verified the implementation commit against its four declared files, confirmed the squash merge is content-identical by blob SHA over the same base, confirmed no protected path changed, and approved `BLP-001` as `COMPLETE` at 11:15 SGT. The approval, its evidence links and its policy justification are recorded in the register's `statusHistory` and `supervisorApproval` for `BLP-001`.

### 20.2 Immediate next action

1. `BLP-013` is the next requirement to build. It starts, as every requirement from `BLP-012` onward does, with a Blueprint Supervisor scope ruling **before** any code, and the material PR #508 left on `main` at `61531dc` is undeclared scaffolding a build may adopt or discard, never provenance.
2. Five coverage statements are open with the Human Lead, none blocking `BLP-013`. They are kept together deliberately, because a reader deciding how far to trust this programme is helped more by their number than by any one of them, and because each is ground that no check covers and no rule claims. (i) `wu-open-print-package` is owned by no canonical requirement. (ii) This guide's own build is owned by none either, which is what let its HTML go stale in the #511 arc. (iii) Re-link, declare conflict and resolve conflict are unwired and unmeasured, owned by `BLP-009` and `BLP-010`; if no future requirement will drive them, that is a gap in the same terms. (iv) The gate's register-scope step is gated on a `codex/` branch-name prefix, so no run of this programme's own branch family has ever executed it or can - across all twelve completed requirements. That contaminates no approval, because these branches legitimately carry code and register edits together so the step would have failed correctly-shaped pull requests, and `blueprint-completion-contract.mjs` ran and passed every time; it is uncovered ground, not a failed guard, and whether a rule should exist for non-`codex` branches needs its own scope ruling. (v) **No check in this programme reads prose, and the record is mostly prose.** That is the largest uncovered surface here. It is not a defect to automate away - the Blueprint Supervisor has twice ruled against automating prose equality - but it is stated at its true size rather than discovered again at the next instance, which is what happened at 6.8, at 6.9, and at the correction those two prompted.
3. Run the completion contract, strict Feature Map contract, integrity contract, and build against the reconciled register.
4. `BLP-002` was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 (contracts 1.0.3, merge commit `0a0ce553e53c234dc9f4efb2e4791917f35702dc`). `BLP-003` was approved `COMPLETE` on 2026-09-08 at 15:32 SGT: implementation `4020d3c` (PR #490, merge `25cff53`) revised in place at `6750323` (PR #491, merge `98a99d7a69a9b26dead660b7c4b7c231ee0d28a5`) after the Blueprint Supervisor upheld two automated review findings and withdrew its draft approval; the round trip runs at 1440x1000 and 430x932 (216 checks) with proposal ids and comment anchors byte-identical across remount and widths, the phone-width return-button defect is fixed, and the automated-runtime evidence is the dispatch run on `98a99d7`. Six known omissions are recorded on the record (retrievedAt, owner BLP-004; the stale `-s0` assertion at `tests/browser-gate.mjs:576`, owner BLP-005; the Duties-tab-only withheld strip; the device-local `links` scope; candidate-proof identifiers, owner BLP-007; output identifiers, owner BLP-018) plus the completeness residual risk and a BLP-013 note. `BLP-004` was approved `COMPLETE` on 2026-09-08 at 17:24 SGT: route commit `431a7a7` and implementation commit `cd75686` (PR #493, merge `384db4c0dec8d1f078c353a914f40ebebce3d0e4`), contract 1.0.4 with a backward-compatible per-field day-precision marker so `BLP-002` stays `COMPLETE` with a note, `tests/evidence-window.mjs` 146 checks and the unchanged `tests/evidence-round-trip.mjs` 216 checks on the dispatch run at `384db4c` at both viewports. Conformance-auditor and a11y-honesty-reviewer passed; their four warnings and two flags were fixed before merge, one a real defect (the posting export stamped the export click as `retrievedAt`). Known omissions recorded: careers.js derived ISO `postedDate`, `sourceTimezone` withheld everywhere, per-panel `Time-window:` scope lines, middle-dot footer phrase, OKF export timestamp, `Time-window` label carrying two senses, withheld tone as a literal, `APP_VERSION` minor bump reserved to the Human Lead. `BLP-006` was approved `COMPLETE` on 2026-09-08 at 19:45 SGT: implementation commit `b672a1b` (PR #496, merge `1dacc67b08f0b46bb47cce82f8d0f226fabc33a5`), roster 1.0.0 over contract 1.1.0, `tests/reviewer-contract.mjs` 61 + 120 and the unchanged BLP-003 and BLP-004 suites on the dispatch run at `1dacc67` at both viewports; the conformance auditor's block on a builder-introduced defect and the DEFAULT_PERSONA attribution fix are on the record with the known omissions owned by BLP-013 and BLP-015. `BLP-005` was approved `COMPLETE` on 2026-09-08 at 20:20 SGT: implementation commit `6a75e9f` (PR #497, merge `c703d9c1a97a9b8bdc62b8a9657dd8b4a3d40b4e`), adapter 1.1.0, `tests/evidence-failure-paths.mjs` 113 + 160 and the unchanged BLP-003, BLP-004 and BLP-006 suites on the dispatch run at `c703d9c` at both viewports; the three Q1 product changes, the defect the suite found, the Supervisor's corrected reading, the escalations and the known omissions are on the record. The P0 gate is closed. `BLP-007` was approved `COMPLETE` on 2026-09-08 at 21:43 SGT: implementation commit `5ee2f71` (PR #498, merge `15a20c650e306b89dd11baa7b09fda3bd7714f3d`), `tests/person-evidence-contract.mjs` 65 and `tests/person-evidence-excerpts.mjs` 104 with the BLP-003 to BLP-006 suites unchanged on the dispatch run at `15a20c6` at both viewports; the Supervisor's rulings, the P0 gate note, the no-proof-until-marked option for the Human Lead and the known omissions are on the record. `BLP-008` was approved `COMPLETE` on 2026-09-08 at 22:34 SGT: implementation commit `86e4320` (PR #500, merge `c3923af48f687d91b42ea5a46139d7273a01c424`), `tests/candidate-proof-ledger.mjs` 103 node checks and 184 in Chromium with the BLP-003 to BLP-007 suites unchanged on the dispatch run at `c3923af` at both viewports; the Supervisor's seven rulings, the proof-type vocabulary escalated to the Human Lead as provisional, the two CI failures the PR met (a feature-map locator drift and a notice read that raced the runner), the Supervisor's finding that the first race fix could not fail, the corrected diff-scope claims and the known omissions are on the record. `BLP-009` was approved `COMPLETE` on 2026-09-08 at 23:33 SGT: implementation commit `592db34` (PR #502, merge `f1d94e91ac03905301b2eb1664e91d8832c28644`; the early merge `e6b3af3` of PR #501 carried `ff4c7c0` to main from 15:04:05Z until the corrective merge and is recorded without approval), `tests/proof-links.mjs` 159 node checks and 224 in Chromium with the BLP-003 to BLP-008 suites unchanged on the dispatch run at `f1d94e9` at both viewports; the Supervisor's six rulings, the withheld kinds with their owners, the re-audit rulings C-a, C-b, W-a and W-b with their seven follow-on fixes, the boundary defect the Supervisor found at `ff4c7c0` and its window on main, the LEDGER_VERSION 1.1.0 bump for the Human Lead and the known omissions are on the record. `BLP-010` was approved `COMPLETE` on 2026-09-09 at 00:20 SGT: implementation commit `baf8700` (PR #504, merge `967a8ff3a702beb6df383a790b0114fb71951e76`; `06ef237` and `9610332` superseded and kept as evidence), `tests/proof-states.mjs` 167 node checks and 242 in Chromium with the BLP-002 to BLP-009 suites unchanged on the dispatch run at `967a8ff` at both viewports; the Supervisor's seven rulings, the state meanings sourced from `v3.1/script/v3-result-engine-spec.md` lines 185 and 183, the three conformance passes with their five defects found before any commit, the gate's phone-width race and the two defects its fix exposed, the a11y review, the LEDGER_VERSION 1.2.0 and ADAPTER_VERSION 1.2.0 bumps for the Human Lead, the browser-side TARGET_LINK omission with its reason and owner, and the BLP-009 note are on the record. `BLP-011` was approved `COMPLETE` on 2026-09-18 at 11:57 SGT: implementation commit `6ce3a69` (PR #506, merge `8c0aaa03a044cf274f9a8d601f7ba682177d7169`, merged 2026-09-16 outside the coordinating session; post-merge corrections `0e7aecc` by PR #507 appended), `tests/proof-destinations.mjs` 135 node checks and 238 in Chromium with the BLP-002 to BLP-010 suites unchanged on the dispatch run on main at `8c0aaa0` at both viewports; the Supervisor's ten rulings, the conformance and a11y audits, the LEDGER_VERSION 1.3.0 and ADAPTER_VERSION 1.3.0 bumps for the Human Lead, the authorised two-line touch of the protected legacy studio, the pre-existing single-print-opening omission with its owner, and the BLP-010 note are on the record. Code for `BLP-012` through `BLP-028` was merged and deployed by PR #508 (`61531dc`) on 2026-09-16 with no register record; those requirements stayed `NOT_STARTED` on this register until the Blueprint Supervisor ruled on their scope and status, and `BLP-012` has since been built and recorded on its own evidence (below). The rest stand at `NOT_STARTED`. On 2026-09-18 the Blueprint Supervisor ruled on #508 (section 6.6): `BLP-012` through `BLP-028` stay `NOT_STARTED`, the three defects are fixed at `50690c1`, and every build from `BLP-012` onward starts with a scope ruling before code. Those three fixes and the record of the rulings merged as `37d51b8` (PR #510) on 2026-09-18, verified by the Supervisor on gate run 105 with the merge tree, blob identity across all twelve changed files and the hash chain re-derived on `main`. `BLP-012` is `IN_PROGRESS` as of 2026-09-18: the end-to-end continuity suite `tests/candidate-proof-workflow.mjs` is implemented at `c15b470` and its audit findings closed at `66c65ff`, 908 checks across the four BLP028 widths, with the gate list now at 35 listed suites and green locally. It is **not** `IMPLEMENTED_UNVERIFIED`, on the Supervisor's ruling: acceptance criterion (ii) requires that keyboard operation and focus restoration **pass**, not that they are tested, and the suite measured seven ledger controls dropping keyboard focus to the document body at both `1440x1000` and `390x844` - declare demonstrated, declare certified, approve destination, revoke destination, withdraw declaration, unlink and open print package. Two paths are sound and are asserted: saving a claim moves focus to the announced claim state, and closing the print package restores focus to its opener. `BLP-012` cannot reach `COMPLETE` until the fix lands and the suite asserts the seven; the fix is scoped as its own change under its own ruling rather than widening a verification requirement into product work. `affectedFiles` was amended by Supervisor ruling with the reasoning recorded, both declared test files retained as unchanged, and `src/work-universe/CandidateProofLedger.jsx` is declared but unchanged at blob `ed8d9d9`, so this requirement's approval must not be read as verifying the undeclared material that file still carries from `61531dc`. On 2026-09-18 the focus defect was fixed at `44543bc` and `BLP-012` moved to `IMPLEMENTED_UNVERIFIED`: focus now goes to the successor control in every case - declaring moves to withdraw, withdrawing to declare, approving to revoke on the same destination row and revoking back, unlinking to the link chooser, and opening the print package to the overlay's heading - with the suite asserting each by name across four widths at 972 checks, and both halves of the fix falsified against the product. The fix's own first attempt at the print overlay measured no better than the defect, because that component stays mounted and returns `null` until opened so a mount-only effect fired while the heading did not exist; it was found by running the probe against the fix rather than by reading it. Six controls carry notes on `BLP-009`, `BLP-010` and `BLP-011`, cited to the commits that introduced them (`ff4c7c0`, `06ef237`, `6ce3a69`) rather than to the squashes that carried them, because `git log -S` over a path prunes the merge parents this branch's reconciliation merges create and names the squash unless `--full-history` is used; that trap misled both the Supervisor and the coordinating session, and three of five citations were wrong before it was caught. The seventh control, `wu-open-print-package`, belongs to no canonical requirement: it was introduced at `72c0a58` on 2026-08-26, about two weeks before those requirements existed, so its note sits on `BLP-012` and **the ownership gap is escalated to the Human Lead as a fact about the register's coverage.** The reopen test on all three completed requirements comes back unchanged and is recorded as such. `BLP-012` was then approved `COMPLETE` on 2026-09-18 at 19:58 SGT on gate run 110, a `workflow_dispatch` on `main` at the merge commit `8642b22`: 988 checks across four widths, with `proof-links` 160/301, `proof-states` 167/242 and `proof-destinations` 135/268 unchanged against run 106, so nothing reopens. `implementationCommit` was repointed from `44543bc` to `ba3216a` in the approval record, because run 110 verified `ba3216a`'s tree while the register named a different commit; `44543bc` is kept as superseded evidence and the count moved `972 -> 988` between them. Four record corrections rode in the approval commit on the Supervisor's condition: the invented `metadata.updatedAt` of `2026-09-18T23:55:00+08:00`, which #513 had listed among its corrections and did not correct; the repointed implementation commit; the unpinned `972` in `BLOCKER-02`'s evidence label; and the merge commit, without which the contract refuses the `verifiedCommit`. The three unwired ledger controls and the unmeasured `cpl-offer-again` ride on the record as named omissions with owners. The Supervisor states what it did **not** check: it did not open the evidence artefact, did not execute any suite or contract, and did not verify `bcb1452` when it landed.

### 20.3 Tooling note

The local Vercel CLI observed during this work is `51.2.1`, while `59.11.7` is available. This is maintenance work, not a blueprint completion blocker and not permission to change deployment configuration. Upgrade separately with `npm i -g vercel@latest` or `pnpm add -g vercel@latest` before future Vercel administration.

## 21. Reference index

### 21.1 Normative repository references

| Ref | Document or artefact | Purpose |
|---|---|---|
| `REP-01` | [V3 blueprint](../goal/v3-blueprint.md) | Product purpose, ethos, work-intelligence model, and desired outcomes |
| `REP-02` | [V3 UI blueprint](../goal/v3-ui-blueprint.md) | UI composition and interaction intent |
| `REP-03` | [Blueprint component cross-reference](../script/v3.1-blueprint-component-cross-reference.md) | Built, wired, partial, parked, and withheld product ledger |
| `REP-04` | [Completion instructions](./V3-Blueprint-Completion-Instructions.md) | Normative 30-item operating contract |
| `REP-05` | [Completion register](./v3-blueprint-completion-register.json) | Current machine-readable statuses, dependencies, blockers, owners, and provenance |
| `REP-06` | [Completion register schema](./v3-blueprint-completion-register.schema.json) | Structural and conditional validation rules |
| `REP-07` | [Completion contract test](../tests/blueprint-completion-contract.mjs) | Executable enforcement of schema, IDs, dependencies, lifecycle, policy, and attestation |
| `REP-08` | [Master Feature Map HTML](./V3-Agent-Readable-Feature-Map-Index.html) | Human-readable journey index |
| `REP-09` | [Master Feature Map JSON](./v3-feature-map-index.json) | Agent-readable map links and provenance |
| `REP-10` | [Step 1a map](./V3-Step1a-Agent-Readable-Feature-Map.html) | Step 1a behaviour and evidence |
| `REP-11` | [Step 2 map](./V3-Step2-Agent-Readable-Feature-Map.html) | Step 2 behaviour, handoff, states, and provenance |
| `REP-12` | [Step 3 map](./V3-Step3-Agent-Readable-Feature-Map.html) | Work Universe, review, cube, maps, and known gaps |
| `REP-13` | [CI workflow](../../.github/workflows/v31-browser-gate.yml) | Build, contract, and browser gates |

### 21.2 Primary implementation references

| Surface | Primary source |
|---|---|
| Application, Step 1, Step 2, and analysis routing | [`src/App.jsx`](../src/App.jsx) |
| Work Universe shell and projection | [`src/work-universe/WorkUniverseLanding.jsx`](../src/work-universe/WorkUniverseLanding.jsx) |
| R3F presentation layer | [`src/work-universe/WorkUniverseScene.jsx`](../src/work-universe/WorkUniverseScene.jsx) |
| Business Cube | [`src/BusinessRubiksCube.jsx`](../src/BusinessRubiksCube.jsx) |
| Review workspace | [`src/ReviewStudioLegacy.jsx`](../src/ReviewStudioLegacy.jsx) |
| Candidate evidence ingress | [`src/work-universe/PersonEvidenceIngress.jsx`](../src/work-universe/PersonEvidenceIngress.jsx) |
| Candidate evidence rules | [`src/work-universe/personEvidenceData.js`](../src/work-universe/personEvidenceData.js) |
| Role-sensitive visuals | [`src/work-universe/occupationVisualProfileData.js`](../src/work-universe/occupationVisualProfileData.js) |
| Clean and Full Review output | [`src/review/PrintPackage.jsx`](../src/review/PrintPackage.jsx) |
| Review shortcuts | [`src/review/windows/Shortcuts.jsx`](../src/review/windows/Shortcuts.jsx) |
| Model provider route | [`api/claude.js`](../api/claude.js) |
| Deterministic analysis engine | [`api/engine.js`](../api/engine.js) |

### 21.3 Git history references

- [PR #475: Step 1a map and mobile layout](https://github.com/ang-kl/2026-0313_AI-JS/pull/475)
- [PR #484: Step 2 and Business Cube audit corrections](https://github.com/ang-kl/2026-0313_AI-JS/pull/484)
- [PR #485: compact Step 2 desktop filters](https://github.com/ang-kl/2026-0313_AI-JS/pull/485)
- [PR #486: Step 2 post-merge provenance](https://github.com/ang-kl/2026-0313_AI-JS/pull/486)
- [Baseline commit `990a83a870f41253ebcc9125d9cee011cb5a56b6`](https://github.com/ang-kl/2026-0313_AI-JS/commit/990a83a870f41253ebcc9125d9cee011cb5a56b6)
- [Current main commit `ffc9dea8c6aaa5945fdd06778571e8cca8923097`](https://github.com/ang-kl/2026-0313_AI-JS/commit/ffc9dea8c6aaa5945fdd06778571e8cca8923097)

### 21.4 External domain sources

These sources define taxonomies or measures used by the product. They do not prove product correctness; repository tests and provenance do that. All external links and time-sensitive labels in this table were reviewed on **2026-09-07**.

| Ref | Source | Use and boundary |
|---|---|---|
| `EXT-01` | [European Commission ESCO classification](https://esco.ec.europa.eu/en/classification) | Occupation, skill, and competence concepts and relationships. The portal reports ESCO v1.2.1 as the current version at the time of this guide. |
| `EXT-02` | [Singapore Department of Statistics, SSOC 2024](https://www.singstat.gov.sg/standards/standards-and-classifications/ssoc) | National occupational classification. A suggested classification remains deterministic or inferred metadata, not source-posting evidence. |
| `EXT-03` | [SkillsFuture Skills Framework FAQ](https://www.skillsfuture.gov.sg/skills-framework/skills-frameworks-faq) | Singapore sector, occupation, job-role, skill, competency, and career-development context. It does not guarantee a job, salary, or promotion. |
| `EXT-04` | [MyCareersFuture](https://www.mycareersfuture.gov.sg/) | Private-sector posting source used by the application. Source availability and completeness must be reported honestly. |
| `EXT-05` | [Careers@Gov](https://www.careers.gov.sg/) | Singapore Public Service posting source used by the application. Its rows remain source-distinct from MyCareersFuture rows. |
| `EXT-06` | [Felten, Raj, and Seamans (2021), AIOE](https://doi.org/10.1002/smj.3286) | Research basis for occupational AI-exposure measurement. Exposure is not a verdict about automation, employability, or an individual worker. |
| `EXT-07` | [Felten, Raj, and Seamans (2018), occupational abilities method](https://doi.org/10.1257/pandp.20181021) | Method linking AI advances to occupational abilities. Product narratives must preserve the distinction between the measure and current capability claims. |

### 21.5 Source currency rule

Taxonomies, job portals, AI-capability evidence, and deployment tooling can change. Record the version and retrieval date used by a release. Do not silently reinterpret old outputs using a newer taxonomy or model. Re-run affected contracts and mark dependent outputs stale when the governing source changes.

## 22. Glossary

| Term | Meaning in this project |
|---|---|
| Agent-readable | Structured enough for software or another agent to locate IDs, contracts, states, dependencies, and evidence without interpreting prose alone |
| AI Moments | Organisation view that turns posting evidence into bounded candidate agent opportunities; displayed through Cards or the Business Cube |
| AIOE | AI Occupational Exposure measure; an occupational exposure signal, not an automation verdict |
| Business Cube | A 3 x 3 x 3 evidence matrix across function, work, and decision dimensions |
| Blueprint Supervisor | The only role allowed to approve controlled verification and completion transitions |
| Candidate proof | Exact confirmed candidate evidence linked to a target and an allowed destination |
| Deterministic | Repeatable output from explicit data and rules without model interpretation |
| Evidence round trip | Navigation from source evidence to a derived view and back to the same source context with IDs preserved |
| Evidence window | Independent source and analysis timing fields, including corpus boundaries and timezone |
| Feature Map | Human- and agent-readable description of screens, components, states, transitions, payload fields, invariants, evidence, and gaps |
| Five canonical graphs | Labour, Organisation Work, Intelligence, Human-Agent, and Transition graphs |
| O-I-A | Observation, Interpretation, Action analysis grammar |
| Provenance | Evidence of where a value or release state came from; not one generic verified flag |
| ReviewChange | Append-only record of a proposed or executed review operation over an immutable source |
| Source-bearing | Retains source identity and the IDs required to trace a derived claim back to its origin |
| Three signals | The three first-order claims rendered inside each canonical Work Universe graph |
| Withheld | Explicit refusal to claim a value because required evidence is absent, conflicting, rejected, or stale |

---

**Operating rule:** when this guide and a machine-readable contract disagree, stop and reconcile the discrepancy. Do not pick the interpretation that makes a requirement look more complete. The canonical instructions, register schema, executable contract, exact repository state, and reviewed evidence control the completion claim.
