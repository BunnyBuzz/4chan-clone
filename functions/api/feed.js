import { json, getDb, threadRow } from './_db.js';

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.', envKeys: Object.keys(context.env || {}) }, 500);

    const params = new URL(context.request.url).searchParams;
    const board = (params.get('board') || 'c').slice(0, 8);
    const limit = Math.min(parseInt(params.get('limit') || '30', 10) || 30, 100);

    const rows = await context.env.DB.prepare(
      'SELECT t.id, t.board, t.author, t.user_id, t.text, t.images, t.created_at, ' +
      '(SELECT COUNT(*) FROM replies r WHERE r.thread_id = t.id) AS replies, ' +
      '(SELECT count FROM likes l WHERE l.target_id = t.id) AS likes ' +
      'FROM threads t WHERE t.board = ? ORDER BY t.created_at DESC LIMIT ?'
    ).bind(board, limit).all();

    return json({
      threads: (rows.results || []).map((r) => ({ ...threadRow(r), replies: r.replies, likes: r.likes || 0 }))
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
