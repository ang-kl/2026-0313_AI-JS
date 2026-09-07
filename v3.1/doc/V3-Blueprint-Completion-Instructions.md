# V3 Blueprint Completion Instructions

## 1. Purpose and authority

This document is the canonical operating instruction for completing the V3 blueprint. It governs exactly 30 requirements, identified as `BLP-001` through `BLP-030`. Agents MUST use these identifiers, definitions, priorities, dependencies, status rules, evidence rules, and release gates without renaming, combining, splitting, or silently omitting a requirement.

Normative terms `MUST`, `MUST NOT`, `REQUIRED`, `SHOULD`, and `MAY` are to be interpreted literally. A code change is not proof of completion. Completion requires the evidence defined here and approval by the Blueprint Supervisor.

## 2. Protected scope and invariants

Every task, branch, pull request, merge, deployment, and runtime verification governed by this instruction MUST preserve all of the following unless the user explicitly authorises a separate scoped change:

1. `Step 1 behaviour`.
2. `existing Step 2 behaviour`.
3. `v3/`.
4. `Railway configuration`.
5. `five canonical Work Universe graphs`.
6. `three signal model`.
7. `Role Graph and FAB return`.
8. `Clean and Full Review`.
9. `evidence withholding`, including `WITHHELD_NO_SOURCE_ROWS` where source rows are genuinely absent.
10. `deterministic and AI provenance separation`.

Agents MUST NOT invent, infer as fact, or silently complete missing candidate evidence, organisation evidence, hierarchy, ownership, process sequence, outcomes, metrics, dates, capabilities, controls, hiring stages, locations, confidence, or provenance. Unsupported content MUST be withheld with a reason code. Source text MUST remain immutable; transformations and proposals MUST retain links to their source identifiers.

The ten code-formatted entries above are the exact canonical global `protectedScopes` values. Every requirement record MUST include all ten without removing, renaming, or weakening a value.

## 3. Canonical requirement register

The register contains exactly these requirements:

| ID | Priority | Requirement | Required predecessors |
|---|---|---|---|
| `BLP-001` | P0 | Merge and record the Step 2 provenance-only update without altering product behaviour. | None |
| `BLP-002` | P0 | Define canonical `EvidenceSource`, `EvidenceSpan`, `ProofRecord`, `ReviewChange`, `OutputBlock`, `VisualProfile`, and `EvidenceWindow` contracts. | `BLP-001` |
| `BLP-003` | P0 | Preserve stable evidence identifiers across Step 2, Step 3, graphs, review, candidate proof, generated outputs, and return navigation. | `BLP-002` |
| `BLP-004` | P0 | Carry published, closing, retrieved, analysed, corpus-range, posting-count, and source-timezone fields independently; withhold each unavailable value. | `BLP-002` |
| `BLP-005` | P0 | Add positive source round-trip, reference-integrity, withholding, stale-data, and failure-path contract tests. | `BLP-002`, `BLP-003`, `BLP-004` |
| `BLP-006` | P0 | Reconcile one canonical reviewer roster and one canonical review-action vocabulary. | `BLP-002` |
| `BLP-007` | P1 | Capture exact candidate-evidence excerpts with immutable source and span identifiers. | `BLP-002`, `BLP-003` |
| `BLP-008` | P1 | Build the structured candidate-proof ledger. | `BLP-007` |
| `BLP-009` | P1 | Link proof records to duties, requirements, skills, competencies, and accepted review observations. | `BLP-008` |
| `BLP-010` | P1 | Support demonstrated, certified, claimed-only, withheld, conflicting, and stale proof states. | `BLP-008`, `BLP-009` |
| `BLP-011` | P1 | Control accepted proof destinations: resume, cover letter, interview, portfolio, and work sample. | `BLP-009`, `BLP-010` |
| `BLP-012` | P1 | Verify candidate-proof workflows on desktop, phone, keyboard, focus restoration, and evidence round trip. | `BLP-007` through `BLP-011` |
| `BLP-013` | P2 | Implement first-class `split`, `merge`, `relabel`, `escalate`, `withhold`, `resolve`, `reopen`, and `undo` review operations. | `BLP-003`, `BLP-006` |
| `BLP-014` | P2 | Preserve immutable source text and reversible, append-only review history. | `BLP-013` |
| `BLP-015` | P2 | Add review filters and stable reviewer identity across every review view. | `BLP-006`, `BLP-013` |
| `BLP-016` | P2 | Test overlapping spans, stale evidence, rejected evidence, escalation, withholding, undo, and restored decisions. | `BLP-013` through `BLP-015` |
| `BLP-017` | P3 | Build a source-linked resume-claim workbench using accepted job evidence and confirmed candidate proof. | `BLP-008` through `BLP-016` |
| `BLP-018` | P3 | Add a server-owned, schema-constrained generation service with evidence-reference and policy validation. | `BLP-002`, `BLP-003`, `BLP-010` |
| `BLP-019` | P3 | Build an evidence-gated cover-letter workbench with sentence-level traceability. | `BLP-011`, `BLP-017`, `BLP-018` |
| `BLP-020` | P3 | Block copy, save, print, PDF, and export while unsupported, conflicting, or stale claims remain unresolved. | `BLP-017`, `BLP-019` |
| `BLP-021` | P3 | Test prompt injection, invented metrics, unknown IDs, invalid schemas, provider failure, stale hashes, and rejected-evidence exclusion. | `BLP-018` through `BLP-020` |
| `BLP-022` | P4 | Add positive supplied-data tests for the Business Cube and every existing specialised map. | `BLP-003`, `BLP-005` |
| `BLP-023` | P4 | Complete inspector placement, selection feedback, docking, floating, restoration, mobile linear views, and keyboard behaviour for visual workspaces. | `BLP-022` |
| `BLP-024` | P4 | Add evidence-bound, cross-posting organisation synthesis without inferred hierarchy or maturity. | `BLP-003`, `BLP-005` |
| `BLP-025` | P4 | Add remaining role-sensitive visual families individually, each with an explicit supplied-data contract and withholding path. | `BLP-002`, `BLP-022` |
| `BLP-026` | P4 | Add blueprint trace and reversible explanations for generated or adaptive panels. | `BLP-002`, `BLP-006` |
| `BLP-027` | P5 | Pass production Chromium gates against the exact deployed commit. | All in-scope P0-P4 requirements implemented and automated-verified |
| `BLP-028` | P5 | Verify 1440 and 2048 desktop widths and 390 and 430 phone widths, including positive, empty, withheld, error, and stale states. | `BLP-027` |
| `BLP-029` | P5 | Perform physical Safari and physical-phone verification against the exact deployed commit. | `BLP-027`, `BLP-028` |
| `BLP-030` | P5 | Publish the final completion record with implementation, merge, deployment, automated-runtime, and physical-runtime provenance kept separate. | `BLP-001` through `BLP-029` |

The Blueprint Supervisor MUST reject any register containing fewer or more than 30 entries, duplicate IDs, IDs outside the inclusive range `BLP-001..BLP-030`, or definitions that materially weaken this table.

## 4. Agent roles

Use no more than four agents in one implementation wave unless the user explicitly requests otherwise.

### 4.1 Contract and data agent

Owns data contracts, stable identifiers, deterministic validators, state machines, provenance fields, persistence boundaries, and migrations. This agent MUST NOT approve its own status transitions.

### 4.2 Product UI agent

Owns user workflows, responsive composition, inspectors, selection feedback, accessibility, loading, empty, withheld, error, stale, and recovery states. This agent MUST consume canonical contracts rather than defining incompatible local variants.

### 4.3 Test and evaluation agent

Owns deterministic fixtures, contract tests, browser gates, accessibility assertions, adversarial model fixtures, screenshot evidence, reference-integrity checks, and release evidence. This agent MUST test both positive and negative paths.

### 4.4 Blueprint Supervisor

Owns requirement allocation, scope control, dependency enforcement, conflict resolution, evidence review, status approval, release-gate approval, and final reconciliation. The Supervisor SHOULD remain read-only while builders are editing. The Supervisor MUST NOT approve a requirement based only on an implementer's assertion.

Only the Blueprint Supervisor may approve transitions to `AUTOMATED_VERIFIED`, `DEPLOYED_VERIFIED`, `PHYSICAL_VERIFIED`, or `COMPLETE`.

## 5. Status vocabulary

Each requirement MUST have exactly one of these statuses:

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No accepted implementation work has begun. |
| `BLOCKED` | Work cannot proceed because a named prerequisite or external condition is unmet. |
| `IN_PROGRESS` | Implementation or verification is actively underway. |
| `IMPLEMENTED_UNVERIFIED` | Required implementation exists, but its required automated evidence is incomplete or unapproved. |
| `AUTOMATED_VERIFIED` | Required deterministic, contract, browser, evaluation, and accessibility evidence has passed and been approved. |
| `DEPLOYED_VERIFIED` | The exact merged implementation has been deployed and verified by an automated production-runtime check. |
| `PHYSICAL_VERIFIED` | The exact deployed implementation has passed every required physical-device check. |
| `WITHHELD` | Completion cannot be claimed because required evidence is legitimately unavailable; the missing evidence and consequence are explicit. |
| `COMPLETE` | Every applicable definition-of-done condition and release evidence requirement has been satisfied and approved. |

`WITHHELD` is an honest terminal or temporary evidence state, not a synonym for failed, skipped, or implemented. A blocked implementation MUST use `BLOCKED`; a missing proof of runtime behaviour MUST use `WITHHELD` only when the underlying absence is legitimate and explicitly recorded.

## 6. Permitted status transitions

Only these transitions are permitted:

```text
NOT_STARTED -> IN_PROGRESS
NOT_STARTED -> BLOCKED
IN_PROGRESS -> BLOCKED
BLOCKED -> IN_PROGRESS
IN_PROGRESS -> IMPLEMENTED_UNVERIFIED
IMPLEMENTED_UNVERIFIED -> IN_PROGRESS
IMPLEMENTED_UNVERIFIED -> AUTOMATED_VERIFIED
AUTOMATED_VERIFIED -> IN_PROGRESS
AUTOMATED_VERIFIED -> DEPLOYED_VERIFIED
DEPLOYED_VERIFIED -> IN_PROGRESS
DEPLOYED_VERIFIED -> PHYSICAL_VERIFIED
AUTOMATED_VERIFIED -> COMPLETE
DEPLOYED_VERIFIED -> COMPLETE
PHYSICAL_VERIFIED -> COMPLETE
NOT_STARTED -> WITHHELD
IN_PROGRESS -> WITHHELD
IMPLEMENTED_UNVERIFIED -> WITHHELD
AUTOMATED_VERIFIED -> WITHHELD
DEPLOYED_VERIFIED -> WITHHELD
WITHHELD -> IN_PROGRESS
```

A transition back to `IN_PROGRESS` is REQUIRED when implementation, evidence, contracts, dependencies, or protected behaviour changes after verification. Direct transitions that skip required evidence stages are prohibited. `COMPLETE` may be reopened only by the Blueprint Supervisor when regression, stale provenance, or invalid evidence is discovered; the replacement status MUST be `IN_PROGRESS` or `WITHHELD`, with a recorded reason.

## 7. Requirement record schema

Each `BLP-*` record MUST contain exactly the canonical fields below. Implementations MAY add fields inside the named nested records only when the versioned JSON Schema expressly allows them. Use `null` only where this instruction permits it; never omit a required field.

```json
{
  "id": "BLP-001",
  "title": "Canonical requirement title",
  "requirement": "Canonical requirement text",
  "priority": "P0",
  "status": "NOT_STARTED",
  "dependencies": [],
  "ownerRole": "contract-and-data-agent",
  "affectedFiles": [],
  "acceptanceCriteria": [],
  "evidenceLinks": [],
  "blockers": [],
  "protectedScopes": [
    "Step 1 behaviour",
    "existing Step 2 behaviour",
    "v3/",
    "Railway configuration",
    "five canonical Work Universe graphs",
    "three signal model",
    "Role Graph and FAB return",
    "Clean and Full Review",
    "evidence withholding",
    "deterministic and AI provenance separation"
  ],
  "completionPolicy": {
    "requiresDeployment": false,
    "requiresAutomatedRuntime": true,
    "requiresPhysicalRuntime": false
  },
  "statusHistory": [
    {
      "from": null,
      "to": "NOT_STARTED",
      "reason": "Register initialisation",
      "approvedBy": "blueprint-supervisor",
      "changedAt": "2026-09-04T00:00:00Z",
      "evidenceLinks": []
    }
  ],
  "provenance": {
    "implementationCommit": {
      "state": "NOT_IMPLEMENTED",
      "branch": null,
      "commitSha": null,
      "evidenceLinks": [],
      "note": null
    },
    "mergeCommit": {
      "state": "NOT_MERGED",
      "commitSha": null,
      "pullRequest": null,
      "mergedAt": null,
      "evidenceLinks": [],
      "note": null
    },
    "deploymentStatus": {
      "state": "NOT_DEPLOYED",
      "provider": null,
      "environment": null,
      "deploymentUrl": null,
      "deployedCommit": null,
      "checkedAt": null,
      "evidenceLinks": [],
      "note": null
    },
    "automatedRuntimeVerification": {
      "state": "NOT_RUN",
      "runtime": null,
      "testSuite": null,
      "verifiedCommit": null,
      "checkedAt": null,
      "evidenceLinks": [],
      "note": null
    },
    "physicalRuntimeVerification": {
      "state": "NOT_RUN",
      "runtime": null,
      "device": null,
      "operatingSystem": null,
      "browser": null,
      "verifiedCommit": null,
      "checkedAt": null,
      "evidenceLinks": [],
      "note": null
    }
  },
  "supervisorApproval": {
    "approvedStatus": null,
    "approvedBy": null,
    "approvedAt": null,
    "evidenceLinks": [],
    "attestationSubjectCommit": null,
    "attestationUrl": null,
    "attestationSha256": null,
    "note": null
  }
}
```

`completionPolicy` is immutable for a requirement after implementation begins unless the user authorises a policy correction and the Supervisor records that correction in `statusHistory`. Apply these policies:

1. Normal `BLP-001` through `BLP-026` requirements MUST set `requiresDeployment: false` and `requiresPhysicalRuntime: false`. They MAY become `COMPLETE` after their applicable automated evidence passes and the Supervisor approves. `requiresAutomatedRuntime` MUST be `true` for testable code or user-facing behaviour and MAY be `false` only for a documentation- or provenance-only requirement whose non-applicability is explained in `supervisorApproval.note`.
2. `BLP-027` and `BLP-028` MUST set `requiresDeployment: true`, `requiresAutomatedRuntime: true`, and `requiresPhysicalRuntime: false`.
3. `BLP-029` MUST set all three policy fields to `true`.
4. `BLP-030` MUST set all three policy fields to `true` and MUST reconcile every preceding requirement. Its completion authority is an immutable external GitHub release attestation that names the already merged, deployed, automated-verified, and physical-verified `BLP-029` subject commit. `supervisorApproval.attestationSubjectCommit` MUST equal the `BLP-029` deployed and verified commit, `attestationUrl` MUST identify the immutable release, and `attestationSha256` MUST identify the attested register payload. The in-repository register is a mirror of that attestation; later documentation-sync commits do not replace or reopen the attested subject commit.

Implementation commit, merge commit, deployment status, automated runtime, and physical runtime MUST remain five separate provenance groups. They MUST NOT be collapsed into one `verified`, `released`, `done`, or provenance value. A successful deployment status does not prove runtime behaviour. Automated mobile emulation does not prove physical-device behaviour.

All recorded commit identifiers MUST be exact 40-character commit SHAs. When `requiresDeployment` is `true`, `deploymentStatus.deployedCommit` MUST exactly equal `mergeCommit.commitSha`. When automated runtime verifies a deployed release, `automatedRuntimeVerification.verifiedCommit` MUST exactly equal both `deploymentStatus.deployedCommit` and `mergeCommit.commitSha`. When deployment is not required, automated verification MUST name the exact implementation or merge commit it tested; the Supervisor MUST verify that the accepted merge contains that implementation before approving `COMPLETE`. When `requiresPhysicalRuntime` is `true`, `physicalRuntimeVerification.verifiedCommit` MUST exactly equal `deploymentStatus.deployedCommit`, `automatedRuntimeVerification.verifiedCommit`, and `mergeCommit.commitSha`. Branch names, tags, environment names, and abbreviated SHAs do not satisfy these equality rules.

`statusHistory` MUST be append-only, chronologically ordered, and contain the complete sequence of permitted transitions. Its final `to` value MUST equal the record's current `status`. Every transition to a Supervisor-controlled status MUST use `approvedBy: "blueprint-supervisor"` and contain non-empty supporting `evidenceLinks`. `supervisorApproval.approvedStatus` MUST equal the current status, `approvedBy` MUST be `blueprint-supervisor`, and approval evidence MUST be non-empty for `AUTOMATED_VERIFIED`, `DEPLOYED_VERIFIED`, `PHYSICAL_VERIFIED`, or `COMPLETE`.

A compare URL or `/pull/new/` URL is not an opened pull request. It MUST be labelled as a compare/create link and MUST NOT populate `mergeCommit.pullRequest` or use evidence kind `PULL_REQUEST`. That field and evidence kind require an actual opened pull-request number or URL.

## 8. Evidence requirements

Evidence MUST identify the exact requirement and exact commit it supports. Acceptable evidence includes:

1. Contract-test output with test name and result.
2. Deterministic unit or integration-test output with fixture identity.
3. Browser-test output with browser, viewport, route, state, and assertion identity.
4. Accessibility-test output plus keyboard and focus-path evidence where interaction is involved.
5. Screenshot or recording tied to the tested state and exact verified commit.
6. Deployment-provider status naming `deployedCommit`, which must exactly match the merge commit when deployment is required.
7. Physical-device record naming device, operating system, browser, viewport or orientation, `verifiedCommit`, timestamp, and observed result.
8. Reviewed source links proving stable source, span, proposal, decision, and output identifiers.

Every implemented user-facing requirement MUST include positive, empty, withheld, error, and stale evidence where those states are applicable. AI-assisted requirements MUST additionally include prompt-injection, unsupported-claim, invented-number, unknown-reference, invalid-schema, provider-failure, and rejected-evidence fixtures.

Passing criteria for AI-assisted output are:

- 100% schema validity after the permitted validation process.
- 100% evidence-reference membership in the supplied allowlist.
- Zero unsupported factual sentences.
- Zero invented numbers, dates, organisations, capabilities, relationships, outcomes, or credentials.
- 100% withholding for fixtures lacking required evidence.
- Exact exclusion of rejected, revoked, conflicting, unconfirmed, and stale evidence.
- No model execution of human-owned review decisions.

An LLM judge MAY assess wording quality, but MUST NOT override a deterministic policy, provenance, schema, or reference-integrity failure.

## 9. Definition of done

A requirement may become `COMPLETE` only when all applicable conditions below are true:

1. All recorded predecessors are `COMPLETE`.
2. The implementation satisfies the canonical requirement without violating protected scope.
3. Source evidence remains immutable and addressable by stable identifiers.
4. Deterministic and AI provenance are visibly and structurally distinct.
5. Missing or unsupported evidence is withheld with an explicit reason.
6. Required contract, unit, integration, browser, evaluation, accessibility, and regression tests pass.
7. Positive, empty, withheld, error, and stale states are verified where applicable.
8. Desktop and phone behaviour are verified where the requirement is user-facing.
9. Implementation commit and merge commit are recorded separately as exact 40-character SHAs.
10. Deployment status records `deployedCommit` independently of runtime verification when `completionPolicy.requiresDeployment` is `true`.
11. Automated-runtime evidence records `verifiedCommit` when `completionPolicy.requiresAutomatedRuntime` is `true` and satisfies the exact-match rules in Section 7.
12. Physical-runtime evidence records `verifiedCommit` when `completionPolicy.requiresPhysicalRuntime` is `true` and satisfies the exact-match rules in Section 7.
13. No unresolved P0 or P1 regression exists.
14. `v3/`, Railway configuration, Step 1, and existing Step 2 behaviour are unchanged unless explicitly authorised.
15. `statusHistory` ends at `COMPLETE`, and `supervisorApproval` records the Supervisor's review and approval of that status.

For every `COMPLETE` record, each provenance group required by `completionPolicy` MUST contain a passing state, exact commit, timestamp, and non-empty evidence links. A provenance group not required by policy MAY remain `NOT_DEPLOYED` or `NOT_RUN`, but its note MUST state that the group's evidence is not required for this requirement. The Supervisor MUST NOT demand premature deployment or physical evidence for normal P0-P4 completion, and MUST NOT waive required deployment or physical evidence for `BLP-027` through `BLP-030`.

## 10. P0-P5 release gates

Priority gates are cumulative. A later gate MUST NOT pass while an earlier gate has an unapproved requirement.

### P0: Contract and truthfulness gate

`BLP-001` through `BLP-006` MUST be `COMPLETE`. Stable identifiers, evidence windows, reviewer vocabulary, withholding rules, and positive round-trip tests MUST be established before candidate-output implementation begins.

### P1: Candidate-proof gate

`BLP-007` through `BLP-012` MUST be `COMPLETE`. Exact excerpts, proof records, target links, proof states, destination controls, responsive behaviour, keyboard behaviour, focus restoration, and round-trip evidence MUST be verified.

### P2: Auditable-review gate

`BLP-013` through `BLP-016` MUST be `COMPLETE`. Every required review verb MUST create an auditable state transition over immutable source text, and overlap, stale, rejected, withheld, escalation, undo, and restoration paths MUST pass.

### P3: Candidate-output gate

`BLP-017` through `BLP-021` MUST be `COMPLETE`. Resume and cover-letter outputs MUST use accepted evidence only, retain sentence- or claim-level traceability, and block export while unsupported or stale content remains. All adversarial model tests MUST pass.

### P4: Visual and organisation gate

Every P4 requirement included in the declared release milestone MUST be `COMPLETE`; excluded optional visual families MUST remain explicitly `NOT_STARTED` or `WITHHELD` with user-approved milestone scope. Existing specialised maps, the Business Cube, inspectors, organisation synthesis, and blueprint explanations MUST NOT be represented as complete without positive supplied-data evidence.

### P5: Release-evidence gate

`BLP-027` through `BLP-030` MUST be `COMPLETE`. Production Chromium, required responsive widths and states, physical Safari and phone verification, and final separated provenance MUST all reference the exact deployed merge commit. Automated emulation MUST NOT satisfy `BLP-029`.

## 11. Supervisor approval protocol

For every proposed status transition, the Blueprint Supervisor MUST:

1. Confirm the requirement ID and canonical text.
2. Confirm predecessor status.
3. Review changed-file scope and protected-path checks.
4. Review test and runtime evidence directly.
5. Confirm that evidence IDs and provenance references are valid.
6. Confirm that no unsupported evidence was invented or upgraded.
7. Confirm deterministic and AI-assisted outputs remain distinct.
8. Confirm `completionPolicy`, commit equality, unresolved blockers, and the final `statusHistory` event.
9. Record approved status, approver identity, timestamp, evidence links, and any residual risk in `supervisorApproval`.

The Supervisor MUST reject completion when evidence is self-reported without artefacts, tied to a different commit, produced only from a stubbed path when a live path is required, based solely on a deployment badge, or based solely on automated mobile emulation where physical verification is required.

## 12. Per-agent return format

Every agent MUST return exactly these sections, in this order:

```text
AGENT ROLE
<canonical role>

BASELINE
Branch: <branch or NOT_CHECKED>
Commit: <commit or NOT_CHECKED>
Worktree state: <clean, dirty, or NOT_CHECKED>

REQUIREMENTS ADDRESSED
<BLP-ID>: <claimed contribution, not status approval>

Affected files
<path or NONE>

CONTRACTS AND BEHAVIOUR
<contracts added or changed; deterministic/AI boundary; withholding behaviour>

TESTS ADDED OR UPDATED
<test and fixture identifiers or NONE>

COMMANDS RUN
<command, exit status, and concise result or NONE>

EVIDENCE PRODUCED
<artifact path or URL, exact commit, environment, browser/device, viewport, timestamp, result or NONE>

PROTECTED-SCOPE CHECK
Step 1: <UNCHANGED, AUTHORISED_CHANGE, or NOT_CHECKED>
Existing Step 2: <UNCHANGED, AUTHORISED_CHANGE, or NOT_CHECKED>
v3/: <UNCHANGED, AUTHORISED_CHANGE, or NOT_CHECKED>
Railway: <UNCHANGED, AUTHORISED_CHANGE, or NOT_CHECKED>
Five graphs / three signals: <PRESERVED, AUTHORISED_CHANGE, or NOT_CHECKED>
Role Graph/FAB round trip: <PRESERVED, AUTHORISED_CHANGE, or NOT_CHECKED>
Clean/Full Review: <PRESERVED, AUTHORISED_CHANGE, or NOT_CHECKED>
Withholding: <PRESERVED, IMPROVED, AUTHORISED_CHANGE, or NOT_CHECKED>
Deterministic/AI provenance: <PRESERVED, IMPROVED, AUTHORISED_CHANGE, or NOT_CHECKED>

UNRESOLVED RISKS AND GAPS
<risk, affected BLP-ID, consequence, next action or NONE>

PROPOSED REGISTER UPDATES
<BLP-ID>: <current status> -> <proposed status>; <completionPolicy>; <statusHistory event>; <provenance updates>; <evidence references>; Supervisor approval required
```

Agents MUST report `NOT_CHECKED` or `NONE` rather than imply work or evidence they did not perform. Agents MUST NOT report a requirement as `COMPLETE`; they may only propose a transition for Supervisor approval.

## 13. Execution discipline

1. Implement requirements in dependency order and in narrow, reviewable pull requests.
2. Keep documentation/provenance changes separate from behavioural changes where practical.
3. Do not begin P3 generation work before P0 and P1 gates pass.
4. Do not restore retired or backup implementations as production code without revalidating them against this instruction.
5. Do not replace deterministic calculations, state transitions, map topology, evidence confirmation, provenance, or human decisions with model output.
6. Invalidate generated output whenever its evidence hash, source, proof, or review decision changes.
7. Preserve failed, rejected, reopened, and superseded decisions in append-only audit history.
8. Record known omissions explicitly; silence is not an acceptable completion state.
9. Re-run affected lower-priority gates after any shared-contract change.
10. Declare the milestone's included P4 visual families before seeking P4 approval.

The work is complete only when all 30 records exist, every in-scope requirement has passed its applicable gate, all remaining omissions are explicitly approved and represented without false completion, and `BLP-030` contains the final separated provenance record.
