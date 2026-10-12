/**
 * マシマシ打 全国完飲番付 API
 *
 *   POST /v1/session            出題のシードを発行（1回使い切り）
 *   POST /v1/scores             打鍵の記録を受け取り、出題を再現して採点し直してから登録
 *   GET  /v1/rankings           番付（mode × period）
 *   GET  /v1/admin/recent       管理：最近の登録（要 ADMIN_TOKEN）
 *   POST /v1/admin/hide         管理：プレイヤーを番付から隠す／戻す（要 ADMIN_TOKEN）
 *
 * ゲームと同じ出題・判定・採点のコード（../../src/engine）をそのまま使う。
 */
import { MODES, makeCalls } from '../../src/engine/calls';
import { makeRng } from '../../src/engine/rng';
import { replayGame, ReplayError, type LotLog } from '../../src/engine/replay';
import { judgeRank } from '../../src/engine/scoring';
import { PENALTY_BY_ID } from '../../src/data/shop';
import { AVATAR_PRESETS, DEFAULT_PLAYER_NAME } from '../../src/data/playerPresets';
import type { GameMode, PenaltyId } from '../../src/types/game';
import { cleanName, hasNgWord } from './ngwords';

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  /** 管理用 API の合言葉（wrangler secret） */
  ADMIN_TOKEN?: string;
  /** IP アドレスをハッシュにするときの塩（wrangler secret） */
  IP_SALT?: string;
}

const RANKED_MODES: GameMode[] = ['easy', 'normal', 'hard'];
const PERIODS = ['day', 'week', 'month', 'all'] as const;
type Period = (typeof PERIODS)[number];

const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_LIMIT = { count: 60, windowMs: 10 * 60 * 1000 };
const SCORE_LIMIT = { count: 30, windowMs: 10 * 60 * 1000 };
const MAX_BODY = 64 * 1024;
const TOP_N = 50;

// ---------- 小道具 ----------

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  const ok = allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  return ok
    ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,authorization', 'access-control-max-age': '86400', vary: 'origin' }
    : { vary: 'origin' };
}

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
}

function fail(reason: string, message: string, status = 400): Response {
  return json({ ok: false, reason, message }, status);
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function readJson(req: Request): Promise<any> {
  const len = Number(req.headers.get('content-length') || '0');
  if (len > MAX_BODY) throw new HttpError(413, 'too_large', '記録が大きすぎます');
  const text = await req.text();
  if (text.length > MAX_BODY) throw new HttpError(413, 'too_large', '記録が大きすぎます');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'bad_json', '送られた内容を読めませんでした');
  }
}

class HttpError extends Error {
  constructor(public status: number, public reason: string, message: string) {
    super(message);
  }
}

/** 日本時間での日・週（月曜はじまり）・月の区切り */
export function periodKeys(ms: number): { day: string; week: string; month: string } {
  const jst = new Date(ms + 9 * 3600 * 1000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const dow = (jst.getUTCDay() + 6) % 7; // 月曜=0
  const monday = new Date(jst.getTime() - dow * 86400 * 1000);
  return { day: ymd(jst), week: ymd(monday), month: ymd(jst).slice(0, 7) };
}

async function rateLimit(env: Env, key: string, limit: { count: number; windowMs: number }, now: number) {
  const row = await env.DB.prepare('SELECT count, reset_at FROM rate WHERE key = ?').bind(key).first<{ count: number; reset_at: number }>();
  if (!row || row.reset_at <= now) {
    await env.DB.prepare('INSERT OR REPLACE INTO rate (key, count, reset_at) VALUES (?, 1, ?)').bind(key, now + limit.windowMs).run();
    return;
  }
  if (row.count >= limit.count) throw new HttpError(429, 'rate_limited', '短い時間に何度も送られています。少し待ってから遊んでください');
  await env.DB.prepare('UPDATE rate SET count = count + 1 WHERE key = ?').bind(key).run();
}

async function ipHash(req: Request, env: Env): Promise<string> {
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  return (await sha256(`${env.IP_SALT || 'mashimashi'}:${ip}`)).slice(0, 32);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---------- 人間らしさの検査 ----------

/** 打鍵の記録が人の操作として不自然でないか。問題があれば理由を返す */
export function implausible(lots: LotLog[], keys: number, typingMs: number, wallMs: number): string | null {
  // 開始からの実時間が、記録上のプレイ時間より短いのはあり得ない（カウントダウン約2秒を含める）
  if (wallMs + 1000 < typingMs + 2000) return 'wall';
  const kps = typingMs > 0 ? keys / (typingMs / 1000) : 0;
  if (keys >= 20 && kps > 16) return 'speed';
  // 30ms 未満の間隔が多すぎる・各ロットの最初の1打が早すぎる
  let gaps = 0;
  let quick = 0;
  let firsts = 0;
  let instantFirsts = 0;
  for (const lot of lots) {
    if (lot.t.length) {
      firsts++;
      if (lot.t[0] < 120) instantFirsts++;
    }
    for (let i = 1; i < lot.t.length; i++) {
      gaps++;
      if (lot.t[i] - lot.t[i - 1] < 30) quick++;
    }
  }
  if (gaps >= 20 && quick / gaps > 0.3) return 'interval';
  if (firsts >= 4 && instantFirsts / firsts > 0.5) return 'reaction';
  return null;
}

// ---------- API ----------

async function createSession(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req);
  const mode = body?.mode as GameMode;
  const penalty = body?.penalty as PenaltyId;
  if (!RANKED_MODES.includes(mode) || !PENALTY_BY_ID[penalty]) throw new HttpError(400, 'bad_mode', '食券かペナルティの指定が正しくありません');
  const now = Date.now();
  const ip = await ipHash(req, env);
  await rateLimit(env, `s:${ip}`, SESSION_LIMIT, now);
  const id = crypto.randomUUID();
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  await env.DB.prepare('INSERT INTO sessions (id, seed, mode, penalty, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, seed, mode, penalty, ip, now)
    .run();
  return json({ id, seed });
}

async function submitScore(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body = await readJson(req);
  const now = Date.now();
  const ip = await ipHash(req, env);
  await rateLimit(env, `p:${ip}`, SCORE_LIMIT, now);

  const sessionId = String(body?.sessionId || '');
  const playerId = String(body?.playerId || '');
  if (!/^[0-9a-f-]{36}$/.test(playerId)) return fail('bad_player', 'プレイヤー ID が正しくありません');
  const lots = body?.lots as LotLog[];
  if (!Array.isArray(lots) || lots.length > 20) return fail('invalid', '記録の形式が正しくありません');

  const name = cleanName(body?.name, DEFAULT_PLAYER_NAME);
  if (hasNgWord(name)) return fail('name', '名前に使えない言葉が含まれています。常連カードで名前を変えてください');
  const avatar = AVATAR_PRESETS.some((a) => a.id === body?.avatar) ? String(body.avatar) : 'ramen';

  const session = await env.DB.prepare('SELECT seed, mode, penalty, created_at, used FROM sessions WHERE id = ?')
    .bind(sessionId)
    .first<{ seed: number; mode: GameMode; penalty: PenaltyId; created_at: number; used: number }>();
  if (!session) return fail('session', '対局の記録が見つかりません');
  if (session.used) return fail('used', 'この対局はすでに登録されています');
  if (now - session.created_at > SESSION_TTL_MS) return fail('expired', '対局から時間がたちすぎています');
  // 先に使用済みにする（同じ記録の二重登録を防ぐ）
  const mark = await env.DB.prepare('UPDATE sessions SET used = 1 WHERE id = ? AND used = 0').bind(sessionId).run();
  if (!mark.meta.changes) return fail('used', 'この対局はすでに登録されています');

  const cfg = MODES[session.mode];
  const rule = PENALTY_BY_ID[session.penalty];
  const calls = makeCalls(cfg, makeRng(session.seed));
  let r;
  try {
    r = replayGame(cfg, rule, calls, lots);
  } catch (e) {
    if (e instanceof ReplayError) return fail('invalid', '記録を確かめられませんでした');
    throw e;
  }
  if (!r.complete && !r.expelled) return fail('invalid', '記録を確かめられませんでした');
  const odd = implausible(lots, r.keys, r.typingMs, now - session.created_at);
  if (odd) return fail('suspicious', '人の操作として不自然な記録のため登録しませんでした');

  const judged = judgeRank(cfg, { keys: r.keys, miss: r.miss, breaks: r.breaks, typingMs: r.typingMs });
  const rank = r.expelled ? '強制退店' : judged.rank;
  const playerHash = await sha256(playerId);
  const keys = periodKeys(now);

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO players (player_hash, name, avatar, updated_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(player_hash) DO UPDATE SET name = ?2, avatar = ?3, updated_at = ?4',
    ).bind(playerHash, name, avatar, now),
    env.DB.prepare(
      'INSERT INTO scores (player_hash, mode, penalty, score, rank, kps, accuracy, created_at, day, week, month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(playerHash, session.mode, session.penalty, r.score, rank, Math.round(judged.kps * 100) / 100, Math.round(judged.acc * 1000) / 10, now, keys.day, keys.week, keys.month),
  ]);

  // 登録した人がすぐ自分の順位を見られるよう、この食券の番付のキャッシュを消す
  ctx.waitUntil(Promise.all(PERIODS.map((p) => caches.default.delete(rankingCacheKey(session.mode, p)))));

  const positions = {} as Record<Period, number | null>;
  for (const p of PERIODS) positions[p] = await positionOf(env, session.mode, p, keys, playerHash);
  return json({ ok: true, score: r.score, rank, positions });
}

function periodFilter(period: Period, keys: { day: string; week: string; month: string }): { sql: string; args: string[] } {
  if (period === 'all') return { sql: '', args: [] };
  return { sql: ` AND s.${period} = ?`, args: [keys[period]] };
}

async function positionOf(env: Env, mode: GameMode, period: Period, keys: ReturnType<typeof periodKeys>, playerHash: string): Promise<number | null> {
  const f = periodFilter(period, keys);
  const mine = await env.DB.prepare(`SELECT MAX(s.score) AS best FROM scores s WHERE s.mode = ? AND s.player_hash = ?${f.sql}`)
    .bind(mode, playerHash, ...f.args)
    .first<{ best: number | null }>();
  if (mine?.best == null) return null;
  const above = await env.DB.prepare(
    `SELECT COUNT(*) AS c FROM (SELECT s.player_hash, MAX(s.score) AS best FROM scores s JOIN players p ON p.player_hash = s.player_hash WHERE s.mode = ? AND p.hidden = 0${f.sql} GROUP BY s.player_hash) WHERE best > ?`,
  )
    .bind(mode, ...f.args, mine.best)
    .first<{ c: number }>();
  return (above?.c ?? 0) + 1;
}

function rankingCacheKey(mode: GameMode, period: Period): Request {
  return new Request(`https://cache.internal/rankings?mode=${mode}&period=${period}`);
}

async function rankings(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') as GameMode;
  const period = url.searchParams.get('period') as Period;
  if (!RANKED_MODES.includes(mode) || !PERIODS.includes(period)) throw new HttpError(400, 'bad_query', '指定が正しくありません');

  const cache = caches.default;
  const cacheKey = rankingCacheKey(mode, period);
  const hit = await cache.match(cacheKey);
  if (hit) return new Response(hit.body, hit);

  const f = periodFilter(period, periodKeys(Date.now()));
  const { results } = await env.DB.prepare(
    `SELECT x.player_hash, p.name, p.avatar, x.score, x.penalty, x.rank, x.kps, x.accuracy, x.created_at FROM (
       SELECT s.*, ROW_NUMBER() OVER (PARTITION BY s.player_hash ORDER BY s.score DESC, s.created_at ASC) AS rn
       FROM scores s WHERE s.mode = ?${f.sql}
     ) x JOIN players p ON p.player_hash = x.player_hash
     WHERE x.rn = 1 AND p.hidden = 0
     ORDER BY x.score DESC, x.created_at ASC LIMIT ${TOP_N}`,
  )
    .bind(mode, ...f.args)
    .all<{ player_hash: string; name: string; avatar: string; score: number; penalty: string; rank: string; kps: number; accuracy: number; created_at: number }>();

  let lastScore = -1;
  let lastPos = 0;
  const entries = results.map((row, i) => {
    const position = row.score === lastScore ? lastPos : i + 1;
    lastScore = row.score;
    lastPos = position;
    return {
      position,
      name: row.name,
      avatar: row.avatar,
      score: row.score,
      penalty: row.penalty,
      rank: row.rank,
      kps: row.kps,
      accuracy: row.accuracy,
      at: row.created_at,
      ph: row.player_hash.slice(0, 12),
    };
  });
  const res = json({ mode, period, entries }, 200, { 'cache-control': 'public, max-age=15' });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

function requireAdmin(req: Request, env: Env) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_TOKEN || !token || !timingSafeEqual(token, env.ADMIN_TOKEN)) throw new HttpError(401, 'unauthorized', '管理用の合言葉が違います');
}

async function adminRecent(req: Request, env: Env): Promise<Response> {
  requireAdmin(req, env);
  const { results } = await env.DB.prepare(
    `SELECT substr(s.player_hash, 1, 12) AS ph, p.name, p.hidden, s.mode, s.penalty, s.score, s.kps, s.accuracy, s.created_at
     FROM scores s JOIN players p ON p.player_hash = s.player_hash ORDER BY s.id DESC LIMIT 100`,
  ).all();
  return json({ results });
}

async function adminHide(req: Request, env: Env): Promise<Response> {
  requireAdmin(req, env);
  const body = await readJson(req);
  const ph = String(body?.ph || '');
  if (!/^[0-9a-f]{12}$/.test(ph)) throw new HttpError(400, 'bad_ph', 'ph は12文字の英数字で指定してください');
  const hidden = body?.hidden === false ? 0 : 1;
  const r = await env.DB.prepare('UPDATE players SET hidden = ? WHERE substr(player_hash, 1, 12) = ?').bind(hidden, ph).run();
  return json({ ok: true, changed: r.meta.changes });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const { pathname } = new URL(req.url);
    let res: Response;
    try {
      if (req.method === 'POST' && pathname === '/v1/session') res = await createSession(req, env);
      else if (req.method === 'POST' && pathname === '/v1/scores') res = await submitScore(req, env, ctx);
      else if (req.method === 'GET' && pathname === '/v1/rankings') res = await rankings(req, env, ctx);
      else if (req.method === 'GET' && pathname === '/v1/admin/recent') res = await adminRecent(req, env);
      else if (req.method === 'POST' && pathname === '/v1/admin/hide') res = await adminHide(req, env);
      else if (req.method === 'GET' && pathname === '/') res = json({ name: 'mashimashi-ranking', ok: true });
      else res = fail('not_found', 'ページがありません', 404);
    } catch (e) {
      if (e instanceof HttpError) res = fail(e.reason, e.message, e.status);
      else {
        console.error(e);
        res = fail('server', 'サーバーでエラーが起きました', 500);
      }
    }
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
    return out;
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE created_at < ?').bind(now - 24 * 3600 * 1000),
      env.DB.prepare('DELETE FROM rate WHERE reset_at < ?').bind(now),
    ]);
  },
};
