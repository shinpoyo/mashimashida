/**
 * 全国完飲番付（オンラインランキング）の通信。
 * サーバーは worker/（Cloudflare Workers + D1）。ビルド時の VITE_RANKING_API が空なら、全国番付の機能は出さない。
 *
 * しくみ：開始時にサーバーから出題のシードをもらい、終了時に打鍵の記録を送る。
 * サーバーは同じシードで出題を再現し、記録を再生して採点をやり直す（点数だけの書き換えは通らない）。
 */
import type { GameMode, PenaltyId } from '../types/game';
import type { LotLog } from '../engine/replay';
import type { PlayerAvatar } from '../data/player';

const API = ((import.meta.env.VITE_RANKING_API as string | undefined) || '').replace(/\/+$/, '');
export const RANKING_ENABLED = API !== '';

export type Period = 'day' | 'week' | 'month' | 'all';
export const PERIODS: { id: Period; label: string }[] = [
  { id: 'day', label: '日間' },
  { id: 'week', label: '週間' },
  { id: 'month', label: '月間' },
  { id: 'all', label: '歴代' },
];

export interface RankingEntry {
  position: number;
  name: string;
  avatar: string;
  score: number;
  penalty: PenaltyId;
  rank: string;
  kps: number;
  accuracy: number;
  at: number;
  /** プレイヤーを見分ける短い記号（自分の行を強調するため） */
  ph: string;
}

export interface RankingResponse {
  mode: GameMode;
  period: Period;
  entries: RankingEntry[];
}

export type SubmitResponse =
  | { ok: true; score: number; positions: Record<Period, number | null> }
  | { ok: false; reason: string; message: string };

const ID_KEY = 'mashimashi_player_id';
const OPT_KEY = 'mashimashi_ranking_optin';

function storageGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* 保存できない環境でも遊べる */ }
}

/** この端末のプレイヤー ID（ランダム。サーバーには送るが公開はされない） */
export function playerId(): string {
  let id = storageGet(ID_KEY);
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = crypto.randomUUID();
    storageSet(ID_KEY, id);
  }
  return id;
}

/** 全国番付に参加するか（初期値：参加する） */
export function rankingOptIn(): boolean {
  return storageGet(OPT_KEY) !== 'false';
}
export function setRankingOptIn(on: boolean) {
  storageSet(OPT_KEY, on ? 'true' : 'false');
}

/** 自分の記号（サーバーが返す ph と同じ計算：プレイヤー ID の SHA-256 の先頭12文字） */
export async function myPlayerHash(): Promise<string> {
  const data = new TextEncoder().encode(playerId());
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

/** 番付に出すアイコン（画像アイコンは送らず、絵文字のプリセットだけ） */
export function rankingAvatar(avatar: PlayerAvatar): string {
  return avatar.kind === 'preset' ? avatar.id : 'ramen';
}

async function call<T>(path: string, init: RequestInit = {}, timeoutMs = 6000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(API + path, {
      ...init,
      signal: ctrl.signal,
      headers: init.body ? { 'content-type': 'application/json' } : undefined,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok && !(body && typeof body === 'object' && 'reason' in body)) throw new Error(`HTTP ${res.status}`);
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

/** 出題のシードをもらう。使えないとき（通信できない・参加しない）は null */
export async function requestSession(mode: GameMode, penalty: PenaltyId): Promise<{ id: string; seed: number } | null> {
  if (!RANKING_ENABLED || !rankingOptIn() || mode === 'super') return null;
  try {
    const r = await call<{ id: string; seed: number }>('/v1/session', {
      method: 'POST',
      body: JSON.stringify({ mode, penalty }),
    }, 2500);
    return r && typeof r.id === 'string' && Number.isInteger(r.seed) ? r : null;
  } catch {
    return null;
  }
}

export async function submitScore(payload: {
  sessionId: string;
  name: string;
  avatar: string;
  lots: LotLog[];
}): Promise<SubmitResponse> {
  try {
    return await call<SubmitResponse>('/v1/scores', {
      method: 'POST',
      body: JSON.stringify({ ...payload, playerId: playerId() }),
    });
  } catch {
    return { ok: false, reason: 'network', message: '通信できませんでした' };
  }
}

export async function fetchRanking(mode: GameMode, period: Period): Promise<RankingResponse> {
  return call<RankingResponse>(`/v1/rankings?mode=${mode}&period=${period}`);
}
