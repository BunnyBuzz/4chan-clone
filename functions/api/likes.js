import { json, getDb } from './_db.js';

function validId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(id);
}

async function readCount(db, tid) {
  const row = await db.prepare('SELECT count FROM likes WHERE target_id = ?').bind(tid).first();
  return row ? row.count : 0;
}

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    const tid = new URL(context.request.url).searchParams.get('target_id');
    if (!validId(tid)) return json({ error: 'Bad target id.' }, 400);

    return json({ target_id: tid, count: await readCount(db, tid) });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

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
    if (!validId(body.target_id)) return json({ error: 'Bad target id.' }, 400);

    await db
      .prepare('INSERT INTO likes (target_id, count) VALUES (?, 1) ON CONFLICT(target_id) DO UPDATE SET count = count + 1')
      .bind(body.target_id)
      .run();

    return json({ target_id: body.target_id, count: await readCount(db, body.target_id) });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const db = getDb(context.env);
    if (!db) return json({ error: 'DB not bound.' }, 500);

    let tid = new URL(context.request.url).searchParams.get('target_id');
    if (!tid) {
      try {
        tid = (await context.request.json()).target_id;
      } catch (e) {}
    }
    if (!validId(tid)) return json({ error: 'Bad target id.' }, 400);

    await db
      .prepare('INSERT INTO likes (target_id, count) VALUES (?, 0) ON CONFLICT(target_id) DO UPDATE SET count = CASE WHEN count > 0 THEN count - 1 ELSE 0 END')
      .bind(tid)
      .run();

    return json({ target_id: tid, count: await readCount(db, tid) });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
