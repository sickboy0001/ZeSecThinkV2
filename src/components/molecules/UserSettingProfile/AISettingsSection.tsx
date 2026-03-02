"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AISettingsProps {
  value: {
    typoCorrection: boolean;
    summaryGeneration: boolean;
  };
  onChange: (value: {
    typoCorrection: boolean;
    summaryGeneration: boolean;
  }) => void;
}

export function AISettingsSection({ value, onChange }: AISettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI機能設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">自動AIタイポ機能</div>
              <div className="text-sm text-gray-500">
                入力された文章の誤字脱字を自動で検出・修正します
              </div>
            </div>
            <input
              type="checkbox"
              checked={value.typoCorrection}
              onChange={(e) =>
                onChange({
                  ...value,
                  typoCorrection: e.target.checked,
                })
              }
              className="ml-3"
            />
          </label>
        </div>

        <div>
          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">自動AIサマリ機能</div>
              <div className="text-sm text-gray-500">
                長文を自動で要約してお知らせします
              </div>
            </div>
            <input
              type="checkbox"
              checked={value.summaryGeneration}
              onChange={(e) =>
                onChange({
                  ...value,
                  summaryGeneration: e.target.checked,
                })
              }
              className="ml-3"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
