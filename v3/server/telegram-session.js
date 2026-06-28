import crypto from 'crypto';

const COOKIE_NAME = 'v3_tg_session';
const LEGACY_COOKIE_NAME = 'tara_sess';

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(header.split(';').map(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return null;
    return [part.slice(0, idx).trim(), decodeURIComponent(part.slice(idx + 1).trim())];
  }).filter(Boolean));
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function sessionSecret() {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

function allowedChatId() {
  return String(process.env.TELEGRAM_CHAT_ID || '').trim();
}

function gateEnabled(force = false) {
  return force || /^(1|true|yes|on)$/i.test(String(process.env.TELEGRAM_GATE_ENABLED || ''));
}

function sign(value) {
  const secret = sessionSecret();
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function readTelegramSession(req) {
  const cookies = parseCookies(req);
  const value = cookies[COOKIE_NAME] || cookies[LEGACY_COOKIE_NAME];
  if (!value) return null;
  const [body, sig] = value.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  if (!expected || !safeEqual(expected, sig)) return null;
  try {
    const user = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!user.id && user.uid) user.id = user.uid;
    if (!user.exp || user.exp < Math.floor(Date.now() / 1000)) return null;
    const allowed = allowedChatId();
    if (allowed && String(user.id) !== allowed) return null;
    return user;
  } catch (_) {
    return null;
  }
}

export function requireTelegramSession(req, res, options = {}) {
  if (!gateEnabled(Boolean(options.force))) return { gateDisabled: true };
  const user = readTelegramSession(req);
  if (user) return user;
  res.status(401).json({ ok: false, code: 'TELEGRAM_LOGIN_REQUIRED', message: 'Telegram login required.' });
  return null;
}
