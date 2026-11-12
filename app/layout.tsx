import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    default: "SaiU Chess Club",
    template: "%s | SaiU Chess Club"
  },
  description:
    "Tournaments, pairings, puzzles and results for the SaiU Chess Club.",
  icons: { icon: "/favicon.ico" }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <html lang="en">
      <body>
        <SiteHeader
          signedIn={Boolean(profile)}
          isAdmin={Boolean(profile && profile.role !== "member")}
          name={profile?.full_name}
        />
        <main>
          <div className="container">{children}</div>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
