import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string; saved?: string } };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function EditProfilePage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  async function save(formData: FormData) {
    "use server";
    const me = await getCurrentProfile();
    if (!me) redirect("/login");

    const fullName = String(formData.get("full_name") ?? "").trim();
    const platform = String(formData.get("chess_platform") ?? "none");
    const username = String(formData.get("chess_username") ?? "").trim();

    if (!fullName) {
      redirect(`/profile/edit?error=${encodeURIComponent("A name is required.")}`);
    }

    if (platform !== "none" && !username) {
      redirect(
        `/profile/edit?error=${encodeURIComponent("Add your username, or choose None.")}`
      );
    }

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        chess_platform: platform === "none" ? null : platform,
        chess_username: platform === "none" ? null : username
      })
      .eq("id", me.id);

    redirect("/profile/edit?saved=1");
  }

  const current = (profile as any).chess_platform ?? "none";

  return (
    <>
      <p className="small">
        <Link href="/profile">Profile</Link>
      </p>

      <div className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div
          aria-hidden="true"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--tint)",
            color: "var(--accent-dark)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            flexShrink: 0
          }}
        >
          {initials(profile.full_name) || "?"}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Edit profile</h1>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            {profile.email}
          </p>
        </div>
      </div>

      {searchParams.saved ? (
        <p role="status" style={{ color: "var(--accent)", fontSize: 14, marginTop: 12 }}>
          Saved.
        </p>
      ) : null}
      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14, marginTop: 12 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={save} style={{ marginTop: 16 }}>
        <div className="grid two" style={{ alignItems: "start" }}>
          <div className="card stack">
            <h2 style={{ fontSize: 16, margin: 0 }}>About you</h2>
            <p className="muted small" style={{ margin: 0 }}>
              Shown to other members in the community.
            </p>

            <div className="field" style={{ marginTop: 8 }}>
              <label htmlFor="full_name">Full name</label>
              <input id="full_name" name="full_name" defaultValue={profile.full_name} required />
            </div>

            <div className="field">
              <label htmlFor="chess_platform">Where do you play online?</label>
              <select id="chess_platform" name="chess_platform" defaultValue={current}>
                <option value="none">I do not play online</option>
                <option value="lichess">Lichess</option>
                <option value="chesscom">Chess.com</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="chess_username">Username</label>
              <input
                id="chess_username"
                name="chess_username"
                defaultValue={profile.chess_username ?? ""}
                placeholder="the name you use on that site"
              />
              <p className="muted small" style={{ margin: "6px 0 0" }}>
                Used for pairings, game links and your ratings once we pull them in.
              </p>
            </div>
          </div>

          <div className="card stack">
            <h2 style={{ fontSize: 16, margin: 0 }}>Your account</h2>
            <p className="muted small" style={{ margin: 0 }}>
              This is the address you sign in with.
            </p>

            <div className="field" style={{ marginTop: 8 }}>
              <label htmlFor="email">Email</label>
              <input id="email" value={profile.email} disabled />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="role">Role</label>
              <input
                id="role"
                value={profile.role === "member" ? "Member" : profile.role.replace("_", " ")}
                disabled
              />
              <p className="muted small" style={{ margin: "6px 0 0" }}>
                Roles are set by the committee. <Link href="/profile/password">Change password</Link>
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn" type="submit">
            Save changes
          </button>
          <Link className="btn secondary" href="/profile">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
