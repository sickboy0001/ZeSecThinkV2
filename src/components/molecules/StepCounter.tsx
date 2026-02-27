"use client";

interface Props {
  count: number;
  goal?: number; // デフォルト値を10にするため任意へ
}

export const StepCounter = ({ count, goal = 10 }: Props) => {
  const progressRate = count / goal;
  const isOverGoal = count >= goal;
  const isNearGoal = progressRate >= 0.8 && count < goal;

  // 動的にクラス名を決定
  const getProgressColor = () => {
    if (isOverGoal) return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"; // 金色（光沢感）
    if (isNearGoal) return "bg-green-500"; // 8割以上の緑
    return "bg-primary"; // 通常時
  };

  const getTextColor = () => {
    if (isOverGoal) return "text-amber-600 dark:text-amber-400";
    if (isNearGoal) return "text-green-600 dark:text-green-400";
    return "text-muted-foreground";
  };

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`Progress: ${count} of ${goal}`}
    >
      <div className="flex gap-1">
        {Array.from({ length: goal }).map((_, i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-sm transition-all duration-500 ${
              i < count
                ? getProgressColor() // 達成済みのドット
                : "bg-slate-200 dark:bg-slate-800" // 未達成のドット
            }`}
          />
        ))}
      </div>

      <span
        className={`text-sm font-bold ml-1 transition-colors duration-500 ${getTextColor()}`}
      >
        {count}
        {count > goal && (
          <span className="text-xs ml-0.5 font-black animate-pulse">
            +{count - goal}
          </span>
        )}
        <span className="text-[10px] ml-0.5 opacity-60 font-normal text-muted-foreground">
          /{goal}
        </span>
      </span>
    </div>
  );
};

// 2. 本体の JSX 部分を差し替え
// 元のコード：<span className="text-muted-foreground font-semibold text-base">[{posts.length}/10]</span>
