// Railway entry point. Replaces vercel.json's per-file serverless functions + rewrites +
// headers with one long-lived Express server: static `dist/` build, every v3/api/*.js
// handler mounted at its matching path, and the same SPA/demo rewrites and security
// headers the Vercel deployment had. Every api/*.js handler already uses the plain
// Node-runtime `export default async function handler(req, res)` signature (req.query,
// req.body, res.status().json(), res.setHeader() all exist natively on Express's req/res),
// so they're wired in unchanged below - no per-handler rewriting needed.

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import claude from "./api/claude.js";
import esco from "./api/esco.js";
import mcf from "./api/mcf.js";
import careers from "./api/careers.js";
import datagov from "./api/datagov.js";
import ssic from "./api/ssic.js";
import geocode from "./api/geocode.js";
import anatomy from "./api/anatomy.js";
import engine from "./api/engine.js";
import ssoc from "./api/ssoc.js";
import similarRoles from "./api/similar-roles.js";
import suggest from "./api/suggest.js";
import state from "./api/state.js";
import login from "./api/login.js";
import logout from "./api/logout.js";
import whoami from "./api/whoami.js";
import alert from "./api/alert.js";
import adminConfig from "./api/admin/config.js";
import adminTgVerify from "./api/admin/tg-verify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "dist");
const PORT = process.env.PORT || 8080;

const app = express();
app.disable("x-powered-by");

// Same CSP/security headers vercel.json applied to every response, minus the
// @vercel/analytics + @vercel/speed-insights allowances (those packages are removed).
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "connect-src 'self' https://api.openai.com https://api.mycareersfuture.gov.sg https://api-production.data.gov.sg; " +
      "object-src 'none'; base-uri 'self'; frame-src https://oauth.telegram.org; " +
      "img-src 'self' data: https://t.me;"
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// --- API routes: same paths as the old /api/*.js Vercel functions. ---
const api = express.Router();
api.use(express.json());

api.all("/claude", claude);
api.all("/esco", esco);
api.all("/mcf", mcf);
api.all("/careers", careers);
api.all("/datagov", datagov);
api.all("/ssic", ssic);
api.all("/geocode", geocode);
api.all("/anatomy", anatomy);
api.all("/engine", engine);
api.all("/ssoc", ssoc);
api.all("/similar-roles", similarRoles);
api.all("/suggest", suggest);
api.all("/state", state);
api.all("/login", login);
api.all("/logout", logout);
api.all("/whoami", whoami);
api.all("/alert", alert);
api.all("/admin/config", adminConfig);
api.all("/admin/tg-verify", adminTgVerify);

app.use("/api", api);

// --- Static build output. ---
// /assets/* - immutable, matches vercel.json's long-lived cache for hashed asset files.
app.use(
  "/assets",
  express.static(path.join(DIST_DIR, "assets"), {
    setHeaders: (res) => res.setHeader("Cache-Control", "public, max-age=31536000, immutable"),
  })
);

// Everything else in dist/ (favicon, robots.txt, etc.) - default caching, HTML excluded
// below so index.html/demo.html/terms.html always revalidate.
app.use(
  express.static(DIST_DIR, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  })
);

// /demo -> demo.html, matching vercel.json's rewrite.
app.get("/demo", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(DIST_DIR, "demo.html"));
});

// SPA fallback: anything else (that isn't /api/* or a real static file above) serves
// index.html, same as vercel.json's `/((?!api/).*) -> /index.html` rewrite.
app.get("*", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[server] listening on 0.0.0.0:${PORT}`);
});
