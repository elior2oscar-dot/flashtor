import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function FlashTorLogo({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>FT</Text>
      </View>
      <Text style={styles.title}>FlashTor</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  title: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
    textAlign: 'right',
  },
});
