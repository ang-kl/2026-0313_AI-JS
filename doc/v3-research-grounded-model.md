# SG Career View v3 — research-grounded information model

Built on established world frameworks (not invented). Every component maps to a real repo data
source **and** a cited paper/standard. ~40 sources gathered via an 8-domain literature sweep with
per-citation verification; sources that failed to open are disclosed, not hidden.

> **Method note:** one verification agent hung on an external fetch, so the final synthesis was
> written by hand from the verified harvest. Most citations were opened & confirmed; a handful
> (paywall / 403 / a hung URL) are flagged **[unverified URL]** below.

---

## Thesis — don't reinvent; stand on the literature

v3 should not invent a scoring scheme. It should **reuse the world's standard occupation/skill
ontologies and the strongest empirical findings**, and confine the LLM to *narrating* the numbers
those standards produce.

### The single most important finding (for a candidate like Adrian)

**Selection-validity hierarchy** — Schmidt & Hunter (1998, *Psychological Bulletin*), 85 years of
personnel-selection research: **work-sample tests r = .54**, general mental ability r = .51,
structured interview r = .51 … **years of experience r = .18, education level r = .10**.

→ A candidate's **live builds are work samples** — the *highest-validity* evidence of performance,
above degree and tenure. The market screens on the weakest fields (age, degree, title) and ignores
the strongest. **v3's job is to invert that weighting.**

---

## The reuse-not-reinvent stack

| Layer | Standard to reuse | What it provides |
|---|---|---|
| Occupation ontology | O*NET (US DOL), ESCO v1.2.1 (EU), ISCO-08 (ILO), SSOC + SkillsFuture Skills Frameworks (SG) | the non-inventive backbone (occupations + essential/transferable skills) |
| Cross-walking | ESCO–O*NET Crosswalk (EC, 2024) | all 3,039 ESCO occ → O*NET, 85–90% match — portability |
| SG integration | Dynamic Jobs-Skills Knowledge Graph — GovTech + SkillsFuture (2024) | govt-validated graph fusing ISCO/ESCO/O*NET/**SSOC** + postings |
| Skill extraction | ESCOXLM-R, SkillSpan, Decorte neg-sampling (Zhang/Plank et al.) | SOTA span-extraction of skills from CV/JD text → linked to ESCO |
| Match / rank | ConFit (RecSys 2024), CareerBERT (ESWA 2025) | bi-encoder + contrastive resume↔job matching (+19–31% nDCG) |
| AI-exposure | AIOE index (Felten-Raj-Seamans), SML rubric (Brynjolfsson-Mitchell-Rock), Eloundou (GPTs are GPTs) | ready-made, O*NET-linked task→AI-exposure scores |
| Adjacency | labour-flow mobility network (del Rio-Chanona/Mealy/Farmer 2021), skill relatedness (Neffke-Henning), transition-potential P(S→T) (Waters-Shutters) | which occupations are *reachable* from a person's blend |
| Fairness gate | EEOC four-fifths (29 CFR 1607.4(D)); p%-rule (Feldman 2015); WFA 2025 + TGFEP (SG) | computable adverse-impact test + SG legal audit trail |

---

## Components (each grounded)

### 1. Candidate & Job Fingerprint — *extend `esco.js`*
- **Shows:** the person as an occupation **blend** + extracted ESCO skill set (not one mislabelled title), mapped to SSOC/O*NET.
- **Method:** skill-span extraction (ESCOXLM-R / SkillSpan / Decorte) → link to ESCO → resolve blend; bridge to O*NET via the EC crosswalk; SG layer per the GovTech+SSG graph.
- **Grounded in:** Zhang et al. (2023, ACL); Zhang et al. (2022, NAACL); ESCO–O*NET Crosswalk (EC 2024); Seif/Toh/Lee (2024, RecSysHR).
- **Repo:** extend `esco.js occupationFingerprint` to the person side.
- **Limits:** ESCO is EU; mis-maps some SG/healthcare roles → blend with SkillsFuture; below confidence, flag "sector-gap".

### 2. True-Fit Match + Proof Ledger — *core*
- **Shows:** per-target skill overlap **per layer, weighted by rarity**; every "MET" bound to a verifiable artifact on a tier (A live/referee · B cert · C self-asserted = "claimed", never "covered").
- **Method:** dense bi-encoder retrieval (ConFit / CareerBERT) for recall + deterministic ESCO set-overlap for the score; **evidence weighted by Schmidt-Hunter validity**. LLM only narrates.
- **Grounded in:** Yu et al. (2024); Rosenberger et al. (2025); Schmidt & Hunter (1998); Wolgast et al. (2017).
- **Repo:** `occupationFingerprint` + `putProfile` + `screen_keyword_gaps` + a new rarity-weighted matcher; score server-recomputed.
- **Limits:** embeddings can spuriously match → gate with the verifiability tier + a capped proof-multiplier.

### 3. Duty AI-exposure / AI-resilience — *re-ground `anatomy.js`*
- **Shows:** each duty tagged routine vs non-routine + an AI-exposure band; role resilience = concentration in non-routine interactive/judgment work.
- **Method:** classify with the ALM routine-task taxonomy; score with the AIOE index (O*NET-linked) + SML rubric + LLM-exposure. Replace hand-coded layer constants with published scores.
- **Grounded in:** Autor, Levy & Murnane (2003, QJE); Felten, Raj & Seamans (2021, SMJ); Brynjolfsson, Mitchell & Rock (2018, AEA P&P); Eloundou et al. (2024, Science).
- **Repo:** `anatomy.js scoreJobAnatomy` + 5 layers.
- **Limits:** exposure ≠ automation (capability vs adoption); present as "exposure".

### 4. Demand-Proof + Adjacency Routing — *planned tables*
- **Shows:** is the seat real & senior-inclusive? live count (rolling 9/30-day), salary p25/p50/p75, experience band, outsourcing/FCF share; plus *reachable* adjacent occupations.
- **Method:** occupational-mobility network (nodes = occupations, edges = transition probability) + directional P(S→T); gate targets on real demand. Default if not real: **"do not spend."**
- **Grounded in:** del Rio-Chanona/Mealy/Farmer (2021); Neffke & Henning (2013); Waters & Shutters (2022); OECD (2024).
- **Repo:** planned `mcf_market_daily` + an occupation-transition matrix from MCF flows.
- **Limits:** MCF counts noisy/seasonal → rolling windows + confidence; outsourcing classifier FP-rate unknown → caveat + hand-labelled sample.

### 5. Signal-vs-Index field classifier — *new*
- **Shows:** every CV/JD field tagged **index** (unalterable — age, grad-year → excluded from the maths) vs **signal** (alterable — must pass cost-to-fake × validity before it counts).
- **Method:** Spence's index/signal distinction; down-weight cheap low-validity credentials, up-weight verifiable work.
- **Grounded in:** Spence (1973); Akerlof (1970); Caplan (2018); Araki & Kariya (2022, ESR).
- **Repo:** a parsing rule layer over `putProfile` tiers.
- **Limits:** some "indices" (licences) are genuinely required → keep a lawful-requirement allow-list.

### 6. Fairness self-check + WFA audit trail — *new, legally required*
- **Shows:** a disparate-impact check on the ranking + a per-decision audit record defensible under SG law.
- **Method:** p%-rule (target ≥ 80% = four-fifths) per protected group per stage; record which fairness criterion was used; don't import US thresholds verbatim — satisfy PDPA + TGFEP/WFA. AI outputs must be **traceable & checkable before any decision**.
- **Grounded in:** EEOC Uniform Guidelines 1978 (29 CFR 1607.4(D)); Feldman et al. (2015); Raghavan et al. (2020); Sanchez-Monedero et al. (2020); K&L Gates on WFA (2025).
- **Repo:** a fairness-audit view over `anatomy.js` (counts, never PII).
- **Limits:** fairness criteria can conflict — declare which one and why.

### 7. Age-exposure handling — *SG-specific*
- **Shows:** flags only *explicit* exclusions ("fresh/junior only", coded "digital-native"), framed "this ad is gated — route via referral", never "you're too old". Age & grad-year dropped from features.
- **Method:** statistical-discrimination correction — strip age proxies, lead with work-sample evidence; apply from mid-career (bias starts ~40).
- **Grounded in:** Neumark, Burn & Button (2017/2019); Lahey (2008); Carlsson & Eriksson (2019); TGFEP + Workplace Fairness Act 2025.
- **Repo:** a JD-language scanner + feature exclusion in the matcher.
- **Limits:** never a "payback/runway" framing; price on cost-of-gap-closed, not tenure-remaining.

### 8. Hidden-Worker reframe + org-profit case — *employer view*
- **Shows:** candidate classified as a **hidden worker**; an employer Fair Scorecard (duty grid + skills overlap, priced to live p50, cost-of-gap vs cost-of-hire).
- **Method:** Hidden-Workers diagnosis + STARs skill-overlap; org-profit from degree-reset evidence. **Calibration:** dropping the degree filter alone barely moves hiring — change the *ranking* too.
- **Grounded in:** Fuller et al., "Hidden Workers" (HBS/Accenture 2021) [88% of employers say their ATS rejects qualified candidates; 99% of F500 use ATS]; "Dismissed by Degrees" (2017); "Emerging Degree Reset" (Burning Glass 2022); STARs (Opportunity@Work 2020); "Skills-Based Hiring: The Long Road" (HBS/Burning Glass 2024) [degree-drop alone = +3.5pp, <1 in 700].
- **Repo:** the daily gap pass writes the brief + scorecard; exposed via MCP.
- **Limits:** don't become a course-seller or boutique trick; track which briefs convert.

---

## How the grounded model reads Adrian (55, transformation + governed-build)

- A textbook **hidden worker** (Fuller 2021) — screened out by the ATS 88% of employers admit rejects qualified people. Not weak — *filtered*.
- His **live builds are the highest-validity signal that exists** (Schmidt-Hunter: work sample r=.54) — they outrank the degree (.10) and years (.18) the market screens on.
- His work sits in **non-routine interactive/judgment** tasks (ALM 2003; AIOE) — the AI-resilient end; 25 years there is a costly signal a younger applicant can't fake (Spence).
- **Age is a statistical-discrimination proxy** (Neumark; Lahey) — strip it from the maths, counter with proof. SG's WFA 2025 makes age the first protected characteristic.
- **Route to reachable adjacent roles** (Waters-Shutters; del Rio-Chanona) where transition-potential is high and demand is real; spend the one referral there (OECD: mid-career change raises later-life employment +8pp).

---

## Open problems (where the literature is thin for this use)
- **SG-specific matching** — most extraction/matching models are EU/US-trained; the GovTech+SSG graph exists but isn't a public model.
- **Causal value of proactive routing** — the OECD +8pp is correlational; no RCT.
- **Fairness-criterion conflict** — four-fifths vs individual fairness can't both hold; SG has no settled computational standard.
- **Ghost/compliance-post share** — mechanism documented, prevalence unmeasured (needs a hand-labelled SG sample).

---

## Sources (verification disclosed)

Opened & confirmed unless marked **[unverified URL]** (real, but the exact URL 403'd / is paywalled / hung).

1. Schmidt & Hunter (1998). The Validity and Utility of Selection Methods. *Psychological Bulletin* 124(2):262–274.
2. Autor, Levy & Murnane (2003). The Skill Content of Recent Technological Change. *QJE* 118(4). NBER w8337.
3. Felten, Raj & Seamans (2021). Occupational/Industry/Geographic Exposure to AI (AIOE). *SMJ* 42(12).
4. Brynjolfsson, Mitchell & Rock (2018). What Can Machines Learn (SML rubric). *AEA P&P* 108.
5. Eloundou, Manning, Mishkin & Rock (2024). GPTs are GPTs. *Science* 384(6702).
6. **[unverified URL]** WEF (2025). The Future of Jobs Report 2025. *(URL fetch hung.)*
7. **[unverified URL]** Spence (1973). Job Market Signaling. *QJE* 87(3):355–374. *(real; OUP abstract.)*
8. Akerlof (1970). The Market for "Lemons". *QJE* 84(3):488–500.
9. Caplan (2018). The Case Against Education. Princeton UP.
10. Araki & Kariya (2022). Credential Inflation and Decredentialization. *European Sociological Review* 38(6).
11. Raghavan, Barocas, Kleinberg & Levy (2020). Mitigating Bias in Algorithmic Hiring. *ACM FAT\**.
12. Sanchez-Monedero, Dencik & Edwards (2020). Automated Hiring Systems (UK). *ACM FAT\**.
13. Feldman, Friedler, Moeller, Scheidegger & Venkatasubramanian (2015). Certifying and Removing Disparate Impact. *KDD*.
14. EEOC (1978). Uniform Guidelines, 29 CFR 1607.4(D) — four-fifths rule.
15. K&L Gates (2025). AI in Recruitment & Singapore's Workplace Fairness Act.
16. Neumark, Burn & Button (2017). Age Discrimination & Hiring of Older Workers. *FRBSF Economic Letter* 2017-06.
17. Neumark, Burn, Button & Chehras (2019). State Laws & Age Discrimination. *J. Law & Economics* 62(2).
18. Lahey (2008). Age, Women, and Hiring. *J. Human Resources* 43(1). NBER w11435.
19. **[unverified URL]** Carlsson & Eriksson (2019). Age Discrimination in Hiring (Sweden). *Labour Economics* 59. *(ScienceDirect 403; corroborated via RES briefing.)*
20. TAFEP / MOM — Tripartite Guidelines on Fair Employment Practices + Workplace Fairness Act 2025.
21. Fuller, Raman, Sage-Gavin & Hines (2021). Hidden Workers: Untapped Talent. HBS/Accenture.
22. **[unverified URL]** Fuller & Raman (2017). Dismissed by Degrees. HBS/Accenture/Grads of Life.
23. Sigelman (2022). The Emerging Degree Reset. Burning Glass Institute.
24. HBS / Burning Glass (2024). Skills-Based Hiring: The Long Road from Pronouncements to Practice.
25. Opportunity@Work (2020). Reach for the STARs.
26. del Rio-Chanona, Mealy, Beguerisse-Díaz, Lafond & Farmer (2021). Occupational mobility & automation. *J. R. Soc. Interface* 18.
27. Neffke & Henning (2013). Skill relatedness and firm diversification. *SMJ* 34(3).
28. Waters & Shutters (2022). Skills-approximate occupations. *Applied Network Science* 7.
29. **[unverified URL]** OECD (2024). Promoting Better Career Choices for Longer Working Lives.
30. Rosenberger et al. (2025). CareerBERT. *Expert Systems with Applications*.
31. Saroglou et al. (2024). Job Matching with ESCO & EQF. arXiv 2512.03195.
32. Wolgast, Bäckström & Björklund (2017). Tools for fairness: structured selection. *PLoS One* 12(12).
33. European Commission (2024). ESCO–O*NET Crosswalk.
34. Seif, Toh & Lee (2024). A Dynamic Jobs-Skills Knowledge Graph (GovTech + SkillsFuture SG). *RecSysHR 2024*.
35. Zhang, van der Goot & Plank (2023). ESCOXLM-R. *ACL*.
36. Zhang, Jensen, Sonniks & Plank (2022). SkillSpan. *NAACL*.
37. Decorte et al. (2022). Negative Sampling for Skill Extraction. *RecSys-in-HR*.
38. Senger, Zhang, van der Goot & Plank (2024). Survey on Skill Extraction. *NLP4HR, EACL*.
39. Yu, Zhang & Yu (2024). ConFit: Resume-Job Matching. *RecSys*.
