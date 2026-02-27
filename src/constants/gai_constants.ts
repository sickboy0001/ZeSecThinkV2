export const TAG_COUNT_LIMIT = 30;
export const CHUNK_SIZE = 20;
export const WAIT_TIME_MS = 10000;
export const prompt_template_list = ["typo_prompt", "week_summary_prompt"];
export const prompt_description = [
  {
    id: "typo_prompt",
    descriptions:
      "メモ（ポスト）をAIに渡して、タイポしてもらう際のプロンプトです。",
    replace_word: {
      memo: "コンテンツを置換する場所です",
      tags: "タグのリストを置換する場所です",
    },
  },
  {
    id: "week_summary_promt",
    descriptions: "週間要約のプロンプトです。",
    replace_word: {
      memo: "コンテンツを置換する場所です",
      memo_count:
        "メモの数を出す場所です 「{{memo_count}}件確認お願いします。」など",
      tags: "タグのリストを置換する場所です",
      week_before_text: "前週の情報です。",
      week_before_last_text: "前々週の情報です。",
    },
  },
];
export const default_typo_prompt = `
あなたは、断片的な思考メモを整理・構造化する優秀なエディター兼プロジェクトマネージャーです。
入力された request_memo を以下のガイドラインに従って最適化し、指定のJSON形式で出力してください。

### 1. 文章のブラッシュアップ（Task: Refinement）
* **トーン＆マナー:** X（Twitter）のような、簡潔でリズムの良い現代的な表現に整えてください。
* **修正の範囲:** 意味を変えず、誤字脱字の修正と、冗長な表現の整理のみを行ってください。
* **絵文字の排除:** タイトル・本文ともに絵文字は一切使用しないでください。
* **変化なしの許容:** すでに最適な状態であれば、入力値をそのまま返してください。

### 2. タグの分類と構造化（Task: Tagging）
* **既存タグの活用:** request_taglist を参照し、文脈に合う tag_name を割り当ててください。
* **新規タグの生成:** リストにない重要なキーワード（私的略語や専門用語）がある場合、新たに生成してください。
    * 日本語：8文字以内 / 英語：16文字以内
* **出力ルール:** fixed_tags には「タグ名のみ」を格納してください。略語の解説などはここには含めず、必ず changes フィールドに記載してください。

### 3. 出力形式（Output Format）
* レスポンスは必ず純粋なJSON形式で記述してください。Markdownのコードブロック（json ... ）も不要です。

---

### 書式（Schema）
#### 依頼データの書式（メモ）
{
  "request_memo": [
    {
      "id": 1,
      "title": "修正前の文章のタイトルや要約"
      "text": "修正前の文章..."
      "tags": ["zst", "hadbit"] 
    },
    ...
  ]
}

#### 依頼データの書式（タグ）
{
  "request_taglist": [
    {
      "name": "ZeSecThinkV2"
      "tag_name": "zstv2"
      "aliases":["zst", "アプリ開発"]
      "description": "本アプリの開発方針。UI/UX、Next.js/Supabaseの実装、新機能のアイデアに関する思考。"
    },
    {
      "name": "生成AI技術"
      "tag_name": "gen_ai_tech"
      "aliases":["Gemini", "API", "AI設定"]
      "description": "Google AI Studio、Gemini APIの連携、課金判断、AIの政治利用やリスクに関する技術的側面。"
    },
    ...
  ]
}


#### 返答
{
  "refinement_results": [
    {
      "id": 1,
      "original_text": "...",
      "fixed_title": "修正後の明快な文章...",
      "fixed_text": "修正後の明快な文章...",
      "fixed_tags": ["life", "work"] 
      "changes": ["誤字：〇〇→△△", "表現：語尾を丁寧語に変更"]
    },
    ...
  ],
}

### 依頼データ
#### メモ
{{memo}}

#### タグリスト
{{tags}}

`;

export const default_week_summary_prompt = `
あなたは優秀なエディター兼プロジェクトマネージャーです。
以下の「{{memo_count}}件の思考メモ」について、2つのタスクを実行してください。


### タスク2：1週間の総評・評価
修正した{{memo_count}}件件のメモ全体から、以下の観点で分析・評価を行ってください。
1. 今週の主な関心事や注力していたテーマ
2. 思考の傾向（例：技術面に偏っている、あるいは抽象的な悩みが多いなど）
3. 翌週に向けた改善アドバイス

（各１００字程度を想定しています。）

また、先週のサマリ、先々週のサマリも添付します

参考までに、タグの情報も記載します。
投稿のタグは重要度判断の補助情報として使用してください。

## 返答
返答は以下の書式でお願いします。

{
  "weekly_summary": {
    "themes": ["Next.jsの認証周り", "Gemini APIのクォータ制限"],
    "analysis": "今週は技術的なトラブル解決に多くの時間が割かれており...",
    "advice": "来週は実装の続きよりも、ドキュメントの整理を優先すると..."
  }
}


## 情報
### 1. 今週の投稿（メイン）（2月22日（日）～2月28日（土）のポスト）
{{posts}}

### 2. 先週のサマリ（直近の比較対象）（2月z日（日）～2月21日（土）のサマリ）
{{last_week_summary}}

### 3. 先々週のサマリ（トレンド判断用）（先々週の2月h日（日）～2月y日（土）のサマリ）
{{last_week_summary}}


`;
