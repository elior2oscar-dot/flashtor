import React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  slug: string | null;
  businessId: string;
};

const bookingBaseUrl = process.env.EXPO_PUBLIC_BOOKING_BASE_URL ?? 'https://YOUR_PUBLIC_WEB_URL';

export function CustomerBookingLinkCard({ slug, businessId }: Props) {
  const path = slug && slug.length > 0 ? slug : businessId;
  const fullUrl = `${bookingBaseUrl.replace(/\/$/, '')}/book/${path}`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>קישור ללקוחות (Web בלבד)</Text>
      <Text style={styles.subtitle}>
        שלחו ללקוחות את הקישור הזה. הם לא צריכים אפליקציה או התחברות.
      </Text>
      <Text selectable style={styles.url}>
        {fullUrl}
      </Text>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => {
          void Share.share({ message: fullUrl, title: 'קישור לקביעת תור' });
        }}
      >
        <Text style={styles.shareButtonText}>שיתוף קישור ללקוח</Text>
      </TouchableOpacity>
      <Text style={styles.footer}>לאחר קביעת תור, FlashTor שולחת תזכורות WhatsApp: 24 שעות, 2 שעות ושעה
        לפני.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  subtitle: {
    marginTop: 6,
    color: '#4b5563',
    textAlign: 'right',
    lineHeight: 20,
  },
  url: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    color: '#1d4ed8',
    textAlign: 'left',
  },
  shareButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'right',
  },
});
