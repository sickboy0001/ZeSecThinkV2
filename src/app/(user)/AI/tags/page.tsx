"use server";
import AiTypoTagsMnt from "@/components/pages/AI/Typo/AiTypoTagsMnt";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <AiTypoTagsMnt userId={user.id} />;
}
