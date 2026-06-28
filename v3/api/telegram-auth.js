import crypto from 'crypto';

const COOKIE_NAME = 'v3_tg_session';
const AUTH_MAX_AGE_SECONDS = 24 * 60 * 60;
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function json(res, status, body, headers = {}) {
  res.status(status);
  Object.entries({ 'Content-Type': 'application/json; charset=utf-8', ...headers }).forEach(([k, v]) => {
    res.setHeader(k, v);
  });
  res.end(JSON.stringify(body));
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

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

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

function getAllowedChatId() {
  return String(process.env.TELEGRAM_CHAT_ID || '').trim();
}

function getSessionSecret() {
  return getBotToken();
}

function sign(value) {
  const secret = getSessionSecret();
  if (!secret) throw new Error('Missing TELEGRAM_BOT_TOKEN');
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function sessionCookie(value, maxAgeSeconds) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) parts.push('Secure');
  return parts.join('; ');
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : ''}`;
}

function publicUser(user) {
  return {
    id: user.id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
    photo_url: user.photo_url || '',
    auth_date: user.auth_date || 0,
  };
}

function makeSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(JSON.stringify({
    ...publicUser(user),
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  }));
  return `${body}.${sign(body)}`;
}

function readSession(req) {
  const value = parseCookies(req)[COOKIE_NAME];
  if (!value) return null;
  const [body, sig] = value.split('.');
  if (!body || !sig || !safeEqual(sign(body), sig)) return null;
  try {
    const user = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!user.exp || user.exp < Math.floor(Date.now() / 1000)) return null;
    const allowedChatId = getAllowedChatId();
    if (allowedChatId && String(user.id) !== allowedChatId) return null;
    return publicUser(user);
  } catch (_) {
    return null;
  }
}

function verifyTelegramUser(raw) {
  const botToken = getBotToken();
  if (!botToken) return { ok: false, code: 'CONFIG', message: 'Telegram login is not configured.' };
  const allowedChatId = getAllowedChatId();
  if (!allowedChatId) return { ok: false, code: 'CONFIG', message: 'Telegram allowlist is not configured.' };
  if (!raw || typeof raw !== 'object') return { ok: false, code: 'BAD_REQUEST', message: 'Missing Telegram user payload.' };

  const { hash, ...fields } = raw;
  if (!hash) return { ok: false, code: 'BAD_HASH', message: 'Missing Telegram login hash.' };
  const authDate = Number(fields.auth_date || 0);
  const now = Math.floor(Date.now() / 1000);
  if (!authDate || now - authDate > AUTH_MAX_AGE_SECONDS) {
    return { ok: false, code: 'EXPIRED', message: 'Telegram login expired. Please try again.' };
  }

  const dataCheckString = Object.keys(fields)
    .filter(k => fields[k] !== undefined && fields[k] !== null && fields[k] !== '')
    .sort()
    .map(k => `${k}=${fields[k]}`)
    .join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (!safeEqual(expected, hash)) {
    return { ok: false, code: 'INVALID', message: 'Telegram login could not be verified.' };
  }

  if (String(fields.id || '') !== allowedChatId) {
    return { ok: false, code: 'FORBIDDEN', message: 'This Telegram account is not allowed for V3.' };
  }

  return { ok: true, user: publicUser({ ...fields, id: Number(fields.id), auth_date: authDate }) };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const user = readSession(req);
    return json(res, 200, { ok: Boolean(user), user });
  }

  if (req.method === 'POST') {
    const verified = verifyTelegramUser(req.body);
    if (!verified.ok) return json(res, verified.code === 'CONFIG' ? 500 : 401, verified);
    res.setHeader('Set-Cookie', sessionCookie(makeSession(verified.user), SESSION_MAX_AGE_SECONDS));
    return json(res, 200, { ok: true, user: verified.user });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return json(res, 200, { ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return json(res, 405, { ok: false, code: 'METHOD_NOT_ALLOWED' });
}
