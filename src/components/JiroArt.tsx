import React, { useMemo } from 'react';
import { Bowl } from '../engine/bowl';
import { Master, type MasterMood } from '../engine/master';
import type { ToppingLevels } from '../engine/calls';

// SVG はエンジン内部で生成した文字列のみ（ユーザー入力は含まない）

interface BowlViewProps {
  lv: ToppingLevels;
  seed?: number;
  className?: string;
}

export const BowlView: React.FC<BowlViewProps> = ({ lv, seed = 1, className = '' }) => {
  const svg = useMemo(() => Bowl.render(lv, seed), [lv.yasai, lv.ninniku, lv.abura, lv.karame, seed]);
  return <div className={`jiro-bowl ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
};

interface MasterFaceProps {
  mood?: MasterMood;
  className?: string;
}

export const MasterFace: React.FC<MasterFaceProps> = ({ mood = 'normal', className = '' }) => {
  const svg = useMemo(() => Master.render(mood), [mood]);
  return <div className={`jiro-master ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
};
