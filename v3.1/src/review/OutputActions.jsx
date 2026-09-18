import React, { useState } from "react";
import { OUTPUT_ACTIONS } from "./outputReleasePolicy.js";

function download(name, type, content) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * The actions act on the HELD output, the one the human assembled at an instant, never on the live
 * rebuild: the gate compares the two, so a move in the evidence after assembly blocks every action
 * with the reason said, and the human assembles again to release. Assembling is a click, not a
 * render: no output is held that the human did not ask for.
 */
export default function OutputActions({ label, held, gate, onAssemble, canAssemble, nothingToAssemble = false }) {
  const [notice, setNotice] = useState("");
  const blocked = !gate.allowed;
  const act = async (action) => {
    // `allowed` implies an output is held, and the guard says so rather than resting on it (S-2).
    if (blocked || !held) { setNotice(`Blocked: ${gate.reasons.join("; ")}`); return; }
    const { output, trace } = held;
    if (action === "copy") await navigator.clipboard.writeText(output.text);
    if (action === "save") download(`${label}.txt`, "text/plain", output.text);
    if (action === "print" || action === "pdf") window.print();
    if (action === "export") download(`${label}.json`, "application/json", JSON.stringify({ output, trace, assembledAt: held.assembledAt }, null, 2));
    setNotice(`${action === "pdf" ? "Print / PDF" : action} action opened for the output assembled at ${held.assembledAt}.`);
  };
  return (
    <div className="output-actions" data-testid={`${label}-actions`} data-release={blocked ? "blocked" : "allowed"} data-stale={gate.stale ? "true" : "false"} data-assembled={held ? "true" : "false"}>
      <style>{`.output-actions{margin-top:8px}.output-actions-row{display:flex;flex-wrap:wrap;gap:6px}.output-actions button{min-height:44px;border:1px solid #94a3b8;border-radius:7px;background:#fff;color:#1e293b;padding:5px 9px;font-size:8px;font-weight:900}.output-actions button:disabled{opacity:.45;cursor:not-allowed}.output-actions button:focus-visible{outline:3px solid #1a56db;outline-offset:2px}.output-actions-note{font-size:8px;line-height:1.4;color:#475569;margin:5px 0 0}`}</style>
      <div className="output-actions-row">
        {/* Accessible names lead with the visible label (label-in-name) and name the workbench, because both
            workbenches render on one page and their buttons would otherwise share a name (a11y review). */}
        <button type="button" data-testid={`${label}-assemble`} disabled={!canAssemble} aria-label={nothingToAssemble ? `Assemble output: nothing currently passes the gate for the ${label} output` : held ? `Assemble again: the ${label} output, from the evidence as it stands now` : `Assemble output: the ${label} output, from the evidence as it stands now`} onClick={onAssemble}>{nothingToAssemble ? "Assemble output: nothing currently passes the gate" : held ? "Assemble again" : "Assemble output"}</button>
        {/* One governed set, the policy's own: the buttons are its actions and each is disabled by its
            own verdict, never by a second hand-kept list (conformance-auditor W-3). */}
        {OUTPUT_ACTIONS.map((action) => { const visible = action === "pdf" ? "Print / PDF" : action[0].toUpperCase() + action.slice(1); return <button key={action} type="button" data-testid={`${label}-action-${action}`} disabled={!gate.actions[action]} aria-label={`${visible}: the ${label} output`} onClick={() => act(action)}>{visible}</button>; })}
      </div>
      <p className="output-actions-note" data-testid={`${label}-assembled-at`}>{held ? `Output assembled at ${held.assembledAt}; the actions act on that output, judged against the evidence as it stands now.` : "No output assembled yet; assemble to hold the output the actions will act on."}</p>
      <p className="output-actions-note" data-testid={`${label}-release-reason`} role="status" aria-live="polite">{blocked ? `Output actions blocked: ${gate.reasons.join("; ")}.` : notice || "Copy, save, print, PDF and export are available because the assembled output reads exactly as this workbench reads now, cites exactly the evidence that stands now, and every included sentence passes the evidence gate."}</p>
    </div>
  );
}
