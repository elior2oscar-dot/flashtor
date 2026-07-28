import React from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import { BusinessHour, BusinessProfile } from '../types';
import { generateSlotsForNextNDays } from '../lib/slotGenerator';

const weekDays = [
  { key: 0, label: 'ראשון' },
  { key: 1, label: 'שני' },
  { key: 2, label: 'שלישי' },
  { key: 3, label: 'רביעי' },
  { key: 4, label: 'חמישי' },
  { key: 5, label: 'שישי' },
  { key: 6, label: 'שבת' },
];

const defaultHours = (): BusinessHour[] =>
  weekDays.map((day) => ({
    day_of_week: day.key,
    opens_at: '09:00',
    closes_at: '18:00',
    is_closed: day.key === 6,
  }));

export function SettingsScreen({ businessId }: { businessId: string }) {
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [hours, setHours] = React.useState<BusinessHour[]>(defaultHours());
  const [services, setServices] = React.useState<any[]>([]);
  const [newServiceName, setNewServiceName] = React.useState('');
  const [newServiceDuration, setNewServiceDuration] = React.useState('30');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void loadSettings();
  }, [businessId]);

  async function loadSettings() {
    setLoading(true);

    const [
      { data: businessData, error: businessError },
      { data: hoursData, error: hoursError },
      { data: servicesData, error: servicesError }
    ] = await Promise.all([
      supabase.from('businesses').select('id, name, phone, timezone, slug').eq('id', businessId).single(),
      supabase
        .from('business_hours')
        .select('id, business_id, day_of_week, opens_at, closes_at, is_closed')
        .eq('business_id', businessId)
        .order('day_of_week', { ascending: true }),
      supabase
        .from('services')
        .select('id, name, duration_minutes, is_active')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name', { ascending: true }),
    ]);

    if (businessError || !businessData) {
      Alert.alert('שגיאה', 'לא ניתן לטעון את פרטי העסק.');
      setLoading(false);
      return;
    }

    setProfile(businessData);

    if (hoursError || !hoursData || hoursData.length === 0) {
      setHours(defaultHours());
    } else {
      const byDay = new Map(hoursData.map((entry) => [entry.day_of_week, entry]));
      setHours(
        weekDays.map((day) => ({
          day_of_week: day.key,
          opens_at: byDay.get(day.key)?.opens_at ?? '09:00',
          closes_at: byDay.get(day.key)?.closes_at ?? '18:00',
          is_closed: byDay.get(day.key)?.is_closed ?? false,
        }))
      );
    }

    if (!servicesError && servicesData) {
      setServices(servicesData);
    }

    setLoading(false);
  }

  function updateHour(dayOfWeek: number, field: keyof BusinessHour, value: string | boolean) {
    setHours((current) =>
      current.map((entry) =>
        entry.day_of_week === dayOfWeek ? { ...entry, [field]: value } : entry
      )
    );
  }

  function addServiceLocally() {
    if (!newServiceName.trim()) {
      Alert.alert('שגיאה', 'יש להזין שם שירות.');
      return;
    }
    const duration = parseInt(newServiceDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('שגיאה', 'משך השירות חייב להיות מספר דקות תקין.');
      return;
    }
    setServices((current) => [
      ...current,
      { name: newServiceName.trim(), duration_minutes: duration, is_active: true },
    ]);
    setNewServiceName('');
    setNewServiceDuration('30');
  }

  function removeServiceLocally(index: number) {
    setServices((current) =>
      current.map((srv, idx) => (idx === index ? { ...srv, is_active: false } : srv))
    );
  }

  function updateServiceLocally(index: number, field: string, value: string) {
    setServices((current) =>
      current.map((srv, idx) => {
        if (idx !== index) return srv;
        if (field === 'duration_minutes') {
          return { ...srv, duration_minutes: parseInt(value, 10) || 0 };
        }
        return { ...srv, [field]: value };
      })
    );
  }

  async function handleSave() {
    if (!profile) {
      return;
    }

    setSaving(true);

    try {
      const { error: businessError } = await supabase
        .from('businesses')
        .update({
          name: profile.name,
          phone: profile.phone,
          timezone: profile.timezone,
          slug: profile.slug,
        })
        .eq('id', businessId);

      if (businessError) {
        throw businessError;
      }

      const { error: hoursUpsertError } = await supabase.from('business_hours').upsert(
        hours.map((entry) => ({
          business_id: businessId,
          day_of_week: entry.day_of_week,
          opens_at: entry.opens_at,
          closes_at: entry.closes_at,
          is_closed: entry.is_closed,
        })),
        { onConflict: 'business_id,day_of_week' }
      );

      if (hoursUpsertError) {
        throw hoursUpsertError;
      }

      // Save services (inserting new, updating existing)
      const servicesToInsert = services.filter((s) => !s.id && s.is_active);
      const servicesToUpdate = services.filter((s) => s.id);

      if (servicesToInsert.length > 0) {
        const { error: insertError } = await supabase.from('services').insert(
          servicesToInsert.map((s) => ({
            business_id: businessId,
            name: s.name,
            duration_minutes: s.duration_minutes,
            is_active: true,
          }))
        );
        if (insertError) throw insertError;
      }

      for (const s of servicesToUpdate) {
        const { error: updateError } = await supabase
          .from('services')
          .update({
            name: s.name,
            duration_minutes: s.duration_minutes,
            is_active: s.is_active,
          })
          .eq('id', s.id);
        if (updateError) throw updateError;
      }

      Alert.alert('נשמר', 'הגדרות העסק והשירותים עודכנו בהצלחה.');
      await loadSettings();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'לא ניתן היה לשמור את ההגדרות.';
      Alert.alert('שגיאה', message);
    } finally {
      setSaving(false);
    }
  }

  const [generatingSlots, setGeneratingSlots] = React.useState(false);

  async function handleGenerateSlots() {
    setGeneratingSlots(true);
    try {
      const count = await generateSlotsForNextNDays(businessId, 7);
      Alert.alert('הצלחה', `נוצרו בהצלחה ${count} תורים פנויים לשבוע הקרוב!`);
    } catch (err: any) {
      Alert.alert('שגיאה', err.message || 'יצירת התורים נכשלה.');
    } finally {
      setGeneratingSlots(false);
    }
  }

  if (loading || !profile) {
    return <ActivityIndicator style={{ marginTop: 48 }} size="large" color="#2563eb" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>הגדרות עסק</Text>
          <Text style={styles.headerSubtitle}>פרטי העסק, שירותים, slug לקישור Web ללקוחות, ושעות פעילות.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטי העסק</Text>
          <TextInput
            value={profile.name}
            onChangeText={(value) => setProfile((current) => (current ? { ...current, name: value } : current))}
            placeholder="שם העסק"
            style={styles.input}
          />
          <TextInput
            value={profile.phone}
            onChangeText={(value) => setProfile((current) => (current ? { ...current, phone: value } : current))}
            placeholder="מספר טלפון"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            value={profile.slug ?? ''}
            onChangeText={(value) =>
              setProfile((current) => (current ? { ...current, slug: value.trim() } : current))
            }
            placeholder="slug לקישור הזמנה (למשל my-salon)"
            autoCapitalize="none"
            style={styles.input}
          />
          <Text style={styles.hint}>
            קישור ציבורי: /book/{profile.slug || profile.id}
          </Text>
          <TextInput
            value={profile.timezone}
            onChangeText={(value) => setProfile((current) => (current ? { ...current, timezone: value } : current))}
            placeholder="Timezone"
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>שירותי העסק</Text>
          {services
            .filter((srv) => srv.is_active)
            .map((srv, idx) => (
              <View key={srv.id || idx} style={styles.dayCard}>
                <TextInput
                  value={srv.name}
                  onChangeText={(val) => updateServiceLocally(idx, 'name', val)}
                  placeholder="שם השירות"
                  style={styles.input}
                />
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                  <TextInput
                    value={String(srv.duration_minutes)}
                    onChangeText={(val) => updateServiceLocally(idx, 'duration_minutes', val)}
                    placeholder="משך דקות"
                    keyboardType="number-pad"
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  />
                  <TouchableOpacity
                    onPress={() => removeServiceLocally(idx)}
                    style={{ backgroundColor: '#fee2e2', padding: 12, borderRadius: 12 }}
                  >
                    <Text style={{ color: '#dc2626', fontWeight: '700' }}>מחק</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>הוספת שירות חדש</Text>
          <TextInput
            value={newServiceName}
            onChangeText={setNewServiceName}
            placeholder="שם השירות החדש"
            style={styles.input}
          />
          <TextInput
            value={newServiceDuration}
            onChangeText={setNewServiceDuration}
            placeholder="משך בדקות (למשל 30)"
            keyboardType="number-pad"
            style={styles.input}
          />
          <TouchableOpacity
            onPress={addServiceLocally}
            style={{ backgroundColor: '#e5e7eb', padding: 12, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#374151', fontWeight: '700' }}>הוסף שירות לרשימה</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>שעות פעילות</Text>
          {hours.map((entry) => {
            const day = weekDays.find((item) => item.key === entry.day_of_week);
            return (
              <View key={entry.day_of_week} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayLabel}>{day?.label}</Text>
                  <Switch
                    value={!entry.is_closed}
                    onValueChange={(value) => updateHour(entry.day_of_week, 'is_closed', !value)}
                  />
                </View>

                <View style={styles.dayInputs}>
                  <TextInput
                    value={entry.opens_at}
                    onChangeText={(value) => updateHour(entry.day_of_week, 'opens_at', value)}
                    placeholder="09:00"
                    editable={!entry.is_closed}
                    style={[styles.input, styles.timeInput, entry.is_closed && styles.disabledInput]}
                  />
                  <TextInput
                    value={entry.closes_at}
                    onChangeText={(value) => updateHour(entry.day_of_week, 'closes_at', value)}
                    placeholder="18:00"
                    editable={!entry.is_closed}
                    style={[styles.input, styles.timeInput, entry.is_closed && styles.disabledInput]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.section, { gap: 10 }]}>
          <Text style={styles.sectionTitle}>פתיחת תורים להזמנה</Text>
          <Text style={styles.hint}>
            לחץ על הכפתור כדי לייצר תורים פנויים באופן אוטומטי לשבוע הקרוב, על בסיס שעות הפעילות והשירותים שהגדרת למעלה.
          </Text>
          <TouchableOpacity
            onPress={handleGenerateSlots}
            disabled={generatingSlots}
            style={{ backgroundColor: '#10b981', padding: 14, borderRadius: 14, alignItems: 'center' }}
          >
            {generatingSlots ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>ייצר תורים פנויים לשבוע הקרוב</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{saving ? 'שומר...' : 'שמור הגדרות'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  headerSubtitle: {
    marginTop: 6,
    color: '#6b7280',
    textAlign: 'right',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 12,
  },
  hint: {
    marginBottom: 10,
    color: '#6b7280',
    textAlign: 'right',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    textAlign: 'right',
    backgroundColor: '#ffffff',
  },
  dayCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dayInputs: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
