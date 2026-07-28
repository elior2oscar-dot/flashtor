import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../lib/supabase';

type Props = {
  businessId: string;
};

type Counters = {
  upcoming: number;
  waiting: number;
  notified: number;
  filledFromWaitlist: number;
  messagesSent: number;
  messagesFailed: number;
};

export function MetricsScreen({ businessId }: Props) {
  const [metrics, setMetrics] = React.useState<Counters | null>(null);

  React.useEffect(() => {
    void (async () => {
      const [
        appointmentsResult,
        waitingResult,
        notifiedResult,
        filledResult,
        sentMessagesResult,
        failedMessagesResult,
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('status', 'booked'),
        supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('status', 'waiting'),
        supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('status', 'notified'),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('source', 'waitlist_offer')
          .eq('status', 'booked'),
        supabase
          .from('notification_logs')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('channel', 'whatsapp')
          .eq('status', 'sent'),
        supabase
          .from('notification_logs')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('channel', 'whatsapp')
          .eq('status', 'failed'),
      ]);

      setMetrics({
        upcoming: appointmentsResult.count ?? 0,
        waiting: waitingResult.count ?? 0,
        notified: notifiedResult.count ?? 0,
        filledFromWaitlist: filledResult.count ?? 0,
        messagesSent: sentMessagesResult.count ?? 0,
        messagesFailed: failedMessagesResult.count ?? 0,
      });
    })();
  }, [businessId]);

  if (!metrics) {
    return <ActivityIndicator style={{ marginTop: 48 }} size="large" color="#2563eb" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ביצועים · ניהול</Text>
        <Text style={styles.headerSubtitle}>תמונת מצב על היומן, waitlist ו-WhatsApp.</Text>
      </View>

      <View style={styles.grid}>
        <MetricCard label="תורים פעילים" value={metrics.upcoming} />
        <MetricCard label="ממתינים" value={metrics.waiting} />
        <MetricCard label="הצעות פתוחות" value={metrics.notified} />
        <MetricCard label="תורים שמולאו מהמתנה" value={metrics.filledFromWaitlist} />
        <MetricCard label="הודעות WhatsApp שנשלחו" value={metrics.messagesSent} />
        <MetricCard label="הודעות שנכשלו" value={metrics.messagesFailed} />
      </View>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 12,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563eb',
  },
  label: {
    marginTop: 8,
    color: '#4b5563',
    textAlign: 'center',
  },
});
