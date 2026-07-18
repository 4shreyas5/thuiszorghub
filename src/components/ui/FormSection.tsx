import { ReactNode } from "react";
import { Card, CardHeader, CardTitle } from "./Card";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Groups related form fields under an elevated card with a title and
 * optional contextual description - the standard shape for premium,
 * section-grouped forms (see /admin/organization for the reference usage).
 */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card bordered padding="md">
      <CardHeader className="mb-6 pb-4">
        <CardTitle size="sm">{title}</CardTitle>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>
    </Card>
  );
}
