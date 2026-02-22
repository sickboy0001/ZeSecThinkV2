"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getZstuPostsWithDate, ZstuPost } from "@/services/zstuposts_service";
import {
  getAiRefinementHistorys,
  AiRefinementHistory,
} from "@/services/ai_log_service";

interface Props {
  userId: string;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const Calender = ({
  userId,
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: Props) => {
  const [posts, setPosts] = useState<ZstuPost[]>([]);
  const [aiLogs, setAiLogs] = useState<AiRefinementHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMonthPosts = async () => {
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

        // 1. まず投稿データを取得
        const postsData = await getZstuPostsWithDate(
          userId,
          formatDate(firstDay),
          formatDate(lastDay),
        );
        setPosts(postsData || []);

        // 2. 投稿がある場合のみ、そのIDリストを使ってAIログを取得
        if (postsData && postsData.length > 0) {
          const postIds = postsData.map((p) => p.id);
          const logsData = await getAiRefinementHistorys(postIds);
          setAiLogs((logsData as unknown as AiRefinementHistory[]) || []);
        } else {
          setAiLogs([]);
        }
      } catch (error) {
        console.error(error);
        toast.error("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchMonthPosts();
  }, [userId, currentDate]);

  // 指定した月のカレンダーの日付を計算
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days: Date[] = [];
    // 日曜日始まりにするためのオフセット
    const startOffset = firstDayOfMonth.getDay();
    for (let i = startOffset; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    // 当月の日付
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    // 土曜日で終わるように調整（最大42マス）
    while (days.length % 7 !== 0) {
      const lastDay = days[days.length - 1];
      days.push(new Date(year, lastDay.getMonth(), lastDay.getDate() + 1));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);

  // 日付文字列をキーにしてメモをグループ化
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

  const getStatusStyle = (postId: number) => {
    const relatedLogs = aiLogs.filter((log) => log.post_id === postId);

    if (relatedLogs.length === 0) {
      // 問い合わせなし: 薄いグレー
      return "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-100";
    }

    // 最新のログを取得（ID降順と仮定）
    const latestLog = relatedLogs.sort((a, b) => b.id - a.id)[0];

    if (!latestLog.applied) {
      // 問い合わせあり、更新なし: 薄い赤
      return "bg-red-100 border-red-200 text-red-700 hover:bg-red-200";
    }

    if (latestLog.is_edited) {
      // 問い合わせあり、更新あり、調整あり: 薄い緑
      return "bg-green-100 border-green-200 text-green-700 hover:bg-green-200";
    }

    // 問い合わせあり、更新あり、調整なし: 薄い青
    return "bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200";
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4">
          {/* タイトル（月） */}
          <p className="font-semibold text-lg">
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}
            月のログ
          </p>
          {/* 月移動ボタン */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={onToday}>
              今月
            </Button>
            <Button variant="outline" size="icon" onClick={onNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b bg-muted/50 text-center font-medium py-2">
          {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
            <div
              key={d}
              className={
                d === "日" ? "text-red-500" : d === "土" ? "text-blue-500" : ""
              }
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
          {days.map((day, i) => {
            const dateKey = day.toISOString().split("T")[0];
            const dayMemos = postsByDate[dateKey] || [];
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={i}
                className={`border-r border-b p-2 transition-colors hover:bg-muted/30 ${
                  !isCurrentMonth
                    ? "bg-muted/20 text-muted-foreground"
                    : "bg-background"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-sm font-bold ${
                      day.getDay() === 0
                        ? "text-red-500"
                        : day.getDay() === 6
                          ? "text-blue-500"
                          : ""
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayMemos.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 h-4">
                      {dayMemos.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {dayMemos.map((memo) => (
                    <div
                      key={memo.id}
                      className={`text-[11px] leading-tight p-1 rounded border truncate cursor-pointer ${getStatusStyle(
                        memo.id,
                      )}`}
                      title={`${memo.title}\n${memo.content}`}
                    >
                      {/* ${memo.id}\n */}
                      {memo.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 flex items-center justify-end gap-x-4 gap-y-1 flex-wrap text-xs sm:text-sm">
          <span className="font-semibold">凡例:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></span>
            <span className="text-muted-foreground">問い合わせなし</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-200 border border-red-300"></span>
            <span className="text-muted-foreground">
              問い合わせあり更新なし
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></span>
            <span className="text-muted-foreground">
              問い合わせあり更新あり調整あり
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-200 border border-blue-300"></span>
            <span className="text-muted-foreground">
              問い合わせあり更新あり調整なし
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Calender;
