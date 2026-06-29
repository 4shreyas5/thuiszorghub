import { ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className={`w-full text-sm text-left text-gray-900 dark:text-white ${className}`}>
        {children}
      </table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return (
    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
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
          <td colSpan={99} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
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
}

export function TableRow({ children, hover = true, onClick }: TableRowProps) {
  return (
    <tr
      className={`
        border-b border-gray-200 dark:border-gray-700
        ${hover ? "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" : ""}
        ${onClick ? "cursor-pointer" : ""}
      `}
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
      className={`px-6 py-3 font-semibold text-gray-900 dark:text-white ${className}`}
      onClick={sortable ? onSort : undefined}
      role={sortable ? "button" : undefined}
      tabIndex={sortable ? 0 : undefined}
    >
      <div
        className={`flex items-center gap-2 ${sortable ? "cursor-pointer hover:text-blue-600" : ""}`}
      >
        {children}
        {sortable && sortDirection === "asc" && <ChevronUp className="w-4 h-4" />}
        {sortable && sortDirection === "desc" && <ChevronDown className="w-4 h-4" />}
      </div>
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function TableCell({ children, className = "", align = "left" }: TableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return <td className={`px-6 py-4 ${alignClass} ${className}`}>{children}</td>;
}
