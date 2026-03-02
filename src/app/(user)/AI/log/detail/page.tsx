"use server";
import AiLogDetail from "@/components/pages/AI/log/AiLogDetail";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { batchid } = await searchParams;
  const batchIdStr = Array.isArray(batchid) ? batchid[0] : batchid;

  if (!batchIdStr) redirect("/dashboard");

  return <AiLogDetail userId={user.id} batchId={batchIdStr} />;
}
