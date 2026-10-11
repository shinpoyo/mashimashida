import React, { useState, useEffect } from 'react';
import { GameMode, GameSettings, PenaltyId, UserStats } from '../types/game';
import { TICKET_CONFIGS, TOPPING_BUFFS, PENALTY_RULES, PENALTY_BY_ID, MODE_ORDER, toppingValue } from '../data/shop';
import { MODES } from '../engine/calls';
import { soundManager } from '../utils/audio';
import { RamenPhoto } from './JiroArt';

interface TicketVendingProps {
  initialSettings: GameSettings;
  bestScores: UserStats['bestScores'];
  onStartGame: (settings: GameSettings) => void;
}

const TONE_STYLES = {
  yellow: { badge: 'bg-[#ffe100] text-[#0e0e0e]', name: 'text-[#ffffff]', price: 'text-[#ffe100]', on: 'border-[#ffe100] shadow-[0_0_12px_rgba(255,225,0,0.3)]', hover: 'hover:border-[#ffe100]', bg: 'bg-[#3a3939]' },
  gold: { badge: 'bg-[#e1c700] text-[#0e0e0e]', name: 'text-[#ffffff]', price: 'text-[#ffe100]', on: 'border-[#ffe100] shadow-[0_0_12px_rgba(255,225,0,0.3)]', hover: 'hover:border-[#ffe100]', bg: 'bg-[#3a3939]' },
  red: { badge: 'bg-[#970015] text-[#ffdad7]', name: 'text-[#ffb3ae]', price: 'text-[#ffe100]', on: 'border-[#ffb3ae] shadow-[0_0_12px_rgba(255,179,174,0.3)]', hover: 'hover:border-[#ffb3ae]', bg: 'bg-[#3a3939]' },
  black: { badge: 'bg-[#93000a] text-[#ffdad6]', name: 'text-[#ffb4ab]', price: 'text-[#ffb4ab]', on: 'border-[#ff5555] shadow-[0_0_12px_rgba(255,85,85,0.4)]', hover: 'hover:border-[#ff5555]', bg: 'bg-[#0e0e0e]' },
} as const;

export const TicketVending: React.FC<TicketVendingProps> = ({ initialSettings, bestScores, onStartGame }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialSettings.mode);
  const [activeToppings, setActiveToppings] = useState<Set<string>>(new Set(initialSettings.toppings));
  const [penalty, setPenalty] = useState<PenaltyId>(initialSettings.penalty);
  const [issuedMessage, setIssuedMessage] = useState<string>(`${TICKET_CONFIGS[initialSettings.mode].name} を選択中`);
  const [showIssuedBadge, setShowIssuedBadge] = useState<boolean>(false);

  const currentConfig = TICKET_CONFIGS[selectedMode];
  const mode = MODES[selectedMode];
  const rule = PENALTY_BY_ID[penalty];

  // 魚粉（スコア倍率）× 退店ペナルティ倍率
  const scoreMult = (toppingValue(Array.from(activeToppings), 'score_multiplier') || 1) * rule.scoreRate;

  const handleSelectMode = (m: GameMode) => {
    setSelectedMode(m);
    const cfg = TICKET_CONFIGS[m];
    soundManager.ticketSelect();
    setIssuedMessage(`${cfg.name} の食券ボタンを押下 (${cfg.noddle})`);
    setShowIssuedBadge(true);
    setTimeout(() => setShowIssuedBadge(false), 2200);
  };

  const toggleTopping = (topId: string) => {
    soundManager.uiClick();
    setActiveToppings((prev) => {
      const next = new Set(prev);
      if (next.has(topId)) next.delete(topId);
      else next.add(topId);
      return next;
    });
  };

  const handleStart = () => {
    soundManager.ticketIssue();
    onStartGame({ mode: selectedMode, toppings: Array.from(activeToppings), penalty });
  };

  // キーボード: 1〜4 で食券選択、Enter で着席
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx >= 0) {
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
  }, [selectedMode, activeToppings, penalty]);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Marquee & Shop Announcement Strip */}
      <div className="w-full bg-[#0e0e0e] rounded-xl p-3 shadow-md mb-6 flex flex-col md:flex-row items-center justify-between gap-3 border border-[#353534]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center bg-[#970015] text-[#ffdad7] px-2.5 py-1 rounded text-xs font-dela tracking-wider uppercase animate-pulse">
            営業中
          </span>
          <span className="font-dela text-base sm:text-lg text-[#ffe100]">二郎直系 総本山タイピング道場</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-code text-[#cec6aa]">
          <span className="text-[#cec6aa] font-bold">
            キー <kbd className="kbd">1</kbd>〜<kbd className="kbd">4</kbd> で食券選択 / <kbd className="kbd">Enter</kbd> で着席
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT VENDING MACHINE CONSOLE (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-[#1c1b1b] rounded-xl p-4 sm:p-5 shadow-xl border-2 border-[#353534] relative overflow-hidden">
          {/* Vending Plate Header Badge */}
          <div className="bg-[#353534] rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffe100] text-2xl">confirmation_number</span>
              <div className="flex flex-col">
                <span className="font-dela text-base text-[#ffffff] tracking-wide">食券売機</span>
                <span className="font-mono-code text-[10px] text-[#cec6aa] tracking-widest font-bold">AUTOMATIC TICKET VENDING SYSTEM</span>
              </div>
            </div>
          </div>

          {/* Main Course Selection */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-xs text-[#cec6aa] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#ffe100] rounded-xs inline-block" />
              主食券（タイピング難易度選択）
            </span>
            <span className="text-xs font-bold text-[#ffb3ae]">※一人一杯厳守・ロット乱し禁止</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className={`group relative flex flex-col justify-between p-3 rounded-lg cursor-pointer transition-all duration-150 shadow-md select-none border-2 ${
                    selected ? `bg-[#353534] ${s.on} translate-y-0.5` : `${s.bg} border-[#4c4732] hover:bg-[#353534] ${s.hover}`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-dela ${s.badge}`}>{t.badge}</span>
                    <span className={`font-mono-code text-lg font-bold ${s.price}`}>¥{t.price.toLocaleString()}</span>
                  </div>
                  <div className="my-2">
                    <h3 className={`font-dela text-xl leading-tight transition-colors ${s.name}`}>{t.name}</h3>
                    <p className="text-xs text-[#cec6aa] mt-0.5 font-bold">
                      {t.noddle} / {t.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono-code pt-1 text-[#cec6aa]">
                    <span className={best ? 'text-[#ffe100]' : ''}>{best ? `自己ベスト ${best.score}` : '未挑戦'}</span>
                    <span className="text-[#ffe100] font-dela text-xs">[{i + 1}] 食券押下 ▶</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Topping Tickets */}
          <div className="flex items-center justify-between pt-2">
            <span className="font-bold text-xs text-[#cec6aa] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#ffb3ae] rounded-xs inline-block" />
              追加トッピング小券（バフ・特殊効果）
            </span>
            <span className="text-[10px] font-bold text-[#cec6aa] font-mono-code">複数選択可</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TOPPING_BUFFS.map((top) => {
              const active = activeToppings.has(top.id);
              return (
                <button
                  key={top.id}
                  data-topping={top.id}
                  onClick={() => toggleTopping(top.id)}
                  type="button"
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all shadow-sm active:scale-95 text-center cursor-pointer border ${
                    active ? 'bg-[#ffe100] text-[#0e0e0e] border-[#ffe100] font-black' : 'bg-[#201f1f] text-[#e5e2e1] border-[#353534] hover:bg-[#2a2a2a]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${active ? 'text-[#0e0e0e]' : 'text-[#ffe100]'}`}>{top.icon}</span>
                  <span className="font-dela text-xs mt-1">{top.name}</span>
                  <span className={`text-[10px] font-mono-code font-bold ${active ? 'text-[#211c00]' : 'text-[#ffe100]'}`}>+¥{top.cost}</span>
                  <span className={`text-[10px] font-bold leading-tight ${active ? 'text-[#211c00]' : 'text-[#cec6aa]'}`}>{top.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Ticket Dispenser Tray */}
          <div className="mt-2 bg-[#0e0e0e] rounded-lg p-3 shadow-inner flex items-center justify-between border border-[#353534]">
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

        {/* RIGHT: BOWL PREVIEW, PENALTY & START */}
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

            {/* Ramen Image Container */}
            <div className="relative w-full h-52 sm:h-56 rounded-xl overflow-hidden shadow-md group border border-[#353534]">
              <RamenPhoto className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent opacity-90" />
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
                <span className="font-mono-code text-lg text-[#ffe100] font-black">×{scoreMult.toFixed(2)}</span>
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
              <p className="text-[10px] text-[#cec6aa] font-bold">※厳しいほどスコア倍率アップ（現在 ×{rule.scoreRate.toFixed(1)}）</p>
            </div>

            <button
              onClick={handleStart}
              type="button"
              id="startBtn"
              className="group mt-2 w-full py-4 px-6 rounded-xl bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-lg text-center tracking-wider transition-all duration-150 shadow-hard-lg active:translate-y-1 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl group-hover:animate-bounce">sports_kabaddi</span>
              <span>食券を握りしめて着席！修行開始</span>
              <span className="material-symbols-outlined text-2xl">arrow_forward</span>
            </button>

            <p className="text-center text-[11px] font-bold text-[#cec6aa]">
              ※Enterキーでも入店できます。IMEはオフ（半角英数）にしてください。
            </p>
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
