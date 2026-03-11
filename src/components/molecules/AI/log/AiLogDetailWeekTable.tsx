"use client";

import {
  getAiLogDetailFromPostIds,
  AiLogDetailStatus,
} from "@/services/ai_log_service";
import {
  getZstuPostsWithDate,
  getZstuPostsWithIds,
  ZstuPost,
} from "@/services/zstuposts_service";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AiLogDetailCard, { AiLogDetailCardRef } from "./AiLogDetailCard";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  initialDate?: string;
}

export default function AiLogDetailWeekTable({ userId, initialDate }: Props) {
  // console.log("AiLogDetailWeekTable rendered with date:", initialDate);
  const router = useRouter();
  const [detailData, setDetailData] = useState<AiLogDetailStatus[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publicStates, setPublicStates] = useState<Record<string, boolean>>({});
  const [currentDate, setCurrentDate] = useState<string>(
    initialDate ||
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [refreshKey, setRefreshKey] = useState(0);

  // currentDateが変わったらselectedDateも同期する（初期表示や週切り替え時）
  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

  // 各カードのrefを保持するためのマップ
  const cardRefs = useRef<Map<string, AiLogDetailCardRef | null>>(new Map());

  // 週の範囲を取得 (日曜〜土曜)
  const getWeekRange = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 (日) から 6 (土)

    const start = new Date(d);
    start.setDate(d.getDate() - day);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    };

    return {
      start: formatDate(start),
      end: formatDate(end),
      days: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return formatDate(date);
      }),
    };
  };

  const weekRange = getWeekRange(currentDate);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d),
    );
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d),
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data for week range:", weekRange);
      setLoading(true);
      setError(null);
      try {
        // 1週間分の投稿を取得
        const posts = await getZstuPostsWithDate(
          userId,
          weekRange.start,
          weekRange.end,
        );

        if (!posts || posts.length === 0) {
          setDetailData([]);
          setSelectedIds(new Set());
          return;
        }

        const postIds = posts.map((post) => post.id);
        const logDetails = await getAiLogDetailFromPostIds(postIds);

        // 投稿をベースにログ詳細データを作成する（AILogがないポストも「未処理」として含める）
        const updatedDetailData: AiLogDetailStatus[] = posts.map((post) => {
          // 対応するログ詳細を探す
          const log = logDetails.find((l) => l.post_id === post.id);

          let stateDetail = post?.state_detail;
          if (typeof stateDetail === "string") {
            try {
              stateDetail = JSON.parse(stateDetail);
            } catch (e) {}
          }

          const status =
            (stateDetail as any)?.ai_request?.status || "unprocessed";
          const is_edited =
            (stateDetail as any)?.ai_request?.is_edited === true ||
            (stateDetail as any)?.ai_request?.is_edited === "true";

          let currentDateStr = "";
          if (post?.current_at) {
            const d = new Date(post.current_at);
            if (!isNaN(d.getTime())) {
              currentDateStr = new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Tokyo",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(d);
            }
          }

          if (log) {
            return {
              ...log,
              status,
              current_at: currentDateStr,
              created_at: post?.created_at || "",
              updated_at: post?.updated_at || "",
              is_edited,
            };
          } else {
            // AILogがない場合（未処理のポスト）
            return {
              id: -post.id, // AILogとしてのIDがないため、暫定的にpost_idの負数を使用
              post_id: post.id,
              batch_id: 0,
              order_index: 0,
              before_title: post.title,
              before_text: post.content,
              before_tags: post.tags?.join(", ") || null,
              after_title: null,
              after_text: null,
              after_tags: null,
              changes_summary: null,
              fixed_title: null,
              fixed_text: null,
              fixed_tags: null,
              status,
              current_at: currentDateStr,
              created_at: post?.created_at || "",
              updated_at: post?.updated_at || "",
              is_edited,
            };
          }
        });

        updatedDetailData.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setDetailData(updatedDetailData);

        // 初期選択: 未完了のもの
        setSelectedIds(
          new Set(
            updatedDetailData
              .filter((log) => log.status !== "completed")
              .map((log) => log.id.toString()),
          ),
        );
      } catch (error: any) {
        const msg = error.message || "データの取得に失敗しました";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, currentDate, refreshKey]);

  // 日付ごとの集計
  const getSummaryByDate = () => {
    const summary = new Map<
      string,
      {
        total: number;
        completed: number;
        refined: number;
        processing: number;
        unprocessed: number;
      }
    >();

    // 初期化
    weekRange.days.forEach((day) => {
      summary.set(day, {
        total: 0,
        completed: 0,
        refined: 0,
        processing: 0,
        unprocessed: 0,
      });
    });

    detailData?.forEach((log) => {
      const date = log.current_at;
      const stats = summary.get(date);
      if (stats) {
        stats.total++;
        if (log.status === "completed") stats.completed++;
        else if (log.status === "refined") stats.refined++;
        else if (log.status === "processing") stats.processing++;
        else stats.unprocessed++;
      }
    });

    return summary;
  };

  const summaryData = getSummaryByDate();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  const handleRegisterAll = async () => {
    if (!detailData) return;
    const selectedLogs = detailData.filter((log) =>
      selectedIds.has(log.id.toString()),
    );
    if (selectedLogs.length === 0) {
      toast.warning("登録する項目が選択されていません");
      return;
    }

    try {
      setLoading(true);
      const savePromises = selectedLogs.map(async (log) => {
        const ref = cardRefs.current.get(log.id.toString());
        if (ref) await ref.saveData();
      });
      await Promise.all(savePromises);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${selectedLogs.length}件のデータを登録しました`);
      setRefreshKey((prev) => prev + 1);
    } catch (e: any) {
      toast.error(e.message || "登録中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 週間ヘッダー */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevWeek}
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[200px]">
            <h2 className="text-lg font-bold">
              {weekRange.start.replace(/-/g, "/")} 〜{" "}
              {weekRange.end.replace(/-/g, "/")}
            </h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
              Weekly AI Log Summary
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
            disabled={loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSelectedIds(
                new Set(
                  detailData
                    ?.filter((l) => l.status !== "completed")
                    .map((l) => l.id.toString()),
                ),
              )
            }
          >
            すべてON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            すべてOFF
          </Button>
        </div>
      </div>

      {/* サマリー（デスクトップ: テーブル形式） */}
      <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px] border-r bg-muted/30">
                項目
              </TableHead>
              {weekRange.days.map((day, index) => {
                const isSelected = day === selectedDate;
                const isToday =
                  day ===
                  new Intl.DateTimeFormat("en-CA", {
                    timeZone: "Asia/Tokyo",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }).format(new Date());
                return (
                  <TableHead
                    key={day}
                    className={`text-center px-2 min-w-[80px] cursor-pointer transition-colors hover:bg-muted/80 ${
                      isSelected ? "bg-primary/15" : ""
                    } ${isToday ? "text-primary font-bold" : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-[10px] leading-tight opacity-70">
                      {day.split("-").slice(1).join("/")}
                    </div>
                    <div
                      className={`text-sm ${
                        index === 0
                          ? "text-red-500"
                          : index === 6
                            ? "text-blue-500"
                            : ""
                      }`}
                    >
                      ({dayNames[index]})
                    </div>
                    {isSelected && (
                      <div className="h-0.5 w-full bg-primary mt-1" />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-bold border-r bg-muted/10">
                合計
              </TableCell>
              {weekRange.days.map((day) => (
                <TableCell key={day} className="text-center font-medium">
                  {summaryData.get(day)?.total || 0}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium border-r bg-muted/10">
                AI処理済
              </TableCell>
              {weekRange.days.map((day) => (
                <TableCell key={day} className="text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                    {summaryData.get(day)?.refined || 0}
                  </span>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium border-r bg-muted/10">
                完了
              </TableCell>
              {weekRange.days.map((day) => (
                <TableCell key={day} className="text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    {summaryData.get(day)?.completed || 0}
                  </span>
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-muted/5">
              <TableCell className="text-xs text-muted-foreground border-r">
                未処理/中
              </TableCell>
              {weekRange.days.map((day) => {
                const stats = summaryData.get(day);
                return (
                  <TableCell
                    key={day}
                    className="text-center text-xs text-muted-foreground"
                  >
                    {(stats?.processing || 0) + (stats?.unprocessed || 0)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* サマリー（モバイル: 3列カード形式） */}
      <div className="md:hidden grid grid-cols-4 gap-2">
        {weekRange.days.map((day, index) => {
          const stats = summaryData.get(day);
          const isSelected = day === selectedDate;
          const isToday =
            day ===
            new Intl.DateTimeFormat("en-CA", {
              timeZone: "Asia/Tokyo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date());

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(day)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "bg-card border-border"
              } ${isToday ? "border-primary/50" : ""}`}
            >
              <div className="flex flex-col items-center mb-2">
                <span className="text-[10px] text-muted-foreground leading-none">
                  {day.split("-").slice(1).join("/")}
                </span>
                <span
                  className={`text-xs font-bold ${
                    index === 0
                      ? "text-red-500"
                      : index === 6
                        ? "text-blue-500"
                        : ""
                  } ${isToday ? "underline decoration-2 underline-offset-2" : ""}`}
                >
                  {dayNames[index]}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">計</span>
                  <span className="text-xs font-bold">{stats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-yellow-600 font-medium">
                    AI
                  </span>
                  <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-1 rounded-sm">
                    {stats?.refined || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-green-600 font-medium">
                    完
                  </span>
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-1 rounded-sm">
                    {stats?.completed || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-dashed">
                  <span className="text-[10px] text-muted-foreground">未</span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {(stats?.processing || 0) + (stats?.unprocessed || 0)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 詳細リスト */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h3 className="text-lg font-bold flex items-center flex-wrap gap-2">
            詳細ログ一覧
            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded border">
              {selectedDate.split("-").slice(1).join("/")}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              (
              {
                detailData?.filter((log) => log.current_at === selectedDate)
                  .length
              }
              件)
            </span>
          </h3>
          <Button
            className="w-full sm:w-auto"
            onClick={handleRegisterAll}
            disabled={
              loading ||
              selectedIds.size === 0 ||
              detailData?.filter(
                (log) =>
                  log.current_at === selectedDate &&
                  selectedIds.has(log.id.toString()),
              ).length === 0
            }
          >
            選択した
            {
              detailData?.filter(
                (log) =>
                  log.current_at === selectedDate &&
                  selectedIds.has(log.id.toString()),
              ).length
            }
            件を登録する
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !detailData ||
          detailData.filter((log) => log.current_at === selectedDate).length ===
            0 ? (
          <div className="text-center py-24 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            {selectedDate.split("-").slice(1).join("/")}{" "}
            のデータはありません。上部テーブルから他の日付を選択してください。
          </div>
        ) : (
          <div className="space-y-4">
            {detailData
              .filter((log) => log.current_at === selectedDate)
              .map((log) => (
                <AiLogDetailCard
                  key={log.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(log.id.toString(), el);
                    else cardRefs.current.delete(log.id.toString());
                  }}
                  log={log}
                  isSelected={selectedIds.has(log.id.toString())}
                  isPublic={publicStates[log.id.toString()] ?? true}
                  onToggleSelection={() => {
                    if (log.status === "completed") return;
                    const newSet = new Set(selectedIds);
                    if (newSet.has(log.id.toString()))
                      newSet.delete(log.id.toString());
                    else newSet.add(log.id.toString());
                    setSelectedIds(newSet);
                  }}
                  onTogglePublic={() => {
                    if (log.status === "completed") return;
                    setPublicStates((prev) => ({
                      ...prev,
                      [log.id]: !(prev[log.id] ?? true),
                    }));
                  }}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
