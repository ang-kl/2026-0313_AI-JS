import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PROOF_TYPE,
  PROOF_TYPE_LABEL,
  PROOF_TYPE_VOCABULARY_STATUS,
  ledgerCounts,
  ledgerRows,
  setClaimText,
  setProofType,
} from "./candidateProofLedgerData.js";
import { LOCAL_HUMAN_ACTOR } from "../review/reviewerContract.js";

// BLP-008 candidate-proof ledger panel. Renders only what the ledger holds: one row per proof
// record with the exact excerpt under its own label ("what the document says"), the human's own
// claim (never pre-filled), the governed proof type, the state in words, the confirmation with
// identity withheld in words, the computed missing evidence, and the downstream uses as they
// stand. State is conveyed by text and shape, never colour alone. Staleness is said to be what
// it is: any change to the pasted text stales every record cut from the earlier text together.

const STATE_TEXT = {
  CLAIMED_ONLY: "claimed by you, not yet demonstrated",
  DEMONSTRATED: "demonstrated",
  CERTIFIED: "certified",
  WITHHELD: "withheld: no longer offered as evidence",
  CONFLICTING: "conflicting",
  STALE: "stale: the pasted text changed since this was recorded",
};

const CLAIM_MAX = 400;

function ClaimField({ row, disabled, onChange }) {
  const [draft, setDraft] = useState(row.claimText || "");
  const stateRef = useRef(null);
  const pendingFocus = useRef(false);
  // The field is never remounted on save: the draft follows the recorded claim, and focus moves to
  // the announced claim state so a keyboard user hears the outcome (conformance-auditor W-6).
  useEffect(() => { setDraft(row.claimText || ""); if (pendingFocus.current) { pendingFocus.current = false; stateRef.current?.focus(); } }, [row.claimText]);
  const changed = (draft.replace(/\s+/g, " ").trim() || null) !== (row.claimText || null);
  return (
    <div className="cpl-claim">
      <label htmlFor={`cpl-claim-${row.id}`}>Your claim, in your own words</label>
      <textarea id={`cpl-claim-${row.id}`} data-testid="cpl-claim-input" value={draft} maxLength={CLAIM_MAX} disabled={disabled} placeholder="Not pre-filled. State what this excerpt shows, or leave empty." onChange={(event) => setDraft(event.target.value)} />
      <div className="cpl-claimRow">
        <span data-testid="cpl-claim-state" ref={stateRef} tabIndex={-1} role="status" aria-live="polite">{row.claimText ? `Claim recorded · ${row.claimOrigin}` : "No claim stated yet"} · {draft.length.toLocaleString()} / {CLAIM_MAX}</span>
        <button type="button" data-testid="cpl-claim-save" disabled={disabled || !changed} onClick={() => { pendingFocus.current = true; onChange(row.id, draft); }}>Save claim</button>
      </div>
    </div>
  );
}

export default function CandidateProofLedger({ ledger, currentSourceId, onLedgerChange }) {
  const rows = useMemo(() => ledgerRows(ledger, { currentSourceId }), [ledger, currentSourceId]);
  const counts = useMemo(() => ledgerCounts(ledger), [ledger]);
  const staleCount = counts.STALE || 0;
  const staleOnCurrent = rows.filter((r) => r.state === "STALE" && r.onCurrentSource).length;
  const staleOnEarlier = staleCount - staleOnCurrent;
  const refusals = Array.isArray(ledger?.refusals) ? ledger.refusals : [];
  const events = Array.isArray(ledger?.events) ? ledger.events : [];
  // Choices are applied as UPDATERS against the live ledger, never as a value computed from the
  // prop captured at render, so a choice can never clobber an evidence fold dispatched in the same
  // batch (conformance-auditor W-1). The updater is PURE: the notice a user reads is derived from
  // the ledger that was actually kept (its refusals and its last choice event), in an effect, so
  // no render React discards can produce words about an outcome it did not keep (Supervisor
  // finding on b12b2af). With no change handler the controls are disabled rather than silently
  // discarding choices (D7).
  const readOnly = typeof onLedgerChange !== "function";
  const seen = useRef({ refusals: refusals.length, events: events.length });
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    const before = seen.current;
    seen.current = { refusals: refusals.length, events: events.length };
    if (refusals.length > before.refusals) { const last = refusals[refusals.length - 1]; setNotice({ kind: "refused", text: `Refused: ${last.detail}` }); return; }
    if (events.length > before.events) {
      const last = events[events.length - 1];
      if (last.kind === "PROOF_TYPE_SET") setNotice({ kind: "applied", text: `Proof type recorded at ${last.at}` });
      else if (last.kind === "CLAIM_SET") setNotice({ kind: "applied", text: `Claim recorded at ${last.at}` });
    }
  }, [refusals.length, events.length, refusals, events]);
  const choose = (mutate) => {
    const at = new Date().toISOString();
    onLedgerChange((current) => mutate(current, at).ledger);
  };
  return (
    <section className="cpl-root" data-testid="candidate-proof-ledger" aria-label="Candidate proof ledger" data-record-count={rows.length} data-stale-count={staleCount}>
      <style>{`
        .cpl-root{margin:0 clamp(14px,1.05vw,28px) 12px;border:1px solid #dfe5ec;border-radius:9px;background:#fff;padding:11px 12px;color:#1a202c}.cpl-root *{box-sizing:border-box;min-width:0}.cpl-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.cpl-head b{display:block;margin-top:2px;font-size:12px}.cpl-counts{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.cpl-counts span{border:1px solid #cbd5e1;border-radius:999px;padding:2px 7px;font-size:7px;font-weight:900;color:#475569}.cpl-note{margin:7px 0 0;color:#475569;font-size:8px;line-height:1.4}.cpl-note[data-kind="stale"]{border-left:3px solid #64748b;padding-left:7px;color:#1a202c;font-weight:900}.cpl-empty{margin-top:8px;border:1px dashed #b7c3d2;border-radius:8px;padding:10px;color:#475569;font-size:9px;line-height:1.4}.cpl-list{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.cpl-row{border:1px solid #cbd5e1;border-left:3px solid #1a56db;border-radius:8px;padding:8px 9px;display:grid;gap:6px}.cpl-row[data-state="STALE"]{border-style:dashed;border-left-color:#64748b}.cpl-row[data-state="WITHHELD"]{border-left-color:#92400e;border-style:dotted}.cpl-id{font:7px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#475569;word-break:break-all}.cpl-state{font-size:8px;font-weight:900;color:#1a202c}.cpl-label{display:block;font-size:8px;font-weight:900;color:#475569}.cpl-row blockquote{margin:2px 0 0;padding:0 0 0 6px;border-left:2px solid #e2e8f0;font-size:9px;line-height:1.35;white-space:pre-wrap;max-height:96px;overflow:auto}.cpl-claim label{display:block;font-size:8px;font-weight:900;color:#475569;margin-bottom:3px}.cpl-claim textarea{width:100%;min-height:44px;border:1px solid #cbd5e1;border-radius:7px;padding:6px 8px;font:9px/1.4 Inter,Arial,sans-serif;resize:vertical}.cpl-claimRow{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px;font-size:8px;color:#475569}.cpl-claimRow span{min-width:0;overflow:hidden;text-overflow:ellipsis}.cpl-claimRow button{flex-shrink:0;min-width:44px}.cpl-root button,.cpl-root select{min-height:44px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:5px 8px;font-size:8px;font-weight:900;cursor:pointer;color:#1a202c}.cpl-root button:disabled{cursor:not-allowed;opacity:.48}.cpl-type{display:grid;gap:3px}.cpl-type select{width:100%}.cpl-type small{font-size:7px;color:#475569}.cpl-list ul{margin:2px 0 0;padding-left:14px;font-size:8px;line-height:1.4;color:#1a202c}.cpl-meta{font-size:8px;color:#475569;line-height:1.4}.cpl-root textarea:focus-visible,.cpl-root button:focus-visible,.cpl-root select:focus-visible,.cpl-root summary:focus-visible{outline:3px solid #1a56db;outline-offset:2px}.cpl-events{font-size:8px;color:#475569}.cpl-events summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:900}.cpl-events ol{margin:2px 0 0;padding-left:14px;line-height:1.4}
      `}</style>
      <div className="cpl-head"><div><div className="wu-srcid">CANDIDATE PROOF LEDGER · SESSION ONLY</div><b>Proof records</b></div><span className="cpl-state" data-testid="cpl-total">{rows.length} record{rows.length === 1 ? "" : "s"}</span></div>
      <div className="cpl-counts" data-testid="cpl-counts">{["CLAIMED_ONLY", "STALE", "WITHHELD", "DEMONSTRATED", "CERTIFIED", "CONFLICTING"].filter((s) => counts[s]).map((s) => <span key={s} data-state={s}>{counts[s]} {s} · {STATE_TEXT[s]}</span>)}</div>
      <p className="cpl-note">Each record is one exact excerpt you confirmed, kept with its source and span ids. Nothing here is stored beyond this session, and nothing is inferred about what an excerpt proves: the claim is yours to state, the proof type is yours to choose, and links and destinations arrive with later requirements.</p>
      {readOnly && <p className="cpl-note" data-testid="cpl-readonly">This ledger is read-only here: no change handler is connected, so proof types and claims cannot be recorded on this surface.</p>}
      {staleCount > 0 && <p className="cpl-note" data-kind="stale" data-testid="cpl-stale-note" role="status" aria-live="polite">{staleOnEarlier > 0 ? `The pasted text changed, so every record cut from the earlier text is stale together (${staleOnEarlier}); the app did not examine proofs one by one. Mark the excerpts again on the current text, or restore the earlier text to resume them.` : ""}{staleOnCurrent > 0 ? ` ${staleOnCurrent} stale record${staleOnCurrent === 1 ? " is" : "s are"} cut from the text now in the box but no longer marked on it; mark ${staleOnCurrent === 1 ? "that excerpt" : "those excerpts"} again to resume.` : ""}</p>}
      <div className="cpl-note" data-testid="cpl-notice" data-kind={notice?.kind || ""} role="status" aria-live="polite">{notice ? notice.text : ""}</div>
      {refusals.length > 0 && <p className="cpl-note" data-kind="stale" data-testid="cpl-refusals">{refusals.length} evidence payload{refusals.length === 1 ? " was" : "s were"} refused by the ledger and changed no record (last: {refusals[refusals.length - 1].detail}).</p>}
      {!rows.length && <div className="cpl-empty" data-testid="cpl-empty">No proof records yet. Confirm evidence above and each excerpt becomes a record here.</div>}
      {rows.length > 0 && (
        <ul className="cpl-list" aria-label="Proof records">
          {rows.map((row) => (
            <li key={row.id} className="cpl-row" data-testid="cpl-record" data-proof-id={row.id} data-state={row.state} data-source-id={row.sourceId} data-span-id={row.spanId} data-proof-type={row.proofType} data-current-source={currentSourceId && currentSourceId === row.sourceId ? "true" : "false"}>
              <div className="cpl-state" data-testid="cpl-record-state">{row.state} · {row.state === "STALE" && row.onCurrentSource ? "stale: no longer marked on the text now in the box" : STATE_TEXT[row.state]}</div>
              <div className="cpl-id">{row.id}<br />{row.spanId}</div>
              <div><span className="cpl-label">What the document says · characters {row.start}-{row.end}{row.unstructured ? " · whole pasted text, no exact excerpt marked" : ""}</span><blockquote data-testid="cpl-excerpt">{row.excerptText}</blockquote></div>
              <ClaimField row={row} disabled={readOnly} onChange={(id, text) => choose((current, at) => setClaimText(current, id, text, at))} />
              <div className="cpl-type">
                <label htmlFor={`cpl-type-${row.id}`} className="cpl-label">Proof type (your choice)</label>
                <select id={`cpl-type-${row.id}`} data-testid="cpl-type-select" value={row.proofType} disabled={readOnly} onChange={(event) => { const value = event.target.value; choose((current, at) => setProofType(current, row.id, value, at)); }}>
                  {PROOF_TYPE.map((type) => <option key={type} value={type}>{PROOF_TYPE_LABEL[type]}</option>)}
                </select>
                <small>Vocabulary status: {PROOF_TYPE_VOCABULARY_STATUS === "PROVISIONAL_PENDING_HUMAN_LEAD" ? "provisional, pending the Human Lead's confirmation" : PROOF_TYPE_VOCABULARY_STATUS}</small>
              </div>
              <div className="cpl-meta" data-testid="cpl-confirmation">Confirmed by {row.confirmation.confirmedByDisplayName || LOCAL_HUMAN_ACTOR.displayName} at {row.confirmation.confirmedAt} · recorded {row.recordedAt}</div>
              <div><span className="cpl-label" id={`cpl-missing-label-${row.id}`}>Missing evidence</span><ul data-testid="cpl-missing" aria-labelledby={`cpl-missing-label-${row.id}`}>{row.missingEvidence.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><span className="cpl-label" id={`cpl-uses-label-${row.id}`}>Downstream uses</span><ul data-testid="cpl-uses" aria-labelledby={`cpl-uses-label-${row.id}`}>{row.downstreamUses.text.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <details className="cpl-events"><summary>History · {row.events.length} event{row.events.length === 1 ? "" : "s"}</summary><ol data-testid="cpl-events">{row.events.map((event, i) => <li key={`${event.at}-${i}`}>{event.at} · {event.kind}{event.from !== null || event.to !== null ? ` (${event.from ?? "none"} to ${event.to ?? "none"})` : ""} · {event.reason} · {event.actor === LOCAL_HUMAN_ACTOR.id ? LOCAL_HUMAN_ACTOR.displayName : event.actor}{event.detail ? ` · ${event.detail}` : ""}</li>)}</ol></details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
