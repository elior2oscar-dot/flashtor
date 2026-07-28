export type Appointment = {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  appointment_time: string;
  appointment_end_time: string | null;
  status: 'booked' | 'cancelled' | 'completed' | 'no_show';
  arrival_confirmed_at?: string | null;
};

export type WaitlistEntry = {
  id: string;
  customer_name: string;
  customer_phone: string;
  desired_date: string;
  status: 'waiting' | 'notified' | 'booked' | 'expired' | 'cancelled';
  last_notified_at: string | null;
};

export type NotificationMetric = {
  label: string;
  value: number;
};

export type BusinessProfile = {
  id: string;
  name: string;
  phone: string;
  timezone: string;
  slug: string | null;
};

export type BusinessHour = {
  id?: string;
  business_id?: string;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
};

export type DailySummary = {
  appointmentsToday: number;
  waitingToday: number;
  notifiedToday: number;
};
