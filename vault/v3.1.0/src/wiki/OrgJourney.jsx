// OrgJourney.jsx - PR4: Organisation lens seven-step value-stream journey
// Wired to REAL result fields from the v3 engine. No invented values.
// Per spec §5.2: each step maps to a real panel + a provenance tier.
// Value-stream tags are DETERMINISTIC (derived from duty.layer - no LLM).
// R007: ASCII only in JSX strings. R006: no multi-line async arrow in JSX props.
// No red/green - blue/amber/teal/purple only. 44px touch targets.

// ── palette (mirrors App.jsx C) ──────────────────────────────────────────────
const C = {
  bg:         "#e6ebf2",
  surface:    "#ffffff",
  border:     "#e3e9f1",
  accent:     "#1a56db",
  accentSoft: "#e8f0fe",
  eu:         "#003399",
  muted:      "#5b6878",
  text:       "#1a202c",
  textSub:    "#4a5568",
  teal:       "#0e7490",
  tealBg:     "#ecfeff",
  tealBdr:    "#a5f3fc",
  amber:      "#b45309",
  amberBg:    "#fffbeb",
  amberBdr:   "#fcd9a0",
  purple:     "#7c3aed",
  purpleBg:   "#f3e8ff",
  purpleBdr:  "#ddd6fe",
};

const NEO = {
  raise:   "6px 6px 14px rgba(174,189,212,0.55), -6px -6px 13px rgba(255,255,255,0.9)",
  raiseSm: "4px 4px 9px rgba(174,189,212,0.5), -4px -4px 9px rgba(255,255,255,0.9)",
};

// AI-exposure levels colour ramp (blue<->amber, no red/green)
const EXPO_CONFIG = {
  HIGH:   { label: "Full Automation",  color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  MEDIUM: { label: "AI-Augmented",     color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  LOW:    { label: "AI-Assisted",      color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc" },
  HUMAN:  { label: "Human-Led",        color: "#1e40af", bg: "#eef2ff", border: "#c7d2fe" },
};

// Prov chip - matches PROV in App.jsx
const PROV_META = {
  mcf:        { icon: "●", label: "from posting",  bg: "#f0fdfa", bdr: "#99f6e4", fg: "#0f766e" },
  computed:   { icon: "✓", label: "computed",       bg: "#eef2ff", bdr: "#c7d2fe", fg: "#1e40af" },
  derived:    { icon: "◐", label: "derived",        bg: "#ecfeff", bdr: "#a5f3fc", fg: "#0e7490" },
  ai:         { icon: "~", label: "AI estimate",    bg: "#fffbeb", bdr: "#fde68a", fg: "#b45309" },
  unverified: { icon: "?", label: "unverified",     bg: "#f5f7fa", bdr: "#dde3ec", fg: "#5b6878" },
};

function ProvChip({ kind }) {
  const m = PROV_META[kind] || PROV_META.unverified;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: "0.5625rem", fontWeight: 700,
      borderRadius: 999, padding: "1px 7px",
      background: m.bg, border: `1px solid ${m.bdr}`, color: m.fg,
      whiteSpace: "nowrap", verticalAlign: "middle",
    }}>
      <span aria-hidden="true">{m.icon}</span> {m.label}
    </span>
  );
}

// Withheld placeholder - used when source data is absent
function Withheld({ reason }) {
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 10,
      background: "#f5f7fa", border: `1px solid ${C.border}`,
      fontSize: "0.75rem", color: C.muted, fontStyle: "italic",
    }}>
      Not enough evidence{reason ? `: ${reason}` : ""} - withheld rather than invented.{" "}
      <ProvChip kind="unverified" />
    </div>
  );
}

// Step wrapper - mirrors CandidateJourney JourneyStep
function JourneyStep({ num, title, children }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
      marginBottom: 14, boxShadow: NEO.raiseSm, overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
        background: "#f8faff",
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: C.teal, color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem", fontWeight: 800,
        }} aria-hidden="true">{num}</span>
        <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 800, color: C.text }}>
          {title}
        </h4>
      </div>
      <div style={{ padding: "14px 16px" }}>
        {children}
      </div>
    </div>
  );
}

// ── VALUE-STREAM TAG DERIVATION RULE (deterministic, not LLM) ─────────────────
// Rule (spec §2.1 / §5.2, grounded in Teixeira Customer Value Chain + Flow Engineering):
//   value-creating  = layer "Activity"      -> duty produces a direct deliverable
//   value-capturing = layer "Accountability", "Relational", or "Judgment"
//                     -> duty realises/secures value (sign-off, relationship, framing)
//   value-eroding   = layer "Coordination"  -> duty bridges handoffs; no direct output
//   untagged        = anything else (withhold rather than fabricate)
// Tier: derived (deterministic function of duty.layer; stated visibly here for auditability).
const VALUE_TAG_RULE = "derived from duty.layer: Activity=creating, Coordination=eroding, Accountability/Relational/Judgment=capturing";

function valueTagOf(layer) {
  if (layer === "Activity")                                            return "value-creating";
  if (layer === "Coordination")                                        return "value-eroding";
  if (layer === "Accountability" || layer === "Relational" || layer === "Judgment") return "value-capturing";
  return "untagged";
}

const VALUE_TAG_CONFIG = {
  "value-creating":  { label: "value-creating",  color: C.teal,   bg: C.tealBg,   border: C.tealBdr },
  "value-capturing": { label: "value-capturing",  color: C.accent, bg: C.accentSoft, border: "#c7d2fe" },
  "value-eroding":   { label: "value-eroding",   color: C.amber,  bg: C.amberBg,  border: C.amberBdr },
  "untagged":        { label: "untagged",         color: C.muted,  bg: "#f5f7fa",  border: C.border },
};

// (demand-proof read lives in the Candidate lens, step 3 - not duplicated here.)

// ── Job layer colour map (mirrors CandidateJourney) ──────────────────────────
const JOB_LAYER_ORDER = ["Activity", "Coordination", "Accountability", "Relational", "Judgment"];
const JOB_LAYER_COLORS = {
  Activity:       "#c2410c",
  Coordination:   "#b45309",
  Accountability: "#0e7490",
  Relational:     "#1e40af",
  Judgment:       "#7c3aed",
};

// ── OrgJourney export ─────────────────────────────────────────────────────────
// Props:
//   result - the live v3 result object (App.jsx state)
//   title  - role title string
//
// Result fields consumed (real engine output, never invented):
//   Step 1 - result.responsibilitiesData.responsibilities (duty text, mcf) + result.contextData (ai)
//   Step 2 - result.jobAnatomy.duties (layer + exposureNow -> valueTagOf rule; derived/computed)
//   Step 3 - result.jobAnatomy (aiResilienceScore, layerMix, lowest-resilience layer; computed)
//   Step 4 - result.jobAnatomy.orgContext.stakeholders (external deps; mcf/derived)
//   Step 5 - value-eroding duties (derived) as friction; human-led as edge of core (derived)
//   Step 6 - result.jobAnatomy.duties where exposureNow HIGH/MEDIUM (computed)
//   Step 7 - result.responsibilitiesData.jobs[0] job ad link (mcf verbatim)
export default function OrgJourney({ result, title }) {
  if (!result) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: C.muted, fontSize: "0.875rem" }}>
        Analyse a role first to see the Organisation Journey.
      </div>
    );
  }

  // ── Data extraction ───────────────────────────────────────────────────────
  const ja = result.jobAnatomy;
  const hasDuties = ja && !ja.fallback && Array.isArray(ja.duties) && ja.duties.length > 0;
  const duties = hasDuties ? ja.duties : [];

  const rd = result.responsibilitiesData;
  const responsibilities = (rd && Array.isArray(rd.responsibilities)) ? rd.responsibilities : [];
  const jobs = (rd && Array.isArray(rd.jobs)) ? rd.jobs.filter(function(j) { return j && j.source !== "careers.gov.sg"; }) : [];

  const contextData = result.contextData;
  const department = (contextData && contextData.department) ? contextData.department : null;

  // ── Step 2: Value stream from duties ─────────────────────────────────────
  // Each duty gets a value tag from the deterministic rule (valueTagOf).
  // Tier: derived (tag) + computed (exposureNow).
  const taggedDuties = duties.map(function(d) {
    return { ...d, valueTag: valueTagOf(d.layer) };
  });

  // ── Step 3: Capability constraint = lowest-resilience layer ──────────────
  // Derived from layerMix (computed). The layer with the highest automatability
  // is the constraint. We identify it as the layer with the most HIGH/MEDIUM duties.
  const layerW = {};
  duties.forEach(function(d) { layerW[d.layer] = (layerW[d.layer] || 0) + Math.max(1, d.count || 1); });
  const constraintLayer = JOB_LAYER_ORDER.slice().sort(function(a, b) { return (layerW[b] || 0) - (layerW[a] || 0); })[0] || null;

  // Count duties by exposure
  const highExposure = duties.filter(function(d) { return d.exposureNow === "HIGH"; });
  const medExposure  = duties.filter(function(d) { return d.exposureNow === "MEDIUM"; });

  // ── Step 4: External dependencies from orgContext.stakeholders ───────────
  const stakeholders = (ja && ja.orgContext && Array.isArray(ja.orgContext.stakeholders))
    ? ja.orgContext.stakeholders : [];

  // ── Step 5: Friction = value-eroding duties; Edge of core = human-led ────
  const eroderDuties  = taggedDuties.filter(function(d) { return d.valueTag === "value-eroding"; });
  const humanLedDuties = duties.filter(function(d) { return d.exposureNow === "HUMAN" || d.exposureNow === "LOW"; });

  // ── Step 6: Future state - AI absorbs vs stays human ─────────────────────
  const aiAbsorbs    = duties.filter(function(d) { return d.exposureNow === "HIGH" || d.exposureNow === "MEDIUM"; });
  const staysHuman   = duties.filter(function(d) { return d.exposureNow === "HUMAN" || d.exposureNow === "LOW"; });

  // ── Step 7: Back to the job ad ────────────────────────────────────────────
  const firstJob = jobs[0] || null;
  const jobUrl   = firstJob && (firstJob.mcfUrl || firstJob.url || null);
  const jobTitle = firstJob && (firstJob.title || title || null);
  const employer = firstJob && (firstJob.employerName || firstJob.employer || null);

  // Guard: if there are no duties at all, many steps cannot be grounded
  const hasMinData = responsibilities.length > 0 || duties.length > 0;
  if (!hasMinData) {
    return (
      <div style={{ padding: "20px", color: C.muted, fontSize: "0.875rem" }}>
        The organisation journey builds as the role analysis loads. Return once all tabs have data.
      </div>
    );
  }

  return (
    <div>
      {/* Journey header */}
      <div style={{
        padding: "12px 16px", borderRadius: 14,
        background: "linear-gradient(100deg,#0e4d4d,#0e7490)",
        marginBottom: 14, boxShadow: NEO.raise,
      }}>
        <p style={{ margin: "0 0 3px", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Organisation guidance
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
          A value-stream read chained from live engine output - why this role exists, how work flows, and where AI reshapes it
        </p>
      </div>

      {/* Derivation rule notice - visible to reader per spec §2.1 */}
      <div style={{
        padding: "8px 12px", marginBottom: 14, borderRadius: 10,
        background: C.tealBg, border: `1px solid ${C.tealBdr}`,
        fontSize: "0.6875rem", color: C.teal,
      }}>
        <strong>Derivation rule (value-stream tags):</strong> {VALUE_TAG_RULE}. Tag = derived; AI-exposure level = computed. Prose framing = AI estimate where present.
      </div>

      {/* Step 1: What the org needs from this role */}
      <JourneyStep num={1} title="What the org needs from this role">
        {department ? (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Organisational placement</span>
              <ProvChip kind="ai" />
            </div>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: C.text, lineHeight: 1.6 }}>
              {department}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.625rem", color: C.textSub, fontStyle: "italic" }}>
              Typical department placement - illustrative from role context, not derived from this specific posting.
            </p>
          </div>
        ) : null}
        {responsibilities.length >= 3 ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {responsibilities.length} duty statements (verbatim from posting)
              </span>
              <ProvChip kind="mcf" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {responsibilities.slice(0, 5).map(function(r, i) {
                return (
                  <div key={i} style={{
                    padding: "5px 10px", borderRadius: 8,
                    background: "#f8faff", border: `1px solid ${C.border}`,
                    fontSize: "0.75rem", color: C.text,
                  }}>
                    {r.text || r}
                  </div>
                );
              })}
              {responsibilities.length > 5 && (
                <span style={{ fontSize: "0.6875rem", color: C.muted, alignSelf: "center" }}>
                  +{responsibilities.length - 5} more (see Responsibilities tab)
                </span>
              )}
            </div>
          </div>
        ) : responsibilities.length > 0 ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <ProvChip kind="mcf" />
              <span style={{ fontSize: "0.6875rem", color: C.textSub }}>
                {responsibilities.length} duty statement{responsibilities.length !== 1 ? "s" : ""} from posting
              </span>
            </div>
            {responsibilities.slice(0, 3).map(function(r, i) {
              return (
                <div key={i} style={{
                  padding: "5px 10px", marginBottom: 4, borderRadius: 8,
                  background: "#f8faff", border: `1px solid ${C.border}`,
                  fontSize: "0.75rem", color: C.text,
                }}>
                  {r.text || r}
                </div>
              );
            })}
          </div>
        ) : (
          <Withheld reason="No duty statements found - responsibilities tab may not have loaded yet" />
        )}
      </JourneyStep>

      {/* Step 2: The work as a value stream */}
      <JourneyStep num={2} title="The work as a value stream">
        {hasDuties ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {duties.length} duties classified
              </span>
              <ProvChip kind="derived" />
              <span style={{ fontSize: "0.6875rem", color: C.textSub }}>tag</span>
              <ProvChip kind="computed" />
              <span style={{ fontSize: "0.6875rem", color: C.textSub }}>AI level</span>
            </div>

            {/* Value tag legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {["value-creating", "value-capturing", "value-eroding"].map(function(tag) {
                const cfg = VALUE_TAG_CONFIG[tag];
                return (
                  <span key={tag} style={{
                    fontSize: "0.5625rem", fontWeight: 700, padding: "2px 8px",
                    borderRadius: 999, background: cfg.bg,
                    border: `1px solid ${cfg.border}`, color: cfg.color,
                  }}>
                    {cfg.label}
                  </span>
                );
              })}
            </div>

            {/* Duty stream */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {taggedDuties.slice(0, 10).map(function(d, i) {
                const tagCfg = VALUE_TAG_CONFIG[d.valueTag] || VALUE_TAG_CONFIG.untagged;
                const expoCfg = EXPO_CONFIG[d.exposureNow] || EXPO_CONFIG.HUMAN;
                return (
                  <div key={i} style={{
                    padding: "8px 10px", borderRadius: 8,
                    background: "#f8faff", border: `1px solid ${tagCfg.border}`,
                    borderLeft: `4px solid ${tagCfg.color}`,
                  }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ flex: 1, fontSize: "0.8125rem", color: C.text, lineHeight: 1.5 }}>
                        {d.text}
                      </span>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                        {d.valueTag !== "untagged" && (
                          <span style={{
                            fontSize: "0.5625rem", fontWeight: 700, padding: "2px 7px",
                            borderRadius: 999, background: tagCfg.bg,
                            border: `1px solid ${tagCfg.border}`, color: tagCfg.color,
                            whiteSpace: "nowrap",
                          }}>
                            {tagCfg.label} <ProvChip kind="derived" />
                          </span>
                        )}
                        <span style={{
                          fontSize: "0.5625rem", fontWeight: 700, padding: "2px 7px",
                          borderRadius: 999, background: expoCfg.bg,
                          border: `1px solid ${expoCfg.border}`, color: expoCfg.color,
                          whiteSpace: "nowrap",
                        }}>
                          {expoCfg.label} <ProvChip kind="computed" />
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop: 3, fontSize: "0.5625rem", color: C.muted }}>
                      Layer: {d.layer}
                      {d.count && d.of ? ` - seen in ${d.count} of ${d.of} ads` : ""}
                    </div>
                  </div>
                );
              })}
              {taggedDuties.length > 10 && (
                <p style={{ margin: "4px 0 0", fontSize: "0.6875rem", color: C.muted }}>
                  +{taggedDuties.length - 10} more duties (see Job Anatomy tab)
                </p>
              )}
            </div>
          </div>
        ) : (
          <Withheld reason="Job Anatomy not loaded - duties with layer and AI-exposure data appear once live SG job ads are fetched" />
        )}
      </JourneyStep>

      {/* Step 3: Capability constraint */}
      <JourneyStep num={3} title="The capability constraint (Capability Map)">
        {hasDuties ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI-resilience score</span>
              <ProvChip kind="computed" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f5f7fa", borderRadius: 8, marginBottom: 10 }}>
              <span style={{ fontSize: "1.125rem", fontWeight: 800, color: C.text }}>{ja.aiResilienceScore}/100</span>
              <span style={{ fontSize: "0.6875rem", color: C.textSub }}>higher = more human-led</span>
              <ProvChip kind="computed" />
            </div>

            {/* Layer mix bar */}
            {ja.layerMix && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Work-layer mix</span>
                  <ProvChip kind="computed" />
                </div>
                <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", marginBottom: 4 }}>
                  {JOB_LAYER_ORDER.filter(function(L) { return ja.layerMix[L] > 0; }).map(function(L) {
                    return (
                      <div
                        key={L}
                        title={L + " " + (ja.layerMix[L] || 0) + "%"}
                        style={{ flex: ja.layerMix[L], background: JOB_LAYER_COLORS[L], minWidth: 5 }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginBottom: 10 }}>
                  {JOB_LAYER_ORDER.filter(function(L) { return ja.layerMix && ja.layerMix[L] > 0; }).map(function(L) {
                    return (
                      <span key={L} style={{ fontSize: "0.6875rem", color: JOB_LAYER_COLORS[L], fontWeight: 600 }}>
                        {L} {ja.layerMix[L]}%
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI-exposed duties count */}
            {(highExposure.length > 0 || medExposure.length > 0) && (
              <div style={{
                padding: "8px 10px", borderRadius: 8,
                background: C.amberBg, border: `1px solid ${C.amberBdr}`,
                fontSize: "0.75rem", color: C.amber,
              }}>
                <strong>Constraint:</strong>{" "}
                {highExposure.length} Full Automation + {medExposure.length} AI-Augmented duties = {highExposure.length + medExposure.length} AI-exposed duties out of {duties.length} total.
                The dominant layer is <strong>{constraintLayer || "Activity"}</strong>.{" "}
                <ProvChip kind="computed" />
              </div>
            )}
          </div>
        ) : (
          <Withheld reason="Job Anatomy not loaded - resilience score appears once live SG job ads are fetched" />
        )}
      </JourneyStep>

      {/* Step 4: Dependencies */}
      <JourneyStep num={4} title="Dependencies (who and what this role connects to)">
        {stakeholders.length > 0 ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Stakeholders named in the ads
              </span>
              <ProvChip kind="mcf" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {stakeholders.map(function(s, i) {
                return (
                  <span key={i} style={{
                    fontSize: "0.75rem", padding: "4px 10px", borderRadius: 999,
                    background: C.purpleBg, border: `1px solid ${C.purpleBdr}`, color: C.purple,
                    fontWeight: 600,
                  }}>
                    {s}
                  </span>
                );
              })}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "0.625rem", color: C.textSub, fontStyle: "italic" }}>
              External dependencies sit across the boundary where value and risk concentrate.
              Derived from verbatim stakeholder mentions in the sampled job ads.
              <ProvChip kind="mcf" />
            </p>
          </div>
        ) : hasDuties ? (
          <Withheld reason="No stakeholders named explicitly in the sampled ads - dependency map cannot be grounded" />
        ) : (
          <Withheld reason="Job Anatomy not loaded yet" />
        )}
      </JourneyStep>

      {/* Step 5: Friction + Edge of core */}
      <JourneyStep num={5} title="Friction and edge of core (where durable value sits)">
        {hasDuties ? (
          <div>
            {/* Friction = value-eroding duties */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Friction (value-eroding duties)
                </span>
                <ProvChip kind="derived" />
              </div>
              <p style={{ margin: "0 0 6px", fontSize: "0.625rem", color: C.textSub, fontStyle: "italic" }}>
                Derivation rule: layer = Coordination =&gt; value-eroding (bridges handoffs, no direct output). These are the bottlenecks AI can absorb first.
              </p>
              {eroderDuties.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {eroderDuties.slice(0, 4).map(function(d, i) {
                    return (
                      <div key={i} style={{
                        padding: "6px 10px", borderRadius: 8,
                        background: C.amberBg, border: `1px solid ${C.amberBdr}`,
                        fontSize: "0.75rem", color: C.text,
                      }}>
                        <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                          <span style={{ flex: 1, minWidth: 0 }}>{d.text}</span>
                          {d.count && d.of ? (
                            <span style={{ fontSize: "0.5625rem", color: C.muted }}>seen in {d.count} of {d.of} ads</span>
                          ) : null}
                          <ProvChip kind="derived" />
                        </span>
                      </div>
                    );
                  })}
                  {eroderDuties.length > 4 && (
                    <p style={{ margin: 0, fontSize: "0.6875rem", color: C.muted }}>
                      +{eroderDuties.length - 4} more coordination duties
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted, fontStyle: "italic" }}>
                  No Coordination-layer duties found - no value-eroding friction identified.
                </p>
              )}
            </div>

            {/* Edge of core = human-led duties */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Edge of core (Human-Led duties)
                </span>
                <ProvChip kind="derived" />
              </div>
              <p style={{ margin: "0 0 6px", fontSize: "0.625rem", color: C.textSub, fontStyle: "italic" }}>
                Derivation rule: exposureNow = HUMAN or LOW =&gt; the duties AI cannot meaningfully replace. This is where the org's durable value sits (Lewis &amp; McKone, Edge Strategy).
              </p>
              {humanLedDuties.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {humanLedDuties.slice(0, 6).map(function(d, i) {
                    const expoCfg = EXPO_CONFIG[d.exposureNow] || EXPO_CONFIG.HUMAN;
                    return (
                      <span key={i} style={{
                        fontSize: "0.75rem", padding: "4px 10px", borderRadius: 999,
                        background: expoCfg.bg, border: `1px solid ${expoCfg.border}`, color: expoCfg.color,
                        fontWeight: 600,
                      }}>
                        {d.text.length > 48 ? d.text.slice(0, 45) + "..." : d.text}
                      </span>
                    );
                  })}
                  {humanLedDuties.length > 6 && (
                    <span style={{ fontSize: "0.6875rem", color: C.muted, alignSelf: "center" }}>
                      +{humanLedDuties.length - 6} more
                    </span>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted, fontStyle: "italic" }}>
                  No Human-Led or AI-Assisted duties found in this role - the edge of core is thin.
                </p>
              )}
            </div>
          </div>
        ) : (
          <Withheld reason="Job Anatomy not loaded yet" />
        )}
      </JourneyStep>

      {/* Step 6: AI reshapes the flow (future state) */}
      <JourneyStep num={6} title="Where AI reshapes the flow (future state)">
        {hasDuties ? (
          <div>
            {/* AI absorbs */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  AI absorbs ({aiAbsorbs.length} duties)
                </span>
                <ProvChip kind="computed" />
              </div>
              {aiAbsorbs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {aiAbsorbs.slice(0, 5).map(function(d, i) {
                    const expoCfg = EXPO_CONFIG[d.exposureNow] || EXPO_CONFIG.MEDIUM;
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 8,
                        padding: "6px 10px", borderRadius: 8,
                        background: expoCfg.bg, border: `1px solid ${expoCfg.border}`,
                      }}>
                        <span style={{ fontSize: "0.75rem", color: C.text, flex: 1, lineHeight: 1.5 }}>{d.text}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: expoCfg.color }}>{expoCfg.label}</span>
                          <ProvChip kind="computed" />
                        </span>
                      </div>
                    );
                  })}
                  {aiAbsorbs.length > 5 && (
                    <p style={{ margin: 0, fontSize: "0.6875rem", color: C.muted }}>+{aiAbsorbs.length - 5} more AI-exposed duties</p>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted, fontStyle: "italic" }}>
                  No Full Automation or AI-Augmented duties found.
                </p>
              )}
            </div>

            {/* Stays human */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Stays human-led ({staysHuman.length} duties)
                </span>
                <ProvChip kind="computed" />
              </div>
              {staysHuman.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {staysHuman.slice(0, 6).map(function(d, i) {
                    const expoCfg = EXPO_CONFIG[d.exposureNow] || EXPO_CONFIG.HUMAN;
                    return (
                      <span key={i} style={{
                        fontSize: "0.75rem", padding: "3px 9px", borderRadius: 999,
                        background: expoCfg.bg, border: `1px solid ${expoCfg.border}`, color: expoCfg.color,
                        fontWeight: 600,
                      }}>
                        {d.text.length > 40 ? d.text.slice(0, 37) + "..." : d.text}
                      </span>
                    );
                  })}
                  {staysHuman.length > 6 && (
                    <span style={{ fontSize: "0.6875rem", color: C.muted, alignSelf: "center" }}>+{staysHuman.length - 6} more</span>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted, fontStyle: "italic" }}>
                  No Human-Led or AI-Assisted duties in this role.
                </p>
              )}
            </div>

            {/* 2-year trajectory */}
            {ja.trajectory2y && (
              <div style={{
                marginTop: 10, padding: "8px 10px", borderRadius: 8,
                background: "#f5f7fa", border: `1px solid ${C.border}`,
                fontSize: "0.75rem", color: C.textSub,
              }}>
                <ProvChip kind="computed" /> {ja.trajectory2y.line}
              </div>
            )}
          </div>
        ) : (
          <Withheld reason="Job Anatomy not loaded yet" />
        )}
      </JourneyStep>

      {/* Step 7: So who to hire - back to the job ad */}
      <JourneyStep num={7} title="So who to hire (back to the job ad)">
        {firstJob ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <ProvChip kind="mcf" />
              <span style={{ fontSize: "0.6875rem", color: C.textSub }}>verbatim from the posted job ad</span>
            </div>
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: C.tealBg, border: `1px solid ${C.tealBdr}`,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.9375rem", fontWeight: 800, color: C.teal }}>
                {jobTitle || title}
              </p>
              {employer && (
                <p style={{ margin: "0 0 6px", fontSize: "0.8125rem", color: C.textSub }}>
                  {employer}
                </p>
              )}
              {firstJob.salaryMin && firstJob.salaryMax ? (
                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: C.muted }}>
                  Salary: ${Number(firstJob.salaryMin).toLocaleString("en-SG")} - ${Number(firstJob.salaryMax).toLocaleString("en-SG")} <ProvChip kind="mcf" />
                </p>
              ) : null}
              {jobUrl && (
                <a
                  href={jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block", marginTop: 6,
                    fontSize: "0.75rem", fontWeight: 700, color: C.teal,
                    textDecoration: "underline",
                  }}
                  aria-label={"View full job posting for " + (jobTitle || title) + " on careers.gov.sg"}
                >
                  View job posting (careers.gov.sg / MCF)
                </a>
              )}
            </div>
            {jobs.length > 1 && (
              <p style={{ margin: "8px 0 0", fontSize: "0.6875rem", color: C.muted }}>
                {jobs.length} postings sampled. Showing the first. <ProvChip kind="derived" />
              </p>
            )}
          </div>
        ) : (
          <Withheld reason="No MCF job ad in the sample - the job ad link cannot be grounded" />
        )}
      </JourneyStep>

      {/* Mandatory artifact footer - AI-assisted; human decides (spec section 7.4) */}
      <p style={{ margin: "16px 0 0", padding: "10px 12px", borderRadius: 10, background: "#f1f5f9", border: `1px solid ${C.border}`, fontSize: "0.6875rem", color: C.textSub, lineHeight: 1.55 }}>
        <strong style={{ color: C.text }}>AI-assisted; human decides.</strong> Source: role data (ESCO / ISCO / MCF). Confidence: shown per chip. Time-window: current session.
      </p>
    </div>
  );
}
