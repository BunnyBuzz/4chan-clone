import { json, getDb } from '../_db.js';
import { verifyPassword, newToken } from '../_auth.js';

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    let body = {};
    try {
      body = await context.request.json();
    } catch (e) {
      return json({ error: 'Invalid JSON.' }, 400);
    }

    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    if (!name || !password) return json({ error: 'Name and password required.' }, 400);

    const u = await db
      .prepare('SELECT id, name, avatar_url, password_hash, created_at FROM users WHERE lower(name) = lower(?)')
      .bind(name)
      .first();
    if (!u || !(await verifyPassword(password, u.password_hash))) {
      return json({ error: 'Wrong name or password.' }, 401);
    }

    const token = newToken();
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(token, u.id, now + 30 * 86400)
      .run();

    return json({
      token,
      user: { id: u.id, name: u.name, avatar_url: u.avatar_url, created_at: u.created_at }
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
