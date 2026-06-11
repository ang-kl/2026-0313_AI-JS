# Reverse Engineering Modern ATS: A Scientific and Algorithmic Synthesis (May 2026)

**Prepared:** 12-05 ’26, SGT
**Compression:** DENSE
**Audience:** Expert / Gold Standard Practice
**Scope:** Resume optimisation against the dominant Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo, iCIMS, SAP SuccessFactors) in May 2026

-----

## 1. Executive Abstract

Modern Applicant Tracking Systems (ATS) in May 2026 operate as multi-stage NLP pipelines that combine deterministic parsing (text extraction, tokenisation, section detection) with probabilistic ranking (BERT/RoBERTa embeddings, cosine similarity, named entity recognition, and in growing share of vendors, knowledge-graph or taxonomy alignment via ESCO/CMAP/O*NET). Reverse engineering them is not folklore: each stage is a measurable function whose input-output behaviour can be probed through controlled experiments, and whose failure modes propagate multiplicatively downstream. This report synthesises peer-reviewed literature (IEEE, ACL, MDPI, arXiv), production reverse-engineering audits (Resume Optimizer Pro 2026, Jobscan 2025, ResumeAdapter 2026), and vendor-specific evidence on the six dominant ATS, and translates them into a falsification-driven protocol for resume optimisation.

The thesis: an ATS is reverse-engineered not by guessing its scoring weights but by converging on a resume whose parsed structured representation is invariant across vendors, whose keyword distribution is dense yet non-saturating against the target job description, and whose semantic embedding maximises cosine similarity to the job description vector without triggering the AI co-pilot’s adversarial detectors.

-----

## 2. System Architecture: The Canonical ATS Pipeline

The dominant architecture across vendors is a five-stage pipeline. Each stage is a function whose error compounds multiplicatively.

Formally:

Pipeline = R ∘ E ∘ N ∘ S ∘ T

where
T: raw file -> linear character stream (text extraction)
S: character stream -> token sequence (tokenisation and sentence segmentation)
N: tokens -> labelled sections (section detection: Experience, Education, Skills, etc.)
E: sections -> tagged entities (NER: PERSON, ORG, ROLE, DATE, SKILL, INSTITUTION, LOC)
R: structured profile + JD vector -> ranked score

### 2.1 Empirical end-to-end accuracy

IEEE (2023) reports modern resume parser field-level accuracy at approximately 87% versus approximately 96% for human readers. Five sequential stages at 95% per-stage accuracy yield:

0.95^5 = 0.7738

That is, ~23% of resumes are degraded at some point in the pipeline before ranking even begins. This figure is corroborated by ResumeAdapter (2026), which attributes ~23% of early-stage ATS rejections directly to parsing errors. The implication is that parsing is the single highest-leverage stage for the candidate to optimise, because no scoring strategy compensates for content the system never extracted.

### 2.2 Cross-vendor variance on identical inputs

Resume Optimizer Pro (April 2026) submitted one identical mid-career resume through Workday, Greenhouse, Lever, iCIMS, and Taleo. The same file produced:

- 3 to 10 extracted skills
- 1 to 2 employment entries
- 1 to 3 bullets per job

That is a parser-dependent variance of more than 3x on the most consequential extracted fields. Reverse engineering must therefore be platform-aware, not generic.

-----

## 3. Algorithmic Foundations

### 3.1 Text extraction (Stage T)

PDF text extraction uses content-stream parsing (PyPDF, pdfminer, Affinda, RChilli, Sovren, or vendor-proprietary equivalents). Image-only PDFs require OCR (Tesseract or commercial vision models) and lose 30-40% field accuracy on scanned documents. Text-based PDFs achieve approximately 96.7% parsability (TopResume audit, 2024).

DOCX extraction uses XML traversal of the OOXML document tree. Text inside Word headers, footers, text boxes, and shapes is in separate XML branches and is silently skipped by approximately 25% of ATS scans (TopResume 2024). Tables are read linearly across rows, which scrambles multi-column layouts.

### 3.2 Tokenisation (Stage S)

WordPiece (BERT family) or SentencePiece (RoBERTa, T5, sentence-transformers) is the standard. Subword tokenisation has two practical consequences:

- Rare technical terms (“Kubernetes”, “ESCO”, “TAFEP”) split into multiple subword tokens. Attention weights distribute across the pieces, which dilutes the single-token signal relative to common dictionary words.
- Acronyms tokenise as single units; full forms tokenise as multiple units. Including both (“Search Engine Optimization (SEO)”) in one line gives the system two distinct token-level representations of the same competency: one literal, one expanded. This is a near-costless gain.

### 3.3 Section detection (Stage N)

Two algorithmic families:

(a) Rule-based regex over canonical headings. Brittle to creative labels. Predominant in Taleo and legacy iCIMS configurations.

(b) Sequence labelling using BILSTM-CRF or BERT-CRF, which assigns probabilistic spans to sections. More robust but harder to debug. IRJMETS (2024) reports F1 around 0.81 for deep-learning section detection on standard CV corpora.

Implication: in any configuration, canonical headings (“Experience”, “Education”, “Skills”, “Certifications”) dominate creative variants. The deep-learning models tolerate creative labels better but still penalise them with lower span confidence.

### 3.4 Named Entity Recognition (Stage E)

Transformer-based NER, fine-tuned BERT or DistilBERT or RoBERTa, is the present standard. Entity classes commonly include: PERSON, EMAIL, PHONE, ORG, ROLE/TITLE, DATE, INSTITUTION, DEGREE, SKILL, LOC.

Key research findings:

- Resume-NER (Singh, GitHub) and the IJIRSET (2024) framework demonstrate the IOB tagging convention with BERT fine-tuned on annotated resume corpora of 500 to 2,000 documents.
- arXiv 2306.13062 (Tobi-Aiyemo et al., 2023) compared six pre-trained transformers on IT-resume NER, with BILSTM-CRF and fine-tuned BERT giving the strongest F1.
- MLAR (arXiv 2507.10472, 2025) is a three-layer LLM-based architecture that achieved an average of 5.4 seconds per resume at scale, 16.9% faster than Automation Anywhere and 17.1% faster than UiPath on 2,400 resumes.

Training-data scarcity is the binding constraint. Most published systems train on fewer than 2,000 annotated resumes, which means entity recall is sensitive to formatting variation outside the training distribution.

### 3.5 Ranking and similarity (Stage R)

Three algorithmic families dominate, in roughly the order of vendor adoption history:

(a) **TF-IDF with cosine similarity.** Still embedded in older ATS (Taleo, legacy SAP) and many in-house pipelines. Given resume vector r and job description vector j:

sim(r, j) = (r . j) / (||r|| * ||j||)

The TF-IDF weight for term t in document d is:

tfidf(t, d) = tf(t, d) * log(N / df(t))

where tf is term frequency in d, df is document frequency across the corpus, and N is corpus size.

Empirical performance from JETIR (2023): TF-IDF + cosine similarity + KNN (K=5) reached precision 0.85, recall 0.75, F1 = 0.80 on a standard resume corpus.

(b) **Sentence embeddings with cosine similarity.** Models such as all-MiniLM-L6-v2, sentence-BERT, conSultantBERT, or proprietary fine-tunes. The resume and JD are both encoded into dense vectors (typically 384 or 768 dimensions); cosine similarity is computed in the embedding space. Hugging Face (Jobly, 2025) reports the following progression on the same matching task:

- TF-IDF baseline: 68% precision
- Sentence embeddings: 87% precision
- Retrieval-Augmented Generation (RAG) augmented: 91% precision

(c) **Hybrid encoder-decoder architectures.** Resume2Vec (MDPI Electronics 14(4):794, 2025) uses encoders (BERT, RoBERTa, DistilBERT) plus decoders (GPT, Gemini, Llama) and reports 15.85% improvement in nDCG (Normalised Discounted Cumulative Gain) and 15.94% in RBO (Ranked Biased Overlap) over conventional ATS, especially in mechanical engineering and health-and-fitness domains.

The 2026 frontier is hybrid: legacy keyword matching is preserved as a hard filter, semantic embeddings are layered on top as a soft ranker, and an LLM-based “AI co-pilot” produces a recruiter-facing summary plus an anomaly detection signal (keyword stuffing, AI-generated filler, formatting irregularities).

### 3.6 Final composite score

Modern enterprise ATS compute a weighted sum:

Score(R, J) = w1*KeywordMatch + w2*SemanticSimilarity + w3*SectionCompleteness + w4*FormatPenalty + w5*ExperienceFit

Weights are proprietary, but feature ordering is consistent across 2025-2026 vendor disclosures (The Interview Guys, April 2026):

required qualifications > exact job title > hard skills > semantic neighbours > soft skills

Required qualifications and exact title carry the dominant weight. Jobscan (2025) reports that exact job title match correlates with a 10.6x increase in interview likelihood.

-----

## 4. Reverse Engineering Methodology

The protocol is a falsification-driven experimental design borrowed from controlled-experiment methodology (Kohavi et al., A/B testing canon; arXiv 2110.07279 and 2209.05788 on FDR control in large-scale online experiments).

### 4.1 ATS identification

Public signals that disclose the ATS in use:

- Application URL stem:
  - `myworkdayjobs.com` -> Workday
  - `boards.greenhouse.io` -> Greenhouse
  - `jobs.lever.co` -> Lever
  - `taleo.net` -> Oracle Taleo
  - `icims.com` -> iCIMS
  - `successfactors.com` -> SAP SuccessFactors
- BuiltWith or Wappalyzer fingerprint of the careers page
- Glassdoor “interview process” comments often name the platform
- Vendor case studies and 10-K filings sometimes disclose enterprise contracts

### 4.2 Probe set construction

Build a master resume R0 and k controlled variants {R1, …, Rk} where each Ri differs from R0 in exactly one dimension. Standard probe variables:

|Variable          |Levels                                                 |
|------------------|-------------------------------------------------------|
|Column count      |1, 2                                                   |
|Heading style     |canonical English, canonical localised, creative       |
|File format       |text-layer PDF, image-only PDF, DOCX, RTF, TXT         |
|Keyword repetition|1x, 2x, 3x, 5x per key skill                           |
|Acronym handling  |acronym only, full form only, both                     |
|Bullet glyph      |dot, square, en hyphen, decorative                     |
|Contact placement |body, header, footer                                   |
|Date format       |“Jan 2024 - Present”, “01/2024 - Present”, “2024 - now”|
|Length            |1 page, 2 pages, 3+ pages                              |

### 4.3 Output observation channels

|Platform  |Channel                               |Notes                                                                                                                                                  |
|----------|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
|Workday   |Application form auto-populate        |Direct readout of parsed fields; misalignment = parser failure                                                                                         |
|Greenhouse|Candidate parse preview (when enabled)|Easiest direct read                                                                                                                                    |
|Lever     |Not exposed to candidate              |Use Affinda or Jobscan or RChilli sandbox as proxy; Lever absorbed Gem AI in 2023-2024 and shares the BERT-NER generation common to third-party parsers|
|Taleo     |Application form auto-populate        |Most fragile; many fields require manual re-entry                                                                                                      |
|iCIMS     |Application form auto-populate        |Mid-strength parser; international resumes underperform                                                                                                |
|SAP SF    |Application form auto-populate        |Strong on enterprise EMEA, weak on creative layouts                                                                                                    |

Open-source proxies that approximate vendor behaviour: `singhsourabh/Resume-NER` (BERT-based, GitHub), Affinda free demo, Sovren trial, RChilli sandbox, Jobscan, ResumeWorded, KeyBERT + RapidFuzz pipelines.

### 4.4 Inference

For each variant Ri, record the parsed structured profile P(Ri). Compute the field-level Levenshtein or token-level edit distance from R0 across the same set of canonical fields. Variables that produce zero distance across all six platforms are invariant - i.e. those formatting choices have no effect on parser output and can be selected on human-reader grounds alone. Variables that produce non-zero distance on any platform are the levers.

### 4.5 Convergence resume

Define the optimal resume R* by:

R* = argmax_R Score(R, J)

subject to

- ParseFidelity(R, ATSi) >= tau, for all i in {Workday, Greenhouse, Lever, Taleo, iCIMS, SAP SF}
- StuffingFlag(R) = 0 (no keyword exceeds the soft cap of approximately 2-3 mentions)
- ReadabilityScore(R) >= theta_human (human recruiter still acts on it after the AI ranks it)

The maximisation is approximate (proprietary weights are unknown), but the constraint set is verifiable through the probe protocol. In practice, candidates converge on R* through 3-5 iterations of probe-and-revise.

-----

## 5. Pattern Recognition: Invariants Stable Across the 2023-2026 Literature

The following findings replicate across multiple peer-reviewed and industry audits:

1. Single-column linear layout. The only design with verified parse fidelity on all six dominant ATS (Resume Optimizer Pro 2026, ATS 2.0 2026, Jobscan 2025).
1. Canonical section headings. “Experience” parses on all six; “My Journey” or “Where I’ve Been” misroutes content in Workday, Taleo, iCIMS (ATS 2.0 2026).
1. Contact information in the body, never in Word headers or footers. Header/footer placement is missed by approximately 25% of ATS scans (TopResume 2024).
1. Text-based PDF or DOCX. Text PDFs parse at 96.7%; image-only PDFs collapse near zero (TopResume 2024, Resume Vera 2026).
1. Both acronym and full form, once each. Dual subword-token representation captures literal match and taxonomy match (ATS 2.0 2026).
1. Exact job title match. 10.6x interview likelihood multiplier (Jobscan 2025).
1. Keywords inside dated job entries. ATS assigns more experience weight to skills inside work history bullets than to a standalone skills list (Resume Vera 2026).
1. 2-3 mentions per skill. Above this threshold, modern AI co-pilots flag keyword stuffing (ATS 2.0 2026, The Interview Guys 2026).
1. ATS-optimised templates show 43% higher callback rates than creative templates (Jobscan 2025).
1. The three-gate compliance model. In a 200-resume audit, 39% of resumes failed at least one of parsing, keyword match, or formatting before reaching a recruiter (Resume Optimizer Pro 2026).
1. Semantic matching exists but does not replace exact match. “Led a cross-functional team” can score for “project management” on Lever or modern Workday but not on legacy Taleo; hedge by using both phrasings (ATS 2.0 2026, Zimyo 2026).
1. File size and complexity matter. Greenhouse penalises large files; Workday penalises multi-column and graphics; Taleo penalises everything non-standard (Resume Vera 2026).

-----

## 6. Platform Differential Behaviour Matrix

|Platform          |Parser generation                                 |Primary weakness                                        |Candidate-facing behaviour                                                   |
|------------------|--------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------|
|Workday           |Hybrid rule + NLP                                 |Multi-column, graphics, non-standard headings           |Pre-fills application form; candidate sees and can correct parse output      |
|Greenhouse        |Rule + ML hybrid                                  |Headers/footers, tables, large files                    |Recruiter reads original PDF plus parsed profile; AI summary uses parsed text|
|Lever             |ML-first (LeverTRM with Gem AI absorbed 2023-2024)|Images-as-text, tables                                  |Recruiter primarily acts on parsed profile, not the PDF                      |
|Taleo             |Legacy rule-based                                 |Most fragile parser; manual data-entry recovery required|Application form pre-fill is partial; candidate fills gaps manually          |
|iCIMS             |Rule + ML hybrid                                  |International formats, columns, non-Latin scripts       |Application form pre-fill; mid-strength parser                               |
|SAP SuccessFactors|Rule + ML hybrid                                  |Custom characters, decorative glyphs                    |Strong on enterprise EMEA workflows                                          |

-----

## 7. Optimisation Decision Framework

The objective is jointly maximising Score against the six-platform constraint set. Operational rules derived from Sections 5 and 6:

- Format: single-column, text-layer PDF or DOCX, sans-serif font (Arial, Calibri, Helvetica, Lato) at 10-12pt body.
- Headings: canonical English (“Professional Summary”, “Experience”, “Skills”, “Education”, “Certifications”) in the order recommended by Maywise and corroborated by Resume Vera (2026).
- Margins: 1 inch on all sides; bullets are solid dots; no decorative glyphs.
- Header/footer: leave empty. Contact information is the first body block.
- Keyword strategy: harvest exact phrases from the JD’s required-qualifications section; embed them inside dated experience bullets; cap at 2-3 mentions per skill; include acronym and full form once.
- Title alignment: where accurate, mirror the posted job title in the most recent role.
- Quantification: every bullet has a number, percentage, currency value, or measurable scope where defensible.
- Length: 1 page for under 8 years of experience, 2 pages for 8 to 20 years, exceptions for academia and clinical roles.
- Tense: present for current role, past for prior roles.

A practical iteration loop: build R0 -> run through Jobscan + Affinda demo + Workday pre-fill -> diff the output against the source -> revise the worst-affected sections -> re-run. 3 to 5 iterations typically converge to >= 85 ATS score on Jobscan and clean parsing on all six platforms.

-----

## 8. Limitations and Adversarial Considerations

a. Proprietary scoring weights are unknown. Convergence on the invariant set is the best achievable approximation; absolute score targets vary by vendor and by job-family configuration.

b. AI co-pilots in 2026 enterprise ATS actively detect adversarial patterns: white-text keyword stuffing, AI-generated filler with low burstiness, repeated keyword saturation, suspiciously uniform sentence rhythm. Optimisation must remain semantically coherent. Honest content beats clever content.

c. Bias and fairness. Disparate-impact risks in algorithmic screening are documented (NIST AI RMF; EEOC guidance in the US; TAFEP guidance in Singapore). Most enterprise deployments now require human-in-the-loop review for any score-based filter that disproportionately removes protected groups.

d. The recruiter is the second filter. A resume that scores 95 on ATS but reads poorly to a human still loses. The optimisation is joint, not single-objective.

e. Generalisation across role families. The invariants in Section 5 hold for white-collar roles in tech, finance, consulting, marketing, and operations. Clinical, academic, legal, and government roles use specialised templates with different parser tolerances. Validate on at least one in-family probe before submitting at scale.

f. Defensive temporal note. The vendor landscape moves quickly. Lever absorbed Gem AI in 2023-2024; Workday rolled out AI Skills Cloud in 2024-2025; Greenhouse rolled out Greenhouse AI in 2025. Re-probe annually because the parser generation determines which invariants still bind.

-----

## 9. References

1. Resume Optimizer Pro. “How Resume Parsers Actually Work: Inside Workday, Greenhouse, Lever, iCIMS, Taleo.” April 2026.
1. Resume Optimizer Pro. “What Is an ATS-Compliant Resume? The 3-Gate Audit (2026).”
1. Resume Optimizer Pro. “Lever ATS Resume Guide” and “Greenhouse ATS Resume Guide.” April 2026.
1. Resume Vera. “ATS Resume Optimization Guide 2026.” 5 May 2026.
1. The Interview Guys. “ATS 2.0: What Semantic Matching Means for Your Resume.” 9 April 2026.
1. ResumeAdapter. “ATS Optimization Hub (2026): Complete Guide.” 18 March 2026.
1. Scale.jobs. “How to Optimize Your Resume for ATS in 2026 (Updated Guide).” 26 March 2026.
1. Jobscan. ATS audit data and template callback-rate analysis. 2025.
1. Hireflow. “Workday vs Greenhouse vs Lever: Which Parses Best for Resume Screening.” 24 March 2026.
1. Zimyo. “Applicant Tracking Systems ATS Keywords: The Complete Optimization.” May 2026.
1. IEEE Xplore. “Resume Parsing Across Multiple Job Domains Using a BERT-Based NER Model.” 2024.
1. IJIRSET. “Resume Parsing Using Named Entity Recognition and Hugging Face Models.” March 2024.
1. IRJMETS. “A Survey on Resume Analysis Using NLP.” July 2024.
1. JETIR. “Resume Shortlisting and Grading Using TF-IDF, Cosine Similarity, and KNN.” 2023.
1. arXiv 2507.10472. “MLAR: Multi-layer LLM-based RPA Applicant Tracking.” 2025.
1. arXiv 2503.17438. “From Text to Talent: A Pipeline for Extracting Insights from Candidate Profiles.” 2025.
1. arXiv 2306.13062. “Named Entity Recognition in Resumes.” 2023.
1. MDPI Electronics 14(4):794. “Resume2Vec: Transforming ATS with Intelligent Resume Embeddings for Precise Candidate Matching.” 2025.
1. ACL Anthology CLiC-it 2025. “AI-Driven Resume Analysis and Enhancement.”
1. Hugging Face Blog. “Building Jobly: Semantic Job Matching with RAG and Vector Embeddings.” 28 November 2025.
1. arXiv 2110.07279. “Treatment Effect Detection with Controlled FDR under Dependence for Large-Scale Experiments.”
1. arXiv 2209.05788. “Empirical Bayes Multistage Testing for Large-Scale Experiments.”
1. TopResume. ATS parsing audit. 2024.
1. NIST AI Risk Management Framework. 2023-2024.
1. Singapore Tripartite Alliance for Fair and Progressive Employment Practices (TAFEP) guidance on AI in hiring.

-----

*End of report.*
