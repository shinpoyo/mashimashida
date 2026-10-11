import React from 'react';
import { GameResult, UserStats } from '../types/game';
import { TICKET_CONFIGS, MODE_ORDER, PENALTY_BY_ID, TOPPING_BUFFS } from '../data/shop';
import { soundManager } from '../utils/audio';

interface LeaderboardProps {
  userStats: UserStats;
  lastResult: GameResult | null;
  onPlayAgain: () => void;
  onBackToShop: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ userStats, lastResult, onPlayAgain, onBackToShop }) => {
  const games = userStats.recentGames.length;
  const strikeRate = games ? Math.round((userStats.strikesCount / games) * 1000) / 10 : 0;

  const handleShareX = () => {
    soundManager.playKeyStroke();
    const r = lastResult;
    const body = r
      ? `マシマシ打【${TICKET_CONFIGS[r.mode].name}／${PENALTY_BY_ID[r.penalty].name}】で「${r.rank}」認定！\nスコア ${r.score} / 正確率 ${r.accuracy.toFixed(1)}% / ${r.kps.toFixed(2)}打鍵/秒`
      : `マシマシ打 通算${userStats.bowlsCleared}杯完飲！ 最高 ${userStats.maxWpm} WPM`;
    const text = encodeURIComponent(`${body}\n#マシマシ打`);
    const url = encodeURIComponent(location.href.split('#')[0].split('?')[0]);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener');
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Banner */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#ffe100] text-[#0e0e0e] flex flex-col items-center justify-center font-dela shadow-hard-sm shrink-0">
          <span className="material-symbols-outlined text-xl">military_tech</span>
          <span className="text-[9px] font-mono-code font-bold">EST.2024</span>
        </div>
        <div>
          <span className="text-[10px] font-mono-code text-[#cec6aa] font-bold block">THIS DEVICE RANKING</span>
          <h1 className="font-dela text-2xl sm:text-3xl text-[#ffe100] tracking-wider leading-tight">完飲番付</h1>
          <p className="text-xs text-[#cec6aa] font-bold mt-1">打鍵の遅滞は即・ロット乱し。あなたが叩き出した記録板（この端末に保存）。</p>
        </div>
      </div>

      {/* LAST RESULT */}
      {lastResult && (
        <div
          id="lastResult"
          className={`bg-[#201f1f] border-4 rounded-2xl p-5 sm:p-6 shadow-hard-xl mb-8 ${
            lastResult.expelled || lastResult.gaveUp ? 'border-[#970015]' : 'border-[#ffe100]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <span className="text-[10px] text-[#cec6aa] font-bold block">
                直近の一杯：{TICKET_CONFIGS[lastResult.mode].name} ／ ペナルティ「{PENALTY_BY_ID[lastResult.penalty].name}」
                {lastResult.toppings.length > 0 &&
                  ` ／ ${lastResult.toppings.map((id) => TOPPING_BUFFS.find((b) => b.id === id)?.name).join('・')}`}
              </span>
              <h2 className={`font-dela text-4xl tracking-wider drop-shadow-[2px_2px_0_#000] ${lastResult.expelled || lastResult.gaveUp ? 'text-[#ff5555]' : 'text-[#ffe100]'}`}>
                {lastResult.rank}
              </h2>
              <p className="text-xs text-[#cec6aa] font-bold">{lastResult.rankComment}</p>
            </div>
            {lastResult.isBest && (
              <span className="self-start px-3 py-1.5 bg-[#ffe100] text-[#0e0e0e] font-dela text-sm rounded shadow-hard-sm">🏆 自己ベスト更新！</span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
            {[
              ['スコア', String(lastResult.score), 'text-[#ffe100]'],
              ['打鍵/秒', lastResult.kps.toFixed(2), 'text-[#ffffff]'],
              ['正確率', `${lastResult.accuracy.toFixed(1)}%`, 'text-[#ffffff]'],
              ['ミス', String(lastResult.misses), 'text-[#ffb3ae]'],
              ['ロット乱し', String(lastResult.breaks), 'text-[#ffb3ae]'],
              ['提供', `${lastResult.lotsServed}/${lastResult.lots}杯`, 'text-[#ffe100]'],
            ].map(([label, value, color]) => (
              <div key={label} className="bg-[#0e0e0e] p-2.5 rounded-lg text-center border border-[#353534]">
                <span className="text-[9px] text-[#cec6aa] block font-bold">{label}</span>
                <span className={`font-mono-code text-lg font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button type="button" onClick={onPlayAgain} className="flex-1 py-3 bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-sm rounded-xl shadow-hard cursor-pointer">
              同じ食券でもう一杯
            </button>
            <button type="button" onClick={handleShareX} className="py-3 px-5 bg-[#0e0e0e] border border-[#353534] text-[#e5e2e1] font-dela text-sm rounded-xl cursor-pointer hover:bg-[#2a2a2a]">
              𝕏 で戦績咆哮
            </button>
            <button type="button" onClick={onBackToShop} className="py-3 px-5 bg-[#2a2a2a] text-[#cec6aa] font-dela text-sm rounded-xl cursor-pointer hover:bg-[#353534]">
              食券売場へ
            </button>
          </div>
        </div>
      )}

      {/* USER SUMMARY */}
      <div className="bg-[#201f1f] border-2 border-[#4c4732] rounded-xl p-4 sm:p-5 shadow-xl mb-8 flex flex-col lg:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-[#ffe100] text-[#0e0e0e] flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-2xl">person</span>
            </div>
            <span className="absolute -bottom-1 -right-1 text-[9px] font-mono-code bg-[#0e0e0e] text-[#ffe100] px-1 rounded font-bold border border-[#ffe100]">YOU</span>
          </div>
          <div>
            <span className="text-[10px] text-[#cec6aa] font-bold block">現在のあなたの格付け</span>
            <h2 className="font-dela text-xl text-[#ffe100]">{userStats.title}</h2>
            <div className="text-xs font-mono-code text-[#cec6aa] font-bold mt-0.5">
              ロット通算: <strong className="text-[#ffffff]">{userStats.bowlsCleared}杯完飲</strong> / 撃沈 {userStats.strikesCount}回
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 w-full lg:w-auto">
          {[
            ['最高打鍵速度', String(userStats.maxWpm), 'WPM', 'text-[#ffe100]'],
            ['平均正確率', `${userStats.accuracyAvg}%`, 'ACC', 'text-[#ffffff]'],
            ['ノーミス完食', String(userStats.perfectClears), 'PERFECT', 'text-[#ffb3ae]'],
            ['撃沈率', `${strikeRate}%`, 'RATE', 'text-[#ffb4ab]'],
          ].map(([label, value, unit, color]) => (
            <div key={label} className="bg-[#0e0e0e] p-2.5 rounded-lg text-center border border-[#353534]">
              <span className="text-[9px] text-[#cec6aa] block font-bold">{label}</span>
              <span className={`font-mono-code text-base sm:text-lg font-black ${color}`}>{value}</span>
              <span className="text-[9px] text-[#cec6aa] block font-mono-code">{unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BEST PER TICKET */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dela text-lg text-[#e5e2e1] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ffe100]">workspace_premium</span>
          食券別・自己ベスト番付
        </h2>
        <span className="text-xs font-mono-code text-[#cec6aa] font-bold">PERSONAL BEST</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="bestTable">
        {MODE_ORDER.map((m) => {
          const best = userStats.bestScores[m];
          const t = TICKET_CONFIGS[m];
          const highlight = lastResult?.mode === m && lastResult.isBest;
          return (
            <div
              key={m}
              className={`bg-[#1c1b1b] border-2 rounded-xl p-4 shadow-hard-lg ${highlight ? 'border-[#ffe100]' : 'border-[#353534]'}`}
            >
              <span className="font-dela text-xs text-[#cec6aa]">{t.badge}</span>
              <h3 className={`font-dela text-lg ${t.tone === 'red' || t.tone === 'black' ? 'text-[#ffb4ab]' : 'text-[#ffffff]'}`}>{t.name}</h3>
              <div className="mt-3 bg-[#0e0e0e] rounded-lg p-3 border border-[#353534]">
                <span className="text-[10px] text-[#cec6aa] font-bold block">自己ベスト</span>
                <span className="font-mono-code text-2xl font-black text-[#ffe100]">{best ? best.score : '-'}</span>
                <span className="block text-xs font-dela text-[#e5e2e1] mt-1">{best ? best.rank : '未挑戦'}</span>
                {best && <span className="block text-[10px] font-mono-code text-[#cec6aa] mt-0.5">{best.date}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* HISTORY */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 sm:p-5 shadow-xl mb-8">
        <h2 className="font-dela text-lg text-[#e5e2e1] mb-3">直近の完飲履歴</h2>
        {games === 0 ? (
          <p className="text-xs text-[#cec6aa] font-bold py-6 text-center">まだ記録がありません。食券を買って修行を始めよう。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#353534] text-[11px] text-[#cec6aa] font-bold">
                  <th className="py-2 px-2">日時</th>
                  <th className="py-2 px-2">食券</th>
                  <th className="py-2 px-2">称号</th>
                  <th className="py-2 px-2">スコア</th>
                  <th className="py-2 px-2">WPM</th>
                  <th className="py-2 px-2">正確率</th>
                  <th className="py-2 px-2">結果</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold">
                {userStats.recentGames.map((h) => (
                  <tr key={h.id} className="border-b border-[#2a2a2a]">
                    <td className="py-2.5 px-2 font-mono-code text-[#cec6aa]">{h.date}</td>
                    <td className="py-2.5 px-2 font-dela">{TICKET_CONFIGS[h.mode]?.name ?? h.mode}</td>
                    <td className="py-2.5 px-2 text-[#e5e2e1]">{h.rank ?? '-'}</td>
                    <td className="py-2.5 px-2 font-mono-code text-[#ffe100]">{h.score ?? '-'}</td>
                    <td className="py-2.5 px-2 font-mono-code">{h.wpm}</td>
                    <td className="py-2.5 px-2 font-mono-code">{h.accuracy}%</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-dela ${h.cleared ? 'bg-[#ffe100] text-[#0e0e0e]' : 'bg-[#970015] text-[#ffdad7]'}`}>
                        {h.cleared ? '完飲' : h.time}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1c1b1b] border-2 border-[#970015] rounded-xl p-4 text-xs font-bold text-[#cec6aa] leading-relaxed">
          <h3 className="font-dela text-sm text-[#ffb4ab] mb-2">番付認定法（オキテ）</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>1杯ごとに「打鍵数 × 係数 ＋ 残り時間ボーナス」を加点。</li>
            <li>称号は打鍵/秒 × 正確率² からロット乱しを差し引いて判定。</li>
            <li>退店ペナルティが厳しいほどスコア倍率アップ（最大 ×1.5）。</li>
            <li>ギブアップ退店は自己ベストに数えない。</li>
          </ul>
        </div>
        <div className="bg-[#0e0e0e] border-2 border-[#ffe100] rounded-xl p-4 text-xs font-bold text-[#cec6aa] leading-relaxed">
          <h3 className="font-dela text-sm text-[#ffe100] mb-2">店主からの通達</h3>
          <p>
            「全国の猛者と競う<span className="text-[#ffe100]">全国完飲番付</span>は準備中だ。まずはこの店で自己ベストを磨いておけ。」
          </p>
        </div>
      </div>
    </div>
  );
};
