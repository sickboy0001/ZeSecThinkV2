"use server";

export async function checkIsAdmin(email: string | undefined | null) {
  if (!email) return false;

  const adminEmails = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim());

  return adminEmails.includes(email);
}
