import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Settings, PieChart, ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
                <p className="text-muted-foreground">今日の習慣化の状況を確認しましょう。</p>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20 transition-all hover:bg-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">今日の完了項目</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5 / 12</div>
                        <p className="text-xs text-muted-foreground mt-1">昨日より +2 増加</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20 transition-all hover:bg-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">現在の継続日数</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14 日</div>
                        <p className="text-xs text-muted-foreground mt-1">過去最高記録を更新中！</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20 transition-all hover:bg-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">達成率</CardTitle>
                        <PieChart className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">82%</div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                            <div className="bg-primary h-full w-[82%] rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        クイックアクセス
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Link href="/hadbit/logs">
                            <Button variant="outline" className="w-full h-24 flex flex-col gap-2 bg-card hover:border-primary hover:text-primary transition-all group">
                                <ClipboardList className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                <span>実績登録</span>
                            </Button>
                        </Link>
                        <Link href="/hadbit/items">
                            <Button variant="outline" className="w-full h-24 flex flex-col gap-2 bg-card hover:border-primary hover:text-primary transition-all group">
                                <Settings className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                <span>項目管理</span>
                            </Button>
                        </Link>
                        <Link href="/hadbit/analytics">
                            <Button variant="outline" className="w-full h-24 flex flex-col gap-2 bg-card hover:border-primary hover:text-primary transition-all group">
                                <PieChart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                <span>分析表示</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">最近の活動</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { item: "階段利用", time: "10分前" },
                                { item: "Schoo", time: "2時間前" },
                                { item: "スクワット", time: "5時間前" },
                            ].map((log, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{log.item}</span>
                                    <span className="text-muted-foreground">{log.time}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
