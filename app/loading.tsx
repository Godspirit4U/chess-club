export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading page" style={{ paddingTop: 8 }}>
      <div
        style={{
          height: 3,
          width: "100%",
          borderRadius: 3,
          background:
            "linear-gradient(90deg, var(--border) 0%, var(--accent) 50%, var(--border) 100%)",
          backgroundSize: "200% 100%",
          animation: "pageSweep 1.1s linear infinite"
        }}
      />
    </div>
  );
}
