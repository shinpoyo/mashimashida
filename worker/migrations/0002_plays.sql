-- shinpoyo.com の作品一覧を「遊ばれた回数」の順に並べるためのカウンター
-- 1日・1作品・1人（IP のハッシュ）につき1回だけ数える
CREATE TABLE IF NOT EXISTS plays (
  game TEXT NOT NULL,
  day TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  PRIMARY KEY (game, day, ip_hash)
);
CREATE INDEX IF NOT EXISTS idx_plays_day ON plays(day);
