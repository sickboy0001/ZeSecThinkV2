"use server";
import AiLoglist from "@/components/pages/AI/log/AiLoglist";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <AiLoglist userId={user.id} />;
}
