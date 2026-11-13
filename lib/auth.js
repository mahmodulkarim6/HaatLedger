// Single shared admin password. Works in the Edge middleware and in API routes (Web Crypto only).
export const COOKIE = 'hl_session';
export const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

async function sign(msg) {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || '';
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const authConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

export async function passwordOk(input) {
  if (!authConfigured()) return false;
  return safeEqual(await sign('pw:' + String(input)), await sign('pw:' + process.env.ADMIN_PASSWORD));
}

export const makeToken = () => sign('haatledger-admin-session');

export async function tokenOk(token) {
  if (!token || !authConfigured()) return false;
  return safeEqual(token, await makeToken());
}
