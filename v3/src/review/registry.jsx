// v3/src/review/registry.jsx - PR 2 (Part B.3, v3-workflow-and-step3-remediation-spec.md):
// ONE declarative source of truth for every Step 3 window - id, label, per-tab placement,
// render function, and the ANCHOR CONTRACT (which DOM selectors a window exposes for
// connector linking). renderWindow, WIN_LABELS, TAB_WINDOWS, the dock strips and
// LINK_RULES all DERIVE from this array - adding a window is now one entry here, not
// four hand-maintained structures (the Part B.2 finding this PR remediates).
import { renderWinVerdict } from "./windows/Verdict.jsx";
import { renderWinShortcuts } from "./windows/Shortcuts.jsx";
import { renderWinGatesHard } from "./windows/GatesHard.jsx";
import { renderWinQoI } from "./windows/QoI.jsx";
import { renderWinGraphs } from "./windows/Graphs.jsx";
import { renderWinSalary } from "./windows/Salary.jsx";
import { renderWinIndicators } from "./windows/Indicators.jsx";
import { renderWinTrajectory } from "./windows/Trajectory.jsx";
import { renderWinAitrace } from "./windows/Aitrace.jsx";
import { renderWinOIA } from "./windows/OIA.jsx";
import { renderWinCritical } from "./windows/Critical.jsx";
import { renderWinManuscript } from "./windows/Manuscript.jsx";
import { renderWinInspector } from "./windows/Inspector.jsx";
import { renderWinComments } from "./windows/Comments.jsx";

// placements: { tab: [side, order] } - order is the strip position within that side.
// anchors: named selector factories this window exposes; the ONLY selectors the
// connector engine may compose (PR 3 extends consumption, not the contract shape).
export const WINDOWS = [
  { id: "verdict",    label: "Verdict",                render: renderWinVerdict,
    placements: { overview: ["left", 0] }, anchors: {} },
  { id: "shortcuts",  label: "Shortcuts",              render: renderWinShortcuts,
    placements: { overview: ["right", 0] }, anchors: {} },
  { id: "manuscript", label: "Manuscript",             render: renderWinManuscript,
    placements: { ad: ["left", 0] },
    anchors: { dutyLine: (id) => "#li-" + id } },
  { id: "comments",   label: "Comments",               render: renderWinComments,
    placements: { ad: ["right", 1] },
    anchors: { comment: (id) => '[data-comment-anchor="' + id + '"]' } },
  { id: "oia",        label: "O-I-A cards",            render: renderWinOIA,
    placements: { duties: ["left", 0] },
    anchors: { oiaCard: (id) => '[data-oia-anchor="' + id + '"]' } },
  { id: "aitrace",    label: "AI trace",               render: renderWinAitrace,
    placements: { duties: ["left", 1] },
    anchors: { traceRow: (id) => '[data-trace-anchor="' + id + '"]' } },
  { id: "trajectory", label: "Trajectory",             render: renderWinTrajectory,
    placements: { duties: ["right", 1] }, anchors: {} },
  { id: "gates",      label: "Hard gates",             render: renderWinGatesHard,
    placements: { gates: ["left", 0] }, anchors: {} },
  { id: "qoi",        label: "Quality of information", render: renderWinQoI,
    placements: { gates: ["left", 1] }, anchors: {} },
  { id: "critical",   label: "Critical Read",          render: renderWinCritical,
    placements: { critical: ["left", 0] }, anchors: {} },
  { id: "graphs",     label: "Graphs",                 render: renderWinGraphs,
    placements: { market: ["left", 0] }, anchors: {} },
  { id: "salary",     label: "Salary",                 render: renderWinSalary,
    placements: { market: ["right", 0] }, anchors: {} },
  { id: "indicators", label: "Indicators",             render: renderWinIndicators,
    placements: { market: ["right", 1] }, anchors: {} },
  { id: "inspector",  label: "Inspector",              render: renderWinInspector,
    placements: { overview: ["right", 1], ad: ["right", 0], duties: ["right", 0], gates: ["right", 0], critical: ["right", 0], market: ["right", 2] },
    anchors: {} },
];

// ── Derived structures (formerly hand-maintained in Desk.jsx) ────────────────────────
export const WIN_LABELS = Object.fromEntries(WINDOWS.map((w) => [w.id, w.label]));

export const TAB_WINDOWS = (() => {
  const tabs = {};
  WINDOWS.forEach((w) => {
    Object.entries(w.placements).forEach(([tab, [side, order]]) => {
      tabs[tab] = tabs[tab] || { left: [], right: [] };
      tabs[tab][side].push([order, w.id]);
    });
  });
  Object.values(tabs).forEach((t) => {
    t.left = t.left.sort((a, b) => a[0] - b[0]).map(([, id]) => id);
    t.right = t.right.sort((a, b) => a[0] - b[0]).map(([, id]) => id);
  });
  return tabs;
})();

// Anchor lookup with a LOUD failure mode (Part C.2 item 2): composing a selector a
// window never declared throws at module init - a build-caught mistake, not a silent
// runtime null that makes connector lines quietly vanish.
export function anchorOf(winId, anchorName) {
  const w = WINDOWS.find((x) => x.id === winId);
  if (!w) throw new Error("registry: unknown window '" + winId + "'");
  const a = w.anchors[anchorName];
  if (!a) throw new Error("registry: window '" + winId + "' declares no anchor '" + anchorName + "'");
  return a;
}

// Generalized connector rules, now DERIVED from the anchor contract above (was a
// hand-written selector map in Desk.jsx). Same two tabs, same truth source
// (activeSpan) - PR 3's deriveLinks below extends this to a multi-link set.
export const LINK_RULES = {
  ad: { active: (s) => s.activeSpan, left: anchorOf("manuscript", "dutyLine"), right: anchorOf("comments", "comment") },
  duties: { active: (s) => s.activeSpan, left: anchorOf("oia", "oiaCard"), right: anchorOf("manuscript", "dutyLine") },
};

// ── PR 3 (Part C.2 item 1) - the link model. deriveLinks(tab, d) returns the SET of
// live links for a tab: [{ id, fromWin, fromSel, toWin, toSel, kind, active }]. Every
// link is a join on ids that already exist in the engine's own data (comment.anchor
// is a span id; AI-trace row "tN" and O-I-A card "sN" index the SAME jobAnatomy.duties
// array) - no LLM authors a link, no selector is composed outside the anchor contract
// (anchorOf throws on an undeclared name). Honesty guard preserved: a tab with no real
// shared id derives zero links (overview/gates/critical - and market until RoleGraph
// exposes a data-node-anchor, which lives in App.jsx and is deferred to keep this PR
// off Session B's files).
export function deriveLinks(tab, d) {
  const links = [];
  const activeSpan = d && d.activeSpan;
  if (tab === "ad") {
    // Every reviewer comment joins its anchored duty span - all pairs draw (dimmed),
    // the active pair draws emphasised (Part C.2 item 3).
    (d && Array.isArray(d.comments) ? d.comments : []).forEach((c) => {
      if (!c || !c.anchor) return;
      links.push({ id: "lnk-ad-" + c.id, fromWin: "manuscript", fromSel: anchorOf("manuscript", "dutyLine")(c.anchor),
        toWin: "comments", toSel: anchorOf("comments", "comment")(c.anchor), kind: "span-comment", active: activeSpan === c.anchor });
    });
  }
  if (tab === "duties") {
    // O-I-A card <-> AI-trace row: index join over the same duties array (both on-tab).
    (d && Array.isArray(d.traceIds) ? d.traceIds : []).forEach((p) => {
      links.push({ id: "lnk-du-" + p.oiaId, fromWin: "oia", fromSel: anchorOf("oia", "oiaCard")(p.oiaId),
        toWin: "aitrace", toSel: anchorOf("aitrace", "traceRow")(p.traceId), kind: "oia-trace", active: activeSpan === p.oiaId });
    });
    // O-I-A card <-> manuscript duty line: ACTIVE span only (the manuscript is normally
    // on the ad tab - this fires when it is floated/dock-overridden here; otherwise the
    // engine degrades it to an edge stub rather than a vanished line).
    if (activeSpan) {
      links.push({ id: "lnk-du-manu-" + activeSpan, fromWin: "oia", fromSel: anchorOf("oia", "oiaCard")(activeSpan),
        toWin: "manuscript", toSel: anchorOf("manuscript", "dutyLine")(activeSpan), kind: "oia-manuscript", active: true });
    }
  }
  return links;
}
