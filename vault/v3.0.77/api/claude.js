export const config = {
  api: { bodyParser: true },
  maxDuration: 300,
};

// v6: prompt caching helper - only injects cache_control when system prompt
// meets Haiku 4.5 minimum of 4,096 tokens (~16,000 chars). Safe to call on
// every request - returns body unchanged if system is absent or too short.
function injectCaching(body) {
  if (!body.system) return body;
  const blocks = Array.isArray(body.system)
    ? body.system
    : [{ type: "text", text: body.system }];
  const totalChars = blocks.reduce((sum, b) => sum + (b.text || "").length, 0);
  if (totalChars < 16000) return body;
  const cached = blocks.map((b, i) => {
    if (i !== blocks.length - 1) return b;
    return Object.assign({}, b, { cache_control: { type: "ephemeral" } });
  });
  return Object.assign({}, body, { system: cached });
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[proxy] ANTHROPIC_API_KEY not set");
    return res.status(500).json({ ...WARM_ERRORS.server, debug: "API key missing" });
  }

  // Validate body
  const { model, max_tokens, messages, system } = req.body || {};
  if (!model || !max_tokens || !Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "Invalid request body", code: "BAD_REQUEST" });
  }

  // Apply prompt caching to system block when present
  const cachedBody = injectCaching(req.body);

  // Log model and token budget for debugging
  console.log(`[proxy] model=${cachedBody.model} max_tokens=${cachedBody.max_tokens} system_len=${typeof cachedBody.system === 'string' ? cachedBody.system.length : 'array'}`);

  // Timeout: 280s (leaves 20s buffer inside Vercel 300s maxDuration)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 280000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(cachedBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();
    console.log(`[proxy] status=${response.status} stop_reason=${data?.stop_reason} content_blocks=${data?.content?.length}`);

    if (!response.ok) {
      const status = response.status;
      const aType = (data && data.error && data.error.type) || "";
      const aMsg = (data && data.error && data.error.message) || "";
      const detail = `HTTP ${status}${aType ? " " + aType : ""}${aMsg ? ": " + aMsg : ""}`.slice(0, 300);
      console.error(`[proxy] Anthropic error ${status}:`, JSON.stringify(data));
      // 401/403 = auth failure: say so plainly (was misleadingly mapped to "reached our limit").
      if (status === 401 || status === 403) return res.status(503).json({ code: "AUTH", message: "The AI service rejected the API key. Please check ANTHROPIC_API_KEY in this project's Vercel settings.", debug: detail });
      if (status === 429 || status === 529) return res.status(503).json({ ...WARM_ERRORS.overload, debug: detail });
      if (status >= 500)                    return res.status(503).json({ ...WARM_ERRORS.server,   debug: detail });
      return res.status(status).json({ error: aMsg || `HTTP ${status}`, code: aType || `HTTP_${status}`, debug: detail });
    }

    // Validate response has content
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    if (!text) {
      console.error("[proxy] Empty content in Anthropic response");
      return res.status(503).json({ ...WARM_ERRORS.server, debug: "Empty response from Anthropic" });
    }

    return res.status(200).json(data);

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
