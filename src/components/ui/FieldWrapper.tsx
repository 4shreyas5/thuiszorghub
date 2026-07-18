import { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface FieldWrapperProps {
  label?: string | undefined;
  required?: boolean | undefined;
  error?: string | undefined;
  /** Field has been validated and is known-good - shows a success cue
   *  alongside (never instead of) helperText. */
  success?: boolean | undefined;
  helperText?: string | undefined;
  htmlFor?: string | undefined;
  children: ReactNode;
  /** Extra content shown at the end of the helper/error row, e.g. a char counter. */
  footerRight?: ReactNode;
}

// Shared label / error / helper-text chrome used by Input, Textarea and
// Select - previously each of the three duplicated this markup.
export function FieldWrapper({
  label,
  required,
  error,
  success,
  helperText,
  htmlFor,
  children,
  footerRight,
}: FieldWrapperProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
          {required ? (
            <span className="ml-1 text-danger">*</span>
          ) : (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
          )}
        </label>
      )}

      {children}

      {(error || (success && !error) || helperText || footerRight) && (
        <div className="flex items-start justify-between gap-2">
          <div>
            {error ? (
              <p className="flex items-center gap-1 text-sm text-danger">
                <AlertCircle className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                {error}
              </p>
            ) : success ? (
              <p className="flex items-center gap-1 text-sm text-success">
                <CheckCircle2 className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                {helperText ?? "Looks good"}
              </p>
            ) : helperText ? (
              <p className="text-sm text-muted-foreground">{helperText}</p>
            ) : null}
          </div>
          {footerRight}
        </div>
      )}
    </div>
  );
}

export const fieldControlClasses = (
  state: boolean | "error" | "success" | "default",
  extra?: string
) => {
  const normalized = state === true ? "error" : state === false ? "default" : state;
  return cn(
    "w-full px-3.5 py-2.5 rounded-md border bg-card text-foreground transition-colors duration-150",
    "placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    normalized === "error" && "border-danger focus:ring-danger",
    normalized === "success" && "border-success focus:ring-success",
    normalized === "default" && "border-input focus:ring-ring",
    extra
  );
};
