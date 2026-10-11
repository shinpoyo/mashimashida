import type { GameMode, PenaltyId, PenaltyRule, TicketConfig } from '../types/game';

/** 主食券（難易度）。ロット数・持ち時間などのゲーム設定は engine/calls.ts の MODES */
export const TICKET_CONFIGS: Record<GameMode, TicketConfig> = {
  easy: {
    id: 'easy',
    name: '小ラーメン',
    noddle: '8ロット',
    desc: '初心者向け / 短いコール中心',
    speedTarget: '定番順',
    chefNote: '初心者歓迎！焦らずコールしろ',
    price: 850,
    badge: '青札・入門',
    tone: 'yellow',
  },
  normal: {
    id: 'normal',
    name: '大ラーメン',
    noddle: '10ロット',
    desc: '常連向け / マシマシ解禁',
    speedTarget: '定番順',
    chefNote: 'ロットを乱すな！テンポよく打て',
    price: 950,
    badge: '黄札・本番',
    tone: 'gold',
  },
  hard: {
    id: 'hard',
    name: '全マシマシ',
    noddle: '12ロット',
    desc: '猛者向け / 順不同・時間激短',
    speedTarget: '順不同',
    chefNote: 'チョモランマ襲来。迷えば即ロット乱し',
    price: 1150,
    badge: '赤札・猛者専用',
    tone: 'red',
  },
  super: {
    id: 'super',
    name: '超ハード',
    noddle: '8ロット',
    desc: '完成丼の画像だけが頼り',
    speedTarget: '画像出題',
    chefNote: 'コールは見せねえ。丼を見て当てろ',
    price: 1300,
    badge: '黒札・完食者限定',
    tone: 'black',
  },
};

export const MODE_ORDER: GameMode[] = ['easy', 'normal', 'hard', 'super'];

/** 退店ペナルティ（ゲーム開始前に選択） */
export const PENALTY_RULES: PenaltyRule[] = [
  {
    id: 'none',
    name: 'なし',
    desc: '最後まで食べられる。のんびり練習',
    maxBreaks: null,
    maxMisses: null,
    scoreRate: 1.0,
  },
  {
    id: 'break3',
    name: '乱し3回',
    desc: 'ロット乱し3回で強制退店',
    maxBreaks: 3,
    maxMisses: null,
    scoreRate: 1.1,
  },
  {
    id: 'break1',
    name: '一発退店',
    desc: 'ロット乱し1回で即退店',
    maxBreaks: 1,
    maxMisses: null,
    scoreRate: 1.3,
  },
  {
    id: 'oni',
    name: '鬼店主',
    desc: '乱し1回 または ミス5回で退店',
    maxBreaks: 1,
    maxMisses: 5,
    scoreRate: 1.5,
  },
];

export const PENALTY_BY_ID = Object.fromEntries(PENALTY_RULES.map((p) => [p.id, p])) as Record<PenaltyId, PenaltyRule>;
