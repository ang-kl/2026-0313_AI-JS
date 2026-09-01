import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const repoRoot = path.resolve(root, "..");

const mapConfigs = [
  {
    id: "MAP-V3-STEP1A-001",
    manifestPath: "doc/v3-step1a-feature-map.manifest.json",
    htmlPath: "doc/V3-Step1a-Agent-Readable-Feature-Map.html",
    requireSeparatedProvenance: false,
  },
  {
    id: "MAP-V3-STEP2-001",
    manifestPath: "doc/v3-step2-feature-map.manifest.json",
    htmlPath: "doc/V3-Step2-Agent-Readable-Feature-Map.html",
    requireSeparatedProvenance: true,
  },
  {
    id: "MAP-V3-STEP3-001",
    manifestPath: "doc/v3-step3-feature-map.manifest.json",
    htmlPath: "doc/V3-Step3-Agent-Readable-Feature-Map.html",
    requireSeparatedProvenance: true,
  },
];

const indexConfig = {
  jsonPath: "doc/v3-feature-map-index.json",
  htmlPath: "doc/V3-Agent-Readable-Feature-Map-Index.html",
};

const registries = [
  "screens",
  "components",
  "features",
  "states",
  "transitions",
  "payloadFields",
  "invariants",
  "responsiveProfiles",
  "tests",
  "evidenceRefs",
  "gaps",
];

const expectedPrefixes = {
  screens: "SCR-",
  components: ["CMP-", "API-"],
  features: "FEAT-",
  states: "STATE-",
  transitions: "TRANS-",
  payloadFields: "PAY-",
  invariants: "INV-",
  responsiveProfiles: "RESP-",
  tests: "TEST-",
  evidenceRefs: "EVID-",
  gaps: "GAP-",
};

const provenanceKeys = [
  "implementationCommit",
  "mergeCommit",
  "deploymentStatus",
  "physicalRuntimeVerification",
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function absoluteRepoPath(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

function collectIds(manifest) {
  const records = registries.flatMap((name) => manifest[name] || []);
  const rubricIds = manifest.rubric
    ? [manifest.rubric.id, ...(manifest.rubric.categories || []).map((item) => item.id)]
    : [];
  return records.map((record) => record.id).concat(manifest.map.id, ...rubricIds);
}

function assertUniqueIds(ids, scope) {
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) throw new Error(`${scope}: duplicate IDs: ${duplicateIds.join(", ")}`);
}

function assertRegistryPrefixes(manifest, scope) {
  for (const registry of registries) {
    const records = manifest[registry] || [];
    const prefixes = Array.isArray(expectedPrefixes[registry])
      ? expectedPrefixes[registry]
      : [expectedPrefixes[registry]];
    for (const record of records) {
      if (!prefixes.some((prefix) => record.id.startsWith(prefix))) {
        throw new Error(`${scope}: ${registry} has invalid ID ${record.id}`);
      }
    }
  }
}

function assertReferencesResolve(manifest, idSet, scope) {
  function visit(value, key = "") {
    if (Array.isArray(value)) {
      if (key.endsWith("Ids")) {
        for (const id of value) {
          if (!idSet.has(id)) throw new Error(`${scope}: unresolved reference ${key}: ${id}`);
        }
      }
      for (const item of value) visit(item, key);
    } else if (value && typeof value === "object") {
      for (const [childKey, childValue] of Object.entries(value)) {
        if (
          childKey.endsWith("Id") &&
          typeof childValue === "string" &&
          childKey !== "supersededById" &&
          !idSet.has(childValue)
        ) {
          throw new Error(`${scope}: unresolved reference ${childKey}: ${childValue}`);
        }
        visit(childValue, childKey);
      }
    }
  }
  visit(manifest);
}

function assertScreens(manifest, scope) {
  for (const screen of manifest.screens || []) {
    if (!screen.asset) continue;
    const asset = path.join(root, "doc", screen.asset);
    if (!fs.existsSync(asset)) throw new Error(`${scope}: missing screenshot asset ${screen.asset}`);
    if (!screen.sha256) throw new Error(`${scope}: screenshot ${screen.id} lacks sha256`);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(asset)).digest("hex");
    if (hash !== screen.sha256) throw new Error(`${scope}: stale screenshot hash for ${screen.id}`);
  }
}

function assertComponents(manifest, scope) {
  for (const component of manifest.components || []) {
    const source = absoluteRepoPath(component.path);
    if (!fs.existsSync(source)) throw new Error(`${scope}: missing component source ${component.path}`);
    const text = fs.readFileSync(source, "utf8");
    const semanticAnchor = component.semanticAnchor || "";
    const anchorText = component.anchorText || semanticAnchor.split("=").pop();
    if (!text.includes(component.symbol) || (anchorText && !text.includes(anchorText))) {
      throw new Error(`${scope}: source locator drift for ${component.id}`);
    }
  }
}

function assertTests(manifest, scope) {
  for (const test of manifest.tests || []) {
    if (!fs.existsSync(absoluteRepoPath(test.path))) throw new Error(`${scope}: missing test ${test.path}`);
  }
}

function assertHtml(manifest, html, idSet, scope) {
  const htmlFeatureIds = [...html.matchAll(/data-feature-id="([^"]+)"/g)].map((match) => match[1]);
  if (!htmlFeatureIds.length) throw new Error(`${scope}: HTML has no feature callouts`);
  for (const id of htmlFeatureIds) {
    if (!idSet.has(id)) throw new Error(`${scope}: HTML callout references unknown feature ${id}`);
  }
  for (const feature of manifest.features || []) {
    if (!html.includes(feature.id)) throw new Error(`${scope}: feature absent from visual map: ${feature.id}`);
  }
  return htmlFeatureIds.length;
}

function assertMapSemantics(manifest, scope) {
  for (const feature of (manifest.features || []).filter((item) => item.status === "VERIFIED")) {
    if (!feature.evidenceRefIds?.length) throw new Error(`${scope}: verified feature lacks evidence: ${feature.id}`);
  }
  for (const field of manifest.payloadFields || []) {
    if (!("absenceBehaviour" in field) || field.inferenceAllowed !== false) {
      throw new Error(`${scope}: payload boundary incomplete: ${field.id}`);
    }
  }
  for (const invariant of manifest.invariants || []) {
    if (!invariant.testIds?.length) throw new Error(`${scope}: invariant lacks executable test: ${invariant.id}`);
  }
}

function assertSeparatedProvenance(holder, scope) {
  const provenance = holder.provenance;
  if (!provenance || typeof provenance !== "object") throw new Error(`${scope}: missing provenance object`);
  for (const key of provenanceKeys) {
    if (!provenance[key] || typeof provenance[key] !== "object") {
      throw new Error(`${scope}: missing separated provenance field ${key}`);
    }
  }
}

function validateMap(config) {
  const manifest = readJson(config.manifestPath);
  const html = readText(config.htmlPath);
  if (manifest.map.id !== config.id) {
    throw new Error(`${config.id}: manifest map id drifted to ${manifest.map.id}`);
  }
  if (config.requireSeparatedProvenance) assertSeparatedProvenance(manifest, config.id);

  const ids = collectIds(manifest);
  assertUniqueIds(ids, config.id);
  const idSet = new Set(ids);
  assertRegistryPrefixes(manifest, config.id);
  assertReferencesResolve(manifest, idSet, config.id);
  assertScreens(manifest, config.id);
  assertComponents(manifest, config.id);
  assertTests(manifest, config.id);
  const callouts = assertHtml(manifest, html, idSet, config.id);
  assertMapSemantics(manifest, config.id);

  return {
    config,
    manifest,
    ids,
    callouts,
  };
}

function validateIndex(validatedMaps) {
  const index = readJson(indexConfig.jsonPath);
  const html = readText(indexConfig.htmlPath);
  const mapById = new Map(validatedMaps.map((entry) => [entry.config.id, entry]));

  if (!Array.isArray(index.maps) || !index.maps.length) throw new Error("Feature map index has no maps");
  assertUniqueIds(index.maps.map((item) => item.id), "Feature map index");

  for (const required of ["MAP-V3-STEP1A-001", "MAP-V3-STEP2-001", "MAP-V3-STEP3-001"]) {
    if (!index.maps.some((item) => item.id === required)) throw new Error(`Feature map index missing ${required}`);
    if (!html.includes(required)) throw new Error(`Feature map index HTML missing ${required}`);
  }

  for (const item of index.maps) {
    assertSeparatedProvenance(item, `Feature map index ${item.id}`);
    if (item.status === "PUBLISHED") {
      const matched = mapById.get(item.id);
      if (!matched) throw new Error(`Feature map index publishes ${item.id} without a validated manifest`);
      if (item.manifestPath !== matched.config.manifestPath || item.htmlPath !== matched.config.htmlPath) {
        throw new Error(`Feature map index path drift for ${item.id}`);
      }
      if (!fs.existsSync(path.join(root, item.manifestPath))) throw new Error(`Index manifest path missing for ${item.id}`);
      if (!fs.existsSync(path.join(root, item.htmlPath))) throw new Error(`Index HTML path missing for ${item.id}`);
      const docHref = item.htmlPath.replace(/^doc\//, "");
      if (!html.includes(docHref)) throw new Error(`Index HTML does not link ${item.htmlPath}`);
    }
  }

  return index.maps.length;
}

const validatedMaps = mapConfigs.map(validateMap);
const indexedMaps = validateIndex(validatedMaps);
const totalIds = validatedMaps.reduce((count, entry) => count + entry.ids.length, 0);
const totalCallouts = validatedMaps.reduce((count, entry) => count + entry.callouts, 0);

console.log(
  `Feature map contract: PASS (${validatedMaps.length} maps, ${indexedMaps} indexed maps, ${totalIds} unique IDs, ${totalCallouts} visual callouts)`,
);
