import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saiu-chess-club.vercel.app";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/tournaments`, lastModified: now, priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, priority: 0.8 },
    { url: `${base}/puzzles`, lastModified: now, priority: 0.8 },
    { url: `${base}/events`, lastModified: now, priority: 0.7 },
    { url: `${base}/about`, lastModified: now, priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, priority: 0.3 }
  ];
}
