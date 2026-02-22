import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface TagStats {
  name: string;
  count: number;
}

export interface MomentumData {
  label: string;
  [key: string]: any;
}

interface Props {
  momentumData: MomentumData[];
  sortedTags: TagStats[];
  maxVal: number;
}

export function AnalyticsTagMoment({
  momentumData,
  sortedTags,
  maxVal,
}: Props) {
  // グラフ用のカラフルな色の配列 (Hex値)
  const HEX_COLORS = [
    "#0ea5e9", // sky-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#f43f5e", // rose-500
    "#8b5cf6", // violet-500
  ];

  // Shadcn UI Chart用の設定を動的に生成
  const chartConfig = sortedTags.reduce((acc, tag, index) => {
    acc[tag.name] = {
      label: tag.name,
      color: HEX_COLORS[index % HEX_COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className="md:col-span-2 shadow-md border-muted/40 bg-card/30 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          タグ・モメンタム
        </CardTitle>
        <CardDescription>週ごとの主要タグ出現推移</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <LineChart
            accessibilityLayer
            data={momentumData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {sortedTags.map((tag, index) => (
              <Line
                key={tag.name}
                type="monotone"
                dataKey={tag.name}
                stroke={`var(--color-${tag.name})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
