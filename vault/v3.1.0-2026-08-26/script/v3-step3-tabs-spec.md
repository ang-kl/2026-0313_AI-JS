# V3 Step-3 Tab Restructure — the Report View contract (T-arc)

(№ 137 - 07-07 '26 16:18 SGT)

STATUS: READY_FOR_BUILD (T1 approved verbally: "proceed", 07-07 '26)
SCOPE: ReviewStudio only. Replaces the mode ribbon with the professional tab anatomy the
Human Lead pinned (Dribbble "Report View - Area Chart with Tabs & Data Tooltip").

## 1. Anatomy (locked)

Row 1  Title + one-line purpose (role · source · honesty chips)
Row 2  TABS, folder-style: Overview · The Ad · Duties & Exposure · Requirements & Gates ·
       Critical Read · Market  (six; gates stay their own decision)
Row 3  TAB TOOLBAR — each tab owns its controls; controls exist only where they mean something
Body   LEFT sidebar (library: Sources/Trace/Skilling/Advisory) · CENTRE (one thing per tab)
       · RIGHT inspector (the O-I-A instrument, persistent on every tab)
Footer honesty line (Source · Confidence · Time-window) + utility bar (Print / OKF export)

## 2. Tab contents + toolbars

| Tab | Centre | Toolbar |
|---|---|---|
| Overview | verdict chips as DOORS (band · trajectory grade · market pct · gates count · top flag), each taps through to its tab | time-window chip |
| The Ad | manuscript (verbatim sections, evidence-doctrine highlights) | Read clean ⇄ Evidence · Comments toggle |
| Duties & Exposure | O-I-A dissection cards OR AI trace | view picker (O-I-A / AI trace) |
| Requirements & Gates | QoI-graded requirement cards + hiring-filter gates | grade filter (later) |
| Critical Read | blind spots · contradictions · noodles · forensic · falsification · ACH/deep read · personas | hidden-panels restore |
| Market | role graphs (Layered/Knowledge/SSOC via existing picker) + salary position + indicators | graph picker (in pane) |

Section MOVES (dedupe, no duplication): qoi → Gates; salaryPos + indicators → Market.
Severity ordering (G2) continues within Critical Read; dismiss/restore unchanged.

## 3. Inspector (right)

One persistent pane on all tabs. Tap anything — pill, evidence phrase, duty, chip — its
O-I-A card opens HERE. Reviewer comments list appears under it on The Ad tab only.
Mobile (<860px): inspector is the existing overlay, content-gated (no empty sheet).

## 4. Doctrine

No emoji/pictographs. Evidence-linked highlights only; plain otherwise. Withhold over
guess per tab (an empty tab states why, one line, never fabricates). 44px targets,
aria-pressed tabs, colour never load-bearing. Saved per-tab views: PARKED (KV exists;
polish, not structure).

## 5. Slices

- T1: tab shell + routing + toolbars + Overview chips + section moves (this build).
- T2: inspector unification polish (hover-peek tooltip vs pinned card), mobile bottom sheet.
- T3: utility footer (Print / OKF) + per-tab saved views (parked until unparked).

Source of truth: shipped code > this spec > memory. AU-7 for amendments.
