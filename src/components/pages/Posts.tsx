"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Loader2,
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getZstuPostsWithDate,
  ZstuPost,
  updateZstuPost,
  updateZstuPostUnprocessed,
} from "@/services/zstuposts_service";
import { toast } from "sonner";
import { PostsRegistDialog } from "@/components/molecules/PostsRegistDialog";
import { StepCounter } from "@/components/molecules/StepCounter";
import { PostCard } from "@/components/molecules/PostCard";

interface Props {
  userId: string;
}

export default function PostsDayView({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URLパラメータから日付を解析する関数
  const getDateFromParams = () => {
    const dateParam = searchParams.get("date");
    if (dateParam && /^\d{8}$/.test(dateParam)) {
      const year = parseInt(dateParam.substring(0, 4), 10);
      const month = parseInt(dateParam.substring(4, 6), 10) - 1;
      const day = parseInt(dateParam.substring(6, 8), 10);
      // タイムゾーン問題を回避するため、Date.UTCを使用してUTCの午前0時として日付オブジェクトを生成する
      // これにより、サーバーサイド（UTC）とクライアントサイド（JST）で日付の解釈がずれるのを防ぐ
      // new Date(year, month, day) は実行環境のタイムゾーンに依存するため、Vercel上では意図しない日付になる
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(getDateFromParams());
  const [posts, setPosts] = useState<ZstuPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ZstuPost | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // URLパラメータが変わったらcurrentDateを更新
  useEffect(() => {
    const newDate = getDateFromParams();
    // 日付が違う場合のみ更新（無限ループ防止）
    if (
      newDate.getFullYear() !== currentDate.getFullYear() ||
      newDate.getMonth() !== currentDate.getMonth() ||
      newDate.getDate() !== currentDate.getDate()
    ) {
      setCurrentDate(newDate);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // YYYY-MM-DD 形式に変換 (ローカル時間ベース)
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const data = await getZstuPostsWithDate(userId, dateStr, dateStr);

        setPosts(data || []);
      } catch (error) {
        console.error(error);
        toast.error("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [userId, currentDate, refreshKey]);

  // 日付を変更してURLを更新する関数
  const navigateToDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", dateStr);

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    navigateToDate(newDate);
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const w = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${y}/${m}/${d}(${w})`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col md:gap-4 gap-2">
      {/* --- 画像通りの日付ヘッダー --- */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-3">
          <h2
            className={`text-xl font-bold ${
              currentDate.getDay() === 0
                ? "text-red-600"
                : currentDate.getDay() === 6
                  ? "text-blue-600"
                  : "text-foreground"
            }`}
          >
            {formatDate(currentDate)}
          </h2>
          <span className="text-muted-foreground font-semibold text-base">
            <StepCounter count={posts.length} goal={10} />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 underline font-medium"
            onClick={() => router.push(pathname)}
          >
            today
          </Button>
          <div className="flex border rounded-md overflow-hidden h-8">
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-8 border-r rounded-none"
              onClick={() => handleDateChange(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-8 rounded-none"
              onClick={() => handleDateChange(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 font-bold"
            onClick={() => {
              setEditingPost(null);
              setIsCreateOpen(true);
            }}
          >
            <SquarePen className="h-4 w-4" /> add
          </Button>
        </div>
      </div>

      {/* --- 投稿リスト本体 --- */}
      <Card className="rounded-xl border shadow-sm bg-card overflow-hidden">
        <CardContent className="p-2 md:p-6 flex flex-col md:gap-6 gap-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {new Date().toDateString() === currentDate.toDateString() ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-semibold">
                    最初の投稿を作成しましょう
                  </span>
                  <span className="text-sm">
                    新しいアイデアや記録を残しましょう
                  </span>
                </div>
              ) : (
                "この日の投稿はありません"
              )}
            </div>
          ) : (
            <>
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLast={index === posts.length - 1}
                  onEdit={(p) => {
                    setEditingPost(p);
                    setIsCreateOpen(true);
                  }}
                  onDeleted={() => setRefreshKey((prev) => prev + 1)}
                  onPostUpdated={(updatedPost) => {
                    setPosts((prev) =>
                      prev.map((p) =>
                        p.id === updatedPost.id ? updatedPost : p,
                      ),
                    );
                  }}
                />
              ))}
            </>
          )}

          <Button
            variant="outline"
            className="w-full mt-2 py-6 border-dashed text-muted-foreground hover:text-primary"
            onClick={() => {
              setEditingPost(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="h-5 w-5 mr-1" /> add
          </Button>
        </CardContent>
      </Card>

      <PostsRegistDialog
        userId={userId}
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
        post={editingPost}
        currentDate={currentDate}
        postCount={posts.length}
      />
    </div>
  );
}
