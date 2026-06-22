---
name: careerview-panel
description: Run the 11-agent SG Career View panel — each stakeholder argues from its seat (grounded in a real data source), then synthesise into two sides + a verdict + actions. Use to stress-test a candidate↔role match, a job description, or a v3 design decision. Non-inventive: every claim ties to live MCF data, the ESCO taxonomy, anatomy.js scores, or verified MOM/EDB/SkillsFuture facts.
---

# SG Career View — 11-agent panel orchestrator

## When to use
- Pressure-test a **candidate ↔ role** match before applying or shortlisting.
- Audit a **job description** for distortion, keyword games, or fairness/age risk.
- Sanity-check a **v3 design or build decision** from every stakeholder's incentive.

## How to run
1. Decide scope: the **whole panel** (all 11) or a **relevant subset** (e.g. ATS + HR + Skeptic for a fairness check).
2. Invoke each agent skill — they run independently and each returns its structured view:
   `agent-client`, `agent-director`, `agent-hiring-manager`, `agent-hr`, `agent-recruiter`,
   `agent-platform-ceo`, `agent-platform-engineer`, `agent-ats`, `agent-jobseeker`,
   `agent-academic`, `agent-skeptic`.
3. **Synthesise**: the two sides (candidate vs employer), the distortion chain, a verdict, and
   concrete actions — drawing on the specific agent outputs, grounded only in verified facts.

## Verified-facts envelope (shared by every agent — never contradict)
- **Skills over degrees (MOM Job Vacancies 2024):** 58.1% of vacancies open to candidates *below*
  the stated qualifications; 78.8% say academic qualification was *not* the main hiring factor.
  *(The old "74.9%" is wrong — do not use it.)*
- **"AI Application" skill demand rose ~97%** "in recent years" (SkillsFuture SDFE 2023/24); 24 priority skills.
- **"AI talent +565%" is 2016–2022 historical** (EDB/LinkedIn, Sep 2023) — NOT a current surge.
- **FCF:** EP/S-Pass roles must be advertised on MyCareersFuture ≥14 days; some listings are
  compliance-only / pre-decided *(mechanism real; share unknown)*.
- **REFUTED:** "AI resume-sorting is common in SG." Screening is still mostly **keyword filters + humans** — optimise for the human.

## Non-invention rules
- Each agent speaks only from its real data source (see `README.md`).
- Deterministic numbers are computed, then narrated — never fabricated.
- Mark "[UNVERIFIED]" rather than guess; disclose each seat's own bias.
- The candidate is the only source of **proof artifacts** (live URLs, named projects); the system cannot generate them.

## Grounding
Evidence weighting follows Schmidt & Hunter (1998) — work samples > degree/experience. See
`doc/v3-research-grounded-model.md` for the full citation set.
