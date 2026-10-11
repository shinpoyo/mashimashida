import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { ChefPhoto, RamenPhoto } from './JiroArt';

interface CallMasterProps {
  onGoToLeaderboard: () => void;
}

interface CallComboState {
  yasai: string;
  garlic: string;
  abura: string;
  karame: string;
}

export const CallMaster: React.FC<CallMasterProps> = ({ onGoToLeaderboard }) => {
  // Call builder state
  const [callSelection, setCallSelection] = useState<CallComboState>({
    yasai: 'マシマシ',
    garlic: '少なめ',
    abura: '多め(塊)',
    karame: 'カラメ',
  });

  // Current active spell
  const [spellIndex, setSpellIndex] = useState<number>(1);
  const [cpm, setCpm] = useState<number>(482);
  const [accuracy, setAccuracy] = useState<number>(98.4);
  const [combo, setCombo] = useState<number>(18);
  const [reactiveSpeed, setReactiveSpeed] = useState<string>('0.18s');

  // Input & matching
  const [typedChars, setTypedChars] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(3.5);
  const [isAnswering, setIsAnswering] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute Romaji and display text from current selection
  const computeSpellData = (sel: CallComboState) => {
    const parts: string[] = [];
    const kanjiParts: string[] = [];
    const romajiParts: string[] = [];

    // Yasai
    if (sel.yasai === 'マシマシ') {
      parts.push('ヤサイマシマシ');
      kanjiParts.push('野菜増々');
      romajiParts.push('YASAI MASHIMASHI');
    } else if (sel.yasai === 'マシ') {
      parts.push('ヤサイマシ');
      kanjiParts.push('野菜増');
      romajiParts.push('YASAI MASHI');
    } else if (sel.yasai === '少なめ') {
      parts.push('ヤサイスクナメ');
      kanjiParts.push('野菜少目');
      romajiParts.push('YASAI SUKUNAME');
    }

    // Garlic
    if (sel.garlic === 'マシマシ') {
      parts.push('ニンニクマシマシ');
      kanjiParts.push('大蒜増々');
      romajiParts.push('NINNIKU MASHIMASHI');
    } else if (sel.garlic === 'あり') {
      parts.push('ニンニクマシ');
      kanjiParts.push('大蒜増');
      romajiParts.push('NINNIKU MASHI');
    } else if (sel.garlic === '少なめ') {
      parts.push('ニンニクスクナメ');
      kanjiParts.push('大蒜少目');
      romajiParts.push('NINNIKU SUKUNAME');
    }

    // Abura
    if (sel.abura === '多め(塊)') {
      parts.push('アブラオオメ');
      kanjiParts.push('脂多目');
      romajiParts.push('ABURA OOME');
    } else if (sel.abura === 'マシ') {
      parts.push('アブラマシ');
      kanjiParts.push('脂増');
      romajiParts.push('ABURA MASHI');
    } else if (sel.abura === '少なめ') {
      parts.push('アブラスクナメ');
      kanjiParts.push('脂少目');
      romajiParts.push('ABURA SUKUNAME');
    }

    // Karame
    if (sel.karame === 'カラメ') {
      parts.push('カラメ');
      kanjiParts.push('辛目');
      romajiParts.push('KARAME');
    } else if (sel.karame === 'カラカラ') {
      parts.push('カラカラ');
      kanjiParts.push('極辛');
      romajiParts.push('KARAKARA');
    } else if (sel.karame === '薄味') {
      parts.push('ウスマジ');
      kanjiParts.push('薄目');
      romajiParts.push('USUAJI');
    }

    if (parts.length === 0) {
      parts.push('ソノママ');
      kanjiParts.push('標準');
      romajiParts.push('SONOMAMA');
    }

    return {
      spellText: parts.join(''),
      kanjiText: `[${kanjiParts.join('・')}]`,
      targetRomaji: romajiParts.join(' '),
    };
  };

  const { spellText, kanjiText, targetRomaji } = computeSpellData(callSelection);

  // Realtime countdown timer
  useEffect(() => {
    if (!isAnswering || isSuccess || isFailed) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0.05) {
          setIsFailed(true);
          soundManager.playMistake();
          return 0;
        }
        return parseFloat((prev - 0.05).toFixed(2));
      });
    }, 50);

    return () => clearInterval(timer);
  }, [isAnswering, isSuccess, isFailed]);

  // Focus input automatically
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [callSelection]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setTypedChars(val);

    soundManager.playKeyStroke();

    // Remove whitespace differences for matching
    const strippedTarget = targetRomaji.replace(/\s+/g, '');
    const strippedTyped = val.replace(/\s+/g, '');

    if (strippedTyped === strippedTarget) {
      // Completed!
      soundManager.playCriticalHit();
      setIsSuccess(true);
      setIsAnswering(false);
      const usedTime = 3.5 - timeRemaining;
      setReactiveSpeed(`${usedTime.toFixed(2)}s`);
      setCpm((prev) => prev + 15);
      setCombo((prev) => prev + 1);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ffe100', '#c0282d', '#ffffff'],
      });
    }
  };

  const handleResetCall = useCallback(() => {
    setTypedChars('');
    setTimeRemaining(3.5);
    setIsAnswering(true);
    setIsSuccess(false);
    setIsFailed(false);
    soundManager.playKeyStroke();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleRandomizeCall = () => {
    const yasaiOpts = ['マシマシ', 'マシ', '少なめ', '抜き'];
    const garlicOpts = ['マシマシ', 'あり', '少なめ', '抜き'];
    const aburaOpts = ['多め(塊)', 'マシ', '普通', '少なめ'];
    const karameOpts = ['カラメ', 'カラカラ', '普通', '薄味'];

    setCallSelection({
      yasai: yasaiOpts[Math.floor(Math.random() * yasaiOpts.length)],
      garlic: garlicOpts[Math.floor(Math.random() * garlicOpts.length)],
      abura: aburaOpts[Math.floor(Math.random() * aburaOpts.length)],
      karame: karameOpts[Math.floor(Math.random() * karameOpts.length)],
    });
    setSpellIndex((p) => p + 1);
    handleResetCall();
  };

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        handleResetCall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetCall]);

  // Voice Recognition support
  const handleToggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('お使いのブラウザは音声認識に対応していません。キーボード入力でお楽しみください。');
      return;
    }

    try {
      // @ts-expect-error SpeechRecognition class
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningMic(true);
        soundManager.playKeyStroke();
      };

      recognition.onresult = (event: unknown) => {
        setIsListeningMic(false);
        // @ts-expect-error SpeechRecognition event
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // If transcript has keywords
          setTypedChars(targetRomaji);
          soundManager.playCriticalHit();
          setIsSuccess(true);
          setIsAnswering(false);
        }
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognition.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  // Stack calculation for vertical bars
  const getYasaiHeight = () => (callSelection.yasai === 'マシマシ' ? '85%' : callSelection.yasai === 'マシ' ? '60%' : callSelection.yasai === '少なめ' ? '30%' : '10%');
  const getGarlicHeight = () => (callSelection.garlic === 'マシマシ' ? '80%' : callSelection.garlic === 'あり' ? '55%' : callSelection.garlic === '少なめ' ? '35%' : '10%');
  const getAburaHeight = () => (callSelection.abura === '多め(塊)' ? '90%' : callSelection.abura === 'マシ' ? '65%' : callSelection.abura === '普通' ? '40%' : '15%');
  const getKarameHeight = () => (callSelection.karame === 'カラカラ' ? '95%' : callSelection.karame === 'カラメ' ? '70%' : callSelection.karame === '普通' ? '40%' : '15%');

  // Romaji characters breakdown
  const strippedTypedLen = typedChars.replace(/\s+/g, '').length;
  let runningLen = 0;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Sub-bar */}
      <div className="w-full bg-[#0e0e0e] rounded-xl p-3 shadow-md mb-6 flex flex-col md:flex-row items-center justify-between gap-3 border border-[#353534]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#ffe100] text-xl animate-pulse">sports_mma</span>
          <span className="font-dela text-sm sm:text-base text-[#e5e2e1]">
            コール即答試練: <span className="text-[#ffe100]">猶予返答・残り3.5秒</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-code font-bold">
          <span className="text-[#cec6aa]">FPS: 60 | LATENCY: 12ms</span>
          <span className="px-2.5 py-1 bg-[#ffe100] text-[#0e0e0e] font-dela text-xs rounded shadow">
            CALL MASTER MODE
          </span>
        </div>
      </div>

      {/* Top Card: Chef Intimidation & Realtime Topping Stack */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl mb-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Chef eye contact & photos */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-dela bg-[#970015] text-[#ffdad7] px-2 py-0.5 rounded">
                店主威圧
              </span>
              <span className="text-xs font-mono-code text-[#ffb3ae] font-bold">
                EYE_CONTACT_LOCKED
              </span>
            </div>

            <h2 className="font-dela text-2xl sm:text-3xl text-[#ffffff] tracking-wider">
              「ニンニク入れますか？」
            </h2>
            <p className="text-xs text-[#cec6aa] font-bold">
              ※迷いは即座にロット崩壊に繋がります
            </p>

            {/* Chef portrait & ramen bowl preview */}
            <div className="flex items-center gap-4 pt-2">
              <div className="relative group">
                <ChefPhoto mood="stern" className="w-24 h-24 rounded-lg" ringClass="ring-2" />
                <span className="absolute bottom-1 left-1 bg-[#970015] text-[#ffdad7] text-[9px] font-dela px-1 rounded">
                  頑固店主・二郎魂
                </span>
              </div>

              <div className="relative group">
                <RamenPhoto className="w-24 h-24 rounded-lg border-2 border-[#ffe100] shadow-lg" />
                <span className="absolute bottom-1 left-1 bg-[#ffe100] text-[#0e0e0e] text-[9px] font-dela px-1 rounded">
                  カウンター直撃
                </span>
              </div>
            </div>
          </div>

          {/* Right: REALTIME_TOPPING_STACK (Vertical bars) */}
          <div className="md:col-span-5 bg-[#0e0e0e] p-4 rounded-xl border border-[#353534]">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-dela text-[#ffe100]">コール盛り付け蓄積度</span>
              <span className="font-mono-code text-[10px] text-[#cec6aa] font-bold">REALTIME_TOPPING_STACK</span>
            </div>

            <div className="grid grid-cols-4 gap-2 h-36 items-end pb-2 border-b border-[#353534]">
              {/* Yasai Bar */}
              <div className="flex flex-col items-center h-full justify-end">
                <div
                  className="w-full bg-[#ffe100] rounded-t transition-all duration-300 shadow"
                  style={{ height: getYasaiHeight() }}
                />
                <span className="text-[10px] font-bold text-[#cec6aa] mt-1">野菜</span>
                <span className="text-[9px] font-dela text-[#ffe100]">{callSelection.yasai}</span>
              </div>

              {/* Garlic Bar */}
              <div className="flex flex-col items-center h-full justify-end">
                <div
                  className="w-full bg-[#ffb3ae] rounded-t transition-all duration-300 shadow"
                  style={{ height: getGarlicHeight() }}
                />
                <span className="text-[10px] font-bold text-[#cec6aa] mt-1">ニンニク</span>
                <span className="text-[9px] font-dela text-[#ffb3ae]">{callSelection.garlic}</span>
              </div>

              {/* Abura Bar */}
              <div className="flex flex-col items-center h-full justify-end">
                <div
                  className="w-full bg-[#e1c700] rounded-t transition-all duration-300 shadow"
                  style={{ height: getAburaHeight() }}
                />
                <span className="text-[10px] font-bold text-[#cec6aa] mt-1">アブラ</span>
                <span className="text-[9px] font-dela text-[#e1c700]">{callSelection.abura}</span>
              </div>

              {/* Karame Bar */}
              <div className="flex flex-col items-center h-full justify-end">
                <div
                  className="w-full bg-[#970015] rounded-t transition-all duration-300 shadow"
                  style={{ height: getKarameHeight() }}
                />
                <span className="text-[10px] font-bold text-[#cec6aa] mt-1">カラメ</span>
                <span className="text-[9px] font-dela text-[#ffdad7]">{callSelection.karame}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Remaining Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-mono-code font-bold mb-1">
            <span className="text-[#cec6aa]">TIME REMAINING (超速回答リミット)</span>
            <span className={timeRemaining < 1.0 ? 'text-[#ff5555] font-black animate-pulse' : 'text-[#ffe100]'}>
              {timeRemaining.toFixed(2)}s / 3.50s
            </span>
          </div>
          <div className="w-full h-3 bg-[#0e0e0e] rounded-full overflow-hidden border border-[#353534]">
            <div
              className={`h-full transition-all duration-75 ${
                timeRemaining < 1.0 ? 'bg-[#ff5555]' : 'bg-[#ffe100]'
              }`}
              style={{ width: `${(timeRemaining / 3.5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Spell Prompt Card */}
      <div className="bg-[#201f1f] border-4 border-[#353534] rounded-2xl p-6 sm:p-8 shadow-hard-xl mb-6 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#353534] gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-[#ffe100] text-[#0e0e0e] font-dela text-xs rounded shadow">
              SPELL #{String(spellIndex).padStart(2, '0')}
            </span>
            <span className="font-mono-code text-xs text-[#cec6aa] font-bold">
              JIRO_HIGH_SPEED_VOCAL_RECEPTOR
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono-code text-xs font-bold">
            <span className="text-[#cec6aa]">
              CPM: <strong className="text-[#ffe100]">{cpm}</strong>
            </span>
            <span className="text-[#cec6aa]">
              ACCURACY: <strong className="text-[#ffffff]">{accuracy}%</strong>
            </span>
            <span className="text-[#cec6aa]">
              COMBO: <strong className="text-[#ffb3ae]">{combo}</strong>
            </span>
          </div>
        </div>

        {/* Giant Prompt text */}
        <div className="my-6 text-center">
          <h1 className="font-dela text-2xl sm:text-4xl text-[#ffffff] tracking-wider leading-tight drop-shadow-[2px_2px_0_#000000]">
            {spellText}
          </h1>
          <p className="font-bold text-xs sm:text-sm text-[#cec6aa] mt-2 font-mplus">
            {kanjiText}
          </p>
        </div>

        {/* Keystroke Tracker Box */}
        <div className="bg-[#0e0e0e] border-2 border-[#353534] rounded-xl p-4 sm:p-6 shadow-inner text-center">
          <div className="flex items-center justify-between text-[11px] font-mono-code text-[#cec6aa] mb-2 font-bold">
            <span>KEYSTROKE TRACKER</span>
            <span>TAB: リセット / ESC: メニュー</span>
          </div>

          {/* Visual Letters with current highlight */}
          <div className="font-mono-code text-lg sm:text-2xl font-black tracking-widest my-3 flex items-center justify-center flex-wrap gap-1">
            {targetRomaji.split('').map((char, idx) => {
              const isSpace = char === ' ';
              if (isSpace) {
                return <span key={idx} className="w-3" />;
              }

              const charPos = runningLen;
              runningLen++;
              const isTyped = charPos < strippedTypedLen;
              const isCurrent = charPos === strippedTypedLen;

              if (isCurrent) {
                return (
                  <span
                    key={idx}
                    className="inline-block px-1.5 py-0.5 rounded bg-[#ffe100] text-[#0e0e0e] shadow-[0_0_10px_#ffe100] scale-110 font-black animate-pulse"
                  >
                    {char}
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
                <span key={idx} className="text-[#cec6aa]/70">
                  {char}
                </span>
              );
            })}
          </div>

          {/* Active Input form */}
          <div className="flex gap-2 mt-4 max-w-xl mx-auto">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#cec6aa] text-lg">
                keyboard
              </span>
              <input
                ref={inputRef}
                type="text"
                value={typedChars}
                onChange={handleInputChange}
                placeholder="ここにコールを打ち込め！（ローマ字入力）"
                className="w-full bg-[#1c1b1b] border-2 border-[#353534] focus:border-[#ffe100] text-[#ffffff] font-mono-code font-bold rounded-xl py-3 pl-10 pr-4 outline-none text-sm shadow-inner transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={handleResetCall}
              className="px-5 py-3 bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-sm rounded-xl shadow-hard-sm cursor-pointer whitespace-nowrap active:translate-y-0.5"
            >
              即答叫喚
            </button>
            <button
              type="button"
              onClick={handleToggleMic}
              title="マイク入力で叫ぶ"
              className={`px-3 py-3 rounded-xl border border-[#353534] font-dela text-sm cursor-pointer ${
                isListeningMic ? 'bg-[#970015] text-[#ffdad7] animate-pulse' : 'bg-[#2a2a2a] text-[#cec6aa] hover:bg-[#353534]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">mic</span>
            </button>
          </div>

          {/* Status response info */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 text-xs font-mono-code font-bold text-[#cec6aa]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ffe100] animate-ping" />
              キー入力待機中: ノーミスで称号「ロット主」確定
            </span>
            <span className="text-[#ffe100]">
              REACTIVE SPEED: {reactiveSpeed}
            </span>
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <div className="mt-4 p-3 bg-[#ffe100] text-[#0e0e0e] rounded-xl font-dela text-sm animate-bounce shadow">
              ⚡ 神速叫喚成功！店主にコールが伝わった！ (クリアタイム: {reactiveSpeed})
            </div>
          )}

          {/* Fail Banner */}
          {isFailed && (
            <div className="mt-4 p-3 bg-[#970015] text-[#ffdad7] rounded-xl font-dela text-sm shadow">
              ⚠️ コール猶予切れ！店主「迷ってんじゃねえ！ロット乱すぞ！」
            </div>
          )}
        </div>
      </div>

      {/* DOJO BUILDER: Custom Call Spell Builder */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#353534] mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#ffe100] text-[#0e0e0e] text-xs font-dela rounded">
              DOJO BUILDER
            </span>
            <h2 className="font-dela text-base sm:text-lg text-[#ffffff]">
              自作コール呪文ビルダー
            </h2>
          </div>
          <button
            type="button"
            onClick={handleRandomizeCall}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#353534] text-[#cec6aa] rounded-lg text-xs font-dela cursor-pointer border border-[#353534]"
          >
            <span className="material-symbols-outlined text-sm">casino</span>
            ランダム生成
          </button>
        </div>

        <p className="text-xs text-[#cec6aa] font-bold mb-4">
          自分好みの呪文を組み合わせてタイムアタック。最短0.9秒での完答を目指せ。
        </p>

        {/* 4 Selection Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Yasai */}
          <div className="bg-[#201f1f] p-3 rounded-lg border border-[#353534]">
            <span className="text-xs font-dela text-[#cec6aa] block mb-2">野菜（ヤサイ）</span>
            <div className="flex flex-col gap-1.5">
              {['マシマシ', 'マシ', '少なめ', '抜き'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setCallSelection({ ...callSelection, yasai: opt });
                    handleResetCall();
                  }}
                  className={`py-1.5 px-2 rounded text-xs font-dela transition-colors cursor-pointer text-left ${
                    callSelection.yasai === opt
                      ? 'bg-[#ffe100] text-[#0e0e0e] shadow'
                      : 'bg-[#2a2a2a] text-[#cec6aa] hover:bg-[#353534]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Garlic */}
          <div className="bg-[#201f1f] p-3 rounded-lg border border-[#353534]">
            <span className="text-xs font-dela text-[#cec6aa] block mb-2">大蒜（ニンニク）</span>
            <div className="flex flex-col gap-1.5">
              {['マシマシ', 'あり', '少なめ', '抜き'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setCallSelection({ ...callSelection, garlic: opt });
                    handleResetCall();
                  }}
                  className={`py-1.5 px-2 rounded text-xs font-dela transition-colors cursor-pointer text-left ${
                    callSelection.garlic === opt
                      ? 'bg-[#970015] text-[#ffdad7] shadow'
                      : 'bg-[#2a2a2a] text-[#cec6aa] hover:bg-[#353534]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Abura */}
          <div className="bg-[#201f1f] p-3 rounded-lg border border-[#353534]">
            <span className="text-xs font-dela text-[#cec6aa] block mb-2">背脂（アブラ）</span>
            <div className="flex flex-col gap-1.5">
              {['多め(塊)', 'マシ', '普通', '少なめ'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setCallSelection({ ...callSelection, abura: opt });
                    handleResetCall();
                  }}
                  className={`py-1.5 px-2 rounded text-xs font-dela transition-colors cursor-pointer text-left ${
                    callSelection.abura === opt
                      ? 'bg-[#ffe100] text-[#0e0e0e] shadow'
                      : 'bg-[#2a2a2a] text-[#cec6aa] hover:bg-[#353534]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Karame */}
          <div className="bg-[#201f1f] p-3 rounded-lg border border-[#353534]">
            <span className="text-xs font-dela text-[#cec6aa] block mb-2">味付（カラメ）</span>
            <div className="flex flex-col gap-1.5">
              {['カラメ', 'カラカラ', '普通', '薄味'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setCallSelection({ ...callSelection, karame: opt });
                    handleResetCall();
                  }}
                  className={`py-1.5 px-2 rounded text-xs font-dela transition-colors cursor-pointer text-left ${
                    callSelection.karame === opt
                      ? 'bg-[#ffe100] text-[#0e0e0e] shadow'
                      : 'bg-[#2a2a2a] text-[#cec6aa] hover:bg-[#353534]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VERDICT_RECORDS: Recent Call Verdicts & Titles */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#353534] mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffe100]">military_tech</span>
            <h2 className="font-dela text-base sm:text-lg text-[#ffffff]">
              直近のコール判定・称号獲得プレビュー
            </h2>
          </div>
          <span className="font-mono-code text-[10px] text-[#cec6aa] font-bold">
            VERDICT_RECORDS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {/* Card 1 */}
          <div className="bg-[#201f1f] p-4 rounded-xl border border-[#353534] flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ffe100] text-[#0e0e0e] font-dela flex items-center justify-center shrink-0 text-base shadow">
              神
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-dela text-sm text-[#e5e2e1]">神速の呪文</span>
                <span className="text-[10px] font-mono-code bg-[#0e0e0e] text-[#ffe100] px-1.5 py-0.5 rounded font-bold border border-[#ffe100]">SSR</span>
              </div>
              <p className="text-xs text-[#cec6aa] font-bold mt-1 leading-relaxed">
                コール要求から1.2秒以内で完全詠唱。店主も思わず目を張るスピード。
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#201f1f] p-4 rounded-xl border border-[#353534] flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#970015] text-[#ffdad7] font-dela flex items-center justify-center shrink-0 text-base shadow">
              主
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-dela text-sm text-[#e5e2e1]">ロット主の風格</span>
                <span className="text-[10px] font-mono-code bg-[#0e0e0e] text-[#ffb3ae] px-1.5 py-0.5 rounded font-bold border border-[#ffb3ae]">SR</span>
              </div>
              <p className="text-xs text-[#cec6aa] font-bold mt-1 leading-relaxed">
                同ロット6杯中、最速で回答を決め後続客の模範となった証。
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#201f1f] p-4 rounded-xl border border-[#353534] flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#353534] text-[#ffe100] font-dela flex items-center justify-center shrink-0 text-base shadow">
              舌
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-dela text-sm text-[#e5e2e1]">滑舌良し・ミスゼロ</span>
                <span className="text-[10px] font-mono-code bg-[#0e0e0e] text-[#cec6aa] px-1.5 py-0.5 rounded font-bold border border-[#4c4732]">RECORD</span>
              </div>
              <p className="text-xs text-[#cec6aa] font-bold mt-1 leading-relaxed">
                タイピング打鍵精度100%。一文字の噛みもなく店主の耳に届いた。
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleResetCall}
            className="w-full sm:w-auto px-6 py-3 bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-sm rounded-xl shadow-hard-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            もう一度コールする
          </button>
          <button
            type="button"
            onClick={onGoToLeaderboard}
            className="w-full sm:w-auto px-6 py-3 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-dela text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 border border-[#353534]"
          >
            <span className="material-symbols-outlined text-lg">leaderboard</span>
            全国コール番付へ記録送信
          </button>
          <span className="text-xs text-[#cec6aa] font-bold flex items-center gap-1.5 sm:ml-auto">
            <span className="material-symbols-outlined text-sm text-[#ffe100]">info</span>
            音声認識コール（マイク入力モード）は道場にて解禁・マイクでも叫べます！
          </span>
        </div>
      </div>
    </div>
  );
};
