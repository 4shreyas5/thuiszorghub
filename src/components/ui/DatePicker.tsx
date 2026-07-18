"use client";

import { useId, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";
import { FieldWrapper, fieldControlClasses } from "./FieldWrapper";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Calendar } from "./Calendar";

interface DatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  className?: string;
}

export function DatePicker({
  label,
  error,
  helperText,
  required,
  disabled,
  placeholder = "Select a date",
  value,
  onChange,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerId = useId();

  return (
    <FieldWrapper
      label={label}
      required={required}
      error={error}
      helperText={helperText}
      htmlFor={triggerId}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={disabled}
            className={cn(
              fieldControlClasses(!!error, "flex items-center justify-between text-left"),
              !value && "text-muted-foreground",
              className
            )}
          >
            {value ? format(value, "d MMMM yyyy", { locale: nl }) : placeholder}
            <CalendarIcon className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
            locale={nl}
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
}
