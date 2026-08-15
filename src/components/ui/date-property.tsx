'use client';
import { useState, useEffect, useMemo } from 'react';
import { DatePicker } from './date-picker';
import { Timestamp } from 'firebase/firestore';
import { type VariantProps } from 'class-variance-authority';
import { buttonVariants, Button } from './button';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CustomCalendar } from '@/components/ui/custom-calendar';

const toDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (
    typeof value === 'object' &&
    'seconds' in value &&
    typeof value.seconds === 'number'
  ) {
    // Firebase Timestamp
    return (value as Timestamp).toDate();
  }
  const parsedDate = new Date(value);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  return undefined;
};

interface DatePropertyProps {
  value: any;
  onSave: (date: Date | undefined) => void;
  placeholder: string;
  disabled?: (date: Date) => boolean;
  highlightToday?: boolean;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DateProperty = ({
  value,
  onSave,
  placeholder,
  disabled,
  highlightToday,
  variant,
  open,
  onOpenChange,
}: DatePropertyProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const isCalendarOpen = isControlled ? open : internalOpen;
  const setCalendarOpen = isControlled ? onOpenChange || setInternalOpen : setInternalOpen;
  
  const [currentDate, setCurrentDate] = useState<Date | undefined>(() =>
    toDate(value)
  );

  useEffect(() => {
    setCurrentDate(toDate(value));
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setCurrentDate(selectedDate);
    onSave(selectedDate);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDateSelect(undefined);
    setCalendarOpen(false);
  };

  // Original ghost UI for issue detail panel
  if (variant === 'ghost') {
    return (
      <div className="group relative flex w-full items-center">
        <DatePicker
          date={currentDate}
          setDate={handleDateSelect}
          placeholder={placeholder}
          open={isCalendarOpen}
          onOpenChange={setCalendarOpen}
          disabled={disabled}
          highlightToday={highlightToday}
          variant={variant}
          className={cn('w-full group-hover:bg-muted')}
        />
        {currentDate && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleClear}
            aria-label="Clear date"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // New UI for create-issue-dialog
  return (
    <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-auto items-center justify-between border border-input bg-background px-2 py-1 text-xs font-bold uppercase tracking-tight hover:bg-muted focus:outline-none focus:ring-0 data-[state=open]:bg-muted transition-all active:scale-95 cursor-pointer rounded-md shadow-sm'
          )}
        >
          <div className="flex flex-grow items-center gap-1.5 text-left text-foreground">
            <CalendarIcon className="h-4 w-4 text-muted-foreground opacity-70" />
            <span className="whitespace-nowrap">
              {currentDate ? format(currentDate, 'MMM dd, yyyy') : placeholder}
            </span>
          </div>

          {currentDate && (
            <div
              className="ml-1.5 -mr-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              onClick={handleClear}
              role="button"
              aria-label="Clear date"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CustomCalendar
          selected={currentDate}
          onSelect={(date) => {
            handleDateSelect(date);
            setCalendarOpen(false);
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
};