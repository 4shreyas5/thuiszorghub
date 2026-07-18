"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

export type CalendarProps = DayPickerProps;

export function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        month_caption: "flex items-center justify-center pt-1 relative",
        caption_label: "text-sm font-medium text-foreground",
        nav: "flex items-center gap-1 absolute inset-x-0 justify-between",
        button_previous: cn(
          "h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
        ),
        button_next: cn(
          "h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-xs",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button:
          "h-9 w-9 rounded-md font-normal text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        today: "[&>button]:border [&>button]:border-primary",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-30",
        hidden: "invisible",
        range_start: "[&>button]:bg-primary [&>button]:text-primary-foreground",
        range_end: "[&>button]:bg-primary [&>button]:text-primary-foreground",
        range_middle: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        ...props.classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
          ) : (
            <ChevronRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
          ),
      }}
      {...props}
    />
  );
}
