"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  className = "btn",
  name,
  value,
  style
}: {
  children: React.ReactNode;
  className?: string;
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
      style={{ cursor: pending ? "progress" : "pointer", ...style }}
    >
      {pending ? (
        <span className="dots" aria-label="Working">
          <span />
          <span />
          <span />
        </span>
      ) : (
        children
      )}
    </button>
  );
}
