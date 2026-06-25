# O-I-A Posting Lens

> A deterministic instrument for reading one MyCareerFuture posting into the v3 occupation-taxonomy and AIOE pipeline, through three lenses - **Role** (the occupation advertised), **Organisation** (the employer the posting reveals), and **AI** (how artificial intelligence bears on the role and the firm). The three stages run in fixed order and are bound by an evidence contract: nothing is interpreted that was not first observed, and nothing is emitted that was not first interpreted.
>
> Adapted from the inductive observation-interpretation-application reading method. Its one carried-over discipline: draw findings out of the source, never read them in.

---

## 0. The evidence contract

Three stages, each consuming only the prior stage's output:

1. **Observation** emits `spans` - verbatim fragments of the posting, each with an ID. Nothing else.
2. **Interpretation** emits `claims`. Every claim must cite one or more Observation span IDs. A claim with no span is invalid and is dropped.
3. **Application** emits the `record` - codes, scores, routing. It acts only on Interpretation claims, never on raw text.

Consequence: every code and score traces back through a claim to a verbatim span, so a reviewer can audit the chain and the engine cannot classify from thin air.

Each derivation also declares its method:
- `rule` - deterministic lookup (lexicon, regex, taxonomy table). Bit-identical on re-run.
- `judgement` - model inference. Carries `confidence` (0-1); reproducible by fixed prompt, not bit-identical.

Where a required field cannot be grounded, emit `ABSENT`. Absence is a valid output, not a gap to be filled by guessing.

---

## 1. Inputs, lenses, output

- **Input** - one posting: title, description, and structured fields (company, salary, employment type, posting date, posting history).
- **Lenses** - run across every stage:
  - `ROLE` - occupation, tasks, skills -> SSOC-2010.
  - `ORG` - sector, firm signals -> SSIC + context.
  - `AI` - AI content of the role, task-level AI exposure -> AIOE, and the firm's AI-adoption posture.
- **Output** - one structured record (Section 5).

---

## 2. Stage O - Observation - "what does it say"

Literal only. Record verbatim, including the obvious. No inference, no labelling, no cross-posting comparison.

**ROLE spans** - exact title; each stated task or duty; each stated requirement (years, credential, skill); stated seniority words; stated reporting line and team size; location; salary; employment type; repeated terms (record the term and its count).

**ORG spans** - the firm's own words about itself (size, mission, market, culture); named functions and adjacent teams; any stated reason for the hire.

**AI spans** - verbatim mentions of AI, ML, generative AI, LLMs, data science, or automation; named AI tools, frameworks, or platforms; AI-related skills or credentials; any firm statement about AI use, AI strategy, or AI products.

Output is a list of `{span_id, lens, text}`. Stop here. Do not interpret.

---

## 3. Stage I - Interpretation - "what does it mean"

Decode the spans. Every claim cites the span IDs it rests on.

**ROLE claims**
- **Occupation mapping** - candidate SSOC-2010 code(s) from the title and task spans (`judgement`, confidence).
- **Task inventory** - normalise duty spans into discrete tasks (the basis for AI exposure scoring).
- **Seniority read** - stated-versus-real, citing the requirement and scope spans.
- **Requirement split** - hard must-have versus nice-to-have, from the spans' modal language.
- **Emphasis** - repeated or first-stated terms read as priority weight, not decoration.

**ORG claims**
- **Sector mapping** - candidate SSIC from the firm's self-description spans.
- **Operational signal** - churn or expansion, only if posting-history fields are present; otherwise `ABSENT`.
- **Cultural tell** - what euphemism or buzzword spans imply about workload or maturity (`judgement`, confidence; cite the span).
- **Coherence** - does the self-description match the role's actual task spans?
- **External corroboration** - last, and only as confirmation; never as the source of a claim.

**AI claims**
- **AI-role read** - `ai_core`, `ai_adjacent`, or `non_ai`, from the AI and ROLE task spans (`judgement`, confidence).
- **Task AI-exposure** - map the ROLE task inventory to AIOE exposure, distinguishing augmentation from automation (LM-2023 primary, 2021 aggregate baseline). Cites the ROLE task claims and the AI spans.
- **Firm AI-adoption** - is the employer building AI, using AI, or neither, from ORG self-description and AI spans (`judgement`, confidence).

---

## 4. Stage A - Application - "what does it ask the engine to do"

Not a hiring decision. The action is classification and routing.

- **Emit** - assemble the record: SSOC, SSIC, task inventory, AI-role, AIOE exposure, AI-adoption, seniority, each value carrying its claim chain and confidence.
- **Score** - compute AIOE exposure from the task inventory.
- **Route** - if any required field is `ABSENT` or below the confidence threshold, set `route_to_review` rather than forcing a value; otherwise `accept`.
- **Flag** - mark anomalies (incoherent self-description, title-task mismatch, one posting scoping several roles, AI claims unsupported by any AI span) for the taxonomy maintainer.

---

## 5. Output schema

```yaml
posting_id: <id>
source: mycareerfuture
analysed_at: <iso8601>
observation:
  spans:
    - span_id: o1
      lens: ROLE | ORG | AI
      text: <verbatim>
interpretation:
  claims:
    - claim_id: i1
      lens: ROLE | ORG | AI
      statement: <text>
      spans: [o1, o2]
      method: rule | judgement
      confidence: <0-1 | null>
application:
  role:
    ssoc: { value: <code | ABSENT>, claims: [i1], confidence: <0-1> }
    tasks: [ { task: <text>, claims: [i2] } ]
    seniority: { value: <text | ABSENT>, claims: [i3] }
  org:
    ssic: { value: <code | ABSENT>, claims: [i4], confidence: <0-1> }
    signals: [ { statement: <text>, claims: [i5] } ]
  ai:
    ai_role: { value: ai_core | ai_adjacent | non_ai | ABSENT, claims: [i6], confidence: <0-1> }
    aioe_exposure: { value: <score | ABSENT>, basis: "LM-2023 primary; 2021 baseline", claims: [i7] }
    ai_adoption: { value: building | using | none | ABSENT, claims: [i8], confidence: <0-1> }
  routing: accept | route_to_review
  flags: []
```

---

## 6. Guardrails

- **Fixed order** - O, then I, then A. No stage reads ahead.
- **Traceable** - every claim cites spans; every emitted value cites claims.
- **ABSENT over invention** - unanswerable fields are recorded, not guessed.
- **Deterministic spine** - `rule` derivations are bit-identical; `judgement` derivations carry confidence and abstain below threshold.
- **Reproducible** - same posting, same prompt, same record.

---

*Bindings to confirm.* Role -> SSOC-2010; Organisation -> SSIC; AI exposure -> AIOE (LM-2023 primary, 2021 baseline). Swap if v3 uses different tables.

*Design alignment.* This document is the Prompt; the posting and its fields are the Context; Sections 0 and 6 are the Control - Output = f(Prompt, Context, Control).

*Provenance.* Structure adapted from the inductive observation-interpretation-application method; all domain content is original to SG Career View v3.
