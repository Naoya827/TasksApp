# 📋 タスク管理アプリ「二人のインボックス（仮）」基本設計書

本ドキュメントは、Node.js（Express）とReact（Vite）を完全に分離した、2人専用のプライベートタスク管理アプリの設計書である。ポートフォリオとしての見栄え（技術スタックのモダンさ・機能性）と、実用性を両立した設計とする。

---

## 1. システム概要 & アーキテクチャ

フロントエンドとバックエンドを完全に分離（Decoupled）し、APIを介してデータをやり取りする王道のWebアプリケーション構成。

* **フロントエンド**: React (Vite) + Tailwind CSS + UIコンポーネントライブラリ (shadcn/ui等)
    * 状態管理: `useState` / `Context API` (または `Zustand`)
    * ドラッグ＆ドロップ: `@hello-pangea/dnd` 
* **バックエンド**: Node.js (Express)
    * ORM: Prisma (型安全なクエリビルダー)
* **データベース**: PostgreSQL
* **認証方式**: JWT (JSON Web Token) による認可
* **インフラ（デプロイ先）**:
    * フロントエンド: Vercel
    * バックエンド / DB: Render または Railway

---

## 2. データベース設計（データベーススキーマ）

Prismaのスキーマ定義を意識した、PostgreSQLのテーブル構造。

### 2.1. `User`（ユーザー情報）
2人（俺・あゆみ）のデータを保持。新規登録（サインアップ）APIは実装せず、初期データ（Seed）として直接投入する。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key | ユーザーの一意識別子 |
| `name` | String | Not Null | 表示名（「俺」「あゆみ」など） |
| `email` | String | Not Null, Unique | ログイン用メールアドレス |
| `password_hash`| String | Not Null | ハッシュ化されたパスワード |
| `created_at` | DateTime | Default(now) | アカウント作成日時 |

### 2.2. `Task`（タスク情報）
タスクのコアデータを保持。Userテーブルとリレーション（1対多）を組む。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key | タスクの一意識別子 |
| `title` | String | Not Null | タスクのタイトル |
| `description` | String | Nullable | タスクの詳細・メモ |
| `status` | Enum | Not Null | 状態: `INBOX`, `ASSIGNED`, `DONE`, `ARCHIVED` |
| `priority` | Enum | Not Null | 優先度: `EMERGENCY`, `HIGH`, `MIDDLE`, `LOW`, `SOMEDAY` |
| `due_date` | DateTime | Nullable | 期限（日付） |
| `tags` | String[] | Default([]) | タスクに紐付くタグの配列 |
| `assignee_id` | String (UUID) | Nullable, Foreign Key | 担当者のUser.id（`INBOX`時はnull） |
| `created_at` | DateTime | Default(now) | タスク作成日時 |
| `updated_at` | DateTime | UpdatedAt | タスク更新日時 |

---

## 3. API設計（エンドポイント定義）

すべてのAPIリクエストのベースURLは `/api` とし、認証が必要なAPIはヘッダーに `Authorization: Bearer <JWT>` を必須とする。

### 3.1. 認証系 API
* `POST /api/auth/login`
    * 概要: ログインを実行し、JWTを発行する。
    * Request Body: `{ email, password }`
    * Response: `{ token, user: { id, name, email } }`

### 3.2. タスク系 API
* `GET /api/tasks`
    * 概要: タスク一覧を取得する（クエリパラメータでステータスやキーワード、日付、タグの絞り込みを可能にする）。
    * Query Params: `?status=ARCHIVED&search=キーワード&date=2026-07-10&tag=買い物`
* `POST /api/tasks`
    * 概要: 新規タスクを作成する（初期ステータスは `INBOX`、担当者は `null`）。
    * Request Body: `{ title, description, priority, due_date, tags }`
* `PATCH /api/tasks/:id`
    * 概要: タスクの情報を更新する（カンバンのドラッグ＆ドロップによるステータス変更、担当者の割り当て、アーカイブへの移動もこのAPIで行う）。
    * Request Body: `{ status, assignee_id, title, description, priority, due_date, tags }`
* `DELETE /api/tasks/:id`
    * 概要: タスクを物理削除する（基本はアーカイブ運用だが、間違えて作った場合の削除用）。

---

## 4. 画面遷移 & UI・UX設計

### 4.1. ログイン画面 (`/login`)
* メールアドレスとパスワードの入力フォーム。
* 認証成功後、トークンを `localStorage` 等に保存してメイン画面へリダイレクト。

### 4.2. メイン画面（カンバンボード） (`/`)
* **ヘッダー**: ログイン中のユーザー名表示、「アーカイブボックス」ページへのリンク、ログアウトボタン。
* **タスク作成エリア**: タイトル、詳細、優先度、期限、タグを入力してクイックに `Inbox` へ追加できるフォーム。
* **カンバンボード（4カラム構成）**:
    * `Inbox`（未割り当てのタスクが並ぶ）
    * `Assigned`（「俺」または「あゆみ」に割り当てられたタスク）
    * `Done`（完了したタスク）
    * `Archived`（ここに入ると画面上からは見えなくなる、またはこの列だけ非表示にできるスイッチを配置）
    * **UXポイント**: ドラッグ＆ドロップでタスクカードを別の列に移動させると、裏側で `PATCH /api/tasks/:id` が走り、リアルタイムに状態が更新される。

### 4.3. アーカイブボックス画面 (`/archive`)
* メイン画面から切り離された、過去のタスクを振り返るための専用ページ。
* `status === 'ARCHIVED'` のタスクのみをリスト形式、またはカレンダー形式で一覧表示。
* **検索・フィルタリング機能**:
    * 日付（作成日・完了日・期限）による期間指定検索。
    * フリーワード検索（タイトル・詳細）。
    * タグによる絞り込み。

---

## 5. ポートフォリオとしての評価ポイント（アピール項目）

1. **完全分離アーキテクチャ**: フロントエンド(React)とバックエンド(Node.js)を分けることで、CORS対策やセキュリティ、クリーンなAPI設計のスキルを証明。
2. **JWTによるセキュアな認証**: トークンベースの認証・認可フローを自前で実装。
3. **リレーショナルDBの活用**: Prismaを用いた高効率なテーブル連携と、インデックスを意識した検索・フィルタリングの実装。
4. **高度なUI/UX**: ライブラリを活用した直感的なドラッグ＆ドロップ操作のカンバンボードの実装。