import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string; saved?: string } };

export default async function EditProfilePage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  async function save(formData: FormData) {
    "use server";
    const me = await getCurrentProfile();
    if (!me) redirect("/login");

    const fullName = String(formData.get("full_name") ?? "").trim();
    const chessUsername = String(formData.get("chess_username") ?? "").trim();

    if (!fullName) {
      redirect(`/profile/edit?error=${encodeURIComponent("A name is required.")}`);
    }

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ full_name: fullName, chess_username: chessUsername || null })
      .eq("id", me.id);

    redirect("/profile/edit?saved=1");
  }

  return (
    <>
      <p className="small">
        <Link href="/profile">Profile</Link>
      </p>
      <h1>Edit profile</h1>

      {searchParams.saved ? (
        <p role="status" style={{ color: "var(--accent)", fontSize: 14 }}>
          Saved.
        </p>
      ) : null}
      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={save} className="card stack" style={{ marginTop: 16, maxWidth: 480 }}>
        <div className="field">
          <label htmlFor="full_name">Full name</label>
          <input id="full_name" name="full_name" defaultValue={profile.full_name} required />
        </div>
        <div className="field">
          <label htmlFor="chess_username">Lichess or Chess.com username</label>
          <input
            id="chess_username"
            name="chess_username"
            defaultValue={profile.chess_username ?? ""}
            placeholder="optional"
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" value={profile.email} disabled />
          <p className="muted small" style={{ marginTop: 4 }}>
            Your email is the account itself and cannot be changed here.
          </p>
        </div>
        <button className="btn" type="submit">
          Save changes
        </button>
      </form>
    </>
  );
}
