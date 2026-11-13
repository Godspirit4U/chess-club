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

  const { data: me } = await supabase
    .from("profiles")
    .select("retired_at")
    .eq("email", email)
    .maybeSingle();

  if (me?.retired_at) {
    await supabase.auth.signOut();
    redirect(
      `/login?error=${encodeURIComponent("This account has been retired. Ask the committee.")}`
    );
  }

  redirect("/profile");
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").replace(/[^0-9]/g, "");
  const chesscom = String(formData.get("chesscom_username") ?? "").trim();

  const back = (msg: string) =>
    `/login?mode=signup&error=${encodeURIComponent(msg)}`;

  if (!fullName) redirect(back("Your name is required."));
  if (!email) redirect(back("Your email is required."));
  if (password.length < 8) redirect(back("Use at least 8 characters for the password."));
  if (phone.length < 10) redirect(back("Enter a 10-digit mobile number."));
  if (!chesscom) redirect(back("Your Chess.com username is required."));

  const supabase = createClient();

  const { data: allowed } = await supabase.rpc("is_email_allowed", { p_email: email });
  if (allowed === false) redirect(back("Use your Sai University email address."));

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        chesscom_username: chesscom
      }
    }
  });

  if (error) redirect(back(error.message));

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
