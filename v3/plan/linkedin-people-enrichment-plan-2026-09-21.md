# LinkedIn People Enrichment - V3 Extension Plan

| Field | Value |
| --- | --- |
| Plan ID | EXT-LI-001 |
| Project | Job-Analysis / AI Potential Analyser for Job Skill |
| Repository | `ang-kl/2026-0313_AI-JS` |
| Plan location | `v3/plan/linkedin-people-enrichment-plan-2026-09-21.md` |
| Created | 21 September 2026, Asia/Singapore |
| Inspected baseline | `main` at `384e0e151a82d70356e25cad441f134e08045cc0` |
| Document status | PROPOSED - recorded for planning; not an implementation approval |
| Implementation status | NOT_STARTED |
| Current authorisation | Create and upload this plan only |
| Future implementation area | `v3.1/`, subject to a fresh architecture review and explicit approval |

## 1. Decision and intent

Plan an **optional, analyst-mediated LinkedIn people-enrichment layer**. It may supply source-linked professional context about a named person, an observed job title, or a stated employer. It must remain separate from the core job-analysis pipeline, scoring, candidate proof, and authoritative organisation evidence.

**Do not attempt to install the ChatGPT LinkedIn connection into the deployed application.** The currently exposed tool is a ChatGPT-side people-search action, not a verified application API integration. A separate supported runtime integration would require its own feasibility assessment, permissions and approval.

This document does not authorise implementation, production activation, paid services, profile collection, recruitment activity, or changes to the canonical blueprint register. No LinkedIn people search was performed to prepare it, and no personal-profile records are included.

## 2. Interpretation, project boundary and verified facts

### 2.1 Project context

The project is `ang-kl/2026-0313_AI-JS`, not an assumed repository named `job-analysis`. Its existing V3 Blueprint Completion Instructions define exactly **BLP-001 through BLP-030**, canonical evidence contracts, protected product behaviour and separate implementation/verification stages. [R1, R2]

This is an **extension proposal outside those 30 requirements**. Do not add `BLP-031`, renumber requirements, change their definitions or mark any requirement complete because this plan exists. The status of individual BLP requirements was not audited for this task.

A literal `v3/plan/` directory was absent on the inspected `main` branch. This upload creates that directory to fulfil the requested destination. It is a documentation-only addition: preserve every existing `v3/` file. Future runtime work must not use this folder as an excuse to change the protected V3 implementation.

### 2.2 Capability verified in this ChatGPT session

The connected LinkedIn app exposes one action: `linkedin_search_people`. Its documented input fields are:

| Field | Requirement |
| --- | --- |
| `firstName` | At least this or `lastName` must be supplied. |
| `lastName` | At least this or `firstName` must be supplied. |
| `company` | Optional narrowing filter. |
| `title` | Optional narrowing filter. |
| `location` | Optional narrowing filter. |

The action is described as returning matching professional profiles through interactive widgets. **The exact result fields, completeness, pagination, quotas, refresh behaviour and machine-readable export contract have not been verified.** Do not promise full employment history, department, verified current employment, follower counts or other fields unless actually returned and evidenced. [R3]

A company, job title or location alone cannot satisfy the tool's documented name requirement. Do not invent names or use wildcard workarounds. This is not a job-listing search, general employee-directory export, feed/message reader, connection manager or posting action in the currently exposed schema. These boundaries concern this connector, not every LinkedIn product.

LinkedIn's official developer guidance separately requires application authentication/authorisation and identifies permissions and programmes that need approval. A ChatGPT connection is not evidence that this repository holds those approvals. No suitable third-party people-search entitlement for this application has been demonstrated. [R4]

### 2.3 Assumptions requiring confirmation before implementation

- A useful initial workflow is enrichment of a **known, user-selected person**, not discovery of everyone in a company.
- The project needs professional context, not automatic candidate ranking or a new recruitment system.
- Any reuse, storage, display or onward export of retrieved information is permitted for the selected source and purpose. This remains unverified; human review alone does not establish permission.
- The canonical evidence and review contracts can represent the proposed source without weakening validation. Read the current schemas and implementation before choosing file-level changes.

## 3. Proposed workflow and architecture

```text
EXISTING CORE - unchanged
Job/source inputs -> analysis -> canonical evidence/review -> existing outputs

OPTIONAL SIDECAR - future, separately approved
Known person + user-approved search purpose
  -> LinkedIn people search in ChatGPT
  -> inspect actual returned fields and source references
  -> confirm identity; review conflicting or stale claims
  -> confirm permitted reuse
  -> explicit selection of minimal supported evidence
  -> proposed manual import into the application's evidence/review layer
  -> separately labelled contextual display

No dependency from the core pipeline to LinkedIn availability.
No automatic write from the sidecar into scores, graphs or candidate proof.
```

The proposed manual import is **future application work**, not an existing connector export feature. Do not treat the ChatGPT widget or its internal tool name as a portable SDK, public endpoint or credential.

Potential benefit: help an analyst recognise an observed title or examine a named professional's stated role. Limit: this is neither proof of an open vacancy nor a representative sample of a workforce. A profile statement remains source-attributed and potentially stale; human selection does not make it employer-verified.

No implementation module names or exact insertion points are asserted here. Start with the existing evidence/review surfaces and canonical contracts; confirm their current code paths before creating an implementation PR.

## 4. Scope and exclusions

### In scope after separate approval

Name-based lookup with optional narrowing filters; explicit identity review; minimal, permitted source-linked evidence capture; clear source and retrieval dates; conflict/staleness handling; reversible removal; an optional contextual panel integrated into the existing review experience.

### Out of scope

Automatic LinkedIn job discovery; company-wide employee harvesting; inferred reporting lines, authority, hiring-manager status, headcount or vacancy status; contacting people; changing LinkedIn or Google Contacts; scoring candidates from profile data; importing full profiles by default; persistent background collection; scraping or reusing browser cookies; bypassing access limits; new paid subscriptions; runtime provider deployment.

Do not use photographs, inferred age, gender, ethnicity, religion, health, nationality or other sensitive attributes for identity scoring or job suitability. Missing LinkedIn evidence must never disadvantage a candidate.

Do not add another floating action button, redesign navigation or change the three-panel experience merely to display this enrichment.

## 5. Evidence and security requirements

Reuse the existing `EvidenceSource`, `EvidenceSpan`, `ProofRecord`, `ReviewChange`, `OutputBlock` and `EvidenceWindow` contracts wherever applicable. Any required schema extension needs a separately reviewed, versioned change; a profile record must not automatically become a candidate `ProofRecord`. [R2]

The following is a **proposed logical envelope**, not a claim about connector response fields or current application support:

| Information | Planned rule |
| --- | --- |
| Source identity | Stable internal source ID, provider label, acquisition method and actual returned profile/source reference. |
| Claim evidence | Store only permitted, selected fields or minimal excerpts, with source/span identifiers and a deterministic content hash where the contract requires it. |
| Time | Record actual retrieval time and timezone. Keep source publication/update/effective dates separate; withhold them when unavailable. Retrieval is not proof of freshness. |
| Identity review | Pending, confirmed, ambiguous or rejected, mapped to existing state vocabulary where possible; record the review rationale. Name similarity alone is insufficient. |
| Provenance | Distinguish source statements, analyst interpretation and AI-generated summaries. Unsupported claims remain withheld. |
| Review | Reuse stable reviewer IDs and append-only/reversible decision history; never silently rewrite source text. |
| Permissions | Record permitted use, retention decision and export allowance before persistence. Unresolved permissions block ingestion. |
| Model use | Do not forward profile content to model providers without a separate permission check. |
| Data handling | Keep raw profiles, credentials and real-person fixtures out of the public GitHub repository. Do not place profile contents in analytics or error logs. |

Enforce ownership/access checks for any stored records. Treat imported text as untrusted data, not instructions; validate fields, lengths and schemas, escape display text, reject script URLs and avoid server-side fetching of arbitrary profile links. Retention and deletion must cover stored content, exports and logs under the approved policy. Retain only non-personal audit information when necessary; do not preserve deleted profile text inside an immutable-history workaround.

## 6. Priority order and gates

The priorities below apply only to EXT-LI-001. They do not reorder the canonical BLP programme. All future stages remain NOT_STARTED until separately approved.

| Order | Work package | Deliverable and gate |
| --- | --- | --- |
| P0 - now | Record the proposal only. | This Markdown file. No application, configuration, dependency, credential or canonical-register changes. |
| P1 - feasibility | Confirm the named-person use case, source rights, actual connector output and useful fields. | Document supported/unsupported behaviour with authorised examples; agree identity and retention rules. Stop if permitted reuse or sufficient provenance cannot be established. |
| P2 - evidence contract | Design a minimal manual-import envelope against current canonical schemas. | Schema and fixture proposal; map stable IDs, source spans, timestamps, review, withholding and deletion. Verify relevant evidence-contract prerequisites rather than assuming BLP completion. |
| P3 - isolated prototype | Build optional reviewed evidence capture/display, disabled by default. | Separate implementation PR, using existing review surfaces. Core analysis works identically with enrichment absent, rejected, stale or failing. No direct production call to the ChatGPT tool. |
| P4 - verification and pilot | Run positive, failure, privacy, accessibility and regression checks. | Exact test evidence and a small explicitly approved pilot; retain separate implementation, merge, deployment and physical-verification records. |
| P5 - conditional future route | Assess an independently supported runtime provider only if still useful. | A new architecture decision with verified endpoint access, authorised purpose, cost/rate limits, credentials, retention terms, timeout/isolation design and rollback. No automatic promotion from this plan. |

Before P2, inspect the current implementations of the BLP-002/003/004/005 evidence-contract work. Before P3, verify the relevant canonical reviewer and reversible-history mechanisms, including BLP-006 and applicable BLP-013/014 work. These are integration prerequisites, **not assertions that those requirements are complete**.

## 7. Material invariants and acceptance tests

A requirement written in a plan is not a passed runtime test. The current runtime status below is deliberately Not Verifiable because this feature is unimplemented and was not exercised.

| ID | Invariant | Required proof before release | Current runtime status |
| --- | --- | --- | --- |
| LI-I01 | Core analysis does not depend on LinkedIn. | Identical core results with the feature off, absent, errored and unavailable. | Not Verifiable |
| LI-I02 | No silent scoring, graph or candidate-proof changes. | Compare protected outputs before/after enrichment; verify no sidecar-to-core mutation path. | Not Verifiable |
| LI-I03 | No fabricated identities, source fields or organisation relationships. | Ambiguous names and missing fields remain unresolved/withheld. | Not Verifiable |
| LI-I04 | Name requirement and review gates are enforced. | Company-only input cannot search; ambiguous matches cannot be silently accepted. | Not Verifiable |
| LI-I05 | Source references, times and review history remain traceable. | Evidence round trip, stale-data, conflict, rejected-evidence and undo tests. | Not Verifiable |
| LI-I06 | Permitted use, minimisation and deletion are enforced. | Permission-blocking, access-control, export and deletion tests, including logs. | Not Verifiable |
| LI-I07 | Protected V3 behaviour is preserved. | Existing regression suites and exact-commit desktop/mobile/keyboard checks. | Not Verifiable |
| LI-I08 | Provider failures cannot block or mislead the user. | No-result, denied access, malformed import, timeout, revoked permission and retry tests; distinct empty/error states. | Not Verifiable |
| LI-I09 | Untrusted content cannot execute or redirect instructions. | Injection, unsafe-link, markup-escaping and invalid-schema tests. | Not Verifiable |
| LI-I10 | Feature release remains separately authorised. | Recorded approval and evidence for the specific implementation and release scope. | Not Verifiable |

Protected baseline: Step 1 behaviour; existing Step 2 behaviour; existing `v3/` assets; Railway configuration; five canonical Work Universe graphs; three signal model; Role Graph and FAB return; Clean and Full Review; evidence withholding including `WITHHELD_NO_SOURCE_ROWS`; deterministic and AI provenance separation. The only current exception is the user-requested addition of this plan file under `v3/plan/`. [R2]

Use synthetic fixtures in committed tests. Include a positive confirmed-match case, a common-name ambiguity, a title/employer conflict, unavailable update dates, duplicate imports, stale evidence, rejected evidence, provider failure and complete source withdrawal. Status must be conveyed with text and structure, not colour alone.

## 8. Principal risks and containment

| Risk | Containment |
| --- | --- |
| Assuming a ChatGPT connection is an application API entitlement. | Analyst-side boundary now; independent verified access and approval for any runtime route. |
| Confusing a matching name with the intended person. | Company/title/location corroboration and explicit review; do not assert certainty without evidence. |
| Treating a profile as verified organisational truth. | Attribute claims; preserve conflicting sources; do not infer hierarchy or vacancy status. |
| Permission, privacy or retention uncertainty. | Block ingestion until resolved; minimise fields; exclude real profile data from this public repository. |
| Unrepresentative or stale information affecting decisions. | No scoring use, no workforce-population inference, explicit dates and withholding. |
| Scope creep or disruption to blueprint work. | Separate extension ID and approval gate; do not modify the 30-item register or protected behaviour. |

## 9. Rollback and execution handoff

For a future implementation, disable the feature through the agreed mechanism, stop new ingestion and remove/revoke source records under the approved retention policy. The core pipeline must require no rollback because it must never depend on this sidecar. Review and remove any separately introduced credentials or integrations only with explicit authorisation.

A future implementer must first re-read this plan and the current canonical instructions, inspect the current `v3.1/` code and schemas, confirm provider capability and permitted use, propose exact changed files and test gates, and obtain approval. **Do not begin implementation, merge/deploy code or update BLP completion statuses merely because this file is present.**

For the current documentation-only task, acceptance is: one new plan file at the requested path; existing files unchanged; remote content read back; commit and changed-file evidence recorded in the delivery message. Runtime tests are not claimed. No deployment command is authorised by this task; repository-triggered CI/deployment behaviour is not asserted here.

## 10. Evidence register

| Ref | Source | Author/publisher | Timestamp | Link or retrieval reference |
| --- | --- | --- | --- | --- |
| R1 | Repository metadata and `main` reference | `ang-kl`, GitHub | Retrieved 21 September 2026 SGT | https://github.com/ang-kl/2026-0313_AI-JS/tree/384e0e151a82d70356e25cad441f134e08045cc0 |
| R2 | V3 Blueprint Completion Instructions, sections 1-6 | Project repository | Inspected at baseline `384e0e151a82d70356e25cad441f134e08045cc0` on 21 September 2026 SGT | https://github.com/ang-kl/2026-0313_AI-JS/blob/384e0e151a82d70356e25cad441f134e08045cc0/v3.1/doc/V3-Blueprint-Completion-Instructions.md |
| R3 | Live LinkedIn connector action schema | Connected LinkedIn app | Inspected 21 September 2026 SGT | ChatGPT tool discovery: `api_tool.list_resources(paths=["LinkedIn"])`; action `linkedin_search_people`. No public schema URL or live profile-result sample was available. |
| R4 | Getting Access to LinkedIn APIs | LinkedIn developer documentation, Microsoft Learn | Page displayed last updated 26 June 2025; accessed 21 September 2026 SGT | https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access |

Method: connected GitHub directory/file/ref reads; live LinkedIn tool-schema inspection; official LinkedIn developer-documentation search; documentation-only authoring. No implementation audit, end-to-end connector test, permissions certification or production verification was performed. Design choices and proposed gates are recommendations, not observed runtime properties.
