import { InputHTMLAttributes, ReactNode, forwardRef, useId } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";
import { FieldWrapper, fieldControlClasses } from "./FieldWrapper";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  /** Marks the field as validated/known-good (green border + check icon). */
  success?: boolean;
  helperText?: string;
  icon?: ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      icon,
      required,
      className,
      id,
      type = "text",
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const state = error ? "error" : success ? "success" : "default";

    return (
      <FieldWrapper
        label={label}
        required={required}
        error={error}
        success={success}
        helperText={helperText}
        htmlFor={inputId}
      >
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(fieldControlClasses(state, icon ? "pl-10" : undefined), className)}
            {...props}
          />
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-danger">
              <AlertCircle className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
            </div>
          )}
          {!error && success && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
              <CheckCircle2 className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
            </div>
          )}
        </div>
      </FieldWrapper>
    );
  }
);

Input.displayName = "Input";
