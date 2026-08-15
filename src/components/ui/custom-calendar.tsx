
"use client"

import * as React from "react"
import { useEffect, useMemo, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomCalendarProps {
  selected?: Date
  onSelect: (date: Date, isFinal?: boolean) => void
  disabled?: (date: Date) => boolean
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]

export function CustomCalendar({ selected, onSelect, disabled }: CustomCalendarProps) {
  const [displayDate, setDisplayDate] = useState(selected ?? new Date())
  const [isMonthOpen, setMonthOpen] = useState(false)
  const [isYearOpen, setYearOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [decadeViewYear, setDecadeViewYear] = useState(displayDate.getFullYear());
  const today = new Date()

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (!calendarRef.current?.contains(e.target as Node)) {
        setMonthOpen(false);
        setYearOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);


  useEffect(() => {
    if (selected) {
      const selectedDate = new Date(selected);
      if (selectedDate.getMonth() !== displayDate.getMonth() || selectedDate.getFullYear() !== displayDate.getFullYear()) {
        setDisplayDate(selectedDate);
      }
    }
  }, [selected]);


  const currentMonth = displayDate.getMonth()
  const currentYear = displayDate.getFullYear()
  
  useEffect(() => {
    if (isYearOpen) {
      setDecadeViewYear(displayDate.getFullYear())
    }
  }, [isYearOpen, displayDate]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("default", { month: "long" })
  ), []);

  const years = useMemo(() => {
    const startYear = Math.floor(decadeViewYear / 10) * 10
    return Array.from({ length: 12 }, (_, i) => startYear - 1 + i)
  }, [decadeViewYear])

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
  }, [currentMonth, currentYear])

  const selectDate = (day: number) => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day)
    onSelect(newDate, true)
  }

  const changeMonth = (month: number) => {
    setDisplayDate(new Date(currentYear, month, 1))
    setMonthOpen(false)
  }

  const changeYear = (year: number) => {
    setDisplayDate(new Date(year, currentMonth, 1))
    setYearOpen(false)
  }

  const prevMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const nextMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth + 1, 1))
  }
  
  const isDayDisabled = (day: number) => {
    if (!disabled || !day) return false;
    const date = new Date(currentYear, currentMonth, day);
    return disabled(date);
  };

  const isSelected = (day: number) =>
    selected &&
    day === selected.getDate() &&
    displayDate.getMonth() === selected.getMonth() &&
    displayDate.getFullYear() === selected.getFullYear()
    
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear()
    
  const focusRingClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div ref={calendarRef} className="relative w-[300px]">
      <div
        className="relative rounded-lg bg-card p-4 shadow-md overflow-hidden"
      >
        <div className="relative mb-4 h-10 flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMonthOpen(v => !v)
                    setYearOpen(false)
                  }}
                  className="h-8 px-2"
                >
                  {months[currentMonth]}
                  <ChevronDown className="ml-1 h-4 w-4 shrink-0" />
                </Button>
                {isMonthOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-44 overflow-y-auto rounded-md bg-background p-1 shadow-lg ring-1 ring-border">
                    {months.map((m, i) => (
                      <Button
                        key={m}
                        variant="ghost"
                        onClick={() => changeMonth(i)}
                        className={cn(
                          "w-full justify-start",
                          i === currentMonth && "bg-primary text-primary-foreground"
                        )}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setYearOpen(v => !v)
                    setMonthOpen(false)
                  }}
                  className="h-8 px-2"
                >
                  {currentYear}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={prevMonth}
                  className={cn(focusRingClasses, "h-8 w-8")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={nextMonth}
                  className={cn(focusRingClasses, "h-8 w-8")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
        
        {isYearOpen && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[220px] rounded-md bg-background p-2 shadow-lg ring-1 ring-border">
            <div className="mb-2 flex items-center justify-between">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDecadeViewYear(prev => prev - 10)}
                className={cn(focusRingClasses, "h-8 w-8")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {years[1]}–{years[10]}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDecadeViewYear(prev => prev + 10)}
                className={cn(focusRingClasses, "h-8 w-8")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {years.map(y => {
                const startOfDecade =
                  Math.floor(decadeViewYear / 10) * 10
                const isOutsideDecade =
                  y < startOfDecade || y > startOfDecade + 9
                return (
                  <Button
                    key={y}
                    variant="ghost"
                    onClick={() => changeYear(y)}
                    className={cn(
                      "transition-colors",
                      focusRingClasses,
                      y === currentYear
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground",
                      isOutsideDecade && "opacity-60"
                    )}
                  >
                    {y}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mb-2 grid grid-cols-7 text-center text-sm text-muted-foreground">
          {WEEKDAYS.map((d, i) => (
            <div key={d + i}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((day, i) => (
            <div
              key={i}
              role="gridcell"
              aria-disabled={isDayDisabled(day)}
              tabIndex={day && !isDayDisabled(day) ? 0 : -1}
              onClick={() => day && !isDayDisabled(day) && selectDate(day)}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                focusRingClasses,
                day &&
                  !isDayDisabled(day) &&
                  "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                isSelected(day) &&
                  !isDayDisabled(day) &&
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                isToday(day) && !isSelected(day) && "ring-1 ring-primary",
                !day && "pointer-events-none opacity-0",
                isDayDisabled(day) && "text-muted-foreground opacity-50 cursor-not-allowed"
              )}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
