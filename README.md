# マシマシ打 🍜

山盛りラーメンの「コール」特化タイピングゲーム。
「ニンニク入れますか？」――店主の問いかけに、迷わず即答せよ。

- **デザイン**：mashimashida（React 版）のダーク×イエロー UI、写真の丼・店主（AI 生成画像）
- **ロジック**：[mashimashityping](https://github.com/shinpoyo/mashimashityping) のローマ字判定・コール生成・SVG 丼描画を TypeScript に移植

▶ **プレイ：** https://shinpoyo.com/mashimashida/

> キーボードでのプレイ前提です（スマホ非対応）。

## 遊び方

1. **食券購入**：主食券（難易度）を選ぶ（キー `1`〜`3`）
   | 食券 | 内容 |
   |---|---|
   | 小ラーメン | 8ロット・短いコール中心 |
   | 大ラーメン | 10ロット・マシマシ解禁 |
   | 全マシマシ | 12ロット・順不同・時間激短・チョモランマあり |
2. **退店ペナルティ**を選ぶ（厳しいほどスコア倍率アップ）
   | ペナルティ | 条件 | 倍率 |
   |---|---|---|
   | なし | 最後まで遊べる | ×1.0 |
   | 乱し3回 | ロット乱し3回で強制退店 | ×1.1 |
   | 一発退店 | ロット乱し1回で強制退店 | ×1.3 |
   | 鬼店主 | ロット乱し1回 または ミス5回で強制退店 | ×1.5 |
3. `Enter` で着席 → **タイピング修行のポップアップ**が開く → ルール説明 → `Enter` / `Space` で開始 → 表示されたコールをローマ字で打つ。時間切れは「ロット乱し」
4. 結果は **完飲番付**（自己ベスト・履歴）と **常連カード**（あなたのプロフィール・称号・トロフィー）に保存（この端末の localStorage）

> 登場人物：**あなた＝お店に通う常連客**（名前とアイコンは常連カードで変更可）、**店主＝お店の人**（写真）。
> 超ハード（丼の画像からコールを当てるモード）は一旦オフにしています（`src/data/shop.ts` の `MODE_ORDER` に `'super'` を足すと復活）。

ローマ字は `shi/si`、`tsu/tu`、`nn/n`、`っ`（子音重ね / `ltu`）など一般的な表記ゆれに対応しています。
操作：`Esc` 一時休戦 ／ 結果画面で `Space` もう一杯・`Enter` 番付へ。

## 開発

```bash
bun install        # npm install でも可
bun run dev        # http://localhost:3000
bun run lint       # 型チェック（tsc --noEmit）
bun run test       # エンジンのユニットテスト（bun test）
bun run build      # dist/ に出力
SITE_URL=https://example.com/ bun run build   # 共有カード（OGP）付きでビルド
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
  components/    画面（食券購入 / 完飲番付 / 常連カード）と、タイピング修行のポップアップ
  data/player.ts プレイヤー（常連客）の名前・アイコン
tests/           エンジンのテスト
docs/            統合分析・作業履歴・ロードマップ
```

## ドキュメント

- [統合分析](docs/merge-analysis.md)
- [ロードマップ](docs/roadmap.md)
- [作業履歴](docs/worklog.md)
- [コンプライアンスチェック](docs/compliance.md)
- [ラーメン画像の差分計画](docs/image-variants.md)
- [公開手順](docs/publishing.md)
- [独自ドメインの取得と設定](docs/custom-domain.md)

## 権利・ライセンス

Copyright (c) 2026 shinpoyo. All rights reserved.
ソースコード・画像・文章の無断転載・改変・再配布を禁じます（遊ぶこと・閲覧することは自由です）。
第三者のライブラリ・フォント・テンプレートについては [LICENSE](LICENSE) を参照してください。

## 免責

本作は非公式のファンメイド作品であり、実在の店舗・団体とは一切関係ありません。店主・ラーメンの写真は AI で生成した画像です。
