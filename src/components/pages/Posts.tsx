"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Pencil,
  Copy,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Loader2,
  Check,
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  getZstuPostsWithDate,
  ZstuPost,
  deleteZstuPostPhysically,
  updateZstuPost,
} from "@/services/zstuposts_service";
import { toast } from "sonner";
import { PostsRegistDialog } from "@/components/molecules/PostsRegistDialog";
import { AutoResizeTextarea } from "@/components/atoms/AutoResizeTextarea";

interface Props {
  userId: string;
}

const EditableField = ({
  value,
  onChange,
  onSave,
  isTextarea = false,
  viewClassName,
  inputClassName,
  placeholder = "No content",
  ...props
}: {
  value: string;
  onChange: (val: string) => void;
  onSave: (val: string) => void;
  isTextarea?: boolean;
  viewClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  [key: string]: any;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    onSave(value);
  };

  if (isEditing) {
    if (isTextarea) {
      return (
        <AutoResizeTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={inputClassName}
          autoFocus
          {...props}
        />
      );
    }
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleBlur();
          }
        }}
        className={inputClassName}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer min-h-6 ${viewClassName || ""}`}
    >
      {value || (
        <span className="text-muted-foreground opacity-50">{placeholder}</span>
      )}
    </div>
  );
};

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

  const handlePhysicalDelete = async (id: number) => {
    if (!confirm("本当に完全に削除しますか？この操作は取り消せません。"))
      return;

    try {
      await deleteZstuPostPhysically(id);
      toast.success("完全に削除しました");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      toast.error("削除に失敗しました");
    }
  };

  const handlePublicChange = async (id: number, checked: boolean) => {
    try {
      await updateZstuPost(id, { public_flg: checked });
      toast.success(`公開設定を${checked ? "オン" : "オフ"}にしました`);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, public_flg: checked } : p)),
      );
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  const handleDeleteChange = async (id: number, checked: boolean) => {
    try {
      await updateZstuPost(id, { delete_flg: checked });
      toast.success(`削除フラグを${checked ? "オン" : "オフ"}にしました`);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, delete_flg: checked } : p)),
      );
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  const handleTitleChange = (id: number, newTitle: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: newTitle } : p)),
    );
  };

  const handleTitleSave = async (id: number, newTitle: string) => {
    try {
      await updateZstuPost(id, { title: newTitle });
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  const handleContentChange = (id: number, newContent: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content: newContent } : p)),
    );
  };

  const handleContentSave = async (id: number, newContent: string) => {
    try {
      await updateZstuPost(id, { content: newContent });
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  const handleCopy = async (post: ZstuPost) => {
    try {
      await navigator.clipboard.writeText(`${post.title}\n\n${post.content}`);
      toast.success("クリップボードにコピーしました");
    } catch (error) {
      console.error(error);
      toast.error("コピーに失敗しました");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-4">
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
            [{posts.length}]
          </span>
        </div>

        <div className="flex items-center gap-1">
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
        <CardContent className="p-4 md:p-6 flex flex-col gap-6">
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
                <div key={post.id} className="flex flex-col gap-1">
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                    {/* タイトル */}
                    <div className="flex items-center gap-1 min-w-50">
                      <Lock className="h-4 w-4 text-red-800 shrink-0" />
                      <EditableField
                        value={post.title}
                        onChange={(val) => handleTitleChange(post.id, val)}
                        onSave={(val) => handleTitleSave(post.id, val)}
                        viewClassName="text-lg font-bold hover:underline decoration-dashed underline-offset-4"
                        inputClassName="text-lg! font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto py-0 bg-transparent focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-colors"
                        placeholder="タイトルなし"
                        onKeyDown={(
                          e: React.KeyboardEvent<HTMLInputElement>,
                        ) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                      {/* 編集ボタン */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 border-slate-200"
                        onClick={() => {
                          setEditingPost(post);
                          setIsCreateOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* コピー */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 border-slate-200"
                        onClick={() => handleCopy(post)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* コンテンツ */}

                  <EditableField
                    isTextarea
                    value={post.content}
                    onChange={(val) => handleContentChange(post.id, val)}
                    onSave={(val) => handleContentSave(post.id, val)}
                    viewClassName="text-lg leading-relaxed whitespace-pre-wrap font-normal hover:bg-slate-50/50 rounded p-1 -ml-1 transition-colors"
                    inputClassName="text-lg leading-relaxed font-normal min-h-[120px] resize-none border-none shadow-none focus-visible:ring-0 px-0 py-0 bg-transparent"
                    placeholder="内容なし"
                  />

                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-muted-foreground">
                      [{post.second}sec] [wr...
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`pub-${post.id}`}
                          checked={post.public_flg}
                          onCheckedChange={(c) =>
                            handlePublicChange(post.id, c)
                          }
                        />
                        {/* 公開スイッチ */}
                        <label htmlFor={`pub-${post.id}`} className="text-sm">
                          public
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`del-${post.id}`}
                          checked={post.delete_flg}
                          onCheckedChange={(c) =>
                            handleDeleteChange(post.id, c)
                          }
                        />
                        {/* 削除スイッチ */}

                        <label htmlFor={`del-${post.id}`} className="text-sm">
                          delete
                        </label>
                      </div>
                      {/* 物理削除ボタン */}
                      <Button
                        variant="outline"
                        className="h-8 w-8 sm:w-auto text-xs ml-auto border-slate-200 sm:px-3 sm:gap-1"
                        onClick={() => handlePhysicalDelete(post.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                          Physical deletion
                        </span>
                      </Button>
                    </div>
                  </div>

                  {index !== posts.length - 1 && (
                    <Separator className="mt-4 bg-slate-300" />
                  )}
                </div>
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
