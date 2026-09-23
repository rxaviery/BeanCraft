// Login screen. On success the auth guard in _layout.tsx swaps to the app.
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { errorMessage, fieldErrors } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { colors, fonts } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    // Same rules as login.php.
    const found: Record<string, string> = {};
    if (!email.trim()) found.email = 'Email is required.';
    if (!password) found.password = 'Password is required.';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setErrors(fieldErrors(error));
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see your stash, tasting notes and bag levels."
      footer={
        <Text style={styles.footerText}>
          New to BeanCraft?{' '}
          <Link href="/register" style={styles.link}>
            Create an account
          </Link>
        </Text>
      }
    >
      <TextField
        label="Email address"
        icon="email-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <View style={styles.passwordBlock}>
        <TextField
          label="Password"
          icon="lock-outline"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Pressable onPress={() => toast('Password reset is coming soon.')} hitSlop={8} style={styles.forgot}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      </View>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Button title="Sign In" icon="arrow-right" loading={submitting} onPress={submit} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  passwordBlock: { gap: 8 },
  forgot: { alignSelf: 'flex-end' },
  link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  footerText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  formError: { fontFamily: fonts.semibold, fontSize: 13, color: colors.danger, textAlign: 'center' },
});
