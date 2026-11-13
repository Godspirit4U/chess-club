import { Bar, Heading } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Heading />
      <div style={{ display: "grid", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="card"
            style={{ display: "flex", gap: 14, alignItems: "center" }}
            aria-hidden="true"
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 6,
                background: "var(--border)",
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1 }}>
              <Bar width="25%" height={10} />
              <div style={{ height: 10 }} />
              <Bar width="55%" height={15} />
              <div style={{ height: 8 }} />
              <Bar width="35%" height={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
