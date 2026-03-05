"use client";

import {
  getAiLogDetail,
  AiLogDetail as AiLogDetailData,
} from "@/services/ai_log_service";
import { getZstuPostsWithIds } from "@/services/zstuposts_service";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface Props {
  batchId: string;
}

interface ZstuPost {
  id: number;
  state_detail?: {
    ai_request?: {
      status?: string;
    };
  };
}

export default function AiLogDetailTable({ batchId }: Props) {
  const [detailData, setDetailData] = useState<AiLogDetailData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publicStates, setPublicStates] = useState<Record<string, boolean>>({});

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const togglePublic = (id: string) => {
    setPublicStates((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  const selectAll = () => {
    if (!detailData) return;
    setSelectedIds(new Set(detailData.map((log) => log.id.toString())));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // getAiLogDetailから基本データを取得

        const logDetails = await getAiLogDetail(batchId);
        if (!logDetails) {
          throw new Error("ログが見つかりません。");
        }

        // getZstuPostsWithIdsからステータス情報を取得
        const postIds = logDetails.map((log) => log.post_id);
        const zstuPosts = (await getZstuPostsWithIds(postIds)) as ZstuPost[];
        // post_idをキーにしたステータスマップを作成
        const statusMap = new Map<string, string>();
        if (zstuPosts) {
          zstuPosts.forEach((post) => {
            if (post && post.id) {
              // state_detail.ai_ai_request.status を取得。存在しない場合は "Unprocess"
              const status =
                post.state_detail?.ai_request?.status || "Unprocess";
              statusMap.set(post.id.toString(), status);
              // console.log(post);
              // console.log("status:", post.state_detail);
            }
          });
        }

        // log.statusを新しいステータスで更新
        const updatedDetailData = logDetails.map((log) => {
          const newStatus = statusMap.get(log.post_id.toString());
          // @ts-ignore
          return newStatus ? { ...log, status: newStatus } : log;
        });

        setDetailData(updatedDetailData);
        console.log("Updated Detail Data:", updatedDetailData);
        setSelectedIds(
          new Set(updatedDetailData.map((log) => log.id.toString())),
        );
      } catch (error: any) {
        const errorMessage = error.message || "AIログ詳細の取得に失敗しました";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!detailData || detailData.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        データがありません。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold px-1">
          詳細ログ ({detailData.length}件)
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            すべて登録ON
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            すべて登録OFF
          </Button>
        </div>
      </div>

      {detailData.map((log) => {
        let savedContentTitle = log.fixed_title;
        let savedContentText = log.fixed_text;
        let savedContentTags = log.fixed_tags;
        let savedContentTextVisible = false;

        // @ts-ignore
        if (log.status === "refined") {
          savedContentTitle = log.after_title;
          savedContentText = log.after_text;
          savedContentTags = log.after_tags;
          savedContentTextVisible = true;
          // @ts-ignore
        } else if (log.status === "completed") {
          savedContentTextVisible = true;
        }
        return (
          <Card key={log.id} className="overflow-hidden border-muted">
            <CardContent className="p-0">
              {/* Row 1: ID & PostID (最小限の高さに調整) */}
              <div className="bg-muted/30 px-4 py-1.5 border-b flex flex-wrap gap-x-6 gap-y-2 text-[13px] items-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`select-${log.id}`}
                    checked={selectedIds.has(log.id.toString())}
                    onCheckedChange={() => toggleSelection(log.id.toString())}
                  />
                  <label
                    htmlFor={`select-${log.id}`}
                    className="cursor-pointer text-muted-foreground select-none"
                  >
                    登録
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`public-${log.id}`}
                    checked={publicStates[log.id.toString()] ?? true}
                    onCheckedChange={() => togglePublic(log.id.toString())}
                  />
                  <label
                    htmlFor={`public-${log.id}`}
                    className="cursor-pointer text-muted-foreground select-none"
                  >
                    Public
                  </label>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-bold">{log.id}</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-muted-foreground">PostID:</span>
                  <span className="font-bold">{log.post_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* @ts-ignore */}
                  {log.status === "processing" && (
                    <div className="text-[11px] font-bold text-blue-600 bg-blue-50/50 w-fit px-1.5 py-0.5 rounded border border-blue-100">
                      処理中
                    </div>
                  )}
                  {/* @ts-ignore */}
                  {log.status === "refined" && (
                    <div className="text-[11px] font-bold text-green-600 bg-green-50/50 w-fit px-1.5 py-0.5 rounded border border-green-100">
                      受領済(未登録)
                    </div>
                  )}
                  {/* @ts-ignore */}
                  {log.status === "completed" && (
                    <div className="text-[11px] font-bold text-purple-600 bg-purple-50/50 w-fit px-1.5 py-0.5 rounded border border-purple-100">
                      保存済
                    </div>
                  )}
                  {/* @ts-ignore */}
                  {log.is_edited && (
                    <div className="text-[11px] font-bold text-orange-600 bg-orange-50/50 w-fit px-1.5 py-0.5 rounded border border-orange-100">
                      更新済
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Before / After / Fixed */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-muted/50">
                {/* 変更前 */}
                <div className="p-4 space-y-2.5">
                  <div className="text-[11px] font-bold text-red-600 bg-red-50/50 w-fit px-1.5 py-0.5 rounded border border-red-100">
                    変更前
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-sm leading-snug">
                      {log.before_title}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {log.before_text}
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium">
                      {log.before_tags}
                    </p>
                  </div>
                </div>

                {/* 変更後 */}
                <div className="p-4 space-y-2.5">
                  <div className="text-[11px] font-bold text-green-600 bg-green-50/50 w-fit px-1.5 py-0.5 rounded border border-green-100">
                    変更後
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-sm leading-snug">
                      {log.after_title}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {log.after_text}
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium">
                      {log.after_tags}
                    </p>
                  </div>
                </div>

                {/* 保存内容 */}
                <div className="p-4 space-y-2.5 bg-slate-50/30">
                  <div className="text-[11px] font-bold text-blue-700 bg-blue-50/50 w-fit px-1.5 py-0.5 rounded border border-blue-100">
                    保存内容
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-sm leading-snug">
                      {savedContentTitle}
                    </p>
                    <p
                      className={`text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed ${
                        !savedContentTextVisible
                          ? "text-transparent select-none"
                          : ""
                      }`}
                    >
                      {savedContentText ||
                        (!savedContentTextVisible ? "記録なし" : "")}
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium">
                      {savedContentTags}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 3: Change Summary */}
              <div className="p-4 bg-orange-50/20">
                <div className="text-[11px] font-bold text-orange-700/80 uppercase tracking-wider mb-1.5">
                  変更概要
                </div>
                <div className="text-[13px] leading-relaxed text-slate-700">
                  {log.changes_summary}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <div className="flex justify-end">
        <Button
          onClick={() =>
            console.log("Register", {
              selectedIds: Array.from(selectedIds),
              publicStates,
            })
          }
        >
          登録する
        </Button>
      </div>
    </div>
  );
}
