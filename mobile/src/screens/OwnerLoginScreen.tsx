import React from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';

import { FlashTorLogo } from '../components/FlashTorLogo';
import { supabase } from '../lib/supabase';

type Props = {
  onSignedIn: () => void;
};

export function OwnerLoginScreen({ onSignedIn }: Props) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleAuth() {
    if (!email.trim() || !password) {
      Alert.alert('שגיאה', 'יש למלא אימייל וסיסמה.');
      return;
    }

    setSubmitting(true);

    if (isSignUp) {
      if (!businessName.trim()) {
        Alert.alert('שגיאה', 'יש להזין שם עסק.');
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        Alert.alert('שגיאה', error?.message || 'הרשמה נכשלה.');
        setSubmitting(false);
        return;
      }

      try {
        const slug = businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { data: business, error: bizError } = await supabase
          .from('businesses')
          .insert({
            name: businessName.trim(),
            phone: '0000000000',
            timezone: 'Asia/Jerusalem',
            slug: slug || null,
          })
          .select('id')
          .single();

        if (bizError || !business) {
          throw bizError || new Error('שגיאה ביצירת עסק');
        }

        const { error: memberError } = await supabase.from('business_members').insert({
          user_id: data.user.id,
          business_id: business.id,
          role: 'owner',
        });

        if (memberError) {
          throw memberError;
        }

        const defaultHours = [0, 1, 2, 3, 4, 5].map((day) => ({
          business_id: business.id,
          day_of_week: day,
          opens_at: '09:00',
          closes_at: '18:00',
          is_closed: false,
        }));
        defaultHours.push({
          business_id: business.id,
          day_of_week: 6,
          opens_at: '09:00',
          closes_at: '18:00',
          is_closed: true,
        });

        await supabase.from('business_hours').insert(defaultHours);
        Alert.alert('הצלחה', 'החשבון והעסק נוצרו בהצלחה!');
        onSignedIn();
      } catch (err: any) {
        Alert.alert('שגיאה בהגדרת העסק', err.message || 'ההרשמה הצליחה אך יצירת העסק נכשלה.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('שגיאה', 'התחברות נכשלה. ודא שפרטי החיבור נכונים.');
        setSubmitting(false);
        return;
      }
      onSignedIn();
    }

    setSubmitting(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <FlashTorLogo subtitle={isSignUp ? "רישום בעל עסק חדש" : "אפליקציית ניהול לבעל העסק בלבד"} />
          <Text style={styles.note}>
            הלקוחות לא מורידים אפליקציה. הם מקבלים קישור Web, קובעים תור, ומקבלים תזכורות WhatsApp אוטומטיות.
          </Text>

          {isSignUp && (
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="שם העסק שלך"
              style={styles.input}
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="אימייל"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="סיסמה"
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{isSignUp ? 'הרשמה ופתיחת עסק' : 'התחברות לניהול העסק'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'כבר רשום? לחץ להתחברות' : 'אין לך חשבון? לחץ להרשמה מהירה'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  note: {
    marginTop: 8,
    marginBottom: 16,
    color: '#4b5563',
    textAlign: 'right',
    lineHeight: 22,
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
  button: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  toggle: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
