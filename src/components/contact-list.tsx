import type { ContactKind } from "@/db/schema";

const LABEL: Record<ContactKind, string> = {
  whatsapp: "WhatsApp",
  telefono: "Teléfono",
  email: "Email",
  instagram: "Instagram",
  telegram: "Telegram",
  otro: "Otro",
};

export function contactLabel(kind: ContactKind) {
  return LABEL[kind];
}

function href(kind: ContactKind, value: string) {
  const handle = value.replace(/^@/, "");
  switch (kind) {
    case "whatsapp":
      return `https://wa.me/${value.replace(/\D/g, "")}`;
    case "telefono":
      return `tel:${value.replace(/[^\d+]/g, "")}`;
    case "email":
      return `mailto:${value}`;
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "telegram":
      return `https://t.me/${handle}`;
    default:
      return undefined;
  }
}

export function ContactList({
  contacts,
}: {
  contacts: { id: number; kind: ContactKind; value: string }[];
}) {
  if (!contacts.length) {
    return <p className="text-sm text-muted">Este usuario no cargó medios de contacto.</p>;
  }
  return (
    <ul className="grid gap-2">
      {contacts.map((c) => {
        const link = href(c.kind, c.value);
        return (
          <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{LABEL[c.kind]}</span>
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" className="link">
                {c.value}
              </a>
            ) : (
              <span className="font-medium">{c.value}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
