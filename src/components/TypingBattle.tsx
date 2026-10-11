import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { TicketDifficulty, CallOption, TypingPhrase } from '../types/game';
import { TICKET_CONFIGS, COMBAT_PHRASES } from '../data/phrases';
import { soundManager } from '../utils/audio';
import { VirtualKeyboard } from './VirtualKeyboard';

interface TypingBattleProps {
  difficulty: TicketDifficulty;
  toppings: string[];
  callSettings: CallOption;
  onFinishGame: (wpm: number, accuracy: number, clearTime: string, cleared: boolean) => void;
  onQuit: () => void;
}

export const TypingBattle: React.FC<TypingBattleProps> = ({
  difficulty,
  toppings,
  callSettings,
  onFinishGame,
  onQuit,
}) => {
  const config = TICKET_CONFIGS[difficulty];

  // Game configuration & buffs
  const hasTimeBuff = toppings.includes('quail');
  const initialTimeLimit = config.timeLimit + (hasTimeBuff ? 10 : 0);
  const mistakeShieldCount = toppings.includes('raw-egg') ? 1 : 0;

  // Phrases for this session
  const [phrases] = useState<TypingPhrase[]>(() => {
    // Determine phrase count based on difficulty
    const count = difficulty === 'sho' ? 5 : difficulty === 'dai' ? 8 : difficulty === 'buta' ? 10 : 12;
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(COMBAT_PHRASES[i % COMBAT_PHRASES.length]);
    }
    return selected;
  });

  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLimit);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isCleared, setIsCleared] = useState<boolean>(false);

  // Mistake & strike management
  const [strikes, setStrikes] = useState<number>(0);
  const [shieldsRemaining, setShieldsRemaining] = useState<number>(mistakeShieldCount);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Performance metrics
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [recentVerdict, setRecentVerdict] = useState<string>('CRITICAL GANKO HIT!!');
  const [verdictAnim, setVerdictAnim] = useState<boolean>(false);

  // Timer & elapsed time
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  const currentPhrase = phrases[phraseIndex] || phrases[0];
  const targetRomaji = currentPhrase.romaji;
  const nextChar = targetRomaji[charIndex] || '';

  // Calculate live stats
  const elapsedTimeSec = Math.max(0.5, (initialTimeLimit - timeLeft));
  const liveWpm = Math.round((correctKeystrokes / 5) / (elapsedTimeSec / 60)) || 0;
  const liveKpm = Math.round(correctKeystrokes / (elapsedTimeSec / 60)) || 0;
  const liveAccuracy = totalKeystrokes > 0 ? ((correctKeystrokes / totalKeystrokes) * 100).toFixed(1) : '100.0';
  const progressPercent = Math.min(100, Math.round(((phraseIndex + (charIndex / targetRomaji.length)) / phrases.length) * 100));

  // Chef Anger Level based on time left & strikes
  const timePercentUsed = ((initialTimeLimit - timeLeft) / initialTimeLimit);
  const chefAnger = Math.min(100, Math.round(timePercentUsed * 65 + strikes * 25));

  // Tenchi-gaeshi count
  const tenchiCount = Math.min(5, Math.floor((combo / 10)) + 1);

  // Dynamic Chef Dialogue
  const getChefQuote = () => {
    if (strikes >= config.strikesAllowed) return '「貴様！ロットを崩壊させやがったな！即刻立ち去れ！！」';
    if (timeLeft < 10) return '「時間がねえぞ！麺がブヨブヨに伸びる前に一気に啜れ！！」';
    if (combo >= 30) return '「ほう…いいリズムで打ち込んでるじゃねえか。油断するなよ！」';
    if (chefAnger > 75) return '「手を動かせ！極太麺が伸びちまうぞコラァ！！」 ロット乱したら即ギブアップとみなすからな。';
    return '「ニンニクと極太麺の調和を感じながら無心で打ち続けろ！」';
  };

  // Timer tick
  useEffect(() => {
    if (isPaused || isGameOver || isCleared) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          // Time expired!
          soundManager.playMistake();
          setIsGameOver(true);
          return 0;
        }
        if (prev <= 10 && prev % 1 === 0) {
          soundManager.playWarning();
        }
        return Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isGameOver, isCleared]);

  // Handle typing input
  const handleKeyInput = useCallback((key: string) => {
    if (isPaused || isGameOver || isCleared) return;

    // Ignore modifier keys
    if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta') return;

    if (key === 'Tab') return; // Handled separately
    if (key === 'Escape') {
      setIsPaused((p) => !p);
      return;
    }

    setTotalKeystrokes((prev) => prev + 1);

    const expected = targetRomaji[charIndex];
    if (!expected) return;

    // Compare characters (case-insensitive)
    const isMatch = expected.toUpperCase() === key.toUpperCase();

    if (isMatch) {
      // Key hit!
      soundManager.playKeyStroke();
      setCorrectKeystrokes((prev) => prev + 1);
      setCombo((prev) => {
        const next = prev + 1;
        if (next > maxCombo) setMaxCombo(next);
        return next;
      });

      // Random verdict encouragement
      if (combo > 0 && combo % 10 === 0) {
        soundManager.playCriticalHit();
        const verdicts = ['CRITICAL GANKO HIT!!', 'TENCHI-GAESHI COMBO!!', 'MASHIMASHI PERFECT!!', 'SPEED SLURP MASTER!!'];
        setRecentVerdict(verdicts[Math.floor(Math.random() * verdicts.length)]);
        setVerdictAnim(true);
        setTimeout(() => setVerdictAnim(false), 500);
      }

      const nextCharIndex = charIndex + 1;

      // Check if current phrase is completed
      if (nextCharIndex >= targetRomaji.length) {
        soundManager.playSlurp();
        const nextPhraseIdx = phraseIndex + 1;
        if (nextPhraseIdx >= phrases.length) {
          // All phrases cleared! VICTORY!
          soundManager.playVictory();
          setIsCleared(true);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#ffe100', '#c0282d', '#ffffff'],
          });
        } else {
          setPhraseIndex(nextPhraseIdx);
          setCharIndex(0);
        }
      } else {
        setCharIndex(nextCharIndex);
      }
    } else {
      // Miskey!
      soundManager.playMistake();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);

      // Check mistake shield
      if (shieldsRemaining > 0) {
        setShieldsRemaining((s) => s - 1);
      } else {
        setCombo(0);
        const nextStrikes = strikes + 1;
        setStrikes(nextStrikes);

        if (nextStrikes >= config.strikesAllowed) {
          // Out of strikes - kicked out!
          setIsGameOver(true);
        }
      }
    }
  }, [
    isPaused,
    isGameOver,
    isCleared,
    targetRomaji,
    charIndex,
    phraseIndex,
    phrases.length,
    combo,
    maxCombo,
    shieldsRemaining,
    strikes,
    config.strikesAllowed,
  ]);

  // Global keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        // Reset current phrase
        setCharIndex(0);
        soundManager.playKeyStroke();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsPaused((p) => !p);
        return;
      }
      handleKeyInput(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyInput]);

  const handleRestart = () => {
    setPhraseIndex(0);
    setCharIndex(0);
    setTimeLeft(initialTimeLimit);
    setStrikes(0);
    setShieldsRemaining(mistakeShieldCount);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setCombo(0);
    setIsGameOver(false);
    setIsCleared(false);
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  const formattedTimeLeft = timeLeft.toFixed(1).padStart(4, '0');
  const strikesLeft = Math.max(0, config.strikesAllowed - strikes);

  return (
    <div className={`flex flex-col w-full pb-16 ${isShaking ? 'animate-jiro-shake' : ''}`}>
      {/* Top Danger Bar & Countdown */}
      <div className="w-full bg-[#0e0e0e] rounded-xl p-3 shadow-md mb-4 flex flex-col md:flex-row items-center justify-between gap-3 border border-[#353534]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 bg-[#970015] text-[#ffdad7] px-2.5 py-1 rounded text-xs font-dela uppercase">
            <span className="material-symbols-outlined text-sm animate-pulse text-[#ffe100]">local_fire_department</span>
            DANGER LOT STATUS
          </span>
          <span className="font-dela text-sm sm:text-base text-[#e5e2e1] flex items-center gap-2">
            店主の逆鱗限界点:
            <span className={`font-mono-code text-xl font-black ${timeLeft < 10 ? 'text-[#ff5555] animate-ping' : 'text-[#ffe100]'}`}>
              00:{formattedTimeLeft}
            </span>
          </span>
        </div>

        {/* Penalties / Strikes */}
        <div className="flex items-center gap-3 text-xs font-mono-code font-bold">
          <span className="text-[#cec6aa]">退店ペナルティ:</span>
          <div className="flex items-center gap-1 text-base">
            {Array.from({ length: config.strikesAllowed }).map((_, idx) => (
              <span
                key={idx}
                className={idx < strikes ? 'text-[#ff5555]' : 'text-[#4c4732]'}
              >
                {idx < strikes ? '❌' : '⚪'}
              </span>
            ))}
          </div>
          <span className="text-[#ffb4ab] text-xs">
            {strikesLeft === 0 ? '即強制退店' : `残り${strikesLeft}ミスで強制退店`}
          </span>
        </div>
      </div>

      {/* 4 HUD Metric Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-3 shadow-hard-sm">
          <span className="text-[10px] text-[#cec6aa] block font-bold">打鍵速度 (WPM)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-code text-2xl font-black text-[#ffe100]">{liveWpm}</span>
            <span className="text-[10px] text-[#cec6aa] font-mono-code">WORDS</span>
          </div>
        </div>

        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-3 shadow-hard-sm">
          <span className="text-[10px] text-[#cec6aa] block font-bold">分間打鍵数 (KPM)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-code text-2xl font-black text-[#ffffff]">{liveKpm}</span>
            <span className="text-[10px] text-[#cec6aa] font-mono-code">KEYS</span>
          </div>
        </div>

        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-3 shadow-hard-sm">
          <span className="text-[10px] text-[#cec6aa] block font-bold">マシマシ連打</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-code text-2xl font-black text-[#ffb3ae]">{combo}</span>
            <span className="text-[10px] text-[#ffb3ae] font-mono-code">CHAIN!</span>
          </div>
        </div>

        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-3 shadow-hard-sm">
          <span className="text-[10px] text-[#cec6aa] block font-bold">完飲進捗率</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-code text-2xl font-black text-[#ffe100]">{progressPercent}%</span>
            <span className="text-[10px] text-[#cec6aa] font-mono-code">CLEAR</span>
          </div>
        </div>
      </div>

      {/* Battle Scene Stage: Chef & Ramen status */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 sm:p-5 shadow-xl mb-6 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Chef Section */}
          <div className="md:col-span-6 flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoayYLQ4-AJXcGtoDZTQXxCvLqHXcKmfbX8h4YcoZF98070-rpN-9YHbkqGCk4E2yPQBNmbeUsdHyjPpmYTPPJBSw9XwIiDiGSrlSIdSOxG1Z4RYnmk6R3PMbqBgRHXiHXKn0NIhbQOKbljrnA6iK-M-np7oiW7_UUCPsvYonwArfGV1XtwTR_RV7EVS6Ig4CShy92LjHfiqm2RfozWFxs9JEMP2X-K6v_gJVJYaXRwyB_lhMtYHxS"
                alt="三田総本山直系・店主"
                className={`w-20 h-20 rounded-full object-cover ring-4 ${chefAnger > 75 ? 'ring-[#970015] animate-rage' : 'ring-[#ffe100]'} shadow-xl`}
              />
              <span className={`absolute -bottom-2 -right-1 text-[10px] font-dela px-1.5 py-0.5 rounded shadow ${
                chefAnger > 75 ? 'bg-[#970015] text-[#ffdad7]' : 'bg-[#ffe100] text-[#0e0e0e]'
              }`}>
                激怒度 {chefAnger}%
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-dela text-[#ffe100]">三田総本山直系・店主</span>
                <span className="text-[10px] font-mono-code text-[#ffb3ae] bg-[#0e0e0e] px-1.5 py-0.5 rounded border border-[#4c4732]">
                  👁 凝視中
                </span>
              </div>
              {/* Dialogue Bubble */}
              <div className="mt-2 bg-[#201f1f] text-[#e5e2e1] p-2.5 rounded-lg border border-[#353534] text-xs font-bold leading-relaxed shadow">
                {getChefQuote()}
              </div>
            </div>
          </div>

          {/* Center Bowl with Radial Gauge */}
          <div className="md:col-span-3 flex flex-col items-center justify-center relative">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* SVG Radial Meter */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#353534"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#ffe100"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * (100 - progressPercent)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-[#ffe100]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOmwEvA5fk_Y6WaIrAIt5fbOmQglfgR1nPp_FjwH6YAjnAAPUA1Gy1l2tQZm2yS8k0nPTabgfJBlhp3wFEMLnvJSe22YXokcRf5GTpmHTaTJz0ctZJahNbEC-5CZ8-uKF7GTLxQhljLjLhADZmACURegEQYzw9ux5iXAoIAga8E4jXCiNgkUWwqWVEIO8Qrc1xl6t_rtG_GqaEULYEPXePpmoaXhWa07tXTioQPYxXOW7VOTjXXae-"
                  alt="Ramen bowl"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="mt-1 text-center">
              <span className="font-dela text-xs text-[#ffe100] block">
                ヤサイ残 {100 - progressPercent}%
              </span>
              <span className="text-[10px] text-[#cec6aa] font-bold">
                天地返しカウント {tenchiCount}/5
              </span>
            </div>
          </div>

          {/* Right Broth Specifications */}
          <div className="md:col-span-3 flex flex-col gap-2 text-xs font-bold bg-[#0e0e0e] p-3 rounded-lg border border-[#353534]">
            <div className="flex justify-between items-center">
              <span className="text-[#cec6aa]">スープ乳化度</span>
              <span className="font-dela text-[#ffe100]">超ド乳化 99%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#cec6aa]">極太オーション麺</span>
              <span className="font-mono-code text-[#e5e2e1]">ワシワシ {config.noddle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#cec6aa]">アブラコール</span>
              <span className="font-dela text-[#ffb3ae]">
                {callSettings.abura === 'katamari' ? '黒アブラカタマリ' : callSettings.abura === 'mashi' ? 'アブラマシ' : '標準脂'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BATTLEFIELD PROMPT CARD */}
      <div className="bg-[#201f1f] border-4 border-[#353534] rounded-2xl p-6 sm:p-8 shadow-hard-xl mb-6 relative">
        {/* Stage Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#353534]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#ffe100] text-[#0e0e0e] font-dela text-sm rounded shadow-hard-sm">
              {String(phraseIndex + 1).padStart(2, '0')} / {String(phrases.length).padStart(2, '0')}
            </span>
            <span className="font-dela text-sm sm:text-base text-[#e5e2e1]">
              必殺の食法を叩き込め！
            </span>
          </div>
          <span className="font-dela text-xs text-[#ffe100] hidden sm:inline-block">
            {currentPhrase.levelDesc}
          </span>
        </div>

        {/* Kanji & Furigana Prompt */}
        <div className="my-6 text-center">
          <h1 className="font-dela text-3xl sm:text-5xl text-[#ffe100] tracking-wider leading-tight drop-shadow-[2px_3px_0_#000000]">
            {currentPhrase.kanji}
          </h1>
          <p className="font-bold text-sm sm:text-base text-[#cec6aa] mt-2 font-mplus">
            {currentPhrase.kana}
          </p>
        </div>

        {/* Romaji Keystroke Display Box */}
        <div className="bg-[#0e0e0e] border-2 border-[#353534] rounded-xl p-4 sm:p-6 text-center font-mono-code font-black text-xl sm:text-3xl tracking-widest shadow-inner relative select-none">
          {/* Letters broken down: Typed / Current / Remaining */}
          <div className="flex items-center justify-center flex-wrap gap-1">
            {targetRomaji.split('').map((char, idx) => {
              const isTyped = idx < charIndex;
              const isCurrent = idx === charIndex;

              if (isCurrent) {
                return (
                  <span
                    key={idx}
                    className="inline-block px-1.5 py-0.5 rounded bg-[#ffe100] text-[#0e0e0e] shadow-[0_0_10px_#ffe100] scale-110 font-black animate-pulse"
                  >
                    {char === ' ' ? '␣' : char}
                  </span>
                );
              }

              if (isTyped) {
                return (
                  <span key={idx} className="text-[#970015] font-bold">
                    {char}
                  </span>
                );
              }

              return (
                <span key={idx} className="text-[#cec6aa]/60">
                  {char}
                </span>
              );
            })}
          </div>

          <div className="mt-4 text-[11px] text-[#cec6aa] font-bold font-mplus flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">keyboard</span>
            そのままキーボードで直打ちしてください (ローマ字入力対応)
          </div>
        </div>

        {/* Hit Verdict Flash Banner */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#cec6aa] font-bold">直近打鍵判定:</span>
            <span className={`font-dela text-sm text-[#ffe100] ${verdictAnim ? 'scale-125 transition-transform text-[#ffffff]' : ''}`}>
              {recentVerdict}
            </span>
          </div>

          <div className="text-[#cec6aa] font-mono-code font-bold">
            キー入力成功音: <span className="text-[#ffe100]">麺すすり音 (ON)</span>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard Assist */}
      <div className="mb-6">
        <VirtualKeyboard nextKey={nextChar} />
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e0e0e] p-3 rounded-xl border border-[#353534]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="px-3 py-2 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] rounded-lg text-xs font-dela flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
            {isPaused ? '戦闘再開' : '一時休戦 (PAUSE)'}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="px-3 py-2 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] rounded-lg text-xs font-dela flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-sm">replay</span>
            ロットやり直し
          </button>
        </div>

        <span className="text-[11px] text-[#cec6aa] font-mono-code font-bold hidden sm:inline">
          Esc: 中断 / Tab: リセット
        </span>

        <button
          type="button"
          onClick={() => {
            soundManager.playMistake();
            setIsGameOver(true);
          }}
          className="px-4 py-2 bg-[#970015] hover:bg-[#c0282d] text-[#ffdad7] rounded-lg text-xs font-dela flex items-center gap-1 cursor-pointer transition-colors shadow-hard-red"
        >
          <span className="material-symbols-outlined text-sm">sentiment_very_dissatisfied</span>
          ギブアップ退店
        </button>
      </div>

      {/* PAUSE MODAL */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border-4 border-[#ffe100] rounded-2xl p-6 max-w-md w-full shadow-hard-xl text-center">
            <h2 className="font-dela text-2xl text-[#ffe100] mb-2">一時休戦中</h2>
            <p className="text-xs text-[#cec6aa] mb-6 font-bold leading-relaxed">
              店主「おい！箸を止めるんじゃねえ！ロットが乱れるぞ！」
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="w-full py-3 bg-[#ffe100] text-[#0e0e0e] font-dela rounded-xl shadow-hard-lg hover:bg-[#ffe330] cursor-pointer"
              >
                修行を再開する
              </button>
              <button
                type="button"
                onClick={onQuit}
                className="w-full py-2.5 bg-[#2a2a2a] text-[#cec6aa] font-dela rounded-xl hover:bg-[#353534] cursor-pointer"
              >
                食券売場へ戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR / VICTORY MODAL */}
      {isCleared && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1c1b1b] border-4 border-[#ffe100] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-hard-xl text-center relative overflow-hidden">
            {/* Stamp Banner */}
            <div className="inline-block px-4 py-1.5 bg-[#970015] text-[#ffdad7] font-dela text-sm rounded-full mb-3 shadow">
              ★ ロット維持完了！完飲完食 ★
            </div>

            <h2 className="font-dela text-3xl sm:text-4xl text-[#ffe100] tracking-wider mb-2 drop-shadow-[2px_2px_0_#000]">
              ご馳走様でした！
            </h2>
            <p className="text-xs text-[#cec6aa] font-bold mb-6">
              丼の底に「完飲感謝」の神文字が現れた！店主も深く頷いている。
            </p>

            {/* Final Stats Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0e0e0e] p-4 rounded-xl border border-[#353534] mb-6 text-center">
              <div>
                <span className="text-[10px] text-[#cec6aa] block font-bold">最高打鍵速度</span>
                <span className="font-mono-code text-xl font-black text-[#ffe100]">{liveWpm}</span>
                <span className="text-[9px] text-[#cec6aa] block">WPM</span>
              </div>
              <div>
                <span className="text-[10px] text-[#cec6aa] block font-bold">打鍵正確率</span>
                <span className="font-mono-code text-xl font-black text-[#ffffff]">{liveAccuracy}%</span>
                <span className="text-[9px] text-[#cec6aa] block">ACCURACY</span>
              </div>
              <div>
                <span className="text-[10px] text-[#cec6aa] block font-bold">完食タイム</span>
                <span className="font-mono-code text-xl font-black text-[#ffb3ae]">{elapsedTimeSec.toFixed(1)}s</span>
                <span className="text-[9px] text-[#cec6aa] block">TIME</span>
              </div>
              <div>
                <span className="text-[10px] text-[#cec6aa] block font-bold">最大連打数</span>
                <span className="font-mono-code text-xl font-black text-[#ffe100]">{maxCombo}</span>
                <span className="text-[9px] text-[#cec6aa] block">COMBO</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => onFinishGame(liveWpm, parseFloat(liveAccuracy), `${elapsedTimeSec.toFixed(1)}s`, true)}
                className="flex-1 py-3.5 px-4 bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-sm rounded-xl shadow-hard-lg cursor-pointer"
              >
                全国完飲番付へ記録送信 ▶
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="py-3.5 px-4 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-dela text-sm rounded-xl cursor-pointer"
              >
                もう一杯食う
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER / EXPELLED MODAL */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border-4 border-[#970015] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-hard-xl text-center">
            <span className="inline-block px-4 py-1 bg-[#970015] text-[#ffdad7] font-dela text-xs rounded-full mb-3">
              ロット乱し強制退店処分
            </span>

            <h2 className="font-dela text-3xl sm:text-4xl text-[#ff5555] tracking-wider mb-2">
              撃沈・店主激怒！！
            </h2>
            <p className="text-xs text-[#cec6aa] font-bold mb-6 leading-relaxed">
              「ロットを乱した客に喰わせる麺はねえ！表に出て頭を冷やして出直してこい！」
            </p>

            <div className="bg-[#0e0e0e] p-4 rounded-xl border border-[#353534] mb-6 flex items-center justify-around text-center">
              <div>
                <span className="text-[10px] text-[#cec6aa] block font-bold">到達進捗</span>
                <span className="font-mono-code text-lg font-bold text-[#ff5555]">{progressPercent}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#cec6aa] block font-bold">累積ミス数</span>
                <span className="font-mono-code text-lg font-bold text-[#ff5555]">{strikes}回</span>
              </div>
              <div>
                <span className="text-[10px] text-[#cec6aa] block font-bold">平均WPM</span>
                <span className="font-mono-code text-lg font-bold text-[#ffe100]">{liveWpm}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className="flex-1 py-3.5 px-4 bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-sm rounded-xl shadow-hard-lg cursor-pointer"
              >
                土下座して再挑戦する
              </button>
              <button
                type="button"
                onClick={onQuit}
                className="py-3.5 px-4 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-dela text-sm rounded-xl cursor-pointer"
              >
                食券売場へ退散
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
