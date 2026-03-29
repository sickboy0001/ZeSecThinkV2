"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BrainCircuit,
  Calendar,
  Hash,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // またはお使いの toast ライブラリ
import { getZstuPostsWithDate, ZstuPost } from "@/services/zstuposts_service";
import { AnalyticsTagMoment } from "@/components/molecules/Analytics/AnalyticsTagMoment";
import { AnalyticsTagHeatmap } from "@/components/molecules/Analytics/AnalyticsTagHeatMap";
import { AnalyticsTagWordCloud } from "@/components/molecules/Analytics/AnalyticsTagWordCloud";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  userId: string;
}
export default function Analytics({ userId }: Props) {
  const [posts, setPosts] = useState<ZstuPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 90)), // 90 日間（昨日起点）
    end: new Date(new Date().setDate(new Date().getDate() - 1)), // 昨日
  });
  const [rangeValue, setRangeValue] = useState("3m");

  const handleRangeChange = (val: string) => {
    setRangeValue(val);
    const end = new Date();
    end.setDate(end.getDate() - 1); // 昨日をエンドポイントに
    const start = new Date();

    switch (val) {
      case "1w":
        start.setDate(end.getDate() - 6);
        break;
      case "1m":
        start.setMonth(end.getMonth() - 1);
        break;
      case "3m":
        start.setMonth(end.getMonth() - 3);
        break;
      case "6m":
        start.setMonth(end.getMonth() - 6);
        break;
      case "1y":
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    setRange({ start, end });
  };

  // 期間をシフトする関数
  const shiftRange = (direction: "prev" | "next") => {
    const duration = range.end.getTime() - range.start.getTime();
    const shiftDays = Math.round(duration / (1000 * 60 * 60 * 24));

    if (direction === "prev") {
      setRange({
        start: new Date(range.start.getTime() - duration),
        end: new Date(range.end.getTime() - duration),
      });
    } else {
      // 次の期間（未来には進めない）
      const newStart = new Date(range.end.getTime());
      const newEnd = new Date(range.end.getTime() + duration);

      // 未来に進まないようにチェック
      if (newEnd > new Date()) {
        return;
      }

      setRange({
        start: newStart,
        end: newEnd,
      });
    }
  };

  // 1. データ取得ロジック
  useEffect(() => {
    // userId が存在しない、または 'undefined' という文字列の場合は実行しない
    if (!userId || userId === "undefined") return;

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const formatDate = (d: Date) => d.toISOString().split("T")[0];
        // getZstuPostsWithDate は外部からインポートされている想定
        console.log(formatDate(range.end), formatDate(range.start));
        const data = await getZstuPostsWithDate(
          userId,
          formatDate(range.start),
          formatDate(range.end),
        );
        setPosts(data || []);
      } catch (error) {
        toast.error("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [userId, range]);
  // 2. データ集計ロジック (時系列分析対応)
  const stats = useMemo(() => {
    if (posts.length === 0) return null;

    const tagMap: Record<string, number> = {};
    const dateMap: Record<string, number> = {};
    const tagDateMap: Record<string, Record<string, number>> = {};
    const weeklyTagStats: Record<string, Record<string, number>> = {};

    posts.forEach((post) => {
      // タイムゾーンの影響を避けるため current_at を調整
      const d = new Date(post.current_at);
      const dateStr = d.toISOString().split("T")[0];

      // 週のキー（日曜日の日付）を算出
      const day = d.getDay();
      const sun = new Date(d);
      sun.setDate(d.getDate() - day);
      const weekKey = sun.toISOString().split("T")[0];

      // 全体タグ集計
      post.tags?.forEach((tag) => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
        if (!weeklyTagStats[weekKey]) weeklyTagStats[weekKey] = {};
        weeklyTagStats[weekKey][tag] = (weeklyTagStats[weekKey][tag] || 0) + 1;

        // タグ別日別集計
        if (!tagDateMap[tag]) tagDateMap[tag] = {};
        tagDateMap[tag][dateStr] = (tagDateMap[tag][dateStr] || 0) + 1;
      });

      dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
    });

    const sortedTags = Object.entries(tagMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const sortedTagAlls = Object.entries(tagMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 【修正】選択された期間 (range) 内の週データのみをフィルタリング
    // 過去 1 週間の場合は日単位、それ以外は週単位でデータを生成
    const momentumData =
      rangeValue === "1w"
        ? // 日単位データ生成
          Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(range.start);
            date.setDate(date.getDate() + i);
            // ローカル時間（日本時間）で日付を取得
            const localDate = new Date(
              date.getTime() + date.getTimezoneOffset() * 60000,
            );
            const dateStr = localDate.toISOString().split("T")[0];
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const day = date.getDate().toString().padStart(2, "0");

            const dayData: any = {
              label: `${month}/${day}`,
            };
            sortedTags.forEach((tag) => {
              dayData[tag.name] = tagDateMap[tag.name]?.[dateStr] || 0;
            });
            return dayData;
          })
        : // 週単位データ生成
          Object.keys(weeklyTagStats)
            .sort() // 日付順にソート
            .filter((weekKey) => {
              // 週の開始日 (日曜日) を Date オブジェクトに変換
              const weekStart = new Date(weekKey);
              // 週の終了日 (土曜日) を算出 (開始日 + 6 日)
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);

              // 週の範囲が選択された期間と重なっているかチェック
              // 週の終了日が期間の開始日より前、または週の開始日が期間の終了日より後なら除外
              return !(weekEnd < range.start || weekStart > range.end);
            })
            .map((weekKey) => {
              // 週の開始日と終了日からラベルを生成 (例："02/24 - 03/02")
              const weekStart = new Date(weekKey);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);

              const formatWeekLabel = (d: Date) => {
                const month = (d.getMonth() + 1).toString().padStart(2, "0");
                const day = d.getDate().toString().padStart(2, "0");
                return `${month}/${day}`;
              };

              const weekData: any = {
                label: `${formatWeekLabel(weekStart)} - ${formatWeekLabel(weekEnd)}`,
              };
              sortedTags.forEach((tag) => {
                weekData[tag.name] = weeklyTagStats[weekKey][tag.name] || 0;
              });
              return weekData;
            });

    // 最大値を取得（高さ計算用）
    const maxVal = Math.max(
      ...momentumData.map((w) =>
        sortedTags.reduce((acc, tag) => acc + (w[tag.name] || 0), 0),
      ),
      1,
    );

    return {
      sortedTags,
      sortedTagAlls,
      dateMap,
      tagDateMap,
      totalCount: posts.length,
      momentumData,
      maxVal,
    };
  }, [posts]);

  const daysInRange = useMemo(() => {
    return (
      Math.round(
        (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1
    );
  }, [range]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
            <BrainCircuit className="h-4 w-4" />
            <button
              onClick={() => shiftRange("prev")}
              className="p-1.5 hover:bg-primary/20 active:bg-primary/30 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              title="前の期間へ"
            >
              <ChevronLeft className="h-5 w-5 text-primary" />
            </button>
            {range.start.toLocaleDateString()} 〜{" "}
            {range.end.toLocaleDateString()} の分析
            <button
              onClick={() => shiftRange("next")}
              className="p-1.5 hover:bg-primary/20 active:bg-primary/30 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="次の期間へ"
              disabled={
                range.end.getTime() +
                  (range.end.getTime() - range.start.getTime()) >
                Date.now()
              }
            >
              <ChevronRight className="h-5 w-5 text-primary" />
            </button>
            <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
              Total: {stats?.totalCount || 0} posts
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={rangeValue} onValueChange={handleRangeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1w">過去 1 週間</SelectItem>
              <SelectItem value="1m">過去 1 ヶ月</SelectItem>
              <SelectItem value="3m">過去 3 ヶ月</SelectItem>
              <SelectItem value="6m">過去 6 ヶ月</SelectItem>
              <SelectItem value="1y">過去 1 年</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. タグ・モメンタム */}
        {/* これがないと、メニューボタンが消える<div className="overflow-x-auto"> */}
        <div className="overflow-x-auto">
          {stats && (
            <AnalyticsTagMoment
              momentumData={stats.momentumData}
              sortedTags={stats.sortedTags}
              maxVal={stats.maxVal}
              rangeValue={rangeValue}
            />
          )}
        </div>

        {/* 2. タグ・クラウド */}
        {stats && (
          <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <AnalyticsTagWordCloud
              sortedTags={stats.sortedTagAlls}
              totalCount={stats.totalCount}
            />
          </div>
        )}
      </div>
      {/* 3. 活動密度ヒートマップ (posts から動的に生成) */}
      {stats && (
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <AnalyticsTagHeatmap
            range={range}
            items={[
              { label: "思考密度 (全体)", dateMap: stats.dateMap },
              ...stats.sortedTags.slice(0, 4).map((tag) => ({
                label: `#${tag.name}`,
                dateMap: stats.tagDateMap[tag.name] || {},
              })),
            ]}
          />
        </div>
      )}

      {/* 4. タグ詳細ランキング */}
      <Card className="shadow-md border-muted/40">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Hash className="h-5 w-5 text-orange-500" />
            タグ・ランキング（Top 5）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats?.sortedTags.slice(0, 5).map((tag) => (
            <div key={tag.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">#{tag.name}</span>
                <span className="text-muted-foreground">{tag.count} posts</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-orange-500 h-full transition-all duration-1000"
                  style={{
                    width: `${(tag.count / stats.sortedTags[0].count) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
