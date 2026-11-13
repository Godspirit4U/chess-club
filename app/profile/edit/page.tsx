import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import ChessAccounts from "@/components/ChessAccounts";
import AvatarUpload from "@/components/AvatarUpload";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string; saved?: string; welcome?: string } };

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
    const phone = String(formData.get("phone") ?? "").replace(/[^0-9]/g, "");
    const platform = String(formData.get("chess_platform") ?? "none");
    const lichess = String(formData.get("lichess_username") ?? "").trim();
    const chesscom = String(formData.get("chesscom_username") ?? "").trim();

    if (!fullName) {
      redirect(`/profile/edit?error=${encodeURIComponent("A name is required.")}`);
    }

    if (phone && phone.length < 10) {
      redirect(`/profile/edit?error=${encodeURIComponent("Enter a 10-digit mobile number.")}`);
    }

    if (platform === "lichess" && !lichess) {
      redirect(`/profile/edit?error=${encodeURIComponent("Add your Lichess username.")}`);
    }
    if (platform === "chesscom" && !chesscom) {
      redirect(`/profile/edit?error=${encodeURIComponent("Add your Chess.com username.")}`);
    }
    if (platform === "both" && (!lichess || !chesscom)) {
      redirect(
        `/profile/edit?error=${encodeURIComponent("Add both usernames, or choose a single site.")}`
      );
    }

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
        chess_platform: platform === "none" ? null : platform,
        lichess_username: platform === "lichess" || platform === "both" ? lichess : null,
        chesscom_username: platform === "chesscom" || platform === "both" ? chesscom : null
      })
      .eq("id", me.id);

    redirect("/profile");
  }

  return (
    <>
      <p className="small">
        <Link href="/profile">Profile</Link>
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <AvatarUpload
          userId={profile.id}
          name={profile.full_name}
          currentUrl={
            profile.avatar_path
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_path}`
              : null
          }
        />
        <h1 style={{ margin: "14px 0 0", fontSize: 22 }}>Edit profile</h1>
        <p className="muted small" style={{ margin: "2px 0 0" }}>
          {profile.email}
        </p>
      </div>

      {searchParams.welcome ? (
        <p role="status" style={{ color: "var(--accent)", fontSize: 14, marginTop: 0 }}>
          Welcome. Add a photo and your chess usernames, then save.
        </p>
      ) : null}

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
              <input
                id="full_name"
                name="full_name"
                autoComplete="name"
                defaultValue={profile.full_name}
                required
              />
            </div>

            <ChessAccounts
              defaultPlatform={profile.chess_platform ?? "none"}
              defaultLichess={profile.lichess_username ?? ""}
              defaultChesscom={profile.chesscom_username ?? ""}
            />
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
          <SubmitButton>Save changes</SubmitButton>
          <Link className="btn secondary" href="/profile">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
