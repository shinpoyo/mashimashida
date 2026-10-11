import React from 'react';
import { AVATAR_PRESETS, type PlayerAvatar as Avatar } from '../data/player';

interface PlayerAvatarProps {
  avatar: Avatar;
  /** 一辺の大きさ（px） */
  size?: number;
  className?: string;
  /** 「YOU」バッジを付ける（店主の写真と見分けるため） */
  badge?: boolean;
}

/**
 * プレイヤー（常連客）のアイコン。
 * 店主の写真（黄色の枠）と区別できるよう、ピンクの枠と「YOU」バッジで表示する。
 */
export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ avatar, size = 40, className = '', badge = true }) => {
  const preset = avatar.kind === 'preset' ? AVATAR_PRESETS.find((p) => p.id === avatar.id) ?? AVATAR_PRESETS[0] : null;
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span className="w-full h-full rounded-full overflow-hidden ring-2 ring-[#ffb3ae] bg-[#2a2a2a] flex items-center justify-center">
        {avatar.kind === 'image' ? (
          <img src={avatar.dataUrl} alt="あなたのアイコン" className="w-full h-full object-cover" draggable={false} />
        ) : (
          <span role="img" aria-label={`あなたのアイコン（${preset!.label}）`} className="leading-none" style={{ fontSize: Math.round(size * 0.58) }}>
            {preset!.emoji}
          </span>
        )}
      </span>
      {badge && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded bg-[#ffb3ae] text-[#3a0a0a] font-mono-code font-black leading-tight" style={{ fontSize: Math.max(8, Math.round(size * 0.16)) }}>
          YOU
        </span>
      )}
    </span>
  );
};
