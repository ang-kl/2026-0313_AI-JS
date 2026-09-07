import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const v31Root = path.resolve(here, "..");
const docRoot = path.join(v31Root, "doc");

const registerPath = path.join(docRoot, "v3-blueprint-completion-register.json");
const defaultSchemaPath = path.join(docRoot, "v3-blueprint-completion-register.schema.json");
const defaultInstructionsPath = path.join(docRoot, "V3-Blueprint-Completion-Instructions.md");
const indexPath = path.join(docRoot, "v3-feature-map-index.json");
const indexHtmlPath = path.join(docRoot, "V3-Agent-Readable-Feature-Map-Index.html");

const allowedStatuses = [
  "NOT_STARTED", "BLOCKED", "IN_PROGRESS", "IMPLEMENTED_UNVERIFIED",
  "AUTOMATED_VERIFIED", "DEPLOYED_VERIFIED", "PHYSICAL_VERIFIED", "WITHHELD", "COMPLETE",
];
const allowedPriorities = ["P0", "P1", "P2", "P3", "P4", "P5"];
const requiredItemFields = [
  "id", "title", "requirement", "priority", "status", "dependencies", "ownerRole",
  "acceptanceCriteria", "evidenceLinks", "blockers", "affectedFiles", "protectedScopes",
  "completionPolicy", "provenance", "statusHistory", "supervisorApproval",
];
const canonicalProtectedScopes = [
  "Step 1 behaviour", "existing Step 2 behaviour", "v3/", "Railway configuration",
  "five canonical Work Universe graphs", "three signal model", "Role Graph and FAB return",
  "Clean and Full Review", "evidence withholding", "deterministic and AI provenance separation",
];
const provenanceGroups = {
  implementation: ["implementationCommit"],
  merge: ["mergeCommit"],
  deployment: ["deploymentStatus"],
  automatedRuntime: ["automatedRuntimeVerification"],
  physicalRuntime: ["physicalRuntimeVerification"],
};
const policyGroups = {
  deployment: ["requiresDeployment", "deploymentRequired"],
  automatedRuntime: ["requiresAutomatedRuntime", "automatedRuntimeRequired"],
  physicalRuntime: ["requiresPhysicalRuntime", "physicalRuntimeRequired"],
};
const permittedTransitions = [
  ["NOT_STARTED", "IN_PROGRESS"], ["NOT_STARTED", "BLOCKED"], ["IN_PROGRESS", "BLOCKED"],
  ["BLOCKED", "IN_PROGRESS"], ["IN_PROGRESS", "IMPLEMENTED_UNVERIFIED"],
  ["IMPLEMENTED_UNVERIFIED", "IN_PROGRESS"], ["IMPLEMENTED_UNVERIFIED", "AUTOMATED_VERIFIED"],
  ["AUTOMATED_VERIFIED", "IN_PROGRESS"], ["AUTOMATED_VERIFIED", "DEPLOYED_VERIFIED"],
  ["DEPLOYED_VERIFIED", "IN_PROGRESS"], ["DEPLOYED_VERIFIED", "PHYSICAL_VERIFIED"],
  ["AUTOMATED_VERIFIED", "COMPLETE"], ["DEPLOYED_VERIFIED", "COMPLETE"],
  ["PHYSICAL_VERIFIED", "COMPLETE"], ["NOT_STARTED", "WITHHELD"],
  ["IN_PROGRESS", "WITHHELD"], ["IMPLEMENTED_UNVERIFIED", "WITHHELD"],
  ["AUTOMATED_VERIFIED", "WITHHELD"], ["DEPLOYED_VERIFIED", "WITHHELD"],
  ["WITHHELD", "IN_PROGRESS"], ["COMPLETE", "IN_PROGRESS"], ["COMPLETE", "WITHHELD"],
];
const completionPolicies = Object.fromEntries(Array.from({ length: 30 }, (_, index) => {
  const number = index + 1;
  return [`BLP-${String(number).padStart(3, "0")}`, {
    deployment: number >= 27,
    automatedRuntime: number !== 1,
    physicalRuntime: number >= 29,
  }];
}));

function fail(message) { throw new Error(`Blueprint completion contract: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }
function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function nonemptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function sameSet(actual, expected) {
  return actual.length === expected.length && expected.every((value) => actual.includes(value));
}
function readText(filePath, label) {
  assert(fs.existsSync(filePath), `missing ${label}: ${path.relative(v31Root, filePath)}`);
  return fs.readFileSync(filePath, "utf8");
}
function readJson(filePath, label) {
  try { return JSON.parse(readText(filePath, label)); }
  catch (error) { fail(`${label} is not valid JSON: ${error.message}`); }
}
function assertNonemptyTextList(value, scope) {
  assert(Array.isArray(value) && value.length > 0, `${scope} must be a nonempty array`);
  assert(value.every(nonemptyString), `${scope} must contain only nonempty strings`);
}
function assertExactSet(actual, expected, scope) {
  assert(Array.isArray(actual), `${scope} must be an array`);
  assert(new Set(actual).size === actual.length, `${scope} must not contain duplicates`);
  const missing = expected.filter((value) => !actual.includes(value));
  const extra = actual.filter((value) => !expected.includes(value));
  assert(!missing.length && !extra.length, `${scope} drifted; missing [${missing.join(", ")}], extra [${extra.join(", ")}]`);
}
function resolveLocalRef(schema, node) {
  if (!isObject(node) || !nonemptyString(node.$ref)) return node;
  assert(node.$ref.startsWith("#/"), `schema uses unsupported non-local reference ${node.$ref}`);
  const resolved = node.$ref.slice(2).split("/").reduce((value, segment) => {
    const key = segment.replace(/~1/g, "/").replace(/~0/g, "~");
    return isObject(value) ? value[key] : undefined;
  }, schema);
  assert(isObject(resolved), `schema reference does not resolve: ${node.$ref}`);
  return resolved;
}
function findObjectSchema(schema, requiredProperties) {
  const seen = new Set();
  function visit(node) {
    if (!isObject(node) || seen.has(node)) return null;
    seen.add(node);
    const resolved = resolveLocalRef(schema, node);
    if (resolved !== node) { const match = visit(resolved); if (match) return match; }
    if (isObject(resolved.properties) && requiredProperties.every((key) => key in resolved.properties)) return resolved;
    for (const value of Object.values(resolved)) {
      if (isObject(value)) { const match = visit(value); if (match) return match; }
      else if (Array.isArray(value)) {
        for (const child of value) { const match = visit(child); if (match) return match; }
      }
    }
    return null;
  }
  return visit(schema);
}
function schemaProperty(schema, objectSchema, property) {
  assert(isObject(objectSchema.properties?.[property]), `schema must define property ${property}`);
  return resolveLocalRef(schema, objectSchema.properties[property]);
}
function schemaIncludesType(schema, node, type, seen = new Set()) {
  if (!isObject(node) || seen.has(node)) return false;
  seen.add(node);
  const resolved = resolveLocalRef(schema, node);
  if (resolved !== node && schemaIncludesType(schema, resolved, type, seen)) return true;
  if (resolved.type === type || (Array.isArray(resolved.type) && resolved.type.includes(type))) return true;
  return ["allOf", "anyOf", "oneOf"].some((key) =>
    Array.isArray(resolved[key]) && resolved[key].some((child) => schemaIncludesType(schema, child, type, seen))
  );
}

function validateJsonSchema(rootSchema, node, value, dataPath = "$", seenRefs = new Set()) {
  const errors = [];
  if (!isObject(node)) return errors;
  if (node.$ref) {
    if (seenRefs.has(node.$ref)) return errors;
    const nextSeen = new Set(seenRefs).add(node.$ref);
    errors.push(...validateJsonSchema(rootSchema, resolveLocalRef(rootSchema, node), value, dataPath, nextSeen));
  }
  const deepEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  const matchesType = (expected) => {
    if (expected === "null") return value === null;
    if (expected === "array") return Array.isArray(value);
    if (expected === "object") return isObject(value);
    if (expected === "integer") return Number.isInteger(value);
    return typeof value === expected;
  };
  const types = Array.isArray(node.type) ? node.type : node.type ? [node.type] : [];
  if (types.length && !types.some(matchesType)) {
    errors.push(`${dataPath}: expected ${types.join(" or ")}`);
    return errors;
  }
  if (Object.hasOwn(node, "const") && !deepEqual(value, node.const)) errors.push(`${dataPath}: const mismatch`);
  if (Array.isArray(node.enum) && !node.enum.some((entry) => deepEqual(value, entry))) errors.push(`${dataPath}: value is outside enum`);
  if (Array.isArray(node.oneOf)) {
    const matches = node.oneOf.filter((candidate) => validateJsonSchema(rootSchema, candidate, value, dataPath, seenRefs).length === 0);
    if (matches.length !== 1) errors.push(`${dataPath}: expected exactly one oneOf match, found ${matches.length}`);
  }
  for (const candidate of node.allOf || []) errors.push(...validateJsonSchema(rootSchema, candidate, value, dataPath, seenRefs));
  if (node.if && validateJsonSchema(rootSchema, node.if, value, dataPath, seenRefs).length === 0 && node.then) {
    errors.push(...validateJsonSchema(rootSchema, node.then, value, dataPath, seenRefs));
  }
  if (typeof value === "string") {
    if (node.minLength !== undefined && value.length < node.minLength) errors.push(`${dataPath}: string is too short`);
    if (node.pattern && !(new RegExp(node.pattern)).test(value)) errors.push(`${dataPath}: pattern mismatch`);
    if (node.format === "date-time" && (Number.isNaN(Date.parse(value)) || !/T/.test(value))) errors.push(`${dataPath}: invalid date-time`);
    if (node.format === "uri") {
      try { new URL(value); } catch { errors.push(`${dataPath}: invalid URI`); }
    }
  }
  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems) errors.push(`${dataPath}: too few items`);
    if (node.maxItems !== undefined && value.length > node.maxItems) errors.push(`${dataPath}: too many items`);
    if (node.uniqueItems && new Set(value.map((entry) => JSON.stringify(entry))).size !== value.length) errors.push(`${dataPath}: duplicate items`);
    const prefixCount = node.prefixItems?.length || 0;
    for (let index = 0; index < Math.min(prefixCount, value.length); index += 1) {
      errors.push(...validateJsonSchema(rootSchema, node.prefixItems[index], value[index], `${dataPath}[${index}]`, seenRefs));
    }
    if (node.items === false && value.length > prefixCount) errors.push(`${dataPath}: additional array items are prohibited`);
    else if (isObject(node.items)) {
      const start = prefixCount || 0;
      for (let index = start; index < value.length; index += 1) {
        errors.push(...validateJsonSchema(rootSchema, node.items, value[index], `${dataPath}[${index}]`, seenRefs));
      }
    }
    if (node.contains) {
      const matches = value.filter((entry, index) => validateJsonSchema(rootSchema, node.contains, entry, `${dataPath}[${index}]`, seenRefs).length === 0).length;
      if (matches < (node.minContains ?? 1)) errors.push(`${dataPath}: contains matched ${matches} items`);
    }
  }
  if (isObject(value)) {
    for (const required of node.required || []) {
      if (!Object.hasOwn(value, required)) errors.push(`${dataPath}: missing required property ${required}`);
    }
    for (const [key, childSchema] of Object.entries(node.properties || {})) {
      if (Object.hasOwn(value, key)) errors.push(...validateJsonSchema(rootSchema, childSchema, value[key], `${dataPath}.${key}`, seenRefs));
    }
    if (node.additionalProperties === false) {
      const allowed = new Set(Object.keys(node.properties || {}));
      for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${dataPath}: additional property ${key}`);
    }
  }
  return errors;
}
function schemaStringPattern(schema, node, seen = new Set()) {
  if (!isObject(node) || seen.has(node)) return null;
  seen.add(node);
  const resolved = resolveLocalRef(schema, node);
  if (resolved !== node) {
    const pattern = schemaStringPattern(schema, resolved, seen);
    if (pattern) return pattern;
  }
  if (nonemptyString(resolved.pattern)) return resolved.pattern;
  for (const key of ["allOf", "anyOf", "oneOf"]) {
    if (!Array.isArray(resolved[key])) continue;
    for (const child of resolved[key]) {
      const pattern = schemaStringPattern(schema, child, seen);
      if (pattern) return pattern;
    }
  }
  return null;
}
function findOneKey(holder, aliases, scope) {
  const matches = aliases.filter((key) => Object.prototype.hasOwnProperty.call(holder, key));
  assert(matches.length === 1, `${scope} must contain exactly one of: ${aliases.join(", ")}`);
  return matches[0];
}
function recordState(record) { return isObject(record) ? record.state ?? record.status : undefined; }
function shaFrom(record) {
  if (!isObject(record)) return "";
  return [record.commitSha, record.sha, record.commit, record.value].find(nonemptyString) || "";
}
function assertCommitSha(value, scope) {
  assert(/^[0-9a-f]{40}$/i.test(value), `${scope} must be a full 40-character commit SHA`);
}
function policyFlag(policy, group, scope) {
  const key = findOneKey(policy, policyGroups[group], `${scope}.${group}`);
  assert(typeof policy[key] === "boolean", `${scope}.${key} must be boolean`);
  return policy[key];
}
function isOpenedPullRequestUrl(value) {
  return nonemptyString(value) && /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+\/?(?:[?#].*)?$/i.test(value);
}
function assertPullRequestEvidence(link, scope) {
  assert(isObject(link), `${scope} must be an object`);
  assert(isOpenedPullRequestUrl(link.reference), `${scope} must identify an opened pull request; compare and /pull/new URLs are not evidence`);
}
function isProhibitedAffectedPath(filePath) {
  const normalized = filePath.trim().replaceAll("\\", "/").replace(/^\.\//, "");
  if (/^v3(?:\/|$)/i.test(normalized)) return true;
  return /^(?:railway(?:\/|\.(?:json|toml))|nixpacks\.toml|procfile|dockerfile)$/i.test(normalized);
}
function expandIdRange(startId, endId) {
  const start = Number(startId.slice(-3));
  const end = Number(endId.slice(-3));
  assert(start <= end, `instruction dependency range is reversed: ${startId} through ${endId}`);
  return Array.from({ length: end - start + 1 }, (_, offset) => `BLP-${String(start + offset).padStart(3, "0")}`);
}
function parseInstructionDependencies(text, rowIndex, rows) {
  const value = text.trim();
  if (/^none$/i.test(value)) return [];
  if (/all\s+(?:in-scope\s+)?p0-p4/i.test(value)) {
    return rows.slice(0, rowIndex).filter((row) => /^P[0-4]$/.test(row.priority)).map((row) => row.id);
  }
  if (/all\s+(?:prior|previous)/i.test(value)) return rows.slice(0, rowIndex).map((row) => row.id);
  const ids = [];
  const rangePattern = /`?(BLP-\d{3})`?\s+through\s+`?(BLP-\d{3})`?/gi;
  const remainder = value.replace(rangePattern, (_, startId, endId) => {
    ids.push(...expandIdRange(startId, endId));
    return " ";
  });
  for (const match of remainder.matchAll(/BLP-\d{3}/g)) ids.push(match[0]);
  assert(ids.length > 0, `cannot parse instruction dependencies for ${rows[rowIndex].id}: ${value}`);
  return [...new Set(ids)];
}
function transitionEndpoints(entry, scope) {
  assert(isObject(entry), `${scope} must be an object`);
  const from = entry.fromStatus ?? entry.from;
  const to = entry.toStatus ?? entry.to;
  assert(from === null || allowedStatuses.includes(from), `${scope} has invalid from status ${from}`);
  assert(allowedStatuses.includes(to), `${scope} has invalid to status ${to}`);
  assert(nonemptyString(entry.reason), `${scope}.reason must be nonempty`);
  assert(nonemptyString(entry.changedAt) && !Number.isNaN(Date.parse(entry.changedAt)), `${scope}.changedAt must be a date-time`);
  return { from, to };
}
function assertStatusHistory(item, scope) {
  assert(Array.isArray(item.statusHistory), `${scope}.statusHistory must be an array`);
  if (!item.statusHistory.length) {
    assert(item.status === "NOT_STARTED", `${scope} without status history must remain NOT_STARTED`);
    return;
  }
  let previous = item.statusHistory[0].fromStatus ?? item.statusHistory[0].from;
  assert(previous === null || previous === "NOT_STARTED", `${scope}.statusHistory must begin with initial state or NOT_STARTED`);
  let previousTime = -Infinity;
  for (const [index, entry] of item.statusHistory.entries()) {
    const entryScope = `${scope}.statusHistory[${index}]`;
    const { from, to } = transitionEndpoints(entry, entryScope);
    assert(from === previous, `${entryScope}.fromStatus must continue from ${previous}`);
    if (from === null) assert(to === "NOT_STARTED", `${entryScope} initial event must establish NOT_STARTED`);
    else assert(permittedTransitions.some(([a, b]) => a === from && b === to), `${entryScope} uses prohibited transition ${from} -> ${to}`);
    if (["AUTOMATED_VERIFIED", "DEPLOYED_VERIFIED", "PHYSICAL_VERIFIED", "COMPLETE"].includes(to)) {
      assert(entry.approvedBy === "blueprint-supervisor", `${entryScope} controlled transition requires Blueprint Supervisor approval`);
      assert(Array.isArray(entry.evidenceLinks) && entry.evidenceLinks.length > 0, `${entryScope} controlled transition requires supporting evidence`);
    }
    const changedAt = Date.parse(entry.changedAt);
    assert(changedAt >= previousTime, `${entryScope}.changedAt is out of order`);
    previousTime = changedAt;
    previous = to;
  }
  assert(previous === item.status, `${scope}.status must equal the final status-history destination ${previous}`);
}
function assertStatusProvenanceConsistency(item, records, scope) {
  const implementationRecorded = recordState(records.implementation) === "RECORDED";
  const mergeRecorded = recordState(records.merge) === "RECORDED";
  const deploymentPassed = recordState(records.deployment) === "SUCCESS";
  const automatedPassed = recordState(records.automatedRuntime) === "PASSED";
  const physicalPassed = recordState(records.physicalRuntime) === "PASSED";
  if (item.status === "NOT_STARTED") {
    assert(recordState(records.implementation) === "NOT_IMPLEMENTED", `${scope} NOT_STARTED cannot have implementation provenance`);
    assert(recordState(records.merge) === "NOT_MERGED", `${scope} NOT_STARTED cannot have merge provenance`);
    assert(recordState(records.deployment) === "NOT_DEPLOYED", `${scope} NOT_STARTED cannot have deployment provenance`);
    assert(recordState(records.automatedRuntime) === "NOT_RUN", `${scope} NOT_STARTED cannot have automated runtime provenance`);
    assert(recordState(records.physicalRuntime) === "NOT_RUN", `${scope} NOT_STARTED cannot have physical runtime provenance`);
  }
  if (["IMPLEMENTED_UNVERIFIED", "AUTOMATED_VERIFIED", "DEPLOYED_VERIFIED", "PHYSICAL_VERIFIED", "COMPLETE"].includes(item.status)) {
    assert(implementationRecorded, `${scope} ${item.status} requires a recorded implementation`);
  }
  if (item.status === "AUTOMATED_VERIFIED") assert(automatedPassed, `${scope} AUTOMATED_VERIFIED requires passed automated runtime evidence`);
  if (["DEPLOYED_VERIFIED", "PHYSICAL_VERIFIED"].includes(item.status)) {
    assert(mergeRecorded && deploymentPassed && automatedPassed, `${scope} ${item.status} requires merge, deployment and automated runtime evidence`);
  }
  if (item.status === "PHYSICAL_VERIFIED") assert(physicalPassed, `${scope} PHYSICAL_VERIFIED requires passed physical runtime evidence`);
  if (implementationRecorded) assertCommitSha(shaFrom(records.implementation), `${scope}.provenance.implementationCommit.commitSha`);
  if (mergeRecorded) {
    assertCommitSha(shaFrom(records.merge), `${scope}.provenance.mergeCommit.commitSha`);
    assert(isOpenedPullRequestUrl(records.merge.pullRequest), `${scope}.provenance.mergeCommit.pullRequest must be an opened PR URL`);
  }
  const mergeSha = shaFrom(records.merge);
  const implementationSha = shaFrom(records.implementation);
  const deployedCommit = records.deployment.deployedCommit ?? records.deployment.verifiedCommit;
  if (deploymentPassed) {
    assert(mergeRecorded, `${scope} successful deployment requires a recorded merge`);
    assertCommitSha(deployedCommit, `${scope}.provenance.deploymentStatus deployed commit`);
    assert(deployedCommit === mergeSha, `${scope} deployed commit must equal merge commit`);
  }
  if (automatedPassed) {
    assert(implementationRecorded, `${scope} passed automated runtime requires a recorded implementation`);
    assertCommitSha(records.automatedRuntime.verifiedCommit, `${scope}.provenance.automatedRuntimeVerification.verifiedCommit`);
    const allowedCommits = deploymentPassed
      ? [deployedCommit]
      : [implementationSha, ...(mergeRecorded ? [mergeSha] : [])];
    assert(allowedCommits.includes(records.automatedRuntime.verifiedCommit), `${scope} automated runtime commit must equal the implementation, merge or deployed commit it verifies`);
  }
  if (physicalPassed) {
    assert(mergeRecorded, `${scope} passed physical runtime requires a recorded merge`);
    assertCommitSha(records.physicalRuntime.verifiedCommit, `${scope}.provenance.physicalRuntimeVerification.verifiedCommit`);
    const expectedCommit = deploymentPassed ? deployedCommit : mergeSha;
    assert(records.physicalRuntime.verifiedCommit === expectedCommit, `${scope} physical runtime commit must equal the ${deploymentPassed ? "deployed" : "merge"} commit`);
  }
}
function assertComplete(item, records, policy, scope) {
  assertCommitSha(shaFrom(records.implementation), `${scope} COMPLETE implementation SHA`);
  assertCommitSha(shaFrom(records.merge), `${scope} COMPLETE merge SHA`);
  assert(recordState(records.implementation) === "RECORDED", `${scope} COMPLETE requires recorded implementation`);
  assert(recordState(records.merge) === "RECORDED", `${scope} COMPLETE requires recorded merge`);
  if (policy.deployment) assert(recordState(records.deployment) === "SUCCESS", `${scope} completion policy requires successful deployment`);
  if (policy.automatedRuntime) assert(recordState(records.automatedRuntime) === "PASSED", `${scope} completion policy requires passed automated runtime`);
  if (policy.physicalRuntime) assert(recordState(records.physicalRuntime) === "PASSED", `${scope} completion policy requires passed physical runtime`);
  assert(item.blockers.every((blocker) => blocker.status === "RESOLVED"), `${scope} COMPLETE cannot retain unresolved blockers`);
  assert(isObject(item.supervisorApproval), `${scope}.supervisorApproval must be an object`);
  assert(item.supervisorApproval.approvedStatus === "COMPLETE", `${scope} COMPLETE requires supervisor approval for COMPLETE`);
  assert(nonemptyString(item.supervisorApproval.approvedBy), `${scope} COMPLETE requires supervisor identity`);
  assert(nonemptyString(item.supervisorApproval.approvedAt) && !Number.isNaN(Date.parse(item.supervisorApproval.approvedAt)), `${scope} COMPLETE requires supervisor approval time`);
}

const register = readJson(registerPath, "completion register");
assert(isObject(register), "completion register root must be an object");
const schemaReference = nonemptyString(register.$schema) ? register.$schema : path.basename(defaultSchemaPath);
const schemaPath = path.resolve(docRoot, schemaReference);
assert(schemaPath.startsWith(`${docRoot}${path.sep}`), `schema reference must remain inside v3.1/doc: ${schemaReference}`);
const schema = readJson(schemaPath, "completion register schema");
assert(isObject(schema), "completion register schema root must be an object");
if (schema.$id) assert(schema.$id === path.basename(schemaPath), "schema $id must match its filename");
const schemaErrors = validateJsonSchema(schema, schema, register);
assert(!schemaErrors.length, `register violates its JSON Schema:\n${schemaErrors.slice(0, 20).join("\n")}`);
const instructionsReference = register.instructionsDocument ?? register.instructionsPath;
const instructionsPath = instructionsReference ? path.resolve(docRoot, instructionsReference) : defaultInstructionsPath;
assert(instructionsPath.startsWith(`${docRoot}${path.sep}`), `instructions reference must remain inside v3.1/doc: ${instructionsReference}`);
const instructions = readText(instructionsPath, "completion instructions");
const normalizedInstructions = instructions.toLowerCase();

const items = register.requirements;
assert(Array.isArray(items) && items.length === 30, `expected exactly 30 requirements, found ${items?.length}`);
const expectedIds = Array.from({ length: 30 }, (_, index) => `BLP-${String(index + 1).padStart(3, "0")}`);
const ids = items.map((item) => item?.id);
assert(new Set(ids).size === 30, "requirement IDs must be unique");
assert(ids.every((id, index) => id === expectedIds[index]), "requirement IDs must be sequential BLP-001 through BLP-030");
const canonicalRows = [...instructions.matchAll(/^\| `(?<id>BLP-\d{3})` \| (?<priority>P[0-5]) \| (?<requirement>[^|]+?) \| (?<dependencies>[^|]+?) \|$/gm)]
  .map((match) => match.groups);
assert(canonicalRows.length === 30, `completion instructions must define exactly 30 canonical rows, found ${canonicalRows.length}`);
const idToIndex = new Map(ids.map((id, index) => [id, index]));
const dependencyGraph = new Map();
assertExactSet(register.protectedScopes, canonicalProtectedScopes, "register.protectedScopes");

for (const [index, item] of items.entries()) {
  const scope = expectedIds[index];
  const canonical = canonicalRows[index];
  assert(isObject(item), `${scope} must be an object`);
  assertExactSet(Object.keys(item), requiredItemFields, `${scope} fields`);
  assert(canonical.id === scope, `completion instructions row ${index + 1} has unexpected ID ${canonical.id}`);
  assert(item.priority === canonical.priority, `${scope} priority drifted from completion instructions`);
  assert(item.requirement === canonical.requirement.trim(), `${scope} requirement drifted from completion instructions`);
  assert(nonemptyString(item.title), `${scope}.title must be nonempty`);
  assert(nonemptyString(item.requirement), `${scope}.requirement must be nonempty`);
  assert(nonemptyString(item.ownerRole), `${scope}.ownerRole must be nonempty`);
  assert(allowedStatuses.includes(item.status), `${scope}.status is not allowed: ${item.status}`);
  assert(allowedPriorities.includes(item.priority), `${scope}.priority is not allowed: ${item.priority}`);
  assertNonemptyTextList(item.acceptanceCriteria, `${scope}.acceptanceCriteria`);
  assertExactSet(item.protectedScopes, canonicalProtectedScopes, `${scope}.protectedScopes`);
  assert(Array.isArray(item.dependencies), `${scope}.dependencies must be an array`);
  const canonicalDependencies = parseInstructionDependencies(canonical.dependencies, index, canonicalRows);
  assertExactSet(item.dependencies, canonicalDependencies, `${scope}.dependencies`);
  for (const dependencyId of item.dependencies) {
    assert(idToIndex.has(dependencyId), `${scope} references unknown dependency ${dependencyId}`);
    assert(idToIndex.get(dependencyId) < index, `${scope} dependency ${dependencyId} must be an earlier ID`);
  }
  dependencyGraph.set(scope, item.dependencies);
  assert(Array.isArray(item.affectedFiles), `${scope}.affectedFiles must be an array`);
  assert(item.affectedFiles.every(nonemptyString), `${scope}.affectedFiles must contain only nonempty strings`);
  const prohibitedPath = item.affectedFiles.find(isProhibitedAffectedPath);
  assert(!prohibitedPath, `${scope}.affectedFiles names protected path ${prohibitedPath}`);
  assert(Array.isArray(item.evidenceLinks), `${scope}.evidenceLinks must be an array`);
  for (const [linkIndex, link] of item.evidenceLinks.entries()) {
    if (link?.kind === "PULL_REQUEST") assertPullRequestEvidence(link, `${scope}.evidenceLinks[${linkIndex}]`);
  }
  assert(Array.isArray(item.blockers) && item.blockers.every(isObject), `${scope}.blockers must be an array of objects`);
  assert(isObject(item.completionPolicy), `${scope}.completionPolicy must be an object`);
  const policy = Object.fromEntries(Object.keys(policyGroups).map((group) => [group, policyFlag(item.completionPolicy, group, `${scope}.completionPolicy`)]));
  if (completionPolicies[scope]) {
    for (const [group, expected] of Object.entries(completionPolicies[scope])) {
      assert(policy[group] === expected, `${scope}.completionPolicy.${group} must remain ${expected}`);
    }
  }
  assert(isObject(item.provenance), `${scope}.provenance must be an object`);
  const provenanceKeys = Object.fromEntries(Object.entries(provenanceGroups).map(([group, aliases]) => {
    const key = findOneKey(item.provenance, aliases, `${scope}.provenance.${group}`);
    assert(isObject(item.provenance[key]), `${scope}.provenance.${key} must be an object`);
    return [group, key];
  }));
  assertExactSet(Object.keys(item.provenance), Object.values(provenanceKeys), `${scope}.provenance fields`);
  const records = Object.fromEntries(Object.entries(provenanceKeys).map(([group, key]) => [group, item.provenance[key]]));
  if (nonemptyString(records.merge.pullRequest)) {
    assert(isOpenedPullRequestUrl(records.merge.pullRequest), `${scope}.provenance.mergeCommit.pullRequest must be an opened PR URL, not a compare URL`);
  }
  assertStatusHistory(item, scope);
  assertStatusProvenanceConsistency(item, records, scope);
  if (["AUTOMATED_VERIFIED", "DEPLOYED_VERIFIED", "PHYSICAL_VERIFIED", "COMPLETE"].includes(item.status)) {
    assert(isObject(item.supervisorApproval), `${scope}.supervisorApproval must be an object`);
    assert(item.supervisorApproval.approvedStatus === item.status, `${scope} ${item.status} requires matching supervisor approval`);
    assert(item.supervisorApproval.approvedBy === "blueprint-supervisor", `${scope} ${item.status} requires Blueprint Supervisor approval`);
    assert(nonemptyString(item.supervisorApproval.approvedAt) && !Number.isNaN(Date.parse(item.supervisorApproval.approvedAt)), `${scope} ${item.status} requires supervisor approval time`);
    assert(Array.isArray(item.supervisorApproval.evidenceLinks) && item.supervisorApproval.evidenceLinks.length > 0, `${scope} ${item.status} requires supervisor evidence`);
  }
  if (item.status === "COMPLETE") assertComplete(item, records, policy, scope);
}

for (const item of items.filter((record) => record.status === "COMPLETE")) {
  for (const dependencyId of item.dependencies) {
    const dependency = items[idToIndex.get(dependencyId)];
    assert(dependency.status === "COMPLETE", `${item.id} cannot be COMPLETE before ${dependencyId}`);
  }
}
const finalRecord = items[29];
if (finalRecord.status === "COMPLETE") {
  const releaseRecord = items[28];
  const subjectCommit = releaseRecord.provenance.deploymentStatus.deployedCommit;
  assert(finalRecord.supervisorApproval.attestationSubjectCommit === subjectCommit, "BLP-030 attestation subject must equal the BLP-029 deployed commit");
  assert(/^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/(?:tag|download)\//.test(finalRecord.supervisorApproval.attestationUrl || ""), "BLP-030 requires an immutable GitHub release attestation URL");
  assert(/^[0-9a-f]{64}$/.test(finalRecord.supervisorApproval.attestationSha256 || ""), "BLP-030 requires a SHA-256 attestation payload hash");
  assert(finalRecord.supervisorApproval.evidenceLinks.some((link) => link.reference === finalRecord.supervisorApproval.attestationUrl), "BLP-030 approval evidence must include the attestation URL");
}

const visiting = new Set();
const visited = new Set();
function visitDependency(id) {
  if (visited.has(id)) return;
  assert(!visiting.has(id), `dependency cycle detected at ${id}`);
  visiting.add(id);
  for (const dependencyId of dependencyGraph.get(id) || []) visitDependency(dependencyId);
  visiting.delete(id);
  visited.add(id);
}
for (const id of ids) visitDependency(id);

const invariantChecks = [
  ["Step 1 protection", /step\s*1/], ["Step 2 protection", /step\s*2/], ["v3/ protection", /v3\//],
  ["Railway protection", /railway/], ["five canonical graphs", /five canonical(?: work universe)? graphs|5 canonical graphs/],
  ["three signals", /three (?:canonical )?signal(?:s| model)|3 signals/],
  ["Role Graph/FAB round trip", /role graph.{0,30}(?:fab|and fab).{0,80}(?:round trip|return)/s],
  ["Clean and Full Review", /clean(?: review)? and full review/s],
  ["evidence withholding", /evidence.{0,40}withhold|withhold.{0,40}evidence/s],
  ["deterministic versus AI provenance", /deterministic.{0,80}ai.{0,80}(?:provenance|proposal)/s],
  ["separated provenance", /implementation.{0,100}merge.{0,100}deployment.{0,100}automated.{0,100}physical/s],
];
for (const [label, pattern] of invariantChecks) assert(pattern.test(normalizedInstructions), `completion instructions must contain ${label}`);
for (const status of allowedStatuses) assert(instructions.includes(status), `completion instructions must contain status ${status}`);
for (const [from, to] of permittedTransitions.slice(0, -2)) {
  assert(instructions.includes(`${from} -> ${to}`), `completion instructions must permit ${from} -> ${to}`);
}
assert(/complete.{0,160}(?:in_progress|withheld)/is.test(instructions), "completion instructions must define COMPLETE reopening destinations");

const itemSchema = findObjectSchema(schema, ["id", "requirement", "ownerRole", "completionPolicy", "statusHistory"]);
assert(itemSchema, "schema must define the revised completion-item object");
assert(itemSchema.additionalProperties === false, "schema completion item must reject additional properties");
assertExactSet(itemSchema.required || [], requiredItemFields, "schema completion-item required fields");
assertExactSet(Object.keys(itemSchema.properties || {}), requiredItemFields, "schema completion-item properties");
const statusSchema = schemaProperty(schema, itemSchema, "status");
const prioritySchema = schemaProperty(schema, itemSchema, "priority");
assert(Array.isArray(statusSchema.enum) && sameSet(statusSchema.enum, allowedStatuses), "schema status enum must match the canonical vocabulary exactly");
assert(Array.isArray(prioritySchema.enum) && sameSet(prioritySchema.enum, allowedPriorities), "schema priority enum must match P0 through P5 exactly");
const ownerRoleSchema = schemaProperty(schema, itemSchema, "ownerRole");
assert(ownerRoleSchema.type === "string" && ownerRoleSchema.minLength >= 1, "schema ownerRole must require a nonempty string");
for (const listField of ["affectedFiles", "protectedScopes", "statusHistory"]) {
  assert(schemaIncludesType(schema, schemaProperty(schema, itemSchema, listField), "array"), `schema ${listField} must be an array`);
}
const protectedScopesSchema = schemaProperty(schema, itemSchema, "protectedScopes");
const protectedScopesContract = JSON.stringify(protectedScopesSchema);
for (const protectedScope of canonicalProtectedScopes) {
  assert(protectedScopesContract.includes(protectedScope), `schema protectedScopes must require ${protectedScope}`);
}
const affectedFilesSchema = schemaProperty(schema, itemSchema, "affectedFiles");
assert(affectedFilesSchema.items?.type === "string" && affectedFilesSchema.items.minLength >= 1, "schema affectedFiles must contain nonempty strings");
const statusHistoryListSchema = schemaProperty(schema, itemSchema, "statusHistory");
assert(statusHistoryListSchema.minItems >= 1, "schema statusHistory must require at least one event");
const policySchema = schemaProperty(schema, itemSchema, "completionPolicy");
assert(isObject(policySchema.properties), "schema must define completionPolicy properties");
for (const [group, aliases] of Object.entries(policyGroups)) {
  const key = findOneKey(policySchema.properties, aliases, `schema completionPolicy ${group}`);
  assert(policySchema.required?.includes(key), `schema completionPolicy must require ${key}`);
  assert(policySchema.properties[key].type === "boolean", `schema completionPolicy ${key} must be boolean`);
}
const provenanceSchema = schemaProperty(schema, itemSchema, "provenance");
assert(isObject(provenanceSchema.properties), "schema must define provenance properties");
for (const [group, aliases] of Object.entries(provenanceGroups)) {
  const key = findOneKey(provenanceSchema.properties, aliases, `schema provenance ${group}`);
  assert(provenanceSchema.required?.includes(key), `schema provenance must require ${key}`);
  const recordSchema = resolveLocalRef(schema, provenanceSchema.properties[key]);
  assert(isObject(recordSchema.properties), `schema provenance ${key} must be an object schema`);
  if (["deployment", "automatedRuntime", "physicalRuntime"].includes(group)) {
    const commitField = group === "deployment" && recordSchema.properties.deployedCommit ? "deployedCommit" : "verifiedCommit";
    assert(recordSchema.required?.includes(commitField), `schema provenance ${key} must require ${commitField}`);
  }
  if (group === "merge") {
    const pullRequestSchema = resolveLocalRef(schema, recordSchema.properties.pullRequest);
    const pullRequestPattern = schemaStringPattern(schema, pullRequestSchema);
    assert(nonemptyString(pullRequestPattern), "schema merge pullRequest must constrain opened PR URLs");
    const pattern = new RegExp(pullRequestPattern);
    assert(pattern.test("https://github.com/example/repo/pull/123"), "schema pullRequest pattern must accept opened PR URLs");
    assert(!pattern.test("https://github.com/example/repo/pull/new/branch"), "schema pullRequest pattern must reject /pull/new URLs");
    assert(!pattern.test("https://github.com/example/repo/compare/main...branch"), "schema pullRequest pattern must reject compare URLs");
  }
}
const historySchema = schemaProperty(schema, itemSchema, "statusHistory");
const historyItemSchema = resolveLocalRef(schema, historySchema.items);
assert(isObject(historyItemSchema.properties), "schema must define statusHistory entry properties");
for (const alternatives of [["fromStatus", "from"], ["toStatus", "to"]]) {
  const key = findOneKey(historyItemSchema.properties, alternatives, "schema statusHistory transition endpoint");
  assert(historyItemSchema.required?.includes(key), `schema statusHistory must require ${key}`);
}
for (const key of ["changedAt", "reason"]) assert(historyItemSchema.required?.includes(key), `schema statusHistory must require ${key}`);
const approvalSchema = schemaProperty(schema, itemSchema, "supervisorApproval");
assert(isObject(approvalSchema.properties), "schema must define supervisorApproval properties");
for (const key of ["approvedStatus", "approvedBy", "approvedAt"]) {
  assert(approvalSchema.required?.includes(key), `schema supervisorApproval must require ${key}`);
}
const completeConditional = JSON.stringify(itemSchema.allOf || []);
assert(completeConditional.includes("COMPLETE"), "schema must contain a COMPLETE conditional");
for (const key of ["implementationCommit", "mergeCommit", "deploymentStatus", "automatedRuntimeVerification", "physicalRuntimeVerification", "supervisorApproval", "completionPolicy"]) {
  assert(completeConditional.includes(key), `schema COMPLETE conditional must cover ${key}`);
}
for (const [id, expectedPolicy] of Object.entries(completionPolicies)) {
  const releaseSchema = schema.$defs?.[`requirement${id.replace("-", "")}`];
  assert(isObject(releaseSchema), `schema must define ${id} release policy`);
  const serialized = JSON.stringify(releaseSchema);
  assert(serialized.includes("completionPolicy"), `schema ${id} must constrain completionPolicy`);
  for (const [group, expected] of Object.entries(expectedPolicy)) {
    const key = policyGroups[group].find((candidate) => serialized.includes(`\"${candidate}\"`));
    assert(key && serialized.includes(`\"${key}\":{\"const\":${expected}}`), `schema ${id} must fix ${group} to ${expected}`);
  }
}

const index = readJson(indexPath, "feature map index");
const indexHtml = readText(indexHtmlPath, "feature map index HTML");
const program = index.completionProgram;
assert(isObject(program), "feature map index must link the blueprint completion programme");
assert(program.id === register.metadata.registerId, "feature map index completion programme ID must equal the canonical register ID");
assert(program.totalRequirements === 30, "feature map index must declare 30 blueprint requirements");
assert(program.baselineCommit === register.baselineCommit.commitSha, "feature map index baseline commit drifted");
assertExactSet(program.separatedProvenanceFields || [], Object.values(provenanceGroups).flat(), "feature map index separated provenance fields");
for (const [field, expected] of Object.entries({
  guideMarkdownPath: "doc/V3-Blueprint-Completion-Onboarding-Guide.md",
  guideHtmlPath: "doc/V3-Blueprint-Completion-Onboarding-Guide.html",
  instructionsPath: "doc/V3-Blueprint-Completion-Instructions.md",
  registerPath: "doc/v3-blueprint-completion-register.json",
  schemaPath: "doc/v3-blueprint-completion-register.schema.json",
  contractTestPath: "tests/blueprint-completion-contract.mjs",
})) {
  assert(program[field] === expected, `feature map index ${field} drifted`);
  assert(fs.existsSync(path.join(v31Root, expected)), `feature map index ${field} target is missing`);
  const href = field === "contractTestPath" ? `../${expected}` : path.basename(expected);
  assert(indexHtml.includes(`href="${href}"`), `feature map index HTML does not link ${expected}`);
}

const guideMarkdown = readText(path.join(v31Root, program.guideMarkdownPath), "blueprint onboarding guide Markdown");
const guideHtml = readText(path.join(v31Root, program.guideHtmlPath), "blueprint onboarding guide HTML");
const registerHash = createHash("sha256").update(fs.readFileSync(registerPath)).digest("hex");
const guideSourceHash = createHash("sha256").update(guideMarkdown).digest("hex");
for (const guide of [guideMarkdown, guideHtml]) {
  assert(guide.includes("GUIDE-V3-BLUEPRINT-COMPLETION-001"), "blueprint onboarding guide document ID drifted");
  assert(guide.includes(registerHash), "blueprint onboarding guide register snapshot hash is stale");
  for (const id of expectedIds) assert(guide.includes(id), `blueprint onboarding guide omits ${id}`);
  for (const group of Object.values(provenanceGroups).flat()) {
    assert(guide.includes(group), `blueprint onboarding guide omits separated provenance field ${group}`);
  }
}
const guideRows = [...guideMarkdown.matchAll(/^\| `(?<id>BLP-\d{3})` \| (?<priority>P[0-5]) \| `(?<status>[A-Z_]+)` \| (?<requirement>[^|]+?) \| (?<dependencies>[^|]+?) \|$/gm)]
  .map((match) => match.groups);
assert(guideRows.length === 30, `blueprint onboarding guide must contain exactly 30 canonical requirement rows, found ${guideRows.length}`);
for (const [index, row] of guideRows.entries()) {
  const item = items[index];
  assert(row.id === item.id, `blueprint onboarding guide row ${index + 1} ID drifted`);
  assert(row.priority === item.priority, `${item.id} guide priority drifted from register`);
  assert(row.status === item.status, `${item.id} guide status drifted from register`);
  assert(row.requirement.trim() === item.requirement, `${item.id} guide requirement drifted from register`);
  const guideDependencies = row.dependencies.match(/BLP-\d{3}/g) || [];
  assertExactSet(guideDependencies, item.dependencies, `${item.id} guide dependencies`);
  if (!item.dependencies.length) assert(row.dependencies.trim() === "None", `${item.id} guide must render an empty dependency set as None`);
}
assert(guideHtml.includes(`name="guide-source-sha256" content="${guideSourceHash}"`), "blueprint onboarding guide HTML is stale relative to its Markdown source");
assert(guideHtml.includes('href="V3-Blueprint-Completion-Onboarding-Guide.md"'), "blueprint onboarding guide HTML must link its Markdown source");
assert(guideHtml.includes('href="V3-Agent-Readable-Feature-Map-Index.html"'), "blueprint onboarding guide HTML must link the master Feature Map");

console.log("Blueprint completion contract passed: 30 canonical requirements, exact dependencies, lifecycle and release provenance enforced.");
