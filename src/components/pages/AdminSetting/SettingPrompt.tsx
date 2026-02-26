"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Save,
  History,
  Terminal,
  Settings2,
  CheckCircle2,
  FileJson,
  MessageSquare,
  Clock,
  User, // 追加
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  prompt_template_list,
  prompt_description,
  default_typo_prompt,
  default_week_summary_prompt,
} from "@/constants/gai_constants";
import { Alert, AlertDescription, AlertAction } from "@/components/ui/alert";
import {
  getActivePrompt,
  getPromptHistory,
  savePromptVersion,
} from "@/services/setting_prompt_service";
import { ActivePromptResponse, PromptVersion } from "@/type/prompt";

// 動的にPROMPT_TEMPLATESを生成
const PROMPT_TEMPLATES = prompt_template_list.map((slug, index) => {
  const descriptionData = prompt_description.find((d) => d.id === slug);

  let content = "";
  let model = "";
  let temp = 0;
  let name = "";
  let originalDescription = "";

  if (slug === "typo_prompt") {
    content = default_typo_prompt;
    model = "gpt-4o";
    temp = 0.7;
    name = "誤字脱字修正";
    originalDescription =
      "ユーザーが入力したメモの誤字脱字をAIで自動修正します。";
  } else if (slug === "week_summary_prompt") {
    content = default_week_summary_prompt;
    model = "claude-3-5-sonnet";
    temp = 0.3;
    name = "週間レポート要約";
    originalDescription =
      "1週間の投稿内容を集計し、主要なトピックと傾向を要約します。";
  }

  return {
    id: index + 1,
    slug: slug,
    name: name,
    description: descriptionData?.descriptions || originalDescription,
    active_version: {
      content: content,
      model: model,
      temp: temp,
    },
  };
});

interface Props {
  userId: string;
}

export default function SettingPrompt({ userId }: Props) {
  const [activeSlug, setActiveSlug] = useState(prompt_template_list[0]);
  const [saveComment, setSaveComment] = useState(""); // 追加: コメント管理用
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // DBから取得したデータ用
  const [activePrompt, setActivePrompt] = useState<ActivePromptResponse | null>(
    null,
  );
  const [history, setHistory] = useState<PromptVersion[] | null>(null);
  const [editableContent, setEditableContent] = useState("");

  const router = useRouter(); // ここで呼び出す

  // 現在のテンプレート情報を取得
  const currentTemplate =
    PROMPT_TEMPLATES.find((t) => t.slug === activeSlug) || PROMPT_TEMPLATES[0];

  // 1. データ初期ロード & Slug切り替え時の処理
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [pData, hData] = await Promise.all([
        getActivePrompt(activeSlug),
        getPromptHistory(activeSlug),
      ]);

      if (pData) {
        setActivePrompt(pData);
        setEditableContent(pData.content);
      } else {
        // DBに未登録の場合の初期値（必要に応じて定数から入れる）
        setActivePrompt(null);
        setEditableContent("");
      }
      setHistory(hData);
      setSaveComment("");

      setIsLoading(false);
    }
    loadData();
  }, [activeSlug]);

  // 保存処理
  const handleSave = async () => {
    if (!saveComment) return;

    setIsSaving(true);
    try {
      await savePromptVersion({
        userId,
        slug: activeSlug,
        content: editableContent,
        comment: saveComment,
        // model等は既存があれば引き継ぎ、なければデフォルト
        model: activePrompt?.model_config.model || "gpt-4o",
        temp: activePrompt?.model_config.temperature || 0.7,
      });

      alert("新しいバージョンを保存しました。");
      setSaveComment("");
      // データを再読み込み
      const [newActive, newHistory] = await Promise.all([
        getActivePrompt(activeSlug),
        getPromptHistory(activeSlug),
      ]);
      setActivePrompt(newActive);
      setHistory(newHistory);
      router.refresh();
    } catch (e) {
      alert("エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  const availableVars = prompt_description.find(
    (d) => d.id === activeSlug,
  )?.replace_word;
  const varString = availableVars
    ? Object.keys(availableVars)
        .map((k) => `{{${k}}}`)
        .join(", ")
    : "";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full mx-auto p-4">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Prompt Studio
          </h1>
          <p className="text-muted-foreground text-sm">
            システム共通プロンプトのバージョン管理と配信設定
          </p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Template List */}
        <aside className="col-span-12 md:col-span-2 lg:col-span-2 space-y-3">
          <div className="relative mb-4">
            <Input placeholder="Slugで検索..." className="pl-8 bg-muted/20" />
            <Terminal className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          {/* タグヘッダー表示エリア */}
          <div className="space-y-2">
            {PROMPT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => setActiveSlug(template.slug)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  activeSlug === template.slug
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "bg-card border-transparent hover:border-muted-foreground/20"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm tracking-tight">
                    {template.slug}
                  </span>
                  <Badge variant="outline" className="text-[9px] bg-background">
                    Active
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {template.name}
                </p>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT: Editor Detail */}
        <main className="col-span-12 md:col-span-10 lg:col-span-10">
          <Card className="shadow-lg border-muted/40 overflow-hidden">
            <div className="bg-muted/10 border-b px-6 py-4 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold italic">
                    {currentTemplate.slug}
                  </h2>
                  <Badge variant="outline" className="text-xs font-mono">
                    v4
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentTemplate.description}
                </p>
              </div>
            </div>

            <CardContent className="p-0">
              <Tabs defaultValue="editor" className="w-full">
                <div className="px-6 pt-2 border-b bg-muted/5">
                  <TabsList className="bg-transparent gap-4">
                    <TabsTrigger
                      value="editor"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1"
                    >
                      エディタ
                    </TabsTrigger>
                    <TabsTrigger
                      value="versions"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1"
                    >
                      履歴
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="editor" className="m-0 p-6 space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* 左側: 本文 */}

                    <div className="xl:col-span-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold flex items-center gap-2">
                          <Terminal className="h-4 w-4" /> システムプロンプト
                        </label>
                      </div>
                      {/* Alert - 変数表示エリアを1行に集約 */}
                      <Alert className="bg-primary/5 border-none py-2 px-4">
                        <AlertDescription className="flex items-center gap-3 overflow-hidden">
                          {/* ラベル部分：縮まないように shrink-0 */}
                          <div className="text-[11px] font-bold text-primary/70 shrink-0 whitespace-nowrap border-r pr-3">
                            利用可能な変数
                          </div>

                          {/* 変数リスト部分：はみ出したら横スクロール可能に */}
                          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {availableVars ? (
                              Object.entries(availableVars).map(
                                ([key, description]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-1 shrink-0"
                                  >
                                    <Badge
                                      variant="outline"
                                      className="font-mono text-[10px] bg-background border-primary/20 hover:bg-primary/10 transition-colors cursor-help py-0 h-5"
                                      title={description as string} // 簡易的なツールチップとしてブラウザ標準のtitle属性を使用
                                    >
                                      {"{{"}
                                      {key}
                                      {"}}"}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mr-2">
                                      {description as string}
                                    </span>
                                  </div>
                                ),
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                利用可能な変数はありません
                              </span>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                      <Textarea
                        key={activeSlug}
                        className="min-h-[500px] font-mono text-sm p-5 bg-zinc-950 text-zinc-100 leading-relaxed ring-offset-background focus-visible:ring-1"
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                      />
                    </div>

                    {/* 右側: パラメータ設定 & コメント */}
                    <div className="space-y-4">
                      {/* --- コメントエリア (ここに追加) --- */}
                      <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />{" "}
                          更新コメント
                        </h3>
                        <div className="space-y-2">
                          <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                            Version Comment
                          </label>
                          <Textarea
                            placeholder="例）タグについての注意の記載を追加"
                            className="min-h-[80px] text-sm bg-muted/20"
                            value={saveComment}
                            onChange={(e) => setSaveComment(e.target.value)}
                          />
                          <p className="text-[10px] text-muted-foreground">
                            ※ 履歴タブに表示され、変更理由を特定しやすくします。
                          </p>
                        </div>
                        <Button
                          className="w-full gap-2 shadow-md bg-primary"
                          disabled={!saveComment || isSaving}
                          onClick={handleSave}
                        >
                          <Save className="h-4 w-4" />
                          {isSaving ? "保存中..." : "新バージョンを保存"}
                        </Button>{" "}
                      </div>

                      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-blue-900">
                            このバージョンは有効です
                          </p>
                          <p className="text-[10px] text-blue-700 mt-1">
                            保存すると、全てのシステムに即時反映されます。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 履歴タブのダミー表示も同様に追加可能 */}
                {/* --- 履歴タブの実装 --- */}
                <TabsContent value="versions" className="m-0 p-6">
                  <div className="space-y-4">
                    {history && history.length > 0 ? (
                      history.map((rev) => (
                        <div
                          key={rev.id}
                          className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${rev.is_active ? "bg-green-100 text-green-700 border border-green-200" : "bg-muted text-muted-foreground"}`}
                            >
                              v{rev.version}
                            </div>
                            <div className="w-px h-full bg-border mt-2"></div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm">
                                {rev.comment || "コメントなし"}
                              </p>
                              {rev.is_active && (
                                <Badge className="bg-green-500 hover:bg-green-500">
                                  稼働中
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{" "}
                                {new Date(rev.created_at).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" /> {rev.created_by}
                              </span>
                              <span className="flex items-center gap-1">
                                <Settings2 className="h-3 w-3" />{" "}
                                {rev.model_config.model}
                              </span>
                            </div>
                            <div className="mt-2 p-2 bg-muted/30 rounded text-xs font-mono line-clamp-2 text-muted-foreground">
                              {rev.content}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditableContent(rev.content)}
                          >
                            この版をエディタへ
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20 text-muted-foreground">
                        履歴がありません
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
