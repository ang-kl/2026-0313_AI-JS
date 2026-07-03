// v3/engine-data/skill-level.js — deterministic per-skill automation LEVEL classifier (SLE-A).
// Pure, network-free, side-effect-free: classifySkillLevel(skill, occExposure) -> same input,
// same output (R-SNAPSHOT). No LLM write access — deterministic = control (locked v3 contract).
//
// Ground: this module is the deterministic reading of rules that used to live only inside the
// SYSTEM_RATE prompt (App.jsx rateSkills) — the HUMAN definition + "Patient Empathy must be
// HUMAN + NA" example, and the OFFICE SUITE RULE — plus the ReviewStudio.jsx rsLens/
// buildDissection posture (deterministic keyword classifier, WITHHOLD when no signal exists,
// never fabricate a band). See v3/script/v3-skill-level-engine-spec.md SLE3/SLE5.
//
// occExposure input shape (occupation-level, NOT per-skill — never claimed as skill-specific
// AIOE precision): { index (0-100), band: 'high'|'moderate'|'low', zRange: [lo, hi], confidence }
// as produced by engine-core.js computeEngine()/exposureForIsco() (frozen, read-only consumer).
//
// Out of scope (honest): a true per-skill AIOE source does not exist. The occupation band is a
// DELIBERATELY CONSERVATIVE prior (never promotes a skill to HIGH on its own) modified by ESCO
// signals the skill already carries. Withheld (null) beats a guessed level, always.

// Rule 1 — HUMAN gate (hard). Deterministic reading of the SYSTEM_RATE HUMAN definition
// ("legal accountability, moral liability, presence, empathy or physical action required") and
// its own worked example ("Patient Empathy" must be HUMAN + NA). Tight verb set to avoid
// over-firing on technical skills that merely mention people (guard: SLE9 pre-mortem).
const HUMAN_GATE = /\b(patient (empathy|care)|physical (presence|action|care|therapy)|face[- ]to[- ]face|in[- ]person|bedside|tactile|hands[- ]on care|emotional (support|attunement)|moral liability|legal accountability|duty of care|life[- ]or[- ]death|clinical judg[e]?ment involving patients)\b/i;

// Rule 2 — office-suite cap (hard). Deterministic reading of the existing OFFICE SUITE RULE:
// "Microsoft Office, Excel, Word, PowerPoint, Spreadsheets = MEDIUM at most. Never HIGH."
const OFFICE_RULE = /\b(microsoft office|office suite|excel|word processing|ms word|powerpoint|spreadsheet)/i;

// Rule 3 — occupation-band prior (soft, disclosed). Deliberately conservative: the occupation
// band never promotes a skill straight to HIGH — that is a strong per-skill claim the data
// cannot support on its own.
const BAND_TO_LEVEL = { high: 'MEDIUM', moderate: 'LOW', low: 'LOW' };
const LEVEL_UP   = { LOW: 'MEDIUM', MEDIUM: 'HIGH', HIGH: 'HIGH', HUMAN: 'HUMAN' };
const LEVEL_DOWN = { HIGH: 'MEDIUM', MEDIUM: 'LOW', LOW: 'LOW', HUMAN: 'HUMAN' };

function skillText(skill) {
  return `${skill && skill.skill ? skill.skill : ''} ${skill && skill.escoDescription ? skill.escoDescription : ''}`;
}

// classifySkillLevel(skill, occExposure) -> { level, confidence, basis, toolHint } | withheld shape.
// skill: { skill, escoDescription, reuseLevel, type, escoUri } (see api/esco.js:180-196 for the
// reuseLevel vocabulary: Transversal | Cross-sector | Sector-specific | Occupation-specific).
// occExposure: computeEngine()/exposureForIsco() exposure object, or null/undefined when the
// occupation could not be resolved (withhold path).
export function classifySkillLevel(skill, occExposure) {
  const text = skillText(skill).toLowerCase();

  // Rule 1: HUMAN gate (hard, wins over everything else).
  if (HUMAN_GATE.test(text)) {
    return { level: 'HUMAN', toolHint: 'NA', confidence: 'high', basis: 'human-gate' };
  }

  const hasEscoSignal = !!(skill && (skill.reuseLevel || skill.type));
  const hasOccExposure = !!(occExposure && occExposure.band && BAND_TO_LEVEL[occExposure.band]);

  // Rule 5: withhold fallback — no occupation exposure AND no ESCO signal to lean on.
  if (!hasOccExposure && !hasEscoSignal) {
    return { level: null, toolHint: null, confidence: 'withheld', basis: 'withheld' };
  }

  // Rule 3: occupation-band prior. If no occupation exposure exists but an ESCO signal does,
  // start from the most conservative prior (LOW) rather than guessing a band.
  let level = hasOccExposure ? BAND_TO_LEVEL[occExposure.band] : 'LOW';
  // Confidence inherits the occupation exposure's confidence, capped at 'moderate' — the band
  // is the OCCUPATION's, not the skill's; never claim 'high' confidence on a per-skill read.
  let confidence = hasOccExposure
    ? (occExposure.confidence === 'high' ? 'moderate' : (occExposure.confidence || 'moderate'))
    : 'low';
  let basis = hasOccExposure ? 'occupation-band' : 'occupation-band-conservative';

  // Rule 2: office-suite cap (hard) — applied before the ESCO modifier so the modifier cannot
  // lift a capped skill past MEDIUM.
  let officeCapped = false;
  if (OFFICE_RULE.test(text)) {
    if (level === 'HIGH') level = 'MEDIUM';
    officeCapped = true;
    basis = 'office-cap';
  }

  // Rule 4: ESCO modifier (soft, disclosed crosswalk — a modeling choice, not a reading of a
  // paper; precedent: the PW4 crosswalk comment, App.jsx). Skills with no ESCO fields skip this
  // step entirely (no guess). "type === 'soft-skill'" is this app's own mapped reading of the
  // raw ESCO skillType 'knowledge' facet (App.jsx: "ESCO skillType: skill/competence -> technical,
  // knowledge -> soft-skill") — the nearest available proxy for the spec's "type === 'knowledge'".
  if (hasEscoSignal && !officeCapped) {
    const leansMoreAutomatable = skill.reuseLevel === 'Transversal' || skill.type === 'soft-skill';
    const leansLessAutomatable = skill.reuseLevel === 'Occupation-specific';
    if (leansMoreAutomatable) {
      // MEDIUM -> HIGH only permitted when the occupation band itself is 'high' (never invent
      // a HIGH skill inside a low/moderate-exposure occupation).
      if (level === 'MEDIUM' && occExposure && occExposure.band === 'high') level = 'HIGH';
      else if (level === 'LOW') level = LEVEL_UP.LOW;
      basis = basis === 'occupation-band' || basis === 'occupation-band-conservative' ? 'esco-modifier' : basis;
    } else if (leansLessAutomatable) {
      level = LEVEL_DOWN[level] || level;
      basis = basis === 'occupation-band' || basis === 'occupation-band-conservative' ? 'esco-modifier' : basis;
    }
  }

  return { level, toolHint: null, confidence, basis };
}

export const SKILL_HUMAN_RULES = HUMAN_GATE;
export const OFFICE_CAP_RULE = OFFICE_RULE;
export { BAND_TO_LEVEL };
