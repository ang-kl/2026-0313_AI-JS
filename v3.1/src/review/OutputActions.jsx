import React, { useState } from "react";

function download(name, type, content) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function OutputActions({ label, output, trace, gate }) {
  const [notice, setNotice] = useState("");
  const blocked = !gate.allowed;
  const act = async (action) => {
    if (blocked) { setNotice(`Blocked: ${gate.reasons.join("; ")}`); return; }
    if (action === "copy") await navigator.clipboard.writeText(output.text);
    if (action === "save") download(`${label}.txt`, "text/plain", output.text);
    if (action === "print" || action === "pdf") window.print();
    if (action === "export") download(`${label}.json`, "application/json", JSON.stringify({ output, trace }, null, 2));
    setNotice(`${action === "pdf" ? "Print / PDF" : action} action opened for the supported output.`);
  };
  return (
    <div className="output-actions" data-testid={`${label}-actions`} data-release={blocked ? "blocked" : "allowed"}>
      <style>{`.output-actions{margin-top:8px}.output-actions-row{display:flex;flex-wrap:wrap;gap:6px}.output-actions button{min-height:44px;border:1px solid #94a3b8;border-radius:7px;background:#fff;color:#1e293b;padding:5px 9px;font-size:8px;font-weight:900}.output-actions button:disabled{opacity:.45;cursor:not-allowed}.output-actions button:focus-visible{outline:3px solid #1a56db;outline-offset:2px}.output-actions-note{font-size:8px;line-height:1.4;color:#475569;margin:5px 0 0}`}</style>
      <div className="output-actions-row">{["copy", "save", "print", "pdf", "export"].map((action) => <button key={action} type="button" data-testid={`${label}-action-${action}`} disabled={blocked} onClick={() => act(action)}>{action === "pdf" ? "Print / PDF" : action[0].toUpperCase() + action.slice(1)}</button>)}</div>
      <p className="output-actions-note" data-testid={`${label}-release-reason`} role="status" aria-live="polite">{blocked ? `Output actions blocked: ${gate.reasons.join("; ")}.` : notice || "Copy, save, print, PDF and export are available because every included sentence passes the evidence gate."}</p>
    </div>
  );
}
