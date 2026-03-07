"use client";

import {
  getAiLogDetailFromPostIds,
  getPostIdsFromAiLogDetail,
  AiLogDetailStatus,
} from "@/services/ai_log_service";
import {
  getZstuPostsWithDate,
  getZstuPostsWithIds,
} from "@/services/zstuposts_service";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import AiLogDetailCard, { AiLogDetailCardRef } from "./AiLogDetailCard";
import { useRef } from "react";
import { useRouter } from "next/navigation";
interface Props {
  userId: string;
  initialDate?: string;
}

interface ZstuPost {
  id: number;
  current_at?: string;
  updated_at?: string;
  created_at?: string;
  state_detail?: any;
}

export default function AiLogDetailDayTable({ userId, initialDate }: Props) {
  const router = useRouter();
  const [detailData, setDetailData] = useState<AiLogDetailStatus[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publicStates, setPublicStates] = useState<Record<string, boolean>>({});

  const [currentDate, setCurrentDate] = useState<string>(
    initialDate || new Date().toISOString().split("T")[0],
  );

  const [refreshKey, setRefreshKey] = useState(0);

  // 各カードのrefを保持するためのマップ
  const cardRefs = useRef<Map<string, AiLogDetailCardRef | null>>(new Map());

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const toggleSelection = (id: string) => {
    // completedのものは選択状態をトグルさせない
    const log = detailData?.find((l) => l.id.toString() === id);
    if (log && log.status === "completed") {
      return;
    }

    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const togglePublic = (id: string) => {
    const log = detailData?.find((l) => l.id.toString() === id);
    if (log && log.status === "completed") {
      return;
    }

    setPublicStates((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  const selectAll = () => {
    if (!detailData) return;
    setSelectedIds(
      new Set(
        detailData
          .filter((log) => log.status !== "completed")
          .map((log) => log.id.toString()),
      ),
    );
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handlePostSave = async (
    id: number,
    title: string,
    content: string,
    tag: string,
  ) => {
    console.log("Saving post", { id, title, content, tag });
  };

  const handleTagDelete = (logId: number, tagToDelete: string) => {
    setDetailData((prevData) => {
      if (!prevData) return null;
      return prevData.map((log) => {
        if (log.id === logId) {
          const updatedLog = { ...log };

          // AiLogDetailCardのロジックに合わせて、どのタグを更新するか判断
          // @ts-ignore
          if (log.status === "refined") {
            const tags =
              updatedLog.after_tags?.split(",").map((t) => t.trim()) || [];
            updatedLog.after_tags = tags
              .filter((t) => t !== tagToDelete)
              .join(", ");
          } else {
            // "completed" やその他の場合
            const tags =
              updatedLog.fixed_tags?.split(",").map((t) => t.trim()) || [];
            updatedLog.fixed_tags = tags
              .filter((t) => t !== tagToDelete)
              .join(", ");
          }

          toast.info(`タグ "${tagToDelete}" を表示から削除しました。`);
          return updatedLog;
        }
        return log;
      });
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const posts = await getZstuPostsWithDate(
          userId,
          currentDate,
          currentDate,
        );

        if (!posts || posts.length === 0) {
          setDetailData([]);
          setSelectedIds(new Set());
          return;
        }

        const ids = posts.map((post) => post.id.toString());
        if (!ids || ids.length === 0) {
          setDetailData([]);
          setSelectedIds(new Set());
          return;
        }

        const postIds = ids
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id));
        const logDetails = await getAiLogDetailFromPostIds(postIds);

        if (!logDetails || logDetails.length === 0) {
          setDetailData([]);
          setSelectedIds(new Set());
          return;
        }

        // getZstuPostsWithIdsからステータス情報を取得
        const zstuPosts = (await getZstuPostsWithIds(postIds)) as ZstuPost[];

        // post_idをキーにしたステータスマップを作成
        const statusMap = new Map<string, ZstuPost>();
        if (zstuPosts) {
          zstuPosts.forEach((post) => {
            if (post && post.id) {
              // state_detail.ai_ai_request.status を取得。存在しない場合は "unprocessed"
              statusMap.set(post.id.toString(), post);
            }
          });
        }
        console.log("Status Map:", statusMap);

        // log.statusを新しいステータスで更新
        const updatedDetailData: AiLogDetailStatus[] = logDetails.map((log) => {
          //logDetailはログ情報ベースリスト
          //statusMapはポストIDとポスト自体のマップ
          const post = statusMap.get(log.post_id.toString());
          console.log(` statusMap.get post:`, post);

          console.log("post.state_detail:", post?.state_detail);
          let stateDetail = post?.state_detail;
          if (typeof stateDetail === "string") {
            try {
              stateDetail = JSON.parse(stateDetail);
            } catch (e) {
              console.error("Failed to parse state_detail", e);
            }
          }
          console.log("State Detail:", stateDetail);

          const newStatus = stateDetail?.ai_request?.status || "unprocessed";
          console.log(
            `Determined new status for log ID ${log.id}: ${newStatus}`,
          );
          const is_edited =
            stateDetail?.ai_request?.is_edited === true ||
            stateDetail?.ai_request?.is_edited === "true";
          console.log(`Post : ${post}`);
          return {
            ...log,
            status: newStatus,
            current_at: post?.current_at?.toString() || "",
            created_at: post?.created_at?.toString() || "",
            updated_at: post?.updated_at?.toString() || "",
            is_edited: is_edited,
          };
        });

        // created_atで降順（新しいものが上）にソート
        updatedDetailData.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });

        setDetailData(updatedDetailData);
        console.log("Updated Detail Data:", updatedDetailData);

        // 初期状態では未完了のものだけを選択する
        setSelectedIds(
          new Set(
            updatedDetailData
              .filter((log) => log.status !== "completed")
              .map((log) => log.id.toString()),
          ),
        );
      } catch (error: any) {
        const errorMessage = error.message || "AIログ詳細の取得に失敗しました";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, currentDate, refreshKey]);

  const handleRegisterAll = async () => {
    if (!detailData) return;

    // 選択されているカードのみ保存処理を実行する例
    const selectedLogs = detailData.filter((log) =>
      selectedIds.has(log.id.toString()),
    );

    if (selectedLogs.length === 0) {
      toast.warning("登録する項目が選択されていません");
      return;
    }

    try {
      setLoading(true);

      const savePromises = selectedLogs.map(async (log) => {
        const ref = cardRefs.current.get(log.id.toString());
        if (ref) {
          await ref.saveData();
        }
      });

      await Promise.all(savePromises);

      // DBへの反映（とくにTursoのような分散DBのレプリケーションラグ）を考慮して少し待つ
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`${selectedLogs.length}件のデータを登録しました`);
      // 登録後にデータを再フェッチして画面を更新する
      setRefreshKey((prev) => prev + 1);
    } catch (e: any) {
      toast.error(e.message || "登録中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold px-1">
            詳細ログ ({detailData?.length || 0}件)
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevDay}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm tracking-widest w-[100px] text-center">
              {currentDate}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={loading || !detailData?.length}
          >
            すべて登録ON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={loading || !detailData?.length}
          >
            すべて登録OFF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !detailData || detailData.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          データがありません。
        </div>
      ) : (
        <>
          {detailData.map((log) => (
            <AiLogDetailCard
              key={log.id}
              ref={(el) => {
                const currentRefs = cardRefs.current;
                if (el) {
                  currentRefs.set(log.id.toString(), el);
                } else {
                  currentRefs.delete(log.id.toString());
                }
              }}
              log={log}
              isSelected={selectedIds.has(log.id.toString())}
              isPublic={publicStates[log.id.toString()] ?? true}
              onToggleSelection={() => toggleSelection(log.id.toString())}
              onTogglePublic={() => togglePublic(log.id.toString())}
            />
          ))}
          <div className="flex justify-end">
            <Button onClick={handleRegisterAll}>登録する</Button>
          </div>
        </>
      )}
    </div>
  );
}
