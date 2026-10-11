import React, { useState } from 'react';
import { AdSlot } from './AdSlot';
import { UserStats, ScreenType } from '../types/game';
import { soundManager } from '../utils/audio';
import { PlayerAvatar } from './PlayerAvatar';
import { TICKET_CONFIGS, MODE_ORDER } from '../data/shop';
import { AVATAR_PRESETS, DEFAULT_PLAYER_NAME, PLAYER_NAME_MAX, imageFileToAvatar } from '../data/player';

interface RegularCardProps {
  userStats: UserStats;
  onNavigate: (screen: ScreenType) => void;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
}

export const RegularCard: React.FC<RegularCardProps> = ({ userStats, onNavigate, onUpdateStats }) => {
  const [favoriteCall, setFavoriteCall] = useState<string>(userStats.favoriteCall || 'ヤサイマシマシニンニクアブラカラメ');
  const [isEditingCall, setIsEditingCall] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [nameDraft, setNameDraft] = useState<string>(userStats.playerName);
  const [avatarError, setAvatarError] = useState<string>('');

  const saveName = () => {
    const name = nameDraft.trim().slice(0, PLAYER_NAME_MAX) || DEFAULT_PLAYER_NAME;
    setNameDraft(name);
    if (name !== userStats.playerName) onUpdateStats({ playerName: name });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const avatar = await imageFileToAvatar(file);
      setAvatarError('');
      onUpdateStats({ avatar });
      soundManager.uiClick();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : '画像を読み込めませんでした。');
    }
  };

  const handleSaveCall = () => {
    soundManager.uiClick();
    onUpdateStats({ favoriteCall });
    setIsEditingCall(false);
  };

  const handleCopyProfile = () => {
    soundManager.uiClick();
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(
      `【マシマシ打 常連カード】\n名前: ${userStats.playerName}\n称号: ${userStats.title}\n通算完飲: ${userStats.bowlsCleared}杯\n最高速度: ${userStats.maxWpm} WPM\n正確率: ${userStats.accuracyAvg}%\n愛用コール: ${favoriteCall}`
    ).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const badges = [
    { id: 'b1', name: '完飲完食証', desc: '初めてロットを完走して完食した証', icon: 'ramen_dining', unlocked: userStats.bowlsCleared > 0 },
    { id: 'b2', name: '全マシマシ制覇', desc: '全マシマシの食券で完飲完食', icon: 'bolt', unlocked: userStats.recentGames.some((g) => g.mode === 'hard' && g.cleared) || !!userStats.bestScores.hard },
    { id: 'b3', name: '丼読みの達人', desc: '超ハード（画像出題）で完飲完食', icon: 'visibility', unlocked: userStats.recentGames.some((g) => g.mode === 'super' && g.cleared) || !!userStats.bestScores.super },
    { id: 'b4', name: '黒アブラ塊討伐者', desc: 'ノーミス・ロット乱しゼロで完食', icon: 'shield', unlocked: userStats.perfectClears > 0 },
    { id: 'b5', name: 'ロットの絶対神', desc: '称号「麺神」を獲得した伝説の領域', icon: 'military_tech', unlocked: Object.values(userStats.bestScores).some((b) => b?.rank === '麺神') },
  ]
    // 超ハードがオフの間は、そのトロフィーを出さない
    .filter((b) => b.id !== 'b3' || MODE_ORDER.includes('super'));

  return (
    <div className="flex flex-col w-full pb-16">
      {/* 常連カード：プレイヤー（客）のプロフィール */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative">
              <PlayerAvatar avatar={userStats.avatar} size={80} />
              <span className="absolute -top-1 -right-2 bg-[#ffe100] text-[#0e0e0e] text-[10px] font-dela px-1.5 py-0.5 rounded shadow">
                LV.{1 + Math.floor(userStats.bowlsCleared / 3)}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono-code bg-[#0e0e0e] text-[#ffe100] px-2 py-0.5 rounded font-bold border border-[#ffe100]">
                  {userStats.title}
                </span>
                <span className="text-xs text-[#cec6aa] font-bold">マシマシ打 常連客</span>
              </div>
              <h1 className="font-dela text-2xl text-[#ffffff] mt-1 truncate">{userStats.playerName}</h1>
              <p className="text-xs text-[#cec6aa] font-bold mt-0.5">
                通算完飲: <strong className="text-[#ffe100] font-mono-code text-sm">{userStats.bowlsCleared}杯</strong> / 撃沈: {userStats.strikesCount}回
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              type="button"
              id="editProfileBtn"
              onClick={() => {
                soundManager.uiClick();
                setEditingProfile((v) => !v);
              }}
              className="py-2.5 px-4 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-dela text-xs rounded-xl cursor-pointer flex items-center gap-1.5 border border-[#353534]"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {editingProfile ? '編集を閉じる' : '名前・アイコンを変える'}
            </button>
            <button
              type="button"
              onClick={handleCopyProfile}
              className="py-2.5 px-4 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-dela text-xs rounded-xl cursor-pointer flex items-center gap-1.5 border border-[#353534]"
            >
              <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
              {copied ? 'コピーしました' : '戦績をコピー'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ticket-vending')}
              className="py-2.5 px-5 bg-[#ffe100] hover:bg-[#ffe330] text-[#0e0e0e] font-dela text-xs rounded-xl shadow-hard-sm cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">confirmation_number</span>
              食券を買いに行く
            </button>
          </div>
        </div>

        {editingProfile && (
          <div id="profileEditor" className="mt-5 pt-5 border-t border-[#353534] grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="playerNameInput" className="block text-xs font-bold text-[#cec6aa] mb-1.5">
                名前（{PLAYER_NAME_MAX}文字まで）
              </label>
              <input
                id="playerNameInput"
                type="text"
                maxLength={PLAYER_NAME_MAX}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                className="w-full bg-[#0e0e0e] border-2 border-[#4c4732] focus:border-[#ffe100] rounded-lg px-3 py-2 text-[#ffe100] font-dela text-sm outline-none"
              />
              <p className="mt-1.5 text-[11px] text-[#cec6aa] font-bold">あなたはお店に通う常連客です。店主（写真の人）とは別人です。</p>
            </div>
            <div>
              <span className="block text-xs font-bold text-[#cec6aa] mb-1.5">アイコン</span>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((p) => {
                  const on = userStats.avatar.kind === 'preset' && userStats.avatar.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-avatar={p.id}
                      title={p.label}
                      onClick={() => {
                        soundManager.uiClick();
                        setAvatarError('');
                        onUpdateStats({ avatar: { kind: 'preset', id: p.id } });
                      }}
                      className={`w-10 h-10 rounded-full text-xl flex items-center justify-center cursor-pointer border-2 ${
                        on ? 'border-[#ffb3ae] bg-[#3a2a2a]' : 'border-[#353534] bg-[#2a2a2a] hover:border-[#cec6aa]'
                      }`}
                    >
                      {p.emoji}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <label className="py-2 px-3 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-dela text-xs rounded-lg cursor-pointer border border-[#353534] inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">upload</span>
                  画像をアップロード
                  <input id="avatarUpload" type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
                </label>
                {userStats.avatar.kind === 'image' && (
                  <span className="text-[11px] text-[#ffb3ae] font-bold">アップロードした画像を使用中</span>
                )}
              </div>
              {avatarError && <p className="mt-2 text-[11px] text-[#ff5555] font-bold">{avatarError}</p>}
              <p className="mt-2 text-[11px] text-[#cec6aa] font-bold">画像は 128px に縮めて、この端末の中だけに保存します（どこにも送信しません）。</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 shadow-hard-sm text-center">
          <span className="text-[10px] text-[#cec6aa] block font-bold">生涯最高打鍵速度</span>
          <span className="font-mono-code text-2xl sm:text-3xl font-black text-[#ffe100]">
            {userStats.maxWpm}
          </span>
          <span className="text-[10px] text-[#cec6aa] block font-mono-code font-bold">WPM</span>
        </div>

        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 shadow-hard-sm text-center">
          <span className="text-[10px] text-[#cec6aa] block font-bold">平均打鍵正確率</span>
          <span className="font-mono-code text-2xl sm:text-3xl font-black text-[#ffffff]">
            {userStats.accuracyAvg}%
          </span>
          <span className="text-[10px] text-[#cec6aa] block font-mono-code font-bold">ACCURACY</span>
        </div>

        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 shadow-hard-sm text-center">
          <span className="text-[10px] text-[#cec6aa] block font-bold">通算打鍵総数</span>
          <span className="font-mono-code text-2xl sm:text-3xl font-black text-[#ffb3ae]">
            {userStats.lifetimeKeystrokes.toLocaleString()}
          </span>
          <span className="text-[10px] text-[#cec6aa] block font-mono-code font-bold">STROKES</span>
        </div>

        <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 shadow-hard-sm text-center">
          <span className="text-[10px] text-[#cec6aa] block font-bold">ノーミス完飲回数</span>
          <span className="font-mono-code text-2xl sm:text-3xl font-black text-[#ffe100]">
            {userStats.perfectClears}
          </span>
          <span className="text-[10px] text-[#cec6aa] block font-mono-code font-bold">PERFECTS</span>
        </div>
      </div>

      {/* Favorite Call Order Box */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#353534] mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffe100]">restaurant</span>
            <h2 className="font-dela text-base sm:text-lg text-[#ffffff]">
              マイ・デフォルトコール（魂の呪文）
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isEditingCall) handleSaveCall();
              else setIsEditingCall(true);
            }}
            className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#353534] text-[#ffe100] text-xs font-dela rounded cursor-pointer border border-[#353534]"
          >
            {isEditingCall ? '保存する' : '編集する'}
          </button>
        </div>

        {isEditingCall ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={favoriteCall}
              onChange={(e) => setFavoriteCall(e.target.value)}
              className="flex-1 bg-[#0e0e0e] border border-[#ffe100] rounded-lg p-2.5 text-sm font-dela text-[#ffe100] outline-none"
            />
            <button
              type="button"
              onClick={handleSaveCall}
              className="px-4 py-2 bg-[#ffe100] text-[#0e0e0e] font-dela text-xs rounded-lg cursor-pointer"
            >
              確定
            </button>
          </div>
        ) : (
          <div className="bg-[#0e0e0e] p-4 rounded-xl border border-[#353534] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#cec6aa] font-bold">登録済みコール</span>
              <span className="font-dela text-lg sm:text-xl text-[#ffe100] tracking-wider mt-0.5">
                {favoriteCall}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Badges and Trophy Showcase */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#353534] mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffe100]">military_tech</span>
            <h2 className="font-dela text-base sm:text-lg text-[#ffffff]">
              獲得称号・トロフィー名鑑
            </h2>
          </div>
          <span className="font-mono-code text-xs text-[#cec6aa] font-bold">
            {badges.filter((b) => b.unlocked).length} / {badges.length} 解除
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                badge.unlocked
                  ? 'bg-[#201f1f] border-[#ffe100]/50 shadow-md'
                  : 'bg-[#0e0e0e] border-[#353534] opacity-40'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  badge.unlocked ? 'bg-[#ffe100] text-[#0e0e0e]' : 'bg-[#2a2a2a] text-[#4c4732]'
                }`}
              >
                <span className="material-symbols-outlined">{badge.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-dela text-xs ${badge.unlocked ? 'text-[#ffffff]' : 'text-[#cec6aa]'}`}>
                    {badge.name}
                  </span>
                  {badge.unlocked && (
                    <span className="text-[9px] font-mono-code text-[#ffe100] bg-[#0e0e0e] px-1 rounded border border-[#ffe100]">
                      GET
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#cec6aa] font-bold mt-1 leading-tight">
                  {badge.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Combat Log History */}
      <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#353534] mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffe100]">history</span>
            <h2 className="font-dela text-base sm:text-lg text-[#ffffff]">
              直近の完飲修行履歴
            </h2>
          </div>
          <span className="text-xs font-mono-code text-[#cec6aa] font-bold">RECENT LOGS</span>
        </div>

        <div className="flex flex-col gap-2">
          {userStats.recentGames.map((game) => (
            <div
              key={game.id}
              className="bg-[#201f1f] p-3 rounded-lg border border-[#353534] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-dela ${
                    game.cleared ? 'bg-[#ffe100] text-[#0e0e0e]' : 'bg-[#970015] text-[#ffdad7]'
                  }`}
                >
                  {game.cleared ? '完食完飲' : 'ロット乱し'}
                </span>
                <span className="text-[#ffffff]">
                  {TICKET_CONFIGS[game.mode]?.name ?? game.mode}
                </span>
                <span className="text-[11px] text-[#cec6aa] font-mono-code">{game.date}</span>
              </div>

              <div className="flex items-center gap-4 font-mono-code">
                <span>
                  速度: <strong className="text-[#ffe100]">{game.wpm} WPM</strong>
                </span>
                <span>
                  正確率: <strong className="text-[#ffffff]">{game.accuracy}%</strong>
                </span>
                <span>
                  タイム: <strong className="text-[#ffb3ae]">{game.time}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AdSlot className="mt-8" />
    </div>
  );
};
