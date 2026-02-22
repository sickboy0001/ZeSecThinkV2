"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Calendar } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  items: {
    label: string;
    dateMap: Record<string, number>;
  }[];
  range: {
    start: Date;
    end: Date;
  };
}

export function AnalyticsTagHeatmap({ items, range }: Props) {
  // Calculate the number of days in the range (inclusive)
  const days =
    Math.round(
      (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  // Create a start date in UTC to avoid timezone shifts
  const startUTC = new Date(
    Date.UTC(
      range.start.getFullYear(),
      range.start.getMonth(),
      range.start.getDate(),
    ),
  );

  return (
    <Card className="shadow-md border-muted/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4 text-green-500" />
          活動密度ヒートマップ
        </CardTitle>
        <CardDescription>過去{days}日間の日別投稿数</CardDescription>
      </CardHeader>
      <CardContent
        className={
          days === 7
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            : "grid grid-cols-1 gap-6"
        }
      >
        {items.map((item, index) => (
          <div key={index}>
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              {item.label}
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: days }).map((_, i) => {
                const d = new Date(startUTC);
                d.setUTCDate(d.getUTCDate() + i);
                const dateStr = d.toISOString().split("T")[0];
                const count = item.dateMap[dateStr] || 0;
                const isTag = item.label.startsWith("#");

                let colorClass = "bg-muted";
                if (count > 0) {
                  if (isTag) {
                    // タグは青ベース
                    if (count < 2) colorClass = "bg-blue-700/30";
                    else if (count < 5) colorClass = "bg-blue-500/60";
                    else colorClass = "bg-blue-400";
                  } else {
                    // 全体は緑ベース
                    if (count < 2) colorClass = "bg-green-700/30";
                    else if (count < 5) colorClass = "bg-green-500/60";
                    else colorClass = "bg-green-400";
                  }
                }

                return (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-[1px] ${colorClass}`}
                    title={`${dateStr}: ${count} posts`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
