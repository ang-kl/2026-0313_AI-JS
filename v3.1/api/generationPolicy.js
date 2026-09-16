import {
  ORIGIN, computeEvidenceHash, createOutputBlock, sha256Hex, validateOutputBlock,
} from "../src/contracts/evidenceContracts.js";

export const GENERATION_SERVICE_VERSION = "1.0.0";
export const GENERATION_TASKS = Object.freeze({
  "resume-claim": Object.freeze({
    promptVersion: "resume-claim-grounded-1",
    schemaVersion: "resume-claim-1",
    maxTokens: 500,
    instructions: "Write one concise resume claim using only supplied evidence. Return JSON only: {\"text\":string,\"sourceRefs\":string[]}. Cite every factual statement. Do not add numbers, employers, scope, outcomes, seniority, ownership, or tools absent from evidence.",
  }),
  "cover-letter": Object.freeze({
    promptVersion: "cover-letter-grounded-1",
    schemaVersion: "cover-letter-sentences-1",
    maxTokens: 1200,
    instructions: "Write a concise cover-letter body using only supplied evidence. Return JSON only: {\"sentences\":[{\"text\":string,\"sourceRefs\":string[]}]}. Every sentence must cite its exact evidence. Do not add numbers, employers, scope, outcomes, seniority, ownership, or tools absent from evidence.",
  }),
});

const plainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const exactKeys = (value, keys) => plainObject(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const numbers = (value) => String(value || "").match(/(?:\d[\d,.]*%?)/g) || [];
const words = (value) => String(value || "").toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+'-]*/gu) || [];
const HIGH_RISK = new Set(["achieved", "built", "created", "delivered", "grew", "improved", "increased", "launched", "led", "managed", "owned", "reduced", "saved", "scaled", "transformed"]);
const EVIDENCE_ROLES = new Set(["candidate-proof", "job-evidence"]);
const ACCEPTED_PROOF_STATES = new Set(["DEMONSTRATED", "CERTIFIED"]);

export function validateGenerationRequest(body) {
  const errors = [];
  const task = GENERATION_TASKS[body?.task];
  if (!task) errors.push(`task must be one of ${Object.keys(GENERATION_TASKS).join(", ")}`);
  if (!Array.isArray(body?.allowlist) || !body.allowlist.length || body.allowlist.some((id) => !nonempty(id))) errors.push("allowlist must contain at least one evidence id");
  if (!Array.isArray(body?.evidence) || !body.evidence.length) errors.push("evidence must be a non-empty array");
  const evidence = Array.isArray(body?.evidence) ? body.evidence : [];
  const ids = new Set();
  for (const item of evidence) {
    if (!exactKeys(item, ["id", "text", "contentHash", "role", "state"]) || !nonempty(item.id) || !nonempty(item.text) || !/^[0-9a-f]{64}$/.test(item.contentHash || "") || !EVIDENCE_ROLES.has(item.role) || !nonempty(item.state)) {
      errors.push("each evidence item must have exactly id, text, sha256 contentHash, role and state");
      continue;
    }
    if (ids.has(item.id)) errors.push(`duplicate evidence id ${item.id}`);
    ids.add(item.id);
    if (item.contentHash !== sha256Hex(item.text)) errors.push(`stale contentHash for evidence ${item.id}`);
    if (item.role === "candidate-proof" && !ACCEPTED_PROOF_STATES.has(item.state)) errors.push(`candidate proof ${item.id} is ${item.state}, not DEMONSTRATED or CERTIFIED`);
    if (item.role === "job-evidence" && item.state !== "CURRENT") errors.push(`job evidence ${item.id} is ${item.state}, not CURRENT`);
  }
  const allowlist = Array.isArray(body?.allowlist) ? body.allowlist : [];
  if (new Set(allowlist).size !== allowlist.length) errors.push("allowlist must not contain duplicate ids");
  for (const id of allowlist) if (!ids.has(id)) errors.push(`allowlisted evidence ${id} was not supplied`);
  if (body?.evidenceHash !== computeEvidenceHash(allowlist)) errors.push("stale evidenceHash for the supplied allowlist");
  return { ok: errors.length === 0, errors, task };
}

function validateCitations(sourceRefs, allowlist, evidenceById, label) {
  const errors = [];
  if (!Array.isArray(sourceRefs) || !sourceRefs.length || sourceRefs.some((id) => !nonempty(id))) return [`${label}.sourceRefs must contain at least one evidence id`];
  if (new Set(sourceRefs).size !== sourceRefs.length) errors.push(`${label}.sourceRefs must not contain duplicates`);
  for (const id of sourceRefs) {
    if (!allowlist.includes(id)) errors.push(`${label} cites ${id} outside the evidence allowlist`);
    if (!evidenceById.has(id)) errors.push(`${label} cites unknown evidence ${id}`);
  }
  return errors;
}

export function validateGeneratedPayload(taskId, payload, { allowlist, evidence }) {
  const errors = [];
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  let sentences = [];
  if (taskId === "resume-claim") {
    if (!exactKeys(payload, ["text", "sourceRefs"]) || !nonempty(payload?.text)) errors.push("resume-claim output must have exactly non-empty text and sourceRefs");
    else {
      errors.push(...validateCitations(payload.sourceRefs, allowlist, evidenceById, "resume claim"));
      sentences = [{ text: payload.text.trim(), sourceRefs: payload.sourceRefs }];
    }
  } else if (taskId === "cover-letter") {
    if (!exactKeys(payload, ["sentences"]) || !Array.isArray(payload?.sentences) || !payload.sentences.length) errors.push("cover-letter output must have exactly a non-empty sentences array");
    else payload.sentences.forEach((sentence, index) => {
      if (!exactKeys(sentence, ["text", "sourceRefs"]) || !nonempty(sentence.text)) errors.push(`sentence ${index + 1} must have exactly non-empty text and sourceRefs`);
      else {
        errors.push(...validateCitations(sentence.sourceRefs, allowlist, evidenceById, `sentence ${index + 1}`));
        sentences.push({ text: sentence.text.trim(), sourceRefs: sentence.sourceRefs });
      }
    });
  } else errors.push(`unknown generation task ${String(taskId)}`);
  for (const [index, sentence] of sentences.entries()) {
    const cited = sentence.sourceRefs.map((id) => evidenceById.get(id)?.text || "").join("\n");
    const invented = [...new Set(numbers(sentence.text).filter((number) => !numbers(cited).includes(number)))];
    if (invented.length) errors.push(`sentence ${index + 1} contains invented number${invented.length === 1 ? "" : "s"}: ${invented.join(", ")}`);
    const citedWords = new Set(words(cited));
    const unsupportedRisk = [...new Set(words(sentence.text).filter((word) => HIGH_RISK.has(word) && !citedWords.has(word)))];
    if (unsupportedRisk.length) errors.push(`sentence ${index + 1} contains unsupported achievement verb${unsupportedRisk.length === 1 ? "" : "s"}: ${unsupportedRisk.join(", ")}`);
  }
  if (sentences.length) {
    const citedItems = [...new Set(sentences.flatMap((sentence) => sentence.sourceRefs))].map((id) => evidenceById.get(id)).filter(Boolean);
    const roles = new Set(citedItems.map((item) => item.role));
    if (!roles.has("candidate-proof")) errors.push("output cites no confirmed candidate proof");
    if (!roles.has("job-evidence")) errors.push("output cites no current job evidence");
  }
  return { ok: errors.length === 0, errors, sentences };
}

export function assembleGeneration(taskId, providerPayload, request, { model, createdAt } = {}) {
  const task = GENERATION_TASKS[taskId];
  const verdict = validateGeneratedPayload(taskId, providerPayload, request);
  if (!task || !verdict.ok) return { ok: false, errors: verdict.errors, output: null, trace: [] };
  const sourceRefs = [...new Set(verdict.sentences.flatMap((sentence) => sentence.sourceRefs))];
  const text = verdict.sentences.map((sentence) => sentence.text).join(" ");
  const output = createOutputBlock({ id: `generated:${taskId}:${sha256Hex(`${text}\n${createdAt || ""}`).slice(0, 24)}`, taskId, promptVersion: task.promptVersion, schemaVersion: task.schemaVersion, model, text, sourceRefs, state: "PROPOSED", policyResult: "PASS", origin: ORIGIN.AI_ASSISTED, createdAt });
  const outputVerdict = validateOutputBlock(output, { allowlist: request.allowlist });
  if (!outputVerdict.ok) return { ok: false, errors: outputVerdict.errors, output: null, trace: [] };
  return { ok: true, errors: [], output, trace: verdict.sentences.map((sentence, index) => ({ sentence: index + 1, text: sentence.text, sourceRefs: [...sentence.sourceRefs] })) };
}

export function providerPrompt(taskId, evidence, allowlist) {
  const task = GENERATION_TASKS[taskId];
  const allowed = new Set(allowlist);
  return {
    model: "sonnet",
    max_tokens: task.maxTokens,
    system: task.instructions,
    messages: [{ role: "user", content: JSON.stringify({ task: taskId, evidence: evidence.filter((item) => allowed.has(item.id)).map(({ id, text, role, state }) => ({ id, text, role, state })) }) }],
  };
}
