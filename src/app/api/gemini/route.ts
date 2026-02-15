// src/app/api/gemini/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "No API Key" }, { status: 500 });

  try {
    const { prompt } = await req.json();

    // SDKを通さず、GoogleのAPIを直接 fetch する
    // エンドポイントを v1beta ではなく v1 (安定版) に指定
    // const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    // const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
