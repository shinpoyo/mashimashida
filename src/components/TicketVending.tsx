import React, { useState, useEffect } from 'react';
import { TicketDifficulty, CallOption } from '../types/game';
import { TICKET_CONFIGS, TOPPING_BUFFS } from '../data/phrases';
import { soundManager } from '../utils/audio';

interface TicketVendingProps {
  onStartGame: (difficulty: TicketDifficulty, toppings: string[], call: CallOption) => void;
}

export const TicketVending: React.FC<TicketVendingProps> = ({ onStartGame }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<TicketDifficulty>('sho');
  const [balance, setBalance] = useState<number>(1500);
  const [activeToppings, setActiveToppings] = useState<Set<string>>(new Set());
  const [issuedMessage, setIssuedMessage] = useState<string>('小ラーメン 発券完了 (麺量 300g)');
  const [showIssuedBadge, setShowIssuedBadge] = useState<boolean>(false);

  // Call settings
  const [callSettings, setCallSettings] = useState<CallOption>({
    garlic: 'normal',
    yasai: 'mashi',
    abura: 'mashi',
    karame: 'normal',
  });

  const currentConfig = TICKET_CONFIGS[selectedDifficulty];

  // Calculate total price
  const toppingsPrice = Array.from(activeToppings).reduce((acc, topId) => {
    const top = TOPPING_BUFFS.find((t) => t.id === topId);
    return acc + (top ? top.cost : 0);
  }, 0);
  const totalPrice = currentConfig.price + toppingsPrice;

  const handleSelectDifficulty = (diff: TicketDifficulty) => {
    setSelectedDifficulty(diff);
    const cfg = TICKET_CONFIGS[diff];
    soundManager.playKeyStroke();
    setIssuedMessage(`${cfg.name} 発券完了 (${cfg.noddle})`);
    setShowIssuedBadge(true);
    setTimeout(() => {
      setShowIssuedBadge(false);
    }, 2200);
  };

  const toggleTopping = (topId: string) => {
    soundManager.playKeyStroke();
    setActiveToppings((prev) => {
      const next = new Set(prev);
      if (next.has(topId)) {
        next.delete(topId);
      } else {
        next.add(topId);
      }
      return next;
    });
  };

  const handleInsertMoney = (amount: number) => {
    soundManager.playKeyStroke();
    setBalance((prev) => prev + amount);
  };

  const handleReturnLever = () => {
    soundManager.playKeyStroke();
    if (balance > 0) {
      setIssuedMessage(`おつり ¥${balance.toLocaleString()} を返却しました。`);
      setBalance(0);
    }
  };

  const handleStart = () => {
    soundManager.playCriticalHit();
    onStartGame(selectedDifficulty, Array.from(activeToppings), callSettings);
  };

  // Support global Enter key to launch into typing battle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDifficulty, activeToppings, callSettings]);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Marquee & Shop Announcement Strip */}
      <div className="w-full bg-[#0e0e0e] rounded-xl p-3 shadow-md mb-6 flex flex-col md:flex-row items-center justify-between gap-3 border border-[#353534]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center bg-[#970015] text-[#ffdad7] px-2.5 py-1 rounded text-xs font-dela tracking-wider uppercase animate-pulse">
            営業中
          </span>
          <span className="font-dela text-base sm:text-lg text-[#ffe100]">
            二郎直系 総本山タイピング道場
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-code text-[#cec6aa]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ffe100] animate-ping" />
            現在待ち: <strong className="text-[#e5e2e1] text-sm">7名 (第3ロット整列中)</strong>
          </span>
          <span className="hidden sm:inline text-[#4c4732]">/</span>
          <span className="text-[#cec6aa] font-bold">硬貨を入れてお好きな食券を押し込め！</span>
        </div>
      </div>

      {/* Main Dual Column: Physical Vending Machine UI & Bowl Spec Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT VENDING MACHINE CONSOLE (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-[#1c1b1b] rounded-xl p-4 sm:p-5 shadow-xl border-2 border-[#353534] relative overflow-hidden">
          {/* Vending Plate Header Badge */}
          <div className="bg-[#353534] rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffe100] text-2xl">confirmation_number</span>
              <div className="flex flex-col">
                <span className="font-dela text-base text-[#ffffff] tracking-wide">食券売機</span>
                <span className="font-mono-code text-[10px] text-[#cec6aa] tracking-widest font-bold">
                  AUTOMATIC TICKET VENDING SYSTEM
                </span>
              </div>
            </div>
            {/* Digital Credit Counter */}
            <div className="flex items-center gap-2 bg-[#0e0e0e] px-3 py-1.5 rounded-lg shadow-inner border border-[#4c4732]">
              <span className="font-mono-code text-[10px] text-[#cec6aa] font-bold">投入金額</span>
              <span className="font-mono-code text-xl text-[#ffe100] font-black">
                ¥ {balance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Instruction / Bill & Coin Slot Row */}
          <div className="grid grid-cols-3 gap-3 bg-[#201f1f] rounded-lg p-3 shadow-inner border border-[#353534]">
            {/* Coin Slot */}
            <div className="flex flex-col items-center justify-center p-2 rounded bg-[#2a2a2a] text-center border border-[#353534]">
              <span className="text-[10px] text-[#cec6aa] mb-1 font-bold">硬貨投入口</span>
              <div className="w-12 h-2 rounded-full bg-[#0e0e0e] my-1 shadow-inner border border-[#4c4732]" />
              <div className="flex items-center gap-1 font-mono-code text-[10px] text-[#e1c700] font-bold">
                <button
                  type="button"
                  onClick={() => handleInsertMoney(100)}
                  className="hover:underline cursor-pointer"
                  title="100円投入"
                >
                  +100
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => handleInsertMoney(500)}
                  className="hover:underline cursor-pointer"
                  title="500円投入"
                >
                  +500
                </button>
              </div>
            </div>

            {/* Bill Slot */}
            <div className="flex flex-col items-center justify-center p-2 rounded bg-[#2a2a2a] text-center border border-[#353534]">
              <span className="text-[10px] text-[#cec6aa] mb-1 font-bold">千円札挿入口</span>
              <div className="w-16 h-1.5 rounded-full bg-[#0e0e0e] my-1 shadow-inner border border-[#4c4732]" />
              <button
                type="button"
                onClick={() => handleInsertMoney(1000)}
                className="font-mono-code text-[10px] text-[#e1c700] font-bold hover:underline cursor-pointer"
                title="千円札投入"
              >
                1000円投入
              </button>
            </div>

            {/* Return Lever */}
            <button
              onClick={handleReturnLever}
              className="flex flex-col items-center justify-center p-2 rounded bg-[#353534] hover:bg-[#3a3939] transition-all shadow-md active:translate-y-0.5 text-center cursor-pointer border border-[#4c4732]"
              type="button"
            >
              <span className="text-[10px] text-[#cec6aa] mb-1 font-bold">返却レバー</span>
              <span className="material-symbols-outlined text-[#e5e2e1] text-lg">rotate_right</span>
              <span className="text-[10px] text-[#ffb4ab] font-bold">おつり</span>
            </button>
          </div>

          {/* Main Course Selection Section Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-xs text-[#cec6aa] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#ffe100] rounded-xs inline-block" />
              主食券（タイピング難易度選択）
            </span>
            <span className="text-xs font-bold text-[#ffb3ae]">※一人一杯厳守・ロット乱し禁止</span>
          </div>

          {/* 4 Primary Physical Ticket Push Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Button 1: Sho Ramen */}
            <div
              onClick={() => handleSelectDifficulty('sho')}
              className={`group relative flex flex-col justify-between p-3 rounded-lg cursor-pointer transition-all duration-150 shadow-md select-none border-2 ${
                selectedDifficulty === 'sho'
                  ? 'bg-[#353534] border-[#ffe100] shadow-[0_0_12px_rgba(255,225,0,0.3)] translate-y-0.5'
                  : 'bg-[#3a3939] border-[#4c4732] hover:bg-[#353534] hover:border-[#ffe100]'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-dela bg-[#ffe100] text-[#0e0e0e]">
                  青札・入門
                </span>
                <span className="font-mono-code text-lg text-[#ffe100] font-bold">¥850</span>
              </div>
              <div className="my-2">
                <h3 className="font-dela text-xl text-[#ffffff] leading-tight group-hover:text-[#ffe100] transition-colors">
                  小ラーメン
                </h3>
                <p className="text-xs text-[#cec6aa] mt-0.5 font-bold">
                  標準麺量300g / 100打完食
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono-code pt-1 text-[#cec6aa]">
                <span>推定目標: 2.0打/秒</span>
                <span className="text-[#ffe100] font-dela text-xs">食券押下 ▶</span>
              </div>
            </div>

            {/* Button 2: Dai Ramen */}
            <div
              onClick={() => handleSelectDifficulty('dai')}
              className={`group relative flex flex-col justify-between p-3 rounded-lg cursor-pointer transition-all duration-150 shadow-md select-none border-2 ${
                selectedDifficulty === 'dai'
                  ? 'bg-[#353534] border-[#ffe100] shadow-[0_0_12px_rgba(255,225,0,0.3)] translate-y-0.5'
                  : 'bg-[#3a3939] border-[#4c4732] hover:bg-[#353534] hover:border-[#ffe100]'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-dela bg-[#e1c700] text-[#0e0e0e]">
                  黄札・本番
                </span>
                <span className="font-mono-code text-lg text-[#ffe100] font-bold">¥950</span>
              </div>
              <div className="my-2">
                <h3 className="font-dela text-xl text-[#ffffff] leading-tight group-hover:text-[#ffe100] transition-colors">
                  大ラーメン
                </h3>
                <p className="text-xs text-[#cec6aa] mt-0.5 font-bold">
                  大盛450g / 300打耐久
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono-code pt-1 text-[#cec6aa]">
                <span>推定目標: 3.8打/秒</span>
                <span className="text-[#ffe100] font-dela text-xs">食券押下 ▶</span>
              </div>
            </div>

            {/* Button 3: Dai Buta Double */}
            <div
              onClick={() => handleSelectDifficulty('buta')}
              className={`group relative flex flex-col justify-between p-3 rounded-lg cursor-pointer transition-all duration-150 shadow-md select-none border-2 ${
                selectedDifficulty === 'buta'
                  ? 'bg-[#353534] border-[#ffb3ae] shadow-[0_0_12px_rgba(255,179,174,0.3)] translate-y-0.5'
                  : 'bg-[#3a3939] border-[#4c4732] hover:bg-[#353534] hover:border-[#ffb3ae]'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-dela bg-[#970015] text-[#ffdad7]">
                  赤札・肉増撃沈
                </span>
                <span className="font-mono-code text-lg text-[#ffe100] font-bold">¥1,150</span>
              </div>
              <div className="my-2">
                <h3 className="font-dela text-xl text-[#ffb3ae] leading-tight group-hover:text-[#ffdad7] transition-colors">
                  大豚ダブル
                </h3>
                <p className="text-xs text-[#cec6aa] mt-0.5 font-bold">
                  豚5枚極厚・600g / 500打怒涛
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono-code pt-1 text-[#cec6aa]">
                <span>推定目標: 5.2打/秒</span>
                <span className="text-[#ffdad7] font-dela text-xs">食券押下 ▶</span>
              </div>
            </div>

            {/* Button 4: Men Mashi Insane */}
            <div
              onClick={() => handleSelectDifficulty('insane')}
              className={`group relative flex flex-col justify-between p-3 rounded-lg cursor-pointer transition-all duration-150 shadow-md select-none border-2 ${
                selectedDifficulty === 'insane'
                  ? 'bg-[#353534] border-[#ff5555] shadow-[0_0_12px_rgba(255,85,85,0.4)] translate-y-0.5'
                  : 'bg-[#0e0e0e] border-[#4c4732] hover:bg-[#353534] hover:border-[#ff5555]'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-dela bg-[#93000a] text-[#ffdad6] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] animate-spin">warning</span>
                  黒札・完食者限定
                </span>
                <span className="font-mono-code text-lg text-[#ffb4ab] font-bold">¥1,300</span>
              </div>
              <div className="my-2">
                <h3 className="font-dela text-xl text-[#ffb4ab] leading-tight group-hover:text-[#ffdad6] transition-colors">
                  麺増し 撃沈必至
                </h3>
                <p className="text-xs text-[#cec6aa] mt-0.5 font-bold">
                  すり鉢1000g超 / エンドレス限界打
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono-code pt-1 text-[#cec6aa]">
                <span className="text-[#ffb4ab]">極限サドンデス</span>
                <span className="text-[#ffb4ab] font-dela text-xs">食券押下 ▶</span>
              </div>
            </div>
          </div>

          {/* Additional Toppings Small Tickets */}
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
                  onClick={() => toggleTopping(top.id)}
                  type="button"
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all shadow-sm active:scale-95 text-center cursor-pointer border ${
                    active
                      ? 'bg-[#ffe100] text-[#0e0e0e] border-[#ffe100] font-black'
                      : 'bg-[#201f1f] text-[#e5e2e1] border-[#353534] hover:bg-[#2a2a2a]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${active ? 'text-[#0e0e0e]' : 'text-[#ffe100]'}`}>
                    {top.icon}
                  </span>
                  <span className="font-dela text-xs mt-1">{top.name}</span>
                  <span className={`text-[10px] font-mono-code font-bold ${active ? 'text-[#211c00]' : 'text-[#cec6aa]'}`}>
                    {top.desc}
                  </span>
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
                <div className="text-[11px] font-bold text-[#cec6aa]">{issuedMessage}</div>
              </div>
            </div>
            {showIssuedBadge && (
              <div className="px-3 py-1 bg-[#ffe100] text-[#0e0e0e] font-dela text-xs rounded shadow-md animate-bounce">
                食券排出完了！
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION: BOWL PREVIEW, CALL SETTINGS & START BUTTON (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-[#1c1b1b] rounded-xl p-5 shadow-xl flex flex-col gap-4 border-2 border-[#353534]">
            {/* Header Mode Card */}
            <div className="flex items-center justify-between pb-2 border-b border-[#353534]">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#cec6aa] font-bold uppercase tracking-wider">
                  選択中の食券仕様
                </span>
                <h2 className="font-dela text-2xl text-[#ffe100] leading-tight">
                  {currentConfig.name}
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#353534] text-[#ffffff] font-mono-code text-sm font-bold border border-[#4c4732]">
                {currentConfig.noddle}
              </span>
            </div>

            {/* Ramen Image Container */}
            <div className="relative w-full h-52 sm:h-56 rounded-xl overflow-hidden shadow-md group border border-[#353534]">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt="Colossal Jiro style ramen bowl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOmwEvA5fk_Y6WaIrAIt5fbOmQglfgR1nPp_FjwH6YAjnAAPUA1Gy1l2tQZm2yS8k0nPTabgfJBlhp3wFEMLnvJSe22YXokcRf5GTpmHTaTJz0ctZJahNbEC-5CZ8-uKF7GTLxQhljLjLhADZmACURegEQYzw9ux5iXAoIAga8E4jXCiNgkUWwqWVEIO8Qrc1xl6t_rtG_GqaEULYEPXePpmoaXhWa07tXTioQPYxXOW7VOTjXXae-"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent opacity-90" />
              
              {/* Floating Chef Call Prompt Badge */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#0e0e0e]/90 backdrop-blur-sm p-2.5 rounded-lg border border-[#353534]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffb3ae] text-lg">psychology_alt</span>
                  <span className="text-xs font-dela text-[#e5e2e1]">
                    店主の目線: <span className="text-[#ffe100]">{currentConfig.chefNote}</span>
                  </span>
                </div>
                <span className="font-mono-code text-xs text-[#ffe100] font-bold">
                  {currentConfig.speedTarget}
                </span>
              </div>
            </div>

            {/* Spec Breakdown Meter Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-[#201f1f] p-2.5 rounded-lg text-center shadow-sm border border-[#353534]">
                <span className="text-[10px] text-[#cec6aa] block font-bold">規定タイピング</span>
                <span className="font-mono-code text-lg text-[#ffffff] font-black">
                  {currentConfig.keystrokes}打
                </span>
              </div>
              <div className="bg-[#201f1f] p-2.5 rounded-lg text-center shadow-sm border border-[#353534]">
                <span className="text-[10px] text-[#cec6aa] block font-bold">制限時間</span>
                <span className="font-mono-code text-lg text-[#ffb3ae] font-black">
                  {currentConfig.timeLimit}秒
                </span>
              </div>
              <div className="bg-[#201f1f] p-2.5 rounded-lg text-center shadow-sm border border-[#353534]">
                <span className="text-[10px] text-[#cec6aa] block font-bold">合計金額</span>
                <span className="font-mono-code text-lg text-[#ffe100] font-black">
                  ¥{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Pre-Call Topping Selector */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-bold text-[#cec6aa] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#ffe100]">restaurant</span>
                事前コール設定（ゲーム中に出現する呪文）
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {/* Garlic */}
                <label className="flex items-center justify-between p-2 rounded-lg bg-[#201f1f] border border-[#353534]">
                  <span className="text-[#e5e2e1]">ニンニク</span>
                  <select
                    value={callSettings.garlic}
                    onChange={(e) => setCallSettings({ ...callSettings, garlic: e.target.value })}
                    className="bg-[#0e0e0e] text-[#ffe100] font-dela text-xs rounded px-2 py-1 outline-none border border-[#4c4732]"
                  >
                    <option value="none">抜き</option>
                    <option value="normal">ニンニク</option>
                    <option value="mashi">マシ</option>
                    <option value="mashimashi">マシマシ</option>
                  </select>
                </label>

                {/* Yasai */}
                <label className="flex items-center justify-between p-2 rounded-lg bg-[#201f1f] border border-[#353534]">
                  <span className="text-[#e5e2e1]">ヤサイ</span>
                  <select
                    value={callSettings.yasai}
                    onChange={(e) => setCallSettings({ ...callSettings, yasai: e.target.value })}
                    className="bg-[#0e0e0e] text-[#ffe100] font-dela text-xs rounded px-2 py-1 outline-none border border-[#4c4732]"
                  >
                    <option value="normal">普通</option>
                    <option value="mashi">ヤサイマシ</option>
                    <option value="mashimashi">マシマシ</option>
                  </select>
                </label>

                {/* Abura */}
                <label className="flex items-center justify-between p-2 rounded-lg bg-[#201f1f] border border-[#353534]">
                  <span className="text-[#e5e2e1]">アブラ</span>
                  <select
                    value={callSettings.abura}
                    onChange={(e) => setCallSettings({ ...callSettings, abura: e.target.value })}
                    className="bg-[#0e0e0e] text-[#ffe100] font-dela text-xs rounded px-2 py-1 outline-none border border-[#4c4732]"
                  >
                    <option value="normal">普通</option>
                    <option value="mashi">アブラマシ</option>
                    <option value="katamari">黒アブラ塊</option>
                  </select>
                </label>

                {/* Karame */}
                <label className="flex items-center justify-between p-2 rounded-lg bg-[#201f1f] border border-[#353534]">
                  <span className="text-[#e5e2e1]">カラメ</span>
                  <select
                    value={callSettings.karame}
                    onChange={(e) => setCallSettings({ ...callSettings, karame: e.target.value })}
                    className="bg-[#0e0e0e] text-[#ffe100] font-dela text-xs rounded px-2 py-1 outline-none border border-[#4c4732]"
                  >
                    <option value="normal">普通</option>
                    <option value="karame">カラメ</option>
                    <option value="karakara">辛辛極濃</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Big Yellow CTA Button */}
            <button
              onClick={handleStart}
              type="button"
              className="group mt-2 w-full py-4 px-6 rounded-xl bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-lg text-center tracking-wider transition-all duration-150 shadow-hard-lg active:translate-y-1 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl group-hover:animate-bounce">sports_kabaddi</span>
              <span>食券を握りしめて着席！修行開始</span>
              <span className="material-symbols-outlined text-2xl">arrow_forward</span>
            </button>

            {/* Subtext warning */}
            <p className="text-center text-[11px] font-bold text-[#cec6aa]">
              ※Enterキーでも入店できます。ロット遅延によるロット乱しは店主の激怒トリガーとなります。
            </p>
          </div>

          {/* Quick Tips Box */}
          <div className="bg-[#0e0e0e] rounded-xl p-4 shadow-md flex items-start gap-3 border border-[#353534]">
            <span className="material-symbols-outlined text-[#ffe100] text-2xl mt-0.5">tips_and_updates</span>
            <div className="flex flex-col text-xs font-bold">
              <span className="font-dela text-[#e5e2e1] mb-0.5">二郎打（マシマシ打）の鉄則:</span>
              <p className="text-[#cec6aa] leading-relaxed">
                注文コール「ニンニクヤサイマシアブラカラメ」を噛まずにミスタイプなしで撃ち込むと「天地返し」ゲージが最大化。麺が伸びる前に打ち切るべし！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
