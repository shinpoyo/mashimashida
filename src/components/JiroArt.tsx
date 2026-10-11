import React, { useMemo } from 'react';
import { Bowl } from '../engine/bowl';
import type { ToppingLevels } from '../engine/calls';
import chefImg from '../assets/images/chef.jpg';
import ramenImg from '../assets/images/ramen.jpg';
import ticketEasy from '../assets/images/tickets/easy.jpg';
import ticketNormal from '../assets/images/tickets/normal.jpg';
import ticketHard from '../assets/images/tickets/hard.jpg';
import ticketSuper from '../assets/images/tickets/super.jpg';
import type { GameMode } from '../types/game';

export type ChefMood = 'normal' | 'success' | 'stern' | 'wait';

const CHEF_MOOD_CLASS: Record<ChefMood, string> = {
  normal: 'ring-[#ffe100]',
  wait: 'ring-[#ffe100] saturate-75',
  success: 'ring-[#ffe100] brightness-110 shadow-[0_0_18px_rgba(255,225,0,0.65)] animate-chef-nod',
  stern: 'ring-[#970015] animate-rage',
};

interface ChefPhotoProps {
  mood?: ChefMood;
  /** サイズや形（rounded-full など）を指定 */
  className?: string;
  /** ring の太さ（Tailwind クラス） */
  ringClass?: string;
}

/** 店主（写真）。表情はリングの色とアニメーションで表現 */
export const ChefPhoto: React.FC<ChefPhotoProps> = ({ mood = 'normal', className = 'w-20 h-20 rounded-full', ringClass = 'ring-4' }) => (
  <div className={`relative overflow-hidden shrink-0 bg-[#2a2018] shadow-xl transition-all duration-200 ${ringClass} ${CHEF_MOOD_CLASS[mood]} ${className}`}>
    <img src={chefImg} alt="頑固店主（AI生成画像）" className="w-full h-full object-cover object-[50%_25%]" draggable={false} />
    {mood === 'stern' && <div className="absolute inset-0 bg-[#970015]/25 mix-blend-multiply" />}
  </div>
);

interface RamenPhotoProps {
  className?: string;
  /** object-position（丼の位置に合わせて調整） */
  position?: string;
}

/** 山盛りラーメン（写真・AI生成画像） */
export const RamenPhoto: React.FC<RamenPhotoProps> = ({ className = '', position = '50% 55%' }) => (
  <img
    src={ramenImg}
    alt="山盛りラーメン（AI生成画像）"
    className={`object-cover ${className}`}
    style={{ objectPosition: position }}
    draggable={false}
  />
);

/**
 * 食券ごとのラーメン写真。元写真のヤサイの山を伸縮させた差分（scripts/make_ticket_photos.py で生成）。
 * 本物の撮り下ろし／生成画像に差し替える場合は、このファイルの import 先を変えるだけでよい。
 */
const TICKET_PHOTOS: Record<GameMode, { src: string; alt: string }> = {
  easy: { src: ticketEasy, alt: '小ラーメン：ヤサイ少なめの丼' },
  normal: { src: ticketNormal, alt: '大ラーメン：標準の盛りの丼' },
  hard: { src: ticketHard, alt: '全マシマシ：ヤサイが高くそびえる丼' },
  super: { src: ticketSuper, alt: '超ハード：山盛りの丼' },
};

export const TicketPhoto: React.FC<{ mode: GameMode; className?: string }> = ({ mode, className = '' }) => (
  <img
    src={TICKET_PHOTOS[mode].src}
    alt={TICKET_PHOTOS[mode].alt}
    className={`object-cover ${className}`}
    style={{ objectPosition: '50% 50%' }}
    draggable={false}
  />
);

// 超ハードの出題用：トッピング量を段階表示できる SVG 丼（エンジン内部の文字列のみ描画）
interface BowlViewProps {
  lv: ToppingLevels;
  seed?: number;
  className?: string;
}

export const BowlView: React.FC<BowlViewProps> = ({ lv, seed = 1, className = '' }) => {
  const svg = useMemo(() => Bowl.render(lv, seed), [lv.yasai, lv.ninniku, lv.abura, lv.karame, seed]);
  return <div className={`jiro-bowl ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
};
