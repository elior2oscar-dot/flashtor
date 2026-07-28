alter table public.appointments
  add column if not exists reminder_1h_sent_at timestamptz;

create index if not exists idx_appointments_reminder_1h
  on public.appointments (appointment_time)
  where status = 'booked' and reminder_1h_sent_at is null;
