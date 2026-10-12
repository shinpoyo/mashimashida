/**
 * シードつき乱数（mulberry32）。同じシードなら、ブラウザでもサーバーでも同じ出題になる。
 * オンライン番付ではサーバーがシードを発行し、出題を再現して採点をやり直す。
 */
export type Rng = () => number;

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0〜2^32-1 のシードを作る */
export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}
