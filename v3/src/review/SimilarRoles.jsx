// Brick 3 - Step 3 "adjacent roles" panel. Given the role's identified skills, it asks the
// GCN substrate service (via /api/similar-roles) which occupations share the most skills -
// i.e. adjacent roles / career pivots - and shows each with the shared skills as evidence.
// Deterministic and sourced (ESCO occupation<->skill overlap, MCF-posting bridge for thin
// cases); the engine authors the ranking, no LLM. This component only renders.
//
// Accessibility + honesty (spec Section 7), mirroring the skill-suggestions panel: state by
// SHAPE/TEXT not colour (the Human Lead cannot distinguish colours); no red/green; 44px
// collapse target; aria-live on the async region; a Source/Confidence/Time-window +
// "AI-assisted; human decides" footer. Withhold-over-invent: on failure/empty it renders
// nothing. A loud DEMO badge marks synthetic sample data; a "via related postings" note marks
// bridged (weaker-basis) matches.
import { useState, useEffect } from "react";

export function SimilarRoles({ skills }) {
  const [state, setState] = useState({ status: "idle" });
  const [open, setOpen] = useState(true);
  const key = (skills || []).join("|");

  useEffect(() => {
    if (!skills || skills.length === 0) { setState({ status: "empty" }); return; }
    let cancelled = false;
    setState({ status: "loading" });
    fetch("/api/similar-roles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ skills, top: 6 }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d || !d.ok) { setState({ status: "unavailable" }); return; }
        // Enforce evidence per row: a role must have a title AND at least one NAMED shared
        // skill, else drop it - never show a bare "shares N skills" with no evidence. Also
        // strip everything but the fields we render (notably the raw Jaccard score, which must
        // never reach the DOM) and coerce the count to an integer once.
        const roles = (Array.isArray(d.roles) ? d.roles : [])
          .filter((r) => r && r.title && Array.isArray(r.sharedSkills) && r.sharedSkills.some((s) => typeof s === "string" && s))
          .map((r) => ({
            title: String(r.title),
            shared: r.shared | 0,
            sharedSkills: r.sharedSkills.filter((s) => typeof s === "string" && s),
          }));
        setState({
          status: "ok",
          roles,
          synthetic: d.synthetic !== false,   // fail SAFE: only an explicit false clears the DEMO badge
          // The substrate emits `bridged` on EVERY response and it is all-or-nothing (the whole
          // result set is either direct-ESCO or all MCF-bridged - server.cpp only sets it true
          // when the entire ranking came from the fallback), so a single panel-level banner is
          // correct and `=== true` is safe (the flag is never absent when genuinely bridged).
          bridged: d.bridged === true,
          unmatched: Array.isArray(d.unmatched) ? d.unmatched : [],
        });
      })
      .catch(() => { if (!cancelled) setState({ status: "unavailable" }); });
    return () => { cancelled = true; };
  }, [key]);

  if (state.status === "empty" || state.status === "unavailable") return null;
  const hasRoles = state.status === "ok" && state.roles.length > 0;
  const loading = state.status === "loading";
  if (state.status === "ok" && !hasRoles) return null;   // honest empty -> render nothing

  const kick = { fontFamily: "'Inter',sans-serif", fontSize: "0.6875rem", fontWeight: 700,
                 letterSpacing: ".12em", color: "#6b6357", textTransform: "uppercase" };

  return (
    <section aria-label="Adjacent roles that share skills with this one"
      style={{ marginTop: 16, border: "1px solid #e6e3db", borderRadius: 12, background: "#fbfaf8", overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
                 gap: 12, padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span>
          <span style={kick}>Adjacent roles {String.fromCharCode(0x00b7)} substrate</span>
          <span style={{ display: "block", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "#16202e", marginTop: 2 }}>
            Roles that share skills with this one
          </span>
        </span>
        <span aria-hidden="true" style={{ fontSize: "0.8rem", color: "#6b6357" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "4px 16px 16px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.8125rem", color: "#4a5464", lineHeight: 1.5 }}>
            Occupations whose skills overlap this role - a starting point for adjacent moves. Each shows the skills they share.
          </p>

          {/* Caveats live INSIDE the announced region so a screen-reader user hears them with the roles. */}
          <div aria-live="polite">
            {state.synthetic && (
              <p role="note" style={{ margin: "0 0 12px", padding: "7px 11px", border: "1px dashed #9a6113",
                   borderRadius: 8, background: "#fff", fontSize: "0.75rem", color: "#7a4d0f", fontWeight: 600 }}>
                {String.fromCharCode(0x26A0)} DEMO {String.fromCharCode(0x00b7)} sample data - illustrative, not real matches yet (the ESCO + MyCareersFuture harvest is not wired in).
              </p>
            )}
            {!state.synthetic && state.bridged && (
              <p role="note" style={{ margin: "0 0 12px", fontSize: "0.75rem", color: "#4a5464", fontWeight: 600 }}>
                Matched via related postings (skill co-occurrence), not direct occupation data - a looser basis.
              </p>
            )}

            {loading && <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>Finding adjacent roles{String.fromCharCode(0x2026)}</p>}

            {hasRoles && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {state.roles.map((r) => (
                  <li key={r.title}
                    style={{ background: "#fff", border: "1px solid #e6e3db", borderRadius: 9, padding: "9px 13px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#16202e" }}>{r.title}</span>
                      <span style={{ fontSize: "0.6875rem", color: "#6b6357", flex: "none" }}>shares {r.shared} skill{r.shared === 1 ? "" : "s"}</span>
                    </div>
                    {/* Disclose truncation: when the count exceeds the names shown, say the list
                        is a sample ("including:") rather than imply it is the full set. */}
                    <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#4a5464", lineHeight: 1.5 }}>
                      {r.shared > r.sharedSkills.length ? "including: " : ""}{r.sharedSkills.join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {/* Parity with the skills panel: disclose which of the role's skills the substrate
                did not recognise (its vocabulary is limited), an honest coverage signal. */}
            {hasRoles && state.unmatched.length > 0 && (
              <p style={{ margin: "10px 0 0", fontSize: "0.6875rem", color: "#8a8578", lineHeight: 1.5 }}>
                Not matched to the substrate vocabulary: {state.unmatched.join(", ")}.
              </p>
            )}
          </div>

          {/* Source / Confidence / Time-window + the literal "AI-assisted; human decides" (spec Section 7). */}
          <p style={{ margin: "12px 0 0", fontSize: "0.6875rem", color: "#8a8578", lineHeight: 1.5 }}>
            AI-assisted; human decides. Source: substrate service (ESCO occupation-skill overlap{state.bridged ? " + MyCareersFuture posting co-occurrence" : ""}).{" "}
            Confidence: {state.synthetic ? "demo / sample data, not substrate-computed" : "engine-computed (deterministic skill-set overlap, no LLM)"}.{" "}
            Time-window: this session.
          </p>
        </div>
      )}
    </section>
  );
}
