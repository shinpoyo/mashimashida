import { describe, expect, test } from 'bun:test';
import { MODES, makeCalls, type Call } from '../src/engine/calls';
import { makeRng } from '../src/engine/rng';
import { Typer } from '../src/engine/romaji';
import { replayGame, lotLimitMs, ReplayError, type LotLog } from '../src/engine/replay';
import { lotScore } from '../src/engine/scoring';
import { PENALTY_BY_ID } from '../src/data/shop';
import { implausible, periodKeys } from '../worker/src/index';
import { hasNgWord, cleanName } from '../worker/src/ngwords';

/** お手本どおりに打つ記録を作る（gap ミリ秒ごと、最初の1打は first ミリ秒） */
function perfectLot(call: Call, gap = 150, first = 400): LotLog {
  const guide = new Typer(call.kana).rest();
  const t = [...guide].map((_, i) => first + i * gap);
  return { k: guide, t };
}

describe('出題の再現（シード）', () => {
  test('同じシードなら同じ出題', () => {
    for (const mode of ['easy', 'normal', 'hard'] as const) {
      const a = makeCalls(MODES[mode], makeRng(12345)).map((c) => c.kana);
      const b = makeCalls(MODES[mode], makeRng(12345)).map((c) => c.kana);
      expect(a).toEqual(b);
      expect(a.length).toBe(MODES[mode].lots);
    }
  });
  test('シードが違えば出題も変わる', () => {
    const a = makeCalls(MODES.hard, makeRng(1)).map((c) => c.kana).join();
    const b = makeCalls(MODES.hard, makeRng(2)).map((c) => c.kana).join();
    expect(a).not.toBe(b);
  });
});

describe('記録からの採点（replayGame）', () => {
  const cfg = MODES.normal;
  const calls = makeCalls(cfg, makeRng(777));

  test('全ロットを打ち切ると完走・点数は手計算と一致', () => {
    const lots = calls.map((c) => perfectLot(c));
    const r = replayGame(cfg, PENALTY_BY_ID.none, calls, lots);
    expect(r.complete).toBe(true);
    expect(r.served).toBe(cfg.lots);
    expect(r.miss).toBe(0);
    let expected = 0;
    calls.forEach((c, i) => {
      const done = lots[i].t[lots[i].t.length - 1];
      const remain = Math.max(0, (lotLimitMs(cfg, c) - done) / 1000);
      expected += Math.round(lotScore(cfg, lots[i].k.length, remain) * 1.0);
    });
    expect(r.score).toBe(expected);
  });

  test('ペナルティの倍率がかかる', () => {
    const lots = calls.map((c) => perfectLot(c));
    const base = replayGame(cfg, PENALTY_BY_ID.none, calls, lots).score;
    const oni = replayGame(cfg, PENALTY_BY_ID.oni, calls, lots).score;
    expect(oni).toBeGreaterThan(base);
  });

  test('打ち切れないロットは時間切れ（ロット乱し）', () => {
    const lots = calls.map((c) => perfectLot(c));
    lots[2] = { k: lots[2].k.slice(0, 2), t: lots[2].t.slice(0, 2) };
    const r = replayGame(cfg, PENALTY_BY_ID.none, calls, lots);
    expect(r.breaks).toBe(1);
    expect(r.complete).toBe(true);
    expect(r.served).toBe(cfg.lots - 1);
  });

  test('一発退店：乱し1回でそこまで', () => {
    const lots = calls.slice(0, 3).map((c) => perfectLot(c));
    lots[2] = { k: '', t: [] };
    const r = replayGame(cfg, PENALTY_BY_ID.break1, calls, lots);
    expect(r.expelled).toBe('breaks');
    expect(r.complete).toBe(false);
  });

  test('鬼店主：ミス5回で退店', () => {
    const lot = perfectLot(calls[0]);
    const k = 'qqqqq';
    const r = replayGame(cfg, PENALTY_BY_ID.oni, calls, [{ k, t: [400, 500, 600, 700, 800] }]);
    expect(r.expelled).toBe('misses');
    expect(r.miss).toBe(5);
    expect(lot.k.length).toBeGreaterThan(0);
  });

  test('持ち時間を過ぎた打鍵・逆戻りする時刻・退店後の続きは不正', () => {
    const limit = lotLimitMs(cfg, calls[0]);
    expect(() => replayGame(cfg, PENALTY_BY_ID.none, calls, [{ k: 'y', t: [limit] }], { gaveUp: true })).toThrow(ReplayError);
    expect(() => replayGame(cfg, PENALTY_BY_ID.none, calls, [{ k: 'ab', t: [500, 400] }], { gaveUp: true })).toThrow(ReplayError);
    const lots = calls.map((c) => perfectLot(c));
    lots[0] = { k: '', t: [] };
    expect(() => replayGame(cfg, PENALTY_BY_ID.break1, calls, lots)).toThrow(ReplayError);
  });

  test('ロット数が足りない記録は完走扱いにしない', () => {
    const lots = calls.slice(0, 4).map((c) => perfectLot(c));
    expect(() => replayGame(cfg, PENALTY_BY_ID.none, calls, lots)).toThrow(ReplayError);
  });
});

describe('サーバーの検査', () => {
  const cfg = MODES.normal;
  const calls = makeCalls(cfg, makeRng(99));

  test('人並みの速さなら通る', () => {
    const lots = calls.map((c) => perfectLot(c, 140, 450));
    const r = replayGame(cfg, PENALTY_BY_ID.none, calls, lots);
    expect(implausible(lots, r.keys, r.typingMs, r.typingMs + 15000)).toBeNull();
  });
  test('速すぎる・間隔が機械的・反応が早すぎる・実時間が足りない', () => {
    const fast = calls.map((c) => perfectLot(c, 20, 400));
    const r1 = replayGame(cfg, PENALTY_BY_ID.none, calls, fast);
    expect(implausible(fast, r1.keys, r1.typingMs, 999999)).not.toBeNull();
    const instant = calls.map((c) => perfectLot(c, 140, 10));
    const r2 = replayGame(cfg, PENALTY_BY_ID.none, calls, instant);
    expect(implausible(instant, r2.keys, r2.typingMs, 999999)).toBe('reaction');
    const ok = calls.map((c) => perfectLot(c, 140, 450));
    const r3 = replayGame(cfg, PENALTY_BY_ID.none, calls, ok);
    expect(implausible(ok, r3.keys, r3.typingMs, 3000)).toBe('wall');
  });
  test('日本時間の区切り（週は月曜はじまり）', () => {
    // 2026-10-11 (日) 15:30 UTC = 2026-10-12 (月) 00:30 JST
    expect(periodKeys(Date.UTC(2026, 9, 11, 15, 30))).toEqual({ day: '2026-10-12', week: '2026-10-12', month: '2026-10' });
    // 2026-10-11 (日) 14:00 UTC = 2026-10-11 (日) 23:00 JST → 週は 10/5 (月)
    expect(periodKeys(Date.UTC(2026, 9, 11, 14, 0))).toEqual({ day: '2026-10-11', week: '2026-10-05', month: '2026-10' });
  });
  test('名前のチェック', () => {
    expect(hasNgWord('名無しの常連客')).toBe(false);
    expect(hasNgWord('ヤサイマシマシ')).toBe(false);
    expect(hasNgWord('ｓｈｉｔ')).toBe(true);
    expect(hasNgWord('死 ね')).toBe(true);
    expect(hasNgWord('see www.example.com')).toBe(true);
    expect(cleanName('  a\u0000b   c  ', 'x')).toBe('ab c');
    expect(cleanName('', 'x')).toBe('x');
    expect([...cleanName('あ'.repeat(30), 'x')].length).toBe(16);
  });
});
