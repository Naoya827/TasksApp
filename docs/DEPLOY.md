# デプロイ手順（Vercel + Render）

2人専用タスクアプリをインターネット上に公開する手順です。

| 役割 | サービス |
|------|---------|
| フロントエンド | [Vercel](https://vercel.com) |
| バックエンド API | [Render](https://render.com) |
| データベース | Render PostgreSQL |

---

## デプロイの進め方（2段階）

まず **無料プランで体験**し、問題なければ **有料プランにアップグレード** します。

| フェーズ | 目的 | 月額 |
|---------|------|------|
| **Phase 1: 無料で体験** | デプロイの流れを確認・動作テスト | $0 |
| **Phase 2: 本番運用** | 常時稼働・データ永続化 | 約 $13 |

### Render の料金の見方

Render には2種類の「プラン」があります（[料金ページ](https://render.com/pricing) 参照）。

| 種類 | 例 | あなたが選ぶもの |
|------|-----|----------------|
| **ワークスペース** | Hobby ($0), Pro ($25) | **Hobby**（個人利用で十分） |
| **各サービスのコンピュート** | Starter ($7), Basic-256mb ($6) | Phase 2 で選択 |

Phase 1 ではコンピュートも **Free** のまま進めます。

---

## 前提

- [x] GitHub にリポジトリがある（`Naoya827/TasksApp`）
- [x] Vercel アカウント + GitHub 連携
- [x] Render アカウント + GitHub 連携

---

## 全体の流れ

```
Phase 1（無料で体験）
  1. Render で API + DB をデプロイ（Blueprint）
  2. Seed を実行
  3. Vercel でフロントエンドをデプロイ
  4. CORS を設定
  5. 動作確認

Phase 2（本番運用にアップグレード）
  6. Render の API を Starter ($7) に変更
  7. Render の DB を Basic-256mb ($6) に変更
```

---

## Step 1: Render でバックエンド + DB をデプロイ

1. [Render Dashboard](https://dashboard.render.com) を開く
2. **New** → **Blueprint**
3. このリポジトリを選択
4. `render.yaml` の内容が表示される → **Apply**

作成されるリソース:

- `tasks-db` — PostgreSQL（無料プラン）
- `tasks-app-api` — Node.js API サーバー（無料プラン）

5. デプロイ完了まで待つ（5〜10分程度）
6. `tasks-app-api` の **URL** をメモする  
   例: `https://tasks-app-api.onrender.com`

> **重要:** `render.yaml` を変更しても、既存サービスの設定は自動更新されないことがあります。  
> デプロイが失敗する場合は、`tasks-app-api` → **Settings** で以下を手動設定してください:
>
> | 項目 | 値 |
> |------|-----|
> | **Build Command** | `npm install --include=dev && npm run build` |
> | **Start Command** | `npm run start:render` |
>
> または Blueprint 画面から **Sync** を実行してください。

### ヘルスチェック

ブラウザまたは curl で確認:

```bash
curl https://tasks-app-api.onrender.com/api/health
# → {"status":"ok"}
```

---

## Step 2: 初期データ（Seed）を投入

Render の無料プランでは Shell が使えない場合があります。その場合はローカルから本番 DB に接続して Seed を実行します。

### 方法 A: Render Shell（使える場合）

1. `tasks-app-api` → **Shell** タブ
2. 以下を実行:

```bash
npm run db:seed
```

### 方法 B: ローカルから実行

1. Render Dashboard → `tasks-db` → **Connections** → **External Database URL** をコピー
2. ローカルで一時的に環境変数を設定して実行:

```bash
cd backend
DATABASE_URL="postgresql://..." npm run db:seed
```

Seed 完了後、以下のユーザーでログインできます（**本番運用前にパスワード変更を推奨**）:

| 名前 | メール | 初期パスワード |
|------|--------|---------------|
| なおや | naoya@example.com | password123 |
| あゆみ | ayumi@example.com | password123 |

---

## Step 3: Vercel でフロントエンドをデプロイ

1. [Vercel Dashboard](https://vercel.com/dashboard) を開く
2. **Add New** → **Project**
3. GitHub リポジトリをインポート
4. プロジェクト設定:

| 項目 | 値 |
|------|-----|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build`（デフォルト） |
| Output Directory | `dist`（デフォルト） |

5. **Environment Variables** を追加:

| Key | Value |
|-----|-------|
| `VITE_API_BASE` | `https://tasks-app-api.onrender.com/api` |

※ `tasks-app-api` は Step 2 でメモした Render のサービス名に合わせてください。

6. **Deploy** をクリック
7. デプロイ完了後、Vercel の URL をメモする  
   例: `https://tasks-app.vercel.app`

---

## Step 4: CORS を設定

Vercel の URL から API を呼び出せるよう、Render の環境変数を更新します。

1. Render Dashboard → `tasks-app-api` → **Environment**
2. `CORS_ORIGIN` を追加または更新:

```
https://tasks-app.vercel.app
```

※ 末尾のスラッシュは付けないでください。カスタムドメインを使う場合はその URL を指定します。

3. 保存すると自動で再デプロイされます

---

## Step 5: 動作確認（Phase 1 完了）

1. Vercel の URL をブラウザで開く
2. ログイン画面が表示されることを確認
3. `naoya@example.com` / `password123` でログイン
4. タスクの作成・移動ができることを確認
5. iPhone Safari でも同じ URL にアクセスして確認

---

## Phase 2: 有料プランへアップグレード（本番運用）

Phase 1 で動作確認できたら、常時稼働のためにアップグレードします。

### API サーバーを Starter に変更

1. Render Dashboard → `tasks-app-api` → **Settings**
2. **Instance Type** を **Free** → **Starter** ($7/月) に変更
3. 保存（自動で再デプロイ）

### PostgreSQL を Basic に変更

1. Render Dashboard → `tasks-db` → **Settings**
2. **Instance Type** を **Free** → **Basic-256mb** ($6/月) に変更
3. 保存

### アップグレード後の月額

```
Hobby ワークスペース ($0) + Starter API ($7) + Basic DB ($6) = 約 $13/月
```

### 本番運用前のチェックリスト

- [ ] API を Starter、DB を Basic-256mb にアップグレード済み
- [ ] Seed の初期パスワード `password123` を変更する
- [ ] Render の `JWT_SECRET` が自動生成されていることを確認
- [ ] Vercel の `VITE_API_BASE` が正しい Render URL を指している
- [ ] Render の `CORS_ORIGIN` が Vercel の URL と一致している

### パスワード変更（任意）

現時点ではパスワード変更 API は未実装です。変更する場合は Seed スクリプトのパスワードを書き換えて再実行するか、DB を直接更新してください。

---

## 再デプロイ

コードを push すると、Render / Vercel ともに自動で再デプロイされます（GitHub 連携時）。

手動で再デプロイする場合:

- **Render**: サービス画面 → **Manual Deploy** → **Deploy latest commit**
- **Vercel**: Deployments タブ → 最新デプロイの **Redeploy**

---

## 無料プランの注意点（Phase 1）

| サービス | 注意 |
|---------|------|
| Render Web Service | 15分間アクセスがないとスリープ。初回アクセスに30秒〜1分かかる |
| Render PostgreSQL | **無料 DB は30日で期限切れ**（その後14日の猶予→削除） |
| Vercel | 個人利用なら通常は無料枠で十分 |

無料版は「デプロイの体験・動作確認」向けです。実際に2人で毎日使うなら Phase 2 へのアップグレードを推奨します。

---

## トラブルシューティング

### ログインできない / API エラー

1. ブラウザの開発者ツール → Network タブで API リクエストの URL を確認
2. `VITE_API_BASE` が `https://...onrender.com/api` になっているか確認
3. Render の `CORS_ORIGIN` が Vercel の URL と完全一致しているか確認

### Render が起動しない / Failed deploy

1. **Build Logs** を確認（Runtime Logs ではない）
   - `tasks-app-api` → **Events** タブ → 最新の Deploy をクリック → **Build logs**
2. よくある原因:
   - `NODE_ENV=production` のとき devDependencies が入らず TypeScript ビルドが失敗 → `buildCommand` に `--include=dev`
   - ビルド中に DB に接続できない（`P1001: Can't reach database server`）→ `prisma db push` を **Build Command から削除**し、**Start Command** で実行
   - `render.yaml` を更新しても古い Build Command が使われている → Settings で手動更新、または Blueprint **Sync**
3. `DATABASE_URL` が DB にリンクされているか確認
4. Build ログで `prisma db push` が成功しているか確認

### curl が何も返さない

`curl` にタイムアウトを指定しないと、応答がない間ずっと待ち続けます。

```bash
curl --max-time 90 https://tasks-app-api-9jkk.onrender.com/api/health
```

ルート URL（`/`）ではなく `/api/health` を使ってください。

### Vercel で 404（ページリロード時）

`frontend/vercel.json` の SPA リライト設定があることを確認してください（リポジトリに含まれています）。

---

## カスタムドメイン（任意）

### Vercel

Settings → Domains → ドメインを追加 → DNS 設定

### Render

`CORS_ORIGIN` をカスタムドメインの URL に更新  
例: `https://tasks.example.com`

`VITE_API_BASE` の変更は不要（API は Render の URL のまま）。
