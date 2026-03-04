"use client";
import AiLogDetailTable from "@/components/molecules/AI/log/AiLogDetailTable";
import { getAiLogDetail } from "@/services/ai_log_service";
import { getShortUrlInfo } from "@/services/short_url_service";
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
    <div>
      <h1>詳細画面</h1>
      <p>
        userid: <strong>{userId}</strong>
      </p>
      <p>
        Short ID: <strong>{shortId}</strong>
      </p>
      {data && (
        <div>
          <h2>取得情報</h2>
          <ul>
            {/* <li>UUID: {data.uuid}</li> */}
            <li>System Name: {data.system_name}</li>
            <li>Created At: {new Date(data.created_at).toLocaleString()}</li>
            <li>Batch ID: {data.batch_id}</li>
          </ul>
          <details>
            <summary>Parameters</summary>
            <pre>{JSON.stringify(data.parameters, null, 2)}</pre>
          </details>
        </div>
      )}
      {data && data.batch_id && (
        <div>
          <h2>AI Log Detail</h2>
          <AiLogDetailTable batchId={data.batch_id} />
        </div>
      )}
    </div>
  );
}
