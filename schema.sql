CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  password_hash TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  board TEXT NOT NULL DEFAULT 'c',
  author TEXT NOT NULL DEFAULT 'Anonymous',
  user_id TEXT,
  text TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  user_id TEXT,
  text TEXT NOT NULL DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_threads_board_time ON threads(board, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_thread ON replies(thread_id, created_at ASC);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS likes (
  target_id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
