"use server";

import sql from "@/lib/db";

export async function checkIsAdminEmail(email: string | undefined | null) {
  if (!email) return false;

  const adminEmails = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim());

  return adminEmails.includes(email);
}

export async function checkIsAdmin(email: string | undefined | null) {
  if (!email) return false;

  const isAdminEmail = await checkIsAdminEmail(email);
  if (isAdminEmail) return true;

  //user_profile.is_admin で確認
  // true なら、管理者とみなす
  // それ以外は、一般ユーザーとみなす　なしの場合もこちらで。
  try {
    // 指示に基づき、'user_profile' テーブルを検索します。
    // 'email' カラムでユーザーを特定し、'is_admin' フラグを取得します。
    const users = await sql`
        SELECT is_admin FROM user_profile 
    inner join auth.users users
    on user_profile.id = users.id
    WHERE users.email = ${email}
    `;

    // ユーザーが存在し、かつ is_admin フラグが true の場合、管理者とみなします。
    if (users.length > 0 && users[0].is_admin === true) {
      return true;
    }

    // 上記以外（ユーザーが存在しない、is_adminがtrueでない）の場合は、一般ユーザーとみなします。
    return false;
  } catch (error) {
    console.error(
      "データベースでの管理者ステータス確認中にエラーが発生しました:",
      error,
    );
    // エラー発生時は、セキュリティを考慮し、管理者ではないと判断します。
    return false;
  }
}
