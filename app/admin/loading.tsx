import { Bar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="admin-layout" aria-busy="true" aria-live="polite">
      <aside className="admin-side" aria-hidden="true">
        <Bar width="60%" height={12} />
        <div style={{ height: 16 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <Bar width={`${70 - i * 6}%`} height={12} />
          </div>
        ))}
      </aside>

      <section aria-hidden="true">
        <Bar width="30%" height={24} radius={4} />
        <div style={{ height: 20 }} />
        <div className="grid two">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: 130 }}>
              <Bar width="40%" height={14} />
              <div style={{ height: 12 }} />
              <Bar width="85%" height={10} />
              <div style={{ height: 8 }} />
              <Bar width="60%" height={10} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
