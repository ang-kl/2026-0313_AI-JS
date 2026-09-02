import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const repoRoot = path.resolve(root, "..");

const mapConfigs = [
  {
    id: "MAP-V3-STEP1A-001",
    manifestPath: "doc/v3-step1a-feature-map.manifest.json",
    htmlPath: "doc/V3-Step1a-Agent-Readable-Feature-Map.html",
    requireSchema: false,
    requireStrictLocators: false,
    requireSeparatedProvenance: false,
  },
  {
    id: "MAP-V3-STEP2-001",
    manifestPath: "doc/v3-step2-feature-map.manifest.json",
    htmlPath: "doc/V3-Step2-Agent-Readable-Feature-Map.html",
    requireSchema: false,
    requireStrictLocators: false,
    requireSeparatedProvenance: true,
  },
  {
    id: "MAP-V3-STEP3-001",
    manifestPath: "doc/v3-step3-feature-map.manifest.json",
    htmlPath: "doc/V3-Step3-Agent-Readable-Feature-Map.html",
    requireSchema: true,
    requireStrictLocators: true,
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

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function absoluteRepoPath(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

function parseSourceRanges(sourceLines, lineCount, scope) {
  if (!sourceLines) return;
  for (const range of String(sourceLines).split(",")) {
    const match = range.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`${scope}: invalid sourceLines value ${sourceLines}`);
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > lineCount) {
      throw new Error(`${scope}: sourceLines ${range.trim()} outside 1-${lineCount}`);
    }
  }
}

function sourceSlice(text, sourceLines) {
  if (!sourceLines) return text;
  const lines = text.split(/\r?\n/);
  return String(sourceLines).split(",").map((range) => {
    const match = range.trim().match(/^(\d+)(?:-(\d+))?$/);
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    return lines.slice(start - 1, end).join("\n");
  }).join("\n");
}

function pngDimensions(buffer, scope) {
  if (buffer.toString("ascii", 1, 4) !== "PNG") throw new Error(`${scope}: asset is not a PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function assertSchema(manifest, scope) {
  if (!manifest.$schema) throw new Error(`${scope}: missing $schema`);
  const schemaPath = path.resolve(root, "doc", manifest.$schema);
  if (!fs.existsSync(schemaPath)) throw new Error(`${scope}: missing schema ${manifest.$schema}`);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  if (schema.$id !== path.basename(schemaPath)) throw new Error(`${scope}: schema $id does not match filename`);
  for (const key of schema.required || []) {
    if (!(key in manifest)) throw new Error(`${scope}: schema-required field missing: ${key}`);
  }
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
    const bytes = fs.readFileSync(asset);
    const hash = crypto.createHash("sha256").update(bytes).digest("hex");
    if (hash !== screen.sha256) throw new Error(`${scope}: stale screenshot hash for ${screen.id}`);
    const dimensions = pngDimensions(bytes, `${scope}: ${screen.id}`);
    if (!screen.raster && scope === "MAP-V3-STEP3-001") {
      throw new Error(`${scope}: screenshot ${screen.id} lacks raster dimensions`);
    }
    if (screen.raster && (dimensions.width !== screen.raster.width || dimensions.height !== screen.raster.height)) {
      throw new Error(`${scope}: screenshot dimensions drift for ${screen.id}: ${JSON.stringify(dimensions)}`);
    }
  }
}

function assertComponents(manifest, scope, strictLocators) {
  for (const component of manifest.components || []) {
    const source = absoluteRepoPath(component.path);
    if (!fs.existsSync(source)) throw new Error(`${scope}: missing component source ${component.path}`);
    const text = fs.readFileSync(source, "utf8");
    if (strictLocators) parseSourceRanges(component.sourceLines, text.split(/\r?\n/).length, `${scope}: ${component.id}`);
    const locatedText = strictLocators ? sourceSlice(text, component.sourceLines) : text;
    const semanticAnchor = component.semanticAnchor || "";
    const anchorText = component.anchorText || semanticAnchor.split("=").pop();
    if (!locatedText.includes(component.symbol) || (anchorText && !locatedText.includes(anchorText))) {
      throw new Error(`${scope}: source locator drift for ${component.id}`);
    }
  }
}

function assertTests(manifest, scope, strictLocators) {
  for (const test of manifest.tests || []) {
    const testPath = absoluteRepoPath(test.path);
    if (!fs.existsSync(testPath)) throw new Error(`${scope}: missing test ${test.path}`);
    const text = fs.readFileSync(testPath, "utf8");
    if (strictLocators) parseSourceRanges(test.sourceLines, text.split(/\r?\n/).length, `${scope}: ${test.id}`);
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
  if (config.requireSchema) assertSchema(manifest, config.id);
  if (config.requireSeparatedProvenance) assertSeparatedProvenance(manifest, config.id);

  const ids = collectIds(manifest);
  assertUniqueIds(ids, config.id);
  const idSet = new Set(ids);
  assertRegistryPrefixes(manifest, config.id);
  assertReferencesResolve(manifest, idSet, config.id);
  assertScreens(manifest, config.id);
  assertComponents(manifest, config.id, config.requireStrictLocators);
  assertTests(manifest, config.id, config.requireStrictLocators);
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
      if (matched.config.requireSeparatedProvenance) {
        for (const key of provenanceKeys) {
          if (stableStringify(item.provenance[key]) !== stableStringify(matched.manifest.provenance[key])) {
            throw new Error(`Index provenance drift for ${item.id}: ${key}`);
          }
        }
      }
    }
  }

  return index.maps.length;
}

function assertProtectedPaths() {
  const baseRef = process.env.FEATURE_MAP_BASE_REF;
  if (!baseRef) return;
  const changed = execFileSync("git", ["diff", "--name-only", baseRef], { cwd: repoRoot, encoding: "utf8" })
    .trim().split("\n").filter(Boolean);
  const preservedSurfaceViolations = changed.filter((file) =>
    /^v3\//.test(file) || /(^|\/)railway\.(json|toml)$/.test(file));
  if (preservedSurfaceViolations.length) {
    throw new Error(`Feature map preserved-surface violation: ${preservedSurfaceViolations.join(", ")}`);
  }
  // The docs-only boundary was a construction gate for the Step 2 feature-map
  // branch, not a permanent ban on later v3.1 implementation work. Keep it
  // available for a deliberate canonisation run without blocking product PRs.
  if (process.env.FEATURE_MAP_ENFORCE_DOCS_ONLY !== "1") return;
  const allowed = [
    /^v3\.1\/doc\//,
    /^v3\.1\/tests\/(feature-map-contract|browser-gate)\.mjs$/,
    /^\.github\/workflows\/v31-browser-gate\.yml$/,
  ];
  const violations = changed.filter((file) => !allowed.some((pattern) => pattern.test(file)));
  if (violations.length) throw new Error(`Feature map protected-path violation: ${violations.join(", ")}`);
}

const validatedMaps = mapConfigs.map(validateMap);
const indexedMaps = validateIndex(validatedMaps);
assertProtectedPaths();
const totalIds = validatedMaps.reduce((count, entry) => count + entry.ids.length, 0);
const totalCallouts = validatedMaps.reduce((count, entry) => count + entry.callouts, 0);

console.log(
  `Feature map contract: PASS (${validatedMaps.length} maps, ${indexedMaps} indexed maps, ${totalIds} unique IDs, ${totalCallouts} visual callouts)`,
);
