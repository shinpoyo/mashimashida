import React, { useEffect, useRef } from 'react';
import { ChefPhoto, RamenPhoto } from './JiroArt';

export interface RuleRow {
  label: string;
  value: React.ReactNode;
  /** 補足（小さく表示） */
  note?: string;
  tone?: 'normal' | 'warn';
}

interface RuleIntroProps {
  /** 画面名（タイピング修行・コール道場） */
  eyebrow: string;
  title: string;
  /** 店主のひとこと */
  chefLine: string;
  /** 遊び方（実際の手順なので番号付きで表示） */
  steps: React.ReactNode[];
  /** この回の条件 */
  rows: RuleRow[];
  startLabel: string;
  backLabel: string;
  onStart: () => void;
  onBack: () => void;
}

/** ゲーム開始前のルール説明。Enter / Space で開始、Esc で戻る */
export const RuleIntro: React.FC<RuleIntroProps> = ({ eyebrow, title, chefLine, steps, rows, startLabel, backLabel, onStart, onBack }) => {
  const startRef = useRef(onStart);
  const backRef = useRef(onBack);
  startRef.current = onStart;
  backRef.current = onBack;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startRef.current();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        backRef.current();
      }
    };
    // 前の画面で押した Enter がそのまま開始にならないよう、少し遅らせて受け付ける
    const id = window.setTimeout(() => window.addEventListener('keydown', h), 150);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', h);
    };
  }, []);

  return (
    <div id="ruleIntro" className="flex flex-col w-full pb-16 gap-6">
      {/* 店主の前置き */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl overflow-hidden shadow-xl">
        <div className="relative h-40 sm:h-48">
          <RamenPhoto className="absolute inset-0 w-full h-full" position="50% 45%" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e] via-[#0e0e0e]/80 to-transparent" />
          <div className="relative h-full flex items-center gap-4 px-5">
            <ChefPhoto mood="normal" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono-code font-bold text-[#cec6aa] tracking-widest">{eyebrow}</span>
              <h1 className="font-dela text-2xl sm:text-4xl text-[#ffe100] leading-tight drop-shadow-[2px_2px_0_#000]">{title}</h1>
              <p className="mt-1 text-sm font-bold text-[#e5e2e1]">店主「{chefLine}」</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* 遊び方 */}
        <div className="md:col-span-7 bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-hard-lg">
          <h2 className="font-dela text-lg text-[#e5e2e1] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffe100]">menu_book</span>
            遊び方
          </h2>
          <ol className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="shrink-0 w-7 h-7 rounded bg-[#ffe100] text-[#0e0e0e] font-dela text-sm flex items-center justify-center shadow-hard-sm">
                  {i + 1}
                </span>
                <span className="text-sm font-bold text-[#e5e2e1] leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[11px] font-bold text-[#cec6aa]">
            ※IME はオフ（半角英数）にしてください。ローマ字は shi/si・tsu/tu・nn/n などの表記ゆれに対応しています。
          </p>
        </div>

        {/* この回の条件 */}
        <div className="md:col-span-5 bg-[#0e0e0e] border-2 border-[#353534] rounded-xl p-5 shadow-hard-lg">
          <h2 className="font-dela text-lg text-[#e5e2e1] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb3ae]">gavel</span>
            今回の条件
          </h2>
          <dl className="flex flex-col divide-y divide-[#2a2a2a]">
            {rows.map((r) => (
              <div key={r.label} className="py-2.5 grid grid-cols-[6.5rem_1fr] gap-3 items-baseline">
                <dt className="text-[11px] font-bold text-[#cec6aa]">{r.label}</dt>
                <dd className="min-w-0">
                  <span className={`font-dela text-sm ${r.tone === 'warn' ? 'text-[#ffb4ab]' : 'text-[#ffe100]'}`}>{r.value}</span>
                  {r.note && <span className="block text-[11px] font-bold text-[#cec6aa] leading-snug mt-0.5">{r.note}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          id="ruleStartBtn"
          onClick={onStart}
          className="flex-1 py-4 px-6 rounded-xl bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-lg tracking-wider shadow-hard-lg active:translate-y-1 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">sports_kabaddi</span>
          {startLabel}（Enter / Space）
        </button>
        <button
          type="button"
          onClick={onBack}
          className="py-4 px-6 rounded-xl bg-[#2a2a2a] hover:bg-[#353534] text-[#cec6aa] font-dela text-sm cursor-pointer"
        >
          {backLabel}（Esc）
        </button>
      </div>
    </div>
  );
};
