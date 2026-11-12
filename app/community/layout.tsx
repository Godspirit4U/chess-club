import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export default async function CommunityLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = createClient();

  const [{ count: memberCount }, { data: links }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("connections")
      .select("id,requester_id,addressee_id,status")
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
  ]);

  const friends: string[] = [];
  let pendingIncoming = 0;

  for (const c of links ?? []) {
    if (c.status === "accepted") {
      friends.push(c.requester_id === profile.id ? c.addressee_id : c.requester_id);
    } else if (c.status === "pending" && c.addressee_id === profile.id) {
      pendingIncoming++;
    }
  }

  let friendNames: { id: string; full_name: string }[] = [];
  if (friends.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name")
      .in("id", friends)
      .order("full_name", { ascending: true });
    friendNames = data ?? [];
  }

  const isAdmin = profile.role !== "member";

  return (
    <div className="community-layout">
      <aside className="community-side">
        <div className="side-block">
          <h1 style={{ fontSize: 20, margin: 0 }}>Community</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            {memberCount ?? 0} members
          </p>
        </div>

        <nav className="side-block" aria-label="Chats">
          <p className="side-label">Rooms</p>
          <Link href="/community">General chat</Link>
          {isAdmin ? <Link href="/community/admin">Admin chat</Link> : null}
        </nav>

        <div className="side-block">
          <p className="side-label">People</p>
          <Link href="/community/people">
            Find people
            {pendingIncoming > 0 ? (
              <span className="badge live" style={{ marginLeft: 6 }}>
                {pendingIncoming}
              </span>
            ) : null}
          </Link>
        </div>

        <div className="side-block">
          <p className="side-label">Private chats</p>
          {friendNames.length === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>
              No private chats yet. Find someone and send a request.
            </p>
          ) : (
            friendNames.map((f) => (
              <Link key={f.id} href={`/community/${f.id}`}>
                {f.full_name}
              </Link>
            ))
          )}
        </div>
      </aside>

      <section className="community-main">{children}</section>
    </div>
  );
}
