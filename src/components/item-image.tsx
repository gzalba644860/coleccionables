import { imageUrl } from "@/lib/images";

type Props = {
  code: string;
  name: string;
  section?: string | null;
  imageKey: string | null;
  className?: string;
  compact?: boolean;
};

/** Tono estable por sección (cada selección queda siempre del mismo color). */
function hue(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

/**
 * Imagen del ítem. Si el catálogo todavía no tiene imagen cargada, dibuja
 * una ficha propia con número, nombre y sección (sin usar arte de terceros).
 */
export function ItemImage({ code, name, section, imageKey, className = "", compact }: Props) {
  if (imageKey) {
    return (
      <img
        src={imageUrl(imageKey)}
        alt={`${code} ${name}`}
        loading="lazy"
        className={`aspect-[3/4] w-full bg-background object-contain ${className}`}
      />
    );
  }
  const h = hue(section ?? code);
  return (
    <div
      role="img"
      aria-label={`${code} ${name}`}
      className={`relative flex aspect-[3/4] w-full flex-col justify-between overflow-hidden p-[8%] text-white ${className}`}
      style={{
        background: `linear-gradient(160deg, hsl(${h} 55% 42%), hsl(${(h + 40) % 360} 60% 22%))`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-[20%] -top-[10%] aspect-square w-[80%] rounded-full bg-white/10"
      />
      <span className={`font-black leading-none tracking-tight ${compact ? "text-lg" : "text-3xl"}`}>
        {code}
      </span>
      {!compact && (
        <span className="grid gap-0.5">
          <span className="line-clamp-2 text-sm font-semibold leading-tight">{name}</span>
          {section && <span className="text-[11px] uppercase tracking-wider opacity-75">{section}</span>}
        </span>
      )}
    </div>
  );
}
