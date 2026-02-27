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

export function RecentActivityTable({ summaryData }: Props) {
  // 各指標の最大値を計算（0除算回避のため最小値を1に設定）
  const maxPostCount = Math.max(...summaryData.map((d) => d.post_count), 1);
  const maxSeconds = Math.max(...summaryData.map((d) => d.total_seconds), 1);
  const maxChars = Math.max(...summaryData.map((d) => d.total_chars), 1);
  const maxAvgChars = Math.max(
    ...summaryData.map((d) =>
      d.post_count > 0 ? d.total_chars / d.post_count : 0,
    ),
    1,
  );
  const maxAvgSeconds = Math.max(
    ...summaryData.map((d) =>
      d.post_count > 0 ? d.total_seconds / d.post_count : 0,
    ),
    1,
  );

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  // データバーを表示する内部コンポーネント
  const DataBar = ({
    value,
    max,
    label,
    color,
  }: {
    value: number;
    max: number;
    label: string;
    color: string;
  }) => (
    <div className="relative w-full h-8 flex items-center">
      <div
        className={`absolute top-1 bottom-1 left-0 rounded ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
      <span className="relative z-10 px-2 text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">過去7日間の活動</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">日付</TableHead>
              <TableHead className="w-[16%]">投稿数</TableHead>
              <TableHead className="w-[16%]">思考時間</TableHead>
              <TableHead className="w-[16%]">文字数</TableHead>
              <TableHead className="w-[16%]">平均時間</TableHead>
              <TableHead className="w-[16%]">平均文字数</TableHead>
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
              const avgChars =
                item.post_count > 0 ? item.total_chars / item.post_count : 0;
              const avgSeconds =
                item.post_count > 0 ? item.total_seconds / item.post_count : 0;

              return (
                <TableRow key={item.date}>
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
                  <TableCell>
                    <StepCounter count={item.post_count} />
                  </TableCell>
                  <TableCell>
                    <DataBar
                      value={item.total_seconds}
                      max={maxSeconds}
                      label={formatTime(item.total_seconds)}
                      color="bg-green-100 dark:bg-green-900/50"
                    />
                  </TableCell>
                  <TableCell>
                    <DataBar
                      value={item.total_chars}
                      max={maxChars}
                      label={item.total_chars.toLocaleString()}
                      color="bg-orange-100 dark:bg-orange-900/50"
                    />
                  </TableCell>
                  <TableCell>
                    <DataBar
                      value={avgSeconds}
                      max={maxAvgSeconds}
                      label={formatTime(Math.round(avgSeconds))}
                      color="bg-cyan-100 dark:bg-cyan-900/50"
                    />
                  </TableCell>
                  <TableCell>
                    <DataBar
                      value={avgChars}
                      max={maxAvgChars}
                      label={avgChars.toFixed(1)}
                      color="bg-purple-100 dark:bg-purple-900/50"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
