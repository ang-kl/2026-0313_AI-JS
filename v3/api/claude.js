export const config = {
  api: { bodyParser: true },
  maxDuration: 300,
};

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[proxy] OPENAI_API_KEY not set");
    return res.status(500).json({ ...WARM_ERRORS.server, debug: "API key missing" });
  }

  // Validate body
  const { model, max_tokens, messages, system } = req.body || {};
  if (!model || !max_tokens || !Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "Invalid request body", code: "BAD_REQUEST" });
  }

  const openAiModel = openAiModelFor(model);
  const instructions = textFromSystem(system);
  const input = textFromMessages(messages);

  // Log model and token budget for debugging
  console.log(`[proxy] provider=openai requested_model=${model} openai_model=${openAiModel} max_tokens=${max_tokens} system_len=${instructions.length}`);

  // Timeout: 280s (leaves 20s buffer inside Vercel 300s maxDuration)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 280000);

  try {
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
        max_output_tokens: max_tokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();
    console.log(`[proxy] status=${response.status} provider=openai output_blocks=${data?.output?.length || 0}`);

    if (!response.ok) {
      const status = response.status;
      const oType = (data && data.error && (data.error.type || data.error.code)) || "";
      const oMsg = (data && data.error && data.error.message) || "";
      const detail = `HTTP ${status}${oType ? " " + oType : ""}${oMsg ? ": " + oMsg : ""}`.slice(0, 300);
      console.error(`[proxy] OpenAI error ${status}:`, JSON.stringify(data));
      // 401/403 = auth failure: say so plainly (was misleadingly mapped to "reached our limit").
      if (status === 401 || status === 403) return res.status(503).json({ code: "AUTH", message: "The AI service rejected the API key. Please check OPENAI_API_KEY in this project's Vercel settings.", debug: detail });
      if (status === 429 || status === 529) return res.status(503).json({ ...WARM_ERRORS.overload, debug: detail });
      if (status >= 500)                    return res.status(503).json({ ...WARM_ERRORS.server,   debug: detail });
      return res.status(status).json({ error: oMsg || `HTTP ${status}`, code: oType || `HTTP_${status}`, debug: detail });
    }

    // Validate response has content
    const text = textFromOpenAI(data);
    if (!text) {
      console.error("[proxy] Empty content in OpenAI response");
      return res.status(503).json({ ...WARM_ERRORS.server, debug: "Empty response from OpenAI" });
    }

    return res.status(200).json({
      id: data.id,
      model: data.model || openAiModel,
      stop_reason: data.status || "complete",
      content: [{ type: "text", text }],
      provider: "openai",
    });

  } catch (err) {
    clearTimeout(timeout);
    const isTimeout = err.name === "AbortError";
    console.error(`[proxy] ${isTimeout ? "Timeout" : "Fetch error"}:`, err.message);
    return res.status(503).json({
      ...(isTimeout ? WARM_ERRORS.timeout : WARM_ERRORS.overload),
      debug: isTimeout ? "Request timed out after 55s" : err.message,
    });
  }
}
