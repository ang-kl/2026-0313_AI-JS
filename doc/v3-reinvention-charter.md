# SG Career View v3 - Reinvention Charter

> **Status:** DRAFT_READY_FOR_HUMAN_REVIEW.
> **Date:** 2026-06-24.
> **Scope:** Charter only. No app code changes are authorised by this file.
> **Source note:** The exact public IMDA "Model AI Governance Framework for Agentic AI v1, Jan 2026" source could not be verified from an official IMDA URL during this drafting pass. The Agentic AI governance indicators supplied by the Human Lead are treated as the governing design contract and are marked as **[UNVERIFIED: exact public source not found]** until linked.
> **Related repo docs:** `doc/v3-research-grounded-model.md`, `doc/v3-engine-wiring-spec.md`, `v3/script/v3-result-engine-spec.md`, `v3/script/v3-company-agents-spec.md`, `v3/script/v3-wikigraph-spec.md`, `v3/script/v3-pillars-spec.md`.

---

## 1. Charter Thesis

V3 is not a job analyser.

V3 is a governed agentic work-system intelligence tool for the Singapore labour market.

The product starts from a job posting because that is what people can see. It must not stop there. A vacancy is treated as evidence of work demand, organisational friction, capability need, and possible process redesign. The job ad is the entry point; the work system is the object of analysis.

The core question is:

```text
Is this best solved as a human role, a redesigned process, an accountable agentic workflow, or a deliberate decision not to act?
```

---

## 2. What V3 Must Preserve From V2

V2 had an edge people liked: it was fast, direct, and easy to understand.

V3 must keep that edge.

The first 30 seconds of V3 must still feel like:

```text
I give a role.
The system helps me understand the role.
I can act.
```

V3 upgrades the evidence, not the user's burden. Live MCF, MOM, ESCO, SSOC, ISCO, AIOE, and company data should make the read stronger, not heavier.

The RoleGraph stays. It is the concrete, visual anchor that lets a user see one role being dissected into duties, skills, occupation logic, and AI exposure.

---

## 3. The New Unit Of Analysis

V3 rejects title-first analysis.

Job titles are noisy. They vary by employer, industry, salary band, HR template, and platform convention.

V3 analyses work at five layers:

| Layer | Purpose | Risk |
|---|---|---|
| Role | The visible job container | Titles can mislead |
| Duty | The actual work statements | Same words can mean different work |
| Capability | The reusable business ability | Needs careful commonisation |
| Process | The value stream and handoffs | Often hidden in one ad |
| Agentic control | What human, AI, and agent each do | Governance must be explicit |

The organisation perspective commonises roles by duty, capability, process, and governance need. It must never flatten role-specific nuance into a fake average.

---

## 4. Methodology

The methodology is **Governed Agentic Work Reconstruction**.

It combines six methods already present in the repo:

1. Vacancy forensics.
2. Evidence-weighted role reconstruction.
3. RoleGraph dissection.
4. Organisation work graph commonisation.
5. BPR value-stream diagnosis.
6. Agentic governance and human accountability.

Formal method:

```text
Decision = Evidence + Work-System Map + Agentic Risk + Human Judgment
```

Operational chain:

```text
Vacancy -> RoleGraph -> OrgGraph -> BPR Read -> Agentic Split -> Governance Ledger -> Human Decision
```

---

## 5. PhD-Style Synthesis

```html
<paper id="v3-governed-agentic-work-reconstruction">
  <title>
    Governed Agentic Work Reconstruction:
    From Job Posting To Accountable Work-System Design
  </title>

  <abstract>
    This project reframes a job posting as an evidence artefact of
    organisational demand rather than a complete description of work.
    It reconstructs the role, commonises duties across employer postings,
    maps process friction, identifies human-agent work boundaries, and
    exposes governance obligations before recommending action.
  </abstract>

  <research-question>
    When a company advertises a role, is it expressing a need for a person,
    a redesigned process, an accountable agentic workflow, or a decision
    gate that should withhold action?
  </research-question>

  <method>
    <step>Collect live and cited evidence.</step>
    <step>Dissect one vacancy into a RoleGraph.</step>
    <step>Commonise multiple roles into an Organisation Work Graph.</step>
    <step>Diagnose process friction using BPR and value-stream logic.</step>
    <step>Split work into human-core, AI-assisted, agent-doable, and agent-forbidden.</step>
    <step>Attach risk, owner, identity, audit trail, and human override.</step>
  </method>

  <contribution>
    V3 shifts hiring analysis from candidate-title matching to governed
    work-system reasoning. It lets candidates, managers, HR, and regulators
    see what work is real, what is duplicated, what can be redesigned, and
    where autonomous systems must remain accountable to named humans.
  </contribution>
</paper>
```

---

## 6. Ethos

Every V3 feature must express these values.

| Ethos | Product meaning | Failure mode to avoid |
|---|---|---|
| Curiosity | Show alternative system routes: hire, train, redesign, agentise, stop | One-answer automation |
| Collaborativeness | Make human-agent boundaries visible | Agents pretending to be owners |
| Customer Focus | Ground every action in end-user value | Pretty graphs without decisions |
| First Principles Understanding | Explain why work exists before listing skills | Superficial keyword matching |
| Domain Breadth | Connect HR, ops, compliance, finance, customer value | Narrow career-coach framing |
| Systemic Thinking | Map dependencies, handoffs, roles, agents, feedback | Isolated role cards |
| Judgment & Discernment | Show when to overrule autonomous output | Blind trust in AI recommendations |

---

## 7. Governance Commitments

The Agentic AI governance indicators supplied by the Human Lead are mandatory design constraints.

### 7.1 Required Indicators

| Indicator | V3 rule |
|---|---|
| Risk Assessment | Every agent recommendation must pass a structured upfront risk verification before it can be labelled deployable |
| Human Accountability Chains | Every autonomous action must map to a designated named human owner |
| Technical Guardrails | Tool scopes, schema validation, permission limits, rollback, kill switch, and logs are embedded across lifecycle |
| End-User Transparency | Users must know when they interact with an agent and exactly what that agent can execute |
| Agent Identity Management | Every agent has identity, purpose, owner, allowed actions, forbidden actions, expiry, and audit trail |
| Multi-Agent Coordination Metrics | Escalation loops, delegation depth, conflicting outputs, and ownerless actions are measured and surfaced |

### 7.2 Governance Non-Negotiables

- No agent has final authority.
- No agent performs an action without a declared scope.
- No autonomous action is ownerless.
- No candidate-impacting decision is hidden behind a black-box score.
- No live-data figure renders without provenance.
- No thin evidence becomes a confident recommendation.
- No red/green-only state language is used.

---

## 8. The Seven Analysis Agents

V3 should use seven bounded analysis agents. These are not free-roaming autonomous workers; they are governed analytic roles with fixed inputs, fixed outputs, and human oversight.

| Agent | Job | Output | Authority |
|---|---|---|---|
| Evidence Agent | Verify live and cited sources | Provenance, confidence, withhold flags | Cannot recommend action |
| Role Agent | Build RoleGraph for one posting | Duties, skills, role twin, exposure | Cannot generalise across company alone |
| Organisation Agent | Commonise roles across employer postings | OrgGraph and capability clusters | Cannot claim process redesign alone |
| BPR Agent | Identify friction, handoffs, duplicated work | AS-IS and TO-BE process hypotheses | Cannot declare savings or layoffs |
| Agentic Agent | Split work by human, AI, agent, forbidden | Agent candidates and work partition | Cannot label deployable without Governance Agent |
| Governance Agent | Check risk, owner, identity, scope, audit | Governance ledger and risk gate | Can block recommendations |
| Critic Agent | Challenge evidence, bias, ghost jobs, gaming | Objections and alternative hypotheses | Can force withhold or human review |

The Human Lead sits above all seven agents.

---

## 9. Personas

V3 serves multiple personas without becoming tool soup.

| Persona | Primary question | V3 answer |
|---|---|---|
| Candidate | Should I apply and what proof do I need? | Apply, skip, prepare, prove |
| Career switcher | What adjacent work transfers? | Duty and capability bridge |
| Senior worker | Where is my judgment still valuable? | Human-core and stewardship read |
| Recruiter | Is this role fair and evidence-based? | Ad, duty, and proof audit |
| Hiring manager | Do I need a person, process fix, or agent? | Role/process/agent decision |
| HR / org design | Why are roles mashed together? | OrgGraph commonisation |
| BPR team | What process should be redesigned? | AS-IS, friction, TO-BE hypothesis |
| Regulator / policy user | Is hiring AI explainable and accountable? | Governance and provenance ledger |

---

## 10. Product Form

The UI remains a 3-panel system.

| Panel | Name | Function |
|---|---|---|
| Panel 1 | Context | Role, company, process question, persona mode |
| Panel 2 | Map | RoleGraph, OrgGraph, duties, capabilities, process, stakeholders |
| Panel 3 | Decision | Apply, skip, redesign, build agent, risk, owner, provenance |

Responsive rules:

- Desktop: three columns.
- iPad landscape: three columns with tighter side panels.
- iPad portrait: context becomes a top strip, map remains primary, decision becomes side or bottom drawer.
- iPhone: three panels become tabs: Ask, Map, Decide.

The UI must never degrade into a long stack of unrelated cards.

---

## 11. Anti-Gaming Position

V3 exists in a hiring market where platforms, ATS, employers, candidates, and vendors are all adapting to AI.

Known gaming patterns:

- Ghost jobs and pipeline jobs.
- Keyword-stuffed job ads.
- AI-tailored mass applications.
- ATS triage opacity.
- Paid visibility and platform ranking effects.
- In-house templates that mash multiple roles into one.
- AI interview opacity.
- Fake precision in match scores.

V3's defence:

- Live source provenance.
- Withhold over fabricate.
- RoleGraph for one posting.
- OrgGraph for repeated duties across postings.
- Governance ledger for any agentic action.
- Critic Agent to challenge weak evidence.
- Human judgment gate before action.

---

## 12. Non-Goals

V3 must not become:

- A generic resume optimiser.
- A course-selling funnel.
- A replacement-layoff predictor.
- A black-box candidate score.
- A dashboard of disconnected widgets.
- An autonomous hiring decision engine.
- A tool that hides uncertainty to look confident.

---

## 13. Success Criteria

V3 succeeds when a user can answer:

1. What is this role really asking for?
2. Why does the organisation seem to need it?
3. Which duties are common across this employer's roles?
4. Which work should stay human?
5. Which work can be AI-assisted?
6. Which repeated work could become an accountable agent?
7. Who owns every autonomous action?
8. What evidence supports the decision?
9. Where should a human overrule or withhold?

---

## 14. Charter Decision

The V3 reinvention is approved conceptually only when the Human Lead accepts this sentence:

```text
V3 keeps the V2 role-read edge, preserves RoleGraph, adds OrgGraph and BPR, and governs every agentic recommendation through explicit risk, identity, human accountability, and provenance.
```

