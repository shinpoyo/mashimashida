import React, { useState, useEffect } from 'react';
import { GameMode, GameSettings, PenaltyId, UserStats } from '../types/game';
import { TICKET_CONFIGS, PENALTY_RULES, PENALTY_BY_ID, MODE_ORDER } from '../data/shop';
import { MODES } from '../engine/calls';
import { soundManager } from '../utils/audio';
import { TicketPhoto } from './JiroArt';

interface TicketVendingProps {
  initialSettings: GameSettings;
  bestScores: UserStats['bestScores'];
  onStartGame: (settings: GameSettings) => void;
  /** false の間（修行ポップアップ表示中）はキー操作を受け付けない */
  active: boolean;
}

const TONE_STYLES = {
  yellow: { badge: 'bg-[#ffe100] text-[#0e0e0e]', name: 'text-[#ffffff]', price: 'text-[#ffe100]', on: 'border-[#ffe100] shadow-[0_0_12px_rgba(255,225,0,0.3)]', hover: 'hover:border-[#ffe100]', bg: 'bg-[#3a3939]' },
  gold: { badge: 'bg-[#e1c700] text-[#0e0e0e]', name: 'text-[#ffffff]', price: 'text-[#ffe100]', on: 'border-[#ffe100] shadow-[0_0_12px_rgba(255,225,0,0.3)]', hover: 'hover:border-[#ffe100]', bg: 'bg-[#3a3939]' },
  red: { badge: 'bg-[#970015] text-[#ffdad7]', name: 'text-[#ffb3ae]', price: 'text-[#ffe100]', on: 'border-[#ffb3ae] shadow-[0_0_12px_rgba(255,179,174,0.3)]', hover: 'hover:border-[#ffb3ae]', bg: 'bg-[#3a3939]' },
  black: { badge: 'bg-[#93000a] text-[#ffdad6]', name: 'text-[#ffb4ab]', price: 'text-[#ffb4ab]', on: 'border-[#ff5555] shadow-[0_0_12px_rgba(255,85,85,0.4)]', hover: 'hover:border-[#ff5555]', bg: 'bg-[#0e0e0e]' },
} as const;

export const TicketVending: React.FC<TicketVendingProps> = ({ initialSettings, bestScores, onStartGame, active }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialSettings.mode);
  const [penalty, setPenalty] = useState<PenaltyId>(initialSettings.penalty);
  const [issuedMessage, setIssuedMessage] = useState<string>(`${TICKET_CONFIGS[initialSettings.mode].name} を選択中`);
  const [showIssuedBadge, setShowIssuedBadge] = useState<boolean>(false);

  const currentConfig = TICKET_CONFIGS[selectedMode];
  const mode = MODES[selectedMode];
  const rule = PENALTY_BY_ID[penalty];

  const handleSelectMode = (m: GameMode) => {
    setSelectedMode(m);
    const cfg = TICKET_CONFIGS[m];
    soundManager.ticketSelect();
    setIssuedMessage(`${cfg.name} の食券ボタンを押下 (${cfg.noddle})`);
    setShowIssuedBadge(true);
    setTimeout(() => setShowIssuedBadge(false), 2200);
  };

  const handleStart = () => {
    soundManager.ticketIssue();
    onStartGame({ mode: selectedMode, penalty });
  };

  // キーボード: 数字キーで食券選択、Enter で着席
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const idx = Number(e.key) - 1;
      if (Number.isInteger(idx) && idx >= 0 && idx < MODE_ORDER.length) {
        handleSelectMode(MODE_ORDER[idx]);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMode, penalty, active]);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* 開始バー：画面を開いてすぐ見える位置に置く */}
      <div
        id="startBar"
        className="w-full bg-[#1c1b1b] rounded-xl p-3 sm:p-4 shadow-hard-lg mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-4 border-2 border-[#ffe100]"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <TicketPhoto mode={selectedMode} className="w-20 h-14 rounded-lg border border-[#353534] shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-[#cec6aa] font-bold block">選択中の食券</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-dela text-xl text-[#ffe100] leading-tight">{currentConfig.name}</span>
              <span className="text-xs font-bold text-[#e5e2e1]">
                {mode.lots}ロット ／ 退店ペナルティ「{rule.name}」 ／ スコア×{rule.scoreRate.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleStart}
          type="button"
          id="startBtn"
          className="group shrink-0 py-3.5 px-6 rounded-xl bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-lg tracking-wider transition-all duration-150 shadow-hard-lg active:translate-y-1 flex items-center justify-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl group-hover:animate-bounce">sports_kabaddi</span>
          <span>着席して修行開始（Enter）</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT VENDING MACHINE CONSOLE (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-[#1c1b1b] rounded-xl p-4 sm:p-5 shadow-xl border-2 border-[#353534] relative overflow-hidden">
          <div className="bg-[#353534] rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffe100] text-2xl">confirmation_number</span>
              <div className="flex flex-col">
                <span className="font-dela text-base text-[#ffffff] tracking-wide">食券売機</span>
                <span className="font-mono-code text-[10px] text-[#cec6aa] tracking-widest font-bold">AUTOMATIC TICKET VENDING SYSTEM</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#cec6aa] hidden sm:inline">
              キー <kbd className="kbd">1</kbd>〜<kbd className="kbd">{MODE_ORDER.length}</kbd> で選択
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-xs text-[#cec6aa] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#ffe100] rounded-xs inline-block" />
              主食券（タイピング難易度選択）
            </span>
            <span className="text-xs font-bold text-[#ffb3ae]">※一人一杯厳守・ロット乱し禁止</span>
          </div>

          <div className="flex flex-col gap-3">
            {MODE_ORDER.map((m, i) => {
              const t = TICKET_CONFIGS[m];
              const s = TONE_STYLES[t.tone];
              const selected = selectedMode === m;
              const best = bestScores[m];
              return (
                <div
                  key={m}
                  data-mode={m}
                  onClick={() => handleSelectMode(m)}
                  className={`group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 p-3 rounded-lg cursor-pointer transition-all duration-150 shadow-md select-none border-2 ${
                    selected ? `bg-[#353534] ${s.on}` : `${s.bg} border-[#4c4732] hover:bg-[#353534] ${s.hover}`
                  }`}
                >
                  <span className="w-8 h-8 rounded bg-[#0e0e0e] border border-[#4c4732] text-[#ffe100] font-dela text-sm flex items-center justify-center">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-dela text-xl leading-tight ${s.name}`}>{t.name}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-dela ${s.badge}`}>{t.badge}</span>
                    </div>
                    <p className="text-xs text-[#cec6aa] mt-0.5 font-bold">
                      {t.noddle} / {t.desc}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`block font-mono-code text-lg font-bold ${s.price}`}>¥{t.price.toLocaleString()}</span>
                    <span className={`block text-[11px] font-mono-code font-bold whitespace-nowrap ${best ? 'text-[#ffe100]' : 'text-[#cec6aa]'}`}>
                      {best ? `ベスト ${best.score}` : '未挑戦'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ticket Dispenser Tray */}
          <div className="bg-[#0e0e0e] rounded-lg p-3 shadow-inner flex items-center justify-between border border-[#353534]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#201f1f] flex items-center justify-center text-[#ffe100] shadow-sm">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <div>
                <div className="font-dela text-xs text-[#e5e2e1]">発券トレイ</div>
                <div className="text-[11px] font-bold text-[#cec6aa]" id="issuedMessage">{issuedMessage}</div>
              </div>
            </div>
            {showIssuedBadge && (
              <div className="px-3 py-1 bg-[#ffe100] text-[#0e0e0e] font-dela text-xs rounded shadow-md animate-bounce">食券排出完了！</div>
            )}
          </div>
        </div>

        {/* RIGHT: BOWL PREVIEW & PENALTY */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-[#1c1b1b] rounded-xl p-5 shadow-xl flex flex-col gap-4 border-2 border-[#353534]">
            <div className="flex items-center justify-between pb-2 border-b border-[#353534]">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#cec6aa] font-bold uppercase tracking-wider">選択中の食券仕様</span>
                <h2 className="font-dela text-2xl text-[#ffe100] leading-tight">{currentConfig.name}</h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#353534] text-[#ffffff] font-mono-code text-sm font-bold border border-[#4c4732]">
                {currentConfig.noddle}
              </span>
            </div>

            {/* 食券ごとのラーメン写真 */}
            <div className="relative w-full h-52 sm:h-56 rounded-xl overflow-hidden shadow-md group border border-[#353534]">
              <TicketPhoto key={selectedMode} mode={selectedMode} className="w-full h-full animate-fade-in" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent opacity-90 pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#0e0e0e]/90 backdrop-blur-sm p-2.5 rounded-lg border border-[#353534]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffb3ae] text-lg">psychology_alt</span>
                  <span className="text-xs font-dela text-[#e5e2e1]">
                    店主の目線: <span className="text-[#ffe100]">{currentConfig.chefNote}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-[#201f1f] p-2.5 rounded-lg text-center shadow-sm border border-[#353534]">
                <span className="text-[10px] text-[#cec6aa] block font-bold">ロット数</span>
                <span className="font-mono-code text-lg text-[#ffffff] font-black">{mode.lots}杯</span>
              </div>
              <div className="bg-[#201f1f] p-2.5 rounded-lg text-center shadow-sm border border-[#353534]">
                <span className="text-[10px] text-[#cec6aa] block font-bold">コール順</span>
                <span className="font-mono-code text-lg text-[#ffb3ae] font-black">{currentConfig.speedTarget}</span>
              </div>
              <div className="bg-[#201f1f] p-2.5 rounded-lg text-center shadow-sm border border-[#353534]">
                <span className="text-[10px] text-[#cec6aa] block font-bold">スコア倍率</span>
                <span className="font-mono-code text-lg text-[#ffe100] font-black">×{rule.scoreRate.toFixed(2)}</span>
              </div>
            </div>

            {/* Exit Penalty Selector */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-bold text-[#cec6aa] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#ffb3ae]">gavel</span>
                退店ペナルティ（店主の厳しさ）
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PENALTY_RULES.map((p) => {
                  const on = penalty === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-penalty={p.id}
                      onClick={() => {
                        soundManager.uiClick();
                        setPenalty(p.id);
                      }}
                      className={`flex flex-col items-start p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        on ? 'bg-[#970015] border-[#ffb3ae] text-[#ffdad7]' : 'bg-[#201f1f] border-[#353534] text-[#e5e2e1] hover:bg-[#2a2a2a]'
                      }`}
                    >
                      <span className="flex w-full items-center justify-between">
                        <span className="font-dela text-xs">{p.name}</span>
                        <span className={`font-mono-code text-[10px] font-bold ${on ? 'text-[#ffe100]' : 'text-[#cec6aa]'}`}>×{p.scoreRate.toFixed(1)}</span>
                      </span>
                      <span className={`text-[10px] font-bold leading-tight mt-0.5 ${on ? 'text-[#ffdad7]' : 'text-[#cec6aa]'}`}>{p.desc}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#cec6aa] font-bold">※厳しいほどスコア倍率アップ。IME はオフ（半角英数）にしてください。</p>
            </div>
          </div>

          {/* Glossary */}
          <details className="bg-[#0e0e0e] rounded-xl p-4 shadow-md border border-[#353534] text-xs font-bold group">
            <summary className="font-dela text-[#e5e2e1] cursor-pointer flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffe100]">menu_book</span>
              コール用語集
            </summary>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-3 text-[#cec6aa]">
              <dt className="text-[#ffe100]">ヤサイ</dt><dd>茹でたモヤシとキャベツ</dd>
              <dt className="text-[#ffe100]">ニンニク</dt><dd>刻みニンニク</dd>
              <dt className="text-[#ffe100]">アブラ</dt><dd>背脂</dd>
              <dt className="text-[#ffe100]">カラメ</dt><dd>カエシ追加で味濃いめ</dd>
              <dt className="text-[#ffe100]">マシ〜マシ×6</dt><dd>増量の段階</dd>
              <dt className="text-[#ffe100]">チョモランマ</dt><dd>限界突破盛り</dd>
              <dt className="text-[#ffe100]">スクナメ</dt><dd>少なめ</dd>
              <dt className="text-[#ffe100]">全マシ</dt><dd>全トッピングをマシ</dd>
              <dt className="text-[#ffe100]">そのままで</dt><dd>トッピングなし</dd>
            </dl>
            <p className="mt-2 text-[#cec6aa]">ローマ字は shi/si・tsu/tu・nn/n・っ（子音重ね/ltu）など一般的な表記に対応。</p>
          </details>
        </div>
      </div>
    </div>
  );
};
