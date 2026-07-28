import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import { Appointment } from '../types';

type Props = {
  businessId: string;
};

export function AppointmentsScreen({ businessId }: Props) {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchAppointments = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(
        'id, business_id, customer_name, customer_phone, appointment_time, appointment_end_time, status, arrival_confirmed_at'
      )
      .eq('business_id', businessId)
      .eq('status', 'booked')
      .gte('appointment_time', new Date().toISOString())
      .order('appointment_time', { ascending: true });

    if (error) {
      Alert.alert('שגיאה', 'לא ניתן לטעון את התורים כרגע.');
      return;
    }

    setAppointments(data ?? []);
  }, [businessId]);

  React.useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchAppointments();
      setLoading(false);
    })();
  }, [fetchAppointments]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }

  async function cancelAppointment(appointmentId: string) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('נדרשת התחברות של בעל העסק כדי לבטל תור.');
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/cancel-appointment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            appointmentId,
            offerDurationMinutes: 30,
          }),
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'הביטול נכשל.');
      }

      Alert.alert(
        'הצלחה',
        `התור בוטל. נוצרו ${payload.offersCreated ?? 0} הצעות לממתינים ונשלחו ${payload.notificationsQueued ?? 0} התראות.`
      );

      await fetchAppointments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה.';
      Alert.alert('שגיאה', message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>יומן תורים · ניהול</Text>
        <Text style={styles.headerSubtitle}>ביטול תור מפעיל אוטומטית את רשימת ההמתנה ללקוחות ב-Web.</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{item.customer_name}</Text>
                <Text style={styles.customerPhone}>{item.customer_phone}</Text>
                <Text style={styles.timeText}>
                  {new Date(item.appointment_time).toLocaleString('he-IL')}
                </Text>
                {item.arrival_confirmed_at ? (
                  <Text style={styles.confirmedBadge}>הגעה אושרה ב-FlashTor</Text>
                ) : null}
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={() => cancelAppointment(item.id)}>
                <Text style={styles.cancelButtonText}>בטל תור</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyState}>אין תורים פעילים כרגע.</Text>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  customerPhone: {
    marginTop: 4,
    color: '#6b7280',
    textAlign: 'right',
  },
  timeText: {
    marginTop: 8,
    color: '#2563eb',
    fontWeight: '600',
    textAlign: 'right',
  },
  confirmedBadge: {
    marginTop: 6,
    color: '#166534',
    fontWeight: '700',
    textAlign: 'right',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 16,
  },
  cancelButtonText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 36,
    textAlign: 'center',
    color: '#9ca3af',
  },
});
