"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export async function setRole(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "super_admin") redirect("/admin");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member");

  if (!["member", "admin", "super_admin"].includes(role)) redirect("/admin/people");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("email", email)
    .select("id");

  if (error || !data?.length) {
    redirect(
      `/admin/people?error=${encodeURIComponent(
        error?.message ?? "No account uses that email. They must sign up first."
      )}`
    );
  }

  revalidatePath("/admin/people");
  redirect("/admin/people");
}
