export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function getDb(env) {
  if (!env) return null;
  return env.DB || env['katsura-db'] || null;
}

export function newId() {
  try {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  } catch (e) {
    return Math.random().toString(16).slice(2, 10);
  }
}

export function parseImages(v) {
  try {
    const a = JSON.parse(v || '[]');
    return Array.isArray(a)
      ? a.filter((x) => typeof x === 'string' && x.startsWith('http')).slice(0, 4)
      : [];
  } catch (e) {
    return [];
  }
}

export function threadRow(r) {
  return {
    id: r.id,
    board: r.board,
    author: r.author,
    user_id: r.user_id || null,
    text: r.text,
    images: parseImages(r.images),
    created_at: r.created_at
  };
}

export function replyRow(r) {
  return {
    id: r.id,
    author: r.author,
    user_id: r.user_id || null,
    text: r.text,
    images: parseImages(r.images),
    created_at: r.created_at
  };
}
