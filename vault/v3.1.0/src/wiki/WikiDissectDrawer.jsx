// WikiDissectDrawer.jsx - the LEFT floating overlay opened by the "Job ad" FAB.
// Shows the raw posting context + the O-I-A dissection drawn ON it: each duty is a theme-coloured,
// tappable MARKING. Tap a marking -> the centre canvas focuses that theme and the right graph
// highlights that duty (onMarkingTap drives the host's selectedId + scroll). Read/expand by tapping.
// Render-only over the themed payload + the verbatim posting; deterministic; the LLM gloss only renames
// a theme label. No red/green - theme tints are decorative (the label is the cue). R007: ASCII only in JSX.

const C = { surface: "#ffffff", border: "#e3e9f1", text: "#1a202c", textSub: "#4a5568", muted: "#5b6878", accent: "#1a56db" };

// Decorative theme tints (same rotation as the canvas; colour-blind safe, label is the cue).
const TINTS = [
  { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1e40af" },
  { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0e7490" },
  { bg: "#f5f3ff", bd: "#ddd6fe", fg: "#6d28d9" },
  { bg: "#fff7ed", bd: "#fed7aa", fg: "#c2410c" },
  { bg: "#f0fdfa", bd: "#99f6e4", fg: "#0f766e" },
  { bg: "#fdf4ff", bd: "#f5d0fe", fg: "#a21caf" },
];
const LEVEL_LABEL = { HUMAN: "Human-Led", LOW: "AI-Assisted", MEDIUM: "AI-Augmented", HIGH: "Full Automation" };

function stripHtml(s) { return String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }

export default function WikiDissectDrawer({ open, onClose, topics, dutyMeta, nodeMap, glosses, result, onMarkingTap }) {
  if (!open) return null;

  const jobs = (result && result.responsibilitiesData && result.responsibilitiesData.jobs) || [];
  const job = jobs.find(function(j) { return j && (j.description || j.responsibilitiesText); }) || jobs[0] || null;
  const rawIntro = job ? stripHtml(job.description || job.responsibilitiesText).slice(0, 520) : null;
  const employer = job && (job.hiringCompanyName || job.postedCompanyName || job.employer);

  return (
    <div>
      {/* Backdrop - tap to close */}
      <div onClick={onClose} aria-hidden="true"
        style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.45)", zIndex: 1200 }} />

      {/* Drawer panel - slides over the left edge */}
      <aside role="dialog" aria-modal="true" aria-label="Job ad, dissected"
        style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "min(440px, 92vw)", background: C.surface,
          borderRight: `1px solid ${C.border}`, boxShadow: "6px 0 26px rgba(2,6,23,0.18)", zIndex: 1201,
          overflowY: "auto", display: "flex", flexDirection: "column", fontFamily: "system-ui,-apple-system,sans-serif" }}>

        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Job ad, dissected</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.6875rem", color: C.muted }}>Tap a marking to focus it in the canvas + graph</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close the dissected job ad"
            style={{ minHeight: 44, minWidth: 44, border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface, color: C.text, fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer" }}>
            Close
          </button>
        </div>

        <div style={{ padding: "12px 16px 24px" }}>
          {/* Raw posting context (verbatim from MCF) */}
          {rawIntro && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 5px", fontSize: "0.625rem", fontWeight: 800, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                The posting{employer ? " - " + employer : ""} <span style={{ fontWeight: 700, color: C.muted }}>(verbatim from MCF)</span>
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: C.textSub, lineHeight: 1.55, background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
                {rawIntro}{rawIntro.length >= 520 ? "..." : ""}
              </p>
            </div>
          )}

          {/* The dissection - duties as theme-coloured markings */}
          <p style={{ margin: "0 0 8px", fontSize: "0.625rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Responsibilities, dissected by theme
          </p>
          {(topics || []).map(function(tp, i) {
            const tint = TINTS[i % TINTS.length];
            const gloss = glosses && glosses[tp.seed];
            return (
              <div key={tp.id} style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 5px", fontSize: "0.75rem", fontWeight: 800, color: tint.fg }}>{gloss || tp.label}</p>
                {tp.dutyIds.map(function(did) {
                  const m = dutyMeta[did] || {};
                  const text = (nodeMap[did] && nodeMap[did].label) || did;
                  return (
                    <button key={did} type="button"
                      onClick={function() { onMarkingTap(did, tp.id); }}
                      aria-label={"Marking: " + text + ". Tap to focus it in the canvas and graph."}
                      style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 6,
                        background: tint.bg, border: `1px solid ${tint.bd}`, borderRadius: 9, padding: "8px 10px",
                        cursor: "pointer", color: C.text, fontSize: "0.8125rem", lineHeight: 1.45 }}>
                      <span style={{ borderLeft: `3px solid ${tint.fg}`, paddingLeft: 8, display: "block" }}>{text}</span>
                      {(m.layer || m.level) && (
                        <span style={{ display: "block", marginTop: 5, paddingLeft: 11, fontSize: "0.625rem", fontWeight: 700, color: C.muted }}>
                          {m.layer ? m.layer : ""}{m.layer && m.level ? " - " : ""}{m.level ? (LEVEL_LABEL[m.level] || m.level) : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          <p style={{ margin: "10px 0 0", fontSize: "0.6875rem", color: C.muted, lineHeight: 1.5 }}>
            The dissection is deterministic; theme names may carry an AI gloss (~) for readability. Verbatim posting text is from MCF.
          </p>
        </div>
      </aside>
    </div>
  );
}
