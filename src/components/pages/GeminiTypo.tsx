"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getZstuPostsWithDate,
  ZstuPost,
  updateZstuPost,
} from "@/services/zstuposts_service";
import { toast } from "sonner";
import { typo_content } from "@/constants/gai_constants";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Sparkles,
  ArrowRight,
  FileText,
  ClipboardCheck,
} from "lucide-react";

interface Props {
  userId: string;
}

type Step = "select" | "confirm" | "result";

type RefinementResult = {
  id: number;
  original_text: string;
  fixed_title: string;
  fixed_text: string;
  fixed_tags?: string[];
  changes: string[];
};

type EditableRefinementResult = RefinementResult & {
  fixed_tags_str: string;
};

type AiResponse = {
  refinement_results: RefinementResult[];
};

export default function GeminiTypo({ userId }: Props) {
  const [step, setStep] = useState<Step>("select");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ZstuPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [selectedPostIds, setSelectedPostIds] = useState<Set<number>>(
    new Set(),
  );
  const [editableResults, setEditableResults] = useState<
    EditableRefinementResult[]
  >([]);
  const [publicFlags, setPublicFlags] = useState<Record<number, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setAiLoading(true);
    setResult("");
    setEditableResults([]);

    try {
      const selectedPosts = posts.filter((post) =>
        selectedPostIds.has(post.id),
      );
      const chunkSize = 100;
      let allRefinementResults: RefinementResult[] = [];
      let combinedRawText = "";

      // チャンク分割して順次処理
      for (let i = 0; i < selectedPosts.length; i += chunkSize) {
        if (i > 0) {
          toast.info("APIレート制限回避のため、20秒間待機しています...");
          await new Promise((resolve) => setTimeout(resolve, 20000));
        }

        const chunk = selectedPosts.slice(i, i + chunkSize);

        // チャンク用のJSONデータ作成
        const requestMemo = chunk.map((post) => ({
          id: post.id,
          tags: post.tags || [],
          title: post.title,
          text: post.content,
        }));
        const requestJson = JSON.stringify(
          { request_memo: requestMemo },
          null,
          2,
        );

        // プロンプト作成: {memo} を置換、なければ末尾に追加
        let prompt = "";
        if (input.includes("{memo}")) {
          prompt = input.replace("{memo}", requestJson);
        } else {
          prompt = `${input}\n\n${requestJson}`;
        }

        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        combinedRawText += data.text + "\n";

        // 結果のパースと結合
        try {
          const cleanJson = data.text.replace(/```json\n|\n```/g, "").trim();
          const parsed = JSON.parse(cleanJson) as AiResponse;
          if (parsed.refinement_results) {
            allRefinementResults = [
              ...allRefinementResults,
              ...parsed.refinement_results,
            ];
          }
        } catch (e) {
          console.warn("Failed to parse chunk result", e);
        }
      }

      setResult(combinedRawText);

      // 編集用ステートの初期化
      const editable = allRefinementResults.map((item) => ({
        ...item,
        fixed_tags_str: item.fixed_tags?.join(", ") || "",
      }));
      setEditableResults(editable);

      // Publicフラグの初期化
      const flags: Record<number, boolean> = {};
      allRefinementResults.forEach((item) => {
        flags[item.id] = true;
      });
      setPublicFlags(flags);

      setStep("result");
    } catch (error) {
      console.error(error);
      toast.error("AI生成に失敗しました");
    } finally {
      setAiLoading(false);
    }
  };

  const handlePrepareForAI = () => {
    if (selectedPostIds.size === 0) {
      toast.warning("修正する投稿を選択してください。");
      return;
    }

    // テンプレートのプレースホルダーを置換 ({memo} は残す)
    // データ量が多い場合、ここで展開するとUIが重くなる＆分割送信できないため
    const prompt = typo_content.replace("{tags}", "");

    setInput(prompt);
    setStep("confirm");
  };

  const handleUpdatePosts = async () => {
    setUpdateLoading(true);
    try {
      const updates = editableResults.map((item) =>
        updateZstuPost(item.id, {
          title: item.fixed_title,
          content: item.fixed_text,
          public_flg: publicFlags[item.id] ?? true,
          tags: item.fixed_tags_str
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      );

      await Promise.all(updates);

      toast.success(`${updates.length}件の投稿を更新しました。`);
      setStep("select");
      setResult("");
      setInput("");
      setSelectedPostIds(new Set());
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました。");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Calculate start (Sunday) and end (Saturday) of the week
  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay(); // 0 is Sunday
    start.setDate(start.getDate() - day); // Go back to Sunday

    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Go to Saturday

    return { start, end };
  };

  const { start, end } = getWeekRange(currentDate);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const formatDate = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${dd}`;
        };

        const sStr = formatDate(start);
        const eStr = formatDate(end);

        const data = await getZstuPostsWithDate(userId, sStr, eStr);
        setPosts(data || []);
      } catch (error) {
        console.error(error);
        toast.error("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [userId, start.toISOString(), end.toISOString(), refreshKey]);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSelectPost = (postId: number) => {
    const newSelectedIds = new Set(selectedPostIds);
    if (newSelectedIds.has(postId)) {
      newSelectedIds.delete(postId);
    } else {
      newSelectedIds.add(postId);
    }
    setSelectedPostIds(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedPostIds.size === posts.length && posts.length > 0) {
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(new Set(posts.map((post) => post.id)));
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground mt-1">
            週間レポート ({start.toLocaleDateString()} -{" "}
            {end.toLocaleDateString()})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Step 2: 命令文の確認と実行
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="修正したいテキストを入力..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[200px] bg-muted/50 font-mono"
            />
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setStep("select")}>
                戻る
              </Button>
              <Button onClick={handleSubmit} disabled={aiLoading || !input}>
                {aiLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                修正を実行
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "result" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-green-500" />
              Step 3: 結果の確認と反映
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>AIによる修正案</AlertTitle>
              <AlertDescription>
                以下の内容で投稿を更新しますか？内容を確認してください。
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {editableResults.length > 0 ? (
                editableResults.map((item, index) => (
                  <Card key={item.id} className="bg-muted/50">
                    <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">
                        ID: {item.id}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {posts.find((p) => p.id === item.id)?.current_at
                          ? new Date(
                              posts.find((p) => p.id === item.id)!.current_at!,
                            ).toLocaleDateString()
                          : "-"}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-2 bg-red-50/50 rounded border border-red-100">
                          <div className="font-semibold text-red-600 mb-1">
                            修正前
                          </div>
                          <Input
                            value={
                              posts.find((p) => p.id === item.id)?.title || ""
                            }
                            readOnly
                            className="font-bold text-sm mb-2 bg-white/50"
                          />
                          <Textarea
                            value={item.original_text}
                            readOnly
                            className="min-h-[150px] bg-white/50"
                          />
                          <div className="mt-2 pt-2 border-t border-red-200 flex flex-col gap-2">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-semibold">Tags:</span>
                              <Input
                                value={
                                  posts
                                    .find((p) => p.id === item.id)
                                    ?.tags?.join(", ") || ""
                                }
                                readOnly
                                className="mt-1 bg-white/50 h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="p-2 bg-green-50/50 rounded border border-green-100">
                          <div className="font-semibold text-green-600 mb-1">
                            修正後
                          </div>
                          <Input
                            value={item.fixed_title}
                            onChange={(e) => {
                              const newResults = [...editableResults];
                              newResults[index].fixed_title = e.target.value;
                              setEditableResults(newResults);
                            }}
                            className="font-bold text-sm mb-2 bg-white"
                            placeholder="タイトル"
                          />
                          <Textarea
                            value={item.fixed_text}
                            onChange={(e) => {
                              const newResults = [...editableResults];
                              newResults[index].fixed_text = e.target.value;
                              setEditableResults(newResults);
                            }}
                            className="min-h-[150px] bg-white"
                            placeholder="本文"
                          />
                          <div className="mt-2 pt-2 border-t border-green-200 flex flex-col gap-2">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-semibold">Tags:</span>
                              <Input
                                value={item.fixed_tags_str}
                                onChange={(e) => {
                                  const newResults = [...editableResults];
                                  newResults[index].fixed_tags_str =
                                    e.target.value;
                                  setEditableResults(newResults);
                                }}
                                className="mt-1 bg-white h-8 text-xs"
                                placeholder="タグ (カンマ区切り)"
                              />
                            </div>
                            <div className="flex items-center justify-end text-sm">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`pub-${item.id}`}
                                  checked={publicFlags[item.id] ?? true}
                                  onCheckedChange={(c) =>
                                    setPublicFlags((prev) => ({
                                      ...prev,
                                      [item.id]: !!c,
                                    }))
                                  }
                                />
                                <label
                                  htmlFor={`pub-${item.id}`}
                                  className="cursor-pointer font-medium text-green-700"
                                >
                                  Public
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {item.changes && item.changes.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          <strong>変更点:</strong> {item.changes.join(", ")}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="p-4 bg-muted rounded-md whitespace-pre-wrap border font-mono text-sm">
                  {result}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => {
                  setResult("");
                  setStep("confirm");
                }}
              >
                戻る
              </Button>
              <Button
                onClick={handleUpdatePosts}
                disabled={updateLoading || editableResults.length === 0}
              >
                {updateLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                この内容で更新する
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "select" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Step 1: 修正対象の指定
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            posts.length > 0 &&
                            selectedPostIds.size === posts.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>current_at</TableHead>
                      <TableHead>title</TableHead>
                      <TableHead>content</TableHead>
                      <TableHead>tags</TableHead>
                      <TableHead>second</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          データがありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      posts.map((post) => (
                        <TableRow
                          key={post.id}
                          data-state={
                            selectedPostIds.has(post.id) && "selected"
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedPostIds.has(post.id)}
                              onCheckedChange={() => handleSelectPost(post.id)}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {post.current_at
                              ? new Date(post.current_at).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell
                            className="font-medium max-w-[150px] truncate"
                            title={post.title}
                          >
                            {post.title}
                          </TableCell>
                          <TableCell className="whitespace-pre-wrap">
                            {post.content}
                          </TableCell>
                          <TableCell>{post.tags?.join(", ")}</TableCell>
                          <TableCell>{post.second}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button
              onClick={handlePrepareForAI}
              disabled={selectedPostIds.size === 0}
            >
              選択した投稿をAIで修正 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
