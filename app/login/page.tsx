import type { Metadata } from "next";
import Link from "next/link";
import { signIn, signUp } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Sign in" };

type Props = {
  searchParams: { mode?: string; error?: string };
};

export default function LoginPage({ searchParams }: Props) {
  const isSignUp = searchParams.mode === "signup";
  const error = searchParams.error;

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>{isSignUp ? "Create your account" : "Sign in"}</h1>
      <p className="muted">
        {isSignUp
          ? "Members should use their college email. Your account works immediately."
          : "The email address you signed up with."}
      </p>

      {error ? (
        <p
          role="alert"
          style={{
            border: "1px solid #e3c9c9",
            background: "#fbf1f1",
            color: "#a32b2b",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 14
          }}
        >
          {error}
        </p>
      ) : null}

      <div className="card">
        {isSignUp ? (
          <form action={signUp} className="stack">
            <div className="field">
              <label htmlFor="full_name">Full name</label>
              <input id="full_name" name="full_name" autoComplete="name" required />
            </div>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <button className="btn" type="submit">
              Create account
            </button>
          </form>
        ) : (
          <form action={signIn} className="stack">
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn" type="submit">
              Sign in
            </button>
          </form>
        )}
      </div>

      <p className="small" style={{ marginTop: 16 }}>
        {isSignUp ? (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        ) : (
          <>
            New to the club? <Link href="/login?mode=signup">Create an account</Link>
          </>
        )}
      </p>
    </div>
  );
}
