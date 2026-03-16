"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SummaryDate } from "@/services/zstuposts_service";
import Link from "next/link";
import { StepCounter } from "@/components/molecules/StepCounter";

interface Props {
  summaryData: SummaryDate[];
}

export function AiStatusSummaryTable({ summaryData }: Props) {
  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          AI処理状況 (過去7日間)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* PC表示: テーブル */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-30">日付</TableHead>
                <TableHead className="text-center">AI未処理</TableHead>
                <TableHead className="text-center">AI処理中</TableHead>
                <TableHead className="text-center">AI処理済</TableHead>
                <TableHead className="text-center">完了</TableHead>
                <TableHead className="text-center">AI再待機</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryData.map((item) => {
                const dateObj = new Date(item.date);
                const day = dateObj.getDay();
                const y = dateObj.getFullYear();
                const m = String(dateObj.getMonth() + 1).padStart(2, "0");
                const d = String(dateObj.getDate()).padStart(2, "0");
                const linkDate = `${y}${m}${d}`;

                return (
                  <TableRow
                    key={String(item.date)}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell
                      className={
                        day === 0
                          ? "text-red-600"
                          : day === 6
                            ? "text-blue-600"
                            : ""
                      }
                    >
                      <Link
                        href={`/zst/posts?date=${linkDate}`}
                        className="hover:underline underline-offset-4"
                      >
                        {dateObj.toLocaleDateString("ja-JP")}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.ai_unprocessed}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.ai_processing}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.ai_refined}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.ai_completed}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.ai_pending_requeue}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* スマホ表示: カードリスト */}
        <div className="md:hidden space-y-4">
          {summaryData.map((item) => {
            const dateObj = new Date(item.date);
            const day = dateObj.getDay();
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, "0");
            const d = String(dateObj.getDate()).padStart(2, "0");
            const linkDate = `${y}${m}${d}`;

            return (
              <div
                key={String(item.date)}
                className="flex flex-col gap-3 p-4 border rounded-lg bg-card shadow-sm"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <Link
                    href={`/zst/posts?date=${linkDate}`}
                    className={`font-bold hover:underline underline-offset-4 ${
                      day === 0
                        ? "text-red-600"
                        : day === 6
                          ? "text-blue-600"
                          : ""
                    }`}
                  >
                    {dateObj.toLocaleDateString("ja-JP")}
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-x-2 gap-y-3">
                  <div className="flex flex-col items-center p-2 bg-muted/30 rounded">
                    <span className="text-[10px] text-muted-foreground mb-1">
                      未処理
                    </span>
                    <span className="text-sm font-semibold">
                      {item.ai_unprocessed}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/30 rounded">
                    <span className="text-[10px] text-muted-foreground mb-1">
                      処理中
                    </span>
                    <span className="text-sm font-semibold">
                      {item.ai_processing}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/30 rounded">
                    <span className="text-[10px] text-muted-foreground mb-1">
                      AI済
                    </span>
                    <span className="text-sm font-semibold">
                      {item.ai_refined}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/30 rounded">
                    <span className="text-[10px] text-muted-foreground mb-1">
                      完了
                    </span>
                    <span className="text-sm font-semibold">
                      {item.ai_completed}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/30 rounded">
                    <span className="text-[10px] text-muted-foreground mb-1">
                      再待機
                    </span>
                    <span className="text-sm font-semibold">
                      {item.ai_pending_requeue}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
