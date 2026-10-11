/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ScreenType, TicketDifficulty, CallOption, UserStats } from './types/game';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TicketVending } from './components/TicketVending';
import { TypingBattle } from './components/TypingBattle';
import { CallMaster } from './components/CallMaster';
import { Leaderboard } from './components/Leaderboard';
import { MyKitchen } from './components/MyKitchen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('ticket-vending');

  // Active game session settings
  const [battleDifficulty, setBattleDifficulty] = useState<TicketDifficulty>('sho');
  const [battleToppings, setBattleToppings] = useState<string[]>([]);
  const [battleCall, setBattleCall] = useState<CallOption>({
    garlic: 'normal',
    yasai: 'mashi',
    abura: 'mashi',
    karame: 'normal',
  });

  // Persistent user stats
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('jiro_user_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      bowlsCleared: 42,
      strikesCount: 2,
      maxWpm: 412,
      accuracyAvg: 98.4,
      lifetimeKeystrokes: 24890,
      perfectClears: 14,
      favoriteCall: 'ヤサイマシマシニンニクスクナメ アブラオオメカラメ',
      title: '前頭三枚目 (ロット維持者)',
      recentGames: [
        {
          id: 'g-1',
          mode: 'dai',
          date: '2025/10/11 12:45',
          wpm: 412,
          accuracy: 98.4,
          time: '2分14秒',
          cleared: true,
        },
        {
          id: 'g-2',
          mode: 'sho',
          date: '2025/10/10 18:20',
          wpm: 395,
          accuracy: 99.2,
          time: '1分35秒',
          cleared: true,
        },
        {
          id: 'g-3',
          mode: 'buta',
          date: '2025/10/09 13:10',
          wpm: 440,
          accuracy: 94.1,
          time: '撃沈',
          cleared: false,
        },
      ],
    };
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('jiro_user_stats', JSON.stringify(userStats));
  }, [userStats]);

  const handleStartGame = (difficulty: TicketDifficulty, toppings: string[], call: CallOption) => {
    setBattleDifficulty(difficulty);
    setBattleToppings(toppings);
    setBattleCall(call);
    setCurrentScreen('typing-battle');
  };

  const handleFinishBattle = (wpm: number, accuracy: number, clearTime: string, cleared: boolean) => {
    setUserStats((prev) => {
      const newBowls = cleared ? prev.bowlsCleared + 1 : prev.bowlsCleared;
      const newStrikes = !cleared ? prev.strikesCount + 1 : prev.strikesCount;
      const newMaxWpm = Math.max(prev.maxWpm, wpm);
      const newAccAvg = parseFloat((((prev.accuracyAvg + accuracy) / 2)).toFixed(1));
      const newPerfects = cleared && accuracy >= 99 ? prev.perfectClears + 1 : prev.perfectClears;

      const newHistoryItem = {
        id: `g-${Date.now()}`,
        mode: battleDifficulty,
        date: new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        wpm,
        accuracy,
        time: clearTime,
        cleared,
      };

      return {
        ...prev,
        bowlsCleared: newBowls,
        strikesCount: newStrikes,
        maxWpm: newMaxWpm,
        accuracyAvg: newAccAvg,
        perfectClears: newPerfects,
        lifetimeKeystrokes: prev.lifetimeKeystrokes + Math.round(wpm * 5),
        recentGames: [newHistoryItem, ...prev.recentGames.slice(0, 7)],
      };
    });

    setCurrentScreen('leaderboard');
  };

  const handleUpdateStats = (newPartial: Partial<UserStats>) => {
    setUserStats((prev) => ({ ...prev, ...newPartial }));
  };

  return (
    <div className="bg-[#131313] font-mplus text-[#e5e2e1] min-h-screen flex flex-col">
      <Header
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        bowlsCleared={userStats.bowlsCleared}
      />

      {/* Main Container offset for fixed header */}
      <main className="w-full pt-32 sm:pt-28 flex-1 max-w-[920px] mx-auto px-4">
        {currentScreen === 'ticket-vending' && (
          <TicketVending onStartGame={handleStartGame} />
        )}

        {currentScreen === 'typing-battle' && (
          <TypingBattle
            difficulty={battleDifficulty}
            toppings={battleToppings}
            callSettings={battleCall}
            onFinishGame={handleFinishBattle}
            onQuit={() => setCurrentScreen('ticket-vending')}
          />
        )}

        {currentScreen === 'call-master' && (
          <CallMaster onGoToLeaderboard={() => setCurrentScreen('leaderboard')} />
        )}

        {currentScreen === 'leaderboard' && (
          <Leaderboard
            userStats={userStats}
            onPlayAgain={() => setCurrentScreen('ticket-vending')}
          />
        )}

        {currentScreen === 'my-kitchen' && (
          <MyKitchen
            userStats={userStats}
            onNavigate={setCurrentScreen}
            onUpdateStats={handleUpdateStats}
          />
        )}
      </main>

      <Footer onNavigate={setCurrentScreen} />
    </div>
  );
}
