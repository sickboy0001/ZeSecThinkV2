"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, History, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { getZstuPostsWithDate, ZstuPost } from "@/services/zstuposts_service";
import {
  getAiRefinementHistorys,
  getAiBatchesByPeriod,
  getAiRefinementHistoryByBatch,
  AiRefinementHistory,
} from "@/services/ai_log_service";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  userId: string;
  currentDate: Date;
}

// バッチの型定義（サービスに合わせて調整してください）
interface AiBatch {
  id: number;
  created_at: string;
  total_memos: number;
  status: string;
}

const Batchs = ({ userId, currentDate }: Props) => {
  const [posts, setPosts] = useState<ZstuPost[]>([]);
  const [aiLogs, setAiLogs] = useState<AiRefinementHistory[]>([]);
  const [batches, setBatches] = useState<AiBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [batchDetails, setBatchDetails] = useState<Record<number, any[]>>({});
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const firstDay = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        );
        const lastDay = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
        );
        const formatDate = (d: Date) => d.toISOString().split("T")[0];

        const sStr = formatDate(firstDay);
        const eStr = formatDate(lastDay);

        // 1. 投稿データとAI履歴を取得 (カレンダー表示用)
        const postsData = await getZstuPostsWithDate(userId, sStr, eStr);
        setPosts(postsData || []);

        if (postsData && postsData.length > 0) {
          const postIds = postsData.map((p) => p.id);
          const logsData = await getAiRefinementHistorys(postIds);
          setAiLogs((logsData as any) || []);
        }

        // 2. その期間のAI実行バッチ一覧を取得
        const batchesData = await getAiBatchesByPeriod(userId, sStr, eStr);
        setBatches((batchesData as any) || []);
      } catch (error) {
        console.error(error);
        toast.error("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, currentDate]);

  // アコーディオンが開かれた時に詳細を取得
  const handleAccordionChange = async (value: string) => {
    setExpandedBatchId(value);
    if (!value) return;

    const batchId = parseInt(value);
    if (batchDetails[batchId]) return; // すでに取得済みならスキップ

    try {
      const details = await getAiRefinementHistoryByBatch(batchId);
      setBatchDetails((prev) => ({ ...prev, [batchId]: details }));
    } catch (error) {
      toast.error("詳細の取得に失敗しました");
    }
  };

  // --- カレンダー描画用ロジック (既存) ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const days: Date[] = [];
    const startOffset = firstDayOfMonth.getDay();
    for (let i = startOffset; i > 0; i--)
      days.push(new Date(year, month, 1 - i));
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++)
      days.push(new Date(year, month, i));
    while (days.length % 7 !== 0) {
      const lastDay = days[days.length - 1];
      days.push(new Date(year, lastDay.getMonth(), lastDay.getDate() + 1));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const postsByDate = posts.reduce(
    (acc, post) => {
      if (!post.current_at) return acc;
      const dateKey = new Date(post.current_at).toISOString().split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(post);
      return acc;
    },
    {} as Record<string, ZstuPost[]>,
  );

  return (
    <div className="space-y-6">
      {/* AI実行バッチ履歴 (アコーディオン) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">AI実行ログ</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">更新内容</span>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="変更内容で検索..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : batches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg bg-muted/10">
            この期間の実行履歴はありません
          </p>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-2"
            onValueChange={handleAccordionChange}
          >
            {batches.map((batch) => {
              const details = batchDetails[batch.id];
              const filteredCount =
                filterText && details
                  ? details.filter((detail) =>
                      detail.changes_summary
                        ?.toLowerCase()
                        .includes(filterText.toLowerCase()),
                    ).length
                  : null;
              return (
                <AccordionItem
                  key={batch.id}
                  value={batch.id.toString()}
                  className="border rounded-lg bg-card px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-4 w-full text-left">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Batch #{batch.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            const date = new Date(batch.created_at);
                            // 9時間をミリ秒単位で加算 (9時間 * 60分 * 60秒 * 1000ミリ秒)
                            const jstDate = new Date(
                              date.getTime() + 9 * 60 * 60 * 1000,
                            );

                            return jstDate.toLocaleString("ja-JP", {
                              timeZone: "Asia/Tokyo",
                            });
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mr-4">
                        {/* 件数 */}
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          {filteredCount !== null && (
                            <span className="font-bold mr-1">
                              {filteredCount} /
                            </span>
                          )}
                          {batch.total_memos}件のメモ
                        </Badge>
                        {/* 状態 */}
                        <Badge
                          className="text-sm px-3 py-1"
                          color={
                            batch.status === "completed" ? "green" : "orange"
                          }
                        >
                          {batch.status}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-4">
                    <div className="border-t pt-3 mt-1">
                      {!batchDetails[batch.id] ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {batchDetails[batch.id]
                            .filter((detail) =>
                              filterText
                                ? detail.changes_summary
                                    ?.toLowerCase()
                                    .includes(filterText.toLowerCase())
                                : true,
                            )
                            .map((detail) => (
                              <div
                                key={detail.id}
                                className="text-xs p-2 border rounded bg-muted/5 flex flex-col gap-1"
                              >
                                <div className="flex justify-between font-bold text-gray-700">
                                  {/* // ポストのタイトルの表示 */}
                                  <span>
                                    {detail.after_title || detail.before_title}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">
                                    ID: {detail.post_id}
                                  </span>
                                </div>
                                <p className="text-gray-700 line-clamp-2 bold">
                                  {filterText && detail.changes_summary
                                    ? detail.changes_summary
                                        .split(
                                          new RegExp(`(${filterText})`, "gi"),
                                        )
                                        .map((part: string, i: number) =>
                                          part.toLowerCase() ===
                                          filterText.toLowerCase() ? (
                                            <span
                                              key={i}
                                              className="bg-yellow-200 text-red-600 font-bold"
                                            >
                                              {part}
                                            </span>
                                          ) : (
                                            part
                                          ),
                                        )
                                    : detail.changes_summary}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </section>
    </div>
  );
};

export default Batchs;
