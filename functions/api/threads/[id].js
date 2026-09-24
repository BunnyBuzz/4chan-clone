import { json, getDb, threadRow, replyRow } from '../_db.js';

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const id = context.params.id;
    const t = await db.prepare('SELECT * FROM threads WHERE id = ?').bind(id).first();
    if (!t) return json({ error: 'Thread not found.' }, 404);

    const replies = await db
      .prepare('SELECT * FROM replies WHERE thread_id = ? ORDER BY created_at ASC')
      .bind(id)
      .all();

    return json({
      thread: threadRow(t),
      replies: (replies.results || []).map(replyRow)
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
