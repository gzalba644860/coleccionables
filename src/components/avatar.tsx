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
        className="shrink-0 rounded-full border border-border bg-subtle object-cover"
      />
    );
  }
  // Color estable por usuario, para distinguir a la gente sin foto.
  const hue = (user.id * 47) % 360;
  return (
    <span
      style={{
        ...style,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, hsl(${hue} 70% 58%), hsl(${(hue + 30) % 360} 65% 42%))`,
      }}
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      aria-hidden
    >
      {user.displayName.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
