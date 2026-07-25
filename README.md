# 二人のインボックス（仮）

2人専用のプライベートタスク管理アプリ。React (Vite) + Node.js (Express) + PostgreSQL + Prisma で構築。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React, Vite, Tailwind CSS, @hello-pangea/dnd |
| バックエンド | Node.js, Express, Prisma |
| データベース | PostgreSQL |
| 認証 | JWT |

## セットアップ

### 1. PostgreSQL を起動

```bash
docker compose up -d
```

### 2. バックエンド

```bash
cd backend
cp .env.example .env   # 初回のみ
npm install
npm run db:push
npm run db:seed
npm run dev
```

バックエンドは `http://localhost:3001` で起動します。

### 3. フロントエンド

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## ログイン情報（Seed）

| 名前 | メールアドレス | パスワード |
|------|---------------|-----------|
| なおや | naoya@example.com | password123 |
| あゆみ | ayumi@example.com | password123 |

## 主な機能

- JWT 認証によるログイン
- カンバンボード（Inbox / Assigned / Done / Archived）
- ドラッグ＆ドロップによるステータス変更
- タスク作成（タイトル、詳細、優先度、期限、タグ）
- 担当者の割り当て
- アーカイブボックス（検索・フィルタリング）

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/auth/login` | ログイン |
| GET | `/api/tasks` | タスク一覧 |
| POST | `/api/tasks` | タスク作成 |
| PATCH | `/api/tasks/:id` | タスク更新 |
| DELETE | `/api/tasks/:id` | タスク削除 |
| GET | `/api/users` | ユーザー一覧 |

## デプロイ（本番環境）

Vercel（フロントエンド）+ Render（API + PostgreSQL）へのデプロイ手順は [docs/DEPLOY.md](docs/DEPLOY.md) を参照してください。

## プロジェクト構成

```
tasksApp/
├── backend/          # Express API
├── frontend/         # React SPA
├── docs/             # 設計書
└── docker-compose.yml
```
