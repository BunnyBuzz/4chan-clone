import { json, getDb, newId } from '../_db.js';
import { hashPassword, newToken } from '../_auth.js';

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
    if (name.length < 2 || name.length > 30) {
      return json({ error: 'Name must be 2-30 chars.' }, 400);
    }
    if (password.length < 4) {
      return json({ error: 'Password too short (min 4).' }, 400);
    }

    const taken = await db
      .prepare('SELECT id FROM users WHERE lower(name) = lower(?)')
      .bind(name)
      .first();
    if (taken) return json({ error: 'Name taken.' }, 409);

    const id = newId();
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare('INSERT INTO users (id, name, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .bind(id, name, await hashPassword(password), now)
      .run();

    const token = newToken();
    await db
      .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(token, id, now + 30 * 86400)
      .run();

    return json(
      { token, user: { id, name, avatar_url: null, created_at: now } },
      201
    );
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
