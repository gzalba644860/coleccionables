import Link from "next/link";
import { imageUrl } from "@/lib/images";
import { ItemActions } from "./item-actions";

export type ItemCardData = {
  id: number;
  code: string;
  name: string;
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
        <div className="relative aspect-[3/4] bg-background">
          {/* Imágenes del catálogo servidas desde el bucket/CDN, ya optimizadas. */}
          <img
            src={imageUrl(item.imageKey)}
            alt={`${item.code} ${item.name}`}
            loading="lazy"
            className="h-full w-full object-contain"
          />
          <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-xs font-bold text-white">
            {item.code}
          </span>
        </div>
        <div className="p-2">
          <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
          {item.subtitle && (
            <p className="line-clamp-1 text-xs text-muted">{item.subtitle}</p>
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
