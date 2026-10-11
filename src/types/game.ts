import type { PlayerAvatar } from '../data/player';

export type ScreenType = 'ticket-vending' | 'call-master' | 'leaderboard' | 'regular-card';

/** ゲームモード（mashimashityping の4モード） */
export type GameMode = 'easy' | 'normal' | 'hard' | 'super';
export type TicketDifficulty = GameMode;

export interface TicketConfig {
  id: GameMode;
  name: string;
  noddle: string;
  desc: string;
  speedTarget: string;
  chefNote: string;
  price: number;
  badge: string;
  /** 札の色テーマ */
  tone: 'yellow' | 'gold' | 'red' | 'black';
}

export type PenaltyId = 'none' | 'break3' | 'break1' | 'oni';

/** 退店ペナルティ（ゲーム開始前に選択） */
export interface PenaltyRule {
  id: PenaltyId;
  name: string;
  desc: string;
  /** この回数ロット乱しで強制退店（null=無制限） */
  maxBreaks: number | null;
  /** この回数ミスタイプで強制退店（null=無制限） */
  maxMisses: number | null;
  /** スコア倍率（厳しいほど高い） */
  scoreRate: number;
}

export interface GameSettings {
  mode: GameMode;
  penalty: PenaltyId;
}

export interface GameResult {
  mode: GameMode;
  penalty: PenaltyId;
  score: number;
  /** 打鍵/秒 */
  kps: number;
  wpm: number;
  /** 正確率（%） */
  accuracy: number;
  keys: number;
  misses: number;
  breaks: number;
  fastestMs: number | null;
  maxChain: number;
  lotsServed: number;
  lots: number;
  rank: string;
  rankComment: string;
  /** 退店ペナルティで強制退店 */
  expelled: boolean;
  /** ギブアップ退店 */
  gaveUp: boolean;
  isBest: boolean;
  durationSec: number;
}

export interface UserStats {
  /** プレイヤー（常連客）の名前とアイコン */
  playerName: string;
  avatar: PlayerAvatar;
  bowlsCleared: number;
  strikesCount: number;
  maxWpm: number;
  accuracyAvg: number;
  lifetimeKeystrokes: number;
  perfectClears: number;
  favoriteCall: string;
  title: string;
  bestScores: Partial<Record<GameMode, { score: number; rank: string; date: string }>>;
  recentGames: {
    id: string;
    mode: GameMode;
    date: string;
    wpm: number;
    accuracy: number;
    time: string;
    cleared: boolean;
    score?: number;
    rank?: string;
  }[];
}
