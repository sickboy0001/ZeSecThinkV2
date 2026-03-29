"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash } from "lucide-react";
import Layout from "d3-cloud";
import { useEffect, useRef, useState } from "react";

interface TagCount {
  name: string;
  count: number;
}

interface Props {
  sortedTags: TagCount[];
  totalCount: number;
}

// 色の配列 (Hex 値)
const HEX_COLORS = [
  "#16a34a",
  "#15803d",
  "#166534",
  "#059669",
  "#047857",
  "#0d9488",
  "#0f766e",
  "#0891b2",
  "#0e7490",
  "#2563eb",
  "#1d4ed8",
  "#4f46e5",
  "#4338ca",
  "#7c3aed",
  "#6d28d9",
  "#9333ea",
  "#7e22ce",
  "#db2777",
  "#be185d",
  "#dc2626",
  "#b91c1c",
  "#ea580c",
  "#c2410c",
  "#ca8a04",
  "#a16207",
];

export function AnalyticsTagWordCloud({ sortedTags, totalCount }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(500);

  useEffect(() => {
    setIsClient(true);
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      setContainerWidth(width);
      setContainerHeight(height);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        setContainerWidth(width);
        setContainerHeight(height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      !isClient ||
      containerWidth === 0 ||
      containerHeight === 0 ||
      sortedTags.length === 0
    )
      return;

    const width = containerWidth;
    const height = containerHeight;

    // 上位 90 個に制限
    const topTags = sortedTags.slice(0, 90);

    // 角度：0 度（横）のみ（重なり防止のため）
    const angles = [0];

    // d3-cloud の例に基づいて words を準備
    const words = topTags.map((tag, index) => {
      // カウントの比率に基づいたフォントサイズ（最小 4px、最大 72px）
      // 比重をより明確にするため、対数スケールを調整
      const ratio = tag.count / totalCount;
      const fontSize = Math.max(
        4, // 最小サイズを 4px に
        Math.min(72, Math.pow(ratio, 0.3) * 120), // 冪関数を使用してサイズ差を明確に
      );
      return {
        text: tag.name,
        size: fontSize,
        color: HEX_COLORS[index % HEX_COLORS.length],
        angle: angles[Math.floor(Math.random() * angles.length)],
      };
    });

    // d3-cloud の browserify.js 例に厳密に従って実装
    const layout = new Layout();

    layout
      .size([width, height])
      .words(words as any)
      .padding(4) // 単語の重なりを防止するためにパディングを増やす
      .rotate(function (word: any) {
        return (word.angle * Math.PI) / 180;
      })
      .font("Inter, sans-serif")
      .fontSize(function (word: any) {
        return word.size;
      })
      .on("end", function (drawnWords: any[]) {
        // エラーなしの場合、drawnWords が渡される
        draw(null, drawnWords);
      } as any)
      .start();

    function draw(_error: Error | null, words: any[]) {
      if (!words || words.length === 0) {
        console.warn("No words placed in the cloud");
        return;
      }

      if (!containerRef.current) return;

      // 既存の SVG をクリア
      containerRef.current.innerHTML = "";

      if (words.length === 0) return;

      // 単語のバウンディングボックスを計算
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      words.forEach((word: any) => {
        const textWidth = word.text.length * word.size * 0.6;
        const textHeight = word.size;

        if (word.angle === 90) {
          minX = Math.min(minX, word.x - textHeight / 2);
          minY = Math.min(minY, word.y - textWidth / 2);
          maxX = Math.max(maxX, word.x + textHeight / 2);
          maxY = Math.max(maxY, word.y + textWidth / 2);
        } else {
          minX = Math.min(minX, word.x - textWidth / 2);
          minY = Math.min(minY, word.y - textHeight / 2);
          maxX = Math.max(maxX, word.x + textWidth / 2);
          maxY = Math.max(maxY, word.y + textHeight / 2);
        }
      });

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const offsetX = (width - contentWidth) / 2 - minX;
      const offsetY = (height - contentHeight) / 2 - minY;

      // SVG 要素を作成（d3-cloud の例に準拠）
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.style.overflow = "visible";

      // 各単語を SVG 要素として描画
      words.forEach((word: any) => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // 移動と回転を適用
        g.setAttribute(
          "transform",
          `translate(${word.x + offsetX},${word.y + offsetY}) rotate(${word.angle})`,
        );

        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("fill", word.color);
        text.setAttribute("font-size", `${word.size}px`);
        text.setAttribute("font-family", "Inter, sans-serif");
        text.setAttribute("font-weight", "600");
        text.textContent = word.text;

        // ホバーエフェクト
        text.style.cursor = "pointer";
        text.style.transition = "opacity 0.2s";

        text.addEventListener("mouseenter", () => {
          text.style.opacity = "0.8";
        });
        text.addEventListener("mouseleave", () => {
          text.style.opacity = "1";
        });

        g.appendChild(text);
        svg.appendChild(g);
      });

      containerRef.current.appendChild(svg);
    }
  }, [isClient, containerWidth, containerHeight, sortedTags, totalCount]);

  return (
    <Card className="shadow-md border-muted/40 bg-card/30 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Hash className="h-5 w-5 text-orange-500" />
          タグ・クラウド
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div
          ref={containerRef}
          className="h-[500px] w-[500px] max-w-full flex items-center justify-center"
          style={{ overflow: "visible" }}
        />
      </CardContent>
    </Card>
  );
}
