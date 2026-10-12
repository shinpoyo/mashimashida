/**
 * 番付に載せる名前のチェック。完全ではないので、問題のある名前は管理用 API で非表示にする。
 * 比較は「全角半角・大文字小文字・カタカナひらがな・記号や空白」の違いをならしてから行う。
 */
const NG = [
  // 日本語（ひらがなに直した形で書く）
  'ちんこ', 'ちんぽ', 'まんこ', 'おまんこ', 'せっくす', 'ふぁっく', 'れいぷ', 'おなにー', 'ぱいずり', 'えろ',
  'しね', 'ころす', 'ころしてやる', 'きちがい', 'きもい', 'がいじ', 'ちょうせんじん',
  '死ね', '氏ね', '殺す', '殺害', '障害者', '池沼', '基地外', '在日', '売春', '強姦', '性器',
  // 英語
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'penis', 'vagina', 'porn', 'sex', 'rape', 'nigger', 'nigga',
  'faggot', 'retard', 'kys', 'killyourself', 'hitler', 'nazi',
  // 宣伝・誘導
  'http', 'www', '.com', '.net', '.jp', 'discord', 'line.me',
];

export function normalizeForCheck(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s_\-・･。、,.!！?？'"`~〜ー]/g, (c) => (c === '.' ? '.' : ''));
}

export function hasNgWord(name: string): boolean {
  const n = normalizeForCheck(name);
  const compact = n.replace(/\./g, '');
  return NG.some((w) => {
    const nw = normalizeForCheck(w);
    return n.includes(nw) || compact.includes(nw.replace(/\./g, ''));
  });
}

/** 表示用に整える（制御文字を除き、空白をまとめ、16文字まで） */
export function cleanName(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const s = raw
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return [...s].slice(0, 16).join('') || fallback;
}
