"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pollMessages, sendMessage } from "@/app/actions/messages";
import type { ChatMessage } from "@/lib/messages";

const POLL_MS = 4000;

function formatTime(ms: number) {
  const d = new Date(ms);
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} ${time}`;
}

/**
 * Chat sin servicios externos: consulta mensajes nuevos cada pocos
 * segundos mientras la pestaña está visible.
 */
export function Chat({
  conversationId,
  meId,
  showAuthors,
  initial,
}: {
  conversationId: number;
  meId: number;
  showAuthors: boolean;
  initial: ChatMessage[];
}) {
  const [list, setList] = useState(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lastId = useRef(initial.at(-1)?.id ?? 0);
  const bottom = useRef<HTMLDivElement>(null);

  const append = useCallback((fresh: ChatMessage[]) => {
    const news = fresh.filter((m) => m.id > lastId.current);
    if (!news.length) return;
    lastId.current = news.at(-1)!.id;
    setList((l) => [...l, ...news]);
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [list.length]);

  useEffect(() => {
    let busy = false;
    const tick = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        append(await pollMessages(conversationId, lastId.current));
      } catch {
        // Sin conexión: se reintenta en el próximo ciclo.
      } finally {
        busy = false;
      }
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [conversationId, append]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await sendMessage(conversationId, body, lastId.current);
      if ("error" in res) setError(res.error);
      else {
        append(res);
        setText("");
      }
    } catch {
      setError("No se pudo enviar. Probá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-3">
      <ul className="grid gap-2">
        {list.length === 0 && (
          <li className="py-8 text-center text-sm text-muted">Todavía no hay mensajes. ¡Escribí el primero!</li>
        )}
        {list.map((m) => {
          const mine = m.userId === meId;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${
                  mine ? "rounded-br-md bg-accent text-accent-fg shadow-soft" : "rounded-bl-md border border-border bg-card shadow-soft"
                }`}
              >
                {showAuthors && !mine && <p className="text-xs font-semibold text-want">{m.author}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-0.5 text-right text-[10px] ${mine ? "opacity-80" : "text-muted"}`}>
                  {formatTime(m.at)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={bottom} />
      <form
        onSubmit={send}
        className="sticky bottom-0 -mx-4 flex items-end gap-2 border-t border-border bg-card/90 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Escribí un mensaje…"
          className="input max-h-32 min-h-11 flex-1 resize-none !rounded-2xl"
        />
        <button className="btn-primary" disabled={sending || !text.trim()}>
          Enviar
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
