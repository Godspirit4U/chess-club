"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/profile");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!fullName) {
    redirect(`/login?mode=signup&error=${encodeURIComponent("Enter your name.")}`);
  }

  if (password.length < 8) {
    redirect(
      `/login?mode=signup&error=${encodeURIComponent("Use at least 8 characters.")}`
    );
  }

  const supabase = createClient();

  // The database enforces this too; this check exists so the message is readable.
  const { data: allowed } = await supabase.rpc("is_email_allowed", { p_email: email });

  if (allowed === false) {
    redirect(
      `/login?mode=signup&error=${encodeURIComponent(
        "Use your college email address. Only club members can create an account."
      )}`
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });

  if (error) {
    const message = /college email/i.test(error.message)
      ? "Use your college email address. Only club members can create an account."
      : error.message;
    redirect(`/login?mode=signup&error=${encodeURIComponent(message)}`);
  }

  redirect("/profile/edit?welcome=1");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(`/login?mode=forgot&error=${encodeURIComponent("Enter your email address.")}`);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saiu-chess-club.vercel.app";
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/confirm`
  });

  if (error) {
    redirect(`/login?mode=forgot&error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?mode=forgot&sent=1");
}
