"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getZstuPostsWithDate,
  ZstuPost,
  updateZstuPost,
} from "@/services/zstuposts_service";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { LogEditableCell } from "./LogEditableCell";

interface Props {
  userId: string;
}

export function LogsMonth({ userId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ZstuPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const range = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0); // Last day of month
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

  const postsByDate = useMemo(() => {
    const map: Record<string, ZstuPost[]> = {};
    filteredPosts.forEach((p) => {
      if (!p.current_at) return;
      const key = new Date(p.current_at).toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [filteredPosts]);

  const daysInMonth = useMemo(() => {
    const days = [];
    const date = new Date(range.start);
    while (date <= range.end) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [range]);

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
    newDate.setMonth(newDate.getMonth() + amount);
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
            {range.start.getFullYear()}年{range.start.getMonth() + 1}月
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {daysInMonth.map((day) => {
            const key = day.toISOString().split("T")[0];
            const dayMemos = postsByDate[key] || [];
            const dayOfWeek = day.getDay();
            const dateColorClass =
              dayOfWeek === 0
                ? "text-red-600"
                : dayOfWeek === 6
                  ? "text-blue-600"
                  : "";

            if (searchQuery && dayMemos.length === 0) return null;

            return (
              <Card
                key={key}
                className={`min-h-[200px] flex flex-col ${
                  dayMemos.length === 0 ? "opacity-40" : ""
                }`}
              >
                <CardHeader className="p-3 border-b bg-muted/30">
                  <CardTitle
                    className={`text-sm font-bold flex justify-between ${dateColorClass}`}
                  >
                    <span>
                      {day.getDate()}日 （
                      {day.toLocaleDateString("ja-JP", {
                        weekday: "short",
                      })}
                      ）
                    </span>
                    <span className="text-xs font-normal text-muted-foreground"></span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 flex-1 overflow-y-auto space-y-3">
                  {dayMemos.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic">
                      記録なし
                    </p>
                  ) : (
                    dayMemos.map((memo) => (
                      <div
                        key={memo.id}
                        className="group border-l-2 border-primary/30 pl-2 py-1 space-y-1"
                      >
                        <LogEditableCell
                          value={memo.title}
                          className="text-sm font-bold leading-tight"
                          onSave={(val: string) =>
                            handleUpdate(memo.id, { title: val })
                          }
                        />
                        <div className="flex flex-wrap gap-1">
                          {memo.tags?.map((tag, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-xs rounded cursor-pointer hover:bg-secondary/80 transition-colors"
                              onClick={() => setSearchQuery(tag)}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <LogEditableCell
                          value={memo.content}
                          isTextarea
                          className="text-sm  line-clamp-3 whitespace-pre-wrap"
                          onSave={(val: string) =>
                            handleUpdate(memo.id, { content: val })
                          }
                        />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
