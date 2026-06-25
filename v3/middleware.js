// v3/middleware.js - Vercel Edge Middleware: Telegram-gated access.
// Every request to v3.takearoundabout.com that is not on the auth allow-list runs
// through this middleware. If the session cookie is missing or its HMAC signature
// does not verify against TELEGRAM_BOT_TOKEN, the request is redirected to /login
// (for HTML navigations) or returned 401 (for API calls). When TELEGRAM_BOT_TOKEN
// is not set in the deploy environment the gate is a no-op - the site stays open,
// so a misconfigured rollout cannot lock the owner out.
//
// Cookie format: `tara_sess=<payloadB64url>.<signatureB64url>` where payload is
// JSON `{ uid, exp }` (exp = unix seconds) and signature is HMAC-SHA256 of the
// payload using TELEGRAM_BOT_TOKEN as the secret. The same secret is used in
// api/auth.js to mint the cookie; rotating the bot token invalidates every
// outstanding session for free.

export const config = {
  matcher: [
    "/((?!api/auth|api/logout|api/login-config|login|login\\.html|terms|terms\\.html|favicon\\.ico|robots\\.txt|_vercel).*)",
  ],
};

function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifySession(cookieVal, secret) {
  if (!cookieVal || typeof cookieVal !== "string") return null;
  const dot = cookieVal.indexOf(".");
  if (dot < 1 || dot >= cookieVal.length - 1) return null;
  const payloadB64 = cookieVal.slice(0, dot);
  const sigB64 = cookieVal.slice(dot + 1);

  const enc = new TextEncoder();
  let key;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch { return null; }

  let sig;
  try { sig = b64urlDecode(sigB64); } catch { return null; }
  const ok = await crypto.subtle.verify("HMAC", key, sig, enc.encode(payloadB64));
  if (!ok) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
  } catch { return null; }
  if (!payload || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export default async function middleware(req) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // Fail-open if the gate isn't configured - avoids locking the owner out of a
  // half-provisioned deploy. The login flow itself also checks this and 503s.
  if (!token) return;

  const cookies = req.headers.get("cookie") || "";
  const m = cookies.match(/(?:^|;\s*)tara_sess=([^;]+)/);
  const sess = m ? m[1] : null;
  const payload = await verifySession(sess, token);
  if (payload) return;

  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const loginUrl = new URL("/login", req.url);
  // Preserve the originally requested path so /api/auth can hop the user back.
  if (url.pathname !== "/" && url.pathname !== "/login") {
    loginUrl.searchParams.set("next", url.pathname + url.search);
  }
  return Response.redirect(loginUrl, 302);
}
