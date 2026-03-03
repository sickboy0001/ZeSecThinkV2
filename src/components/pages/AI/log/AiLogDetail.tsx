"use client";

import {
  getAiLogDetail,
  AiLogDetail as AiLogDetailData,
} from "@/services/ai_log_service";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  userId: string;
  batchId: string;
}

export default function AiLogDetail({ userId, batchId }: Props) {
  const [detailData, setDetailData] = useState<AiLogDetailData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO setDetailDataとData[]がややこしいので整理必要かと　AiLogDetailData[]　でなく AiLogDetail[]のほうがいい？
        const data = await getAiLogDetail(batchId);
        if (!data) {
          throw new Error("ログが見つかりません。");
        }
        setDetailData(data);
      } catch (error: any) {
        console.error(error);
        const errorMessage = error.message || "AIログ詳細の取得に失敗しました";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [batchId]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!detailData || detailData.length === 0) {
      return (
        <div className="text-center py-24 text-muted-foreground">
          データがありません。
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>詳細ログ ({detailData.length}件)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">ID</TableHead>
                    <TableHead className="w-[80px]">PostID</TableHead>
                    <TableHead>変更概要</TableHead>
                    <TableHead>変更前</TableHead>
                    <TableHead>変更後</TableHead>
                    <TableHead>確定時</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailData.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.id}</TableCell>
                      <TableCell>{log.post_id}</TableCell>
                      <TableCell
                        className="max-w-xs truncate"
                        title={log.changes_summary || ""}
                      >
                        {log.changes_summary}
                      </TableCell>
                      <TableCell
                        className="max-w-xs truncate"
                        title={log.before_title || ""}
                      >
                        <p>{log.before_title}</p>
                        <p>{log.before_text}</p>
                        <p>{log.before_tags}</p>
                      </TableCell>
                      <TableCell
                        className="max-w-xs truncate"
                        title={log.after_title || ""}
                      >
                        <p>{log.after_title}</p>
                        <p>{log.after_text}</p>
                        <p>{log.after_tags}</p>
                      </TableCell>
                      <TableCell
                        className="max-w-xs truncate"
                        title={log.fixed_title || ""}
                      >
                        <p>{log.fixed_title}</p>
                        <p>{log.fixed_text}</p>
                        <p>{log.fixed_tags}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI実行ログ詳細</h1>
          <p className="text-muted-foreground mt-1">
            AI機能の実行履歴詳細を確認します。
          </p>
        </div>
      </header>
      <main>{renderContent()}</main>
    </div>
  );
}
