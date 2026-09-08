import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildManualPersonEvidence,
  buildManualPersonSource,
  canonicalPersonText,
  isManualPersonEvidence,
  markExcerpt,
  resolveExcerpts,
} from "./personEvidenceData.js";
import { LOCAL_HUMAN_ACTOR } from "../review/reviewerContract.js";

// BLP-007. The textarea holds the CANONICAL text (contract normalisation), so the offsets the
// user selects, the hash that names the source and the slice that becomes a span cover one
// string by construction. Canonicalisation runs on paste and on blur; marking refuses to read a
// selection while the box still holds non-canonical text and asks for the selection again.
// An excerpt is stored as {start, end, sourceTextHash}; when the text changes, excerpts marked
// against the old text become STALE (shown in words, never emitted) until removed.
//
// Selection capture: the user's selection is recorded from the textarea's own select events
// into a ref that is cleared whenever the text changes, and the Mark button keeps focus in the
// textarea on mouse down, so marking reads a selection made against the text that is in the box
// now, by mouse or by keyboard (conformance-auditor C-2).

const excerptKeys = (payload) => (payload && !payload.unstructured ? payload.excerpts.map((span) => ({ start: span.start, end: span.end, sourceTextHash: span.sourceTextHash })) : []);
const sameExcerpts = (a, b) => a.length === b.length && a.every((item, i) => item.start === b[i].start && item.end === b[i].end && item.sourceTextHash === b[i].sourceTextHash);

export default function PersonEvidenceIngress({ targetSkills, value, onChange }) {
  const manual = useMemo(() => (isManualPersonEvidence(value) ? value : null), [value]);
  const [draft, setDraft] = useState(manual?.rawText || "");
  const [selectedSkills, setSelectedSkills] = useState(manual?.skills || []);
  const [confirmed, setConfirmed] = useState(Boolean(manual));
  const [excerpts, setExcerpts] = useState(() => excerptKeys(manual));
  const [notice, setNotice] = useState(null);
  const textareaRef = useRef(null);
  const markRef = useRef(null);
  const selectionRef = useRef(null);
  const focusMarkAfterRemove = useRef(false);
  const seededKey = useRef(null);
  const skills = useMemo(() => [...new Set((Array.isArray(targetSkills) ? targetSkills : []).map((skill) => String(skill || "").trim()).filter(Boolean))], [targetSkills]);
  const source = useMemo(() => buildManualPersonSource(draft), [draft]);
  const resolved = useMemo(() => resolveExcerpts(source, excerpts), [source, excerpts]);
  const canonical = draft === canonicalPersonText(draft);
  const manualKey = manual ? `${manual.sourceId}|${manual.confirmationRecord.confirmedAt}` : null;

  // Re-seed from an applied payload once per distinct payload (source id and confirmation time),
  // never on object identity, and never with a fresh array when nothing changed (W-1).
  useEffect(() => {
    if (!manual || seededKey.current === manualKey) return;
    seededKey.current = manualKey;
    setDraft(manual.rawText || "");
    setSelectedSkills(manual.skills || []);
    setExcerpts((current) => (sameExcerpts(current, excerptKeys(manual)) ? current : excerptKeys(manual)));
    setConfirmed(true);
    selectionRef.current = null;
  }, [manual, manualKey]);

  useEffect(() => {
    if (focusMarkAfterRemove.current && resolved.valid.length === 0 && resolved.stale.length === 0) {
      focusMarkAfterRemove.current = false;
      markRef.current?.focus();
    }
  }, [resolved.valid.length, resolved.stale.length]);

  const canonicalise = () => {
    const next = canonicalPersonText(draft);
    if (next !== draft) { setDraft(next); selectionRef.current = null; return true; }
    return false;
  };
  const rememberSelection = (element) => { selectionRef.current = element && element.selectionEnd > element.selectionStart ? { start: element.selectionStart, end: element.selectionEnd, value: element.value } : null; };
  const toggleSkill = (skill) => setSelectedSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]);
  const mark = () => {
    const element = textareaRef.current;
    if (!element) return;
    if (element.value !== canonicalPersonText(element.value)) {
      setDraft(canonicalPersonText(element.value));
      selectionRef.current = null;
      setNotice({ kind: "refused", text: "The text was normalised (line endings, trailing spaces, hidden characters). Select the excerpt again." });
      return;
    }
    const live = element.selectionEnd > element.selectionStart ? { start: element.selectionStart, end: element.selectionEnd, value: element.value } : selectionRef.current;
    const selection = live && live.value === element.value ? live : null;
    const current = buildManualPersonSource(element.value);
    const verdict = markExcerpt(current, selection ? selection.start : 0, selection ? selection.end : 0, { existing: resolved.valid });
    if (!verdict.ok) { setNotice({ kind: "refused", text: verdict.message }); return; }
    setExcerpts((list) => [...list, { start: verdict.span.start, end: verdict.span.end, sourceTextHash: verdict.span.sourceTextHash }]);
    setConfirmed(false);
    setNotice({ kind: "marked", text: `Marked ${verdict.span.id}` });
  };
  const remove = (target) => {
    focusMarkAfterRemove.current = true;
    setExcerpts((list) => list.filter((item) => !(item.start === target.start && item.end === target.end && item.sourceTextHash === target.sourceTextHash)));
    setConfirmed(false);
    setNotice({ kind: "removed", text: `Removed excerpt ${target.start}-${target.end}` });
  };
  const apply = () => {
    const at = new Date().toISOString();
    const evidence = buildManualPersonEvidence({ rawText: draft, selectedSkills, targetSkills: skills, confirmed, excerpts, confirmedAt: at, retrievedAt: at });
    if (evidence) onChange?.(evidence);
    else setNotice({ kind: "refused", text: "Nothing was applied: remove stale excerpts and confirm again." });
  };
  const clear = () => {
    setDraft("");
    setSelectedSkills([]);
    setExcerpts([]);
    setConfirmed(false);
    setNotice(null);
    onChange?.(null);
  };

  const staleCount = resolved.stale.length;
  const applyBlocked = !draft.trim() || !confirmed || staleCount > 0 || !canonical;
  // The applied payload describes the text it was built from; when the box now holds different
  // text, say so in words rather than let CONFIRMED read as a claim about the new text (W-2).
  const describesEarlierText = Boolean(manual && source && source.id !== manual.sourceId);
  const summary = manual
    ? `USER-CONFIRMED · ${manual.skills.length} skill claim${manual.skills.length === 1 ? "" : "s"} · ${manual.unstructured ? "1 unstructured proof" : `${manual.proofs.length} exact excerpt${manual.proofs.length === 1 ? "" : "s"}`}`
    : null;

  return (
    <section className="pe-root" data-testid="person-evidence-ingress" aria-label="Manual person evidence">
      <style>{`
        .pe-root{margin:0 clamp(14px,1.05vw,28px) 12px;border:1px solid #dfe5ec;border-radius:9px;background:#fff;padding:11px 12px;color:#1a202c}.pe-root *{box-sizing:border-box}.pe-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.pe-head b{display:block;margin-top:2px;font-size:12px}.pe-status{border:1px solid #d6b66d;border-radius:999px;background:#fffbeb;color:#92400e;padding:2px 7px;font-size:7px;font-weight:900}.pe-status.active{border-color:#1a56db;background:#eef4ff;color:#1a56db}.pe-boundary{margin:8px 0;color:#64748b;font-size:9px;line-height:1.4}.pe-label{display:block;margin-bottom:4px;font-size:9px;font-weight:900}.pe-root textarea{width:100%;min-height:76px;max-height:190px;resize:vertical;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:8px 9px;font:10px/1.4 Inter,Arial,sans-serif;color:#1a202c}.pe-root textarea:focus-visible,.pe-root button:focus-visible,.pe-root input:focus-visible{outline:3px solid #1a56db;outline-offset:2px}.pe-count{text-align:right;margin-top:3px;color:#64748b;font-size:7px}.pe-source{margin-top:5px;color:#475569;font-size:8px;line-height:1.4;word-break:break-all}.pe-source code{font:8px/1.4 ui-monospace,Menlo,Consolas,monospace}.pe-markRow{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;margin-top:7px}.pe-markRow button{min-height:44px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:5px 7px;font-size:8px;font-weight:900;cursor:pointer}.pe-markRow button:disabled{cursor:not-allowed;opacity:.48}.pe-notice{margin-top:5px;min-height:12px;color:#475569;font-size:8px;line-height:1.4}.pe-notice[data-kind="refused"]{color:#1a202c;font-weight:900}.pe-excerpts{list-style:none;margin:7px 0 0;padding:0;display:grid;gap:6px}.pe-excerpt{border:1px solid #cbd5e1;border-left:3px solid #1a56db;border-radius:8px;padding:6px 7px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:start}.pe-excerpt[data-state="stale"]{border-style:dashed;border-left-color:#64748b}.pe-excerptId{font:7px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#475569;word-break:break-all}.pe-excerptState{font-size:7px;font-weight:900;color:#1a202c}.pe-excerpt blockquote{margin:3px 0 0;padding:0 0 0 6px;border-left:2px solid #e2e8f0;font-size:9px;line-height:1.35;white-space:pre-wrap;max-height:96px;overflow:auto;color:#1a202c}.pe-excerpt button{min-height:44px;min-width:44px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:5px 7px;font-size:8px;font-weight:900;cursor:pointer}.pe-skills{max-height:170px;overflow:auto;margin:9px 0 7px;border:1px solid #e2e8f0;border-radius:8px;padding:7px;scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.pe-skills legend{padding:0 4px;font-size:8px;font-weight:900}.pe-skills label{display:grid;grid-template-columns:18px minmax(0,1fr);align-items:center;gap:5px;min-height:44px;padding:4px;border-radius:5px;font-size:9px;line-height:1.25}.pe-skills label:hover{background:#f5f7fa}.pe-skills input,.pe-confirm input{width:16px;height:16px;margin:0}.pe-empty{color:#64748b;font-size:9px}.pe-confirm{display:grid;grid-template-columns:18px minmax(0,1fr);gap:6px;align-items:center;min-height:44px;color:#475569;font-size:8px;line-height:1.35}.pe-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}.pe-actions button{min-height:44px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:5px 7px;font-size:8px;font-weight:900;cursor:pointer}.pe-actions button.primary{border-color:#1a56db;background:#eef4ff;color:#1a56db}.pe-actions button:disabled{cursor:not-allowed;opacity:.48}.pe-active{margin-top:7px;border-left:3px solid #1a56db;background:#eef4ff;padding:6px 7px;color:#1a56db;font-size:8px;font-weight:900}.pe-active small{display:block;margin-top:3px;font-weight:400;color:#475569}
        @media(max-width:560px){.pe-actions{grid-template-columns:1fr}.pe-root textarea{min-height:96px}}
      `}</style>
      <div className="pe-head"><div><div className="wu-srcid">PERSON EVIDENCE · SESSION ONLY</div><b>CV overlay</b></div><span className={`pe-status ${manual ? "active" : "withheld"}`} data-testid="person-evidence-status" data-describes-earlier-text={describesEarlierText ? "true" : "false"}>{manual ? (describesEarlierText ? "CONFIRMED (EARLIER TEXT)" : "CONFIRMED") : "WITHHELD"}</span></div>
      <p className="pe-boundary">Paste text manually. Nothing is uploaded, stored, parsed, or converted into a claim automatically. Select exact words in the box and mark them as excerpts; each excerpt is recorded as the exact characters you selected, never a rewrite.</p>
      <label className="pe-label" htmlFor="person-evidence-paste">CV or proof text</label>
      <textarea
        id="person-evidence-paste"
        data-testid="person-evidence-paste"
        ref={textareaRef}
        value={draft}
        maxLength={30000}
        onChange={(event) => { setDraft(event.target.value); setConfirmed(false); selectionRef.current = null; }}
        onSelect={(event) => rememberSelection(event.target)}
        onBlur={() => { if (canonicalise()) setNotice({ kind: "normalised", text: "Text normalised (line endings, trailing spaces, hidden characters removed). Select any excerpt again; excerpts marked against the earlier text are shown as stale." }); }}
        onPaste={() => { setTimeout(() => { const element = textareaRef.current; if (element && element.value !== canonicalPersonText(element.value)) { setDraft(canonicalPersonText(element.value)); selectionRef.current = null; } }, 0); }}
        placeholder="Paste your CV or evidence notes here"
      />
      <div className="pe-count">{draft.length.toLocaleString()} / 30,000 characters · exact excerpts or unstructured proof only</div>
      {source && <div className="pe-source" data-testid="person-evidence-source-id">Source <code data-testid="person-evidence-source-id-value">{source.id}</code> · {source.normalisation} · {source.text.length.toLocaleString()} characters · {canonical ? "canonical" : "not yet normalised"}</div>}
      <div className="pe-markRow"><button ref={markRef} data-testid="person-evidence-mark" type="button" disabled={!draft.trim()} onMouseDown={(event) => event.preventDefault()} onClick={mark}>Mark exact excerpt from selection</button></div>
      <div className="pe-notice" data-testid="person-evidence-notice" data-kind={notice?.kind || ""} role="status" aria-live="polite">{notice ? notice.text : ""}</div>
      {(resolved.valid.length > 0 || staleCount > 0) && (
        <ul className="pe-excerpts" data-testid="person-evidence-excerpts" aria-label="Marked excerpts">
          {resolved.valid.map((span) => (
            <li key={span.id} className="pe-excerpt" data-testid="person-evidence-excerpt" data-state="marked" data-span-id={span.id} data-source-id={span.sourceId}>
              <div>
                <div className="pe-excerptState">MARKED · characters {span.start}-{span.end}</div>
                <div className="pe-excerptId">{span.id}</div>
                <blockquote data-testid="person-evidence-excerpt-text">{span.text}</blockquote>
              </div>
              <button type="button" data-testid="person-evidence-excerpt-remove" aria-label={`Remove excerpt characters ${span.start} to ${span.end}`} onClick={() => remove({ start: span.start, end: span.end, sourceTextHash: span.sourceTextHash })}>Remove</button>
            </li>
          ))}
          {resolved.stale.map((item, index) => (
            <li key={`stale-${index}-${item.start}-${item.end}`} className="pe-excerpt" data-testid="person-evidence-excerpt" data-state="stale">
              <div>
                <div className="pe-excerptState">STALE · {item.reason === "NO_SOURCE" ? "the pasted text was cleared" : item.reason === "INVALID_SPAN" ? "the excerpt no longer fits the text" : "text changed since this excerpt was marked"} · characters {item.start}-{item.end}</div>
                <div className="pe-excerptId">not emitted; remove it and mark the excerpt again</div>
              </div>
              <button type="button" data-testid="person-evidence-excerpt-remove" aria-label={`Remove stale excerpt characters ${item.start} to ${item.end}`} onClick={() => remove(item)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <fieldset className="pe-skills" disabled={!draft.trim()}>
        <legend>Confirm target skills supported by your pasted evidence</legend>
        {skills.length ? skills.map((skill) => <label key={skill}><input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => { toggleSkill(skill); setConfirmed(false); }} /><span>{skill}</span></label>) : <div className="pe-empty">No target-role skills are available to confirm.</div>}
      </fieldset>
      <label className="pe-confirm"><input data-testid="person-evidence-confirm" type="checkbox" checked={confirmed} disabled={!draft.trim()} onChange={(event) => setConfirmed(event.target.checked)} /><span>I confirm the pasted evidence is mine and the selected skill claims are accurate. Confirmation is recorded as {LOCAL_HUMAN_ACTOR.displayName}.</span></label>
      <div className="pe-actions"><button data-testid="person-evidence-apply" type="button" className="primary" disabled={applyBlocked} aria-describedby={staleCount > 0 ? "person-evidence-stale-block" : undefined} onClick={apply}>Use confirmed evidence</button><button data-testid="person-evidence-clear" type="button" disabled={!draft && !manual} onClick={clear}>Clear session evidence</button></div>
      {staleCount > 0 && <div id="person-evidence-stale-block" className="pe-notice" data-kind="refused" data-testid="person-evidence-stale-block" role="status" aria-live="polite">{staleCount} stale excerpt{staleCount === 1 ? "" : "s"} must be removed before the evidence can be used.</div>}
      {manual && (
        <div className="pe-active" data-testid="person-evidence-summary" data-source-id={manual.sourceId} data-proof-count={manual.proofs.length} data-confirmed-at={manual.confirmationRecord.confirmedAt} data-describes-earlier-text={describesEarlierText ? "true" : "false"}>
          {summary}
          {describesEarlierText && <small data-testid="person-evidence-earlier-text">The box now holds different text (source {source.id}); this describes the evidence you last applied, not the text in the box.</small>}
          <small>Source {manual.sourceId} · confirmed by {manual.confirmationRecord.confirmedByDisplayName || LOCAL_HUMAN_ACTOR.displayName} at {manual.confirmationRecord.confirmedAt} · proof state {[...new Set(manual.proofs.map((proof) => proof.state))].join(", ")}{manual.proofs.every((proof) => proof.state === "CLAIMED_ONLY") ? " (claimed by you, not yet demonstrated)" : ""}</small>
        </div>
      )}
    </section>
  );
}
