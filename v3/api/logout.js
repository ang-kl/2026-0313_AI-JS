// v3/api/logout.js - clears the session cookie set by api/auth.js and bounces
// back to /login. Idempotent and safe to GET so it can be reached from a plain
// anchor in the app shell or a bookmark.

export const config = { api: { bodyParser: false }, maxDuration: 5 };

export default async function handler(_req, res) {
  res.setHeader("Set-Cookie",
    "tara_sess=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  );
  res.statusCode = 302;
  res.setHeader("Location", "/login");
  res.end();
}
