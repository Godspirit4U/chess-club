import { Bar, Heading } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Heading />
      <div className="grid two">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ height: 132 }} aria-hidden="true">
            <Bar width="30%" height={10} />
            <div style={{ height: 10 }} />
            <Bar width="80%" height={16} />
            <div style={{ height: 10 }} />
            <Bar width="95%" height={10} />
          </div>
        ))}
      </div>
    </div>
  );
}
