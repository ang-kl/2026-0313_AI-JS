import React, { useEffect, useMemo, useState } from "react";
import ReviewStudioLegacy from "./ReviewStudioLegacy.jsx";
import WorkUniverseLanding from "./work-universe/WorkUniverseLanding.jsx";
import { applyEvidenceToLedger, createEmptyLedger, reconcileLinks, catalogueKey, guardLedgerStep } from "./work-universe/candidateProofLedgerData.js";
import { buildResultEvidence } from "./contracts/evidenceAdapter.js";

// Preserve the named helper contract consumed by App.jsx. The Step 3 wrapper
// changes only the default surface; deterministic helpers continue to come from
// the preserved implementation.
export { rsNormTitle, rsJaccard, rsTokens, rsEmpTypeBucket } from "./ReviewStudioLegacy.jsx";

function workspaceIntentKey(intent) {
  if (!intent) return "evidence";
  if (typeof intent === "string") return intent;
  if (intent.kind === "roleGraph") return "roleGraph";
  if (intent.kind === "print") return "print";
  if (intent.kind === "evidence") return `evidence-${intent.evidenceId || "selected"}`;
  if (intent.kind === "graph") return `graph-${intent.graphId || "selected"}`;
  return "evidence";
}

// v3.1 Step 3 is one persistent experience with two surfaces:
//   Work Universe -> existing evidence workspace (Role Graph + FAB + O-I-A)
// Both surfaces stay mounted after the workspace is first opened. That matters:
// returning to the Work Universe must not reset either the selected graph/signal
// or the existing Role Graph/FAB workspace state.
export default function ReviewStudio(props) {
  const [surface, setSurface] = useState("universe");
  const [workspaceMounted, setWorkspaceMounted] = useState(false);
  const [workspaceIntent, setWorkspaceIntent] = useState(null);
  const [personEvidenceOverride, setPersonEvidenceOverride] = useState(undefined);
  // BLP-008: the candidate-proof ledger remembers records across edits, so it lives beside the
  // payload (a cleared payload is null) in this session-only state; nothing reaches browser storage.
  const [proofLedger, setProofLedger] = useState(createEmptyLedger);
  // BLP-009: the posting's canonical evidence bundle (BLP-003) is the catalogue of link targets;
  // the same bundle the Work Universe reads, built once here so the ledger and the surfaces
  // address a duty by the same id.
  const proofBundle = useMemo(() => ((props.result && props.result.evidence && props.result.evidence.adapterVersion) ? props.result.evidence : buildResultEvidence(props.result, props.posting)), [props.result, props.posting]);
  // Keyed on the linkable CATALOGUE (target ids, texts, parentage), not only on the posting's
  // identity: a duty list re-distilled from the same text changes every duty id while the source
  // id and text hash stay put (conformance-auditor C-1).
  const bundleKey = useMemo(() => catalogueKey(proofBundle), [proofBundle]);
  // A reconcile that cannot produce a valid ledger THROWS by design (it never hands back stored link
  // state as current). There is no error boundary in this tree, so the throw is caught at this
  // boundary as a PURE VALUE (guardLedgerStep): the fault is recorded on the kept ledger, governed by
  // validateLedger, and the panel derives its withheld sentence from that ledger and nothing else. No
  // state setter runs inside an updater: React may run an updater more than once and discard a pass,
  // and words about a ledger that was never kept must never be committed or cleared from one
  // (Supervisor finding on ff4c7c0, the same class as the BLP-008 notice finding). The clock is read
  // once at the boundary, never inside the updater.
  const handlePersonEvidenceChange = (evidence) => {
    // The clock is read once, at this boundary, never inside the updater (React may run an
    // updater more than once); the fold itself is pure.
    const at = new Date().toISOString();
    setPersonEvidenceOverride(evidence);
    setProofLedger((ledger) => guardLedgerStep(ledger, (l) => applyEvidenceToLedger(l, evidence, at, { bundle: proofBundle }), at));
  };
  // When the posting evidence changes, every link is re-judged by the system against it.
  useEffect(() => {
    const at = new Date().toISOString();
    setProofLedger((ledger) => (ledger.records.some((r) => (r.links || []).length) ? guardLedgerStep(ledger, (l) => reconcileLinks(l, proofBundle, at), at) : ledger));
  }, [bundleKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // The panel hands back an UPDATER so its choices always run against the live ledger.
  const handleProofLedgerChange = (updater) => { const at = new Date().toISOString(); setProofLedger((ledger) => (typeof updater === "function" ? guardLedgerStep(ledger, updater, at) : ledger)); };
  const [governanceReviewState, setGovernanceReviewState] = useState({});
  const governanceSubjectKey = props.posting?.uuid || `${props.title || ""}::${props.employer || ""}::${props.source || ""}`;
  useEffect(() => setGovernanceReviewState({}), [governanceSubjectKey]);
  const effectiveResult = useMemo(() => ({
    ...props.result,
    ...(personEvidenceOverride === undefined ? {} : { personEvidence: personEvidenceOverride }),
    governanceReviewState,
  }), [props.result, personEvidenceOverride, governanceReviewState]);

  const openWorkspace = (intent) => {
    setWorkspaceIntent(intent || { kind: "evidence" });
    setWorkspaceMounted(true);
    setSurface("workspace");
  };

  return (
    <>
      <div
        data-testid="v31-universe-surface"
        aria-hidden={surface === "universe" ? undefined : "true"}
        style={{ display: surface === "universe" ? "block" : "none" }}
      >
        <WorkUniverseLanding
          result={effectiveResult}
          title={props.title}
          employer={props.employer}
          source={props.source}
          band={props.band}
          posting={props.posting}
          rolePane={props.rolePane}
          aiMomentsPane={props.aiMomentsPane}
          onBack={props.onBack}
          onEnterStudio={(intent) => openWorkspace(intent || { kind: "evidence" })}
          onPrintPackage={() => openWorkspace({ kind: "print" })}
          onPersonEvidenceChange={handlePersonEvidenceChange}
          proofLedger={proofLedger}
          proofBundle={proofBundle}
          onProofLedgerChange={handleProofLedgerChange}
          onGovernanceDecisionChange={(key, status) => setGovernanceReviewState((current) => ({ ...current, [key]: status }))}
        />
      </div>

      {workspaceMounted && (
        <div
          data-testid={`v31-workspace-${workspaceIntentKey(workspaceIntent)}`}
          aria-hidden={surface === "workspace" ? undefined : "true"}
          style={{ display: surface === "workspace" ? "block" : "none", position: "relative" }}
        >
          <button
            data-testid="return-work-universe"
            type="button"
            onClick={() => setSurface("universe")}
            aria-label="Return to the Work Universe"
            style={{
              // BLP-003 phone-width round trip: the sticky site header is taller than 72px at
              // phone width (95px at 430px), so a fixed top of 72 put this button under it and
              // return navigation could not be tapped. App.jsx measures the header into
              // --site-header-height; sit just below it at every width.
              position: "fixed", right: 14, top: "calc(var(--site-header-height, 72px) + 8px)", zIndex: 100040,
              minHeight: 44, padding: "0 14px", borderRadius: 999,
              border: "1px solid #b7c8c6", background: "rgba(251,250,246,.96)",
              color: "#17343a", fontSize: 12, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 6px 18px rgba(15,23,42,.16)", backdropFilter: "blur(7px)",
            }}
          >
            ← Work Universe
          </button>
          <ReviewStudioLegacy {...props} result={effectiveResult} initialIntent={workspaceIntent} />
        </div>
      )}
    </>
  );
}
