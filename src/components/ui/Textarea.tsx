import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/shared/utils/cn";
import { FieldWrapper, fieldControlClasses } from "./FieldWrapper";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | undefined;
  /** Marks the field as validated/known-good (green border). */
  success?: boolean;
  helperText?: string;
  required?: boolean;
  charLimit?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      required,
      className,
      id,
      disabled,
      charLimit,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const charCount = typeof value === "string" ? value.length : 0;
    const isOverLimit = !!charLimit && charCount > charLimit;
    const state = error ? "error" : success ? "success" : "default";

    return (
      <FieldWrapper
        label={label}
        required={required}
        error={error}
        success={success}
        helperText={helperText}
        htmlFor={textareaId}
        footerRight={
          charLimit ? (
            <p
              className={cn(
                "text-xs shrink-0",
                isOverLimit ? "text-danger" : "text-muted-foreground"
              )}
            >
              {charCount}/{charLimit}
            </p>
          ) : undefined
        }
      >
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          value={value}
          aria-invalid={!!error}
          className={cn(fieldControlClasses(state, "resize-none"), className)}
          {...props}
        />
      </FieldWrapper>
    );
  }
);

Textarea.displayName = "Textarea";
