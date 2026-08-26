# V3 UI Blueprint: Review Studio And Visual Workspace

Status: companion UI blueprint
Date: 2026-06-27
Scope: V3 only
Parent blueprint: `v3/goal/v3-blueprint.md`

## 0. Change Note

The main blueprint file was already amended earlier on 2026-06-27, before this companion UI file was created.

Those prior amendments added or expanded the occupation-sensitive visual grammar, InfraNodus-versus-other-graphs distinction, professional skilling pathway, right visual intelligence, and generative UI treatment.

This file must now become the working UI contract. Do not amend `v3/goal/v3-blueprint.md` again unless explicitly approved. Future UI changes should be recorded here first, using ADD / CHANGE / DELETE language.

## 1. UI Doctrine Foundation

Doctrine source: `UI Doctrine (standalone).html`

The UI Doctrine is the foundation of this blueprint. It is not a theme file and not a decoration guide. It is the visual, interaction, accessibility, and language law for V3.

All V3 screens must inherit these doctrine rules before applying role-specific, organisation-specific, or generative UI behaviour.

### 1.1 Foundations: Grounds, Ink, And Accent

V3 uses two interchangeable grounds:

- light paper
- instrument-black

Both grounds share one text ramp and one brand accent.

Required colour logic:

- Ground light: `#e9edf3`
- Surface light: `#fbfaf8` / `#fff`
- Ground dark: `#0b0e14`
- Glass dark: `#fff @ 6%`
- Brand accent: `#1a56db`
- Ink: `#16202e` for titles
- Body: `#3a4456` for prose
- Sub: `#64748b` for secondary text
- Label: `#8a8274` for mono caps and metadata

Colour must do work. It should encode meaning, state, provenance, or exposure. It must not become background decoration.

### 1.2 Exposure Spectrum: Four Fixed Bands

Every skill, duty, process, role claim, and AI-readiness statement resolves to one of four exposure bands.

The order is fixed and must never be reordered:

1. Human-led
2. AI-assisted
3. AI-augmented
4. Full automation

Band meanings:

- Human-led: judgment, relationships, accountability; AI cannot own it.
- AI-assisted: AI performs sub-tasks; the person stays lead and makes the call.
- AI-augmented: AI accelerates the person; the person verifies and frames.
- Full automation: end-to-end machine work; handoff is possible only when governance permits it.

Reserved band colours:

- Human-led: `#1d4ed8` light / `#7ea2ff` dark
- AI-assisted: `#0e7490` light / `#5fdcf5` dark
- AI-augmented: `#b45309` light / `#fbbf24` dark
- Full automation: `#c2410c` light / `#f59e5b` dark

These colours appear only to encode exposure band. They are not decorative accents.

### 1.3 Typography: Three Voices, Strict Roles

The interface has three typographic voices:

- Newsreader: display, titles, role names, organisation names, named entities.
- Spline Sans: body, UI controls, descriptions, review comments.
- Spline Sans Mono: data, provenance, labels, evidence tags, blueprint trace, compact metadata.

The type system should make the product feel like a designed instrument. It should help the user distinguish narrative, action, and evidence at a glance.

Baseline sizes:

- `2.1-2.7rem`: display
- `1.5rem`: section heading
- `1.0625rem`: lead text
- `0.9375rem`: body
- `0.8125rem`: UI value
- `0.75rem`: supporting text
- `0.6875rem`: key label
- `0.625rem`: eyebrow and compact metadata

### 1.4 Components: Search, Provenance, Cards, Switchers

The doctrine defines recurring parts that V3 should reuse across role, organisation, and candidate-edge surfaces.

Required components:

- Search hero: one primary field plus one primary action.
- Provenance chips: every figure, claim, score, generated statement, graph node, and reviewer note carries its evidence origin.
- Result card: one evidence object, many lenses.
- View switcher: graph, organisation, workflow, value stream, and other approved views.

Provenance chip vocabulary:

- `from posting`: direct source text or posting fact.
- `computed`: deterministic calculation.
- `derived`: deterministic interpretation from source and rules.
- `AI estimate`: model-assisted judgment, may vary.
- `unverified`: shown only when the system is explicitly uncertain.

### 1.5 Visualisation Doctrine: Use The Right Visual For The Question

Same data can be framed in different ways. Each visual answers a different question and must not do another visual's job.

Core doctrine visuals:

- Graph: relationships and clusters; use when asking "what shape is this role?"
- Org: ownership and structure; use when asking "what reports up to what?"
- Workflow: order and decisions; use when asking "who acts when, and in what sequence?"
- Value stream: time, waste, handoff, and AI leverage; use when asking "where does time go, and where does AI actually help?"

All visualisations inherit the fixed Human-led to Full-automation exposure order.

### 1.6 Accessibility And Motion

Accessibility is non-negotiable.

Rules:

- Text contrast: at least 4.5:1.
- Large text and UI contrast: at least 3:1.
- Accent text must be verified against the tint behind it, not only against the page.
- Colour-blind safety: meaning is always doubled with icon and label.
- Target size: every interactive element is at least `44 x 44px`.
- Keyboard: first tab stop is a skip link; every focusable element has a visible `2px` brand-blue focus ring.
- Motion: transitions stay under `250ms`; nothing essential depends on animation; `prefers-reduced-motion` is honoured.

### 1.7 Voice: AI-Assisted; Human Decides

V3 speaks plainly, calmly, and from the user's side of the screen.

Standing voice rule:

`AI-assisted; human decides.`

If a sentence could read as a verdict on someone's career, rewrite it as information for their choice.

This voice rule governs reviewer comments, advisory output, cover letters, generated UI explanations, graph captions, risk warnings, and governance messages.

## 2. UI Thesis

V3 is not a job-ad reader. It is a review studio for turning job evidence into candidate advantage, organisation understanding, and accountable action.

The interface should feel like a professional manuscript review system, a strategy workbench, and a graph intelligence desk in one coherent workspace.

The centre of gravity is always evidence. The user should be able to point to a phrase, paragraph, graph node, reviewer note, generated output, or recommendation and ask:

- Where did this come from?
- Which lens produced it?
- Which human owns the decision?
- What can I do with it?
- What should I reject or hold back?

## 3. One Workspace, Three Starting Lenses

V3 should begin with three plain-language choices:

1. Review a role
2. Read an organisation
3. Plan my edge

These are not three separate products. They are three starting lenses inside one workspace.

### 3.1 Review A Role

Primary object: a job advertisement as a working manuscript.

The user reviews role title, responsibilities, requirements, AI exposure, mixed-role signals, organisational dependencies, and hiring filters.

The output is not only "should I apply". It should produce candidate proof tasks, resume alignment, cover letter rationale, interview questions, and risks to challenge.

### 3.2 Read An Organisation

Primary object: an organisation as a capability system.

The user reads repeated job postings, functions, teams, workflow signals, capability gaps, process redesign opportunities, and role mash-ups.

The output should show what the organisation is trying to become, where it is overloading roles, and what kind of person would gain leverage inside it.

### 3.3 Plan My Edge

Primary object: the candidate's evidence, skill gaps, positioning, and next moves.

The user maps current proof against the role and organisation, then creates a strategy for application, interview, portfolio, training, or rejection.

The output should be a practical edge package: proof map, cover letter, resume claims, interview answers, missing evidence, and learning path.

## 4. Workspace Shell

The default shell should preserve the V3 three-zone thinking, but the old "three panels" should evolve into a flexible workspace.

### 4.1 Header

The header must be compact and stable.

It should show:

- product identity
- current lens
- current source
- evidence freshness
- login / owner state
- save state

It should not explain the whole product. The working surface should do that through direct interaction.

### 4.2 Ribbon

The ribbon should remain, because users need named affordances. But it must not become insider jargon.

Each ribbon group should have a plain title and professional command labels.

The ribbon inherits the UI Doctrine: controls use Spline Sans, compact metadata uses Spline Sans Mono, and exposure colours appear only where the control is explicitly showing Human-led, AI-assisted, AI-augmented, or Full automation state.

Ribbon groups:

- Review: clean view, suggestions, comments, accept, reject, ask why
- Ingress: source, organisation, role, question set, evidence labels
- Visuals: concept map, organisation map, workflow map, trace map, portfolio map
- Evidence: observed, interpreted, applied, withheld, provenance
- Skilling: ESCO, capability gap, certification, academic path, proof task
- Recruitment: ATS filter, hiring manager question, resume claim, interview scenario
- Governance: agent identity, owner, risk, audit, escalation
- Output: cover letter, resume notes, interview pack, PDF, print, save

The ribbon should be visible enough to orient the user, but compact enough not to steal the canvas.

### 4.3 Left Rail And Drawers

The left side should be a narrow rail of working tools.

Required tools:

- Source file drawer
- Blueprint trace drawer
- Skillset / recipe drawer
- Advisory panel button
- Cover letter button
- Boards / storyboard button
- Saved outputs

The rail should open drawers that can dock, collapse, or float. On mobile, drawers become full-height overlays.

### 4.4 Centre Evidence Canvas

The centre canvas is the main working object.

The centre canvas is where the doctrine becomes visible: manuscript text uses the strict type roles, provenance chips are attached to claims, and exposure bands are shown with reserved colours only when the work itself is being classified.

For role review, it should resemble a manuscript review page:

- title
- source badge
- sections
- highlighted phrases
- tracked insertions
- tracked deletions
- comments
- claims
- evidence chain

For organisation review, it should become an organisation dossier:

- observed job families
- repeated capabilities
- function boundaries
- workflow dependencies
- role mash-up warnings
- capability gaps

For candidate edge, it should become a personal strategy canvas:

- target role
- strongest evidence
- missing evidence
- transferable skills
- resume claims
- interview stories
- learning path

The centre object should be movable. If a graph or advisory view needs centre focus, the job ad can dock left or float as a window.

### 4.5 Right Visual Intelligence Stack

The right side should hold visual intelligence, not generic cards.

It should be collapsible, expandable, and floatable.

Every visual must answer a distinct question. Do not use the same force graph for everything. The first choice should be the doctrine's four visual questions: Graph, Org, Workflow, or Value stream.

Visual types:

- Content concept map: text themes, clusters, bridges, gaps, InfraNodus-style
- Organisation map: functions, teams, ownership, reporting and collaboration paths
- Workflow map: process flow, handoffs, queues, dependencies, bottlenecks
- AI trace map: observe, interpret, apply, review, withhold
- Role graph: adjacent roles, career progression, commonised skill families
- Hiring funnel: filters, ATS risks, evidence thresholds, recruiter/hiring manager split
- Portfolio proof map: candidate evidence, gaps, stories, artifacts
- Site / season / safety map: for field, care, operational, craft, and physical work
- Creative range board: for art, acting, writing, design, performance, and portfolio work
- Control map: accountability, risk owner, escalation, audit trail

Every visual must show provenance and, where relevant, exposure band. A graph node without provenance is decorative and should be withheld.

### 4.6 Advisory Panel

The advisory panel should exist.

It should not be a generic chatbot. It should be an evidence-bound review partner.

It should help the user decide:

- what this role is really asking for
- where the job ad mixes multiple roles
- what the organisation signal might be
- what proof the candidate should show
- what to ask in interview
- what claims to avoid
- what output can be produced safely

The advisory panel should cite the manuscript line, graph node, reviewer comment, or source file section that triggered each recommendation.

The advisory panel must use the doctrine voice: plain, calm, user-side, and never a verdict on the user's career.

### 4.7 Cover Letter Window

The cover letter should be a left-rail button that opens a floating window.

The window should include:

- generated cover letter draft
- evidence explanation
- source phrases used
- reviewer comments used
- accepted / rejected suggestions
- PDF
- print
- save
- copy

The cover letter is not a magical output. It is a traceable result of the review process.

It must explain why it says what it says.

Its explanation must show provenance chips for source phrases, computed claims, derived claims, AI estimates, and unverified items.

### 4.8 Footer

The footer should be tiny and practical.

It should show:

- current file / source
- save location
- memory status
- local or cloud persistence
- version
- last save
- login owner

It should not take working space from the canvas.

The footer should carry the standing doctrine sentence where space permits: `AI-assisted; human decides.`

## 5. Review System

V3 should borrow the discipline of Microsoft Word's professional review workflow, but adapt it for job intelligence.

### 5.1 Review Objects

Review objects:

- phrase
- sentence
- paragraph
- section
- requirement
- responsibility
- title
- organisation name
- role family
- skill
- AI exposure signal
- hidden process signal
- hiring filter
- reviewer comment
- generated rewrite
- graph node
- graph edge

### 5.2 Suggested Rewrites

Track Changes-style suggested rewrites must be present from day one.

Types:

- insert
- delete
- replace
- split
- merge
- map
- caution
- proof required
- hold back

Each suggestion needs:

- reviewer persona
- reason
- evidence source
- provenance chip
- exposure band when the suggestion concerns AI exposure
- confidence
- accept action
- reject action
- ask why action
- human owner

### 5.3 Reviewer Personas

The persona reviewers should appear as named review voices, not hidden agents.

Core reviewers:

- Role Analyst
- Organisation Designer
- Process Redesign Reviewer
- Hiring Manager
- Hiring Filter Reviewer
- Candidate Advocate
- AI Exposure Reviewer
- Evidence Auditor
- Skilling Pathway Reviewer
- Governance Reviewer

The user should be able to see where reviewers disagree.

Reviewer comments should follow the doctrine voice. They should help the person decide, not pronounce judgment.

## 6. Graph And Visual Rules

Graphs must be chosen by the nature of the work, not by developer preference.

The doctrine's first visual decision is: what question is the user asking?

- Graph: relationships and clusters.
- Org: ownership and structure.
- Workflow: order and decisions.
- Value stream: time, waste, handoff, and AI leverage.

### 6.1 InfraNodus-Style Concept Map

Use when the object is text, concepts, themes, co-occurrences, discourse gaps, or bridging ideas.

Good for:

- job-ad language
- role themes
- repeated employer phrasing
- resume / cover letter language
- skill clusters
- hidden gaps

Do not use as the default for organisation structure, workflow, safety, site work, or portfolio assessment.

### 6.2 Organisation Map

Use for organisation perspective.

It should show functions, reporting boundaries, role dependencies, process ownership, and where the job ad implies unresolved organisational design.

### 6.3 Workflow Map

Use when the job is about movement of work:

- operations
- engineering delivery
- service delivery
- compliance
- customer journey
- data pipeline
- process redesign

### 6.4 Value Stream Map

Use when the job or organisation signal is about time, waste, queues, waiting, rework, customer delay, delivery friction, or where AI might actually reduce non-value-added work.

Value stream maps should make BPR visible from the organisation perspective. They answer: where does time go, where is waste, who owns the handoff, and what should not be automated?

### 6.5 Occupation-Sensitive Visual Grammar

Different work needs different visual explanation.

Examples:

- Marketing: campaign funnel, audience journey, channel mix, brand claims, content graph
- Actor / artist: portfolio board, range map, audition pipeline, creative network, reputation evidence
- Gardener / horticulture: site map, season calendar, safety map, tool and care rhythm
- Engineer: system architecture, dependency graph, reliability risk map, incident trace
- Data role: pipeline map, lineage, governance chain, decision ownership
- HR / organisation role: operating model, capability map, stakeholder map, change journey
- Finance / risk role: control map, obligation map, exception flow, audit trail
- Teacher / trainer: learner journey, curriculum map, assessment evidence, intervention map

The visual grammar should be generated by role nature, ESCO mapping, source text, and user-selected lens.

## 7. Generative UI Contract

Generative UI does not mean random screens.

It means the system chooses the right governed workspace components for the current evidence object.

Generated UI must be:

- explainable
- reversible
- evidence-bound
- human-controlled
- auditable
- printable

When the system creates or changes a panel, it must explain:

- why this panel appeared
- what evidence triggered it
- which blueprint section governs it
- what the user can do with it
- how to dismiss or restore it

Generated UI must also declare which doctrine rule it is applying: foundation colour, exposure band, typography voice, provenance chip, visual question, accessibility requirement, or voice rule.

## 8. Blueprint Trace

Every significant UI component should carry a trace to this blueprint or the parent blueprint.

Hover or tap should reveal:

- section
- paragraph / segment
- doctrine rule
- build status
- source file
- current implementation state
- missing functionality

Build status labels:

- done
- partial
- planned
- withheld
- rejected

This is how the user can inspect whether the product is real, simulated, or aspirational.

## 9. Candidate Edge Standard

V3 should go beyond dissecting job ads.

It should help candidates gain an ethical edge by showing:

- what the organisation is actually trying to solve
- what capability gap the role reveals
- what evidence the candidate should bring
- what language is safe to reuse
- what language is risky or empty
- what interview questions expose the work system
- what portfolio proof would change the hiring conversation
- what skilling route is worth the time

The product must not help the user deceive ATS or hiring teams.

It can help the user beat shallow filtering by creating better evidence, clearer claims, and stronger alignment with real organisational needs.

Candidate-edge outputs must preserve the doctrine voice: support the user's decision without pretending to know their future.

## 10. Mobile And iPad Behaviour

On iPhone:

- ribbon becomes horizontally scrollable or grouped into compact command tabs
- right visual stack collapses by default
- left rail stays as icons
- centre manuscript remains primary
- comments and advisory open as sheets
- graph panels can expand to full screen

On iPad mini:

- centre canvas remains primary
- left drawer can dock temporarily
- right panel can split or float
- graphs can expand over the canvas
- job ad can dock left when a graph becomes centre focus

On desktop:

- full ribbon
- left rail
- centre canvas
- right visual stack
- floating windows
- print / PDF view

Across all breakpoints, colour meaning, provenance chips, target size, keyboard focus, and reduced-motion rules remain mandatory.

## 11. MVP Surface Map

Current interactive MVP files:

- `v3/public/review-studio-mvp.html`: first review studio sketch with manuscript, comments, and graph modes
- `v3/public/review-studio-visual-workspace.html`: occupation-sensitive visual workspace with ribbon, expandable maps, and floating windows
- `v3/public/review-studio-blueprint-trace.html`: blueprint-traced MVP with start lenses, advisory panel, cover letter window, ribbon, and component inspector

These are prototypes. They demonstrate direction, not final production completeness.

## 12. Implementation Phases

### Phase 1: Review Manuscript

Build the centre job-ad manuscript, highlighted spans, comments, suggested rewrites, accept / reject, and reviewer personas.

Definition of done:

- every phrase highlight has a source
- every comment has a reviewer
- every rewrite has accept / reject
- every claim can show evidence
- every claim has a provenance chip
- every AI-exposure claim has an exposure band

### Phase 2: Visual Intelligence

Build the right-side graph and visual stack with role-sensitive visual selection.

Definition of done:

- graph type changes by role nature
- content maps are not used for everything
- every node and edge links back to source evidence
- visuals can expand, collapse, dock, and float
- every visual declares its doctrine question: Graph, Org, Workflow, or Value stream

### Phase 3: Organisation Lens

Build organisation perspective as a first-class workspace mode.

Definition of done:

- organisation map exists
- value stream view exists where process redesign is implied
- repeated capability signals are grouped
- role mash-ups are detected
- BPR opportunities are visible
- role families can be commonised across postings

### Phase 4: Candidate Edge

Build the output layer.

Definition of done:

- cover letter is traceable
- resume notes cite evidence
- interview questions map to business outcomes
- proof tasks are actionable
- skilling pathway is role-sensitive
- generated language follows `AI-assisted; human decides`

### Phase 5: Governance

Build agent identity, human accountability, and risk controls into the UI.

Definition of done:

- every autonomous suggestion has an owner
- every generated output has provenance
- withheld claims are visible
- multi-agent disagreement is shown
- audit trail is printable
- accessibility and doctrine compliance are auditable

## 13. Change Protocol

Use this file as the UI planning contract.

Future changes should be written as:

- ADD: a new UI component or behaviour
- CHANGE: an existing UI component or behaviour
- DELETE: remove a component or behaviour
- HOLD: keep the idea but do not build yet

Before implementation, each proposed change should answer:

- Which user problem does this solve?
- Which evidence object does it touch?
- Which blueprint section governs it?
- Is it role, organisation, or candidate-edge work?
- Is it deterministic, AI-assisted, or human-decided?
- Which UI Doctrine rule does it apply?
- How does the user reverse it?

## 14. Current Decision

The next UI direction should be:

1. Treat the UI Doctrine as the foundation layer for every V3 surface.
2. Keep one workspace, not separate products.
3. Keep the ribbon, but make it plain-language and compact.
4. Keep the job ad as manuscript in the centre by default.
5. Add advisory and cover letter as left-rail floating windows.
6. Let graphs expand, dock, or float.
7. Use InfraNodus-style maps only for concept/text intelligence.
8. Use organisation maps, workflow maps, value stream maps, and role-specific visuals where they fit better.
9. Make every UI component traceable to blueprint sections and doctrine rules.
10. Make the output layer explain itself before allowing PDF, print, save, or copy.
