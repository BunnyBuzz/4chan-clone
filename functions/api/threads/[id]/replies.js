import { json, getDb, newId, replyRow } from '../../_db.js';

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const replies = await db
      .prepare('SELECT * FROM replies WHERE thread_id = ? ORDER BY created_at ASC')
      .bind(context.params.id)
      .all();

    return json({ replies: (replies.results || []).map(replyRow) });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const threadId = context.params.id;
    const parent = await db.prepare('SELECT id FROM threads WHERE id = ?').bind(threadId).first();
    if (!parent) return json({ error: 'Thread not found.' }, 404);

    let body = {};
    try {
      body = await context.request.json();
    } catch (e) {
      return json({ error: 'Invalid JSON.' }, 400);
    }

    const author = (String(body.author || 'Anonymous').trim() || 'Anonymous').slice(0, 30);
    const text = String(body.text || '').trim();
    const images = Array.isArray(body.images)
      ? body.images.filter((u) => typeof u === 'string' && u.startsWith('http')).slice(0, 4)
      : [];

    if (!text && !images.length) return json({ error: 'Empty reply.' }, 400);
    if (text.length > 2000) return json({ error: 'Text too long.' }, 400);

    const id = newId();
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare('INSERT INTO replies (id, thread_id, author, text, images, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, threadId, author, text, JSON.stringify(images), now)
      .run();

    return json(
      { reply: { id, author, text, images, created_at: now } },
      201
    );
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const threadId = context.params.id;
    let rid = new URL(context.request.url).searchParams.get('id');
    if (!rid) {
      try { rid = (await context.request.json()).id; } catch (e) {}
    }
    if (!rid) return json({ error: 'Reply id required.' }, 400);

    const r = await db
      .prepare('SELECT id FROM replies WHERE id = ? AND thread_id = ?')
      .bind(String(rid), threadId)
      .first();
    if (!r) return json({ error: 'Reply not found.' }, 404);

    await db.prepare('DELETE FROM replies WHERE id = ?').bind(String(rid)).run();

    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
