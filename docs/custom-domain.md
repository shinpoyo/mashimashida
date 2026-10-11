# 独自ドメインの取得と設定

現在の公開 URL：`https://shinpoyo.github.io/mashimashida/`（2026-10-11 公開）

## 1. ドメイン名を決める

- 「二郎」「jiro」など実在店舗・商標を含む名前は避ける（[compliance.md](compliance.md)）
- 空き状況（2026-10-11 時点、RDAP で確認）

| 候補 | 状況 |
|---|---|
| mashimashida.com | 未登録（取得できる見込み） |
| mashimashi-da.com | 未登録 |
| mashimashida.net | 未登録 |
| mashimashida.app / .dev | 未登録（※ HTTPS 必須のドメイン。GitHub Pages は HTTPS 対応なので問題なし） |
| mashimashida.games / mashimashi.games | 未登録の可能性が高い（照会が混雑で一部不確実） |
| mashimashida.jp | この方法では確認できず。登録業者のサイトで要確認 |

※ 空き状況は変わるので、購入直前に登録業者のサイトで再確認する

## 2. 登録業者（レジストラ）を選ぶ

| 業者 | 特徴 |
|---|---|
| Cloudflare Registrar | 原価販売で更新料が上がらない。DNS も Cloudflare で管理。英語 UI、クレジットカード必須。.jp は扱いなし |
| Porkbun | 安価で更新料もわかりやすい。英語 UI |
| お名前.com / ムームードメイン / Xserver ドメイン | 日本語・.jp も扱う。**初年度だけ安く、2年目以降の更新料が高い**ことが多いので更新価格を確認。お名前.com はオプションの勧誘が多い |

目安の年額：.com 約 1,500〜2,500円、.jp 約 3,000〜4,000円、.app / .dev 約 2,000〜3,000円、.games 約 3,000〜5,000円（業者・為替で変動）

チェックポイント
- **WHOIS 情報公開代行**（住所・氏名を公開しないための設定）を有効にする。多くの業者で無料
- **自動更新**を有効にする（失効すると第三者に取られる恐れ）
- アカウントに**2段階認証**を設定する

## 3. GitHub Pages に設定する

1. **ドメインの所有確認（乗っ取り防止）**
   GitHub 右上のアイコン → Settings → Pages → **Add a domain** → 表示された TXT レコードを DNS に追加 → Verify
2. **DNS レコードを追加**（登録業者または Cloudflare の DNS 画面）
   - ルート（例 `mashimashida.com`）を使う場合：
     - A レコード ×4：`185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153`
     - AAAA レコード ×4（任意・IPv6）：`2606:50c0:8000::153` / `2606:50c0:8001::153` / `2606:50c0:8002::153` / `2606:50c0:8003::153`
   - `www` も使う場合：CNAME `www` → `shinpoyo.github.io`
   - サブドメイン（例 `play.example.com`）だけ使う場合：CNAME `play` → `shinpoyo.github.io`
   - Cloudflare の DNS を使う場合は、まず「プロキシ（オレンジの雲）」をオフ（DNS only）にする
3. **リポジトリに設定**
   `shinpoyo/mashimashida` → Settings → Pages → **Custom domain** にドメインを入力して Save → DNS チェックが通ったら **Enforce HTTPS** にチェック（証明書の発行に最大 24 時間ほど）
4. **共有カード（OGP）の URL 更新**
   Actions タブ →「Deploy to GitHub Pages」→ Run workflow（main）を1回実行。公開 URL は自動で新しいドメインになる

## アプリ側の対応

- **コードの変更は不要**。ビルドは相対パス（`base: './'`）なので、ドメインのルートでもサブパスでも動く
- GitHub Actions でデプロイしているため、`CNAME` ファイルをリポジトリに置く必要もない
- 設定後は `https://shinpoyo.github.io/mashimashida/` から新しいドメインへ自動で転送される
- 同じアカウントの mashimashityping（`shinpoyo.github.io/mashimashityping/`）には影響しない
