/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ScreenType, GameSettings, GameResult, UserStats } from './types/game';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TicketVending } from './components/TicketVending';
import { TypingBattle } from './components/TypingBattle';
import { Leaderboard } from './components/Leaderboard';
import { RegularCard } from './components/RegularCard';
import { TICKET_CONFIGS, MODE_ORDER } from './data/shop';
import { DEFAULT_AVATAR, DEFAULT_PLAYER_NAME } from './data/player';

const STATS_KEY = 'mashimashida_stats_v2';
const SETTINGS_KEY = 'mashimashida_settings_v1';

const EMPTY_STATS: UserStats = {
  playerName: DEFAULT_PLAYER_NAME,
  avatar: DEFAULT_AVATAR,
  bowlsCleared: 0,
  strikesCount: 0,
  maxWpm: 0,
  accuracyAvg: 0,
  lifetimeKeystrokes: 0,
  perfectClears: 0,
  favoriteCall: 'ヤサイマシマシ ニンニクスクナメ アブラカラメ',
  title: '新規来店客',
  bestScores: {},
  recentGames: [],
};

/** 旧バージョンの称号名を現在の名称へ置き換える */
const RANK_RENAMES: Record<string, string> = { ジロリアン見習い: '常連見習い', ジロリアン: 'ロット番長', 二郎神: '麺神' };
function migrateStats(s: UserStats): UserStats {
  const rn = (r?: string) => (r && RANK_RENAMES[r]) || r;
  const bestScores: UserStats['bestScores'] = {};
  for (const [m, b] of Object.entries(s.bestScores ?? {})) if (b) bestScores[m as keyof typeof bestScores] = { ...b, rank: rn(b.rank)! };
  return {
    ...s,
    title: Object.entries(RANK_RENAMES).reduce((t, [a, b]) => t.replace(a, b), s.title),
    bestScores,
    recentGames: (s.recentGames ?? []).map((g) => ({ ...g, rank: rn(g.rank) })),
  };
}

const DEFAULT_SETTINGS: GameSettings = { mode: 'easy', penalty: 'none' };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch {
    // 破損データやストレージ無効時は初期値
  }
  return fallback;
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('ticket-vending');
  const [settings, setSettings] = useState<GameSettings>(() => {
    // 旧バージョンの保存設定（トッピング券など）は必要な項目だけ取り出す
    const s = load(SETTINGS_KEY, DEFAULT_SETTINGS);
    // オフにしたモード（超ハードなど）が保存されていたら小ラーメンに戻す
    return { mode: MODE_ORDER.includes(s.mode) ? s.mode : 'easy', penalty: s.penalty };
  });
  /** 同じ設定で再挑戦したときも TypingBattle を作り直すためのキー */
  const [battleKey, setBattleKey] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const [userStats, setUserStats] = useState<UserStats>(() => migrateStats(load(STATS_KEY, EMPTY_STATS)));
  const statsRef = useRef(userStats);
  statsRef.current = userStats;

  useEffect(() => save(STATS_KEY, userStats), [userStats]);
  useEffect(() => save(SETTINGS_KEY, settings), [settings]);

  const handleStartGame = (next: GameSettings) => {
    setSettings(next);
    openBattle();
  };

  /** タイピング修行はポップアップで開く（食券購入で設定 → 修行の流れ） */
  const [battleOpen, setBattleOpen] = useState<boolean>(false);
  const openBattle = () => {
    setBattleKey((k) => k + 1);
    setBattleOpen(true);
  };
  const closeBattle = () => setBattleOpen(false);

  // ポップアップ表示中は背面のスクロールを止める
  useEffect(() => {
    document.body.style.overflow = battleOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [battleOpen]);

  /** 1ゲームの結果を記録。自己ベスト更新なら true */
  const handleRecord = useCallback((r: GameResult): boolean => {
    const prev = statsRef.current;
    const prevBest = prev.bestScores[r.mode]?.score ?? 0;
    const counts = !r.gaveUp;
    const isBest = counts && r.score > prevBest;
    const cleared = !r.expelled && !r.gaveUp;
    const date = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const games = prev.recentGames.length;

    const next: UserStats = {
      ...prev,
      bowlsCleared: prev.bowlsCleared + (cleared ? 1 : 0),
      strikesCount: prev.strikesCount + (r.expelled ? 1 : 0),
      maxWpm: Math.max(prev.maxWpm, r.wpm),
      accuracyAvg: r.keys > 0 ? Math.round(((prev.accuracyAvg * games + r.accuracy) / (games + 1)) * 10) / 10 : prev.accuracyAvg,
      lifetimeKeystrokes: prev.lifetimeKeystrokes + r.keys,
      perfectClears: prev.perfectClears + (cleared && r.misses === 0 && r.breaks === 0 ? 1 : 0),
      title: cleared ? `${r.rank}（${TICKET_CONFIGS[r.mode].name}）` : prev.title,
      bestScores: isBest ? { ...prev.bestScores, [r.mode]: { score: r.score, rank: r.rank, date } } : prev.bestScores,
      recentGames: [
        {
          id: `g-${Date.now()}`,
          mode: r.mode,
          date,
          wpm: r.wpm,
          accuracy: r.accuracy,
          time: r.expelled ? '強制退店' : r.gaveUp ? 'ギブアップ' : `${r.durationSec.toFixed(1)}秒`,
          cleared,
          score: r.score,
          rank: r.rank,
        },
        ...prev.recentGames.slice(0, 19),
      ],
    };
    statsRef.current = next;
    setUserStats(next);
    setLastResult({ ...r, isBest });
    return isBest;
  }, []);

  const handleNavigate = (screen: ScreenType) => {
    setBattleOpen(false);
    setCurrentScreen(screen);
  };

  const handleUpdateStats = (newPartial: Partial<UserStats>) => {
    setUserStats((prev) => ({ ...prev, ...newPartial }));
  };

  return (
    <div className="bg-[#131313] font-mplus text-[#e5e2e1] min-h-screen flex flex-col">
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        bowlsCleared={userStats.bowlsCleared}
        playerName={userStats.playerName}
        avatar={userStats.avatar}
      />

      <main className="w-full pt-44 lg:pt-32 flex-1 max-w-[920px] mx-auto px-4">
        {currentScreen === 'ticket-vending' && (
          <TicketVending initialSettings={settings} bestScores={userStats.bestScores} onStartGame={handleStartGame} active={!battleOpen} />
        )}

        {currentScreen === 'leaderboard' && (
          <Leaderboard
            userStats={userStats}
            lastResult={lastResult}
            onPlayAgain={openBattle}
            onBackToShop={() => setCurrentScreen('ticket-vending')}
          />
        )}

        {currentScreen === 'regular-card' && (
          <RegularCard userStats={userStats} onNavigate={handleNavigate} onUpdateStats={handleUpdateStats} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* タイピング修行（ポップアップ） */}
      {battleOpen && (
        <div
          id="battlePopup"
          role="dialog"
          aria-modal="true"
          aria-label="タイピング修行"
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
        >
          <div className="relative w-full max-w-[860px] max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#131313] border-4 border-[#353534] rounded-2xl shadow-hard-xl">
            <TypingBattle
              key={battleKey}
              settings={settings}
              onRecord={handleRecord}
              onShowBoard={() => handleNavigate('leaderboard')}
              onQuit={closeBattle}
              player={{ name: userStats.playerName, avatar: userStats.avatar }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
