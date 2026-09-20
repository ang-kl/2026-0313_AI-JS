// BLP-013 audit harness. Applies one deliberate defect at a time to a COPY of
// reviewState.js, runs the delivered 73-check suite against the copy, and reports
// whether the suite notices. A mutation the suite survives is a coverage gap.
// Nothing tracked is modified: both temp files are created and removed per run.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(REPO, "v3.1/src/review/reviewState.js");
const TEST = path.join(REPO, "v3.1/tests/review-state-contract.mjs");
const MUT_SRC = path.join(REPO, "v3.1/src/review/__audit_mutant.js");
const MUT_TEST = path.join(REPO, "v3.1/tests/__audit_mutant_contract.mjs");

const original = fs.readFileSync(SRC, "utf8");
const originalTest = fs.readFileSync(TEST, "utf8");

const MUTATIONS = [
  ["M01 split accepts a single part",       `request.parts.filter((part) => clean(part?.text || part)).length < 2`, `request.parts.filter((part) => clean(part?.text || part)).length < 1`],
  ["M02 split overlay drops parent ids",    `parentSpanIds: Object.freeze(unique(request.targetSpanIds)),\n    evidenceSpanIds: Object.freeze(evidenceSpanIds),`, `parentSpanIds: Object.freeze([]),\n    evidenceSpanIds: Object.freeze(evidenceSpanIds),`],
  ["M03 merge accepts one target",          `if (request.verb === "merge" && targetSpanIds.length < 2)`, `if (request.verb === "merge" && targetSpanIds.length < 1)`],
  ["M04 overlay drops evidence ids",        `evidenceSpanIds: Object.freeze(evidenceSpanIds),`, `evidenceSpanIds: Object.freeze([]),`],
  ["M05 relabel overrides parent origin",   `const origin = request.verb === "relabel"\n    ? parents[0].origin\n    : (humanAuthoredText ? ORIGIN.USER_AUTHORED : ORIGIN.DETERMINISTIC);`, `const origin = humanAuthoredText ? ORIGIN.USER_AUTHORED : ORIGIN.DETERMINISTIC;`],
  ["M25 merge origin always USER_AUTHORED", `const humanAuthoredText = request.verb === "merge" ? Boolean(clean(request.text)) : true;`, `const humanAuthoredText = true;`],
  ["M26 merge origin always DETERMINISTIC", `const humanAuthoredText = request.verb === "merge" ? Boolean(clean(request.text)) : true;`, `const humanAuthoredText = request.verb !== "merge";`],
  ["M06 relabel accepts an empty label",    `if (request.verb === "relabel" && !clean(request.label)) return "relabel requires a non-empty label";`, ``],
  ["M07 escalate/withhold need no reason",  `if (["escalate", "withhold"].includes(request.verb) && !clean(request.reason)) return \`\${request.verb} requires an explicit reason\`;`, ``],
  ["M08 resolve from any status",           `if (request.verb === "resolve" && !["open", "escalated", "withheld"].includes(item.status))`, `if (false && request.verb === "resolve" && !["open", "escalated", "withheld"].includes(item.status))`],
  ["M09 reopen from any status",            `if (request.verb === "reopen" && !REOPENABLE.has(item.status))`, `if (false && request.verb === "reopen" && !REOPENABLE.has(item.status))`],
  ["M10 undo always restores open",         `restoredStatus: request.verb === "undo" ? (predecessors.get(request.predecessorId)?.previousStatus || "open") : undefined,`, `restoredStatus: request.verb === "undo" ? "open" : undefined,`],
  ["M11 history prefix check removed",      `if (JSON.stringify(previous.history || []) !== JSON.stringify(historyPrefix)) errors.push("review history must preserve every earlier event as an unchanged prefix");`, ``],
  ["M12 any actor may decide",              `if (request.actorId !== LOCAL_HUMAN_ACTOR.id) return \`review decisions require \${LOCAL_HUMAN_ACTOR.id}; reviewer voices and the system cannot decide\`;`, ``],
  ["M13 stale targets allowed",             `if (targets.some((row) => row.stale)) return "review operation cannot use a stale target span";`, ``],
  ["M14 relabel provenance guard removed",  `if (request.verb === "relabel" && request.origin && request.origin !== targets[0].origin) return \`relabel cannot change or upgrade provenance from \${targets[0].origin} to \${request.origin}\`;`, ``],
  ["M15 latest-event guard removed",        `if (["resolve", "reopen", "undo"].includes(request.verb) && item.latestEventId !== predecessor.id) return \`\${request.verb} requires the latest event \${item.latestEventId}; \${predecessor.id} is earlier history\`;`, ``],
  ["M16 open-only guard removed",           `if (OPEN_ACTION.has(request.verb) && item.status !== "open") return \`\${request.verb} requires an open review item; \${rootId} is \${item.status}\`;`, ``],
  ["M17 escalate folds into open",          `  escalate: "escalated",`, `  escalate: "open",`],
  ["M18 withhold folds into open",          `  withhold: "withheld",`, `  withhold: "open",`],
  ["M19 overlay ids collide",               "id: `overlay:${sha256Hex(`${changeId}|${row.index}|${row.text}|${row.label || \"\"}`).slice(0, 24)}`,", "id: `overlay:fixed`,"],
  ["M20 relabel state invariant removed",   `      if (parent && overlay.origin !== parent.origin) errors.push(\`relabel overlay \${overlay.id} changed provenance\`);`, ``],
  ["M21 overlay prefix check removed",      `if (JSON.stringify(previous.overlays || []) !== JSON.stringify(overlayPrefix)) errors.push("review overlays must preserve every earlier overlay as an unchanged prefix");`, ``],
  ["M22 source immutability check removed", `if (previous.source?.id !== next.source?.id || previous.source?.text !== next.source?.text || previous.source?.textHash !== next.source?.textHash) errors.push("review source is immutable across transitions");`, ``],
  ["M23 refusal appends history anyway",    `    state: { ...state, refusals: [...state.refusals, Object.freeze({ at, verb, error })] },`, `    state: { ...state, history: [...state.history], refusals: [...state.refusals, Object.freeze({ at, verb, error })] },`],
  ["M24 split parts guard: one target",     `(targetSpanIds.length !== 1 || !Array.isArray(request.parts)`, `(false || !Array.isArray(request.parts)`],
];

const results = [];
for (const [name, find, replace] of MUTATIONS) {
  if (!original.includes(find)) { results.push([name, "ANCHOR-MISS", "the mutation anchor did not match the source"]); continue; }
  const mutated = original.replace(find, replace);
  if (mutated === original) { results.push([name, "NO-OP", "replacement produced an identical file"]); continue; }
  fs.writeFileSync(MUT_SRC, mutated);
  fs.writeFileSync(MUT_TEST, originalTest.replace('"../src/review/reviewState.js"', '"../src/review/__audit_mutant.js"'));
  let status, detail;
  try {
    const out = execFileSync("node", [MUT_TEST], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    status = "SURVIVED";
    detail = out.trim().split("\n").pop();
  } catch (e) {
    status = "KILLED";
    const text = `${e.stdout || ""}${e.stderr || ""}`;
    const m = text.match(/AssertionError.*?\n\s*(.+)/) || text.match(/(?:message:|Error:)\s*(.+)/);
    detail = (m ? m[1] : text.split("\n").find((l) => l.trim())) || "";
    detail = detail.replace(/\s+/g, " ").trim().slice(0, 150);
  }
  results.push([name, status, detail]);
}
fs.rmSync(MUT_SRC, { force: true });
fs.rmSync(MUT_TEST, { force: true });

const killed = results.filter((r) => r[1] === "KILLED").length;
const survived = results.filter((r) => r[1] === "SURVIVED");
for (const [name, status, detail] of results) console.log(`${status.padEnd(12)} ${name}\n             ${detail}`);
console.log(`\n=== ${killed}/${results.length} mutations killed; ${survived.length} SURVIVED ===`);
for (const [name] of survived) console.log(`  GAP: ${name}`);
