# Findings - "Application Volume Reality" chat and PR

10-07 '26 22:10 SGT · searched claude.ai chat history + `ang-kl/2026-0313_AI-JS` git history (last 55 PRs, #316-#371)

## 1. The chat

[§1.1] It was **not a claude.ai chat** - which is why conversation search returned nothing from today. It was a **Claude Code session**, recorded in the merge commit's trailer:

- Session: `https://claude.ai/code/session_01KudaR9L9j1cWWLugjpefD5`
- Trigger recorded in the commit body: *"Human Lead, via /goal: 90% of SG private-sector and SG.Gov roles draw 100+ applicants, a meaningful share 1,000+."*

[§1.2] Note on timing: the commit's author timestamp is **10-07 '26 11:08 SGT** (morning, not evening). If there was a *second* evening exchange on the same theme, it left no trace in either claude.ai history or the repo up to HEAD (`0f3c58c`, 21:56 SGT tonight) - the only "goal / applicants / interview" artefact today is this one.

## 2. The PR

[§2.1] **PR #359 - "Add 'Application Volume Reality' to the goal blueprint" (v3.0.276)**
`https://github.com/ang-kl/2026-0313_AI-JS/pull/359` · merged as `8dfd7c7`, 10-07 '26 11:08 SGT · 4 files, +22/-3

[§2.2] What it did - added **§0.2** to `v3/goal/v3-blueprint.md`, directly after Product DNA (§0.1). Core content of the new section:

- The market is adversarial by volume, not malice: the large majority of SG private-sector and SG.Gov postings draw 100+ applicants; a meaningful share draw 1,000+.
- "A candidate is not competing against the job description. A candidate is competing against a queue."
- Standing out on paper is close to structurally impossible at that ratio - so V3's job is reframed: not "help this application look better" but *"help this specific candidate walk into a screen or interview and be genuinely, verifiably the strongest reasoned case in the room."*

[§2.3] It also logs **two standing open questions** (deliberately unresolved - framing, not feature):

1. **Currency of the AI-capability read** - exposure classifications must be periodically refreshed against the current AI frontier, sourced and dated, never silently re-guessed; withhold rather than narrate a guess.
2. **Stickiness toward the actual outcome** - what brings a candidate back to rehearse/check/sharpen in the days before a real screen, as genuine utility, not engagement mechanics.

Both bound by §0.1's non-negotiables: no generic advice; every AI-capability claim carries a named source and date.

## 3. Same-day PRs executing that framing (all 10-07, within the last 50)

| PR | Tag | Title | SGT |
|---|---|---|---|
| #360 | TR1 | Sharpen repost/duplicate detector into an actionable triage signal (v3.0.277) | 13:04 |
| #361 | ET1 | Wire employmentType into rsIndicators as a fact-labelled signal (v3.0.278) | 13:21 |
| **#362** | **PB1** | **Add a Pre-interview brief assembling SSOC/MCF/ACRA into one view (v3.0.279)** | 13:31 |
| #363 | WH1 | Reframe mash-up falsification narration from causal guess to hedged fact (v3.0.280) | 13:38 |
| #364 | AN1 | Add honest live-progress narration for Step 3's background fan-out (v3.0.281) | 13:44 |
| #365 | OI1.2 | Wire rsIndicators to an employer's full posting set, not the sample (v3.0.282) | 13:51 |
| #366-#368, #370 | OI1 | Organisation Read panel arc (v3.0.283-286) | 13:57-14:33 |

[§3.1] **PR #362 (PB1)** is the first feature-level answer to §0.2 - the Pre-interview brief card at the top of Step 3's Overview tab, an assembly-only join of SSOC classification + MCF facts + ACRA/SSIC record. The remediation spec I wrote earlier this session already references PB1 in the connector plan (Part C, `overview` tab links).

## 4. Direct references

- Blueprint section: `v3/goal/v3-blueprint.md` §0.2 (lines ~82-100 at HEAD)
- Commit: `git show 8dfd7c7`
- PR: #359 · Session: `session_01KudaR9L9j1cWWLugjpefD5`

*AI-assisted; human decides.*
