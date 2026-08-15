
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: (date: Date) => boolean;
  highlightToday?: boolean;
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

export function DatePicker({
  date,
  setDate,
  placeholder = "Select a date",
  className,
  open,
  onOpenChange,
  disabled,
  highlightToday = true,
  variant = 'outline'
}: DatePickerProps) {
  const handleOpenChange = (newOpenState: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpenState);
    }
  };
  
  const isDateToday = React.useMemo(() => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, [date]);
  
  return (
    <Popover modal={false} open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          className={cn(
            "w-auto inline-flex justify-start text-left font-normal",
            // Base text colors
            isDateToday && highlightToday && "text-destructive",
            
            // Explicitly set hover text colors to prevent the button's
            // variant styles from changing it. This ensures the color remains
            // consistent during the hover state.
            !date
              ? "hover:text-foreground"
              : isDateToday && highlightToday
              ? "hover:text-destructive"
              : "hover:text-foreground",

            className
          )}
        >
          {variant !== 'ghost' && <CalendarIcon className="mr-2 h-4 w-4" />}
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 pointer-events-auto"
        align="start"
        onInteractOutside={(e) => {
          if (
            (e.target as HTMLElement).closest(
              '[data-radix-popper-content-wrapper]'
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <CustomCalendar
          selected={date}
          onSelect={(selectedDate, isFinal) => {
            if (isFinal) {
              setDate(selectedDate)
              if (onOpenChange) {
                onOpenChange(false)
              }
            }
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
