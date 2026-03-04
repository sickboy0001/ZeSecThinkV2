"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RequestTypo from "@/components/pages/AI/RequestTypo";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <RequestTypo userId={user.id} />;
}
