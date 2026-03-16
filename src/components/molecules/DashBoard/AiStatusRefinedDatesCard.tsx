"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryDate } from "@/services/zstuposts_service";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface Props {
  summaryData: SummaryDate[];
}

export function AiStatusRefinedDatesCard({ summaryData }: Props) {
  if (!summaryData || summaryData.length === 0) return null;

  // AI処理済みの投稿がある日付をフィルタリング
  const refinedDates = summaryData
    .filter((item) => item.ai_refined > 0)
    .map((item) => {
      const dateObj = new Date(item.date);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      return {
        label: dateObj.toLocaleDateString("ja-JP"),
        linkDate: `${y}${m}${d}`,
        count: item.ai_refined,
        rawDate: item.date,
      };
    });

  if (refinedDates.length === 0) return null;

  return (
    <Card className="bg-primary/5 border-primary/20 transition-all hover:bg-primary/10">
      <CardContent className="p-4 flex flex-row items-center gap-4 flex-wrap sm:flex-nowrap">
        <div className="text-lg font-medium whitespace-nowrap">AI処理済み</div>
        <div className="flex flex-wrap gap-2 flex-1">
          {refinedDates.map((date) => (
            <Link
              key={String(date.rawDate)}
              href={`/zst/posts?date=${date.linkDate}`}
            >
              <Badge
                variant="outline"
                className="py-1.5 px-3 bg-background hover:bg-accent border-muted-foreground/30 text-foreground transition-all hover:scale-105"
              >
                {date.label}
                <span className="ml-2 bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                  {date.count}
                </span>
              </Badge>
            </Link>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground whitespace-nowrap">
          ※ クリックすると各日付の投稿一覧に移動します。
        </p>
      </CardContent>
    </Card>
  );
}
