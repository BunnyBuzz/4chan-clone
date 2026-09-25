import { json } from './_db.js';

const ITER = 100000;

function b64encode(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(s) {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, key, 256
  );
  return 'pbkdf2$100000$' + b64encode(salt) + '$' + b64encode(bits);
}

export async function verifyPassword(password, stored) {
  try {
    const parts = String(stored || '').split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iter = parseInt(parts[1], 10) || 0;
    if (!iter) return false;
    const salt = b64decode(parts[2]);
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256
    );
    return b64encode(bits) === parts[3];
  } catch (e) {
    return false;
  }
}

export function newToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return b64encode(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function bearerToken(request) {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function sessionUser(db, request) {
  const token = bearerToken(request);
  if (!token) return null;
  const s = await db
    .prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?')
    .bind(token)
    .first();
  if (!s) return null;
  if (s.expires_at && s.expires_at < Math.floor(Date.now() / 1000)) {
    await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  return db
    .prepare('SELECT id, name, avatar_url, created_at FROM users WHERE id = ?')
    .bind(s.user_id)
    .first();
}

export { json };
