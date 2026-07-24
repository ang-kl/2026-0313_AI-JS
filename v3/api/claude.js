// LLM narration proxy. Contract + guardrails: v3/script/v3-llm-proxy-guardrails-spec.md.
// Invariants (do not break without updating the spec):
//   1. Engine computes, LLM narrates - this file never authors a number, band or verdict.
//   2. No log line may include raw messages[*].content or system[*].text; only structural
//      or numeric facts. Provider error strings are the one known trade-off (needed for
//      diagnosis) and truncated to 300 chars via providerError().
//   3. Three rejection caps below reject clearly-abusive shapes loud; the proxy never
//      silently drops or truncates a caller's payload.
import { kvAvailable, kvGet } from "../lib/admin/kv.js";

export const config = {
  api: { bodyParser: true },
  maxDuration: 300,
};

// Rejection caps (v3-llm-proxy-guardrails-spec.md §4).
const MAX_MESSAGES = 32;         // Any single call over 32 message turns is a caller-side loop.
const MAX_OUTPUT_TOKENS = 8192;  // Any narration over 8K output tokens is a caller-side bug.
const MAX_PROMPT_CHARS = 200000; // Assembled system + messages content; ~50K input tokens.

// Admin-configurable provider chain (v3-admin-module-spec.md). Read from Vercel KV at
// request time with a short in-memory cache. Falls back to the built-in order when KV is
// unconfigured, empty, or errors. NEVER blocks the request path: KV failure -> defaults.
const KV_CONFIG_KEY = "v3:admin:llm-config";
const CHAIN_CACHE_TTL_MS = 30_000;
// Directive (24-07 '26 - Human Lead: "fallback to ANTHROPIC as second choice"):
// OpenAI stays primary; Anthropic is back in the chain as the fallback so a repeat of
// the 24-07'26 outage (OpenAI HTTP 429 insufficient_quota with nothing to fall back to,
// confirmed via the Vercel log - every /api/claude call 503ing and breaking Step 2 ->
// Step 3) degrades to Anthropic instead of hard-failing. Supersedes the 12-07'26 gate,
// which existed for the opposite reason (Anthropic was the one out of credits then).
const DEFAULT_CHAIN = ["openai", "anthropic"];
// Temporarily gated providers: excluded at the availability layer below, so they are
// NEVER tried regardless of the KV admin chain or a still-present API key. Empty for
// now - add a provider name here (e.g. "anthropic") if its account goes out of credits
// again and needs to be pulled from the chain without a key change.
const GATED_PROVIDERS = new Set([]);
// Keep all three valid for KV admin overrides - VALID_PROVIDERS governs what the KV
// chain may CONTAIN; GATED_PROVIDERS governs what is actually reachable right now.
const VALID_PROVIDERS = new Set(["anthropic", "gemini", "openai"]);
let _chainCache = { value: null, at: 0 };
async function loadAdminConfig() {
  const now = Date.now();
  if (_chainCache.value && (now - _chainCache.at) < CHAIN_CACHE_TTL_MS) return _chainCache.value;
  const defaults = { chain: DEFAULT_CHAIN, overrides: {} };
  if (!kvAvailable()) { _chainCache = { value: defaults, at: now }; return defaults; }
  try {
    const r = await kvGet(KV_CONFIG_KEY);
    if (!r.ok || !r.value || typeof r.value !== "object") {
      _chainCache = { value: defaults, at: now };
      return defaults;
    }
    const chain = Array.isArray(r.value.chain)
      ? r.value.chain.filter((p) => VALID_PROVIDERS.has(p))
      : [];
    const overrides = (r.value.overrides && typeof r.value.overrides === "object") ? r.value.overrides : {};
    const value = { chain: chain.length ? chain : DEFAULT_CHAIN, overrides };
    _chainCache = { value, at: now };
    return value;
  } catch (err) {
    console.warn("[proxy] KV admin config read failed; using defaults:", err?.message || err);
    _chainCache = { value: defaults, at: now };
    return defaults;
  }
}

function textFromSystem(system) {
  if (!system) return "";
  if (typeof system === "string") return system;
  if (!Array.isArray(system)) return "";
  return system.map(b => (b && b.text) ? String(b.text) : "").filter(Boolean).join("\n\n");
}

function textFromMessages(messages) {
  return (messages || []).map(m => {
    const content = m && m.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map(c => {
        if (typeof c === "string") return c;
        return (c && (c.text || c.content)) ? String(c.text || c.content) : "";
      }).filter(Boolean).join("\n");
    }
    return "";
  }).filter(Boolean).join("\n\n");
}

// Each *ModelFor helper accepts an optional `ov` (override object from KV admin config).
// Precedence for defaults: kv override > env var > baked-in fallback. The verbatim
// pass-through for a caller-supplied "correct-shape" id always wins first - callers who
// know exactly which model they want get it, admin overrides are for the resolver defaults.
// Human Lead directive (09-07 '26): "use only sonnet 5" - every Anthropic call resolves
// to Sonnet 5 regardless of the caller's requested tier (haiku/opus/fable) or the
// verbatim claude-* pass-through this used to honour first. ANTHROPIC_MODEL still wins
// if an operator explicitly sets it (admin override), for the rare case a different
// pinned model is needed without a code change.
function anthropicModelFor(requestedModel, ov = {}) {
  const configured = ov.model || process.env.ANTHROPIC_MODEL || "";
  if (configured) return configured;
  return "claude-sonnet-5";
}

function openAiModelFor(requestedModel, ov = {}) {
  const requested = String(requestedModel || "");
  if (/^(gpt|o[0-9]|o-)/i.test(requested)) return requested;
  // OPENAI_MODEL is the canonical name; OPENAI_MODEL_KEY is an accepted alias for it
  // (Human Lead set that name in Vercel, 22-07 '26). Both hold a model *id* (e.g.
  // "gpt-4.1-mini"), NOT a credential - the API key stays in OPENAI_API_KEY.
  const configured = ov.model || process.env.OPENAI_MODEL || process.env.OPENAI_MODEL_KEY || "";
  if (configured) return configured;
  if (/opus|sonnet|fable/i.test(requested)) {
    return ov.strong || process.env.OPENAI_MODEL_STRONG || "gpt-4.1";
  }
  return ov.fast || process.env.OPENAI_MODEL_FAST || "gpt-4.1-mini";
}

function geminiModelFor(ov = {}) {
  const raw = ov.model || process.env.GEMINI_MODEL || "";
  return raw.replace(/^models\//, "");
}

function textFromAnthropic(data) {
  const chunks = [];
  (data?.content || []).forEach(part => {
    if (part?.type === "text" && typeof part.text === "string") chunks.push(part.text);
  });
  return chunks.join("");
}

function textFromOpenAI(data) {
  if (typeof data?.output_text === "string" && data.output_text) return data.output_text;
  const chunks = [];
  (data?.output || []).forEach(item => {
    (item?.content || []).forEach(part => {
      if (typeof part?.text === "string") chunks.push(part.text);
      if (typeof part?.content === "string") chunks.push(part.content);
    });
  });
  return chunks.join("");
}

function textFromGemini(data) {
  const chunks = [];
  (data?.candidates || []).forEach(candidate => {
    (candidate?.content?.parts || []).forEach(part => {
      if (typeof part?.text === "string") chunks.push(part.text);
    });
  });
  return chunks.join("");
}

function providerError(provider, status, data) {
  const raw = data?.error || {};
  const type = raw.type || raw.code || "";
  const message = raw.message || "";
  const detail = `HTTP ${status}${type ? " " + type : ""}${message ? ": " + message : ""}`.slice(0, 300);
  const err = new Error(message || `${provider} HTTP ${status}`);
  err.provider = provider;
  err.status = status;
  err.code = type || `HTTP_${status}`;
  err.debug = detail;
  err.raw = data;
  return err;
}

async function callAnthropic({ apiKey, anthropicModel, instructions, messages, maxTokens, signal }) {
  const body = { model: anthropicModel, max_tokens: maxTokens, messages };
  if (instructions) body.system = instructions;
  // Sonnet 5 silently changed the thinking default: with no `thinking` field the
  // request runs ADAPTIVE THINKING (Sonnet 4.6 ran thinking-off), and max_tokens
  // caps thinking + text TOGETHER. This proxy's callers use deliberately tight
  // budgets (e.g. 400 + n*110 for skill ratings), so thinking could consume the
  // whole budget and return 200 OK with a thinking block and NO text block -
  // seen live all day as intermittent "[proxy] Provider failure provider=
  // anthropic: Empty response from Anthropic" 503s. Same failure class as the
  // Gemini thinkingConfig fix (v3.0.266). These calls are narration/JSON-output
  // advisory passes - the engine does the reasoning deterministically - so
  // thinking is disabled explicitly. (Guard: `disabled` is accepted on Sonnet/
  // Opus 4.7+ but returns 400 on Fable/Mythos, where thinking is always on -
  // skip the field there if the env override ever points at one.)
  if (!/fable|mythos/i.test(String(anthropicModel))) body.thinking = { type: "disabled" };
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal,
  });

  const data = await response.json();
  console.log(`[proxy] status=${response.status} provider=anthropic content_blocks=${data?.content?.length || 0}`);

  if (!response.ok) throw providerError("anthropic", response.status, data);

  const text = textFromAnthropic(data);
  if (!text) {
    // Diagnose, don't just declare: name the stop_reason and block types so a
    // recurrence is attributable from the log line alone (the bare "Empty
    // response" message hid the thinking-ate-the-budget cause for a full day).
    const blockTypes = (data && Array.isArray(data.content) ? data.content : []).map((b) => b && b.type).join(",") || "none";
    console.error(`[proxy] empty anthropic response: stop_reason=${data && data.stop_reason} blocks=[${blockTypes}] max_tokens=${maxTokens}`);
    const err = new Error("Empty response from Anthropic");
    err.provider = "anthropic";
    err.status = 503;
    err.debug = "Empty response from Anthropic (stop_reason=" + (data && data.stop_reason) + ", blocks=" + blockTypes + ")";
    throw err;
  }

  return {
    id: data.id || "",
    model: data.model || anthropicModel,
    stop_reason: data.stop_reason || "complete",
    content: [{ type: "text", text }],
    provider: "anthropic",
  };
}

async function callOpenAI({ apiKey, openAiModel, instructions, input, maxTokens, signal }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      instructions,
      input,
      max_output_tokens: maxTokens,
    }),
    signal,
  });

  const data = await response.json();
  console.log(`[proxy] status=${response.status} provider=openai output_blocks=${data?.output?.length || 0}`);

  if (!response.ok) throw providerError("openai", response.status, data);

  const text = textFromOpenAI(data);
  if (!text) {
    const err = new Error("Empty response from OpenAI");
    err.provider = "openai";
    err.status = 503;
    err.debug = "Empty response from OpenAI";
    throw err;
  }

  return {
    id: data.id,
    model: data.model || openAiModel,
    stop_reason: data.status || "complete",
    content: [{ type: "text", text }],
    provider: "openai",
  };
}

async function callGemini({ apiKey, geminiModel, instructions, input, maxTokens, signal }) {
  // Gemini "flash"/"pro" models think by default and thinking tokens count against
  // maxOutputTokens - without disabling it, the model can burn the whole budget on
  // internal reasoning and return MAX_TOKENS with zero visible text. This proxy is
  // used for structured extraction/narration only, so the reasoning step is not needed.
  const body = {
    contents: [{ role: "user", parts: [{ text: input }] }],
    generationConfig: { maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } },
  };
  if (instructions) body.systemInstruction = { parts: [{ text: instructions }] };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  const data = await response.json();
  console.log(`[proxy] status=${response.status} provider=gemini candidates=${data?.candidates?.length || 0}`);

  if (!response.ok) throw providerError("gemini", response.status, data);

  const text = textFromGemini(data);
  if (!text) {
    const err = new Error("Empty response from Gemini");
    err.provider = "gemini";
    err.status = 503;
    err.debug = "Empty response from Gemini";
    throw err;
  }

  return {
    id: data.responseId || "",
    model: geminiModel,
    stop_reason: data.candidates?.[0]?.finishReason || "complete",
    content: [{ type: "text", text }],
    provider: "gemini",
  };
}

const WARM_ERRORS = {
  busy:     { code:"BUSY",     message:"The analyser is taking a short break - it has been a busy day and we have reached our limit. Please try again tomorrow." },
  overload: { code:"OVERLOAD", message:"The analyser is a little overwhelmed right now. Please wait a minute and try again." },
  timeout:  { code:"TIMEOUT",  message:"That one took a little longer than expected. Please try again - it usually resolves on the second attempt." },
  server:   { code:"SERVER",   message:"Something went wrong on our end. Please wait a moment and try again. If it keeps happening, drop us a note at feedback@takearoundabout.com" },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Vercel stores this under CLAUDE_API_KEY (renamed 09-07 '26).
  const anthropicKey = process.env.CLAUDE_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const admin = await loadAdminConfig();
  const anthropicModel = anthropicModelFor(req.body?.model, admin.overrides.anthropic);
  const openAiModel = openAiModelFor(req.body?.model, admin.overrides.openai);
  const geminiModel = geminiModelFor(admin.overrides.gemini);
  const hasGeminiFallback = Boolean(geminiKey && geminiModel);
  // Base availability per provider - a provider is only tried if its key(s) are present
  // AND it is not currently gated (GATED_PROVIDERS). A gated provider is treated as if it
  // had no key, so it is dropped from activeOrder no matter what the KV chain says.
  const configured = {
    anthropic: Boolean(anthropicKey) && !GATED_PROVIDERS.has("anthropic"),
    openai: Boolean(openAiKey) && !GATED_PROVIDERS.has("openai"),
    gemini: hasGeminiFallback && !GATED_PROVIDERS.has("gemini"),
  };
  if (!configured.anthropic && !configured.openai && !configured.gemini) {
    // Distinguish "no key at all" from "the only keyed provider is gated" so the operator
    // knows to set OPENAI_API_KEY (or lift the gate) rather than hunting a missing key.
    const gatedButKeyed = (GATED_PROVIDERS.has("anthropic") && anthropicKey) || (GATED_PROVIDERS.has("openai") && openAiKey) || (GATED_PROVIDERS.has("gemini") && hasGeminiFallback);
    const debug = gatedButKeyed
      ? `No ACTIVE LLM provider: the only configured provider(s) are gated (${[...GATED_PROVIDERS].join(", ")}). Set OPENAI_API_KEY in Vercel or lift the gate in api/claude.js.`
      : "No LLM provider configured (need one of CLAUDE_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY+GEMINI_MODEL)";
    console.error("[proxy] " + debug);
    return res.status(500).json({ ...WARM_ERRORS.server, debug });
  }

  // Validate body
  const { model, max_tokens, messages, system } = req.body || {};
  if (!model || !max_tokens || !Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "Invalid request body", code: "BAD_REQUEST" });
  }
  // Rejection caps (spec §4). Fail loud instead of silent truncation or dropped content.
  if (messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: `Too many messages (${messages.length} > ${MAX_MESSAGES})`, code: "BAD_REQUEST" });
  }
  const maxTokensNum = Number(max_tokens);
  if (!Number.isInteger(maxTokensNum) || maxTokensNum <= 0 || maxTokensNum > MAX_OUTPUT_TOKENS) {
    return res.status(400).json({ error: `max_tokens must be a positive integer <= ${MAX_OUTPUT_TOKENS}`, code: "BAD_TOKENS" });
  }

  const instructions = textFromSystem(system);
  const input = textFromMessages(messages);
  // Assembled prompt cap - covers system + all message content, not just the raw body.
  const promptLen = instructions.length + input.length;
  if (promptLen > MAX_PROMPT_CHARS) {
    return res.status(413).json({ error: `Prompt too large (${promptLen} > ${MAX_PROMPT_CHARS} chars)`, code: "TOO_LARGE" });
  }

  // Effective provider order: admin.chain filtered to configured providers, then any
  // remaining configured providers appended in their default order so we never silently
  // skip a working key just because it was left out of the KV chain. Bugs / typos in KV
  // never leave the caller with 500.
  const activeOrder = [];
  const seen = new Set();
  for (const p of admin.chain) { if (configured[p] && !seen.has(p)) { activeOrder.push(p); seen.add(p); } }
  for (const p of DEFAULT_CHAIN) { if (configured[p] && !seen.has(p)) { activeOrder.push(p); seen.add(p); } }

  // Log model and token budget for debugging. NO-PII invariant: log lengths, never content.
  console.log(`[proxy] requested_model=${model} chain=${activeOrder.join(">")} anthropic_model=${anthropicModel} openai_model=${openAiModel} gemini_model=${geminiModel} max_tokens=${maxTokensNum} system_len=${instructions.length} input_len=${input.length} msg_count=${messages.length}`);

  // Wall-clock budget: 280s total across all provider attempts (20s buffer inside the
  // Vercel 300s maxDuration). Each provider gets its OWN AbortController so a timeout on
  // one does not poison the next; the fresh controller for the next call starts non-aborted.
  // Codex review on PR #305 caught the previous shared-signal bug.
  const deadline = Date.now() + 280000;
  const runProvider = async (fn) => {
    const remaining = deadline - Date.now();
    if (remaining <= 2000) {
      const err = new Error("Provider chain exhausted the 280s budget before this attempt");
      err.name = "AbortError";
      err.debug = "Budget exhausted before attempt";
      throw err;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    try {
      return await fn({ signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  // fallback_from records the FIRST provider that was preferred but failed/skipped, so
  // callers see who the user asked for even after a couple of jumps.
  let fallbackFrom = null;
  let lastErr = null;

  const callFor = {
    anthropic: ({ signal }) => callAnthropic({ apiKey: anthropicKey, anthropicModel, instructions, messages, maxTokens: maxTokensNum, signal }),
    openai:    ({ signal }) => callOpenAI({ apiKey: openAiKey, openAiModel, instructions, input, maxTokens: maxTokensNum, signal }),
    gemini:    ({ signal }) => callGemini({ apiKey: geminiKey, geminiModel, instructions, input, maxTokens: maxTokensNum, signal }),
  };

  try {
    for (let i = 0; i < activeOrder.length; i++) {
      const name = activeOrder[i];
      const isLast = i === activeOrder.length - 1;
      try {
        const result = await runProvider(callFor[name]);
        return res.status(200).json(fallbackFrom ? { ...result, fallback_from: fallbackFrom } : result);
      } catch (err) {
        lastErr = err;
        const nextName = activeOrder[i + 1] || null;
        console.error(`[proxy] ${name} failed; ${nextName ? `trying ${nextName} fallback` : "no fallback remaining"}:`, err.debug || err.message);
        if (isLast) throw err;
        if (!fallbackFrom) fallbackFrom = name;
      }
    }
    // Every provider skipped / errored without throwing (should not happen given `isLast`
    // above, but be defensive).
    throw lastErr || new Error("No provider succeeded and no error surfaced");
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    const status = err.status || 503;
    const provider = err.provider || "llm";
    console.error(`[proxy] ${isTimeout ? "Timeout" : "Provider failure"} provider=${provider}:`, err.debug || err.message);
    if (status === 401 || status === 403) {
      const keyName = provider === "gemini" ? "GEMINI_API_KEY" : provider === "anthropic" ? "CLAUDE_API_KEY" : "OPENAI_API_KEY";
      return res.status(503).json({ code: "AUTH", message: `The AI service rejected the API key. Please check ${keyName} in this project's Vercel settings.`, debug: err.debug || err.message });
    }
    if (status >= 400 && status < 500 && status !== 429) {
      return res.status(status).json({ error: err.message || `HTTP ${status}`, code: err.code || `HTTP_${status}`, debug: err.debug || err.message });
    }
    return res.status(503).json({
      ...(isTimeout ? WARM_ERRORS.timeout : (status === 429 ? WARM_ERRORS.overload : WARM_ERRORS.server)),
      debug: isTimeout ? (err.debug || "Request timed out within the 280s budget") : (err.debug || err.message),
    });
  }
}
