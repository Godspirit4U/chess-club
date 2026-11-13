import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import PageLoader from "@/components/PageLoader";
import SiteFooter from "@/components/SiteFooter";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    default: "SaiU Chess Club",
    template: "%s | SaiU Chess Club"
  },
  description:
    "Tournaments, pairings, puzzles and results for the SaiU Chess Club.",
  openGraph: {
    title: "SaiU Chess Club",
    description: "Tournaments, pairings, the points table and a puzzle a day.",
    siteName: "SaiU Chess Club",
    type: "website"
  },
  twitter: { card: "summary_large_image" }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader
          signedIn={Boolean(profile)}
          isAdmin={Boolean(profile && profile.role !== "member")}
          name={profile?.full_name}
        />
        <PageLoader />
        <main id="main">
          <div className="container">{children}</div>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
