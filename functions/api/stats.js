import { json, getDb } from './_db.js';

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const t = await db.prepare('SELECT COUNT(*) AS n FROM threads').first();
    const p = await db.prepare('SELECT COUNT(*) AS n FROM replies').first();

    return json({
      threads: t ? t.n : 0,
      posts: (t ? t.n : 0) + (p ? p.n : 0)
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
