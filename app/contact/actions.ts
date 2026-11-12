"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!name || !email || !body) {
    redirect(`/contact?error=${encodeURIComponent("A name, an email and a message are needed.")}`);
  }

  if (body.length > 4000) {
    redirect(`/contact?error=${encodeURIComponent("Please keep the message under 4000 characters.")}`);
  }

  const supabase = createClient();
  const { error } = await supabase.from("contact_messages").insert({ name, email, body });

  if (error) {
    redirect(`/contact?error=${encodeURIComponent("The message could not be sent. Try again.")}`);
  }

  revalidatePath("/admin/messages");
  redirect("/contact?sent=1");
}
