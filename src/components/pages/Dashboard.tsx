"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Settings,
  PieChart,
  Clock,
  FileText,
  Type,
} from "lucide-react";
import Link from "next/link";
import { SummaryDate, getZstuPostsSummary } from "@/services/zstuposts_service";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarkdownRenderer } from "@/components/atoms/MarkdownRenderer";
import { guides_content } from "@/constants/page_constants";
import { RecentActivityTable } from "@/components/molecules/RecentActivityTable";

interface Props {
  userId: string;
}

export default function Dashboard({ userId }: Props) {
  const [summaryData, setSummaryData] = useState<SummaryDate[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getZstuPostsSummary(userId);
      if (data) setSummaryData(data);
    };
    fetchData();
  }, [userId]);

  // JSTでの日付文字列を取得する関数 (YYYY-MM-DD)
  const getJstDateStr = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Tokyo",
    })
      .format(date)
      .replace(/\//g, "-");
  };

  const today = new Date();
  const todayStr = getJstDateStr(today);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getJstDateStr(yesterday);

  const dayBeforeYesterday = new Date();
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  const dayBeforeYesterdayStr = getJstDateStr(dayBeforeYesterday);

  const findData = (targetDateStr: string) => {
    return (
      summaryData.find((d) => {
        const dataDate = new Date(d.date);
        return getJstDateStr(dataDate) === targetDateStr;
      }) || { post_count: 0, total_seconds: 0, total_chars: 0 }
    );
  };
  const todayData = findData(todayStr);
  const yesterdayData = findData(yesterdayStr);
  const dayBeforeYesterdayData = findData(dayBeforeYesterdayStr);

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          今日の習慣化の状況を確認しましょう。
        </p>
      </header>
      <Accordion
        type="single"
        collapsible
        className="w-full bg-background p-2 sm:p-4 rounded-xl shadow-lg border"
      >
        <AccordionItem value="guide-content">
          <AccordionTrigger className="hover:no-underline">
            <div className="border-l-4 border-primary pl-4 py-1 text-left">
              <span className="text-xl font-bold">スタートガイドを開く</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <MarkdownRenderer>{guides_content}</MarkdownRenderer>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/zst/posts">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2 bg-card hover:border-primary hover:text-primary transition-all group"
            >
              <ClipboardList className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span>Posts</span>
            </Button>
          </Link>
          <Link href="/zst/logs">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2 bg-card hover:border-primary hover:text-primary transition-all group"
            >
              <Settings className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span>Logs</span>
            </Button>
          </Link>
          <Link href="/zst/analytics">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2 bg-card hover:border-primary hover:text-primary transition-all group"
            >
              <PieChart className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span>分析表示</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* <div>{JSON.stringify(summaryData)}</div> */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20 transition-all hover:bg-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">今日の投稿数</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayData.post_count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              昨日: {yesterdayData.post_count}
            </p>
            <p className="text-xs text-muted-foreground">
              一昨日: {dayBeforeYesterdayData.post_count}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 transition-all hover:bg-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              今日の思考時間
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(todayData.total_seconds)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              昨日: {formatTime(yesterdayData.total_seconds)}
            </p>
            <p className="text-xs text-muted-foreground">
              一昨日: {formatTime(dayBeforeYesterdayData.total_seconds)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 transition-all hover:bg-primary/10">
          <CardContent>
            <div className="text-lg font-medium"> 今日の文字数</div>

            <div className="text-2xl font-bold">
              {todayData.total_chars.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              昨日: {yesterdayData.total_chars.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              一昨日: {dayBeforeYesterdayData.total_chars.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
      {/* 最近の活動 */}
      <RecentActivityTable summaryData={summaryData} />
    </div>
  );
}
