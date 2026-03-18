"use client";
import AiLogDetailTable from "@/components/molecules/AI/log/AiLogDetailTable";
import { getAiLogDetail } from "@/services/ai_log_service";
import { getShortUrlInfo } from "@/services/short_url_service";
import { formatDateToJst } from "@/lib/date_util";
import React, { useEffect, useState } from "react";

interface Props {
  userId: string;
  shortId: string;
}

type UrlInfo = {
  created_at: string;
  uuid: string;
  system_name: string;
  user_id: string;
  batch_id: string;
  parameters: any;
};

export default function AiNotifyTypo({ userId, shortId }: Props) {
  const [data, setData] = useState<UrlInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getShortUrlInfo(shortId);
      if (result && Array.isArray(result) && result.length > 0) {
        setData(result[0] as unknown as UrlInfo);
      }
    };
    fetchData();
  }, [shortId]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">AI処理の結果が届きました</h1>
        {data && (
          <p className="text-muted-foreground">
            日時：{formatDateToJst(data.created_at)}
          </p>
        )}
      </div>

      <details className="bg-muted/30 p-4 rounded-lg border text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground transition-colors">
          詳細情報 (Short ID: {shortId})
        </summary>
        <div className="mt-4 space-y-2">
          <p>
            User ID: <strong>{userId}</strong>
          </p>
          {data && (
            <div className="space-y-2">
              <p>System Name: {data.system_name}</p>
              <p>Batch ID: {data.batch_id}</p>
              <div className="pt-2 border-t mt-2">
                <p className="font-medium mb-1">Parameters:</p>
                <pre className="bg-background p-2 rounded border overflow-auto max-h-[200px]">
                  {JSON.stringify(data.parameters, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </details>

      {data && data.batch_id && (
        <div className="pt-4">
          <AiLogDetailTable batchId={data.batch_id} />
        </div>
      )}
    </div>
  );
}
