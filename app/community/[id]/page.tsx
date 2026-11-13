import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import ChatRoom from "@/components/ChatRoom";

export const metadata: Metadata = { title: "Message" };
export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function ConversationPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (params.id === profile.id) redirect("/community");

  const supabase = createClient();

  const { data: other } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("id", params.id)
    .single();

  if (!other) notFound();

  // Conversations are stored with the lower uuid first.
  const [a, b] = [profile.id, other.id].sort();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: created } = await supabase
      .from("conversations")
      .insert({ user_a: a, user_b: b })
      .select("id")
      .single();
    conversationId = created?.id;
  }

  if (!conversationId) {
    return (
      <>
        <h1>{other.full_name}</h1>
        <p className="empty">This conversation could not be opened. Try again in a moment.</p>
      </>
    );
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id,body,sender_id,created_at,profiles(full_name)")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <>
      <p className="small">
        <Link href="/community">Community</Link>
      </p>
      <h2 style={{ marginTop: 0 }}>{other.full_name}</h2>

      <div style={{ marginTop: 16 }}>
        <ChatRoom
          room="dm"
          conversationId={conversationId}
          currentUserId={profile.id}
          title="Direct messages"
          initialMessages={(messages ?? []) as any}
        />
      </div>
    </>
  );
}
