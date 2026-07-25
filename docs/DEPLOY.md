# デプロイ手順（Vercel + Render）

2人専用タスクアプリをインターネット上に公開する手順です。

| 役割 | サービス |
|------|---------|
| フロントエンド | [Vercel](https://vercel.com) |
| バックエンド API | [Render](https://render.com) |
| データベース | Render PostgreSQL |

---

## 前提

- GitHub アカウント
- Vercel アカウント（GitHub 連携）
- Render アカウント（GitHub 連携）
- このリポジトリが GitHub に push 済みであること

---

## 全体の流れ

```
1. GitHub に push
2. Render で API + DB をデプロイ
3. Render で Seed を実行
4. Vercel でフロントエンドをデプロイ
5. Render の CORS_ORIGIN を Vercel の URL に更新
6. 動作確認
```

---

## Step 1: GitHub に push

```bash
git add .
git commit -m "Add Vercel + Render deployment config"
git push origin main
```

---

## Step 2: Render でバックエンド + DB をデプロイ

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

### ヘルスチェック

ブラウザまたは curl で確認:

```bash
curl https://tasks-app-api.onrender.com/api/health
# → {"status":"ok"}
```

---

## Step 3: 初期データ（Seed）を投入

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

## Step 4: Vercel でフロントエンドをデプロイ

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

## Step 5: CORS を設定

Vercel の URL から API を呼び出せるよう、Render の環境変数を更新します。

1. Render Dashboard → `tasks-app-api` → **Environment**
2. `CORS_ORIGIN` を追加または更新:

```
https://tasks-app.vercel.app
```

※ 末尾のスラッシュは付けないでください。カスタムドメインを使う場合はその URL を指定します。

3. 保存すると自動で再デプロイされます

---

## Step 6: 動作確認

1. Vercel の URL をブラウザで開く
2. ログイン画面が表示されることを確認
3. `naoya@example.com` / `password123` でログイン
4. タスクの作成・移動ができることを確認
5. iPhone Safari でも同じ URL にアクセスして確認

---

## 本番運用前のチェックリスト

- [ ] Seed の初期パスワード `password123` を変更する
- [ ] Render の `JWT_SECRET` が自動生成されていることを確認（Dashboard → Environment）
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

## 無料プランの注意点

| サービス | 注意 |
|---------|------|
| Render Web Service | 15分間アクセスがないとスリープ。初回アクセスに30秒〜1分かかることがある |
| Render PostgreSQL | 無料 DB は90日後に期限切れ。本格運用時は有料プランを検討 |
| Vercel | 個人利用なら通常は無料枠で十分 |

---

## トラブルシューティング

### ログインできない / API エラー

1. ブラウザの開発者ツール → Network タブで API リクエストの URL を確認
2. `VITE_API_BASE` が `https://...onrender.com/api` になっているか確認
3. Render の `CORS_ORIGIN` が Vercel の URL と完全一致しているか確認

### Render が起動しない

1. Render Dashboard → `tasks-app-api` → **Logs** を確認
2. `DATABASE_URL` が DB にリンクされているか確認
3. Build ログで `prisma db push` が成功しているか確認

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
