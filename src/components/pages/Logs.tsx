"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MOCK_CATEGORIES,
    MOCK_ITEMS,
    MOCK_TREES,
    MOCK_LOGS,
    HabitLog,
    HabitItem
} from "@/lib/mock-data";
import { toast } from "sonner";
import { Activity, History, Clock, Trash2, Pencil } from "lucide-react";

export default function Logs() {
    const [selectedCategory, setSelectedCategory] = useState<string>(MOCK_CATEGORIES[0].id.toString());
    const [logs, setLogs] = useState<HabitLog[]>(MOCK_LOGS);

    // Get items for selected category sorted by order_no
    const getCategoryItems = (catId: number) => {
        const itemIds = MOCK_TREES
            .filter(t => t.parent_id === catId)
            .sort((a, b) => a.order_no - b.order_no)
            .map(t => t.item_id);

        return MOCK_ITEMS.filter(item => itemIds.includes(item.id));
    };

    const currentItems = getCategoryItems(parseInt(selectedCategory));

    const addLog = (item: HabitItem) => {
        const newLog: HabitLog = {
            id: Date.now(),
            item_id: item.id,
            done_at: new Date().toISOString(),
        };
        setLogs([newLog, ...logs]);
        toast.success(`${item.name} を記録しました！`, {
            description: new Date().toLocaleTimeString(),
            action: {
                label: "取り消し",
                onClick: () => deleteLog(newLog.id),
            },
        });
    };

    const deleteLog = (id: number) => {
        setLogs(logs.filter(l => l.id !== id));
        toast.info("記録を削除しました。");
    };

    const getItemName = (id: number) => MOCK_ITEMS.find(i => i.id === id)?.name || "不明な項目";

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">実績登録</h1>
                <p className="text-muted-foreground italic mt-1">
                    今日も一歩ずつ。習慣を積み重ねましょう。
                </p>
            </header>

            <div className="space-y-4">
                <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="bg-muted/50 p-1 gap-1">
                        {MOCK_CATEGORIES.map((cat) => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id.toString()}
                                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                            >
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {currentItems.map((item) => (
                        <Button
                            key={item.id}
                            onClick={() => addLog(item)}
                            variant="outline"
                            className="h-28 flex flex-col gap-2 bg-card hover:border-primary hover:text-primary active:scale-95 transition-all shadow-sm hover:shadow-md border-muted group"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Activity className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-bold truncate w-full px-2">{item.name}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <Card className="border-none bg-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        本日の履歴
                    </CardTitle>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full uppercase tracking-wider font-bold">Today</span>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                            まだ今日の記録はありません。
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-muted overflow-hidden group animate-in fade-in slide-in-from-left-4 duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-8 bg-primary rounded-full" />
                                        <div>
                                            <div className="font-bold text-lg">{getItemName(log.item_id)}</div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                <Clock className="h-3 w-3" />
                                                {new Date(log.done_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteLog(log.id)}
                                            className="h-8 w-8 hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
