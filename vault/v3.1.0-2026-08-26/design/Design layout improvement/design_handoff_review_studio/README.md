# Handoff: Review Studio (Step 3) — redesigned document + engine workspace

## Overview
This redesigns **Step 3 — Review Studio**, the reviewable-manuscript workspace in SG Career View v3
(`v3/src/ReviewStudio.jsx`). The job ad moves to a fixed left-hand document pane (Word-like), and the
engine surfaces (AI-Exposure Index, Job Anatomy, Mirror Roles, Coherence Check, Role Graph, O-I-A,
Reviewer Comments) become a TradingView-style panel workspace on the right: each panel's content type
is swappable via a dropdown, panels can be docked in a grid or popped into freely-draggable floating
windows, and a live curved connector line (SVG, computed from real DOM measurements) links the
highlighted duty text in the document to whichever panel currently shows its reviewer comment — wherever
that panel currently is, docked or floating.

## About the design files
The files in this bundle (`Review Studio.dc.html`, `EnginePanelBody.dc.html`) are **HTML design
references** built in a prototyping tool (streaming "Design Components" — custom `<sc-for>`/`<sc-if>`
template tags, not real React/JSX). They are not code to copy in. The task is to **recreate this design
in the real v3 codebase** — React 18 + Vite, inside `v3/src/ReviewStudio.jsx` (and new sibling
components if you choose to split it up) — using the project's existing patterns, and wired to the
**real** deterministic engine instead of the mock data used in the prototype.

Open `Review Studio.dc.html` directly in a browser to see it live and click through the interactions
before implementing.

## Fidelity
**High-fidelity.** Colors, type, spacing and interaction behavior below are final — implement pixel-close,
not "inspired by."

## Which direction to build
The bundle contains three explored directions (anchors `#1a`, `#1b`, `#2a` inside the HTML file). Build
**`2a`** — it is the agreed combination: TradingView-style panel workspace (from `1b`) plus the Word-style
live connector line (from `1a`). `1a` and `1b` are kept in the file only as reference for their individual
mechanics; do not build them as separate screens.

## Screen: Review Studio — combined workspace (`#2a`)

### Layout
Full-bleed app screen, flex column:
1. **Top bar** — 52px, background `#14204f`, white text. Left: 26×26px amber (`#f5a623`) square badge
   (6px radius) with bold monospace "AI"; product name 13.5px/700; a small pill badge
   `rgba(255,255,255,0.14)` reading the current mode. Right: white "New search" button (6px radius,
   12px/700 navy text), then "AI-assisted · human decides" in `rgba(255,255,255,0.7)`.
2. **Sub-header** — 54px, white, bottom border `rgba(20,32,79,0.1)`. "← Postings" link, vertical divider,
   then a stacked eyebrow ("REVIEWING", 9.5px/700 monospace, letter-spacing 0.04em, `rgba(20,32,79,0.5)`)
   + a green-dot "from MCF" provenance tag (`#1f8a5b`) + the posting title (15px/700, `#14204f`,
   ellipsis-truncated). Right-aligned: an amber "AI-augmented" status pill (bg `rgba(245,166,35,0.16)`,
   text `#a8660f`) and a comment-count summary string.
3. **Toolbar** — 42px, background `#f3f1ea`, bottom border. Left: a 3-way segmented control ("Read
   clean" / "Suggestions" / "Comments") — active segment is solid `#14204f` fill + white text, inactive is
   transparent + `rgba(20,32,79,0.6)` text; segments are 11.5px/600, 6×12px padding, 5px radius, inside a
   `#e7e4da` track (7px radius, 3px padding). Then a workspace panel-count label ("WORKSPACE · n / 10
   panels", 10px/700 monospace). Right: a hint string, and a solid navy "+ Add panel" button.
4. **Main body** — flex row, fills remaining height, `position:relative` (this is the connector-line
   coordinate space):
   - **Document pane** — fixed 460px, scrollable, padding 22px, background `#e9e7e0`; inside it a white
     card (8px radius, subtle shadow, 36×40px padding) holding the manuscript.
   - **Workspace** — flex:1, scrollable, background `#dedbd0`, padding 18px, `position:relative`
     (floating-panel coordinate space). Contains a 2-column CSS grid (14px gap) of **docked** panels, and
     floating panels rendered as `position:absolute` siblings on top.
   - **Connector overlay** — one `<svg>` absolutely covering the whole main body,
     `pointer-events:none`, high z-index, holding a single cubic-bezier `<path>` (`stroke:#f5a623`,
     width 2.2) plus a small dot at the document-side endpoint. Only rendered while a comment is "active."

### Document pane (manuscript)
- Serif for all manuscript copy: `'Source Serif 4', Georgia, serif` (Google Font, weights 400/600/700).
- Eyebrow "MANUSCRIPT · {EMPLOYER}": 10.5px/700 monospace, letter-spacing 0.06em, `rgba(20,32,79,0.45)`.
- H1 (posting title): 20px/700 serif, line-height 1.3, `#14204f`.
- Meta line (provenance / salary / type): 11.5px, `rgba(20,32,79,0.55)`, bottom border after it.
- H2 (section headers — "Role overview", "Responsibilities", "Requirements"): 14.5px/700 serif, `#14204f`.
- Body paragraphs / bullets: 14px serif, line-height 1.68, `#232338`. Bullets are a flex row with a 5px
  navy dot, not native `<li>` markers.
- **Highlighted duty spans**: any run of text tied to a classified duty gets a background tint from its
  exposure band — `HIGH` → `rgba(193,69,59,0.18)`, `MEDIUM` → `rgba(245,166,35,0.22)`, `LOW` →
  `rgba(31,138,91,0.16)` — plus a 2px dashed underline in the matching solid color
  (`#c1453b` / `#c9860f` / `#1f8a5b`). Hover or "active" state doubles the tint opacity and bolds the
  text (font-weight 700). In "Read clean" toolbar mode, all of this is suppressed (plain manuscript). If
  the run's linked reviewer comment is **rejected**, drop the underline and strike the text
  (`text-decoration:line-through`, `opacity:0.5`); if **accepted**, keep the tint but the affordance settles
  (no special treatment needed beyond removing "pending" emphasis).
- Hovering a duty span sets a "hovered duty" id in state (drives duty rows elsewhere to highlight in sync,
  see Anatomy panel). Clicking a duty span that has an attached comment sets it as the **active comment**
  and triggers the connector-line recompute.

### Workspace panels (docked + floating)
Each panel — whether docked in the grid or floating — shares one shell:
- Header, 36px: docked = `background: rgba(20,32,79,0.03)`; floating = `background:#f3f1ea` +
  `border-radius:8px 8px 0 0`. Contains a native `<select>` (11.5px/700, `#14204f`, borderless,
  transparent) listing the 7 panel types (see below) — changing it swaps the panel's content type in
  place. Then a "float/dock" toggle glyph (⤢ to float, ⤓ to re-dock) and a "×" close button, both
  `rgba(20,32,79,0.4)`. The whole header is `cursor:grab` and is the drag handle.
- Body: padding 12px, scrollable, `overflow-y:auto`.
- Docked panel container: white, 8px radius, 1px border `rgba(20,32,79,0.12)`, soft shadow, min-height
  260px / max-height 340px, sits in a `grid-template-columns: 1fr 1fr` grid with 14px gaps.
- Floating panel container: 340px wide, max-height 380px, same white/radius, but
  `box-shadow: 0 14px 34px rgba(20,32,79,0.28)` (heavier, "lifted") and `position:absolute` at its
  `x`/`y` state coordinates within the workspace pane, z-index bumped to front on grab.
- **Drag-to-reposition**: only floating panels are draggable. Mouse-down on the header captures the
  pointer offset from the panel's current x/y; a window-level mousemove updates x/y live (clamped ≥0);
  mouseup releases. Bring-to-front on drag start.
- **Dock/float toggle**: floating panels default to a cascading offset position the first time they're
  floated; re-docking drops them back into normal grid flow (position resets, order doesn't need to be
  preserved precisely).
- **Add panel**: "+ Add panel" appends a new docked panel defaulting to the first panel type not already
  in use (falls back to "AI-Exposure Index" if all 7 types are already present). Cap at 10 panels total
  (docked + floating combined) — this is a hint, not a hard product requirement, but keep the counter
  honest.
- **Close**: removes the panel from state entirely (no undo needed for this build).

### Panel content types (the `<select>` options)
1. **AI-Exposure Index** — big monospace number (32px/800, `#14204f`) + "/ 100 percentile"; an amber
   band pill ("AI-augmented · moderate" style, bg `rgba(245,166,35,0.18)`, text `#a8660f`); a one-line
   occupation label with z-mean/z-range; then a dashed-border box showing the crosswalk trace as four
   monospace lines with "→" prefixes: `SSOC → ISCO-08 → SOC 2010 → AIOE`.
2. **Job Anatomy** — a one-line "centre of gravity" sentence, then 5 rows (Activity / Coordination /
   Accountability / Relational / Judgment) each with a label, a right-aligned monospace percentage, and a
   6px rounded progress bar (`background:#14204f` fill on a `rgba(20,32,79,0.08)` track). Below that, two
   side-by-side stat tiles on `#f3f1ea` (8px radius): "RESILIENCE" (current score, navy) and "→ ~2027"
   (projected score, red `#c1453b`). Then a duty chip list — each duty as a small row with a colored dot
   (band color) and short label; hovering a chip sets the shared "hovered duty" id (syncing the
   highlight back in the document pane, and vice versa).
3. **Mirror Roles** — a list of adjacent/mirror occupations, each with title, right-aligned share %
   (monospace), a thin colored bar sized to the share, and a small "{band} exposure · z {value}" caption.
4. **Coherence Check** — a red "⚠ conflict" pill (bg `rgba(193,69,59,0.14)`, text `#c1453b`) when the
   SSOC-tag occupation and the skill-fingerprint occupation disagree, followed by one explanatory
   paragraph naming both labels in bold and stating that skill evidence wins on conflict per the trust
   loop, with confidence capped at medium. (When they agree, this panel type should instead show a calm
   green "agree" state — not built in the mock since the demo data is a conflict case; add it.)
5. **Role Graph** — a small hub-and-spoke SVG: a navy circle (26px radius) at center labeled with the
   role, thin colored lines to 3 duty nodes on the left (colored by exposure band) and thin gray lines to
   ~4 adjacent-role nodes on the right, each with a monospace label.
6. **Reviewer Comments** — the reviewer-persona comment stack (see below), rendered compactly.
7. **O-I-A Dissection** — a row of duty-selector chips (pill buttons, active = solid navy) above three
   labeled blocks: OBSERVATION (blue label `#2a6fd6`), INTERPRETATION (amber label `#a8660f`),
   APPLICATION (green label `#1f8a5b`), each a short paragraph. If no dissection has been authored for
   the selected duty, show an italic withheld message ("No O-I-A dissection authored yet for this duty —
   withheld rather than guessed") instead of fabricating one — this withhold-over-fabricate behavior is a
   product requirement, not a placeholder to remove.

### Reviewer comment cards
Each card: white (or `#fdf6ea` when "active"/hovered, with an amber border) background, 8px radius,
12px padding, 10px bottom margin; rejected cards drop to `opacity:0.55` and a flat `#f6f5f1` background.
Header row: a small colored dot (persona color) + persona name (12px/700 navy) + right-aligned monospace
provenance tag ("AI estimate" / "derived" / "merge duties"). Then the quoted manuscript span in italic
serif (12.5px, `rgba(20,32,79,0.75)`). Then the reviewer's note (12px, `#232338`, line-height 1.55). If
the comment includes a suggested rewrite, show a `#f3f1ea` monospace block with the old text struck
through in red (`#c1453b`) and the new text in green (`#1f8a5b`) prefixed with "→". Footer row: monospace
confidence label, then **Accept** (outlined navy → solid navy+white when accepted) and **Reject**
(outlined red → solid red+white when rejected) buttons — both act as toggles back to "pending" on a
second click. Hovering or clicking a card sets it as the **active comment**, which is what drives the
connector line.

### The connector line (core interaction — build this carefully)
- One state value: `activeCommentId` (nullable).
- Set it when: (a) the user clicks a highlighted duty span in the document that has an attached comment,
  or (b) the user hovers a comment card (wherever it currently renders — docked grid or floating panel);
  clear it on mouse-leave of the card (clicking a doc span "pins" it until another selection replaces it).
- On every activation, and again on every animation frame while a floating panel is being dragged,
  recompute: get the bounding rects of (1) the main-body container (the coordinate origin), (2) the DOM
  node of the anchor span for that duty in the document, (3) the DOM node of that comment's card
  *wherever it currently lives* (look it up by ref, not by assumed position — it may be in a docked grid
  cell or a dragged floating window). Compute a cubic bezier path from the right edge of the anchor
  (vertically centered) to the left edge of the card (~18px down from its top), with two control points
  horizontally centered between start and end (a gentle S-curve, not a straight line — this is the
  "Word-style" feel). If any of the three DOM nodes can't be found (e.g. the comment's panel type was
  swapped away, or the panel was closed), hide the line gracefully rather than erroring.
- Only one line renders at a time (the currently active comment). Don't attempt to draw lines for every
  comment simultaneously — that was intentionally rejected as visual clutter.

## Design tokens
- **Colors**: navy `#14204f` (chrome, ink, primary buttons), amber `#f5a623` (brand accent, AI badge,
  connector line, high-visibility pills — paired with dark-amber text `#a8660f` on light amber fills),
  cream `#f3f1ea` (secondary surfaces, chips), page background `#e9e7e0` / workspace background
  `#dedbd0`, ink `#232338` (body text), blue `#2a6fd6` (links, "observation" label, one persona dot),
  green `#1f8a5b` ("low exposure"/resilient, accepted, "application" label, provenance dot), red
  `#c1453b` ("high exposure", rejected, conflict, "resilience →2027" stat). Borders throughout are
  `rgba(20,32,79, 0.08–0.18)`.
- **Typography**: `'Source Serif 4'` (Google Font, 400/600/700) for all manuscript content; system UI
  stack (`system-ui, -apple-system, 'Segoe UI', sans-serif`) for all chrome/labels/buttons;
  `ui-monospace, Menlo, monospace` for data — percentages, indices, provenance tags, trace steps, graph
  labels.
- **Radius**: 4–6px small controls, 8px cards/panels, pill (9999px) for status badges and toggle chips.
- **Shadows**: docked panels `0 2px 8px rgba(20,32,79,0.08)`; floating panels
  `0 14px 34px rgba(20,32,79,0.28)`.

## State management (suggested shape)
- `viewMode`: `'clean' | 'suggestions' | 'comments'`.
- `comments`: array of `{ id, persona, personaColor, quoteAnchor (duty id), quote, body, tag
  (provenance label), confidence, status: 'pending'|'accepted'|'rejected', rewriteFrom?, rewriteTo? }`.
- `activeCommentId`, `hoveredDutyId`: both nullable, drive doc-highlight ↔ panel sync.
- `panels`: array of `{ id, type (one of the 7 keys), floating: bool, x, y, z }`; a `nextZ` counter for
  bring-to-front; a `nextPanelNum` counter for new ids.
- `selectedOiaDutyId`: which duty's O-I-A dissection is shown (per O-I-A panel instance, or shared —
  your call based on whether you want multiple O-I-A panels to be independent).
- Connector coordinates are **derived**, not stored as source-of-truth state beyond what's needed to
  trigger a recompute (ref measurement, not modeled data).

## Data — replace the mock with the real engine
The prototype's mock data must be replaced with real output from the existing v3 engine — do not
reintroduce hardcoded numbers:
- **AI-Exposure Index panel** ← `computeEngine()` in `v3/engine-data/engine-core.js` (`exposure.index`,
  `.band`, `.zMean`, `.zRange`, `.confidence`, `occupation.label`, and construct the trace steps from
  `occupation.ssoc` → `occupation.isco` → `exposure.socsUsed` → `exposure.source`).
- **Coherence Check** ← `computeEngine()`'s `coherence` field (`status: 'agree'|'conflict'`, `ssocIsco`,
  `fingerprintIscos`) — only render this panel type meaningfully when `coherence` is non-null.
- **Mirror Roles** ← `mirrorRoles` from the same engine response.
- **Job Anatomy** ← the existing `scoreJobAnatomy()` duty-scoring function (see `v3/api/anatomy.js` and
  its mirror in `src/App.jsx`) — reuse the real `layerMix`, `aiResilienceScore`, `resilience2y`,
  `centreOfGravity`, `trajectory2y` output directly; don't recompute a parallel version.
  Per-duty exposure bands and text come from the classified duties array already produced for that run.
- **Reviewer comments** ← whatever the current rule-based persona-comment generator in
  `ReviewStudio.jsx` already produces; keep persona names/colors consistent with existing usage
  elsewhere in the app if any exists.
- **Role Graph** ← existing `RoleGraph.jsx` data/logic if there's already a node model there; the mock
  SVG here is illustrative layout only, not a data source.
- **O-I-A** ← existing O-I-A dissection content/generator if one exists in the codebase already
  (README references this as a built Step 3 feature); if none exists yet, this panel type should degrade
  to the withheld state for every duty rather than inventing dissection copy.
- Preserve every provenance chip and the `AI-assisted · human decides` footer line — these are governance
  requirements (`script/trust-loop-first.instructions.md`), not decoration.

## Interactions & behavior summary
- Segmented view-mode toggle changes document highlighting (and, if you choose, dock visibility).
- Click a highlighted duty → selects its comment, draws the connector line to wherever that comment's
  card currently renders.
- Hover a duty span or an anatomy/duty chip → syncs a shared highlight between document and panels.
- Hover / click a comment card → same connector behavior as clicking its duty span.
- Accept / Reject buttons on a comment toggle its status (click again to return to pending); rejecting
  visually resolves the underline/strike in the document; this does not currently rewrite the manuscript
  text, only signals resolution.
- Panel `<select>` swaps content type in place, no confirmation needed.
- Panel float/dock toggle and drag are as described above; "+ Add panel" and "×" close as described.
- No page navigation in this screen — it's a single workspace.

## Assets
No external image assets. One Google Font (`Source Serif 4`) is loaded via `<link>`. All icons are
plain glyphs/shapes (dots, a "⤢"/"⤓" toggle character, "×" close, an SVG graph) — no icon library
required, though you're free to swap in the codebase's existing icon set for the toggle/close controls
if one exists.

## Files in this bundle
- `Review Studio.dc.html` — the full prototype. Open directly in a browser. Contains three explored
  layouts at anchors `#1a`, `#1b`, `#2a` — **build `#2a`**, the combined direction described above.
- `EnginePanelBody.dc.html` — the panel-content-switcher sub-template referenced by the main file
  (renders whichever of the 7 content types a given panel is currently set to).

Both files use a prototyping-tool-specific templating syntax (`<sc-for>`, `<sc-if>`, `<dc-import>`,
`{{ }}` bindings) — treat this purely as a behavioral/visual reference, not code to port literally.
