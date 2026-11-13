import { Bar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="community-layout" aria-busy="true" aria-live="polite">
      <aside className="community-side" aria-hidden="true">
        <Bar width="70%" height={12} />
        <div style={{ height: 14 }} />
        <Bar width="85%" height={12} />
        <div style={{ height: 8 }} />
        <Bar width="65%" height={12} />
        <div style={{ height: 8 }} />
        <Bar width="75%" height={12} />
      </aside>

      <section className="card" aria-hidden="true">
        <Bar width="30%" height={16} />
        <div style={{ height: 18 }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <Bar width={`${25 + i * 6}%`} height={10} />
            <div style={{ height: 6 }} />
            <Bar width={`${60 + i * 5}%`} height={12} />
          </div>
        ))}
      </section>
    </div>
  );
}
