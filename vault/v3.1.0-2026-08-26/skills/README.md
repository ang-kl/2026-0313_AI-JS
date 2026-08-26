# v3/skills — the SG Career View agent panel (Claude Code skills)

Each of the 11 stakeholder "agents" is packaged as a reusable Claude Code skill, plus a
`careerview-panel` orchestrator that runs them together. Use them to stress-test a
candidate↔role match, a job description, or a v3 design decision — from every seat at once.

## Design rules (apply to every agent skill)
1. **Each agent maps to a real, non-inventive data source** — it speaks only from what the
   system can actually observe (live MCF data, the ESCO taxonomy, `anatomy.js` scores, the
   candidate's own verifiable artifacts, verified MOM/EDB/SkillsFuture facts). No invention.
2. **Deterministic numbers are computed, not narrated.** The agent interprets numbers it is
   given; it never makes one up. "[UNVERIFIED]" over a guess.
3. **Stay inside the verified-facts envelope** (see `careerview-panel/SKILL.md`).
4. **Disclose the seat's own bias / failure mode** — every agent names how it could mislead.

## Agents
| Skill | Seat | Non-inventive data source |
|---|---|---|
| `agent-client` | End customer / business outcome | Recurring demand themes in MCF postings |
| `agent-director` | Dept head (budget + narrative) | MCF salary p25/p50/p75 + seniority bands |
| `agent-hiring-manager` | Owns the vacancy | The real duties — `anatomy.js scoreJobAnatomy` |
| `agent-hr` | Writes the JD / FCF compliance | Stated reqs/quals/knockouts (`putProfile`) + FCF status |
| `agent-recruiter` | Sourcing / TA | Posting recency + funnel timing (MCF dates) |
| `agent-platform-ceo` | Marketplace | Market aggregates (`mcf_market_daily`) |
| `agent-platform-engineer` | Matching/ranking | ESCO `occupationFingerprint` overlap |
| `agent-ats` | The filter | Literal token/knockout reconciliation (`screen_keyword_gaps`) |
| `agent-jobseeker` | The candidate | The candidate's own verifiable artifacts |
| `agent-academic` | Skills advocate | ESCO `reuseLevel` + SkillsFuture 24 priority skills |
| `agent-skeptic` | Critical labour economist | Demand-reality verdict from live market data |

## Run the panel
Invoke `careerview-panel` (runs all 11 + synthesises), or call any single agent skill
directly to get just that seat's view.
