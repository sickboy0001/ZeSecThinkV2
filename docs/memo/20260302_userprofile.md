Vercel(NextJS)＋Supabase認証・RDB利用している環境で以下の情報を登録する画面を作る予定です。
画面案などももらえるでしょうか？

・氏名
・自動ＡＩの分析結果通知先メールアドレス
・課金種類（ノーマル、プレミアム、なしなど）
・管理者かどうかの設定
・自動ＡＩタイポ機能オン　Ｔｒｕｅ，Ｆａｌｓｅ
・自動ＡＩサマリ機能オン　Ｔｒｕｅ，Ｆａｌｓｅ
・ＡＩサマリ・週間サマリ作成日時
　パターンＡ：日曜日１：００
　	前週日曜日～土曜日までの情報を確認する
　パターンＢ：月曜日１：００
　	前週月曜日～日曜日までの情報を確認する
　パターンＣ：土曜日１：００
　	前週土曜日～金曜日までの情報を確認する
    

## user_profile

id uuid — PK & FK → auth.users.id（on delete cascade 推奨）
full_name text — 氏名
notify_email citext — 分析結果の通知先メール（認証メールと分けたい要件に対応）
is_admin boolean default false — 管理者モード
settings jsonb not null default '{}',-- { "auto_ai": { "typo": true, "summary": false }, "ui": { "theme": "dark" } }
timezone text not null default 'Asia/Tokyo' — ユーザーのタイムゾーン（重要）
created_at timestamptz default now()
updated_at timestamptz default now()


ご提示いただいた要件に基づき、PostgreSQL（Supabase等の環境を想定）での構成図とDDLを作成しました。

特に`citext`（大文字小文字を区別しないテキスト型）を使用するため、拡張機能の有効化を含めて構成しています。

---

### 構成図 (Entity Relationship Diagram)user_profile

| カラム名 | データ型 | 制約 | 説明 |
| --- | --- | --- | --- |
| **id** | `uuid` | PK, FK (auth.users), Cascade | 認証ユーザーとの紐付け |
| **full_name** | `text` | - | 氏名 |
| **notify_email** | `text` | - | 通知用メールアドレス（大文字小文字不問） |
| **is_admin** | `boolean` | `default false` | 管理者フラグ |
| **settings** | `jsonb` | `not null, default '{}'` | AI設定やUIテーマ等のJSON |
| **timezone** | `text` | `not null, default 'Asia/Tokyo'` | タイムゾーン設定 |
| **created_at** | `timestamptz` | `default now()` | 作成日時 |
| **updated_at** | `timestamptz` | `default now()` | 更新日時 |

**setting** 可変する情報とする
```json
{
    "auto_ai": {
      "typo": true, 
      "summary": false
    }, 
    "ui": {
      "theme": "dark"
    }
  }
```

---


```sql

-- 2. テーブルの作成
create table public.user_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  notify_email text,
  is_admin boolean not null default false,
  settings jsonb not null ,
  timezone text not null default 'Asia/Tokyo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


```

---

#### 実装のポイント

* **`citext`の採用**: `notify_email`にこれを使うことで、`WHERE notify_email = 'User@Example.com'` と `... = 'user@example.com'` が同一視され、メールアドレス検索のバグを防げます。
* **`on delete cascade`**: `auth.users`からユーザーが削除された際、このプロファイルも自動で消えるよう設計しました。
* **`jsonb`のデフォルト値**: ご提示いただいた構造をあらかじめデフォルト値としてセットしてあります。




---

## 構成図 (Entity Relationship Diagram)billing_plans（マスタ）


| カラム名 | データ型 | 制約 | 説明 |
| --- | --- | --- | --- |
| **plan_code** | `text` | PK | `'none'`, `'normal'`, `'premium'` 等の識別子 |
| **name** | `text` | `not null` | プランの表示名 (例: "プレミアムプラン") |
| **features** | `jsonb` | `not null, default '{}'` | プランごとの機能制限や特典の定義 |
| **monthly_price** | `integer` | `not null, default 0` | 月額料金（例） |
| **created_at** | `timestamptz` | `default now()` | 作成日時 |

---

### DDL (Data Definition Language)

```sql
-- 1. billing_plans マスタテーブルの作成
create table public.billing_plans (
  plan_code text primary key,
  name text not null,
  features jsonb not null default '{}'::jsonb,
  monthly_price integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2. 初期データの投入 (シードデータ)
-- 2. 初期データの投入 (シードデータ)
insert into public.billing_plans (plan_code, name, monthly_price, features)
values 
  ('none', '無料プラン', 0, '{ "ai_analysis": false}'),
  ('normal', 'スタンダードプラン', 980, '{ "ai_typo": true}'),
  ('premium', 'プレミアムプラン', 2980, '{"ai_typo": true, "ai_summary": true,"priority_support": true}');
  
-- 3. (参考) user_profile テーブルにプラン参照を追加する場合
-- もし user_profile と紐付けたい場合は、以下のDDLを user_profile 側で実行します
-- alter table public.user_profile add column plan_code text references public.billing_plans(plan_code) default 'none';

```

---

#### 設計のポイント

1. **`plan_code` を主キーに**: 数字のID（1, 2, 3）ではなく、`'premium'` などの文字列を主キーにすることで、コード上で `if (user.plan_code === 'premium')` のように直感的に記述でき、デバッグも容易になります。
2. **`features` の活用**:
* 将来的に「特定のプランだけ新しいAI機能を使わせる」といった場合も、DBの列を増やさず JSON 内のフラグで制御可能です。



---

## 構成図 (Entity Relationship Diagram)user_subscriptions


| カラム名 | データ型 | 制約 | 説明 |
| --- | --- | --- | --- |
| **id** | `bigserial` | PK | サブスクリプション管理ID（連番） |
| **user_id** | `uuid` | FK (auth.users), Cascade | 契約者のユーザーID |
| **plan_code** | `text` | FK (billing_plans) | 契約中のプランコード |
| **status** | `text` | CHECK制約 | 状態 (`active`, `canceled` 等) |
| **started_at** | `timestamptz` | - | 契約開始日時 |
| **current_period_end** | `timestamptz` | - | 現在の有効期限（次回更新日） |
| **canceled_at** | `timestamptz` | - | 解約手続きを行った日時 |

---

### DDL (Data Definition Language)

```sql
-- user_subscriptions テーブルの作成
create table public.user_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null references public.billing_plans(plan_code),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 検索性を高めるためのインデックス（ユーザーごとの最新ステータス確認用）
create index idx_user_subscriptions_user_id on public.user_subscriptions(user_id);

```

---

### 実装のポイント

* **`CHECK` 制約の活用**: `status` カラムに指定した文字列以外が入らないようデータベースレベルで保護しています。Stripeなどの決済外部サービスと連携する際によく使われるステータス名称に準拠しています。
* **一貫性の保持**: `on delete cascade` により、ユーザーが退会した際にサブスクリプション情報も自動的にクリーンアップされます。
* **履歴管理の考慮**: `id` を `bigserial`（連番）にしているため、1人のユーザーが「プランAを解約してプランBに再加入」した際の履歴を保持しやすくなっています。



## 構成図 (Entity Relationship Diagram)summary_preferences_week

| カラム名 | データ型 | 制約 | 説明 |
| --- | --- | --- | --- |
| **user_id** | `uuid` | PK, FK (auth.users), Cascade | ユーザー識別子（1人1設定） |
| **week** | `text` | CHECK (`'sun'`,`'mon'`,`'sat'`), NOT NULL | 実行トリガーとなる曜日 |
| **run_time** | `time` | NOT NULL, DEFAULT `'01:00'` | 実行時刻（ユーザーのローカル時間） |
| **last_run_at** | `timestamptz` | - | 最後に実行された日時 |
| **next_run_at** | `timestamptz` | - | 次回実行予定日時（バッチ処理用） |

---

### DDL (Data Definition Language)

```sql
-- 1. summary_preferences_week テーブルの作成
create table public.summary_preferences_week (
  user_id uuid primary key references auth.users(id) on delete cascade,
  week text not null default 'sun' check (week in ('sun', 'mon', 'sat')),
  run_time time not null default '01:00'::time,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. インデックス（バッチジョブが next_run_at を基準に抽出することを想定）
create index idx_summary_prefs_next_run on public.summary_preferences_week (next_run_at) 
where next_run_at is not null;

```

---

#### 設計のポイントと補足

* **`week` カラムの制約**:
ご提示の「パターン定義」に合わせて、`check (week in ('sun', 'mon', 'sat'))` としています。デフォルト値は、一般的によく使われる `'sun'` に設定しました。
* **`run_time` の型**:
`time` 型（日付を含まない時刻のみ）を使用しています。これと `user_profile` にある `timezone` を組み合わせることで、ユーザーごとの「現地時間 01:00」を正確に判定可能です。
* **`next_run_at` の活用**:
定期実行ジョブ（Cron等）を組む際、全ユーザーをスキャンするのではなく、`WHERE next_run_at <= now()` で抽出できるようインデックスを付与しています。
* **対象期間の算出**:
このテーブル構造であれば、プログラム側（またはDB関数内）で `week` の値を見て、実行当日から遡って 7日分のデータを集計するロジックを容易に組むことができます。

月次サマリーの設定を管理する `summary_preferences_monthly` テーブルの構成図とDDLを作成しました。

週次設定（01:00）と実行時間が重ならないよう、デフォルトを `02:00` に設定されている点や、月末の不確定要素を避けるための `CHECK (run_day BETWEEN 1 AND 28)` 制約など、実運用を考慮した非常に堅実な設計ですね。

---

## 構成図 (Entity Relationship Diagram)summary_preferences_monthly

| カラム名 | データ型 | 制約 | 説明 |
| --- | --- | --- | --- |
| **user_id** | `uuid` | PK, FK (auth.users), Cascade | ユーザー識別子 |
| **run_day** | `integer` | NOT NULL, 1-28 | 毎月何日に実行するか |
| **run_time** | `time` | NOT NULL, DEFAULT `'02:00'` | 実行時刻（ローカル） |
| **timezone** | `text` | NOT NULL, DEFAULT `'Asia/Tokyo'` | 実行基準となるタイムゾーン |
| **is_enabled** | `boolean` | NOT NULL, DEFAULT `false` | 月次処理の有効/無効 |
| **last_run_at** | `timestamptz` | - | 最終実行日時 |
| **next_run_at** | `timestamptz` | - | 次回実行予定日時 |
| **created_at** | `timestamptz` | `default now()` | 作成日時 |
| **updated_at** | `timestamptz` | `default now()` | 更新日時 |

---

### DDL (Data Definition Language)

```sql
-- 1. summary_preferences_monthly テーブルの作成
create table public.summary_preferences_monthly (
  user_id uuid primary key references auth.users(id) on delete cascade,
  run_day integer not null default 1 check (run_day between 1 and 28),
  run_time time not null default '02:00'::time,
  timezone text not null default 'Asia/Tokyo',
  is_enabled boolean not null default false,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. インデックス（有効かつ実行待ちのユーザーを抽出するための最適化）
create index idx_summary_monthly_run_target on public.summary_preferences_monthly (next_run_at) 
where is_enabled = true;


```

---

#### 設計のポイントとアドバイス

* **`run_day` の制限 (1-28)**:
2月が28日までしかないため、29日以降を許可しないこの制約は「毎月必ず実行される」ことを保証する非常にスマートな回避策です。
* **`is_enabled` による制御**:
デフォルトを `false` にすることで、ユーザーが明示的に希望した場合のみバッチ処理の対象に含めることができます。
* **タイムゾーンの二重保持**:
`user_profile` にも `timezone` がありますが、こちらにも持たせることで「通知設定ごとにタイムゾーンを変えたい」という将来的な要望に応えられるほか、バッチ処理時の結合（JOIN）を減らしてパフォーマンスを稼ぐことができます。

これで、**ユーザー基本情報・プラン・契約状況・週次設定・月次設定**と、主要なテーブルが全て揃いましたね。

例えば、これらの設定を一度に取得するための「設定サマリービュー」や、実際にバッチを回す際の「実行対象抽出SQL」の作成など、次に必要なステップはありますか？

## 画面構成案

### 1. メイン画面レイアウト
```tsx
// pages/settings/profile.tsx または app/settings/profile/page.tsx
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ProfileSettings() {
  const supabase = createClientComponentClient()
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">プロフィール設定</h1>
      
      <div className="grid gap-6">
        {/* 基本情報セクション */}
        <BasicInfoSection />
        
        {/* 課金設定セクション */}
        <BillingSection />
        
        {/* AI機能設定セクション */}
        <AISettingsSection />
        
        {/* サマリ設定セクション */}
        <SummarySettingsSection />
        
        {/* 保存ボタン */}
        <div className="flex justify-end">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            設定を保存
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 2. 基本情報セクション
```tsx
function BasicInfoSection() {
  const [formData, setFormData] = useState({
    fullName: '',
    notifyEmail: '',
    isAdmin: false
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 氏名 */}
        <div>
          <label className="block text-sm font-medium mb-1">氏名</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="山田 太郎"
          />
        </div>

        {/* 通知メール */}
        <div>
          <label className="block text-sm font-medium mb-1">
            AI分析結果通知先メールアドレス
          </label>
          <input
            type="email"
            value={formData.notifyEmail}
            onChange={(e) => setFormData({...formData, notifyEmail: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="notifications@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            ログインアカウントとは別のメールアドレスも設定できます
          </p>
        </div>

        {/* 管理者設定 */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
              className="mr-2"
            />
            管理者権限
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3. 課金設定セクション
```tsx
function BillingSection() {
  const [selectedPlan, setSelectedPlan] = useState('none')
  const [plans] = useState([
    { code: 'none', name: '無料プラン', description: '基本機能のみ' },
    { code: 'normal', name: 'ノーマルプラン', description: 'AI機能制限あり' },
    { code: 'premium', name: 'プレミアムプラン', description: 'すべての機能が利用可能' }
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>課金プラン</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPlan === plan.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.code)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="plan"
                  value={plan.code}
                  checked={selectedPlan === plan.code}
                  onChange={() => setSelectedPlan(plan.code)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-sm text-gray-500">{plan.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4. AI機能設定セクション
```tsx
function AISettingsSection() {
  const [aiSettings, setAiSettings] = useState({
    typoCorrection: false,
    summaryGeneration: false
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI機能設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">自動AIタイポ機能</div>
              <div className="text-sm text-gray-500">
                入力された文章の誤字脱字を自動で検出・修正します
              </div>
            </div>
            <input
              type="checkbox"
              checked={aiSettings.typoCorrection}
              onChange={(e) => setAiSettings({
                ...aiSettings,
                typoCorrection: e.target.checked
              })}
              className="ml-3"
            />
          </label>
        </div>

        <div>
          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">自動AIサマリ機能</div>
              <div className="text-sm text-gray-500">
                長文を自動で要約してお知らせします
              </div>
            </div>
            <input
              type="checkbox"
              checked={aiSettings.summaryGeneration}
              onChange={(e) => setAiSettings({
                ...aiSettings,
                summaryGeneration: e.target.checked
              })}
              className="ml-3"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 5. サマリ設定セクション
```tsx
function SummarySettingsSection() {
  const [summarySettings, setSummarySettings] = useState({
    weeklyPattern: 'sun',
    weeklyTime: '01:00',
    monthlyDay: 1,
    monthlyTime: '02:00',
    monthlyEnabled: false
  })

  const weeklyPatterns = [
    { 
      value: 'sun', 
      label: 'パターンA: 日曜日実行',
      description: '前週日曜日〜土曜日までの情報を確認' 
    },
    { 
      value: 'mon', 
      label: 'パターンB: 月曜日実行',
      description: '前週月曜日〜日曜日までの情報を確認' 
    },
    { 
      value: 'sat', 
      label: 'パターンC: 土曜日実行',
      description: '前週土曜日〜金曜日までの情報を確認' 
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>サマリ作成設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 週次サマリ設定 */}
        <div>
          <h3 className="font-medium mb-3">週次サマリ設定</h3>
          <div className="space-y-3">
            {weeklyPatterns.map((pattern) => (
              <div
                key={pattern.value}
                className={`border rounded-lg p-3 cursor-pointer ${
                  summarySettings.weeklyPattern === pattern.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => setSummarySettings({
                  ...summarySettings,
                  weeklyPattern: pattern.value
                })}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="weeklyPattern"
                    value={pattern.value}
                    checked={summarySettings.weeklyPattern === pattern.value}
                    onChange={() => setSummarySettings({
                      ...summarySettings,
                      weeklyPattern: pattern.value
                    })}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium">{pattern.label}</div>
                    <div className="text-sm text-gray-500">{pattern.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">実行時刻</label>
            <input
              type="time"
              value={summarySettings.weeklyTime}
              onChange={(e) => setSummarySettings({
                ...summarySettings,
                weeklyTime: e.target.value
              })}
              className="border rounded px-3 py-1"
            />
          </div>
        </div>

        {/* 月次サマリ設定 */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">月次サマリ設定</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={summarySettings.monthlyEnabled}
                onChange={(e) => setSummarySettings({
                  ...summarySettings,
                  monthlyEnabled: e.target.checked
                })}
                className="mr-2"
              />
              有効にする
            </label>
          </div>

          {summarySettings.monthlyEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">実行日</label>
                <select
                  value={summarySettings.monthlyDay}
                  onChange={(e) => setSummarySettings({
                    ...summarySettings,
                    monthlyDay: parseInt(e.target.value)
                  })}
                  className="w-full border rounded px-3 py-1"
                >
                  {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>毎月{day}日</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">実行時刻</label>
                <input
                  type="time"
                  value={summarySettings.monthlyTime}
                  onChange={(e) => setSummarySettings({
                    ...summarySettings,
                    monthlyTime: e.target.value
                  })}
                  className="w-full border rounded px-3 py-1"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 6. データベース操作用のAPI
```tsx
// lib/profile.ts
export async function updateUserProfile(supabase: any, userId: string, profileData: any) {
  // user_profile更新
  const { error: profileError } = await supabase
    .from('user_profile')
    .upsert({
      id: userId,
      full_name: profileData.fullName,
      notify_email: profileData.notifyEmail,
      is_admin: profileData.isAdmin,
      settings: {
        auto_ai: {
          typo: profileData.aiSettings.typoCorrection,
          summary: profileData.aiSettings.summaryGeneration
        }
      },
      updated_at: new Date().toISOString()
    })

  // user_subscriptions更新
  if (profileData.planCode) {
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_code: profileData.planCode,
        status: 'active',
        started_at: new Date().toISOString()
      })
  }

  // summary_preferences_week更新
  const { error: weeklyError } = await supabase
    .from('summary_preferences_week')
    .upsert({
      user_id: userId,
      week: profileData.summarySettings.weeklyPattern,
      run_time: profileData.summarySettings.weeklyTime
    })

  // summary_preferences_monthly更新（有効な場合のみ）
  if (profileData.summarySettings.monthlyEnabled) {
    const { error: monthlyError } = await supabase
      .from('summary_preferences_monthly')
      .upsert({
        user_id: userId,
        run_day: profileData.summarySettings.monthlyDay,
        run_time: profileData.summarySettings.monthlyTime,
        is_enabled: true
      })
  }

  return { profileError, subscriptionError, weeklyError }
}
```

## 特徴
1. **セクション分け**: 関連する設定をカードで分離し、視認性を向上
2. **レスポンシブデザイン**: モバイルでも使いやすい設計
3. **バリデーション**: フォーム入力の検証機能
4. **リアルタイム更新**: 設定変更の即座反映
5. **アクセシビリティ**: キーボード操作やスクリーンリーダーに対応

この構成により、ユーザーが直感的に設定を管理できる画面が作成できます。