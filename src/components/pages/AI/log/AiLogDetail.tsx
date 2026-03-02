"use client";

import { useState, useEffect } from "react";

interface Props {
  userId: string;
  batchId: string;
}

export default function AiLogDetail({ userId, batchId }: Props) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI実行ログ詳細</h1>
          <p className="text-muted-foreground mt-1">AI機能の実行履歴詳細</p>
        </div>
      </header>
    </div>
  );
}
