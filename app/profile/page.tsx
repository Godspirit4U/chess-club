import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <>
        <h1>Your profile</h1>
        <p className="muted">Sign in to see your tournaments, your games and your puzzle count.</p>
        <p>
          <Link className="btn" href="/login">
            Sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1>{profile.full_name}</h1>
      <p className="muted">
        {profile.email}
        {profile.role !== "member" ? ` · ${profile.role.replace("_", " ")}` : ""}
      </p>

      <div className="grid two" style={{ marginTop: 24 }}>
        <div className="card">
          <h2>Tournaments</h2>
          <p className="muted">Nothing played yet. Your results appear here after your first event.</p>
        </div>
        <div className="card">
          <h2>Puzzles solved</h2>
          <p className="muted">0 so far. Solve today&rsquo;s puzzle to start the count.</p>
        </div>
      </div>

      <p style={{ marginTop: 20 }}>
        <Link href="/profile/edit">Edit profile</Link>
      </p>

      <form action={signOut} style={{ marginTop: 24 }}>
        <button className="btn secondary" type="submit">
          Sign out
        </button>
      </form>
    </>
  );
}
