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
import { CallMaster } from './components/CallMaster';
import { Leaderboard } from './components/Leaderboard';
import { MyKitchen } from './components/MyKitchen';
import { TICKET_CONFIGS } from './data/shop';

const STATS_KEY = 'mashimashida_stats_v2';
const SETTINGS_KEY = 'mashimashida_settings_v1';

const EMPTY_STATS: UserStats = {
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

const DEFAULT_SETTINGS: GameSettings = { mode: 'easy', toppings: [], penalty: 'none' };

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
  const [settings, setSettings] = useState<GameSettings>(() => load(SETTINGS_KEY, DEFAULT_SETTINGS));
  /** 同じ設定で再挑戦したときも TypingBattle を作り直すためのキー */
  const [battleKey, setBattleKey] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const [userStats, setUserStats] = useState<UserStats>(() => load(STATS_KEY, EMPTY_STATS));
  const statsRef = useRef(userStats);
  statsRef.current = userStats;

  useEffect(() => save(STATS_KEY, userStats), [userStats]);
  useEffect(() => save(SETTINGS_KEY, settings), [settings]);

  const handleStartGame = (next: GameSettings) => {
    setSettings(next);
    setBattleKey((k) => k + 1);
    setCurrentScreen('typing-battle');
  };

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
    if (screen === 'typing-battle') setBattleKey((k) => k + 1);
    setCurrentScreen(screen);
  };

  const handleUpdateStats = (newPartial: Partial<UserStats>) => {
    setUserStats((prev) => ({ ...prev, ...newPartial }));
  };

  return (
    <div className="bg-[#131313] font-mplus text-[#e5e2e1] min-h-screen flex flex-col">
      <Header currentScreen={currentScreen} onNavigate={handleNavigate} bowlsCleared={userStats.bowlsCleared} />

      <main className="w-full pt-44 lg:pt-32 flex-1 max-w-[920px] mx-auto px-4">
        {currentScreen === 'ticket-vending' && (
          <TicketVending initialSettings={settings} bestScores={userStats.bestScores} onStartGame={handleStartGame} />
        )}

        {currentScreen === 'typing-battle' && (
          <TypingBattle
            key={battleKey}
            settings={settings}
            onRecord={handleRecord}
            onShowBoard={() => setCurrentScreen('leaderboard')}
            onQuit={() => setCurrentScreen('ticket-vending')}
          />
        )}

        {currentScreen === 'call-master' && <CallMaster onGoToLeaderboard={() => setCurrentScreen('leaderboard')} onBack={() => setCurrentScreen('ticket-vending')} />}

        {currentScreen === 'leaderboard' && (
          <Leaderboard
            userStats={userStats}
            lastResult={lastResult}
            onPlayAgain={() => handleNavigate('typing-battle')}
            onBackToShop={() => setCurrentScreen('ticket-vending')}
          />
        )}

        {currentScreen === 'my-kitchen' && (
          <MyKitchen userStats={userStats} onNavigate={handleNavigate} onUpdateStats={handleUpdateStats} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
