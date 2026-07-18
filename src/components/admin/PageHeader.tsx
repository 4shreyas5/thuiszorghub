import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Simple built-in action button (link or click). */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Custom action area (buttons, filters) rendered on the right. Takes
   *  precedence over `action` when both are provided. */
  actions?: ReactNode;
}

export function PageHeader({ title, description, action, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : action ? (
        <div className="shrink-0">
          {action.href ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
