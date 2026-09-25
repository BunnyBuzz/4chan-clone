import { json, getDb, threadRow, replyRow } from '../_db.js';
import { sessionUser } from '../_auth.js';

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const id = context.params.id;
    const t = await db.prepare('SELECT * FROM threads WHERE id = ?').bind(id).first();
    if (!t) return json({ error: 'Thread not found.' }, 404);

    await db.prepare('UPDATE threads SET views = views + 1 WHERE id = ?').bind(id).run();
    t.views = (t.views || 0) + 1;

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

export async function onRequestDelete(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const id = context.params.id;
    const t = await db.prepare('SELECT id, user_id FROM threads WHERE id = ?').bind(id).first();
    if (!t) return json({ error: 'Thread not found.' }, 404);

    const me = await sessionUser(db, context.request);
    if (!me) return json({ error: 'Login required.' }, 401);
    if (t.user_id && me.id !== t.user_id) {
      return json({ error: 'Not yours.' }, 403);
    }

    await db.prepare('DELETE FROM replies WHERE thread_id = ?').bind(id).run();
    await db.prepare('DELETE FROM threads WHERE id = ?').bind(id).run();

    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
