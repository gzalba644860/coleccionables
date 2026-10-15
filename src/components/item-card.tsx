import Link from "next/link";
import { ItemImage } from "./item-image";
import { ItemActions } from "./item-actions";

export type ItemCardData = {
  id: number;
  code: string;
  name: string;
  section?: string | null;
  variant?: string;
  imageKey: string | null;
  subtitle?: string;
  holders?: number;
  seekers?: number;
};

export function ItemCard({
  item,
  status,
  loggedIn,
}: {
  item: ItemCardData;
  status?: { tengo?: number; busco?: boolean };
  loggedIn: boolean;
}) {
  return (
    <div className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/item/${item.id}`} className="block">
        <div className="relative bg-subtle p-2 pb-0 sm:p-2.5 sm:pb-0">
          <ItemImage
            code={item.code}
            name={item.name}
            section={item.section}
            imageKey={item.imageKey}
            className="rounded-lg shadow-soft"
          />
          {(status?.tengo || status?.busco) && (
            <span
              className={`absolute right-3.5 top-3.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft ${
                status.tengo ? "bg-have" : "bg-want"
              }`}
            >
              {status.tengo ? (status.tengo > 1 ? `Tengo ×${status.tengo}` : "Tengo") : "Busco"}
            </span>
          )}
        </div>
        <div className="grid gap-0.5 px-2.5 pb-2 pt-2.5">
          <p className="line-clamp-1 text-sm font-semibold leading-tight">
            <span className="font-mono text-[11px] font-semibold text-muted">{item.code}</span>{" "}
            {item.name}
          </p>
          {(item.subtitle || item.section) && (
            <p className="line-clamp-1 text-xs text-muted">{item.subtitle ?? item.section}</p>
          )}
          {item.variant && item.variant !== "normal" && (
            <p className="text-xs font-medium text-accent">✦ {item.variant}</p>
          )}
          {(item.holders !== undefined || item.seekers !== undefined) && (
            <p className="mt-1 flex gap-2 text-xs font-medium">
              <span className="text-have">{item.holders ?? 0} lo tienen</span>
              <span className="text-want">{item.seekers ?? 0} lo buscan</span>
            </p>
          )}
        </div>
      </Link>
      <div className="mt-auto px-2.5 pb-2.5">
        <ItemActions
          itemId={item.id}
          tengo={status?.tengo}
          busco={status?.busco}
          loggedIn={loggedIn}
        />
      </div>
    </div>
  );
}

export function ItemGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
      {children}
    </div>
  );
}

export function GridSkeleton({ n = 10 }: { n?: number }) {
  return (
    <ItemGrid>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card grid gap-2 p-2.5">
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-subtle" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-subtle" />
          <div className="h-8 animate-pulse rounded-lg bg-subtle" />
        </div>
      ))}
    </ItemGrid>
  );
}
