/** Foto de perfil redonda, o la inicial del nombre si no subió foto. */
export function Avatar({
  user,
  size = 40,
}: {
  user: { id: number; displayName: string; avatarVersion: number };
  size?: number;
}) {
  const style = { width: size, height: size };
  if (user.avatarVersion > 0) {
    return (
      <img
        src={`/avatar/${user.id}?v=${user.avatarVersion}`}
        alt=""
        style={style}
        className="shrink-0 rounded-full border border-border bg-background object-cover"
      />
    );
  }
  return (
    <span
      style={{ ...style, fontSize: size * 0.45 }}
      className="grid shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-fg"
      aria-hidden
    >
      {user.displayName.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
