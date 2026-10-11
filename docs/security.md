# セキュリティチェック

- 実施日：2026-10-11（独自ドメイン shinpoyo.com 移行直後）
- 対象：shinpoyo.com（DNS・ドメイン登録情報・HTTPS）、mashimashida / shinpoyo.github.io の公開内容・コード・依存ライブラリ・GitHub Actions
- 位置づけ：開発者による自主点検。外部の脆弱性診断ではありません

## 結論

**重大な問題はなし。** 静的サイトで、ログイン・サーバー・個人情報の送信がないため、攻撃される面がもともと小さい構成です。
ドメインまわりで「やっておくと安心」な設定がいくつかあります（[おすすめ設定](#おすすめ設定ユーザー作業)）。

## 確認して問題なしとしたもの

| 分類 | 確認内容 | 結果 |
|---|---|---|
| HTTPS | `http://` → `https://` への転送（ユーザーがブラウザで確認） | ✅ |
| 転送 | `www.shinpoyo.com` → `shinpoyo.com`、`shinpoyo.github.io/*` → `shinpoyo.com/*`（301） | ✅ |
| ドメイン乗っ取り対策 | GitHub のアカウント単位でドメインの所有確認済み（TXT）。他人が shinpoyo.com を自分の Pages に設定できない | ✅ |
| サブドメイン乗っ取り | ワイルドカード（`*.shinpoyo.com`）のレコードなし。使っていないサブドメインは存在しない | ✅ |
| ドメイン移管ロック | `client transfer prohibited`（勝手に他社へ移管されない） | ✅ |
| 登録者情報の公開 | 氏名・住所・電話・メールは `DATA REDACTED`（非公開）。**国（JP）と都道府県は公開**される（Cloudflare の仕様で、隠す設定はない） | ✅（都道府県のみ公開） |
| Cloudflare / GitHub | DNS は「DNS only」。Cloudflare アカウントは2要素認証を設定済み | ✅ |
| 機密情報 | 両リポジトリの全ファイル・履歴に API キー・パスワード・秘密鍵なし | ✅ |
| 個人情報 | コミットの作成者メールは noreply のみ。プレイ記録・名前・アイコン画像は端末の localStorage のみで外部送信なし（広告を有効にすると Google への外部送信あり。プライバシーポリシーで開示） | ✅ |
| 依存ライブラリ | `bun audit`：既知の脆弱性 0 件（114 パッケージ） | ✅ |
| XSS | ユーザーが入力する名前は React が自動でエスケープ。`dangerouslySetInnerHTML` は丼の SVG（内部の数値だけで生成）の 1 か所のみで、外部入力は入らない。`eval` 等なし | ✅ |
| 外部リンク | X 共有は `noopener` 付きで開き、本文・URL は `encodeURIComponent` 済み | ✅ |
| GitHub Actions | デプロイ用は必要な権限（`pages: write` / `id-token: write`）のみ。CI は権限指定がなかったため `contents: read` を明示（今回修正） | ✅（修正） |

## 仕様上できないこと（許容）

- **HSTS（ブラウザに https を記憶させるヘッダー）**：GitHub Pages の独自ドメインでは送られず、こちらで設定もできない。初回だけ `http://` で接続される可能性があるが、ログインや入力の送信がないサイトなので実害は小さい。どうしても付けたい場合は Cloudflare のプロキシ（オレンジの雲）を使う方法があるが、GitHub の証明書更新と干渉しやすいので現状は見送り
- **CSP などのセキュリティヘッダー**：GitHub Pages ではヘッダーを付けられない。`<meta>` で CSP を入れることはできるが、外部入力を表示しない構成のため効果が小さく、フォント等の読み込みを壊すリスクの方が大きいので見送り

## おすすめ設定（ユーザー作業）

shinpoyo.com ではメールを使っていないため、**他人が「@shinpoyo.com」を名乗ってなりすましメールを送れないようにする**設定が一番効果的です。Cloudflare → shinpoyo.com → DNS → Records → Add record（いずれも Proxy の欄は出ない）：

| Type | Name | 値 | 意味 |
|---|---|---|---|
| TXT | `@` | `v=spf1 -all` | このドメインからメールを送るサーバーはない |
| TXT | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` | なりすましメールは受信側で拒否してもらう |
| MX | `@` | Mail server `.`、Priority `0` | メールを受け取らない（Null MX）。入力できなければ省略可 |
| CAA | `@` | Tag `Only allow specific hostnames`（issue）、CA domain name `letsencrypt.org` | 証明書を発行できる会社を GitHub が使う Let's Encrypt に限定 |

> Cloudflare の DNS 画面に「Email security」の案内（Configure SPF / DMARC）が出ていれば、そこからでも同じ設定ができます。

そのほか：

- **DNSSEC**：Cloudflare → shinpoyo.com → DNS → Settings → **Enable DNSSEC**。Cloudflare Registrar ならボタン1つで完了（DNS の偽装対策）
- **GitHub の2要素認証**：GitHub → Settings → Password and authentication で有効になっているか確認（リポジトリ・Pages・ドメイン確認の要）
- **Cloudflare のリカバリーコード**：2要素認証の設定時に表示されたものを安全な場所に保管
- **ドメインの自動更新**：Cloudflare → Domain Registration → Manage Domains → shinpoyo.com → Auto renew がオン（期限 2027-10-11。切れると第三者に取られる恐れ）
