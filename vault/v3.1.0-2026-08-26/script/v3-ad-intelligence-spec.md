# V3 Ad Intelligence — the exhaustive ad-analysis blueprint (click-to-analyse + new lenses)

(№ 135 - 07-07 '26 10:22 SGT)

STATUS: READY_FOR_BUILD (slices AI-1..AI-6, in order)
SCOPE: Step 3 Review Studio + Step 2 evidence surfaces. Additive lenses over the existing
O-I-A engine. Deterministic-first: the engine authors every flag/number; the LLM narrates
only where marked [A], always chipped "AI estimate". Withhold over guess, everywhere.

## 0. Why (Human Lead, 07-07 '26)

"None of these lines and pills have meaning unless I can click and analyse." Every span
and pill must be a DOOR into its own O-I-A card. And the blueprint is not exhaustive:
blind spots, 'around the corner' second-order reads, competitive posture, OSINT layering,
and Structured Analytic Techniques (SATs) are all absent. Live proof of the gap: a "Data
Engineer" ad carrying ISO/cGMP facility-management duties — a mash-up our lenses saw but
never surfaced per-line.

## 1. Click-to-analyse contract (AI-1) — the core fix

Every interactive element resolves to ONE focused O-I-A card in the right margin (reuse
the comment-margin pane; mobile: bottom sheet):

| Element | Observation | Interpretation | Application |
|---|---|---|---|
| duty span | verbatim line (or AI-extracted, chipped) | band + method + keywords (nucleus tokens) | route: proof / governance / AI-assist |
| skill pill | the pill label + ESCO definition | AIOE level + which duties invoke it (token links) | half-life read + kickstart |
| requirement line | verbatim | gate type (experience/qualification/credential) | meet / show equivalent / auto-reject risk |
| SSOC/tier/band chips | the chip value | how it was computed (classifier/crosswalk) | what to check before trusting it |

All deterministic [D]. No new LLM calls. Keywords = the nucleus tokens + matched skill terms.

## 2. New lens catalogue (grouped; [D] deterministic · [A] LLM-advisory · [+data] new source)

### AI-2 Blind spots — what the ad does NOT say [D]
- Missing-fields audit: salary? reporting line? team size? success metrics? tech versions?
  growth path? location/hybrid? contract length? Each absence = a finding card
  ("The ad is silent on X — ask before accepting").
- Contradiction scan: seniority-of-duties vs salary band vs job level; per-line mash-up
  flag (foreign-domain lines named: "this line belongs to Facility/QA, not Data").

### AI-3 Structured Analytic Techniques (SATs)
- Key Assumptions Check [A over D spans]: what must be true for the ad to be honest.
- ACH — competing hypotheses [D scoring + A narration]: real vacancy / pipeline-building /
  compliance ad / backfill / expansion; each ad line scored as evidence for/against.
- Quality of Information Check [D]: per claim — verifiable / vague / unfalsifiable
  (extends word-noodles into a per-claim table).
- Indicators & signposts [D, in-set]: repost pattern, salary drift vs result set,
  same-role multiplicity.
- Outside-in [D]: SSOC-family demand context from the current result set.

### AI-4 "Around the corner" — second-order [D]
- Skill half-life: each asked skill's AIOE decay read (durable vs eroding).
- Role trajectory: duty-exposure mix → is the role being automated out from under the hire.
- Adjacency: SSOC/ISCO neighbours this role feeds into (crosswalk already shipped).

### AI-5 Competitive read [D]
- Salary position vs the result-set median for the same SSOC family.
- Demand proxy: similar live ads competing for the same candidate (count + freshness).
- Employer posture: hiring breadth (functions), ad count, ACRA age/status.

### AI-6 OSINT layer
- [D] Employer's full live footprint (MCF + careers.gov.sg), UEN→SSIC industry + entity
  age (ACRA CSVs already in repo).
- [+data, PARKED] Press/Glassdoor/LinkedIn — external doors; needs Human Lead approval.

## 3. Rendering

All findings render as the existing CritCard / O-I-A 3-column card (no new card species).
New Critical-Read sections in order: Blind spots · SATs · Around the corner · Competitive ·
OSINT. Each section withholds entirely (renders nothing, never "0 found") when its inputs
are absent. Prov chips per §7 governance; colour never load-bearing; 44px targets.

## 4. Build slices (each: version bump → build → PR → live-verify)

- **AI-1** click-to-analyse margin cards (spans, pills, requirement lines).
- **AI-2** blind-spot + contradiction lenses (all [D], cheap, highest value).
- **AI-3** SATs: QoI check + indicators [D] first; then ACH scoring [D] + one batched
  LLM narration call (extend getCriticalRead, no new endpoint).
- **AI-4** second-order reads (engine data already present).
- **AI-5** competitive read (result-set only).
- **AI-6** OSINT [D] parts; external sources stay PARKED.

Frozen door: api/* untouched except the existing getCriticalRead batch prompt (AI-3).
Source of truth: shipped code > this spec > memory. AU-7 for any amendment.
