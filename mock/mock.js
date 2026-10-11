/* マシマシ打 統合モック
 * ロジック: mashimashityping/js/game.js のコール生成・判定・採点をそのまま移植
 * 見た目  : mashimashida のデザイン言語（ダーク×イエロー×ハードシャドウ）
 */
(() => {
  const $ = id => document.getElementById(id);

  // ---------- コール生成 ----------
  const TOPPINGS = [
    { key: 'yasai', word: 'ヤサイ' },
    { key: 'ninniku', word: 'ニンニク' },
    { key: 'abura', word: 'アブラ' },
    { key: 'karame', word: 'カラメ' },
  ];
  const MOD_LV = {
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
  const DEFAULT_LV = { yasai: 2, ninniku: 0, abura: 0, karame: 1 };
  const ALL = lv => ({ yasai: lv, ninniku: lv, abura: lv, karame: lv });

  const MODES = {
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

  const QUESTIONS = ['ニンニク入れますか？', 'ニンニク入れますかぁ？', 'ニンニクは？', 'トッピングは？', 'ニンニク、入れますか？'];

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function weighted(obj) {
    const entries = Object.entries(obj);
    let t = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of entries) if ((t -= w) < 0) return k;
    return entries[0][0];
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeCall(cfg) {
    if (Math.random() < cfg.specialRate) {
      const sp = pick(cfg.specials);
      return { display: sp.display, kana: sp.kana, lv: { ...DEFAULT_LV, ...sp.lv } };
    }
    const n = randInt(cfg.count[0], cfg.count[1]);
    let tops = shuffle(TOPPINGS.slice()).slice(0, n);
    if (!cfg.shuffle) {
      // 定番の順序: ヤサイ→ニンニク→アブラ→カラメ（たまにニンニク先頭）
      const order = Math.random() < 0.3 ? ['ninniku', 'yasai', 'abura', 'karame'] : ['yasai', 'ninniku', 'abura', 'karame'];
      tops.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    }
    const lv = { ...DEFAULT_LV };
    const words = tops.map(t => {
      const mod = weighted(cfg.mods);
      lv[t.key] = MOD_LV[mod];
      return t.word + mod;
    });
    return { display: words.join(' '), kana: words.join(''), lv };
  }

  function makeCalls(cfg) {
    const list = [];
    while (list.length < cfg.lots) {
      const c = cfg.super ? makeSuperCall() : makeCall(cfg);
      if (list.length && list[list.length - 1].kana === c.kana) continue;
      list.push(c);
    }
    return list;
  }

  // ---------- 超ハード：画像からコールを当てる ----------
  // 画像で区別できる段階を出題
  const SUPER_WEIGHTS = {
    yasai: { 1: 1, 2: 3, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
    ninniku: { 0: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
    abura: { 0: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
    karame: { 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
  };
  const LV_MOD = {
    1: 'スクナメ', 2: '', 3: 'マシ', 4: 'マシマシ',
    5: 'マシマシマシ', 6: 'マシマシマシマシ',
    7: 'マシマシマシマシマシ', 8: 'マシマシマシマシマシマシ',
    9: 'チョモランマ',
  };

  function permutations(arr) {
    if (arr.length <= 1) return [arr.slice()];
    const out = [];
    arr.forEach((x, i) => {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      permutations(rest).forEach(p => out.push([x, ...p]));
    });
    return out;
  }

  function answersFor(lv) {
    const required = [];
    let optional = null;
    for (const t of TOPPINGS) {
      const v = lv[t.key];
      if (v === DEFAULT_LV[t.key]) {
        if (t.key === 'yasai') optional = 'ヤサイ';
        continue;
      }
      required.push(t.word + LV_MOD[v]);
    }
    const set = new Set();
    const sets = [required];
    if (optional) sets.push(required.concat(optional));
    sets.forEach(s => { if (s.length) permutations(s).forEach(p => set.add(p.join(''))); });
    if (!required.length) set.add('ソノママデ');
    const vals = TOPPINGS.map(t => lv[t.key]);
    if (vals.every(v => v === 3)) set.add('ゼンマシ');
    if (vals.every(v => v === 4)) set.add('ゼンマシマシ');
    if (vals.every(v => v === 5)) set.add('ゼンマシマシマシ');
    if (vals.every(v => v === 6)) set.add('ゼンマシマシマシマシ');
    if (vals.every(v => v === 7)) set.add('ゼンマシマシマシマシマシ');
    if (vals.every(v => v === 8)) set.add('ゼンマシマシマシマシマシマシ');
    if (vals.every(v => v === 9)) set.add('ゼンチョモランマ');
    // ヤサイがチョモランマで他が普通の場合、「チョモランマ」だけでも正解
    if (lv.yasai === 9 && lv.ninniku === 0 && lv.abura === 0 && lv.karame === 1) {
      set.add('チョモランマ');
    }
    const canonical = required.length ? required.join(' ') : 'そのままで';
    return { answers: [...set], canonical };
  }

  function makeSuperCall() {
    const lv = {};
    for (const t of TOPPINGS) lv[t.key] = Number(weighted(SUPER_WEIGHTS[t.key]));
    const { answers, canonical } = answersFor(lv);
    return { display: canonical, kana: answers[0], answers, lv };
  }

  // 複数の正解候補を同時に追いかける入力判定
  class MultiTyper {
    constructor(answers) {
      this.live = answers.map(a => new Romaji.Typer(a));
      this.typed = '';
    }
    get done() { return this.live.some(t => t.done); }
    get head() { return this.live.find(t => t.done) || this.live[0]; }
    get src() { return this.head.src; }
    get kanaDone() { return this.head.kanaDone; }
    input(k) {
      const ok = this.live.filter(t => t.input(k));
      if (!ok.length) return false;
      this.live = ok;
      this.typed += k;
      return true;
    }
    rest() { return this.head.rest(); }
  }

  // =====================================================================
  // ここから下：mashimashida デザイン向けの UI バインディング（モック用）
  // =====================================================================

  // ---------- サウンド（mashimashityping と同一） ----------
  let actx = null;
  let muted = false;
  try { muted = localStorage.getItem('mashi_muted') === '1'; } catch (e) { /* ignore */ }
  function tone(freq, dur, type = 'square', vol = 0.05, delay = 0) {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime + delay;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) { /* ignore */ }
  }
  const sfx = {
    key: () => tone(1200, 0.03, 'square', 0.025),
    miss: () => tone(140, 0.12, 'sawtooth', 0.06),
    ok: () => { tone(880, 0.08, 'triangle', 0.08); tone(1320, 0.14, 'triangle', 0.08, 0.08); },
    fail: () => { tone(300, 0.2, 'sawtooth', 0.06); tone(200, 0.3, 'sawtooth', 0.06, 0.18); },
    count: () => tone(660, 0.08, 'triangle', 0.07),
    go: () => tone(990, 0.2, 'triangle', 0.08),
  };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function updateMute() { $('muteBtn').textContent = muted ? '🔇' : '🔊'; }
  $('muteBtn').addEventListener('click', e => {
    muted = !muted;
    store('mashi_muted', muted ? '1' : '0');
    updateMute();
    e.currentTarget.blur();
  });
  updateMute();

  // ---------- 画面遷移 ----------
  const NAV_TO_SCREEN = { ticket: 'scr-ticket', battle: 'scr-battle', board: 'scr-board', dojo: 'scr-soon', kitchen: 'scr-soon' };
  let state = 'title';
  let mode = 'easy';
  let cfg, calls, idx, typer, limit, lotStart, rafId, timers = [];
  let stats;

  function show(nav) {
    const id = NAV_TO_SCREEN[nav];
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.nav === nav));
    if (nav === 'dojo') $('soonTitle').textContent = 'コール道場（準備中）';
    if (nav === 'kitchen') $('soonTitle').textContent = 'マイ厨房（準備中）';
    window.scrollTo(0, 0);
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(rafId); }

  document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => {
    const nav = el.dataset.nav;
    el.blur && el.blur();
    if (nav === 'battle') return start(mode);
    if (nav === 'board') { clearTimers(); state = 'result'; renderBoard(); return show('board'); }
    if (nav === 'ticket') return toTitle();
    clearTimers(); state = 'soon'; show(nav);
  }));

  // ---------- 食券機 ----------
  const SPEC = {
    easy: { note: '初心者歓迎！定番の順番で落ち着いてコールせよ', k2: '長め', k3: '定番順', lv: { yasai: 3, ninniku: 2, abura: 0, karame: 1 } },
    normal: { note: 'ロットを乱すな！マシマシまで解禁だ', k2: '標準', k3: '定番順', lv: { yasai: 4, ninniku: 3, abura: 3, karame: 2 } },
    hard: { note: '順不同・チョモランマ襲来。迷えば即ロット乱し', k2: '激短', k3: '順不同', lv: { yasai: 9, ninniku: 6, abura: 6, karame: 4 } },
    super: { note: 'コールは表示されない。丼を見て当てろ', k2: '長め', k3: '順不同', lv: { yasai: 5, ninniku: 4, abura: 3, karame: 3 } },
  };
  function bestKey(m) { return 'mashi_best_' + m; }
  function renderBests() {
    document.querySelectorAll('[data-best]').forEach(el => {
      const b = store(bestKey(el.dataset.best));
      el.textContent = b ? `自己ベスト ${b}` : '';
    });
    const cups = Number(store('mashi_cups') || 0);
    $('cupCount').textContent = String(cups).padStart(3, '0');
  }
  function selectTicket(m) {
    mode = m;
    const c = MODES[m];
    document.querySelectorAll('.ticket').forEach(t => t.classList.toggle('on', t.dataset.mode === m));
    $('specName').textContent = c.name;
    $('specLots').textContent = `${c.lots}ロット`;
    $('specNote').textContent = SPEC[m].note;
    $('specK1').textContent = c.lots;
    $('specK2').textContent = SPEC[m].k2;
    $('specK3').textContent = SPEC[m].k3;
    $('specBowl').innerHTML = Bowl.render(SPEC[m].lv, 88);
  }
  document.querySelectorAll('.ticket').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.blur();
      if (mode === btn.dataset.mode) return start(mode); // 2回押しで即開始
      selectTicket(btn.dataset.mode);
      sfx.count();
    });
  });
  $('startBtn').addEventListener('click', e => { e.currentTarget.blur(); start(mode); });

  function toTitle() {
    clearTimers();
    state = 'title';
    renderBests();
    selectTicket(mode);
    show('ticket');
  }

  // ---------- 仮想キーボード ----------
  const VK_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm-'];
  $('vk').innerHTML = VK_ROWS.map(r => `<div class="vk-row">${[...r].map(k => `<div class="key" data-k="${k}">${k.toUpperCase()}</div>`).join('')}</div>`).join('');
  function markNextKey() {
    document.querySelectorAll('.key.next').forEach(k => k.classList.remove('next'));
    const nk = (state === 'play' && !cfg.super) ? typer.rest().slice(0, 1) : '';
    $('nextKey').textContent = nk ? nk.toUpperCase() : (cfg && cfg.super && state === 'play' ? '?' : '-');
    if (nk) {
      const el = document.querySelector(`.key[data-k="${nk}"]`);
      if (el) el.classList.add('next');
    }
  }
  function flashKey(k) {
    const el = document.querySelector(`.key[data-k="${k}"]`);
    if (!el) return;
    el.classList.add('hit');
    setTimeout(() => el.classList.remove('hit'), 90);
  }

  // ---------- ゲーム進行（mashimashityping のロジックを踏襲） ----------
  const EMPTY_BOWL = { yasai: 0, ninniku: 0, abura: 0, karame: 1 };

  function start(m) {
    clearTimers();
    mode = m;
    cfg = MODES[m];
    calls = makeCalls(cfg);
    idx = 0;
    stats = { score: 0, keys: 0, miss: 0, breaks: 0, typingMs: 0, fastest: Infinity, chain: 0 };
    $('bMode').textContent = cfg.name;
    updateHud();
    show('battle');
    $('callCard').classList.add('hidden');
    $('callCard').classList.toggle('super', !!cfg.super);
    $('bowlWrap').innerHTML = Bowl.render(EMPTY_BOWL);
    $('staffFace').innerHTML = Master.render('wait');
    $('staffBubble').textContent = '食券を拝見します';
    $('judge').textContent = '—';
    setAnger(0);
    state = 'countdown';
    markNextKey();
    const cd = $('countdown');
    let n = 3;
    const tick = () => {
      if (n > 0) {
        cd.textContent = n;
        cd.className = 'countdown font-dela show';
        sfx.count();
        n--;
        later(tick, 700);
      } else {
        cd.className = 'countdown font-dela';
        sfx.go();
        nextLot();
      }
    };
    tick();
  }

  function updateHud() {
    $('hudLot').textContent = `${Math.min(idx + 1, cfg.lots)}/${cfg.lots}`;
    $('hudScore').textContent = stats.score;
    $('hudMiss').textContent = stats.miss;
    $('hudChain').textContent = stats.chain;
    $('lotNo').textContent = `${String(Math.min(idx + 1, cfg.lots)).padStart(2, '0')} / ${String(cfg.lots).padStart(2, '0')}`;
    const half = Math.ceil(cfg.lots / 2);
    $('breakDots').textContent = Array.from({ length: half }, (_, i) => (i < stats.breaks ? '❌' : '⚪')).join('');
  }
  function setAnger(p) { $('angerBar').style.width = Math.min(100, p) + '%'; }

  function nextLot() {
    if (idx >= calls.length) return finish();
    const call = calls[idx];
    if (cfg.super) {
      typer = new MultiTyper(call.answers);
      limit = cfg.base + cfg.perKey * new Romaji.Typer(call.kana).rest().length;
      $('callLabel').textContent = 'この丼になるコールを答えよ';
      $('callHint').textContent = '順不同OK・全マシOK';
      $('callTarget').innerHTML = Bowl.render(call.lv, idx + 1);
      $('callRef').innerHTML = Bowl.render(DEFAULT_LV, 999);
      $('callDisplay').textContent = '';
    } else {
      typer = new Romaji.Typer(call.kana);
      limit = cfg.base + cfg.perKey * typer.rest().length;
      $('callLabel').textContent = 'あなたのコール';
      $('callHint').textContent = cfg.shuffle ? 'LEVEL: 順不同ジロリアン' : 'LEVEL: 定番コール';
      $('callDisplay').textContent = call.display;
    }
    $('staffBubble').textContent = pick(QUESTIONS);
    $('staffFace').innerHTML = Master.render('normal');
    $('staffBubble').classList.remove('pop');
    void $('staffBubble').offsetWidth;
    $('staffBubble').classList.add('pop');
    $('bowlWrap').innerHTML = Bowl.render(EMPTY_BOWL, idx + 1);
    $('callCard').classList.remove('hidden', 'ok', 'ng');
    renderCall();
    updateHud();
    lotStart = performance.now();
    state = 'play';
    markNextKey();
    loop();
  }

  function loop() {
    const el = (performance.now() - lotStart) / 1000;
    const ratio = Math.max(0, 1 - el / limit);
    const bar = $('timerBar');
    bar.style.width = (ratio * 100) + '%';
    bar.classList.toggle('warn', ratio < 0.35);
    setAnger((1 - ratio) * 65 + stats.breaks * 15);
    if (ratio <= 0) return timeout();
    rafId = requestAnimationFrame(loop);
  }

  function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function renderCall() {
    const k = typer.src;
    const d = typer.kanaDone;
    if (cfg.super) {
      $('callKana').innerHTML = `<span class="done-strong">${esc(k.slice(0, d))}</span>&nbsp;`;
      $('callRomaji').innerHTML = `<span class="done">${esc(typer.typed)}</span><span class="cur">&nbsp;</span>`;
      return;
    }
    const rest = typer.rest();
    $('callKana').innerHTML = `<span class="done">${esc(k.slice(0, d))}</span>${esc(k.slice(d))}`;
    $('callRomaji').innerHTML = `<span class="done">${esc(typer.typed)}</span><span class="cur">${esc(rest.slice(0, 1))}</span>${esc(rest.slice(1))}`;
  }

  function onKey(ch) {
    flashKey(ch);
    if (typer.input(ch)) {
      stats.keys++;
      sfx.key();
      renderCall();
      markNextKey();
      if (typer.done) success();
    } else {
      stats.miss++;
      sfx.miss();
      $('judge').textContent = 'MISS…店主の眉が動いた';
      const card = $('callCard');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      updateHud();
    }
  }

  function endLot() {
    cancelAnimationFrame(rafId);
    const ms = performance.now() - lotStart;
    stats.typingMs += ms;
    return ms;
  }

  function success() {
    const ms = endLot();
    state = 'serve';
    stats.fastest = Math.min(stats.fastest, ms);
    stats.chain++;
    const remain = Math.max(0, limit - ms / 1000);
    const gained = cfg.super
      ? typer.typed.length * 15 + Math.round(remain * 40)
      : typer.typed.length * 10 + Math.round(remain * 30);
    stats.score += gained;
    sfx.ok();
    const call = calls[idx];
    $('callCard').classList.add('ok');
    $('judge').textContent = remain / limit > 0.5 ? 'CRITICAL GANKO HIT!!' : 'GOOD CALL';
    if (cfg.super) $('callDisplay').textContent = `正解！ ${call.display}`;
    $('staffBubble').textContent = pick(['はい', 'はーい', 'あいよ', 'はい、どうぞ']) + `（+${gained}）`;
    $('staffFace').innerHTML = Master.render('success');
    const bw = $('bowlWrap');
    bw.innerHTML = Bowl.render(call.lv, idx + 1);
    bw.classList.remove('serve');
    void bw.offsetWidth;
    bw.classList.add('serve');
    idx++;
    updateHud();
    markNextKey();
    later(nextLot, cfg.super ? 1300 : 900);
  }

  function timeout() {
    endLot();
    state = 'serve';
    stats.breaks++;
    stats.chain = 0;
    sfx.fail();
    $('callCard').classList.add('ng');
    $('judge').textContent = 'ロット乱し！';
    $('staffBubble').textContent = 'ロットが乱れました…';
    $('staffFace').innerHTML = Master.render('stern');
    if (cfg.super) {
      $('callDisplay').textContent = `正解：${calls[idx].display}`;
      $('callRomaji').innerHTML = `<span class="missed">${esc(typer.typed) || '&nbsp;'}</span>`;
    } else {
      $('callRomaji').innerHTML = `<span class="done">${esc(typer.typed)}</span><span class="missed">${esc(typer.rest())}</span>`;
    }
    idx++;
    updateHud();
    markNextKey();
    later(nextLot, cfg.super ? 2200 : 1300);
  }

  // ---------- 結果（番付） ----------
  const RANKS = [
    [0, 'ロット乱し', '店主の視線が痛い…。まずは食券の買い方から。'],
    [1.5, '一見さん', 'コールの存在は知っている。まずは小ラーメンから。'],
    [2.5, 'ジロリアン見習い', 'コールに迷いがなくなってきた。'],
    [3.5, '常連', '店主に顔を覚えられ始めた。'],
    [5.0, 'ジロリアン', 'ロットの流れを完全に掌握している。'],
    [6.5, '二郎神', '全マシマシを一息で唱える伝説の存在。'],
  ];
  let lastResult = null;

  function finish() {
    clearTimers();
    state = 'result';
    const total = stats.keys + stats.miss;
    const acc = total ? stats.keys / total : 0;
    const kps = stats.typingMs ? stats.keys / (stats.typingMs / 1000) : 0;
    let eff = cfg.super
      ? kps * acc * acc * 1.6 - stats.breaks * 0.6
      : kps * acc * acc - stats.breaks * 0.4;
    if (stats.breaks >= cfg.lots / 2) eff = 0;
    let rank = RANKS[0];
    for (const r of RANKS) if (eff >= r[0]) rank = r;

    const prev = Number(store(bestKey(mode)) || 0);
    const isBest = stats.score > prev;
    if (isBest) store(bestKey(mode), stats.score);
    if (stats.breaks < cfg.lots / 2) store('mashi_cups', Number(store('mashi_cups') || 0) + 1);
    store(bestKey(mode) + '_rank', isBest ? rank[1] : (store(bestKey(mode) + '_rank') || rank[1]));

    $('resMode').textContent = `食券：${cfg.name}`;
    $('resRank').textContent = rank[1];
    $('resComment').textContent = rank[2];
    $('resScore').textContent = stats.score;
    $('resKps').textContent = kps.toFixed(2);
    $('resAcc').textContent = (acc * 100).toFixed(1) + '%';
    $('resMiss').textContent = stats.miss;
    $('resBreak').textContent = stats.breaks;
    $('resFast').textContent = isFinite(stats.fastest) ? (stats.fastest / 1000).toFixed(2) + '秒' : '-';
    $('resBest').style.display = isBest ? 'block' : 'none';
    $('resultCard').style.display = '';
    lastResult = { rank: rank[1], score: stats.score, acc, kps };
    renderBests();
    renderBoard();
    show('board');
  }

  function renderBoard() {
    if (!lastResult) $('resultCard').style.display = 'none';
    $('bestTable').innerHTML = Object.entries(MODES).map(([m, c]) => {
      const b = store(bestKey(m));
      const r = store(bestKey(m) + '_rank');
      return `<tr class="${m === mode && lastResult ? 'me' : ''}"><td class="font-dela">${c.name}</td><td class="mono">${b || '-'}</td><td>${r || '未挑戦'}</td></tr>`;
    }).join('');
  }

  function share() {
    if (!lastResult) return;
    const text = `マシマシ打【${cfg.name}】で「${lastResult.rank}」認定！\nスコア ${lastResult.score} / 正確率 ${(lastResult.acc * 100).toFixed(1)}% / ${lastResult.kps.toFixed(2)}打鍵/秒\n#マシマシ打`;
    const url = location.href.split('#')[0].split('?')[0];
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
  }

  // ---------- 入力 ----------
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Process' || e.isComposing) {
      if (state === 'play') $('imeWarn').classList.add('show');
      return;
    }
    $('imeWarn').classList.remove('show');

    if (e.key === 'Escape') { e.preventDefault(); toTitle(); return; }
    if (state === 'title') {
      const m = { '1': 'easy', '2': 'normal', '3': 'hard', '4': 'super' }[e.key];
      if (m) { selectTicket(m); sfx.count(); }
      if (e.key === 'Enter') { e.preventDefault(); start(mode); }
      return;
    }
    if (state === 'result') {
      if (e.key === ' ' && lastResult) { e.preventDefault(); start(mode); }
      return;
    }
    if (state === 'play' && e.key.length === 1) {
      e.preventDefault();
      if (e.key === ' ') return;
      onKey(e.key.toLowerCase());
    }
  });

  $('retryBtn').addEventListener('click', e => { e.currentTarget.blur(); start(mode); });
  $('backBtn').addEventListener('click', toTitle);
  $('shareBtn').addEventListener('click', share);
  $('quitBtn').addEventListener('click', e => { e.currentTarget.blur(); toTitle(); });

  $('brandFace').innerHTML = Master.render('normal');
  toTitle();
})();
