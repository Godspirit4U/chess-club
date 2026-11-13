import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

export const metadata: Metadata = { title: "People" };
export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_path,role,chesscom_username,lichess_username")
    .order("full_name", { ascending: true });

  return (
    <>
      <h1>People</h1>
      <p className="muted small">{(members ?? []).length} members</p>

      <div style={{ marginTop: 12 }}>
        {(members ?? []).map((m) => (
          <Link
            key={m.id}
            href={`/members/${m.id}`}
            className="person-row"
            style={{ color: "inherit" }}
          >
            <Avatar name={m.full_name} path={m.avatar_path} />
            <span style={{ minWidth: 0 }}>
              <span className="person-name" style={{ display: "block" }}>
                {m.full_name}
                {m.id === me.id ? <span className="person-meta"> (you)</span> : null}
              </span>
              <span className="person-meta" style={{ display: "block" }}>
                {m.chesscom_username ?? (m.role === "member" ? "Member" : m.role.replace("_", " "))}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
