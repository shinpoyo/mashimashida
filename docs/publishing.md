# 公開手順

## 現状（2026-10-11）

- リポジトリ `shinpoyo/mashimashida` は **非公開（private）**
- 作業はすべて `claude/peaceful-shannon-j91m6m` ブランチにあり、**`main` にはまだ入っていない**
- テストプレイ版は Claude の Artifact（非公開リンク）で公開中

## 準備済みのもの

| 項目 | 内容 |
|---|---|
| ビルド設定 | `vite.config.ts` で `base: './'`（相対パス）。GitHub Pages のサブパス（`/mashimashida/`）や他のホスティングでもそのまま動く |
| 共有カード（OGP） | `public/ogp.jpg`（1200×630）。ビルド時に環境変数 `SITE_URL`（公開 URL、末尾 `/`）を渡すと `og:url` / `og:image` / `twitter:image` を出力。未指定なら出力しない |
| CI | `.github/workflows/ci.yml`：`main` 以外へのプッシュとプルリクエストで、型チェック・テスト・ビルドを実行 |
| Pages デプロイ | `.github/workflows/deploy-pages.yml`：`main` へのプッシュ（または手動実行）で GitHub Pages に公開 |

## 公開先の選択肢

| 案 | 費用 | コードの公開 | 必要な作業 |
|---|---|---|---|
| A. リポジトリを公開して GitHub Pages | 無料 | 誰でも見られる | リポジトリを public に変更 → Pages を有効化 |
| B. 非公開のまま Cloudflare Pages / Netlify など | 無料枠あり | 非公開のまま | 各サービスに登録して GitHub と連携（ビルドコマンド `bun run build`、出力 `dist`、環境変数 `SITE_URL`） |
| C. GitHub Pro を契約して非公開のまま GitHub Pages | 有料 | 非公開のまま | Pro 契約 → Pages を有効化 |
| D. まだ公開しない | 無料 | — | テストプレイ版（Artifact）で確認を続ける |

## A / C の手順（GitHub Pages）

1. 作業ブランチを `main` に取り込む（プルリクエストを作成してマージ）
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする
3. **Actions** タブで「Deploy to GitHub Pages」が動き、完了すると `https://shinpoyo.github.io/mashimashida/` で公開される
   - 動かない場合は Actions タブから「Run workflow」で手動実行できる

## 公開前に決めること

- **ライセンス**：MIT などで公開するか、ライセンスを付けずに権利を保持するか（[compliance.md](compliance.md) の B）
- **AI 生成画像の利用条件**：Google AI Studio の利用規約を確認（同 C）
- **AI Studio の残りファイル**：`metadata.json` / `.env.example` を削除するか（同 F）
