import { redirect } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: { code: string } };

export default async function ShortLink({ params }: Props) {
  if (isConfigured) {
    const supabase = createClient();
    const { data } = await supabase
      .from("tournaments")
      .select("slug")
      .eq("share_code", params.code.toUpperCase())
      .maybeSingle();

    if (data?.slug) redirect(`/tournaments/${data.slug}`);
  }

  redirect("/tournaments");
}
