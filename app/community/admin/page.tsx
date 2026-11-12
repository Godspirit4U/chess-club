import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import ChatRoom from "@/components/ChatRoom";

export const metadata: Metadata = { title: "Admin chat" };
export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/community");

  const supabase = createClient();
  const { data: messages } = await supabase
    .from("messages")
    .select("id,body,sender_id,created_at,profiles(full_name)")
    .eq("room", "admin")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Admin chat</h2>
      <p className="muted small">Committee only. Members cannot see this room.</p>
      <ChatRoom
        room="admin"
        currentUserId={profile.id}
        title="Admin chat"
        initialMessages={(messages ?? []) as any}
      />
    </>
  );
}
