## 0. How To Read This File


# ========================================================================================================================================== #


## 1. DOCTRINE

1.1 Ethos

### 1.1.1 Curiosity

V3 explores alternative system routes.

It should ask:

- Is this really a job problem?
- Is this actually a process problem?
- Is the role covering a governance weakness?
- Is the organisation buying labour because it has not redesigned work?

### 1.1.2 Collaborativeness

V3 assumes work now crosses human and agent boundaries.

It should make visible:

- what the human owns
- what the agent can assist
- what the deterministic engine computed
- what the LLM merely interpreted
- what must be escalated

### 1.1.3 Customer Focus

V3 must ground analysis in end-user value.

The end user may be:

- jobseeker
- worker
- hiring manager
- HR lead
- organisation designer
- training planner
- public-sector policy actor

The product should not optimise only for clicks, applications, or keyword matching.

### 1.1.4 First Principles Understanding

V3 should teach the foundational why.

It should avoid superficial syntax such as:

- add these keywords
- take this course
- use this prompt
- apply to this role because the title matches

Instead, it should expose:

- why the role exists
- why the skill matters
- why AI changes the work boundary
- why the organisation may be hiring
- why the candidate should or should not spend effort

### 1.1.5 Domain Breadth

V3 should understand adjacent business functions.

A role graph should connect to:

- operations
- finance
- compliance
- customer value
- technology
- HR
- market demand
- governance

### 1.1.6 Systemic Thinking

V3 should map complex interactions across:

- role
- worker
- organisation
- job market
- AI system
- governance chain
- platform incentives
- labour policy

The goal is not a list of skills.

The goal is a working map of the system.

### 1.1.7 Judgment And Discernment

V3 must know when to overrule autonomous output.

It should withhold, warn, or escalate when:

- evidence is thin
- the source is not verified
- an action has no named human owner
- AI output conflicts with deterministic evidence
- the system may create false hope
- automation would remove accountability



## 1.2 THESIS

V3 treats a job advertisement as a signal of organisational need, not merely as a vacancy.

A role may reveal:

- a capability gap
- a governance gap
- a process bottleneck
- a compliance ritual
- a strategic transition
- a hidden accountability need
- a mismatch between work-as-written and work-as-done

The central question is no longer:

> Can AI do this job?

The better V3 question is:

> What human stewardship, system redesign, and agentic control are needed for this work to create value?

The V3 north star is:

- keep the V2 clarity people liked
- keep RoleGraph as a readable edge
- add organisation perspective
- add BPR perspective
- add agentic governance
- keep every recommendation decision-oriented

Every output should help a human decide one of:

- apply
- prepare
- compare
- redesign
- build an agent candidate
- withhold because evidence is too thin
- Automation is not forbidden. But automation is not assumed to be the highest-value path.


## 1.3 Framework Map

### 1.3.1 Placement Read

The placement read turns a job into:

- AI exposure
- anatomy
- demand
- proof gap
- fairness risk
- action brief

It is the practical candidate-facing read.


## 1.4. Strategy Layer

V3 strategy should be explicit.

### 1.4.1 Preserve

Preserve V2's fast role read and clear graph edge.

Users liked the ability to see a role quickly.

V3 should not bury that clarity under too many abstractions.

### 1.4.2 Expand

Move from role graph to organisation graph.

The role remains the entry point.

The organisation becomes the deeper map.

### 1.4.3 Commonise

Cluster repeated duties and capabilities across postings.

But protect role-specific edges.

Commonising should reveal reusable capability, not erase meaningful difference.

### 1.4.4 Question

Use BPR to question the role itself.

Some roles are mashed up because:

- ownership is unclear
- process is broken
- governance is missing
- handoffs are failing
- management wants one person to absorb system friction

### 1.4.5 Segment

Split live job evidence into:

- title match
- duty match
- segment match
- adjacent-role match
- employer-context match

This is especially important for searches such as "transformation".

### 1.4.6 Criticise

Expose:

- ghost risk
- template stuffing
- platform distortion
- ATS distortion
- role mash-up
- fake seniority
- unrealistic skill bundles
- weak demand

## 1.5. Runtime Contract

V3 should treat runtime behaviour as part of governance.

### 1.5.1 Provider Order

Primary LLM:

- OpenAI via `OPENAI_API_KEY`

Fallback LLM:

- Google Gemini via `GEMINI_API_KEY`
- model selected by `GEMINI_MODEL`

### 1.5.2 Provider Honesty

The UI and logs should never pretend all AI output came from one provider if fallback was used.

Where relevant, output should disclose:

- provider
- model
- fallback status
- whether the result was deterministic or generated



### 1.5.3 Vercel Deployment Context

V3 is deployed as a Vercel surface.

Runtime guidance:

- prefer platform-native functions before custom infrastructure
- use Node-compatible server functions rather than assuming edge-only behaviour
- use environment variables for provider keys
- keep deployment logs useful for debugging
- keep user-facing output separate from debug output

### 1.5.4 Debug And DMM

Debug mode is a governance tool, not a toy.

`dmm` should help trace:

- user query
- selected live job source
- deterministic steps
- LLM call
- fallback path
- errors
- withheld decisions

## 1.6 V3 Goal Folder

The goal folder is the philosophical and methodological root of V3.

It introduces:

- vacancy as systemic deficit
- job advertisement as strategy interface
- human-in-the-loop as accountability architecture
- Boundary, Dependency, Feedback as the operating lens
- forensic reversal as a way to read job ads backwards into system needs
- sentinel telemetry as governance for autonomous systems


# ========================================================================================================================================== #


#2.0 INGRESS FRAMEWORK

##2.1 The Ten C Questions Method

###2.1.1. CALL

Ask:

- What would you call this advertised role?
- Can you give it your own descriptive title?

V3 use:

- compare user title, MCF title, ESCO title, and inferred role shape
- reveal when the advertised title hides a different work system

###2.1.2. COMPACT

Ask:

- Can you summarise the whole advertised role?
- What is the role story in plain language?

V3 use:

- produce a compact role read
- separate duties, outcomes, requirements, and organisation signals

###2.1.3. CRYPTIC

Ask:

- What is confusing about the advertised role?
- What is unclear, missing, inflated, or contradictory?

V3 use:

- flag role mash-up
- flag vague ownership
- flag unsupported claims
- flag thin evidence

###2.1.4. CROSS-REFERENCES

Ask:

- What other roles in the organisation help explain this role?
- What competitor roles help explain it?

V3 use:

- compare same-employer postings
- compare adjacent MCF postings
- feed RoleGraph and OrgGraph
- identify common capabilities

###2.1.5. CONSIDERABLE PEOPLE

Ask:

- Who are the people implied by this role?
- Who is served, managed, coordinated, reported to, or governed?

V3 use:

- map stakeholders
- identify accountable owner
- identify handoffs
- identify customer or citizen value

###2.1.6. COMPELLING WORDS

Ask:

- Which words repeat?
- Which phrases reveal the real work?

V3 use:

- extract repeated duty phrases
- detect function keywords
- detect transformation language
- detect governance and compliance signals

###2.1.7. CRITICAL SENTENCE

Ask:

- Which sentence best reveals the role?
- Which line carries the highest signal?

V3 use:

- highlight the strongest evidence sentence
- attach provenance
- use it as the anchor for role diagnosis

###2.1.8. COMMAND CHAIN

Ask:

- Who is mentioned above, below, or around the role?
- Is there a supervisor, department head, organisation head, brand, value proposition, or customer promise?

V3 use:

- map reporting and governance context where evidence exists
- avoid inventing department structure
- connect role to organisation purpose only when supported

###2.1.9. CENTRAL LESSON

Ask:

- What is the main point of this advertised role?
- What idea weaves the advertisement together?

V3 use:

- produce the role thesis
- connect role, organisation need, AI readiness, and human edge

###2.1.10. CREATE OUTCOME

Ask:

- What is your response to the knowledge gained?
- What real-work application follows?

V3 use:

- decide apply, prepare, compare, redesign, build agent candidate, or withhold
- connect the read to proof artifacts and next action

###2.1.11 Workflow Contract

The workflow must stay evidence-bound.

It should not turn the 10 questions into free invention.

Each answer should be labelled as:

- from posting
- computed
- derived
- AI estimate
- unverified
- withheld

The workflow should support both:

- role perspective
- organisation perspective

For role perspective, the workflow asks:

> What does this advertised role really mean?

For organisation perspective, the workflow asks:

> What pattern do these advertised roles reveal about the organisation?


## 2.2 Vacancy Teleology Methodology

Treat a job advertisement as a signal.

Ask:

- What gap is this organisation trying to close?
- What work is being bundled together?
- What risk is being transferred to the human?
- What system friction is hidden in the role description?
- What does the role say about the organisation's operating model?

## 2.3 Boundary, Dependency, Feedback Methedology

Use BDF as the primary V3 analysis method.

Boundary:

- What is inside this role?
- What is outside this role?
- What has been wrongly pushed into this role?

Dependency:

- What upstream input does this role depend on?
- What downstream decision depends on this role?
- Which adjacent teams shape success?

Feedback:

- What loop improves the work?
- What loop hides failure?
- What metric would reveal drift?
- What sentinel should trigger correction?

For AI-readiness, AIOE adds a deterministic feedback signal:

- Has generative language exposure risen above the older aggregate baseline?
- Is the exposure layer relevant to the actual work evidence?
- Is the crosswalk confidence exact, aggregated, partial, or none?
- Should V3 show, caveat, or withhold the exposure number?

## 2.3 Forensic Reversal Method

Read the job ad backwards.

Process:

- strip inflated nouns
- isolate action verbs
- separate evidence from aspiration
- identify repeated work objects
- infer the system bottleneck
- classify whether the role is bridge, firewall, patch, or transformation signal

## 2.4 Business Process Re-engineering (BPR) Lens Method

From the organisation perspective, V3 should ask whether the role should exist in its current shape.

Business Process Re-engineering questions:

- Can the workflow be redesigned before hiring?
- Is the organisation using a role to compensate for broken process?
- Is a "mash-up" role hiding unclear ownership?
- Can common capabilities be shared across departments?
- Should an agent support a function rather than replace a role?

## 2.5 Rumelt Strategy Kernel methodology

Use Rumelt's strategy kernel as a discipline for organisational reading.

Diagnosis:

- What is the real obstacle or bottleneck?
- What does the job ad reveal about the system?

Guiding policy:

- What approach would address the obstacle?
- Is hiring the right move, or is redesign needed first?

Coherent action:

- What should the person, organisation, or agentic system actually do next?

## 2.6 Ecotone Lens method

An ecotone is the edge between systems.

In V3, high human value often appears at boundaries such as:

- business and technology
- customer and operations
- policy and delivery
- human judgment and agent execution
- internal process and external market

V3 should look for these edges because they often reveal future-proof roles.

## 2.7 Flow Lens method

Use flow to read work as value movement.

Ask:

- Where does value enter?
- Where does work wait?
- Where does handoff create friction?
- Which activities create value?
- Which activities only move confusion around?
- Which role exists because flow is broken?

## 2.8 Falsification method

V3 should include a critic move.

Ask:

- Should we distrust this evidence?
- Is this job ad a template?
- Is the posting compliance-only?
- Is the role a mash-up?
- Is the advice self-serving?
- Is the demand real enough?

The critic is not negativity.

It is worker protection.


# ========================================================================================================================================== #


# 3.0  O-I-A Posting Lens
A deterministic instrument for reading one MyCareerFuture posting into the v3 occupation-taxonomy and AIOE pipeline, through three lenses - Role (the occupation advertised), Organisation (the employer the posting reveals), and AI (how artificial intelligence bears on the role and the firm). The three stages run in fixed order and are bound by an evidence contract: nothing is interpreted that was not first observed, and nothing is emitted that was not first interpreted.

Adapted from the inductive observation-interpretation-application reading method. Its one carried-over discipline: draw findings out of the source, never read them in.

### 3.0.1 The evidence contract
Three stages, each consuming only the prior stage's output:

Observation emits spans - verbatim fragments of the posting, each with an ID. Nothing else.
Interpretation emits claims. Every claim must cite one or more Observation span IDs. A claim with no span is invalid and is dropped.
Application emits the record - codes, scores, routing. It acts only on Interpretation claims, never on raw text.
Consequence: every code and score traces back through a claim to a verbatim span, so a reviewer can audit the chain and the engine cannot classify from thin air.

Each derivation also declares its method:

rule - deterministic lookup (lexicon, regex, taxonomy table). Bit-identical on re-run.
judgement - model inference. Carries confidence (0-1); reproducible by fixed prompt, not bit-identical.
Where a required field cannot be grounded, emit ABSENT. Absence is a valid output, not a gap to be filled by guessing.


## 3.1 Inputs, lenses, output
Input - one posting: title, description, and structured fields (company, salary, employment type, posting date, posting history).
Lenses - run across every stage:
ROLE - occupation, tasks, skills -> SSOC-2010.
ORG - sector, firm signals -> SSIC + context.
AI - AI content of the role, task-level AI exposure -> AIOE, and the firm's AI-adoption posture.
Output - one structured record (Section 5).


## 3.2 Stage O - Observation - "what does it say"
Literal only. Record verbatim, including the obvious. No inference, no labelling, no cross-posting comparison.

ROLE spans - exact title; each stated task or duty; each stated requirement (years, credential, skill); stated seniority words; stated reporting line and team size; location; salary; employment type; repeated terms (record the term and its count).

ORG spans - the firm's own words about itself (size, mission, market, culture); named functions and adjacent teams; any stated reason for the hire.

AI spans - verbatim mentions of AI, ML, generative AI, LLMs, data science, or automation; named AI tools, frameworks, or platforms; AI-related skills or credentials; any firm statement about AI use, AI strategy, or AI products.

Output is a list of {span_id, lens, text}. Stop here. Do not interpret.


## 3.3 Stage I - Interpretation - "what does it mean"
Decode the spans. Every claim cites the span IDs it rests on.

### 3.3.1 ROLE claims

Occupation mapping - candidate SSOC-2010 code(s) from the title and task spans (judgement, confidence).
Task inventory - normalise duty spans into discrete tasks (the basis for AI exposure scoring).
Seniority read - stated-versus-real, citing the requirement and scope spans.
Requirement split - hard must-have versus nice-to-have, from the spans' modal language.
Emphasis - repeated or first-stated terms read as priority weight, not decoration.


### 3.3.2 ORG claims
Sector mapping - candidate SSIC from the firm's self-description spans.
Operational signal - churn or expansion, only if posting-history fields are present; otherwise ABSENT.
Cultural tell - what euphemism or buzzword spans imply about workload or maturity (judgement, confidence; cite the span).
Coherence - does the self-description match the role's actual task spans?
External corroboration - last, and only as confirmation; never as the source of a claim.

### 3.3.3 AI claims

AI-role read - ai_core, ai_adjacent, or non_ai, from the AI and ROLE task spans (judgement, confidence).
Task AI-exposure - map the ROLE task inventory to AIOE exposure, distinguishing augmentation from automation (LM-2023 primary, 2021 aggregate baseline). Cites the ROLE task claims and the AI spans.
Firm AI-adoption - is the employer building AI, using AI, or neither, from ORG self-description and AI spans (judgement, confidence).

## 3.4. Stage A - Application - "what does it ask the engine to do"
Not a hiring decision. The action is classification and routing.

Emit - assemble the record: SSOC, SSIC, task inventory, AI-role, AIOE exposure, AI-adoption, seniority, each value carrying its claim chain and confidence.
Score - compute AIOE exposure from the task inventory.
Route - if any required field is ABSENT or below the confidence threshold, set route_to_review rather than forcing a value; otherwise accept.
Flag - mark anomalies (incoherent self-description, title-task mismatch, one posting scoping several roles, AI claims unsupported by any AI span) for the taxonomy maintainer.

## 3.5. Output schema
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

## 3.6 Guardrails
Fixed order - O, then I, then A. No stage reads ahead.
Traceable - every claim cites spans; every emitted value cites claims.
ABSENT over invention - unanswerable fields are recorded, not guessed.
Deterministic spine - rule derivations are bit-identical; judgement derivations carry confidence and abstain below threshold.
Reproducible - same posting, same prompt, same record.
Bindings to confirm. Role -> SSOC-2010; Organisation -> SSIC; AI exposure -> AIOE (LM-2023 primary, 2021 baseline). Swap if v3 uses different tables.

Design alignment. This document is the Prompt; the posting and its fields are the Context; Sections 0 and 6 are the Control - Output = f(Prompt, Context, Control).

Provenance. Structure adapted from the inductive observation-interpretation-application method; all domain content is original to SG Career View v3.


# ========================================================================================================================================== #



## 4.0 A.I.

### 4.1 Pro-Worker AI Test

Every AI recommendation should pass this test:

- Does it increase human expertise value?
- Does it create better human work?
- Does it preserve accountability?
- Does it reduce false hope?
- Does it expose hidden organisational friction?
- Does it avoid turning workers into disposable interfaces?



### 4.2 V3 AIOE Folder

The AIOE folder is the deterministic exposure backbone.

It maps Singapore job evidence into AI Occupational Exposure through a traceable crosswalk:

```text
SSOC -> ISCO-08 -> SOC 2010 -> AIOE scores
```

The important V3 principle is:

AI-readiness numbers must come from a data chain, not from LLM judgement.

AIOE provides three layers:

- `lm2023`: Language Modeling AIOE, the primary generative-era exposure layer.
- `ig2023`: Image Generation AIOE, useful where visual work is central.
- `agg2021`: Aggregate AIOE, the pre-ChatGPT baseline across AI applications.

V3 should preserve the distinction between:

- primary exposure now
- older baseline exposure
- generative-era delta
- confidence in the crosswalk

The delta is:

```text
lm2023 raw - agg2021 raw
```

A positive delta means language-model AI increases exposure relative to the older aggregate baseline.

This is not a replacement score.

It is a signal for where the role, skill bundle, or occupation may be more exposed to generative language systems than older AI measures suggested.


### 4.3 Deterministic Ideals

V3 separates computation from narration.

### 4.3.1 Computed Before Explained

Numbers must be computed by deterministic code or verified data.

LLMs may explain numbers.

LLMs must not invent numbers.

### 4.3.2 Provenance Labels

Every surfaced claim should be labelled as one of:

- from MCF
- computed
- derived
- AI estimate
- unverified
- withheld

### 4.3.3 Repeatability

Same input and same data should produce the same deterministic result.

Non-deterministic outputs must be labelled as such.

### 4.3.4 Withholding Is A Feature

V3 should withhold conclusions when evidence is weak.

This is not failure.

It is honesty.

### 4.3.5 No False Hope

V3 must not say that a user should spend time, money, or emotional effort unless demand is demonstrably real enough.

The skeptic seat is important because it protects the worker from self-serving narratives.

### 4.3.6 No-Hype Agent Language

V3 must distinguish:

- agent idea
- agent candidate
- agent workflow
- deployable agent
- autonomous action

"Agent candidate" does not mean "deploy agent".

No agent should be treated as deployable until risk, owner, scope, identity, and audit are present.


### 4.3.7 AIOE Numeric Contract

AIOE numbers are deterministic engine evidence.

They must follow this contract:

- compute through `SSOC -> ISCO-08 -> SOC 2010 -> AIOE`
- keep all layers visible in the data model
- treat `lm2023` as the primary language-model exposure layer
- treat `agg2021` as the baseline
- compute delta as `lm2023 raw - agg2021 raw`
- label the confidence flag
- never silently convert missing exposure to zero
- withhold if the chain is incomplete

Confidence flags:

- exact: one SOC matched and no score is missing
- aggregated: several SOC codes matched and were collapsed by policy
- partial: some SOC codes had no AIOE entry
- none: the chain is incomplete and all layer scores are null

If confidence is `partial`, V3 may explain the limitation.

If confidence is `none`, V3 should withhold the numeric exposure and say why.

LLMs may narrate what the AIOE signal means.

LLMs must not author the AIOE score, delta, or confidence.

## 5. Agentic Governance

V3 should align with the IMDA-style agentic governance principles already discussed for this project.

### 5.1 Risk Assessment

Before deployment or autonomous action, V3 should identify:

- possible harm
- affected human
- affected organisation
- source uncertainty
- reversibility
- escalation route

### 5.2 Human Accountability Chain

Every autonomous action must map to a named human owner.

If no owner exists, the action should remain analysis only.

### 5.3 Agent Identity Management

Every agentic output should disclose:

- which agent or seat produced it
- the agent purpose
- the named owner
- what evidence it used
- what it is allowed to decide
- what it is not allowed to decide
- expiry or review condition
- kill switch or stop condition
- whether it used an LLM
- whether it used deterministic code

### 5.4 Technical Guardrails

Guardrails should exist across the software lifecycle:

- source-bound evidence
- deterministic scoring
- logging
- debug mode
- provenance badges
- fallback handling
- provider disclosure
- prompt-output validation
- human override

### 5.5 End-User Transparency

Users should know when they are interacting with:

- deterministic engine
- LLM explanation
- stakeholder agent
- live job data
- cached data
- unavailable or withheld data

### 5.6 Multi-Agent Coordination Risk

Multi-agent systems can produce escalation, bias stacking, and false consensus.

V3 should track:

- delegation depth
- escalation loops
- disagreement between seats
- evidence conflicts
- repeated assumptions
- unsupported consensus
- emergent recommendations with no accountable owner

### 5.7 Governance Ledger

The Decide panel should become the governance ledger.

It should record:

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

If the ledger cannot be filled, V3 should keep the output as analysis only.

### 5.8 V3 Skills Folder

The skills folder is the agentic operating layer.

It frames V3 as a multi-seat evidence review, not a single chatbot answer.

Current implemented skill files:

- `careerview-panel`
- `agent-skeptic`

Intended panel seats listed in `v3/skills/README.md`:

- agent-client
- agent-director
- agent-hiring-manager
- agent-hr
- agent-recruiter
- agent-platform-ceo
- agent-platform-engineer
- agent-ats
- agent-jobseeker
- agent-academic
- agent-skeptic

Only implemented seats should be called executable.

Unimplemented seats should be treated as intended design, not live capability.


# ========================================================================================================================================== #
# 9.0 ENGINE

## 9.1.0 Version 2

Version 2 is the role-first foundation that V3 must not lose.

V2 asks:

> For this role, which skills matter, how does AI affect them, where can the person go next, and what action can they take?

V3 expands that question into organisation, BPR, governance, and agentic systems.

But V3 should preserve the V2 edge:

- fast role entry
- clear ESCO-based skill read
- visible AI-readiness segmentation
- practical prompts
- progression and crossover paths
- compare view
- outcome-oriented career reflection

### 9.1.1 V2 Methodology

V2 methodology is role-centred.

The flow is:

1. Resolve the role.

Match the user's job title to an occupation, using ESCO and local title handling where needed.

2. Extract essential skills.

Use ESCO v1.2 skills where available.

Fall back only when the canonical source cannot supply enough skill evidence.

3. Rate AI impact skill by skill.

Classify each skill by how AI changes the work.

4. Convert AI impact into action.

For each non-human-led skill, generate a practical prompt, technique, preparation note, and next phase.

5. Map career movement.

Show promotion, lateral, specialist, and crossover options.

6. Compare roles.

Let the user see shared strengths, unique skills, AI exposure, development gaps, and reflective next steps across up to three roles.

7. Produce an outcome.

The outcome is not only information.

The outcome is a clearer human decision about where to build proof, where to apply, and where to be cautious.

### 9.1.2 V2 AI Readiness Analysis

V2's AI-readiness lens is skill-level segmentation.

It reads a role through four main levels:

- Full Automation: AI can perform the skill with minimal human input.
- AI-Augmented: AI improves speed or quality while the human directs.
- AI-Assisted: AI supports the work, but human judgment leads.
- Human-Led: presence, empathy, physical action, accountability, or judgment remains central.

V2 also introduces practical readiness labels:

- ready
- prepare
- quick prep first
- prep needed

The V3 lesson is important:

AI readiness is not a single score.

It is a map of which parts of the work can be delegated, assisted, strengthened, protected, or kept human-owned.

V3 extends this with AIOE.

The V2 lens asks:

> How does AI affect each skill?

The V3 AIOE lens adds:

> What is the occupation-level exposure signal, and how confident is the SSOC-to-AIOE chain?

Together they should produce two views:

- skill-level readiness: human-led, assisted, augmented, automatable
- occupation-level exposure: AIOE layer, baseline, delta, and confidence

When the two disagree, V3 should show the disagreement instead of hiding it.

For example:

- a role may have high occupation-level language exposure but still contain human-led accountability duties
- a role may have moderate aggregate exposure but a high generative-language delta
- a role may lack a complete crosswalk, so the number must be withheld

### 9.1.3 V2 Techniques

V2 turns AI-readiness into a prompt and action system.

Techniques include:

- ReAct
- RAG
- prompt chaining
- reflexion
- self-critique loop
- tree of thoughts
- decomposition scaffold
- generate knowledge
- output contract
- self-consistency
- persona injection
- few-shot anchor

These techniques are assigned according to automation level and skill type.

V3 should keep this discipline.

Prompts should not be generic.

They should be attached to a skill, a role, an AI-impact level, and a real task.

### 9.1.4 V2 Comparisons

V2 comparison helps users compare up to three roles.

It looks for:

- transferable strengths shared across all roles
- pairwise shared skills
- Human-Led skills
- role-unique skills
- skills that exist only in other roles
- development gaps
- AI exposure differences
- reflective summary

The V3 lesson is that comparison is not only ranking.

Comparison is a way to see:

- what travels with the person
- what is role-specific
- what AI changes
- what must be developed
- what decision the user should reflect on

### 9.1.5 V2 Outcomes

V2 outcomes are practical and human-facing.

A user should leave with:

- a role skill map
- AI-readiness by skill
- promptable work opportunities
- Human-Led edge
- progression paths
- crossover paths
- foundation skills where persona applies
- comparison insight
- next action

V3 should inherit this outcome discipline.

Every deeper organisation, BPR, or agentic layer should still return to the user's decision.

### 9.1.6 Workflow

The Workflow layer adapts the attached "10 Questions about the Role" method.

It is a human role-reading ritual.

It should sit before, during, and after the AI analysis.

The purpose is to make the user own the role, not merely consume a generated result.



# ========================================================================================================================================== #
## 10. User Interface / User Experience


### 10.1 WikiGraph

WikiGraph treats the role as an ecosystem.

It supports both:

- candidate lens
- organisation lens

Both should read from the same evidence, but answer different questions.

### 10.2 RIN

RIN is the reinvention navigation system.

It keeps the UI understandable through:

- Context
- Map
- Decision

This maps to the visible three-panel shell:

- Ask
- Map
- Decide

### 10.3 Agent Panel

Agent Panel is the 11-seat stakeholder review.

It is used to pressure-test:

- candidate-role match
- job description distortion
- market demand
- organisation logic
- platform incentive
- fairness and ATS risk

### 10.4 Governance Ledger

Governance Ledger is the agentic AI control plane.

It belongs primarily in Decide.

It should prevent ownerless or unscoped autonomous recommendations.

### 10.5 BPR Loop

BPR Loop reads:

- AS-IS process
- friction
- TO-BE process
- role redesign
- agent candidate
- governance requirement

### 10.6 Techniques Library

### 10.6.1 RoleGraph

RoleGraph shows:

- role
- duties
- skills
- occupation
- AI exposure
- progression
- crossover

### 10.6.2 OrgGraph

OrgGraph should show common duty, capability, and process clusters across employer postings.

It is the organisation perspective.

### 10.6.3 Demand-Proof

Demand-proof should use:

- live posting count
- recency
- salary spread
- experience spread
- source quality
- withhold floor

Thin demand should not become confident advice.

### 10.6.4 Fairness Scan

Fairness scan should check:

- exclusionary language
- age-coded signals
- graduate-year pressure
- credential inflation
- unrealistic seniority bundle

It should not overclaim legal conclusions.

### 10.6.5 Job Drawer

The job drawer should preserve verbatim evidence.

It should be:

- floating
- movable where useful
- close to the analysis
- easy to reopen

The drawer protects the user from losing the source text.

### 10.6.6 Debug Trace

Debug trace should support:

- `/dmm=1`
- `/dmm=panel`
- `?debug=logs` where supported

It should explain what happened without changing the user result.

### 10.7 Skill Panel Segmentation

The skill panel is a structured evidence review.

It is not a group of fictional personas.

Each seat exists because it represents a real incentive or evidence boundary.

### 10.8 Candidate Side

Seats:

- jobseeker
- academic
- ATS
- recruiter

Purpose:

- protect the candidate from weak advice
- identify proof artifacts
- expose keyword gaps without reducing the person to keywords
- distinguish learning value from employability signal

### 10.9 Employer Side

Seats:

- hiring manager
- HR
- director
- client

Purpose:

- reveal the organisational reason for hiring
- detect JD distortion
- connect role to budget, risk, delivery, and customer value
- identify whether the vacancy is a bridge, firewall, patch, or redesign signal

### 10.10 Platform Side

Seats:

- platform CEO
- platform engineer

Purpose:

- examine marketplace incentives
- test ranking and matching logic
- detect whether the platform amplifies distortion
- separate real market demand from visible posting volume

### 10.11 Reality-Check Side

Seat:

- skeptic

Purpose:

- falsify demand
- challenge upskilling narratives
- protect the worker from wasted effort
- ask who profits from the advice
- require live evidence before recommending spend

### 10.12 Synthesis Layer

Seat:

- careerview-panel

Purpose:

- combine stakeholder views
- identify distortion chain
- separate candidate-side and employer-side truth
- produce verdict and actions
- mark unsupported claims


### 10.13 UI Shape

Organisation mode should keep the three-panel shell.

Ask:

- company name
- confirmed employer
- source state
- ambiguity state

Map:

- organisation graph
- posting clusters
- function lanes
- reusable capability clusters
- selected job drawer

Decide:

- apply to selected posting
- compare postings
- prepare evidence
- redesign process hypothesis
- build agent candidate
- withhold

The centre Map should get the most space.

Left should work as floating navigation or drawer.

Right should collapse into a decision rail.



# ========================================================================================================================================== #


## 11 User Personas

V3 must support more than one type of user.

### 11.1 Candidate

The candidate wants to know:

- whether to apply
- what evidence to prepare
- what role really demands
- whether AI changes the work

### 11.2 Career Switcher

The switcher needs:

- transferable skills
- adjacent roles
- proof path
- realistic demand check
- no false hope

### 11.3 Senior Worker

The senior worker needs:

- dignity
- role translation
- hidden value recognition
- pathway into stewardship
- protection from shallow "just reskill" advice

### 11.4 Recruiter

The recruiter needs:

- cleaner role understanding
- candidate evidence
- keyword gap without keyword worship
- live market comparison

### 11.5 Hiring Manager

The hiring manager needs:

- role clarity
- decision rights
- real capability gap
- whether the JD is asking for one role or several

### 11.6 HR And Organisation Designer

HR and organisation design need:

- role architecture
- common capabilities
- fairness risk
- process redesign signal
- governance boundary

### 11.7 BPR Practitioner

The BPR user needs:

- AS-IS process signal
- friction map
- TO-BE redesign route
- agent candidate boundary
- governance ledger

### 11.8 Policy Or Regulator

The policy user needs:

- labour market distortion signals
- automation risk
- pro-worker AI category
- transparency and accountability evidence



# ========================================================================================================================================== #

## 13. Product Panel Mapping

### 13.1 Ask

Ask should collect the user's intent and the live market query.

It should avoid pretending that a title alone defines the role.

### 13.2 Map

Map should be the centre of V3.

It should contain:

- RoleGraph
- Organisation WikiGraph
- job evidence drawer
- collapsible side panels
- movable analysis windows where useful

Map should help users see role, organisation, and system relationships at once.

### 13.3 Decide

Decide should make the human owner explicit.

It should support decisions such as:

- apply
- compare
- prepare
- redesign
- reject weak target
- escalate for human review

It should not execute autonomous actions without owner, risk, scope, and audit trail.

### 13.4 Understand

Understand explains what the role means.

It should include:

- work meaning
- role mix
- system signal
- hidden boundary
- possible organisational wound

### 13.5 Position

Position compares the role against live demand.

It should rank:

- exact title matches
- responsibility matches
- segment matches
- adjacent roles
- secondary transformation signals

### 13.6 Become

Become should move beyond courses.

It should show how the user becomes a better steward:

- evidence building
- judgement building
- system understanding
- agent collaboration
- proof artifacts

### 13.7 AI Readiness

AI Readiness should not mean AI replacement score only.

It should classify:

- human-led work
- AI-assisted work
- automatable work
- expertise-leveling work
- new-task creating opportunity

It should also show the AIOE backbone where available:

- primary language-model exposure
- aggregate baseline exposure
- generative-era delta
- image-generation exposure where relevant
- crosswalk confidence
- withhold reason if unavailable

The user-facing message should be:

> This is an exposure signal, not a verdict on your value.

High AIOE should trigger deeper role reading, not fatalism.

Low AIOE should not imply safety if the live job duties show workflow change.

### 13.8 Arm

Arm should prepare the user for action.

It should provide:

- interview evidence
- portfolio evidence
- question prompts
- comparison strategy
- agent-use strategy
- governance questions to ask the employer

# ========================================================================================================================================== #


## 14. Role Graph And Organisation Graph

### 14.1 Role Graph

RoleGraph dissects the advertised role.

It should show:

- title
- duties
- skills
- responsibilities
- adjacent roles
- career progression
- crossover paths
- evidence source
- AI impact type
- AIOE layer and confidence where available

### 14.2 Organisation WikiGraph

Organisation WikiGraph should look beyond the role.

It should map:

- business function
- upstream dependency
- downstream dependency
- governance boundary
- customer value
- process friction
- common capabilities across roles
- exposure pattern across repeated SSOC or role clusters

### 14.3 Commonising Roles

From the organisation perspective, V3 should ask:

- Which tasks repeat across roles?
- Which capabilities can be shared?
- Which role bundles are artificial?
- Which roles exist only because process ownership is unclear?
- Which skills are reusable across departments?

This is where BPR belongs.

AIOE should support organisation reading by showing whether repeated hiring patterns cluster around:

- high language-model exposure
- high image-generation exposure
- high baseline exposure
- large positive generative-era delta
- missing or weak crosswalk confidence

This helps distinguish:

- a role-level AI-readiness issue
- an organisation capability redesign issue
- a governance issue
- a weak-data issue that must be withheld

# ========================================================================================================================================== #


## 15. Organisation Perspective: Company Query

When the user types an organisation name such as "DBS", V3 should switch from role perspective to organisation perspective.

The input should be read as:

> Show me what this organisation is trying to build, hire for, govern, automate, and redesign.

This is not the same as typing a job title.

### 15.1 Methodology

Organisation query methodology:

- resolve the employer name deterministically
- list live postings from the confirmed employer
- cluster repeated duties and capabilities
- map functions, teams, and work systems
- identify recurring bottlenecks
- infer possible transformation themes only from evidence
- ask whether the organisation is hiring for roles, processes, or governance gaps
- withhold when the posting sample is thin

The organisation read should use:

- Vacancy Teleology
- BDF
- Rumelt strategy kernel
- Flow lens
- BPR loop
- Falsification
- Pro-Worker AI test

### 15.2 Deterministic Ideals

For a company query, deterministic code must own:

- company-name normalisation
- employer disambiguation
- posting count
- posting list
- grouping by employer key
- grouping by title
- grouping by repeated duty
- grouping by capability phrase
- source labels
- withhold floor

The LLM may explain patterns.

The LLM must not invent:

- number of jobs
- company structure
- business strategy
- hiring intent
- department map
- transformation programme

If DBS has no live MCF posting match, V3 should say that.

It should not fabricate an organisation profile.

### 15.3 Ethos And Values

Curiosity:

- ask what the organisation is becoming, not only what it is hiring.

Collaborativeness:

- show how humans, teams, and agents may share work.

Customer focus:

- connect postings back to customer, operational, or governance value.

First principles:

- ask why the work exists before recommending roles or tools.

Domain breadth:

- connect technology, risk, operations, compliance, service, data, and product work where evidence supports it.

Systemic thinking:

- map repeated hiring signals as an organisation system, not isolated vacancies.

Judgment:

- block conclusions when the sample is too small or ambiguous.

### 15.4 Strategy

For "DBS" as organisation input, V3 should:

- preserve the clear job-card list
- expand into organisation map
- commonise repeated capabilities across postings
- question whether roles are mashed up
- segment postings by function and duty
- criticise weak or distorted evidence
- protect the user from treating employer brand as proof of fit

The user should be able to decide:

- which DBS role to analyse
- which function looks active
- which repeated capability is worth building
- which role appears unrealistic
- whether the organisation signal is strong enough
- whether BPR or agent design is a better lens

### 15.5 Techniques

Company query techniques:

- Company Resolver: normalise and disambiguate employer names.
- Employer Posting List: show verbatim live postings.
- OrgGraph: cluster repeated duties and capabilities.
- Function Strip: group by business function where evidence supports it.
- Duty Cluster: find recurring responsibilities.
- Capability Cluster: find repeated skill or system needs.
- Demand-Proof: distinguish visible posting volume from real opportunity.
- Fairness Scan: check wording risk without legal overclaim.
- O-I-A: read responsibilities for outcome, interaction, and agency.
- BPR Map: detect AS-IS friction and TO-BE redesign hypotheses.
- Governance Ledger: record owner, risk, scope, and allowed action.

### 15.6 Framework

The organisation-query framework should be:

### 15.6.1. Resolve

Confirm the employer name and live postings.

### 15.6.2. Segment

Split postings by title, function, duty, capability, and source.

### 15.6.3. Commonise

Find repeated work across roles.

### 15.6.4. Diagnose

Use BDF, Rumelt, and Flow to infer the system pressure.

### 15.6.5. Redesign

Use BPR to ask whether a role, process, shared capability, or agent candidate is needed.

### 15.6.6. Govern

Use the governance ledger before suggesting any agentic action.

### 15.6.7. Decide

Help the human choose apply, compare, prepare, redesign, or withhold.


