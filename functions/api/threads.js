import { json, getDb, newId } from './_db.js';
import { sessionUser } from './_auth.js';

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

    const me = await sessionUser(db, context.request);
    const board = String(body.board || 'c').slice(0, 8);
    const author = me
      ? me.name
      : (String(body.author || 'Anonymous').trim() || 'Anonymous').slice(0, 30);
    const text = String(body.text || '').trim();
    const images = Array.isArray(body.images)
      ? body.images.filter((u) => typeof u === 'string' && u.startsWith('http')).slice(0, 4)
      : [];

    if (!text && !images.length) return json({ error: 'Empty post.' }, 400);
    if (text.length > 5000) return json({ error: 'Text too long.' }, 400);

    const id = newId();
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare('INSERT INTO threads (id, board, author, user_id, text, images, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, board, author, me ? me.id : null, text, JSON.stringify(images), now)
      .run();

    return json(
      { thread: { id, board, author, user_id: me ? me.id : null, text, images, created_at: now, replies: 0 } },
      201
    );
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
