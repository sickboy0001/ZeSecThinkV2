"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Calendar, Filter, TrendingUp } from "lucide-react";

export default function Analytics() {
    const [period, setPeriod] = useState("weekly");

    // Mock data for heatmap
    const days = Array.from({ length: 35 }, (_, i) => ({
        day: i + 1,
        level: Math.floor(Math.random() * 5), // 0 to 4
    }));

    // Mock data for bar chart
    const weeklyData = [
        { label: "Mon", value: 65 },
        { label: "Tue", value: 45 },
        { label: "Wed", value: 85 },
        { label: "Thu", value: 30 },
        { label: "Fri", value: 70 },
        { label: "Sat", value: 90 },
        { label: "Sun", value: 55 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">統計分析</h1>
                    <p className="text-muted-foreground mt-1">あなたの成長をデータで可視化します。</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[180px] bg-card/50">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="全カテゴリ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全カテゴリ</SelectItem>
                            <SelectItem value="1">運動</SelectItem>
                            <SelectItem value="2">学習</SelectItem>
                            <SelectItem value="3">余暇</SelectItem>
                        </SelectContent>
                    </Select>
                    <Tabs defaultValue={period} onValueChange={setPeriod}>
                        <TabsList className="bg-muted/50">
                            <TabsTrigger value="weekly">週</TabsTrigger>
                            <TabsTrigger value="monthly">月</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            アクティビティ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 justify-center py-4">
                            {days.map((d, i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-sm transition-all hover:scale-125 cursor-pointer ${d.level === 0 ? "bg-muted" :
                                        d.level === 1 ? "bg-primary/20" :
                                            d.level === 2 ? "bg-primary/40" :
                                                d.level === 3 ? "bg-primary/70" :
                                                    "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                        }`}
                                    title={`${d.level} 実績`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-4 text-[10px] text-muted-foreground">
                            <span>Less</span>
                            <div className="w-2 h-2 bg-muted rounded-sm" />
                            <div className="w-2 h-2 bg-primary/20 rounded-sm" />
                            <div className="w-2 h-2 bg-primary/40 rounded-sm" />
                            <div className="w-2 h-2 bg-primary/70 rounded-sm" />
                            <div className="w-2 h-2 bg-primary rounded-sm" />
                            <span>More</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            実施トレンド
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
                            {weeklyData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-primary/20 group-hover:bg-primary/40 transition-all rounded-t-md relative flex items-end"
                                        style={{ height: `${d.value}%` }}
                                    >
                                        <div
                                            className="absolute bottom-0 w-full bg-primary rounded-t-md shadow-lg transition-transform origin-bottom"
                                            style={{ height: `${d.value * 0.8}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground">{d.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        項目別ランキング
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { name: "階段利用", count: 42, color: "bg-primary" },
                            { name: "Schoo", count: 28, color: "bg-primary/70" },
                            { name: "スクワット", count: 15, color: "bg-primary/40" },
                            { name: "ランニング", count: 12, color: "bg-primary/20" },
                        ].map((item, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="font-mono text-muted-foreground">{item.count} times</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`${item.color} h-full rounded-full transition-all duration-1000 shadow-sm`}
                                        style={{ width: `${(item.count / 45) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
