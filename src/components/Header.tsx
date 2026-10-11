import React, { useState, useEffect } from 'react';
import { ScreenType } from '../types/game';
import { soundManager } from '../utils/audio';
import { MasterFace } from './JiroArt';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  bowlsCleared: number;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate, bowlsCleared }) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundManager.playKeyStroke();
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formattedCups = String(bowlsCleared).padStart(3, '0');

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0e0e0e] border-b-4 border-[#353534] shadow-[0_6px_0_#000000]">
      {/* Warning Top Marquee Banner */}
      <div className="bg-[#ffe100] text-[#0e0e0e] py-1 px-4 border-b-2 border-[#0e0e0e]">
        <div className="max-w-[920px] mx-auto flex items-center justify-between text-xs font-bold font-mplus">
          <span className="flex items-center gap-1.5 font-dela text-xs tracking-wider uppercase">
            <span className="material-symbols-outlined text-sm font-bold animate-pulse">warning</span>
            ロット乱し厳禁 ・ 私語厳禁
            <span className="material-symbols-outlined text-sm font-bold animate-pulse">warning</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-[10px] bg-[#0e0e0e] text-[#ffe100] px-2 py-0.5 rounded font-dela tracking-wider">
              JIRO-TYPING LEAGUE
            </span>
            <span className="text-[11px] font-bold">本日の営業: 昼の部 炎上中</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="h-20 max-w-[920px] mx-auto px-4 flex items-center justify-between gap-3">
        {/* Logo and Brand Title */}
        <div 
          className="flex items-center gap-3 shrink-0 cursor-pointer select-none"
          onClick={() => onNavigate('ticket-vending')}
        >
          <MasterFace mood="normal" className="h-10 w-10 rounded-full overflow-hidden bg-[#2a2018] ring-2 ring-[#ffe100]" />
          <div className="flex flex-col">
            <span className="font-dela text-lg text-[#ffe100] tracking-wider leading-none drop-shadow-[2px_2px_0_#000000]">
              マシマシ打
            </span>
            <span className="font-mono-code text-[9px] text-[#cec6aa] tracking-widest uppercase mt-0.5 font-bold">
              RAMEN COMBAT TYPER
            </span>
          </div>
        </div>

        {/* Center Screen Tabs */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-[#1c1b1b] rounded-lg border-2 border-[#353534]">
          <button
            type="button"
            onClick={() => onNavigate('ticket-vending')}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap text-sm cursor-pointer ${
              currentScreen === 'ticket-vending'
                ? 'bg-[#ffe100] text-[#0e0e0e] font-dela shadow-[0_3px_0_#000000]'
                : 'text-[#cec6aa] font-bold hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
            }`}
          >
            食券購入
          </button>
          <button
            type="button"
            onClick={() => onNavigate('typing-battle')}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap text-sm cursor-pointer ${
              currentScreen === 'typing-battle'
                ? 'bg-[#ffe100] text-[#0e0e0e] font-dela shadow-[0_3px_0_#000000]'
                : 'text-[#cec6aa] font-bold hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
            }`}
          >
            タイピング修行
          </button>
          <button
            type="button"
            onClick={() => onNavigate('call-master')}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap text-sm cursor-pointer ${
              currentScreen === 'call-master'
                ? 'bg-[#ffe100] text-[#0e0e0e] font-dela shadow-[0_3px_0_#000000]'
                : 'text-[#cec6aa] font-bold hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
            }`}
          >
            コール道場
          </button>
          <button
            type="button"
            onClick={() => onNavigate('leaderboard')}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap text-sm cursor-pointer ${
              currentScreen === 'leaderboard'
                ? 'bg-[#ffe100] text-[#0e0e0e] font-dela shadow-[0_3px_0_#000000]'
                : 'text-[#cec6aa] font-bold hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
            }`}
          >
            完飲番付
          </button>
          <button
            type="button"
            onClick={() => onNavigate('my-kitchen')}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap text-sm cursor-pointer ${
              currentScreen === 'my-kitchen'
                ? 'bg-[#ffe100] text-[#0e0e0e] font-dela shadow-[0_3px_0_#000000]'
                : 'text-[#cec6aa] font-bold hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
            }`}
          >
            マイ厨房
          </button>
        </nav>

        {/* Right Section Tools */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Bowl Counter */}
          <div className="hidden sm:flex items-center gap-2 bg-[#2a2a2a] border-2 border-[#353534] px-2.5 py-1 rounded shadow-inner">
            <span className="material-symbols-outlined text-[#ffe100] text-lg">ramen_dining</span>
            <div className="flex flex-col leading-none">
              <span className="text-[9px] text-[#cec6aa] font-bold">通算完飲</span>
              <span className="font-mono-code text-sm font-bold text-[#ffe100]">
                {formattedCups}
                <span className="text-xs font-bold text-[#e5e2e1] ml-0.5">杯</span>
              </span>
            </div>
          </div>

          {/* Sound & Screen Toggles */}
          <div className="flex items-center gap-1 bg-[#1c1b1b] p-1 rounded border border-[#353534]">
            <button
              aria-label="Sound FX Toggle"
              className="w-8 h-8 rounded flex items-center justify-center text-[#cec6aa] hover:text-[#e5e2e1] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              title={isMuted ? '効果音をONにする' : '効果音をOFFにする'}
              type="button"
              onClick={handleToggleSound}
            >
              <span className="material-symbols-outlined text-lg">
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>
            <button
              aria-label="Fullscreen Toggle"
              className="w-8 h-8 rounded flex items-center justify-center text-[#cec6aa] hover:text-[#e5e2e1] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              title="全画面表示切替"
              type="button"
              onClick={handleToggleFullscreen}
            >
              <span className="material-symbols-outlined text-lg">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>

          {/* Ninniku speech balloon & User Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#353534]">
            <div className="relative hidden md:block">
              <div className="bg-[#3a3939] text-[#e5e2e1] border border-[#ffe100] px-2.5 py-1 rounded-lg text-xs font-dela shadow-[2px_2px_0_#000000] whitespace-nowrap">
                ニンニク入れますか？
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-2 bg-[#3a3939] border-t border-r border-[#ffe100] rotate-45" />
              </div>
            </div>
            <div 
              className="relative group cursor-pointer"
              onClick={() => onNavigate('my-kitchen')}
              title="マイ厨房を開く"
            >
              <MasterFace mood="wait" className="w-8 h-8 rounded-full overflow-hidden bg-[#2a2018] ring-2 ring-[#ffe100] shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#970015] border border-[#0e0e0e] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Screen Tabs Bottom Bar */}
      <div className="lg:hidden flex items-center justify-around px-2 py-1.5 bg-[#1c1b1b] border-t border-[#353534] overflow-x-auto">
        <button
          onClick={() => onNavigate('ticket-vending')}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap cursor-pointer ${
            currentScreen === 'ticket-vending' ? 'bg-[#ffe100] text-[#0e0e0e] font-dela' : 'text-[#cec6aa]'
          }`}
        >
          食券購入
        </button>
        <button
          onClick={() => onNavigate('typing-battle')}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap cursor-pointer ${
            currentScreen === 'typing-battle' ? 'bg-[#ffe100] text-[#0e0e0e] font-dela' : 'text-[#cec6aa]'
          }`}
        >
          タイピング修行
        </button>
        <button
          onClick={() => onNavigate('call-master')}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap cursor-pointer ${
            currentScreen === 'call-master' ? 'bg-[#ffe100] text-[#0e0e0e] font-dela' : 'text-[#cec6aa]'
          }`}
        >
          コール道場
        </button>
        <button
          onClick={() => onNavigate('leaderboard')}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap cursor-pointer ${
            currentScreen === 'leaderboard' ? 'bg-[#ffe100] text-[#0e0e0e] font-dela' : 'text-[#cec6aa]'
          }`}
        >
          完飲番付
        </button>
        <button
          onClick={() => onNavigate('my-kitchen')}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap cursor-pointer ${
            currentScreen === 'my-kitchen' ? 'bg-[#ffe100] text-[#0e0e0e] font-dela' : 'text-[#cec6aa]'
          }`}
        >
          マイ厨房
        </button>
      </div>
    </header>
  );
};
