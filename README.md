# マシマシ打 🍜

山盛りラーメンの「コール」特化タイピングゲーム。
「ニンニク入れますか？」――店主の問いかけに、迷わず即答せよ。

- **デザイン**：mashimashida（React 版）のダーク×イエロー UI、写真の丼・店主（AI 生成画像）
- **ロジック**：[mashimashityping](https://github.com/shinpoyo/mashimashityping) のローマ字判定・コール生成・SVG 丼描画を TypeScript に移植

> キーボードでのプレイ前提です（スマホ非対応）。

## 遊び方

1. **食券購入**：主食券（難易度）を選ぶ（キー `1`〜`4`）
   | 食券 | 内容 |
   |---|---|
   | 小ラーメン | 8ロット・短いコール中心 |
   | 大ラーメン | 10ロット・マシマシ解禁 |
   | 全マシマシ | 12ロット・順不同・時間激短・チョモランマあり |
   | 超ハード | 完成丼の画像だけを見てコールを当てる（順不同・全マシOK） |
2. **退店ペナルティ**を選ぶ（厳しいほどスコア倍率アップ）
   | ペナルティ | 条件 | 倍率 |
   |---|---|---|
   | なし | 最後まで遊べる | ×1.0 |
   | 乱し3回 | ロット乱し3回で強制退店 | ×1.1 |
   | 一発退店 | ロット乱し1回で強制退店 | ×1.3 |
   | 鬼店主 | ロット乱し1回 または ミス5回で強制退店 | ×1.5 |
3. `Enter` で着席 → ルール説明 → `Enter` / `Space` で開始 → 表示されたコールをローマ字で打つ。時間切れは「ロット乱し」
4. 結果は **完飲番付**（自己ベスト・履歴）と **マイ厨房**（称号・トロフィー）に保存（この端末の localStorage）

ローマ字は `shi/si`、`tsu/tu`、`nn/n`、`っ`（子音重ね / `ltu`）など一般的な表記ゆれに対応しています。
操作：`Esc` 一時休戦 ／ 結果画面で `Space` もう一杯・`Enter` 番付へ。

## 開発

```bash
bun install        # npm install でも可
bun run dev        # http://localhost:3000
bun run lint       # 型チェック（tsc --noEmit）
bun run test       # エンジンのユニットテスト（bun test）
bun run build      # dist/ に出力
```

### 構成

```
src/
  engine/        ゲームロジック（React 非依存）
    romaji.ts    ローマ字判定（Typer / MultiTyper）
    calls.ts     コール生成・難易度設定・超ハードの正解列挙
    scoring.ts   採点・称号
    bowl.ts      丼の SVG 生成（超ハードの出題用。トッピング量 0〜9 段階）
  assets/images/ 丼・店主の写真（AI 生成）、tickets/ に食券別の丼写真
assets-src/      画像の元データ（食券別写真の生成元）
scripts/         画像生成スクリプト（make_ticket_photos.py）
  data/shop.ts   食券・退店ペナルティ
  components/    画面（食券購入 / タイピング修行 / コール道場 / 完飲番付 / マイ厨房）
tests/           エンジンのテスト
docs/            統合分析・作業履歴・ロードマップ
mock/            統合前の静的モック（参考）
```

## ドキュメント

- [統合分析](docs/merge-analysis.md)
- [ロードマップ](docs/roadmap.md)
- [作業履歴](docs/worklog.md)
- [コンプライアンスチェック](docs/compliance.md)
- [ラーメン画像の差分計画](docs/image-variants.md)

## 免責

本作は非公式のファンメイド作品であり、実在の店舗・団体とは一切関係ありません。店主・ラーメンの写真は AI で生成した画像です。
