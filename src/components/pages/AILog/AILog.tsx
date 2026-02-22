"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Calender from "@/components/molecules/AILog/Calender";
import Batchs from "@/components/molecules/AILog/Batchs";

interface Props {
  userId: string;
}

export default function MemoCalendar({ userId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );

  const handleNextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Memo Calendar</h1>
        </div>
      </header>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 mb-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> カレンダー
          </TabsTrigger>
          <TabsTrigger value="batchs" className="flex items-center gap-2">
            <List className="h-4 w-4" /> バッチ
          </TabsTrigger>

          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" /> リスト
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Calender
            userId={userId}
            currentDate={currentDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={() => setCurrentDate(new Date())}
          />
        </TabsContent>
        <TabsContent value="batchs">
          {/* リスト表示が必要な場合はここに実装 */}
          <Card>
            <Batchs userId={userId} currentDate={currentDate} />
          </Card>
        </TabsContent>
        <TabsContent value="list">
          {/* リスト表示が必要な場合はここに実装 */}
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              日付ごとの詳細リスト表示エリア
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
