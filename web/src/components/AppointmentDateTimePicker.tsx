'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useMemo, useState } from 'react';

export type TimeSlot = {
  time: string;
  available: boolean;
};

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { time: '09:00', available: false },
  { time: '09:30', available: false },
  { time: '10:00', available: true },
  { time: '10:30', available: true },
  { time: '11:00', available: true },
  { time: '11:30', available: true },
  { time: '12:00', available: false },
  { time: '12:30', available: true },
  { time: '13:00', available: true },
  { time: '13:30', available: true },
  { time: '14:00', available: true },
  { time: '14:30', available: false },
  { time: '15:00', available: false },
  { time: '15:30', available: true },
  { time: '16:00', available: true },
  { time: '16:30', available: true },
  { time: '17:00', available: true },
  { time: '17:30', available: true },
];

type Props = {
  date: Date;
  time: string | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string | null) => void;
  timeSlots?: TimeSlot[];
  disabled?: boolean;
};

export function AppointmentDateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  timeSlots = DEFAULT_TIME_SLOTS,
  disabled = false,
}: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [month, setMonth] = useState<Date>(date);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex max-sm:flex-col">
        <Calendar
          mode="single"
          selected={date}
          month={month}
          onMonthChange={setMonth}
          onSelect={(newDate) => {
            if (newDate && !disabled) {
              onDateChange(newDate);
              onTimeChange(null);
            }
          }}
          className="p-2 sm:pe-5 bg-background"
          disabled={disabled ? true : [{ before: today }]}
          locale={he}
          dir="rtl"
        />
        <div className="relative w-full max-sm:h-52 sm:w-44">
          <div className="absolute inset-0 border-border py-4 max-sm:border-t">
            <ScrollArea className="h-full border-border sm:border-s">
              <div className="space-y-3">
                <div className="flex h-5 shrink-0 items-center px-5">
                  <p className="text-sm font-medium text-foreground">
                    {format(date, 'EEEE, d בMMMM', { locale: he })}
                  </p>
                </div>
                <div className="grid gap-1.5 px-5 max-sm:grid-cols-3 sm:grid-cols-1">
                  {timeSlots.map(({ time: timeSlot, available }) => (
                    <Button
                      key={timeSlot}
                      type="button"
                      variant={time === timeSlot ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => onTimeChange(timeSlot)}
                      disabled={!available || disabled}
                    >
                      {timeSlot}
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
