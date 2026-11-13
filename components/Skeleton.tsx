export function Bar({
  width = "100%",
  height = 12,
  radius = 3
}: {
  width?: number | string;
  height?: number;
  radius?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
        background: "var(--border)"
      }}
    />
  );
}

export function Panel({ height = 120 }: { height?: number }) {
  return (
    <div className="card" style={{ height, background: "var(--surface)" }} aria-hidden="true">
      <Bar width="40%" />
      <div style={{ height: 10 }} />
      <Bar width="70%" />
    </div>
  );
}

export function Heading() {
  return (
    <div style={{ paddingTop: 12, paddingBottom: 18 }} aria-hidden="true">
      <Bar width="38%" height={26} radius={4} />
    </div>
  );
}
