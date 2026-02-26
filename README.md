

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


## `zstu_posts` 


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
| **state_detail** | 状態の詳細 | **`jsonb`** | - |  | AI連携の詳細 |

### zstu_posts:state_details

AIへの要求などの最終的な状態

|日本語の状態|推奨する英語定数 (Status)|説明・補足|
|:----|:----|:----|
|なし|unprocessed|まだ何もしていない初期状態。|
|再要求|pending_requeue|ユーザーが「やり直し」を求めた状態。次回のバッチ対象。|
|要求中|processing|AIにリクエストを投げた直後、または実行中。|
|受領済み|refined|AIの回答が届き、ユーザーの確認を待っている状態。|
|登録済み（更新あり）|completed_with_edit|AIの結果を元にユーザーが修正して確定させた。|
|登録済み|completed|AIの結果をそのまま確定させた。|

```
{
  "ai_refinement": {
    "status": "refined",
    "is_fixed": false,
    "last_refinement_id": 1234,
    "updated_at": "2026-02-26T14:00:00Z"
  }
}
```



## zstu_tag_descriptions
| カラム名 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | タグの一意識別子 |
| `user_id` | UUID / Int | FK | どのユーザーのタグかを識別 |
| `tag_name` | String(50) | Not Null | AIへの指示に使う短い識別子 (例: `zstv2`) |
| `name` | String(100) | Not Null | 画面表示用の正式名称 (例: `zerosecthinkv2`) |
| `aliases` | JSONB |  | 同義語リスト（重複回避用）(例：["パイソン", "Py", "python3"]) |
| `description` | Text | - | タグの意味やAIへの補足説明  |
| **`display_order`** | Int | Default: 0 | 画面上での表示順（昇順・降順でソート用） |
| **`is_active`** | Boolean | Default: true | 有効/無効フラグ。削除せずに非表示にしたい場合に使用 |
| **`is_send_ai`** | Boolean | Default: true | **AIへの送信対象にするか。** (※) |
| **`created_at`** | Timestamp | Not Null | レコード作成日時 |
| **`updated_at`** | Timestamp | Not Null | レコード更新日時 |

---

### 各項目の検討理由と詳細

#### 1. `is_active` (論理削除・有効化)

* **必要性：** 非常に高いです。
* **理由：** 過去のメモに関連付けられているタグを物理削除してしまうと、過去ログの整合性が崩れる可能性があります。「今は使わないけれどデータとして残しておきたい」場合に、`false` にすることで管理画面や選択肢から除外できます。

#### 2. `is_send_ai` (AI送信フラグ) ※「is_sendai」の解釈

* **必要性：** 高いです。
* **理由：** おそらく `is_send_ai`（AIに送るかどうか）の意図かと推察します。タグが増えてくると、全てのタグをプロンプト（`{tags}`）に含めるとトークン数（コスト）を消費しすぎたり、AIが混乱したりします。「このタグはAIに文脈を理解させるために必須」というものにチェックを入れて制御できると便利です。

#### 3. `display_order` (表示順)

* **必要性：** 高いです。
* **理由：** 作成順（`created_at`）だけでなく、よく使うタグを上に固定（ピン留め）したり、ユーザーが任意に並び替えたりできると、タグ管理画面の使い勝手が劇的に向上します。

#### 4. `created_at` / `updated_at` (タイムスタンプ)

* **必要性：** 必須レベルです。
* **理由：** データのデバッグ時や、「最近作ったタグから表示する」といった並び替え、またAIの処理履歴との突合に必ず必要になります。


---



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


{
  "ai_refinement": {
    "status": "refined",
    "is_fixed": false,
    "last_refinement_id": 1234,
    "updated_at": "2026-02-26T14:00:00Z"
  }
}

-- 1. details カラムの追加
ALTER TABLE public.zstu_posts 
ADD COLUMN details jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. JSONB 内部の検索を高速化するためのインデックス (任意ですが推奨)
-- ステータス等でフィルタリングする場合に劇的に速くなります
CREATE INDEX idx_zstu_posts_details ON public.zstu_posts USING gin (details);


-- 1. zstu_tag_descriptions テーブルの作成
CREATE TABLE zstu_tag_descriptions (
    id SERIAL PRIMARY KEY,                          -- integer型の自動採番
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,                  -- 表示用（短縮形）
    name VARCHAR(100) NOT NULL,                     -- 正式名称
    aliases JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_send_ai BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 2. 検索性を高めるためのインデックス
-- ユーザーごとのタグ取得を高速化
CREATE INDEX idx_zstu_tags_user_id ON zstu_tag_descriptions(user_id);
-- 表示順でのソートを高速化
CREATE INDEX idx_zstu_tags_display_order ON zstu_tag_descriptions(display_order);

```
　

## 1. なぜログを残すべきか

* **ハルシネーション（嘘）の確認:** AIが勝手に内容を書き換えてしまった場合、元の文面と突き合わせて検証できます。
* **プロンプトの改善:** `typo_content`（プロンプト）を変更した際、過去の修正結果と比較して「精度が上がったか」を評価できます。
* **コスト管理と統計:** どの程度の頻度で、どのモデル（Geminiのバージョン等）を使用したかの記録になります。

---

## 2. ログの登録先とテーブル定義案

既存の `Memos`（投稿）テーブルとは別に、**「AI処理のセッション」**と**「個別の実行ログ」**を分けるのがクリーンな設計です。AIに対するリクエスト自体複数になるので、まとめたai_batchesも利用する。



### `ai_Batches`



「1週間分のメモを修正する」という、ユーザーの1回の操作（リクエスト）を管理する親テーブルです。

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| `id` | Int | バッチ全体の一意識別子 |
| `user_id` | UUID | 実行ユーザー |
| `total_chunks` | Int | 全体の分割数（例：4チャンク） |
| `completed_chunks` | Int | 完了した数（進捗管理用） |
| `total_memos` | Int | 処理対象の総メモ件数（例：70件） |
| `status` | String | `processing`, `completed`, `partial_success`, `failed` |
| `created_at` | Timestamp | 開始日時 |

SQLiteを想定なので、UUID、JSONB -> TEXT型、Boolean -> Integer(0,1)

### ai_Execution_Logs

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| `id` | Int | ログの一意識別子 |
| `user_id` | UUID | 実行したユーザー |
|`batch_id` |int|`ai_Batches` へのリレーション|
|`chunk_index` |int|「4チャンク中、何番目のリクエストか」を記録します。|
| `prompt_template` | Text | 使用した `typo_content` のスナップショット |
| `raw_input_json` | JSONB | AIに送った実際のJSONデータ |
| `raw_output_text` | Text | AIから返ってきた生のレスポンス |
| `model_info` | String | 使用モデル (Gemini 1.5 Flash等) |
| **`api_version`** | String | `v1` や `v1beta` など。API側の仕様変更の追跡用 |
| **`duration_ms`** | Int | 実行にかかった時間（ミリ秒）。パフォーマンス監視用 |
| `status` | String | `success`, `failed`, `retry` など |
| `used_tags_snapshot` | JSONB | 当時送ったタグ定義（名前・説明）の記録 |
| `error_payload` | JSONB |  APIがエラーを返した際、その詳細をそのまま保存します |
| `token_usage` | JSONB | Geminiから返ってくる `prompt_token_count` と `candidates_token_count` を保存。 |
| `created_at` | Timestamp | 実行日時 |


---

### 1. `api_version` の重要性

Google AI Studio (Gemini API) は、`v1beta` でのみ先行実装される機能（構造化出力の厳密な定義など）が多いです。
「以前は動いていたのに急にJSONパースに失敗するようになった」という時、**「APIのバージョンが原因か、モデルの更新が原因か」**を切り分ける重要な手がかりになります。

### 2. `duration_ms` (実行時間) の重要性

提示いただいたコードでは `CHUNK_SIZE` ごとに分割送信し、さらに `WAIT_TIME_MS` (10秒) の待機を入れています。
* ログを見ることで「実際にAIの推論に何秒かかったのか」と「待機時間を含めた全体のUXとしてどうなのか」を数値化できます。
* あまりに時間がかかるチャンクがある場合、プロンプトが長すぎる、あるいはタグの `description` が多すぎるといったボトルネックを発見できます。


### ai_Refinement_History (投稿ごとの変更履歴)

「どの投稿が、どう変わったか」を1件ずつ記録します。
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` |  Int | 履歴の一意識別子 |
| `post_id` | Int | `ZstuPost` のID (FK) |
| `batch_id` | Int | ai_Batchesのテーブルへのリンク (FK)|
| `order_index` | Int | AIから帰ってきたときの順序 |
| `execution_log_id` | int   | ai_Execution_Logsのテーブルへのリンク (FK) |
| `before_title` | Text | 修正前のタイトル|
| `before_text` | Text | 修正前の内容 |
| `before_tags` | JSONB | 修正前のタブ |
| `after_title` | Text | AIが提案したタイトル |
| `after_text` | Text | AIが提案した内容 |
| `after_tags` | JSONB | AIが提案したタブ |
| `changes_summary` | JSONB | `changes` 配列（何を変えたか）の保存 |
| `fixed_title` | Text | 修正後のタイトル |
| `fixed_text` | Text | 修正後の内容 |
| `fixed_tags` | JSONB | 修正後のタブ |
| `is_edited` | Boolean | AIの提案から人間が変更を加えたか |
| `applied` | Boolean | 元の投稿に反映をしたかどうか |
| `applied_at` | Timestamp | いつは反映ボタンをおしたか |

---

is_edited,applied,状態の意味
false,true,AIの提案をそのまま採用した。
true,true,AIの提案を人間が手直しして採用した。
false,false,AIが提案したが、採用を見送った（破棄）。
true,false,（レアケース）手直しはしたが、結局採用しなかった。



## 3. ログの登録タイミング（実装方法）

現在のコードの `processGeminiRefinement` 関数内に、ログ保存の処理を差し込むのが最も効率的です。

### 登録のフロー

1. **リクエスト送信直前:** `status: 'pending'` で ① を作成。
2. **レスポンス受信後:** ① を `status: 'success'` に更新し、`raw_output_text` を保存。
3. **パース成功後:** 
### コードへの組み込みイメージ

```typescript
// gemini_service.ts 内のループ内
const res = await fetch("/api/gemini", { ... });
const data = await res.json();

// ここで DBにログを保存するAPIを叩く
await fetch("/api/logs/ai-execution", {
  method: "POST",
  body: JSON.stringify({
    user_id: userId,
    input: requestJson,
    output: data.text,
    model: data.model
  })
});

```

---

## 4. UI（画面）への活用

ログを残すと、`GeminiTypo` コンポーネントに以下のような便利な機能を追加できます。

* **「過去の修正を取り消す」ボタン:** 履歴テーブルから `before_text` を取得して元に戻す。
* **「修正差分ハイライト」:** `diff` ライブラリを使い、どこが書き換わったかを赤と緑で表示する。
* **「AI修正トレンド」:** よく修正される誤字をランキング表示する（例：「Python」がいつも「python」と小文字で書かれている、等）。

まずは **①のテーブル（実行ログ）** を作成し、`data.text`（生の結果）をまるごと保存し始めることから着手するのが良いと思います。


## DDL
SQLLite用 turso用

- SQLiteにはネイティブの `UUID` 型や `JSONB` 型が存在しないため、それぞれ `TEXT` 型として定義し、後からアプリケーション側やSQLiteのJSON関数で扱いやすいように構成しています。また、`Boolean` は `INTEGER` (0 または 1) として扱われます。


```sql
-- 1. バッチ全体を管理するテーブル
CREATE TABLE ai_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL, -- UUIDを想定
    total_chunks INTEGER DEFAULT 0,
    completed_chunks INTEGER DEFAULT 0,
    total_memos INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('processing', 'completed', 'partial_success', 'failed')) DEFAULT 'processing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. APIリクエスト単位のログ
CREATE TABLE ai_execution_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    prompt_template TEXT,
    raw_input_json TEXT, -- JSON文字列として保存
    raw_output_text TEXT,
    model_info TEXT,
    api_version TEXT,
    duration_ms INTEGER,
    status TEXT, -- 'success', 'failed', 'retry' など
    used_tags_snapshot TEXT, -- JSON文字列として保存
    error_payload TEXT,      -- JSON文字列として保存
    token_usage TEXT,        -- JSON文字列として保存
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES ai_batches(id) ON DELETE CASCADE
);

-- 3. 投稿ごとの変更履歴（評価用）
CREATE TABLE ai_refinement_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    batch_id INTEGER NOT NULL,
    execution_log_id INTEGER NOT NULL,
    order_index INTEGER,
    before_title TEXT,
    before_text TEXT,
    before_tags TEXT, -- JSON形式のテキスト
    after_title TEXT,
    after_text TEXT,
    after_tags TEXT,  -- JSON形式のテキスト
    changes_summary TEXT, -- JSON形式のテキスト
    fixed_title TEXT,
    fixed_text TEXT,
    fixed_tags TEXT,  -- JSON形式のテキスト
    is_edited INTEGER DEFAULT 0, -- Booleanの代わり (0: false, 1: true)
    applied INTEGER DEFAULT 0,   -- Booleanの代わり (0: false, 1: true)
    applied_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES ai_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (execution_log_id) REFERENCES ai_execution_logs(id) ON DELETE CASCADE
);

-- インデックスの作成（検索高速化のため）
CREATE INDEX idx_execution_logs_batch_id ON ai_execution_logs(batch_id);
CREATE INDEX idx_refinement_history_post_id ON ai_refinement_history(post_id);
CREATE INDEX idx_refinement_history_batch_id ON ai_refinement_history(batch_id);

```

## todo

- [ ] ダッシュボード見直し
- [ ] ログの見直し
- [ ] 形態素解析した結果の表示
- [ ] 形態素解析した結果からワードクラウドの展開
- [x] AIログの登録
- [x] AI利用してのタイポミスの保管：確認→登録
- [x] AI利用してタグの付与機能：確認→登録
- [x] タグについては専用用語として、説明含めて登録できるようにする
- [x] コンバート機能

## 履歴
- 2026年2月24日
  - Input回りデザイン調整
- 2026年2月21日
  - TursoでAILog残すように、それ見て諸々調整できるようにする予定
- 2026年2月19日
  - UI回り調整
- 2026年2月16日
  - 日付回りやはり引っかかる→解消済み
- 2026年2月15日
  - [デプロイ・Vercel](https://zerosecthinkv2.vercel.app/dashboard)
  - １日ぐらいでここまでひとまず完了、デプロイまで実施



