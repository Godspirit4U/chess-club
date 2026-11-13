import { Bar, Heading } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Heading />

      {[0, 1, 2].map((group) => (
        <section key={group} style={{ marginTop: group === 0 ? 0 : 28 }}>
          <Bar width="28%" height={16} radius={3} />
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {[0, 1].map((row) => (
              <div key={row} className="card" aria-hidden="true">
                <Bar width="50%" height={14} />
                <div style={{ height: 8 }} />
                <Bar width="32%" height={10} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
