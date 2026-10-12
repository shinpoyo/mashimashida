# 全国完飲番付（オンラインランキング）

2026-10-12 導入。方針（ユーザー決定）：

- サーバー：**Cloudflare Workers + D1**（`api.shinpoyo.com`）
- 不正対策：**サーバーで採点をやり直す**
- 期間：**日間・週間・月間・歴代**（日本時間で区切る。週は月曜はじまり）
- 名前：**常連カードの名前＋絵文字アイコン**、1人1行（期間内の自己ベスト）、NG ワード制限、運営が後から非表示にできる

## しくみ

```
ブラウザ（マシマシ打）                       api.shinpoyo.com（worker/）              D1
  食券を選んで開始 ── POST /v1/session ──▶ シードを発行（1回使い切り）──────────▶ sessions
  シードから出題を作って遊ぶ
  （打鍵ごとに キー と 時刻 を記録）
  終了 ── POST /v1/scores（打鍵の記録）──▶ 同じシードで出題を再現
                                             記録を再生して判定・採点をやり直す
                                             人の操作として自然か検査
                                             通れば登録 ─────────────────────────▶ players / scores
  完飲番付 ── GET /v1/rankings ──────────▶ 期間内の自己ベスト上位50人
```

- 出題（`src/engine/calls.ts`）・ローマ字判定（`romaji.ts`）・採点（`scoring.ts`・`replay.ts`）は、ブラウザとサーバーで**同じコード**を使う。ブラウザの結果画面の点数も、打鍵の記録を `replayGame()` で再生して確定しているので、サーバーの点数と必ず一致する
- 点数だけを書き換えた送信は通らない（サーバーは点数を受け取らず、記録から計算する）
- 通信できないときは、いつもどおり遊べる（その回は番付に載らない）

## 不正対策

| 対策 | 内容 |
|---|---|
| サーバーで採点し直す | シードから出題を再現し、打鍵の記録を再生して点数を計算。記録が出題と合わない・時刻が逆戻りする・持ち時間を過ぎた打鍵がある、などは不正として登録しない |
| 1回使い切り | 1つのシードで登録できるのは1回だけ。発行から30分を過ぎたら無効 |
| 実時間の検査 | シード発行から送信までの実時間が、記録上のプレイ時間より短ければ不正（記録の捏造） |
| 人間らしさの検査 | 平均 16 打鍵/秒を超える、30ms 未満の間隔が3割を超える、各ロットの最初の1打が 0.12 秒未満のことが半分を超える、のいずれかで登録しない |
| 連投の制限 | IP アドレスのハッシュごとに、開始 60回・登録 30回 / 10分まで |
| 名前 | 制御文字を除いて16文字まで。NG ワード（下品な言葉・差別語・URL など）を含む名前は登録しない（`worker/src/ngwords.ts`） |
| 運営による非表示 | 問題のある名前・記録は、管理用 API でプレイヤーごと番付から隠せる |

> 完全な不正防止は不可能（人間らしく打つ自動入力プログラムまでは見分けられない）。上位に不自然な記録があれば、管理用 API で隠す運用にする。

## 記録するデータ

| テーブル | 内容 |
|---|---|
| `sessions` | シード、食券、ペナルティ、IP アドレスのハッシュ、発行時刻、使用済みか（1日で削除） |
| `players` | プレイヤー ID の SHA-256（生の ID は保存しない）、名前、アイコンの種類、非表示フラグ |
| `scores` | 食券、ペナルティ、点数、称号、打鍵/秒、正確率、日時（日・週・月の区切り） |
| `rate` | 連投制限のカウンター（期限切れは毎日削除） |

打鍵の記録そのものは検証に使うだけで保存しない。プレイヤー ID はブラウザの localStorage にあるランダムな値で、番付には SHA-256 の先頭12文字（`ph`）だけを出す（自分の行の強調に使う）。

## 設定手順（初回だけ・ユーザー作業）

### 1. Cloudflare の API トークンを作る

1. Cloudflare のダッシュボード → 右上のアイコン → **My Profile** → **API Tokens** → **Create Token**
2. テンプレート **「Edit Cloudflare Workers」** の **Use template**
3. **Permissions** に次の2行を **+ Add more** で追加
   - `Account` ・ `D1` ・ `Edit`
   - `Zone` ・ `DNS` ・ `Edit`
4. **Account Resources**：自分のアカウント、**Zone Resources**：`Specific zone` ・ `shinpoyo.com`
5. **Continue to summary** → **Create Token** → 表示されたトークンをコピー（一度しか表示されない）
6. **アカウント ID**：ダッシュボードの **Workers & Pages** を開くと右側に「Account ID」がある → コピー

### 2. GitHub に登録する

mashimashida リポジトリの **Settings → Secrets and variables → Actions**

- **Secrets**（New repository secret）
  - `CLOUDFLARE_API_TOKEN`：1 のトークン
  - `CLOUDFLARE_ACCOUNT_ID`：1 のアカウント ID
  - `RANKING_ADMIN_TOKEN`：管理用の合言葉（長いランダムな文字列。パスワード生成機能などで32文字以上）
  - `RANKING_IP_SALT`：IP をハッシュにするときの塩（別の長いランダムな文字列）
- **Variables**（New repository variable）
  - `RANKING_API`：`https://api.shinpoyo.com`

### 3. デプロイ

1. Actions →「**Deploy ranking API**」→ **Run workflow**（main）
   - D1 データベースの作成、テーブルの作成、Worker のデプロイ、`api.shinpoyo.com` の設定まで自動で行う
2. 成功したら Actions →「**Deploy to GitHub Pages**」→ **Run workflow**（main）
   - `RANKING_API` が入ったビルドになり、全国完飲番付が表示される

以降は、`worker/` やゲームの判定・採点のコードを変えて main に入れると、API も自動で更新される。

## 管理（問題のある名前・記録を隠す）

```bash
TOKEN='（RANKING_ADMIN_TOKEN の値）'

# 最近の登録 100件（ph はプレイヤーの記号）
curl -s -H "authorization: Bearer $TOKEN" https://api.shinpoyo.com/v1/admin/recent

# そのプレイヤーを番付から隠す（"hidden": false で戻す）
curl -s -X POST -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"ph":"0123456789ab"}' https://api.shinpoyo.com/v1/admin/hide
```

Claude に「全国番付の○○という名前を消して」と頼む場合は、合言葉をチャットに書かず、上のコマンドを自分で実行するか、Claude が用意した手順に従う。

## 開発

```bash
cd worker
bun install
bunx wrangler d1 migrations apply mashimashi-ranking --local   # ローカルの D1 にテーブルを作る
printf 'ADMIN_TOKEN=test\nIP_SALT=test\n' > .dev.vars
bunx wrangler dev --local --port 8787                           # http://localhost:8787

# 別のターミナルで、ローカル API を使うゲームを起動
cd .. && VITE_RANKING_API=http://localhost:8787 bun run dev
```

- テスト：`bun test tests/`（出題の再現・採点の再生・不正検査・期間の区切り・名前チェック）
- `worker/wrangler.toml` の `database_id` はデプロイ時にワークフローが埋める（リポジトリには入れない）
