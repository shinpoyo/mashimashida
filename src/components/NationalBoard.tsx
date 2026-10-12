import React, { useEffect, useState } from 'react';
import type { GameMode } from '../types/game';
import { TICKET_CONFIGS, MODE_ORDER, PENALTY_BY_ID } from '../data/shop';
import { AVATAR_PRESETS } from '../data/player';
import { PERIODS, fetchRanking, myPlayerHash, rankingOptIn, type Period, type RankingEntry } from '../utils/ranking';

const emojiOf = (id: string) => AVATAR_PRESETS.find((a) => a.id === id)?.emoji ?? '🍜';

/** 全国完飲番付（オンライン）。食券 × 期間で上位50人を表示 */
export const NationalBoard: React.FC<{ initialMode?: GameMode; refreshKey?: number }> = ({ initialMode, refreshKey = 0 }) => {
  const [mode, setMode] = useState<GameMode>(initialMode && MODE_ORDER.includes(initialMode) ? initialMode : 'normal');
  const [period, setPeriod] = useState<Period>('week');
  const [entries, setEntries] = useState<RankingEntry[] | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [me, setMe] = useState<string>('');

  useEffect(() => {
    myPlayerHash().then(setMe).catch(() => setMe(''));
  }, []);

  useEffect(() => {
    let alive = true;
    setEntries(null);
    setError(false);
    fetchRanking(mode, period)
      .then((r) => alive && setEntries(Array.isArray(r?.entries) ? r.entries : []))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [mode, period, refreshKey]);

  const tab = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-dela cursor-pointer border ${active ? 'bg-[#ffe100] text-[#0e0e0e] border-[#ffe100]' : 'bg-[#0e0e0e] text-[#cec6aa] border-[#353534] hover:text-[#ffffff]'}`;

  return (
    <section id="nationalBoard" className="bg-[#1c1b1b] border-2 border-[#ffe100] rounded-xl p-4 sm:p-5 shadow-hard-xl mb-8">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
        <div>
          <span className="text-[10px] font-mono-code text-[#cec6aa] font-bold block">NATIONAL RANKING</span>
          <h2 className="font-dela text-xl text-[#ffe100]">全国完飲番付</h2>
        </div>
        <p className="text-[11px] text-[#cec6aa] font-bold">1人1行（期間内の自己ベスト）・上位50人</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-2" role="tablist" aria-label="食券">
        {MODE_ORDER.map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} data-board-mode={m} className={tab(mode === m)} onClick={() => setMode(m)}>
            {TICKET_CONFIGS[m].name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="期間">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={period === p.id} data-board-period={p.id} className={tab(period === p.id)} onClick={() => setPeriod(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-xs text-[#ffb3ae] font-bold py-6 text-center">全国完飲番付を読み込めませんでした。時間をおいてもう一度開いてください。</p>
      ) : entries === null ? (
        <p className="text-xs text-[#cec6aa] font-bold py-6 text-center">読み込み中…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-[#cec6aa] font-bold py-6 text-center">まだ誰も載っていません。一番乗りを狙おう。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-[#353534] text-[11px] text-[#cec6aa] font-bold">
                <th className="py-2 px-2 w-12">順位</th>
                <th className="py-2 px-2">常連客</th>
                <th className="py-2 px-2">スコア</th>
                <th className="py-2 px-2">称号</th>
                <th className="py-2 px-2">ペナルティ</th>
                <th className="py-2 px-2">打鍵/秒</th>
                <th className="py-2 px-2">正確率</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold">
              {entries.map((e) => {
                const mine = me !== '' && e.ph === me;
                return (
                  <tr key={e.ph} className={`border-b border-[#2a2a2a] ${mine ? 'bg-[#ffe100]/10' : ''}`} data-mine={mine || undefined}>
                    <td className={`py-2.5 px-2 font-dela ${e.position <= 3 ? 'text-[#ffe100] text-base' : 'text-[#e5e2e1]'}`}>{e.position}</td>
                    <td className="py-2.5 px-2 text-[#ffffff]">
                      <span className="mr-1.5" aria-hidden="true">{emojiOf(e.avatar)}</span>
                      {e.name}
                      {mine && <span className="ml-2 px-1.5 py-0.5 rounded bg-[#ff5ca8] text-white text-[9px] font-dela">YOU</span>}
                    </td>
                    <td className="py-2.5 px-2 font-mono-code text-[#ffe100]">{e.score}</td>
                    <td className="py-2.5 px-2 text-[#e5e2e1]">{e.rank}</td>
                    <td className="py-2.5 px-2 text-[#cec6aa]">{PENALTY_BY_ID[e.penalty]?.name ?? e.penalty}</td>
                    <td className="py-2.5 px-2 font-mono-code">{e.kps.toFixed(2)}</td>
                    <td className="py-2.5 px-2 font-mono-code">{e.accuracy.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-[#979177] font-bold mt-3">
        {rankingOptIn()
          ? '遊び終わると、常連カードの名前とアイコン（絵文字）で自動的に登録されます。ギブアップは載りません。期間は日本時間で区切り、週は月曜はじまりです。'
          : '全国完飲番付への参加はオフになっています（常連カードで変更できます）。'}
      </p>
    </section>
  );
};
