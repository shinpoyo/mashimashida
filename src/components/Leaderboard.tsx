import React, { useState } from 'react';
import { LeaderboardEntry, UserStats } from '../types/game';
import { INITIAL_LEADERBOARD } from '../data/phrases';
import { soundManager } from '../utils/audio';

interface LeaderboardProps {
  userStats: UserStats;
  onPlayAgain: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ userStats, onPlayAgain }) => {
  const [filterTab, setFilterTab] = useState<'all' | 'day' | 'mashi'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Top 3 legends
  const top1 = INITIAL_LEADERBOARD[0];
  const top2 = INITIAL_LEADERBOARD[1];
  const top3 = INITIAL_LEADERBOARD[2];

  // Rest of the ranks (4th and beyond)
  const remainingRows = INITIAL_LEADERBOARD.slice(3).map((item) => {
    if (item.isUser) {
      return {
        ...item,
        wpm: userStats.maxWpm > 0 ? userStats.maxWpm : item.wpm,
        accuracy: userStats.accuracyAvg > 0 ? userStats.accuracyAvg : item.accuracy,
      };
    }
    return item;
  });

  // Filter remaining rows by search
  const filteredRows = remainingRows.filter((r) => {
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.rankTitle.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
  });

  const handleShareX = () => {
    soundManager.playKeyStroke();
    const text = encodeURIComponent(
      `【マシマシ打 完飲番付】\n前頭三枚目として極太麺タイピング完飲！\n最高速度: ${userStats.maxWpm} WPM / 正確率: ${userStats.accuracyAvg}%\nロット通算: ${userStats.bowlsCleared}杯完飲！\n#マシマシ打 #ラーメン二郎 #タイピング修行`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Banner & Header */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#ffe100] text-[#0e0e0e] flex flex-col items-center justify-center font-dela shadow-hard-sm shrink-0">
            <span className="material-symbols-outlined text-xl">military_tech</span>
            <span className="text-[9px] font-mono-code font-bold">EST.2024</span>
          </div>
          <div>
            <span className="text-[10px] font-mono-code text-[#cec6aa] font-bold block">
              全店総員打鍵審査官 2025.AUTUMN RANKING
            </span>
            <h1 className="font-dela text-2xl sm:text-3xl text-[#ffe100] tracking-wider leading-tight">
              全国完飲番付
            </h1>
            <p className="text-xs text-[#cec6aa] font-bold mt-1">
              打鍵の遅滞は即・ロット乱し。猛者たちが叩き出した極太麺タイピング記録板。
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#0e0e0e] p-1 rounded-lg border border-[#353534] self-stretch md:self-auto justify-around">
          <button
            type="button"
            onClick={() => {
              setFilterTab('all');
              soundManager.playKeyStroke();
            }}
            className={`px-3 py-1.5 rounded text-xs font-dela transition-colors cursor-pointer ${
              filterTab === 'all' ? 'bg-[#ffe100] text-[#0e0e0e]' : 'text-[#cec6aa] hover:text-[#ffffff]'
            }`}
          >
            全店総合
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterTab('day');
              soundManager.playKeyStroke();
            }}
            className={`px-3 py-1.5 rounded text-xs font-dela transition-colors cursor-pointer ${
              filterTab === 'day' ? 'bg-[#ffe100] text-[#0e0e0e]' : 'text-[#cec6aa] hover:text-[#ffffff]'
            }`}
          >
            本日の昼の部
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterTab('mashi');
              soundManager.playKeyStroke();
            }}
            className={`px-3 py-1.5 rounded text-xs font-dela transition-colors cursor-pointer ${
              filterTab === 'mashi' ? 'bg-[#ffe100] text-[#0e0e0e]' : 'text-[#cec6aa] hover:text-[#ffffff]'
            }`}
          >
            麺マシ 1kg級
          </button>
        </div>
      </div>

      {/* CURRENT USER STATUS CARD (YOU) */}
      <div className="bg-[#201f1f] border-2 border-[#4c4732] rounded-xl p-4 sm:p-5 shadow-xl mb-8 flex flex-col lg:flex-row items-center justify-between gap-5 relative overflow-hidden">
        {/* User Identity */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-[#ffe100] text-[#0e0e0e] flex items-center justify-center font-dela text-xl shadow">
              <span className="material-symbols-outlined text-2xl">person</span>
            </div>
            <span className="absolute -bottom-1 -right-1 text-[9px] font-mono-code bg-[#0e0e0e] text-[#ffe100] px-1 rounded font-bold border border-[#ffe100]">
              YOU
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#cec6aa] font-bold block">現在のあなたの格付け</span>
            <div className="flex items-center gap-2">
              <h2 className="font-dela text-xl text-[#ffe100]">
                前頭三枚目
              </h2>
              <span className="text-xs text-[#cec6aa] font-bold">(大ラーメン完食)</span>
            </div>
            <div className="text-xs font-mono-code text-[#cec6aa] font-bold mt-0.5">
              ロット通算: <strong className="text-[#ffffff]">{userStats.bowlsCleared}杯完飲</strong> / 撃沈 {userStats.strikesCount}回
            </div>
          </div>
        </div>

        {/* 4 User Stat Meters */}
        <div className="grid grid-cols-4 gap-2 w-full lg:w-auto">
          <div className="bg-[#0e0e0e] p-2.5 rounded-lg text-center border border-[#353534]">
            <span className="text-[9px] text-[#cec6aa] block font-bold">最高打鍵速度</span>
            <span className="font-mono-code text-base sm:text-lg font-black text-[#ffe100]">
              {userStats.maxWpm}
            </span>
            <span className="text-[9px] text-[#cec6aa] block font-mono-code">WPM</span>
          </div>

          <div className="bg-[#0e0e0e] p-2.5 rounded-lg text-center border border-[#353534]">
            <span className="text-[9px] text-[#cec6aa] block font-bold">打鍵正確率</span>
            <span className="font-mono-code text-base sm:text-lg font-black text-[#ffffff]">
              {userStats.accuracyAvg}%
            </span>
            <span className="text-[9px] text-[#cec6aa] block font-mono-code">ACC</span>
          </div>

          <div className="bg-[#0e0e0e] p-2.5 rounded-lg text-center border border-[#353534]">
            <span className="text-[9px] text-[#cec6aa] block font-bold">完食タイム</span>
            <span className="font-mono-code text-base sm:text-lg font-black text-[#ffb3ae]">
              2:14
            </span>
            <span className="text-[9px] text-[#cec6aa] block font-mono-code">MIN</span>
          </div>

          <div className="bg-[#0e0e0e] p-2.5 rounded-lg text-center border border-[#353534]">
            <span className="text-[9px] text-[#cec6aa] block font-bold">撃沈率 (ペナ)</span>
            <span className="font-mono-code text-base sm:text-lg font-black text-[#ffb4ab]">
              4.8%
            </span>
            <span className="text-[9px] text-[#cec6aa] block font-mono-code">RATE</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={onPlayAgain}
            className="py-2.5 px-4 bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-xs rounded-xl shadow-hard-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">ramen_dining</span>
            もう一杯食う
          </button>
          <button
            type="button"
            onClick={handleShareX}
            className="py-2 px-3 bg-[#0e0e0e] hover:bg-[#2a2a2a] text-[#ffffff] font-mono-code text-xs rounded-xl border border-[#353534] cursor-pointer flex items-center justify-center gap-1 font-bold"
          >
            <span>𝕏 で戦績咆哮</span>
          </button>
        </div>
      </div>

      {/* TOP 3 LEGENDS: 三傑・天下無双のジロリアン */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffe100] text-xl">workspace_premium</span>
            <h2 className="font-dela text-lg text-[#ffffff]">
              三傑・天下無双のジロリアン
            </h2>
          </div>
          <span className="font-mono-code text-xs text-[#cec6aa] font-bold">TOP 3 LEGENDS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Rank 2 (Ozeki) */}
          <div className="order-2 md:order-1 bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-dela text-xs text-[#e1c700]">大関 (第2位)</span>
              <span className="text-[10px] font-dela bg-[#0e0e0e] text-[#cec6aa] px-2 py-0.5 rounded border border-[#353534]">
                東張出
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] text-[#ffe100] flex items-center justify-center">
                <span className="material-symbols-outlined">ramen_dining</span>
              </div>
              <div>
                <h3 className="font-dela text-base text-[#ffffff]">{top2.name}</h3>
                <span className="text-[10px] text-[#cec6aa] font-bold">称号: {top2.title}</span>
              </div>
            </div>

            <div className="bg-[#0e0e0e] p-3 rounded-lg border border-[#353534] flex flex-col gap-1 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-[#cec6aa]">打鍵速度</span>
                <span className="font-mono-code text-base font-black text-[#ffe100]">{top2.wpm} WPM</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#cec6aa]">完食所要秒</span>
                <span className="font-mono-code text-[#ffffff]">{top2.clearTime}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-[#353534]">
                <span className="text-[#cec6aa]">麺量: {top2.noddleSpec}</span>
                <span className="text-[#ffe100] font-mono-code font-bold">正確率 {top2.accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Rank 1 (Yokozuna) - Prominent center card */}
          <div className="order-1 md:order-2 bg-[#1c1b1b] border-4 border-[#ffe100] rounded-xl p-5 shadow-hard-xl flex flex-col gap-3 relative scale-100 md:scale-105 z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ffe100] text-[#0e0e0e] font-dela text-xs px-3 py-1 rounded-full shadow">
              👑 横綱 (第1位) 東横綱
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-12 h-12 rounded-xl bg-[#ffe100] text-[#0e0e0e] flex items-center justify-center font-dela shadow">
                <span className="material-symbols-outlined text-2xl">soup_kitchen</span>
              </div>
              <div>
                <h3 className="font-dela text-xl text-[#ffe100]">{top1.name}</h3>
                <span className="text-xs text-[#ffb3ae] font-dela">称号: {top1.title}</span>
              </div>
            </div>

            <div className="bg-[#0e0e0e] p-3 rounded-lg border border-[#4c4732] flex flex-col gap-2 text-xs font-bold">
              <div className="flex items-baseline justify-between">
                <span className="text-[#cec6aa]">完飲打鍵速度</span>
                <span className="font-mono-code text-2xl font-black text-[#ffe100]">{top1.wpm} <span className="text-xs">WPM</span></span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#353534]">
                <div>
                  <span className="text-[#cec6aa] block text-[9px]">完食レコード</span>
                  <span className="font-mono-code text-[#ffffff] font-bold">{top1.clearTime}</span>
                </div>
                <div>
                  <span className="text-[#cec6aa] block text-[9px]">完飲麺量</span>
                  <span className="font-mono-code text-[#ffe100] font-bold">{top1.noddleSpec}</span>
                </div>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-[#353534] text-[#cec6aa]">
                <span>撃沈回数: {top1.strikes}回 (無敗神話)</span>
                <span className="text-[#ffe100] font-mono-code font-bold">正確率 {top1.accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Rank 3 (Sekiwake) */}
          <div className="order-3 bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-dela text-xs text-[#ffb3ae]">関脇 (第3位)</span>
              <span className="text-[10px] font-dela bg-[#0e0e0e] text-[#cec6aa] px-2 py-0.5 rounded border border-[#353534]">
                西張出
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] text-[#ffe100] flex items-center justify-center">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <div>
                <h3 className="font-dela text-base text-[#ffffff]">{top3.name}</h3>
                <span className="text-[10px] text-[#cec6aa] font-bold">称号: {top3.title}</span>
              </div>
            </div>

            <div className="bg-[#0e0e0e] p-3 rounded-lg border border-[#353534] flex flex-col gap-1 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-[#cec6aa]">打鍵速度</span>
                <span className="font-mono-code text-base font-black text-[#ffe100]">{top3.wpm} WPM</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#cec6aa]">完食所要秒</span>
                <span className="font-mono-code text-[#ffffff]">{top3.clearTime}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-[#353534]">
                <span className="text-[#cec6aa]">麺量: {top3.noddleSpec}</span>
                <span className="text-[#ffe100] font-mono-code font-bold">正確率 {top3.accuracy}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 幕内前頭番付名鑑 (4位〜10位 TABLE) */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#353534] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-dela text-base sm:text-lg text-[#ffffff]">
                幕内前頭番付名鑑
              </h2>
              <span className="text-xs font-mono-code bg-[#353534] text-[#ffe100] px-2 py-0.5 rounded font-bold">
                4位 〜 12位
              </span>
            </div>
            <p className="text-xs text-[#cec6aa] font-bold mt-0.5">
              ロット乱し（ミスタイピングによるタイムオーバー）なしの精鋭ジロリアン一覧。
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[#cec6aa]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="麺狂名・番付で検索..."
              className="w-full bg-[#0e0e0e] border border-[#353534] focus:border-[#ffe100] text-xs font-bold text-[#ffffff] rounded-lg py-2 pl-8 pr-3 outline-none"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs font-bold">
            <thead>
              <tr className="border-b border-[#353534] text-[#cec6aa] font-mono-code text-[11px]">
                <th className="py-2.5 px-3">番付 / 順位</th>
                <th className="py-2.5 px-3">麺狂名（ジロリアン）</th>
                <th className="py-2.5 px-3">速度 (WPM)</th>
                <th className="py-2.5 px-3">正確率</th>
                <th className="py-2.5 px-3">完食秒数</th>
                <th className="py-2.5 px-3">撃沈履歴</th>
                <th className="py-2.5 px-3">称号 / ステータス</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isUserRow = row.isUser;
                return (
                  <tr
                    key={row.rank}
                    className={`border-b border-[#2a2a2a] transition-colors ${
                      isUserRow
                        ? 'bg-[#ffe100]/15 border-[#ffe100]/40'
                        : 'hover:bg-[#201f1f]'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded font-dela text-[11px] ${
                        isUserRow ? 'bg-[#ffe100] text-[#0e0e0e]' : 'bg-[#2a2a2a] text-[#ffffff]'
                      }`}>
                        {row.rankTitle}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-dela ${isUserRow ? 'text-[#ffe100]' : 'text-[#ffffff]'}`}>
                          {row.name}
                        </span>
                        {isUserRow && (
                          <span className="material-symbols-outlined text-xs text-[#ffe100]">
                            stars
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono-code font-black text-sm text-[#ffe100]">
                      {row.wpm}
                    </td>
                    <td className="py-3 px-3 font-mono-code text-[#cec6aa]">
                      {row.accuracy}%
                    </td>
                    <td className="py-3 px-3 font-mono-code text-[#ffffff]">
                      {row.clearTime}
                    </td>
                    <td className="py-3 px-3 font-mono-code">
                      <span className={row.strikes > 0 ? 'text-[#ff5555]' : 'text-[#cec6aa]'}>
                        {row.strikes}回
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-mono-code px-2 py-0.5 rounded border ${
                        isUserRow
                          ? 'bg-[#ffe100] text-[#0e0e0e] border-[#ffe100] font-black'
                          : 'bg-[#0e0e0e] text-[#cec6aa] border-[#353534]'
                      }`}>
                        {row.badgeStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[#353534] text-xs font-mono-code text-[#cec6aa]">
          <span>表示中: 4〜10位 / 全登録麺狂 1,842名</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#353534] text-[#cec6aa] rounded text-xs font-dela cursor-pointer"
            >
              前頭前へ
            </button>
            <button
              type="button"
              className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#353534] text-[#cec6aa] rounded text-xs font-dela cursor-pointer"
            >
              十両・幕下を見る
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM RULE & ANNOUNCEMENT PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel 1: 番付認定掟 (オキテ) */}
        <div className="bg-[#1c1b1b] border-l-4 border-[#970015] rounded-xl p-4 shadow-md border-y border-r border-[#353534]">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#ffb3ae] text-lg">gavel</span>
            <h3 className="font-dela text-sm text-[#ffb3ae]">番付認定掟（オキテ）</h3>
          </div>
          <ul className="text-xs text-[#cec6aa] font-bold space-y-1.5 list-disc list-inside leading-relaxed">
            <li>麺上げからタイピング完了までの実測タイムおよび打鍵正確率で順位決定。</li>
            <li>誤打率8%を超過した場合、店主より「ロット乱し」判定を受け撃沈ペナルティ加算。</li>
            <li>1000g以上のすり鉢モードは「横綱〜大関」のみが挑戦資格を有す。</li>
          </ul>
        </div>

        {/* Panel 2: 店主からの通達 */}
        <div className="bg-[#1c1b1b] border-l-4 border-[#ffe100] rounded-xl p-4 shadow-md border-y border-r border-[#353534]">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#ffe100] text-lg">campaign</span>
            <h3 className="font-dela text-sm text-[#ffe100]">店主からの通達</h3>
          </div>
          <p className="text-xs text-[#cec6aa] font-bold leading-relaxed">
            「食券を買ったら即座に席に着いてタイピング態勢をとること。スマホ弄りながらの打鍵はロットを乱すので即刻退場願います。ニンニク入れますかの問いには3秒以内に詠唱せよ。」
          </p>
        </div>
      </div>
    </div>
  );
};
