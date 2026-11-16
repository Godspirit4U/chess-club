import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { addPlayersToTournament } from "@/lib/tournament-actions";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = { title: "Add players" };
export const dynamic = "force-dynamic";

type Props = { params: { slug: string }; searchParams: { error?: string } };

export default async function AddPlayersPage({ params, searchParams }: Props) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  if (me.role === "member") redirect(`/tournaments/${params.slug}`);

  const supabase = createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id,slug,name,status")
    .eq("slug", params.slug)
    .single();

  if (!tournament) notFound();

  const { data: registered } = await supabase
    .from("tournament_players")
    .select("profile_id,withdrawn_at")
    .eq("tournament_id", tournament.id);

  const inList = new Set((registered ?? []).map((r: any) => r.profile_id));

  const { data: people } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_path,chesscom_username,phone,retired_at")
    .order("full_name", { ascending: true });

  const candidates = (people ?? []).filter((p: any) => !inList.has(p.id) && !p.retired_at);

  return (
    <>
      <p className="small">
        <Link href={`/tournaments/${tournament.slug}`}>{tournament.name}</Link>
      </p>
      <h1>Add players</h1>
      <p className="muted small">
        Pick the members to enter. They are registered immediately, without doing anything
        themselves.
      </p>

      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={addPlayersToTournament} style={{ marginTop: 16, maxWidth: 640 }}>
        <input type="hidden" name="tournament_id" value={tournament.id} />
        <input type="hidden" name="slug" value={tournament.slug} />

        {candidates.length === 0 ? (
          <p className="muted small">Everyone is already in this tournament.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {candidates.map((p: any) => (
              <label
                key={p.id}
                className="card"
                style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  name="profile_ids"
                  value={p.id}
                  style={{ width: 18, minHeight: 18, flexShrink: 0 }}
                />
                <Avatar name={p.full_name} path={p.avatar_path} size={34} />
                <span style={{ minWidth: 0 }}>
                  <span className="person-name" style={{ display: "block" }}>
                    {p.full_name}
                  </span>
                  <span className="person-meta" style={{ display: "block" }}>
                    {[p.chesscom_username, p.phone].filter(Boolean).join(" · ") || "No details"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {candidates.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <SubmitButton>Add selected players</SubmitButton>
          </div>
        ) : null}
      </form>
    </>
  );
}
