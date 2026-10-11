/* ローマ字入力判定エンジン
 * かな文字列に対して、複数のローマ字表記 (shi/si, tsu/tu, n/nn, ltu/kka など) を許容する。
 */
const Romaji = (() => {
  const base = {
    'あ': ['a'], 'い': ['i', 'yi'], 'う': ['u', 'wu', 'whu'], 'え': ['e'], 'お': ['o'],
    'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
    'さ': ['sa'], 'し': ['shi', 'si', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'を': ['wo'],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['di'], 'づ': ['du'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    'ゔ': ['vu'],
    'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'], 'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
    'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'], 'ゎ': ['xwa', 'lwa'],
    'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'],
    'ー': ['-'], '、': [','], '。': ['.'], '！': ['!'], '？': ['?'], '～': ['~'],
  };

  const combo = {};
  const yRow = {
    'き': ['ky'], 'ぎ': ['gy'], 'し': ['sh', 'sy'], 'じ': ['j', 'jy', 'zy'],
    'ち': ['ch', 'ty', 'cy'], 'ぢ': ['dy'], 'に': ['ny'], 'ひ': ['hy'],
    'び': ['by'], 'ぴ': ['py'], 'み': ['my'], 'り': ['ry'],
  };
  const ySmall = { 'ゃ': 'a', 'ゅ': 'u', 'ょ': 'o' };
  for (const [k, heads] of Object.entries(yRow)) {
    for (const [s, v] of Object.entries(ySmall)) combo[k + s] = heads.map(h => h + v);
  }
  Object.assign(combo, {
    'しぇ': ['she', 'sye'], 'ちぇ': ['che', 'tye', 'cye'], 'じぇ': ['je', 'jye', 'zye'],
    'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'],
    'てぃ': ['thi'], 'でぃ': ['dhi'], 'でゅ': ['dhu'], 'とぅ': ['twu'],
    'うぃ': ['wi'], 'うぇ': ['we'], 'うぉ': ['who'],
    'ゔぁ': ['va'], 'ゔぃ': ['vi'], 'ゔぇ': ['ve'], 'ゔぉ': ['vo'], 'つぁ': ['tsa'],
  });

  function toHira(str) {
    return str.replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  }

  // 位置 i から始まる入力候補 { r: ローマ字, n: 消費するかな文字数 }
  function cands(s, i) {
    const out = [];
    const c = s[i];
    const two = s.substr(i, 2);
    if (c === 'ん') {
      const next = i + 1 < s.length ? cands(s, i + 1) : null;
      const canSingle = next && next.length && next.every(x => !/^[aiueony]/.test(x.r));
      if (canSingle) out.push({ r: 'n', n: 1 });
      out.push({ r: 'nn', n: 1 }, { r: 'xn', n: 1 });
      return out;
    }
    if (c === 'っ') {
      const next = i + 1 < s.length ? cands(s, i + 1) : [];
      next.forEach(x => {
        if (/^[bcdfghjkmpqrstvwyz]/.test(x.r)) out.push({ r: x.r[0] + x.r, n: x.n + 1 });
      });
      base['っ'].forEach(r => out.push({ r, n: 1 }));
      return out;
    }
    if (combo[two]) combo[two].forEach(r => out.push({ r, n: 2 }));
    if (base[c]) base[c].forEach(r => out.push({ r, n: 1 }));
    else out.push({ r: c.toLowerCase(), n: 1 });
    return out;
  }

  class Typer {
    constructor(kana) {
      this.src = kana.replace(/\s/g, '');
      this.s = toHira(this.src);
      this.pos = 0;
      this.buf = '';
      this.typed = '';
    }
    get done() { return this.pos >= this.s.length; }

    // 1キー入力。正解なら true
    input(k) {
      if (this.done) return false;
      const cs = cands(this.s, this.pos);
      const nb = this.buf + k;
      const m = cs.filter(c => c.r.startsWith(nb));
      if (m.length) {
        this.buf = nb;
        this.typed += k;
        const exact = m.find(c => c.r === nb);
        if (exact && m.every(c => c.r === nb)) {
          this.pos += exact.n;
          this.buf = '';
        }
        return true;
      }
      // "n" 保留中に次の子音が来た場合などは確定してから再判定
      const ex = this.buf && cs.find(c => c.r === this.buf);
      if (ex) {
        this.pos += ex.n;
        this.buf = '';
        return this.input(k);
      }
      return false;
    }

    // 入力ガイド用の残りローマ字
    rest() {
      let out = '';
      let i = this.pos;
      if (i < this.s.length) {
        const m = cands(this.s, i).find(c => c.r.startsWith(this.buf));
        out += m.r.slice(this.buf.length);
        i += m.n;
      }
      while (i < this.s.length) {
        const c = cands(this.s, i)[0];
        out += c.r;
        i += c.n;
      }
      return out;
    }

    // 確定済みのかな文字数（表示用）
    get kanaDone() { return this.pos; }
  }

  function guideLength(kana) { return new Typer(kana).rest().length; }

  return { Typer, toHira, guideLength };
})();
