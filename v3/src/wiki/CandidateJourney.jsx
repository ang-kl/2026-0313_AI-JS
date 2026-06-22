// CandidateJourney.jsx - PR3: Candidate lens seven-step journey
// Wired to REAL result fields from the v3 engine - no invented values.
// Per spec §5.1: each step maps to a real panel + a provenance tier.
// R007: ASCII only. R006: no multi-line async arrow in JSX props.
// No red/green - blue/amber/teal/purple only. 44px touch targets.

import { useState } from "react";
import CandidateBrief from "./CandidateBrief.jsx";

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

// AI-exposure levels colour map (blue<->amber ramp, no red/green)
const LEVELS = {
  HIGH:  { label: "Full Automation", color: "#9a3412", bg: "#fff7ed", border: "#fed7aa", icon: "*"  },
  MEDIUM:{ label: "AI-Augmented",    color: "#b45309", bg: "#fffbeb", border: "#fde68a", icon: "~"  },
  LOW:   { label: "AI-Assisted",     color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc", icon: "●"  },
  HUMAN: { label: "Human-Led",       color: "#1e40af", bg: "#eef2ff", border: "#c7d2fe", icon: "♦"  },
};

// Prov chip - matches PROV in App.jsx
const PROV_META = {
  mcf:        { icon: "●", label: "from posting",  bg: "#f0fdfa", bdr: "#99f6e4", fg: "#0f766e" },
  computed:   { icon: "✓", label: "computed",       bg: "#eef2ff", bdr: "#c7d2fe", fg: "#1e40af" },
  derived:    { icon: "◐", label: "derived",        bg: "#ecfeff", bdr: "#a5f3fc", fg: "#0e7490" },
  ai:         { icon: "~",      label: "AI estimate",    bg: "#fffbeb", bdr: "#fde68a", fg: "#b45309" },
  unverified: { icon: "?",      label: "unverified",     bg: "#f5f7fa", bdr: "#dde3ec", fg: "#5b6878" },
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

// Withhold placeholder - used when source data is absent (non-inventive contract)
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

// ── Step wrapper ─────────────────────────────────────────────────────────────
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
          background: C.accent, color: "#fff",
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

// ── demandProof helper (mirrors App.jsx demandProof - deterministic, no LLM) ─
// Duplicated here so CandidateJourney is self-contained in src/wiki/.
// DO NOT edit the frozen original in App.jsx.
function demandProofLocal(jobs, nowMs) {
  const arr = Array.isArray(jobs) ? jobs : [];
  const n = arr.length;
  if (n < 4) return null;
  const DAY = 86400000;
  let within9 = 0, within30 = 0, dated = 0;
  for (const j of arr) {
    const t = (j && j.postedDate) ? Date.parse(j.postedDate) : NaN;
    if (!Number.isFinite(t)) continue;
    dated++;
    const age = (nowMs - t) / DAY;
    if (age >= 0 && age <= 9) within9++;
    if (age >= 0 && age <= 30) within30++;
  }
  const mids = [];
  for (const j of arr) {
    const lo = Number(j && j.salaryMin), hi = Number(j && j.salaryMax);
    if (Number.isFinite(lo) && lo > 0 && Number.isFinite(hi) && hi > 0) mids.push((lo + hi) / 2);
    else if (Number.isFinite(lo) && lo > 0) mids.push(lo);
    else if (Number.isFinite(hi) && hi > 0) mids.push(hi);
  }
  mids.sort(function(a, b) { return a - b; });
  const pctile = function(p) {
    const idx = Math.min(mids.length - 1, Math.max(0, Math.round((p / 100) * (mids.length - 1))));
    return Math.round(mids[idx] / 100) * 100;
  };
  const salary = mids.length >= 4 ? { p25: pctile(25), p50: pctile(50), p75: pctile(75), n: mids.length } : null;
  const bands = { fresh: 0, junior: 0, mid: 0, senior: 0 };
  let expN = 0;
  for (const j of arr) {
    const y = (j && typeof j.minimumYearsExperience === "number") ? j.minimumYearsExperience : null;
    if (y == null) continue;
    expN++;
    if (y < 2) bands.fresh++;
    else if (y < 5) bands.junior++;
    else if (y < 9) bands.mid++;
    else bands.senior++;
  }
  let verdict;
  if (dated > 0 && n >= 12 && within30 >= 6) verdict = "active";
  else if (n >= 6 && (dated === 0 || within30 >= 3)) verdict = "moderate";
  else verdict = "thin";
  const confidence = n >= 12 ? "higher" : n >= 6 ? "moderate" : "low";
  return { n, dated, within9, within30, salary, bands, expN, verdict, confidence };
}

const DEMAND_VERDICT = {
  active:   { glyph: "^", label: "Active demand",   color: "#1e40af" },
  moderate: { glyph: "*", label: "Moderate demand", color: "#0e7490" },
  thin:     { glyph: "v", label: "Thin / unproven", color: "#9a3412" },
};

const fmtSGD = function(x) { return (x == null ? "-" : "$" + Math.round(x).toLocaleString("en-SG")); };

// ── CandidateJourney export ──────────────────────────────────────────────────
// Props:
//   result  - the live v3 result object (App.jsx state)
//   title   - role title string
//
// Result fields consumed (real engine output, never invented):
//   Step 1 - result.jobAnatomy (aiResilienceScore, layerMix, duties) - COMPUTED
//   Step 2 - result.skills[].level (HUMAN/LOW/MEDIUM/HIGH) - COMPUTED
//   Step 3 - result.responsibilitiesData.jobs via demandProofLocal() - DERIVED
//   Step 4 - result.foundationData (gaps + summary) - ~ AI estimate
//   Step 5 - Human-Led skills derived from result.skills (wikiRealmOf logic) - DERIVED
//   Step 6 - result.progressionData, result.crossoverData - ~ AI estimate
//   Step 7 - result.progressionData[dir=up][0] as next move - ~ AI estimate pick
export default function CandidateJourney({ result, title }) {
  const [briefOpen, setBriefOpen] = useState(true);

  if (!result) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: C.muted, fontSize: "0.875rem" }}>
        Analyse a role first to see the Candidate Journey.
      </div>
    );
  }

  // ── Step 1: Job Anatomy ───────────────────────────────────────────────────
  const ja = result.jobAnatomy;
  const hasAnatomy = ja && !ja.fallback && Array.isArray(ja.duties) && ja.duties.length > 0;

  const JOB_LAYER_ORDER = ["Activity", "Coordination", "Accountability", "Relational", "Judgment"];
  const JOB_LAYER_COLORS = {
    Activity:       "#9a3412",
    Coordination:   "#b45309",
    Accountability: "#0e7490",
    Relational:     "#1e40af",
    Judgment:       "#7c3aed",
  };

  // ── Step 2: Skill Analysis ────────────────────────────────────────────────
  const skills = Array.isArray(result.skills) ? result.skills : [];
  const byLevel = { HIGH: [], MEDIUM: [], LOW: [], HUMAN: [] };
  skills.forEach(function(s) { if (byLevel[s.level]) byLevel[s.level].push(s); });

  // ── Step 3: Demand Proof ──────────────────────────────────────────────────
  const jobs = ((result.responsibilitiesData && Array.isArray(result.responsibilitiesData.jobs))
    ? result.responsibilitiesData.jobs : []).filter(function(j) { return j && j.source !== "careers.gov.sg"; });
  const dp = demandProofLocal(jobs, Date.now());

  // ── Step 4: Foundation ────────────────────────────────────────────────────
  const fd = result.foundationData;

  // ── Step 5: The Edge (deterministic derivation rule from spec §2.1) ───────
  // Rule: Human-Led skills from Skill Analysis are the candidate's edge.
  // Classification is DERIVED (deterministic filter over COMPUTED skill levels);
  // the narration sentence is a fixed rule template (not LLM prose).
  const humanLed = skills.filter(function(s) { return s.level === "HUMAN"; });
  const edgeSkills = humanLed.slice(0, 6);

  // ── Step 6: Progression + Crossover ──────────────────────────────────────
  const prog = Array.isArray(result.progressionData) ? result.progressionData : [];
  const cross = Array.isArray(result.crossoverData) ? result.crossoverData : [];

  // ── Step 7: Next move ─────────────────────────────────────────────────────
  const nextUp = prog.find(function(p) { return p.dir === "up"; });
  const hasData = skills.length > 0;

  if (!hasData) {
    return (
      <div style={{ padding: "20px", color: C.muted, fontSize: "0.875rem" }}>
        The candidate journey builds as the role analysis loads. Return once all tabs have data.
      </div>
    );
  }

  return (
    <div>
      {/* Candidate Brief toggle */}
      <div style={{ marginBottom: 14 }}>
        <button
          type="button"
          aria-expanded={briefOpen}
          aria-controls="wiki-candidate-brief"
          onClick={function() { setBriefOpen(function(v) { return !v; }); }}
          style={{
            minHeight: 44, padding: "8px 16px", borderRadius: 10,
            border: `1px solid ${C.border}`, background: briefOpen ? C.accentSoft : C.surface,
            color: C.accent, fontWeight: 700, fontSize: "0.8125rem",
            cursor: "pointer", boxShadow: NEO.raiseSm,
          }}>
          {briefOpen ? "Hide Candidate Brief" : "Show Candidate Brief (print / PDF)"}
        </button>
      </div>

      {/* Candidate Brief (printable) */}
      {briefOpen && (
        <div id="wiki-candidate-brief">
          <CandidateBrief result={result} title={title} />
        </div>
      )}

      {/* Journey header */}
      <div style={{
        padding: "12px 16px", borderRadius: 14,
        background: "linear-gradient(100deg,#0a2a5e,#003399)",
        marginBottom: 14, boxShadow: NEO.raise,
      }}>
        <p style={{ margin: "0 0 3px", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Candidate guidance
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
          A guided read chained from your v3 result panels - every step pulls live engine output
        </p>
      </div>

      {/* Step 1: Job Anatomy */}
      <JourneyStep num={1} title="What this role really is (Job Anatomy)">
        {hasAnatomy ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Work-layer mix</span>
              <ProvChip kind="computed" />
            </div>
            <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
              {JOB_LAYER_ORDER.filter(function(L) { return ja.layerMix && ja.layerMix[L] > 0; }).map(function(L) {
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f5f7fa", borderRadius: 8 }}>
              <span style={{ fontSize: "1.125rem", fontWeight: 800, color: C.text }}>{ja.aiResilienceScore}/100</span>
              <span style={{ fontSize: "0.6875rem", color: C.textSub }}>AI-resilience score (higher = more human-led)</span>
              <ProvChip kind="computed" />
            </div>
          </div>
        ) : (
          <Withheld reason="Job Anatomy not yet loaded - the tab appears once live SG job ads are fetched" />
        )}
      </JourneyStep>

      {/* Step 2: Skill Analysis */}
      <JourneyStep num={2} title="What it asks for, by AI level (Skill Analysis)">
        {skills.length > 0 ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{skills.length} skills classified</span>
              <ProvChip kind="computed" />
            </div>
            {["HUMAN", "LOW", "MEDIUM", "HIGH"].map(function(lv) {
              const bucket = byLevel[lv] || [];
              if (!bucket.length) return null;
              const lvCfg = LEVELS[lv];
              return (
                <div key={lv} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: lvCfg.color }}>{lvCfg.label}</span>
                    <span style={{ fontSize: "0.6875rem", color: C.muted }}>({bucket.length})</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {bucket.slice(0, 8).map(function(s, i) {
                      return (
                        <span key={i} style={{
                          fontSize: "0.75rem", padding: "2px 9px", borderRadius: 999,
                          background: lvCfg.bg, border: `1px solid ${lvCfg.border}`, color: lvCfg.color,
                          fontWeight: 600,
                        }}>
                          {s.skill}
                        </span>
                      );
                    })}
                    {bucket.length > 8 && (
                      <span style={{ fontSize: "0.6875rem", color: C.muted, alignSelf: "center" }}>
                        +{bucket.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <p style={{ margin: "8px 0 0", fontSize: "0.6875rem", color: C.textSub, fontStyle: "italic" }}>
              Build proof on the Human-Led skills first - they are your edge and the least automatable.
            </p>
          </div>
        ) : (
          <Withheld reason="Skills not yet loaded" />
        )}
      </JourneyStep>

      {/* Step 3: Demand Proof */}
      <JourneyStep num={3} title="Is the demand real (Demand Proof)">
        {dp ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <ProvChip kind="derived" />
              <span style={{ fontSize: "0.6875rem", color: C.textSub }}>
                {dp.n} live SG postings sampled (MCF only; single-ad caveat applies under 2 ads)
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {[
                { label: "Postings", val: dp.n },
                { label: "Within 9 days", val: dp.within9 },
                { label: "Within 30 days", val: dp.within30 },
              ].map(function(st) {
                return (
                  <div key={st.label} style={{ padding: "8px 12px", background: "#f5f7fa", border: `1px solid ${C.border}`, borderRadius: 10, textAlign: "center" }}>
                    <span style={{ display: "block", fontSize: "1.125rem", fontWeight: 800, color: C.text }}>{st.val}</span>
                    <span style={{ fontSize: "0.6875rem", color: C.muted }}>{st.label}</span>
                  </div>
                );
              })}
            </div>
            {dp.salary && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {[
                  { label: "P25 salary", val: fmtSGD(dp.salary.p25) },
                  { label: "P50 salary", val: fmtSGD(dp.salary.p50) },
                  { label: "P75 salary", val: fmtSGD(dp.salary.p75) },
                ].map(function(st) {
                  return (
                    <div key={st.label} style={{ padding: "8px 12px", background: "#f5f7fa", border: `1px solid ${C.border}`, borderRadius: 10, textAlign: "center" }}>
                      <span style={{ display: "block", fontSize: "1rem", fontWeight: 800, color: C.text }}>{st.val}</span>
                      <span style={{ fontSize: "0.6875rem", color: C.muted }}>{st.label} <ProvChip kind="derived" /></span>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontSize: "0.75rem", fontWeight: 700,
                color: (DEMAND_VERDICT[dp.verdict] || DEMAND_VERDICT.thin).color,
              }}>
                {(DEMAND_VERDICT[dp.verdict] || DEMAND_VERDICT.thin).label}
              </span>
              <span style={{ fontSize: "0.6875rem", color: C.muted }}>({dp.confidence} confidence)</span>
              <ProvChip kind="derived" />
            </div>
          </div>
        ) : (
          <Withheld reason={"less than 4 MCF postings in the sample (D4 floor) - demand not proven"} />
        )}
      </JourneyStep>

      {/* Step 4: Foundation */}
      <JourneyStep num={4} title="Your gaps and build plan (Foundation)">
        {fd ? (
          <div>
            {fd.summary && (
              <p style={{ margin: "0 0 10px", fontSize: "0.8125rem", color: C.textSub, lineHeight: 1.6 }}>
                {fd.summary}{" "}<ProvChip kind="ai" />
              </p>
            )}
            {Array.isArray(fd.foundations) && fd.foundations.length > 0 ? (
              <div>
                {fd.foundations.slice(0, 6).map(function(f, i) {
                  return (
                    <div key={i} style={{
                      padding: "8px 10px", marginBottom: 6,
                      background: "#f8faff", border: `1px solid ${C.border}`,
                      borderRadius: 8,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <strong style={{ fontSize: "0.8125rem", color: C.text }}>{f.skill}</strong>
                        <span style={{
                          fontSize: "0.6rem", fontWeight: 700, padding: "1px 6px",
                          borderRadius: 999, background: C.accentSoft, color: C.accent,
                          border: `1px solid #c7d2fe`,
                        }}>{f.priority}</span>
                        <ProvChip kind="ai" />
                      </div>
                      {f.action && (
                        <p style={{ margin: 0, fontSize: "0.75rem", color: C.textSub }}>
                          Action: {f.action}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <Withheld reason="Foundation plan not loaded - select a persona (Employees / Fresh Grad / Crossover) on the result page to generate it" />
        )}
      </JourneyStep>

      {/* Step 5: The Edge */}
      <JourneyStep num={5} title="The edge to aim for (stand where work is Human-Led)">
        {edgeSkills.length > 0 ? (
          <div>
            <p style={{ margin: "0 0 10px", fontSize: "0.8125rem", color: C.text, fontWeight: 700 }}>
              Stand at the edge - these Human-Led skills are where AI cannot replace you:{" "}
              <ProvChip kind="derived" />
            </p>
            <p style={{ margin: "0 0 8px", fontSize: "0.6875rem", color: C.textSub, fontStyle: "italic" }}>
              Derivation rule: Human-Led skills (level = HUMAN) from the engine skill classification are the candidate's edge. This is a deterministic filter over computed skill levels, not LLM prose.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {edgeSkills.map(function(s, i) {
                return (
                  <span key={i} style={{
                    fontSize: "0.8125rem", padding: "4px 12px", borderRadius: 999,
                    background: "#eef2ff", border: `1px solid #c7d2fe`, color: "#1e40af",
                    fontWeight: 700,
                  }}>
                    {s.skill}
                  </span>
                );
              })}
            </div>
            {humanLed.length > 6 && (
              <p style={{ margin: "8px 0 0", fontSize: "0.6875rem", color: C.muted }}>
                +{humanLed.length - 6} more Human-Led skills (see Skills tab)
              </p>
            )}
          </div>
        ) : (
          <Withheld reason="No Human-Led skills found in this role's skill set - the role may be heavily automated" />
        )}
      </JourneyStep>

      {/* Step 6: Progression + Crossover */}
      <JourneyStep num={6} title="Where you can go (Progression + Crossover)">
        {(prog.length > 0 || cross.length > 0) ? (
          <div>
            {prog.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Progression</span>
                  <ProvChip kind="ai" />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  {prog.slice(0, 4).map(function(p, i) {
                    return (
                      <span key={i} style={{
                        fontSize: "0.75rem", padding: "3px 10px", borderRadius: 999,
                        background: C.accentSoft, border: `1px solid #c7d2fe`, color: C.accent,
                        fontWeight: 600,
                      }}>
                        {p.role}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {cross.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Crossover</span>
                  <ProvChip kind="ai" />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cross.slice(0, 3).map(function(x, i) {
                    return (
                      <span key={i} style={{
                        fontSize: "0.75rem", padding: "3px 10px", borderRadius: 999,
                        background: C.tealBg, border: `1px solid ${C.tealBdr}`, color: C.teal,
                        fontWeight: 600,
                      }}>
                        {x.role}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Withheld reason="Progression / Crossover data not loaded yet" />
        )}
      </JourneyStep>

      {/* Step 7: Positioning + Next Move */}
      <JourneyStep num={7} title="Your positioning + next move">
        {nextUp ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Next move (up)</span>
              <ProvChip kind="ai" />
            </div>
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: C.accentSoft, border: `1px solid #c7d2fe`,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.9375rem", fontWeight: 800, color: C.accent }}>
                {nextUp.role}
              </p>
              {nextUp.note && (
                <p style={{ margin: "0 0 6px", fontSize: "0.8125rem", color: C.textSub }}>
                  {nextUp.note}
                </p>
              )}
              {Array.isArray(nextUp.gap) && nextUp.gap.length > 0 && (
                <p style={{ margin: 0, fontSize: "0.6875rem", color: C.muted }}>
                  Build: {nextUp.gap.join(", ")}
                </p>
              )}
            </div>
            {edgeSkills.length > 0 && (
              <p style={{ margin: "10px 0 0", fontSize: "0.8125rem", color: C.textSub, fontStyle: "italic" }}>
                Position yourself as: strong on {edgeSkills.slice(0, 2).map(function(s) { return s.skill; }).join(" + ")}{edgeSkills.length > 2 ? ` (and ${edgeSkills.length - 2} more Human-Led skills)` : ""} - the human-led core that survives the AI shift.{" "}
                <ProvChip kind="derived" />
              </p>
            )}
          </div>
        ) : (
          <Withheld reason="Progression data not loaded yet" />
        )}
      </JourneyStep>

      {/* Mandatory artifact footer - AI-assisted; human decides (spec section 7.4) */}
      <p style={{ margin: "16px 0 0", padding: "10px 12px", borderRadius: 10, background: "#f1f5f9", border: `1px solid ${C.border}`, fontSize: "0.6875rem", color: C.textSub, lineHeight: 1.55 }}>
        <strong style={{ color: C.text }}>AI-assisted; human decides.</strong> Source: role data (ESCO / ISCO / MCF). Confidence: shown per chip. Time-window: current session.
      </p>
    </div>
  );
}
