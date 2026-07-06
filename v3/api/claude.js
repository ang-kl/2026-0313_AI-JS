// LLM narration proxy. Contract + guardrails: v3/script/v3-llm-proxy-guardrails-spec.md.
// Invariants (do not break without updating the spec):
//   1. Engine computes, LLM narrates - this file never authors a number, band or verdict.
//   2. No log line may include raw messages[*].content or system[*].text; only structural
//      or numeric facts. Provider error strings are the one known trade-off (needed for
//      diagnosis) and truncated to 300 chars via providerError().
//   3. Three rejection caps below reject clearly-abusive shapes loud; the proxy never
//      silently drops or truncates a caller's payload.
export const config = {
  api: { bodyParser: true },
  maxDuration: 300,
};

// Rejection caps (v3-llm-proxy-guardrails-spec.md §4).
const MAX_MESSAGES = 32;         // Any single call over 32 message turns is a caller-side loop.
const MAX_OUTPUT_TOKENS = 8192;  // Any narration over 8K output tokens is a caller-side bug.
const MAX_PROMPT_CHARS = 200000; // Assembled system + messages content; ~50K input tokens.

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

function anthropicModelFor(requestedModel) {
  const requested = String(requestedModel || "");
  // Pass any claude-* model id through verbatim.
  if (/^claude-/i.test(requested)) return requested;
  const configured = process.env.ANTHROPIC_MODEL || "";
  if (configured) return configured;
  // Fast tier: haiku family. Strong tier: opus / sonnet / fable family. Defaults reflect
  // the currently-latest ids at time of authoring; overrides via ANTHROPIC_MODEL_* env.
  if (/haiku/i.test(requested)) {
    return process.env.ANTHROPIC_MODEL_FAST || "claude-haiku-4-5-20251001";
  }
  if (/opus|sonnet|fable/i.test(requested)) {
    return process.env.ANTHROPIC_MODEL_STRONG || "claude-opus-4-8";
  }
  return process.env.ANTHROPIC_MODEL_FAST || "claude-haiku-4-5-20251001";
}

function openAiModelFor(requestedModel) {
  const requested = String(requestedModel || "");
  if (/^(gpt|o[0-9]|o-)/i.test(requested)) return requested;
  const configured = process.env.OPENAI_MODEL || "";
  if (configured) return configured;
  if (/opus|sonnet|fable/i.test(requested)) {
    return process.env.OPENAI_MODEL_STRONG || "gpt-4.1";
  }
  return process.env.OPENAI_MODEL_FAST || "gpt-4.1-mini";
}

function geminiModelFor() {
  return (process.env.GEMINI_MODEL || "").replace(/^models\//, "");
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
    const err = new Error("Empty response from Anthropic");
    err.provider = "anthropic";
    err.status = 503;
    err.debug = "Empty response from Anthropic";
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
  const body = {
    contents: [{ role: "user", parts: [{ text: input }] }],
    generationConfig: { maxOutputTokens: maxTokens },
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

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModel = geminiModelFor();
  const hasGeminiFallback = Boolean(geminiKey && geminiModel);
  // Primary chain (spec §3): ANTHROPIC -> OPENAI -> GEMINI. At least one must be configured.
  if (!anthropicKey && !openAiKey && !hasGeminiFallback) {
    console.error("[proxy] no LLM provider configured: ANTHROPIC_API_KEY / OPENAI_API_KEY / (GEMINI_API_KEY + GEMINI_MODEL) all missing");
    return res.status(500).json({ ...WARM_ERRORS.server, debug: "No LLM provider configured (need one of ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY+GEMINI_MODEL)" });
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

  const anthropicModel = anthropicModelFor(model);
  const openAiModel = openAiModelFor(model);
  const instructions = textFromSystem(system);
  const input = textFromMessages(messages);
  // Assembled prompt cap - covers system + all message content, not just the raw body.
  const promptLen = instructions.length + input.length;
  if (promptLen > MAX_PROMPT_CHARS) {
    return res.status(413).json({ error: `Prompt too large (${promptLen} > ${MAX_PROMPT_CHARS} chars)`, code: "TOO_LARGE" });
  }

  // Log model and token budget for debugging. NO-PII invariant: log lengths, never content.
  console.log(`[proxy] requested_model=${model} anthropic_model=${anthropicModel} openai_model=${openAiModel} gemini_model=${geminiModel} max_tokens=${maxTokensNum} system_len=${instructions.length} input_len=${input.length} msg_count=${messages.length}`);

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

  const hasOpenAiFallback = Boolean(openAiKey);
  // Track the highest-priority provider that was preferred but failed / skipped, for the
  // fallback_from field. Anthropic wins over OpenAI wins over nothing.
  let fallbackFrom = null;

  try {
    // Provider chain (spec §3): ANTHROPIC -> OPENAI -> GEMINI. Each fires only if configured;
    // each failure falls through to the next configured provider with its own fresh signal.
    if (anthropicKey) {
      try {
        const anthropicResult = await runProvider(({ signal }) => callAnthropic({ apiKey: anthropicKey, anthropicModel, instructions, messages, maxTokens: maxTokensNum, signal }));
        return res.status(200).json(anthropicResult);
      } catch (anthropicErr) {
        console.error(`[proxy] Anthropic failed; ${hasOpenAiFallback ? "trying OpenAI fallback" : hasGeminiFallback ? "trying Gemini fallback" : "no fallback configured"}:`, anthropicErr.debug || anthropicErr.message);
        if (!hasOpenAiFallback && !hasGeminiFallback) throw anthropicErr;
        fallbackFrom = "anthropic";
      }
    }

    if (openAiKey) {
      try {
        const openAiResult = await runProvider(({ signal }) => callOpenAI({ apiKey: openAiKey, openAiModel, instructions, input, maxTokens: maxTokensNum, signal }));
        return res.status(200).json(fallbackFrom ? { ...openAiResult, fallback_from: fallbackFrom } : openAiResult);
      } catch (openAiErr) {
        console.error(`[proxy] OpenAI failed; ${hasGeminiFallback ? "trying Gemini fallback" : "no Gemini fallback configured"}:`, openAiErr.debug || openAiErr.message);
        if (!hasGeminiFallback) throw openAiErr;
        // Preserve the highest-priority skip: keep "anthropic" if it was already the skip
        // reason, otherwise mark openai as the fallback source for gemini's response.
        if (!fallbackFrom) fallbackFrom = "openai";
      }
    }

    const geminiResult = await runProvider(({ signal }) => callGemini({ apiKey: geminiKey, geminiModel, instructions, input, maxTokens: maxTokensNum, signal }));
    return res.status(200).json(fallbackFrom ? { ...geminiResult, fallback_from: fallbackFrom } : geminiResult);

  } catch (err) {
    const isTimeout = err.name === "AbortError";
    const status = err.status || 503;
    const provider = err.provider || "llm";
    console.error(`[proxy] ${isTimeout ? "Timeout" : "Provider failure"} provider=${provider}:`, err.debug || err.message);
    if (status === 401 || status === 403) {
      const keyName = provider === "gemini" ? "GEMINI_API_KEY" : provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
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
