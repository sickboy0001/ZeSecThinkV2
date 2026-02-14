import Convert from "@/components/pages/Convert";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    // ログインしていない場合の処理（リダイレクトなど）
    return <div>Please login</div>;
  }
  return <Convert userId={user.id} email={user.email} />;
}
