import { ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface TableProps {
  children: ReactNode;
  className?: string;
  /** Keeps the header row pinned while the table body scrolls. */
  stickyHeader?: boolean;
}

export function Table({ children, className = "", stickyHeader = false }: TableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border",
        stickyHeader && "max-h-[70vh] overflow-y-auto"
      )}
    >
      <table className={cn("w-full text-sm text-left text-foreground", className)}>
        {children}
      </table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
  sticky?: boolean;
}

export function TableHead({ children, sticky = false }: TableHeadProps) {
  return (
    <thead
      className={cn("bg-muted/40 border-b border-border", sticky && "sticky top-0 z-10 bg-card")}
    >
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function TableBody({
  children,
  isEmpty = false,
  emptyMessage = "No data available",
}: TableBodyProps) {
  if (isEmpty) {
    return (
      <tbody>
        <tr>
          <td colSpan={99} className="px-6 py-8 text-center text-muted-foreground">
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return <tbody>{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  hover?: boolean;
  onClick?: () => void;
  /** Marks the row as selected (e.g. via a leading checkbox column) - a
   *  subtle tint + left accent, for modules that build bulk actions on top
   *  of this primitive. */
  selected?: boolean;
}

export function TableRow({ children, hover = true, onClick, selected = false }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-border last:border-0 transition-colors",
        hover && "hover:bg-accent/50",
        onClick && "cursor-pointer",
        selected && "bg-primary/5 border-l-2 border-l-primary hover:bg-primary/8"
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableHeaderCellProps {
  children: ReactNode;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
  className?: string;
}

export function TableHeaderCell({
  children,
  sortable = false,
  sortDirection = null,
  onSort,
  className = "",
}: TableHeaderCellProps) {
  return (
    <th
      className={cn(
        "px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className
      )}
      onClick={sortable ? onSort : undefined}
      role={sortable ? "button" : undefined}
      tabIndex={sortable ? 0 : undefined}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          sortable && "cursor-pointer hover:text-foreground select-none"
        )}
      >
        {children}
        {sortable && sortDirection === "asc" && (
          <ChevronUp className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
        )}
        {sortable && sortDirection === "desc" && (
          <ChevronDown className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
        )}
      </div>
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function TableCell({ children, className = "", align = "left" }: TableCellProps) {
  return <td className={cn("px-6 py-5", alignClass[align], className)}>{children}</td>;
}
