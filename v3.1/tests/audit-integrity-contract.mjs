import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const careers = fs.readFileSync(new URL("../api/careers.js", import.meta.url), "utf8");
const featureMapContract = fs.readFileSync(new URL("./feature-map-contract.mjs", import.meta.url), "utf8");

function requireSource(condition, message) {
  if (!condition) throw new Error(message);
}

requireSource(app.includes("i < entries.length; i += 80"), "Step 2 must classify the complete posting set in endpoint-sized batches");
requireSource(app.includes('.slice(0, 1800)'), "Step 2 classifier descriptions must be capped at the scorer input limit");
requireSource(app.includes('classificationStatus: "unavailable"'), "Classifier transport failures must remain distinct from withheld classifications");
requireSource(careers.includes('code: isTimeout ? "TIMEOUT" : "SERVER"'), "careers.gov.sg failures must carry machine-readable failure codes");
requireSource(app.includes('empRegStatus !== "done"'), "Company overview must wait for the employer registry lookup to settle");
requireSource(app.includes("scopedSystemPrompts"), "Prompt batches must include only the technique definitions assigned to that batch");
requireSource(app.includes("const _ssocOccupationCache = new Map()"), "Exact SSOC title lookups must share an in-flight/result cache");
requireSource(app.includes('source: "buildCompanyAgents() in this app", confidence:'), "The deterministic agents export must identify its builder provenance");
requireSource(app.includes("agentsModel: block(ORIGIN.DERIVED"), "The deterministic agents export must not be labelled AI-authored");
requireSource(app.includes('data-seed-source={(seedPosting && seedPosting.source) || ""}'), "Step 3 must expose the selected posting source at the CompanyPanel boundary");
requireSource(app.includes('activeMatch.source === "careers.gov.sg" ? " csg-primary"'), "A careers.gov.sg-only employer must be able to own the AI Moments analysis column");
requireSource(featureMapContract.includes('/^v3\\//.test(file)'), "Feature-map validation must reject v3/ changes");
requireSource(featureMapContract.includes('railway\\.(json|toml)'), "Feature-map validation must reject Railway configuration changes");

console.log("Audit integrity contract: PASS");
