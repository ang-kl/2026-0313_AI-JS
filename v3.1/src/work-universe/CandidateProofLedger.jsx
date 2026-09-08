import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PROOF_TYPE,
  PROOF_TYPE_LABEL,
  PROOF_TYPE_VOCABULARY_STATUS,
  TARGET_KIND_AVAILABILITY,
  ACTIVE_STATES,
  bundleTargets,
  judgeLink,
  ledgerCounts,
  ledgerRows,
  linkProof,
  relinkProof,
  setClaimText,
  setProofType,
  unlinkProof,
  ledgerFaultText,
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

const LINK_REASON_TEXT = {
  TARGET_SOURCE_CHANGED: "the posting evidence changed; this target belongs to the earlier posting",
  TARGET_ABSENT: "this target is no longer in the posting evidence",
  TARGET_UNTRUSTED: "this duty's parentage is no longer verified or confirmed",
  TARGET_TEXT_CHANGED: "the target's text differs from the snapshot taken at link time",
  CANDIDATE_SOURCE_CHANGED: "the proof record itself is stale or withheld; the link waits on it",
  TARGET_EVIDENCE_UNAVAILABLE: "the posting evidence could not be read, so this link was not judged; its target is unknown, not confirmed",
  TARGET_REEXTRACTED: "this target's id is gone but its exact text is still in the posting evidence under a new id after re-extraction",
};
/** What a link's live re-judgement says, in words, when it disagrees with the ledger's stored state. */
function liveText(link, live) {
  if (live.valid) return `${link.targetKind} ${live.live.label} stands against the current posting evidence; the ledger has not yet re-checked this link`;
  return `against the current posting evidence this link reads ${live.reason}: ${LINK_REASON_TEXT[live.reason] || live.reason}; the ledger has not yet re-checked it`;
}

function LinkControls({ row, catalogue, bundle, disabled, onLink, onUnlink, onRelink, onOpenEvidence }) {
  // No bundle given means NOT RE-CHECKED here, the same statement ledgerRows makes; it is not "could
  // not be read", which is what judging against nothing would say (conformance-auditor S-new-2).
  const unjudged = bundle === undefined;
  const [choice, setChoice] = useState("");
  const linkable = ACTIVE_STATES.includes(row.state);
  const already = new Set(row.links.map((l) => `${l.targetKind}|${l.targetId}`));
  const options = catalogue.targets.filter((t) => !already.has(`${t.targetKind}|${t.targetId}`));
  // A refused link keeps the choice so the user can read the refusal and try another; a link that
  // landed clears it (conformance-auditor S-6).
  useEffect(() => { if (choice && already.has(choice)) setChoice(""); }, [choice, row.links.length]); // eslint-disable-line react-hooks/exhaustive-deps
  // Defence in depth (conformance-auditor C-1): every link on an active record is re-judged against
  // the live catalogue at render; where the ledger's stored state disagrees, the row says what the
  // live judgement is and that the ledger has not yet re-checked it, instead of asserting from stored
  // state alone. A re-extracted target's re-link offer is computed here, live, never stored.
  const liveOf = (link) => (!unjudged && ACTIVE_STATES.includes(row.state) ? judgeLink(link, bundle) : null);
  const disagrees = (link, live) => live && ((link.state === "VALID") !== live.valid || (!live.valid && live.reason !== link.reason));
  return (
    <div className="cpl-links" data-testid="cpl-links">
      <span className="cpl-label" id={`cpl-links-label-${row.id}`}>Links to role evidence</span>
      {row.links.length ? (
        <ul aria-labelledby={`cpl-links-label-${row.id}`} data-testid="cpl-link-list">
          {row.links.map((link) => (
            <li key={link.id} className="cpl-link" data-testid="cpl-link" data-link-id={link.id} data-target-kind={link.targetKind} data-target-id={link.targetId} data-state={link.state} data-reason={link.reason || ""}>
              {(() => { const live = liveOf(link); const pending = disagrees(link, live); return (
              <>
              <div className="cpl-state" data-testid="cpl-link-state" data-recheck={pending ? "pending" : "current"}>{link.state} · {pending ? liveText(link, live) : link.state !== "VALID" ? (LINK_REASON_TEXT[link.reason] || link.reason) : unjudged ? "recorded VALID; link state not re-checked against the posting evidence in this view" : !live ? `recorded VALID; not checked: this proof record is ${row.state}, not active` : `${link.targetKind} ${live.live.label} stands against the current posting evidence${live.live.derivationState !== link.targetDerivationState ? ` (parentage now ${live.live.derivationState})` : ""}`}</div>
              {live && live.reason === "TARGET_REEXTRACTED" && (
                live.relink
                  ? <div className="cpl-linkRow"><button type="button" data-testid="cpl-relink" disabled={disabled} aria-label={`Re-link to ${live.relink.targetKind} ${live.relink.label}, the same text under a new id`} onClick={() => onRelink(row.id, link.id)}>Re-link to {live.relink.targetKind} {live.relink.label} (same text, new id)</button></div>
                  : <p className="cpl-meta" data-testid="cpl-relink-ambiguous">{live.matches} current {link.targetKind} rows carry this exact text; the app will not choose between them. Unlink, then link the one you mean.</p>
              )}
              </>
              ); })()}
              <div className="cpl-id">{link.targetId}</div>
              <div><span className="cpl-label">Target text as it was at link time ({link.linkedAt}), parentage then {link.targetDerivationState}; not the current text or the current parentage</span><blockquote data-testid="cpl-link-target-text">{link.targetText}</blockquote></div>
              <div className="cpl-linkRow">
                <button type="button" data-testid="cpl-link-open" disabled={!onOpenEvidence} aria-describedby={onOpenEvidence ? undefined : `cpl-link-open-why-${link.id}`} aria-label={`Open ${link.targetKind} ${link.targetId} in the evidence workspace`} onClick={() => onOpenEvidence?.(link.targetId)}>Open target in evidence workspace</button>
                <button type="button" data-testid="cpl-unlink" disabled={disabled} aria-label={`Unlink ${link.targetKind} ${link.targetId}`} onClick={() => onUnlink(row.id, link.id)}>Unlink</button>
              </div>
              {!onOpenEvidence && <p className="cpl-meta" id={`cpl-link-open-why-${link.id}`} data-testid="cpl-link-open-why">No evidence workspace is connected on this surface, so the target cannot be opened from here.</p>}
            </li>
          ))}
        </ul>
      ) : <p className="cpl-meta" data-testid="cpl-no-links">Not yet linked to a target.</p>}
      {!linkable && <p className="cpl-meta" data-testid="cpl-link-blocked">Linking waits until this proof record is active again (it is {row.state}).</p>}
      {linkable && catalogue.sourceId && (
        <div className="cpl-linkPick">
          <label htmlFor={`cpl-link-target-${row.id}`} className="cpl-label">Link to a duty or requirement from the current posting evidence</label>
          <select id={`cpl-link-target-${row.id}`} data-testid="cpl-link-select" value={choice} disabled={disabled || !options.length} onChange={(event) => setChoice(event.target.value)}>
            <option value="">{options.length ? "Choose a target" : (catalogue.targets.length ? "Every linkable target is already linked" : "No target in this posting evidence is linkable yet")}</option>
            {options.map((t) => <option key={`${t.targetKind}|${t.targetId}`} value={`${t.targetKind}|${t.targetId}`}>{t.targetKind} {t.label}: {t.text.length > 90 ? `${t.text.slice(0, 90)}…` : t.text}</option>)}
          </select>
          <button type="button" data-testid="cpl-link-button" disabled={disabled || !choice} onClick={() => { const [targetKind, targetId] = choice.split("|"); onLink(row.id, { targetKind, targetId }); }}>Link</button>
        </div>
      )}
      {linkable && !catalogue.sourceId && <p className="cpl-meta" data-testid="cpl-link-no-bundle">{catalogue.unlinkable[0]?.text || "No canonical posting evidence is available to link to."}</p>}
    </div>
  );
}

export default function CandidateProofLedger({ ledger, currentSourceId, bundle, onLedgerChange, onOpenEvidence }) {
  // The withheld sentence is derived from the faults the KEPT ledger carries, never from a value set
  // beside it: a fault is present exactly when the ledger records one unresolved (Supervisor finding on ff4c7c0).
  const fault = ledgerFaultText(ledger);
  const rows = useMemo(() => ledgerRows(ledger, { currentSourceId, bundle }), [ledger, currentSourceId, bundle]);
  const catalogue = useMemo(() => bundleTargets(bundle), [bundle]);
  const invalidOnEarlierPosting = rows.reduce((n, r) => n + r.links.filter((l) => l.state === "INVALID" && l.reason === "TARGET_SOURCE_CHANGED").length, 0);
  const notJudged = rows.reduce((n, r) => n + r.links.filter((l) => l.state === "INVALID" && l.reason === "TARGET_EVIDENCE_UNAVAILABLE").length, 0);
  const reextracted = rows.reduce((n, r) => n + r.links.filter((l) => l.state === "INVALID" && l.reason === "TARGET_REEXTRACTED").length, 0);
  const untrustedCount = catalogue.unlinkable.filter((u) => u.reason === "TARGET_UNTRUSTED").length;
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
      else if (last.kind === "LINKED") setNotice({ kind: "applied", text: `Link recorded at ${last.at} (${last.detail})` });
      else if (last.kind === "UNLINKED") setNotice({ kind: "applied", text: `Link removed at ${last.at} (${last.detail})` });
      else if (last.kind === "LINK_INVALID" || last.kind === "LINK_RESUMED") {
        // One reconcile is one batch stamped at one instant; the notice counts the whole batch, so a
        // batch that both invalidates and resumes is not announced as one of the two (conformance-auditor S-d).
        const batch = events.filter((e) => e.at === last.at && (e.kind === "LINK_INVALID" || e.kind === "LINK_RESUMED"));
        const invalid = batch.filter((e) => e.kind === "LINK_INVALID"), resumed = batch.filter((e) => e.kind === "LINK_RESUMED");
        const parts = [invalid.length ? `invalidated ${invalid.length} link${invalid.length === 1 ? "" : "s"} (${[...new Set(invalid.map((e) => e.reason))].map((r) => LINK_REASON_TEXT[r] || r).join("; ")})` : null, resumed.length ? `resumed ${resumed.length} link${resumed.length === 1 ? "" : "s"}` : null].filter(Boolean);
        // A clamped stamp is said beside the instant, not only in the event detail (conformance-auditor S-new-3).
        const clamp = (batch.map((e) => e.detail || "").find((d) => /clock read /.test(d)) || "").replace(/^.*?(clock read .*)$/, "$1");
        setNotice({ kind: invalid.length ? "refused" : "applied", text: `The system ${parts.join(" and ")} at ${last.at}${clamp ? ` (${clamp})` : ""}` });
      }
    }
  }, [refusals.length, events.length, refusals, events]);
  const choose = (mutate) => {
    const at = new Date().toISOString();
    onLedgerChange((current) => mutate(current, at).ledger);
  };
  return (
    <section className="cpl-root" data-testid="candidate-proof-ledger" aria-label="Candidate proof ledger" data-record-count={rows.length} data-stale-count={staleCount}>
      <style>{`
        .cpl-root{margin:0 clamp(14px,1.05vw,28px) 12px;border:1px solid #dfe5ec;border-radius:9px;background:#fff;padding:11px 12px;color:#1a202c}.cpl-root *{box-sizing:border-box;min-width:0}.cpl-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.cpl-head b{display:block;margin-top:2px;font-size:12px}.cpl-counts{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.cpl-counts span{border:1px solid #cbd5e1;border-radius:999px;padding:2px 7px;font-size:7px;font-weight:900;color:#475569}.cpl-note{margin:7px 0 0;color:#475569;font-size:8px;line-height:1.4}.cpl-note[data-kind="stale"]{border-left:3px solid #64748b;padding-left:7px;color:#1a202c;font-weight:900}.cpl-empty{margin-top:8px;border:1px dashed #b7c3d2;border-radius:8px;padding:10px;color:#475569;font-size:9px;line-height:1.4}.cpl-list{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.cpl-row{border:1px solid #cbd5e1;border-left:3px solid #1a56db;border-radius:8px;padding:8px 9px;display:grid;gap:6px}.cpl-row[data-state="STALE"]{border-style:dashed;border-left-color:#64748b}.cpl-row[data-state="WITHHELD"]{border-left-color:#92400e;border-style:dotted}.cpl-id{font:7px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#475569;word-break:break-all}.cpl-state{font-size:8px;font-weight:900;color:#1a202c}.cpl-label{display:block;font-size:8px;font-weight:900;color:#475569}.cpl-row blockquote{margin:2px 0 0;padding:0 0 0 6px;border-left:2px solid #e2e8f0;font-size:9px;line-height:1.35;white-space:pre-wrap;max-height:96px;overflow:auto}.cpl-claim label{display:block;font-size:8px;font-weight:900;color:#475569;margin-bottom:3px}.cpl-claim textarea{width:100%;min-height:44px;border:1px solid #cbd5e1;border-radius:7px;padding:6px 8px;font:9px/1.4 Inter,Arial,sans-serif;resize:vertical}.cpl-claimRow{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px;font-size:8px;color:#475569}.cpl-claimRow span{min-width:0;overflow:hidden;text-overflow:ellipsis}.cpl-claimRow button{flex-shrink:0;min-width:44px}.cpl-root button,.cpl-root select{min-height:44px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:5px 8px;font-size:8px;font-weight:900;cursor:pointer;color:#1a202c}.cpl-root button:disabled{cursor:not-allowed;opacity:.48}.cpl-type{display:grid;gap:3px}.cpl-type select{width:100%}.cpl-type small{font-size:7px;color:#475569}.cpl-list ul{margin:2px 0 0;padding-left:14px;font-size:8px;line-height:1.4;color:#1a202c}.cpl-meta{font-size:8px;color:#475569;line-height:1.4}.cpl-root textarea:focus-visible,.cpl-root button:focus-visible,.cpl-root select:focus-visible,.cpl-root summary:focus-visible{outline:3px solid #1a56db;outline-offset:2px}.cpl-links ul{list-style:none;margin:4px 0 0;padding:0;display:grid;gap:6px}.cpl-link{border:1px solid #cbd5e1;border-left:3px solid #1a56db;border-radius:8px;padding:6px 7px;display:grid;gap:4px}.cpl-link[data-state="INVALID"]{border-style:dashed;border-left-color:#64748b}.cpl-linkRow{display:flex;flex-wrap:wrap;gap:6px}.cpl-linkRow button{flex:1 1 140px}.cpl-linkPick{display:grid;gap:4px;margin-top:6px}.cpl-linkPick select{width:100%}.cpl-events{font-size:8px;color:#475569}.cpl-events summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:900}.cpl-events ol{margin:2px 0 0;padding-left:14px;line-height:1.4}
      `}</style>
      <div className="cpl-head"><div><div className="wu-srcid">CANDIDATE PROOF LEDGER · SESSION ONLY</div><b>Proof records</b></div><span className="cpl-state" data-testid="cpl-total">{rows.length} record{rows.length === 1 ? "" : "s"}</span></div>
      <div className="cpl-counts" data-testid="cpl-counts">{["CLAIMED_ONLY", "STALE", "WITHHELD", "DEMONSTRATED", "CERTIFIED", "CONFLICTING"].filter((s) => counts[s]).map((s) => <span key={s} data-state={s}>{counts[s]} {s} · {STATE_TEXT[s]}</span>)}</div>
      <p className="cpl-note">Each record is one exact excerpt you confirmed, kept with its source and span ids. Nothing here is stored beyond this session, and nothing is inferred about what an excerpt proves: the claim is yours to state, the proof type is yours to choose, the links to the posting's duties and requirements are yours to draw, and destinations arrive with a later requirement.</p>
      <p className="cpl-note" data-testid="cpl-link-availability">Links can target {TARGET_KIND_AVAILABILITY.duty.text} and {TARGET_KIND_AVAILABILITY.requirement.text}. Not yet linkable: skills ({TARGET_KIND_AVAILABILITY.skill.text}; {TARGET_KIND_AVAILABILITY.skill.owner}); competencies ({TARGET_KIND_AVAILABILITY.competency.text}; {TARGET_KIND_AVAILABILITY.competency.owner}); accepted review observations ({TARGET_KIND_AVAILABILITY["review-observation"].text}; owner {TARGET_KIND_AVAILABILITY["review-observation"].owner}).{untrustedCount ? ` ${untrustedCount} duty ${untrustedCount === 1 ? "row is" : "rows are"} not linkable because ${untrustedCount === 1 ? "its" : "their"} parentage is neither verified nor confirmed by you.` : ""}{catalogue.unlinkable.some((u) => u.reason === "BUNDLE_NOT_OK" || u.reason === "NO_BUNDLE") ? ` ${catalogue.unlinkable[0].text}.` : ""}</p>
      {/* The three link notes below are plain visible text, reached in reading order; the one live
          carrier for a reconcile batch is the notice, which counts the batch (a11y-honesty-reviewer:
          four polite regions announcing one instant over-announce). */}
      {invalidOnEarlierPosting > 0 && <p className="cpl-note" data-kind="stale" data-testid="cpl-links-stale-note">The posting evidence changed, so every link to the earlier posting is invalid together ({invalidOnEarlierPosting}); the app did not examine links one by one. Each keeps the target text it was linked to, for inspection, and resumes if the same posting evidence returns.</p>}
      {notJudged > 0 && <p className="cpl-note" data-kind="stale" data-testid="cpl-links-unjudged-note">The posting evidence could not be read, so {notJudged} link{notJudged === 1 ? " was" : "s were"} not judged: {notJudged === 1 ? "it is" : "they are"} unknown, not confirmed, and count as no target until the evidence can be read again. Nothing is known to have changed.</p>}
      {reextracted > 0 && <p className="cpl-note" data-kind="stale" data-testid="cpl-links-reextracted-note">{reextracted} link{reextracted === 1 ? "" : "s"} point{reextracted === 1 ? "s" : ""} at a target id that was re-extracted: the exact text is still in the posting evidence under a new id. Where exactly one current row carries that text, a re-link is offered for you to make; where more than one does, none is offered.</p>}
      {fault && <p className="cpl-note" data-kind="stale" data-testid="cpl-fault" role="status" aria-live="polite">{fault}</p>}
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
              {fault ? <p className="cpl-meta" data-testid="cpl-links-withheld">Links withheld while the ledger's integrity is in question (see the notice above).</p> : <LinkControls row={row} catalogue={catalogue} bundle={bundle} disabled={readOnly} onLink={(id, target) => choose((current, at) => linkProof(current, id, target, bundle, at))} onUnlink={(id, linkId) => choose((current, at) => unlinkProof(current, id, linkId, at))} onRelink={(id, linkId) => choose((current, at) => relinkProof(current, id, linkId, bundle, at))} onOpenEvidence={onOpenEvidence} />}
              <div><span className="cpl-label" id={`cpl-uses-label-${row.id}`}>Downstream uses</span><ul data-testid="cpl-uses" aria-labelledby={`cpl-uses-label-${row.id}`}>{row.downstreamUses.text.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <details className="cpl-events"><summary>History · {row.events.length} event{row.events.length === 1 ? "" : "s"}</summary><ol data-testid="cpl-events">{row.events.map((event, i) => <li key={`${event.at}-${i}`}>{event.at} · {event.kind}{event.from !== null || event.to !== null ? ` (${event.from ?? "none"} to ${event.to ?? "none"})` : ""} · {event.reason} · {event.actor === LOCAL_HUMAN_ACTOR.id ? LOCAL_HUMAN_ACTOR.displayName : event.actor}{event.detail ? ` · ${event.detail}` : ""}</li>)}</ol></details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
