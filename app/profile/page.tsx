import type { Metadata } from "next";
import Link from "next/link";
import { createClient, getCurrentProfile, isConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <>
        <h1>Profile</h1>
        <p className="muted">Sign in to see your tournaments, your games and your puzzle count.</p>
        <p>
          <Link className="btn" href="/login">
            Sign in
          </Link>
        </p>
      </>
    );
  }

  let tournaments = 0;
  let puzzles = 0;
  let wins = 0;
  let played = 0;

  if (isConfigured) {
    const supabase = createClient();

    const [{ count: t }, { count: p }, { data: matches }] = await Promise.all([
      supabase
        .from("tournament_players")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profile.id)
        .is("withdrawn_at", null),
      supabase
        .from("puzzle_solves")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profile.id),
      supabase
        .from("matches")
        .select("white_id,black_id,result")
        .or(`white_id.eq.${profile.id},black_id.eq.${profile.id}`)
    ]);

    tournaments = t ?? 0;
    puzzles = p ?? 0;

    for (const m of matches ?? []) {
      if (m.result === "unplayed") continue;
      played++;
      const won =
        (m.white_id === profile.id && (m.result === "white" || m.result === "forfeit_black")) ||
        (m.black_id === profile.id && (m.result === "black" || m.result === "forfeit_white"));
      if (won) wins++;
    }
  }

  return (
    <>
      <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div
          aria-hidden="true"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--tint)",
            color: "var(--accent-dark)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 700,
            flexShrink: 0
          }}
        >
          {initials(profile.full_name) || "?"}
        </div>

        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{profile.full_name}</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            {profile.email}
            {profile.role !== "member" ? ` · ${profile.role.replace("_", " ")}` : ""}
          </p>
          {profile.chess_username ? (
            <p className="muted small" style={{ margin: "2px 0 0" }}>
              {profile.chess_username}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid three" style={{ marginTop: 16 }}>
        <div className="card">
          <h2 style={{ margin: 0, fontSize: 22 }}>{tournaments}</h2>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            {tournaments === 1 ? "Tournament entered" : "Tournaments entered"}
          </p>
        </div>
        <div className="card">
          <h2 style={{ margin: 0, fontSize: 22 }}>
            {wins}<span className="muted" style={{ fontSize: 15 }}> / {played}</span>
          </h2>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            Games won
          </p>
        </div>
        <div className="card">
          <h2 style={{ margin: 0, fontSize: 22 }}>{puzzles}</h2>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            {puzzles === 1 ? "Puzzle solved" : "Puzzles solved"}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 17 }}>Your games</h2>
        <p className="muted small" style={{ margin: 0 }}>
          {played === 0
            ? "No games on record yet. Your results appear here after your first tournament."
            : `${played} ${played === 1 ? "game" : "games"} on record. Open a tournament to replay them.`}
        </p>
        <p style={{ marginTop: 10, marginBottom: 0 }}>
          <Link href="/tournaments">See your tournaments</Link>
        </p>
      </div>

      <p style={{ marginTop: 20, display: "flex", gap: 16, alignItems: "center" }}>
        <Link href="/profile/edit">Edit profile</Link>
      </p>

      <form action={signOut} style={{ marginTop: 12 }}>
        <button className="btn secondary" type="submit">
          Sign out
        </button>
      </form>
    </>
  );
}
