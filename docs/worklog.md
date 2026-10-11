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

---

## 2026-10-11 フェーズ1：コアゲームの統合

### 決定事項（ユーザー回答）
1. 土台はどちらでもよい → 画面・部品が揃っている **mashimashida（React + TS）** を土台に採用
2. 作品名は **マシマシ打**
3. トッピング券は残す。退店ペナルティは**ゲーム開始前に選択**
4. 段階的に実装。キーボード前提なのでスマホ対応は不要

### 作業内容
1. **エンジン移植**（`src/engine/`）
   - `romaji.ts`：`Typer` / `MultiTyper`（表記ゆれ・順不同対応）
   - `calls.ts`：4モードの設定、コール生成、超ハードの正解列挙
   - `scoring.ts`：ロット得点・称号判定
   - `bowl.ts` / `master.ts`：丼と店主の SVG 生成（`JiroArt.tsx` で表示）
2. **データ**：固定フレーズ・ダミー番付の `data/phrases.ts` を削除し、`data/shop.ts`（食券・トッピング券・退店ペナルティ）に置換
3. **食券購入**：4モードの食券、トッピング券（ロット制向けに効果を再定義）、退店ペナルティ選択、SVG 丼プレビュー、投入金額チェック、キー `1`〜`4` / `Enter`
4. **タイピング修行**：ロット制に全面書き換え
   - カウントダウン → コール表示 → 打鍵（NEXT KEY ハイライト）→ 丼提供 or ロット乱し
   - 一時休戦（Esc）、ギブアップ、強制退店、結果モーダル（Space / Enter / Esc）
   - タイマーバーは rAF で DOM 直接更新（毎フレーム再レンダリングしない）
5. **完飲番付 / マイ厨房**：ダミーデータを削除し実データ化（直近結果・食券別自己ベスト・履歴・トロフィー条件）
6. **外部画像の置換**：googleusercontent 直リンク画像を店主・丼 SVG に置換
7. **その他**
   - 未使用依存（@google/genai, express, dotenv, esbuild, tsx）を削除 → `npm install` の依存衝突も解消
   - 固定ヘッダーに上部が隠れる問題を修正
   - `tests/engine.test.ts`（bun test, 18件）を追加

### 検証
- `tsc --noEmit` / `vite build` 成功
- `bun test`：18 pass
- Playwright で E2E 確認（JS エラーなし）
  - 生卵でミス無効、黒烏龍茶でロット乱し帳消し
  - 大ラーメン完走 → 結果モーダル → 完飲番付・自己ベスト保存
  - 鬼店主でミス5回 → 強制退店
  - 超ハードで時間切れ時に正解表示、一時休戦モーダル

### スクリーンショット
| 食券購入 | タイピング修行 | 超ハード |
|---|---|---|
| ![](screenshots/p1-ticket.png) | ![](screenshots/p1-battle.png) | ![](screenshots/p1-super.png) |

| 結果 | 完飲番付 |
|---|---|
| ![](screenshots/p1-result.png) | ![](screenshots/p1-board.png) |

### 次のステップ
- [ロードマップ](roadmap.md) のフェーズ2（コール道場の移植）

---

## 2026-10-11 丼・店主を写真デザインに戻す

### 依頼
- ラーメンのデザインが簡易的（SVG イラスト）になってしまっている。元のリアルなデザインにしたい、店主も

### 作業内容
1. AI Studio 版で使っていた写真3枚（丼・店主・ロゴ）を取得し、`src/assets/images/` に保存
   - 外部直リンク（期限切れリスク）だったものをリポジトリ内に取り込み、Vite でバンドル
   - 表示サイズに合わせて縮小（合計約 220KB）
2. `JiroArt.tsx` に `ChefPhoto` / `RamenPhoto` を追加し、元の配置に戻した
   - ヘッダー：ロゴ画像・店主アイコン
   - 食券購入：丼の写真プレビュー
   - タイピング修行：店主の写真（表情はリング色とアニメーションで表現：激怒＝赤リング＋脈動、正解＝黄色の発光＋うなずき）、提供カウンターの丼写真（調理中＝暗く、提供＝明るく跳ねる、ロット乱し＝白黒＋赤枠）と提供ゲージ
   - コール道場・マイ厨房：店主・丼の写真
3. 店主 SVG（`engine/master.ts`）は不要になったため削除
4. **超ハードの出題画像だけは SVG 丼のまま**（トッピング量 10 段階を描き分ける必要があり、写真1枚では表現できないため）

### 検証
- `tsc --noEmit` / `vite build` 成功、E2E（JS エラーなし）

---

## 2026-10-11 テストプレイ版の公開

- ビルド（相対パス）を Artifact として公開：https://claude.ai/artifact/Lf3wA2JLZjaA3hMt2UpLcy （非公開。オーナーのみ閲覧可）
- 公開前の確認で、`utils/audio.ts` が localStorage を例外処理なしで読んでおり、ストレージが使えない環境（プライベートモード等）でアプリが起動しない問題を発見 → try/catch で修正
