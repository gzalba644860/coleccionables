"use client";

import { useRef, useState, useTransition } from "react";
import { removeAvatar, saveAvatar } from "@/app/actions/profile";

const SIZE = 256;

/** Achica la foto en el navegador a 256×256 (recorte cuadrado) y la guarda como webp liviano. */
async function resize(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  canvas
    .getContext("2d")!
    .drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      SIZE,
      SIZE,
    );
  const webp = canvas.toDataURL("image/webp", 0.85);
  // Safari viejo no genera webp: cae a jpeg.
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarUpload({ hasPhoto }: { hasPhoto: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(undefined);
    start(async () => {
      try {
        const res = await saveAvatar(await resize(file));
        if (res?.error) setError(res.error);
      } catch {
        setError("No pudimos leer esa imagen. Probá con otra.");
      }
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost !py-2"
          disabled={pending}
          onClick={() => input.current?.click()}
        >
          {pending ? "Subiendo…" : hasPhoto ? "Cambiar foto" : "Subir foto"}
        </button>
        {hasPhoto && (
          <button
            type="button"
            className="text-sm text-danger underline"
            disabled={pending}
            onClick={() => start(() => removeAvatar())}
          >
            Quitar
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
