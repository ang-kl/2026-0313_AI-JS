import {
  ORIGIN,
  SYSTEM_ACTOR,
  createReviewChange,
  sha256Hex,
  validateReviewChange,
  validateReviewHistory,
} from "../contracts/evidenceContracts.js";
import { LOCAL_HUMAN_ACTOR, ROSTER } from "./reviewerContract.js";

export const REVIEW_STATE_VERSION = "1.0.0";
export const FIRST_CLASS_REVIEW_OPERATIONS = Object.freeze([
  "split", "merge", "relabel", "escalate", "withhold", "resolve", "reopen", "undo",
]);
export const REVIEW_ITEM_STATUS = Object.freeze([
  "open", "accepted", "rejected", "resolved", "escalated", "withheld", "undone",
]);

const STRUCTURAL = new Set(["split", "merge", "relabel"]);
const OPEN_ACTION = new Set(["accept", "reject", "split", "merge", "relabel", "escalate", "withhold"]);
const REOPENABLE = new Set(["accepted", "rejected", "resolved", "escalated", "withheld"]);

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values) => [...new Set((values || []).filter(Boolean).map(String))];
const isIso = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const statusAfter = (verb) => ({
  accept: "accepted",
  reject: "rejected",
  split: "accepted",
  merge: "accepted",
  relabel: "accepted",
  escalate: "escalated",
  withhold: "withheld",
  resolve: "resolved",
  reopen: "open",
  undo: "undone",
}[verb] || "open");

function operationId(prefix, state, request, at) {
  return `${prefix}:${sha256Hex(`${state.source.id}|${state.history.length}|${request.verb}|${(request.targetSpanIds || []).join("|")}|${request.predecessorId || ""}|${at}`).slice(0, 24)}`;
}

function freezeSource(sourceId, sourceText) {
  const text = String(sourceText ?? "");
  return Object.freeze({ id: clean(sourceId), text, textHash: sha256Hex(text) });
}

function freezeSpan(span, sourceId) {
  return Object.freeze({
    id: clean(span?.id),
    sourceId: clean(span?.sourceId || sourceId),
    parentSpanIds: Object.freeze(unique(span?.parentSpanIds)),
    evidenceSpanIds: Object.freeze(unique(span?.evidenceSpanIds?.length ? span.evidenceSpanIds : [span?.id])),
    text: String(span?.text ?? ""),
    label: clean(span?.label) || null,
    origin: span?.origin || ORIGIN.SOURCE_VERBATIM,
    stale: span?.stale === true,
  });
}

export function createReviewState({ sourceId, sourceText, spans = [], history = [] } = {}) {
  const source = freezeSource(sourceId, sourceText);
  return {
    version: REVIEW_STATE_VERSION,
    source,
    spans: spans.map((span) => freezeSpan(span, source.id)),
    overlays: [],
    history: history.map((event) => Object.freeze({ ...event })),
    refusals: [],
  };
}

function eventMap(state) { return new Map(state.history.map((event) => [event.id, event])); }

function rootEventId(state, eventId) {
  const byId = eventMap(state);
  let current = byId.get(eventId);
  const seen = new Set();
  while (current && current.predecessorId && !seen.has(current.id)) {
    seen.add(current.id);
    const predecessor = byId.get(current.predecessorId);
    if (!predecessor) break;
    current = predecessor;
  }
  return current?.id || null;
}

export function projectReviewItems(state) {
  const items = new Map();
  const eventToRoot = new Map();
  for (const event of state.history) {
    const rootId = rootEventId(state, event.id) || event.id;
    eventToRoot.set(event.id, rootId);
    if (!items.has(rootId)) items.set(rootId, {
      id: rootId,
      status: "open",
      reviewerId: event.reviewerId,
      verb: event.verb,
      targetSpanIds: [...event.targetSpanIds],
      evidenceSpanIds: [...event.evidenceSpanIds],
      latestEventId: event.id,
      history: [],
    });
    const item = items.get(rootId);
    item.history.push(event.id);
    item.latestEventId = event.id;
    if (event.kind === "decision") item.status = event.restoredStatus || statusAfter(event.verb);
    if (event.kind === "change") item.status = event.restoredStatus || statusAfter(event.verb);
  }
  return [...items.values()];
}

export function seedReviewEvent(state, event) {
  const current = validateReviewState(state);
  if (!current.ok) return { ok: false, state, error: `review state is invalid: ${current.errors.join("; ")}` };
  const checked = validateReviewChange(event, { roster: ROSTER });
  if (!checked.ok) return { ok: false, state, error: checked.errors.join("; ") };
  if (state.history.some((row) => row.id === event.id)) return { ok: false, state, error: `review event ${event.id} already exists` };
  const next = { ...state, history: [...state.history, Object.freeze({ ...event })] };
  const transition = validateReviewTransition(state, next);
  return transition.ok ? { ok: true, state: next, eventIds: [event.id], error: null } : { ok: false, state, error: transition.errors.join("; ") };
}

function refusal(state, at, verb, error) {
  return {
    ok: false,
    state: { ...state, refusals: [...state.refusals, Object.freeze({ at, verb, error })] },
    eventIds: [],
    error,
  };
}

function targetRows(state, ids) {
  const rows = [...state.spans, ...state.overlays];
  return ids.map((id) => rows.find((row) => row.id === id));
}

function operationGuard(state, request, at) {
  if (!isIso(at)) return "review operation requires an ISO 8601 instant";
  if (![...FIRST_CLASS_REVIEW_OPERATIONS, "accept", "reject"].includes(request?.verb)) return `unknown review operation ${String(request?.verb)}`;
  if (request.actorId !== LOCAL_HUMAN_ACTOR.id) return `review decisions require ${LOCAL_HUMAN_ACTOR.id}; reviewer voices and the system cannot decide`;
  const targetSpanIds = unique(request.targetSpanIds);
  if (!targetSpanIds.length) return "review operation requires at least one target span";
  const targets = targetRows(state, targetSpanIds);
  if (targets.some((row) => !row)) return "review operation names an unknown target span";
  if (targets.some((row) => row.stale)) return "review operation cannot use a stale target span";
  if (request.verb === "split" && (targetSpanIds.length !== 1 || !Array.isArray(request.parts) || request.parts.filter((part) => clean(part?.text || part)).length < 2)) return "split requires one target and at least two non-empty parts";
  if (request.verb === "merge" && targetSpanIds.length < 2) return "merge requires at least two target spans";
  if (request.verb === "relabel" && !clean(request.label)) return "relabel requires a non-empty label";
  if (request.verb === "relabel" && request.origin && request.origin !== targets[0].origin) return `relabel cannot change or upgrade provenance from ${targets[0].origin} to ${request.origin}`;
  if (["escalate", "withhold"].includes(request.verb) && !clean(request.reason)) return `${request.verb} requires an explicit reason`;
  if (["resolve", "reopen", "undo"].includes(request.verb) && !clean(request.predecessorId)) return `${request.verb} requires the event it acts on`;
  if (!clean(request.predecessorId)) return "review operation must name the review item it acts on";
  const predecessor = state.history.find((event) => event.id === request.predecessorId);
  if (!predecessor) return `predecessor ${request.predecessorId} is not in the append-only history`;
  const rootId = rootEventId(state, predecessor.id);
  const item = projectReviewItems(state).find((row) => row.id === rootId);
  if (!item) return "review operation has no projectable review item";
  if (["resolve", "reopen", "undo"].includes(request.verb) && item.latestEventId !== predecessor.id) return `${request.verb} requires the latest event ${item.latestEventId}; ${predecessor.id} is earlier history`;
  if (OPEN_ACTION.has(request.verb) && item.status !== "open") return `${request.verb} requires an open review item; ${rootId} is ${item.status}`;
  if (request.verb === "resolve" && !["open", "escalated", "withheld"].includes(item.status)) return `resolve requires an open, escalated or withheld item; ${rootId} is ${item.status}`;
  if (request.verb === "reopen" && !REOPENABLE.has(item.status)) return `reopen requires a closed, escalated or withheld item; ${rootId} is ${item.status}`;
  return null;
}

function structuralOverlays(state, request, changeId) {
  const parents = targetRows(state, unique(request.targetSpanIds));
  const sourceIds = unique(parents.map((row) => row.sourceId));
  const evidenceSpanIds = unique(parents.flatMap((row) => row.evidenceSpanIds));
  // BLP-013. ORIGIN records how the STRING came to exist, not who decided to make it -
  // the decision event already carries the actor. A relabel inherits its parent's
  // provenance and can never change it. A split's parts are typed by the person, so
  // USER_AUTHORED is correct rather than merely conservative. A merge with no supplied
  // text is a deterministic join of the parents' own text, which no human wrote a
  // character of; labelling that USER_AUTHORED was an inconsistency inside this library,
  // because the change event producing it carries SYSTEM_ACTOR and DETERMINISTIC.
  // Supervisor ruling (ii), taken by the Human Lead 2026-09-20.
  const humanAuthoredText = request.verb === "merge" ? Boolean(clean(request.text)) : true;
  const origin = request.verb === "relabel"
    ? parents[0].origin
    : (humanAuthoredText ? ORIGIN.USER_AUTHORED : ORIGIN.DETERMINISTIC);
  const rows = request.verb === "split"
    ? request.parts.map((part, index) => ({ text: clean(part?.text || part), label: clean(part?.label) || null, index }))
    : [{ text: request.verb === "merge" ? clean(request.text) || parents.map((row) => row.text).join("; ") : parents[0].text, label: request.verb === "relabel" ? clean(request.label) : null, index: 0 }];
  return rows.map((row) => Object.freeze({
    id: `overlay:${sha256Hex(`${changeId}|${row.index}|${row.text}|${row.label || ""}`).slice(0, 24)}`,
    operation: request.verb,
    sourceIds: Object.freeze(sourceIds),
    sourceId: sourceIds.length === 1 ? sourceIds[0] : null,
    parentSpanIds: Object.freeze(unique(request.targetSpanIds)),
    evidenceSpanIds: Object.freeze(evidenceSpanIds),
    text: row.text,
    label: row.label,
    origin,
    createdByEventId: changeId,
    stale: false,
  }));
}

export function applyReviewOperation(state, request = {}, at) {
  const current = validateReviewState(state);
  if (!current.ok) return refusal(state, at, request.verb, `review state is invalid: ${current.errors.join("; ")}`);
  const error = operationGuard(state, request, at);
  if (error) return refusal(state, at, request.verb, error);
  const targets = unique(request.targetSpanIds);
  const predecessors = eventMap(state);
  const previousItem = projectReviewItems(state).find((item) => item.id === rootEventId(state, request.predecessorId));
  const decisionId = operationId("review-decision", state, request, at);
  const decision = Object.freeze({
    ...createReviewChange({
      id: decisionId,
      kind: "decision",
      verb: request.verb,
      targetSpanIds: targets,
      reviewerId: request.actorId,
      predecessorId: request.predecessorId,
      reason: request.reason,
      createdAt: at,
      evidenceSpanIds: unique(targetRows(state, targets).flatMap((row) => row.evidenceSpanIds)),
      origin: ORIGIN.USER_AUTHORED,
      proposedText: request.verb === "relabel" ? request.label : request.text,
    }),
    restoredStatus: request.verb === "undo" ? (predecessors.get(request.predecessorId)?.previousStatus || "open") : undefined,
    previousStatus: previousItem?.status || "open",
  });
  const checked = validateReviewChange(decision, { roster: ROSTER });
  if (!checked.ok) return refusal(state, at, request.verb, checked.errors.join("; "));
  let history = [...state.history, decision];
  let overlays = state.overlays;
  const eventIds = [decision.id];
  if (STRUCTURAL.has(request.verb)) {
    const changeId = operationId("review-change", { ...state, history }, request, at);
    const created = structuralOverlays(state, request, changeId);
    const change = Object.freeze({
      ...createReviewChange({
        id: changeId,
        kind: "change",
        verb: request.verb,
        targetSpanIds: targets,
        reviewerId: SYSTEM_ACTOR,
        predecessorId: decision.id,
        reason: request.reason,
        createdAt: at,
        evidenceSpanIds: unique(created.flatMap((row) => row.evidenceSpanIds)),
        origin: ORIGIN.DETERMINISTIC,
        proposedText: request.verb === "relabel" ? request.label : request.text,
      }),
      overlayIds: Object.freeze(created.map((row) => row.id)),
      parentSpanIds: Object.freeze(targets),
      previousStatus: previousItem?.status || "open",
    });
    const changeChecked = validateReviewChange(change, { roster: ROSTER });
    if (!changeChecked.ok) return refusal(state, at, request.verb, changeChecked.errors.join("; "));
    history = [...history, change];
    overlays = [...state.overlays, ...created];
    eventIds.push(change.id);
  }
  const next = { ...state, history, overlays };
  const final = validateReviewTransition(state, next);
  return final.ok ? { ok: true, state: next, eventIds, error: null } : refusal(state, at, request.verb, final.errors.join("; "));
}

export function validateReviewTransition(previous, next) {
  const errors = [];
  const current = validateReviewState(next);
  current.errors.forEach((error) => errors.push(error));
  if (!previous || typeof previous !== "object") return { ok: false, errors: [...errors, "previous review state must be an object"] };
  if (previous.source?.id !== next.source?.id || previous.source?.text !== next.source?.text || previous.source?.textHash !== next.source?.textHash) errors.push("review source is immutable across transitions");
  if (JSON.stringify(previous.spans || []) !== JSON.stringify((next.spans || []).slice(0, (previous.spans || []).length)) || (previous.spans || []).length !== (next.spans || []).length) errors.push("source spans are immutable across transitions");
  const historyPrefix = (next.history || []).slice(0, (previous.history || []).length);
  if (JSON.stringify(previous.history || []) !== JSON.stringify(historyPrefix)) errors.push("review history must preserve every earlier event as an unchanged prefix");
  const overlayPrefix = (next.overlays || []).slice(0, (previous.overlays || []).length);
  if (JSON.stringify(previous.overlays || []) !== JSON.stringify(overlayPrefix)) errors.push("review overlays must preserve every earlier overlay as an unchanged prefix");
  return { ok: errors.length === 0, errors };
}

export function validateReviewState(state) {
  const errors = [];
  if (!state || typeof state !== "object") return { ok: false, errors: ["review state must be an object"] };
  if (state.version !== REVIEW_STATE_VERSION) errors.push(`review state version must be ${REVIEW_STATE_VERSION}`);
  if (!state.source || !clean(state.source.id)) errors.push("review source id is required");
  if (!state.source || sha256Hex(String(state.source.text ?? "")) !== state.source.textHash) errors.push("review source text or hash changed; source is immutable");
  const rows = [...(state.spans || []), ...(state.overlays || [])];
  const ids = new Set();
  for (const row of rows) {
    if (!clean(row?.id)) errors.push("every review span and overlay needs an id");
    else if (ids.has(row.id)) errors.push(`duplicate review span or overlay id ${row.id}`);
    else ids.add(row.id);
    if (!(row?.sourceId || (Array.isArray(row?.sourceIds) && row.sourceIds.length))) errors.push(`review row ${row?.id || "unknown"} must preserve a source id`);
  }
  for (const overlay of state.overlays || []) {
    if (!Array.isArray(overlay.parentSpanIds) || !overlay.parentSpanIds.length || overlay.parentSpanIds.some((id) => !ids.has(id))) errors.push(`overlay ${overlay.id} must preserve known parent span ids`);
    if (overlay.operation === "relabel") {
      const parent = rows.find((row) => row.id === overlay.parentSpanIds[0]);
      if (parent && overlay.origin !== parent.origin) errors.push(`relabel overlay ${overlay.id} changed provenance`);
    }
  }
  const history = validateReviewHistory(state.history || [], { roster: ROSTER });
  history.errors.forEach((error) => errors.push(error));
  if (!Array.isArray(state.refusals)) errors.push("review refusals must be an array");
  return { ok: errors.length === 0, errors };
}
