# V3 Workspace Panels — the two-panel study desk (U-arc)

(№ 138 - 07-07 '26 17:41 SGT)

STATUS: READY_FOR_BUILD (U1+U2 approved verbally, 07-07 '26; reference = Logos-style desk)
SCOPE: ReviewStudio. Extends №137's tab anatomy into a windowed workspace.

## 1. The metaphor (locked, from the Human Lead's Logos reference)

- TOP TABS stay: Overview · The Ad · Duties & Exposure · Requirements & Gates ·
  Critical Read · Market. A top tab selects a VIEW-SET, not a single page.
- Below: TWO PANELS (left + right). Each panel hosts MULTIPLE WINDOWS with its own
  window-tab strip (like Logos panes).
- Every SUB-FUNCTION is a WINDOW: it can sit tabbed in either panel and (U3) be torn
  off to FLOAT (drag header, resize corner - the roleGraphFloat pattern generalised).
- The LEFT SIDEBAR is retired; its shortcuts roll into Overview as workspace chips.

## 2. Window registry (initial)

| Top tab | Windows (id · content) |
|---|---|
| Overview | verdict (chips-as-doors) · shortcuts (rolled-up rail: Sources/Trace/Skilling/Advisory/Cover letter/Boards/Saved) |
| The Ad | manuscript (verbatim + evidence highlights, clean/evidence/comments toolbar) · comments (reviewer list) |
| Duties & Exposure | oia (dissection cards) · aitrace · trajectory |
| Requirements & Gates | gates (hard gates) · qoi |
| Critical Read | one window per lens group: flags (blind spots + contradictions) · language (noodles + forensic + falsification) · deepread (ACH + advisory personas) |
| Market | graphs (Layered/Knowledge/SSOC picker) · salary · indicators |
| (every tab) | inspector (the O-I-A instrument) - default active in the RIGHT panel |

## 3. Behaviour

- Default split per tab: primary window active LEFT, inspector active RIGHT; other
  windows sit as tabs in the panel strips (left gets content windows, right gets
  inspector + secondary).
- A window lives in exactly one place at a time (panel-left, panel-right, or float).
- Window-tab strips: 44px tabs, aria-selected; overflow scrolls.
- U3 tear-off: drag a window tab out (or a ⧉ button) -> floating window (drag header,
  resize, close returns it to its home panel). Arrangement persists per posting via
  KV-1 "boards" scope.
- Withhold rules unchanged per window; an empty window states why in one line.

## 4. Slices

- U1: retire the sidebar; Overview gains the shortcuts window (chips that open the
  matching window/tab); drawer placeholders die with the rail.
- U2: two-panel shell + window registry + per-panel window tabs + inspector as a window.
- U3: tear-off floating + arrangement persistence (KV).

Doctrine: no emoji; 44px; colour never load-bearing; evidence-linked highlights only.
Source of truth: shipped code > this spec > memory. AU-7 for amendments.
