import AiNotifyTypo from "@/components/pages/AI/Notify/AiNotifyTypo";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ short_id: string }>;
};
export default async function Page({ params }: Props) {
  // ここで await するのが現在の標準的な書き方です
  const { short_id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <>
      <AiNotifyTypo userId={user.id} shortId={short_id} />
    </>
  );
}
