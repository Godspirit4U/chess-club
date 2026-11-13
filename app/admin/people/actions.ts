"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/admin");
  return profile;
}


async function countSuperAdmins(supabase: ReturnType<typeof createClient>) {
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  return count ?? 0;
}

export async function changeRole(formData: FormData) {
  const me = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "member");

  if (!["member", "admin", "super_admin"].includes(role)) redirect("/admin/people");
  if (id === me.id && role !== me.role) {
    redirect(`/admin/people?error=${encodeURIComponent("You cannot change your own role.")}`);
  }

  const supabase = createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id,role")
    .eq("id", id)
    .single();

  if (!target) redirect(`/admin/people?error=${encodeURIComponent("That person no longer exists.")}`);

  if (me.role !== "super_admin") {
    redirect(
      `/admin/people?error=${encodeURIComponent(
        "Only a super admin can change anyone's role."
      )}`
    );
  }

  if (target!.role === "super_admin" && role !== "super_admin") {
    const supers = await countSuperAdmins(supabase);
    if (supers <= 1) {
      redirect(
        `/admin/people?error=${encodeURIComponent(
          "This is the last super admin. Promote someone else first."
        )}`
      );
    }
  }

  await supabase.from("profiles").update({ role }).eq("id", id);

  revalidatePath("/admin/people");
  redirect("/admin/people");
}

export async function removeMember(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "");

  if (id === me.id) {
    redirect(`/admin/people?error=${encodeURIComponent("You cannot remove your own account.")}`);
  }

  const supabaseCheck = createClient();
  const { data: target } = await supabaseCheck
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();

  if (target?.role === "super_admin") {
    const supers = await countSuperAdmins(supabaseCheck);
    if (supers <= 1) {
      redirect(
        `/admin/people?error=${encodeURIComponent(
          "This is the last super admin. Promote someone else first."
        )}`
      );
    }
  }

  if (me.role !== "super_admin" && target?.role !== "member") {
    redirect(
      `/admin/people?error=${encodeURIComponent("Only a super admin can remove an admin.")}`
    );
  }

  if (!hasServiceRole) {
    redirect(
      `/admin/people?error=${encodeURIComponent(
        "Removing a member needs the service role key in the environment variables."
      )}`
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);

    if (error) {
      redirect(`/admin/people?error=${encodeURIComponent(`Could not remove: ${error.message}`)}`);
    }

    // The profile row normally disappears with the auth user; make sure it has.
    await admin.from("profiles").delete().eq("id", id);
  } catch (err) {
    // redirect() throws by design, so let it through.
    if (err && typeof err === "object" && "digest" in err) throw err;
    redirect(
      `/admin/people?error=${encodeURIComponent(
        err instanceof Error ? err.message : "Could not remove that member."
      )}`
    );
  }

  revalidatePath("/admin/people");
  redirect(`/admin/people?done=${encodeURIComponent(`${email} removed`)}`);
}

export async function addMember(formData: FormData) {
  await requireAdmin();

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


export async function retireMember(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "Member");

  if (id === me.id) {
    redirect(`/admin/people?error=${encodeURIComponent("You cannot retire your own account.")}`);
  }

  const supabase = createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();

  if (target?.role === "super_admin") {
    const supers = await countSuperAdmins(supabase);
    if (supers <= 1) {
      redirect(
        `/admin/people?error=${encodeURIComponent(
          "This is the last super admin. Promote someone else first."
        )}`
      );
    }
  }

  if (me.role !== "super_admin" && target?.role !== "member") {
    redirect(
      `/admin/people?error=${encodeURIComponent("Only a super admin can retire an admin.")}`
    );
  }

  await supabase
    .from("profiles")
    .update({ retired_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/people");
  redirect(`/admin/people?done=${encodeURIComponent(`${name} retired`)}`);
}

export async function unretireMember(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "Member");

  const supabase = createClient();
  await supabase.from("profiles").update({ retired_at: null }).eq("id", id);

  revalidatePath("/admin/people");
  redirect(`/admin/people?done=${encodeURIComponent(`${name} is active again`)}`);
}
