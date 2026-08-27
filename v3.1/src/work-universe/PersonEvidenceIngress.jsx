import React, { useEffect, useMemo, useState } from "react";
import { buildManualPersonEvidence, isManualPersonEvidence } from "./personEvidenceData.js";

export default function PersonEvidenceIngress({ targetSkills, value, onChange }) {
  const manual = isManualPersonEvidence(value) ? value : null;
  const [draft, setDraft] = useState(manual?.rawText || "");
  const [selectedSkills, setSelectedSkills] = useState(manual?.skills || []);
  const [confirmed, setConfirmed] = useState(Boolean(manual));
  const skills = useMemo(() => [...new Set((Array.isArray(targetSkills) ? targetSkills : []).map((skill) => String(skill || "").trim()).filter(Boolean))], [targetSkills]);

  useEffect(() => {
    if (!manual) return;
    setDraft(manual.rawText || "");
    setSelectedSkills(manual.skills || []);
    setConfirmed(true);
  }, [manual]);

  const toggleSkill = (skill) => setSelectedSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]);
  const apply = () => {
    const evidence = buildManualPersonEvidence({ rawText: draft, selectedSkills, targetSkills: skills, confirmed });
    if (evidence) onChange?.(evidence);
  };
  const clear = () => {
    setDraft("");
    setSelectedSkills([]);
    setConfirmed(false);
    onChange?.(null);
  };

  return (
    <section className="pe-root" data-testid="person-evidence-ingress" aria-label="Manual person evidence">
      <style>{`
        .pe-root{margin:0 clamp(14px,1.05vw,28px) 12px;border:1px solid #dfe5ec;border-radius:9px;background:#fff;padding:11px 12px;color:#1a202c}.pe-root *{box-sizing:border-box}.pe-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.pe-head b{display:block;margin-top:2px;font-size:12px}.pe-status{border:1px solid #d6b66d;border-radius:999px;background:#fffbeb;color:#92400e;padding:2px 7px;font-size:7px;font-weight:900}.pe-status.active{border-color:#1a56db;background:#eef4ff;color:#1a56db}.pe-boundary{margin:8px 0;color:#64748b;font-size:9px;line-height:1.4}.pe-label{display:block;margin-bottom:4px;font-size:9px;font-weight:900}.pe-root textarea{width:100%;min-height:76px;max-height:190px;resize:vertical;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:8px 9px;font:10px/1.4 Inter,Arial,sans-serif;color:#1a202c}.pe-root textarea:focus-visible,.pe-root button:focus-visible,.pe-root input:focus-visible{outline:3px solid #1a56db;outline-offset:2px}.pe-count{text-align:right;margin-top:3px;color:#64748b;font-size:7px}.pe-skills{max-height:170px;overflow:auto;margin:9px 0 7px;border:1px solid #e2e8f0;border-radius:8px;padding:7px;scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.pe-skills legend{padding:0 4px;font-size:8px;font-weight:900}.pe-skills label{display:grid;grid-template-columns:18px minmax(0,1fr);align-items:start;gap:5px;min-height:30px;padding:4px;border-radius:5px;font-size:9px;line-height:1.25}.pe-skills label:hover{background:#f5f7fa}.pe-skills input,.pe-confirm input{width:16px;height:16px;margin:0}.pe-empty{color:#64748b;font-size:9px}.pe-confirm{display:grid;grid-template-columns:18px minmax(0,1fr);gap:6px;align-items:start;color:#475569;font-size:8px;line-height:1.35}.pe-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}.pe-actions button{min-height:44px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:5px 7px;font-size:8px;font-weight:900;cursor:pointer}.pe-actions button.primary{border-color:#1a56db;background:#eef4ff;color:#1a56db}.pe-actions button:disabled{cursor:not-allowed;opacity:.48}.pe-active{margin-top:7px;border-left:3px solid #1a56db;background:#eef4ff;padding:6px 7px;color:#1a56db;font-size:8px;font-weight:900}
        @media(max-width:560px){.pe-actions{grid-template-columns:1fr}.pe-root textarea{min-height:96px}}
      `}</style>
      <div className="pe-head"><div><div className="wu-srcid">PERSON EVIDENCE · SESSION ONLY</div><b>CV overlay</b></div><span className={`pe-status ${manual ? "active" : "withheld"}`}>{manual ? "CONFIRMED" : "WITHHELD"}</span></div>
      <p className="pe-boundary">Paste text manually. Nothing is uploaded, stored, parsed, or converted into a claim automatically.</p>
      <label className="pe-label" htmlFor="person-evidence-paste">CV or proof text</label>
      <textarea id="person-evidence-paste" data-testid="person-evidence-paste" value={draft} maxLength={30000} onChange={(event) => { setDraft(event.target.value); setConfirmed(false); }} placeholder="Paste your CV or evidence notes here" />
      <div className="pe-count">{draft.length.toLocaleString()} / 30,000 characters · unstructured proof only</div>
      <fieldset className="pe-skills" disabled={!draft.trim()}>
        <legend>Confirm target skills supported by your pasted evidence</legend>
        {skills.length ? skills.map((skill) => <label key={skill}><input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => { toggleSkill(skill); setConfirmed(false); }} /><span>{skill}</span></label>) : <div className="pe-empty">No target-role skills are available to confirm.</div>}
      </fieldset>
      <label className="pe-confirm"><input data-testid="person-evidence-confirm" type="checkbox" checked={confirmed} disabled={!draft.trim()} onChange={(event) => setConfirmed(event.target.checked)} /><span>I confirm the pasted evidence is mine and the selected skill claims are accurate.</span></label>
      <div className="pe-actions"><button data-testid="person-evidence-apply" type="button" className="primary" disabled={!draft.trim() || !confirmed} onClick={apply}>Use confirmed evidence</button><button data-testid="person-evidence-clear" type="button" disabled={!draft && !manual} onClick={clear}>Clear session evidence</button></div>
      {manual && <div className="pe-active">USER-CONFIRMED · {manual.skills.length} skill claim{manual.skills.length === 1 ? "" : "s"} · 1 unstructured proof</div>}
    </section>
  );
}
