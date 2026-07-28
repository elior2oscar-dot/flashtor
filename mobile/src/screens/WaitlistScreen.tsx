import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import { WaitlistEntry } from '../types';

type Props = {
  businessId: string;
};

export function WaitlistScreen({ businessId }: Props) {
  const [entries, setEntries] = React.useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('waitlist')
        .select('id, customer_name, customer_phone, desired_date, status, last_notified_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });

      setEntries(data ?? []);
      setLoading(false);
    })();
  }, [businessId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>רשימת המתנה · ניהול</Text>
        <Text style={styles.headerSubtitle}>מעקב אחרי לקוחות שהצטרפו דרך דף ה-Web.</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.customer_name}</Text>
              <Text style={styles.meta}>{item.customer_phone}</Text>
              <Text style={styles.meta}>תאריך רצוי: {item.desired_date}</Text>
              <Text style={styles.status}>סטטוס: {item.status}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyState}>אין ממתינים כרגע.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  meta: {
    marginTop: 4,
    color: '#6b7280',
    textAlign: 'right',
  },
  status: {
    marginTop: 8,
    color: '#2563eb',
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyState: {
    marginTop: 36,
    textAlign: 'center',
    color: '#9ca3af',
  },
});
