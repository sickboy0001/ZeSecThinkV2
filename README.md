
- [hadbit-fastapi](#hadbit-fastapi)
  - [🚀 プロジェクト概要](#-プロジェクト概要)
  - [🛠 技術スタックと選定理由](#-技術スタックと選定理由)
  - [📋 基本仕様](#-基本仕様)
    - [1. 開発・実行環境](#1-開発実行環境)
    - [2. フロントエンド](#2-フロントエンド)
    - [3. バックエンド \& BaaS](#3-バックエンド--baas)
  - [📂 ディレクトリ構成](#-ディレクトリ構成)
  - [🚢 デプロイフロー](#-デプロイフロー)
  - [要件](#要件)
    - [非機能要件](#非機能要件)
    - [スタート画面](#スタート画面)
    - [登録画面](#登録画面)
    - [マスタ編集画面](#マスタ編集画面)
    - [統計画面](#統計画面)
  - [画面一覧とURL設計](#画面一覧とurl設計)
  - [各画面の責務](#各画面の責務)
    - [1. スタート画面 (`/dashboard`)](#1-スタート画面-dashboard)
    - [2. 登録画面 (`/logs`)](#2-登録画面-logs)
    - [3. マスタ編集画面 (`/Items`)](#3-マスタ編集画面-items)
    - [4. 統計画面 (`/analytics`)](#4-統計画面-analytics)
  - [論理構成図（テーブル定義）](#論理構成図テーブル定義)
    - [1. Users (auth.users / Supabase既存)](#1-users-authusers--supabase既存)
    - [2. hadbit\_items (習慣項目マスタ)](#2-hadbit_items-習慣項目マスタ)
    - [3. hadbit\_trees (習慣項目階層管理)](#3-hadbit_trees-習慣項目階層管理)
    - [4. hadbit\_logs (実施記録)](#4-hadbit_logs-実施記録)
    - [構成のポイント](#構成のポイント)
  - [DDL](#ddl)
- [クエリ頑張る系](#クエリ頑張る系)
  - [DB接続方法](#db接続方法)
- [履歴](#履歴)


# templateNextJsAuthSupabase

React NextJS Vercel Supabaseでの構成想定


## 🚀 プロジェクト概要

クリーンなディレクトリ構成とコンテナ化により、迅速な開発からデプロイまでをスムーズに行える構成になっています。

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

---

## 📂 ディレクトリ構成

- `src/app`: 画面（Pages）およびルートハンドラー
  - globals.css
  - layout.tsx
  - pages.tsx
  - `(auth)`: 認証周りの処理
    - login/:ログイン処理
    - signup/:新規でユーザー登録の登録用の画面
  - `(user)`: 認証済みのページ
    - dashboard/:ダッシュボード
      - page.tsx: 入り口のサーバーコンポーネント
    - logs/:習慣化の記録の確認
      - page.tsx: 入り口のサーバーコンポーネント
    - items/:習慣化のマスタの確認
      - page.tsx: 入り口のサーバーコンポーネント
- `src/components/`: 再利用可能なUIコンポーネント
  - auth/:認証周り
    - login:ログイン処理
    - signup:新規でユーザー登録の登録用の画面
  - layout/:Atomicデザインのlayoutでのコンポーネント
  - organisms/:Atomicデザインのorganismsでのコンポーネント
  - pages/:各ページから呼び出させる場所
  - ui/:shaduiのコンポーネントの保存
- `src/constants/:　定数の情報をもつ。解説コメントなども
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
  // まさにSQLをそのまま記載
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

###　注意点
接続先URL（Connection String）:
Supabaseの設定画面にある Transaction mode (ポート 6543) のURLを使ってください。Next.jsはサーバーレス環境（Vercelなど）で動くため、接続数が急増してもパンクしないようにするためです。

# 履歴
- 2026/2/7
  - README.MD更新　不要なもの削除
  - AuthForm見直し、Google部分  
- 2026/2/7
  - テンプレートにして、今後利用可能に。  
