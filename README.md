

# ZeSecThinkV2


---



## 🚀 プロジェクト概要

- React NextJS Vercel Supabaseでの構成想定
- ゼロ秒思考リスペクトで生まれたアプリです。
- 本当に大事なのは鍛え続けることと感じた故作ったメモアプリです。


---

## 🛠 技術スタック


- フロントエンド: React, Next.js, TypeScript
- UI: Tailwind CSS, shadcn/ui
- データベース: Supabase
- デプロイ: Vercel

---

## 📋 基本仕様

### 1\. 開発・実行環境

* **エディタ**: Visual Studio Code (VS Code)
* **開発支援**: Gemini Code Assist
* **ランタイム**: TypeScript React 

### 2\. フロントエンド

* **非同期通信**: React NextJS
* **スタイリング**: Shadcnui (Tailwind CSS)

### 3\. バックエンド \& BaaS

* **DB/Auth**: Supabase (PostgreSQL / Supabase Auth)
* **Google OAuth**

---

## 📂 ディレクトリ構成

- `src/app`: 画面（Pages）およびルートハンドラー
  - globals.css
  - layout.tsx
  - pages.tsx
  - startPage/:スタートページ：基本的な機能や、実際の使い方など
    - page.tsx: 入り口のサーバーコンポーネント
  - `(auth)`: 認証周りの処理
    - login/:ログイン処理
    - signup/:新規でユーザー登録の登録用の画面
  - `(user)`: 認証済みのページ
    - dashboard/:ダッシュボード
      - page.tsx: 入り口のサーバーコンポーネント
    - zst/posts/:
      - page.tsx: 入り口のサーバーコンポーネント
    - zst/logs/:  
      - page.tsx: 入り口のサーバーコンポーネント
    - zst/analytics/:
      - page.tsx: 入り口のサーバーコンポーネント
- `src/components/`: 再利用可能なUIコンポーネント
  - auth/:認証周り
    - login:ログイン処理
    - signup:新規でユーザー登録の登録用の画面
  - layout/:Atomicデザインのlayoutでのコンポーネント
  - organisms/:Atomicデザインのorganismsでのコンポーネント
  - `pages`/:各ページから呼び出させる場所
    - `posts.tsx` 投稿の実装、間近の投稿具合も確認できる。
    - `logs.tsx` 登録の参照、評価を行う
    - `analytics.tsx` 統計を行った結果を見る
    - `dashboard.tsx` スタート画面。投稿状況など提示
  - ui/:shaduiのコンポーネントの保存
- `src/constants/`:　定数の情報をもつ。解説コメントなども
- `src/service/`: ビジネスロジック
- `src/lib/`: Supabaseクライアントなどの共通ロジック
  - util.ts
  - utilNumber.ts
  - utilDate.ts
  - supabase/:Supabase周り
    - auth.ts
    - db.ts
- `src/middleware.ts`: 認証状態に基づいたリダイレクト制御



---

## 要件
### 非機能要件
- **表示順の変更:** よく使うボタンを上に持ってくる（ソート機能）は必要
  - マスタ編集画面で変更して、それに合わせて登録画面で作成する
- **完了状態の可視化:** 登録画面の下のほうに、登録済みのデータが見えるようにする。

## DB接続方法
```
// lib/db.ts
import postgres from 'postgres'

// Supabaseの「Transaction mode」か「Session mode」のURLを使用
const connectionString = process.env.DATABASE_URL!
const sql = postgres(connectionString, {
  prepare: false // Supabaseのトランザクションモード(Port 6543)を使う場合はfalseを推奨
})

export default sql



// app/items/page.tsx
import sql from '@/lib/db'

export default async function Page() {
  const items = await sql`
    SELECT * FROM items 
    WHERE status = ${'active'}
    ORDER BY created_at DESC
  `

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
```


## テーブル定義: `zstu_posts` (最終構成)


| カラム物理名 | 論理名 | データ型 | 必須 | デフォルト / 制約 | 備考 |
| --- | --- | --- | --- | --- | --- |
| **id** | 投稿ID | `serial` | ◯ | PRIMARY KEY | 自動採番 |
| **user_id** | ユーザーID | **`uuid`** | ◯ |  | 投稿者の識別子 (auth.users.id) |
| **current_at** | 基準日時 | `timestamp` | - | `CURRENT_TIMESTAMP` | 投稿の対象日・時刻 |
| **title** | タイトル | `text` | ◯ |  |  |
| **content** | 本文 | `text` | ◯ |  |  |
| **tags** | タグリスト | **`text[]`** | ◯ | **`'{}'`** | タグの配列。検索用GINインデックス推奨 |
| **source_type** | 連携元種別 | `varchar` | - |  | `observation`, `hadbit` 等 |
| **source_key** | 連携元キー | **`text`** | - | **UNIQUE (type, key)** | 連携元のID (Int/UUID等を保持) |
| **source_detail** | 連携元詳細 | **`jsonb`** | - |  | 連携元特有の情報 (距離、単位、銘柄等) |
| **second** | 所要秒数 | `integer` | ◯ | `0` | 執筆や実施にかかった秒数 |
| **public_flg** | 公開フラグ | `boolean` | ◯ | `true` | 全体公開設定 |
| **public_content_flg** | 内容公開フラグ | `boolean` | ◯ | `true` | コンテンツ部分の公開設定 |
| **delete_flg** | 削除フラグ | `boolean` | ◯ | `false` | 論理削除フラグ |
| **write_start_at** | 執筆開始日時 | `timestamp` | - | `CURRENT_TIMESTAMP` |  |
| **write_end_at** | 執筆終了日時 | `timestamp` | - | `CURRENT_TIMESTAMP` |  |
| **created_at** | 作成日時 | `timestamp` | ◯ | `CURRENT_TIMESTAMP` | レコード作成日 |
| **updated_at** | 更新日時 | `timestamp` | ◯ | `CURRENT_TIMESTAMP` | レコード更新日 |

---

### 実装・運用のためのTips

* **インデックス作成:** タグでの検索（「このタグを含む投稿を表示」）を行う場合は、以下のインデックスを貼っておくと高速です。
```sql
CREATE INDEX idx_zstu_posts_tags ON zstu_posts USING GIN (tags);

```


* **クエリ例:** 「学習」タグが含まれる投稿を取得する場合：
```sql
SELECT * FROM zstu_posts WHERE '学習' = ANY(tags);
-- または --
SELECT * FROM zstu_posts WHERE tags @> ARRAY['学習'];

```


**この構成をベースに、次はコメント（`zstu_comments`）側の定義も作成しましょうか？それともSQLの作成に移りますか？**
### SQL 実装コード

```sql
-- 1. zstu_posts テーブルの作成
CREATE TABLE zstu_posts (
    id SERIAL PRIMARY KEY,                          -- 投稿ID
    user_id UUID NOT NULL,                          -- ユーザーID (auth.users.id)
    current_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 基準日時
    title TEXT NOT NULL,                            -- タイトル
    content TEXT NOT NULL,                          -- 本文
    tags TEXT[] NOT NULL DEFAULT '{}',              -- タグリスト (配列型)
    source_type VARCHAR,                            -- 連携元種別
    source_key TEXT,                                -- 連携元キー
    source_detail JSONB,                            -- 連携元詳細
    second INTEGER NOT NULL DEFAULT 0,              -- 所要秒数
    public_flg BOOLEAN NOT NULL DEFAULT true,       -- 公開フラグ
    public_content_flg BOOLEAN NOT NULL DEFAULT true,-- 内容公開フラグ
    delete_flg BOOLEAN NOT NULL DEFAULT false,      -- 削除フラグ
    write_start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 執筆開始日時
    write_end_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 執筆終了日時
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    
    -- 連携元種別とキーの組み合わせでユニーク制約（既存定義に準拠）
    UNIQUE (source_type, source_key)
);

-- 2. タグ検索を高速化するための GIN インデックス
-- これにより、数万件のデータがあっても「特定のタグを含む投稿」を瞬時に検索できます
CREATE INDEX idx_zstu_posts_tags ON zstu_posts USING GIN (tags);


```

## todo

- [ ] ダッシュボード見直し
- [ ] ログの見直し
- [ ] 形態素解析した結果の表示
- [ ] 形態素解析した結果からワードクラウドの展開
- [ ] AI利用してのタイポミスの保管：確認→登録
- [ ] AI利用してタグの付与機能：確認→登録
- [ ] タグについては専用用語として、説明含めて登録できるようにする
- [x] コンバート機能

## 履歴
- 2026年2月15日
  - １日ぐらいでここまでひとまず完了、デプロイまで実施

