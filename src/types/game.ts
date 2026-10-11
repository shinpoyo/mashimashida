export type ScreenType = 'ticket-vending' | 'typing-battle' | 'call-master' | 'leaderboard' | 'my-kitchen';

export type TicketDifficulty = 'sho' | 'dai' | 'buta' | 'insane';

export interface TicketConfig {
  id: TicketDifficulty;
  name: string;
  noddle: string;
  desc: string;
  keystrokes: number;
  timeLimit: number; // in seconds
  speedTarget: string;
  chefNote: string;
  price: number;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  strikesAllowed: number;
}

export interface ToppingBuff {
  id: string;
  name: string;
  cost: number;
  desc: string;
  icon: string;
  effectType: 'mistake_shield' | 'time_extend' | 'score_multiplier' | 'combo_protect' | 'fat_reduction';
  effectValue: number;
}

export interface CallOption {
  yasai: string;
  garlic: string;
  abura: string;
  karame: string;
}

export interface TypingPhrase {
  id: string;
  kanji: string;
  kana: string;
  romaji: string;
  levelDesc: string;
  slurpSound: string;
  lore: string;
}

export interface LeaderboardEntry {
  rank: number;
  rankTitle: string;
  name: string;
  title: string;
  wpm: number;
  accuracy: number;
  clearTime: string;
  strikes: number;
  badgeStatus: string;
  noddleSpec: string;
  isUser?: boolean;
}

export interface UserStats {
  bowlsCleared: number;
  strikesCount: number;
  maxWpm: number;
  accuracyAvg: number;
  lifetimeKeystrokes: number;
  perfectClears: number;
  favoriteCall: string;
  title: string;
  recentGames: {
    id: string;
    mode: TicketDifficulty;
    date: string;
    wpm: number;
    accuracy: number;
    time: string;
    cleared: boolean;
  }[];
}
