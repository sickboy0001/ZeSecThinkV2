"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Calendar, Hash, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner"; // またはお使いのtoastライブラリ
import { getZstuPostsWithDate, ZstuPost } from "@/services/zstuposts_service";
import { AnalyticsTagMoment } from "@/components/molecules/Analytics/AnalyticsTagMoment";
import { AnalyticsTagHeatmap } from "@/components/molecules/Analytics/AnalyticsTagHeatMap";
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
    start: new Date(new Date().setDate(new Date().getDate() - 89)), // 90日間
    end: new Date(),
  });
  const [rangeValue, setRangeValue] = useState("3m");

  const handleRangeChange = (val: string) => {
    setRangeValue(val);
    const end = new Date();
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

  // 1. データ取得ロジック
  useEffect(() => {
    // userId が存在しない、または 'undefined' という文字列の場合は実行しない
    if (!userId || userId === "undefined") return;

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const formatDate = (d: Date) => d.toISOString().split("T")[0];
        // getZstuPostsWithDate は外部からインポートされている想定
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
      .slice(0, 5);

    // 【重要】時系列順に並べるために weekKeys をソート
    const momentumData = Object.keys(weeklyTagStats)
      .sort() // 日付順にソート
      .map((weekKey) => {
        const weekData: any = { label: weekKey.substring(5) }; // "MM-DD"
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
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-700">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
            <BrainCircuit className="h-4 w-4" />
            {range.start.toLocaleDateString()} 〜{" "}
            {range.end.toLocaleDateString()} の分析
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
              <SelectItem value="1w">過去 1週間</SelectItem>
              <SelectItem value="1m">過去 1ヶ月</SelectItem>
              <SelectItem value="3m">過去 3ヶ月</SelectItem>
              <SelectItem value="6m">過去 6ヶ月</SelectItem>
              <SelectItem value="1y">過去 1年</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 1. タグ・モメンタム */}
        {stats && (
          <AnalyticsTagMoment
            momentumData={stats.momentumData}
            sortedTags={stats.sortedTags}
            maxVal={stats.maxVal}
          />
        )}

        {/* 2. AI インサイト */}
        <Card className="shadow-md border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-3 rounded-lg bg-background/50 border border-primary/10">
              <p className="font-bold text-primary mb-1">最多活動タグ</p>
              最も多く記録されたのは{" "}
              <span className="underline">
                #{stats?.sortedTags[0]?.name}
              </span>{" "}
              です。このテーマに関する思考が深まっています。
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-primary/10">
              <p className="font-bold text-primary mb-1">集中の兆候</p>
              1日平均 {((stats?.totalCount || 0) / daysInRange).toFixed(1)}{" "}
              件のメモ。継続的なアウトプットが維持されています。
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 活動密度ヒートマップ (postsから動的に生成) */}
      {stats && (
        <AnalyticsTagHeatmap
          range={range}
          items={[
            { label: "思考密度 (全体)", dateMap: stats.dateMap },
            ...stats.sortedTags.map((tag) => ({
              label: `#${tag.name}`,
              dateMap: stats.tagDateMap[tag.name] || {},
            })),
          ]}
        />
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
          {stats?.sortedTags.map((tag) => (
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
