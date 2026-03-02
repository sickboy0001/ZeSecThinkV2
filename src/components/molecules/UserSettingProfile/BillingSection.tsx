"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BillingProps {
  value: string;
  onChange: (value: string) => void;
}

export function BillingSection({ value, onChange }: BillingProps) {
  const plans = [
    { code: "none", name: "無料プラン", description: "基本機能のみ" },
    { code: "normal", name: "ノーマルプラン", description: "AI機能制限あり" },
    {
      code: "premium",
      name: "プレミアムプラン",
      description: "すべての機能が利用可能",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>課金プラン</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                value === plan.code
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => onChange(plan.code)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="plan"
                  value={plan.code}
                  checked={value === plan.code}
                  onChange={() => onChange(plan.code)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-sm text-gray-500">
                    {plan.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
