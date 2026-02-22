"use client";

import { useState } from "react";
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
import { Loader2, FileText, ArrowRight, Filter } from "lucide-react";
import { ZstuPost } from "@/services/zstuposts_service";
import { AiRefinementHistory } from "@/services/ai_log_service";

interface Props {
  posts: ZstuPost[];
  loading: boolean;
  selectedPostIds: Set<number>;
  onSelectPost: (postId: number) => void;
  onBatchSelect: (ids: number[], selected: boolean) => void;
  onPrepareForAI: () => void;
  aiLogs: AiRefinementHistory[];
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
}: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

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
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Step 1: 修正対象の指定
        </CardTitle>
        <div className="flex items-center gap-4">
          {/* フィルタリングUI */}
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
                    checked={filteredPosts.length > 0 && isAllFilteredSelected}
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
        )}
      </CardContent>
    </Card>
  );
}
