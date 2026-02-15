import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Supabaseクライアントの初期化（セッション更新のため）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 2. ユーザー情報の取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // --- シンプルなガードレール・ロジック ---

  // A. ログイン済みなら行かせないページ（ログイン/サインアップ/スタートページ）
  const authPages = ["/startPage", "/login", "/signup"];
  if (user && authPages.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // B. 未ログインなら行かせないページ（保護されたルート）
  const protectedRoutes = ["/dashboard", "/logs", "/items", "/api/gemini"];
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/startPage", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 静的ファイル以外すべて。ただし "/" は page.tsx で処理するので、
     * Middleware はセッション更新とガードの役割に徹する。
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
