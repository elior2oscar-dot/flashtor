'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { addDays, isSameCalendarDay, startOfWeek, toDateInputValue } from '@/lib/scheduling';

export type OwnerAppointment = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  appointment_time: string;
  status: string;
  arrival_confirmed_at: string | null;
  staff_id: string | null;
};

type OwnerCalendarPanelProps = {
  appointments: OwnerAppointment[];
  closedDates?: string[];
  viewMode: 'day' | 'week';
  viewDate: Date;
  onViewModeChange: (mode: 'day' | 'week') => void;
  onViewDateChange: (date: Date) => void;
  onCancel: (id: string) => void;
  onBlockContact: (appointment: OwnerAppointment) => void;
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

export function OwnerCalendarPanel({
  appointments,
  closedDates = [],
  viewMode,
  viewDate,
  onViewModeChange,
  onViewDateChange,
  onCancel,
  onBlockContact,
}: OwnerCalendarPanelProps) {
  const closedSet = useMemo(() => new Set(closedDates), [closedDates]);
  const weekStart = useMemo(() => startOfWeek(viewDate), [viewDate]);
  const days = useMemo(() => {
    if (viewMode === 'day') return [viewDate];
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [viewMode, viewDate, weekStart]);

  function appointmentsForDay(day: Date) {
    return appointments.filter((a) => isSameCalendarDay(new Date(a.appointment_time), day));
  }

  function isClosed(day: Date) {
    return closedSet.has(toDateInputValue(day));
  }

  function shiftNav(delta: number) {
    onViewDateChange(addDays(viewDate, viewMode === 'day' ? delta : delta * 7));
  }

  const viewDayClosed = isClosed(viewDate);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'day' ? 'default' : 'outline'}
            onClick={() => onViewModeChange('day')}
          >
            יומי
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => onViewModeChange('week')}
          >
            שבועי
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="icon" variant="outline" onClick={() => shiftNav(-1)}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="min-w-[10rem] text-center text-sm font-medium">
            {viewMode === 'day'
              ? viewDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
              : `${weekStart.toLocaleDateString('he-IL')} – ${addDays(weekStart, 6).toLocaleDateString('he-IL')}`}
          </span>
          <Button type="button" size="icon" variant="outline" onClick={() => shiftNav(1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onViewDateChange(new Date())}>
            היום
          </Button>
        </div>
      </div>

      {viewMode === 'week' ? (
        <div className="grid gap-2 overflow-x-auto md:grid-cols-7">
          {days.map((day) => {
            const closed = isClosed(day);
            return (
              <div
                key={toDateInputValue(day)}
                className={`min-w-[120px] rounded-xl border p-2 ${
                  closed ? 'border-amber-300 bg-amber-50' : 'border-border bg-card'
                }`}
              >
                <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">
                  {day.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                </p>
                {closed ? (
                  <p className="rounded-md bg-amber-100 px-1 py-2 text-center text-[11px] font-medium text-amber-900">
                    יום סגור · חסום
                  </p>
                ) : (
                  <div className="space-y-2">
                    {appointmentsForDay(day).length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground">—</p>
                    ) : (
                      appointmentsForDay(day).map((a) => (
                        <AppointmentChip
                          key={a.id}
                          appointment={a}
                          onCancel={onCancel}
                          onBlockContact={onBlockContact}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          {viewDayClosed ? (
            <p className="p-8 text-center text-amber-800">
              תאריך זה סגור להזמנות (הוגדר בהגדרות).
            </p>
          ) : (
            <div className="grid grid-cols-[3rem_1fr]">
              {HOURS.map((hour) => {
                const hourAppts = appointmentsForDay(viewDate).filter((a) => {
                  const d = new Date(a.appointment_time);
                  return d.getHours() === hour;
                });
                return (
                  <div key={hour} className="contents">
                    <div className="border-t border-border px-2 py-3 text-xs text-muted-foreground">{hour}:00</div>
                    <div className="space-y-2 border-t border-border p-2">
                      {hourAppts.map((a) => (
                        <AppointmentChip
                          key={a.id}
                          appointment={a}
                          onCancel={onCancel}
                          onBlockContact={onBlockContact}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === 'day' && !viewDayClosed && appointmentsForDay(viewDate).length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">אין תורים ביום זה.</p>
      ) : null}
    </div>
  );
}

function AppointmentChip({
  appointment: a,
  onCancel,
  onBlockContact,
}: {
  appointment: OwnerAppointment;
  onCancel: (id: string) => void;
  onBlockContact: (appointment: OwnerAppointment) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-2 text-xs">
      <p className="font-semibold">{a.customer_name}</p>
      <p className="text-muted-foreground">{a.customer_phone}</p>
      <p>
        {new Date(a.appointment_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => onCancel(a.id)}>
          ביטול
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="h-7 text-[10px]"
          onClick={() => onBlockContact(a)}
        >
          חסום לקוח
        </Button>
      </div>
    </div>
  );
}
