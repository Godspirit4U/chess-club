import { Bar, Panel } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div
          aria-hidden="true"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--border)",
            flexShrink: 0
          }}
        />
        <div style={{ flex: 1 }}>
          <Bar width="45%" height={20} radius={4} />
          <div style={{ height: 8 }} />
          <Bar width="60%" height={12} />
        </div>
      </div>

      <div className="grid three" style={{ marginTop: 16 }}>
        <Panel height={86} />
        <Panel height={86} />
        <Panel height={86} />
      </div>

      <div style={{ marginTop: 16 }}>
        <Panel height={110} />
      </div>
    </div>
  );
}
