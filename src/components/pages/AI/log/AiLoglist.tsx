"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AiLogList, getAiLogList } from "@/services/ai_log_service";
import { formatDateToJst } from "@/lib/date_util";

interface Props {
  userId: string;
}

export default function AiLoglist({ userId }: Props) {
  const [aiLogList, setAiLogList] = useState<AiLogList[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const data = await getAiLogList(userId);
        setAiLogList((data as unknown as AiLogList[]) || []);
      } catch (error) {
        console.error(error);
        toast.error("AIログの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, [userId]);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">完了</Badge>;
      case "processing":
        return <Badge variant="secondary">処理中</Badge>;
      case "error":
        return <Badge variant="destructive">エラー</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI実行ログ</h1>
          <p className="text-muted-foreground mt-1">
            AI機能の実行履歴を確認します。
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>実行日時</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>進捗</TableHead>
                <TableHead>メモ数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : aiLogList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    ログはありません。
                  </TableCell>
                </TableRow>
              ) : (
                aiLogList.map((log) => (
                  <TableRow
                    key={log.id}
                    onClick={() =>
                      router.push(`/AI/log/detail?batchid=${log.id}`)
                    }
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>{formatDateToJst(log.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      {log.completed_chunks} / {log.total_chunks}
                    </TableCell>
                    <TableCell>{log.total_memos}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
