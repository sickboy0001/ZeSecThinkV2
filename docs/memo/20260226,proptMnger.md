
## プロンプトの保存

- 複数のシステムから利用される情報（VercelNextJSやFastAPI）なので、テーブルに情報として持つ
- 

### 1. `prompt_templates` (親テーブル)

プロンプトの「枠組み（名前や用途）」を定義します。

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| `id` | `integer` | 主キー (PK) |
| `slug` | `text` | プロンプト識別子（例: `typo_propmt`）※一意制約 |
| `name` | `text` | 管理用の表示名（例: カスタマーサポート返信） |
| `description` | `text` | このプロンプトの用途説明 |
| `created_at` | `timestamptz` | 作成日時 |

### 2. `prompt_versions` (子テーブル)

プロンプトの「中身（バージョン）」を保持します。

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| `id` | `uuid` | 主キー (PK) |
| `template_id` | `integer` | `prompt_templates.id` への外部キー |
| `version` | `integer` | バージョン番号 (1, 2, 3...) |
| `content` | `text` | **プロンプト本文**（変数は `{{memo}}` `{{tags}}` 等で保持） |
| `model_config` | `jsonb` | モデル設定（`model: "gpt-4o"`, `temperature: 0.7` など） |
| `is_active` | `boolean` | **現在使用中のバージョンか**（Trueは1つのみ） |
| `created_by` | `uuid` | 作成者のユーザーID（Supabase Authと連携） |
| `created_at` | `timestamptz` | 作成日時 |

---

```
-- 1. prompt_templates (親テーブル)
CREATE TABLE prompt_templates (
    id SERIAL PRIMARY KEY, -- 自動採番の integer
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. prompt_versions (子テーブル)
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id INTEGER NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    model_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Supabase Auth連携
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 同じテンプレート内でバージョン番号が重複しないように制約
    UNIQUE (template_id, version)
);


-- 検索性を高めるためのインデックス
CREATE INDEX idx_prompt_versions_template_id ON prompt_versions(template_id);



-- ポリシー例: 認証済みユーザーのみ参照・変更可能（プロジェクトに合わせて調整してください）
-- CREATE POLICY "Allow authenticated full access to prompt_templates" 
-- ON prompt_templates FOR ALL TO authenticated USING (true);

-- CREATE POLICY "Allow authenticated full access to prompt_versions" 
-- ON prompt_versions FOR ALL TO authenticated USING (true);

```


## 実装のポイント

### ① データの引き出し方（Next.js / FastAPI 共通）

アプリ側からは `slug` と `is_active = true` を条件にクエリを投げます。

```sql
-- 例: カスタマーサポート用の有効なプロンプトを取得
SELECT t.slug, v.content, v.model_config
FROM prompt_templates t
JOIN prompt_versions v ON t.id = v.template_id
WHERE t.slug = 'customer_support_reply' 
AND v.is_active = true;

```

### ② jsonb型の活用 (`model_config`)

AIのモデルやパラメータは頻繁に変わります。`jsonb` 型で保存しておくことで、テーブル定義を変えずに「このプロンプトは GPT-4o、こっちは Claude 3.5」といった切り替えが柔軟に行えます。

### ③ 編集機能（フロントエンド）の仕様

フロントエンド（Next.js）で編集機能を実装する際は、以下の挙動にすると安全です。

* **保存時:** 直接上書きせず、新しい `version` としてレコードを `INSERT` する。
* **有効化:** 「このバージョンを有効にする」ボタンを押し、対象の `is_active` を `true` に、それ以外を `false` に更新する（トランザクション処理を推奨）。

---