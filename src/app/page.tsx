"use server";
// app/page.tsx (サーバーコンポーネント)
// app/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function IndexPage() {
  // 1. cookies() は await して取得する（Next.js 15 の仕様）
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // 2. await済みの cookieStore なので getAll が使えます
          return cookieStore.getAll();
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証状態に応じてリダイレクト
  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/startPage");
  }

  return null;
}
