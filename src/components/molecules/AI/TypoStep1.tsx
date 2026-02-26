"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  FileText,
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ZstuPost } from "@/services/zstuposts_service";
import { AiRefinementHistory } from "@/services/ai_log_service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  posts: ZstuPost[];
  loading: boolean;
  selectedPostIds: Set<number>;
  onSelectPost: (postId: number) => void;
  onBatchSelect: (ids: number[], selected: boolean) => void;
  onPrepareForAI: () => void;
  aiLogs: AiRefinementHistory[];
  start: Date;
  end: Date;
  onToday: () => void;
  onPrevRange: () => void;
  onNextRange: () => void;
  rangeType: "1w" | "2w" | "1m";
  onRangeChange: (value: string) => void;
}

type FilterStatus = "all" | "none" | "pending" | "edited" | "applied";

export default function TypoStep1({
  posts,
  loading,
  selectedPostIds,
  onSelectPost,
  onBatchSelect,
  onPrepareForAI,
  aiLogs,
  start,
  end,
  onToday,
  onPrevRange,
  onNextRange,
  rangeType,
  onRangeChange,
}: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // 日付ごとの集計データを計算
  const dailyStats = useMemo(() => {
    const stats: Record<
      string,
      { date: Date; counts: Record<string, number>; total: number }
    > = {};

    posts.forEach((post) => {
      if (!post.current_at) return;
      const dateObj = new Date(post.current_at);
      const dateKey = dateObj.toLocaleDateString();

      if (!stats[dateKey]) {
        stats[dateKey] = {
          date: dateObj,
          counts: { none: 0, pending: 0, edited: 0, applied: 0 },
          total: 0,
        };
      }

      // ステータス判定ロジック（getPostStatusと同様）
      let status = "none";
      const relatedLogs = aiLogs.filter((log) => log.post_id === post.id);
      if (relatedLogs.length > 0) {
        const latestLog = relatedLogs.sort((a, b) => b.id - a.id)[0];
        if (!latestLog.applied) status = "pending";
        else if (latestLog.is_edited) status = "edited";
        else status = "applied";
      }

      stats[dateKey].counts[status] = (stats[dateKey].counts[status] || 0) + 1;
      stats[dateKey].total++;
    });

    // 日付順にソート
    return Object.values(stats).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }, [posts, aiLogs]);

  const getPostStatus = (postId: number): FilterStatus => {
    const relatedLogs = aiLogs.filter((log) => log.post_id === postId);
    if (relatedLogs.length === 0) return "none";

    // 最新のログを取得（ID降順と仮定）
    const latestLog = relatedLogs.sort((a, b) => b.id - a.id)[0];

    if (!latestLog.applied) return "pending";
    if (latestLog.is_edited) return "edited";
    return "applied";
  };

  const getStatusBadge = (status: FilterStatus) => {
    if (status === "pending") {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 whitespace-nowrap text-[10px] h-5 px-1 ml-1"
        >
          未反映
        </Badge>
      );
    }
    if (status === "edited") {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap text-[10px] h-5 px-1 ml-1"
        >
          調整済
        </Badge>
      );
    }
    if (status === "applied") {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap text-[10px] h-5 px-1 ml-1"
        >
          反映済
        </Badge>
      );
    }
    return null;
  };

  const filteredPosts = posts.filter((post) => {
    if (filterStatus === "all") return true;
    return getPostStatus(post.id) === filterStatus;
  });

  const isAllFilteredSelected =
    filteredPosts.length > 0 &&
    filteredPosts.every((post) => selectedPostIds.has(post.id));

  const handleHeaderCheckboxChange = (checked: boolean) => {
    const ids = filteredPosts.map((p) => p.id);
    onBatchSelect(ids, checked);
  };

  return (
    <Card>
      {/* Step 1: 修正対象の指定 */}
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Step 1: 修正対象の指定
          </CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            週間レポート ({start.toLocaleDateString()} -{" "}
            {end.toLocaleDateString()})
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={rangeType} onValueChange={onRangeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="期間" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1w">1週間</SelectItem>
              <SelectItem value="2w">2週間</SelectItem>
              <SelectItem value="1m">1ヶ月</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onToday}>
              Today
            </Button>
            <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="icon" onClick={onPrevRange}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onNextRange}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            >
              <option value="all">全て表示</option>
              <option value="none">未実施</option>
              <option value="pending">未反映</option>
              <option value="edited">調整済</option>
              <option value="applied">反映済</option>
            </select>
          </div>

          {/* 送信開始ボタン */}
          <Button
            onClick={onPrepareForAI}
            disabled={selectedPostIds.size === 0}
          >
            選択した投稿をAIで修正 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* 日付別集計エリア */}
        {!loading && dailyStats.length > 0 && (
          <div className="flex overflow-x-auto p-4 gap-2 border-b bg-muted/5  ">
            {/* flex を grid に変更し、列数を指定 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2">
              {dailyStats.map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col min-w-[110px] border rounded-md bg-background shadow-sm shrink-0"
                >
                  <div className="px-2 py-1.5 text-xs font-bold text-center border-b bg-muted/20 flex justify-between items-center">
                    <span>{stat.date.toLocaleDateString()}</span>
                    <span className="text-muted-foreground font-normal bg-background px-1 rounded border">
                      {stat.total}
                    </span>
                  </div>
                  <div className="p-2 flex flex-col gap-1 justify-center flex-1">
                    {stat.counts.pending > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 h-5 w-full justify-center bg-red-50 text-red-700 border-red-200"
                      >
                        未反映: {stat.counts.pending}
                      </Badge>
                    )}
                    {stat.counts.edited > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 h-5 w-full justify-center bg-green-50 text-green-700 border-green-200"
                      >
                        調整済: {stat.counts.edited}
                      </Badge>
                    )}
                    {stat.counts.applied > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 h-5 w-full justify-center bg-blue-50 text-blue-700 border-blue-200"
                      >
                        反映済: {stat.counts.applied}
                      </Badge>
                    )}
                    {stat.counts.none > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 h-5 w-full justify-center text-muted-foreground border-muted"
                      >
                        未実施: {stat.counts.none}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        filteredPosts.length > 0 && isAllFilteredSelected
                      }
                      onCheckedChange={(c) => handleHeaderCheckboxChange(!!c)}
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
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => (
                    <TableRow
                      key={post.id}
                      data-state={selectedPostIds.has(post.id) && "selected"}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedPostIds.has(post.id)}
                          onCheckedChange={() => onSelectPost(post.id)}
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
                        <div className="flex items-center">
                          <span className="truncate">{post.title}</span>
                          {getStatusBadge(getPostStatus(post.id))}
                        </div>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
