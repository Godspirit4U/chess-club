import type { Ratings } from "@/lib/chesscom";

const ORDER: { key: keyof Ratings; label: string }[] = [
  { key: "rapid", label: "Rapid" },
  { key: "blitz", label: "Blitz" },
  { key: "bullet", label: "Bullet" }
];

export default function RatingGrid({ ratings }: { ratings: Ratings | null }) {
  if (!ratings) return null;

  const shown = ORDER.filter((entry) => ratings[entry.key]?.rating);
  if (shown.length === 0) return null;

  return (
    <div className="rating-grid">
      {shown.map(({ key, label }) => {
        const r = ratings[key]!;
        const games = (r.win ?? 0) + (r.loss ?? 0) + (r.draw ?? 0);

        return (
          <div key={key} className="rating-tile">
            <span className="rating-label">{label}</span>
            <span className="rating-value">{r.rating}</span>
            <span className="rating-meta">
              {r.best ? `peak ${r.best}` : games ? `${games} games` : ""}
            </span>
            {games ? (
              <span className="rating-record">
                {r.win}W · {r.draw}D · {r.loss}L
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
