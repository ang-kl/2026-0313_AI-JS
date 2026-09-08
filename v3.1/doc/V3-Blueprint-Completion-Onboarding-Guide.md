# V3.1 Blueprint Completion: Onboarding and Delivery Guide

**Document ID:** `GUIDE-V3-BLUEPRINT-COMPLETION-001`  
**Version:** 1.0.14  
**Prepared:** 2026-09-08 (SGT)  
**Repository:** [`ang-kl/2026-0313_AI-JS`](https://github.com/ang-kl/2026-0313_AI-JS)  
**Product surface:** [`https://v3.takearoundabout.com`](https://v3.takearoundabout.com)  
**Canonical baseline:** `990a83a870f41253ebcc9125d9cee011cb5a56b6` (`origin/main`)  
**Current main observed:** `c703d9c1a97a9b8bdc62b8a9657dd8b4a3d40b4e` (`test(v3.1): BLP-005 failure-path and reference-integrity tests; BLP-006 approved COMPLETE (#497)`)  
**Completion programme:** `V3-BLUEPRINT-COMPLETION-REGISTER-001`  
**Register snapshot SHA-256:** `1cfc24323db9c399509a9ccb36dd1aa0ae39e13eab99de6cf334c4033a7489d5`  
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

- `6` requirements approved as `COMPLETE`: `BLP-001` through `BLP-006`; the P0 gate is closed.
- `24` requirements `NOT_STARTED`: `BLP-007` through `BLP-030`.
- `0` requirements `IN_PROGRESS`, `IMPLEMENTED_UNVERIFIED`, `BLOCKED` or `WITHHELD`.

This does not erase completed product work. It means the existing work must be reconciled against the new canonical contracts and evidence gates before it can satisfy a `BLP-*` completion claim.

The Blueprint Supervisor reviewed PR #486 and its exact merge commit on 2026-09-08 and approved `BLP-001` as `COMPLETE`; the approval evidence is recorded in the register. `BLP-002`, the shared evidence contracts, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at contract 1.0.3. `BLP-003`, stable evidence identifiers, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 15:32 SGT (implementation `4020d3c` merged as `25cff53` by PR #490, revision `6750323` merged as `98a99d7` by PR #491, automated-runtime evidence on `98a99d7` at desktop and phone width). A first approval was drafted and withdrawn before merge on two upheld automated review findings; the phone-width pass they required found and fixed an untappable return control. Six known omissions ride on the record with owners. `BLP-004`, independent evidence-window fields, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 17:24 SGT (route commit `431a7a7` and implementation commit `cd75686` merged as `384db4c` by PR #493; automated-runtime evidence is the dispatch run on `384db4c` at desktop and phone width). The seven fields are decoded from the routes' raw facts by one documented rule, contract 1.0.4 records day precision where a source publishes a calendar date and stays backward-compatible so `BLP-002` remains `COMPLETE`, and the workspace footer, overview toolbar and print package render each field independently with every unavailable value shown as withheld. The two exit audits passed and their findings were fixed before merge, one of them a real defect in the posting export. Known omissions ride on the record with owners. `BLP-006`, reviewer roster and vocabulary, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 19:45 SGT (implementation commit `b672a1b` merged as `1dacc67` by PR #496; automated-runtime evidence is the dispatch run on `1dacc67` at desktop and phone width). One roster of twelve entries replaces the competing counts, every active voice carries identity, lens, method, confidence scale and action boundary, humans are never roster entries and a decision must be a human act, contract 1.1.0 makes the review verbs canonical and stays backward-compatible so `BLP-002` remains `COMPLETE`; three blueprint mappings and open question 15.2 are escalated to the Human Lead rather than inferred. `BLP-005`, round-trip and failure-path tests, was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 at 20:20 SGT (implementation commit `6a75e9f` merged as `c703d9c` by PR #497; automated-runtime evidence is the dispatch run on `c703d9c` at desktop and phone width). The failure-path suite drives every route failure cause and proves no row is invented, pins one definition of the words each withheld, stale, failed and empty state shows, keeps an identifier inventory byte-identical across a rebuild, and renders three distinct states at both widths; it found and fixed a failure phrased as an absence on the MyCareersFuture company route, admitted with two further product changes under the Supervisor's Q1 ruling and named on the record. With `BLP-001` through `BLP-006` `COMPLETE`, the P0 gate is closed.

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
| `COMPLETE` | 6 | `BLP-001`, `BLP-002`, `BLP-003`, `BLP-004`, `BLP-005`, `BLP-006` |
| `NOT_STARTED` | 24 | `BLP-007` through `BLP-030` |
| `IN_PROGRESS` | 0 | None |
| `IMPLEMENTED_UNVERIFIED` | 0 | None |

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
| `BLP-007` | P1 | `NOT_STARTED` | Capture exact candidate-evidence excerpts with immutable source and span identifiers. | `BLP-002`, `BLP-003` |
| `BLP-008` | P1 | `NOT_STARTED` | Build the structured candidate-proof ledger. | `BLP-007` |
| `BLP-009` | P1 | `NOT_STARTED` | Link proof records to duties, requirements, skills, competencies, and accepted review observations. | `BLP-008` |
| `BLP-010` | P1 | `NOT_STARTED` | Support demonstrated, certified, claimed-only, withheld, conflicting, and stale proof states. | `BLP-008`, `BLP-009` |
| `BLP-011` | P1 | `NOT_STARTED` | Control accepted proof destinations: resume, cover letter, interview, portfolio, and work sample. | `BLP-009`, `BLP-010` |
| `BLP-012` | P1 | `NOT_STARTED` | Verify candidate-proof workflows on desktop, phone, keyboard, focus restoration, and evidence round trip. | `BLP-007`, `BLP-008`, `BLP-009`, `BLP-010`, `BLP-011` |
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

1. Run the completion contract, strict Feature Map contract, integrity contract, and build against the reconciled register.
2. `BLP-002` was approved `COMPLETE` by the Blueprint Supervisor on 2026-09-08 (contracts 1.0.3, merge commit `0a0ce553e53c234dc9f4efb2e4791917f35702dc`). `BLP-003` was approved `COMPLETE` on 2026-09-08 at 15:32 SGT: implementation `4020d3c` (PR #490, merge `25cff53`) revised in place at `6750323` (PR #491, merge `98a99d7a69a9b26dead660b7c4b7c231ee0d28a5`) after the Blueprint Supervisor upheld two automated review findings and withdrew its draft approval; the round trip runs at 1440x1000 and 430x932 (216 checks) with proposal ids and comment anchors byte-identical across remount and widths, the phone-width return-button defect is fixed, and the automated-runtime evidence is the dispatch run on `98a99d7`. Six known omissions are recorded on the record (retrievedAt, owner BLP-004; the stale `-s0` assertion at `tests/browser-gate.mjs:576`, owner BLP-005; the Duties-tab-only withheld strip; the device-local `links` scope; candidate-proof identifiers, owner BLP-007; output identifiers, owner BLP-018) plus the completeness residual risk and a BLP-013 note. `BLP-004` was approved `COMPLETE` on 2026-09-08 at 17:24 SGT: route commit `431a7a7` and implementation commit `cd75686` (PR #493, merge `384db4c0dec8d1f078c353a914f40ebebce3d0e4`), contract 1.0.4 with a backward-compatible per-field day-precision marker so `BLP-002` stays `COMPLETE` with a note, `tests/evidence-window.mjs` 146 checks and the unchanged `tests/evidence-round-trip.mjs` 216 checks on the dispatch run at `384db4c` at both viewports. Conformance-auditor and a11y-honesty-reviewer passed; their four warnings and two flags were fixed before merge, one a real defect (the posting export stamped the export click as `retrievedAt`). Known omissions recorded: careers.js derived ISO `postedDate`, `sourceTimezone` withheld everywhere, per-panel `Time-window:` scope lines, middle-dot footer phrase, OKF export timestamp, `Time-window` label carrying two senses, withheld tone as a literal, `APP_VERSION` minor bump reserved to the Human Lead. `BLP-006` was approved `COMPLETE` on 2026-09-08 at 19:45 SGT: implementation commit `b672a1b` (PR #496, merge `1dacc67b08f0b46bb47cce82f8d0f226fabc33a5`), roster 1.0.0 over contract 1.1.0, `tests/reviewer-contract.mjs` 61 + 120 and the unchanged BLP-003 and BLP-004 suites on the dispatch run at `1dacc67` at both viewports; the conformance auditor's block on a builder-introduced defect and the DEFAULT_PERSONA attribution fix are on the record with the known omissions owned by BLP-013 and BLP-015. `BLP-005` was approved `COMPLETE` on 2026-09-08 at 20:20 SGT: implementation commit `6a75e9f` (PR #497, merge `c703d9c1a97a9b8bdc62b8a9657dd8b4a3d40b4e`), adapter 1.1.0, `tests/evidence-failure-paths.mjs` 113 + 160 and the unchanged BLP-003, BLP-004 and BLP-006 suites on the dispatch run at `c703d9c` at both viewports; the three Q1 product changes, the defect the suite found, the Supervisor's corrected reading, the escalations and the known omissions are on the record. The P0 gate is closed.

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
