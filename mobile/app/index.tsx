import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BusinessSwitcher } from '../src/components/BusinessSwitcher';
import { CustomerBookingLinkCard } from '../src/components/CustomerBookingLinkCard';
import { DailySummaryCard } from '../src/components/DailySummaryCard';
import { FlashTorLogo } from '../src/components/FlashTorLogo';
import { loadOwnerBusinesses } from '../src/lib/ownerBusinesses';
import { supabase } from '../src/lib/supabase';
import { AppointmentsScreen } from '../src/screens/AppointmentsScreen';
import { MetricsScreen } from '../src/screens/MetricsScreen';
import { OwnerLoginScreen } from '../src/screens/OwnerLoginScreen';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { WaitlistScreen } from '../src/screens/WaitlistScreen';

type TabKey = 'appointments' | 'waitlist' | 'metrics' | 'settings';

export default function HomeScreen() {
  const [sessionReady, setSessionReady] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabKey>('appointments');
  const [businesses, setBusinesses] = React.useState<Awaited<ReturnType<typeof loadOwnerBusinesses>>>([]);
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = React.useState(false);

  const refreshBusinesses = React.useCallback(async () => {
    setLoadingBusinesses(true);
    try {
      const loaded = await loadOwnerBusinesses();
      setBusinesses(loaded);
      setSelectedBusinessId((current) => current ?? loaded[0]?.id ?? null);
    } finally {
      setLoadingBusinesses(false);
    }
  }, []);

  React.useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(Boolean(session));
      setSessionReady(true);
      if (session) {
        await refreshBusinesses();
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      if (session) {
        void refreshBusinesses();
      } else {
        setBusinesses([]);
        setSelectedBusinessId(null);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [refreshBusinesses]);

  if (!sessionReady) {
    return <ActivityIndicator style={{ marginTop: 48 }} size="large" color="#2563eb" />;
  }

  if (!isAuthenticated) {
    return <OwnerLoginScreen onSignedIn={() => setIsAuthenticated(true)} />;
  }

  const activeBusiness = businesses.find((business) => business.id === selectedBusinessId) ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <FlashTorLogo subtitle="ניהול העסק · FlashTor Owner" />
        <Text style={styles.badge}>בעל עסק בלבד</Text>
        <BusinessSwitcher
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onSelect={setSelectedBusinessId}
          loading={loadingBusinesses}
        />
      </View>

      {activeBusiness ? (
        <View style={styles.linkWrapper}>
          <CustomerBookingLinkCard slug={activeBusiness.slug} businessId={activeBusiness.id} />
        </View>
      ) : null}

      {selectedBusinessId ? <DailySummaryCard businessId={selectedBusinessId} /> : null}

      <View style={styles.tabs}>
        <TabButton label="יומן תורים" isActive={activeTab === 'appointments'} onPress={() => setActiveTab('appointments')} />
        <TabButton label="רשימת המתנה" isActive={activeTab === 'waitlist'} onPress={() => setActiveTab('waitlist')} />
        <TabButton label="ביצועים" isActive={activeTab === 'metrics'} onPress={() => setActiveTab('metrics')} />
        <TabButton label="הגדרות עסק" isActive={activeTab === 'settings'} onPress={() => setActiveTab('settings')} />
      </View>

      <View style={styles.content}>
        {selectedBusinessId && activeTab === 'appointments' ? (
          <AppointmentsScreen businessId={selectedBusinessId} />
        ) : null}
        {selectedBusinessId && activeTab === 'waitlist' ? <WaitlistScreen businessId={selectedBusinessId} /> : null}
        {selectedBusinessId && activeTab === 'metrics' ? <MetricsScreen businessId={selectedBusinessId} /> : null}
        {selectedBusinessId && activeTab === 'settings' ? <SettingsScreen businessId={selectedBusinessId} /> : null}
        {!selectedBusinessId && !loadingBusinesses ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>אין עסק מקושר לחשבון בעל העסק.</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => {
          void supabase.auth.signOut();
        }}
      >
        <Text style={styles.signOutText}>יציאה</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.tab, isActive && styles.activeTab]} onPress={onPress}>
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  badge: {
    marginTop: 6,
    alignSelf: 'flex-end',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '600',
  },
  linkWrapper: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  tabs: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#f9fafb',
  },
  tab: {
    minWidth: '47%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    color: '#374151',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    padding: 24,
  },
  emptyText: {
    textAlign: 'right',
    color: '#6b7280',
  },
  signOutButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  signOutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
