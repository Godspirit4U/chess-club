import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Change password" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string; saved?: string } };

export default async function ChangePasswordPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  async function save(formData: FormData) {
    "use server";
    const me = await getCurrentProfile();
    if (!me) redirect("/login");

    const current = String(formData.get("current") ?? "");
    const next = String(formData.get("next") ?? "");
    const again = String(formData.get("again") ?? "");

    if (next.length < 8) {
      redirect(`/profile/password?error=${encodeURIComponent("Use at least 8 characters.")}`);
    }

    if (next !== again) {
      redirect(`/profile/password?error=${encodeURIComponent("The two new passwords do not match.")}`);
    }

    const supabase = createClient();

    // Verify the current password before allowing a change.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: me.email,
      password: current
    });

    if (signInError) {
      redirect(`/profile/password?error=${encodeURIComponent("That is not your current password.")}`);
    }

    const { error } = await supabase.auth.updateUser({ password: next });

    if (error) {
      redirect(`/profile/password?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/profile/password?saved=1");
  }

  return (
    <>
      <p className="small">
        <Link href="/profile">Profile</Link>
      </p>
      <h1>Change password</h1>

      {searchParams.saved ? (
        <p role="status" style={{ color: "var(--accent)", fontSize: 14 }}>
          Password changed.
        </p>
      ) : null}
      {searchParams.error ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
          {searchParams.error}
        </p>
      ) : null}

      <form action={save} className="card stack" style={{ marginTop: 16, maxWidth: 460 }}>
        <div className="field">
          <label htmlFor="current">Current password</label>
          <input id="current" name="current" type="password" autoComplete="current-password" required />
        </div>
        <div className="field">
          <label htmlFor="next">New password</label>
          <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div className="field">
          <label htmlFor="again">New password again</label>
          <input id="again" name="again" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <button className="btn" type="submit">
          Change password
        </button>
      </form>

      <p className="small" style={{ marginTop: 16 }}>
        Forgot it instead? <Link href="/login?mode=forgot">Reset it by email</Link>
      </p>
    </>
  );
}
