import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "Chess Club",
    template: "%s | Chess Club"
  },
  description:
    "Tournaments, pairings, puzzles and results for the university chess club.",
  icons: { icon: "/favicon.ico" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>
          <div className="container">{children}</div>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
