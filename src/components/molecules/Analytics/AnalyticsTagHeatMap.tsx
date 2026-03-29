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
    <TooltipProvider>
      <Card className="shadow-md border-muted/40 w-full overflow-hidden">
        {" "}
        {/* overflow-hidden を追加 */}
        <CardHeader className="pb-3 px-4 sm:px-6">
          {" "}
          {/* パディングをスマホで少し詰める */}
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            活動密度ヒートマップ
          </CardTitle>
          <CardDescription>過去{days}日間の日別投稿数</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {/* スマホでは縦に並べて横スクロール、PC では横に並べる */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-6">
            {items.map((item, index) => (
              <div key={index} className="w-full sm:flex-shrink-0 mb-4 sm:mb-0">
                <div className="mb-2 text-sm font-medium text-muted-foreground truncate">
                  {item.label}
                </div>
                {/* スマホでは横スクロール可能に、PC では固定幅 */}
                <div
                  className="overflow-x-auto sm:overflow-visible"
                  style={{
                    maxWidth: "100%",
                  }}
                >
                  <div
                    className="grid"
                    style={{
                      gridTemplateRows: "repeat(7, minmax(0, 1fr))",
                      gridTemplateColumns: `repeat(${Math.ceil(days / 7)}, auto)`,
                      gap: "0.2rem",
                      justifyContent: "start",
                    }}
                  >
                    {Array.from({ length: days }).map((_, i) => {
                      const d = new Date(startUTC);
                      d.setUTCDate(d.getUTCDate() + i);
                      const dateStr = d.toISOString().split("T")[0];
                      const count = item.dateMap[dateStr] || 0;
                      const isTag = item.label.startsWith("#");

                      // 曜日の取得（Mon, Tue, Wed, Thu, Fri, Sat, Sun）
                      const weekdays = [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ];
                      const weekday = weekdays[d.getUTCDay()];

                      let colorClass = "bg-muted";
                      if (count > 0) {
                        if (isTag) {
                          if (count < 2) colorClass = "bg-blue-700/30";
                          else if (count < 5) colorClass = "bg-blue-500/60";
                          else colorClass = "bg-blue-400";
                        } else {
                          if (count < 2) colorClass = "bg-green-700/30";
                          else if (count < 5) colorClass = "bg-green-500/60";
                          else colorClass = "bg-green-400";
                        }
                      }

                      // 縦に 7 行で配置：行 = (i % 7) + 1, 列 = Math.floor(i / 7) + 1
                      const row = (i % 7) + 1;
                      const col = Math.floor(i / 7) + 1;

                      return (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div
                              className={`rounded-[1px] shrink-0 ${colorClass}`}
                              style={{
                                gridRow: row,
                                gridColumn: col,
                                width: "0.8rem",
                                height: "0.8rem",
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{`${dateStr} (${weekday}): ${count} posts`}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
