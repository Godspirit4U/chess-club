import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import ChatRoom from "@/components/ChatRoom";

export const metadata: Metadata = { title: "Community" };
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id,full_name,role,chess_username")
    .order("full_name", { ascending: true });

  const { data: general } = await supabase
    .from("messages")
    .select("id,body,sender_id,created_at,profiles(full_name)")
    .eq("room", "general")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  const isAdmin = profile.role !== "member";

  const { data: adminRoom } = isAdmin
    ? await supabase
        .from("messages")
        .select("id,body,sender_id,created_at,profiles(full_name)")
        .eq("room", "admin")
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(100)
    : { data: [] as any[] };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        <h1 style={{ margin: 0 }}>Community</h1>
        {profile.role === "super_admin" ? (
          <Link className="btn secondary" href="/admin/people">
            Manage people
          </Link>
        ) : null}
      </div>
      <p className="muted">Members of the club, and the room everyone shares.</p>

      <section style={{ marginTop: 20 }}>
        <ChatRoom
          room="general"
          currentUserId={profile.id}
          title="General room"
          initialMessages={(general ?? []) as any}
        />
      </section>

      {isAdmin ? (
        <section style={{ marginTop: 20 }}>
          <ChatRoom
            room="admin"
            currentUserId={profile.id}
            title="Admin room"
            initialMessages={(adminRoom ?? []) as any}
          />
        </section>
      ) : null}

      <section style={{ marginTop: 28 }}>
        <h2>Members ({(members ?? []).length})</h2>
        <ul style={{ paddingLeft: 18 }}>
          {(members ?? []).map((m) => (
            <li key={m.id} className="small" style={{ marginBottom: 4 }}>
              {m.id === profile.id ? (
                <strong>{m.full_name} (you)</strong>
              ) : (
                <Link href={`/community/${m.id}`}>{m.full_name}</Link>
              )}
              {m.chess_username ? (
                <span className="muted"> · {m.chess_username}</span>
              ) : null}
              {m.role !== "member" ? <span className="badge" style={{ marginLeft: 8 }}>{m.role.replace("_", " ")}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
