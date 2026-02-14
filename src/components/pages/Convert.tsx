"use client";

import { useState, useEffect } from "react";
import { getPreviewData, executeConversion } from "@/services/convert_service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Database,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Props {
  userId: string;
  email: string;
}

interface PreviewData {
  target_email: string;
  old_user_id: number;
  new_user_uuid: string;
  old_data: {
    posts_count: number;
  };
  new_data: {
    posts_count: number;
  };
}

interface ResultData {
  items_count: number;
  logs_count: number;
}

type Step =
  | "loading"
  | "preview"
  | "confirm"
  | "executing"
  | "result"
  | "error";

export default function LegacyDataConvert({ userId, email }: Props) {
  const [step, setStep] = useState<Step>("loading");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (email) fetchPreview();
  }, [userId, email]);

  const fetchPreview = async () => {
    setStep("loading");
    setError(null);
    try {
      const res = await getPreviewData(userId, email);
      if ("error" in res && res.error) {
        throw new Error(res.error);
      }
      setPreviewData(res as PreviewData);
      setStep("preview");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "プレビューデータの取得に失敗しました");
      setStep("error");
    }
  };

  const handleExecute = async () => {
    setStep("executing");
    try {
      const res = await executeConversion(userId, email);
      if (res.status === "success") {
        setResultData({
          items_count: res.items_count,
          logs_count: res.logs_count,
        });
        setStep("result");
        toast.success("データ移行が完了しました");
      } else {
        throw new Error("移行処理が正常に終了しませんでした");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "データ移行中にエラーが発生しました");
      setStep("error");
    }
  };

  const renderContent = () => {
    switch (step) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">データを読み込んでいます...</p>
          </div>
        );

      case "error":
        return (
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラーが発生しました</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button onClick={fetchPreview} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                再試行
              </Button>
            </div>
          </div>
        );

      case "preview":
        if (!previewData) return null;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Convert</h1>
            <p className="text-muted-foreground">
              過去のZeroSecondThinksのデータをコンバートします。
            </p>{" "}
            <div className="flex items-center gap-2 text-primary font-semibold">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                1
              </span>
              <h3>Step 1: 移行データのプレビュー</h3>
            </div>
            <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-200">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle>移行対象情報</AlertTitle>
              <AlertDescription className="mt-2 grid grid-cols-1 gap-1 text-sm">
                <div>
                  <span className="font-semibold">対象ユーザー:</span>{" "}
                  {previewData.target_email}
                </div>
                <div>
                  <span className="font-semibold">旧ユーザーID:</span>{" "}
                  {previewData.old_user_id}
                </div>
                <div>
                  <span className="font-semibold">新ユーザーUUID:</span>{" "}
                  {previewData.new_user_uuid}
                </div>
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Old Data */}
              <Card className="bg-muted/30 border-muted-foreground/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    移行元データ (Old)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span>ポスト数:</span>
                      <span className="font-bold font-mono">
                        {previewData.old_data.posts_count} 件
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* New Data */}
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    削除対象データ (New)
                  </CardTitle>
                  <CardDescription className="text-destructive/80 text-xs">
                    ※ 移行を実行すると、現在の以下のデータは削除されます。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-destructive/90">
                    <li className="flex justify-between">
                      <span>現在のポスト数:</span>
                      <span className="font-bold font-mono">
                        {previewData.new_data.posts_count} 件
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep("confirm")}>
                確認画面へ進む <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "confirm":
        if (!previewData) return null;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-destructive font-semibold">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs">
                2
              </span>
              <h3>Step 2: 最終確認</h3>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>本当に実行してよろしいですか？</AlertTitle>
              <AlertDescription className="mt-2">
                現在のデータ（ポスト数: {previewData.new_data.posts_count}件）は
                <strong>全て削除</strong>され、 旧システム（ポスト数:{" "}
                {previewData.old_data.posts_count}件）のデータが
                <strong>移行</strong>
                されます。
                <br />
                <span className="font-bold underline mt-2 block">
                  この操作は取り消せません。
                </span>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("preview")}>
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleExecute}>
                実行する
              </Button>
            </div>
          </div>
        );

      case "executing":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-500">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">データ移行中...</h3>
              <p className="text-muted-foreground">
                画面を閉じずにそのままお待ちください。
              </p>
            </div>
          </div>
        );

      case "result":
        if (!resultData) return null;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs">
                3
              </span>
              <h3>Step 3: 完了</h3>
            </div>

            <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>成功</AlertTitle>
              <AlertDescription>
                データ移行が正常に完了しました。
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">移行結果</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex justify-between border-b pb-2">
                    <span>移行されたポスト数</span>
                    <span className="font-bold font-mono">
                      {resultData.items_count} 件
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="justify-end">
                <Link href="/zst/dashboard">
                  <Button>ダッシュボードへ</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 w-full max-w-3xl mx-auto">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <RefreshCw className="h-8 w-8 text-primary" />
            データ移行ツール
          </h1>
          <p className="text-muted-foreground mt-1">
            旧システムから新システムへデータを移行します。
          </p>
        </div>
      </header>

      <div className="mt-6">{renderContent()}</div>
    </div>
  );
}
