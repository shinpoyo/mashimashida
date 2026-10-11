import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import confetti from 'canvas-confetti';
import { GameResult, GameSettings } from '../types/game';
import { TICKET_CONFIGS, TOPPING_BUFFS, PENALTY_BY_ID, toppingValue } from '../data/shop';
import { MODES, makeCalls, pick, QUESTIONS, DEFAULT_LV, type Call } from '../engine/calls';
import { Typer, MultiTyper, type CallTyper } from '../engine/romaji';
import { lotScore, judgeRank } from '../engine/scoring';
import { soundManager } from '../utils/audio';
import { VirtualKeyboard } from './VirtualKeyboard';
import { BowlView, ChefPhoto, RamenPhoto, type ChefMood } from './JiroArt';

interface TypingBattleProps {
  settings: GameSettings;
  /** 結果を記録し、自己ベスト更新なら true を返す */
  onRecord: (result: GameResult) => boolean;
  onShowBoard: () => void;
  onQuit: () => void;
}

type Phase = 'countdown' | 'play' | 'serve' | 'over';

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
  shields: number;
  comboGuards: number;
  forgives: number;
  startedAt: number;
}

const VERDICTS = ['CRITICAL GANKO HIT!!', 'MASHIMASHI PERFECT!!', 'SPEED CALL MASTER!!', 'ロット完全維持!!'];

export const TypingBattle: React.FC<TypingBattleProps> = ({ settings, onRecord, onShowBoard, onQuit }) => {
  const cfg = MODES[settings.mode];
  const ticket = TICKET_CONFIGS[settings.mode];
  const rule = PENALTY_BY_ID[settings.penalty];
  const scoreMult = (toppingValue(settings.toppings, 'score_multiplier') || 1) * rule.scoreRate;
  const timeBonus = toppingValue(settings.toppings, 'time_extend');

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
    shields: toppingValue(settings.toppings, 'mistake_shield'),
    comboGuards: toppingValue(settings.toppings, 'combo_protect'),
    forgives: toppingValue(settings.toppings, 'break_forgive'),
    startedAt: performance.now(),
  });

  const g = useRef<GameState>(newState());
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [phase, setPhase] = useState<Phase>('countdown');
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

  const phaseRef = useRef<Phase>('countdown');
  const pausedRef = useRef<boolean>(false);
  const pausedAt = useRef<number>(0);
  const nextTickAt = useRef<number>(0);
  const timers = useRef<number[]>([]);
  const rafId = useRef<number>(0);
  const timerBar = useRef<HTMLDivElement>(null);
  const angerBar = useRef<HTMLDivElement>(null);

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
        toppings: settings.toppings,
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
    if (angerBar.current) angerBar.current.style.width = `${Math.min(100, (1 - ratio) * 65 + s.breaks * 15)}%`;
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
      s.limit = cfg.base + cfg.perKey * new Typer(call.kana).rest().length + timeBonus;
    } else {
      s.typer = new Typer(call.kana);
      s.limit = cfg.base + cfg.perKey * s.typer.rest().length + timeBonus;
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
    let note = '';
    if (s.forgives > 0) {
      s.forgives--;
      note = '（黒烏龍茶で帳消し）';
    } else {
      s.breaks++;
    }
    if (s.comboGuards > 0 && s.chain > 0) {
      s.comboGuards--;
      note += '（生姜で連続正解キープ）';
    } else {
      s.chain = 0;
    }
    setVerdict(`ロット乱し！${note}`);
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
    if (s.shields > 0) {
      s.shields--;
      setVerdict(`生卵バリア！ミス無効（残り${s.shields}）`);
      soundManager.shield();
      rerender();
      return;
    }
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
    if (angerBar.current) angerBar.current.style.width = '0%';
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

  useEffect(() => {
    start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

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
  const activeBuffs = TOPPING_BUFFS.filter((b) => settings.toppings.includes(b.id));
  const buffRemain: Record<string, string> = {
    mistake_shield: `残り${s.shields}`,
    combo_protect: `残り${s.comboGuards}`,
    break_forgive: `残り${s.forgives}`,
    time_extend: '発動中',
    score_multiplier: '発動中',
  };
  const breaksLimit = rule.maxBreaks;

  return (
    <div className={`flex flex-col w-full pb-16 ${shake ? 'animate-jiro-shake' : ''}`}>
      {/* Top Danger Bar */}
      <div className="w-full bg-[#0e0e0e] rounded-xl p-3 shadow-md mb-4 flex flex-col md:flex-row items-center justify-between gap-3 border border-[#353534]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 bg-[#970015] text-[#ffdad7] px-2.5 py-1 rounded text-xs font-dela uppercase">
            <span className="material-symbols-outlined text-sm animate-pulse text-[#ffe100]">local_fire_department</span>
            DANGER LOT STATUS
          </span>
          <span className="font-dela text-sm sm:text-base text-[#e5e2e1]">
            食券：<span className="text-[#ffe100]">{ticket.name}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono-code font-bold">
          <span className="text-[#cec6aa]">退店ペナルティ「{rule.name}」:</span>
          {breaksLimit === null ? (
            <span className="text-[#cec6aa]">ロット乱し {s.breaks}回（退店なし）</span>
          ) : (
            <>
              <div className="flex items-center gap-1 text-base">
                {Array.from({ length: breaksLimit }).map((_, idx) => (
                  <span key={idx} className={idx < s.breaks ? 'text-[#ff5555]' : 'text-[#4c4732]'}>
                    {idx < s.breaks ? '❌' : '⚪'}
                  </span>
                ))}
              </div>
              <span className="text-[#ffb4ab] text-xs">
                {rule.maxMisses !== null ? `ミス ${s.miss}/${rule.maxMisses}` : `残り${Math.max(0, breaksLimit - s.breaks)}回で強制退店`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 4 HUD Metric Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-3 shadow-hard-sm">
          <span className="text-[10px] text-[#cec6aa] block font-bold">ロット</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-code text-2xl font-black text-[#ffe100]" id="hudLot">{lotNo}/{cfg.lots}</span>
            <span className="text-[10px] text-[#cec6aa] font-mono-code">LOT</span>
          </div>
        </div>
        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-3 shadow-hard-sm">
          <span className="text-[10px] text-[#cec6aa] block font-bold">スコア</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-code text-2xl font-black text-[#ffffff]" id="hudScore">{s.score}</span>
            <span className="text-[10px] text-[#cec6aa] font-mono-code">×{scoreMult.toFixed(2)}</span>
          </div>
        </div>
        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-3 shadow-hard-sm">
          <span className="text-[10px] text-[#cec6aa] block font-bold">ミス</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-code text-2xl font-black text-[#ffb3ae]" id="hudMiss">{s.miss}</span>
            <span className="text-[10px] text-[#ffb3ae] font-mono-code">MISS</span>
          </div>
        </div>
        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-3 shadow-hard-sm">
          <span className="text-[10px] text-[#cec6aa] block font-bold">連続正解</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-code text-2xl font-black text-[#ffe100]">{s.chain}</span>
            <span className="text-[10px] text-[#cec6aa] font-mono-code">CHAIN!</span>
          </div>
        </div>
      </div>

      {/* Battle Stage: Chef / Served bowl / Buffs */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 sm:p-5 shadow-xl mb-6 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-6 flex items-center gap-4">
            <div className="relative shrink-0">
              <ChefPhoto mood={mood} className="w-24 h-24 rounded-full" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-dela text-[#ffe100]">三田総本山直系・店主</span>
                <span className="text-[10px] font-mono-code text-[#ffb3ae] bg-[#0e0e0e] px-1.5 py-0.5 rounded border border-[#4c4732]">👁 凝視中</span>
              </div>
              <div key={bubbleKey} id="staffBubble" className="animate-pop mt-2 bg-[#201f1f] text-[#e5e2e1] p-2.5 rounded-lg border border-[#353534] text-base font-black leading-relaxed shadow">
                {bubble}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-[#cec6aa] font-bold">激怒度</span>
                <div className="flex-1 h-1.5 bg-[#0e0e0e] rounded overflow-hidden">
                  <div ref={angerBar} className="h-full w-0 bg-gradient-to-r from-[#ffe100] to-[#ff5555]" />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* 提供ゲージ（提供杯数 / ロット数） */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" stroke="#353534" strokeWidth="6" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="#ffe100"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="289"
                  strokeDashoffset={289 - (289 * s.served) / cfg.lots}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div
                key={serveKey}
                className={`absolute inset-2.5 rounded-full overflow-hidden border-2 ${
                  counter === 'ng' ? 'border-[#970015]' : 'border-[#ffe100]'
                } ${counter === 'served' ? 'animate-serve' : ''}`}
              >
                <RamenPhoto
                  className={`w-full h-full transition-all duration-300 ${
                    counter === 'cooking' ? 'brightness-50 saturate-50' : counter === 'ng' ? 'grayscale brightness-75' : ''
                  }`}
                  position="49% 60%"
                />
                {counter !== 'served' && (
                  <span className={`absolute inset-x-0 bottom-3 text-center font-dela text-[11px] drop-shadow-[1px_1px_0_#000] ${counter === 'ng' ? 'text-[#ff5555]' : 'text-[#ffe100]'}`}>
                    {counter === 'ng' ? 'ロット乱し' : '調理中…'}
                  </span>
                )}
              </div>
            </div>
            <span className="mt-1 text-[10px] text-[#cec6aa] font-bold">提供カウンター（{s.served}/{cfg.lots}杯）</span>
          </div>

          <div className="md:col-span-3 flex flex-col gap-1.5 text-xs font-bold bg-[#0e0e0e] p-3 rounded-lg border border-[#353534]">
            <span className="text-[10px] text-[#cec6aa]">トッピング券</span>
            {activeBuffs.length === 0 && <span className="text-[#4c4732]">なし（素ラーメン）</span>}
            {activeBuffs.map((b) => (
              <div key={b.id} className="flex justify-between items-center">
                <span className="text-[#e5e2e1]">{b.name}</span>
                <span className="font-mono-code text-[#ffe100]">{buffRemain[b.effectType]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CALL CARD */}
      <div
        id="callCard"
        className={`bg-[#201f1f] border-4 rounded-2xl p-6 sm:p-8 shadow-hard-xl mb-6 relative transition-colors ${
          cardState === 'ok' ? 'border-[#ffe100]' : cardState === 'ng' ? 'border-[#970015]' : 'border-[#353534]'
        } ${showCall ? '' : 'invisible'}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#353534]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#ffe100] text-[#0e0e0e] font-dela text-sm rounded shadow-hard-sm whitespace-nowrap">
              {String(lotNo).padStart(2, '0')} / {String(cfg.lots).padStart(2, '0')}
            </span>
            <span className="font-dela text-sm sm:text-base text-[#e5e2e1]">{cfg.super ? 'この丼になるコールを答えよ' : 'あなたのコール'}</span>
          </div>
          <span className="font-dela text-xs text-[#ffe100] hidden sm:inline-block">
            {cfg.super ? '順不同OK・全マシOK' : cfg.shuffle ? 'LEVEL: 順不同ジロリアン' : 'LEVEL: 定番コール'}
          </span>
        </div>

        {cfg.super && shownCall && (
          <div className="grid grid-cols-[1fr_110px] gap-4 items-end mt-4">
            <div className="justify-self-center w-full max-w-[250px] rounded-xl border-2 border-[#353534] bg-[radial-gradient(ellipse_at_50%_70%,#3a2a1c,#120e0b)]">
              <BowlView lv={shownCall.lv} seed={shownIdx + 1} />
            </div>
            <div className="text-center opacity-80">
              <BowlView lv={DEFAULT_LV} seed={999} />
              <span className="text-[10px] text-[#cec6aa] font-bold">基準：そのまま</span>
            </div>
          </div>
        )}

        <div className="my-6 text-center">
          <h1 id="callDisplay" className={`font-dela text-[#ffe100] tracking-wider leading-tight drop-shadow-[2px_3px_0_#000000] break-all ${cfg.super ? 'text-xl sm:text-2xl min-h-[1.3em]' : 'text-3xl sm:text-5xl min-h-[1.2em]'}`}>
            {cfg.super ? revealed : shownCall?.display}
          </h1>
          <p className="font-bold text-sm sm:text-base text-[#cec6aa] mt-2 font-mplus tracking-widest min-h-[1.5em]">
            {cfg.super ? (
              <span className="text-[#ffe100]">{kanaSrc.slice(0, kanaDone)}</span>
            ) : (
              <>
                <span className="text-[#4c4732]">{kanaSrc.slice(0, kanaDone)}</span>
                {kanaSrc.slice(kanaDone)}
              </>
            )}
          </p>
        </div>

        <div className="bg-[#0e0e0e] border-2 border-[#353534] rounded-xl p-4 sm:p-6 text-center font-mono-code font-black text-xl sm:text-3xl tracking-widest shadow-inner relative select-none">
          <div id="callRomaji" className="break-all">
            <span className="text-[#ffe100]">{typer?.typed}</span>
            {cardState === 'ng' && !cfg.super ? (
              <span className="text-[#ff5555]">{typer?.rest()}</span>
            ) : cfg.super ? (
              phase === 'play' && <span className="inline-block w-[0.7em] rounded bg-[#ffe100] animate-pulse">&nbsp;</span>
            ) : (
              <>
                {rest && (
                  <span className="cur inline-block px-1 rounded bg-[#ffe100] text-[#0e0e0e] shadow-[0_0_10px_#ffe100]">{rest.slice(0, 1)}</span>
                )}
                <span className="text-[#cec6aa]/60">{rest.slice(1)}</span>
              </>
            )}
          </div>
          <div className="mt-4 text-[11px] text-[#cec6aa] font-bold font-mplus flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">keyboard</span>
            そのままキーボードで直打ち（shi/si・tsu/tu・nn/n などの表記ゆれ対応）
          </div>
        </div>

        <div className="mt-4 h-2.5 bg-[#0e0e0e] border border-[#353534] rounded-full overflow-hidden">
          <div ref={timerBar} className="h-full w-full bg-[#ffe100]" />
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-[#cec6aa] font-bold">直近判定:</span>
          <span id="verdict" className="font-dela text-sm text-[#ffe100]">{verdict}</span>
        </div>
      </div>

      <div className="mb-6">
        <VirtualKeyboard nextKey={nextKey} hidden={cfg.super} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e0e0e] p-3 rounded-xl border border-[#353534]">
        <button
          type="button"
          onClick={togglePause}
          className="px-3 py-2 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] rounded-lg text-xs font-dela flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-sm">pause</span>
          一時休戦 (Esc)
        </button>
        <span className="text-[11px] text-[#cec6aa] font-mono-code font-bold hidden sm:inline">Esc: 一時休戦</span>
        <button
          type="button"
          onClick={giveUp}
          className="px-4 py-2 bg-[#970015] hover:bg-[#c0282d] text-[#ffdad7] rounded-lg text-xs font-dela flex items-center gap-1 cursor-pointer transition-colors shadow-hard-red"
        >
          <span className="material-symbols-outlined text-sm">sentiment_very_dissatisfied</span>
          ギブアップ退店
        </button>
      </div>

      {/* COUNTDOWN */}
      {phase === 'countdown' && countdown > 0 && (
        <div key={countdown} className="fixed inset-0 z-40 grid place-items-center bg-black/55 pointer-events-none">
          <span className="font-dela text-[160px] text-[#ffe100] drop-shadow-[6px_6px_0_#000] animate-pop">{countdown}</span>
        </div>
      )}

      {imeWarn && (
        <div className="fixed left-1/2 bottom-5 -translate-x-1/2 z-50 bg-[#970015] text-[#ffdad7] px-4 py-2.5 rounded-lg font-bold shadow-hard">
          IMEがオンになっています。半角英数に切り替えてください。
        </div>
      )}

      {/* PAUSE MODAL */}
      {paused && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
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

      {/* RESULT MODAL */}
      {phase === 'over' && result && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            id="resultModal"
            className={`bg-[#1c1b1b] border-4 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-hard-xl text-center ${
              result.expelled || result.gaveUp ? 'border-[#970015]' : 'border-[#ffe100]'
            }`}
          >
            <div className={`inline-block px-4 py-1.5 font-dela text-sm rounded-full mb-3 shadow ${result.expelled || result.gaveUp ? 'bg-[#970015] text-[#ffdad7]' : 'bg-[#ffe100] text-[#0e0e0e]'}`}>
              {result.expelled ? '強制退店処分' : result.gaveUp ? 'ギブアップ退店' : '★ ロット完走！完飲完食 ★'}
            </div>
            <div className="text-[11px] text-[#cec6aa] font-bold">食券：{ticket.name} ／ ペナルティ：{rule.name}</div>
            <div className="text-[11px] text-[#cec6aa] font-bold mt-2">あなたの称号</div>
            <h2 id="resRank" className={`font-dela text-4xl sm:text-5xl tracking-wider mb-1 drop-shadow-[2px_2px_0_#000] ${result.expelled || result.gaveUp ? 'text-[#ff5555]' : 'text-[#ffe100]'}`}>
              {result.rank}
            </h2>
            <p className="text-xs text-[#cec6aa] font-bold mb-5">{result.rankComment}</p>

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
