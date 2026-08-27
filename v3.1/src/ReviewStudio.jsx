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
  const [aiMomentsMounted, setAiMomentsMounted] = useState(false);
  const [workspaceIntent, setWorkspaceIntent] = useState(null);

  const openWorkspace = (intent) => {
    setWorkspaceIntent(intent || { kind: "evidence" });
    setWorkspaceMounted(true);
    setSurface("workspace");
  };
  const openAiMoments = () => {
    setAiMomentsMounted(true);
    setSurface("ai-moments");
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
          onOpenAiMoments={openAiMoments}
          onPrintPackage={() => openWorkspace({ kind: "print" })}
        />
      </div>

      {aiMomentsMounted && (
        <section
          data-testid="v31-ai-moments-surface"
          aria-hidden={surface === "ai-moments" ? undefined : "true"}
          style={{ display: surface === "ai-moments" ? "block" : "none", minHeight: "calc(100dvh - 64px)", background: "#fbfaf6", color: "#17343a" }}
        >
          <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px clamp(16px,3vw,42px)", borderBottom: "1px solid #d7dedc", background: "rgba(251,250,246,.96)", backdropFilter: "blur(8px)" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "#1a56db", fontWeight: 900 }}>Organisation Work Graph → Organisation Map → AI Moments</div>
              <div style={{ marginTop: 2, fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 800 }}>Cards | Neural</div>
            </div>
            <button
              data-testid="return-organisation-map"
              type="button"
              onClick={() => setSurface("universe")}
              style={{ minHeight: 44, padding: "0 14px", borderRadius: 999, border: "1px solid #b7c8c6", background: "#fff", color: "#17343a", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            >
              ← Organisation Map
            </button>
          </header>
          <div style={{ width: "min(1180px,calc(100% - 32px))", margin: "0 auto", padding: "22px 0 48px" }}>
            <div style={{ marginBottom: 14, padding: "12px 14px", border: "1px solid #d7dedc", borderRadius: 10, background: "#fff", fontSize: 12, lineHeight: 1.55, color: "#596878" }}>
              AI Moments are derived from supplied employer postings and duty evidence. They suggest work that may be augmented or automated; they do not grade organisation maturity, staffing quality, or readiness.
            </div>
            {props.aiMomentsPane || <div style={{ padding: 18, border: "1px dashed #b7c8c6", borderRadius: 10, background: "#fff", fontSize: 13 }}>Organisation evidence is unavailable, so AI Moments are withheld.</div>}
          </div>
        </section>
      )}

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
