import { SelectHTMLAttributes, useId } from "react";
import { AlertCircle, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";
import { FieldWrapper, fieldControlClasses } from "./FieldWrapper";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | undefined;
  /** Marks the field as validated/known-good (green border + check icon). */
  success?: boolean;
  helperText?: string;
  options: Array<{ value: string | number; label: string }>;
  required?: boolean;
  placeholder?: string;
}

export function Select({
  label,
  error,
  success,
  helperText,
  options,
  required,
  className,
  id,
  disabled,
  placeholder,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const state = error ? "error" : success ? "success" : "default";

  return (
    <FieldWrapper
      label={label}
      required={required}
      error={error}
      success={success}
      helperText={helperText}
      htmlFor={selectId}
    >
      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(fieldControlClasses(state, "appearance-none pr-10"), className)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className={cn(
            ICON_SIZE.md,
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground",
            (error || success) && "right-10"
          )}
          strokeWidth={ICON_STROKE_WIDTH}
        />

        {error && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-danger">
            <AlertCircle className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
          </div>
        )}
        {!error && success && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-success">
            <CheckCircle2 className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}
