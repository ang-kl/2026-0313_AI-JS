import claude from "./claude.js";
import { assembleGeneration, providerPrompt, validateGenerationRequest } from "./generationPolicy.js";

export const config = { api: { bodyParser: true }, maxDuration: 300 };

function captureResponse() {
  let statusCode = 200;
  let body = null;
  return {
    response: { status(code) { statusCode = code; return this; }, json(value) { body = value; return value; } },
    result: () => ({ statusCode, body }),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Method not allowed" });
  const requestVerdict = validateGenerationRequest(req.body);
  if (!requestVerdict.ok) return res.status(400).json({ ok: false, code: "INVALID_EVIDENCE", errors: requestVerdict.errors });
  const prompt = providerPrompt(req.body.task, req.body.evidence, req.body.allowlist);
  const captured = captureResponse();
  await claude({ method: "POST", body: prompt }, captured.response);
  const provider = captured.result();
  if (provider.statusCode !== 200) return res.status(provider.statusCode).json({ ok: false, code: "GENERATION_FAILED", provider: provider.body });
  const text = provider.body?.content?.find((part) => part?.type === "text")?.text;
  let payload;
  try { payload = JSON.parse(text); }
  catch { return res.status(422).json({ ok: false, code: "INVALID_SCHEMA", errors: ["provider response is not JSON"] }); }
  const result = assembleGeneration(req.body.task, payload, req.body, { model: provider.body?.model || null, createdAt: new Date().toISOString() });
  if (!result.ok) return res.status(422).json({ ok: false, code: "POLICY_REFUSED", errors: result.errors });
  return res.status(200).json({ ok: true, serviceVersion: "1.0.0", output: result.output, trace: result.trace });
}
