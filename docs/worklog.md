# 作業履歴

## 2026-10-11 統合の分析とモック作成

### 依頼
- mashimashida と mashimashityping をいいとこどりで組み合わせたい
- デザインは mashimashida、ロジックは mashimashityping
- まずは分析してモックを作成

### 作業内容
1. 両リポジトリを確認
   - mashimashida は当初 README のみ → ユーザーがコードを push（`b1f7650 chore: scaffold project structure`）
   - 作業ブランチ `claude/peaceful-shannon-j91m6m` を `origin/main` に fast-forward
2. mashimashida を `bun install` → Vite で起動し、全 5 画面をスクリーンショットで確認
   - `npm install` は esbuild の peer 依存衝突で失敗（`bun.lock` があるので bun を使用）
3. mashimashityping を静的サーバーで起動し、タイトル／ゲーム／超ハードを確認
4. コードを読み比べて分析 → [`docs/merge-analysis.md`](merge-analysis.md)
5. 静的モックを作成 → `mock/`
   - `mock/engine/` に mashimashityping の `romaji.js` / `bowl.js` / `master.js` をコピー
   - `mock/mock.js`：`game.js` のコール生成・`MultiTyper`・採点を移植し、新しい DOM に接続
   - `mock/mock.css`：mashimashida のデザイントークンをプレーン CSS で再現
6. Playwright で動作確認（PC 1280px / スマホ 390px）
   - 大ラーメンを最後まで自動プレイ → 結果画面・自己ベスト更新まで遷移することを確認
   - コンソールエラーなし、横スクロールなし
   - 超ハードの丼サイズ、ヘッダー・ロット番号の折返しを調整

### 成果物
- `docs/merge-analysis.md` … 分析と統合方針
- `docs/screenshots/` … 比較用スクリーンショット
- `mock/` … 遊べる統合モック

### 次のステップ（要確認）
- `docs/merge-analysis.md` の「6. 決めたいこと」を参照
