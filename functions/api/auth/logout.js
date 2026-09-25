import { json, getDb } from '../_db.js';
import { bearerToken } from '../_auth.js';

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const token = bearerToken(context.request);
    if (token) {
      await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
