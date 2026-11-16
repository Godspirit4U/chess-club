/** Chess.com publishes ratings publicly, no key needed. Cached for an hour. */
export type Ratings = {
  rapid?: number;
  blitz?: number;
  bullet?: number;
  daily?: number;
};

export async function chesscomRatings(username: string): Promise<Ratings | null> {
  if (!username) return null;

  try {
    const res = await fetch(
      `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`,
      { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }
    );

    if (!res.ok) return null;

    const data = await res.json();

    return {
      rapid: data?.chess_rapid?.last?.rating,
      blitz: data?.chess_blitz?.last?.rating,
      bullet: data?.chess_bullet?.last?.rating,
      daily: data?.chess_daily?.last?.rating
    };
  } catch {
    return null;
  }
}

/** Picks the rating that matches the tournament's time control. */
export function ratingForTimeControl(ratings: Ratings | null, timeControl: string | null) {
  if (!ratings) return null;

  const minutes = Number(String(timeControl ?? "").replace(/[^0-9.]/g, ""));
  if (!minutes) return ratings.rapid ?? ratings.blitz ?? null;

  if (minutes <= 2) return ratings.bullet ?? ratings.blitz ?? null;
  if (minutes <= 5) return ratings.blitz ?? ratings.rapid ?? null;
  return ratings.rapid ?? ratings.blitz ?? null;
}
