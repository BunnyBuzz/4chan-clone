import { json, getDb } from './_db.js';

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const rows = await db
      .prepare('SELECT board, COUNT(*) AS threads FROM threads GROUP BY board')
      .all();

    return json({ boards: rows.results || [] });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
