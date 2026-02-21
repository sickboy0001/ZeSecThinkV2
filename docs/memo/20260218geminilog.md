結論から申し上げますと、AIへの依頼と実行結果は**ログとして残しておくことを強く推奨します。**

1日10件程度であれば、月間で約300件です。後から「AIがどういう傾向で修正したか」「誤字修正の過程で意味が変わってしまったことはないか」を振り返る際に、ログがないと追跡が不可能になるからです。

以下にログ登録の考え方と、具体的な定義案をまとめました。

---

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
sqlite想定
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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



SQLite向けに調整したDDLを作成しました。

SQLiteにはネイティブの `UUID` 型や `JSONB` 型が存在しないため、それぞれ `TEXT` 型として定義し、後からアプリケーション側やSQLiteのJSON関数で扱いやすいように構成しています。また、`Boolean` は `INTEGER` (0 または 1) として扱われます。

---

## SQLite用 DDL定義

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

SQLite 3.38.0 以降であれば、`->` や `json_extract()` 関数を使って、`TEXT` 型で保存した JSON 内の特定の値を直接 SQL で抽出できます。

* 例: `SELECT json_extract(token_usage, '$.prompt_token_count') FROM ai_execution_logs;`

* ちなみに、TursoはSQLite 3.45 




