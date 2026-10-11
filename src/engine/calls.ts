/**
 * コール生成ロジック（mashimashityping/js/game.js の TypeScript 移植）
 */
import type { GameMode } from '../types/game';

export type ToppingKey = 'yasai' | 'ninniku' | 'abura' | 'karame';

/** トッピングごとの量（0=なし, 1=スクナメ, 2=普通, 3=マシ … 8=マシ×6, 9=チョモランマ） */
export type ToppingLevels = Record<ToppingKey, number>;

export interface Call {
  /** 画面表示用（スペース区切り） */
  display: string;
  /** 判定用カナ */
  kana: string;
  /** 正解候補（超ハード用。指定時は MultiTyper で判定） */
  answers?: string[];
  /** 完成丼のトッピング量 */
  lv: ToppingLevels;
}

export interface ModeConfig {
  name: string;
  lots: number;
  /** 1ロットの基本持ち時間（秒） */
  base: number;
  /** ローマ字1打あたりの追加持ち時間（秒） */
  perKey: number;
  count?: [number, number];
  mods?: Record<string, number>;
  shuffle?: boolean;
  specials?: { display: string; kana: string; lv: Partial<ToppingLevels> }[];
  specialRate?: number;
  super?: boolean;
}

export const TOPPINGS: { key: ToppingKey; word: string }[] = [
  { key: 'yasai', word: 'ヤサイ' },
  { key: 'ninniku', word: 'ニンニク' },
  { key: 'abura', word: 'アブラ' },
  { key: 'karame', word: 'カラメ' },
];

const MOD_LV: Record<string, number> = {
  '': 2,
  'マシ': 3,
  'マシマシ': 4,
  'マシマシマシ': 5,
  'マシマシマシマシ': 6,
  'マシマシマシマシマシ': 7,
  'マシマシマシマシマシマシ': 8,
  'チョモランマ': 9,
  'スクナメ': 1,
};

export const DEFAULT_LV: ToppingLevels = { yasai: 2, ninniku: 0, abura: 0, karame: 1 };
export const EMPTY_BOWL: ToppingLevels = { yasai: 0, ninniku: 0, abura: 0, karame: 1 };
const ALL = (lv: number): ToppingLevels => ({ yasai: lv, ninniku: lv, abura: lv, karame: lv });

export const MODES: Record<GameMode, ModeConfig> = {
  easy: {
    name: '小ラーメン', lots: 8, base: 4.0, perKey: 0.45,
    count: [1, 3], mods: { '': 7, 'マシ': 2, 'スクナメ': 2 }, shuffle: false,
    specials: [{ display: 'そのままで', kana: 'ソノママデ', lv: {} }], specialRate: 0.12,
  },
  normal: {
    name: '大ラーメン', lots: 10, base: 2.2, perKey: 0.3,
    count: [2, 4], mods: { '': 4, 'マシ': 3, 'マシマシ': 2, 'マシマシマシ': 1, 'スクナメ': 1 }, shuffle: false,
    specials: [
      { display: '全マシ', kana: 'ゼンマシ', lv: ALL(3) },
      { display: '全マシマシ', kana: 'ゼンマシマシ', lv: ALL(4) },
    ], specialRate: 0.08,
  },
  hard: {
    name: '全マシマシ', lots: 12, base: 1.2, perKey: 0.2,
    count: [3, 4], mods: {
      '': 1, 'マシ': 1, 'マシマシ': 2,
      'マシマシマシ': 3, 'マシマシマシマシ': 3,
      'マシマシマシマシマシ': 2, 'マシマシマシマシマシマシ': 2,
      'チョモランマ': 2,
      'スクナメ': 1,
    }, shuffle: true,
    specials: [
      { display: '全マシ', kana: 'ゼンマシ', lv: ALL(3) },
      { display: '全マシマシ', kana: 'ゼンマシマシ', lv: ALL(4) },
      { display: '全マシマシマシ', kana: 'ゼンマシマシマシ', lv: ALL(5) },
      { display: '全マシマシマシマシ', kana: 'ゼンマシマシマシマシ', lv: ALL(6) },
      { display: '全マシマシマシマシマシ', kana: 'ゼンマシマシマシマシマシ', lv: ALL(7) },
      { display: '全マシマシマシマシマシマシ', kana: 'ゼンマシマシマシマシマシマシ', lv: ALL(8) },
      { display: 'ヤサイチョモランマ', kana: 'ヤサイチョモランマ', lv: { ...DEFAULT_LV, yasai: 9 } },
      { display: '全チョモランマ', kana: 'ゼンチョモランマ', lv: ALL(9) },
    ], specialRate: 0.14,
  },
  super: {
    name: '超ハード', lots: 8, base: 5.5, perKey: 0.32, super: true,
  },
};

export const QUESTIONS = ['ニンニク入れますか？', 'ニンニク入れますかぁ？', 'ニンニクは？', 'トッピングは？', 'ニンニク、入れますか？'];

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

function weighted(obj: Record<string, number>): string {
  const entries = Object.entries(obj);
  let t = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of entries) if ((t -= w) < 0) return k;
  return entries[0][0];
}

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCall(cfg: ModeConfig): Call {
  if (cfg.specials && Math.random() < (cfg.specialRate ?? 0)) {
    const sp = pick(cfg.specials);
    return { display: sp.display, kana: sp.kana, lv: { ...DEFAULT_LV, ...sp.lv } };
  }
  const [lo, hi] = cfg.count!;
  const n = randInt(lo, hi);
  const tops = shuffle(TOPPINGS.slice()).slice(0, n);
  if (!cfg.shuffle) {
    // 定番の順序: ヤサイ→ニンニク→アブラ→カラメ（たまにニンニク先頭）
    const order: ToppingKey[] = Math.random() < 0.3
      ? ['ninniku', 'yasai', 'abura', 'karame']
      : ['yasai', 'ninniku', 'abura', 'karame'];
    tops.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }
  const lv = { ...DEFAULT_LV };
  const words = tops.map((t) => {
    const mod = weighted(cfg.mods!);
    lv[t.key] = MOD_LV[mod];
    return t.word + mod;
  });
  return { display: words.join(' '), kana: words.join(''), lv };
}

// ---------- 超ハード：画像からコールを当てる ----------
// 画像で区別できる段階を出題
const SUPER_WEIGHTS: Record<ToppingKey, Record<string, number>> = {
  yasai: { 1: 1, 2: 3, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
  ninniku: { 0: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
  abura: { 0: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
  karame: { 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
};
const LV_MOD: Record<number, string> = {
  1: 'スクナメ', 2: '', 3: 'マシ', 4: 'マシマシ',
  5: 'マシマシマシ', 6: 'マシマシマシマシ',
  7: 'マシマシマシマシマシ', 8: 'マシマシマシマシマシマシ',
  9: 'チョモランマ',
};
const ZEN: Record<number, string> = {
  3: 'ゼンマシ', 4: 'ゼンマシマシ', 5: 'ゼンマシマシマシ', 6: 'ゼンマシマシマシマシ',
  7: 'ゼンマシマシマシマシマシ', 8: 'ゼンマシマシマシマシマシマシ', 9: 'ゼンチョモランマ',
};

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr.slice()];
  const out: T[][] = [];
  arr.forEach((x, i) => {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    permutations(rest).forEach((p) => out.push([x, ...p]));
  });
  return out;
}

/** 丼の状態から、正解となるコールをすべて列挙する */
export function answersFor(lv: ToppingLevels): { answers: string[]; canonical: string } {
  const required: string[] = [];
  let optional: string | null = null;
  for (const t of TOPPINGS) {
    const v = lv[t.key];
    if (v === DEFAULT_LV[t.key]) {
      if (t.key === 'yasai') optional = 'ヤサイ';
      continue;
    }
    required.push(t.word + LV_MOD[v]);
  }
  const set = new Set<string>();
  const sets = [required];
  if (optional) sets.push(required.concat(optional));
  sets.forEach((s) => {
    if (s.length) permutations(s).forEach((p) => set.add(p.join('')));
  });
  if (!required.length) set.add('ソノママデ');
  const vals = TOPPINGS.map((t) => lv[t.key]);
  if (vals.every((v) => v === vals[0]) && ZEN[vals[0]]) set.add(ZEN[vals[0]]);
  // ヤサイがチョモランマで他が普通の場合、「チョモランマ」だけでも正解
  if (lv.yasai === 9 && lv.ninniku === 0 && lv.abura === 0 && lv.karame === 1) {
    set.add('チョモランマ');
  }
  const canonical = required.length ? required.join(' ') : 'そのままで';
  return { answers: [...set], canonical };
}

function makeSuperCall(): Call {
  const lv = { ...DEFAULT_LV };
  for (const t of TOPPINGS) lv[t.key] = Number(weighted(SUPER_WEIGHTS[t.key]));
  const { answers, canonical } = answersFor(lv);
  return { display: canonical, kana: answers[0], answers, lv };
}

export function makeCalls(cfg: ModeConfig): Call[] {
  const list: Call[] = [];
  while (list.length < cfg.lots) {
    const c = cfg.super ? makeSuperCall() : makeCall(cfg);
    if (list.length && list[list.length - 1].kana === c.kana) continue;
    list.push(c);
  }
  return list;
}
