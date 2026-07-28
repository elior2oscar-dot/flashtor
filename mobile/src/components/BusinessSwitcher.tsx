import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { OwnerBusiness } from '../lib/ownerBusinesses';

type Props = {
  businesses: OwnerBusiness[];
  selectedBusinessId: string | null;
  onSelect: (businessId: string) => void;
  loading?: boolean;
};

export function BusinessSwitcher({ businesses, selectedBusinessId, onSelect, loading }: Props) {
  if (loading) {
    return <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 8 }} />;
  }

  if (businesses.length <= 1) {
    const business = businesses[0];
    if (!business) {
      return <Text style={styles.empty}>אין עסק מקושר לחשבון. צור עסק ב-Supabase והוסף membership.</Text>;
    }

    return (
      <Text style={styles.singleBusiness}>
        {business.name}
        {business.slug ? ` · /book/${business.slug}` : ''}
      </Text>
    );
  }

  return (
    <View style={styles.row}>
      {businesses.map((business) => {
        const isActive = business.id === selectedBusinessId;
        return (
          <TouchableOpacity
            key={business.id}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(business.id)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{business.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    color: '#374151',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  singleBusiness: {
    marginTop: 8,
    textAlign: 'right',
    color: '#4b5563',
    fontWeight: '600',
  },
  empty: {
    marginTop: 8,
    textAlign: 'right',
    color: '#dc2626',
  },
});
