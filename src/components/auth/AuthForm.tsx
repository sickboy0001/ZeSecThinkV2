"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthForm() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.refresh();
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900">ようこそ</h2>
        <p className="mt-2 text-sm text-gray-600">
          ログインまたは新規登録を行ってください
        </p>
      </div>

      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: "#4f46e5", // indigo-600
                brandAccent: "#4338ca", // indigo-700
              },
            },
          },
          className: {
            button: "rounded-md px-4 py-2",
            input: "rounded-md px-3 py-2 border border-gray-300",
          },
        }}
        // 使用したいプロバイダーを配列で指定（事前にSupabaseダッシュボードで有効化が必要）
        providers={["google"]}
        redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`}
        localization={{
          variables: {
            sign_in: {
              email_label: "メールアドレス",
              password_label: "パスワード",
              button_label: "ログイン",
              social_provider_text: "{{provider}}でログイン",
              link_text: "すでにアカウントをお持ちですか？ログイン",
            },
            // 必要に応じて sign_up, forgotten_password などのラベルも設定可能
          },
        }}
      />
    </div>
  );
}
