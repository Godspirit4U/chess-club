import { Bar, Heading } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Heading />
      <div className="grid two">
        <div className="card" aria-hidden="true">
          <div
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              background: "var(--border)",
              borderRadius: 4
            }}
          />
        </div>
        <div className="card" aria-hidden="true">
          <Bar width="50%" height={16} />
          <div style={{ height: 12 }} />
          <Bar width="80%" height={10} />
          <div style={{ height: 8 }} />
          <Bar width="60%" height={10} />
        </div>
      </div>
    </div>
  );
}
