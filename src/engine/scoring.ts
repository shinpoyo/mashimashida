/**
 * 採点・称号（mashimashityping/js/game.js の finish() を移植）
 */
import type { ModeConfig } from './calls';

export const RANKS: [number, string, string][] = [
  [0, 'ロット乱し', '店主の視線が痛い…。まずは食券の買い方から。'],
  [1.5, '一見さん', 'コールの存在は知っている。まずは小ラーメンから。'],
  [2.5, '常連見習い', 'コールに迷いがなくなってきた。'],
  [3.5, '常連', '店主に顔を覚えられ始めた。'],
  [5.0, 'ロット番長', 'ロットの流れを完全に掌握している。'],
  [6.5, '麺神', '全マシマシを一息で唱える伝説の存在。'],
];

export interface RawStats {
  keys: number;
  miss: number;
  breaks: number;
  typingMs: number;
}

/** 1ロット成功時の獲得点（倍率適用前） */
export function lotScore(cfg: ModeConfig, typedLen: number, remainSec: number): number {
  return cfg.super
    ? typedLen * 15 + Math.round(remainSec * 40)
    : typedLen * 10 + Math.round(remainSec * 30);
}

export function judgeRank(cfg: ModeConfig, s: RawStats) {
  const total = s.keys + s.miss;
  const acc = total ? s.keys / total : 0;
  const kps = s.typingMs ? s.keys / (s.typingMs / 1000) : 0;
  let eff = cfg.super
    ? kps * acc * acc * 1.6 - s.breaks * 0.6
    : kps * acc * acc - s.breaks * 0.4;
  if (s.breaks >= cfg.lots / 2) eff = 0;
  let rank = RANKS[0];
  for (const r of RANKS) if (eff >= r[0]) rank = r;
  return { acc, kps, rank: rank[1], comment: rank[2] };
}
