"use server";
import AiLogDetailWeek from "@/components/pages/AI/log/AiLogDetailWeek";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let initialDateStr: string | undefined = undefined;
  const resolvedSearchParams = await searchParams;
  if (
    resolvedSearchParams?.date &&
    typeof resolvedSearchParams.date === "string"
  ) {
    const d = resolvedSearchParams.date;
    if (d.length === 8 && !d.includes("-")) {
      // "20260101" -> "2026-01-01"
      initialDateStr = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
    } else {
      initialDateStr = d;
    }
  }

  return <AiLogDetailWeek userId={user.id} initialDate={initialDateStr} />;
}
