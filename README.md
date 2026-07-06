# SG Career View v3

**A reviewable work-intelligence system for Singapore job advertisements.**

[takearoundabout.com](https://www.takearoundabout.com) · [v3.takearoundabout.com](https://v3.takearoundabout.com)

SG Career View treats a job advertisement as a manuscript under review. It shows you the source text, the deterministic classification behind each figure, the provenance of every claim, and where the system deliberately withholds instead of guessing. The tool is free, experimental, and human-in-the-loop. It helps you ask better questions and prepare better evidence — it does not decide your value or guarantee any hiring outcome.

## What it does

- **Search** live Singapore postings from [MyCareersFuture](https://www.mycareersfuture.gov.sg) + [careers.gov.sg](https://careers.gov.sg), with an [SSOC 2024](https://www.singstat.gov.sg/standards/standards-and-classifications/ssoc) occupation typeahead.
- **Curate** a shortlist with a deterministic exposure-band overview (Full automation / AI-augmented / AI-assisted / Human-led) computed from SingStat SSOC → ISCO-08 → AIOE mappings. No LLM authored numbers.
- **Review** the posting you pick in a Review Studio: verbatim manuscript, O-I-A dissection, rule-based reviewer persona comments, provenance + confidence chips, live Role Graph.

## Trust loop

Every meaningful figure on the result page can be traced along one path:

```
source evidence → deterministic computation → provenance label → confidence / withhold → human action
```

If any link is weak — the source is thin, the rule is a heuristic, the classification did not match — the surface withholds instead of guessing. Provenance chips (`from posting`, `from MCF`, `computed`, `derived`, `AI estimate`, `unverified`) mark the source class of every claim.

The full architecture and governance rules are in [`v3/README.md`](./v3/README.md).

## Status

**v3 is in active beta.** Some Review Studio surfaces are still labelled "next build phase". The blueprint is broader than what ships today, and that is honestly reflected in the reconciliation audit at [`v3/script/v3-step3-blueprint-reconciliation.md`](./v3/script/v3-step3-blueprint-reconciliation.md).

## Author's note

A side project built in spare moments out of genuine curiosity about where work is heading. Each query does cost a little on my end, so please bear with the occasional slow response — I top up the credits as I go.

If you find it useful, or even if you don't, I'd love to hear from you. A quiet DM on LinkedIn with where you're from and a line of feedback. No pressure — just a conversation.

Adrian K. L. Ang · [linkedin.com/in/angadrian](https://www.linkedin.com/in/angadrian) · feedback@takearoundabout.com

*Sometimes the scenic route is the right one.*

## Licence

GNU Affero General Public License v3.0. See [LICENSE](./LICENSE).
