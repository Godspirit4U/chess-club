"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

async function requireSuperAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "super_admin") redirect("/admin");
  return profile;
}

export async function changeRole(formData: FormData) {
  const me = await requireSuperAdmin();

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "member");

  if (!["member", "admin", "super_admin"].includes(role)) redirect("/admin/people");
  if (id === me.id && role !== "super_admin") {
    redirect(`/admin/people?error=${encodeURIComponent("You cannot remove your own access.")}`);
  }

  const supabase = createClient();
  await supabase.from("profiles").update({ role }).eq("id", id);

  revalidatePath("/admin/people");
  redirect("/admin/people");
}

export async function removeMember(formData: FormData) {
  const me = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "");

  if (id === me.id) {
    redirect(`/admin/people?error=${encodeURIComponent("You cannot remove your own account.")}`);
  }

  if (!hasServiceRole) {
    redirect(
      `/admin/people?error=${encodeURIComponent(
        "Removing a member needs the service role key in the environment variables."
      )}`
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    redirect(`/admin/people?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/people");
  redirect(`/admin/people?done=${encodeURIComponent(`${email} removed`)}`);
}

export async function addMember(formData: FormData) {
  await requireSuperAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 8) {
    redirect(
      `/admin/people?error=${encodeURIComponent(
        "A name, an email and a password of at least 8 characters are needed."
      )}`
    );
  }

  if (!hasServiceRole) {
    redirect(
      `/admin/people?error=${encodeURIComponent(
        "Adding a member needs the service role key in the environment variables."
      )}`
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (error) {
    redirect(`/admin/people?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/people");
  redirect(`/admin/people?done=${encodeURIComponent(`${fullName} added`)}`);
}
