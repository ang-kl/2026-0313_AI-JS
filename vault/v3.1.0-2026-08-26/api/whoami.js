// GET /api/whoami - is the caller's browser currently signed in (general user session)?
// Used on page load to restore "Signed in as X" without a fresh Telegram round-trip.
import { verifyUserSession } from "../lib/user-session.js";

export const config = { api: { bodyParser: false }, maxDuration: 5 };

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed", code: "METHOD" });
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return res.status(200).json({ ok: false, reason: "not_configured" });
  const sess = verifyUserSession(req, secret);
  if (!sess.ok) return res.status(200).json({ ok: false, reason: sess.reason });
  return res.status(200).json({ ok: true, userId: sess.userId });
}
