"use client";

import { useState, useEffect } from "react";
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
import { getZstuPostsWithDate, ZstuPost } from "@/services/zstuposts_service";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";

interface Props {
  userId: string;
}

export default function Logs({ userId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ZstuPost[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate start (Sunday) and end (Saturday) of the week
  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay(); // 0 is Sunday
    start.setDate(start.getDate() - day); // Go back to Sunday

    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Go to Saturday

    return { start, end };
  };

  const { start, end } = getWeekRange(currentDate);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const formatDate = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${dd}`;
        };

        const sStr = formatDate(start);
        const eStr = formatDate(end);

        const data = await getZstuPostsWithDate(userId, sStr, eStr);
        setPosts(data || []);
      } catch (error) {
        console.error(error);
        toast.error("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [userId, start.toISOString(), end.toISOString()]);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground mt-1">
            週間レポート ({start.toLocaleDateString()} -{" "}
            {end.toLocaleDateString()})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>current_at</TableHead>
                  <TableHead>title</TableHead>
                  <TableHead>content</TableHead>
                  <TableHead>tags</TableHead>
                  <TableHead>second</TableHead>
                  <TableHead>public_flg</TableHead>
                  <TableHead>delete_flg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="whitespace-nowrap">
                        {post.current_at
                          ? new Date(post.current_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell
                        className="font-medium max-w-37.5 truncate"
                        title={post.title}
                      >
                        {post.title}
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap">
                        {post.content}
                      </TableCell>
                      <TableCell>{post.tags?.join(", ")}</TableCell>
                      <TableCell>{post.second}</TableCell>
                      <TableCell>
                        {post.public_flg ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {post.delete_flg ? (
                          <Check className="h-4 w-4 text-red-500" />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
