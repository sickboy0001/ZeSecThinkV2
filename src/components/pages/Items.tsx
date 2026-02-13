"use client";

import { useState } from "react";
import {
    MOCK_CATEGORIES,
    MOCK_ITEMS,
    MOCK_TREES,
} from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    ChevronRight,
    GripVertical,
    Plus,
    Pencil,
    Trash2,
    Eye,
    FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Items() {
    const [expandedCategories, setExpandedCategories] = useState<number[]>(MOCK_CATEGORIES.map(c => c.id));

    const toggleCategory = (id: number) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const getSubItems = (parentId: number) => {
        const itemIds = MOCK_TREES
            .filter(t => t.parent_id === parentId)
            .sort((a, b) => a.order_no - b.order_no)
            .map(t => t.item_id);

        return MOCK_ITEMS.filter(item => itemIds.includes(item.id));
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">項目管理</h1>
                    <p className="text-muted-foreground mt-1">カテゴリと習慣の階層構造を編集します。</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    新規カテゴリ
                </Button>
            </header>

            <div className="space-y-4">
                {MOCK_CATEGORIES.map((category) => {
                    const isExpanded = expandedCategories.includes(category.id);
                    const subItems = getSubItems(category.id);

                    return (
                        <Card key={category.id} className="overflow-hidden border-none shadow-md bg-card/40 backdrop-blur-sm">
                            <div
                                className={cn(
                                    "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors group",
                                    isExpanded && "border-b border-muted/50"
                                )}
                                onClick={() => toggleCategory(category.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1">
                                        <GripVertical className="h-5 w-5" />
                                    </div>
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <FolderOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-lg">{category.name}</span>
                                        <span className="ml-3 text-xs text-muted-foreground font-mono">
                                            ID: {category.id}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                                </div>
                            </div>

                            {isExpanded && (
                                <CardContent className="p-0 bg-muted/10">
                                    <div className="divide-y divide-muted/30">
                                        {subItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 pl-12 hover:bg-muted/50 group transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-muted-foreground/50 hover:text-foreground cursor-grab p-1">
                                                        <GripVertical className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{item.name}</div>
                                                        {item.short_name && (
                                                            <div className="text-xs text-muted-foreground">表示名: {item.short_name}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {subItems.length === 0 && (
                                            <div className="p-8 text-center text-sm text-muted-foreground italic">
                                                項目が登録されていません。
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
