-- 出題のシードを発行した記録（1回使い切り）
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  seed INTEGER NOT NULL,
  mode TEXT NOT NULL,
  penalty TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);

-- プレイヤー（player_hash はプレイヤー ID の SHA-256。生の ID は保存しない）
CREATE TABLE IF NOT EXISTS players (
  player_hash TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- 検証済みのスコア
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_hash TEXT NOT NULL,
  mode TEXT NOT NULL,
  penalty TEXT NOT NULL,
  score INTEGER NOT NULL,
  rank TEXT NOT NULL,
  kps REAL NOT NULL,
  accuracy REAL NOT NULL,
  created_at INTEGER NOT NULL,
  day TEXT NOT NULL,
  week TEXT NOT NULL,
  month TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scores_mode_score ON scores(mode, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_mode_day ON scores(mode, day);
CREATE INDEX IF NOT EXISTS idx_scores_mode_week ON scores(mode, week);
CREATE INDEX IF NOT EXISTS idx_scores_mode_month ON scores(mode, month);
CREATE INDEX IF NOT EXISTS idx_scores_player ON scores(player_hash);

-- 連投の制限（IP のハッシュごと）
CREATE TABLE IF NOT EXISTS rate (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
