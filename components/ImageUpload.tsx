"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

/**
 * Compresses in the browser before anything leaves the device:
 * resized to 1600px on the long edge, WebP at quality 0.8, roughly 150-250 KB.
 */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.8)
  );

  if (!blob) throw new Error("Could not compress the image.");
  return blob;
}

export default function ImageUpload({
  name = "cover_path",
  folder = "events",
  initial
}: {
  name?: string;
  folder?: string;
  initial?: string | null;
}) {
  const [path, setPath] = useState(initial ?? "");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setStatus("error");
      setMessage("That image is too large. Use one under 15 MB.");
      return;
    }

    setStatus("working");
    setMessage("Compressing…");

    try {
      const blob = await compress(file);
      setMessage("Uploading…");

      const supabase = createClient();
      const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

      const { error } = await supabase.storage.from("covers").upload(key, blob, {
        contentType: "image/webp",
        upsert: false
      });

      if (error) throw error;

      setPath(key);
      setStatus("done");
      setMessage(`Ready. ${Math.round(blob.size / 1024)} KB after compression.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  return (
    <div className="field">
      <label htmlFor={`${name}-file`}>Cover image</label>
      <input type="hidden" name={name} value={path} />
      <input
        id={`${name}-file`}
        type="file"
        accept="image/*"
        onChange={onChange}
        disabled={status === "working"}
      />

      {message ? (
        <p
          className="small"
          style={{
            margin: "6px 0 0",
            color: status === "error" ? "var(--danger)" : "var(--muted)"
          }}
        >
          {message}
        </p>
      ) : null}

      {path && status === "done" ? (
        <p className="small" style={{ margin: "6px 0 0" }}>
          <button
            type="button"
            className="btn secondary"
            style={{ minHeight: 32, fontSize: 13 }}
            onClick={() => {
              setPath("");
              setStatus("idle");
              setMessage("");
            }}
          >
            Remove image
          </button>
        </p>
      ) : null}
    </div>
  );
}
