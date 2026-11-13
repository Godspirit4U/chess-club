import { Bar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div
        className="hero"
        style={{ background: "var(--accent)", opacity: 0.55, minHeight: 168 }}
        aria-hidden="true"
      />

      <div className="grid two" style={{ marginTop: 24 }}>
        {[0, 1].map((i) => (
          <div key={i} className="card" style={{ height: 128 }} aria-hidden="true">
            <Bar width="45%" height={16} />
            <div style={{ height: 12 }} />
            <Bar width="70%" height={12} />
            <div style={{ height: 8 }} />
            <Bar width="35%" height={10} />
          </div>
        ))}
      </div>

      <div className="grid three" style={{ marginTop: 24 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="card" style={{ height: 92 }} aria-hidden="true">
            <Bar width="60%" height={12} />
            <div style={{ height: 10 }} />
            <Bar width="40%" height={10} />
          </div>
        ))}
      </div>
    </div>
  );
}
