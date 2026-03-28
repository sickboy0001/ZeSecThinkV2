"use client";

import { useState, useEffect } from "react";
import { getFormattedTagsJson } from "@/services/zstutags_service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  userId: string;
}

export function TagsJson({ userId }: Props) {
  const [formattedJson, setFormattedJson] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJson = async () => {
      setLoading(true);
      try {
        const json = await getFormattedTagsJson(userId);
        setFormattedJson(json);
      } catch (error) {
        console.error("Failed to fetch formatted JSON", error);
        toast.error("JSONデータの取得に失敗しました。");
        setFormattedJson("エラー: データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchJson();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative">
          <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed max-h-[600px]">
            <code>{formattedJson}</code>
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white"
            onClick={() => {
              navigator.clipboard.writeText(formattedJson);
              toast.success("クリップボードにコピーしました");
            }}
            disabled={!formattedJson || formattedJson.startsWith("エラー")}
          >
            Copy JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
