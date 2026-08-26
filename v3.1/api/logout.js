// POST /api/logout - clears the general user session cookie set by /api/login.
import { clearUserCookieHeader } from "../lib/user-session.js";

export const config = { api: { bodyParser: false }, maxDuration: 5 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed", code: "METHOD" });
  res.setHeader("Set-Cookie", clearUserCookieHeader());
  return res.status(200).json({ ok: true });
}
