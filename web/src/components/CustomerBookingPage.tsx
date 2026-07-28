'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FlashTorLogo } from './FlashTorLogo';
import { isUuid } from '../lib/identifiers';
import { dayBoundsIso } from '../lib/scheduling';
import { normalizePhone } from '../lib/phone';
import { supabase, supabaseConfigError } from '../lib/supabase';

type Business = {
  id: string;
  name: string;
  phone: string;
  whatsapp_phone: string | null;
  timezone: string;
};

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_ils: number | null;
  description: string | null;
};

type Slot = {
  id: string;
  business_id: string;
  service_id: string | null;
  slot_start: string;
  slot_end: string;
  is_available: boolean;
};

type Props = {
  businessIdentifier: string;
};

const cardStyle: React.CSSProperties = {
  maxWidth: 520,
  margin: '40px auto',
  padding: 24,
  background: '#ffffff',
  borderRadius: 20,
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
  direction: 'rtl',
  fontFamily: 'system-ui, sans-serif',
};

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 15,
  width: '100%',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  padding: 14,
  backgroundColor: '#2563eb',
  color: '#ffffff',
  borderRadius: 10,
  border: 'none',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#e5e7eb',
  color: '#111827',
};

function formatSlotLabel(slotStart: string) {
  return new Date(slotStart).toLocaleString('he-IL', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CustomerBookingPage({ businessIdentifier }: Props) {
  const functionsBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
  const [resolvedBusinessId, setResolvedBusinessId] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [closureDates, setClosureDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadInitialData();
  }, [businessIdentifier]);

  useEffect(() => {
    if (!selectedDate || !resolvedBusinessId) {
      setSlots([]);
      setSelectedSlotId('');
      return;
    }

    void loadSlots(selectedDate, selectedServiceId || null);
  }, [selectedDate, selectedServiceId, resolvedBusinessId]);

  async function loadInitialData() {
    setLoading(true);
    setStatusMessage('');

    if (supabaseConfigError) {
      setStatusMessage(
        'חיבור ל-Supabase לא מוגדר. מלאו את web/.env.local (URL + Publishable key) והפעילו מחדש את npm run dev.'
      );
      setLoading(false);
      return;
    }

    let businessQuery = supabase
      .from('businesses')
      .select('id, name, phone, whatsapp_phone, timezone')
      .eq('is_active', true);

    businessQuery = isUuid(businessIdentifier)
      ? businessQuery.eq('id', businessIdentifier)
      : businessQuery.eq('slug', businessIdentifier);

    const { data: businessData, error: businessError } = await businessQuery.single();

    if (businessError || !businessData) {
      const hint =
        businessError?.code === 'PGRST116'
          ? 'לא נמצא עסק פעיל בקישור הזה. בדקו את ה-slug או פנו לבעל העסק.'
          : 'לא ניתן לטעון את פרטי העסק כרגע.';
      setStatusMessage(hint);
      setLoading(false);
      return;
    }

    setResolvedBusinessId(businessData.id);

    const { data: serviceData, error: servicesError } = await supabase
      .from('services')
      .select('id, name, duration_minutes, price_ils, description')
      .eq('business_id', businessData.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (servicesError) {
      setStatusMessage('לא ניתן לטעון את פרטי העסק כרגע.');
      setLoading(false);
      return;
    }

    setBusiness(businessData);
    setServices(serviceData ?? []);
    setSelectedServiceId(serviceData?.[0]?.id ?? '');

    const { data: closures } = await supabase
      .from('business_closure_dates')
      .select('closure_date')
      .eq('business_id', businessData.id);

    setClosureDates(new Set((closures ?? []).map((c) => c.closure_date as string)));
    setLoading(false);
  }

  async function loadSlots(dateValue: string, serviceId: string | null) {
    if (!resolvedBusinessId) {
      return;
    }

    const { from, to } = dayBoundsIso(dateValue, 3);

    let query = supabase
      .from('appointment_slots')
      .select('id, business_id, service_id, slot_start, slot_end, is_available')
      .eq('business_id', resolvedBusinessId)
      .eq('is_available', true)
      .gte('slot_start', from)
      .lte('slot_start', to)
      .order('slot_start', { ascending: true });

    if (serviceId) {
      query = query.or(`service_id.eq.${serviceId},service_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      setStatusMessage('לא ניתן לטעון תורים פנויים לתאריך זה.');
      setSlots([]);
      setSelectedSlotId('');
      return;
    }

    setSlots(data ?? []);
    setSelectedSlotId(data?.[0]?.id ?? '');
  }

  const slotOptions = useMemo(
    () =>
      slots.map((slot) => ({
        value: slot.id,
        label: formatSlotLabel(slot.slot_start),
      })),
    [slots]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatusMessage('');

    try {
      if (!resolvedBusinessId) {
        throw new Error('העסק לא נטען.');
      }

      if (joinWaitlist || slotOptions.length === 0) {
        if (services.length > 0 && !selectedServiceId) {
          throw new Error('יש לבחור טיפול.');
        }
        const { data: blocked } = await supabase.rpc('is_contact_blocked', {
          p_business_id: resolvedBusinessId,
          p_phone: phone,
          p_email: email.trim() || null,
        });
        if (blocked) {
          throw new Error('לא ניתן להירשם — צרו קשר עם העסק.');
        }

        const { error } = await supabase.from('waitlist').insert({
          business_id: resolvedBusinessId,
          service_id: selectedServiceId || null,
          customer_name: name,
          customer_phone: phone,
          desired_date: selectedDate,
          status: 'waiting',
        });

        if (error) {
          throw error;
        }

        setStatusMessage('נרשמת בהצלחה לרשימת ההמתנה. נעדכן אותך כשיתפנה תור.');
      } else {
        if (services.length > 0 && !selectedServiceId) {
          throw new Error('יש לבחור טיפול.');
        }
        const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
        if (!selectedSlot) {
          throw new Error('יש לבחור תור פנוי.');
        }

        const response = await fetch(`${functionsBaseUrl}/create-booking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
          },
          body: JSON.stringify({
            businessId: resolvedBusinessId,
            serviceId: selectedServiceId || null,
            slotId: selectedSlot.id,
            customerName: name,
            customerPhone: normalizePhone(phone) || phone,
            customerEmail: email.trim() || null,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'לא ניתן לקבוע את התור כרגע.');
        }

        setStatusMessage('התור נקבע בהצלחה.');
      }

      setName('');
      setPhone('');
      setSelectedSlotId('');
      setJoinWaitlist(false);
      if (selectedDate) {
        await loadSlots(selectedDate, selectedServiceId || null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה.';
      setStatusMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  function handleDayClick(day: number) {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (closureDates.has(formattedDate)) {
      setStatusMessage('תאריך זה סגור להזמנות.');
      return;
    }
    setStatusMessage('');
    setSelectedDate(formattedDate);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '24px 16px' }}>
      <div style={cardStyle}>
        <FlashTorLogo
          subtitle={`${business?.name ?? 'FlashTor'} · קביעת תור מהירה (ללא התחברות)`}
        />

        {loading ? (
          <p style={{ textAlign: 'center', color: '#4b5563' }}>טוען נתונים...</p>
        ) : !resolvedBusinessId ? (
          <p style={{ textAlign: 'center', color: '#b91c1c' }}>
            {statusMessage || 'לא ניתן לטעון את פרטי העסק. בדקו את הקישור או פנו לבעל העסק.'}
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <label style={{ fontWeight: 600, color: '#374151' }}>בחר טיפול:</label>
            {services.length === 0 ? (
              <p style={{ color: '#b91c1c', fontSize: 14, margin: 0 }}>
                אין טיפולים פעילים כרגע. בעל העסק צריך להגדיר מחירון בפורטל.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {services.map((service) => {
                  const selected = selectedServiceId === service.id;
                  const priceLabel =
                    service.price_ils != null ? `₪${Number(service.price_ils).toFixed(0)}` : null;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedServiceId(service.id)}
                      style={{
                        textAlign: 'right',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: selected ? '2px solid #2563eb' : '1px solid #d1d5db',
                        background: selected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'grid',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#111827' }}>{service.name}</span>
                      {service.description ? (
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{service.description}</span>
                      ) : null}
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                        {service.duration_minutes} דק׳
                        {priceLabel ? ` · ${priceLabel}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <input type="hidden" value={selectedServiceId} required={services.length > 0} />

            <label style={{ fontWeight: 600, color: '#374151', marginTop: 8 }}>בחר תאריך:</label>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, direction: 'ltr' }}>
                <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '4px 10px' }}>&lt;</button>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{monthNames[currentMonth]} {currentYear}</span>
                <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '4px 10px' }}>&gt;</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', fontWeight: 600, fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                <div>א</div>
                <div>ב</div>
                <div>ג</div>
                <div>ד</div>
                <div>ה</div>
                <div>ו</div>
                <div>ש</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} />;
                  }

                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      style={{
                        padding: '8px 0',
                        borderRadius: '50%',
                        border: 'none',
                        background: isSelected ? '#2563eb' : 'transparent',
                        color: isSelected ? '#ffffff' : '#1e293b',
                        fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: 14,
                        aspectRatio: '1',
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div style={{ marginTop: 8 }}>
                <label style={{ fontWeight: 600, color: '#374151' }}>בחר שעה פנויה:</label>

                {slotOptions.length > 0 && !joinWaitlist ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                    {slots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      const timeLabel = new Date(slot.slot_start).toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          style={{
                            padding: '10px 4px',
                            borderRadius: 8,
                            border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            color: isSelected ? '#2563eb' : '#334155',
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: 14,
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          {timeLabel}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 12,
                      background: '#eff6ff',
                      borderRadius: 10,
                      color: '#1d4ed8',
                      fontSize: 14,
                      marginTop: 8,
                    }}
                  >
                    אין כרגע תור זמין לתאריך זה. באפשרותך להצטרף לרשימת ההמתנה ונשלח לך הודעה אם יתפנה מקום.
                  </div>
                )}
              </div>
            )}

            <input
              type="text"
              placeholder="שם מלא"
              value={name}
              onChange={(event) => setName(event.target.value)}
              style={{ ...inputStyle, marginTop: 8 }}
              required
            />

            <input
              type="tel"
              placeholder="טלפון נייד"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              style={inputStyle}
              required
            />

            <input
              type="email"
              placeholder="אימייל (אופציונלי)"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
            />

            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#374151', cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={joinWaitlist}
                onChange={(event) => setJoinWaitlist(event.target.checked)}
              />
              להיכנס לרשימת ההמתנה במקום לקבוע תור
            </label>

            <button type="submit" disabled={submitting} style={{ ...buttonStyle, marginTop: 8 }}>
              {submitting
                ? 'שולח...'
                : joinWaitlist || slotOptions.length === 0
                  ? 'הירשם לרשימת ההמתנה'
                  : 'אשר וקבע תור'}
            </button>

            {slotOptions.length > 0 && (
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => setJoinWaitlist((current) => !current)}
              >
                {joinWaitlist ? 'חזור לקביעת תור רגיל' : 'אין לי גמישות, הכנס אותי לרשימת המתנה'}
              </button>
            )}

            {statusMessage ? (
              <p style={{ margin: 0, textAlign: 'center', color: '#111827', fontWeight: '600' }}>{statusMessage}</p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
