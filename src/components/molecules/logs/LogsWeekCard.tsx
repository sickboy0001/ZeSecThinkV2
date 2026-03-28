"use client";

import { ZstuPost } from "@/services/zstuposts_service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { LogEditableCell } from "./LogEditableCell";

interface LogsWeekCardProps {
  post: ZstuPost;
  handleUpdate: (id: number, data: any) => Promise<void>;
}

export function LogsWeekCard({ post, handleUpdate }: LogsWeekCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="py-1 px-2 space-y-0.5">
        <div className="flex justify-between items-center">
          <div className="text-[10px] font-medium text-muted-foreground">
            {new Date(post.current_at!).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              weekday: "short",
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() =>
              handleUpdate(post.id, {
                public_flg: !post.public_flg,
              })
            }
          >
            {post.public_flg ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>

        <LogEditableCell
          value={post.title}
          className="text-sm font-bold leading-tight"
          onSave={(val: string) => handleUpdate(post.id, { title: val })}
        />

        <LogEditableCell
          value={post.content}
          isTextarea
          className="text-xs text-muted-foreground whitespace-pre-wrap"
          onSave={(val: string) => handleUpdate(post.id, { content: val })}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-secondary text-[9px] text-secondary-foreground rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
