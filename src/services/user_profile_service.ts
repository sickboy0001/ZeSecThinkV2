"use server";
import { createClient } from "@/lib/supabase/server";
export interface UserProfile {
  fullName: string;
  notifyEmail: string;
  isAdmin: boolean;
  plan: string;
  typoCorrection: boolean;
  summaryGeneration: boolean;
  weeklyPattern: string;
  weeklyTime: string;
  monthlyDay: number;
  monthlyTime: string;
  monthlyEnabled: boolean;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = await createClient();

  // 関連データを並列で取得
  const [profileRes, subscriptionRes, weeklyRes, monthlyRes] =
    await Promise.all([
      supabase.from("user_profile").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("user_subscriptions")
        .select("plan_code")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("summary_preferences_week")
        .select("week, run_time")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("summary_preferences_monthly")
        .select("run_day, run_time, is_enabled")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  // メインのプロフィールデータがなければエラー
  if (profileRes.error) {
    console.error("Error fetching user profile:", profileRes.error);
    throw profileRes.error;
  }

  const profileData = profileRes.data;
  const subscriptionData = subscriptionRes.data;
  const weeklyData = weeklyRes.data;
  const monthlyData = monthlyRes.data;

  // 取得したデータを UserProfile 型にマッピング。データがない場合はデフォルト値を設定。
  return {
    fullName: profileData?.full_name ?? "",
    notifyEmail: profileData?.notify_email ?? "",
    isAdmin: profileData?.is_admin ?? false,
    plan: subscriptionData?.plan_code ?? "none",
    typoCorrection: profileData?.settings?.auto_ai?.typo ?? false,
    summaryGeneration: profileData?.settings?.auto_ai?.summary ?? false,
    weeklyPattern: weeklyData?.week ?? "sun",
    weeklyTime: weeklyData?.run_time ?? "01:00",
    monthlyDay: monthlyData?.run_day ?? 1,
    monthlyTime: monthlyData?.run_time ?? "02:00",
    monthlyEnabled: monthlyData?.is_enabled ?? false,
  };
}

export async function fetchUserProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profile")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchBillingPlans(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("billing_plans").select("*");
  if (error) {
    throw error;
  }
  return data;
}

export async function fetchUserSubscriptions(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchSummaryPreferencesWeek(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("summary_preferences_week")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchSummaryPreferencesMonthly(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("summary_preferences_monthly")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserProfile(
  userId: string,
  profileData: UserProfile,
) {
  const supabase = await createClient();

  // 1. user_profile テーブルの更新
  const { error: profileError } = await supabase.from("user_profile").upsert(
    {
      id: userId,
      full_name: profileData.fullName,
      notify_email: profileData.notifyEmail,
      is_admin: profileData.isAdmin,
      settings: {
        auto_ai: {
          typo: profileData.typoCorrection,
          summary: profileData.summaryGeneration,
        },
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("Error updating user_profile:", profileError);
    throw new Error("基本情報の更新に失敗しました。");
  }

  // 2. user_subscriptions テーブルの更新
  // NOTE: user_id にユニーク制約がない場合 upsert(onConflict) が失敗するため、
  // 既存レコードの確認を行ってから Update または Insert を行います。
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let subscriptionError;

  if (existingSubscription) {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        plan_code: profileData.plan,
        status: "active",
      })
      .eq("id", existingSubscription.id);
    subscriptionError = error;
  } else {
    const { error } = await supabase.from("user_subscriptions").insert({
      user_id: userId,
      plan_code: profileData.plan,
      status: "active",
    });
    subscriptionError = error;
  }

  if (subscriptionError) {
    console.error("Error updating user_subscriptions:", subscriptionError);
    throw new Error("課金プランの更新に失敗しました。");
  }

  // 3. summary_preferences_week テーブルの更新
  const { error: weeklyError } = await supabase
    .from("summary_preferences_week")
    .upsert(
      {
        user_id: userId,
        week: profileData.weeklyPattern,
        run_time: profileData.weeklyTime,
      },
      { onConflict: "user_id" },
    );

  if (weeklyError) {
    console.error("Error updating summary_preferences_week:", weeklyError);
    throw new Error("週次サマリ設定の更新に失敗しました。");
  }

  // 4. summary_preferences_monthly テーブルの更新
  const { error: monthlyError } = await supabase
    .from("summary_preferences_monthly")
    .upsert(
      {
        user_id: userId,
        run_day: profileData.monthlyDay,
        run_time: profileData.monthlyTime,
        is_enabled: profileData.monthlyEnabled,
      },
      { onConflict: "user_id" },
    );

  if (monthlyError) {
    console.error("Error updating summary_preferences_monthly:", monthlyError);
    throw new Error("月次サマリ設定の更新に失敗しました。");
  }

  return { success: true };
}
