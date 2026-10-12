/**
 * プレイヤーのアイコン（絵文字のプリセット）と名前の決まり。
 * ブラウザ専用の処理を含まないので、全国番付のサーバー（worker/）からも読み込める。
 */
export type PlayerAvatar = { kind: 'preset'; id: string } | { kind: 'image'; dataUrl: string };

export const AVATAR_PRESETS: { id: string; emoji: string; label: string }[] = [
  { id: 'ramen', emoji: '🍜', label: 'ラーメン' },
  { id: 'pig', emoji: '🐷', label: 'ぶた' },
  { id: 'garlic', emoji: '🧄', label: 'ニンニク' },
  { id: 'chopsticks', emoji: '🥢', label: '箸' },
  { id: 'fire', emoji: '🔥', label: '炎' },
  { id: 'steam', emoji: '♨️', label: '湯気' },
  { id: 'muscle', emoji: '💪', label: '力こぶ' },
  { id: 'cool', emoji: '😎', label: 'サングラス' },
];

export const DEFAULT_PLAYER_NAME = '名無しの常連客';
export const PLAYER_NAME_MAX = 16;
