"use client";

import AiLogDetailTable from "@/components/molecules/AI/log/AiLogDetailTable";

interface Props {
  userId: string;
  batchId: string;
}

export default function AiLogDetail({ userId, batchId }: Props) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI実行ログ詳細</h1>
          <p className="text-muted-foreground mt-1">
            AI機能の実行履歴詳細を確認します。
          </p>
        </div>
      </header>
      <main>
        <AiLogDetailTable batchId={batchId} />
      </main>
    </div>
  );
}
