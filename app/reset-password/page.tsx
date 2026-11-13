import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set a new password" };
export const dynamic = "force-dynamic";

type Props = { searchParams: { error?: string } };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  async function save(formData: FormData) {
    "use server";
    const next = String(formData.get("next") ?? "");
    const again = String(formData.get("again") ?? "");

    if (next.length < 8) {
      redirect(`/reset-password?error=${encodeURIComponent("Use at least 8 characters.")}`);
    }
    if (next !== again) {
      redirect(`/reset-password?error=${encodeURIComponent("The two passwords do not match.")}`);
    }

    const client = createClient();
    const { error } = await client.auth.updateUser({ password: next });

    if (error) {
      redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/profile");
  }

  return (
    <>
      <h1>Set a new password</h1>

      {!user ? (
        <>
          <p className="muted">
            This page only works from the link in your reset email. Open that link, or request
            a new one.
          </p>
          <p>
            <Link className="btn" href="/login?mode=forgot">
              Send a reset link
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="muted">Signed in as {user.email}.</p>

          {searchParams.error ? (
            <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>
              {searchParams.error}
            </p>
          ) : null}

          <form action={save} className="card stack" style={{ maxWidth: 460 }}>
            <div className="field">
              <label htmlFor="next">New password</label>
              <input id="next" name="next" type="password" minLength={8} required />
            </div>
            <div className="field">
              <label htmlFor="again">New password again</label>
              <input id="again" name="again" type="password" minLength={8} required />
            </div>
            <button className="btn" type="submit">
              Save password
            </button>
          </form>
        </>
      )}
    </>
  );
}
