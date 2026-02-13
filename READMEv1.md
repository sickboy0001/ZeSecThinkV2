## 1.概要（Summary）
このプロジェクトは「習慣化を支援するアプリケーション」です。  
ユーザーは日々の習慣を登録・記録し、カレンダー上で習慣化の様子を可視化することができます。

## 2.セットアップ手順（Getting Started）

```bash
# リポジトリをクローン
git clone https://github.com/sickboy0001/hadbit-app.git
cd hadbit-app

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 3. 使用技術一覧（技術スタックの要約）
調整中）**ひと目でわかるスタック表**

###  使用技術（Tech Stack）
- フロントエンド: React, Next.js, TypeScript
- UI: Tailwind CSS, shadcn/ui
- データベース: Supabase
- デプロイ: Vercel

#### チャート、タイムラインについて
ガントチャートは自作になりました。といっても、実際には生成AIに問い合わせた結果


## 4.デモ or スクリーンショット

Vercel:[Vercel](https://hadbit-app.vercel.app/)
Github:[GitHub](https://github.com/sickboy0001/hadbit-app)

## 5.環境
### ■開発環境

|No.|項目|ソフトウェア名、バージョン等			|
|-|-|-|
|1|OS|Edition:Window 10 Pro / バージョン:1607 以降 / 32-bit or 64-bit			|
|2|開発言語|TypeScript			|
|3|フレームワーク|React+NextJS|
|4|ソース管理|GitHub|
|5|開発ツール|VSCode|

### ■ハードウェア構成
|No.|項目|配置場所|構成|役割など|
|-|-|-|-|-|
|1|開発環境（ローカル）|ローカル||コードの実装|
|2|GItHub|インターネット||ソースの保存場所、vercel連携でも利用|
|3|Vercel|インターネット||デプロイ先|
|4|Supabase|インターネット||データベース|

## 6.設計
### ■システム配置
```
sickboy0001/hadbit-app https://github.com/sickboy0001/hadbit-app
├ doc                →ドキュメント
├ public
├ src                →ソース
│ ├ app              →アプリ用ソース
│ │ ├ action         →サーバーサイドアクション
│ │ │ ├ user         →ユーザー周り
│ │ │ │ ├ edit.ts    →ユーザー編集
│ │ │ │ └ read.ts    →ユーザー読み取り
│ │ │ ├ auth.ts      →認証周り
│ │ │ ├ habit_item_tree.ts      →DAO：ツリー回り
│ │ │ ├ habit_items.ts          →DAO：項目マスタ
│ │ │ ├ habit_logs.ts           →DAO：記録
│ │ │ └ user_setting_configs.ts →DAO：設定周り 画面設定含む
│ │ ├ habit          →Habitページディレクトリ
│ │ │ ├ done         →Habit/done ページ 実施画面
│ │ │ │ └ page.tsx   →Page本体
│ │ │ ├ itemmentenenance →Habit/mentenance ページ(未使用)
│ │ │ │ └ page.tsx   →Page本体
│ │ │ ├ logimport    →Habit/logimport ページ ログインポート
│ │ │ │ └ page.tsx   →Page本体
│ │ │ ├ manager      →Habit/manager ページ 習慣メンテ画面
│ │ │ │ └ page.tsx   →Page本体
│ │ │ └ tracker      →Habit/tracker ページ メイン画面
│ │ │   └ page.tsx   →Page本体
│ │ ├ start          →ページ用ディレクトリ
│ │ │ └ page.tsx     →ページ本体
│ │ ├ test/tree      →ページ用ディレクトリ
│ │ │ └ page.tsx     →ページ本体
│ │ ├ favicon.ico
│ │ ├ globals.css
│ │ ├ layout.tsx    →レイアウト
│ │ └ page.tsx      →ページ本体
│ ├ components      →実装
│ │ ├ dnd-tree                  →DND用のコンポーネント
│ │ │ ├ SortableTree.tsx        →
│ │ │ ├ SortableTreeItem.tsx　  →
│ │ │ ├ useSortableTree.ts　    →
│ │ │ └ util.ts　               →DND用Util
│ │ ├ Habit                 →ドメイン実装部分
│ │ │ ├ ClientApi                  →クライアント側サービス
│ │ │ │ ├ HabitLogClientApi.ts     →サーバーサイド呼び出し用
│ │ │ │ ├ HabitSettingClientApi.ts →サーバーサイド呼び出し用
│ │ │ │ └ HabitSettingService.ts   →クライアント内でのサービス
│ │ │ ├ Done                       →
│ │ │ │ ├ HabitDone.tsx            →実装
│ │ │ │ ├ PageHabitDone.tsx        →ページからの呼び出されよう
│ │ │ │ └ ・・・   
│ │ │ ├ LogImport                  →
│ │ │ │ ├ HabitLogImport.tsx       →実装
│ │ │ │ ├ PageHabitLogImport.tsx   →ページからの呼び出されよう
│ │ │ │ └ ・・・   
│ │ │ ├ Management                 →
│ │ │ │ ├ HabitManagement.tsx      →実装
│ │ │ │ ├ PageHabitManagement.tsx  →ページからの呼び出されよう
│ │ │ │ └ ・・・   
│ │ │ ├ organisms                  →
│ │ │ │ ├ Modalxxxxxxxxxx.tsx      →モーダル要処理
│ │ │ │ └ PressButtonsSection.tsx  →ボタン一覧   
│ │ │ └ Tracker                    →
│ │ │   ├ HabitTracker.tsx         →実装
│ │ │   └ PageHabitTracker.tsx     →ページからの呼び出されよう
│ │ ├ molecules                    →AtomicDesign
│ │ │ ├ ComfirmationDialog         →
│ │ │ ├ DialogEdit                 →
│ │ │ ├ LoginSuccessAlert          →
│ │ │ └ LogoutSuccessAlert         →
│ │ ├ organisms                    →AtomicDesign
│ │ │ ├ CustomToast.tsx            →
│ │ │ ├ Header.tsx                 →
│ │ │ ├ LoginDialog.tsx            →
│ │ │ └ startPage.tsx              →
│ │ ├ ui                →shadcnui用
│ │ └ Header.tsx        →layoutで使う情報
│ ├ constants
│ │  └ menu.ts          →Menu用定数
│ ├ contexts
│ │  └ AuthContext.tsx  →User用のコンテキスト
│ └ lib             →
│ │  ├ datetime.ts  →
│ │  ├ habit.ts　　 →
│ │  ├ user.ts　　　→
│ │  └ utils.ts　　 →
│ └ type                          →
│    ├ habit　　　　　　　　　　　　→
│    │ ├ habit_item.ts　　　　　　 →
│    │ ├ logSummaryItemSetting.ts →
│    │ └ ui.ts　　　　　　　　　　　→
│    ├ supabase.ts                →
│    ├ TypeHeatMap.ts             →
│    ├ user.ts                    →
│    └ supabase.ts                →
├ .gitignore
├ README.md
├ components.json
├ eslint.config.mjs
├ next.config.ts
├ package-lock.json
├ package.json
├ postcss.config.mjs
└ tsconfig.json
※sample)├│─└
```

### ■機能要件・一覧
|システム名|機能名|機能小項目|機能概要|
|-|-|-|-|
|習慣化メンテナンス|HabitMaintenance|-|新規で習慣化したい項目（以下習慣化マスタ）を登録できる。|
|習慣化メンテナンス|HabitMaintenance|-|習慣化マスタの表示順を親子関係含めて登録できる|
|習慣化メンテナンス|HabitMaintenance|-|習慣化マスタのゲストへの表示、非表示を制御できる|
|習慣化メンテナンス|HabitMaintenance|-|実施登録時への展開時のOpenCloseを登録できる。|
|習慣記録|HabitDone|登録|ログイン者が自分の実施した習慣を登録できる|
|習慣トラッカー|HabitTracker|参照|ログイン者が自分の習慣化の状況を確認できる。|
|習慣トラッカー（ゲスト）|HabitTracker|ゲスト参照|ログイン者以外でも習慣化の状況確認できる|


### ■画面設計
- tailwindcss、shadcnuiを利用すること。
- AtomicDesingを意識した構成にすること。


## 7.経緯
- 2026/02/06 
  - Vercel用、NextJS Update
- 2025/06/01 おおむね実用可能に・・・

## 8.既知の課題
- [ ] ログイン情報が消える・・
- [ ] 習慣化の項目に対して、色を指定する（現行ランダム）
- [ ] 習慣化の項目、項目事に備考入れるテンプレート持てるように（体重だとｘｘKgのｘｘ部分入れれるようにする）
- [ ] サインアップ画面
- [ ] スタートページ、変種機能
