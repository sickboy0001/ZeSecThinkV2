"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BasicInfoProps {
  value: {
    fullName: string;
    notifyEmail: string;
    isAdmin: boolean;
  };
  onChange: (value: {
    fullName: string;
    notifyEmail: string;
    isAdmin: boolean;
  }) => void;
}

export function BasicInfoSection({ value, onChange }: BasicInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 氏名 */}
        <div>
          <label className="block text-sm font-medium mb-1">氏名</label>
          <input
            type="text"
            value={value.fullName}
            onChange={(e) => onChange({ ...value, fullName: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="山田 太郎"
          />
        </div>

        {/* 通知メール */}
        <div>
          <label className="block text-sm font-medium mb-1">
            AI分析結果通知先メールアドレス
          </label>
          <input
            type="email"
            value={value.notifyEmail}
            onChange={(e) =>
              onChange({ ...value, notifyEmail: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
            placeholder="notifications@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            ログインアカウントとは別のメールアドレスも設定できます
          </p>
        </div>

        {/* 管理者設定 */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value.isAdmin}
              onChange={(e) =>
                onChange({ ...value, isAdmin: e.target.checked })
              }
              className="mr-2"
            />
            管理者権限
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
