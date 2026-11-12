import type { Metadata } from "next";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import ChatRoom from "@/components/ChatRoom";

export const metadata: Metadata = { title: "Community" };
export const dynamic = "force-dynamic";

export default async function GeneralChatPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("id,body,sender_id,created_at,profiles(full_name)")
    .eq("room", "general")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <>
      <h2 style={{ marginTop: 0 }}>General chat</h2>
      <p className="muted small">Everyone in the club. Anything club-related goes here.</p>
      <ChatRoom
        canModerate={profile!.role !== "member"}
        room="general"
        currentUserId={profile!.id}
        title="General chat"
        initialMessages={(messages ?? []) as any}
      />
    </>
  );
}
