import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import confetti from 'canvas-confetti';
import { GameResult, GameSettings } from '../types/game';
import { TICKET_CONFIGS, PENALTY_BY_ID } from '../data/shop';
import { MODES, makeCalls, pick, QUESTIONS, DEFAULT_LV, type Call } from '../engine/calls';
import { Typer, MultiTyper, type CallTyper } from '../engine/romaji';
import { lotScore, judgeRank } from '../engine/scoring';
import { soundManager } from '../utils/audio';
import { VirtualKeyboard } from './VirtualKeyboard';
import { BowlView, ChefPhoto, RamenPhoto, type ChefMood } from './JiroArt';
import { RuleIntro } from './RuleIntro';

interface TypingBattleProps {
  settings: GameSettings;
  /** 結果を記録し、自己ベスト更新なら true を返す */
  onRecord: (result: GameResult) => boolean;
  onShowBoard: () => void;
  onQuit: () => void;
}

type Phase = 'intro' | 'countdown' | 'play' | 'serve' | 'over';

interface GameState {
  calls: Call[];
  idx: number;
  typer: CallTyper | null;
  limit: number;
  lotStart: number;
  keys: number;
  miss: number;
  breaks: number;
  typingMs: number;
  fastest: number;
  chain: number;
  maxChain: number;
  score: number;
  served: number;
  startedAt: number;
}

const VERDICTS = ['CRITICAL GANKO HIT!!', 'MASHIMASHI PERFECT!!', 'SPEED CALL MASTER!!', 'ロット完全維持!!'];

export const TypingBattle: React.FC<TypingBattleProps> = ({ settings, onRecord, onShowBoard, onQuit }) => {
  const cfg = MODES[settings.mode];
  const ticket = TICKET_CONFIGS[settings.mode];
  const rule = PENALTY_BY_ID[settings.penalty];
  const scoreMult = rule.scoreRate;

  const newState = (): GameState => ({
    calls: makeCalls(cfg),
    idx: 0,
    typer: null,
    limit: 0,
    lotStart: 0,
    keys: 0,
    miss: 0,
    breaks: 0,
    typingMs: 0,
    fastest: Infinity,
    chain: 0,
    maxChain: 0,
    score: 0,
    served: 0,
    startedAt: performance.now(),
  });

  const g = useRef<GameState>(newState());
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [countdown, setCountdown] = useState<number>(3);
  const [paused, setPaused] = useState<boolean>(false);
  const [mood, setMood] = useState<ChefMood>('wait');
  const [bubble, setBubble] = useState<string>('食券を拝見します');
  const [bubbleKey, setBubbleKey] = useState<number>(0);
  /** 提供カウンターの丼の状態 */
  const [counter, setCounter] = useState<'cooking' | 'served' | 'ng'>('cooking');
  const [serveKey, setServeKey] = useState<number>(0);
  const [cardState, setCardState] = useState<'' | 'ok' | 'ng'>('');
  const [revealed, setRevealed] = useState<string>('');
  const [verdict, setVerdict] = useState<string>('—');
  const [shake, setShake] = useState<boolean>(false);
  const [imeWarn, setImeWarn] = useState<boolean>(false);
  const [result, setResult] = useState<GameResult | null>(null);

  const phaseRef = useRef<Phase>('intro');
  const pausedRef = useRef<boolean>(false);
  const pausedAt = useRef<number>(0);
  const nextTickAt = useRef<number>(0);
  const timers = useRef<number[]>([]);
  const rafId = useRef<number>(0);
  const timerBar = useRef<HTMLDivElement>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimationFrame(rafId.current);
  };
  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const say = (text: string, m: ChefMood) => {
    setBubble(text);
    setMood(m);
    setBubbleKey((k) => k + 1);
  };

  // ---------- 進行 ----------
  const finish = useCallback(
    (opts: { expelled?: 'breaks' | 'misses'; gaveUp?: boolean } = {}) => {
      clearTimers();
      const s = g.current;
      const { acc, kps, rank, comment } = judgeRank(cfg, { keys: s.keys, miss: s.miss, breaks: s.breaks, typingMs: s.typingMs });
      const res: GameResult = {
        mode: settings.mode,
        penalty: settings.penalty,
        score: s.score,
        kps,
        wpm: Math.round((kps * 60) / 5),
        accuracy: Math.round(acc * 1000) / 10,
        keys: s.keys,
        misses: s.miss,
        breaks: s.breaks,
        fastestMs: isFinite(s.fastest) ? Math.round(s.fastest) : null,
        maxChain: s.maxChain,
        lotsServed: s.served,
        lots: cfg.lots,
        rank: opts.expelled || opts.gaveUp ? '強制退店' : rank,
        rankComment: opts.expelled === 'misses'
          ? '「打ち間違いだらけの客に喰わせる麺はねえ！」'
          : opts.expelled
          ? '「ロットを乱した客に喰わせる麺はねえ！」'
          : opts.gaveUp
            ? '箸を置いて店を出た…'
            : comment,
        expelled: !!opts.expelled,
        gaveUp: !!opts.gaveUp,
        isBest: false,
        durationSec: Math.round((performance.now() - s.startedAt) / 100) / 10,
      };
      res.isBest = onRecord(res);
      setResult(res);
      setPhaseBoth('over');
      if (opts.expelled || opts.gaveUp) {
        say('二度と来るな！', 'stern');
        soundManager.expelled();
      } else {
        say('ありがとうございましたー', 'success');
        soundManager.victory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#ffe100', '#c0282d', '#ffffff'] });
      }
    },
    [cfg, settings, onRecord],
  );

  const loop = () => {
    const s = g.current;
    const el = (performance.now() - s.lotStart) / 1000;
    const ratio = Math.max(0, 1 - el / s.limit);
    if (timerBar.current) {
      timerBar.current.style.width = `${ratio * 100}%`;
      timerBar.current.style.background = ratio < 0.35 ? '#ff5555' : '#ffe100';
    }
    if (ratio <= 0) return timeout();
    // 残り時間わずか：拍子木で急かす（終盤ほど速く）
    const now = performance.now();
    if (ratio < 0.35 && now >= nextTickAt.current) {
      soundManager.tick();
      nextTickAt.current = now + (ratio < 0.15 ? 250 : 500);
    }
    rafId.current = requestAnimationFrame(loop);
  };

  const nextLot = () => {
    const s = g.current;
    if (s.idx >= s.calls.length) return finish();
    const call = s.calls[s.idx];
    if (cfg.super) {
      s.typer = new MultiTyper(call.answers!);
      s.limit = cfg.base + cfg.perKey * new Typer(call.kana).rest().length;
    } else {
      s.typer = new Typer(call.kana);
      s.limit = cfg.base + cfg.perKey * s.typer.rest().length;
    }
    say(pick(QUESTIONS), 'normal');
    setCounter('cooking');
    setCardState('');
    setRevealed('');
    s.lotStart = performance.now();
    setPhaseBoth('play');
    rerender();
    loop();
  };

  const endLot = () => {
    cancelAnimationFrame(rafId.current);
    const ms = performance.now() - g.current.lotStart;
    g.current.typingMs += ms;
    return ms;
  };

  const success = () => {
    const s = g.current;
    const ms = endLot();
    setPhaseBoth('serve');
    s.fastest = Math.min(s.fastest, ms);
    s.chain++;
    s.maxChain = Math.max(s.maxChain, s.chain);
    s.served++;
    const remain = Math.max(0, s.limit - ms / 1000);
    const gained = Math.round(lotScore(cfg, s.typer!.typed.length, remain) * scoreMult);
    s.score += gained;
    soundManager.serve(remain / s.limit > 0.5);
    const call = s.calls[s.idx];
    setCardState('ok');
    if (cfg.super) setRevealed(`正解！ ${call.display}`);
    setVerdict(remain / s.limit > 0.5 ? pick(VERDICTS) : 'GOOD CALL');
    say(`${pick(['はい', 'はーい', 'あいよ', 'はい、どうぞ'])}（+${gained}）`, 'success');
    setCounter('served');
    setServeKey((k) => k + 1);
    s.idx++;
    rerender();
    later(nextLot, cfg.super ? 1300 : 900);
  };

  const timeout = () => {
    const s = g.current;
    endLot();
    setPhaseBoth('serve');
    soundManager.lotBreak();
    setCardState('ng');
    const call = s.calls[s.idx];
    if (cfg.super) setRevealed(`正解：${call.display}`);
    s.breaks++;
    s.chain = 0;
    setVerdict('ロット乱し！');
    setCounter('ng');
    say('ロットが乱れました…', 'stern');
    s.idx++;
    rerender();
    if (rule.maxBreaks !== null && s.breaks >= rule.maxBreaks) {
      later(() => finish({ expelled: 'breaks' }), 1000);
      return;
    }
    later(nextLot, cfg.super ? 2200 : 1300);
  };

  const onKey = (ch: string) => {
    const s = g.current;
    if (!s.typer) return;
    if (s.typer.input(ch)) {
      s.keys++;
      soundManager.keyStroke();
      if (s.typer.done) success();
      else rerender();
      return;
    }
    // ミスタイプ
    setShake(true);
    window.setTimeout(() => setShake(false), 250);
    s.miss++;
    soundManager.mistake();
    setVerdict('MISS…店主の眉が動いた');
    rerender();
    if (rule.maxMisses !== null && s.miss >= rule.maxMisses) {
      endLot();
      finish({ expelled: 'misses' });
    }
  };

  const start = () => {
    clearTimers();
    g.current = newState();
    setResult(null);
    setPaused(false);
    pausedRef.current = false;
    setCounter('cooking');
    setCardState('');
    setRevealed('');
    setVerdict('—');
    say('食券を拝見します', 'wait');
    setPhaseBoth('countdown');
    if (timerBar.current) timerBar.current.style.width = '100%';
    let n = 3;
    const tick = () => {
      if (n > 0) {
        setCountdown(n);
        soundManager.countdown();
        n--;
        later(tick, 700);
      } else {
        setCountdown(0);
        soundManager.go();
        nextLot();
      }
    };
    tick();
  };

  const togglePause = () => {
    if (phaseRef.current !== 'play') return;
    if (!pausedRef.current) {
      cancelAnimationFrame(rafId.current);
      pausedAt.current = performance.now();
      pausedRef.current = true;
      setPaused(true);
      soundManager.pause();
    } else {
      g.current.lotStart += performance.now() - pausedAt.current;
      pausedRef.current = false;
      setPaused(false);
      loop();
    }
  };

  const giveUp = () => {
    if (phaseRef.current === 'over') return;
    if (phaseRef.current === 'play') endLot();
    pausedRef.current = false;
    setPaused(false);
    finish({ gaveUp: true });
  };

  // 画面を開いたらまずルール説明（intro）。開始ボタンで start()
  useEffect(() => clearTimers, []);

  // ---------- 入力 ----------
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Process' || e.isComposing) {
      if (phaseRef.current === 'play') setImeWarn(true);
      return;
    }
    setImeWarn(false);
    const p = phaseRef.current;
    if (p === 'intro') return; // RuleIntro 側で Enter / Space / Esc を受ける
    if (p === 'over') {
      if (e.key === ' ') {
        e.preventDefault();
        start();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onShowBoard();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onQuit();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (p === 'play') togglePause();
      return;
    }
    if (pausedRef.current) return;
    if (p === 'play' && e.key.length === 1) {
      e.preventDefault();
      if (e.key === ' ') return;
      onKey(e.key.toLowerCase());
    }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ---------- 表示 ----------
  const s = g.current;
  const typer = s.typer;
  // serve 中は直前のロットを表示し続ける
  const shownIdx = Math.min(phase === 'serve' || phase === 'over' ? s.idx - 1 : s.idx, s.calls.length - 1);
  const lotNo = Math.max(1, shownIdx + 1);
  const shownCall = shownIdx >= 0 ? s.calls[shownIdx] : undefined;
  const showCall = phase !== 'countdown' && typer;
  const rest = typer && !cfg.super ? typer.rest() : '';
  const kanaSrc = typer ? typer.src : '';
  const kanaDone = typer ? typer.kanaDone : 0;
  const nextKey = phase === 'play' && !cfg.super ? rest.slice(0, 1) : '';
  const breaksLimit = rule.maxBreaks;

  if (phase === 'intro') {
    const steps = cfg.super
      ? [
          <>店主の「ニンニク入れますか？」の後、<b className="text-[#ffe100]">完成した丼の画像</b>が出ます。</>,
          <>その丼になるコールをローマ字で打ちます。トッピングの順番は自由、全部同じ量なら「全マシ」でも正解。ヤサイ普通は省略できます。</>,
          <>右の小さな丼（そのまま）と見比べて量を判断。打ち切ると丼が提供され、早いほど高得点です。</>,
          <>持ち時間を過ぎると<b className="text-[#ff5555]">ロット乱し</b>。正解が表示されて次のロットへ進みます。</>,
        ]
      : [
          <>店主の「ニンニク入れますか？」の後、<b className="text-[#ffe100]">あなたのコール</b>が表示されます。</>,
          <>表示どおりにローマ字で打ちます。次に押すキーは黄色で光ります。</>,
          <>打ち切ると丼が提供されます。残り時間が多いほど高得点です。</>,
          <>持ち時間（黄色のバー）を過ぎると<b className="text-[#ff5555]">ロット乱し</b>。ミスタイプは正確率と称号に響きます。</>,
        ];
    return (
      <div className="p-4 sm:p-5">
      <RuleIntro
        eyebrow="タイピング修行"
        title={ticket.name}
        chefLine={ticket.chefNote}
        steps={steps}
        rows={[
          { label: 'ロット数', value: `${cfg.lots}杯`, note: '全ロット提供で完飲完食' },
          {
            label: 'コール',
            value: cfg.super ? '画像から答える' : cfg.shuffle ? '順不同で出題' : '定番の順番',
            note: cfg.super ? '順不同・全マシOK' : cfg.shuffle ? 'マシ×6・チョモランマも出る' : 'ヤサイ→ニンニク→アブラ→カラメ',
          },
          {
            label: '退店ペナルティ',
            value: `${rule.name}（スコア×${rule.scoreRate.toFixed(1)}）`,
            note: rule.desc,
            tone: rule.maxBreaks !== null ? 'warn' : 'normal',
          },
          { label: '操作', value: 'Esc：一時休戦', note: '結果画面：Space もう一杯 / Enter 番付へ' },
        ]}
        startLabel="修行開始"
        backLabel="食券を選び直す"
        onStart={start}
        onBack={onQuit}
      />
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col gap-3 p-3 sm:p-4 ${shake ? 'animate-jiro-shake' : ''}`}>
      {/* 上段：状況を1行に集約 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold">
        <span className={`px-2 py-0.5 rounded font-dela ${ticket.tone === 'red' || ticket.tone === 'black' ? 'bg-[#970015] text-[#ffdad7]' : 'bg-[#ffe100] text-[#0e0e0e]'}`}>
          {ticket.name}
        </span>
        <span className="text-[#cec6aa]">
          ロット <b id="hudLot" className="font-mono-code text-base text-[#ffe100]">{lotNo}/{cfg.lots}</b>
        </span>
        <span className="text-[#cec6aa]">
          スコア <b id="hudScore" className="font-mono-code text-base text-[#ffffff]">{s.score}</b>
          <span className="font-mono-code text-[10px] ml-0.5">×{scoreMult.toFixed(1)}</span>
        </span>
        <span className="text-[#cec6aa]">
          ミス <b id="hudMiss" className="font-mono-code text-base text-[#ffb3ae]">{s.miss}{rule.maxMisses !== null ? `/${rule.maxMisses}` : ''}</b>
        </span>
        <span className="text-[#cec6aa]">
          乱し{' '}
          <b className={`font-mono-code text-base ${breaksLimit !== null && s.breaks >= breaksLimit - 1 ? 'text-[#ff5555]' : 'text-[#ffb3ae]'}`}>
            {s.breaks}
            {breaksLimit !== null ? `/${breaksLimit}` : ''}
          </b>
        </span>
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={togglePause}
            className="px-2.5 py-1 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] rounded font-dela text-[11px] cursor-pointer"
          >
            一時休戦 Esc
          </button>
          <button
            type="button"
            onClick={giveUp}
            className="px-2.5 py-1 bg-[#970015] hover:bg-[#c0282d] text-[#ffdad7] rounded font-dela text-[11px] cursor-pointer"
          >
            ギブアップ
          </button>
        </span>
      </div>

      {/* 店内：店主・吹き出し・提供カウンター（超ハードは出題の丼） */}
      <div className="flex items-center gap-3 bg-[#1c1b1b] border-2 border-[#353534] rounded-xl px-3 py-2">
        <ChefPhoto mood={mood} className="w-14 h-14 rounded-full" ringClass="ring-2" />
        <div
          key={bubbleKey}
          id="staffBubble"
          className="animate-pop flex-1 min-w-0 bg-[#201f1f] text-[#e5e2e1] px-3 py-2 rounded-lg border border-[#353534] text-sm sm:text-base font-black truncate"
        >
          {bubble}
        </div>
        {cfg.super && shownCall ? (
          <div className="flex items-end gap-2 shrink-0">
            <div className="w-40 sm:w-48 rounded-lg border-2 border-[#353534] bg-[radial-gradient(ellipse_at_50%_70%,#3a2a1c,#120e0b)]">
              <BowlView lv={shownCall.lv} seed={shownIdx + 1} />
            </div>
            <div className="w-14 text-center opacity-80">
              <BowlView lv={DEFAULT_LV} seed={999} />
              <span className="text-[9px] text-[#cec6aa] font-bold leading-none">基準</span>
            </div>
          </div>
        ) : (
          <div className="relative w-16 h-16 shrink-0" title={`提供 ${s.served}/${cfg.lots}杯`}>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" stroke="#353534" strokeWidth="7" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="#ffe100"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="289"
                strokeDashoffset={289 - (289 * s.served) / cfg.lots}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <div
              key={serveKey}
              className={`absolute inset-1.5 rounded-full overflow-hidden border ${counter === 'ng' ? 'border-[#970015]' : 'border-[#ffe100]'} ${counter === 'served' ? 'animate-serve' : ''}`}
            >
              <RamenPhoto
                className={`w-full h-full transition-all duration-300 ${counter === 'cooking' ? 'brightness-50 saturate-50' : counter === 'ng' ? 'grayscale brightness-75' : ''}`}
                position="49% 60%"
              />
            </div>
          </div>
        )}
      </div>

      {/* 主役：コールと入力 */}
      <div
        id="callCard"
        className={`bg-[#0e0e0e] border-4 rounded-2xl px-4 py-5 text-center transition-colors ${
          cardState === 'ok' ? 'border-[#ffe100]' : cardState === 'ng' ? 'border-[#970015]' : 'border-[#353534]'
        } ${showCall ? '' : 'invisible'}`}
      >
        <div className="text-[11px] font-dela text-[#cec6aa]">{cfg.super ? 'この丼になるコールを答えよ（順不同・全マシOK）' : 'あなたのコール'}</div>
        <h1
          id="callDisplay"
          className={`font-dela text-[#ffe100] tracking-wider leading-tight drop-shadow-[2px_3px_0_#000000] break-all mt-1 ${
            cfg.super ? 'text-xl sm:text-2xl min-h-[1.3em]' : 'text-3xl sm:text-4xl min-h-[1.2em]'
          }`}
        >
          {cfg.super ? revealed : shownCall?.display}
        </h1>
        <p className="font-bold text-sm sm:text-base text-[#cec6aa] mt-1 tracking-widest min-h-[1.5em]">
          {cfg.super ? (
            <span className="text-[#ffe100]">{kanaSrc.slice(0, kanaDone)}</span>
          ) : (
            <>
              <span className="text-[#4c4732]">{kanaSrc.slice(0, kanaDone)}</span>
              {kanaSrc.slice(kanaDone)}
            </>
          )}
        </p>
        <div id="callRomaji" className="mt-2 font-mono-code font-black text-2xl sm:text-3xl tracking-widest break-all select-none min-h-[1.3em]">
          <span className="text-[#ffe100]">{typer?.typed}</span>
          {cardState === 'ng' && !cfg.super ? (
            <span className="text-[#ff5555]">{typer?.rest()}</span>
          ) : cfg.super ? (
            phase === 'play' && <span className="inline-block w-[0.7em] rounded bg-[#ffe100] animate-pulse">&nbsp;</span>
          ) : (
            <>
              {rest && <span className="cur inline-block px-1 rounded bg-[#ffe100] text-[#0e0e0e] shadow-[0_0_10px_#ffe100]">{rest.slice(0, 1)}</span>}
              <span className="text-[#cec6aa]/60">{rest.slice(1)}</span>
            </>
          )}
        </div>
        <div className="mt-4 h-2 bg-[#201f1f] border border-[#353534] rounded-full overflow-hidden">
          <div ref={timerBar} className="h-full w-full bg-[#ffe100]" />
        </div>
        <div className="mt-2 text-xs">
          <span id="verdict" className="font-dela text-[#ffe100]">{verdict}</span>
        </div>
      </div>

      {/* 超ハードは答えを伏せるのでキーボードは出さない */}
      {!cfg.super && <VirtualKeyboard nextKey={nextKey} />}

      {/* カウントダウン */}
      {phase === 'countdown' && countdown > 0 && (
        <div key={countdown} className="absolute inset-0 z-10 grid place-items-center bg-black/55 rounded-2xl pointer-events-none">
          <span className="font-dela text-[140px] text-[#ffe100] drop-shadow-[6px_6px_0_#000] animate-pop">{countdown}</span>
        </div>
      )}

      {imeWarn && (
        <div className="absolute left-1/2 bottom-4 -translate-x-1/2 z-20 bg-[#970015] text-[#ffdad7] px-4 py-2 rounded-lg font-bold shadow-hard whitespace-nowrap">
          IMEがオンになっています。半角英数に切り替えてください。
        </div>
      )}

      {/* 一時休戦 */}
      {paused && (
        <div className="absolute inset-0 z-20 bg-black/80 rounded-2xl flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border-4 border-[#ffe100] rounded-2xl p-6 max-w-md w-full shadow-hard-xl text-center">
            <h2 className="font-dela text-2xl text-[#ffe100] mb-2">一時休戦中</h2>
            <p className="text-xs text-[#cec6aa] mb-6 font-bold leading-relaxed">店主「おい！箸を止めるんじゃねえ！ロットが乱れるぞ！」</p>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={togglePause} className="w-full py-3 bg-[#ffe100] text-[#0e0e0e] font-dela rounded-xl shadow-hard-lg hover:bg-[#ffe330] cursor-pointer">
                修行を再開する（Esc）
              </button>
              <button type="button" onClick={onQuit} className="w-full py-2.5 bg-[#2a2a2a] text-[#cec6aa] font-dela rounded-xl hover:bg-[#353534] cursor-pointer">
                食券売場へ戻る（記録なし）
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 結果 */}
      {phase === 'over' && result && (
        <div className="absolute inset-0 z-20 bg-black/85 rounded-2xl flex items-center justify-center p-4 overflow-y-auto">
          <div
            id="resultModal"
            className={`bg-[#1c1b1b] border-4 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-hard-xl text-center ${
              result.expelled || result.gaveUp ? 'border-[#970015]' : 'border-[#ffe100]'
            }`}
          >
            <div className={`inline-block px-4 py-1.5 font-dela text-sm rounded-full mb-2 shadow ${result.expelled || result.gaveUp ? 'bg-[#970015] text-[#ffdad7]' : 'bg-[#ffe100] text-[#0e0e0e]'}`}>
              {result.expelled ? '強制退店処分' : result.gaveUp ? 'ギブアップ退店' : '★ ロット完走！完飲完食 ★'}
            </div>
            <div className="text-[11px] text-[#cec6aa] font-bold">食券：{ticket.name} ／ ペナルティ：{rule.name}</div>
            <div className="text-[11px] text-[#cec6aa] font-bold mt-2">あなたの称号</div>
            <h2 id="resRank" className={`font-dela text-4xl sm:text-5xl tracking-wider mb-1 drop-shadow-[2px_2px_0_#000] ${result.expelled || result.gaveUp ? 'text-[#ff5555]' : 'text-[#ffe100]'}`}>
              {result.rank}
            </h2>
            <p className="text-xs text-[#cec6aa] font-bold mb-4">{result.rankComment}</p>
            <div className="grid grid-cols-3 gap-3 bg-[#0e0e0e] p-4 rounded-xl border border-[#353534] mb-4 text-center">
              {[
                ['スコア', String(result.score), 'text-[#ffe100]'],
                ['打鍵/秒', result.kps.toFixed(2), 'text-[#ffffff]'],
                ['正確率', `${result.accuracy.toFixed(1)}%`, 'text-[#ffffff]'],
                ['ミス', String(result.misses), 'text-[#ffb3ae]'],
                ['ロット乱し', String(result.breaks), 'text-[#ffb3ae]'],
                ['最速コール', result.fastestMs !== null ? `${(result.fastestMs / 1000).toFixed(2)}秒` : '-', 'text-[#ffe100]'],
              ].map(([label, value, color]) => (
                <div key={label}>
                  <span className="text-[10px] text-[#cec6aa] block font-bold">{label}</span>
                  <span className={`font-mono-code text-xl font-black ${color}`}>{value}</span>
                </div>
              ))}
            </div>
            {result.isBest && <div className="mb-4 py-1.5 bg-[#ffe100] text-[#0e0e0e] font-dela rounded">🏆 自己ベスト更新！</div>}
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={start} className="flex-1 py-3.5 px-4 bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-sm rounded-xl shadow-hard-lg cursor-pointer">
                もう一杯（Space）
              </button>
              <button type="button" onClick={onShowBoard} className="py-3.5 px-4 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-dela text-sm rounded-xl cursor-pointer">
                完飲番付へ（Enter）
              </button>
              <button type="button" onClick={onQuit} className="py-3.5 px-4 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-dela text-sm rounded-xl cursor-pointer">
                食券売場（Esc）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
