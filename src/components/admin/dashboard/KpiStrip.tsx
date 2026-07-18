import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

export interface KpiStripItem {
  key: string;
  title: string;
  value: number | null;
  icon: LucideIcon;
  href: string;
}

interface KpiStripProps {
  items: KpiStripItem[];
  loading: boolean;
}

/**
 * A light, receding summary bar - metrics divided by hairlines inside one
 * bordered strip, rather than individually elevated cards. Always visible
 * (not tucked behind a click) - "keep summary metrics visible, but
 * integrate them elegantly instead of using oversized cards." Kept as a
 * single row (horizontal scroll on narrow screens) so the divider treatment
 * stays simple and correct at every width, instead of a wrapping grid with
 * fragile per-breakpoint border logic. Each item still gets its own accent
 * strip / icon treatment / hover lift - the "premium KPI" detail without
 * restructuring into separate floating cards.
 */
export function KpiStrip({ items, loading }: KpiStripProps) {
  return (
    <Card bordered className="overflow-x-auto p-0!">
      <div className="flex min-w-max divide-x divide-border/70">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group relative flex flex-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span
              className="absolute inset-x-0 top-0 h-0.5 rounded-t-full bg-primary/0 transition-colors group-hover:bg-primary/60"
              aria-hidden="true"
            />
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <item.icon className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
            </span>
            <div className="min-w-24">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.title}
              </p>
              {loading ? (
                <Skeleton className="mt-1.5 h-6 w-8" />
              ) : (
                <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
                  {item.value ?? "—"}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
