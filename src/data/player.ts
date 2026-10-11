/**
 * プレイヤー（＝お店に通う常連客）のプロフィール。
 * 店主はゲーム側のキャラクター（写真）で、プレイヤーとは別人。
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
export const DEFAULT_AVATAR: PlayerAvatar = { kind: 'preset', id: 'ramen' };
export const PLAYER_NAME_MAX = 16;

/** 画像の最大ファイルサイズ（読み込み前のチェック） */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** 保存するアイコンの一辺（px）。localStorage に収まるよう小さく保存する */
const ICON_SIZE = 128;

/** アップロード画像を中央で正方形に切り抜き、128px の JPEG データ URL にする */
export function imageFileToAvatar(file: File): Promise<PlayerAvatar> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('画像ファイル（JPEG・PNG など）を選んでください。'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('画像が大きすぎます。10MB 以下の画像を選んでください。'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像を読み込めませんでした。別の画像で試してください。'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('この画像は表示できない形式です。JPEG か PNG を選んでください。'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = ICON_SIZE;
        canvas.height = ICON_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('この環境では画像を加工できません。'));
          return;
        }
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, ICON_SIZE, ICON_SIZE);
        resolve({ kind: 'image', dataUrl: canvas.toDataURL('image/jpeg', 0.85) });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
