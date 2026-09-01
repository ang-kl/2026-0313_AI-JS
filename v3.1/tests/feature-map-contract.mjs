import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const manifestPath = path.join(root, "doc/v3-step1a-feature-map.manifest.json");
const htmlPath = path.join(root, "doc/V3-Step1a-Agent-Readable-Feature-Map.html");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const html = fs.readFileSync(htmlPath, "utf8");

const registries = ["screens", "components", "features", "states", "transitions", "payloadFields", "invariants", "responsiveProfiles", "tests", "evidenceRefs", "gaps"];
const records = registries.flatMap((name) => manifest[name] || []);
const ids = records.map((record) => record.id).concat(manifest.map.id, manifest.rubric.id, ...manifest.rubric.categories.map((item) => item.id));
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) throw new Error(`Duplicate IDs: ${duplicateIds.join(", ")}`);
const idSet = new Set(ids);

const expectedPrefixes = { screens: "SCR-", components: ["CMP-", "API-"], features: "FEAT-", states: "STATE-", transitions: "TRANS-", payloadFields: "PAY-", invariants: "INV-", responsiveProfiles: "RESP-", tests: "TEST-", evidenceRefs: "EVID-", gaps: "GAP-" };
for (const registry of registries) {
  const prefixes = Array.isArray(expectedPrefixes[registry]) ? expectedPrefixes[registry] : [expectedPrefixes[registry]];
  for (const record of manifest[registry]) if (!prefixes.some((prefix) => record.id.startsWith(prefix))) throw new Error(`${registry} has invalid ID ${record.id}`);
}

function visit(value, key = "") {
  if (Array.isArray(value)) {
    if (key.endsWith("Ids")) for (const id of value) if (!idSet.has(id)) throw new Error(`Unresolved reference ${key}: ${id}`);
    for (const item of value) visit(item, key);
  } else if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      if (childKey.endsWith("Id") && typeof childValue === "string" && childKey !== "supersededById" && !idSet.has(childValue)) throw new Error(`Unresolved reference ${childKey}: ${childValue}`);
      visit(childValue, childKey);
    }
  }
}
visit(manifest);

for (const screen of manifest.screens) {
  const asset = path.join(root, "doc", screen.asset);
  if (!fs.existsSync(asset)) throw new Error(`Missing screenshot asset ${screen.asset}`);
  const hash = crypto.createHash("sha256").update(fs.readFileSync(asset)).digest("hex");
  if (hash !== screen.sha256) throw new Error(`Stale screenshot hash for ${screen.id}`);
}
for (const component of manifest.components) {
  const source = path.resolve(root, "..", component.path);
  if (!fs.existsSync(source)) throw new Error(`Missing component source ${component.path}`);
  const text = fs.readFileSync(source, "utf8");
  if (!text.includes(component.symbol) || !text.includes(component.semanticAnchor.split("=").pop())) throw new Error(`Source locator drift for ${component.id}`);
}
for (const test of manifest.tests) if (!fs.existsSync(path.resolve(root, "..", test.path))) throw new Error(`Missing test ${test.path}`);

const htmlFeatureIds = [...html.matchAll(/data-feature-id="([^"]+)"/g)].map((match) => match[1]);
if (!htmlFeatureIds.length) throw new Error("HTML has no feature callouts");
for (const id of htmlFeatureIds) if (!idSet.has(id)) throw new Error(`HTML callout references unknown feature ${id}`);
for (const feature of manifest.features) if (!html.includes(feature.id)) throw new Error(`Feature absent from visual map: ${feature.id}`);
for (const feature of manifest.features.filter((item) => item.status === "VERIFIED")) if (!feature.evidenceRefIds?.length) throw new Error(`Verified feature lacks evidence: ${feature.id}`);
for (const field of manifest.payloadFields) if (!("absenceBehaviour" in field) || field.inferenceAllowed !== false) throw new Error(`Payload boundary incomplete: ${field.id}`);
for (const invariant of manifest.invariants) if (!invariant.testIds?.length) throw new Error(`Invariant lacks executable test: ${invariant.id}`);

console.log(`Feature map contract: PASS (${ids.length} unique IDs, ${htmlFeatureIds.length} visual callouts)`);
