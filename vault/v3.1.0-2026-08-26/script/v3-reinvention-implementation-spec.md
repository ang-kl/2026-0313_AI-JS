# SG Career View v3 - Reinvention Implementation Spec

> **Status:** READY_FOR_REVIEW.
> **Date:** 2026-06-24.
> **Target repo path:** `v3/script/v3-reinvention-implementation-spec.md`.
> **Charter dependency:** `doc/v3-reinvention-charter.md`.
> **Build posture:** This spec defines implementation slices. It does not itself author app changes.
> **Version posture:** Any PR implementing a slice uses the existing flat patch rhythm and Human Lead G1 confirmation before version bump.
> **Source note:** The Human Lead supplied the Agentic AI governance indicators attributed to Singapore IMDA Model AI Governance Framework for Agentic AI v1, Jan 2026. The exact official public source is **[UNVERIFIED: exact public source not found]** in this drafting pass; the supplied indicators are treated as mandatory product requirements.

---

## RIN0. Purpose

This spec turns V3 into a governed agentic work-system engine while preserving the V2 edge and existing RoleGraph value.

The implementation must make these moves:

1. Preserve the fast, clear role read.
2. Keep RoleGraph as the single-role dissection surface.
3. Add OrgGraph to commonise roles across one employer.
4. Add BPR process redesign read.
5. Add Agent Identity and Governance Ledger.
6. Keep the UI as a 3-panel adaptive system.
7. Make all agentic recommendations accountable to named humans.

---

## RIN1. Frozen Contract

These contracts remain binding:

- Deterministic engine authors numbers and groupings.
- LLM is advisory only.
- Withhold over fabricate.
- Live data must carry provenance.
- No red/green-only meaning.
- RoleGraph remains visible and useful.
- Same fixed input should produce the same deterministic output.
- Candidate-impacting or employer-impacting outputs must expose evidence and uncertainty.

Existing frozen or sensitive surfaces from `v3-result-engine-spec.md`, `v3-pillars-spec.md`, and `v3-company-agents-spec.md` remain frozen unless a slice explicitly names the edit and Human Lead accepts the blast radius.

---

## RIN2. Information Architecture

The V3 product becomes a 3-panel system.

### Panel 1: Context

Purpose:

- Select persona mode.
- Select input type: role, job posting, company, process question.
- Show source state: live, cached, mock, or unverified.
- Show current decision question.

Persona modes:

- Candidate.
- Switcher.
- Senior worker.
- Recruiter.
- Hiring manager.
- HR / organisation design.
- BPR.
- Policy / regulator.

### Panel 2: Map

Purpose:

- Show RoleGraph for one posting.
- Show OrgGraph for company commonisation.
- Show BPR value stream.
- Show human-agent work split.
- Show source-linked graph nodes.

### Panel 3: Decision

Purpose:

- Summarise action.
- Show apply / skip / prepare / redesign / build agent / withhold.
- Show governance ledger.
- Show named human owner.
- Show risk tier, allowed actions, forbidden actions, and audit trail.
- Show Critic Agent objections.

---

## RIN3. Responsive Layout Rules

The UI remains three panels across device classes, but presentation adapts to aspect ratio.

| Viewport | Layout |
|---|---|
| Desktop wide | Three columns: Context / Map / Decision |
| iPad mini landscape | Three columns, compressed side panels, map remains dominant |
| iPad mini portrait | Context top strip, Map main, Decision drawer |
| iPhone portrait | Three tabs: Ask / Map / Decide |
| iPhone landscape | Two visible regions: Map + active side panel |

Rules:

- Minimum touch target: 44px.
- No text clipped in buttons.
- No cards inside cards.
- No colour-only status.
- State is shown by label, shape, icon, and text.
- All strings are externalised for i18n.
- Long zh, ms, ta, and en strings must wrap without breaking layout.

---

## RIN4. Core Data Model

### 4.1 Work Evidence

```json
{
  "evidence_id": "src-mcf-uuid-or-derived-id",
  "source_type": "mcf|mom|esco|ssoc|isco|company|derived|ai_estimate|unverified",
  "source_label": "MyCareersFuture",
  "retrieved_at": "2026-06-24T00:00:00+08:00",
  "confidence": "high|moderate|thin|withheld",
  "text": "verbatim or derived evidence text",
  "provenance_url": "https://..."
}
```

### 4.2 RoleGraph Node

```json
{
  "node_id": "role-node-id",
  "node_type": "role|duty|skill|occupation|stakeholder|constraint|ai_exposure",
  "label": "visible label",
  "source": "mcf|esco|engine|derived|ai_estimate",
  "confidence": "high|moderate|thin",
  "evidence_ids": ["src-1"],
  "ai_level": "human|low|medium|high|withheld"
}
```

### 4.3 OrgGraph Cluster

```json
{
  "cluster_id": "org-cluster-id",
  "cluster_type": "duty|capability|process|handoff|agent_candidate",
  "label": "commonised work cluster",
  "member_role_ids": ["role-a", "role-b"],
  "common_core": ["shared duty phrase"],
  "role_specific_edges": ["role-specific phrase"],
  "confidence": "high|moderate|thin",
  "overmerge_risk": "low|medium|high",
  "evidence_ids": ["src-1", "src-2"]
}
```

### 4.4 Agent Identity

```json
{
  "agent_id": "agent-company-process-purpose-v1",
  "agent_name": "Scheduling Evidence Agent",
  "purpose": "short purpose",
  "human_owner": {
    "name": "TBD named human",
    "role": "Hiring Manager",
    "approval_required": true
  },
  "allowed_actions": ["read postings", "summarise duty recurrence"],
  "forbidden_actions": ["contact candidates", "reject candidates", "make offers"],
  "data_access": ["public job posting text"],
  "risk_tier": "low|medium|high|blocked",
  "approval_mode": "human_in_loop|human_over_loop|monitor_only|blocked",
  "expiry": "YYYY-MM-DD",
  "kill_switch": true,
  "audit_log_required": true
}
```

### 4.5 Governance Ledger Entry

```json
{
  "ledger_id": "gov-ledger-id",
  "decision_type": "apply|skip|prepare|redesign|build_agent|withhold",
  "risk_assessment": "pass|warn|block",
  "human_accountability_chain": ["named human owner", "reviewer"],
  "technical_guardrails": ["schema", "scope", "log", "rollback", "kill switch"],
  "end_user_transparency": "plain-language disclosure",
  "agent_identity_ids": ["agent-id"],
  "coordination_metrics": {
    "delegation_depth": 0,
    "escalation_loops": 0,
    "conflicting_outputs": 0,
    "ownerless_actions": 0
  },
  "critic_objections": ["weak evidence", "thin sample"],
  "final_status": "allowed|needs_human|withheld|blocked"
}
```

---

## RIN5. RoleGraph Preservation Slice

### Goal

Keep the role graph that users like, but make its purpose clearer inside the new 3-panel system.

### Requirements

- RoleGraph remains the default map after analysing one role or one posting.
- RoleGraph nodes show source and confidence.
- RoleGraph keeps job dissection: role, duties, skills, occupation, AI exposure.
- RoleGraph does not become a CV-fit panel.
- RoleGraph provides a "send to OrgGraph" pathway when a company context is available.

### Acceptance

- One posting produces a readable RoleGraph.
- It fits desktop, iPad mini, and iPhone tab mode.
- Every figure or inferred node has provenance.
- No old V2 clarity is lost in the first screen.

---

## RIN6. OrgGraph Commonisation Slice

### Goal

Commonise roles across one organisation without pretending titles are stable.

### Algorithm

```text
Company postings
-> build RoleGraph per posting
-> extract duty atoms
-> normalise phrase tokens
-> map duty atoms to capability atoms
-> cluster repeated capabilities
-> preserve role-specific edges
-> detect process clusters and handoffs
-> output OrgGraph
```

### Commonisation Layers

| Layer | Commonise by | Do not |
|---|---|---|
| Title | Similar labels only as weak hints | Treat same title as same work |
| Duty | Repeated action phrases | Merge without source |
| Capability | Shared business ability | Hide role-specific nuance |
| Process | Handoffs and value flow | Invent unseen workflow |
| Agentic | Repeated high-exposure work | Predict layoffs |

### Overmerge Protection

Every cluster must show:

- Common core.
- Role-specific edge.
- Source postings.
- Confidence.
- Overmerge risk.
- Human review flag when ambiguity is high.

### Acceptance

- Same company, multiple postings -> OrgGraph clusters repeated work.
- Thin posting set -> withhold OrgGraph.
- User can open each cluster and see exact source postings.
- Role-specific uniqueness remains visible.

---

## RIN7. BPR Process Redesign Slice

### Goal

Add CO3: Process To Re-engineer.

V3 should not ask only "who should we hire?" It should ask "what process should exist before we hire?"

### Flow

```text
OrgGraph clusters
-> AS-IS process hypothesis
-> friction and handoff detection
-> value-eroding duties
-> human-core duties
-> agentic workflow candidates
-> TO-BE process hypothesis
-> role redesign options
-> governance ledger
```

### BPR Decision Types

| Decision | Meaning |
|---|---|
| Keep role | The work is coherent and human-accountable |
| Split role | One ad contains multiple incompatible work systems |
| Merge role | Multiple ads show one repeated workflow |
| Redesign process | Handoffs or friction are the problem |
| Build agent | Repeated bounded work can be agentic with governance |
| Withhold | Evidence is too thin or risk is too high |

### Acceptance

- BPR read is labelled as hypothesis, not fact.
- It never claims savings without evidence.
- It never predicts layoffs.
- It shows what would need human validation.
- It maps every agentic path to a governance ledger entry.

---

## RIN8. Agentic Work Split Slice

### Goal

Classify work into human-core, AI-assisted, agent-doable, and agent-forbidden.

### Bands

| Band | Meaning | Required UI label |
|---|---|---|
| Human-core | Judgment, trust, accountability, ethics, relationship | Human owns |
| AI-assisted | AI helps produce or analyse, human controls | AI helps |
| Agent-doable | Bounded repeatable action may run as workflow | Agent candidate |
| Agent-forbidden | Too risky, too sensitive, or lacks owner | Blocked |

### Required Controls

- Agent-forbidden is not hidden.
- Agent-doable is not deployable until governance passes.
- AI-assisted does not imply automation.
- Human-core is shown as durable value, not residue.

### Acceptance

- Every promoted agent candidate has an Agent Identity object.
- Every agent candidate has a named human owner or is blocked.
- No autonomous path exists without risk tier and approval mode.

---

## RIN9. Governance Ledger Slice

### Goal

Make governance visible as a first-class product surface.

### Required Checks

1. Risk Assessment.
2. Human Accountability Chain.
3. Technical Guardrails.
4. End-User Transparency.
5. Agent Identity Management.
6. Multi-Agent Coordination Metrics.

### Gate Logic

```text
if no human_owner -> block
if no allowed_actions -> block
if forbidden action requested -> block
if risk_tier high and approval_mode not human_in_loop -> block
if ownerless_actions > 0 -> block
if conflicting_outputs > 0 -> needs_human
if evidence confidence thin -> withhold
```

### Acceptance

- The Decision panel always shows governance status.
- A user can see why a recommendation is allowed, withheld, or blocked.
- Every autonomous action is traceable to human owner and source evidence.

---

## RIN10. Critic Agent Slice

### Goal

Prevent V3 from becoming confident tool soup.

### Critic Questions

- Is this a ghost job or compliance posting?
- Is the job title hiding multiple roles?
- Is the sample too thin?
- Are we over-merging duties?
- Is an agent candidate actually a human accountability problem?
- Is the platform or ATS shaping the evidence?
- Did live data create false confidence?
- Should the system withhold?

### Acceptance

- Critic objections render in Panel 3.
- At least one objection can force a withhold state.
- The user sees "why not trust this yet" before acting.

---

## RIN11. Live Data And Anti-Gaming Slice

### Goal

Make live data useful without making it falsely authoritative.

### Live Data Sources

- MyCareersFuture postings.
- MOM vacancy or labour-market data where available.
- ESCO occupation and skill data.
- SSOC / ISCO / SOC crosswalk data.
- Company posting sets.
- Existing deterministic engine outputs.

### Anti-Gaming Flags

| Flag | Evidence |
|---|---|
| Ghost risk | Long-open, reposted, no hiring movement where data exists |
| Template stuffing | Vague broad requirements, excessive skill pile |
| Role mash-up | Duties span incompatible functions |
| Compliance posture | Posting may satisfy process but not reflect active hiring |
| Platform distortion | Paid or ranked visibility may affect what user sees |
| ATS opacity | Candidate-impacting filter unknown or unverifiable |

### Acceptance

- Live data always shows retrieval state.
- Any unavailable source is marked `[UNVERIFIED: reason]`.
- No market read is produced from thin data without caveat.

---

## RIN12. Internationalisation And Accessibility

### Requirements

- All new UI strings use a string table.
- Supported planning languages: en, zh, ms, ta.
- CJK-safe fonts and wrapping.
- Buttons and interactive nodes are keyboard reachable.
- Screen-reader labels on graph controls.
- No red/green-only state.
- Minimum WCAG AA contrast.
- Touch target minimum: 44px.

### Acceptance

- iPhone and iPad mini layouts do not clip labels.
- Long translated strings wrap cleanly.
- Graph controls are usable by keyboard.
- Status does not depend on colour alone.

---

## RIN13. PR Sequence

| PR | Title | Type | Main output |
|---|---|---|---|
| RIN0 | Charter and implementation spec | Docs | `doc/v3-reinvention-charter.md`, this spec |
| RIN1 | 3-panel adaptive shell | UI | Context / Map / Decision layout |
| RIN2 | RoleGraph preservation and polish | UI + engine wiring | Existing RoleGraph in new shell |
| RIN3 | OrgGraph commonisation | Engine + UI | Common duty/capability/process graph |
| RIN4 | BPR process redesign read | Engine + UI | AS-IS / friction / TO-BE hypothesis |
| RIN5 | Agent Identity model | Engine + UI | Agent identity cards and schema |
| RIN6 | Governance Ledger | Engine + UI | Risk, owner, guardrails, transparency |
| RIN7 | Critic Agent | Engine + UI | Challenge and withhold path |
| RIN8 | i18n, a11y, responsive hardening | UI quality | iPad mini, iPhone, desktop verification |
| RIN9 | Live deployment verification | Ship gate | Live Vercel and real data check |

---

## RIN14. Test Plan

### Unit / Snapshot

- RoleGraph fixed input -> identical graph payload.
- OrgGraph fixed company payload -> identical clusters.
- Agent Identity missing owner -> blocked.
- Governance Ledger ownerless action -> blocked.
- Thin evidence -> withhold.
- Overmerge risk high -> human review.

### Responsive

- Desktop wide.
- iPad mini portrait.
- iPad mini landscape.
- iPhone portrait.
- iPhone landscape.

### Accessibility

- Keyboard navigation across all three panels.
- Screen-reader labels for graph nodes and panel switches.
- No colour-only status.
- 44px touch targets.
- AA contrast.

### Governance

- Agent candidate without risk assessment cannot be deployable.
- Agent candidate without named human owner cannot be deployable.
- Any forbidden action blocks.
- Coordination metrics visible when multiple agents participate.
- Critic Agent can force withhold.

### Live

- Verify on deployed Vercel surface.
- Confirm MCF live postings load.
- Confirm provenance chips render.
- Confirm thin company sample withholds.
- Confirm iPad mini and iPhone screenshots are readable.

---

## RIN15. Definition Of Done

A V3 reinvention slice is done only when:

- Build is green.
- Deterministic snapshots are green.
- Accessibility pass is green.
- iPad mini, iPhone, and desktop visual checks pass.
- Live deployed surface reflects the change.
- No red/green-only status exists.
- Every new figure has provenance.
- Every agentic recommendation has risk, owner, identity, and guardrails.
- Human Lead can answer: what is the decision, what is the evidence, who is accountable?

---

## RIN16. Implementation North Star

```text
Keep V2 clarity.
Keep RoleGraph.
Add OrgGraph.
Use BPR to question the role itself.
Use agents only inside governance.
Make the human owner visible.
Withhold when evidence is thin.
```

