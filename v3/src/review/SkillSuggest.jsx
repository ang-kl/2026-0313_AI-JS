// Brick 2 - Step 3 "adjacent skills" panel. Given the role's identified skills, it asks
// the GCN substrate service (via /api/suggest) which skills real employers pair with this
// role, and shows them with SOURCE provenance. Deterministic + sourced: the engine authors
// every score; this component only renders. Withhold-over-invent: on any failure it shows a
// quiet "offline" note, never a fabricated suggestion.
//
// Accessibility (spec Section 7): provenance is coded by SHAPE + TEXT, never colour (the
// Human Lead cannot distinguish colours); no red/green; 44px collapse target; aria-live on
// the async region; every artifact carries a Source / method / "AI-assisted, human decides"
// footer. The service currently serves SYNTHETIC sample data - a loud DEMO badge says so, so
// a placeholder is never mistaken for a real suggestion.
import { useState, useEffect } from "react";

// Shape glyphs for source (NOT colour): ESCO = filled diamond, MCF = filled circle.
function SourceChips({ fromEsco, fromMcf }) {
  const chip = (glyph, label, title) => (
    <span title={title}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid #b8b2a6",
               borderRadius: 6, padding: "1px 7px", fontSize: "0.6875rem", color: "#2c2c2c", background: "#fff" }}>
      <span aria-hidden="true" style={{ fontSize: "0.8rem", lineHeight: 1 }}>{glyph}</span>{label}
    </span>
  );
  return (
    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
      {fromEsco && chip("◆", "ESCO relation", "This skill shares an occupation with the role in ESCO")}
      {fromMcf && chip("●", "in real postings", "This skill co-occurs with the role's skills in MyCareersFuture postings")}
    </span>
  );
}

export function SkillSuggest({ skills }) {
  const [state, setState] = useState({ status: "idle" });
  const [open, setOpen] = useState(true);
  const key = (skills || []).join("|");

  useEffect(() => {
    if (!skills || skills.length === 0) { setState({ status: "empty" }); return; }
    let cancelled = false;
    setState({ status: "loading" });
    fetch("/api/suggest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ skills, top: 8 }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d || !d.ok) { setState({ status: "unavailable" }); return; }
        // C1 - enforce provenance at the client: a suggestion with no recognised source
        // (esco/mcf) is an unsourced, fabrication-shaped row; drop it rather than render a
        // bare skill. The panel's whole claim is "sourced + disclosed", so we never trust
        // the service to always be well-behaved.
        const KNOWN = new Set(["esco", "mcf"]);
        const sourced = (Array.isArray(d.suggestions) ? d.suggestions : [])
          .filter((s) => Array.isArray(s.sources) && s.sources.some((t) => KNOWN.has(t)));
        setState({
          status: "ok",
          suggestions: sourced,
          // C2 - fail SAFE, not open: treat anything but an explicit `false` as synthetic
          // (show the DEMO badge). A dropped flag must never present sample data as real.
          synthetic: d.synthetic !== false,
          unmatched: Array.isArray(d.unmatched) ? d.unmatched : [],
        });
      })
      .catch(() => { if (!cancelled) setState({ status: "unavailable" }); });
    return () => { cancelled = true; };
  }, [key]);

  // Nothing to ask about, or the service is unreachable: stay quiet rather than invent.
  if (state.status === "empty") return null;
  if (state.status === "unavailable") return null;

  const hasSuggestions = state.status === "ok" && state.suggestions.length > 0;
  const loading = state.status === "loading";
  // A real "ok" with zero suggestions is an honest empty, not an error.
  if (state.status === "ok" && !hasSuggestions) return null;

  const kick = { fontFamily: "'Inter',sans-serif", fontSize: "0.6875rem", fontWeight: 700,
                 letterSpacing: ".12em", color: "#6b6357", textTransform: "uppercase" };

  return (
    <section aria-label="Adjacent skills employers pair with this role"
      style={{ marginTop: 28, border: "1px solid #e6e3db", borderRadius: 12, background: "#fbfaf8", overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
                 gap: 12, padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span>
          <span style={kick}>Adjacent skills {String.fromCharCode(0x00b7)} substrate</span>
          <span style={{ display: "block", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "#16202e", marginTop: 2 }}>
            Skills employers pair with this role
          </span>
        </span>
        <span aria-hidden="true" style={{ fontSize: "0.8rem", color: "#6b6357" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "4px 16px 16px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.8125rem", color: "#4a5464", lineHeight: 1.5 }}>
            Beyond the duties above, these skills tend to appear alongside this role. Each is tagged with why.
          </p>

          {/* S1 - the DEMO caveat lives INSIDE the announced region, so a screen-reader user
              never hears suggestions without the "sample data" disclosure. */}
          <div aria-live="polite">
            {state.synthetic && (
              <p role="note" style={{ margin: "0 0 12px", padding: "7px 11px", border: "1px dashed #9a6113",
                   borderRadius: 8, background: "#fff", fontSize: "0.75rem", color: "#7a4d0f", fontWeight: 600 }}>
                {String.fromCharCode(0x26A0)} DEMO {String.fromCharCode(0x00b7)} sample data {String.fromCharCode(0x2014)} these are illustrative, not real suggestions yet (the ESCO + MyCareersFuture harvest is not wired in).
              </p>
            )}

            {loading && <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>Finding adjacent skills{String.fromCharCode(0x2026)}</p>}

            {hasSuggestions && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {state.suggestions.map((s) => (
                  <li key={s.skill}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                             background: "#fff", border: "1px solid #e6e3db", borderRadius: 9, padding: "9px 13px" }}>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#16202e" }}>{s.skill}</span>
                    <SourceChips fromEsco={(s.sources || []).includes("esco")} fromMcf={(s.sources || []).includes("mcf")} />
                  </li>
                ))}
              </ul>
            )}

            {/* S3 - honest coverage signal: which of the role's skills the substrate did not
                recognise (its vocabulary is limited, especially on the synthetic sample). */}
            {hasSuggestions && state.unmatched.length > 0 && (
              <p style={{ margin: "10px 0 0", fontSize: "0.6875rem", color: "#8a8578", lineHeight: 1.5 }}>
                Not yet in the substrate vocabulary: {state.unmatched.join(", ")} {String.fromCharCode(0x2014)} coverage grows as the corpus does.
              </p>
            )}
          </div>

          {/* Source / method / AI-assisted footer (spec Section 7 - every artifact carries it). */}
          <p style={{ margin: "12px 0 0", fontSize: "0.6875rem", color: "#8a8578", lineHeight: 1.5 }}>
            <span aria-hidden="true">{"◆"}</span> ESCO occupation{String.fromCharCode(0x2013)}skill relations {String.fromCharCode(0x00b7)}{" "}
            <span aria-hidden="true">{"●"}</span> MyCareersFuture posting co-occurrence {String.fromCharCode(0x00b7)}{" "}
            engine-authored (deterministic, no LLM) {String.fromCharCode(0x00b7)} AI-assisted; you decide what fits.
          </p>
        </div>
      )}
    </section>
  );
}
