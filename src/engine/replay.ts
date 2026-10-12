/**
 * 打鍵の記録から1回分のゲームを再現して採点する。
 * ブラウザ（結果の確定）とサーバー（オンライン番付の検証）で同じ関数を使い、点数が必ず一致するようにする。
 */
import type { Call, ModeConfig } from './calls';
import { Typer } from './romaji';
import { lotScore } from './scoring';

/** 1ロット分の打鍵記録 */
export interface LotLog {
  /** 押したキー（1文字ずつ・小文字） */
  k: string;
  /** 各キーを押した時刻（そのロットの開始からのミリ秒・整数・一時休戦の時間は含まない） */
  t: number[];
  /** ギブアップでロットの途中に終わったときの経過ミリ秒 */
  end?: number;
}

export interface PenaltyLimits {
  maxBreaks: number | null;
  maxMisses: number | null;
  scoreRate: number;
}

export interface ReplayResult {
  score: number;
  keys: number;
  miss: number;
  breaks: number;
  typingMs: number;
  fastestMs: number | null;
  maxChain: number;
  served: number;
  expelled: 'breaks' | 'misses' | null;
  /** 全ロットを最後まで遊んだ（退店・ギブアップなし） */
  complete: boolean;
}

export class ReplayError extends Error {}

/** そのロットの持ち時間（ミリ秒） */
export function lotLimitMs(cfg: ModeConfig, call: Call): number {
  return Math.round((cfg.base + cfg.perKey * new Typer(call.kana).rest().length) * 1000);
}

export function replayGame(
  cfg: ModeConfig,
  rule: PenaltyLimits,
  calls: Call[],
  lots: LotLog[],
  opts: { gaveUp?: boolean } = {},
): ReplayResult {
  if (cfg.super) throw new ReplayError('super mode is not supported');
  if (lots.length > calls.length) throw new ReplayError('too many lots');
  const r: ReplayResult = {
    score: 0, keys: 0, miss: 0, breaks: 0, typingMs: 0,
    fastestMs: null, maxChain: 0, served: 0, expelled: null, complete: false,
  };
  let chain = 0;

  for (let i = 0; i < lots.length; i++) {
    const lot = lots[i];
    const last = i === lots.length - 1;
    if (typeof lot.k !== 'string' || !Array.isArray(lot.t) || lot.k.length !== lot.t.length) {
      throw new ReplayError('malformed lot');
    }
    const typer = new Typer(calls[i].kana);
    const limit = lotLimitMs(cfg, calls[i]);
    let prev = 0;
    let doneAt: number | null = null;

    for (let j = 0; j < lot.k.length; j++) {
      const ch = lot.k[j];
      const t = lot.t[j];
      if (!Number.isInteger(t) || t < prev || t >= limit) throw new ReplayError('bad timestamp');
      if (doneAt !== null) throw new ReplayError('keys after lot end');
      prev = t;
      if (typer.input(ch)) {
        r.keys++;
        if (typer.done) doneAt = t;
      } else {
        r.miss++;
        if (rule.maxMisses !== null && r.miss >= rule.maxMisses) {
          if (j !== lot.k.length - 1 || !last) throw new ReplayError('keys after expulsion');
          r.typingMs += t;
          r.expelled = 'misses';
          return r;
        }
      }
    }

    if (doneAt !== null) {
      r.typingMs += doneAt;
      r.fastestMs = r.fastestMs === null ? doneAt : Math.min(r.fastestMs, doneAt);
      chain++;
      r.maxChain = Math.max(r.maxChain, chain);
      r.served++;
      const remain = Math.max(0, (limit - doneAt) / 1000);
      r.score += Math.round(lotScore(cfg, typer.typed.length, remain) * rule.scoreRate);
      continue;
    }

    // 打ち切れなかったロット：ギブアップ（最後のロットのみ）か、時間切れ（ロット乱し）
    if (last && opts.gaveUp) {
      const end = lot.end ?? prev;
      if (!Number.isInteger(end) || end < prev || end > limit) throw new ReplayError('bad end');
      r.typingMs += end;
      return r;
    }
    r.typingMs += limit;
    r.breaks++;
    chain = 0;
    if (rule.maxBreaks !== null && r.breaks >= rule.maxBreaks) {
      if (!last) throw new ReplayError('lots after expulsion');
      r.expelled = 'breaks';
      return r;
    }
  }

  if (opts.gaveUp) return r;
  if (lots.length !== calls.length) throw new ReplayError('missing lots');
  r.complete = true;
  return r;
}
