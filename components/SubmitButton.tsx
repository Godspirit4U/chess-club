"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  className = "btn",
  pendingLabel = "Working…",
  name,
  value,
  style
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
  style?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      style={{ opacity: pending ? 0.7 : 1, cursor: pending ? "progress" : "pointer", ...style }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
