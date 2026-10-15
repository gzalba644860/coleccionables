"use client";

import { useState } from "react";

/** Compartir la lista: WhatsApp con el mensaje armado, o copiar el link. */
export function ShareList({ text, url }: { text: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copiá el link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card grid gap-3 p-4">
      <div>
        <h2 className="font-semibold">Compartí tu lista</h2>
        <p className="text-sm text-muted">
          Mandá lo que ofrecés y lo que buscás a tus grupos de WhatsApp. El link lleva a tu perfil.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-[#25d366] text-white hover:brightness-105"
        >
          <WhatsAppIcon />
          Compartir por WhatsApp
        </a>
        <button type="button" onClick={copy} className="btn-ghost">
          {copied ? "¡Link copiado!" : "Copiar link"}
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="btn-ghost" aria-expanded={open}>
          {open ? "Ocultar mensaje" : "Ver mensaje"}
        </button>
      </div>
      {open && (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-background p-3 font-sans text-sm">
          {text}
        </pre>
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
