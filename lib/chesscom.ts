/** Chess.com publishes ratings publicly, no key needed. Cached for an hour. */
export type Rating = {
  rating?: number;
  best?: number;
  win?: number;
  loss?: number;
  draw?: number;
};

export type Ratings = {
  rapid?: Rating;
  blitz?: Rating;
  bullet?: Rating;
  daily?: Rating;
};

type RawStats = Record<string, any>;

function shape(entry: any): Rating | undefined {
  if (!entry) return undefined;
  return {
    rating: entry?.last?.rating,
    best: entry?.best?.rating,
    win: entry?.record?.win,
    loss: entry?.record?.loss,
    draw: entry?.record?.draw
  };
}

export async function chesscomRatings(username: string): Promise<Ratings | null> {
  if (!username) return null;

  try {
    const res = await fetch(
      `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`,
      { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as RawStats;

    return {
      rapid: shape(data.chess_rapid),
      blitz: shape(data.chess_blitz),
      bullet: shape(data.chess_bullet),
      daily: shape(data.chess_daily)
    };
  } catch {
    return null;
  }
}

/** Picks the rating that matches the tournament's time control. */
export function ratingForTimeControl(ratings: Ratings | null, timeControl: string | null) {
  if (!ratings) return null;

  const minutes = Number(String(timeControl ?? "").replace(/[^0-9.]/g, ""));
  if (!minutes) return ratings.rapid?.rating ?? ratings.blitz?.rating ?? null;

  if (minutes <= 2) return ratings.bullet?.rating ?? ratings.blitz?.rating ?? null;
  if (minutes <= 5) return ratings.blitz?.rating ?? ratings.rapid?.rating ?? null;
  return ratings.rapid?.rating ?? ratings.blitz?.rating ?? null;
}
