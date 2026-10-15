/** Cinco estrellas con relleno parcial según el promedio (p.ej. 4.3). */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (cls: string) => (
    <span className={`flex ${cls}`} style={{ gap: size * 0.1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} size={size} />
      ))}
    </span>
  );
  return (
    <span
      className="relative inline-flex shrink-0 align-middle"
      role="img"
      aria-label={`${value.toFixed(1).replace(".", ",")} de 5 estrellas`}
    >
      {row("text-border")}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row("text-amber-400")}
      </span>
    </span>
  );
}

export function StarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden className="shrink-0">
      <path d="M10 1.5l2.6 5.3 5.9.9-4.25 4.1 1 5.85L10 14.9l-5.25 2.75 1-5.85L1.5 7.7l5.9-.9z" />
    </svg>
  );
}

/** "★ 4,8 (12)" compacto para listas; "Sin calificaciones" si no tiene. */
export function ReputationBadge({ avg, count }: { avg: number; count: number }) {
  if (!count) return <span className="text-xs text-muted">Sin calificaciones</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold">
      <span className="text-amber-400">
        <StarIcon size={13} />
      </span>
      {avg.toFixed(1).replace(".", ",")}
      <span className="font-normal text-muted">({count})</span>
    </span>
  );
}
