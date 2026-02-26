"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, LayoutGrid } from "lucide-react";
import { LogsWeek } from "@/components/molecules/logs/LogsWeek";
import { LogsMonth } from "@/components/molecules/logs/LogsMonth";

interface Props {
  userId: string;
}

export default function Logs({ userId }: Props) {
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 overflow-x-auto">
      <header className="flex items-center justify-between overflow-x-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground mt-1">
            日々の記録を確認・編集します。
          </p>
        </div>
      </header>

      <Tabs
        value={viewMode}
        onValueChange={(v: any) => setViewMode(v)}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4 overflow-x-auto">
          <TabsList>
            <TabsTrigger value="weekly" className="gap-2">
              <Calendar className="h-4 w-4" /> 週間
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <LayoutGrid className="h-4 w-4" /> 月間
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="weekly">
          <div className="overflow-x-auto">
            <LogsWeek userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <LogsMonth userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
