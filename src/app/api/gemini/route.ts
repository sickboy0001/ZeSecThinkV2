// src/app/api/gemini/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "No API Key" }, { status: 500 });

  try {
    const { prompt } = await req.json();

    // 使用するモデルを指定
    const model = "gemini-flash-latest";
    const apiVersion = "v1beta";
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      console.error("Direct API Error:", data);
      return NextResponse.json(
        { error: data.error?.message || "API Error" },
        { status: response.status },
      );
    }

    // レスポンスのパース
    const text = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ text, model, apiVersion });
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
