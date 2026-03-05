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
                    <TableCell>
                      {/* 実行日時type1 */}
                      {/* {new Date(log.created_at).toLocaleString("ja-JP", {
                        timeZone: "Asia/Tokyo",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} */}

                      {/* 実行日時type2 */}
                      {/* {(() => {
                        let date = new Date(log.created_at);
                        // ローカル開発環境で、DBからのUTC日時文字列がタイムゾーンなしで解釈され、
                        // 9時間ずれる問題への対応。本番環境では 'Z' 付きのISO文字列が返される想定。
                        if (process.env.NODE_ENV === "development") {
                          // 誤って解釈された時差9時間分を補正して、正しいUTC時刻に戻す
                          date = new Date(date.getTime() + 9 * 60 * 60 * 1000);
                        }
                        return date.toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                        });
                      })()} */}
                      {/* 実行日時type3 */}
                      {(() => {
                        let dateStr = log.created_at;

                        // 1. 文字列がタイムゾーン情報を持っていない（Zや+が含まれていない）場合、
                        //    ブラウザがローカル時刻と勘違いしないよう 'Z' を付与してUTCとして認識させる
                        if (
                          dateStr &&
                          !dateStr.includes("Z") &&
                          !dateStr.includes("+")
                        ) {
                          // SQLiteの標準的なフォーマット "YYYY-MM-DD HH:mm:ss" を想定
                          // スペースを T に置き換えて ISO形式に整えるとより安全です
                          dateStr = dateStr.replace(" ", "T") + "Z";
                        }

                        const date = new Date(dateStr);

                        // 2. 日本時間 (Asia/Tokyo) に固定して表示
                        return date.toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      })()}
                    </TableCell>
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
