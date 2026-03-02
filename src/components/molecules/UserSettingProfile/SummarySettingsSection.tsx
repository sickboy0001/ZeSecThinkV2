"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummarySettingsProps {
  value: {
    weeklyPattern: string;
    weeklyTime: string;
    monthlyDay: number;
    monthlyTime: string;
    monthlyEnabled: boolean;
  };
  onChange: (value: any) => void;
}

export function SummarySettingsSection({
  value,
  onChange,
}: SummarySettingsProps) {
  const weeklyPatterns = [
    {
      value: "sun",
      label: "パターンA: 日曜日実行",
      description: "前週日曜日〜土曜日までの情報を確認",
    },
    {
      value: "mon",
      label: "パターンB: 月曜日実行",
      description: "前週月曜日〜日曜日までの情報を確認",
    },
    {
      value: "sat",
      label: "パターンC: 土曜日実行",
      description: "前週土曜日〜金曜日までの情報を確認",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>サマリ作成設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 週次サマリ設定 */}
        <div>
          <h3 className="font-medium mb-3">週次サマリ設定</h3>
          <div className="space-y-3">
            {weeklyPatterns.map((pattern) => (
              <div
                key={pattern.value}
                className={`border rounded-lg p-3 cursor-pointer ${
                  value.weeklyPattern === pattern.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
                onClick={() =>
                  onChange({
                    ...value,
                    weeklyPattern: pattern.value,
                  })
                }
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="weeklyPattern"
                    value={pattern.value}
                    checked={value.weeklyPattern === pattern.value}
                    onChange={() =>
                      onChange({
                        ...value,
                        weeklyPattern: pattern.value,
                      })
                    }
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium">{pattern.label}</div>
                    <div className="text-sm text-gray-500">
                      {pattern.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">実行時刻</label>
            <input
              type="time"
              value={value.weeklyTime}
              onChange={(e) =>
                onChange({
                  ...value,
                  weeklyTime: e.target.value,
                })
              }
              className="border rounded px-3 py-1"
            />
          </div>
        </div>

        {/* 月次サマリ設定 */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">月次サマリ設定</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={value.monthlyEnabled}
                onChange={(e) =>
                  onChange({
                    ...value,
                    monthlyEnabled: e.target.checked,
                  })
                }
                className="mr-2"
              />
              有効にする
            </label>
          </div>

          {value.monthlyEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">実行日</label>
                <select
                  value={value.monthlyDay}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      monthlyDay: parseInt(e.target.value),
                    })
                  }
                  className="w-full border rounded px-3 py-1"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      毎月{day}日
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  実行時刻
                </label>
                <input
                  type="time"
                  value={value.monthlyTime}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      monthlyTime: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-1"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
