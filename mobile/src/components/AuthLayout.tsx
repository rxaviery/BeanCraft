// Shared look for Login and Register: logo on top, a white card with the
// form, and a footer link. Scrolls when the keyboard is open.
import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from './Card';
import { colors, fonts, spacing, type } from '@/theme/tokens';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Image source={require('../../assets/logo.jpg')} style={styles.logo} />
          <Text style={styles.appName}>BeanCraft</Text>
          <Text style={styles.tagline}>Your coffee stash, organized</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.heading}>
            <Text style={type.heading}>{title}</Text>
            <Text style={type.body}>{subtitle}</Text>
          </View>
          {children}
        </Card>

        <View style={styles.footer}>{footer}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.xl },
  brand: { alignItems: 'center', gap: 4 },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: spacing.sm },
  appName: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -0.8, color: colors.text },
  tagline: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  card: { padding: spacing.xl, gap: spacing.lg, width: '100%', maxWidth: 440, alignSelf: 'center' },
  heading: { gap: 4 },
  footer: { alignItems: 'center' },
});
