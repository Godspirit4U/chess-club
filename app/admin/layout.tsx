import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role === "member") redirect("/");

  return (
    <div className="admin-layout">
      <AdminSidebar name={profile.full_name} />
      <section className="admin-main">{children}</section>
    </div>
  );
}
