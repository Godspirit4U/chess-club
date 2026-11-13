export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" style={{ paddingTop: 12 }}>
      <p className="muted small">Loading…</p>
      <div
        style={{
          height: 28,
          width: "55%",
          background: "var(--border)",
          borderRadius: 4,
          marginBottom: 18
        }}
      />
      <div className="grid two">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="card"
            style={{ height: 120, background: "var(--surface)" }}
            aria-hidden="true"
          >
            <div
              style={{
                height: 12,
                width: "40%",
                background: "var(--border)",
                borderRadius: 3,
                marginBottom: 10
              }}
            />
            <div
              style={{
                height: 12,
                width: "70%",
                background: "var(--border)",
                borderRadius: 3
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
