"use client";

import AiLogDetailDayTable from "@/components/molecules/AI/log/AiLogDetailDayTable";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AiLogDetailWeekTable from "@/components/molecules/AI/log/AiLogDetailWeekTable";

interface Props {
  userId: string;
  initialDate?: string;
}

export default function AiLogDetailWeek({ userId, initialDate }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 初期表示で日付を受け取った後、URLのクエリストリング（?date=...）を消去する
    if (typeof window !== "undefined" && window.location.search) {
      router.replace(pathname, { scroll: false });
    }
  }, [pathname, router]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI実行記録（週次表示）
          </h1>
          <p className="text-muted-foreground mt-1">
            AIの実行記録を確認します。
          </p>
        </div>
      </header>
      <main>
        <AiLogDetailWeekTable userId={userId} initialDate={initialDate} />{" "}
        {/* <AiLogDetailDayTable userId={userId} initialDate={initialDate} />{" "} */}
      </main>
    </div>
  );
}
