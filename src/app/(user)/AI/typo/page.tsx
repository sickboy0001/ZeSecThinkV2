"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GeminiTypo from "@/components/pages/AI/Typo";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <GeminiTypo userId={user.id} />;
}
