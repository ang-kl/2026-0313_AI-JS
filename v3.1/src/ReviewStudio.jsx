import React, { useState } from "react";
import ReviewStudioLegacy from "./ReviewStudioLegacy.jsx";
import WorkUniverseLanding from "./work-universe/WorkUniverseLanding.jsx";

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
          result={props.result}
          title={props.title}
          employer={props.employer}
          source={props.source}
          band={props.band}
          posting={props.posting}
          onBack={props.onBack}
          onEnterStudio={(intent) => openWorkspace(intent || { kind: "evidence" })}
          onOpenRoleGraph={() => openWorkspace({ kind: "roleGraph" })}
          onPrintPackage={() => openWorkspace({ kind: "print" })}
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
              position: "fixed", right: 14, top: 72, zIndex: 100040,
              minHeight: 44, padding: "0 14px", borderRadius: 999,
              border: "1px solid #b7c8c6", background: "rgba(251,250,246,.96)",
              color: "#17343a", fontSize: 12, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 6px 18px rgba(15,23,42,.16)", backdropFilter: "blur(7px)",
            }}
          >
            ← Work Universe
          </button>
          <ReviewStudioLegacy {...props} initialIntent={workspaceIntent} />
        </div>
      )}
    </>
  );
}
