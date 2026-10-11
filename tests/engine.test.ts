import { describe, expect, test } from 'bun:test';
import { Typer, MultiTyper } from '../src/engine/romaji';
import { answersFor, makeCalls, MODES, DEFAULT_LV } from '../src/engine/calls';

const typeAll = (t: { input(k: string): boolean; done: boolean }, s: string) => [...s].every((k) => t.input(k)) && t.done;

describe('romaji Typer', () => {
  test.each([
    ['ニンニクマシ', 'ninnnikumashi'],
    ['ニンニクマシ', 'ninnnikumasi'],
    ['ニンニクマシ', 'nixnnikumashi'],
    ['チョモランマ', 'chomoranma'],
    ['チョモランマ', 'tyomoranma'],
    ['チョモランマ', 'cyomoranma'],
    ['ゼンマシ', 'zenmashi'],
    ['ゼンマシ', 'zennmasi'],
    ['ソノママデ', 'sonomamade'],
  ])('%s ← %s', (kana, input) => {
    expect(typeAll(new Typer(kana), input)).toBe(true);
  });

  test('IME と同じく ninniku は「にんいく」扱いで不正解', () => {
    expect(typeAll(new Typer('ニンニク'), 'ninniku')).toBe(false);
  });

  test('誤入力は false を返し進まない', () => {
    const t = new Typer('ヤサイ');
    expect(t.input('q')).toBe(false);
    expect(t.typed).toBe('');
    expect(typeAll(t, 'yasai')).toBe(true);
  });

  test('ガイド表示用の残りローマ字', () => {
    expect(new Typer('ヤサイマシ').rest()).toBe('yasaimashi');
  });
});

describe('超ハードの正解判定', () => {
  test('順不同・ヤサイ省略・全マシを正解にする', () => {
    const lv = { yasai: 3, ninniku: 3, abura: 3, karame: 3 };
    const { answers } = answersFor(lv);
    expect(answers).toContain('ゼンマシ');
    expect(answers).toContain('カラメマシヤサイマシニンニクマシアブラマシ');
    expect(typeAll(new MultiTyper(answers), 'zenmasi')).toBe(true);
  });

  test('そのままの丼は「そのままで」', () => {
    const { answers } = answersFor(DEFAULT_LV);
    expect(answers).toContain('ソノママデ');
  });
});

describe('コール生成', () => {
  test.each(Object.keys(MODES))('%s: ロット数ぶん生成され、すべて打鍵可能', (m) => {
    const cfg = MODES[m as keyof typeof MODES];
    const calls = makeCalls(cfg);
    expect(calls.length).toBe(cfg.lots);
    for (const c of calls) {
      const t = new Typer(c.kana);
      expect(typeAll(t, t.rest())).toBe(true);
    }
  });
});
