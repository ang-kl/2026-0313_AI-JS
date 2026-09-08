// Canonical reviewer roster and review-action boundaries (BLP-006). ONE roster replaces the competing
// reviewer counts that existed before it: the blueprint's nine day-one voices (goal/v3-blueprint.md
// section 5.5), the five consolidated code personas (Human Lead, 24-07 '26, formerly the PERSONA
// dictionary in shared.jsx), the comment "type" strings in ReviewStudioLegacy.jsx, the lens labels
// that CritCard used to render in the reviewer slot, and the advisory cards of the Critical Read
// pass. The vocabulary itself (REVIEW_KIND, REVIEW_VERB, DECISION_STATUS, CONFIDENCE, RISK) lives in
// src/contracts/evidenceContracts.js and is IMPORTED here, never redefined: the contract layer must
// not depend on a feature folder (Supervisor ruling, 08-09 '26).
//
// Rules this module keeps:
//   1. A reviewer is a ROSTER entry with a stable id "reviewer:<slug>", a display name, a lens, a
//      method, a confidence scale and an action boundary (the kinds and verbs it may author). A
//      voice that is not on the roster has no identity and is rendered as "voice not on roster",
//      never given a borrowed name.
//   2. Humans are NOT roster entries. A human actor is "human:<id>"; only a human may make a
//      decision or confirm a span, and a reviewer may never author a decision or an executed
//      change (criterion 3, enforced by validateReviewChange in the contract).
//   3. Blueprint names are recorded only where the mapping is unambiguous. Role Analyst and Signal
//      Auditor correspond to no blueprint name the Supervisor could establish, so their mapping is
//      UNRESOLVED and escalated to the Human Lead; the reconciliation record that once counted them
//      ("5 of 9" then "6 of 9", script/v3-step3-blueprint-reconciliation.md lines 96 and 197) did
//      not add up, which is the competing count this roster replaces.
//   4. The roster is one and complete: every blueprint section 5.5 reviewer is listed. Five are
//      ACTIVE (the Human Lead's consolidated set) plus the advisory Critical Read voice; the rest
//      are DECLARED with active: false, so a later requirement activates a voice rather than
//      inventing one. Which reviewers are MANDATORY for day one is blueprint open question 15.2, a
//      product decision the Human Lead owns; the roster records that question as still OPEN and
//      must not be read as having answered it.
//   5. A lens is not a reviewer. Deterministic lens labels (QoI check, market position, indicators,
//      trajectory, contradictions) render as lenses; the old fallback that badged an unattributed
//      rule output as "Signal Auditor" is removed.
//
// Pure module: no React, no DOM, no clock.

import { REVIEW_KIND, REVIEW_VERB, DECISION_STATUS, CONFIDENCE, RISK, ACTOR_PREFIX, SYSTEM_ACTOR, isReviewerActorId, isHumanActorId, actorKindOf, validateReviewChange } from "../contracts/evidenceContracts.js";

export const REVIEWER_CONTRACT_VERSION = "1.0.0";
export { REVIEW_KIND, REVIEW_VERB, DECISION_STATUS, CONFIDENCE, RISK, ACTOR_PREFIX, SYSTEM_ACTOR, isReviewerActorId, isHumanActorId, actorKindOf };

/** How a voice produces its output. RULE: deterministic rule over spans. AI_ADVISORY: a model pass, advisory only. */
export const REVIEWER_METHOD = Object.freeze(["RULE", "AI_ADVISORY"]);
/** Blueprint mapping state. RESOLVED: unambiguous section 5.5 name. UNRESOLVED: code-only voice, escalated. BLUEPRINT_ONLY: declared from section 5.5, not implemented. */
export const MAPPING_STATE = Object.freeze(["RESOLVED", "UNRESOLVED", "BLUEPRINT_ONLY"]);

const R = (entry) => Object.freeze({ anchored: true, confidenceScale: CONFIDENCE, note: null, ...entry, kinds: Object.freeze(entry.kinds || []), verbs: Object.freeze(entry.verbs || []), aliases: Object.freeze(entry.aliases || []) });

export const ROSTER = Object.freeze([
  R({ id: "reviewer:ai-exposure", displayName: "AI Exposure Reviewer", blueprintName: "AI Exposure Analyst", mapping: "RESOLVED",
    lens: "AI exposure (AIOE layer, delta and withhold logic)", method: "RULE", active: true,
    kinds: ["comment"], verbs: ["comment", "withhold"], source: "code (shared.jsx PERSONA, 24-07 '26) = blueprint 5.5" }),
  R({ id: "reviewer:process-redesign", displayName: "Process Redesign Reviewer", blueprintName: "Process Redesign Analyst", mapping: "RESOLVED",
    lens: "process redesign (role mash-up, broken process, redesign signals)", method: "RULE", active: true,
    kinds: ["comment", "proposal"], verbs: ["comment", "replace", "split", "merge"], source: "code (shared.jsx PERSONA, 24-07 '26) = blueprint 5.5" }),
  R({ id: "reviewer:role-analyst", displayName: "Role Analyst", blueprintName: null, mapping: "UNRESOLVED",
    lens: "role structure (bundled duties, duty clusters)", method: "RULE", active: true,
    kinds: ["comment", "proposal"], verbs: ["comment", "merge", "split"], source: "code only (shared.jsx PERSONA, 24-07 '26)",
    note: "No blueprint 5.5 name established; candidates are Process Redesign Analyst (role mash-up) and Organisation Designer (commonises repeated capabilities). Escalated to the Human Lead; not inferred." }),
  R({ id: "reviewer:candidate-advocate", displayName: "Candidate Advocate", blueprintName: "Candidate Advocate", mapping: "RESOLVED",
    lens: "worker value, dignity and truthful fit", method: "RULE", active: true,
    kinds: ["comment"], verbs: ["comment"], source: "code (shared.jsx PERSONA, 24-07 '26) = blueprint 5.5" }),
  R({ id: "reviewer:signal-auditor", displayName: "Signal Auditor", aliases: ["Evidence Auditor"], blueprintName: null, mapping: "UNRESOLVED",
    lens: "evidence sufficiency (weak phrases, unmeasurable claims)", method: "RULE", active: true,
    kinds: ["comment"], verbs: ["comment", "withhold"], source: "code only (shared.jsx PERSONA, 24-07 '26; absorbed Evidence Auditor)",
    note: "No blueprint 5.5 name established; candidates are Skeptic (challenges unsupported claims) and Hiring Filter Analyst (screening phrases). The reconciliation record tied it to the Critical Read arc. Escalated to the Human Lead; not inferred." }),
  R({ id: "reviewer:critical-read", displayName: "Critical Read (advisory)", blueprintName: null, mapping: "UNRESOLVED",
    lens: "falsification, vacancy teleology, pro-worker test, other side of the table", method: "AI_ADVISORY", active: true, anchored: false,
    kinds: ["comment"], verbs: ["comment"], source: "code only (App.jsx Critical Read pass; cards Skeptical read, Recruiter, Hiring Manager, Candidate Advocate coaching)",
    note: "Advisory prose at tab level, never span-anchored, never a number. Blueprint candidate is Skeptic (section 5.5) for the skeptical cards; the recruiter and hiring-manager cards are the same pass wearing other hats. Mapping escalated with Role Analyst and Signal Auditor. The App.jsx pass does not yet read its identity from this roster (known omission)." }),
  // Declared from blueprint section 5.5, not implemented. active: false, so they may not author events.
  R({ id: "reviewer:hiring-filter-analyst", displayName: "Hiring Filter Analyst", blueprintName: "Hiring Filter Analyst", mapping: "BLUEPRINT_ONLY", lens: "screening phrases, keyword traps, resume alignment", method: null, active: false, kinds: [], verbs: [], source: "blueprint 5.5" }),
  R({ id: "reviewer:recruiter", displayName: "Recruiter", blueprintName: "Recruiter", mapping: "BLUEPRINT_ONLY", lens: "market fit and title translation", method: null, active: false, kinds: [], verbs: [], source: "blueprint 5.5", note: "A recruiter card exists inside the Critical Read advisory pass; it is that voice, not this one, until wired." }),
  R({ id: "reviewer:hiring-manager", displayName: "Hiring Manager", blueprintName: "Hiring Manager", mapping: "BLUEPRINT_ONLY", lens: "outcome, scope, accountability and evidence questions", method: null, active: false, kinds: [], verbs: [], source: "blueprint 5.5", note: "A hiring-manager card exists inside the Critical Read advisory pass; it is that voice, not this one, until wired." }),
  R({ id: "reviewer:organisation-designer", displayName: "Organisation Designer", blueprintName: "Organisation Designer", mapping: "BLUEPRINT_ONLY", lens: "commonised capabilities and capability gaps", method: null, active: false, kinds: [], verbs: [], source: "blueprint 5.5" }),
  R({ id: "reviewer:skeptic", displayName: "Skeptic", blueprintName: "Skeptic", mapping: "BLUEPRINT_ONLY", lens: "weak demand, false hope, unsupported claims", method: null, active: false, kinds: [], verbs: [], source: "blueprint 5.5", note: "Candidate blueprint identity for the Critical Read skeptical cards and for Signal Auditor; unresolved, owned by the Human Lead." }),
  R({ id: "reviewer:interview-coach", displayName: "Interview Coach", blueprintName: "Interview Coach", mapping: "BLUEPRINT_ONLY", lens: "questions tied to business outcomes", method: null, active: false, kinds: [], verbs: [], source: "blueprint 5.5" }),
]);

/** Blueprint open question 15.2, recorded as still open. The roster's active set is the Human Lead's existing five plus the advisory voice; it is not an answer. */
export const DAY_ONE_QUESTION = Object.freeze({
  blueprintSection: "15.2", question: "Which persona reviewers are mandatory for day one?", status: "OPEN", owner: "human-lead",
  activeSet: Object.freeze(ROSTER.filter((r) => r.active).map((r) => r.id)),
  note: "The roster records what is active today; mandatory-for-day-one is a product decision the Human Lead has not yet made.",
});

/** The human who decides in the Review Studio today. No login exists, so the identity is withheld, not invented. */
export const LOCAL_HUMAN_ACTOR = Object.freeze({ id: "human:local-user", displayName: "you (this device; identity not recorded)" });

/** ReviewStudio comment "type" strings mapped onto the canonical verbs (the type stays as the UI label). */
export const COMMENT_TYPE_VERB = Object.freeze({
  "AI exposure": "comment", "suggested rewrite": "replace", "merge duties": "merge", "comment": "comment", "withhold claim": "withhold",
});

const BY_ID = new Map(ROSTER.map((r) => [r.id, r]));
const BY_NAME = new Map();
ROSTER.forEach((r) => { BY_NAME.set(r.displayName.toLowerCase(), r); r.aliases.forEach((a) => BY_NAME.set(a.toLowerCase(), r)); if (r.blueprintName) BY_NAME.set(r.blueprintName.toLowerCase(), r); });

export function rosterById(id) { return BY_ID.get(id) || null; }
/** Resolve an id, a display name, an alias or a blueprint name to its roster entry, or null. */
export function resolveReviewer(idOrName) {
  if (typeof idOrName !== "string") return null;
  return BY_ID.get(idOrName) || BY_NAME.get(idOrName.trim().toLowerCase()) || null;
}
export function reviewerDisplayName(id) { const r = BY_ID.get(id); return r ? r.displayName : null; }
/** Render paths use THIS: a declared-but-inactive voice must never appear as a live speaker (conformance-auditor W4). */
export function activeReviewerDisplayName(id) { const r = BY_ID.get(id); return r && r.active ? r.displayName : null; }
/** May this voice author an event of this kind and verb right now? Active, kind in boundary, verb in boundary. */
export function reviewerMayAuthor(reviewerId, kind, verb) {
  const r = BY_ID.get(reviewerId);
  return !!(r && r.active && r.kinds.includes(kind) && r.verbs.includes(verb));
}
/** An advisory "hat" (SKEPTICAL READ, RECRUITER SCREEN) must never be a roster name: one voice wears hats, it does not impersonate reviewers (conformance-auditor W3). */
export function isAdvisoryHatLegitimate(hat) { return typeof hat === "string" && hat.trim().length > 0 && !isRosterDisplayName(hat); }
export function activeReviewers() { return ROSTER.filter((r) => r.active); }
export function isRosterDisplayName(name) { return typeof name === "string" && BY_NAME.has(name.trim().toLowerCase()); }
export function reviewVerbForCommentType(type) { return COMMENT_TYPE_VERB[type] || null; }

/** Roster integrity: unique ids and names, namespaced ids, every active voice fully specified, humans never listed. */
export function validateRoster(roster = ROSTER) {
  const errors = [];
  if (!Array.isArray(roster) || !roster.length) return { ok: false, errors: ["roster must be a nonempty array"] };
  const ids = new Set(), names = new Set();
  roster.forEach((r, i) => {
    const at = `[${i}]`;
    if (!r || typeof r !== "object") { errors.push(`${at} entry must be an object`); return; }
    if (!isReviewerActorId(r.id)) errors.push(`${at} id must be ${ACTOR_PREFIX.REVIEWER}<slug>, got ${r.id}`);
    if (ids.has(r.id)) errors.push(`${at} duplicate id ${r.id}`); ids.add(r.id);
    const name = String(r.displayName || "").toLowerCase();
    if (!name) errors.push(`${at} displayName required`); else if (names.has(name)) errors.push(`${at} duplicate displayName ${r.displayName}`); names.add(name);
    (r.aliases || []).forEach((a) => { const k = String(a).toLowerCase(); if (names.has(k)) errors.push(`${at} alias ${a} collides with a name`); names.add(k); });
    if (!MAPPING_STATE.includes(r.mapping)) errors.push(`${at} mapping must be one of ${MAPPING_STATE.join(", ")}`);
    if (r.mapping === "RESOLVED" && !r.blueprintName) errors.push(`${at} RESOLVED mapping requires blueprintName`);
    if (r.mapping === "UNRESOLVED" && r.blueprintName) errors.push(`${at} UNRESOLVED mapping must not carry a blueprintName (that would be an inference)`);
    if (typeof r.active !== "boolean") errors.push(`${at} active must be boolean`);
    if (r.active) {
      if (!r.lens) errors.push(`${at} active reviewer needs a lens`);
      if (!REVIEWER_METHOD.includes(r.method)) errors.push(`${at} active reviewer needs a method in ${REVIEWER_METHOD.join(", ")}`);
      if (!Array.isArray(r.confidenceScale) || !r.confidenceScale.length || !r.confidenceScale.every((c) => CONFIDENCE.includes(c))) errors.push(`${at} active reviewer needs a confidence scale drawn from ${CONFIDENCE.join(", ")}`);
      if (!Array.isArray(r.kinds) || !r.kinds.length) errors.push(`${at} active reviewer needs an action boundary (kinds)`);
      if (!Array.isArray(r.verbs) || !r.verbs.length) errors.push(`${at} active reviewer needs an action boundary (verbs)`);
    }
    (r.kinds || []).forEach((k) => { if (!REVIEW_KIND.includes(k)) errors.push(`${at} unknown kind ${k}`); if (k === "decision" || k === "change") errors.push(`${at} a reviewer may never author kind ${k} (humans decide, the system executes)`); });
    (r.verbs || []).forEach((v) => { if (!REVIEW_VERB.includes(v)) errors.push(`${at} unknown verb ${v}`); if (["accept", "reject", "resolve", "reopen", "undo"].includes(v)) errors.push(`${at} verb ${v} is a human decision verb; a reviewer may not use it`); });
    if (r.method === "AI_ADVISORY" && r.anchored !== false) errors.push(`${at} an advisory voice is not span-anchored`);
  });
  return { ok: errors.length === 0, errors };
}

/** Boundary check for one event against the roster; the same check the contract runs when given the roster. */
export function validateReviewerBoundary(change, roster = ROSTER) { return validateReviewChange(change, { roster }); }

/** Is a rendered voice name legitimate: a roster display name, a roster alias, or a lens label (never a bare unknown reviewer name)? */
export function isLegitimateVoice(name) { return isRosterDisplayName(name); }
