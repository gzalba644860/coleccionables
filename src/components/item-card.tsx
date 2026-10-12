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
    <div className="card flex flex-col overflow-hidden">
      <Link href={`/item/${item.id}`} className="block">
        <ItemImage code={item.code} name={item.name} section={item.section} imageKey={item.imageKey} />
        <div className="p-2">
          <p className="line-clamp-1 text-sm font-medium">
            <span className="text-muted">{item.code}</span> {item.name}
          </p>
          {(item.subtitle || item.section) && (
            <p className="line-clamp-1 text-xs text-muted">{item.subtitle ?? item.section}</p>
          )}
          {item.variant && item.variant !== "normal" && (
            <p className="text-xs text-accent">{item.variant}</p>
          )}
          {(item.holders !== undefined || item.seekers !== undefined) && (
            <p className="mt-1 text-xs">
              <span className="text-have">{item.holders ?? 0} lo tienen</span>
              {" · "}
              <span className="text-want">{item.seekers ?? 0} lo buscan</span>
            </p>
          )}
        </div>
      </Link>
      <div className="mt-auto p-2 pt-0">
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {children}
    </div>
  );
}

export function GridSkeleton({ n = 10 }: { n?: number }) {
  return (
    <ItemGrid>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card aspect-[3/4] animate-pulse" />
      ))}
    </ItemGrid>
  );
}
