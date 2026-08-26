# V3 Blueprint: Reviewable Work Intelligence System

Status: blueprint draft for V3 reinvention
Date: 2026-06-27
Scope: V3 only
Primary surface: `v3.takearoundabout.com`

## 0. Purpose

V3 is not only a job-ad analyser.

V3 should become a reviewable work-intelligence system that helps a candidate, worker, hiring manager, organisation designer, or policy actor understand what a job advertisement reveals about:

- the role
- the organisation
- the work system
- the AI exposure signal
- the hidden process friction
- the hiring and ATS environment
- the candidate's truthful competitive edge

The job advertisement becomes the manuscript.

The V3 engine becomes the editorial room.

Persona agents become reviewers.

The human user remains the editor-in-chief.

The product should give the candidate an edge without becoming an ATS-gaming tool.

The edge comes from:

- better evidence
- sharper interpretation
- stronger role understanding
- clearer proof of capability
- better interview questions
- organisation-level insight
- explainable resume and portfolio alignment
- disciplined judgment about when not to chase a weak signal

### 0.1 Original Product DNA

V3 inherits the worker-first promise of the original AI Skills Analyser.

It must not become only:

- a graph product
- an ATS product
- an organisation-design product
- a dashboard of clever interpretations

Every graph, review comment, organisation lens, AI exposure trace, resume suggestion, and cover-letter output must return to a practical user question:

> What should I do next, what should I prove, what should I ask, and what should I avoid?

Awareness is insufficient.

If V3 says a duty, skill, phrase, or work boundary is AI-exposed, it must help the user move from awareness to action:

- what tool or workflow can help
- what steps the user can try this week
- what proof artifact the user can produce
- what remains human-owned
- what evidence is missing

The tone should remain candidate-first, humane, practical, and honest.

The system should distinguish:

- official source evidence
- deterministic classification
- AI interpretation
- candidate action advice
- withheld claims

Generic AI advice is a failure mode.

V3 should avoid advice that could apply to any job, any person, or any sector.

### 0.2 The Application Volume Reality (added 10-07 '26)

The market context V3 operates in is adversarial by volume, not by malice.

- The large majority of Singapore private-sector and SG.Gov job postings each draw 100+ applicants; a meaningful share draw 1,000+.
- A candidate is not competing against the job description. A candidate is competing against a queue.
- Standing out on paper is close to structurally impossible at this ratio. The real leverage point is not the application - it is what happens if the candidate reaches a screen or an interview.

This reframes the product's job:

> V3's job is not "help this application look better." V3's job is "help this specific candidate walk into a screen or interview and be genuinely, verifiably the strongest reasoned case in the room - because they understood the role, the organisation, and the true state of AI capability better than the other applicants did."

Two open, unresolved questions this section exists to hold (not yet answered by any shipped feature - track under §9/§10 as they resolve):

1. **Currency of the AI-capability read.** AI capability itself keeps moving - what a role's AI-exposure classification should assume about "what AI can now do" needs to track genuinely recent developments (weeks, not the model's training cutoff), or the exposure bands and skill narrations drift stale against the candidate's actual competitive reality. This is a standing maintenance question, not a one-time fix: V3 needs a discipline for periodically refreshing its assumptions about AI capability against the current frontier, sourced and dated, not silently re-guessed by an LLM call. Never invent a "recent development" - if the engine has no verified, sourced signal for what changed, withhold rather than narrate a guess.
2. **Stickiness toward the actual outcome.** A one-shot analysis is not enough if the goal is interview performance. What would make a candidate come back to this specific role's analysis in the days before a screen - to rehearse, to check a claim, to sharpen an answer - rather than using it once and closing the tab? This is a retention/utility question, not a growth-hacking one: the product earns repeat use by being the thing that actually helped in the room, not by engagement mechanics.

Non-negotiables that already apply here per §0.1: no generic advice, no advice that could apply to any job/candidate/sector, and every AI-capability claim carries a named source and a date - never a bare assertion that "AI can now do X."

## 1. Core Thesis

V3 treats a job advertisement as a work-system signal, not merely as a vacancy.

A job advertisement may reveal:

- a capability gap
- a governance gap
- a process bottleneck
- a compliance ritual
- a strategic transition
- a hidden accountability need
- a role mash-up
- a mismatch between work-as-written and work-as-done
- a recruitment system distortion

The core V3 question is:

> What human stewardship, system redesign, and agentic control are needed for this work to create value?

For the candidate, the practical question is:

> What should I understand, prove, ask, prepare, challenge, or avoid?

## 2. Ethos

The ethos are not slogans.

Each ethos must become a product behaviour, an agent behaviour, and a UI affordance.

### 2.1 Curiosity

V3 explores alternative system routes.

It asks:

- Is this really a job problem?
- Is this actually a process problem?
- Is the role covering a governance weakness?
- Is the organisation buying labour because it has not redesigned work?
- Is this vacancy a bridge, firewall, patch, or transformation signal?

Product behaviour:

- show alternative interpretations
- expose role mash-up
- suggest organisation-level questions
- keep the source text visible

### 2.2 Collaborativeness

V3 assumes work crosses human and agent boundaries.

It must show:

- what the human owns
- what the agent can assist
- what deterministic code computed
- what the LLM interpreted
- what must be escalated

Product behaviour:

- persona-agent review comments
- accept/reject tracked suggestions
- named accountable human owner
- governance ledger before action

### 2.3 Customer Focus

V3 grounds system actions in end-user value.

End users include:

- candidate
- worker
- career switcher
- senior worker
- recruiter
- hiring manager
- HR lead
- organisation designer
- BPR practitioner
- public-sector policy actor

Product behaviour:

- do not optimise only for application volume
- do not push courses without demand proof
- do not convert uncertainty into confidence
- return to a practical user decision

### 2.4 First Principles Understanding

V3 should expose the foundational why.

It should not reduce advice to:

- add these keywords
- take this course
- use this prompt
- apply because the title matches

It should explain:

- why the role exists
- why the skill matters
- why AI changes the work boundary
- why the organisation may be hiring
- why the candidate should or should not spend effort

### 2.5 Domain Breadth

V3 must understand adjacent business functions.

Role and organisation graphs should connect:

- operations
- finance
- compliance
- risk
- customer value
- technology
- HR
- product
- service delivery
- market demand
- governance

### 2.6 Systemic Thinking

V3 maps complex interactions across:

- role
- worker
- organisation
- job market
- ATS
- recruiter
- hiring manager
- AI system
- governance chain
- platform incentives
- labour policy

The goal is not a list of skills.

The goal is a working map of the system.

### 2.7 Judgment And Discernment

V3 must know when to overrule autonomous output.

It should withhold, warn, or escalate when:

- evidence is thin
- the source is not verified
- an action has no named human owner
- AI output conflicts with deterministic evidence
- the system may create false hope
- automation would remove accountability
- an ATS recommendation risks deception

### 2.8 Builder Lens Operating Discipline

The Builder Lens is the operating discipline behind V3.

It requires the project to:

- confirm project, state, source, and deployment target before action
- use UK English unless source text uses another spelling
- keep tone plain, humble, direct, and free of false precision
- avoid emojis and decorative punctuation unless explicitly approved
- design mobile-first at 375px, then expand to iPad and desktop
- use progressive disclosure instead of overwhelming the user
- avoid duplicated panels, duplicated meanings, and hidden action buttons
- keep help beside the thing it explains
- use colour to encode meaning, not decoration
- verify live behaviour in browser, not only via build success

Build passing is not proof.

For V3, truth comes from:

- source evidence
- deterministic data checks
- UI state inspection
- browser verification
- live deployment verification when the claim is about production

## 3. Ingress Framework

Ingress is how V3 receives the world.

The input may be:

- a job title
- a job advertisement
- a company name
- a skill
- a career question
- a live MCF query
- a resume fragment
- an organisation strategy question

Ingress should not immediately answer.

Ingress should establish:

- what the user is asking
- what evidence exists
- what source is live
- what source is missing
- whether the input is role perspective or organisation perspective
- whether the result should be candidate-facing, employer-facing, BPR-facing, or policy-facing

### 3.1 Ten C Questions

The Ten C method is the human reading ritual.

It protects V3 from shallow AI summarisation.

1. CALL

Ask what the role should be called.

Use:

- compare user title, MCF title, ESCO title, and inferred role shape
- reveal when the advertised title hides a different work system

2. COMPACT

Ask for the role story in plain language.

Use:

- separate duties, outcomes, requirements, and organisation signals

3. CRYPTIC

Ask what is confusing, missing, inflated, or contradictory.

Use:

- flag vague ownership
- flag role mash-up
- flag unsupported claims

4. CROSS-REFERENCES

Ask what other roles explain this role.

Use:

- compare same-employer postings
- compare adjacent market postings
- feed the role evidence map and organisation chart

5. CONSIDERABLE PEOPLE

Ask who is implied by the role.

Use:

- map stakeholders
- identify accountable owner
- identify handoffs
- identify customer or citizen value

6. COMPELLING WORDS

Ask which words repeat and which phrases reveal real work.

Use:

- extract repeated duty phrases
- detect transformation language
- detect governance and compliance signals

7. CRITICAL SENTENCE

Ask which sentence carries the highest signal.

Use:

- anchor the role diagnosis
- attach provenance

8. COMMAND CHAIN

Ask who is mentioned above, below, or around the role.

Use:

- map reporting and governance context only where evidence exists
- avoid inventing department structure

9. CENTRAL LESSON

Ask what idea weaves the advertisement together.

Use:

- produce the role thesis
- connect role, organisation need, AI readiness, and human edge

10. CREATE OUTCOME

Ask what response follows.

Use:

- decide apply, prepare, compare, redesign, build agent candidate, or withhold

### 3.2 Ingress Evidence Labels

Every early observation should be labelled:

- from posting
- from MCF
- computed
- derived
- AI estimate
- unverified
- withheld

Ingress must support both:

- role perspective: what does this advertised role really mean?
- organisation perspective: what pattern do these advertised roles reveal?

## 4. Interpretability

Interpretability is the bridge between input and action.

It answers:

> Can a human see why V3 said this?

Interpretability is not cosmetic explanation.

It is the operating principle that every claim, score, rewrite, graph edge, and recommendation must be legible, challengeable, and auditable.

### 4.1 Human Legibility

V3 must show:

- what text triggered the claim
- which lens was used
- whether the claim is deterministic or judgement-based
- whether the confidence is high, partial, weak, or withheld
- what action is allowed
- what action is forbidden

### 4.2 Evidence Traceability

Every meaningful output should trace back to:

- source span
- claim
- method
- confidence
- reviewer/persona
- decision state

The user should be able to jump from:

- graph node to source text
- source text to comments
- comment to reviewer
- reviewer to method
- method to accepted decision

### 4.3 Claim Confidence

Confidence should not be a decorative score.

It should change product behaviour.

If confidence is weak:

- show caveat
- request more evidence
- route to review
- block autonomous action

If confidence is none:

- withhold
- explain why
- do not silently convert missing evidence to zero

### 4.4 AIOE Interpretability

AIOE is not just a number.

It is an exposure trace.

Users should see:

- SSOC input
- ISCO-08 path
- SOC 2010 match
- matched SOC occupations
- unmatched SOC occupations
- layer shown
- aggregation policy
- confidence flag
- withhold reason

User-facing wording:

> This is an exposure signal, not a verdict on your value.

### 4.5 Lens Conflict And Disagreement

Different lenses may disagree.

Examples:

- AIOE indicates high language exposure, but the role has high human accountability.
- ATS sees keyword alignment, but Skeptic sees weak demand.
- BPR sees process redesign, while Candidate Advocate sees a strong application opportunity.
- Hiring Manager sees business value, while Recruiter sees title mismatch.

V3 should not hide disagreement.

It should show:

- which reviewers disagree
- what evidence each used
- what the human must decide

### 4.6 Withholding Rules

Withholding is a feature.

V3 should withhold when:

- evidence chain is incomplete
- source is unavailable
- crosswalk confidence is none
- live demand is too thin
- role inference depends on brand assumptions
- no named human owner exists
- persona-agents agree without evidence

### 4.7 Generative UI Interpretability

If V3 changes the interface based on the job ad, the user must know why.

Generated panels, graphs, prompts, review modes, and suggested actions should disclose:

- which source span triggered the UI change
- which lens or persona requested it
- whether the trigger was deterministic or judgement-based
- whether the panel is required, recommended, or optional
- what the user can do next
- how to close, undo, or switch away from it

Generative UI must be reversible.

The product should never make the user feel that the interface is moving by hidden authority.

## 5. Review And Track Changes Layer

The Review Layer is the core UI metaphor for V3.

The job advertisement is treated like a manuscript under professional editorial review.

The system should borrow the discipline of manuscript review:

- tracked changes
- margin comments
- reviewer identities
- reply threads
- accept/reject actions
- resolved comments
- markup views
- audit trail

The product inspiration is Microsoft Word's Review system and professional manuscript-formatting workflows.

Reference: Center for Engaged Learning, "Academic Book Publishing: Formatting Your Manuscript".

### 5.1 Review Object Types

Every review item can be one of:

- comment: margin note only
- insert: suggested added text
- delete: suggested removal
- replace: rewrite one phrase or sentence
- split: one duty should become multiple duties
- merge: repeated duties should be commonised
- relabel: change evidence label
- escalate: needs human judgment
- withhold: do not use this claim yet

### 5.2 Track Changes Object

Each tracked suggestion should contain:

```yaml
id: <change id>
target_span_id: <source span id>
reviewer_persona: <persona>
lens_used: <method or lens>
change_type: insert | delete | replace | split | merge | relabel | escalate | withhold
original_text: <verbatim text>
suggested_text: <proposed rewrite>
reason: <why this change exists>
evidence: <source span ids or deterministic trace>
confidence: <high | medium | low | none>
risk: <none | caveat | escalation | withheld>
status: open | accepted | rejected | resolved | escalated
created_at: <timestamp>
accepted_by: <named human or null>
```

### 5.3 Markup Views

Like a professional review tool, V3 should support multiple views:

- Clean View: readable job ad with accepted changes only
- Simple Markup: markers where comments or changes exist
- All Markup: insertions, deletions, replacements, and comments visible
- Persona View: filter by reviewer persona
- Evidence View: show only evidence-backed claims
- Risk View: show withheld, escalated, low-confidence, and governance-blocked claims
- Visual View: show how comments connect to role evidence, organisation structure, AI exposure, hiring filters, and occupation-specific maps

### 5.4 Guided Review Header

V3 should not use a Microsoft-style ribbon as a row of unexplained commands.

Most users will not know what terms such as Track Changes, AIOE, ATS, BPR, or Persona Review mean on first sight.

The top of the manuscript canvas should instead behave like a guided review header.

The header should tell the user:

- what they are reviewing
- what the system has found
- what mode they are in
- what action is expected next
- which reviewer/persona is active
- whether changes are open, accepted, rejected, withheld, or escalated

The header should use plain-language labels first, with technical labels secondary.

Example desktop header:

```text
Reviewing: Data Engineer job ad
Goal: Understand the real work, evidence, AI exposure, and candidate edge
View: All suggested rewrites and comments
Active reviewer: Hiring Manager
Open items: 12 comments · 5 rewrites · 2 withheld

[Read clean] [Show suggestions] [Reviewer comments] [Evidence trail] [AI exposure] [Hiring system] [Decisions]
```

Example mobile header:

```text
Data Engineer review
12 comments · 5 rewrites · 2 withheld
[Clean] [Suggestions] [Comments] [Decide]
```

The header must be functional, not decorative.

It should control:

- active markup mode
- visible personas
- accepted/rejected/resolved state
- comment density
- graph visibility
- evidence overlays
- track-change navigation

Technical terms should appear inside tooltips, details panels, or secondary labels after the user understands the task.

For example:

- `Show suggestions` can reveal Track Changes.
- `AI exposure` can reveal AIOE.
- `Hiring system` can reveal ATS analysis.
- `Process redesign` can reveal BPR.

The header should reduce cognitive load before the user enters the deeper review system.

### 5.5 Persona-Agent Reviewers

Day-one reviewers:

- Candidate Advocate: protects worker value, dignity, and truthful fit.
- Hiring Filter Analyst: detects screening phrases, keyword traps, and resume alignment opportunities.
- Recruiter: reads market fit and title translation.
- Hiring Manager: asks outcome, scope, accountability, and evidence questions.
- Process Redesign Analyst: detects role mash-up, broken process, and redesign signals.
- AI Exposure Analyst: comments on exposure layer, confidence, delta, and withhold logic.
- Organisation Designer: commonises repeated capabilities and detects capability gaps.
- Skeptic: challenges weak demand, false hope, and unsupported claims.
- Interview Coach: generates questions tied to business outcomes.

### 5.6 Human Control

Persona agents may suggest.

The human decides.

Every tracked change must be:

- accepted
- rejected
- resolved
- escalated
- left open

Accepted changes can flow into:

- role evidence map
- organisation chart
- resume bullet
- portfolio evidence
- interview question
- process redesign hypothesis
- preparation task
- governance ledger

Rejected changes remain in the audit trail.

## 6. Methods And Lenses

The methods are V3's thinking instruments.

They must not become a kitchen drawer.

Each method should have:

- purpose
- trigger
- core questions
- required evidence
- output
- interpretability requirement
- withhold condition
- UI surface

### 6.1 Vacancy Teleology

Purpose:

- read a job advertisement as an organisational signal.

Trigger:

- any role or job-ad input.

Core questions:

- What gap is this organisation trying to close?
- What work is being bundled together?
- What risk is being transferred to the human?
- What system friction is hidden?

Output:

- capability gap, governance gap, process bottleneck, compliance ritual, or transition signal.

Withhold condition:

- not enough source evidence to infer organisation need.

### 6.2 Boundary, Dependency, Feedback

Purpose:

- map the role as a work-system boundary.

Core questions:

- What is inside this role?
- What is outside this role?
- What has been wrongly pushed into this role?
- What upstream inputs are needed?
- What downstream decisions depend on the role?
- What feedback loop improves or hides failure?

Output:

- boundary map, dependency map, feedback-risk signal.

### 6.3 Forensic Reversal

Purpose:

- read the job ad backwards from duties to system need.

Core moves:

- strip inflated nouns
- isolate action verbs
- separate evidence from aspiration
- identify repeated work objects
- infer bottleneck
- classify role as bridge, firewall, patch, or transformation signal

### 6.4 Business Process Re-engineering

Purpose:

- test whether the organisation should redesign work before hiring.

Trigger:

- role mash-up
- repeated friction
- unclear ownership
- cross-role duplication
- contradictory scope

Core questions:

- Is this role compensating for broken process?
- Can common capability be shared?
- Should an agent support a function rather than replace a role?
- Should the workflow be redesigned before hiring?

Output:

- AS-IS friction
- TO-BE redesign hypothesis
- role redesign
- agent candidate
- governance requirement

### 6.5 Rumelt Strategy Kernel

Purpose:

- impose strategy discipline on organisation reading.

Diagnosis:

- what is the real obstacle?

Guiding policy:

- what approach would address it?

Coherent action:

- what should the person, organisation, or agentic system do next?

### 6.6 Ecotone Lens

Purpose:

- identify high-value edges between systems.

Edges:

- business and technology
- customer and operations
- policy and delivery
- human judgment and agent execution
- internal process and external market

Output:

- future-proof human edge.

### 6.7 Flow Lens

Purpose:

- read work as value movement.

Core questions:

- Where does value enter?
- Where does work wait?
- Where does handoff create friction?
- Which activities create value?
- Which role exists because flow is broken?

### 6.8 Falsification

Purpose:

- protect the worker from weak advice.

Core questions:

- Should we distrust this evidence?
- Is this posting a template?
- Is the posting compliance-only?
- Is the role a mash-up?
- Is the advice self-serving?
- Is demand real enough?

### 6.9 Pro-Worker AI Test

Every AI recommendation should ask:

- Does it increase human expertise value?
- Does it create better human work?
- Does it preserve accountability?
- Does it reduce false hope?
- Does it expose hidden organisational friction?
- Does it avoid turning workers into disposable interfaces?

## 7. O-I-A Posting Lens

O-I-A means Observation, Interpretation, Application.

It is the deterministic discipline for moving from job-ad text to structured record.

### 7.1 Evidence Contract

Observation emits spans.

Interpretation emits claims.

Application emits records, codes, scores, routing, and flags.

Nothing is interpreted that was not first observed.

Nothing is emitted that was not first interpreted.

Every code and score traces back through a claim to a span.

### 7.2 Stage O: Observation

Question:

> What does it say?

Output:

- source spans only
- no inference
- no labels beyond lens and span id

Span lenses:

- ROLE
- ORG
- AI

### 7.3 Stage I: Interpretation

Question:

> What does it mean?

Output:

- claims citing span ids
- method: rule or judgement
- confidence

### 7.4 Stage A: Application

Question:

> What does the engine do with this?

Output:

- SSOC
- SSIC
- task inventory
- AI-role read
- AIOE exposure
- AI-adoption posture
- routing
- flags

## 8. Deterministic Evidence Framework

Deterministic evidence is the spine of V3.

LLMs may explain deterministic evidence.

LLMs must not invent deterministic evidence.

### 8.1 AIOE

AIOE maps Singapore job evidence into AI Occupational Exposure through:

```text
SSOC -> ISCO-08 -> SOC 2010 -> AIOE scores
```

Layers:

- `lm2023`: Language Modeling AIOE, primary generative-era exposure.
- `ig2023`: Image Generation AIOE.
- `agg2021`: Aggregate AIOE, pre-ChatGPT baseline.

Delta:

```text
lm2023 raw - agg2021 raw
```

A positive delta means language-model AI raises exposure relative to the older baseline.

### 8.2 AIOE Trace

AIOE output should expose:

- SSOC input
- ISCO-08 path
- SOC 2010 matches
- SOC 2010 unmatched codes
- aggregation policy
- layer values
- primary value
- baseline value
- delta
- confidence

Confidence:

- exact: one SOC matched, none missing.
- aggregated: several SOC codes matched and collapsed by policy.
- partial: some SOC codes had no AIOE entry.
- none: chain incomplete; all scores null.

### 8.3 Aggregation Policy

Supported policies:

- weighted_mean
- mean
- max
- min
- median

Default:

- weighted_mean

The UI/debug layer should reveal when aggregation happened.

### 8.4 AIOE Withholding

If confidence is `none`, V3 must withhold numeric exposure.

If confidence is `partial`, V3 may explain the limitation.

If confidence is `aggregated`, V3 must say that several SOC occupations were collapsed.

Never silently convert missing exposure to zero.

### 8.5 ESCO And Skills

ESCO remains useful for:

- occupation skill structure
- essential skills
- optional skills
- skill transfer
- role comparison

But ESCO is not enough for V3.

V3 must connect skills to:

- live demand
- organisation context
- AIOE exposure
- process redesign signal
- candidate proof

### 8.6 Occupation-Sensitive Visual Grammar

V3 should not use one graph style for every job.

The visualisation should follow the nature of the work.

Method:

1. Resolve the role into an ESCO occupation or nearest occupation family.
2. Read essential skills, optional skills, tasks, and adjacent occupations.
3. Classify the occupation into a work-nature archetype.
4. Select the visual grammar that best represents the work.
5. Select the evidence artefacts the candidate should prepare.
6. Select the professional skilling pathway only when supported by source evidence.

The rule:

> ESCO determines the work family. The work family determines the visual grammar. The visual grammar determines what evidence, certification, academic pathway, or portfolio is useful.

#### 8.6.1 Visual Grammar By Work Nature

| Work nature | Example roles | Primary visualisation | Secondary visualisation | Candidate proof |
| --- | --- | --- | --- | --- |
| Market and customer influence | marketing executive, growth marketer, brand manager | customer journey, campaign funnel, channel map | concept map for messaging clusters | campaign result, audience insight, conversion story |
| Creative and performance work | actor, performing artist, content creator | portfolio board, audition/rehearsal timeline, role range map | content concept map for themes and style | showreel, performance credits, creative range, rehearsal discipline |
| Horticulture and outdoor operations | gardener, landscape technician, arboriculture assistant | site map, seasonal calendar, plant-care workflow | safety/equipment matrix | plant identification, maintenance log, safety practice, before/after site evidence |
| Engineering and technical systems | data engineer, civil engineer, software engineer | system architecture, dependency map, failure/risk map | role evidence map and AIOE trace | design artefact, incident story, reliability metric, code or drawing evidence |
| Care, health, and social support | nurse aide, therapist assistant, social worker | service journey, duty-of-care map, escalation pathway | governance and accountability map | case handling, safety protocol, empathy evidence, regulated credential where required |
| Teaching and training | trainer, lecturer, learning designer | learning pathway, learner journey, assessment map | concept map for curriculum themes | lesson plan, assessment design, learning outcome proof |
| Finance, compliance, and risk | analyst, auditor, compliance officer | control map, risk register, evidence chain | organisation dependency map | audit trail, policy interpretation, control testing evidence |
| Hospitality and service operations | service crew, hotel supervisor, concierge | service blueprint, shift workflow, customer recovery map | skill transfer map | service recovery example, operations rhythm, customer value evidence |
| Logistics and field coordination | warehouse coordinator, dispatcher, operations planner | flow map, routing map, bottleneck map | dependency map | throughput metric, coordination example, exception handling |
| Leadership and transformation | transformation lead, programme manager, operations director | operating model map, decision-rights map, process redesign flow | organisation chart and conflict review | decision record, stakeholder alignment, measurable process improvement |

These are defaults, not hard rules.

V3 may show more than one visual grammar if the advertisement contains a role mash-up.

Example:

- A "Data Engineer" posting with transformation ownership should show both system architecture and process redesign.
- A "Marketing" role with heavy AI content production should show campaign funnel, content concept map, and AI accountability.
- An "Actor" role should not be reduced to skills only; it needs a portfolio, repertoire, casting fit, rehearsal discipline, and performance evidence view.
- A "Gardener" role should show site, season, safety, tools, and living-system maintenance rather than an abstract concept graph.

#### 8.6.2 InfraNodus Versus Other Graphs

InfraNodus-style visualisation should be used when the object is text, concepts, themes, clusters, gaps, or bridging ideas.

Use it for:

- job-ad phrase clusters
- repeated employer language
- skill-theme clusters
- review manuscript themes
- gaps between claims
- bridging concepts for interview questions

Do not use InfraNodus-style force graphs for every surface.

Use other visual forms when the object is not primarily textual:

- Organisation structure -> org chart
- Workflow -> process flow or service blueprint
- Hiring funnel -> funnel
- AI exposure -> trace chain
- Governance -> control map
- Candidate preparation -> storyboard
- Engineering system -> architecture diagram
- Horticulture work -> site map and seasonal calendar
- Creative performance -> portfolio board and audition timeline

Reference distinction:

InfraNodus analyses Obsidian vault content as concepts, co-occurrences, topical clusters, important ideas, and gaps.

Reference: `https://github.com/noduslabs/infranodus-obsidian-plugin`

Obsidian-style graphs mainly show page/link relationships.

V3 should support both ideas, but they answer different questions:

- InfraNodus-style: "What concepts and gaps are inside this text?"
- Obsidian-style: "Which source note, claim, comment, and decision are linked?"
- Organisation chart: "Who or what function depends on whom?"
- Workflow: "How does work move?"
- Control map: "Where does accountability sit?"

#### 8.6.3 Professional Skilling Pathway

V3 should not recommend courses by habit.

It should classify skilling evidence into:

- mandatory credential: legally or professionally required
- employer-required credential: stated in the job advertisement
- market-preferred credential: repeatedly observed across live postings
- vendor/tool certification: useful for tool ecosystems, but not a substitute for work proof
- academic pathway: degree, diploma, certificate, or postgraduate study where the role requires formal knowledge
- portfolio pathway: artefacts, showreel, case studies, build logs, design samples, project evidence
- apprenticeship or supervised-practice pathway: where skill is embodied, site-based, clinical, craft-based, or safety-sensitive
- optional enrichment: helpful but not decisive
- withhold: do not recommend because evidence is thin

Skilling recommendation labels:

- `required`
- `preferred`
- `market signal`
- `portfolio proof`
- `regulated`
- `tool-specific`
- `academic`
- `optional`
- `withheld`

Examples:

- Marketing: analytics, campaign measurement, customer research, brand strategy, advertising-platform certificates only when the postings or role tools support them; portfolio of campaigns matters more than certificate stacking.
- Acting: acting training, voice, movement, audition practice, showreel, credits, repertoire, and craft discipline; academic theatre study may help but does not replace performance evidence.
- Gardening: horticulture knowledge, plant identification, landscape maintenance, equipment safety, pesticide or chemical handling where required, site logs, seasonal maintenance evidence.
- Engineering: degree or diploma where required, professional registration where regulated, vendor certifications for cloud/data/tool ecosystems where relevant, and project or reliability proof.
- Finance/risk/compliance: formal accounting, audit, risk, governance, or compliance credentials where role evidence supports it; control evidence matters.
- Care/health: regulated qualification and supervised practice where required; do not suggest shortcut skilling.

Every skilling recommendation should answer:

- What work does this credential help the person perform?
- Is it required, preferred, or merely useful?
- Is there live demand evidence?
- Is portfolio evidence more persuasive?
- Is the role regulated?
- Is the recommendation for the candidate, the employer, or the organisation designer?

#### 8.6.4 Implementation Contract

The engine should emit:

```yaml
occupation_visual_profile:
  esco_occupation: <id/title/confidence>
  work_nature: <archetype>
  primary_visual: <visual grammar>
  secondary_visuals:
    - <visual grammar>
  why_this_visual:
    - source_span: <id>
      reason: <plain-language reason>
  evidence_artifacts:
    - artifact: <portfolio/proof/case/cert/license>
      label: <required/preferred/market signal/optional/withheld>
      basis: <posting/esco/live market/regulatory/user supplied>
  skilling_pathway:
    mandatory:
      - <credential or none>
    preferred:
      - <credential or none>
    portfolio:
      - <artifact>
    academic:
      - <degree/diploma/certificate or none>
    withhold_reason: <if any>
```

No graph or skilling pathway should appear without:

- source evidence
- ESCO or occupation-family rationale
- user-facing explanation
- ability to switch visual mode
- ability to withhold weak recommendations

### 8.7 Live Job Evidence

Live job evidence should preserve:

- source
- title
- employer
- salary where available
- posting date
- job id
- exact source text
- matching reason
- segment
- recency

The job drawer protects the user from losing source truth.

## 9. AI Recruitment Intelligence Layer

This layer gives the candidate an edge.

It must not become dishonest ATS gaming.

Better framing:

> Understand and respond to recruitment systems without losing truth.

### 9.1 Capabilities

The layer should:

- analyse organisational strategy before jobs are created
- infer competencies from business objectives rather than only job descriptions
- perform AI-assisted process redesign
- detect organisational capability gaps
- tailor resumes with explainable reasoning
- generate interview questions tied to business outcomes
- provide hiring-manager questions with evidence-backed recommendations
- detect ATS-sensitive language without keyword stuffing
- turn accepted review changes into candidate proof

### 9.2 Candidate Edge

The candidate edge should come from:

- knowing what work the job ad is really asking for
- knowing what the organisation may be trying to solve
- knowing which claims are weak or inflated
- translating experience into business outcomes
- preparing proof artifacts
- asking better interview questions
- avoiding false hope

### 9.3 Start Here Candidate Action Layer

The original product insight remains central:

> If a skill is exposed to AI, the user needs a practical way to respond.

For every important exposed duty, skill, phrase, or work boundary, V3 should produce a Start Here action block with:

- source span or deterministic signal
- why it matters for this role
- exact AI tool, workflow, or work practice that can help
- three steps the user can try this week
- proof artifact to produce
- what remains human-owned
- evidence confidence
- withhold reason if the advice would be generic or unsupported

This layer is not course marketing.

It should not say "learn AI" in the abstract.

It should say:

- what task changes
- what tool assists
- what output is expected
- what judgment the candidate must still own
- how to show credible proof in a resume, portfolio, interview, or work sample

### 9.4 Resume Alignment

Resume tailoring must be explainable.

Each suggested resume change should show:

- source job span
- inferred competency
- candidate evidence needed
- proposed wording
- risk of overclaim
- reviewer persona
- accept/reject status

Rule:

> Optimise for truthful fit, not deception.

### 9.5 Interview Intelligence

Interview questions should be tied to:

- business outcome
- process friction
- decision rights
- reporting boundary
- AI exposure
- capability gap
- governance risk

Example question types:

- What outcome owns this role?
- Which process is currently failing?
- Who has final decision rights?
- What tooling or agent support already exists?
- How will success be measured after 90 days?
- Which responsibilities are must-have versus inherited from another team?

## 10. UI / UX / Storyboard

V3 should go beyond dissecting a job ad.

It should feel like working on a professional manuscript, strategy canvas, and knowledge graph at the same time.

### 10.1 Primary Layout

Keep the three-panel idea, but make the centre a canvas.

Recommended layout:

```text
Left rail / drawers        Centre manuscript canvas              Right intelligence stack
-------------------        -------------------------              ------------------------
Sources                    Job ad as review manuscript            Knowledge graph
Personas                   Track changes                          Content concept map
Files                      Comments                               Obsidian-style linked graph
Boards                     Accepted/rejected changes              AI exposure trace
Tools                      Role / organisation overlays           Process, portfolio, site, or control map
```

The right panel should not always be a force graph.

It should select a visual grammar based on the occupation, source evidence, and user task.

For example:

- marketing -> campaign funnel, customer journey, content concept map
- acting -> portfolio board, audition timeline, repertoire map
- gardener -> site map, seasonal calendar, plant-care workflow
- engineer -> architecture diagram, dependency map, reliability/risk map
- organisation query -> org chart, capability cluster, process friction map

### 10.2 Centre Manuscript Canvas

The centre is not a card list.

The centre is the job advertisement as a working manuscript.

It should support:

- source text formatting
- highlighted spans
- margin comments
- tracked rewrites
- inline insert/delete/replace markup
- paragraph-level evidence markers
- accepted/rejected states
- navigation by comment
- navigation by persona
- navigation by claim
- clean/simple/all markup modes

The user should feel:

> I am reviewing the job ad with expert reviewers beside me.

### 10.2.1 Compare Remains First-Class

Compare is part of the original V2 edge and must remain first-class in V3.

It should not be hidden inside a secondary card.

Compare should:

- remain visible even when inactive
- survive reset where appropriate
- preserve assembled evidence across navigation
- align roles by evidence type, not only by title
- allow a role title to recenter the review
- show readiness nudges before comparing weak evidence
- use container-width responsiveness on mobile
- keep the role/source/action switcher sticky on small screens

The comparison goal is not to rank jobs mechanically.

The comparison goal is to help the user see:

- which role is clearer
- which role is more inflated
- which role has stronger evidence
- which role has better candidate proof fit
- which role signals better organisation maturity

### 10.3 Right Intelligence Stack

The right top panel should show the right kind of visual intelligence.

Visual types:

- Role evidence map: duties, skills, responsibilities, adjacent roles, progression.
- Organisation chart: function, upstream dependency, downstream dependency, governance boundary, customer value, process friction.
- InfraNodus-style concept graph: terms, concepts, clusters, gaps, bridging concepts.
- Obsidian-style linked graph: source spans, claims, comments, personas, decisions, evidence artifacts.
- AIOE trace graph: SSOC, ISCO, SOC, layer scores, confidence.
- Workflow map: current process, friction, redesigned flow, human owner, agent candidate.
- Hiring funnel: phrase, screening signal, evidence needed, truthful resume alignment.
- Portfolio board: work samples, credits, cases, artefacts, proof of practice.
- Site or service map: physical/site work, operational route, seasonal or shift rhythm.
- Control map: risks, escalation, accountability, allowed action, forbidden action.

The visual is not decoration.

Every node, stage, lane, card, or map point should be clickable back to:

- source span
- review comment
- tracked change
- evidence claim
- accepted decision

Default visual selection should come from the occupation visual profile in section 8.6.

### 10.4 Left Working Drawers

Left side should hold:

- source files such as `skillset.md`
- uploaded job ads
- resume drafts
- persona reviewer list
- board/storyboard switcher
- file functions
- saved review sessions

The left side can collapse to icons.

It should not steal space from the centre manuscript.

### 10.5 Bottom / Footer State

Footer should show:

- save state
- memory state
- last saved timestamp
- storage location
- version
- active source file
- active board
- user/auth status

### 10.6 Storyboard Boards

Kanban/storyboard remains useful, but it should become secondary to the manuscript review flow.

Cards should represent:

- accepted insights
- unresolved comments
- candidate proof tasks
- process redesign hypotheses
- interview questions
- resume rewrite tasks
- graph clusters
- governance risks

Each card should link back to:

- source span
- comment
- reviewer
- graph node
- decision

### 10.7 Print / PDF / Manuscript View

V3 should support a professional print-like view:

- clean manuscript
- all markup manuscript
- reviewer summary
- decision ledger
- candidate action brief
- interview question sheet
- resume alignment rationale

This should feel like exporting an editorial review package, not a dashboard screenshot.

### 10.8 Generative UI Review Studio

Generative UI in V3 does not mean random AI-generated screens.

It means the interface adapts to the evidence being reviewed.

The adaptation must be:

- evidence-triggered
- explainable
- reversible
- human-controlled
- source-bound
- governed

The centre manuscript remains stable.

Generative UI may change the surrounding review tools, graph panels, prompts, and decision aids.

### 10.8.1 Trigger Logic

The interface may adapt when the review detects:

- many vague transformation phrases
- high AIOE language-model exposure
- weak or partial AIOE crosswalk confidence
- ATS-heavy screening language
- role mash-up signals
- repeated duties across employer postings
- organisation-query input such as `DBS`
- strong reviewer disagreement
- missing decision rights
- governance or accountability gaps
- candidate evidence gaps

### 10.8.2 Generated Panels

Generated panels should be selected from known, governed panel types.

V3 should not invent arbitrary panels.

Panel types:

- Role Review: role, duties, responsibilities, skills, adjacent roles.
- Organisation Review: employer, function, repeated capabilities, process friction.
- Review Comments: persona comments and tracked rewrites.
- Evidence Trail: source spans, claims, accepted changes, rejected changes.
- AIOE Trace: SSOC, ISCO, SOC, layers, delta, confidence.
- Hiring System: ATS signals, recruiter interpretation, truthful resume alignment.
- Process Redesign Map: current work, friction, redesigned work, agent candidate, governance need.
- Candidate Edge: proof tasks, interview questions, resume rationale.
- Conflict Review: persona disagreement and human decision prompts.
- Governance Ledger: owner, risk, allowed action, forbidden action, audit trail.
- Portfolio Board: artefacts, credits, cases, showreel, samples, proof of practice.
- Site / Service Map: physical setting, service journey, route, seasonal rhythm, safety points.
- Skilling Pathway: required credentials, preferred credentials, portfolio proof, academic pathway, withhold reason.
- Content Concept Map: InfraNodus-style clusters, important concepts, gaps, and bridging ideas.

### 10.8.3 Generated Layout Rules

The layout may adapt, but the user should not lose orientation.

Rules:

- keep the manuscript canvas as the centre of gravity
- open only one major right-side graph at a time
- show why a panel appeared
- let the user pin, close, or replace generated panels
- preserve accepted/rejected review state
- never hide source text behind generated explanation
- never replace human decision with generated action

### 10.8.4 Examples

If the job ad contains many vague transformation phrases:

- show Process Redesign Map
- show Content Concept Map
- ask which process is being redesigned
- invite tracked rewrites to make responsibility clearer

If AIOE exposure is high:

- show AIOE Trace
- show human-led accountability comments
- prevent fatalistic replacement language

If the input is an organisation name:

- show Organisation Chart
- show repeated capability clusters
- show employer-posting evidence list
- withhold if the posting sample is thin

If ATS-heavy language is detected:

- show Hiring System
- suggest truthful resume alignment
- warn against keyword stuffing

If reviewer disagreement is high:

- show Conflict Review
- surface evidence for each side
- ask the human to accept, reject, resolve, or escalate

If the role is marketing or customer-growth oriented:

- show Campaign Funnel
- show Customer Journey
- show Content Concept Map for repeated messaging
- show portfolio proof before recommending certificates

If the role is creative or performance oriented:

- show Portfolio Board
- show Audition / Production Timeline
- show Role Range Map
- avoid reducing the role to generic soft skills

If the role is gardening, horticulture, landscape, or field-maintenance oriented:

- show Site / Service Map
- show Seasonal Calendar
- show Safety / Equipment Matrix
- show required handling or safety credentials only where evidence supports them

If the role is engineering or technical-systems oriented:

- show System Architecture
- show Dependency Map
- show Reliability / Failure Map
- show academic, professional, or vendor credentials only with role evidence

### 10.8.5 Generative UI Guardrails

Generative UI must not:

- create fake certainty
- create decorative graph clutter
- hide uncertainty
- invent organisation structure
- imply autonomous action
- manipulate the user toward applying
- turn ATS support into deception
- bury the original job ad

Every generated UI element should answer:

> Why am I seeing this, what evidence caused it, and what can I do with it?

### 10.9 Mobile And iPad

Mobile:

- centre manuscript first
- guided review header becomes compact
- graph becomes modal/drawer
- comments become threaded bottom sheet

iPad mini:

- centre manuscript plus collapsible right graph
- left rail as floating drawer
- guided review header remains visible but compact

Desktop:

- full guided review header
- manuscript canvas
- right graph stack
- left file/persona rail

## 11. Agentic Governance

No autonomous action should be allowed without:

- named human owner
- risk assessment
- scope
- allowed action
- forbidden action
- evidence basis
- audit trail
- override path

### 11.1 Governance Ledger

The Decide panel should record:

- decision under review
- source evidence
- deterministic result
- AI interpretation
- risk class
- named human owner
- allowed action
- forbidden action
- guardrails
- transparency note
- audit trail
- blocked or allowed status

### 11.2 Agent Identity

Each persona-agent output should disclose:

- agent/persona name
- purpose
- lens used
- source evidence
- whether it used deterministic code
- whether it used LLM judgement
- what it can decide
- what it cannot decide
- review condition
- stop condition

### 11.3 Multi-Agent Coordination Risk

V3 should watch for:

- false consensus
- unsupported agreement
- repeated assumptions
- escalation loops
- bias stacking
- persona overreach
- recommendation without owner

## 12. Product Standard

V3 should not become:

- an ATS gaming tool
- a keyword stuffing assistant
- a course-selling funnel
- a kitchen drawer of unrelated tools
- a fake certainty machine
- a blind automation recommender
- a dashboard that hides evidence
- a graph visualisation with no user decision

V3 should become:

- a reviewable work-intelligence canvas
- a professional manuscript-style job review system
- a candidate edge system based on truth and evidence
- an organisation-reading system
- a BPR and agentic governance companion
- a source-bound, interpretable, human-accountable decision tool

## 13. Implementation Principles

### 13.1 Start With The Review Manuscript

Build the centre canvas around the job ad as a manuscript.

Do not start with graph decoration.

The source text must remain inspectable.

### 13.2 Track Changes From Day One

Comments alone are not enough.

Track changes must support:

- insert
- delete
- replace
- split
- merge
- relabel
- withhold
- escalate

### 13.3 Graphs Must Be Evidence-Bound

Every graph node should link to source evidence.

If a node cannot link to evidence, it should be labelled inferred, unverified, or withheld.

### 13.4 AIOE Must Remain Deterministic

AIOE scores must come from the resolver.

LLMs may narrate them.

LLMs must not invent them.

### 13.5 Candidate Edge Must Stay Ethical

The system may help candidates understand ATS and recruitment systems.

It must not encourage deception.

The candidate edge is:

- better evidence
- better questions
- better proof
- better judgement
- better fit explanation

### 13.6 Builder Lens Engineering Guardrails

V3 implementation should follow these engineering guardrails:

- keep constants, levels, labels, and design tokens in a single source of truth
- protect live searches with request IDs, cancellation guards, and stale-closure checks
- prefer named async handlers over multi-line async JSX props
- inspect nearby JSX structure when Vite reports confusing syntax errors
- do not invent taxonomy, skill, occupation, salary, or source data
- label sample, computed, estimated, derived, withheld, and live evidence distinctly
- make every important UI state browser-verifiable
- treat build success as necessary but not sufficient

When a future agent claims something is wired, it must be able to say which of these passed:

- source file changed
- local build passed
- local browser interaction passed
- API route returned real data
- production deployment completed
- production URL was verified

### 13.7 Codex Status Line Operating Spec

V3 handover and agent work should use a Codex status line, not a Claude status line.

Script:

- `~/.Codex/statusline-command.sh`
- wired in `settings.json`

The status line should show:

- active Codex model
- reasoning effort
- context fit
- quota
- repo state
- MCP state
- agent state

Colour requirements:

- colour-blind safe blue/orange or plain monochrome only
- never rely on red/green meaning
- segment separator is ` · `

Target rendering:

```text
L1 [Codex GPT-5 · effort: high] Ctx ▓▓▓░░ 32% (320k/1.0M) · ⚠ 5h: ▓▓░ 26% ↺3:40pm · Wk: ▓▓░ 26%
L2 Fits: active ✓ · fallback ✓ · small ✗ · Effort: low / medium / high
L3 Chat № 7 · 1041 all-time · 10-06 '26 14:01 SGT
L4 PR № 325 merged · 275 since journal (23-05) · 30 since vault (10-06)
L5 MCP: 13 ok (av, gdrive, vercel, gcal, gmail, +8 more) · Agents: 0 active / 1 idle
```

Rules:

- read the model exactly from Codex payload, config, or local state
- do not hardcode Claude names such as Opus, Sonnet, or Haiku
- do not invent model names
- if model family is unknown, show `Codex unknown`
- if reasoning effort is unknown, show `effort: -`
- `Fits` means which configured Codex model windows can still hold this chat
- fit is based on live input tokens versus each configured model context window
- fit is not usage
- if fallback models are unknown, show `Fits: active ✓ · fallback - · small -`
- chat count comes from local `~/.Codex/projects/*.jsonl`, cached for 5 minutes
- timestamp format is `DD-MM 'YY HH:MM SGT`
- GitHub PR calls are cached for 10 minutes
- MCP names come from config names, deduped and stripped of plugin prefixes
- agent state renders as `Agents: N active / N idle` or `Agents: -`
- quota figures must match `/usage` when available
- quota is cached for 60 seconds
- if too wide, drop token counts first, then weekly quota
- do not make network calls on every render
- sync output must go to cache or `/dev/null`

If the user says `statusline broken`, the repair ritual is:

1. Read the script.
2. Read `settings.json`.
3. Repair against this spec.
4. Render once.
5. Show the rendered rows.

## 14. First Storyboard

### Scene 1: Ingress

User enters a job ad, role, company, or live search.

V3 identifies whether this is:

- role read
- organisation read
- candidate preparation
- recruitment intelligence
- BPR review

### Scene 2: Manuscript View

The job ad appears as a formatted manuscript.

Source spans are detected.

The guided review header appears and tells the user what is being reviewed, what has been found, and what action can happen next.

### Scene 3: Persona Review

Persona-agents comment and suggest rewrites.

The user sees tracked changes and margin comments.

### Scene 4: Right Visual Intelligence

The right panel shows the visual grammar that fits the occupation and evidence.

Examples:

- role evidence map for duties, skills, and adjacent roles
- organisation chart for functions, boundaries, and dependencies
- InfraNodus-style content concept map for job-ad themes, clusters, and gaps
- AI exposure trace for occupation-code mapping and exposure confidence
- workflow, funnel, portfolio board, site map, or control map where the job nature requires it

Visual points link back to manuscript spans and review comments.

### Scene 5: Human Decision

The user accepts, rejects, resolves, or escalates changes.

Accepted changes become:

- candidate proof tasks
- interview questions
- resume alignment suggestions
- process redesign hypotheses
- governance ledger entries

### Scene 6: Output Package

V3 exports:

- clean role read
- all-markup review
- candidate action brief
- interview question sheet
- resume alignment rationale
- organisation/process redesign insight
- governance ledger

## 15. Open Design Questions

1. Should the first implementation begin with one job ad as manuscript, or live MCF search as manuscript source?
2. Which persona reviewers are mandatory for day one?
3. Should the right panel start with the occupation's primary visual grammar or always begin with the role evidence map?
4. Should AIOE trace be visible by default or opened from the AI Exposure area in the guided review header?
5. Should accepted tracked changes automatically create Kanban cards?
6. Should resume alignment be gated behind explicit user upload or manual paste?
7. Should the first export be Markdown, PDF, or both?

## 16. Working Principle

V3 should help the user see the work system.

It should not merely help the user chase the job ad.

The desired outcome is not more applications.

The desired outcome is better judgment about work, capability, AI, organisation, and the candidate's truthful edge.
