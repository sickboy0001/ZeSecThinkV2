"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  getZstuPostsWithDate,
  ZstuPost,
  updateZstuPost,
} from "@/services/zstuposts_service";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  Search,
} from "lucide-react";
import { LogEditableCell } from "./LogEditableCell";

interface Props {
  userId: string;
}

export function LogsWeek({ userId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ZstuPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const range = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday
    return { start, end };
  }, [currentDate]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const formatDate = (d: Date) => d.toISOString().split("T")[0];
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

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [posts, searchQuery]);

  const handleUpdate = async (id: number, data: Partial<ZstuPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    try {
      await updateZstuPost(id, data);
      toast.success("更新しました");
    } catch (error) {
      toast.error("更新に失敗しました");
    }
  };

  const shiftDate = (amount: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + amount * 7);
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" onClick={() => shiftDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => shiftDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground ml-2">
            {range.start.toLocaleDateString()} -{" "}
            {range.end.toLocaleDateString()}
          </span>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>タグ</TableHead>
                  <TableHead>公開</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(post.current_at!).toLocaleDateString("ja-JP", {
                        weekday: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="min-w-[150px]">
                      <LogEditableCell
                        value={post.title}
                        onSave={(val: string) =>
                          handleUpdate(post.id, { title: val })
                        }
                      />
                    </TableCell>
                    <TableCell className="min-w-[300px]">
                      <LogEditableCell
                        value={post.content}
                        isTextarea
                        className="whitespace-pre-wrap"
                        onSave={(val: string) =>
                          handleUpdate(post.id, { content: val })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.tags?.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-secondary text-[10px] rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleUpdate(post.id, {
                            public_flg: !post.public_flg,
                          })
                        }
                      >
                        {post.public_flg ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
