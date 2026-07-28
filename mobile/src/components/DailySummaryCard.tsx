import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../lib/supabase';
import { DailySummary } from '../types';

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

export function DailySummaryCard({ businessId }: { businessId: string }) {
  const [summary, setSummary] = React.useState<DailySummary | null>(null);

  const loadSummary = React.useCallback(async () => {
    const date = todayIsoDate();
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;

    const [appointmentsResult, waitingResult, notifiedResult] = await Promise.all([
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'booked')
        .gte('appointment_time', dayStart)
        .lte('appointment_time', dayEnd),
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('desired_date', date)
        .eq('status', 'waiting'),
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('desired_date', date)
        .eq('status', 'notified'),
    ]);

    setSummary({
      appointmentsToday: appointmentsResult.count ?? 0,
      waitingToday: waitingResult.count ?? 0,
      notifiedToday: notifiedResult.count ?? 0,
    });
  }, [businessId]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>סיכום יומי</Text>
        <Text style={styles.subtitle}>היום ב־FlashTor</Text>
      </View>

      {!summary ? (
        <ActivityIndicator size="small" color="#2563eb" />
      ) : (
        <View style={styles.metricsRow}>
          <Metric label="תורים היום" value={summary.appointmentsToday} />
          <Metric label="ממתינים" value={summary.waitingToday} />
          <Metric label="הצעות פתוחות" value={summary.notifiedToday} />
        </View>
      )}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
  },
  headerRow: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
  },
  metricsRow: {
    marginTop: 14,
    flexDirection: 'row-reverse',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563eb',
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
  },
});
