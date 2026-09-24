import { json, getDb } from '../_db.js';
import { sessionUser } from '../_auth.js';

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const me = await sessionUser(db, context.request);
    if (!me) return json({ error: 'Not logged in.' }, 401);

    return json({ user: me });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
