import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Max page-number buttons shown at once (excludes prev/next). */
  siblingCount?: number;
}

function getPageList(
  page: number,
  pageCount: number,
  siblingCount: number
): (number | "ellipsis")[] {
  const totalVisible = siblingCount * 2 + 5; // first, last, current, 2 ellipses
  if (pageCount <= totalVisible) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, pageCount - 1);

  const pages: (number | "ellipsis")[] = [1];
  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < pageCount - 1) pages.push("ellipsis");
  pages.push(pageCount);

  return pages;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = getPageList(page, pageCount, siblingCount);

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
      </Button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">
            &hellip;
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "primary" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pageCount}
        aria-label="Next page"
      >
        <ChevronRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
      </Button>
    </nav>
  );
}
