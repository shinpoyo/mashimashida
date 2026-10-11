import React from 'react';
import { ScreenType } from '../types/game';

interface FooterProps {
  onNavigate: (screen: ScreenType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#0e0e0e] border-t-4 border-[#353534] mt-12 py-8 text-[#cec6aa]">
      <div className="max-w-[920px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-2">
            <span className="font-dela text-lg text-[#ffe100]">マシマシ打</span>
            <span className="font-mono-code text-[11px] text-[#cec6aa] border border-[#4c4732] px-1.5 py-0.5 rounded font-bold">
              VER 0.3.0
            </span>
          </div>
          <p className="text-xs text-[#cec6aa] mt-1 text-center md:text-left font-bold font-mplus">
            背脂・ニンニク・カラメ・ヤサイ。タイピング速度で極太麺を啜り尽くせ。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold font-mplus">
          <button
            onClick={() => onNavigate('ticket-vending')}
            className="hover:text-[#ffe100] transition-colors cursor-pointer"
          >
            食券売場
          </button>
          <button
            onClick={() => onNavigate('leaderboard')}
            className="hover:text-[#ffe100] transition-colors cursor-pointer"
          >
            完飲番付
          </button>
        </div>
      </div>
      <div className="max-w-[920px] mx-auto px-4 mt-6 text-[11px] leading-relaxed text-[#979177] font-bold font-mplus">
        <p>
          ※本作は非公式のファンメイド作品であり、実在の店舗・団体とは一切関係ありません。コールの呼び方やルールは店舗ごとに異なります。実際のお店では各店のルールに従いましょう。
        </p>
        <p>※店主・ラーメンの写真は AI で生成した画像で、実在の人物・店舗ではありません。</p>
        <p className="font-mono-code mt-1">© 2026 shinpoyo. All rights reserved. 無断転載・改変・再配布を禁じます。</p>
      </div>
    </footer>
  );
};
