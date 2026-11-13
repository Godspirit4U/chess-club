import { Bar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Bar width="20%" height={10} />
      <div style={{ height: 14 }} />
      <Bar width="55%" height={28} radius={4} />
      <div style={{ height: 10 }} />
      <Bar width="40%" height={12} />

      <div className="card" style={{ marginTop: 20 }} aria-hidden="true">
        <Bar width="25%" height={14} />
        <div style={{ height: 12 }} />
        <Bar width="90%" height={10} />
        <div style={{ height: 8 }} />
        <Bar width="75%" height={10} />
      </div>

      <div className="card" style={{ marginTop: 16 }} aria-hidden="true">
        <Bar width="30%" height={14} />
        <div style={{ height: 14 }} />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: "1px solid var(--border)" }}
          >
            <Bar width={28} height={10} />
            <Bar width="45%" height={10} />
            <Bar width="25%" height={10} />
          </div>
        ))}
      </div>
    </div>
  );
}
