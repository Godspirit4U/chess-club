import type { Metadata } from "next";
import Link from "next/link";
import { requestReset, signIn, signUp } from "@/app/auth/actions";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = { title: "Sign in" };

type Props = {
  searchParams: { mode?: string; error?: string; sent?: string };
};

export default function LoginPage({ searchParams }: Props) {
  const isSignUp = searchParams.mode === "signup";
  const isForgot = searchParams.mode === "forgot";
  const error = searchParams.error;
  const sent = searchParams.sent;

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>{isSignUp ? "Create your account" : isForgot ? "Reset your password" : "Sign in"}</h1>
      <p className="muted">
        {isSignUp
          ? "Use your Sai University email, like name.batch@scds.saiuniversity.edu.in. Your account works immediately."
          : isForgot
            ? "We will email you a link to set a new password."
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

      {sent ? (
        <p
          role="status"
          style={{
            border: "1px solid #cfe0d3",
            background: "var(--tint)",
            color: "var(--accent-dark)",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 14
          }}
        >
          If that address has an account, a reset link is on its way.
        </p>
      ) : null}

      <div className="card">
        {isForgot ? (
          <form action={requestReset} className="stack">
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
          </form>
        ) : isSignUp ? (
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
            <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
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
            <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
          </form>
        )}
      </div>

      <p className="small" style={{ marginTop: 16 }}>
        {isSignUp ? (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        ) : isForgot ? (
          <>
            Remembered it? <Link href="/login">Sign in</Link>
          </>
        ) : (
          <>
            New to the club? <Link href="/login?mode=signup">Create an account</Link>
            <br />
            <Link href="/login?mode=forgot">Forgot your password?</Link>
          </>
        )}
      </p>
    </div>
  );
}
