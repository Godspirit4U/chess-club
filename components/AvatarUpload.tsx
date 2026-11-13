"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

/** Centre-crops to a square, 512px, WebP quality 0.75 — about 30 KB. */
async function square(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.75)
  );
  if (!blob) throw new Error("Could not compress the image.");
  return blob;
}

export default function AvatarUpload({
  userId,
  currentUrl,
  name
}: {
  userId: string;
  currentUrl: string | null;
  name: string;
}) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("working");
    setMessage("Preparing…");

    try {
      const blob = await square(file);
      const supabase = createClient();
      const path = `${userId}/avatar-${Date.now()}.webp`;

      setMessage("Uploading…");
      const { error } = await supabase.storage.from("avatars").upload(path, blob, {
        contentType: "image/webp",
        upsert: true
      });
      if (error) throw error;

      const { error: saveError } = await supabase
        .from("profiles")
        .update({ avatar_path: path })
        .eq("id", userId);
      if (saveError) throw saveError;

      const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      setUrl(publicUrl);
      setStatus("done");
      setMessage(`${Math.round(blob.size / 1024)} KB after compression. Saved.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      {url ? (
        <img
          src={url}
          alt={name}
          width={72}
          height={72}
          style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--tint)",
            color: "var(--accent-dark)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700
          }}
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}

      <div>
        <label htmlFor="avatar-file" className="small" style={{ fontWeight: 600 }}>
          Profile photo
        </label>
        <div>
          <input
            id="avatar-file"
            type="file"
            accept="image/*"
            onChange={onChange}
            disabled={status === "working"}
            style={{ marginTop: 4 }}
          />
        </div>
        {message ? (
          <p
            className="small"
            style={{ margin: "4px 0 0", color: status === "error" ? "var(--danger)" : "var(--muted)" }}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
